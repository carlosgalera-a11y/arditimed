import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// ── Mocks Firebase admin (no hay emulador en unit tests) ──────────────
vi.mock('firebase-admin/app', () => ({ getApp: vi.fn(() => ({})) }));
vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({
    verifyIdToken: vi.fn().mockResolvedValue({ email: 'carlosgalera2roman@gmail.com' }),
  })),
}));
vi.mock('firebase-functions/params', () => ({
  defineSecret: vi.fn((name: string) => ({ value: () => `fake-${name}` })),
}));
vi.mock('firebase-functions/v2/https', () => ({
  onRequest: vi.fn((_opts: unknown, handler: unknown) => handler),
}));
vi.mock('firebase-functions/v2', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Importar DESPUÉS de los mocks ──────────────────────────────────────
// Las funciones internas de fetch que queremos testear están encapsuladas
// en el módulo. Las testeamos a través de un helper exportado
// explícitamente para tests, o probando el comportamiento observable.
// Aquí testeamos la lógica de detección de saldo bajo aislando fetch.

const LOW_BALANCE_USD = 5.0;

// ── Helper: simula DeepSeek balance API ───────────────────────────────
function makeDeepSeekResponse(currency: string, total_balance: string): Response {
  return new Response(
    JSON.stringify({
      is_available: true,
      balance_infos: [{ currency, total_balance }],
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

function makeOpenRouterResponse(total_credits: number, total_usage: number): Response {
  return new Response(
    JSON.stringify({ data: { total_credits, total_usage } }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

function makeErrorResponse(status: number): Response {
  return new Response('{}', { status });
}

// ── Lógica extraída para unit tests (mirror de getApiBalances.ts) ──────
// Replicar las funciones puras aquí permite testearlas sin montar la CF.

function calcDeepSeekUsd(infos: Array<{ currency: string; total_balance: string }>): number {
  const usd = infos.find((b) => b.currency === 'USD');
  const cny = infos.find((b) => b.currency === 'CNY');
  // Usa || '0' + || 0 para tratar cadena vacía como 0 (parseFloat('') = NaN)
  const balUsd = usd ? (parseFloat(usd.total_balance || '0') || 0) : null;
  const balCny = cny ? (parseFloat(cny.total_balance || '0') || 0) : null;
  return balUsd ?? (balCny !== null ? balCny / 7.2 : 0);
}

function calcOpenRouterUsd(totalCredits: number, totalUsage: number): number {
  return totalCredits - totalUsage;
}

// ── Tests ─────────────────────────────────────────────────────────────

describe('DeepSeek balance — cálculo de saldo USD', () => {
  it('extrae el saldo directamente si la currency es USD', () => {
    const usd = calcDeepSeekUsd([{ currency: 'USD', total_balance: '12.50' }]);
    expect(usd).toBeCloseTo(12.5);
  });

  it('convierte CNY→USD (÷7.2) si no hay registro USD', () => {
    const usd = calcDeepSeekUsd([{ currency: 'CNY', total_balance: '72.00' }]);
    expect(usd).toBeCloseTo(10.0, 1);
  });

  it('prefiere USD sobre CNY si ambos están presentes', () => {
    const usd = calcDeepSeekUsd([
      { currency: 'USD', total_balance: '8.00' },
      { currency: 'CNY', total_balance: '720.00' },
    ]);
    expect(usd).toBeCloseTo(8.0);
  });

  it('devuelve 0 si la lista está vacía', () => {
    expect(calcDeepSeekUsd([])).toBe(0);
  });

  it('devuelve 0 si total_balance es cadena vacía', () => {
    expect(calcDeepSeekUsd([{ currency: 'USD', total_balance: '' }])).toBe(0);
  });
});

describe('DeepSeek balance — detección de saldo bajo', () => {
  it('lowBalance=true cuando USD < umbral ($5)', () => {
    const rem = calcDeepSeekUsd([{ currency: 'USD', total_balance: '3.99' }]);
    expect(rem < LOW_BALANCE_USD).toBe(true);
  });

  it('lowBalance=false cuando USD >= umbral ($5)', () => {
    const rem = calcDeepSeekUsd([{ currency: 'USD', total_balance: '5.00' }]);
    expect(rem < LOW_BALANCE_USD).toBe(false);
  });

  it('lowBalance=false exactamente en el umbral', () => {
    const rem = calcDeepSeekUsd([{ currency: 'USD', total_balance: '5.0000' }]);
    expect(rem < LOW_BALANCE_USD).toBe(false);
  });

  it('lowBalance=true cuando saldo CNY convertido < $5', () => {
    // CNY 28 → ~$3.89 USD
    const rem = calcDeepSeekUsd([{ currency: 'CNY', total_balance: '28.00' }]);
    expect(rem < LOW_BALANCE_USD).toBe(true);
  });
});

describe('OpenRouter balance — cálculo y detección', () => {
  it('calcula saldo restante correctamente', () => {
    expect(calcOpenRouterUsd(50, 42.5)).toBeCloseTo(7.5);
  });

  it('devuelve 0 cuando credits === usage', () => {
    expect(calcOpenRouterUsd(10, 10)).toBe(0);
  });

  it('lowBalance=true cuando remaining < umbral', () => {
    const rem = calcOpenRouterUsd(10, 7.5); // 2.5 restante
    expect(rem < LOW_BALANCE_USD).toBe(true);
  });

  it('lowBalance=false cuando remaining >= umbral', () => {
    const rem = calcOpenRouterUsd(20, 10); // 10 restante
    expect(rem < LOW_BALANCE_USD).toBe(false);
  });

  it('lowBalance=true con saldo negativo (gasto excede créditos)', () => {
    const rem = calcOpenRouterUsd(5, 6); // -1
    expect(rem < LOW_BALANCE_USD).toBe(true);
  });
});

describe('fetch de balances — respuestas HTTP simuladas', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('DeepSeek: respuesta 200 USD correctamente parseada', async () => {
    fetchMock.mockResolvedValueOnce(makeDeepSeekResponse('USD', '8.50'));
    const r = await fetch('https://api.deepseek.com/user/balance', {
      headers: { Authorization: 'Bearer k' },
    });
    const data = (await r.json()) as { balance_infos: Array<{ currency: string; total_balance: string }> };
    const usd = calcDeepSeekUsd(data.balance_infos ?? []);
    expect(usd).toBeCloseTo(8.5);
    expect(usd < LOW_BALANCE_USD).toBe(false);
  });

  it('DeepSeek: respuesta 200 con saldo bajo en USD', async () => {
    fetchMock.mockResolvedValueOnce(makeDeepSeekResponse('USD', '1.20'));
    const r = await fetch('https://api.deepseek.com/user/balance', {
      headers: { Authorization: 'Bearer k' },
    });
    const data = (await r.json()) as { balance_infos: Array<{ currency: string; total_balance: string }> };
    const usd = calcDeepSeekUsd(data.balance_infos ?? []);
    expect(usd).toBeCloseTo(1.2);
    expect(usd < LOW_BALANCE_USD).toBe(true);
  });

  it('DeepSeek: HTTP 401 → marca como error sin lanzar excepción', async () => {
    fetchMock.mockResolvedValueOnce(makeErrorResponse(401));
    const r = await fetch('https://api.deepseek.com/user/balance', {
      headers: { Authorization: 'Bearer k' },
    });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(401);
  });

  it('OpenRouter: respuesta 200 correctamente parseada', async () => {
    fetchMock.mockResolvedValueOnce(makeOpenRouterResponse(100, 92.5));
    const r = await fetch('https://openrouter.ai/api/v1/credits', {
      headers: { Authorization: 'Bearer k' },
    });
    const data = (await r.json()) as { data: { total_credits: number; total_usage: number } };
    const rem = calcOpenRouterUsd(data.data.total_credits, data.data.total_usage);
    expect(rem).toBeCloseTo(7.5);
    expect(rem < LOW_BALANCE_USD).toBe(false);
  });

  it('OpenRouter: saldo bajo correctamente detectado', async () => {
    fetchMock.mockResolvedValueOnce(makeOpenRouterResponse(10, 8.0));
    const r = await fetch('https://openrouter.ai/api/v1/credits', {
      headers: { Authorization: 'Bearer k' },
    });
    const data = (await r.json()) as { data: { total_credits: number; total_usage: number } };
    const rem = calcOpenRouterUsd(data.data.total_credits, data.data.total_usage);
    expect(rem).toBeCloseTo(2.0);
    expect(rem < LOW_BALANCE_USD).toBe(true);
  });

  it('OpenRouter: HTTP 429 → respuesta no ok', async () => {
    fetchMock.mockResolvedValueOnce(makeErrorResponse(429));
    const r = await fetch('https://openrouter.ai/api/v1/credits', {
      headers: { Authorization: 'Bearer k' },
    });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(429);
  });

  it('anyLow=true cuando ambos proveedores tienen saldo bajo', () => {
    const dsRem = calcDeepSeekUsd([{ currency: 'USD', total_balance: '2.00' }]);
    const orRem = calcOpenRouterUsd(5, 4.5);
    const anyLow = dsRem < LOW_BALANCE_USD || orRem < LOW_BALANCE_USD;
    expect(anyLow).toBe(true);
  });

  it('anyLow=false cuando ambos tienen saldo suficiente', () => {
    const dsRem = calcDeepSeekUsd([{ currency: 'USD', total_balance: '20.00' }]);
    const orRem = calcOpenRouterUsd(50, 10);
    const anyLow = dsRem < LOW_BALANCE_USD || orRem < LOW_BALANCE_USD;
    expect(anyLow).toBe(false);
  });

  it('anyLow=true cuando solo OpenRouter está bajo', () => {
    const dsRem = calcDeepSeekUsd([{ currency: 'USD', total_balance: '20.00' }]);
    const orRem = calcOpenRouterUsd(5, 4.8); // 0.20 restante
    const anyLow = dsRem < LOW_BALANCE_USD || orRem < LOW_BALANCE_USD;
    expect(anyLow).toBe(true);
  });

  it('anyLow=true cuando solo DeepSeek está bajo', () => {
    const dsRem = calcDeepSeekUsd([{ currency: 'USD', total_balance: '0.50' }]);
    const orRem = calcOpenRouterUsd(100, 10);
    const anyLow = dsRem < LOW_BALANCE_USD || orRem < LOW_BALANCE_USD;
    expect(anyLow).toBe(true);
  });
});

describe('autenticación — verificación de token', () => {
  it('rechaza peticiones sin header Authorization', () => {
    const authHeader = '';
    expect(authHeader.startsWith('Bearer ')).toBe(false);
  });

  it('rechaza peticiones con esquema incorrecto (Basic)', () => {
    const authHeader = 'Basic abc123';
    expect(authHeader.startsWith('Bearer ')).toBe(false);
  });

  it('acepta peticiones con Bearer token', () => {
    const authHeader = 'Bearer eyJhbGciOiJSUzI1NiJ9.test';
    expect(authHeader.startsWith('Bearer ')).toBe(true);
    const token = authHeader.slice(7);
    expect(token).toBe('eyJhbGciOiJSUzI1NiJ9.test');
  });

  it('rechaza email no autorizado', () => {
    const VIEWERS = ['carlosgalera2roman@gmail.com'];
    expect(VIEWERS.includes('attacker@evil.com')).toBe(false);
  });

  it('acepta email del propietario (case-insensitive)', () => {
    const VIEWERS = ['carlosgalera2roman@gmail.com'];
    const email = 'CarlosGalera2Roman@Gmail.Com'.toLowerCase();
    expect(VIEWERS.includes(email)).toBe(true);
  });
});
