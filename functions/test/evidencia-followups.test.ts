import { describe, expect, it } from 'vitest';
import { splitFollowUps } from '../src/evidencia/ragSynthesizer';

describe('ragSynthesizer.splitFollowUps', () => {
  it('devuelve [] si no hay sección de follow-ups', () => {
    const txt = '### Síntesis\nLorem ipsum [1].\n### Calidad\nbla.\n### Brechas\nbla.';
    const out = splitFollowUps(txt);
    expect(out.followUps).toEqual([]);
    expect(out.body).toBe(txt);
  });

  it('extrae 3 preguntas con guiones', () => {
    const txt = [
      '### Síntesis de la evidencia',
      'Foo [1].',
      '### Preguntas relacionadas',
      '- ¿Qué dice la evidencia sobre A en pacientes mayores?',
      '- ¿Cuál es la eficacia comparada de B vs C?',
      '- ¿Qué guías europeas recientes cubren D?',
    ].join('\n');
    const out = splitFollowUps(txt);
    expect(out.followUps).toHaveLength(3);
    expect(out.body).not.toMatch(/Preguntas relacionadas/);
  });

  it('limita a 3 aunque vengan más', () => {
    const txt = [
      '### Preguntas relacionadas',
      '- una pregunta de evidencia',
      '- otra pregunta de evidencia',
      '- tercera pregunta de evidencia',
      '- cuarta pregunta de evidencia',
      '- quinta pregunta de evidencia',
    ].join('\n');
    const out = splitFollowUps(txt);
    expect(out.followUps).toHaveLength(3);
  });

  it('filtra preguntas que mencionan "mi paciente"', () => {
    const txt = [
      '### Preguntas relacionadas',
      '- ¿Qué le doy a mi paciente con FA?',
      '- ¿Qué dice la literatura sobre apixaban en FA no valvular?',
    ].join('\n');
    const out = splitFollowUps(txt);
    expect(out.followUps).toHaveLength(1);
    expect(out.followUps[0]).toMatch(/apixaban/);
  });

  it('acepta numeración 1. 2. 3.', () => {
    const txt = [
      '### Preguntas relacionadas',
      '1. Pregunta uno suficientemente larga',
      '2. Pregunta dos suficientemente larga',
    ].join('\n');
    const out = splitFollowUps(txt);
    expect(out.followUps).toHaveLength(2);
    expect(out.followUps[0]).toBe('Pregunta uno suficientemente larga');
  });
});
