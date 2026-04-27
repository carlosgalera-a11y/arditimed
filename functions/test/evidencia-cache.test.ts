import { describe, expect, it } from 'vitest';
import { hashEviKey } from '../src/evidencia/cache';

describe('evidencia.cache.hashEviKey', () => {
  it('mismas partes → mismo hash', () => {
    const a = hashEviKey({
      pregunta: 'apixaban en FA no valvular',
      sintetizar: true,
      anios: 5,
      soloRevisiones: true,
      incluirAemps: false,
    });
    const b = hashEviKey({
      pregunta: 'apixaban en FA no valvular',
      sintetizar: true,
      anios: 5,
      soloRevisiones: true,
      incluirAemps: false,
    });
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it('preguntas con mayúsculas/tildes/puntuación distinta → mismo hash', () => {
    const a = hashEviKey({
      pregunta: 'apixaban en FA no valvular',
      sintetizar: true,
      anios: 5,
      soloRevisiones: false,
      incluirAemps: false,
    });
    const b = hashEviKey({
      pregunta: 'Apixabán EN, fa no valvular!',
      sintetizar: true,
      anios: 5,
      soloRevisiones: false,
      incluirAemps: false,
    });
    expect(a).toBe(b);
  });

  it('cambia el hash si cambia un filtro', () => {
    const a = hashEviKey({
      pregunta: 'apixaban en FA',
      sintetizar: true,
      anios: 5,
      soloRevisiones: false,
      incluirAemps: false,
    });
    const b = hashEviKey({
      pregunta: 'apixaban en FA',
      sintetizar: true,
      anios: 10, // ← distinto
      soloRevisiones: false,
      incluirAemps: false,
    });
    expect(a).not.toBe(b);
  });

  it('respeta valores numéricos en la pregunta (>75 ≠ >65)', () => {
    const a = hashEviKey({
      pregunta: 'apixaban FA >75 años',
      sintetizar: true,
      anios: 5,
      soloRevisiones: false,
      incluirAemps: false,
    });
    const b = hashEviKey({
      pregunta: 'apixaban FA >65 años',
      sintetizar: true,
      anios: 5,
      soloRevisiones: false,
      incluirAemps: false,
    });
    expect(a).not.toBe(b);
  });

  it('cambia el hash si cambia sintetizar', () => {
    const a = hashEviKey({
      pregunta: 'apixaban en FA',
      sintetizar: true,
      anios: 5,
      soloRevisiones: false,
      incluirAemps: false,
    });
    const b = hashEviKey({
      pregunta: 'apixaban en FA',
      sintetizar: false,
      anios: 5,
      soloRevisiones: false,
      incluirAemps: false,
    });
    expect(a).not.toBe(b);
  });
});
