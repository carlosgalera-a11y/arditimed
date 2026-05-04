import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCrossrefMeta, enrichCrossref } from '../src/evidencia/crossref';

afterEach(() => vi.restoreAllMocks());

const sampleMessage = {
  message: {
    DOI: '10.1/x',
    publisher: 'Elsevier',
    type: 'journal-article',
    'is-referenced-by-count': 17,
    license: [{ URL: 'https://creativecommons.org/licenses/by/4.0/' }],
    resource: { primary: { URL: 'https://publisher/article/123' } },
  },
};

describe('crossref.getCrossrefMeta', () => {
  it('mapea CC-BY como "CC BY"', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(sampleMessage), { status: 200 }),
    );
    const m = await getCrossrefMeta('10.1/x');
    expect(m?.license_name).toBe('CC BY');
    expect(m?.publisher).toBe('Elsevier');
    expect(m?.is_referenced_by_count).toBe(17);
    expect(m?.primary_resource_url).toBe('https://publisher/article/123');
  });

  it('mapea CC-BY-NC-ND', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            ...sampleMessage.message,
            license: [{ URL: 'https://creativecommons.org/licenses/by-nc-nd/4.0/' }],
          },
        }),
        { status: 200 },
      ),
    );
    const m = await getCrossrefMeta('10.1/x');
    expect(m?.license_name).toBe('CC BY-NC-ND');
  });

  it('mapea Elsevier propietaria', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            ...sampleMessage.message,
            license: [{ URL: 'https://www.elsevier.com/tdm/userlicense/1.0/' }],
          },
        }),
        { status: 200 },
      ),
    );
    const m = await getCrossrefMeta('10.1/x');
    expect(m?.license_name).toBe('Elsevier (propietaria)');
  });

  it('null cuando no hay licencia', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ message: { DOI: '10.1/x', publisher: 'X', type: 't' } }),
        { status: 200 },
      ),
    );
    const m = await getCrossrefMeta('10.1/x');
    expect(m?.license_name).toBeNull();
  });

  it('null si HTTP no-ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('boom', { status: 500 }));
    const m = await getCrossrefMeta('10.1/x');
    expect(m).toBeNull();
  });
});

describe('crossref.enrichCrossref', () => {
  it('devuelve map por DOI lowercase', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(sampleMessage), { status: 200 }),
    );
    const out = await enrichCrossref(['10.1/X', '10.1/X']);
    expect(out.size).toBe(1);
    expect(out.has('10.1/x')).toBe(true);
  });
});
