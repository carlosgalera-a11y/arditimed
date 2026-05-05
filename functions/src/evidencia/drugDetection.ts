// ══════════════════════════════════════════════════════════════════════
// EvidenciaIA · detección heurística de pregunta farmacológica
// ══════════════════════════════════════════════════════════════════════
// Heurística determinista (sin IA) para decidir si activar AEMPS CIMA
// automáticamente. Combina dos señales:
//   1. PICO extractor ya marcó `contiene_farmaco=true` (preferido si existe).
//   2. Patrones de texto: sufijos farmacológicos (-cina, -olol, -mab, -ib),
//      palabras-clave (dosis, ficha técnica, posología, interacción,
//      contraindicación, contraindicado, principio activo) o nombres de
//      clases terapéuticas comunes.
//
// El objetivo es activar AEMPS sin que el usuario tenga que marcar el
// checkbox cuando la pregunta es claramente farmacológica — paridad UX
// con el "auto-detect drug query" de Kleia.
// ══════════════════════════════════════════════════════════════════════

const DRUG_SUFFIXES: ReadonlyArray<RegExp> = [
  /\b\w{4,}cilin[ao]\b/i,        // -cilina (penicilina, amoxicilina)
  /\b\w{4,}cina\b/i,             // -cina (vancomicina, gentamicina)
  /\b\w{2,}prazol\b/i,           // -prazol (omeprazol, pantoprazol, esomeprazol)
  /\b\w{4,}olol\b/i,             // -olol (atenolol, bisoprolol, propranolol)
  /\b\w{4,}pril\b/i,             // -pril (enalapril, ramipril)
  /\b\w{2,}sart[aá]n\b/i,        // -sartán (losartán, valsartán, irbesartán)
  /\b\w{4,}floxacin[ao]\b/i,     // -floxacino (ciprofloxacino, levofloxacino)
  /\b\w{4,}icina\b/i,            // -icina (claritromicina, eritromicina)
  /\b\w{4,}mab\b/i,              // -mab (mAb biológicos: rituximab, infliximab)
  /\b\w{3,}xab[aá]n\b/i,         // -xabán (apixabán, rivaroxabán, edoxabán)
  /\b\w{4,}gliflozin[ao]\b/i,    // -gliflozina (empagliflozina, dapagliflozina)
  /\b\w{4,}glutid[ao]\b/i,       // -glutida (semaglutida, liraglutida)
  /\b\w{4,}stat\w*\b/i,          // -stat / -statina (atorvastatina, simvastatina)
];

const DRUG_KEYWORDS: ReadonlyArray<RegExp> = [
  /\bficha\s+t[eé]cnica\b/i,
  /\bposolog[íi]a\b/i,
  /\bdosis\s+(de|recomendada|m[aá]xima|m[íi]nima|estandard|inicial)\b/i,
  /\bd[oó]sis\b/i,
  /\binteracci[oó]n(es)?\s+(farmacol[oó]gic|medicament|fármaco|f[aá]rmac)/i,
  /\bcontraindic(aci[oó]n|ado)/i,
  /\bprincipio\s+activo\b/i,
  /\befectos\s+secundarios\b/i,
  /\breacciones\s+adversas\b/i,
  /\bvía\s+(oral|iv|im|sc|subcut[aá]nea|intravenosa|intramuscular)\b/i,
  /\bAEMPS\b/,
  /\bCIMA\b/,
];

const DRUG_CLASSES: ReadonlyArray<RegExp> = [
  /\biSGLT2\b/i,
  /\bGLP[-\s]?1\b/i,
  /\bDOAC[s]?\b/i,
  /\bIECA[s]?\b/i,
  /\bARA[-\s]?II\b/i,
  /\bIBP\b/i,
  /\bAINE[s]?\b/i,
  /\bbetabloque(ante|antes)\b/i,
  /\bestatinas?\b/i,
  /\banticoagulant[eo]s?\b/i,
  /\banti[-\s]?PCSK9\b/i,
  /\banti[-\s]?CGRP\b/i,
  /\banti[-\s]?IL[-\s]?5\b/i,
  /\binhibidor(es)?\s+JAK\b/i,
  /\bbisfosfonatos?\b/i,
];

/**
 * Devuelve true si la pregunta sanitizada tiene marcadores farmacológicos
 * fuertes que justifiquen activar AEMPS automáticamente.
 *
 * Conservadora: solo dispara si encuentra al menos 1 patrón claro. No
 * activa por palabras genéricas como "tratamiento" o "fármaco" solas.
 */
export function detectDrugQuery(sanitized: string): boolean {
  const t = sanitized || '';
  for (const rx of DRUG_SUFFIXES) if (rx.test(t)) return true;
  for (const rx of DRUG_KEYWORDS) if (rx.test(t)) return true;
  for (const rx of DRUG_CLASSES) if (rx.test(t)) return true;
  return false;
}
