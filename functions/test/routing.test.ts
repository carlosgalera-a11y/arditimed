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
  it('clinical_case → OpenRouter gemini-flash-lite → OpenRouter mistral', () => {
    const chain = buildProviderChain({
      type: 'clinical_case',
      userPrompt: 'u',
      systemPrompt: 's',
      secrets: minimalSecrets,
    });
    expect(chain.map((c) => c.name)).toEqual(['openrouter', 'openrouter']);
    expect(chain[0]!.model).toBe('google/gemini-2.5-flash-lite');
    expect(chain[1]!.model).toBe('mistralai/mistral-small-3.2-24b-instruct');
  });

  it('educational → DeepSeek directo → OpenRouter deepseek-v3 → OpenRouter gemini-flash-lite', () => {
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

  it('vision → OpenRouter gemini-flash → OpenRouter qwen-vl', () => {
    const chain = buildProviderChain({
      type: 'vision',
      userPrompt: 'u',
      systemPrompt: 's',
      imageBase64: 'abc',
      secrets: minimalSecrets,
    });
    expect(chain.map((c) => c.name)).toEqual(['openrouter', 'openrouter']);
    expect(chain[0]!.model).toBe('google/gemini-2.5-flash');
    expect(chain[1]!.model).toBe('qwen/qwen2.5-vl-72b-instruct');
  });
});

describe('buildProviderChain — direct keys preferidas', () => {
  it('clinical_case con geminiKey prefiere Gemini directo', () => {
    const chain = buildProviderChain({
      type: 'clinical_case',
      userPrompt: 'u',
      systemPrompt: 's',
      secrets: fullSecrets,
    });
    expect(chain[0]!.name).toBe('gemini');
    expect(chain[0]!.model).toBe('gemini-2.5-flash-lite');
    expect(chain[1]!.name).toBe('mistral');
    // OpenRouter fallbacks después:
    expect(chain.filter((c) => c.name === 'openrouter')).toHaveLength(2);
  });

  it('vision con geminiKey y qwenKey prefiere directos', () => {
    const chain = buildProviderChain({
      type: 'vision',
      userPrompt: 'u',
      systemPrompt: 's',
      imageBase64: 'abc',
      secrets: fullSecrets,
    });
    expect(chain.map((c) => c.name)).toEqual(['gemini', 'qwen', 'openrouter', 'openrouter']);
  });

  it('modelOverride se aplica al provider directo cuando existe', () => {
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
