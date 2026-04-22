import type { ProviderResult } from '../types';

// DashScope International (OpenAI-compatible). Para vision el contenido va como
// array [{type:'image_url'}, {type:'text'}].
const URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';

export interface QwenOpts {
  apiKey: string;
  model: string; // 'qwen-vl-max' | 'qwen2-vl-72b-instruct'
  systemPrompt: string;
  userPrompt: string;
  imageBase64?: string;
  timeoutMs?: number;
}

export async function callQwen(opts: QwenOpts): Promise<ProviderResult> {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 45000);
  try {
    const messages: Array<{ role: string; content: unknown }> = [];
    if (opts.systemPrompt) messages.push({ role: 'system', content: opts.systemPrompt });
    if (opts.imageBase64) {
      const dataUrl = opts.imageBase64.startsWith('data:')
        ? opts.imageBase64
        : `data:image/jpeg;base64,${opts.imageBase64}`;
      messages.push({
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: dataUrl } },
          { type: 'text', text: opts.userPrompt },
        ],
      });
    } else {
      messages.push({ role: 'user', content: opts.userPrompt });
    }

    const r = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opts.apiKey}`,
      },
      body: JSON.stringify({
        model: opts.model,
        messages,
        max_tokens: 4096,
        temperature: 0.3,
      }),
      signal: ctrl.signal,
    });
    if (!r.ok) {
      const errText = await r.text().catch(() => '');
      throw new Error(`qwen ${r.status}: ${errText.substring(0, 200)}`);
    }
    const j = (await r.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const text = j.choices?.[0]?.message?.content ?? '';
    if (!text) throw new Error('qwen: respuesta vacía');
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
