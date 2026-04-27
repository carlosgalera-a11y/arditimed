// ══════════════════════════════════════════════════════════════════════
// EvidenciaIA · safeguards de cumplimiento (EU AI Act art. 50, art. 5)
// ══════════════════════════════════════════════════════════════════════
// EvidenciaIA es una herramienta de búsqueda bibliográfica clínica con
// síntesis IA. Encuadre regulatorio: riesgo limitado (art. 50, deber de
// transparencia). NO es soporte a decisión clínica (art. 6, alto riesgo).
//
// Estos safeguards bloquean preguntas que pretendan diagnóstico o
// tratamiento de un paciente concreto y eliminan PII básica (DNI, fecha
// nacimiento). El log de cada rechazo va a /evidencia_consultas con
// motivo, para auditoría.
// ══════════════════════════════════════════════════════════════════════

export type ValidationResult =
  | { ok: true; sanitized: string }
  | { ok: false; motivo: ValidationMotivo; mensaje: string };

export type ValidationMotivo =
  | 'demasiado_corta'
  | 'demasiado_larga'
  | 'consulta_diagnostica'
  | 'consulta_terapeutica_individual'
  | 'pii_dni'
  | 'pii_nie'
  | 'pii_fecha'
  | 'pii_telefono'
  | 'idioma_no_soportado';

const PATRONES_DIAGNOSTICOS: ReadonlyArray<RegExp> = [
  /qu[eé]\s+tiene\s+mi\s+paciente/i,
  /diagn[oó]stico\s+de\s+mi\s+paciente/i,
  /diagn[oó]stico\s+diferencial\s+de\s+(este|mi|un)\s+paciente/i,
  /tiene\s+(c[aá]ncer|tumor|infarto|ictus)/i,
  /es\s+un\s+(c[aá]ncer|infarto|ictus|tumor)/i,
  /es\s+(maligno|benigno)/i,
];

const PATRONES_TERAPEUTICOS: ReadonlyArray<RegExp> = [
  /qu[eé]\s+(le\s+)?(receto|prescribo|pongo|doy|administro)/i,
  /qu[eé]\s+dosis\s+le\s+(pongo|doy|prescribo)/i,
  /es\s+urgente\s+(operar|intervenir|derivar)/i,
  /(tengo|debo)\s+que\s+operarl[oa]/i,
  /a\s+qu[eé]\s+hospital\s+lo\s+derivo/i,
];

const PATRONES_PII: Array<{ rx: RegExp; motivo: ValidationMotivo }> = [
  { rx: /\b\d{8}[A-HJ-NP-TV-Z]\b/, motivo: 'pii_dni' },
  { rx: /\b[XYZ]\d{7}[A-HJ-NP-TV-Z]\b/, motivo: 'pii_nie' },
  { rx: /\b\d{2}\/\d{2}\/\d{4}\b/, motivo: 'pii_fecha' },
  { rx: /\b(\+34\s?)?[6789]\d{8}\b/, motivo: 'pii_telefono' },
];

const MENSAJE_DIAGNOSTICO =
  'EvidenciaIA es una herramienta de búsqueda bibliográfica, no de soporte a decisión clínica. ' +
  'Reformula tu pregunta sobre la evidencia disponible. ' +
  'Ejemplo: en lugar de "¿qué tiene mi paciente con X?", prueba "¿qué dice la literatura sobre el diagnóstico diferencial de X en pacientes con Y?".';

const MENSAJE_TERAPEUTICO =
  'EvidenciaIA no recomienda tratamientos para pacientes concretos. ' +
  'Reformula como pregunta de evidencia. ' +
  'Ejemplo: en lugar de "¿qué dosis le pongo?", prueba "¿qué dosis recomiendan las guías para X en pacientes con Y?".';

const MENSAJE_PII =
  'Tu pregunta contiene datos personales (DNI/NIE, fecha o teléfono). ' +
  'EvidenciaIA solo trata búsquedas bibliográficas anonimizadas. ' +
  'Reformula sin datos identificativos del paciente.';

export function validarPregunta(texto: string): ValidationResult {
  const t = (texto ?? '').trim();

  if (t.length < 15) {
    return { ok: false, motivo: 'demasiado_corta', mensaje: 'Pregunta demasiado corta (mínimo 15 caracteres).' };
  }
  if (t.length > 500) {
    return { ok: false, motivo: 'demasiado_larga', mensaje: 'Pregunta demasiado larga (máximo 500 caracteres).' };
  }

  for (const rx of PATRONES_DIAGNOSTICOS) {
    if (rx.test(t)) return { ok: false, motivo: 'consulta_diagnostica', mensaje: MENSAJE_DIAGNOSTICO };
  }
  for (const rx of PATRONES_TERAPEUTICOS) {
    if (rx.test(t)) return { ok: false, motivo: 'consulta_terapeutica_individual', mensaje: MENSAJE_TERAPEUTICO };
  }
  for (const { rx, motivo } of PATRONES_PII) {
    if (rx.test(t)) return { ok: false, motivo, mensaje: MENSAJE_PII };
  }

  // Sanitización mínima — colapsa espacios.
  const sanitized = t.replace(/\s+/g, ' ');
  return { ok: true, sanitized };
}
