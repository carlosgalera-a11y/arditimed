import { describe, expect, it } from 'vitest';
import { rerank, scoreAbstract } from '../src/evidencia/reranker';
import type { PubmedAbstract } from '../src/evidencia/pubmed';
import type { EpmcAbstract } from '../src/evidencia/europepmc';
import type { OpenAlexAbstract } from '../src/evidencia/openalex';

const baseYear = 2026;

function pubmed(over: Partial<PubmedAbstract> = {}): PubmedAbstract {
  return {
    pmid: '1',
    title: 'Some study',
    abstract: '',
    authors: [],
    journal: 'Some Journal',
    year: baseYear,
    publication_types: [],
    mesh_terms: [],
    doi: null,
    language: 'eng',
    source: 'pubmed',
    ...over,
  };
}

function epmc(over: Partial<EpmcAbstract> = {}): EpmcAbstract {
  return {
    id: 'PMC1',
    pmid: null,
    pmcid: 'PMC1',
    title: 'Some EPMC paper',
    abstract: '',
    authors: [],
    journal: 'EPMC Journal',
    year: baseYear,
    doi: null,
    publication_types: [],
    is_open_access: false,
    full_text_url: null,
    source: 'europepmc',
    ...over,
  };
}

function oa(over: Partial<OpenAlexAbstract> = {}): OpenAlexAbstract {
  return {
    id: 'https://openalex.org/W1',
    doi: null,
    pmid: null,
    title: 'OpenAlex paper',
    abstract: '',
    authors: [],
    journal: 'OA Journal',
    year: baseYear,
    publication_types: [],
    is_open_access: true,
    full_text_url: null,
    cited_by_count: 0,
    source: 'openalex',
    ...over,
  };
}

describe('reranker.scoreAbstract', () => {
  it('prima revisión sistemática + Cochrane + tier-1', () => {
    const a = pubmed({
      title: 'A meta-analysis',
      journal: 'Cochrane Database of Systematic Reviews',
      publication_types: ['Systematic Review', 'Meta-Analysis'],
    });
    const s = scoreAbstract(a, baseYear);
    expect(s.score).toBeGreaterThanOrEqual(5); // base 1 + SR/MA 4 + recencia 1
    expect(s.reasons.join(' ')).toMatch(/sistemática|metaanálisis/);
  });

  it('penaliza case report', () => {
    const a = pubmed({ publication_types: ['Case Reports'] });
    const s = scoreAbstract(a, baseYear);
    expect(s.score).toBeLessThan(scoreAbstract(pubmed(), baseYear).score);
    expect(s.reasons).toContain('case report (penalización)');
  });

  it('marca tier-1 (NEJM)', () => {
    const a = pubmed({ journal: 'New England Journal of Medicine' });
    const s = scoreAbstract(a, baseYear);
    expect(s.reasons.some((r) => /tier-1/.test(r))).toBe(true);
  });

  it('marca guía europea por título', () => {
    const a = pubmed({ title: '2024 ESC Guideline on heart failure' });
    const s = scoreAbstract(a, baseYear);
    expect(s.reasons.some((r) => /guía europea/.test(r))).toBe(true);
  });

  it('penaliza estudios antiguos (>10 años)', () => {
    const old = pubmed({ year: baseYear - 15 });
    const recent = pubmed({ year: baseYear });
    expect(scoreAbstract(old, baseYear).score).toBeLessThan(scoreAbstract(recent, baseYear).score);
  });

  it('OpenAlex: bonus por citas (acotado a +2)', () => {
    const lowCite = oa({ cited_by_count: 5 });
    const midCite = oa({ cited_by_count: 200 });
    const highCite = oa({ cited_by_count: 50000 });
    expect(scoreAbstract(lowCite, baseYear).score).toEqual(scoreAbstract(oa(), baseYear).score);
    expect(scoreAbstract(midCite, baseYear).score).toBeGreaterThan(
      scoreAbstract(oa(), baseYear).score,
    );
    // High citation no debería sumar más de +2 sobre base+OA+recencia.
    const baseOa = scoreAbstract(oa(), baseYear).score;
    expect(scoreAbstract(highCite, baseYear).score - baseOa).toBeLessThanOrEqual(2);
  });

  it('OpenAlex: open_access añade +1', () => {
    const closedOa = oa({ is_open_access: false });
    const openOa = oa({ is_open_access: true });
    expect(scoreAbstract(openOa, baseYear).score).toBeGreaterThan(
      scoreAbstract(closedOa, baseYear).score,
    );
  });
});

describe('reranker.rerank', () => {
  it('deduplica por DOI antes de scorear', () => {
    const a = pubmed({ pmid: '1', doi: '10.1/x' });
    const b = epmc({ id: 'PMC2', doi: '10.1/x', title: 'Same paper, EPMC version' });
    const out = rerank([a, b]);
    expect(out.length).toBe(1);
  });

  it('respeta maxResults', () => {
    const arr = Array.from({ length: 12 }, (_, i) => pubmed({ pmid: `${i}`, title: `Paper ${i}` }));
    const out = rerank(arr, { maxResults: 5 });
    expect(out.length).toBe(5);
  });

  it('ordena por score descendente', () => {
    const arr: Array<PubmedAbstract | EpmcAbstract | OpenAlexAbstract> = [
      pubmed({ pmid: '1', publication_types: ['Case Reports'], title: 'Case' }),
      pubmed({
        pmid: '2',
        publication_types: ['Systematic Review'],
        journal: 'Cochrane Database of Systematic Reviews',
        title: 'SR',
      }),
      pubmed({ pmid: '3', publication_types: ['Randomized Controlled Trial'], title: 'RCT' }),
    ];
    const out = rerank(arr);
    expect(out[0]?.ref.title).toBe('SR');
    expect(out[2]?.ref.title).toBe('Case');
  });
});
