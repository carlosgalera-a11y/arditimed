// ══════════════════════════════════════════════════════════════════════
// EvidenciaIA · Cloud Function `evidenciaFeedback`
// ══════════════════════════════════════════════════════════════════════
// Cualquier autenticado puede enviar feedback sobre una consulta concreta.
// El doc se guarda en /evidencia_feedback (admin lee, server escribe).
// Se actualiza el campo `feedback` del doc original /evidencia_consultas.
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

const TIPOS = ['util', 'incorrecto', 'cita_falsa', 'sesgo'] as const;
type Tipo = (typeof TIPOS)[number];

export const evidenciaFeedback = onCall(
  { region: REGION, memory: '256MiB', timeoutSeconds: 15, cors: CORS },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
    const uid = request.auth.uid;

    const consultaId = String(request.data?.consultaId ?? '').trim();
    const tipo = String(request.data?.tipo ?? '') as Tipo;
    const comentario = String(request.data?.comentario ?? '').slice(0, 500);

    if (!consultaId || !/^[A-Za-z0-9]{10,40}$/.test(consultaId)) {
      throw new HttpsError('invalid-argument', 'consultaId inválido.');
    }
    if (!TIPOS.includes(tipo)) {
      throw new HttpsError('invalid-argument', `tipo debe ser uno de ${TIPOS.join(', ')}.`);
    }

    const db = getFirestore(getApp());
    const consultaRef = db.collection('evidencia_consultas').doc(consultaId);
    const fbRef = db.collection('evidencia_feedback').doc();

    await db.runTransaction(async (tx) => {
      const c = await tx.get(consultaRef);
      if (!c.exists) throw new HttpsError('not-found', 'Consulta no encontrada.');
      if ((c.data() as { uid?: string }).uid !== uid) {
        throw new HttpsError('permission-denied', 'Solo el dueño de la consulta puede dar feedback.');
      }
      tx.set(fbRef, {
        consultaId,
        uid,
        tipo,
        comentario: comentario || null,
        timestamp: FieldValue.serverTimestamp(),
      });
      tx.update(consultaRef, { feedback: tipo, feedbackComentario: comentario || null });
    });

    logger.info('evidenciaFeedback.ok', { uid, consultaId, tipo });
    return { ok: true };
  },
);
