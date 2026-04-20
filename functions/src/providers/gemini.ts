import type { ProviderResult } from '../types';

const BASE = 'https://generativelanguage.googleapis.com/v1beta';

export interface GeminiOpts {
  apiKey: string;
  model: string; // e.g. 'gemini-2.5-flash-lite' or 'gemini-2.5-flash'
  systemPrompt: string;
  userPrompt: string;
  imageBase64?: string;
  timeoutMs?: number;
}

export async function callGemini(opts: GeminiOpts): Promise<ProviderResult> {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 45000);
  try {
    const parts: unknown[] = [{ text: opts.userPrompt }];
    if (opts.imageBase64) {
      const raw = opts.imageBase64.startsWith('data:')
        ? opts.imageBase64.replace(/^data:[^;]+;base64,/, '')
        : opts.imageBase64;
      parts.unshift({
        inline_data: { mime_type: 'image/jpeg', data: raw },
      });
    }
    const body = {
      system_instruction: opts.systemPrompt ? { parts: [{ text: opts.systemPrompt }] } : undefined,
      contents: [{ role: 'user', parts }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
    };
    const url = `${BASE}/models/${encodeURIComponent(opts.model)}:generateContent?key=${opts.apiKey}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!r.ok) {
      const errText = await r.text().catch(() => '');
      throw new Error(`gemini ${r.status}: ${errText.substring(0, 200)}`);
    }
    const j = (await r.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    };
    const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
    if (!text) throw new Error('gemini: respuesta vacía');
    return {
      text,
      model: opts.model,
      tokensIn: j.usageMetadata?.promptTokenCount ?? 0,
      tokensOut: j.usageMetadata?.candidatesTokenCount ?? 0,
    };
  } finally {
    clearTimeout(to);
  }
}
