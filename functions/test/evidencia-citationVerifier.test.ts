import { describe, expect, it } from 'vitest';
import { verifyCitations } from '../src/evidencia/citationVerifier';

describe('citationVerifier.verifyCitations', () => {
  it('todas las citas válidas → ratio 1', () => {
    const r = verifyCitations('Resultado [1] confirmado por [2] y [3].', 3);
    expect(r.citationsEmitted).toBe(3);
    expect(r.citationsVerified).toBe(3);
    expect(r.citationsInvalid).toEqual([]);
    expect(r.ratio).toBe(1);
    expect(r.warning).toBeNull();
  });

  it('cita inventada [9] con solo 3 fuentes → marca y ratio < 1', () => {
    const r = verifyCitations('Estudio [1] dice X, pero [9] sugiere Y.', 3);
    expect(r.citationsEmitted).toBe(2);
    expect(r.citationsInvalid).toContain(9);
    expect(r.ratio).toBe(0.5);
    expect(r.text).toContain('[cita no verificable]');
    expect(r.text).not.toContain('[9]');
    expect(r.warning).toMatch(/no se corresponden/);
  });

  it('sin citas → warning específico', () => {
    const r = verifyCitations('Síntesis sin citar nada.', 5);
    expect(r.citationsEmitted).toBe(0);
    expect(r.ratio).toBe(0);
    expect(r.warning).toMatch(/no incluye citas/);
  });

  it('cuenta cada [n] una sola vez aunque aparezca varias veces', () => {
    const r = verifyCitations('Cita [1] aquí y [1] de nuevo, también [2].', 2);
    expect(r.citationsEmitted).toBe(2);
    expect(r.citationsVerified).toBe(2);
  });

  it('respeta sourceCount=0 (todas inválidas)', () => {
    const r = verifyCitations('Texto con [1] y [2].', 0);
    expect(r.citationsEmitted).toBe(2);
    expect(r.citationsVerified).toBe(0);
    expect(r.text).not.toMatch(/\[\d+\]/);
  });
});
