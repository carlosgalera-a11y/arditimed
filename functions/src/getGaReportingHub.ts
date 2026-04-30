import { onRequest } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getApp } from 'firebase-admin/app';
import { GoogleAuth } from 'google-auth-library';
import { logger } from 'firebase-functions/v2';

const GA4_PROPERTY_ID = '525246514';
const GA4_DATA_API_BASE = 'https://analyticsdata.googleapis.com/v1beta';

const DASHBOARD_VIEWERS = ['carlosgalera2roman@gmail.com'];

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

async function runRealtimeReport(body: Record<string, unknown>): Promise<ReportResponse> {
  const client = await getGoogleAuth().getClient();
  const url = `${GA4_DATA_API_BASE}/properties/${GA4_PROPERTY_ID}:runRealtimeReport`;
  const res = await client.request<ReportResponse>({ url, method: 'POST', data: body });
  return res.data ?? {};
}

function rows<T>(res: ReportResponse, fn: (r: ReportRow) => T, max = 50): T[] {
  if (!res.rows) return [];
  return res.rows.slice(0, max).map(fn);
}

function num(s: string | undefined): number {
  return Number(s ?? 0);
}

export type GaReportingHubPayload = {
  generatedAt: string;

  // Tiempo real (últimos 30 minutos)
  realtime: {
    activeUsers: number;
    activeUsersByCountry: { country: string; users: number }[];
    activeUsersByDevice: { device: string; users: number }[];
    activeUsersByPage: { path: string; users: number }[];
  };

  // Adquisición por canal (28d)
  acquisitionByChannel: {
    channel: string;
    sessions: number;
    users: number;
    engagementRate: number;
    avgEngagementTimeSec: number;
  }[];

  // Engagement overview (28d)
  engagement28d: {
    activeUsers: number;
    sessions: number;
    engagedSessions: number;
    engagementRate: number;          // 0..1
    avgEngagementTimePerSessionSec: number;
    eventsPerSession: number;
    bounceRate: number;              // 0..1 (1 - engagementRate)
    sessionsPerUser: number;
    pageviewsPerSession: number;
  };

  // Top eventos (28d)
  topEvents28d: { eventName: string; count: number; users: number }[];

  // Geo · ciudades (28d)
  topCities28d: { city: string; country: string; users: number; sessions: number }[];

  // Idioma (28d)
  topLanguages28d: { language: string; users: number; pct: number }[];

  // Páginas con engagement (28d) — más rico que solo views
  topPagesEngaged28d: {
    path: string;
    title: string;
    views: number;
    avgEngagementTimeSec: number;
    bounceRate: number;
  }[];

  // First-user source (28d) — cómo llegan los nuevos usuarios
  firstUserSource28d: { source: string; medium: string; newUsers: number }[];
};

/**
 * getGaReportingHub — equivalente al "Reports" hub de GA4 expuesto al admin dashboard.
 *
 * Trae en una sola llamada las métricas que normalmente verías navegando por
 * los informes de GA4: realtime, adquisición, engagement, eventos, geo,
 * idioma, páginas con engagement.
 *
 * Auth: Firebase ID token con email en DASHBOARD_VIEWERS.
 * Cache cliente: max-age 600 s (10 min) — los datos GA4 tienen ~24h de latencia
 * salvo el bloque realtime que se actualiza cada minuto.
 */
export const getGaReportingHub = onRequest(
  {
    region: 'europe-west1',
    memory: '512MiB',
    timeoutSeconds: 60,
    cors: [
      'https://area2cartagena.es',
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

    try {
      const DR28 = { startDate: '28daysAgo', endDate: 'today' };

      const [
        realtimeUsers,
        realtimeByCountry,
        realtimeByDevice,
        realtimeByPage,
        acquisitionRes,
        engagementRes,
        eventsRes,
        citiesRes,
        languagesRes,
        pagesEngagedRes,
        firstUserSourceRes,
      ] = await Promise.all([
        // Realtime (últimos 30 minutos)
        runRealtimeReport({
          metrics: [{ name: 'activeUsers' }],
        }).catch(() => ({ rows: [] })),
        runRealtimeReport({
          dimensions: [{ name: 'country' }],
          metrics: [{ name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
          limit: '5',
        }).catch(() => ({ rows: [] })),
        runRealtimeReport({
          dimensions: [{ name: 'deviceCategory' }],
          metrics: [{ name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        }).catch(() => ({ rows: [] })),
        runRealtimeReport({
          dimensions: [{ name: 'unifiedScreenName' }],
          metrics: [{ name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
          limit: '5',
        }).catch(() => ({ rows: [] })),

        // Adquisición por canal · 28d
        runReport({
          dateRanges: [DR28],
          dimensions: [{ name: 'sessionDefaultChannelGroup' }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'engagementRate' },
            { name: 'averageSessionDuration' },
          ],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: '10',
        }),

        // Engagement overview · 28d
        runReport({
          dateRanges: [DR28],
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
            { name: 'engagedSessions' },
            { name: 'engagementRate' },
            { name: 'userEngagementDuration' },
            { name: 'eventCount' },
            { name: 'bounceRate' },
            { name: 'sessionsPerUser' },
            { name: 'screenPageViewsPerSession' },
          ],
        }),

        // Top eventos · 28d
        runReport({
          dateRanges: [DR28],
          dimensions: [{ name: 'eventName' }],
          metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
          orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
          limit: '15',
        }),

        // Top ciudades · 28d
        runReport({
          dateRanges: [DR28],
          dimensions: [{ name: 'city' }, { name: 'country' }],
          metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
          limit: '12',
        }),

        // Idiomas · 28d
        runReport({
          dateRanges: [DR28],
          dimensions: [{ name: 'language' }],
          metrics: [{ name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
          limit: '6',
        }),

        // Páginas con engagement · 28d
        runReport({
          dateRanges: [DR28],
          dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
          metrics: [
            { name: 'screenPageViews' },
            { name: 'userEngagementDuration' },
            { name: 'bounceRate' },
          ],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: '12',
        }),

        // First user source/medium · 28d (cómo llegan los nuevos)
        runReport({
          dateRanges: [DR28],
          dimensions: [
            { name: 'firstUserSource' },
            { name: 'firstUserMedium' },
          ],
          metrics: [{ name: 'newUsers' }],
          orderBys: [{ metric: { metricName: 'newUsers' }, desc: true }],
          limit: '10',
        }),
      ]);

      // ── Realtime ───────────────────────────────────────────────
      const rtTotal = (realtimeUsers.rows ?? []).reduce(
        (acc, r) => acc + num(r.metricValues?.[0]?.value), 0,
      );
      const rtByCountry = rows(realtimeByCountry, (r) => ({
        country: r.dimensionValues?.[0]?.value ?? '(unknown)',
        users: num(r.metricValues?.[0]?.value),
      }));
      const rtByDevice = rows(realtimeByDevice, (r) => ({
        device: r.dimensionValues?.[0]?.value ?? '(unknown)',
        users: num(r.metricValues?.[0]?.value),
      }));
      const rtByPage = rows(realtimeByPage, (r) => ({
        path: r.dimensionValues?.[0]?.value ?? '(unknown)',
        users: num(r.metricValues?.[0]?.value),
      }));

      // ── Adquisición por canal ──────────────────────────────────
      const acquisitionByChannel = rows(acquisitionRes, (r) => ({
        channel: r.dimensionValues?.[0]?.value ?? '(unknown)',
        sessions: num(r.metricValues?.[0]?.value),
        users: num(r.metricValues?.[1]?.value),
        engagementRate: num(r.metricValues?.[2]?.value),
        avgEngagementTimeSec: num(r.metricValues?.[3]?.value),
      }));

      // ── Engagement overview ────────────────────────────────────
      const eRow = engagementRes.rows?.[0];
      const engagement28d = {
        activeUsers: num(eRow?.metricValues?.[0]?.value),
        sessions: num(eRow?.metricValues?.[1]?.value),
        engagedSessions: num(eRow?.metricValues?.[2]?.value),
        engagementRate: num(eRow?.metricValues?.[3]?.value),
        avgEngagementTimePerSessionSec:
          num(eRow?.metricValues?.[4]?.value) /
          Math.max(1, num(eRow?.metricValues?.[1]?.value)),
        eventsPerSession:
          num(eRow?.metricValues?.[5]?.value) /
          Math.max(1, num(eRow?.metricValues?.[1]?.value)),
        bounceRate: num(eRow?.metricValues?.[6]?.value),
        sessionsPerUser: num(eRow?.metricValues?.[7]?.value),
        pageviewsPerSession: num(eRow?.metricValues?.[8]?.value),
      };

      // ── Top eventos ────────────────────────────────────────────
      const topEvents28d = rows(eventsRes, (r) => ({
        eventName: r.dimensionValues?.[0]?.value ?? '(unknown)',
        count: num(r.metricValues?.[0]?.value),
        users: num(r.metricValues?.[1]?.value),
      }));

      // ── Top ciudades ───────────────────────────────────────────
      const topCities28d = rows(citiesRes, (r) => ({
        city: r.dimensionValues?.[0]?.value ?? '(unknown)',
        country: r.dimensionValues?.[1]?.value ?? '(unknown)',
        users: num(r.metricValues?.[0]?.value),
        sessions: num(r.metricValues?.[1]?.value),
      }));

      // ── Idiomas ────────────────────────────────────────────────
      const totalLangUsers = (languagesRes.rows ?? []).reduce(
        (acc, r) => acc + num(r.metricValues?.[0]?.value), 0,
      );
      const topLanguages28d = rows(languagesRes, (r) => {
        const u = num(r.metricValues?.[0]?.value);
        return {
          language: r.dimensionValues?.[0]?.value ?? '(unknown)',
          users: u,
          pct: totalLangUsers > 0 ? (u / totalLangUsers) * 100 : 0,
        };
      });

      // ── Top páginas con engagement ─────────────────────────────
      const topPagesEngaged28d = rows(pagesEngagedRes, (r) => ({
        path: r.dimensionValues?.[0]?.value ?? '',
        title: r.dimensionValues?.[1]?.value ?? '',
        views: num(r.metricValues?.[0]?.value),
        avgEngagementTimeSec:
          num(r.metricValues?.[1]?.value) /
          Math.max(1, num(r.metricValues?.[0]?.value)),
        bounceRate: num(r.metricValues?.[2]?.value),
      }));

      // ── First user source ──────────────────────────────────────
      const firstUserSource28d = rows(firstUserSourceRes, (r) => ({
        source: r.dimensionValues?.[0]?.value ?? '(direct)',
        medium: r.dimensionValues?.[1]?.value ?? '(none)',
        newUsers: num(r.metricValues?.[0]?.value),
      }));

      const payload: GaReportingHubPayload = {
        generatedAt: new Date().toISOString(),
        realtime: {
          activeUsers: rtTotal,
          activeUsersByCountry: rtByCountry,
          activeUsersByDevice: rtByDevice,
          activeUsersByPage: rtByPage,
        },
        acquisitionByChannel,
        engagement28d,
        topEvents28d,
        topCities28d,
        topLanguages28d,
        topPagesEngaged28d,
        firstUserSource28d,
      };

      // Cache 10 min en cliente (realtime queda anclado al snapshot)
      res.set('Cache-Control', 'private, max-age=600');
      res.status(200).json(payload);
    } catch (e) {
      const err = e as Error & { response?: { status?: number; data?: unknown } };
      logger.error('getGaReportingHub.error', {
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
