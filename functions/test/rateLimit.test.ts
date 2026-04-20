import { describe, expect, it, vi } from 'vitest';
import { checkIpRateLimit, MAX_PER_MIN } from '../src/rateLimit';

function makeDb(initialCount: number | null) {
  const setMock = vi.fn();
  const updateMock = vi.fn();
  const getMock = vi.fn().mockResolvedValue({
    exists: initialCount !== null,
    data: () => (initialCount === null ? undefined : { count: initialCount }),
  });
  const ref = { get: getMock, set: setMock, update: updateMock };
  const db = {
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue(ref),
    }),
    runTransaction: vi.fn().mockImplementation(async (cb: (tx: any) => Promise<any>) => {
      const tx = {
        get: (r: any) => r.get(),
        set: (r: any, payload: any) => r.set(payload),
        update: (r: any, payload: any) => r.update(payload),
      };
      return await cb(tx);
    }),
  } as any;
  return { db, setMock, updateMock };
}

describe('checkIpRateLimit', () => {
  it('pasa si el bucket está vacío', async () => {
    const { db, setMock } = makeDb(null);
    await expect(checkIpRateLimit(db, '1.2.3.4')).resolves.toBeUndefined();
    expect(setMock).toHaveBeenCalled();
  });

  it('pasa y incrementa por debajo del límite', async () => {
    const { db, updateMock } = makeDb(10);
    await expect(checkIpRateLimit(db, '1.2.3.4')).resolves.toBeUndefined();
    expect(updateMock).toHaveBeenCalled();
  });

  it('bloquea cuando el bucket >= MAX_PER_MIN', async () => {
    const { db } = makeDb(MAX_PER_MIN);
    await expect(checkIpRateLimit(db, '1.2.3.4')).rejects.toMatchObject({
      code: 'resource-exhausted',
    });
  });

  it('sanitiza IPs extrañas', async () => {
    const { db } = makeDb(null);
    // IPs con caracteres raros se normalizan; no debe lanzar.
    await expect(checkIpRateLimit(db, '!@#$%^')).resolves.toBeUndefined();
  });
});
