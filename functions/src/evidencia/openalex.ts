// ══════════════════════════════════════════════════════════════════════
// EvidenciaIA · cliente OpenAlex
// ══════════════════════════════════════════════════════════════════════
// Catálogo abierto y gratuito de >250M obras académicas (sucesor de
// Microsoft Academic Graph). Sin auth, recomienda email para "polite
// pool" con mejor rate limit. Útil como complemento a PubMed/Europe PMC
// porque incluye preprints, conferencia y muchas guías clínicas.
// Docs: https://docs.openalex.org/
// ══════════════════════════════════════════════════════════════════════

const BASE = 'https://api.openalex.org/works';
const POLITE_EMAIL = 'carlosgalera2roman@gmail.com';

export interface OpenAlexAbstract {
  id: string;            // "https://openalex.org/W123..."
  doi: string | null;
  pmid: string | null;
  title: string;
  abstract: string;      // OpenAlex devuelve abstract_inverted_index → reconstruimos
  authors: string[];
  journal: string;
  year: number | null;
  publication_types: string[];
  is_open_access: boolean;
  full_text_url: string | null;
  cited_by_count: number;
  source: 'openalex';
}

interface SearchOpts {
  perPage?: number;
  dateFrom?: number;
  dateTo?: number;
  pubTypes?: string[];   // 'review' | 'article' | ...
  timeoutMs?: number;
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

// OpenAlex codifica el abstract como índice inverso: { palabra: [pos, pos, ...] }.
// Reconstruimos el texto plano. Devuelve "" si no hay datos.
function decodeInvertedIndex(idx: Record<string, number[]> | null | undefined): string {
  if (!idx) return '';
  const positions: Array<{ pos: number; word: string }> = [];
  for (const [word, posList] of Object.entries(idx)) {
    for (const p of posList) positions.push({ pos: p, word });
  }
  positions.sort((a, b) => a.pos - b.pos);
  return positions.map((x) => x.word).join(' ');
}

export async function searchOpenAlex(
  query: string,
  opts: SearchOpts = {},
): Promise<OpenAlexAbstract[]> {
  const filters: string[] = [];
  if (opts.dateFrom) filters.push(`from_publication_date:${opts.dateFrom}-01-01`);
  if (opts.dateTo) filters.push(`to_publication_date:${opts.dateTo}-12-31`);
  if (opts.pubTypes && opts.pubTypes.length) {
    filters.push(`type:${opts.pubTypes.join('|')}`);
  }

  const params = new URLSearchParams({
    search: query,
    'per-page': String(opts.perPage ?? 10),
    mailto: POLITE_EMAIL,
  });
  if (filters.length) params.set('filter', filters.join(','));

  const r = await fetchWithTimeout(`${BASE}?${params}`, opts.timeoutMs ?? 8000);
  if (!r.ok) throw new Error(`openalex HTTP ${r.status}`);
  const j = (await r.json()) as { results?: Array<Record<string, unknown>> };
  const list = j.results ?? [];
  return list.map((d) => map(d));
}

function map(d: Record<string, unknown>): OpenAlexAbstract {
  const ids = (d['ids'] as Record<string, string> | undefined) ?? {};
  const primary = (d['primary_location'] as Record<string, unknown> | undefined) ?? {};
  const source = (primary['source'] as Record<string, unknown> | undefined) ?? {};
  const oa = (d['open_access'] as Record<string, unknown> | undefined) ?? {};

  const authors: string[] = [];
  const aShip = (d['authorships'] as Array<Record<string, unknown>> | undefined) ?? [];
  for (const a of aShip) {
    const author = (a['author'] as Record<string, unknown> | undefined) ?? {};
    const name = author['display_name'];
    if (typeof name === 'string') authors.push(name);
  }

  const ptype = (d['type'] as string | undefined) ?? '';
  const types = ptype ? [ptype] : [];

  const inverted = d['abstract_inverted_index'] as Record<string, number[]> | null | undefined;

  return {
    id: String(d['id'] ?? ''),
    doi: (ids['doi'] as string | undefined) ?? (d['doi'] as string | undefined) ?? null,
    pmid: (ids['pmid'] as string | undefined)?.replace(/^https?:\/\/[^/]+\//, '') ?? null,
    title: String(d['title'] ?? d['display_name'] ?? ''),
    abstract: decodeInvertedIndex(inverted),
    authors,
    journal: String(source['display_name'] ?? ''),
    year: (d['publication_year'] as number | undefined) ?? null,
    publication_types: types,
    is_open_access: oa['is_oa'] === true,
    full_text_url: (oa['oa_url'] as string | undefined) ?? null,
    cited_by_count: (d['cited_by_count'] as number | undefined) ?? 0,
    source: 'openalex',
  };
}
