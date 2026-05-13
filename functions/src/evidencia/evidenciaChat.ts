// ══════════════════════════════════════════════════════════════════════
// EvidenciaIA · Cloud Function `evidenciaChat`
// ══════════════════════════════════════════════════════════════════════
// Permite al usuario hacer preguntas de seguimiento sobre una consulta
// ya realizada (consultaId). NO ejecuta una nueva búsqueda en PubMed —
// reutiliza el contexto persistido por `evidenciaSearch` (sintesis_texto
// + chatCtx.fuentes) y llama directamente al modelo IA.
//
// Encuadre regulatorio: igual que evidenciaSearch — riesgo limitado, art. 50
// (transparencia). El sistema sigue rechazando preguntas con PII o que
// pidan diagnóstico/tratamiento individualizado. Cada turno se persiste
// en la subcolección `chat/{turnId}` del documento de la consulta para
// trazabilidad EU AI Act art. 12.
// ══════════════════════════════════════════════════════════════════════

import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getApp } from 'firebase-admin/app';
import { logger } from 'firebase-functions/v2';

import { validarPregunta } from './safeguards';
import { buildProviderChain, tryProviderChain } from '../routing';

const DEEPSEEK_API_KEY = defineSecret('DEEPSEEK_API_KEY');
const OPENROUTER_API_KEY = defineSecret('OPENROUTER_API_KEY');

const REGION = 'europe-west1';
const CORS = [
  'https://area2cartagena.es',
  'https://carlosgalera-a11y.github.io',
  'http://localhost:5000',
];

const MAX_TURNS_PER_CONSULTA = 12;
const MAX_HISTORY_INJECTED = 6; // 3 pares user/ai recientes

const CHAT_SYSTEM_PROMPT = [
  'Eres EvidenciaIA, asistente conversacional de búsqueda bibliográfica clínica.',
  'Estás en una conversación de SEGUIMIENTO sobre una consulta bibliográfica que',
  'ya respondiste al profesional. Tu papel es ACLARAR, MATIZAR o PROFUNDIZAR en lo',
  'que ya entregaste, usando ÚNICAMENTE los abstracts y la síntesis previa que se',
  'te proporcionan en el user prompt.',
  '',
  'REGLAS ABSOLUTAS:',
  '1. NO eres un médico ni das consejos médicos.',
  '2. NO recomiendas diagnósticos ni tratamientos para pacientes concretos.',
  '3. Tus respuestas se apoyan SIEMPRE en los abstracts proporcionados (citas [n]).',
  '4. Si la pregunta sale del alcance de los abstracts, dilo claramente y sugiere',
  '   una nueva búsqueda en la pantalla principal — NO inventes contenido.',
  '5. Si el usuario pide diagnóstico/tratamiento de un paciente concreto, responde:',
  '   "Esta pregunta requiere juicio clínico individualizado y queda fuera de EvidenciaIA."',
  '6. Respuestas cortas (máx 6-8 frases) salvo que se pida explícitamente extensión.',
  '7. Cada afirmación clínica DEBE ir seguida de [n] si proviene de un abstract.',
  '8. Si los abstracts no aportan información, di "los abstracts disponibles no aclaran este punto".',
  '9. Responde en español salvo que se te pida explícitamente otro idioma.',
  '10. NO repitas la estructura "### Síntesis / ### Calidad…" — esto es chat, prosa breve.',
].join('\n');

interface ChatRequest {
  consultaId: string;
  mensaje: string;
  ai_act_disclaimer_shown?: boolean;
}

interface ChatResponse {
  ok: boolean;
  respuesta: string;
  turnIndex: number;
  provider: string;
  model: string;
}

interface ChatTurnDoc {
  role: 'user' | 'ai';
  text: string;
  turnIndex: number;
  timestamp: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp;
}

interface ChatCtxFuente {
  idx: number;
  title: string;
  abstract: string;
  journal: string;
  year: number | null;
  doi: string | null;
  pmid: string | null;
}

function buildChatUserPrompt(opts: {
  preguntaOriginal: string;
  sintesisPrev: string;
  fuentes: ChatCtxFuente[];
  history: Array<{ role: 'user' | 'ai'; text: string }>;
  nuevaPregunta: string;
}): string {
  const lines: string[] = [];
  lines.push('Pregunta original del profesional (turno 1):');
  lines.push(opts.preguntaOriginal);
  lines.push('');
  lines.push('Síntesis previa que recibió:');
  lines.push(opts.sintesisPrev.replace(/\s+/g, ' ').slice(0, 4000));
  lines.push('');
  lines.push('Abstracts disponibles (los mismos del turno 1):');
  for (const f of opts.fuentes) {
    const yr = f.year ?? 's.f.';
    lines.push(`[${f.idx}] ${f.title} — ${f.journal || 's.j.'} (${yr})`);
    lines.push(f.abstract || '(sin abstract)');
    lines.push('');
  }
  if (opts.history.length) {
    lines.push('Turnos previos del chat (más antiguos arriba):');
    for (const h of opts.history) {
      const tag = h.role === 'user' ? 'Profesional' : 'EvidenciaIA';
      lines.push(`${tag}: ${h.text.slice(0, 1200)}`);
    }
    lines.push('');
  }
  lines.push('Pregunta nueva del profesional:');
  lines.push(opts.nuevaPregunta);
  lines.push('');
  lines.push('Responde siguiendo las reglas del system prompt: breve, en prosa, con [n] cuando proceda.');
  return lines.join('\n');
}

export const evidenciaChat = onCall(
  {
    region: REGION,
    secrets: [DEEPSEEK_API_KEY, OPENROUTER_API_KEY],
    enforceAppCheck: false,
    memory: '256MiB',
    timeoutSeconds: 45,
    cors: CORS,
  },
  async (request): Promise<ChatResponse> => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
    const uid = request.auth.uid;
    const data = (request.data ?? {}) as Partial<ChatRequest>;

    if (data.ai_act_disclaimer_shown !== true) {
      throw new HttpsError(
        'failed-precondition',
        'EvidenciaIA requiere aceptar el aviso de transparencia del EU AI Act (art. 50).',
      );
    }

    const consultaId = typeof data.consultaId === 'string' ? data.consultaId.trim() : '';
    if (!consultaId || consultaId.length > 64 || !/^[A-Za-z0-9_-]+$/.test(consultaId)) {
      throw new HttpsError('invalid-argument', 'consultaId inválido.');
    }

    const v = validarPregunta(typeof data.mensaje === 'string' ? data.mensaje : '');
    if (!v.ok) {
      throw new HttpsError('invalid-argument', v.mensaje);
    }

    const db = getFirestore(getApp());
    const consultaRef = db.collection('evidencia_consultas').doc(consultaId);
    const snap = await consultaRef.get();
    if (!snap.exists) throw new HttpsError('not-found', 'Consulta no encontrada.');
    const c = snap.data() as {
      uid?: string;
      pregunta_original?: string;
      sintesis_texto?: string | null;
      chatCtx?: { fuentes?: ChatCtxFuente[]; especialidad?: string } | null;
    };

    if (c.uid !== uid) {
      throw new HttpsError('permission-denied', 'Solo puedes conversar sobre tus propias consultas.');
    }
    const chatCtx = c.chatCtx;
    const fuentes = Array.isArray(chatCtx?.fuentes) ? chatCtx!.fuentes : [];
    const sintesisPrev = typeof c.sintesis_texto === 'string' ? c.sintesis_texto : '';
    if (!fuentes.length || !sintesisPrev) {
      throw new HttpsError(
        'failed-precondition',
        'Esta consulta no tiene síntesis IA — no se puede conversar sobre ella. Repite la búsqueda con "Sintetizar con IA" activado.',
      );
    }

    const chatColl = consultaRef.collection('chat');
    const histSnap = await chatColl.orderBy('turnIndex', 'asc').get();
    if (histSnap.size >= MAX_TURNS_PER_CONSULTA * 2) {
      throw new HttpsError(
        'resource-exhausted',
        `Has alcanzado el límite de ${MAX_TURNS_PER_CONSULTA} turnos por consulta. Inicia una nueva búsqueda.`,
      );
    }
    const allTurns: Array<{ role: 'user' | 'ai'; text: string }> = histSnap.docs
      .map((d) => d.data() as ChatTurnDoc)
      .map((d) => ({ role: d.role, text: typeof d.text === 'string' ? d.text : '' }));

    const recentHistory = allTurns.slice(-MAX_HISTORY_INJECTED);
    const nextTurnIndex = histSnap.size; // 0-based, incluye user+ai

    const userPrompt = buildChatUserPrompt({
      preguntaOriginal: typeof c.pregunta_original === 'string' ? c.pregunta_original : '',
      sintesisPrev,
      fuentes,
      history: recentHistory,
      nuevaPregunta: v.sanitized,
    });

    const aiSecrets = {
      deepseekKey: DEEPSEEK_API_KEY.value(),
      openrouterKey: OPENROUTER_API_KEY.value(),
    };

    const chain = buildProviderChain({
      type: 'educational',
      systemPrompt: CHAT_SYSTEM_PROMPT,
      userPrompt,
      secrets: aiSecrets,
    });

    const start = Date.now();
    let r;
    try {
      r = await tryProviderChain(chain);
    } catch (e: unknown) {
      logger.warn('evidenciaChat.providerChain.failed', {
        uid,
        consultaId,
        err: (e as Error).message ?? String(e),
      });
      throw new HttpsError('internal', 'El modelo IA no respondió. Reintenta en unos segundos.');
    }
    const respuesta = (r.result.text || '').trim().slice(0, 4000);
    if (!respuesta) {
      throw new HttpsError('internal', 'La IA devolvió respuesta vacía. Reintenta.');
    }

    const ts = FieldValue.serverTimestamp();
    // Persistimos los dos turnos (user + ai) atomicamente para que el log
    // refleje la conversación real. Best-effort en términos de fallo de red
    // — si Firestore falla, la respuesta IA se sigue devolviendo al usuario.
    try {
      const batch = db.batch();
      batch.set(chatColl.doc(), {
        role: 'user',
        text: v.sanitized,
        turnIndex: nextTurnIndex,
        timestamp: ts,
      } as ChatTurnDoc);
      batch.set(chatColl.doc(), {
        role: 'ai',
        text: respuesta,
        turnIndex: nextTurnIndex + 1,
        provider: r.provider,
        model: r.result.model,
        duracion_ms: Date.now() - start,
        timestamp: ts,
      });
      // Marca la consulta como "tiene chat" para que el listado en
      // favoritos pueda mostrar un indicador (futuro).
      batch.update(consultaRef, {
        chat_turn_count: FieldValue.increment(2),
        chat_last_at: ts,
      });
      await batch.commit();
    } catch (e: unknown) {
      logger.warn('evidenciaChat.persist.failed', {
        uid,
        consultaId,
        err: (e as Error).message ?? String(e),
      });
    }

    logger.info('evidenciaChat.ok', {
      uid,
      consultaId,
      provider: r.provider,
      model: r.result.model,
      duracion_ms: Date.now() - start,
      turn_index: nextTurnIndex + 1,
      total_turns: nextTurnIndex + 2,
    });

    return {
      ok: true,
      respuesta,
      turnIndex: nextTurnIndex + 1,
      provider: r.provider,
      model: r.result.model,
    };
  },
);

interface ListChatRequest {
  consultaId: string;
}

interface ListChatResponse {
  ok: boolean;
  turns: Array<{ role: 'user' | 'ai'; text: string; turnIndex: number; timestamp: number }>;
}

/**
 * Devuelve el histórico de chat de una consulta. Permite al usuario
 * recuperar la conversación si recarga la página.
 */
export const evidenciaListChat = onCall(
  {
    region: REGION,
    enforceAppCheck: false,
    memory: '256MiB',
    timeoutSeconds: 15,
    cors: CORS,
  },
  async (request): Promise<ListChatResponse> => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
    const uid = request.auth.uid;
    const data = (request.data ?? {}) as Partial<ListChatRequest>;
    const consultaId = typeof data.consultaId === 'string' ? data.consultaId.trim() : '';
    if (!consultaId || consultaId.length > 64 || !/^[A-Za-z0-9_-]+$/.test(consultaId)) {
      throw new HttpsError('invalid-argument', 'consultaId inválido.');
    }
    const db = getFirestore(getApp());
    const consultaRef = db.collection('evidencia_consultas').doc(consultaId);
    const snap = await consultaRef.get();
    if (!snap.exists) throw new HttpsError('not-found', 'Consulta no encontrada.');
    const c = snap.data() as { uid?: string };
    if (c.uid !== uid) {
      throw new HttpsError('permission-denied', 'Solo puedes leer el chat de tus propias consultas.');
    }
    const histSnap = await consultaRef.collection('chat').orderBy('turnIndex', 'asc').get();
    const turns = histSnap.docs.map((d) => {
      const x = d.data() as ChatTurnDoc;
      const ts = x.timestamp as FirebaseFirestore.Timestamp | undefined;
      return {
        role: x.role,
        text: typeof x.text === 'string' ? x.text : '',
        turnIndex: typeof x.turnIndex === 'number' ? x.turnIndex : 0,
        timestamp: ts && typeof ts.toMillis === 'function' ? ts.toMillis() : 0,
      };
    });
    return { ok: true, turns };
  },
);
