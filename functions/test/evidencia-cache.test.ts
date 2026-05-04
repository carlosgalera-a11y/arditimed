import { describe, expect, it } from 'vitest';
import { hashEviKey, type EviCacheKeyParts } from '../src/evidencia/cache';

const BASE: EviCacheKeyParts = {
  pregunta: 'apixaban en FA no valvular',
  sintetizar: true,
  anios: 5,
  soloRevisiones: true,
  incluirAemps: false,
  incluirEnsayos: false,
  soloEnsayosActivos: false,
  soloEnsayosUE: false,
  priorizarCochrane: false,
  enriquecerOA: false,
};

describe('evidencia.cache.hashEviKey', () => {
  it('mismas partes → mismo hash', () => {
    const a = hashEviKey(BASE);
    const b = hashEviKey({ ...BASE });
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it('preguntas con mayúsculas/tildes/puntuación distinta → mismo hash', () => {
    const a = hashEviKey({ ...BASE, soloRevisiones: false });
    const b = hashEviKey({ ...BASE, soloRevisiones: false, pregunta: 'Apixabán EN, fa no valvular!' });
    expect(a).toBe(b);
  });

  it('cambia el hash si cambia un filtro', () => {
    const a = hashEviKey({ ...BASE, soloRevisiones: false, anios: 5 });
    const b = hashEviKey({ ...BASE, soloRevisiones: false, anios: 10 });
    expect(a).not.toBe(b);
  });

  it('respeta valores numéricos en la pregunta (>75 ≠ >65)', () => {
    const a = hashEviKey({ ...BASE, soloRevisiones: false, pregunta: 'apixaban FA >75 años' });
    const b = hashEviKey({ ...BASE, soloRevisiones: false, pregunta: 'apixaban FA >65 años' });
    expect(a).not.toBe(b);
  });

  it('cambia el hash si cambia sintetizar', () => {
    const a = hashEviKey({ ...BASE, soloRevisiones: false, sintetizar: true });
    const b = hashEviKey({ ...BASE, soloRevisiones: false, sintetizar: false });
    expect(a).not.toBe(b);
  });

  it('cambia el hash si cambia incluirEnsayos', () => {
    const a = hashEviKey({ ...BASE, incluirEnsayos: false });
    const b = hashEviKey({ ...BASE, incluirEnsayos: true });
    expect(a).not.toBe(b);
  });

  it('cambia el hash si cambia priorizarCochrane', () => {
    const a = hashEviKey({ ...BASE, priorizarCochrane: false });
    const b = hashEviKey({ ...BASE, priorizarCochrane: true });
    expect(a).not.toBe(b);
  });

  it('cambia el hash si cambia enriquecerOA', () => {
    const a = hashEviKey({ ...BASE, enriquecerOA: false });
    const b = hashEviKey({ ...BASE, enriquecerOA: true });
    expect(a).not.toBe(b);
  });
});
