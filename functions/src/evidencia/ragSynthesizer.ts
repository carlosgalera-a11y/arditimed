// ══════════════════════════════════════════════════════════════════════
// EvidenciaIA · RAG synthesizer
// ══════════════════════════════════════════════════════════════════════
// System prompt estricto (no inventar citas, refusar si no hay evidencia,
// estructura forzada Síntesis/Calidad/Limitaciones).
// Cada abstract va con índice [n] que el modelo debe citar.
// ══════════════════════════════════════════════════════════════════════

import { buildProviderChain, tryProviderChain } from '../routing';
import type { ScoredAbstract } from './reranker';
import { verifyCitations, type VerificationResult } from './citationVerifier';

export const SYNTH_SYSTEM_PROMPT = [
  'Eres EvidenciaIA, un asistente de búsqueda bibliográfica clínica para profesionales sanitarios.',
  '',
  'REGLAS ABSOLUTAS:',
  '1. NO eres un médico ni das consejos médicos.',
  '2. NO recomiendas tratamientos, diagnósticos ni actuaciones para pacientes concretos.',
  '3. Sintetizas ÚNICAMENTE el contenido de los abstracts que se te proporcionan.',
  '4. Cada afirmación clínica DEBE ir seguida de [n] correspondiente al abstract de origen.',
  '5. Si la evidencia es limitada, contradictoria o ausente, dilo explícitamente.',
  '6. NUNCA inventas referencias. Si no puedes citar, no afirmes.',
  '7. Respondes en español salvo que se te pida lo contrario.',
  '8. Estructura tu respuesta exactamente con estas tres secciones:',
  '   ### Síntesis de la evidencia',
  '   (3-6 frases con citas [n])',
  '   ### Calidad de la evidencia',
  '   (tipo de estudios, tamaño, limitaciones metodológicas)',
  '   ### Brechas / consideraciones',
  '   (qué NO responde la evidencia disponible)',
  '',
  'Si la pregunta solicita diagnóstico o tratamiento de un paciente concreto, responde:',
  '"Esta consulta requiere juicio clínico individualizado y queda fuera del alcance de EvidenciaIA. ',
  'Te puedo ayudar a buscar evidencia sobre [reformulación general]."',
  '',
  'Si los abstracts no responden a la pregunta, responde literalmente:',
  '"### Evidencia insuficiente',
  'Los abstracts disponibles no responden directamente a esta pregunta. Reformula o amplía la búsqueda."',
].join('\n');

export interface SynthInput {
  pregunta: string;
  fuentes: ScoredAbstract[];
  secrets: {
    deepseekKey: string;
    openrouterKey: string;
    geminiKey?: string;
    mistralKey?: string;
    qwenKey?: string;
  };
}

export interface SynthOutput {
  texto_sintetizado: string; // ya saneado por citationVerifier
  texto_crudo: string;        // raw del modelo, para auditoría
  verificacion: VerificationResult;
  provider: string;
  model: string;
}

function buildContext(fuentes: ScoredAbstract[]): string {
  return fuentes
    .map((s, i) => {
      const a = s.ref;
      const yr = a.year ?? 's.f.';
      const types = (a.publication_types || []).slice(0, 3).join(', ');
      const lines = [
        `[${i + 1}] ${a.title} — ${a.journal || 's.j.'} (${yr})${types ? ' · ' + types : ''}`,
        a.abstract ? a.abstract : '(sin abstract)',
      ];
      return lines.join('\n');
    })
    .join('\n\n');
}

export async function synthesize(input: SynthInput): Promise<SynthOutput> {
  if (!input.fuentes.length) {
    return {
      texto_sintetizado:
        '### Evidencia insuficiente\nLa búsqueda no recuperó abstracts útiles. Reformula tu pregunta o amplía los filtros.',
      texto_crudo: '',
      verificacion: {
        text: '',
        citationsEmitted: 0,
        citationsVerified: 0,
        citationsInvalid: [],
        ratio: 0,
        warning: 'Sin fuentes — no se ha llamado al modelo.',
      },
      provider: 'none',
      model: 'none',
    };
  }

  const context = buildContext(input.fuentes);
  const userPrompt = [
    `Pregunta del profesional: ${input.pregunta}`,
    '',
    'Abstracts disponibles:',
    context,
    '',
    'Sintetiza la evidencia siguiendo las reglas del system prompt.',
  ].join('\n');

  const chain = buildProviderChain({
    type: 'educational',
    systemPrompt: SYNTH_SYSTEM_PROMPT,
    userPrompt,
    secrets: input.secrets,
  });
  const r = await tryProviderChain(chain);
  const crudo = r.result.text || '';
  const verif = verifyCitations(crudo, input.fuentes.length);

  return {
    texto_sintetizado: verif.text,
    texto_crudo: crudo,
    verificacion: verif,
    provider: r.provider,
    model: r.result.model,
  };
}
