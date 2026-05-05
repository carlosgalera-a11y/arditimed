// ══════════════════════════════════════════════════════════════════════
// EvidenciaIA · SharedThread (URL pública anonimizada)
// ══════════════════════════════════════════════════════════════════════
// Permite al dueño de una consulta generar un token opaco que comparte
// con un colega vía URL. La página `evidencia-shared.html?t=<token>`
// llama a `evidenciaGetShared` (público, sin auth) y muestra la
// pregunta + síntesis + fuentes en modo solo-lectura, con disclaimer
// formativo prominente.
//
// Modelo:
//   Cuando el dueño pulsa "🔗 Compartir":
//     1) `evidenciaCreateShareToken({consultaId})` genera 24-byte token
//        random y lo escribe en evidencia_consultas/{id}.shareToken (si
//        ya existe se reutiliza para mantener URLs estables).
//     2) Devuelve la URL completa.
//   Cuando un visitante (con o sin login) abre la URL:
//     1) `evidenciaGetShared({token})` busca por token via collection
//        query y devuelve los campos read-only ANONIMIZADOS (sin uid,
//        sin metadata privada).
//
// Privacidad: la pregunta queda solo lo que ya pasó las safeguards (sin
// PII por construcción). El uid del autor NO se expone. Los logs de
// auditoría siguen quedando server-side; el visitante no los ve.
// ══════════════════════════════════════════════════════════════════════

import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getApp } from 'firebase-admin/app';
import { logger } from 'firebase-functions/v2';
import { randomBytes } from 'node:crypto';

const REGION = 'europe-west1';
const CORS = [
  'https://area2cartagena.es',
  'https://carlosgalera-a11y.github.io',
  'http://localhost:5000',
];

function generateToken(): string {
  // 24 bytes hex = 48 chars, ~192 bits de entropía. URL-safe.
  return randomBytes(24).toString('hex');
}

interface CreateRequest {
  consultaId: string;
}

interface CreateResponse {
  ok: boolean;
  token: string;
  url: string;
}

export const evidenciaCreateShareToken = onCall(
  {
    region: REGION,
    cors: CORS,
    enforceAppCheck: false,
    memory: '256MiB',
    timeoutSeconds: 15,
  },
  async (request): Promise<CreateResponse> => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
    const uid = request.auth.uid;
    const data = (request.data ?? {}) as Partial<CreateRequest>;
    const consultaId = typeof data.consultaId === 'string' ? data.consultaId.trim() : '';
    if (!consultaId || consultaId.length > 64) {
      throw new HttpsError('invalid-argument', 'consultaId inválido.');
    }
    const db = getFirestore(getApp());
    const ref = db.collection('evidencia_consultas').doc(consultaId);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpsError('not-found', 'Consulta no encontrada.');
    const existing = snap.data() as { uid?: string; shareToken?: string } | undefined;
    if (!existing || existing.uid !== uid) {
      throw new HttpsError('permission-denied', 'Solo puedes compartir tus propias consultas.');
    }
    let token = existing.shareToken;
    if (!token) {
      token = generateToken();
      await ref.update({
        shareToken: token,
        sharedAt: FieldValue.serverTimestamp(),
      });
      logger.info('evidenciaShare.tokenCreated', { uid, consultaId });
    }
    const baseUrl = 'https://area2cartagena.es';
    return {
      ok: true,
      token,
      url: `${baseUrl}/evidencia-shared.html?t=${token}`,
    };
  },
);

interface GetSharedRequest {
  token: string;
}

interface SharedAbstract {
  title: string;
  authors: string[];
  journal: string;
  year: number | null;
  doi: string | null;
  pmid: string | null;
  source: string;
}

interface GetSharedResponse {
  ok: boolean;
  pregunta: string;
  texto_sintetizado: string | null;
  follow_ups: string[];
  evidence_grade: { grade: string; label: string; rationale: string } | null;
  fuentes: SharedAbstract[];
  prompt_version_synth: string | null;
  sintesis_provider: string | null;
  sharedAt: number; // ms epoch
}

export const evidenciaGetShared = onCall(
  {
    region: REGION,
    cors: CORS,
    // PÚBLICO: no requiere auth. La autorización es por posesión del
    // token opaco (~192 bits). Idéntico modelo a un "share link" de
    // Drive/Notion.
    enforceAppCheck: false,
    memory: '256MiB',
    timeoutSeconds: 15,
  },
  async (request): Promise<GetSharedResponse> => {
    const data = (request.data ?? {}) as Partial<GetSharedRequest>;
    const token = typeof data.token === 'string' ? data.token.trim() : '';
    // Validación estricta de formato — 48 hex — para minimizar abuso.
    if (!/^[0-9a-f]{48}$/i.test(token)) {
      throw new HttpsError('invalid-argument', 'Token inválido.');
    }
    const db = getFirestore(getApp());
    const q = await db
      .collection('evidencia_consultas')
      .where('shareToken', '==', token)
      .limit(1)
      .get();
    if (q.empty) throw new HttpsError('not-found', 'Enlace no encontrado o caducado.');
    const docSnap = q.docs[0];
    if (!docSnap) throw new HttpsError('not-found', 'Enlace no encontrado.');
    const c = docSnap.data() as Record<string, unknown>;

    // Anonimización: nunca exponemos uid, cache_key, secrets, errors.
    const fuentesRaw = Array.isArray(c['abstracts_pmids']) ? c['abstracts_pmids'] as unknown[] : [];
    // Las fuentes completas se almacenan en cache; aquí publicamos solo
    // PMIDs (suficientes para reconstruir el listado en el visor sin
    // exponer abstracts internos del cache).
    const fuentes: SharedAbstract[] = fuentesRaw
      .filter((p): p is string => typeof p === 'string')
      .map((pmid) => ({
        title: '',
        authors: [],
        journal: '',
        year: null,
        doi: null,
        pmid,
        source: 'pubmed',
      }));

    // Mejor: si el doc tiene snapshot completo (lo añadimos cuando el
    // dueño comparte), usar ese. Por ahora usamos los campos básicos.
    const sharedSnapshot = c['sharedSnapshot'] as
      | { fuentes?: SharedAbstract[]; texto_sintetizado?: string; follow_ups?: string[] }
      | undefined;
    const finalFuentes = sharedSnapshot?.fuentes && sharedSnapshot.fuentes.length
      ? sharedSnapshot.fuentes
      : fuentes;

    const grade = c['evidence_grade'] && typeof c['evidence_grade'] === 'string'
      ? { grade: c['evidence_grade'] as string, label: '', rationale: '' }
      : null;

    return {
      ok: true,
      pregunta: typeof c['pregunta_original'] === 'string' ? (c['pregunta_original'] as string) : '',
      texto_sintetizado: sharedSnapshot?.texto_sintetizado ?? null,
      follow_ups: sharedSnapshot?.follow_ups ?? [],
      evidence_grade: grade,
      fuentes: finalFuentes,
      prompt_version_synth: typeof c['prompt_version_synth'] === 'string' ? (c['prompt_version_synth'] as string) : null,
      sintesis_provider: typeof c['sintesis_provider'] === 'string' ? (c['sintesis_provider'] as string) : null,
      sharedAt: (c['sharedAt'] as FirebaseFirestore.Timestamp | undefined)?.toMillis?.() ?? 0,
    };
  },
);

interface SaveSnapshotRequest {
  consultaId: string;
  texto_sintetizado: string;
  follow_ups: string[];
  fuentes: SharedAbstract[];
}

/**
 * El frontend envía el snapshot completo de la respuesta IA en el
 * mismo paso de "Compartir" para que el visor lo reciba sin tener que
 * recalcular nada (que requeriría re-llamar al modelo IA, lo que
 * traicionaría el modelo de "snapshot inmutable" del share).
 */
export const evidenciaSaveShareSnapshot = onCall(
  {
    region: REGION,
    cors: CORS,
    enforceAppCheck: false,
    memory: '256MiB',
    timeoutSeconds: 15,
  },
  async (request): Promise<{ ok: boolean }> => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
    const uid = request.auth.uid;
    const data = (request.data ?? {}) as Partial<SaveSnapshotRequest>;
    const consultaId = typeof data.consultaId === 'string' ? data.consultaId.trim() : '';
    if (!consultaId || consultaId.length > 64) {
      throw new HttpsError('invalid-argument', 'consultaId inválido.');
    }
    const sintesis = typeof data.texto_sintetizado === 'string' ? data.texto_sintetizado.slice(0, 12000) : '';
    const followUps = Array.isArray(data.follow_ups) ? data.follow_ups.slice(0, 5).map((s) => String(s).slice(0, 240)) : [];
    const fuentesRaw = Array.isArray(data.fuentes) ? data.fuentes.slice(0, 12) : [];
    const fuentes: SharedAbstract[] = fuentesRaw.map((f) => ({
      title: typeof f.title === 'string' ? f.title.slice(0, 400) : '',
      authors: Array.isArray(f.authors) ? f.authors.slice(0, 8).map((a) => String(a).slice(0, 80)) : [],
      journal: typeof f.journal === 'string' ? f.journal.slice(0, 200) : '',
      year: typeof f.year === 'number' ? f.year : null,
      doi: typeof f.doi === 'string' ? f.doi.slice(0, 200) : null,
      pmid: typeof f.pmid === 'string' ? f.pmid.slice(0, 32) : null,
      source: typeof f.source === 'string' ? f.source.slice(0, 24) : '',
    }));
    const db = getFirestore(getApp());
    const ref = db.collection('evidencia_consultas').doc(consultaId);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpsError('not-found', 'Consulta no encontrada.');
    const existing = snap.data() as { uid?: string } | undefined;
    if (!existing || existing.uid !== uid) {
      throw new HttpsError('permission-denied', 'Solo puedes compartir tus propias consultas.');
    }
    await ref.update({
      sharedSnapshot: { texto_sintetizado: sintesis, follow_ups: followUps, fuentes },
    });
    logger.info('evidenciaShare.snapshotSaved', { uid, consultaId });
    return { ok: true };
  },
);
