// ══════════════════════════════════════════════════════════════════════
// EvidenciaIA · cliente CORE API v3 (Open University, UK)
// ══════════════════════════════════════════════════════════════════════
// CORE es el agregador OA más grande del mundo: ~300M registros, ~30M
// con full text descargable. Indexa repositorios universitarios, OAI-PMH,
// y publishers OA. Cobertura mucho mayor que Unpaywall (que solo resuelve
// DOIs → URL OA). Aquí lo usamos como fuente de búsqueda adicional.
//
// API key requerida (gratuita, https://core.ac.uk/services/api). Se
// inyecta como secreto CORE_API_KEY. Si no está disponible, el provider
// se desactiva silenciosamente (no rompe la búsqueda principal).
// Docs: https://api.core.ac.uk/docs/v3
// ══════════════════════════════════════════════════════════════════════

const BASE = 'https://api.core.ac.uk/v3/search/works';

export interface CoreWork {
  id: string;
  doi: string | null;
  pmid: string | null;
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  year: number | null;
  publication_types: string[];
  is_open_access: boolean;     // CORE indexa solo OA, así que siempre true
  full_text_url: string | null;
  download_url: string | null; // PDF directo cuando existe
  language: string | null;
  source: 'core';
}

export interface CoreSearchOpts {
  limit?: number;
  dateFrom?: number;
  apiKey: string;             // requerido — sin clave no llamamos
  timeoutMs?: number;
}

async function fetchWithTimeout(url: string, ms: number, init: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

interface CoreV3Work {
  id?: number | string;
  doi?: string | null;
  title?: string;
  abstract?: string;
  authors?: Array<{ name?: string }>;
  yearPublished?: number | null;
  publishedDate?: string | null;
  publisher?: string | null;
  documentType?: string | null;
  language?: { name?: string; code?: string } | null;
  links?: Array<{ url?: string; type?: string }>;
  downloadUrl?: string | null;
  sourceFulltextUrls?: string[];
  identifiers?: string[]; // contiene PMIDs como "pmid:12345"
}

function pickPmid(ids: string[] | undefined): string | null {
  if (!ids) return null;
  for (const id of ids) {
    const m = /^pmid:(\d+)$/i.exec(id);
    if (m && m[1]) return m[1];
  }
  return null;
}

function mapWork(w: CoreV3Work): CoreWork {
  const links = w.links || [];
  const displayUrl =
    w.downloadUrl ||
    (w.sourceFulltextUrls && w.sourceFulltextUrls[0]) ||
    links.find((l) => l.type === 'display')?.url ||
    links.find((l) => l.type === 'reader')?.url ||
    null;
  const yr = w.yearPublished ?? (w.publishedDate ? parseInt(w.publishedDate.slice(0, 4), 10) : null);
  return {
    id: String(w.id ?? ''),
    doi: w.doi ?? null,
    pmid: pickPmid(w.identifiers),
    title: String(w.title ?? '').trim(),
    abstract: String(w.abstract ?? '').trim(),
    authors: (w.authors || [])
      .map((a) => a.name)
      .filter((x): x is string => typeof x === 'string'),
    journal: w.publisher ?? '',
    year: typeof yr === 'number' && Number.isFinite(yr) ? yr : null,
    publication_types: w.documentType ? [w.documentType] : [],
    is_open_access: true,
    full_text_url: displayUrl,
    download_url: w.downloadUrl ?? null,
    language: w.language?.code ?? w.language?.name ?? null,
    source: 'core',
  };
}

/**
 * Busca en CORE. Devuelve array vacío silenciosamente si la API key no
 * está configurada o si CORE responde con error — la búsqueda principal
 * nunca debe bloquearse por un fallo de un provider opcional.
 */
export async function searchCore(query: string, opts: CoreSearchOpts): Promise<CoreWork[]> {
  if (!opts.apiKey) return [];
  const limit = Math.min(20, Math.max(1, opts.limit ?? 8));
  // CORE soporta query string lucene-like. Restringimos a entries con
  // abstract y título para evitar ruido.
  let q = query.trim();
  if (opts.dateFrom) q += ` AND yearPublished>=${opts.dateFrom}`;
  q += ` AND _exists_:abstract AND _exists_:title`;

  const body = {
    q,
    limit,
    offset: 0,
    scroll: false,
    stats: false,
    raw_stats: false,
    exclude: [],
  };
  let r: Response;
  try {
    r = await fetchWithTimeout(BASE, opts.timeoutMs ?? 8000, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch {
    return [];
  }
  if (!r.ok) return [];
  let j: { results?: CoreV3Work[] };
  try {
    j = (await r.json()) as { results?: CoreV3Work[] };
  } catch {
    return [];
  }
  return (j.results || []).map(mapWork).filter((w) => w.title.length > 0);
}
