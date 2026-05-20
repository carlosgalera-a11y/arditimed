import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Extrae la función computeDose(drug, w) del HTML del vademécum sin
// modificar el archivo. Funciona porque el HTML embebe la función como
// JS plano dentro de <script>. Si la firma cambia, el test fallará y
// te avisará — exactamente el comportamiento de no-regresión deseado.
function extractComputeDose() {
  const html = fs.readFileSync(
    path.resolve(__dirname, '../../vademecum.html'),
    'utf8',
  );
  // Buscamos: function computeDose(...){ ... } — body hasta el cierre
  // de llave coincidente.
  const start = html.indexOf('function computeDose');
  if (start === -1) throw new Error('computeDose no encontrada');
  // Contamos llaves hasta cerrar.
  let i = html.indexOf('{', start);
  let depth = 0;
  for (; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') {
      depth--;
      if (depth === 0) {
        i++;
        break;
      }
    }
  }
  const src = html.slice(start, i);
  // Lo envolvemos en una expresión que devuelva la función.
  // eslint-disable-next-line no-new-func
  return new Function(src + '; return computeDose;')();
}

let computeDose;
beforeAll(() => {
  computeDose = extractComputeDose();
});

describe('computeDose — null safety', () => {
  it('peso 0 devuelve null', () => {
    expect(computeDose({ perKg: [5] }, 0)).toBeNull();
  });

  it('peso undefined devuelve null', () => {
    expect(computeDose({ perKg: [5] }, undefined)).toBeNull();
  });

  it('peso null devuelve null', () => {
    expect(computeDose({ perKg: [5] }, null)).toBeNull();
  });

  it('drug sin perKg devuelve null', () => {
    expect(computeDose({ unit: 'mg' }, 70)).toBeNull();
  });
});

describe('computeDose — dosis fija (un solo valor en perKg)', () => {
  it('5 mg/kg en 70 kg → 350 mg', () => {
    expect(computeDose({ perKg: [5], unit: 'mg' }, 70)).toBe('350 mg');
  });

  it('5 mg/kg en 1,5 kg (neonato) → 7.5 mg', () => {
    // Caso crítico: peso decimal, output <10 debe usar 1 decimal.
    expect(computeDose({ perKg: [5], unit: 'mg' }, 1.5)).toBe('7.5 mg');
  });

  it('0,1 mg/kg en 70 kg → 7.0 mg (1 decimal porque <10)', () => {
    expect(computeDose({ perKg: [0.1], unit: 'mg' }, 70)).toBe('7.0 mg');
  });

  it('unidad por defecto es mg si no se especifica', () => {
    expect(computeDose({ perKg: [10] }, 50)).toBe('500 mg');
  });
});

describe('computeDose — rango de dosis (min-max en perKg)', () => {
  it('10–20 mg/kg en 70 kg → 700 – 1400 mg', () => {
    expect(computeDose({ perKg: [10, 20], unit: 'mg' }, 70)).toBe(
      '700 – 1400 mg',
    );
  });

  it('1–2 mg/kg en 10 kg → 10 – 20 mg', () => {
    expect(computeDose({ perKg: [1, 2], unit: 'mg' }, 10)).toBe('10 – 20 mg');
  });
});

describe('computeDose — cap (techo de dosis máxima)', () => {
  it('aplica cap cuando la dosis lo supera (paracetamol 15 mg/kg cap 1000)', () => {
    // 15 mg/kg en 90 kg = 1350 mg, pero cap=1000 → cap aplicado.
    const r = computeDose({ perKg: [15], unit: 'mg', cap: 1000 }, 90);
    expect(r).toContain('1000 mg');
    expect(r).toMatch(/máx 1000/);
  });

  it('NO aplica cap cuando la dosis no lo alcanza', () => {
    // 15 mg/kg en 50 kg = 750 mg, cap=1000 → sin cap.
    const r = computeDose({ perKg: [15], unit: 'mg', cap: 1000 }, 50);
    expect(r).toBe('750 mg');
  });
});

describe('computeDose — formato según magnitud', () => {
  it('valores <1 usan 2 decimales (0.25 mg)', () => {
    expect(computeDose({ perKg: [0.005], unit: 'mg' }, 50)).toBe('0.25 mg');
  });

  it('valores entre 1 y 10 usan 1 decimal', () => {
    expect(computeDose({ perKg: [0.1], unit: 'mg' }, 50)).toBe('5.0 mg');
  });

  it('valores ≥10 son enteros (redondeo)', () => {
    expect(computeDose({ perKg: [0.2], unit: 'mg' }, 70)).toBe('14 mg');
  });

  it('respeta unidad personalizada (mcg)', () => {
    expect(computeDose({ perKg: [2], unit: 'mcg' }, 50)).toBe('100 mcg');
  });
});
