import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { getAuth } from 'firebase-admin/auth';
import { getApp } from 'firebase-admin/app';
import { logger } from 'firebase-functions/v2';

const DEEPSEEK_API_KEY = defineSecret('DEEPSEEK_API_KEY');
const OPENROUTER_API_KEY = defineSecret('OPENROUTER_API_KEY');

const DASHBOARD_VIEWERS = ['carlosgalera2roman@gmail.com'];

// Umbral: aviso cuando el saldo restante es inferior a este valor en USD.
const LOW_BALANCE_USD = 5.0;

type ProviderBalance =
  | { ok: true; remainingUsd: number; lowBalance: boolean; detail: Record<string, unknown> }
  | { ok: false; error: string; lowBalance: null };

async function fetchDeepSeekBalance(key: string): Promise<ProviderBalance> {
  const r = await fetch('https://api.deepseek.com/user/balance', {
    headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) return { ok: false, error: `HTTP ${r.status}`, lowBalance: null };
  const data = (await r.json()) as {
    is_available?: boolean;
    balance_infos?: Array<{ currency: string; total_balance: string }>;
  };
  const infos = data.balance_infos ?? [];
  const usd = infos.find((b) => b.currency === 'USD');
  const cny = infos.find((b) => b.currency === 'CNY');
  const balanceUsd = usd ? (parseFloat(usd.total_balance || '0') || 0) : null;
  const balanceCny = cny ? (parseFloat(cny.total_balance || '0') || 0) : null;
  // Conversión aproximada CNY→USD si no hay valor en USD directamente
  const remainingUsd = balanceUsd ?? (balanceCny !== null ? balanceCny / 7.2 : 0);
  return {
    ok: true,
    remainingUsd,
    lowBalance: remainingUsd < LOW_BALANCE_USD,
    detail: { balanceUsd, balanceCny, isAvailable: data.is_available ?? true, infos },
  };
}

async function fetchOpenRouterBalance(key: string): Promise<ProviderBalance> {
  const r = await fetch('https://openrouter.ai/api/v1/credits', {
    headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) return { ok: false, error: `HTTP ${r.status}`, lowBalance: null };
  const data = (await r.json()) as { data?: { total_credits: number; total_usage: number } };
  const credits = data.data?.total_credits ?? 0;
  const usage = data.data?.total_usage ?? 0;
  const remainingUsd = credits - usage;
  return {
    ok: true,
    remainingUsd,
    lowBalance: remainingUsd < LOW_BALANCE_USD,
    detail: { totalCredits: credits, totalUsage: usage },
  };
}

/**
 * getApiBalances — consulta los saldos de DeepSeek y OpenRouter.
 * Solo accesible para el propietario del dashboard (ID token verificado).
 * Respuesta sin caché (privada) para tener siempre el saldo real.
 */
export const getApiBalances = onRequest(
  {
    region: 'europe-west1',
    secrets: [DEEPSEEK_API_KEY, OPENROUTER_API_KEY],
    memory: '256MiB',
    timeoutSeconds: 20,
    cors: [
      'https://area2cartagena.es',
      'https://www.area2cartagena.es',
      'https://arditimed.es',
      'https://www.arditimed.es',
      'https://medikai.es',
      'https://www.medikai.es',
      'https://carlosgalera-a11y.github.io',
      'http://localhost',
    ],
  },
  async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'method_not_allowed' });
      return;
    }

    const authHeader = req.headers.authorization ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    try {
      const decoded = await getAuth(getApp()).verifyIdToken(authHeader.slice(7));
      if (!DASHBOARD_VIEWERS.includes((decoded.email ?? '').toLowerCase())) {
        res.status(403).json({ error: 'forbidden' });
        return;
      }
    } catch {
      res.status(401).json({ error: 'invalid_token' });
      return;
    }

    const [deepseek, openrouter] = await Promise.all([
      fetchDeepSeekBalance(DEEPSEEK_API_KEY.value()).catch(
        (e): ProviderBalance => ({ ok: false, error: (e as Error).message.slice(0, 120), lowBalance: null }),
      ),
      fetchOpenRouterBalance(OPENROUTER_API_KEY.value()).catch(
        (e): ProviderBalance => ({ ok: false, error: (e as Error).message.slice(0, 120), lowBalance: null }),
      ),
    ]);

    const anyLow = (deepseek.lowBalance === true) || (openrouter.lowBalance === true);

    if (anyLow) {
      logger.warn('getApiBalances.LOW_BALANCE', {
        deepseekUsd: deepseek.ok ? deepseek.remainingUsd : 'error',
        openrouterUsd: openrouter.ok ? openrouter.remainingUsd : 'error',
      });
    }

    res.set('Cache-Control', 'private, no-cache');
    res.status(200).json({
      deepseek,
      openrouter,
      anyLow,
      thresholdUsd: LOW_BALANCE_USD,
      generatedAt: new Date().toISOString(),
    });
  },
);
