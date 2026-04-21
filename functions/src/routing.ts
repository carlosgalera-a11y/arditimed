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
      const directModel = modelOverride || 'deepseek-chat';
      chain.push({
        name: 'deepseek',
        model: directModel,
        execute: () => callDeepSeek({ apiKey: secrets.deepseekKey, model: directModel, systemPrompt, userPrompt }),
      });
      chain.push({
        name: 'openrouter',
        model: 'deepseek/deepseek-chat-v3-0324',
        execute: () => callOpenRouter({ apiKey: secrets.openrouterKey, model: 'deepseek/deepseek-chat-v3-0324', systemPrompt, userPrompt }),
      });
      chain.push({
        name: 'openrouter',
        model: 'google/gemini-2.5-flash-lite',
        execute: () => callOpenRouter({ apiKey: secrets.openrouterKey, model: 'google/gemini-2.5-flash-lite', systemPrompt, userPrompt }),
      });
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
