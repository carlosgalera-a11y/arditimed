// ══════════════════════════════════════════════════════════════════════
// EvidenciaIA · enriquecimiento Crossref REST API
// ══════════════════════════════════════════════════════════════════════
// Crossref es la "agencia central de DOIs". Su API REST devuelve
// metadatos canónicos por DOI: licencia (CC-BY, propietaria, …),
// publisher, tipo de obra, links a full-text. Sin auth (polite pool con
// User-Agent + email). Lo usamos para añadir badges de licencia legibles
// y un publication_type más fiable que el de PubMed cuando sea posible.
// Docs: https://api.crossref.org/swagger-ui/index.html
// ══════════════════════════════════════════════════════════════════════

const BASE = 'https://api.crossref.org/works';
const POLITE_UA = 'Cartagenaeste/2.0 (mailto:carlosgalera2roman@gmail.com)';

export interface CrossrefMeta {
  doi: string;
  license_url: string | null;
  license_name: string | null;   // "CC-BY 4.0", "CC-BY-NC", "Elsevier proprietary", …
  publisher: string | null;
  type: string | null;            // journal-article, book-chapter, posted-content, …
  is_referenced_by_count: number; // citations en Crossref
  primary_resource_url: string | null;
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: 'application/json', 'User-Agent': POLITE_UA },
    });
  } finally {
    clearTimeout(t);
  }
}

interface CrRaw {
  message?: {
    DOI?: string;
    publisher?: string;
    type?: string;
    'is-referenced-by-count'?: number;
    license?: Array<{ URL?: string; 'content-version'?: string }>;
    link?: Array<{ URL?: string; 'content-type'?: string; 'intended-application'?: string }>;
    resource?: { primary?: { URL?: string } };
  };
}

function nameLicense(url: string | null): string | null {
  if (!url) return null;
  const u = url.toLowerCase();
  if (u.includes('creativecommons.org/licenses/by-nc-nd')) return 'CC BY-NC-ND';
  if (u.includes('creativecommons.org/licenses/by-nc-sa')) return 'CC BY-NC-SA';
  if (u.includes('creativecommons.org/licenses/by-nc')) return 'CC BY-NC';
  if (u.includes('creativecommons.org/licenses/by-sa')) return 'CC BY-SA';
  if (u.includes('creativecommons.org/licenses/by-nd')) return 'CC BY-ND';
  if (u.includes('creativecommons.org/licenses/by')) return 'CC BY';
  if (u.includes('creativecommons.org/publicdomain')) return 'CC0';
  if (u.includes('elsevier.com/tdm/userlicense')) return 'Elsevier (propietaria)';
  if (u.includes('springernature.com')) return 'Springer Nature (propietaria)';
  if (u.includes('wiley.com')) return 'Wiley (propietaria)';
  return 'Otra';
}

export async function getCrossrefMeta(doi: string, timeoutMs = 4000): Promise<CrossrefMeta | null> {
  const clean = (doi || '').trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
  if (!clean) return null;
  let r: Response;
  try {
    r = await fetchWithTimeout(`${BASE}/${encodeURIComponent(clean)}`, timeoutMs);
  } catch {
    return null;
  }
  if (!r.ok) return null;
  let j: CrRaw;
  try {
    j = (await r.json()) as CrRaw;
  } catch {
    return null;
  }
  const m = j.message;
  if (!m) return null;
  const license = (m.license || [])[0]?.URL ?? null;
  return {
    doi: clean,
    license_url: license,
    license_name: nameLicense(license),
    publisher: m.publisher ?? null,
    type: m.type ?? null,
    is_referenced_by_count: m['is-referenced-by-count'] ?? 0,
    primary_resource_url: m.resource?.primary?.URL ?? null,
  };
}

/** Resuelve N DOIs en paralelo con presupuesto total. Best-effort. */
export async function enrichCrossref(
  dois: string[],
  opts: { concurrency?: number; perRequestTimeoutMs?: number; totalBudgetMs?: number } = {},
): Promise<Map<string, CrossrefMeta>> {
  const out = new Map<string, CrossrefMeta>();
  const uniq = Array.from(new Set(dois.filter(Boolean)));
  if (!uniq.length) return out;
  const concurrency = Math.max(1, Math.min(8, opts.concurrency ?? 4));
  const perReq = opts.perRequestTimeoutMs ?? 3500;
  const budgetMs = opts.totalBudgetMs ?? 5000;
  const start = Date.now();

  let idx = 0;
  async function worker() {
    while (idx < uniq.length) {
      if (Date.now() - start > budgetMs) return;
      const i = idx++;
      const doi = uniq[i];
      if (!doi) continue;
      const m = await getCrossrefMeta(doi, perReq).catch(() => null);
      if (m) out.set(doi.toLowerCase(), m);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, uniq.length) }, () => worker());
  await Promise.all(workers);
  return out;
}
