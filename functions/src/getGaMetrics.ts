import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { GoogleAuth } from 'google-auth-library';
import { logger } from 'firebase-functions/v2';

const GA4_PROPERTY_ID = '525246514';
const GA4_DATA_API_BASE = 'https://analyticsdata.googleapis.com/v1beta';

// Estricto: la Cloud Function solo responde a la cuenta personal del autor.
// Aunque alguien consiga un custom claim 'admin' en el futuro, NO podrá
// leer estas métricas salvo que su email esté en esta lista.
const DASHBOARD_VIEWERS = [
  'carlosgalera2roman@gmail.com',
];

type ReportRow = { dimensionValues: { value: string }[]; metricValues: { value: string }[] };
type ReportResponse = { rows?: ReportRow[] };

type HostMetric = {
  hostname: string;
  users: number;
  sessions: number;
  views: number;
};

type DailyPoint = { date: string; users: number; sessions: number };

type GaMetricsPayload = {
  propertyId: string;
  generatedAt: string;
  appliedFilter: 'all' | 'area2' | 'github';
  ranges: {
    today: { users: number; sessions: number; views: number };
    last7d: { users: number; sessions: number; views: number };
    last28d: { users: number; sessions: number; views: number };
  };
  byHostname28d: HostMetric[];
  daily7d: DailyPoint[];
  topPages28d: { path: string; title: string; views: number }[];
  topSources28d: { source: string; medium: string; sessions: number }[];
};

let authClient: GoogleAuth | null = null;
function getAuth(): GoogleAuth {
  if (!authClient) {
    authClient = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });
  }
  return authClient;
}

async function runReport(body: Record<string, unknown>): Promise<ReportResponse> {
  const client = await getAuth().getClient();
  const url = `${GA4_DATA_API_BASE}/properties/${GA4_PROPERTY_ID}:runReport`;
  const res = await client.request<ReportResponse>({
    url,
    method: 'POST',
    data: body,
  });
  return res.data ?? {};
}

type HostnameFilter = 'all' | 'area2' | 'github';
const HOSTNAME_SUBSTR: Record<HostnameFilter, string | null> = {
  all: null,
  area2: 'area2cartagena.es',
  github: 'github.io',
};

function buildHostFilter(filter: HostnameFilter): Record<string, unknown> | undefined {
  const sub = HOSTNAME_SUBSTR[filter];
  if (!sub) return undefined;
  return {
    filter: {
      fieldName: 'hostName',
      stringFilter: { matchType: 'CONTAINS', value: sub, caseSensitive: false },
    },
  };
}

function sumMetric(res: ReportResponse, metricIndex: number): number {
  if (!res.rows) return 0;
  return res.rows.reduce((acc, r) => acc + Number(r.metricValues?.[metricIndex]?.value ?? 0), 0);
}

function mapRows<T>(
  res: ReportResponse,
  fn: (row: ReportRow) => T,
  limit: number = Number.MAX_SAFE_INTEGER,
): T[] {
  if (!res.rows) return [];
  return res.rows.slice(0, limit).map(fn);
}

/**
 * Returns traffic metrics from GA4 property `docenciacartagenaeste` (525246514)
 * for the admin dashboard. The service account running this function must have
 * "Viewer" role on the GA4 property.
 */
export const getGaMetrics = onCall(
  {
    region: 'europe-west1',
    memory: '256MiB',
    timeoutSeconds: 30,
    cors: [
      'https://area2cartagena.es',
      'https://carlosgalera-a11y.github.io',
      'http://localhost:5000',
    ],
  },
  async (request): Promise<GaMetricsPayload> => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');

    const callerEmail = (request.auth.token.email ?? '').toLowerCase();
    if (!DASHBOARD_VIEWERS.includes(callerEmail)) {
      logger.warn('getGaMetrics.denied', { callerEmail });
      throw new HttpsError('permission-denied', 'Dashboard restringido a la cuenta personal del autor.');
    }

    const rawFilter = String((request.data as { hostname?: string } | undefined)?.hostname ?? 'all');
    const hostnameFilter: HostnameFilter =
      rawFilter === 'area2' || rawFilter === 'github' ? rawFilter : 'all';
    const hostFilter = buildHostFilter(hostnameFilter);

    try {
      const [rangeReport, hostReport, dailyReport, pagesReport, sourcesReport] = await Promise.all([
        runReport({
          dateRanges: [
            { startDate: 'today', endDate: 'today', name: 'today' },
            { startDate: '7daysAgo', endDate: 'today', name: 'last7d' },
            { startDate: '28daysAgo', endDate: 'today', name: 'last28d' },
          ],
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
          ],
          ...(hostFilter ? { dimensionFilter: hostFilter } : {}),
        }),
        // byHostname28d ignora el filtro para dar siempre el breakdown completo.
        runReport({
          dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'hostName' }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
          ],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
          limit: '10',
        }),
        runReport({
          dateRanges: [{ startDate: '6daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'date' }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
          ],
          orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
          ...(hostFilter ? { dimensionFilter: hostFilter } : {}),
        }),
        runReport({
          dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
          dimensions: [
            { name: 'pagePath' },
            { name: 'pageTitle' },
          ],
          metrics: [{ name: 'screenPageViews' }],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: '8',
          ...(hostFilter ? { dimensionFilter: hostFilter } : {}),
        }),
        runReport({
          dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
          dimensions: [
            { name: 'sessionSource' },
            { name: 'sessionMedium' },
          ],
          metrics: [{ name: 'sessions' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: '8',
          ...(hostFilter ? { dimensionFilter: hostFilter } : {}),
        }),
      ]);

      const ranges = {
        today: { users: 0, sessions: 0, views: 0 },
        last7d: { users: 0, sessions: 0, views: 0 },
        last28d: { users: 0, sessions: 0, views: 0 },
      };
      rangeReport.rows?.forEach((row, idx) => {
        const bucket = idx === 0 ? ranges.today : idx === 1 ? ranges.last7d : ranges.last28d;
        bucket.users = Number(row.metricValues?.[0]?.value ?? 0);
        bucket.sessions = Number(row.metricValues?.[1]?.value ?? 0);
        bucket.views = Number(row.metricValues?.[2]?.value ?? 0);
      });
      // Fallback: si la API devuelve una única fila con date-range, usar totales planos
      if (!rangeReport.rows || rangeReport.rows.length < 3) {
        ranges.last28d.users = sumMetric(rangeReport, 0);
        ranges.last28d.sessions = sumMetric(rangeReport, 1);
        ranges.last28d.views = sumMetric(rangeReport, 2);
      }

      const byHostname28d: HostMetric[] = mapRows(hostReport, (row) => ({
        hostname: row.dimensionValues?.[0]?.value ?? '(unknown)',
        users: Number(row.metricValues?.[0]?.value ?? 0),
        sessions: Number(row.metricValues?.[1]?.value ?? 0),
        views: Number(row.metricValues?.[2]?.value ?? 0),
      }));

      const daily7d: DailyPoint[] = mapRows(dailyReport, (row) => {
        const raw = row.dimensionValues?.[0]?.value ?? '';
        const date = raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : raw;
        return {
          date,
          users: Number(row.metricValues?.[0]?.value ?? 0),
          sessions: Number(row.metricValues?.[1]?.value ?? 0),
        };
      });

      const topPages28d = mapRows(pagesReport, (row) => ({
        path: row.dimensionValues?.[0]?.value ?? '',
        title: row.dimensionValues?.[1]?.value ?? '',
        views: Number(row.metricValues?.[0]?.value ?? 0),
      }));

      const topSources28d = mapRows(sourcesReport, (row) => ({
        source: row.dimensionValues?.[0]?.value ?? '(direct)',
        medium: row.dimensionValues?.[1]?.value ?? '(none)',
        sessions: Number(row.metricValues?.[0]?.value ?? 0),
      }));

      return {
        propertyId: GA4_PROPERTY_ID,
        generatedAt: new Date().toISOString(),
        appliedFilter: hostnameFilter,
        ranges,
        byHostname28d,
        daily7d,
        topPages28d,
        topSources28d,
      };
    } catch (e) {
      const err = e as Error & { response?: { data?: unknown; status?: number } };
      logger.error('getGaMetrics.error', {
        message: err.message,
        status: err.response?.status,
        body: err.response?.data,
      });
      if (err.response?.status === 403) {
        throw new HttpsError(
          'permission-denied',
          'La service account de Cloud Functions no tiene acceso al property GA4 525246514. Añadirla como Lector en GA4.',
        );
      }
      throw new HttpsError('internal', `ga4_data_api_error: ${err.message}`);
    }
  },
);
