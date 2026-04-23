import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getApp } from 'firebase-admin/app';
import { logger } from 'firebase-functions/v2';

import { buildProviderChain, tryProviderChain } from './routing';
import type { AiType } from './types';

const REGION = 'europe-west1';
const TZ = 'Europe/Madrid';
const EVAL_TIMEOUT_MS = 60000;

const DEEPSEEK_API_KEY = defineSecret('DEEPSEEK_API_KEY');
const OPENROUTER_API_KEY = defineSecret('OPENROUTER_API_KEY');

/**
 * Evaluación continua con casos gold-standard · EU AI Act art. 15
 * (accuracy & robustness).
 *
 * Cron mensual (día 1, 04:00 Madrid) que ejecuta la cadena de IA
 * contra un conjunto de casos con respuesta conocida y mide:
 *   - acierto textual (substring / regex)
 *   - latencia
 *   - tasa de error
 *
 * Los casos gold-standard viven en Firestore:
 *   eval_goldstandard/{caseId}
 *     {
 *       type: 'clinical_case' | 'educational' | 'vision',
 *       systemPrompt: '…',
 *       userPrompt: '…',
 *       imageBase64?: '…',      // solo para vision
 *       expectedContains: ['string1', 'string2'],   // todos deben aparecer
 *       expectedForbidden: ['string a evitar'],     // NINGUNO debe aparecer
 *       specialty: 'cardio' | 'respiratorio' | …,
 *       severityIfFail: 'high'|'medium'|'low'
 *     }
 *
 * Resultado en `eval_results/{YYYY-MM-DD}`:
 *   { month, total, passed, failed, avgLatencyMs, results: [...], status: 'ok'|'degraded'|'fail' }
 *
 * Alerta: si <80% pasa, logger.error + status='fail' → pipeline de
 * alertas externo (Sentry/email) debe leer y notificar.
 *
 * NOTA: el dataset inicial se rellena manualmente por el autor en
 * Firestore Console (10 casos mínimo). Ver docs/legal/gold-standard-dataset.md
 */
export const goldStandardEval = onSchedule(
  {
    region: REGION,
    schedule: '0 4 1 * *', // día 1 de cada mes 04:00
    timeZone: TZ,
    secrets: [DEEPSEEK_API_KEY, OPENROUTER_API_KEY],
    memory: '1GiB',
    timeoutSeconds: 540,
  },
  async () => {
    const db = getFirestore(getApp());
    const monthKey = new Date().toISOString().substring(0, 7); // YYYY-MM

    const casesSnap = await db.collection('eval_goldstandard').get();
    if (casesSnap.empty) {
      logger.warn('goldStandardEval.empty', { month: monthKey, hint: 'populate eval_goldstandard collection' });
      await db.collection('eval_results').doc(monthKey).set({
        month: monthKey,
        total: 0,
        passed: 0,
        failed: 0,
        status: 'empty',
        generatedAt: FieldValue.serverTimestamp(),
        note: 'Dataset vacío. Rellenar eval_goldstandard manualmente.',
      });
      return;
    }

    const results: Array<{
      caseId: string;
      type: string;
      specialty?: string;
      passed: boolean;
      latencyMs: number;
      provider?: string;
      model?: string;
      missing?: string[];
      forbidden?: string[];
      error?: string;
    }> = [];
    let totalLat = 0;

    for (const doc of casesSnap.docs) {
      const c = doc.data() as {
        type?: string;
        systemPrompt?: string;
        userPrompt?: string;
        imageBase64?: string;
        expectedContains?: string[];
        expectedForbidden?: string[];
        specialty?: string;
        severityIfFail?: string;
      };
      const start = Date.now();
      if (!c.type || !c.userPrompt) {
        results.push({ caseId: doc.id, type: c.type || 'unknown', passed: false, latencyMs: 0, error: 'missing type/userPrompt' });
        continue;
      }
      try {
        const chain = buildProviderChain({
          type: c.type as AiType,
          userPrompt: c.userPrompt,
          systemPrompt: c.systemPrompt || '',
          imageBase64: c.imageBase64,
          secrets: {
            deepseekKey: DEEPSEEK_API_KEY.value(),
            openrouterKey: OPENROUTER_API_KEY.value(),
          },
        });
        const r = (await Promise.race([
          tryProviderChain(chain),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error('eval timeout')), EVAL_TIMEOUT_MS)),
        ])) as { provider: string; result: { model: string; text: string } };
        const latency = Date.now() - start;
        totalLat += latency;
        const text = (r.result.text || '').toLowerCase();

        const missing: string[] = [];
        (c.expectedContains || []).forEach((exp) => {
          if (!text.includes(exp.toLowerCase())) missing.push(exp);
        });
        const forbidden: string[] = [];
        (c.expectedForbidden || []).forEach((forb) => {
          if (text.includes(forb.toLowerCase())) forbidden.push(forb);
        });
        const passed = missing.length === 0 && forbidden.length === 0;
        results.push({
          caseId: doc.id,
          type: c.type,
          specialty: c.specialty,
          passed,
          latencyMs: latency,
          provider: r.provider,
          model: r.result.model,
          missing: missing.length ? missing : undefined,
          forbidden: forbidden.length ? forbidden : undefined,
        });
      } catch (e) {
        results.push({
          caseId: doc.id,
          type: c.type,
          specialty: c.specialty,
          passed: false,
          latencyMs: Date.now() - start,
          error: (e as Error).message.slice(0, 200),
        });
      }
    }

    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const failed = total - passed;
    const passRate = total ? passed / total : 0;
    const status = passRate >= 0.8 ? 'ok' : passRate >= 0.6 ? 'degraded' : 'fail';

    await db.collection('eval_results').doc(monthKey).set({
      month: monthKey,
      total,
      passed,
      failed,
      passRate: +passRate.toFixed(4),
      avgLatencyMs: total ? Math.round(totalLat / total) : 0,
      status,
      results,
      generatedAt: FieldValue.serverTimestamp(),
    });

    if (status !== 'ok') {
      logger.error('goldStandardEval.DEGRADED', { month: monthKey, status, passRate, passed, failed });
    } else {
      logger.info('goldStandardEval.ok', { month: monthKey, passRate, total });
    }
  },
);
