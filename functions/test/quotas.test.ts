import { describe, expect, it, vi } from 'vitest';
import { consumeQuota, todayKey, DEFAULT_DAILY_LIMIT, ADMIN_DAILY_LIMIT } from '../src/quotas';

describe('todayKey', () => {
  it('devuelve YYYY-MM-DD UTC', () => {
    expect(todayKey(new Date('2026-04-21T23:59:00Z'))).toBe('2026-04-21');
    expect(todayKey(new Date('2026-04-22T00:00:00Z'))).toBe('2026-04-22');
  });
});

function makeFirestore(initialCount: number | null) {
  const updateMock = vi.fn();
  const setMock = vi.fn();
  const getMock = vi.fn().mockResolvedValue({
    exists: initialCount !== null,
    data: () => (initialCount === null ? undefined : { count: initialCount }),
  });
  const ref = { get: getMock, update: updateMock, set: setMock };
  const db = {
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue({
          doc: vi.fn().mockReturnValue(ref),
        }),
      }),
    }),
    runTransaction: vi.fn().mockImplementation(async (cb: (tx: any) => Promise<any>) => {
      const tx = {
        get: (r: any) => r.get(),
        update: (r: any, payload: any) => r.update(payload),
        set: (r: any, payload: any) => r.set(payload),
      };
      return await cb(tx);
    }),
  } as any;
  return { db, updateMock, setMock };
}

describe('consumeQuota', () => {
  it('crea el doc en la primera llamada del día', async () => {
    const { db, setMock } = makeFirestore(null);
    const r = await consumeQuota(db, 'uid1', false);
    expect(r.count).toBe(1);
    expect(r.limit).toBe(DEFAULT_DAILY_LIMIT);
    expect(setMock).toHaveBeenCalled();
    expect(setMock.mock.calls[0][0].count).toBe(1);
  });

  it('incrementa cuando el doc existe y hay margen', async () => {
    const { db, updateMock } = makeFirestore(10);
    const r = await consumeQuota(db, 'uid1', false);
    expect(r.count).toBe(11);
    expect(r.limit).toBe(DEFAULT_DAILY_LIMIT);
    expect(updateMock).toHaveBeenCalled();
  });

  it('throws resource-exhausted cuando count >= limit (usuario normal)', async () => {
    const { db } = makeFirestore(DEFAULT_DAILY_LIMIT);
    await expect(consumeQuota(db, 'uid1', false)).rejects.toMatchObject({
      code: 'resource-exhausted',
    });
  });

  it('admin tiene límite 200', async () => {
    const { db } = makeFirestore(50);
    const r = await consumeQuota(db, 'uid-admin', true);
    expect(r.limit).toBe(ADMIN_DAILY_LIMIT);
  });

  it('admin al borde', async () => {
    const { db } = makeFirestore(ADMIN_DAILY_LIMIT);
    await expect(consumeQuota(db, 'uid-admin', true)).rejects.toMatchObject({
      code: 'resource-exhausted',
    });
  });
});
