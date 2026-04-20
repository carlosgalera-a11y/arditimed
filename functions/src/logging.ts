import { logger } from 'firebase-functions/v2';
import type { AiRequestLog, AiType } from './types';

/**
 * Logger estructurado.
 * **NUNCA** loguea el texto del prompt ni de la respuesta — solo metadatos y hash.
 */

interface LogArgs {
  uid: string;
  type: AiType;
  provider: string;
  model: string;
  latencyMs: number;
  cacheHit: boolean;
  tokensIn: number;
  tokensOut: number;
  promptHash: string;
  error?: string;
}

const COST_PER_1K: Record<string, { in: number; out: number }> = {
  // EUR por 1k tokens. Cifras aproximadas, actualizar periódicamente.
  'gemini-2.5-flash-lite': { in: 0.00010, out: 0.00040 },
  'gemini-2.5-flash': { in: 0.00030, out: 0.00250 },
  'deepseek-chat': { in: 0.00025, out: 0.00100 },
  'mistral-small-latest': { in: 0.00020, out: 0.00060 },
  'qwen-vl-max': { in: 0.00180, out: 0.00540 },
};

export function estimateCostEur(model: string, tokensIn: number, tokensOut: number): number {
  const rate = COST_PER_1K[model] ?? { in: 0, out: 0 };
  const cost = (tokensIn / 1000) * rate.in + (tokensOut / 1000) * rate.out;
  return Math.round(cost * 10000) / 10000; // 4 decimales
}

export function logAiCall(args: LogArgs): AiRequestLog {
  const costEstimateEur = estimateCostEur(args.model, args.tokensIn, args.tokensOut);
  const entry = {
    uid: args.uid,
    type: args.type,
    provider: args.provider,
    model: args.model,
    latencyMs: args.latencyMs,
    cacheHit: args.cacheHit,
    tokensIn: args.tokensIn,
    tokensOut: args.tokensOut,
    costEstimateEur,
    promptHash: args.promptHash,
  };
  if (args.error) {
    logger.warn('askAi.call', { ...entry, error: args.error });
  } else {
    logger.info('askAi.call', entry);
  }
  return { ...entry, createdAt: null as unknown as FirebaseFirestore.Timestamp };
}

export function logSecurityEvent(uid: string | null, event: string, details: Record<string, unknown>): void {
  logger.warn('askAi.security', { uid, event, ...details });
}
