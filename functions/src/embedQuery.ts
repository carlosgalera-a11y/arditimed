// ════════════════════════════════════════════════════════════════════
// embedQuery — embeddings vía Gemini text-embedding-004 (free tier)
// ════════════════════════════════════════════════════════════════════
// © 2026 Carlos Galera Román · Licencia propietaria · LPI 00765-03096622
// Ver LICENSE y NOTICE.md · Reutilización requiere autorización escrita.
// ════════════════════════════════════════════════════════════════════
//
// Endpoint callable que recibe un texto (la pregunta del usuario o un
// chunk de documento que el usuario sube a su cuaderno personal) y
// devuelve su embedding 768-dim usando Gemini text-embedding-004.
//
// Uso desde el cliente:
//   const fn = firebase.app().functions('europe-west1').httpsCallable('embedQuery');
//   const { data } = await fn({ text: 'pregunta del médico', taskType: 'RETRIEVAL_QUERY' });
//   // data.embedding = number[768]
//
// taskType:
//   RETRIEVAL_QUERY   → al embed de la pregunta del usuario
//   RETRIEVAL_DOCUMENT → al embed de chunks que el usuario sube
//   (Mejora la calidad del retrieval ~5-10% según paper de Gemini.)
//
// Rate limit por usuario: 60 req/min (más que suficiente para chat).
// App Check: respeta el flag global de askAi (off por ahora).
// EU-residency: Gemini API tiene endpoints globales — para uso formativo OK.
// ════════════════════════════════════════════════════════════════════

import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

// gemini-embedding-001 es el modelo estable actual. text-embedding-004
// quedó deprecated en v1beta. Pedimos 768 dims explícitas vía MRL para
// que el embedding del cliente sea compatible con el índice pre-generado.
const EMBED_MODEL = 'gemini-embedding-001';
const EMBED_DIMS = 768;
const RATE_LIMIT_PER_MINUTE = 60;
const MAX_TEXT_LEN = 8000; // Gemini soporta más, pero limitamos por abuso

type TaskType = 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT' | 'SEMANTIC_SIMILARITY';
const VALID_TASK_TYPES: readonly TaskType[] = [
  'RETRIEVAL_QUERY',
  'RETRIEVAL_DOCUMENT',
  'SEMANTIC_SIMILARITY',
] as const;

interface EmbedRequest {
  text?: string;
  taskType?: TaskType;
}

interface EmbedResponse {
  embedding: number[];
  dims: number;
  model: string;
  cached: boolean;
}

// Rate limiting simple en Firestore.
async function checkRateLimit(uid: string): Promise<void> {
  const db = getFirestore();
  const now = Date.now();
  const windowStart = now - 60_000;
  const ref = db.collection('rate_limits_embed').doc(uid);
  const snap = await ref.get();
  const data = snap.data() ?? { count: 0, windowStart: now };
  if (data.windowStart < windowStart) {
    await ref.set({ count: 1, windowStart: now });
    return;
  }
  if (data.count >= RATE_LIMIT_PER_MINUTE) {
    throw new HttpsError(
      'resource-exhausted',
      `Has alcanzado el límite de ${RATE_LIMIT_PER_MINUTE} embeddings/minuto. Espera 60s.`
    );
  }
  await ref.update({ count: FieldValue.increment(1) });
}

// Llamada a Gemini Embeddings API.
async function callGeminiEmbed(text: string, taskType: TaskType, apiKey: string): Promise<number[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${apiKey}`;
  const body = {
    model: `models/${EMBED_MODEL}`,
    content: { parts: [{ text }] },
    taskType,
    outputDimensionality: EMBED_DIMS,
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new HttpsError(
      'internal',
      `Gemini Embed API error ${res.status}: ${err.substring(0, 200)}`
    );
  }
  const json = (await res.json()) as { embedding?: { values?: number[] } };
  const values = json.embedding?.values;
  if (!Array.isArray(values) || values.length !== EMBED_DIMS) {
    throw new HttpsError(
      'internal',
      `Gemini devolvió un embedding malformado (esperado ${EMBED_DIMS} dims).`
    );
  }
  return values;
}

export const embedQuery = onCall(
  {
    region: 'europe-west1',
    secrets: [GEMINI_API_KEY],
    enforceAppCheck: false, // Igual que askAi — flip cuando App Check esté activo.
    minInstances: 0,
    maxInstances: 10,
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (request): Promise<EmbedResponse> => {
    // ── Auth ──
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Inicia sesión para usar el asistente del cuaderno.');
    }
    const uid = request.auth.uid;

    // ── Validación ──
    const data = (request.data || {}) as EmbedRequest;
    const text = typeof data.text === 'string' ? data.text.trim() : '';
    if (!text) {
      throw new HttpsError('invalid-argument', 'text requerido y no vacío');
    }
    if (text.length > MAX_TEXT_LEN) {
      throw new HttpsError(
        'invalid-argument',
        `text demasiado largo (max ${MAX_TEXT_LEN}). Trocea antes de pedir embed.`
      );
    }
    const taskType: TaskType =
      data.taskType && VALID_TASK_TYPES.includes(data.taskType)
        ? data.taskType
        : 'RETRIEVAL_QUERY';

    // ── Rate limit ──
    await checkRateLimit(uid);

    // ── Llamada a Gemini ──
    const apiKey = GEMINI_API_KEY.value();
    if (!apiKey) {
      throw new HttpsError('failed-precondition', 'GEMINI_API_KEY no configurada en Secret Manager.');
    }
    const embedding = await callGeminiEmbed(text, taskType, apiKey);

    return {
      embedding,
      dims: EMBED_DIMS,
      model: EMBED_MODEL,
      cached: false,
    };
  }
);
