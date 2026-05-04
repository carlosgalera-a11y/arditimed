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
  '8. Estructura tu respuesta EXACTAMENTE con estas cuatro secciones, en este orden:',
  '   ### Síntesis de la evidencia',
  '   (3-6 frases con citas [n])',
  '   ### Calidad de la evidencia',
  '   (tipo de estudios, tamaño, limitaciones metodológicas)',
  '   ### Brechas / consideraciones',
  '   (qué NO responde la evidencia disponible)',
  '   ### Preguntas relacionadas',
  '   (exactamente 3 preguntas de evidencia que un clínico podría querer explorar a continuación,',
  '    cada una en una línea propia comenzando con "- ", formuladas como búsqueda bibliográfica',
  '    y NUNCA como solicitud de diagnóstico/tratamiento individual)',
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
  texto_sintetizado: string; // ya saneado por citationVerifier (sin la sección "Preguntas relacionadas")
  texto_crudo: string;        // raw del modelo, para auditoría
  verificacion: VerificationResult;
  follow_ups: string[];       // hasta 3 preguntas relacionadas extraídas de la última sección
  provider: string;
  model: string;
}

// Extrae la sección "### Preguntas relacionadas" del texto crudo del modelo
// y devuelve hasta 3 preguntas limpias. También devuelve el texto sin esa
// sección para que la verificación de citas trabaje sobre el cuerpo principal.
export function splitFollowUps(text: string): { body: string; followUps: string[] } {
  const rx = /^###\s+Preguntas\s+relacionadas\s*$/im;
  const m = rx.exec(text);
  if (!m || m.index === undefined) return { body: text, followUps: [] };
  const body = text.slice(0, m.index).trimEnd();
  const tail = text.slice(m.index + m[0].length).trim();
  const lines = tail.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const followUps: string[] = [];
  for (const line of lines) {
    // Acepta "- ", "* ", "1. ", "1) " o líneas sueltas razonables.
    const cleaned = line.replace(/^[-*•]\s+/, '').replace(/^\d+[.)]\s+/, '').trim();
    if (cleaned.length < 8) continue;
    if (cleaned.length > 240) continue;
    // Filtra preguntas que pidan diagnóstico/tratamiento individual.
    if (/\bmi\s+paciente\b/i.test(cleaned)) continue;
    if (/\b(receto|prescribo|administro)\b/i.test(cleaned)) continue;
    followUps.push(cleaned);
    if (followUps.length === 3) break;
  }
  return { body, followUps };
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
      follow_ups: [],
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
  // Aísla la sección "Preguntas relacionadas" antes de verificar citas
  // (esa sección es de navegación, no debe contar para el ratio de citas).
  const { body, followUps } = splitFollowUps(crudo);
  const verif = verifyCitations(body, input.fuentes.length);

  return {
    texto_sintetizado: verif.text,
    texto_crudo: crudo,
    verificacion: verif,
    follow_ups: followUps,
    provider: r.provider,
    model: r.result.model,
  };
}
