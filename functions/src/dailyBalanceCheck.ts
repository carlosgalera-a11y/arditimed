import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getApp } from 'firebase-admin/app';
import { logger } from 'firebase-functions/v2';
import * as nodemailer from 'nodemailer';

const DEEPSEEK_API_KEY = defineSecret('DEEPSEEK_API_KEY');
const OPENROUTER_API_KEY = defineSecret('OPENROUTER_API_KEY');
const GMAIL_APP_PASSWORD = defineSecret('GMAIL_APP_PASSWORD');

const REGION = 'europe-west1';
const TZ = 'Europe/Madrid';

const ALERT_FROM = 'carlosgalera2roman@gmail.com';
const ALERT_TO = 'carlosgalera2roman@gmail.com';
const LOW_BALANCE_USD = 5.0;

// Evita enviar más de 1 email de alerta por proveedor cada 24 h.
const FIRESTORE_THROTTLE_DOC = 'alerts/balance_low';

type BalanceResult =
  | { provider: string; ok: true; remainingUsd: number; lowBalance: boolean; label: string }
  | { provider: string; ok: false; error: string; lowBalance: false };

async function checkDeepSeek(key: string): Promise<BalanceResult> {
  const r = await fetch('https://api.deepseek.com/user/balance', {
    headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) return { provider: 'DeepSeek', ok: false, error: `HTTP ${r.status}`, lowBalance: false };
  const data = (await r.json()) as {
    balance_infos?: Array<{ currency: string; total_balance: string }>;
  };
  const infos = data.balance_infos ?? [];
  const usd = infos.find((b) => b.currency === 'USD');
  const cny = infos.find((b) => b.currency === 'CNY');
  const balUsd = usd ? (parseFloat(usd.total_balance || '0') || 0) : null;
  const balCny = cny ? (parseFloat(cny.total_balance || '0') || 0) : null;
  const remaining = balUsd ?? (balCny !== null ? balCny / 7.2 : 0);
  const label = balUsd !== null ? `$${remaining.toFixed(2)}` : `¥${balCny?.toFixed(2)} (~$${remaining.toFixed(2)})`;
  return {
    provider: 'DeepSeek',
    ok: true,
    remainingUsd: remaining,
    lowBalance: remaining < LOW_BALANCE_USD,
    label,
  };
}

async function checkOpenRouter(key: string): Promise<BalanceResult> {
  const r = await fetch('https://openrouter.ai/api/v1/credits', {
    headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) return { provider: 'OpenRouter', ok: false, error: `HTTP ${r.status}`, lowBalance: false };
  const data = (await r.json()) as { data?: { total_credits: number; total_usage: number } };
  const remaining = (data.data?.total_credits ?? 0) - (data.data?.total_usage ?? 0);
  return {
    provider: 'OpenRouter',
    ok: true,
    remainingUsd: remaining,
    lowBalance: remaining < LOW_BALANCE_USD,
    label: `$${remaining.toFixed(2)}`,
  };
}

function buildEmailHtml(low: BalanceResult[]): string {
  const rows = low.map((r) => {
    const val = r.ok ? r.label : `Error: ${r.error}`;
    const color = r.ok ? '#dc2626' : '#6b7280';
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb"><strong>${r.provider}</strong></td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:${color};font-weight:700">${val}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280">Umbral: $${LOW_BALANCE_USD}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family:system-ui,sans-serif;color:#111;max-width:520px;margin:0 auto;padding:20px">
  <div style="background:#7f1d1d;border-radius:8px;padding:14px 18px;margin-bottom:18px;text-align:center">
    <h2 style="color:#fca5a5;margin:0;font-size:1.1rem">⚠️ Saldo bajo en proveedor IA · Cartagenaeste</h2>
  </div>
  <p style="margin-bottom:14px">El check automático diario de saldo ha detectado uno o más proveedores IA por debajo del umbral de alerta.</p>
  <table style="width:100%;border-collapse:collapse;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:18px">
    <thead>
      <tr style="background:#fee2e2">
        <th style="padding:8px 12px;text-align:left;font-size:.85rem">Proveedor</th>
        <th style="padding:8px 12px;text-align:left;font-size:.85rem">Saldo restante</th>
        <th style="padding:8px 12px;text-align:left;font-size:.85rem">Umbral</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div style="display:flex;gap:10px;margin-bottom:20px">
    <a href="https://platform.deepseek.com/top_up" style="display:inline-block;padding:8px 16px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-size:.85rem">Recargar DeepSeek</a>
    <a href="https://openrouter.ai/credits" style="display:inline-block;padding:8px 16px;background:#6d28d9;color:#fff;text-decoration:none;border-radius:6px;font-size:.85rem">Recargar OpenRouter</a>
  </div>
  <p style="font-size:.8rem;color:#9ca3af">Generado automáticamente a las 09:00 (hora de Madrid) por Cartagenaeste Cloud Functions · docenciacartagenaeste · europe-west1.</p>
</body>
</html>`;
}

async function sendAlert(low: BalanceResult[], gmailPass: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: ALERT_FROM, pass: gmailPass },
  });

  const subject = `⚠️ Saldo bajo IA · ${low.map((r) => r.provider).join(' + ')} · Cartagenaeste`;

  await transporter.sendMail({
    from: `Cartagenaeste Monitor <${ALERT_FROM}>`,
    to: ALERT_TO,
    subject,
    html: buildEmailHtml(low),
    text: low.map((r) => `${r.provider}: ${r.ok ? r.label : r.error} (umbral $${LOW_BALANCE_USD})`).join('\n'),
  });
}

/**
 * dailyBalanceCheck — ejecuta cada día a las 09:00 hora de Madrid.
 *
 * Comprueba el saldo de DeepSeek y OpenRouter. Si alguno está por debajo
 * de LOW_BALANCE_USD ($5), envía un email de alerta y registra en Firestore
 * para evitar spam (máx 1 email/24h por proveedor).
 *
 * Requiere secret GMAIL_APP_PASSWORD: contraseña de aplicación de Gmail
 * (Google Account → Seguridad → Verificación en 2 pasos → Contraseñas de app).
 * `firebase functions:secrets:set GMAIL_APP_PASSWORD`
 */
export const dailyBalanceCheck = onSchedule(
  {
    region: REGION,
    schedule: 'every day 09:00',
    timeZone: TZ,
    secrets: [DEEPSEEK_API_KEY, OPENROUTER_API_KEY, GMAIL_APP_PASSWORD],
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async () => {
    const db = getFirestore(getApp());
    const today = new Date().toISOString().substring(0, 10);

    const [ds, or] = await Promise.all([
      checkDeepSeek(DEEPSEEK_API_KEY.value()).catch(
        (e): BalanceResult => ({ provider: 'DeepSeek', ok: false, error: (e as Error).message, lowBalance: false }),
      ),
      checkOpenRouter(OPENROUTER_API_KEY.value()).catch(
        (e): BalanceResult => ({ provider: 'OpenRouter', ok: false, error: (e as Error).message, lowBalance: false }),
      ),
    ]);

    const lowProviders = [ds, or].filter((r) => r.lowBalance);

    logger.info('dailyBalanceCheck', {
      date: today,
      deepseekUsd: ds.ok ? ds.remainingUsd : 'error',
      openrouterUsd: or.ok ? or.remainingUsd : 'error',
      lowCount: lowProviders.length,
    });

    if (lowProviders.length === 0) return;

    // Throttle: no enviar más de 1 alerta/día para el mismo conjunto de proveedores.
    const throttleRef = db.doc(FIRESTORE_THROTTLE_DOC);
    const throttleSnap = await throttleRef.get();
    if (throttleSnap.exists && throttleSnap.data()?.lastAlertDate === today) {
      logger.info('dailyBalanceCheck.throttled', { date: today });
      return;
    }

    const gmailPass = GMAIL_APP_PASSWORD.value();
    if (!gmailPass) {
      logger.warn('dailyBalanceCheck.no_gmail_password', {
        hint: 'Configura el secret GMAIL_APP_PASSWORD para habilitar alertas por email.',
        lowProviders: lowProviders.map((r) => r.provider),
      });
      return;
    }

    try {
      await sendAlert(lowProviders, gmailPass);
      logger.info('dailyBalanceCheck.email_sent', {
        to: ALERT_TO,
        providers: lowProviders.map((r) => r.provider),
      });

      await throttleRef.set({
        lastAlertDate: today,
        providers: lowProviders.map((r) => r.provider),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } catch (e) {
      logger.error('dailyBalanceCheck.email_error', { message: (e as Error).message });
    }
  },
);
