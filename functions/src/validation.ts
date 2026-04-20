/**
 * Validación defensiva del input a askAi.
 *
 * Rechaza prompts que parecen contener identificadores personales españoles
 * (DNI, NIE) o referencias claras a historias clínicas (NHC). La detección
 * es por patrón textual — no sustituye la política interna que exige
 * seudonimizar antes de enviar.
 */

const DNI_RE = /\b\d{8}[A-HJ-NP-TV-Z]\b/;
const NIE_RE = /\b[XYZ]\d{7}[A-HJ-NP-TV-Z]\b/i;

// NHC: buscamos contexto ("NHC:", "Historia clínica", "HCLIN") seguido de >=5 dígitos.
// Evita falsos positivos con teléfonos o fechas sueltas.
const NHC_RE = /\b(?:NHC|HCLIN|historia\s*cl[ií]nica|n[°º]?\s*historia)[\s:]*\d{5,}/i;

export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

export function validatePrompt(prompt: unknown): ValidationResult {
  if (typeof prompt !== 'string') return { ok: false, reason: 'prompt debe ser string' };
  const trimmed = prompt.trim();
  if (trimmed.length < 1) return { ok: false, reason: 'prompt vacío' };
  if (trimmed.length > 8000) return { ok: false, reason: 'prompt excede 8000 caracteres' };
  if (DNI_RE.test(trimmed)) return { ok: false, reason: 'el prompt contiene un DNI. Seudonimizar antes de enviar.' };
  if (NIE_RE.test(trimmed)) return { ok: false, reason: 'el prompt contiene un NIE. Seudonimizar antes de enviar.' };
  if (NHC_RE.test(trimmed)) return { ok: false, reason: 'el prompt referencia un NHC. Seudonimizar antes de enviar.' };
  return { ok: true };
}

export function validateSystemPrompt(sp: unknown): ValidationResult {
  if (sp === undefined || sp === null || sp === '') return { ok: true };
  if (typeof sp !== 'string') return { ok: false, reason: 'systemPrompt debe ser string' };
  if (sp.length > 4000) return { ok: false, reason: 'systemPrompt excede 4000 caracteres' };
  return { ok: true };
}

export function validateImageBase64(img: unknown): ValidationResult {
  if (img === undefined || img === null || img === '') return { ok: true };
  if (typeof img !== 'string') return { ok: false, reason: 'imageBase64 debe ser string' };
  // 7 MB base64 encoded ≈ 5 MB raw image
  if (img.length > 7 * 1024 * 1024) return { ok: false, reason: 'imagen demasiado grande (>5 MB)' };
  return { ok: true };
}

export function sanitizeForLog(prompt: string): string {
  // Para metadatos seguros: truncar a 40 chars y eliminar saltos.
  return prompt.replace(/\s+/g, ' ').substring(0, 40);
}
