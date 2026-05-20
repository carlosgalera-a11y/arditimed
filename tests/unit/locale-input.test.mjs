import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// locale-input.js exporta vía CommonJS cuando module.exports está
// disponible (Node). Lo cargamos directamente.
const { parseLocaleNumber } = require(
  path.resolve(__dirname, '../../locale-input.js'),
);

describe('parseLocaleNumber — formato español', () => {
  it('acepta coma decimal: "70,5" → 70.5', () => {
    expect(parseLocaleNumber('70,5')).toBe(70.5);
  });

  it('acepta espacios alrededor: " 70 ,5 " → 70.5', () => {
    expect(parseLocaleNumber(' 70 ,5 ')).toBe(70.5);
  });

  it('acepta signo negativo con coma: "-3,2" → -3.2', () => {
    expect(parseLocaleNumber('-3,2')).toBe(-3.2);
  });

  it('acepta separador de miles europeo: "1.234,56" → 1234.56', () => {
    expect(parseLocaleNumber('1.234,56')).toBe(1234.56);
  });

  it('acepta separador de miles anglosajón: "1,234.56" → 1234.56', () => {
    expect(parseLocaleNumber('1,234.56')).toBe(1234.56);
  });
});

describe('parseLocaleNumber — formato internacional', () => {
  it('acepta punto decimal: "70.5" → 70.5', () => {
    expect(parseLocaleNumber('70.5')).toBe(70.5);
  });

  it('acepta entero: "42" → 42', () => {
    expect(parseLocaleNumber('42')).toBe(42);
  });

  it('acepta decimales largos: "3.14159" → 3.14159', () => {
    expect(parseLocaleNumber('3.14159')).toBeCloseTo(3.14159, 5);
  });

  it('acepta número directo: number → number', () => {
    expect(parseLocaleNumber(70.5)).toBe(70.5);
  });
});

describe('parseLocaleNumber — rechazos (devuelve null, no NaN)', () => {
  it('rechaza string vacío → null', () => {
    expect(parseLocaleNumber('')).toBeNull();
  });

  it('rechaza solo espacios → null', () => {
    expect(parseLocaleNumber('   ')).toBeNull();
  });

  it('rechaza texto puro → null', () => {
    expect(parseLocaleNumber('abc')).toBeNull();
  });

  it('rechaza dos comas: "1,2,3" → null', () => {
    expect(parseLocaleNumber('1,2,3')).toBeNull();
  });

  it('rechaza dos puntos: "1.2.3" → null', () => {
    expect(parseLocaleNumber('1.2.3')).toBeNull();
  });

  it('rechaza null → null', () => {
    expect(parseLocaleNumber(null)).toBeNull();
  });

  it('rechaza undefined → null', () => {
    expect(parseLocaleNumber(undefined)).toBeNull();
  });

  it('rechaza NaN → null', () => {
    expect(parseLocaleNumber(NaN)).toBeNull();
  });

  it('rechaza Infinity → null', () => {
    expect(parseLocaleNumber(Infinity)).toBeNull();
  });

  it('rechaza con letras mezcladas: "70,5 kg" → null', () => {
    expect(parseLocaleNumber('70,5 kg')).toBeNull();
  });

  it('rechaza coma sola sin dígitos: "," → null', () => {
    expect(parseLocaleNumber(',')).toBeNull();
  });
});

describe('parseLocaleNumber — caso crítico clínico', () => {
  it('CRÍTICO: "1,5" en dosis pediátrica NO debe devolver 1 ni NaN', () => {
    // Antes del fix: parseFloat("1,5") → 1, lo que en una calculadora
    // de dosis pediátrica (5 mg/kg para 1,5 kg) daba 5 mg en vez de
    // 7,5 mg. Test de no-regresión.
    const dosePerKg = 5; // mg/kg
    const weight = parseLocaleNumber('1,5');
    expect(weight).toBe(1.5);
    expect(weight * dosePerKg).toBe(7.5);
  });

  it('CRÍTICO: input inválido NO debe coercionarse a 0', () => {
    // parseFloat("abc") → NaN. NaN * 5 = NaN. NaN >= 0 = false. Pero
    // algunos paths lo coercionaban a 0 con `|| 0`. Aquí null obliga
    // al caller a manejarlo, no silenciar.
    expect(parseLocaleNumber('xyz')).toBeNull();
  });
});
