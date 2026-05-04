// ══════════════════════════════════════════════════════════════════════
// EvidenciaIA · enriquecimiento Unpaywall
// ══════════════════════════════════════════════════════════════════════
// Unpaywall (Our Research) es un servicio gratuito que, dado un DOI,
// devuelve si existe versión Open Access legal del paper y la URL del
// PDF/HTML libre. Limite ~100k req/día con email obligatorio (no API key).
// Docs: https://unpaywall.org/products/api
//
// Lo usamos para que, cuando PubMed/Europe PMC nos den un abstract con
// DOI, podamos exponerle al clínico el enlace al full text libre. Es una
// paridad funcional importante con OpenEvidence (que tiene full text vía
// licencias) — al menos cubrimos los papers OA, que son ~50% de PubMed
// reciente. NO descargamos el PDF (no se necesita y evita CSP issues),
// solo guardamos la URL.
// ══════════════════════════════════════════════════════════════════════

const BASE = 'https://api.unpaywall.org/v2';
const EMAIL = 'carlosgalera2roman@gmail.com';

export interface OAResolution {
  doi: string;
  is_oa: boolean;
  oa_url: string | null;        // best_oa_location.url
  oa_url_for_pdf: string | null;
  license: string | null;       // cc-by, cc-by-nc, …
  host_type: string | null;     // publisher / repository
  version: string | null;       // publishedVersion / acceptedVersion
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
  } finally {
    clearTimeout(t);
  }
}

interface UpwResponse {
  doi?: string;
  is_oa?: boolean;
  best_oa_location?: {
    url?: string;
    url_for_pdf?: string | null;
    license?: string | null;
    host_type?: string | null;
    version?: string | null;
  } | null;
}

/**
 * Resuelve un DOI individual contra Unpaywall.
 * Devuelve null silenciosamente ante 404 (DOI desconocido) o errores de red
 * — el enriquecimiento es best-effort y nunca debe romper la búsqueda.
 */
export async function resolveOneDoi(doi: string, timeoutMs = 4000): Promise<OAResolution | null> {
  const clean = (doi || '').trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
  if (!clean) return null;
  const url = `${BASE}/${encodeURIComponent(clean)}?email=${encodeURIComponent(EMAIL)}`;
  let r: Response;
  try {
    r = await fetchWithTimeout(url, timeoutMs);
  } catch {
    return null;
  }
  if (r.status === 404) return null;
  if (!r.ok) return null;
  let j: UpwResponse;
  try {
    j = (await r.json()) as UpwResponse;
  } catch {
    return null;
  }
  const loc = j.best_oa_location ?? null;
  return {
    doi: clean,
    is_oa: !!j.is_oa,
    oa_url: loc?.url ?? null,
    oa_url_for_pdf: loc?.url_for_pdf ?? null,
    license: loc?.license ?? null,
    host_type: loc?.host_type ?? null,
    version: loc?.version ?? null,
  };
}

/**
 * Resuelve una lista de DOIs en paralelo con concurrencia limitada y un
 * presupuesto de tiempo total (para no bloquear la búsqueda principal).
 * Devuelve un Map DOI→OAResolution con solo las resoluciones exitosas y OA.
 */
export async function resolveManyDois(
  dois: string[],
  opts: { concurrency?: number; perRequestTimeoutMs?: number; totalBudgetMs?: number } = {},
): Promise<Map<string, OAResolution>> {
  const out = new Map<string, OAResolution>();
  const uniq = Array.from(new Set(dois.filter((d) => typeof d === 'string' && d.length > 0)));
  if (!uniq.length) return out;

  const concurrency = Math.max(1, Math.min(8, opts.concurrency ?? 4));
  const perReq = opts.perRequestTimeoutMs ?? 3500;
  const budgetMs = opts.totalBudgetMs ?? 6000;
  const start = Date.now();

  let idx = 0;
  async function worker() {
    while (idx < uniq.length) {
      if (Date.now() - start > budgetMs) return;
      const i = idx++;
      const doi = uniq[i];
      if (!doi) continue;
      const res = await resolveOneDoi(doi, perReq).catch(() => null);
      if (res && res.is_oa && (res.oa_url || res.oa_url_for_pdf)) {
        out.set(doi, res);
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, uniq.length) }, () => worker());
  await Promise.all(workers);
  return out;
}
