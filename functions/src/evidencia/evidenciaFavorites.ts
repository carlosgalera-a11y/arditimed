// ══════════════════════════════════════════════════════════════════════
// EvidenciaIA · Favoritos por usuario
// ══════════════════════════════════════════════════════════════════════
// Permite al clínico marcar consultas previas como "favoritas" para
// volver a ellas sin tener que reescribir la pregunta. Modelo:
//
//   users/{uid}/evidenciaFavoritos/{consultaId}
//     - pregunta: string  (snapshot, sin PII por construcción)
//     - createdAt: timestamp
//     - evidence_grade: 'A'|'B'|'C'|'D'|'insuficiente' (opcional, snapshot)
//
// Operaciones:
//   - evidenciaToggleFavorite(consultaId): añade o quita; idempotente.
//   - evidenciaListFavorites(): lista paginada de favoritos del uid actual.
//
// No se duplica la respuesta IA en el favorito (sería voluminoso); el
// frontend cargará la consulta completa por id cuando se pulse.
// ══════════════════════════════════════════════════════════════════════

import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getApp } from 'firebase-admin/app';
import { logger } from 'firebase-functions/v2';

const REGION = 'europe-west1';
const CORS = [
  'https://area2cartagena.es',
  'https://carlosgalera-a11y.github.io',
  'http://localhost:5000',
];

interface ToggleRequest {
  consultaId: string;
}

interface ToggleResponse {
  ok: boolean;
  favorited: boolean; // estado FINAL tras el toggle
}

export const evidenciaToggleFavorite = onCall(
  {
    region: REGION,
    cors: CORS,
    enforceAppCheck: false,
    memory: '256MiB',
    timeoutSeconds: 15,
  },
  async (request): Promise<ToggleResponse> => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
    const uid = request.auth.uid;
    const data = (request.data ?? {}) as Partial<ToggleRequest>;
    const consultaId = typeof data.consultaId === 'string' ? data.consultaId.trim() : '';
    if (!consultaId || consultaId.length > 64) {
      throw new HttpsError('invalid-argument', 'consultaId inválido.');
    }
    const db = getFirestore(getApp());
    // Validar que la consulta existe Y pertenece al usuario antes de
    // permitir favoritarla. Esto evita que un usuario marque consultas
    // de otros como favoritas (privacidad + integridad).
    const consultaSnap = await db.collection('evidencia_consultas').doc(consultaId).get();
    if (!consultaSnap.exists) throw new HttpsError('not-found', 'Consulta no encontrada.');
    const consulta = consultaSnap.data() as { uid?: string; pregunta_original?: string; evidence_grade?: string } | undefined;
    if (!consulta || consulta.uid !== uid) {
      throw new HttpsError('permission-denied', 'Solo puedes favoritar tus propias consultas.');
    }
    const favRef = db.collection('users').doc(uid).collection('evidenciaFavoritos').doc(consultaId);
    const favSnap = await favRef.get();
    if (favSnap.exists) {
      await favRef.delete();
      logger.info('evidenciaFavorite.removed', { uid, consultaId });
      return { ok: true, favorited: false };
    }
    await favRef.set({
      consultaId,
      pregunta: consulta.pregunta_original ?? '',
      evidence_grade: consulta.evidence_grade ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });
    logger.info('evidenciaFavorite.added', { uid, consultaId });
    return { ok: true, favorited: true };
  },
);

interface ListResponse {
  ok: boolean;
  items: Array<{
    consultaId: string;
    pregunta: string;
    evidence_grade: string | null;
    createdAt: number; // ms epoch
  }>;
}

export const evidenciaListFavorites = onCall(
  {
    region: REGION,
    cors: CORS,
    enforceAppCheck: false,
    memory: '256MiB',
    timeoutSeconds: 10,
  },
  async (request): Promise<ListResponse> => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
    const uid = request.auth.uid;
    const db = getFirestore(getApp());
    const snap = await db
      .collection('users')
      .doc(uid)
      .collection('evidenciaFavoritos')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    const items = snap.docs.map((d) => {
      const x = d.data() as { consultaId?: string; pregunta?: string; evidence_grade?: string | null; createdAt?: FirebaseFirestore.Timestamp };
      return {
        consultaId: x.consultaId ?? d.id,
        pregunta: x.pregunta ?? '',
        evidence_grade: x.evidence_grade ?? null,
        createdAt: x.createdAt?.toMillis?.() ?? 0,
      };
    });
    return { ok: true, items };
  },
);
