// ══════════════════════════════════════════════════════════════════════
// EvidenciaIA · cliente Europe PMC (EMBL-EBI)
// ══════════════════════════════════════════════════════════════════════
// Sin auth ni geobloqueo — servicio europeo. Devuelve full-text para
// open-access, abstract+metadata para el resto.
// ══════════════════════════════════════════════════════════════════════

const BASE = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search';

export interface EpmcAbstract {
  id: string;        // "PMC123" o "12345678" (PMID si no hay PMC)
  pmid: string | null;
  pmcid: string | null;
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  year: number | null;
  doi: string | null;
  publication_types: string[];
  is_open_access: boolean;
  full_text_url: string | null;
  source: 'europepmc';
}

interface EpmcOpts {
  pageSize?: number;
  resultType?: 'core' | 'lite';
  email?: string;
  timeoutMs?: number;
  dateFrom?: number;
  dateTo?: number;
  pubTypes?: string[];
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

function buildQuery(q: string, opts: EpmcOpts): string {
  let term = q.trim();
  if (opts.pubTypes && opts.pubTypes.length) {
    const pt = opts.pubTypes.map((p) => `PUB_TYPE:"${p}"`).join(' OR ');
    term = `(${term}) AND (${pt})`;
  }
  if (opts.dateFrom || opts.dateTo) {
    const from = opts.dateFrom ?? 1900;
    const to = opts.dateTo ?? new Date().getFullYear();
    term = `(${term}) AND (PUB_YEAR:[${from} TO ${to}])`;
  }
  return term;
}

export async function searchEuropePMC(query: string, opts: EpmcOpts = {}): Promise<EpmcAbstract[]> {
  const params = new URLSearchParams({
    query: buildQuery(query, opts),
    resultType: opts.resultType ?? 'core',
    format: 'json',
    pageSize: String(opts.pageSize ?? 10),
  });
  if (opts.email) params.set('email', opts.email);

  const r = await fetchWithTimeout(`${BASE}?${params}`, opts.timeoutMs ?? 8000);
  if (!r.ok) throw new Error(`europepmc HTTP ${r.status}`);
  const j = (await r.json()) as {
    resultList?: { result?: Array<Record<string, unknown>> };
  };
  const list = j.resultList?.result ?? [];
  return list.map((d) => mapResult(d));
}

function mapResult(d: Record<string, unknown>): EpmcAbstract {
  const yearStr = (d['pubYear'] as string | undefined) ?? null;
  const ftList = (d['fullTextUrlList'] as { fullTextUrl?: Array<{ url: string }> } | undefined)
    ?.fullTextUrl;
  const ftUrl = ftList && ftList.length ? ftList[0].url : null;

  const pubTypeRaw = (d['pubTypeList'] as { pubType?: string[] } | undefined)?.pubType ?? [];

  return {
    id: String(d['id'] ?? ''),
    pmid: (d['pmid'] as string | undefined) ?? null,
    pmcid: (d['pmcid'] as string | undefined) ?? null,
    title: String(d['title'] ?? ''),
    abstract: String(d['abstractText'] ?? ''),
    authors: parseAuthors(String(d['authorString'] ?? '')),
    journal: String(d['journalTitle'] ?? ''),
    year: yearStr ? parseInt(yearStr, 10) : null,
    doi: (d['doi'] as string | undefined) ?? null,
    publication_types: Array.isArray(pubTypeRaw) ? pubTypeRaw : [String(pubTypeRaw)],
    is_open_access: String(d['isOpenAccess'] ?? '') === 'Y',
    full_text_url: ftUrl,
    source: 'europepmc',
  };
}

function parseAuthors(s: string): string[] {
  return s
    .split(/[,;]\s*/)
    .map((x) => x.trim())
    .filter(Boolean);
}
