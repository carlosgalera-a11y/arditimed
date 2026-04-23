import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getApp } from 'firebase-admin/app';
import { logger } from 'firebase-functions/v2';

const REGION = 'europe-west1';
const TZ = 'Europe/Madrid';

interface ProviderStats {
  count: number;
  errorCount: number;
  cacheHits: number;
  latencies: number[]; // solo para cálculo de percentiles; luego se descarta
  tokensIn: number;
  tokensOut: number;
  costEur: number;
}

interface TypeStats {
  count: number;
  cacheHits: number;
  sumLatencyMs: number;
  costEur: number;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx] ?? 0;
}

function yyyymmdd(d: Date): string {
  return d.toISOString().substring(0, 10);
}

/**
 * aggregateDailyMetrics — todos los días 02:30 Madrid.
 * Agrega aiRequests del día anterior (00:00-24:00 UTC) vía collectionGroup
 * y escribe el resumen en metrics_snapshots/daily-YYYY-MM-DD.
 *
 * Campos: total, cacheHitRate, uniqueUsers, byProvider{count,p50,p95,p99,
 * errorRate,cacheHits,costEur}, byType{count,avgLatencyMs,cacheHits,costEur},
 * totalCostEur, generatedAt.
 *
 * Coste: 1 collectionGroup query con where timestamp. Típico < 1000 docs/día
 * en Área II → sobra con 512MiB y 120s.
 */
export const aggregateDailyMetrics = onSchedule(
  {
    region: REGION,
    schedule: 'every day 02:30',
    timeZone: TZ,
    memory: '512MiB',
    timeoutSeconds: 300,
  },
  async () => {
    const db = getFirestore(getApp());

    // Rango: ayer 00:00 UTC a hoy 00:00 UTC.
    const todayUtc = new Date();
    todayUtc.setUTCHours(0, 0, 0, 0);
    const yesterdayUtc = new Date(todayUtc.getTime() - 24 * 60 * 60 * 1000);
    const dayKey = yyyymmdd(yesterdayUtc);

    let snap;
    try {
      snap = await db
        .collectionGroup('aiRequests')
        .where('createdAt', '>=', yesterdayUtc)
        .where('createdAt', '<', todayUtc)
        .get();
    } catch (e) {
      logger.error('aggregateDailyMetrics.queryFailed', {
        day: dayKey,
        msg: (e as Error).message,
      });
      throw e;
    }

    const byProvider: Record<string, ProviderStats> = {};
    const byType: Record<string, TypeStats> = {};
    const userSet = new Set<string>();
    let total = 0;
    let totalCacheHits = 0;
    let totalCostEur = 0;

    snap.forEach((doc) => {
      const d = doc.data() as {
        type?: string;
        provider?: string;
        latencyMs?: number;
        cacheHit?: boolean;
        tokensIn?: number;
        tokensOut?: number;
        costEstimateEur?: number;
      };
      const provider = d.provider ?? 'unknown';
      const type = d.type ?? 'unknown';
      const latency = typeof d.latencyMs === 'number' ? d.latencyMs : 0;
      const cached = d.cacheHit === true;
      const tokensIn = d.tokensIn ?? 0;
      const tokensOut = d.tokensOut ?? 0;
      const cost = typeof d.costEstimateEur === 'number' ? d.costEstimateEur : 0;

      // uid del doc: users/{uid}/aiRequests/{rid} → segmento 1.
      const uid = doc.ref.parent.parent?.id;
      if (uid) userSet.add(uid);

      total++;
      if (cached) totalCacheHits++;
      totalCostEur += cost;

      const ps = (byProvider[provider] ??= {
        count: 0,
        errorCount: 0,
        cacheHits: 0,
        latencies: [],
        tokensIn: 0,
        tokensOut: 0,
        costEur: 0,
      });
      ps.count++;
      if (cached) ps.cacheHits++;
      if (provider === 'none') ps.errorCount++;
      if (!cached && latency > 0) ps.latencies.push(latency);
      ps.tokensIn += tokensIn;
      ps.tokensOut += tokensOut;
      ps.costEur += cost;

      const ts = (byType[type] ??= { count: 0, cacheHits: 0, sumLatencyMs: 0, costEur: 0 });
      ts.count++;
      if (cached) ts.cacheHits++;
      ts.sumLatencyMs += latency;
      ts.costEur += cost;
    });

    // Compactar byProvider: p50/p95/p99, sin arrays crudos (ahorra Firestore).
    const byProviderOut: Record<
      string,
      {
        count: number;
        errorRate: number;
        cacheHits: number;
        p50Ms: number;
        p95Ms: number;
        p99Ms: number;
        tokensIn: number;
        tokensOut: number;
        costEur: number;
      }
    > = {};
    for (const [name, s] of Object.entries(byProvider)) {
      const sorted = s.latencies.slice().sort((a, b) => a - b);
      byProviderOut[name] = {
        count: s.count,
        errorRate: s.count > 0 ? +(s.errorCount / s.count).toFixed(4) : 0,
        cacheHits: s.cacheHits,
        p50Ms: percentile(sorted, 50),
        p95Ms: percentile(sorted, 95),
        p99Ms: percentile(sorted, 99),
        tokensIn: s.tokensIn,
        tokensOut: s.tokensOut,
        costEur: +s.costEur.toFixed(6),
      };
    }

    const byTypeOut: Record<
      string,
      { count: number; avgLatencyMs: number; cacheHits: number; costEur: number }
    > = {};
    for (const [name, s] of Object.entries(byType)) {
      byTypeOut[name] = {
        count: s.count,
        avgLatencyMs: s.count > 0 ? Math.round(s.sumLatencyMs / s.count) : 0,
        cacheHits: s.cacheHits,
        costEur: +s.costEur.toFixed(6),
      };
    }

    const docId = `daily-${dayKey}`;
    await db.collection('metrics_snapshots').doc(docId).set({
      day: dayKey,
      kind: 'daily',
      total,
      cacheHitRate: total > 0 ? +(totalCacheHits / total).toFixed(4) : 0,
      uniqueUsers: userSet.size,
      totalCostEur: +totalCostEur.toFixed(6),
      byProvider: byProviderOut,
      byType: byTypeOut,
      generatedAt: FieldValue.serverTimestamp(),
    });

    logger.info('aggregateDailyMetrics.ok', {
      day: dayKey,
      total,
      uniqueUsers: userSet.size,
      totalCostEur: +totalCostEur.toFixed(4),
      providers: Object.keys(byProviderOut),
    });
  },
);
