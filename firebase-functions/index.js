const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();
const db = admin.firestore();

// ═══ EMAIL CONFIG ═══
const emailConfig = functions.config().email || {};
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: emailConfig.user || "cartagenaeste.docencia@gmail.com",
    pass: emailConfig.pass || "",
  },
});

// ═══ 1. CONFIRMAR CITA POR EMAIL ═══
exports.enviarConfirmacionCita = functions.firestore
  .document("citas/{citaId}")
  .onCreate(async (snap, context) => {
    const cita = snap.data();
    if (!cita.email) return null;

    const mailOptions = {
      from: '"Área II Cartagena" <cartagenaeste.docencia@gmail.com>',
      to: cita.email,
      subject: `Solicitud de cita recibida — ${cita.tipo || "Consulta"}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;">
          <div style="background:#1a6b4a;color:#fff;padding:20px;border-radius:12px 12px 0 0;text-align:center;">
            <h2 style="margin:0;">🏥 Área II Cartagena</h2>
            <p style="margin:4px 0 0;opacity:.8;">Centro de Salud Virgen de la Caridad</p>
          </div>
          <div style="padding:20px;background:#fff;border:1px solid #e2e8f0;">
            <p>Hola <strong>${cita.nombre || "paciente"}</strong>,</p>
            <p>Hemos recibido tu solicitud de cita:</p>
            <table style="width:100%;border-collapse:collapse;margin:12px 0;">
              <tr><td style="padding:6px;color:#666;">Tipo:</td><td style="padding:6px;font-weight:600;">${cita.tipo || "-"}</td></tr>
              <tr><td style="padding:6px;color:#666;">Fecha solicitada:</td><td style="padding:6px;font-weight:600;">${cita.fecha || "-"}</td></tr>
              <tr><td style="padding:6px;color:#666;">Teléfono:</td><td style="padding:6px;font-weight:600;">${cita.telefono || "-"}</td></tr>
            </table>
            <p style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:10px;font-size:.85rem;color:#166534;">
              📞 Le confirmaremos la cita por teléfono en las próximas 24-48h laborables.
            </p>
          </div>
          <div style="padding:12px;text-align:center;font-size:.75rem;color:#999;">
            Área II Cartagena · Hospital Santa Lucía · SMS Murcia
          </div>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      await snap.ref.update({ emailEnviado: true, emailFecha: new Date() });
      console.log("Email cita enviado a:", cita.email);
    } catch (err) {
      console.error("Error email cita:", err);
      await snap.ref.update({ emailError: err.message });
    }
    return null;
  });

// ═══ 2. NOTIFICAR NUEVO PROTOCOLO (FCM) ═══
exports.notificarNuevoProtocolo = functions.firestore
  .document("protocolos_propuestos/{docId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only notify when status changes to "aprobado"
    if (before.status === after.status || after.status !== "aprobado") return null;

    // Get all FCM tokens from profesionales
    const tokensSnap = await db.collection("fcm_tokens").get();
    const tokens = [];
    tokensSnap.forEach((doc) => tokens.push(doc.data().token));

    if (tokens.length === 0) return null;

    const message = {
      notification: {
        title: "📋 Nuevo protocolo disponible",
        body: `${after.titulo || "Protocolo"} — ${after.categoria || "General"}`,
      },
      tokens: tokens,
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`Push sent: ${response.successCount} ok, ${response.failureCount} failed`);
    } catch (err) {
      console.error("Push error:", err);
    }
    return null;
  });

// ═══ 3. LIMPIAR LOGS ANTIGUOS (semanal) ═══
exports.limpiarLogsAntiguos = functions.pubsub
  .schedule("every monday 03:00")
  .timeZone("Europe/Madrid")
  .onRun(async (context) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90); // 90 días

    const snap = await db
      .collection("uso_anonimo")
      .where("fecha", "<", cutoff)
      .limit(500)
      .get();

    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    console.log(`Cleaned ${snap.size} old logs`);
    return null;
  });

// ═══ 4. RESUMEN SEMANAL (lunes 8am) ═══
exports.generarResumenSemanal = functions.pubsub
  .schedule("every monday 08:00")
  .timeZone("Europe/Madrid")
  .onRun(async (context) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const snap = await db
      .collection("uso_anonimo")
      .where("fecha", ">", weekAgo)
      .get();

    // Count actions
    const counts = {};
    snap.docs.forEach((doc) => {
      const a = doc.data().accion || "unknown";
      counts[a] = (counts[a] || 0) + 1;
    });

    await db.collection("resumenes_semanales").add({
      semana: weekAgo.toISOString().split("T")[0],
      totalAcciones: snap.size,
      desglose: counts,
      generado: new Date(),
    });

    console.log(`Weekly summary: ${snap.size} actions`);
    return null;
  });

// ═══ 5. API MÉTRICAS (para dashboard) ═══
exports.apiMetricas = functions.https.onCall(async (data, context) => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [usoSnap, citasSnap, accesosSnap] = await Promise.all([
    db.collection("uso_anonimo").where("fecha", ">", weekAgo).get(),
    db.collection("citas").where("fecha", ">", weekAgo).get(),
    db.collection("accesos_profesionales").where("fecha", ">", weekAgo).get(),
  ]);

  return {
    visitas_semana: usoSnap.size,
    citas_semana: citasSnap.size,
    accesos_pro_semana: accesosSnap.size,
    timestamp: new Date().toISOString(),
  };
});
