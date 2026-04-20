import { describe, expect, it } from 'vitest';
import { buildProviderChain, tryProviderChain } from '../src/routing';
import type { ProviderCall } from '../src/types';

const fakeSecrets = {
  geminiKey: 'k-gem',
  deepseekKey: 'k-ds',
  mistralKey: 'k-mi',
  qwenKey: 'k-qw',
};

describe('buildProviderChain', () => {
  it('clinical_case → gemini primary, mistral fallback', () => {
    const chain = buildProviderChain({
      type: 'clinical_case',
      userPrompt: 'u',
      systemPrompt: 's',
      secrets: fakeSecrets,
    });
    expect(chain.map((c) => c.name)).toEqual(['gemini', 'mistral']);
    expect(chain[0]!.model).toBe('gemini-2.5-flash-lite');
    expect(chain[1]!.model).toBe('mistral-small-latest');
  });

  it('educational → deepseek primary, gemini fallback', () => {
    const chain = buildProviderChain({
      type: 'educational',
      userPrompt: 'u',
      systemPrompt: 's',
      secrets: fakeSecrets,
    });
    expect(chain.map((c) => c.name)).toEqual(['deepseek', 'gemini']);
  });

  it('vision → gemini flash primary, qwen fallback', () => {
    const chain = buildProviderChain({
      type: 'vision',
      userPrompt: 'u',
      systemPrompt: 's',
      imageBase64: 'abc',
      secrets: fakeSecrets,
    });
    expect(chain.map((c) => c.name)).toEqual(['gemini', 'qwen']);
    expect(chain[0]!.model).toBe('gemini-2.5-flash');
  });

  it('modelOverride se aplica al primario', () => {
    const chain = buildProviderChain({
      type: 'educational',
      userPrompt: 'u',
      systemPrompt: 's',
      modelOverride: 'deepseek-reasoner',
      secrets: fakeSecrets,
    });
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
