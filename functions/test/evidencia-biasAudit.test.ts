import { describe, expect, it } from 'vitest';
import {
  auditSafeguards,
  auditReranker,
  auditCitationVerifier,
  runFullAudit,
} from '../src/evidencia/biasAudit';
import {
  BIAS_AUDIT_SCENARIOS,
  clinicalScenarios,
  rejectionScenarios,
} from '../src/evidencia/biasAuditScenarios';

// ─── Cobertura ─────────────────────────────────────────────────────

describe('biasAudit · cobertura del conjunto', () => {
  it('tiene al menos 25 escenarios clínicos', () => {
    expect(clinicalScenarios().length).toBeGreaterThanOrEqual(25);
  });

  it('tiene al menos 6 escenarios de rechazo', () => {
    expect(rejectionScenarios().length).toBeGreaterThanOrEqual(6);
  });

  it('cubre las 6 especialidades requeridas', () => {
    const cats = new Set(clinicalScenarios().map((s) => s.category));
    for (const required of ['cardiología', 'respiratorio', 'digestivo', 'infecciosas', 'endocrino', 'neurología']) {
      expect(cats.has(required as never)).toBe(true);
    }
  });

  it('tiene al menos 5 variantes de sesgo (gender/edad)', () => {
    const variants = clinicalScenarios().reduce(
      (sum, s) => sum + (s.biasVariants?.length ?? 0),
      0,
    );
    expect(variants).toBeGreaterThanOrEqual(5);
  });

  it('cubre todos los motivos de rechazo de safeguards', () => {
    const reasons = new Set(
      rejectionScenarios().map((s) => s.expectedRejectionReason).filter(Boolean),
    );
    for (const required of [
      'demasiado_corta',
      'demasiado_larga',
      'consulta_diagnostica',
      'consulta_terapeutica_individual',
      'pii_dni',
      'pii_fecha',
      'pii_telefono',
    ]) {
      expect(reasons.has(required as never)).toBe(true);
    }
  });

  it('IDs de escenarios son únicos', () => {
    const ids = BIAS_AUDIT_SCENARIOS.map((s) => s.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

// ─── Auditoría safeguards ─────────────────────────────────────────

describe('biasAudit · safeguards', () => {
  it('todos los escenarios cumplen su outcome esperado de safeguards', () => {
    const r = auditSafeguards();
    if (r.passRate < 1) {
      const failed = r.results.filter((x) => !x.passed);
      console.error('Safeguard failures:', JSON.stringify(failed, null, 2));
    }
    expect(r.passRate).toBe(1);
  });

  it('todas las variantes de sesgo (gender/edad) son tratadas igual que el base', () => {
    const r = auditSafeguards();
    expect(r.consistencyRate).toBe(1);
  });
});

// ─── Auditoría reranker ───────────────────────────────────────────

describe('biasAudit · reranker grade', () => {
  it('reranker asigna grado ≥ esperado en todos los escenarios clínicos', () => {
    const r = auditReranker();
    if (r.matchRate < 1) {
      const failed = r.results.filter((x) => !x.passed);
      console.error('Reranker grade failures:', JSON.stringify(failed, null, 2));
    }
    expect(r.matchRate).toBe(1);
  });
});

// ─── Auditoría citation verifier ───────────────────────────────────

describe('biasAudit · citation verifier', () => {
  it('citation verifier detecta correctamente todos los casos sintéticos', () => {
    const r = auditCitationVerifier();
    if (r.passRate < 1) {
      const failed = r.results.filter((x) => !x.passed);
      console.error('Citation verifier failures:', JSON.stringify(failed, null, 2));
    }
    expect(r.passRate).toBe(1);
  });
});

// ─── Reporte agregado ──────────────────────────────────────────────

describe('biasAudit · reporte agregado', () => {
  it('runFullAudit produce un reporte con todas las métricas y umbrales mínimos', () => {
    const report = runFullAudit();
    expect(report.metrics.safeguard_pass_rate).toBeGreaterThanOrEqual(0.99);
    expect(report.metrics.safeguard_consistency_rate).toBe(1);
    expect(report.metrics.reranker_grade_match_rate).toBeGreaterThanOrEqual(0.8);
    expect(report.metrics.citation_verifier_pass_rate).toBe(1);
    expect(report.passRate).toBeGreaterThanOrEqual(0.95);
    expect(report.scenariosVersion).toBeGreaterThanOrEqual(1);
    expect(report.ranAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
