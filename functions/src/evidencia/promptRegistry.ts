// ══════════════════════════════════════════════════════════════════════
// EvidenciaIA · prompt registry & versioning (AI Act art. 12)
// ══════════════════════════════════════════════════════════════════════
// Calcula un fingerprint SHA-256 de cada system prompt en uso (PICO,
// síntesis RAG) para vincular cada respuesta del modelo a una versión
// concreta y reproducible del prompt. Si el prompt cambia, el hash cambia
// automáticamente — sin trabajo manual.
//
// El hash se calcula al cargar el módulo (constante en runtime). Se loguea
// junto con cada respuesta en `evidencia_consultas.prompt_version_pico`
// y `evidencia_consultas.prompt_version_synth`. Combinado con git history
// y `09-model-versioning.md`, permite reproducir cualquier respuesta
// histórica.
// ══════════════════════════════════════════════════════════════════════

import { createHash } from 'node:crypto';
import { SYSTEM_PROMPT as PICO_SYSTEM_PROMPT } from './picoExtractor';
import { SYNTH_SYSTEM_PROMPT } from './ragSynthesizer';

/**
 * Calcula el fingerprint corto de un prompt: SHA-256 truncado a 12 chars
 * hex. Suficiente para distinguir versiones reales sin saturar el log.
 *
 * @param prompt Cadena exacta del system prompt en uso.
 * @returns Hash hex de 12 chars (ej. "a3f9c2b81d04").
 */
export function hashPrompt(prompt: string): string {
  return createHash('sha256').update(prompt, 'utf8').digest('hex').slice(0, 12);
}

/**
 * Fingerprints de los prompts en uso en este build. Calculados al cargar
 * el módulo, son constantes en runtime. Si el código del prompt cambia
 * en una nueva release, estos valores cambian automáticamente.
 */
export const PROMPT_VERSIONS = {
  pico: hashPrompt(PICO_SYSTEM_PROMPT),
  synth: hashPrompt(SYNTH_SYSTEM_PROMPT),
} as const;

/**
 * Tipo público para serializar la versión en logs.
 */
export interface PromptVersionSnapshot {
  pico: string;
  synth: string;
}

/**
 * Devuelve la versión actual lista para log. Pensado para inyectar en
 * `evidencia_consultas` y exponer al cliente para auditoría.
 */
export function currentPromptVersions(): PromptVersionSnapshot {
  return { pico: PROMPT_VERSIONS.pico, synth: PROMPT_VERSIONS.synth };
}
