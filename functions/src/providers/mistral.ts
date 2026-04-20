import type { ProviderResult } from '../types';

const URL = 'https://api.mistral.ai/v1/chat/completions';

export interface MistralOpts {
  apiKey: string;
  model: string; // 'mistral-small-latest' etc.
  systemPrompt: string;
  userPrompt: string;
  timeoutMs?: number;
}

export async function callMistral(opts: MistralOpts): Promise<ProviderResult> {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 45000);
  try {
    const messages: Array<{ role: string; content: string }> = [];
    if (opts.systemPrompt) messages.push({ role: 'system', content: opts.systemPrompt });
    messages.push({ role: 'user', content: opts.userPrompt });

    const r = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opts.apiKey}`,
      },
      body: JSON.stringify({
        model: opts.model,
        messages,
        max_tokens: 2048,
        temperature: 0.3,
      }),
      signal: ctrl.signal,
    });
    if (!r.ok) {
      const errText = await r.text().catch(() => '');
      throw new Error(`mistral ${r.status}: ${errText.substring(0, 200)}`);
    }
    const j = (await r.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const text = j.choices?.[0]?.message?.content ?? '';
    if (!text) throw new Error('mistral: respuesta vacía');
    return {
      text,
      model: opts.model,
      tokensIn: j.usage?.prompt_tokens ?? 0,
      tokensOut: j.usage?.completion_tokens ?? 0,
    };
  } finally {
    clearTimeout(to);
  }
}
