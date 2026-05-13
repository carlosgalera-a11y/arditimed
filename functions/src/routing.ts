import type { AiType, ProviderCall, ProviderResult } from './types';
import { callGemini } from './providers/gemini';
import { callDeepSeek } from './providers/deepseek';
import { callMistral } from './providers/mistral';
import { callQwen } from './providers/qwen';
import { callOpenRouter } from './providers/openrouter';

interface RoutingSecrets {
  // Obligatorios (deploy falla si faltan):
  deepseekKey: string;
  openrouterKey: string;
  // Opcionales — si se proveen, tienen prioridad sobre OpenRouter.
  // Añadirlos implica registrarlos también en askAi.ts `secrets: [...]`.
  geminiKey?: string;
  mistralKey?: string;
  qwenKey?: string;
}

interface RoutingInput {
  type: AiType;
  userPrompt: string;
  systemPrompt: string;
  imageBase64?: string;
  modelOverride?: string;
  secrets: RoutingSecrets;
}

/**
 * Construye la cadena de providers a intentar en orden.
 *
 * Estrategia: clave directa primero (si existe) → OpenRouter con el equivalente
 * → OpenRouter con un modelo alternativo. Esto permite deployar con solo 2
 * secretos (DEEPSEEK + OPENROUTER) y añadir direct keys después sin tocar
 * código fuera de askAi.ts.
 *
 * Nota EU residency: OpenRouter no garantiza routing EU. Para cumplir
 * estrictamente CLAUDE.md (clinical_case en UE) hay que añadir GEMINI_API_KEY
 * y MISTRAL_API_KEY directas — la cadena las prefiere automáticamente.
 */
export function buildProviderChain(input: RoutingInput): ProviderCall[] {
  const { type, userPrompt, systemPrompt, imageBase64, modelOverride, secrets } = input;
  const chain: ProviderCall[] = [];

  // Constantes: Qwen2.5-VL-72B es el primario para clinical_case y vision.
  const QWEN_DIRECT = 'qwen2.5-vl-72b-instruct';
  const QWEN_OR = 'qwen/qwen2.5-vl-72b-instruct';

  switch (type) {
    case 'clinical_case': {
      // Qwen2.5-VL-72B primario (directo si hay qwenKey, si no OpenRouter).
      // Fallbacks: Gemini/Mistral directos (si hay keys) → OpenRouter equivalentes.
      const directModel = modelOverride || QWEN_DIRECT;
      if (secrets.qwenKey) {
        chain.push({
          name: 'qwen',
          model: directModel,
          execute: () => callQwen({ apiKey: secrets.qwenKey!, model: directModel, systemPrompt, userPrompt }),
        });
      }
      chain.push({
        name: 'openrouter',
        model: QWEN_OR,
        execute: () => callOpenRouter({ apiKey: secrets.openrouterKey, model: QWEN_OR, systemPrompt, userPrompt }),
      });
      if (secrets.geminiKey) {
        chain.push({
          name: 'gemini',
          model: 'gemini-2.5-flash-lite',
          execute: () => callGemini({ apiKey: secrets.geminiKey!, model: 'gemini-2.5-flash-lite', systemPrompt, userPrompt }),
        });
      }
      if (secrets.mistralKey) {
        chain.push({
          name: 'mistral',
          model: 'mistral-small-latest',
          execute: () => callMistral({ apiKey: secrets.mistralKey!, model: 'mistral-small-latest', systemPrompt, userPrompt }),
        });
      }
      chain.push({
        name: 'openrouter',
        model: 'google/gemini-2.5-flash-lite',
        execute: () => callOpenRouter({ apiKey: secrets.openrouterKey, model: 'google/gemini-2.5-flash-lite', systemPrompt, userPrompt }),
      });
      chain.push({
        name: 'openrouter',
        model: 'mistralai/mistral-small-3.2-24b-instruct',
        execute: () => callOpenRouter({ apiKey: secrets.openrouterKey, model: 'mistralai/mistral-small-3.2-24b-instruct', systemPrompt, userPrompt }),
      });
      return chain;
    }

    case 'educational': {
      // Orden: DeepSeek PRIMARIO, Gemini solo como fallback cuando
      // DeepSeek se queda sin crédito o falla. Decisión del 2026-05-13 a
      // petición de Carlos: prefiere mantener DeepSeek como motor principal
      // y solo recurrir a Gemini cuando no haya crédito disponible (cuota,
      // 402, 429, network). El secret GEMINI_API_KEY se mantiene activado
      // para que el path "Gemini directo (UE)" exista como tercer escalón,
      // por encima de OpenRouter Gemini, dando residencia UE en lugar de
      // ruta US cuando DeepSeek cae.
      //
      // modelOverride sigue prevaleciendo: gemini-* fija Gemini en cabeza;
      // deepseek-* fija DeepSeek (ya está primero por defecto).
      const deepseekModel = modelOverride && modelOverride.startsWith('deepseek') ? modelOverride : 'deepseek-chat';
      const geminiModel = modelOverride && modelOverride.startsWith('gemini') ? modelOverride : 'gemini-2.5-flash-lite';

      // Si modelOverride apunta explícitamente a Gemini, lo respetamos y
      // ponemos Gemini en cabeza (caso edge: el caller pide Gemini a
      // propósito, p.ej. para una task de baja latencia).
      const forceGeminiFirst = modelOverride && modelOverride.startsWith('gemini');

      if (forceGeminiFirst && secrets.geminiKey) {
        chain.push({
          name: 'gemini',
          model: geminiModel,
          execute: () => callGemini({ apiKey: secrets.geminiKey!, model: geminiModel, systemPrompt, userPrompt }),
        });
        chain.push({
          name: 'openrouter',
          model: 'google/gemini-2.5-flash-lite',
          execute: () => callOpenRouter({ apiKey: secrets.openrouterKey, model: 'google/gemini-2.5-flash-lite', systemPrompt, userPrompt }),
        });
      }

      // 1. DeepSeek V3 DIRECTO (primario por defecto).
      chain.push({
        name: 'deepseek',
        model: deepseekModel,
        execute: () => callDeepSeek({ apiKey: secrets.deepseekKey, model: deepseekModel, systemPrompt, userPrompt }),
      });
      // 2. DeepSeek V3 vía OpenRouter — resiliencia a degradación de la
      // API directa de DeepSeek (network, 5xx, ratelimit transitorio).
      chain.push({
        name: 'openrouter',
        model: 'deepseek/deepseek-chat-v3-0324',
        execute: () => callOpenRouter({ apiKey: secrets.openrouterKey, model: 'deepseek/deepseek-chat-v3-0324', systemPrompt, userPrompt }),
      });
      // 3. Fallback cuando DeepSeek no hay crédito / cuota agotada:
      // Gemini 2.5 Flash-Lite DIRECTO (UE · low latency · bajo coste).
      // Solo se añade si NO lo hemos puesto ya en cabeza por
      // modelOverride.
      if (!forceGeminiFirst && secrets.geminiKey) {
        chain.push({
          name: 'gemini',
          model: geminiModel,
          execute: () => callGemini({ apiKey: secrets.geminiKey!, model: geminiModel, systemPrompt, userPrompt }),
        });
      }
      // 4. Último recurso: Gemini vía OpenRouter (no garantiza UE).
      if (!forceGeminiFirst) {
        chain.push({
          name: 'openrouter',
          model: 'google/gemini-2.5-flash-lite',
          execute: () => callOpenRouter({ apiKey: secrets.openrouterKey, model: 'google/gemini-2.5-flash-lite', systemPrompt, userPrompt }),
        });
      }
      return chain;
    }

    case 'vision': {
      // Qwen2.5-VL-72B primario (directo si hay qwenKey, si no OpenRouter).
      // Fallback: Gemini direct → OpenRouter Gemini.
      const directModel = modelOverride || QWEN_DIRECT;
      if (secrets.qwenKey) {
        chain.push({
          name: 'qwen',
          model: directModel,
          execute: () => callQwen({ apiKey: secrets.qwenKey!, model: directModel, systemPrompt, userPrompt, imageBase64 }),
        });
      }
      chain.push({
        name: 'openrouter',
        model: QWEN_OR,
        execute: () => callOpenRouter({ apiKey: secrets.openrouterKey, model: QWEN_OR, systemPrompt, userPrompt, imageBase64 }),
      });
      if (secrets.geminiKey) {
        chain.push({
          name: 'gemini',
          model: 'gemini-2.5-flash',
          execute: () => callGemini({ apiKey: secrets.geminiKey!, model: 'gemini-2.5-flash', systemPrompt, userPrompt, imageBase64 }),
        });
      }
      chain.push({
        name: 'openrouter',
        model: 'google/gemini-2.5-flash',
        execute: () => callOpenRouter({ apiKey: secrets.openrouterKey, model: 'google/gemini-2.5-flash', systemPrompt, userPrompt, imageBase64 }),
      });
      return chain;
    }
  }
}

/**
 * Intenta la cadena en orden. Devuelve el primer resultado OK + provider name.
 * Si todos fallan, lanza el último error.
 */
export async function tryProviderChain(
  chain: ProviderCall[],
): Promise<{ provider: string; result: ProviderResult }> {
  let lastErr: Error | null = null;
  for (const p of chain) {
    try {
      const result = await p.execute();
      return { provider: p.name, result };
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr ?? new Error('todos los providers fallaron sin error específico');
}
