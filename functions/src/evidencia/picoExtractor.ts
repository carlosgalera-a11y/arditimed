// ══════════════════════════════════════════════════════════════════════
// EvidenciaIA · extractor PICO
// ══════════════════════════════════════════════════════════════════════
// Convierte la pregunta libre del usuario en una estructura PICO
// (Population, Intervention, Comparison, Outcome) + términos MeSH y
// queries optimizadas para PubMed/Europe PMC. Reutiliza la chain IA
// existente (routing.ts) — el modelo educational es el más barato.
// ══════════════════════════════════════════════════════════════════════

import { buildProviderChain, tryProviderChain } from '../routing';

export interface PicoExtraction {
  P: string;
  I: string;
  C: string;
  O: string;
  palabras_clave_es: string[];
  palabras_clave_en: string[];
  mesh_terms: string[];
  contiene_farmaco: boolean;
  farmaco: string | null;
  query_pubmed: string;
  query_europepmc: string;
  raw_provider: string;
  raw_model: string;
}

const SYSTEM_PROMPT = [
  'Eres un asistente que extrae componentes PICO de preguntas clínicas.',
  'PICO = Population, Intervention, Comparison, Outcome.',
  'Output: JSON estricto, sin texto extra, sin markdown.',
  'Esquema: {',
  '  "P": string, "I": string, "C": string, "O": string,',
  '  "palabras_clave_es": string[], "palabras_clave_en": string[],',
  '  "mesh_terms": string[],',
  '  "contiene_farmaco": boolean, "farmaco": string|null,',
  '  "query_pubmed": string, "query_europepmc": string',
  '}',
  'Reglas:',
  '- Si algún componente no aplica, ponlo "" (string vacío).',
  '- mesh_terms: usa términos MeSH oficiales en inglés.',
  '- query_pubmed: combina los términos clave con AND/OR, formato PubMed.',
  '- query_europepmc: misma sintaxis que PubMed (EPMC la acepta).',
  '- Si la pregunta menciona un principio activo o medicamento concreto,',
  '  contiene_farmaco=true y "farmaco" con el nombre genérico.',
  '- NO repitas la pregunta; produce solo el JSON.',
].join('\n');

interface ExtractInput {
  pregunta: string;
  secrets: {
    deepseekKey: string;
    openrouterKey: string;
    geminiKey?: string;
    mistralKey?: string;
    qwenKey?: string;
  };
}

export async function extractPico(input: ExtractInput): Promise<PicoExtraction> {
  const userPrompt = `Pregunta clínica:\n${input.pregunta}\n\nDevuelve SOLO el JSON.`;
  const chain = buildProviderChain({
    type: 'educational',
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    secrets: input.secrets,
  });
  const r = await tryProviderChain(chain);
  const raw = r.result.text;
  const json = parseStrictJson(raw);
  return {
    P: String(json.P ?? ''),
    I: String(json.I ?? ''),
    C: String(json.C ?? ''),
    O: String(json.O ?? ''),
    palabras_clave_es: arr(json.palabras_clave_es),
    palabras_clave_en: arr(json.palabras_clave_en),
    mesh_terms: arr(json.mesh_terms),
    contiene_farmaco: json.contiene_farmaco === true,
    farmaco: typeof json.farmaco === 'string' ? json.farmaco : null,
    query_pubmed: String(json.query_pubmed ?? input.pregunta),
    query_europepmc: String(json.query_europepmc ?? input.pregunta),
    raw_provider: r.provider,
    raw_model: r.result.model,
  };
}

function arr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string');
}

function parseStrictJson(text: string): Record<string, unknown> {
  // El modelo a veces envuelve en ```json ... ```. Limpiar antes de parsear.
  const trimmed = text.trim();
  const cleaned = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    // Buscar primer bloque {...} balanceado.
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
      } catch {
        /* fallthrough */
      }
    }
    throw new Error('No se pudo parsear PICO JSON del proveedor');
  }
}
