import { describe, expect, it, vi } from 'vitest';

// Mock firebase-functions/v2 logger antes de importar el módulo bajo test.
vi.mock('firebase-functions/v2', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import { estimateCostEur, logAiCall, logSecurityEvent } from '../src/logging';
import { logger } from 'firebase-functions/v2';

describe('estimateCostEur', () => {
  it('devuelve 0 para modelos no tabulados', () => {
    expect(estimateCostEur('modelo-desconocido', 1000, 1000)).toBe(0);
  });

  it('calcula aprox deepseek 1k in + 1k out', () => {
    // 0.00025 + 0.001 = 0.00125 eur
    expect(estimateCostEur('deepseek-chat', 1000, 1000)).toBeCloseTo(0.0013, 4);
  });

  it('redondea a 4 decimales (máx)', () => {
    const c = estimateCostEur('gemini-2.5-flash-lite', 1234, 5678);
    // No más de 4 decimales significativos.
    const str = c.toString();
    const dot = str.indexOf('.');
    if (dot !== -1) expect(str.length - dot - 1).toBeLessThanOrEqual(4);
    // y es positivo y finito
    expect(c).toBeGreaterThan(0);
    expect(Number.isFinite(c)).toBe(true);
  });
});

describe('logAiCall', () => {
  it('emite info log con metadatos y NO con texto del prompt', () => {
    const entry = logAiCall({
      uid: 'u1',
      type: 'educational',
      provider: 'deepseek',
      model: 'deepseek-chat',
      latencyMs: 123,
      cacheHit: false,
      tokensIn: 100,
      tokensOut: 50,
      promptHash: 'abcd1234hash',
    });
    expect(entry.uid).toBe('u1');
    expect(entry.provider).toBe('deepseek');
    expect(entry.costEstimateEur).toBeGreaterThan(0);
    expect(logger.info).toHaveBeenCalled();
    const loggedPayload = (logger.info as any).mock.calls.at(-1)?.[1];
    // El payload solo debe tener metadatos — campos permitidos:
    const allowed = [
      'uid', 'type', 'provider', 'model', 'latencyMs',
      'cacheHit', 'tokensIn', 'tokensOut', 'costEstimateEur', 'promptHash',
    ];
    expect(Object.keys(loggedPayload as object).sort()).toEqual([...allowed].sort());
    // Ni "text" ni "response" deben aparecer.
    expect((loggedPayload as Record<string, unknown>).text).toBeUndefined();
    expect((loggedPayload as Record<string, unknown>).response).toBeUndefined();
  });

  it('emite warn cuando hay error', () => {
    logAiCall({
      uid: 'u1',
      type: 'vision',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      latencyMs: 0,
      cacheHit: false,
      tokensIn: 0,
      tokensOut: 0,
      promptHash: 'h',
      error: 'timeout',
    });
    expect(logger.warn).toHaveBeenCalled();
  });
});

describe('logSecurityEvent', () => {
  it('emite warn con evento y detalles', () => {
    logSecurityEvent('uid-test', 'prompt_rejected', { reason: 'DNI detectado' });
    expect(logger.warn).toHaveBeenCalled();
  });
});
