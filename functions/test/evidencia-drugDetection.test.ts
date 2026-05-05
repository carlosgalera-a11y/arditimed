import { describe, expect, it } from 'vitest';
import { detectDrugQuery } from '../src/evidencia/drugDetection';

describe('drugDetection.detectDrugQuery', () => {
  it('detecta sufijos farmacológicos comunes', () => {
    expect(detectDrugQuery('evidencia sobre apixaban en FA')).toBe(true);
    expect(detectDrugQuery('omeprazol vs pantoprazol')).toBe(true);
    expect(detectDrugQuery('atenolol vs bisoprolol en HTA')).toBe(true);
    expect(detectDrugQuery('losartan en mayores')).toBe(true);
    expect(detectDrugQuery('rituximab en linfoma')).toBe(true);
    expect(detectDrugQuery('semaglutida en obesidad')).toBe(true);
    expect(detectDrugQuery('atorvastatina vs simvastatina')).toBe(true);
  });

  it('detecta palabras-clave farmacológicas', () => {
    expect(detectDrugQuery('cuál es la dosis recomendada de tratamiento X')).toBe(true);
    expect(detectDrugQuery('ficha técnica del fármaco Y')).toBe(true);
    expect(detectDrugQuery('interacciones farmacológicas relevantes')).toBe(true);
    expect(detectDrugQuery('contraindicado en insuficiencia renal')).toBe(true);
    expect(detectDrugQuery('vía oral o intravenosa')).toBe(true);
    expect(detectDrugQuery('búsqueda en AEMPS sobre algo')).toBe(true);
  });

  it('detecta clases terapéuticas', () => {
    expect(detectDrugQuery('iSGLT2 en insuficiencia cardiaca')).toBe(true);
    expect(detectDrugQuery('GLP-1 en obesidad')).toBe(true);
    expect(detectDrugQuery('IECA vs ARA-II')).toBe(true);
    expect(detectDrugQuery('IBP vs antagonistas H2')).toBe(true);
    expect(detectDrugQuery('estatinas en prevención secundaria')).toBe(true);
    expect(detectDrugQuery('anti-PCSK9 vs anti-CGRP')).toBe(true);
  });

  it('NO falso-positiva en preguntas sin marcador farmacológico', () => {
    expect(detectDrugQuery('cuál es la prevalencia de la HTA en mayores')).toBe(false);
    expect(detectDrugQuery('clasificación TNM del cáncer de pulmón')).toBe(false);
    expect(detectDrugQuery('evidencia sobre denervación renal en HTA resistente')).toBe(false);
    expect(detectDrugQuery('trombectomía mecánica ventana terapéutica')).toBe(false);
  });

  it('input vacío o invalid → false', () => {
    expect(detectDrugQuery('')).toBe(false);
  });
});
