import type { ProviderResult } from '../types';

const BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Para uso clínico formativo del MegaCuaderno: bajamos el umbral de los
// safety filters (que por defecto bloquean preguntas sobre dosis de fármacos,
// psiquiatría, paliativos, autolisis, contenido sexual médico, etc.) a
// BLOCK_ONLY_HIGH. Sigue bloqueando contenido genuinamente peligroso pero
// permite la consulta clínica habitual.
const CLINICAL_SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
];

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
    // generationConfig:
    //  - thinkingBudget=0: desactiva el razonamiento interno. La familia
    //    Gemini 2.5 lo activa por defecto y se come tokens del output,
    //    dejando el text vacío cuando maxOutputTokens es ajustado.
    //    Causa frecuente del error "respuesta vacía".
    //  - maxOutputTokens 8192: holgado para respuestas clínicas largas
    //    (Flash-Lite admite hasta 64K, pero 8K es suficiente).
    const body = {
      system_instruction: opts.systemPrompt ? { parts: [{ text: opts.systemPrompt }] } : undefined,
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
        thinkingConfig: { thinkingBudget: 0 },
      },
      safetySettings: CLINICAL_SAFETY_SETTINGS,
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
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        finishReason?: string;
        safetyRatings?: Array<{ category: string; probability: string; blocked?: boolean }>;
      }>;
      promptFeedback?: { blockReason?: string };
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    };
    const cand = j.candidates?.[0];
    const text = cand?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
    if (!text) {
      // Mensaje de error útil — antes solo decía "respuesta vacía" sin
      // explicar si fue safety filter, MAX_TOKENS, etc.
      const finish = cand?.finishReason ?? 'unknown';
      const blocked = cand?.safetyRatings?.find((s) => s.blocked);
      const promptBlock = j.promptFeedback?.blockReason;
      const reason = promptBlock
        ? `prompt bloqueado por safety: ${promptBlock}`
        : blocked
          ? `output bloqueado por safety: ${blocked.category} (${blocked.probability})`
          : finish === 'MAX_TOKENS'
            ? 'maxOutputTokens agotado (probable thinking sin desactivar)'
            : `respuesta vacía, finishReason=${finish}`;
      throw new Error(`gemini: ${reason}`);
    }
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
