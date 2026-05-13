import { describe, expect, it } from 'vitest';
import { buildProviderChain, tryProviderChain } from '../src/routing';
import type { ProviderCall } from '../src/types';

const minimalSecrets = {
  deepseekKey: 'k-ds',
  openrouterKey: 'k-or',
};

const fullSecrets = {
  deepseekKey: 'k-ds',
  openrouterKey: 'k-or',
  geminiKey: 'k-gem',
  mistralKey: 'k-mi',
  qwenKey: 'k-qw',
};

describe('buildProviderChain — modo mínimo (solo DeepSeek + OpenRouter)', () => {
  it('clinical_case → OpenRouter Qwen2.5-VL-72B primario → Gemini/Mistral como fallback', () => {
    const chain = buildProviderChain({
      type: 'clinical_case',
      userPrompt: 'u',
      systemPrompt: 's',
      secrets: minimalSecrets,
    });
    expect(chain.map((c) => c.name)).toEqual(['openrouter', 'openrouter', 'openrouter']);
    expect(chain[0]!.model).toBe('qwen/qwen2.5-vl-72b-instruct');
    expect(chain[1]!.model).toBe('google/gemini-2.5-flash-lite');
    expect(chain[2]!.model).toBe('mistralai/mistral-small-3.2-24b-instruct');
  });

  it('educational sin geminiKey → DeepSeek directo primario → OR DeepSeek → OR Gemini fallback', () => {
    // Nueva política (2026-05-13): DeepSeek primario; Gemini solo cuando
    // DeepSeek no tiene crédito o falla. Sin geminiKey, el chain queda
    // DeepSeek directo → OpenRouter DeepSeek → OpenRouter Gemini.
    const chain = buildProviderChain({
      type: 'educational',
      userPrompt: 'u',
      systemPrompt: 's',
      secrets: minimalSecrets,
    });
    expect(chain.map((c) => c.name)).toEqual(['deepseek', 'openrouter', 'openrouter']);
    expect(chain[0]!.model).toBe('deepseek-chat');
    expect(chain[1]!.model).toBe('deepseek/deepseek-chat-v3-0324');
    expect(chain[2]!.model).toBe('google/gemini-2.5-flash-lite');
  });

  it('vision → OpenRouter Qwen2.5-VL-72B primario → OpenRouter Gemini fallback', () => {
    const chain = buildProviderChain({
      type: 'vision',
      userPrompt: 'u',
      systemPrompt: 's',
      imageBase64: 'abc',
      secrets: minimalSecrets,
    });
    expect(chain.map((c) => c.name)).toEqual(['openrouter', 'openrouter']);
    expect(chain[0]!.model).toBe('qwen/qwen2.5-vl-72b-instruct');
    expect(chain[1]!.model).toBe('google/gemini-2.5-flash');
  });
});

describe('buildProviderChain — direct keys preferidas', () => {
  it('clinical_case con qwenKey prefiere Qwen directo como primario', () => {
    const chain = buildProviderChain({
      type: 'clinical_case',
      userPrompt: 'u',
      systemPrompt: 's',
      secrets: fullSecrets,
    });
    expect(chain[0]!.name).toBe('qwen');
    expect(chain[0]!.model).toBe('qwen2.5-vl-72b-instruct');
    // Tras el OpenRouter de Qwen (fallback inmediato), vienen Gemini y Mistral directos:
    expect(chain[1]!.name).toBe('openrouter');
    expect(chain[1]!.model).toBe('qwen/qwen2.5-vl-72b-instruct');
    expect(chain[2]!.name).toBe('gemini');
    expect(chain[3]!.name).toBe('mistral');
    // OpenRouter fallbacks al final (Gemini + Mistral):
    expect(chain.filter((c) => c.name === 'openrouter')).toHaveLength(3);
  });

  it('vision con qwenKey y geminiKey: Qwen directo primario, Gemini como fallback', () => {
    const chain = buildProviderChain({
      type: 'vision',
      userPrompt: 'u',
      systemPrompt: 's',
      imageBase64: 'abc',
      secrets: fullSecrets,
    });
    expect(chain.map((c) => c.name)).toEqual(['qwen', 'openrouter', 'gemini', 'openrouter']);
    expect(chain[0]!.model).toBe('qwen2.5-vl-72b-instruct');
    expect(chain[1]!.model).toBe('qwen/qwen2.5-vl-72b-instruct');
    expect(chain[2]!.model).toBe('gemini-2.5-flash');
    expect(chain[3]!.model).toBe('google/gemini-2.5-flash');
  });

  it('modelOverride deepseek-reasoner mantiene DeepSeek como primario con el modelo override', () => {
    // modelOverride deepseek-* refuerza el orden por defecto (DeepSeek
    // primario) y simplemente fija el modelo override en la entrada
    // directa. Sin geminiKey: deepseek (con override) → openrouter
    // deepseek-v3 → openrouter gemini.
    const chain = buildProviderChain({
      type: 'educational',
      userPrompt: 'u',
      systemPrompt: 's',
      modelOverride: 'deepseek-reasoner',
      secrets: minimalSecrets,
    });
    expect(chain[0]!.name).toBe('deepseek');
    expect(chain[0]!.model).toBe('deepseek-reasoner');
  });

  it('educational con geminiKey → DeepSeek primario, Gemini directo solo como fallback', () => {
    // Nueva política (2026-05-13): DeepSeek primario; Gemini solo cuando
    // DeepSeek se queda sin crédito o falla. Con geminiKey el chain es:
    // DeepSeek directo → OR DeepSeek → Gemini directo (UE) → OR Gemini.
    const chain = buildProviderChain({
      type: 'educational',
      userPrompt: 'u',
      systemPrompt: 's',
      secrets: fullSecrets,
    });
    expect(chain[0]!.name).toBe('deepseek');
    expect(chain[0]!.model).toBe('deepseek-chat');
    expect(chain[1]!.name).toBe('openrouter');
    expect(chain[1]!.model).toBe('deepseek/deepseek-chat-v3-0324');
    expect(chain[2]!.name).toBe('gemini');
    expect(chain[2]!.model).toBe('gemini-2.5-flash-lite');
    expect(chain[3]!.name).toBe('openrouter');
    expect(chain[3]!.model).toBe('google/gemini-2.5-flash-lite');
  });

  it('educational con modelOverride gemini-* fuerza Gemini en cabeza (caso edge)', () => {
    // Si el caller pide explícitamente Gemini, lo respetamos: Gemini
    // directo primario, OR Gemini fallback, luego DeepSeek se evita
    // (porque el override ya pidió Gemini intencionadamente).
    const chain = buildProviderChain({
      type: 'educational',
      userPrompt: 'u',
      systemPrompt: 's',
      modelOverride: 'gemini-2.5-flash-lite',
      secrets: fullSecrets,
    });
    expect(chain[0]!.name).toBe('gemini');
    expect(chain[0]!.model).toBe('gemini-2.5-flash-lite');
    expect(chain[1]!.name).toBe('openrouter');
    expect(chain[1]!.model).toBe('google/gemini-2.5-flash-lite');
    // Tras esos dos viene la cadena por defecto DeepSeek (DeepSeek
    // directo + OR DeepSeek) como fallback profundo.
    expect(chain[2]!.name).toBe('deepseek');
  });
});

describe('tryProviderChain', () => {
  it('devuelve el primer provider que responde OK', async () => {
    const chain: ProviderCall[] = [
      {
        name: 'p1',
        model: 'm1',
        execute: async () => ({ text: 'hola', model: 'm1', tokensIn: 1, tokensOut: 2 }),
      },
      {
        name: 'p2',
        model: 'm2',
        execute: async () => ({ text: 'fallback', model: 'm2' }),
      },
    ];
    const r = await tryProviderChain(chain);
    expect(r.provider).toBe('p1');
    expect(r.result.text).toBe('hola');
  });

  it('cae al fallback si el primero lanza', async () => {
    const chain: ProviderCall[] = [
      { name: 'p1', model: 'm1', execute: async () => { throw new Error('network'); } },
      {
        name: 'p2',
        model: 'm2',
        execute: async () => ({ text: 'backup', model: 'm2' }),
      },
    ];
    const r = await tryProviderChain(chain);
    expect(r.provider).toBe('p2');
    expect(r.result.text).toBe('backup');
  });

  it('lanza el último error si todos fallan', async () => {
    const chain: ProviderCall[] = [
      { name: 'p1', model: 'm1', execute: async () => { throw new Error('e1'); } },
      { name: 'p2', model: 'm2', execute: async () => { throw new Error('e2'); } },
    ];
    await expect(tryProviderChain(chain)).rejects.toThrow('e2');
  });
});
