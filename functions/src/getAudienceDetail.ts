import { onRequest } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getApp } from 'firebase-admin/app';
import { GoogleAuth } from 'google-auth-library';
import { logger } from 'firebase-functions/v2';

const GA4_PROPERTY_ID = '525246514';
const GA4_DATA_API_BASE = 'https://analyticsdata.googleapis.com/v1beta';

const DASHBOARD_VIEWERS = ['carlosgalera2roman@gmail.com'];

type ReportRow = { dimensionValues: { value: string }[]; metricValues: { value: string }[] };
type ReportResponse = { rows?: ReportRow[] };

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

function toRows<T>(res: ReportResponse, fn: (row: ReportRow) => T, limit = 10): T[] {
  if (!res.rows) return [];
  return res.rows.slice(0, limit).map(fn);
}

function addPct<T extends { users: number }>(rows: T[], total: number): (T & { pct: number })[] {
  return rows.map((r) => ({ ...r, pct: total > 0 ? (r.users / total) * 100 : 0 }));
}

export type AudienceDetailPayload = {
  generatedAt: string;
  totalUsers28d: number;
  devices: { device: string; users: number; pct: number }[];
  countries: { country: string; users: number; pct: number }[];
  newReturning: { type: string; users: number; pct: number }[];
  browsers: { browser: string; users: number; pct: number }[];
  operatingSystems: { os: string; users: number; pct: number }[];
};

/**
 * getAudienceDetail — dimensiones de audiencia GA4 para el admin dashboard.
 * Autenticado con Firebase ID token (solo el propietario).
 * Cache 1h en el cliente (este endpoint es costoso en cuota GA4 Data API).
 */
export const getAudienceDetail = onRequest(
  {
    region: 'europe-west1',
    memory: '256MiB',
    timeoutSeconds: 30,
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
      const DATE_RANGE = { startDate: '28daysAgo', endDate: 'today' };
      const METRICS_USERS = [{ name: 'activeUsers' }];
      const ORDER_DESC = (metric: string) => [{ metric: { metricName: metric }, desc: true }];

      const [devicesRes, countriesRes, newRetRes, browsersRes, osRes, totalRes] = await Promise.all([
        runReport({
          dateRanges: [DATE_RANGE],
          dimensions: [{ name: 'deviceCategory' }],
          metrics: METRICS_USERS,
          orderBys: ORDER_DESC('activeUsers'),
        }),
        runReport({
          dateRanges: [DATE_RANGE],
          dimensions: [{ name: 'country' }],
          metrics: METRICS_USERS,
          orderBys: ORDER_DESC('activeUsers'),
          limit: '10',
        }),
        runReport({
          dateRanges: [DATE_RANGE],
          dimensions: [{ name: 'newVsReturning' }],
          metrics: METRICS_USERS,
          orderBys: ORDER_DESC('activeUsers'),
        }),
        runReport({
          dateRanges: [DATE_RANGE],
          dimensions: [{ name: 'browser' }],
          metrics: METRICS_USERS,
          orderBys: ORDER_DESC('activeUsers'),
          limit: '8',
        }),
        runReport({
          dateRanges: [DATE_RANGE],
          dimensions: [{ name: 'operatingSystem' }],
          metrics: METRICS_USERS,
          orderBys: ORDER_DESC('activeUsers'),
          limit: '8',
        }),
        runReport({
          dateRanges: [DATE_RANGE],
          dimensions: [{ name: 'date' }],
          metrics: METRICS_USERS,
        }),
      ]);

      const totalUsers28d = (totalRes.rows ?? []).reduce(
        (acc, r) => acc + Number(r.metricValues?.[0]?.value ?? 0),
        0,
      );

      const devices = addPct(
        toRows(devicesRes, (r) => ({
          device: r.dimensionValues?.[0]?.value ?? '(unknown)',
          users: Number(r.metricValues?.[0]?.value ?? 0),
        })),
        totalUsers28d,
      );

      const countries = addPct(
        toRows(countriesRes, (r) => ({
          country: r.dimensionValues?.[0]?.value ?? '(unknown)',
          users: Number(r.metricValues?.[0]?.value ?? 0),
        }), 10),
        totalUsers28d,
      );

      const newReturning = addPct(
        toRows(newRetRes, (r) => ({
          type: r.dimensionValues?.[0]?.value ?? '(unknown)',
          users: Number(r.metricValues?.[0]?.value ?? 0),
        })),
        totalUsers28d,
      );

      const browsers = addPct(
        toRows(browsersRes, (r) => ({
          browser: r.dimensionValues?.[0]?.value ?? '(unknown)',
          users: Number(r.metricValues?.[0]?.value ?? 0),
        }), 8),
        totalUsers28d,
      );

      const operatingSystems = addPct(
        toRows(osRes, (r) => ({
          os: r.dimensionValues?.[0]?.value ?? '(unknown)',
          users: Number(r.metricValues?.[0]?.value ?? 0),
        }), 8),
        totalUsers28d,
      );

      const payload: AudienceDetailPayload = {
        generatedAt: new Date().toISOString(),
        totalUsers28d,
        devices,
        countries,
        newReturning,
        browsers,
        operatingSystems,
      };

      // Cache 1 hora — las dimensiones de audiencia no cambian al instante
      res.set('Cache-Control', 'private, max-age=3600');
      res.status(200).json(payload);
    } catch (e) {
      const err = e as Error & { response?: { status?: number } };
      logger.error('getAudienceDetail.error', {
        message: err.message,
        status: err.response?.status,
      });
      if (err.response?.status === 403) {
        res.status(403).json({
          error: 'ga4_permission_denied',
          hint: 'La service account no tiene rol Viewer en el property GA4 525246514.',
        });
        return;
      }
      res.status(500).json({ error: 'ga4_error', message: err.message });
    }
  },
);
