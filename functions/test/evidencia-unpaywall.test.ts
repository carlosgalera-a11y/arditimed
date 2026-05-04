import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveOneDoi, resolveManyDois } from '../src/evidencia/unpaywall';

afterEach(() => vi.restoreAllMocks());

describe('unpaywall.resolveOneDoi', () => {
  it('devuelve OAResolution con OA detectado', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          doi: '10.1234/foo',
          is_oa: true,
          best_oa_location: {
            url: 'https://repo/foo.pdf',
            url_for_pdf: 'https://repo/foo.pdf',
            license: 'cc-by',
            host_type: 'repository',
            version: 'publishedVersion',
          },
        }),
        { status: 200 },
      ),
    );
    const r = await resolveOneDoi('10.1234/foo');
    expect(r).not.toBeNull();
    expect(r?.is_oa).toBe(true);
    expect(r?.oa_url).toBe('https://repo/foo.pdf');
    expect(r?.license).toBe('cc-by');
  });

  it('limpia prefijo https://doi.org/', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ doi: '10.1/x', is_oa: false, best_oa_location: null }), { status: 200 }),
    );
    await resolveOneDoi('https://doi.org/10.1/x');
    const url = String(fetchSpy.mock.calls[0]?.[0] ?? '');
    expect(url).toMatch(/\/v2\/10\.1%2Fx/);
  });

  it('devuelve null en 404 (DOI desconocido)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('not found', { status: 404 }));
    const r = await resolveOneDoi('10.x/missing');
    expect(r).toBeNull();
  });

  it('devuelve null si fetch lanza', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'));
    const r = await resolveOneDoi('10.x/err');
    expect(r).toBeNull();
  });

  it('devuelve null si DOI vacío', async () => {
    const r = await resolveOneDoi('');
    expect(r).toBeNull();
  });
});

describe('unpaywall.resolveManyDois', () => {
  it('solo devuelve DOIs con OA real', async () => {
    let i = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      i++;
      if (i === 1) {
        return new Response(
          JSON.stringify({
            is_oa: true,
            best_oa_location: { url: 'https://oa/1.pdf' },
          }),
          { status: 200 },
        );
      }
      // los demás: closed
      return new Response(JSON.stringify({ is_oa: false, best_oa_location: null }), { status: 200 });
    });
    const out = await resolveManyDois(['10.1/a', '10.1/b', '10.1/c'], { concurrency: 2 });
    expect(out.size).toBe(1);
    expect(out.get('10.1/a')?.oa_url).toBe('https://oa/1.pdf');
  });

  it('deduplica DOIs antes de pedir', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ is_oa: false, best_oa_location: null }), { status: 200 }),
    );
    await resolveManyDois(['10.1/a', '10.1/a', '10.1/a'], { concurrency: 4 });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('respeta presupuesto total', async () => {
    // Si un fetch tarda más que el budget, debería abortar y devolver Map vacío.
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(new Response('{}')), 200)),
    );
    const out = await resolveManyDois(['10.1/a', '10.1/b', '10.1/c'], {
      concurrency: 1,
      perRequestTimeoutMs: 50,
      totalBudgetMs: 100,
    });
    expect(out.size).toBe(0);
  });
});
