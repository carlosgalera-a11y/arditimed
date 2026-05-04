import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchSemanticScholar, enrichTldrs } from '../src/evidencia/semanticScholar';

afterEach(() => vi.restoreAllMocks());

const sample = {
  paperId: 'abc',
  externalIds: { DOI: '10.1/x', PubMed: '99999' },
  title: 'A Paper',
  abstract: 'lorem',
  tldr: { text: 'TL;DR de una frase del paper.' },
  authors: [{ name: 'Smith J' }],
  venue: 'NEJM',
  year: 2025,
  publicationTypes: ['JournalArticle', 'Review'],
  openAccessPdf: { url: 'https://oa/x.pdf' },
  citationCount: 42,
};

describe('semanticScholar.searchSemanticScholar', () => {
  it('mapea papers correctamente', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: [sample] }), { status: 200 }),
    );
    const out = await searchSemanticScholar('apixaban');
    expect(out).toHaveLength(1);
    const p = out[0];
    expect(p?.doi).toBe('10.1/x');
    expect(p?.pmid).toBe('99999');
    expect(p?.tldr).toMatch(/TL;DR/);
    expect(p?.is_open_access).toBe(true);
    expect(p?.cited_by_count).toBe(42);
    expect(p?.source).toBe('s2');
  });

  it('devuelve [] si HTTP no-ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('rate limit', { status: 429 }));
    const out = await searchSemanticScholar('q');
    expect(out).toEqual([]);
  });

  it('manda x-api-key cuando se proporciona', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), { status: 200 }),
    );
    await searchSemanticScholar('q', { apiKey: 'KEY123' });
    const init = spy.mock.calls[0]?.[1] as RequestInit | undefined;
    const headers = init?.headers as Record<string, string> | undefined;
    expect(headers?.['x-api-key']).toBe('KEY123');
  });

  it('descarta papers sin título', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: [{ ...sample, title: '' }, sample] }), { status: 200 }),
    );
    const out = await searchSemanticScholar('q');
    expect(out).toHaveLength(1);
  });
});

describe('semanticScholar.enrichTldrs', () => {
  it('devuelve maps vacíos si no hay ids', async () => {
    const out = await enrichTldrs({ dois: [], pmids: [] });
    expect(out.tldrByDoi.size).toBe(0);
    expect(out.tldrByPmid.size).toBe(0);
  });

  it('parsea respuesta batch y construye maps por DOI/PMID', async () => {
    const batchResp = [
      { externalIds: { DOI: '10.1/A' }, tldr: { text: 'TL A' } },
      { externalIds: { PubMed: '12345' }, tldr: { text: 'TL B' } },
      null, // S2 a veces devuelve nulls
      { externalIds: { DOI: '10.1/C' }, tldr: null }, // sin tldr → ignorado
    ];
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(batchResp), { status: 200 }),
    );
    const out = await enrichTldrs({ dois: ['10.1/A', '10.1/C'], pmids: ['12345'] });
    expect(out.tldrByDoi.get('10.1/a')).toBe('TL A');
    expect(out.tldrByPmid.get('12345')).toBe('TL B');
    expect(out.tldrByDoi.has('10.1/c')).toBe(false);
  });

  it('silencia errores HTTP', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('err', { status: 500 }));
    const out = await enrichTldrs({ dois: ['10.1/x'], pmids: [] });
    expect(out.tldrByDoi.size).toBe(0);
  });
});
