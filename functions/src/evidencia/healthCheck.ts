// ══════════════════════════════════════════════════════════════════════
// EvidenciaIA · cron healthcheck (PubMed + Europe PMC + OpenAlex + AEMPS)
// ══════════════════════════════════════════════════════════════════════
// Cron diario 06:30 Madrid. Hace una búsqueda trivial a cada uno de los
// 4 proveedores biomédicos y deja el resultado en
// /healthchecks/evidencia-{YYYY-MM-DD}. Si algún proveedor falla > 2
// días seguidos, conviene mirar el log + Sentry. La página /status.html
// puede leer este doc para mostrar el estado en vivo.
// ══════════════════════════════════════════════════════════════════════

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getApp } from 'firebase-admin/app';
import { logger } from 'firebase-functions/v2';

import { searchPubmed } from './pubmed';
import { searchEuropePMC } from './europepmc';
import { searchOpenAlex } from './openalex';
import { searchAemps } from './aemps';

const REGION = 'europe-west1';
const TZ = 'Europe/Madrid';
const NCBI_API_KEY = defineSecret('NCBI_API_KEY');

// Query trivial para el ping (alta probabilidad de devolver resultados
// en cualquier proveedor médico).
const PING_QUERY = 'hypertension treatment';
const PING_DRUG = 'paracetamol';
const TIMEOUT_MS = 12000;

interface ProviderHealth {
  provider: string;
  ok: boolean;
  count: number;
  latency_ms: number;
  error?: string;
}

async function ping<T>(name: string, fn: () => Promise<T[]>): Promise<ProviderHealth> {
  const start = Date.now();
  try {
    const out = await fn();
    return { provider: name, ok: out.length > 0, count: out.length, latency_ms: Date.now() - start };
  } catch (e) {
    return {
      provider: name,
      ok: false,
      count: 0,
      latency_ms: Date.now() - start,
      error: (e as Error).message.slice(0, 200),
    };
  }
}

export const evidenciaHealthCheck = onSchedule(
  {
    schedule: '30 6 * * *',
    timeZone: TZ,
    region: REGION,
    secrets: [NCBI_API_KEY],
    timeoutSeconds: 120,
    memory: '256MiB',
    retryCount: 0,
  },
  async () => {
    const ncbiKey = (() => {
      try {
        return NCBI_API_KEY.value();
      } catch {
        return undefined;
      }
    })();

    const [pubmed, epmc, openalex, aemps] = await Promise.all([
      ping('pubmed', () =>
        searchPubmed(PING_QUERY, { maxResults: 3, apiKey: ncbiKey || undefined, timeoutMs: TIMEOUT_MS }),
      ),
      ping('europepmc', () =>
        searchEuropePMC(PING_QUERY, { pageSize: 3, timeoutMs: TIMEOUT_MS }),
      ),
      ping('openalex', () =>
        searchOpenAlex(PING_QUERY, { perPage: 3, timeoutMs: TIMEOUT_MS }),
      ),
      ping('aemps', () => searchAemps(PING_DRUG, { pageSize: 3, timeoutMs: TIMEOUT_MS })),
    ]);

    const results = [pubmed, epmc, openalex, aemps];
    const allOk = results.every((r) => r.ok);
    const day = new Date().toISOString().slice(0, 10);
    const docId = `evidencia-${day}`;

    const db = getFirestore(getApp());
    await db.collection('healthchecks').doc(docId).set({
      kind: 'evidencia',
      day,
      providers: results,
      all_ok: allOk,
      timestamp: FieldValue.serverTimestamp(),
    });

    logger.info('evidenciaHealthCheck.done', {
      day,
      all_ok: allOk,
      summary: results.map((r) => `${r.provider}=${r.ok ? 'ok' : 'FAIL'}(${r.latency_ms}ms)`).join(' '),
    });

    if (!allOk) {
      // No tirar la cron — el log queda en Cloud Logging y se ve en
      // Sentry/Cloud Monitoring si tienen alerta sobre este nivel.
      logger.warn('evidenciaHealthCheck.degraded', {
        failures: results.filter((r) => !r.ok).map((r) => `${r.provider}: ${r.error || 'empty'}`),
      });
    }
  },
);
