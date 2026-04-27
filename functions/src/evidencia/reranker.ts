// ══════════════════════════════════════════════════════════════════════
// EvidenciaIA · re-ranking ponderado con sesgo europeo
// ══════════════════════════════════════════════════════════════════════
// Ordena resultados de PubMed + Europe PMC por una puntuación que prima:
//   · Revisiones sistemáticas / metaanálisis / Cochrane
//   · Revistas tier-1 (NEJM, Lancet, JAMA, BMJ, Annals)
//   · Guías europeas (NICE, ESC, ESMO, EASL, GuíaSalud)
//   · Recencia (últimos 3 años)
//   · Penaliza case-reports si hay alternativas mejores
// ══════════════════════════════════════════════════════════════════════

import type { PubmedAbstract } from './pubmed';
import type { EpmcAbstract } from './europepmc';

export type Abstract = PubmedAbstract | EpmcAbstract;

export interface ScoredAbstract {
  ref: Abstract;
  score: number;
  reasons: string[];
}

const TIER1_JOURNALS = [
  'new england journal of medicine',
  'lancet',
  'jama',
  'bmj',
  'annals of internal medicine',
  'nature medicine',
  'nature',
  'science',
  'cell',
];

const EU_GUIDELINE_KEYWORDS = [
  'nice guideline',
  'european society of cardiology',
  'esc guideline',
  'esmo guideline',
  'easl guideline',
  'gu[ií]a salud',
  'aepcc',
  'sego',
  'ses guideline',
  'eular',
];

const SR_TYPES = ['systematic review', 'meta-analysis', 'meta analysis', 'cochrane'];
const RCT_TYPES = ['randomized controlled trial', 'randomised controlled trial', 'clinical trial, phase iii'];
const CASE_REPORT_TYPES = ['case reports', 'case report'];

function lower(s: string): string {
  return (s || '').toLowerCase();
}

export function scoreAbstract(a: Abstract, currentYear: number = new Date().getFullYear()): ScoredAbstract {
  let score = 1; // base
  const reasons: string[] = [];
  const journalLow = lower(a.journal);
  const titleLow = lower(a.title);
  const types = (a.publication_types || []).map(lower);

  if (types.some((t) => SR_TYPES.some((sr) => t.includes(sr))) || journalLow.includes('cochrane')) {
    score += 4;
    reasons.push('revisión sistemática / metaanálisis');
  } else if (types.some((t) => RCT_TYPES.some((rct) => t.includes(rct)))) {
    score += 3;
    reasons.push('ensayo clínico');
  }
  if (TIER1_JOURNALS.some((j) => journalLow.includes(j))) {
    score += 2;
    reasons.push('revista tier-1');
  }
  if (EU_GUIDELINE_KEYWORDS.some((kw) => titleLow.includes(kw) || journalLow.includes(kw))) {
    score += 2;
    reasons.push('guía europea');
  }
  if (a.year && a.year >= currentYear - 3) {
    score += 1;
    reasons.push(`reciente (${a.year})`);
  }
  if (a.year && a.year < currentYear - 10) {
    score -= 1;
    reasons.push(`antiguo (${a.year})`);
  }
  if (types.some((t) => CASE_REPORT_TYPES.some((cr) => t.includes(cr)))) {
    score -= 2;
    reasons.push('case report (penalización)');
  }
  if ('is_open_access' in a && a.is_open_access) {
    score += 1;
    reasons.push('open access');
  }
  return { ref: a, score, reasons };
}

export function rerank(
  abstracts: Abstract[],
  opts: { maxResults?: number; currentYear?: number } = {},
): ScoredAbstract[] {
  const yr = opts.currentYear ?? new Date().getFullYear();
  // Deduplicate por DOI/PMID antes de scorear.
  const seen = new Set<string>();
  const uniq: Abstract[] = [];
  for (const a of abstracts) {
    const key = (a.doi ? `doi:${a.doi}` : '') || (a as { pmid?: string }).pmid || a.title.slice(0, 80);
    const k = key.toLowerCase();
    if (k && !seen.has(k)) {
      seen.add(k);
      uniq.push(a);
    }
  }
  const scored = uniq.map((a) => scoreAbstract(a, yr));
  scored.sort((x, y) => y.score - x.score);
  return scored.slice(0, opts.maxResults ?? 8);
}
