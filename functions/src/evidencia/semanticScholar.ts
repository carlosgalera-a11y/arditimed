// ══════════════════════════════════════════════════════════════════════
// EvidenciaIA · cliente Semantic Scholar (Allen Institute for AI)
// ══════════════════════════════════════════════════════════════════════
// Indexa ~200M papers. Sin API key: 100 req/5min compartido (limit
// global). Con S2_API_KEY (gratis): 1 req/s dedicado. Lo usamos como:
//   1) Fuente de búsqueda complementaria (search/match endpoint).
//   2) Enriquecimiento batch: por DOI/PMID añade TLDR generado por IA.
//
// El TLDR es un resumen de 1 frase del propio paper que da contexto
// rápido en la UI estilo OpenEvidence.
//
// Docs: https://api.semanticscholar.org/api-docs/graph
// ══════════════════════════════════════════════════════════════════════

const BASE = 'https://api.semanticscholar.org/graph/v1';

export interface S2Paper {
  paperId: string;
  doi: string | null;
  pmid: string | null;
  title: string;
  abstract: string;
  tldr: string | null;          // summary IA del propio S2
  authors: string[];
  journal: string;
  year: number | null;
  publication_types: string[];
  is_open_access: boolean;
  full_text_url: string | null;
  cited_by_count: number;
  source: 's2';
}

interface S2RawPaper {
  paperId?: string;
  externalIds?: { DOI?: string; PubMed?: string };
  title?: string;
  abstract?: string | null;
  tldr?: { text?: string } | null;
  authors?: Array<{ name?: string }>;
  venue?: string;
  year?: number | null;
  publicationTypes?: string[] | null;
  openAccessPdf?: { url?: string } | null;
  citationCount?: number;
}

const FIELDS = [
  'paperId', 'externalIds', 'title', 'abstract', 'tldr',
  'authors.name', 'venue', 'year', 'publicationTypes',
  'openAccessPdf', 'citationCount',
].join(',');

async function fetchWithTimeout(url: string, ms: number, init: RequestInit = {}): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

function mapPaper(r: S2RawPaper): S2Paper {
  return {
    paperId: String(r.paperId ?? ''),
    doi: r.externalIds?.DOI ?? null,
    pmid: r.externalIds?.PubMed ?? null,
    title: String(r.title ?? '').trim(),
    abstract: String(r.abstract ?? '').trim(),
    tldr: r.tldr?.text ?? null,
    authors: (r.authors || []).map((a) => a.name).filter((x): x is string => typeof x === 'string'),
    journal: String(r.venue ?? ''),
    year: typeof r.year === 'number' ? r.year : null,
    publication_types: Array.isArray(r.publicationTypes) ? r.publicationTypes : [],
    is_open_access: !!r.openAccessPdf?.url,
    full_text_url: r.openAccessPdf?.url ?? null,
    cited_by_count: typeof r.citationCount === 'number' ? r.citationCount : 0,
    source: 's2',
  };
}

export interface S2SearchOpts {
  limit?: number;
  yearFrom?: number;
  apiKey?: string;
  timeoutMs?: number;
}

/** Búsqueda libre. Devuelve [] silenciosamente ante error/rate-limit. */
export async function searchSemanticScholar(query: string, opts: S2SearchOpts = {}): Promise<S2Paper[]> {
  const params = new URLSearchParams({
    query: query.trim(),
    limit: String(Math.min(20, Math.max(1, opts.limit ?? 8))),
    fields: FIELDS,
  });
  if (opts.yearFrom) params.set('year', `${opts.yearFrom}-`);
  const url = `${BASE}/paper/search?${params.toString()}`;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.apiKey) headers['x-api-key'] = opts.apiKey;

  let r: Response;
  try {
    r = await fetchWithTimeout(url, opts.timeoutMs ?? 8000, { headers });
  } catch {
    return [];
  }
  if (!r.ok) return [];
  let j: { data?: S2RawPaper[] };
  try {
    j = (await r.json()) as { data?: S2RawPaper[] };
  } catch {
    return [];
  }
  return (j.data || []).map(mapPaper).filter((p) => p.title.length > 0);
}

/**
 * Enriquecimiento batch: dado un set de DOIs y/o PMIDs, recupera los
 * TLDRs (1 request paginada). Devuelve Map keyed por DOI lowercase y
 * PMID. Best-effort — silencia errores.
 *
 * Endpoint: POST /paper/batch con body { ids: ["DOI:...", "PMID:..."] }
 */
export async function enrichTldrs(
  ids: { dois: string[]; pmids: string[] },
  opts: { apiKey?: string; timeoutMs?: number } = {},
): Promise<{ tldrByDoi: Map<string, string>; tldrByPmid: Map<string, string> }> {
  const tldrByDoi = new Map<string, string>();
  const tldrByPmid = new Map<string, string>();
  const idsForBatch: string[] = [];
  for (const d of ids.dois) if (d) idsForBatch.push(`DOI:${d}`);
  for (const p of ids.pmids) if (p) idsForBatch.push(`PMID:${p}`);
  if (!idsForBatch.length) return { tldrByDoi, tldrByPmid };

  // Limitar a 50 ids por batch (límite del API).
  const batch = idsForBatch.slice(0, 50);
  const url = `${BASE}/paper/batch?fields=externalIds,tldr`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (opts.apiKey) headers['x-api-key'] = opts.apiKey;

  let r: Response;
  try {
    r = await fetchWithTimeout(url, opts.timeoutMs ?? 6000, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ids: batch }),
    });
  } catch {
    return { tldrByDoi, tldrByPmid };
  }
  if (!r.ok) return { tldrByDoi, tldrByPmid };
  let arr: Array<S2RawPaper | null>;
  try {
    arr = (await r.json()) as Array<S2RawPaper | null>;
  } catch {
    return { tldrByDoi, tldrByPmid };
  }
  for (const p of arr) {
    if (!p || !p.tldr?.text) continue;
    const tl = p.tldr.text.trim();
    if (!tl) continue;
    const doi = p.externalIds?.DOI;
    const pmid = p.externalIds?.PubMed;
    if (doi) tldrByDoi.set(doi.toLowerCase(), tl);
    if (pmid) tldrByPmid.set(String(pmid), tl);
  }
  return { tldrByDoi, tldrByPmid };
}
