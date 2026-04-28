// ══════════════════════════════════════════════════════════════════════
// Foro privado · trigger de notificación al autor cuando le responden
// ══════════════════════════════════════════════════════════════════════
// onCreate /centros_salud/{cid}/foro/{qid}/respuestas/{rid}:
//   1. Lee el doc de la pregunta para obtener autorUid + autorEmail.
//   2. Si quien responde NO es el propio autor, encola un doc en /mail
//      con formato Firestore Send Email Extension.
//   3. Si la extensión está instalada → email se despacha solo.
//      Si no → el doc queda inerte, sin error.
// ══════════════════════════════════════════════════════════════════════

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getApp } from 'firebase-admin/app';
import { logger } from 'firebase-functions/v2';

const REGION = 'europe-west1';

export const foroNotifyOnRespuesta = onDocumentCreated(
  {
    region: REGION,
    document: 'centros_salud/{cid}/foro/{qid}/respuestas/{rid}',
    memory: '256MiB',
    timeoutSeconds: 30,
  },
  async (event) => {
    const { cid, qid, rid } = event.params as { cid: string; qid: string; rid: string };
    const respuesta = event.data?.data();
    if (!respuesta) return;

    const db = getFirestore(getApp());
    const qRef = db.collection('centros_salud').doc(cid).collection('foro').doc(qid);
    const cRef = db.collection('centros_salud').doc(cid);
    const [qSnap, cSnap] = await Promise.all([qRef.get(), cRef.get()]);
    if (!qSnap.exists) {
      logger.warn('foroNotify.parentMissing', { cid, qid, rid });
      return;
    }
    const pregunta = qSnap.data() as {
      titulo?: string;
      autorUid?: string;
      autorEmail?: string;
      autorNombre?: string;
    };
    const centroNombre = cSnap.exists ? (cSnap.data() as { nombre?: string }).nombre ?? cid : cid;

    // No notificar si el autor responde su propia pregunta.
    if (!pregunta.autorEmail) return;
    if (pregunta.autorUid && pregunta.autorUid === respuesta.autorUid) return;

    const titulo = pregunta.titulo ?? 'tu pregunta';
    const replyAutor = respuesta.autorNombre ?? respuesta.autorEmail ?? 'un compañero';
    const rolHint =
      respuesta.autorRol === 'coordinador'
        ? ' (coordinador)'
        : respuesta.autorRol === 'redactor'
          ? ' (redactor)'
          : respuesta.autorRol === 'admin'
            ? ' (admin)'
            : '';

    const subject = `💬 Nueva respuesta a "${titulo}" · ${centroNombre}`;
    const link = `https://area2cartagena.es/centros-salud.html`;

    const text =
      `Hola ${pregunta.autorNombre ?? pregunta.autorEmail},\n\n` +
      `${replyAutor}${rolHint} ha respondido a tu pregunta del foro privado del ${centroNombre}:\n\n` +
      `   "${titulo}"\n\n` +
      `Entra a Cartagenaeste para leer la respuesta:\n${link}\n\n` +
      `— Foro privado del ${centroNombre} · Cartagenaeste\n` +
      `Recibes este correo porque eres miembro del centro y abriste esta pregunta. ` +
      `Para dejar de recibir notificaciones, contacta con tu coordinador.`;

    const html =
      `<p>Hola <strong>${escapeHtml(pregunta.autorNombre ?? pregunta.autorEmail)}</strong>,</p>` +
      `<p><strong>${escapeHtml(replyAutor)}</strong>${escapeHtml(rolHint)} ha respondido a tu pregunta del foro privado del <strong>${escapeHtml(centroNombre)}</strong>:</p>` +
      `<blockquote style="border-left:3px solid #d4a853;padding-left:12px;color:#555;margin:12px 0;">${escapeHtml(titulo)}</blockquote>` +
      `<p><a href="${link}" style="background:#0d3d26;color:#fff;padding:8px 16px;border-radius:8px;text-decoration:none;font-weight:700;">Leer la respuesta →</a></p>` +
      `<hr style="border:none;border-top:1px solid #eee;margin:18px 0;">` +
      `<p style="font-size:.82rem;color:#888;">Foro privado del ${escapeHtml(centroNombre)} · Cartagenaeste<br>` +
      `Recibes este correo porque abriste esta pregunta. Para dejar de recibir notificaciones, contacta con tu coordinador.</p>`;

    try {
      await db.collection('mail').add({
        to: [pregunta.autorEmail],
        message: { subject, text, html },
        kind: 'foro_respuesta',
        cid,
        qid,
        rid,
        createdAt: FieldValue.serverTimestamp(),
      });
      logger.info('foroNotify.queued', { cid, qid, rid, to: pregunta.autorEmail });
    } catch (e) {
      logger.warn('foroNotify.failed', { err: (e as Error).message });
    }
  },
);

function escapeHtml(s: string | undefined | null): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}
