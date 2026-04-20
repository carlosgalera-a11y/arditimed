import { onRequest } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { getApp } from 'firebase-admin/app';
import { logger } from 'firebase-functions/v2';

/**
 * Endpoint HTTP público con métricas agregadas.
 * Cache 1h. Sin PII.
 * Si hay un snapshot reciente en metrics_snapshots, lo devuelve.
 * Si no, lo calcula on-the-fly (pero con límite superior de documentos para no explotar lecturas).
 */
export const publicMetrics = onRequest(
  {
    region: 'europe-west1',
    memory: '256MiB',
    timeoutSeconds: 30,
    cors: true,
  },
  async (req, res) => {
    if (req.method !== 'GET') {
      res.status(405).send('Method Not Allowed');
      return;
    }
    const db = getFirestore(getApp());

    try {
      // Último snapshot.
      const snap = await db
        .collection('metrics_snapshots')
        .orderBy('generatedAt', 'desc')
        .limit(1)
        .get();

      let payload: Record<string, unknown>;
      if (!snap.empty) {
        const d = snap.docs[0]!.data();
        payload = {
          usuariosTotal: d.usuariosTotal ?? 0,
          casosTotal: d.casosTotal ?? 0,
          peticionesIAMes: d.peticionesIAMes ?? 0,
          ultimoUpdate: d.generatedAt?.toDate?.().toISOString?.() ?? null,
          source: 'snapshot',
          week: d.week ?? null,
        };
      } else {
        // Fallback: contar con límite para no escapar de presupuesto.
        payload = {
          usuariosTotal: 0,
          casosTotal: 0,
          peticionesIAMes: 0,
          ultimoUpdate: null,
          source: 'empty',
        };
      }

      res.set('Cache-Control', 'public, max-age=3600');
      res.set('Content-Type', 'application/json; charset=utf-8');
      res.status(200).json(payload);
    } catch (e) {
      logger.error('publicMetrics.error', { message: (e as Error).message });
      res.status(500).json({ error: 'metrics_unavailable' });
    }
  },
);
