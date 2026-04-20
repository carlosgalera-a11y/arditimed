import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { logger } from 'firebase-functions/v2';

const REGION = 'europe-west1';
const TZ = 'Europe/Madrid';

function isoWeek(d: Date = new Date()): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

// ═══════════════════════════════════════════════════════════════════
// weeklyMetricsSnapshot — lunes 03:00 Madrid
// Cuenta colecciones con .count() (cheap) y escribe en metrics_snapshots.
// ═══════════════════════════════════════════════════════════════════
export const weeklyMetricsSnapshot = onSchedule(
  {
    region: REGION,
    schedule: 'every monday 03:00',
    timeZone: TZ,
    memory: '512MiB',
    timeoutSeconds: 300,
  },
  async () => {
    const db = getFirestore(getApp());
    const auth = getAuth(getApp());

    // Usuarios totales (Auth).
    let usuariosTotal = 0;
    try {
      let pageToken: string | undefined;
      do {
        const list = await auth.listUsers(1000, pageToken);
        usuariosTotal += list.users.length;
        pageToken = list.pageToken;
      } while (pageToken);
    } catch (e) {
      logger.warn('metricsSnapshot.usuariosError', { msg: (e as Error).message });
    }

    // Peticiones IA del mes = auditLogs con resourceType users.aiRequests y action create.
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    let peticionesIAMes = 0;
    try {
      const aiSnap = await db
        .collection('auditLogs')
        .where('resourceType', '==', 'users.aiRequests')
        .where('action', '==', 'create')
        .where('timestamp', '>=', monthStart)
        .count()
        .get();
      peticionesIAMes = aiSnap.data().count;
    } catch (e) {
      logger.warn('metricsSnapshot.peticionesIAError', { msg: (e as Error).message });
    }

    // Casos totales (aproximado vía auditLogs create).
    let casosTotal = 0;
    try {
      const casosSnap = await db
        .collection('auditLogs')
        .where('resourceType', '==', 'users.cases')
        .where('action', '==', 'create')
        .count()
        .get();
      casosTotal = casosSnap.data().count;
    } catch (e) {
      logger.warn('metricsSnapshot.casosError', { msg: (e as Error).message });
    }

    const week = isoWeek();
    await db.collection('metrics_snapshots').doc(week).set({
      week,
      usuariosTotal,
      casosTotal,
      peticionesIAMes,
      generatedAt: FieldValue.serverTimestamp(),
    });

    logger.info('metricsSnapshot.ok', { week, usuariosTotal, casosTotal, peticionesIAMes });
  },
);

// ═══════════════════════════════════════════════════════════════════
// dailyBackup — Firestore export a bucket UE.
// Requiere que el bucket gs://docenciacartagenaeste-backups exista y
// que la service account de Functions tenga roles/datastore.importExportAdmin
// + roles/storage.admin sobre ese bucket. Documentado en runbook.md.
// ═══════════════════════════════════════════════════════════════════
export const dailyBackup = onSchedule(
  {
    region: REGION,
    schedule: 'every day 03:00',
    timeZone: TZ,
    memory: '256MiB',
    timeoutSeconds: 540,
  },
  async () => {
    const projectId = process.env.GCLOUD_PROJECT || 'docenciacartagenaeste';
    const bucket = `gs://${projectId}-backups`;
    const today = new Date().toISOString().substring(0, 10);
    const outputUriPrefix = `${bucket}/firestore/${today}`;

    // Llamada a Firestore Admin API exportDocuments vía google-auth-library.
    try {
      const { GoogleAuth } = await import('google-auth-library');
      const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/datastore'] });
      const client = await auth.getClient();
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default):exportDocuments`;
      const res = await client.request({
        url,
        method: 'POST',
        data: { outputUriPrefix, collectionIds: [] },
      });
      logger.info('dailyBackup.started', { outputUriPrefix, name: (res.data as { name?: string }).name });
    } catch (e) {
      logger.error('dailyBackup.failed', { message: (e as Error).message });
      throw e;
    }
  },
);

// ═══════════════════════════════════════════════════════════════════
// weeklyAuditDigest — lunes 09:00 Madrid.
// Cuenta acciones del último 7d. Detecta anomalías.
// Email vía nodemailer es opcional — si GMAIL_APP_PASSWORD no está,
// solo emite log.
// ═══════════════════════════════════════════════════════════════════
export const weeklyAuditDigest = onSchedule(
  {
    region: REGION,
    schedule: 'every monday 09:00',
    timeZone: TZ,
    memory: '256MiB',
    timeoutSeconds: 120,
  },
  async () => {
    const db = getFirestore(getApp());
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const snap = await db.collection('auditLogs').where('timestamp', '>=', weekAgo).get();

    const byAction: Record<string, number> = { create: 0, update: 0, delete: 0 };
    const byUser: Record<string, number> = {};
    const byType: Record<string, number> = {};
    snap.forEach((d) => {
      const a = d.get('action') as string;
      const u = d.get('uid') as string;
      const t = d.get('resourceType') as string;
      if (a) byAction[a] = (byAction[a] ?? 0) + 1;
      if (u) byUser[u] = (byUser[u] ?? 0) + 1;
      if (t) byType[t] = (byType[t] ?? 0) + 1;
    });

    const anomalies: string[] = [];
    if ((byAction.delete ?? 0) > 50) anomalies.push(`deletes=${byAction.delete} (>50/semana)`);
    if ((byType['users.aiRequests'] ?? 0) > 5000) anomalies.push(`aiRequests=${byType['users.aiRequests']} (>5k/semana)`);

    logger.info('weeklyAuditDigest', { total: snap.size, byAction, byType, anomalies });
    if (anomalies.length) logger.warn('weeklyAuditDigest.ANOMALY', { anomalies });
  },
);
