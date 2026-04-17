/**
 * Cartagenaeste — Cloud Functions v1
 * ═══════════════════════════════════════════════════════════════════
 * Proxy seguro entre el frontend y los proveedores de IA.
 *
 * Las API keys NUNCA salen del backend. Variables de entorno:
 *   - DEEPSEEK_KEY   → clave de api.deepseek.com
 *   - OPENROUTER_KEY → clave de openrouter.ai
 *
 * Medidas aplicadas:
 *   1. Solo usuarios autenticados (Firebase Auth) pueden invocar.
 *   2. App Check obligatorio (CONSUMA_APP_CHECK_TOKEN = true).
 *   3. Rate limit por UID: 30 req/min, 500 req/día (en Firestore).
 *   4. Payload sanitizado server-side (duplicado defensivo).
 *   5. CORS restrictivo: solo el dominio oficial.
 * ═══════════════════════════════════════════════════════════════════
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

// Secrets (se definen con: firebase functions:secrets:set DEEPSEEK_KEY)
const DEEPSEEK_KEY = defineSecret('DEEPSEEK_KEY');
const OPENROUTER_KEY = defineSecret('OPENROUTER_KEY');

// ── Sanitización (duplicada defensiva) ────────────────────────────
function sanitize(input) {
  if (typeof input !== 'string') return '';
  let s = input.substring(0, 8000); // server acepta más que el cliente (4000)
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  const patterns = [
    /ignore\s+(all\s+)?previous\s+instructions?/gi,
    /you\s+are\s+now\s+(?:a|an|the)/gi,
    /system\s*:\s*you/gi,
    /\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>/g,
    /\bDAN\b|\bjailbreak\b/gi,
  ];
  patterns.forEach((p) => (s = s.replace(p, '[filtrado]')));
  const lines = s.split('\n');
  if (lines.length > 200) s = lines.slice(0, 200).join('\n') + '\n[...]';
  return s.trim();
}

// ── Rate limit por UID con Firestore ─────────────────────────────
async function checkRateLimit(uid) {
  const ref = db.collection('rate_limits').doc(uid);
  const now = Date.now();
  const MIN_WINDOW = 60 * 1000;
  const DAY_WINDOW = 24 * 60 * 60 * 1000;
  const MAX_PER_MIN = 30;
  const MAX_PER_DAY = 500;

  const doc = await ref.get();
  const data = doc.exists ? doc.data() : { timestamps: [], dayCount: 0, dayStart: now };

  let timestamps = (data.timestamps || []).filter((t) => now - t < MIN_WINDOW);
  if (timestamps.length >= MAX_PER_MIN) {
    const wait = Math.ceil((MIN_WINDOW - (now - timestamps[0])) / 1000);
    throw new HttpsError('resource-exhausted', `Límite por minuto alcanzado. Espera ${wait}s.`);
  }

  let dayStart = data.dayStart || now;
  let dayCount = data.dayCount || 0;
  if (now - dayStart > DAY_WINDOW) {
    dayStart = now;
    dayCount = 0;
  }
  if (dayCount >= MAX_PER_DAY) {
    throw new HttpsError('resource-exhausted', 'Límite diario alcanzado (500 req/día).');
  }

  timestamps.push(now);
  await ref.set({
    timestamps,
    dayStart,
    dayCount: dayCount + 1,
    lastUsed: FieldValue.serverTimestamp(),
  });
}

// ══════════════════════════════════════════════════════════════════
//  llamarIA — Proxy para DeepSeek (con fallback a OpenRouter)
//  Uso desde frontend:
//    const call = httpsCallable(functions, 'llamarIA');
//    const { data } = await call({ user: '...', system: '...' });
// ══════════════════════════════════════════════════════════════════
exports.llamarIA = onCall(
  {
    region: 'europe-west1',
    secrets: [DEEPSEEK_KEY, OPENROUTER_KEY],
    enforceAppCheck: true,
    cors: [
      'https://carlosgalera-a11y.github.io',
      'https://cartagenaeste.es',
      'http://localhost:5000',
    ],
    memory: '256MiB',
    timeoutSeconds: 60,
    maxInstances: 20,
  },
  async (request) => {
    // Auth check
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
    }
    const uid = request.auth.uid;

    // Rate limit
    await checkRateLimit(uid);

    // Input
    const userPrompt = sanitize(request.data?.user || '');
    const systemPrompt = sanitize(request.data?.system || '');
    if (!userPrompt) {
      throw new HttpsError('invalid-argument', 'Prompt vacío.');
    }

    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: userPrompt });

    // ── Intento 1: DeepSeek API directa ──────────────────────
    try {
      const r = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + DEEPSEEK_KEY.value(),
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          max_tokens: 2000,
          temperature: 0.3,
        }),
      });
      if (r.ok) {
        const j = await r.json();
        const text = j?.choices?.[0]?.message?.content;
        if (text) return { provider: 'deepseek', text };
      }
    } catch (e) {
      console.warn('DeepSeek failed:', e.message);
    }

    // ── Intento 2: OpenRouter (DeepSeek free) ─────────────────
    try {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + OPENROUTER_KEY.value(),
          'HTTP-Referer': 'https://carlosgalera-a11y.github.io/Cartagenaeste/',
          'X-Title': 'Cartagenaeste',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat-v3-0324:free',
          messages,
          max_tokens: 2000,
          temperature: 0.3,
        }),
      });
      if (r.ok) {
        const j = await r.json();
        const text = j?.choices?.[0]?.message?.content;
        if (text) return { provider: 'openrouter-deepseek', text };
      }
    } catch (e) {
      console.warn('OpenRouter DeepSeek failed:', e.message);
    }

    // ── Intento 3: OpenRouter Gemma fallback ──────────────────
    try {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + OPENROUTER_KEY.value(),
          'HTTP-Referer': 'https://carlosgalera-a11y.github.io/Cartagenaeste/',
          'X-Title': 'Cartagenaeste',
        },
        body: JSON.stringify({
          model: 'google/gemma-3-27b-it:free',
          messages,
          max_tokens: 2000,
          temperature: 0.3,
        }),
      });
      if (r.ok) {
        const j = await r.json();
        const text = j?.choices?.[0]?.message?.content;
        if (text) return { provider: 'openrouter-gemma', text };
      }
    } catch (e) {
      console.warn('OpenRouter Gemma failed:', e.message);
    }

    throw new HttpsError('internal', 'Todos los proveedores de IA fallaron. Intenta de nuevo más tarde.');
  }
);

// ══════════════════════════════════════════════════════════════════
//  scanIA — Proxy para análisis de imagen con visión
//  Uso: call({ imageBase64, systemPrompt, userText, modelPref })
// ══════════════════════════════════════════════════════════════════
exports.scanIA = onCall(
  {
    region: 'europe-west1',
    secrets: [OPENROUTER_KEY],
    enforceAppCheck: true,
    cors: [
      'https://carlosgalera-a11y.github.io',
      'https://cartagenaeste.es',
      'http://localhost:5000',
    ],
    memory: '512MiB',
    timeoutSeconds: 120,
    maxInstances: 10,
  },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
    const uid = request.auth.uid;
    await checkRateLimit(uid);

    const imageBase64 = request.data?.imageBase64;
    const systemPrompt = sanitize(request.data?.systemPrompt || '');
    const userText = sanitize(request.data?.userText || 'Analiza esta imagen médica');
    const modelPref = request.data?.modelPref || 'qwen';

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      throw new HttpsError('invalid-argument', 'imageBase64 requerido.');
    }
    if (imageBase64.length > 7 * 1024 * 1024) {
      throw new HttpsError('invalid-argument', 'Imagen demasiado grande (>5MB).');
    }

    const dataUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;

    const modelChain = {
      qwen: ['qwen/qwen-2.5-vl-72b-instruct:free', 'google/gemini-2.0-flash-exp:free', 'meta-llama/llama-3.2-11b-vision-instruct:free'],
      gemini: ['google/gemini-2.0-flash-exp:free', 'qwen/qwen-2.5-vl-72b-instruct:free'],
    };
    const tryModels = modelChain[modelPref] || modelChain.qwen;

    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: dataUrl } },
          { type: 'text', text: userText },
        ],
      },
    ];

    for (const model of tryModels) {
      try {
        const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + OPENROUTER_KEY.value(),
            'HTTP-Referer': 'https://carlosgalera-a11y.github.io/Cartagenaeste/',
            'X-Title': 'Cartagenaeste ScanIA',
          },
          body: JSON.stringify({
            model,
            messages,
            max_tokens: 2000,
            temperature: 0.3,
          }),
        });
        if (r.ok) {
          const j = await r.json();
          const text = j?.choices?.[0]?.message?.content;
          if (text) return { model, text };
        } else {
          const errText = await r.text().catch(() => '');
          console.warn(`Vision model ${model} returned ${r.status}: ${errText.substring(0, 200)}`);
        }
      } catch (e) {
        console.warn(`Vision model ${model} failed:`, e.message);
      }
    }

    throw new HttpsError('internal', 'Análisis de imagen falló con todos los modelos.');
  }
);
