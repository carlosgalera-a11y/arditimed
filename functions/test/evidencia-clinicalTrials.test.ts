import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchClinicalTrials } from '../src/evidencia/clinicalTrials';

const sampleStudy = {
  protocolSection: {
    identificationModule: { nctId: 'NCT01234567', briefTitle: 'Apixaban vs warfarin in NVAF' },
    statusModule: {
      overallStatus: 'COMPLETED',
      startDateStruct: { date: '2018-03-01' },
      completionDateStruct: { date: '2023-09-30' },
    },
    designModule: {
      phases: ['PHASE3'],
      studyType: 'INTERVENTIONAL',
      enrollmentInfo: { count: 1820 },
    },
    sponsorCollaboratorsModule: { leadSponsor: { name: 'AcmePharma' } },
    conditionsModule: { conditions: ['Atrial Fibrillation'] },
    armsInterventionsModule: { interventions: [{ name: 'Apixaban' }, { name: 'Warfarin' }] },
    outcomesModule: { primaryOutcomes: [{ measure: 'Stroke incidence at 24 months' }] },
    contactsLocationsModule: {
      locations: [{ country: 'Spain' }, { country: 'France' }, { country: 'Spain' }],
    },
  },
};

afterEach(() => vi.restoreAllMocks());

describe('clinicalTrials.searchClinicalTrials', () => {
  it('mapea correctamente un estudio típico', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ studies: [sampleStudy] }), { status: 200 }),
    );
    const out = await searchClinicalTrials('apixaban warfarin atrial fibrillation');
    expect(out).toHaveLength(1);
    const s = out[0];
    expect(s).toBeDefined();
    if (!s) return;
    expect(s.nctId).toBe('NCT01234567');
    expect(s.title).toMatch(/Apixaban/);
    expect(s.status).toBe('COMPLETED');
    expect(s.phase).toBe('PHASE3');
    expect(s.startYear).toBe(2018);
    expect(s.completionYear).toBe(2023);
    expect(s.enrollment).toBe(1820);
    expect(s.interventions).toEqual(['Apixaban', 'Warfarin']);
    expect(s.countries).toEqual(['Spain', 'France']); // dedup
    expect(s.url).toBe('https://clinicaltrials.gov/study/NCT01234567');
  });

  it('filtra por dateFrom', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ studies: [sampleStudy] }), { status: 200 }),
    );
    const out = await searchClinicalTrials('q', { dateFrom: 2020 });
    expect(out).toHaveLength(0); // startYear=2018 queda fuera
  });

  it('filtra por país UE/ES (incluye estudios sin location)', async () => {
    const usaStudy = {
      ...sampleStudy,
      protocolSection: {
        ...sampleStudy.protocolSection,
        identificationModule: { nctId: 'NCT99', briefTitle: 'USA only' },
        contactsLocationsModule: { locations: [{ country: 'United States' }] },
      },
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ studies: [sampleStudy, usaStudy] }), { status: 200 }),
    );
    const out = await searchClinicalTrials('q', { onlyEUorSpain: true });
    expect(out).toHaveLength(1);
    expect(out[0]?.nctId).toBe('NCT01234567');
  });

  it('descarta estudios sin nctId', async () => {
    const broken = { protocolSection: { identificationModule: {} } };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ studies: [broken, sampleStudy] }), { status: 200 }),
    );
    const out = await searchClinicalTrials('q');
    expect(out).toHaveLength(1);
  });

  it('lanza Error si HTTP no-ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('boom', { status: 503 }));
    await expect(searchClinicalTrials('q')).rejects.toThrow(/clinicaltrials.gov HTTP 503/);
  });
});
