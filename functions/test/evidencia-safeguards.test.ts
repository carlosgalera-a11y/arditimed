import { describe, expect, it } from 'vitest';
import { validarPregunta } from '../src/evidencia/safeguards';

describe('safeguards.validarPregunta — longitud', () => {
  it('rechaza < 15 chars', () => {
    const r = validarPregunta('corta');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe('demasiado_corta');
  });
  it('rechaza > 500 chars', () => {
    const r = validarPregunta('a'.repeat(501));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe('demasiado_larga');
  });
  it('acepta longitud razonable', () => {
    const r = validarPregunta('¿Qué dice la evidencia sobre apixaban en FA no valvular?');
    expect(r.ok).toBe(true);
  });
});

describe('safeguards.validarPregunta — consultas diagnósticas', () => {
  it('rechaza "qué tiene mi paciente"', () => {
    const r = validarPregunta('Qué tiene mi paciente con dolor torácico irradiado');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe('consulta_diagnostica');
  });
  it('rechaza "tiene cáncer"', () => {
    const r = validarPregunta('Mi paciente tiene cáncer de páncreas, qué hago');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe('consulta_diagnostica');
  });
});

describe('safeguards.validarPregunta — consultas terapéuticas individuales', () => {
  it('rechaza "qué dosis le pongo"', () => {
    const r = validarPregunta('Qué dosis de heparina le pongo a este paciente con FA');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe('consulta_terapeutica_individual');
  });
  it('rechaza "es urgente operar"', () => {
    const r = validarPregunta('Es urgente operar a un paciente con apendicitis aguda');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe('consulta_terapeutica_individual');
  });
});

describe('safeguards.validarPregunta — PII', () => {
  it('rechaza DNI español', () => {
    const r = validarPregunta('Tratamiento óptimo para 12345678Z con HTA');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe('pii_dni');
  });
  it('rechaza NIE', () => {
    const r = validarPregunta('Cuál es el manejo para X1234567L con neumonía');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe('pii_nie');
  });
  it('rechaza fecha dd/mm/yyyy', () => {
    const r = validarPregunta('Manejo de paciente desde 12/03/1980 con neumonía');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe('pii_fecha');
  });
  it('rechaza teléfono español', () => {
    const r = validarPregunta('Evidencia sobre llamada al 666123456 para teleconsulta');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe('pii_telefono');
  });
});

describe('safeguards.validarPregunta — sanitización', () => {
  it('colapsa espacios múltiples', () => {
    const r = validarPregunta('Evidencia    sobre   apixaban en  FA');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.sanitized).toBe('Evidencia sobre apixaban en FA');
  });
});
