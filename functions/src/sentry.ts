// ══════════════════════════════════════════════════════════════════════
// Sentry init para Cloud Functions
// © 2026 Carlos Galera Román · Licencia propietaria
// ══════════════════════════════════════════════════════════════════════
//
// Inicializa Sentry SOLO si SENTRY_DSN está definido como secret.
// Sin DSN: silencioso, no añade overhead. Pensado para activarse cuando
// haya cuenta Sentry creada (free tier, 5k events/mes).
//
// Activación:
//   firebase functions:secrets:set SENTRY_DSN
//   # pegar el DSN del proyecto
//   firebase deploy --only functions
//
// Lo que captura:
// - Excepciones no atrapadas en handlers (via `Sentry.captureException`).
// - Logs `logger.error()` (vía bridge automático del SDK serverless).
// - PII: `sendDefaultPii: false` para evitar emails/IPs en eventos.
// ══════════════════════════════════════════════════════════════════════

import * as Sentry from '@sentry/google-cloud-serverless';
import { defineSecret } from 'firebase-functions/params';

export const SENTRY_DSN = defineSecret('SENTRY_DSN');

let _initialized = false;

export function initSentry(): void {
  if (_initialized) return;
  const dsn = SENTRY_DSN.value();
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'production',
    release: process.env.K_REVISION ?? undefined,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    integrations: (defaults) =>
      defaults.filter((i) => i.name !== 'OnUncaughtException'),
  });
  _initialized = true;
}

export function captureException(err: unknown, context?: Record<string, unknown>): void {
  if (!_initialized) return;
  Sentry.captureException(err, { extra: context });
}

export function setUser(uid: string | null): void {
  if (!_initialized) return;
  Sentry.setUser(uid ? { id: uid } : null);
}

export { Sentry };
