import type { AiType, ProviderCall, ProviderResult } from './types';
import { callGemini } from './providers/gemini';
import { callDeepSeek } from './providers/deepseek';
import { callMistral } from './providers/mistral';
import { callQwen } from './providers/qwen';

interface RoutingInput {
  type: AiType;
  userPrompt: string;
  systemPrompt: string;
  imageBase64?: string;
  modelOverride?: string;
  secrets: {
    geminiKey: string;
    deepseekKey: string;
    mistralKey: string;
    qwenKey: string;
  };
}

/**
 * Devuelve la cadena de providers a intentar, en orden. El primero que
 * responda OK gana. La política IA está fijada en CLAUDE.md.
 */
export function buildProviderChain(input: RoutingInput): ProviderCall[] {
  const { type, userPrompt, systemPrompt, imageBase64, modelOverride, secrets } = input;

  switch (type) {
    case 'clinical_case':
      return [
        {
          name: 'gemini',
          model: modelOverride || 'gemini-2.5-flash-lite',
          execute: () =>
            callGemini({
              apiKey: secrets.geminiKey,
              model: modelOverride || 'gemini-2.5-flash-lite',
              systemPrompt,
              userPrompt,
            }),
        },
        {
          name: 'mistral',
          model: 'mistral-small-latest',
          execute: () =>
            callMistral({
              apiKey: secrets.mistralKey,
              model: 'mistral-small-latest',
              systemPrompt,
              userPrompt,
            }),
        },
      ];

    case 'educational':
      return [
        {
          name: 'deepseek',
          model: modelOverride || 'deepseek-chat',
          execute: () =>
            callDeepSeek({
              apiKey: secrets.deepseekKey,
              model: modelOverride || 'deepseek-chat',
              systemPrompt,
              userPrompt,
            }),
        },
        {
          name: 'gemini',
          model: 'gemini-2.5-flash-lite',
          execute: () =>
            callGemini({
              apiKey: secrets.geminiKey,
              model: 'gemini-2.5-flash-lite',
              systemPrompt,
              userPrompt,
            }),
        },
      ];

    case 'vision':
      return [
        {
          name: 'gemini',
          model: modelOverride || 'gemini-2.5-flash',
          execute: () =>
            callGemini({
              apiKey: secrets.geminiKey,
              model: modelOverride || 'gemini-2.5-flash',
              systemPrompt,
              userPrompt,
              imageBase64,
            }),
        },
        {
          name: 'qwen',
          model: 'qwen-vl-max',
          execute: () =>
            callQwen({
              apiKey: secrets.qwenKey,
              model: 'qwen-vl-max',
              systemPrompt,
              userPrompt,
              imageBase64,
            }),
        },
      ];
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
