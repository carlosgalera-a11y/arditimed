import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchCore } from '../src/evidencia/core';

afterEach(() => vi.restoreAllMocks());

const sample = {
  id: 12345,
  doi: '10.1/oa-paper',
  title: 'Open Access Apixaban RCT',
  abstract: 'A large RCT on apixaban vs warfarin.',
  authors: [{ name: 'Smith J' }, { name: 'Doe A' }],
  yearPublished: 2024,
  publisher: 'European Heart Journal',
  documentType: 'research',
  language: { code: 'eng', name: 'English' },
  links: [{ url: 'https://repo/paper', type: 'display' }],
  downloadUrl: 'https://repo/paper.pdf',
  identifiers: ['pmid:12345678', 'oai:repo:1'],
};

describe('core.searchCore', () => {
  it('devuelve [] silenciosamente si no hay apiKey', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const out = await searchCore('apixaban', { apiKey: '' });
    expect(out).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('mapea correctamente un work típico', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ results: [sample] }), { status: 200 }),
    );
    const out = await searchCore('apixaban', { apiKey: 'k' });
    expect(out).toHaveLength(1);
    const w = out[0];
    expect(w?.doi).toBe('10.1/oa-paper');
    expect(w?.pmid).toBe('12345678');
    expect(w?.year).toBe(2024);
    expect(w?.is_open_access).toBe(true);
    expect(w?.full_text_url).toBe('https://repo/paper.pdf');
    expect(w?.download_url).toBe('https://repo/paper.pdf');
    expect(w?.source).toBe('core');
  });

  it('descarta works sin título', async () => {
    const broken = { ...sample, title: '' };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ results: [broken, sample] }), { status: 200 }),
    );
    const out = await searchCore('q', { apiKey: 'k' });
    expect(out).toHaveLength(1);
  });

  it('devuelve [] si HTTP no-ok (no propaga error)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('boom', { status: 500 }));
    const out = await searchCore('q', { apiKey: 'k' });
    expect(out).toEqual([]);
  });

  it('devuelve [] si fetch lanza', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('net'));
    const out = await searchCore('q', { apiKey: 'k' });
    expect(out).toEqual([]);
  });

  it('incluye filtro yearPublished cuando dateFrom está', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ results: [] }), { status: 200 }),
    );
    await searchCore('apixaban', { apiKey: 'k', dateFrom: 2020 });
    const call = spy.mock.calls[0];
    const init = call?.[1] as RequestInit | undefined;
    const body = init && typeof init.body === 'string' ? init.body : '';
    expect(body).toMatch(/yearPublished>=2020/);
  });
});
