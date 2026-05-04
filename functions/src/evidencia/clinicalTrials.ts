// ══════════════════════════════════════════════════════════════════════
// EvidenciaIA · cliente ClinicalTrials.gov v2 API
// ══════════════════════════════════════════════════════════════════════
// API REST pública oficial del NIH (sin auth, sin contrato). Devuelve
// ensayos clínicos registrados con su estado (Recruiting, Completed, …),
// fases, intervención, condición, sponsor y outcomes primarios.
// Docs: https://clinicaltrials.gov/api/v2/studies
//
// Usado para enriquecer la respuesta de EvidenciaIA con "ensayos clínicos
// activos / recientes" — paridad funcional con el bloque de trials que
// ofrece OpenEvidence. Marcamos cada ensayo con su NCT id para que el
// clínico pueda abrir la ficha original (verificación obligatoria art. 50).
// ══════════════════════════════════════════════════════════════════════

const BASE = 'https://clinicaltrials.gov/api/v2/studies';

export interface ClinicalTrial {
  nctId: string;
  title: string;
  status: string;            // Recruiting, Completed, Active, not recruiting, …
  phase: string | null;      // Phase 1/2/3/4 si aplica
  conditions: string[];
  interventions: string[];
  sponsor: string | null;
  startYear: number | null;
  completionYear: number | null;
  enrollment: number | null; // n previsto/actual
  primaryOutcome: string | null;
  studyType: string | null;  // Interventional / Observational
  countries: string[];
  url: string;               // https://clinicaltrials.gov/study/{NCT...}
  source: 'clinicaltrials';
}

export interface SearchOpts {
  pageSize?: number;
  dateFrom?: number;        // año desde
  onlyActive?: boolean;     // recruiting / active not recruiting
  onlyEUorSpain?: boolean;  // filtra por país (UE/ES) — útil para sesgo EU
  timeoutMs?: number;
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
  } finally {
    clearTimeout(t);
  }
}

function buildUrl(query: string, opts: SearchOpts): string {
  const params = new URLSearchParams();
  // query.term acepta sintaxis de búsqueda libre — usamos el mismo texto
  // limpio que mandamos a PubMed.
  params.set('query.term', query);
  params.set('pageSize', String(Math.min(50, Math.max(1, opts.pageSize ?? 8))));
  params.set('format', 'json');
  // Campos que necesitamos (reduce payload).
  params.set(
    'fields',
    [
      'NCTId',
      'BriefTitle',
      'OverallStatus',
      'Phase',
      'Condition',
      'InterventionName',
      'LeadSponsorName',
      'StartDate',
      'CompletionDate',
      'EnrollmentCount',
      'PrimaryOutcomeMeasure',
      'StudyType',
      'LocationCountry',
    ].join('|'),
  );
  if (opts.onlyActive) {
    params.set('filter.overallStatus', 'RECRUITING|ACTIVE_NOT_RECRUITING|ENROLLING_BY_INVITATION');
  }
  // Sesgo UE: ClinicalTrials.gov v2 expone filter.geo, pero no acepta listado
  // múltiple cómodo. Se aplica a posteriori en filtrado JS.
  return `${BASE}?${params.toString()}`;
}

interface CtV2Study {
  protocolSection?: {
    identificationModule?: { nctId?: string; briefTitle?: string };
    statusModule?: {
      overallStatus?: string;
      startDateStruct?: { date?: string };
      completionDateStruct?: { date?: string };
    };
    designModule?: {
      phases?: string[];
      studyType?: string;
      enrollmentInfo?: { count?: number };
    };
    sponsorCollaboratorsModule?: { leadSponsor?: { name?: string } };
    conditionsModule?: { conditions?: string[] };
    armsInterventionsModule?: { interventions?: Array<{ name?: string }> };
    outcomesModule?: { primaryOutcomes?: Array<{ measure?: string }> };
    contactsLocationsModule?: { locations?: Array<{ country?: string }> };
  };
}

const EU_OR_ES = new Set([
  'Spain', 'France', 'Germany', 'Italy', 'Portugal', 'Netherlands', 'Belgium',
  'Austria', 'Ireland', 'Denmark', 'Sweden', 'Finland', 'Greece', 'Poland',
  'Czechia', 'Czech Republic', 'Hungary', 'Romania', 'Slovakia', 'Slovenia',
  'Bulgaria', 'Croatia', 'Estonia', 'Latvia', 'Lithuania', 'Luxembourg',
  'Malta', 'Cyprus',
]);

function yearOf(s: string | undefined): number | null {
  if (!s) return null;
  const m = /(\d{4})/.exec(s);
  return m ? parseInt(m[1] ?? '0', 10) || null : null;
}

function mapStudy(st: CtV2Study): ClinicalTrial | null {
  const ps = st.protocolSection ?? {};
  const nctId = ps.identificationModule?.nctId ?? '';
  if (!nctId) return null;
  const title = ps.identificationModule?.briefTitle ?? '(sin título)';
  const status = ps.statusModule?.overallStatus ?? 'UNKNOWN';
  const phaseArr = ps.designModule?.phases ?? [];
  const phase = phaseArr.length ? phaseArr.join(' / ') : null;
  const conditions = ps.conditionsModule?.conditions ?? [];
  const interventions = (ps.armsInterventionsModule?.interventions ?? [])
    .map((i) => i.name)
    .filter((x): x is string => typeof x === 'string');
  const sponsor = ps.sponsorCollaboratorsModule?.leadSponsor?.name ?? null;
  const startYear = yearOf(ps.statusModule?.startDateStruct?.date);
  const completionYear = yearOf(ps.statusModule?.completionDateStruct?.date);
  const enrollment = ps.designModule?.enrollmentInfo?.count ?? null;
  const primaryOutcome = ps.outcomesModule?.primaryOutcomes?.[0]?.measure ?? null;
  const studyType = ps.designModule?.studyType ?? null;
  const countries = (ps.contactsLocationsModule?.locations ?? [])
    .map((l) => l.country)
    .filter((x): x is string => typeof x === 'string');
  // Dedup países conservando orden.
  const seen = new Set<string>();
  const countriesUniq: string[] = [];
  for (const c of countries) {
    if (!seen.has(c)) { seen.add(c); countriesUniq.push(c); }
  }
  return {
    nctId,
    title,
    status,
    phase,
    conditions,
    interventions,
    sponsor,
    startYear,
    completionYear,
    enrollment,
    primaryOutcome,
    studyType,
    countries: countriesUniq,
    url: `https://clinicaltrials.gov/study/${nctId}`,
    source: 'clinicaltrials',
  };
}

export async function searchClinicalTrials(
  query: string,
  opts: SearchOpts = {},
): Promise<ClinicalTrial[]> {
  const timeoutMs = opts.timeoutMs ?? 8000;
  const url = buildUrl(query, opts);
  const r = await fetchWithTimeout(url, timeoutMs);
  if (!r.ok) throw new Error(`clinicaltrials.gov HTTP ${r.status}`);
  const j = (await r.json()) as { studies?: CtV2Study[] };
  let trials = (j.studies ?? [])
    .map(mapStudy)
    .filter((x): x is ClinicalTrial => x !== null);
  if (opts.dateFrom) {
    trials = trials.filter((t) => !t.startYear || t.startYear >= (opts.dateFrom ?? 0));
  }
  if (opts.onlyEUorSpain) {
    trials = trials.filter((t) =>
      t.countries.length === 0 || t.countries.some((c) => EU_OR_ES.has(c)),
    );
  }
  return trials;
}
