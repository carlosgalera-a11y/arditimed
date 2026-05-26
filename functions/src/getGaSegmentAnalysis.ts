import { onRequest } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getApp } from 'firebase-admin/app';
import { GoogleAuth } from 'google-auth-library';
import { logger } from 'firebase-functions/v2';

const GA4_PROPERTY_ID = '525246514';
const GA4_DATA_API_BASE = 'https://analyticsdata.googleapis.com/v1beta';

const DASHBOARD_VIEWERS = ['carlosgalera2roman@gmail.com'];

// ── Catálogo de páginas por apartado ─────────────────────────────────
// Mantener sincronizado con admin-dashboard.html (PAGES_PROFESIONALES / PAGES_PACIENTES)
const PROFESIONALES_PATHS = [
  '/profesionales.html', '/panel-medico.html', '/urgencias.html', '/casos-clinicos.html',
  '/triaje-ai.html', '/triaje-ficha.html', '/evidencia-ia.html', '/plantillas-informes.html',
  '/cuadernos-ia.html', '/notebook-local.html', '/calculadoras.html', '/vademecum.html',
  '/programacion.html', '/dashboard.html', '/agenda-guardia.html', '/proa.html',
  '/protocolos-atencion.html', '/protocolos-nuevas-especialidades.html',
  '/corrector-clinico.html', '/scan-upload.html', '/transcripcion.html',
  '/chatbot-medicacion.html', '/categorias-docs.html', '/categorias.html',
  '/centros-salud.html', '/integraciones.html', '/citas.html', '/buscas.html',
  '/admin-dashboard.html', '/analiticas.html', '/camas-y-ambulancias.html',
  '/docencia.html', '/fichas-consulta-rapida.html', '/fuentes-recursos.html',
];
const PACIENTES_PATHS = [
  '/pacientes.html', '/consejos-salud.html', '/prepara-consulta.html',
  '/preparacion-consulta.html', '/recursos-comunitarios.html', '/recursos-sociales.html',
  '/recordatorio-medicacion.html', '/vacunas.html', '/dejar-fumar.html',
  '/embarazo-postparto.html', '/dietas.html', '/ejercicios.html', '/salud-infantil.html',
  '/violencia-genero.html', '/factores-riesgo.html', '/dentista.html',
  '/enfermedades-cronicas.html', '/guia-cuidador.html', '/instrucciones-paciente.html',
  '/enlaces-interes.html', '/podcast.html', '/multiidioma.html', '/blog-categorias.html',
];

type ReportRow = { dimensionValues: { value: string }[]; metricValues: { value: string }[] };
type ReportResponse = { rows?: ReportRow[]; totals?: ReportRow[] };

let authClient: GoogleAuth | null = null;
function getGoogleAuth(): GoogleAuth {
  if (!authClient) {
    authClient = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });
  }
  return authClient;
}

async function runReport(body: Record<string, unknown>): Promise<ReportResponse> {
  const client = await getGoogleAuth().getClient();
  const url = `${GA4_DATA_API_BASE}/properties/${GA4_PROPERTY_ID}:runReport`;
  const res = await client.request<ReportResponse>({ url, method: 'POST', data: body });
  return res.data ?? {};
}

function num(s: string | undefined): number {
  return Number(s ?? 0);
}

function rowsOf<T>(res: ReportResponse, fn: (r: ReportRow) => T, max = 50): T[] {
  if (!res.rows) return [];
  return res.rows.slice(0, max).map(fn);
}

function pathFilter(paths: string[]): Record<string, unknown> {
  return {
    dimensionFilter: {
      filter: {
        fieldName: 'pagePath',
        inListFilter: { values: paths, caseSensitive: false },
      },
    },
  };
}

export type SegmentMetrics = {
  // Métricas principales (28d)
  users: number;
  sessions: number;
  views: number;
  newUsers: number;
  avgEngagementTimeSec: number;
  bounceRate: number;          // 0..1
  pageviewsPerSession: number;
  sessionsPerUser: number;

  // Distribuciones
  byDevice: { device: string; users: number; pct: number }[];
  byHour: { hour: number; users: number }[];          // 0..23
  byDayOfWeek: { day: number; users: number }[];      // 0..6 (Sun..Sat)
  topSources: { source: string; medium: string; sessions: number; users: number }[];
  topPages: { path: string; title: string; views: number; avgTimeSec: number }[];
  newVsReturning: { type: string; users: number; pct: number }[];
  topCountries: { country: string; users: number }[];
  topCities: { city: string; country: string; users: number }[];
  byBrowser: { browser: string; users: number; pct: number }[];
};

export type GaSegmentAnalysisPayload = {
  generatedAt: string;
  rangeDays: number;
  pro: SegmentMetrics;
  pac: SegmentMetrics;
  comparison: {
    proSharePct: number;        // % de pageviews del total que va a Pro
    pacSharePct: number;        // % de pageviews del total que va a Pac
    proIsHotter: boolean;       // si Pro tiene >50% del tráfico
    insights: string[];         // frases auto-generadas listas para venta
  };
};

async function fetchSegment(paths: string[], days: number): Promise<SegmentMetrics> {
  const dr = { startDate: `${days}daysAgo`, endDate: 'today' };
  const filter = pathFilter(paths);

  const [
    mainRes, devicesRes, hoursRes, dowRes, sourcesRes,
    pagesRes, newRetRes, countriesRes, citiesRes, browsersRes,
  ] = await Promise.all([
    runReport({
      dateRanges: [dr],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'newUsers' },
        { name: 'userEngagementDuration' },
        { name: 'bounceRate' },
        { name: 'screenPageViewsPerSession' },
        { name: 'sessionsPerUser' },
      ],
      ...filter,
    }),
    runReport({
      dateRanges: [dr],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      ...filter,
    }),
    runReport({
      dateRanges: [dr],
      dimensions: [{ name: 'hour' }],
      metrics: [{ name: 'activeUsers' }],
      ...filter,
    }),
    runReport({
      dateRanges: [dr],
      dimensions: [{ name: 'dayOfWeek' }],
      metrics: [{ name: 'activeUsers' }],
      ...filter,
    }),
    runReport({
      dateRanges: [dr],
      dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: '8',
      ...filter,
    }),
    runReport({
      dateRanges: [dr],
      dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'userEngagementDuration' },
      ],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: '10',
      ...filter,
    }),
    runReport({
      dateRanges: [dr],
      dimensions: [{ name: 'newVsReturning' }],
      metrics: [{ name: 'activeUsers' }],
      ...filter,
    }),
    runReport({
      dateRanges: [dr],
      dimensions: [{ name: 'country' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: '8',
      ...filter,
    }),
    runReport({
      dateRanges: [dr],
      dimensions: [{ name: 'city' }, { name: 'country' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: '8',
      ...filter,
    }),
    runReport({
      dateRanges: [dr],
      dimensions: [{ name: 'browser' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: '5',
      ...filter,
    }),
  ]);

  const m = mainRes.rows?.[0]?.metricValues;
  const sessionsTotal = num(m?.[1]?.value);
  const result: SegmentMetrics = {
    users: num(m?.[0]?.value),
    sessions: sessionsTotal,
    views: num(m?.[2]?.value),
    newUsers: num(m?.[3]?.value),
    avgEngagementTimeSec:
      num(m?.[4]?.value) / Math.max(1, sessionsTotal),
    bounceRate: num(m?.[5]?.value),
    pageviewsPerSession: num(m?.[6]?.value),
    sessionsPerUser: num(m?.[7]?.value),
    byDevice: [],
    byHour: [],
    byDayOfWeek: [],
    topSources: [],
    topPages: [],
    newVsReturning: [],
    topCountries: [],
    topCities: [],
    byBrowser: [],
  };

  // Devices con porcentaje
  const totalDeviceUsers =
    (devicesRes.rows ?? []).reduce((acc, r) => acc + num(r.metricValues?.[0]?.value), 0);
  result.byDevice = rowsOf(devicesRes, (r) => {
    const u = num(r.metricValues?.[0]?.value);
    return {
      device: r.dimensionValues?.[0]?.value ?? '(unknown)',
      users: u,
      pct: totalDeviceUsers > 0 ? (u / totalDeviceUsers) * 100 : 0,
    };
  });

  // Browsers con porcentaje
  const totalBrowserUsers =
    (browsersRes.rows ?? []).reduce((acc, r) => acc + num(r.metricValues?.[0]?.value), 0);
  result.byBrowser = rowsOf(browsersRes, (r) => {
    const u = num(r.metricValues?.[0]?.value);
    return {
      browser: r.dimensionValues?.[0]?.value ?? '(unknown)',
      users: u,
      pct: totalBrowserUsers > 0 ? (u / totalBrowserUsers) * 100 : 0,
    };
  });

  // Hours (0..23)
  const hourMap: Record<number, number> = {};
  (hoursRes.rows ?? []).forEach((r) => {
    const h = parseInt(r.dimensionValues?.[0]?.value ?? '0', 10);
    hourMap[h] = num(r.metricValues?.[0]?.value);
  });
  for (let h = 0; h < 24; h++) {
    result.byHour.push({ hour: h, users: hourMap[h] ?? 0 });
  }

  // Day of week (1=Sun..7=Sat in GA4)
  const dowMap: Record<number, number> = {};
  (dowRes.rows ?? []).forEach((r) => {
    const d = parseInt(r.dimensionValues?.[0]?.value ?? '0', 10);
    dowMap[d] = num(r.metricValues?.[0]?.value);
  });
  for (let d = 0; d < 7; d++) {
    result.byDayOfWeek.push({ day: d, users: dowMap[d] ?? 0 });
  }

  // Top sources
  result.topSources = rowsOf(sourcesRes, (r) => ({
    source: r.dimensionValues?.[0]?.value ?? '(direct)',
    medium: r.dimensionValues?.[1]?.value ?? '(none)',
    sessions: num(r.metricValues?.[0]?.value),
    users: num(r.metricValues?.[1]?.value),
  }));

  // Top pages internal
  result.topPages = rowsOf(pagesRes, (r) => {
    const v = num(r.metricValues?.[0]?.value);
    return {
      path: r.dimensionValues?.[0]?.value ?? '',
      title: r.dimensionValues?.[1]?.value ?? '',
      views: v,
      avgTimeSec: num(r.metricValues?.[1]?.value) / Math.max(1, v),
    };
  });

  // New vs returning
  const totalNewRet =
    (newRetRes.rows ?? []).reduce((acc, r) => acc + num(r.metricValues?.[0]?.value), 0);
  result.newVsReturning = rowsOf(newRetRes, (r) => {
    const u = num(r.metricValues?.[0]?.value);
    return {
      type: r.dimensionValues?.[0]?.value ?? '(unknown)',
      users: u,
      pct: totalNewRet > 0 ? (u / totalNewRet) * 100 : 0,
    };
  });

  // Countries
  result.topCountries = rowsOf(countriesRes, (r) => ({
    country: r.dimensionValues?.[0]?.value ?? '(unknown)',
    users: num(r.metricValues?.[0]?.value),
  }), 8);

  // Cities
  result.topCities = rowsOf(citiesRes, (r) => ({
    city: r.dimensionValues?.[0]?.value ?? '(unknown)',
    country: r.dimensionValues?.[1]?.value ?? '(unknown)',
    users: num(r.metricValues?.[0]?.value),
  }), 8);

  return result;
}

function buildInsights(pro: SegmentMetrics, pac: SegmentMetrics): string[] {
  const out: string[] = [];

  if (pro.users > 0) {
    const pct = Math.round(pro.bounceRate * 100);
    const time = Math.round(pro.avgEngagementTimeSec);
    out.push(
      `${pro.users} profesionales únicos accedieron al apartado clínico (28d), ` +
      `con tiempo medio por sesión de ${time}s y bounce rate ${pct}%.`,
    );
  }
  if (pac.users > 0) {
    const time = Math.round(pac.avgEngagementTimeSec);
    out.push(
      `${pac.users} pacientes anónimos consultaron contenidos de salud (28d) ` +
      `con ${pac.pageviewsPerSession.toFixed(1)} páginas/sesión y ${time}s de tiempo medio.`,
    );
  }

  // Mobile share comparison
  const mobilePro = pro.byDevice.find((d) => d.device === 'mobile')?.pct ?? 0;
  const mobilePac = pac.byDevice.find((d) => d.device === 'mobile')?.pct ?? 0;
  if (mobilePro > 0 || mobilePac > 0) {
    out.push(
      `El acceso desde móvil supone ${mobilePac.toFixed(0)}% en pacientes ` +
      `frente al ${mobilePro.toFixed(0)}% en profesionales — ` +
      `${mobilePac > mobilePro ? 'los pacientes consultan más en movilidad, oportunidad para PWA' : 'los profesionales también dependen del móvil en consulta'}.`,
    );
  }

  // Returning rate comparison
  const retPro = pro.newVsReturning.find((n) => n.type === 'returning')?.pct ?? 0;
  const retPac = pac.newVsReturning.find((n) => n.type === 'returning')?.pct ?? 0;
  if (retPro > 0 || retPac > 0) {
    out.push(
      `Tasa de usuarios recurrentes: profesionales ${retPro.toFixed(0)}% · pacientes ${retPac.toFixed(0)}%. ` +
      `${retPro > 30 ? 'Señal clara de uso profesional sostenido.' : 'Aún en fase de descubrimiento entre profesionales.'}`,
    );
  }

  // Top source insight
  if (pro.topSources.length > 0) {
    const top = pro.topSources[0]!;
    out.push(
      `La principal fuente de tráfico al área profesional es ` +
      `"${top.source} / ${top.medium}" (${top.sessions} sesiones).`,
    );
  }

  // Total addressable
  const totalUsers = pro.users + pac.users;
  if (totalUsers > 0) {
    out.push(
      `Total de personas únicas que han usado la webapp en los últimos 28 días: ${totalUsers} ` +
      `(${pro.users} profesionales + ${pac.users} pacientes, sin contar overlap).`,
    );
  }

  // Engagement quality
  if (pac.avgEngagementTimeSec > 60) {
    out.push(
      `El tiempo medio de un paciente en la web es ${Math.round(pac.avgEngagementTimeSec)}s — ` +
      `por encima del benchmark sanidad (45-60s) indica contenido valorado, no rebote rápido.`,
    );
  }

  return out;
}

/**
 * getGaSegmentAnalysis — análisis profundo y comparado del uso del apartado
 * Profesionales vs el apartado Pacientes a partir de GA4 (incluye anónimos).
 *
 * Devuelve, para cada segmento (pro/pac):
 *  - KPIs (users, sessions, views, newUsers, engagement, bounce, pages/session)
 *  - Distribución por dispositivo, hora del día, día semana, browser
 *  - Top fuentes de tráfico, top páginas internas, nuevos vs recurrentes
 *  - Top países y ciudades
 *
 * Más un bloque "comparison.insights" con frases auto-generadas listas
 * para utilizar como argumento de venta en propuestas comerciales.
 *
 * Auth: Firebase ID token con email en DASHBOARD_VIEWERS.
 * Cache: 30 min.
 */
export const getGaSegmentAnalysis = onRequest(
  {
    region: 'europe-west1',
    memory: '512MiB',
    timeoutSeconds: 120,
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
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'GET') { res.status(405).json({ error: 'method_not_allowed' }); return; }

    const authHeader = req.headers.authorization ?? '';
    if (!authHeader.startsWith('Bearer ')) { res.status(401).json({ error: 'unauthorized' }); return; }
    try {
      const decoded = await getAuth(getApp()).verifyIdToken(authHeader.slice(7));
      if (!DASHBOARD_VIEWERS.includes((decoded.email ?? '').toLowerCase())) {
        res.status(403).json({ error: 'forbidden' }); return;
      }
    } catch {
      res.status(401).json({ error: 'invalid_token' }); return;
    }

    const days = Math.min(90, Math.max(7, parseInt(String(req.query.days ?? '28'), 10) || 28));

    try {
      const [pro, pac] = await Promise.all([
        fetchSegment(PROFESIONALES_PATHS, days),
        fetchSegment(PACIENTES_PATHS, days),
      ]);

      const totalViews = pro.views + pac.views;
      const proSharePct = totalViews > 0 ? (pro.views / totalViews) * 100 : 0;
      const pacSharePct = totalViews > 0 ? (pac.views / totalViews) * 100 : 0;

      const payload: GaSegmentAnalysisPayload = {
        generatedAt: new Date().toISOString(),
        rangeDays: days,
        pro,
        pac,
        comparison: {
          proSharePct,
          pacSharePct,
          proIsHotter: pro.views >= pac.views,
          insights: buildInsights(pro, pac),
        },
      };

      res.set('Cache-Control', 'private, max-age=1800'); // 30 min
      res.status(200).json(payload);
    } catch (e) {
      const err = e as Error & { response?: { status?: number; data?: unknown } };
      logger.error('getGaSegmentAnalysis.error', {
        message: err.message,
        status: err.response?.status,
      });
      if (err.response?.status === 403) {
        res.status(403).json({
          error: 'ga4_permission_denied',
          hint: 'Service account sin rol Viewer en property GA4 525246514.',
        });
        return;
      }
      res.status(500).json({ error: 'ga4_error', message: err.message });
    }
  },
);
