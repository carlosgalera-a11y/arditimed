// ══════════════════════════════════════════════════════════════════════
// EvidenciaIA · cliente PubMed (NCBI E-utilities)
// ══════════════════════════════════════════════════════════════════════
// Endpoints públicos sin auth obligatoria (3 req/s sin key, 10 req/s con
// key). Si NCBI_API_KEY existe en Secret Manager, se inyecta para subir
// el rate limit. La key NUNCA viaja al cliente — todo server-side.
// ══════════════════════════════════════════════════════════════════════

const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const TOOL = 'cartagenaeste';
const EMAIL = 'carlosgalera2roman@gmail.com'; // requerido por NCBI etiquette

export interface PubmedAbstract {
  pmid: string;
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  year: number | null;
  publication_types: string[];
  mesh_terms: string[];
  doi: string | null;
  language: string | null;
  source: 'pubmed';
}

interface SearchOpts {
  maxResults?: number;
  dateFrom?: number; // year
  dateTo?: number;   // year
  pubTypes?: string[]; // ['Randomized Controlled Trial', 'Meta-Analysis', ...]
  apiKey?: string;
  timeoutMs?: number;
}

function buildSearchUrl(query: string, opts: SearchOpts): string {
  let term = query.trim();
  if (opts.pubTypes && opts.pubTypes.length) {
    const pt = opts.pubTypes.map((t) => `"${t}"[ptyp]`).join(' OR ');
    term = `(${term}) AND (${pt})`;
  }
  if (opts.dateFrom || opts.dateTo) {
    const from = opts.dateFrom ?? 1900;
    const to = opts.dateTo ?? new Date().getFullYear();
    term = `(${term}) AND (${from}:${to}[pdat])`;
  }
  const params = new URLSearchParams({
    db: 'pubmed',
    term,
    retmode: 'json',
    retmax: String(opts.maxResults ?? 15),
    sort: 'relevance',
    tool: TOOL,
    email: EMAIL,
  });
  if (opts.apiKey) params.set('api_key', opts.apiKey);
  return `${BASE}/esearch.fcgi?${params}`;
}

function buildFetchUrl(pmids: string[], opts: SearchOpts): string {
  const params = new URLSearchParams({
    db: 'pubmed',
    id: pmids.join(','),
    retmode: 'xml',
    rettype: 'abstract',
    tool: TOOL,
    email: EMAIL,
  });
  if (opts.apiKey) params.set('api_key', opts.apiKey);
  return `${BASE}/efetch.fcgi?${params}`;
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

// Parser XML mínimo y específico — evitamos depender de paquetes pesados.
// Extrae solo los campos que necesitamos del PubmedArticleSet.
function parsePubmedXml(xml: string): PubmedAbstract[] {
  const out: PubmedAbstract[] = [];
  // Cada artículo viene en <PubmedArticle>...</PubmedArticle>.
  const articleBlocks = xml.split(/<PubmedArticle\b/i).slice(1);
  for (const blk of articleBlocks) {
    const block = '<PubmedArticle' + blk.split(/<\/PubmedArticle>/i)[0] + '</PubmedArticle>';
    const pmid = pick(block, /<PMID[^>]*>(\d+)<\/PMID>/);
    if (!pmid) continue;
    const title = decode(pick(block, /<ArticleTitle[^>]*>([\s\S]*?)<\/ArticleTitle>/) ?? '');
    const journal =
      decode(pick(block, /<Journal[^>]*>[\s\S]*?<Title>([\s\S]*?)<\/Title>/) ?? '') ||
      decode(pick(block, /<ISOAbbreviation>([\s\S]*?)<\/ISOAbbreviation>/) ?? '');
    const yearStr =
      pick(block, /<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/) ??
      pick(block, /<PubDate>[\s\S]*?<MedlineDate>(\d{4})/);
    const year = yearStr ? parseInt(yearStr, 10) : null;
    const language = pick(block, /<Language>([a-z]{2,3})<\/Language>/i)?.toLowerCase() ?? null;

    const abstractParts: string[] = [];
    const abstractMatches = block.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g);
    for (const m of abstractMatches) abstractParts.push(decode(m[1] ?? ''));
    const abstractText = abstractParts.join('\n').trim();

    const authors: string[] = [];
    const authorBlocks = block.matchAll(/<Author[^>]*>([\s\S]*?)<\/Author>/g);
    for (const a of authorBlocks) {
      const last = pick(a[1] ?? '', /<LastName>([^<]+)<\/LastName>/);
      const init = pick(a[1] ?? '', /<Initials>([^<]+)<\/Initials>/);
      if (last) authors.push(init ? `${last} ${init}` : last);
    }

    const pubTypes: string[] = [];
    const ptBlocks = block.matchAll(/<PublicationType[^>]*>([^<]+)<\/PublicationType>/g);
    for (const p of ptBlocks) pubTypes.push(decode(p[1] ?? '').trim());

    const mesh: string[] = [];
    const meshBlocks = block.matchAll(/<DescriptorName[^>]*>([^<]+)<\/DescriptorName>/g);
    for (const m of meshBlocks) mesh.push(decode(m[1] ?? '').trim());

    const doi = pick(block, /<ELocationID[^>]*EIdType="doi"[^>]*>([^<]+)<\/ELocationID>/) ?? null;

    out.push({
      pmid,
      title,
      abstract: abstractText,
      authors,
      journal,
      year,
      publication_types: pubTypes,
      mesh_terms: mesh,
      doi,
      language,
      source: 'pubmed',
    });
  }
  return out;
}

function pick(s: string, rx: RegExp): string | null {
  const m = rx.exec(s);
  return m ? m[1] ?? null : null;
}

function decode(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/\s+/g, ' ')
    .trim();
}

export async function searchPubmed(query: string, opts: SearchOpts = {}): Promise<PubmedAbstract[]> {
  const timeoutMs = opts.timeoutMs ?? 8000;
  const searchUrl = buildSearchUrl(query, opts);
  const r1 = await fetchWithTimeout(searchUrl, timeoutMs);
  if (!r1.ok) throw new Error(`pubmed esearch HTTP ${r1.status}`);
  const j = (await r1.json()) as { esearchresult?: { idlist?: string[] } };
  const pmids = j.esearchresult?.idlist ?? [];
  if (!pmids.length) return [];

  const fetchUrl = buildFetchUrl(pmids, opts);
  const r2 = await fetchWithTimeout(fetchUrl, timeoutMs);
  if (!r2.ok) throw new Error(`pubmed efetch HTTP ${r2.status}`);
  const xml = await r2.text();
  return parsePubmedXml(xml);
}
