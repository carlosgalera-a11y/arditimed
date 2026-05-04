// ══════════════════════════════════════════════════════════════════════
// EvidenciaIA · Bias Audit Harness (offline)
// ══════════════════════════════════════════════════════════════════════
// Funciones puras que ejecutan el conjunto de escenarios canónicos contra
// las piezas deterministas del pipeline (safeguards, reranker, citation
// verifier) y producen un reporte de cumplimiento.
//
// Lo que valida:
//   1. Safeguards: rechazos esperados se rechazan; aceptaciones esperadas
//      pasan; las variantes por género/edad reciben EL MISMO trato.
//   2. Reranker grade: dados los tipos de estudio sintéticos del top-5
//      esperado, el grado A/B/C/D asignado coincide con el esperado
//      mínimo (orden A > B > C > D).
//   3. Citation verifier: detecta correctamente citas inventadas en
//      outputs hand-crafted con [n] inválidos.
//
// Lo que NO valida (requiere llamadas reales a APIs/IA, fuera de scope
// del harness offline):
//   - Calidad real de las búsquedas en PubMed/EuropePMC.
//   - Calidad de la síntesis IA en sí.
//   - Latencia operacional.
//
// Estas se vigilan en producción vía métricas de `evidencia_consultas`
// (ver `docs/aiact/06-accuracy-robustness.md` y `10-post-market-surveillance.md`).
//
// El harness se ejecuta:
//   - En CI antes de cada deploy (vitest).
//   - Manualmente con `npm run test -- evidencia-biasAudit`.
//   - Como parte de la documentación de cumplimiento AI Act art. 9 + 15.
// ══════════════════════════════════════════════════════════════════════

import { validarPregunta } from './safeguards';
import { rerank, gradeEvidence, type Abstract, type EvidenceGrade } from './reranker';
import { verifyCitations } from './citationVerifier';
import type { PubmedAbstract } from './pubmed';
import {
  BIAS_AUDIT_SCENARIOS,
  clinicalScenarios,
  rejectionScenarios,
  type BiasAuditScenario,
  type StudyTypeHint,
} from './biasAuditScenarios';

// ─── Tipos de resultado ────────────────────────────────────────────

export interface ScenarioResult {
  id: string;
  category: string;
  passed: boolean;
  failures: string[];
  detail?: Record<string, unknown>;
}

export interface BiasAuditReport {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  byCategory: Record<string, { total: number; passed: number; failRate: number }>;
  failedScenarios: ScenarioResult[];
  metrics: {
    safeguard_pass_rate: number;
    safeguard_consistency_rate: number;  // bias variants tratadas igual
    reranker_grade_match_rate: number;
    citation_verifier_pass_rate: number;
  };
  ranAt: string;
  scenariosVersion: number;
}

// ─── Auditoría 1 · Safeguards ──────────────────────────────────────

/**
 * Por cada escenario, comprueba que validarPregunta produce el outcome
 * esperado (pass/reject + motivo concreto). Para los escenarios con
 * biasVariants, comprueba además que las variantes obtienen exactamente
 * el mismo outcome (consistencia frente a género/edad/etc.).
 */
export function auditSafeguards(scenarios: ReadonlyArray<BiasAuditScenario> = BIAS_AUDIT_SCENARIOS): {
  results: ScenarioResult[];
  passRate: number;
  consistencyRate: number;
} {
  const results: ScenarioResult[] = [];
  let totalVariants = 0;
  let consistentVariants = 0;

  for (const sc of scenarios) {
    const failures: string[] = [];
    const v = validarPregunta(sc.question);

    if (sc.expectedSafeguardPass && !v.ok) {
      failures.push(`Esperado pass, rechazado por motivo "${v.motivo}"`);
    } else if (!sc.expectedSafeguardPass && v.ok) {
      failures.push('Esperado rechazo, aceptado');
    } else if (!sc.expectedSafeguardPass && sc.expectedRejectionReason && !v.ok && v.motivo !== sc.expectedRejectionReason) {
      failures.push(`Rechazado por motivo "${v.motivo}", esperaba "${sc.expectedRejectionReason}"`);
    }

    // Bias variants: cada una debe coincidir en outcome con el escenario base.
    if (sc.biasVariants && sc.biasVariants.length) {
      for (const variant of sc.biasVariants) {
        totalVariants++;
        const vv = validarPregunta(variant);
        const baseOk = v.ok;
        const varOk = vv.ok;
        if (baseOk === varOk) {
          consistentVariants++;
        } else {
          failures.push(`Variante "${variant.slice(0, 40)}…" → outcome distinto al base (base.ok=${baseOk}, variant.ok=${varOk})`);
        }
      }
    }

    results.push({
      id: sc.id,
      category: sc.category,
      passed: failures.length === 0,
      failures,
      detail: { validation: v },
    });
  }

  const passed = results.filter((r) => r.passed).length;
  return {
    results,
    passRate: results.length === 0 ? 1 : passed / results.length,
    consistencyRate: totalVariants === 0 ? 1 : consistentVariants / totalVariants,
  };
}

// ─── Auditoría 2 · Reranker grade ──────────────────────────────────

/**
 * Construye un PubmedAbstract sintético de un determinado tipo para
 * alimentar al reranker. Permite probar la asignación de grado sin
 * tocar APIs externas.
 */
function syntheticAbstract(type: StudyTypeHint, idx: number): PubmedAbstract {
  const base: PubmedAbstract = {
    pmid: `999${idx}`,
    title: `Synthetic ${type} ${idx}`,
    abstract: 'Synthetic abstract for bias audit purposes.',
    authors: ['Test A', 'Test B'],
    journal: 'Test Journal',
    year: new Date().getFullYear() - 1,
    publication_types: [],
    mesh_terms: [],
    doi: null,
    language: 'eng',
    source: 'pubmed',
  };
  switch (type) {
    case 'systematic_review':
      return {
        ...base,
        publication_types: ['Systematic Review', 'Meta-Analysis'],
        journal: 'Cochrane Database of Systematic Reviews',
      };
    case 'rct':
      return {
        ...base,
        publication_types: ['Randomized Controlled Trial'],
        journal: 'New England Journal of Medicine',
      };
    case 'guideline_eu':
      return {
        ...base,
        title: '2024 ESC Guideline on Synthetic Topic',
        publication_types: ['Practice Guideline'],
        journal: 'European Heart Journal',
      };
    case 'case_report':
      return { ...base, publication_types: ['Case Reports'] };
    case 'preprint':
      return {
        ...base,
        publication_types: ['Preprint'],
        journal: 'medRxiv',
      };
    case 'observational':
      return {
        ...base,
        publication_types: ['Observational Study'],
        journal: 'Lancet',
      };
  }
}

const GRADE_RANK: Record<Exclude<EvidenceGrade, 'insuficiente'>, number> = {
  A: 4, B: 3, C: 2, D: 1,
};

function gradeMeetsMin(actual: EvidenceGrade, expectedMin: Exclude<EvidenceGrade, 'insuficiente'>): boolean {
  if (actual === 'insuficiente') return false;
  return GRADE_RANK[actual] >= GRADE_RANK[expectedMin];
}

/**
 * Evalúa, para cada escenario clínico con `syntheticTopTypes` definidos,
 * si el reranker asigna un grado ≥ al esperado mínimo.
 */
export function auditReranker(scenarios: ReadonlyArray<BiasAuditScenario> = clinicalScenarios()): {
  results: ScenarioResult[];
  matchRate: number;
} {
  const results: ScenarioResult[] = [];
  for (const sc of scenarios) {
    if (!sc.syntheticTopTypes || !sc.expectedGradeAtLeast) continue;
    const failures: string[] = [];
    const synth: Abstract[] = sc.syntheticTopTypes.map((t, i) => syntheticAbstract(t, i));
    const reranked = rerank(synth);
    const grade = gradeEvidence(reranked);
    if (!gradeMeetsMin(grade.grade, sc.expectedGradeAtLeast)) {
      failures.push(
        `Grade=${grade.grade} no alcanza mínimo esperado ${sc.expectedGradeAtLeast}. ` +
        `Rationale: ${grade.rationale}`,
      );
    }
    results.push({
      id: sc.id,
      category: sc.category,
      passed: failures.length === 0,
      failures,
      detail: { grade: grade.grade, expectedMin: sc.expectedGradeAtLeast, rationale: grade.rationale },
    });
  }
  const passed = results.filter((r) => r.passed).length;
  return {
    results,
    matchRate: results.length === 0 ? 1 : passed / results.length,
  };
}

// ─── Auditoría 3 · Citation verifier ───────────────────────────────

interface CitationCase {
  id: string;
  text: string;
  sourcesCount: number;
  expectedEmitted: number;
  expectedVerified: number;
  expectedInvalid: number[];
}

const CITATION_CASES: CitationCase[] = [
  {
    id: 'cit-01-todas-validas',
    text: 'La evidencia [1] muestra que A vs B mejora outcomes [2]. Otra observación [3].',
    sourcesCount: 3,
    expectedEmitted: 3,
    expectedVerified: 3,
    expectedInvalid: [],
  },
  {
    id: 'cit-02-cita-fuera-de-rango',
    text: 'Síntesis [1] con cita inventada [99].',
    sourcesCount: 3,
    expectedEmitted: 2,
    expectedVerified: 1,
    expectedInvalid: [99],
  },
  {
    id: 'cit-03-sin-citas',
    text: 'Texto sin ningún número entre corchetes.',
    sourcesCount: 5,
    expectedEmitted: 0,
    expectedVerified: 0,
    expectedInvalid: [],
  },
  {
    id: 'cit-04-cita-repetida',
    text: 'Foo [1] bar [1] baz [1].',
    sourcesCount: 1,
    expectedEmitted: 1,
    expectedVerified: 1,
    expectedInvalid: [],
  },
  {
    id: 'cit-05-multiple-invalidas',
    text: 'A [1] B [2] C [50] D [60].',
    sourcesCount: 5,
    expectedEmitted: 4,
    expectedVerified: 2,
    expectedInvalid: [50, 60],
  },
];

export function auditCitationVerifier(): { results: ScenarioResult[]; passRate: number } {
  const results: ScenarioResult[] = [];
  for (const c of CITATION_CASES) {
    const failures: string[] = [];
    const r = verifyCitations(c.text, c.sourcesCount);
    if (r.citationsEmitted !== c.expectedEmitted) {
      failures.push(`Emitted=${r.citationsEmitted}, esperado ${c.expectedEmitted}`);
    }
    if (r.citationsVerified !== c.expectedVerified) {
      failures.push(`Verified=${r.citationsVerified}, esperado ${c.expectedVerified}`);
    }
    const sortedActual = [...r.citationsInvalid].sort((a, b) => a - b);
    const sortedExpected = [...c.expectedInvalid].sort((a, b) => a - b);
    if (JSON.stringify(sortedActual) !== JSON.stringify(sortedExpected)) {
      failures.push(`Invalid=${JSON.stringify(sortedActual)}, esperado ${JSON.stringify(sortedExpected)}`);
    }
    results.push({
      id: c.id,
      category: 'citation_verifier',
      passed: failures.length === 0,
      failures,
    });
  }
  const passed = results.filter((r) => r.passed).length;
  return {
    results,
    passRate: results.length === 0 ? 1 : passed / results.length,
  };
}

// ─── Reporte agregado ──────────────────────────────────────────────

const SCENARIOS_VERSION = 1; // bumpear si añades/quitas escenarios

export function runFullAudit(): BiasAuditReport {
  const sg = auditSafeguards();
  const rr = auditReranker();
  const cv = auditCitationVerifier();

  const allResults = [...sg.results, ...rr.results, ...cv.results];
  const failedScenarios = allResults.filter((r) => !r.passed);

  const byCategory: BiasAuditReport['byCategory'] = {};
  for (const r of allResults) {
    if (!byCategory[r.category]) byCategory[r.category] = { total: 0, passed: 0, failRate: 0 };
    byCategory[r.category].total++;
    if (r.passed) byCategory[r.category].passed++;
  }
  for (const k of Object.keys(byCategory)) {
    const b = byCategory[k];
    b.failRate = b.total === 0 ? 0 : 1 - b.passed / b.total;
  }

  return {
    total: allResults.length,
    passed: allResults.length - failedScenarios.length,
    failed: failedScenarios.length,
    passRate: allResults.length === 0 ? 1 : (allResults.length - failedScenarios.length) / allResults.length,
    byCategory,
    failedScenarios,
    metrics: {
      safeguard_pass_rate: sg.passRate,
      safeguard_consistency_rate: sg.consistencyRate,
      reranker_grade_match_rate: rr.matchRate,
      citation_verifier_pass_rate: cv.passRate,
    },
    ranAt: new Date().toISOString(),
    scenariosVersion: SCENARIOS_VERSION,
  };
}

// Re-export para tests cómodos.
export { BIAS_AUDIT_SCENARIOS, clinicalScenarios, rejectionScenarios };
