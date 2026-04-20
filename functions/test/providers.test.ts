import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { callGemini } from '../src/providers/gemini';
import { callDeepSeek } from '../src/providers/deepseek';
import { callMistral } from '../src/providers/mistral';
import { callQwen } from '../src/providers/qwen';

const originalFetch = globalThis.fetch;

function stubFetch(resp: { ok: boolean; status?: number; body: unknown }) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: resp.ok,
    status: resp.status ?? 200,
    json: async () => resp.body,
    text: async () => JSON.stringify(resp.body),
  }) as unknown as typeof fetch;
}

beforeEach(() => vi.restoreAllMocks());
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('callGemini', () => {
  it('parsea respuesta OK con texto y uso', async () => {
    stubFetch({
      ok: true,
      body: {
        candidates: [{ content: { parts: [{ text: 'hola mundo' }] } }],
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
      },
    });
    const r = await callGemini({
      apiKey: 'k',
      model: 'gemini-2.5-flash-lite',
      systemPrompt: 's',
      userPrompt: 'u',
    });
    expect(r.text).toBe('hola mundo');
    expect(r.tokensIn).toBe(10);
    expect(r.tokensOut).toBe(5);
  });

  it('lanza si respuesta es vacía', async () => {
    stubFetch({ ok: true, body: { candidates: [] } });
    await expect(
      callGemini({ apiKey: 'k', model: 'gemini-2.5-flash', systemPrompt: '', userPrompt: 'u' }),
    ).rejects.toThrow(/vacía/);
  });

  it('lanza con status code cuando no OK', async () => {
    stubFetch({ ok: false, status: 429, body: { error: 'quota' } });
    await expect(
      callGemini({ apiKey: 'k', model: 'gemini-2.5-flash', systemPrompt: '', userPrompt: 'u' }),
    ).rejects.toThrow(/gemini 429/);
  });

  it('adjunta imagen inline cuando se provee imageBase64', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] }),
      text: async () => '',
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    await callGemini({
      apiKey: 'k',
      model: 'gemini-2.5-flash',
      systemPrompt: 's',
      userPrompt: 'u',
      imageBase64: 'ABC123',
    });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body) as any;
    expect(body.contents[0].parts[0].inline_data.data).toBe('ABC123');
  });
});

describe('callDeepSeek', () => {
  it('parsea respuesta OpenAI-compatible', async () => {
    stubFetch({
      ok: true,
      body: {
        choices: [{ message: { content: 'hola deepseek' } }],
        usage: { prompt_tokens: 3, completion_tokens: 2 },
      },
    });
    const r = await callDeepSeek({
      apiKey: 'k',
      model: 'deepseek-chat',
      systemPrompt: 's',
      userPrompt: 'u',
    });
    expect(r.text).toBe('hola deepseek');
    expect(r.tokensIn).toBe(3);
    expect(r.tokensOut).toBe(2);
  });

  it('lanza si status != 200', async () => {
    stubFetch({ ok: false, status: 500, body: {} });
    await expect(
      callDeepSeek({ apiKey: 'k', model: 'deepseek-chat', systemPrompt: '', userPrompt: 'u' }),
    ).rejects.toThrow(/deepseek 500/);
  });
});

describe('callMistral', () => {
  it('parsea respuesta OK', async () => {
    stubFetch({
      ok: true,
      body: {
        choices: [{ message: { content: 'hola mistral' } }],
        usage: { prompt_tokens: 1, completion_tokens: 2 },
      },
    });
    const r = await callMistral({
      apiKey: 'k',
      model: 'mistral-small-latest',
      systemPrompt: '',
      userPrompt: 'u',
    });
    expect(r.text).toBe('hola mistral');
  });

  it('lanza si vacía', async () => {
    stubFetch({ ok: true, body: { choices: [] } });
    await expect(
      callMistral({ apiKey: 'k', model: 'mistral-small-latest', systemPrompt: '', userPrompt: 'u' }),
    ).rejects.toThrow(/vacía/);
  });
});

describe('callQwen', () => {
  it('envía content array cuando hay imagen', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: 'qwen out' } }] }),
      text: async () => '',
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const r = await callQwen({
      apiKey: 'k',
      model: 'qwen-vl-max',
      systemPrompt: 's',
      userPrompt: 'describe esto',
      imageBase64: 'XYZ',
    });
    expect(r.text).toBe('qwen out');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body) as any;
    expect(Array.isArray(body.messages[1].content)).toBe(true);
    expect(body.messages[1].content[0].type).toBe('image_url');
  });

  it('envía content string sin imagen', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: 'plain' } }] }),
      text: async () => '',
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const r = await callQwen({
      apiKey: 'k',
      model: 'qwen-vl-max',
      systemPrompt: '',
      userPrompt: 'hola',
    });
    expect(r.text).toBe('plain');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body) as any;
    expect(typeof body.messages[0].content).toBe('string');
  });
});
