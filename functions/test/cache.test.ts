import { describe, expect, it, vi } from 'vitest';
import { hashKey, getCached, setCached, CACHE_TTL_MS } from '../src/cache';

describe('hashKey', () => {
  it('es determinístico', () => {
    const a = hashKey('educational', 'p', 's', 'deepseek-chat');
    const b = hashKey('educational', 'p', 's', 'deepseek-chat');
    expect(a).toBe(b);
  });

  it('diferencia si cambia cualquier input', () => {
    const base = hashKey('educational', 'p', 's', 'deepseek-chat');
    expect(hashKey('clinical_case', 'p', 's', 'deepseek-chat')).not.toBe(base);
    expect(hashKey('educational', 'p2', 's', 'deepseek-chat')).not.toBe(base);
    expect(hashKey('educational', 'p', 's2', 'deepseek-chat')).not.toBe(base);
    expect(hashKey('educational', 'p', 's', 'gemini-2.5-flash-lite')).not.toBe(base);
  });

  it('devuelve 64 hex chars (sha256)', () => {
    const h = hashKey('educational', 'p', 's', 'deepseek-chat');
    expect(h).toMatch(/^[a-f0-9]{64}$/);
  });
});

function makeMockDb(docData: unknown, exists = true) {
  return {
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists,
          data: () => docData,
        }),
        set: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  };
}

describe('getCached', () => {
  it('devuelve null si no existe', async () => {
    const db = makeMockDb(undefined, false) as any;
    const r = await getCached(db, 'somehash');
    expect(r).toBeNull();
  });

  it('devuelve el doc si existe y no expiró', async () => {
    const now = new Date('2026-04-21T10:00:00Z');
    const future = new Date(now.getTime() + 1000);
    const db = makeMockDb({
      text: 'cached result',
      provider: 'gemini',
      expiresAt: { toMillis: () => future.getTime() },
    }) as any;
    const r = await getCached(db, 'h', now);
    expect(r).toMatchObject({ text: 'cached result', provider: 'gemini' });
  });

  it('devuelve null si está expirado', async () => {
    const now = new Date('2026-04-21T10:00:00Z');
    const past = new Date(now.getTime() - 1000);
    const db = makeMockDb({
      text: 'stale',
      expiresAt: { toMillis: () => past.getTime() },
    }) as any;
    expect(await getCached(db, 'h', now)).toBeNull();
  });
});

describe('setCached', () => {
  it('escribe con expiresAt = now + 7 días', async () => {
    const setMock = vi.fn().mockResolvedValue(undefined);
    const db = {
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({ set: setMock }),
      }),
    } as any;
    const now = new Date('2026-04-21T10:00:00Z');
    await setCached(db, 'hash1', 'gemini', { text: 'hello', model: 'x', tokensIn: 10, tokensOut: 5 }, now);
    expect(setMock).toHaveBeenCalledOnce();
    const payload = setMock.mock.calls[0][0] as any;
    expect(payload.hash).toBe('hash1');
    expect(payload.provider).toBe('gemini');
    expect(payload.text).toBe('hello');
    expect(payload.tokensIn).toBe(10);
    expect(payload.expiresAt.getTime()).toBe(now.getTime() + CACHE_TTL_MS);
  });
});
