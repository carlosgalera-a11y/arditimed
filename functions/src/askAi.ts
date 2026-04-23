import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getApp } from 'firebase-admin/app';

import type { AskAiRequest, AskAiResponse, AiType } from './types';
import { validatePrompt, validateSystemPrompt, validateImageBase64 } from './validation';
import { consumeQuota } from './quotas';
import { getCached, setCached, hashKey } from './cache';
import { checkIpRateLimit } from './rateLimit';
import { buildProviderChain, tryProviderChain } from './routing';
import { logAiCall, logSecurityEvent, estimateCostEur } from './logging';

// Secretos OBLIGATORIOS — deploy falla si faltan.
const DEEPSEEK_API_KEY = defineSecret('DEEPSEEK_API_KEY');
const OPENROUTER_API_KEY = defineSecret('OPENROUTER_API_KEY');

// Secretos OPCIONALES — si existen en Secret Manager, añadirlos aquí y a
// `secrets: [...]` más abajo. El router los prefiere automáticamente sobre
// OpenRouter. Útil para cumplir EU-residency estricta (Gemini EU, Mistral EU).
//
// Ejemplo de activación:
//   const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
//   ... en secrets: [DEEPSEEK_API_KEY, OPENROUTER_API_KEY, GEMINI_API_KEY]
//   ... en buildProviderChain: secrets: { ..., geminiKey: GEMINI_API_KEY.value() }

const VALID_TYPES: readonly AiType[] = ['clinical_case', 'educational', 'vision'] as const;

function requireString(v: unknown, name: string): string {
  if (typeof v !== 'string') throw new HttpsError('invalid-argument', `${name} debe ser string`);
  return v;
}

function extractIp(raw: unknown): string {
  if (typeof raw !== 'string' || !raw) return 'unknown';
  // onCall puede entregar rawRequest.ip o x-forwarded-for.
  return raw.split(',')[0]!.trim() || 'unknown';
}

export const askAi = onCall(
  {
    region: 'europe-west1',
    secrets: [DEEPSEEK_API_KEY, OPENROUTER_API_KEY],
    // TODO: reactivar a true cuando el frontend envíe token App Check.
    // Requiere: reCAPTCHA v3 site key + window.RECAPTCHA_SITE_KEY + firebase.appCheck().activate(...).
    // Ver docs/s1.2-deploy-pendiente-carlos.md §3.
    enforceAppCheck: false,
    minInstances: 1,
    maxInstances: 10,
    concurrency: 40,
    memory: '512MiB',
    timeoutSeconds: 180,
    cors: [
      'https://area2cartagena.es',
      'https://carlosgalera-a11y.github.io',
      'http://localhost:5000',
    ],
  },
  async (request): Promise<AskAiResponse> => {
    const start = Date.now();
    const db = getFirestore(getApp());

    // ─── Auth ──────────────────────────────────────────────
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión para usar la IA.');
    }
    const uid = request.auth.uid;

    // ─── Validación input ──────────────────────────────────
    const raw = (request.data ?? {}) as Partial<AskAiRequest>;
    const type = requireString(raw.type, 'type') as AiType;
    if (!VALID_TYPES.includes(type)) {
      throw new HttpsError('invalid-argument', `type inválido: ${type}`);
    }
    const pv = validatePrompt(raw.prompt);
    if (!pv.ok) {
      logSecurityEvent(uid, 'prompt_rejected', { reason: pv.reason });
      throw new HttpsError('invalid-argument', pv.reason!);
    }
    const sv = validateSystemPrompt(raw.systemPrompt);
    if (!sv.ok) throw new HttpsError('invalid-argument', sv.reason!);
    const iv = validateImageBase64(raw.imageBase64);
    if (!iv.ok) throw new HttpsError('invalid-argument', iv.reason!);

    if (type === 'vision' && !raw.imageBase64) {
      throw new HttpsError('invalid-argument', 'type=vision requiere imageBase64');
    }

    const prompt = raw.prompt as string;
    const systemPrompt = (raw.systemPrompt ?? '') as string;
    const imageBase64 = raw.imageBase64;
    const modelOverride = typeof raw.model === 'string' ? raw.model : undefined;

    // ─── Rate limit por IP ─────────────────────────────────
    const ip = extractIp(request.rawRequest?.headers?.['x-forwarded-for'] ?? request.rawRequest?.ip);
    await checkIpRateLimit(db, ip);

    // ─── Cuota por usuario ─────────────────────────────────
    const userDoc = await db.collection('users').doc(uid).get();
    const isAdmin = userDoc.exists ? userDoc.data()?.role === 'admin' : false;
    await consumeQuota(db, uid, isAdmin);

    // ─── Cache ─────────────────────────────────────────────
    // Para vision no cacheamos (imagen única por caso).
    const effectiveModel = modelOverride ?? defaultModelForType(type);
    const cacheableKey = hashKey(type, prompt, systemPrompt, effectiveModel);
    if (type !== 'vision') {
      const hit = await getCached(db, cacheableKey);
      if (hit) {
        const latencyMs = Date.now() - start;
        logAiCall({
          uid,
          type,
          provider: hit.provider,
          model: hit.model,
          latencyMs,
          cacheHit: true,
          tokensIn: hit.tokensIn ?? 0,
          tokensOut: hit.tokensOut ?? 0,
          promptHash: cacheableKey,
        });
        await writeAuditLog(db, uid, type, hit.provider, hit.model, latencyMs, true, hit.tokensIn ?? 0, hit.tokensOut ?? 0, cacheableKey);
        return {
          provider: hit.provider,
          model: hit.model,
          text: hit.text,
          cached: true,
          latencyMs,
          tokensIn: hit.tokensIn,
          tokensOut: hit.tokensOut,
        };
      }
    }

    // ─── Providers ─────────────────────────────────────────
    const chain = buildProviderChain({
      type,
      userPrompt: prompt,
      systemPrompt,
      imageBase64,
      modelOverride,
      secrets: {
        deepseekKey: DEEPSEEK_API_KEY.value(),
        openrouterKey: OPENROUTER_API_KEY.value(),
        // Directas opcionales (ver comentario arriba):
        // geminiKey: GEMINI_API_KEY.value(),
        // mistralKey: MISTRAL_API_KEY.value(),
        // qwenKey: QWEN_API_KEY.value(),
      },
    });

    let providerName: string;
    let result;
    try {
      const r = await tryProviderChain(chain);
      providerName = r.provider;
      result = r.result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logAiCall({
        uid,
        type,
        provider: 'none',
        model: effectiveModel,
        latencyMs: Date.now() - start,
        cacheHit: false,
        tokensIn: 0,
        tokensOut: 0,
        promptHash: cacheableKey,
        error: msg,
      });
      throw new HttpsError('unavailable', 'Servicio IA temporalmente no disponible. Reintenta en 1 minuto.');
    }

    // ─── Cache set + audit log ─────────────────────────────
    if (type !== 'vision') {
      await setCached(db, cacheableKey, providerName, result).catch(() => {
        // Si falla el set de cache, no rompemos la respuesta al usuario.
      });
    }

    const latencyMs = Date.now() - start;
    logAiCall({
      uid,
      type,
      provider: providerName,
      model: result.model,
      latencyMs,
      cacheHit: false,
      tokensIn: result.tokensIn ?? 0,
      tokensOut: result.tokensOut ?? 0,
      promptHash: cacheableKey,
    });
    await writeAuditLog(
      db,
      uid,
      type,
      providerName,
      result.model,
      latencyMs,
      false,
      result.tokensIn ?? 0,
      result.tokensOut ?? 0,
      cacheableKey,
    );

    return {
      provider: providerName,
      model: result.model,
      text: result.text,
      cached: false,
      latencyMs,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
    };
  },
);

function defaultModelForType(type: AiType): string {
  switch (type) {
    case 'clinical_case':
      return 'gemini-2.5-flash-lite';
    case 'educational':
      return 'deepseek-chat';
    case 'vision':
      return 'gemini-2.5-flash';
  }
}

async function writeAuditLog(
  db: FirebaseFirestore.Firestore,
  uid: string,
  type: AiType,
  provider: string,
  model: string,
  latencyMs: number,
  cacheHit: boolean,
  tokensIn: number,
  tokensOut: number,
  promptHash: string,
): Promise<void> {
  try {
    // TTL: 180 días desde creación (EU AI Act art. 12 mínimo 6 meses).
    // Requiere TTL policy activa en Firestore sobre el campo `expiresAt`:
    //   gcloud firestore fields ttls update expiresAt \
    //     --collection-group=aiRequests --enable-ttl
    // Ver docs/runbook.md §10.
    const expiresAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
    await db.collection('users').doc(uid).collection('aiRequests').add({
      type,
      provider,
      model,
      latencyMs,
      cacheHit,
      tokensIn,
      tokensOut,
      costEstimateEur: estimateCostEur(model, tokensIn, tokensOut),
      promptHash,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt,
    });
  } catch {
    // Auditoría best-effort: si Firestore falla, no rompemos la respuesta.
  }
}
