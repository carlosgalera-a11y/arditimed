import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getApp } from 'firebase-admin/app';
import { logger } from 'firebase-functions/v2';

import { buildProviderChain } from './routing';

const REGION = 'europe-west1';
const TZ = 'Europe/Madrid';

const DEEPSEEK_API_KEY = defineSecret('DEEPSEEK_API_KEY');
const OPENROUTER_API_KEY = defineSecret('OPENROUTER_API_KEY');

const TRIVIAL_PROMPT = 'Responde solo con la palabra OK. Nada más.';
const HEALTH_TIMEOUT_MS = 25000;

type HealthResult = {
  provider: string;
  model: string;
  ok: boolean;
  latencyMs: number;
  error?: string;
};

async function pingProvider(chain: ReturnType<typeof buildProviderChain>, idx: number): Promise<HealthResult> {
  const link = chain[idx];
  if (!link) return { provider: 'none', model: 'none', ok: false, latencyMs: 0, error: 'provider not in chain' };
  const start = Date.now();
  try {
    const withTimeout = <T,>(p: Promise<T>, ms: number) =>
      Promise.race([
        p,
        new Promise<T>((_, rej) => setTimeout(() => rej(new Error('healthcheck timeout')), ms)),
      ]);
    const result = await withTimeout(link.execute(), HEALTH_TIMEOUT_MS);
    return {
      provider: link.name,
      model: result.model || link.model,
      ok: Boolean(result.text && result.text.length > 0),
      latencyMs: Date.now() - start,
    };
  } catch (e) {
    return {
      provider: link.name,
      model: link.model,
      ok: false,
      latencyMs: Date.now() - start,
      error: (e as Error).message.slice(0, 200),
    };
  }
}

/**
 * healthCheckAi — cron diario 06:00 Madrid.
 *
 * Hace un ping trivial a cada primer proveedor de cada cadena (educational,
 * clinical_case y vision — vision sin imagen, asume que la implementación
 * acepta texto puro o lo rechaza graciosamente). Escribe el resultado en
 * `healthchecks/{YYYY-MM-DD}`.
 *
 * Objetivo: detectar degradación antes de que lo reporte un clínico en
 * guardia. El panel SLA y /status.html pueden leer este doc.
 *
 * No consume cuota de usuario (no hay uid), solo el coste de 3 llamadas
 * triviales por día (<0.01 € estimados).
 */
export const healthCheckAi = onSchedule(
  {
    region: REGION,
    schedule: 'every day 06:00',
    timeZone: TZ,
    secrets: [DEEPSEEK_API_KEY, OPENROUTER_API_KEY],
    memory: '256MiB',
    timeoutSeconds: 120,
  },
  async () => {
    const db = getFirestore(getApp());
    const today = new Date().toISOString().substring(0, 10);

    const results: HealthResult[] = [];
    const types: Array<'educational' | 'clinical_case'> = ['educational', 'clinical_case'];

    for (const type of types) {
      try {
        const chain = buildProviderChain({
          type,
          userPrompt: TRIVIAL_PROMPT,
          systemPrompt: 'Eres un asistente que solo responde la palabra OK.',
          secrets: {
            deepseekKey: DEEPSEEK_API_KEY.value(),
            openrouterKey: OPENROUTER_API_KEY.value(),
          },
        });
        // Ping primer proveedor de la cadena (primary).
        const r = await pingProvider(chain, 0);
        results.push({ ...r, model: `[${type}] ${r.model}` });
      } catch (e) {
        results.push({
          provider: 'buildchain',
          model: `[${type}] chain-build-failed`,
          ok: false,
          latencyMs: 0,
          error: (e as Error).message,
        });
      }
    }

    const okCount = results.filter((r) => r.ok).length;
    const allOk = okCount === results.length;
    const someOk = okCount > 0;
    const status = allOk ? 'ok' : someOk ? 'degraded' : 'down';

    await db
      .collection('healthchecks')
      .doc(today)
      .set({
        day: today,
        status,
        checkedAt: FieldValue.serverTimestamp(),
        results,
        summary: {
          total: results.length,
          ok: okCount,
          errorRate: results.length ? +(1 - okCount / results.length).toFixed(4) : 0,
          avgLatencyMs: results.length
            ? Math.round(results.reduce((a, r) => a + r.latencyMs, 0) / results.length)
            : 0,
        },
      });

    logger.info('healthCheckAi.ok', { day: today, status, okCount, total: results.length });
    if (!allOk) {
      logger.warn('healthCheckAi.DEGRADED', { day: today, results });
    }
  },
);
