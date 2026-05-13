// ══════════════════════════════════════════════════════════════════════
// EvidenciaIA · Cloud Function `evidenciaSearch` (PR-1: solo búsqueda)
// ══════════════════════════════════════════════════════════════════════
// Pipeline de PR-1 (sin síntesis IA todavía — eso entra en PR-2):
//   1. Validar pregunta (safeguards art. 50, PII, longitud).
//   2. Buscar en paralelo PubMed + Europe PMC (+ AEMPS si se pide).
//   3. Re-rankear con sesgo europeo y devolver top N.
//   4. Loggear en /evidencia_consultas con todos los metadatos.
//
// El RAG synthesizer + citation verifier se añaden en PR-2 reusando los
// proveedores IA existentes vía la chain de askAi (no se duplica).
// ══════════════════════════════════════════════════════════════════════

import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getApp } from 'firebase-admin/app';
import { logger } from 'firebase-functions/v2';

import { validarPregunta } from './safeguards';
import { searchPubmed, type PubmedAbstract } from './pubmed';
import { searchEuropePMC, type EpmcAbstract } from './europepmc';
import { searchOpenAlex, type OpenAlexAbstract } from './openalex';
import { searchAemps, type AempsMedicamento } from './aemps';
import { searchClinicalTrials, type ClinicalTrial } from './clinicalTrials';
import { resolveManyDois } from './unpaywall';
import { searchCore, type CoreWork } from './core';
import { searchSemanticScholar, enrichTldrs, type S2Paper } from './semanticScholar';
import { enrichCrossref, type CrossrefMeta } from './crossref';
import { currentPromptVersions } from './promptRegistry';
import { detectDrugQuery } from './drugDetection';
import { rerank, gradeEvidence, type ScoredAbstract, type EvidenceGradeResult } from './reranker';
import { extractPico, type PicoExtraction } from './picoExtractor';
import { synthesize, type SynthOutput } from './ragSynthesizer';
import { hashEviKey, getEviCached, setEviCached, bumpEviCacheHit } from './cache';

// Secreto OPCIONAL: si existe, sube el rate limit de PubMed de 3 a 10 req/s.
// Si no existe, las funciones siguen funcionando sin ella.
const NCBI_API_KEY = defineSecret('NCBI_API_KEY');
// Secretos IA — reusados de askAi para extracción PICO + síntesis RAG.
const DEEPSEEK_API_KEY = defineSecret('DEEPSEEK_API_KEY');
const OPENROUTER_API_KEY = defineSecret('OPENROUTER_API_KEY');
// Secretos OPCIONALES de fuentes externas. Si no existen el provider
// correspondiente queda desactivado silenciosamente.
const CORE_API_KEY = defineSecret('CORE_API_KEY');           // CORE OA aggregator
const S2_API_KEY = defineSecret('S2_API_KEY');               // Semantic Scholar (sin clave: rate compartido)

const REGION = 'europe-west1';
const CORS = [
  'https://area2cartagena.es',
  'https://carlosgalera-a11y.github.io',
  'http://localhost:5000',
];

// Lista cerrada de especialidades reconocidas. Mantenerla cerrada evita
// que un usuario malicioso meta texto arbitrario en el system prompt
// (anti prompt-injection): cualquier valor fuera de esta lista se descarta
// silenciosamente y se trata como "general".
const ESPECIALIDADES_VALIDAS = new Set<string>([
  'general',
  'mfyc',           // Medicina Familiar y Comunitaria
  'urgencias',
  'medicina_interna',
  'cardiologia',
  'neumologia',
  'digestivo',
  'neurologia',
  'endocrinologia',
  'nefrologia',
  'infecciosas',
  'oncologia',
  'hematologia',
  'reumatologia',
  'psiquiatria',
  'pediatria',
  'ginecologia',
  'traumatologia',
  'enfermeria',
]);

const ESPECIALIDAD_LABELS: Record<string, string> = {
  general: 'profesional sanitario general',
  mfyc: 'médico de Atención Primaria (MFyC)',
  urgencias: 'médico de urgencias hospitalarias',
  medicina_interna: 'internista',
  cardiologia: 'cardiólogo/a',
  neumologia: 'neumólogo/a',
  digestivo: 'especialista en aparato digestivo',
  neurologia: 'neurólogo/a',
  endocrinologia: 'endocrinólogo/a',
  nefrologia: 'nefrólogo/a',
  infecciosas: 'especialista en enfermedades infecciosas',
  oncologia: 'oncólogo/a',
  hematologia: 'hematólogo/a',
  reumatologia: 'reumatólogo/a',
  psiquiatria: 'psiquiatra',
  pediatria: 'pediatra',
  ginecologia: 'ginecólogo/a',
  traumatologia: 'traumatólogo/a',
  enfermeria: 'enfermero/a',
};

interface SearchRequest {
  pregunta: string;
  /** Especialidad del usuario, valor cerrado de ESPECIALIDADES_VALIDAS. */
  especialidad?: string;
  /**
   * Si está presente y pertenece al usuario, la consulta forma parte de
   * un hilo conversacional. Las 2 búsquedas previas del hilo se añaden
   * como contexto blando al user prompt (sin inflar excesivamente).
   * Si no está, se genera un threadId nuevo automáticamente.
   */
  threadId?: string;
  filtros?: {
    anios?: number;          // años hacia atrás (5, 10, 20)
    soloRevisiones?: boolean;
    incluirAemps?: boolean;
    priorizarGuiasEU?: boolean;
    incluirEnsayos?: boolean;       // añade ClinicalTrials.gov
    soloEnsayosActivos?: boolean;   // recruiting / active not recruiting
    soloEnsayosUE?: boolean;        // sesgo UE en trials
    priorizarCochrane?: boolean;    // segunda búsqueda PubMed restringida a Cochrane Database Syst Rev
    enriquecerOA?: boolean;         // resolver DOIs vía Unpaywall (full-text OA)
    incluirCore?: boolean;          // añade CORE como fuente OA (requiere CORE_API_KEY)
    incluirS2?: boolean;            // añade Semantic Scholar como fuente
    enriquecerTLDR?: boolean;       // batch TLDR de S2 sobre el top reranqueado
    enriquecerCrossref?: boolean;   // licencia + tipo desde Crossref para top reranqueado
    incluirPreprints?: boolean;     // segunda búsqueda Europe PMC con SRC:PPR (medRxiv/bioRxiv)
  };
  // Si true, ejecuta extracción PICO + síntesis RAG con citas verificadas.
  // Si false, devuelve solo los abstracts re-rankeados (modo PR-1).
  sintetizar?: boolean;
  ai_act_disclaimer_shown?: boolean;
}

interface SearchResponse {
  ok: boolean;
  consultaId: string;
  pregunta: string;
  fuentes: ScoredAbstract[];
  aemps: AempsMedicamento[];
  ensayos: ClinicalTrial[];
  crossref_meta: Record<string, CrossrefMeta>; // por DOI lowercase
  pico: PicoExtraction | null;
  sintesis: SynthOutput | null;
  evidence_grade: EvidenceGradeResult;
  prompt_version_pico: string;
  prompt_version_synth: string;
  threadId: string;
  threadTurnIndex: number;
  cached: boolean;
  meta: {
    pubmed_count: number;
    europepmc_count: number;
    openalex_count: number;
    aemps_count: number;
    cochrane_count: number;
    ensayos_count: number;
    oa_enrichments: number;
    core_count: number;
    s2_count: number;
    preprints_count: number;
    tldr_enrichments: number;
    crossref_enrichments: number;
    duracion_ms: number;
    errors: Record<string, string>;
  };
}

export const evidenciaSearch = onCall(
  {
    region: REGION,
    secrets: [NCBI_API_KEY, DEEPSEEK_API_KEY, OPENROUTER_API_KEY, CORE_API_KEY, S2_API_KEY],
    enforceAppCheck: false, // se flipa cuando reCAPTCHA esté en producción
    memory: '512MiB',
    timeoutSeconds: 90,
    cors: CORS,
  },
  async (request): Promise<SearchResponse> => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
    const uid = request.auth.uid;
    const start = Date.now();

    const data = (request.data ?? {}) as Partial<SearchRequest>;

    // Especialidad: la validamos contra la lista cerrada server-side
    // (anti prompt-injection). Cualquier valor desconocido se reduce a
    // 'general'. La etiqueta legible se construye de ESPECIALIDAD_LABELS
    // y SOLO esa etiqueta se inyecta en el prompt — nunca el texto crudo
    // recibido del cliente.
    const especialidadKey = (typeof data.especialidad === 'string' && ESPECIALIDADES_VALIDAS.has(data.especialidad))
      ? data.especialidad
      : 'general';
    const especialidadLabel = ESPECIALIDAD_LABELS[especialidadKey] ?? ESPECIALIDAD_LABELS['general'];

    // Thread handling. Si el cliente envía un threadId, validamos formato
    // (24-48 hex chars) y propiedad antes de usarlo. Si no, generamos uno
    // nuevo. El threadId NO incluye PII y es opaco — pensado solo para
    // agrupar turnos conversacionales del mismo uid.
    let threadId: string = '';
    if (typeof data.threadId === 'string' && /^[0-9a-f]{24,48}$/i.test(data.threadId.trim())) {
      threadId = data.threadId.trim();
    } else {
      // SHA-1-like 32-char hex random.
      threadId = (Math.random().toString(16).slice(2, 18) + Math.random().toString(16).slice(2, 18)).padEnd(32, '0').slice(0, 32);
    }

    if (data.ai_act_disclaimer_shown !== true) {
      throw new HttpsError(
        'failed-precondition',
        'EvidenciaIA requiere aceptar el aviso de transparencia del EU AI Act (art. 50) antes de buscar.',
      );
    }

    const v = validarPregunta(typeof data.pregunta === 'string' ? data.pregunta : '');
    if (!v.ok) {
      // Loguear el rechazo (también es trazable en auditLogs vía trigger).
      const db = getFirestore(getApp());
      const refRej = db.collection('evidencia_consultas').doc();
      await refRej.set({
        uid,
        pregunta_original: typeof data.pregunta === 'string' ? data.pregunta.slice(0, 500) : '',
        rechazada: true,
        motivo_rechazo: v.motivo,
        ai_act_disclaimer_shown: true,
        // Evidencia procedimental de la Estrategia 3 (vínculo IA→paciente
        // roto). El rechazo prueba que el sistema NO procesó datos
        // individualizados — refuerza la posición de "no SaMD" bajo MDR.
        // Ver docs/aiact/12-mdr-classification-rationale.md.
        patient_link_broken: true,
        timestamp: FieldValue.serverTimestamp(),
      });
      throw new HttpsError('invalid-argument', v.mensaje);
    }

    const filtros = data.filtros ?? {};
    const anios = Math.max(1, Math.min(50, Number(filtros.anios ?? 10)));
    const dateFrom = new Date().getFullYear() - anios;

    // ─── Cache lookup (24h TTL, hash de pregunta normalizada) ──────────
    const db = getFirestore(getApp());
    const cacheKey = hashEviKey({
      pregunta: v.sanitized,
      sintetizar: data.sintetizar === true,
      anios,
      soloRevisiones: !!filtros.soloRevisiones,
      incluirAemps: !!filtros.incluirAemps,
      incluirEnsayos: !!filtros.incluirEnsayos,
      soloEnsayosActivos: !!filtros.soloEnsayosActivos,
      soloEnsayosUE: !!filtros.soloEnsayosUE,
      priorizarCochrane: !!filtros.priorizarCochrane,
      enriquecerOA: !!filtros.enriquecerOA,
      incluirCore: !!filtros.incluirCore,
      incluirS2: !!filtros.incluirS2,
      enriquecerTLDR: !!filtros.enriquecerTLDR,
      enriquecerCrossref: !!filtros.enriquecerCrossref,
      incluirPreprints: !!filtros.incluirPreprints,
    });
    const cached = await getEviCached(db, cacheKey).catch(() => null);
    if (cached) {
      const cachedGrade = gradeEvidence(cached.fuentes);
      // Log mínimo de cache hit para auditoría AI Act art. 12.
      const refHit = db.collection('evidencia_consultas').doc();
      try {
        await refHit.set({
          uid,
          pregunta_original: v.sanitized,
          rechazada: false,
          fuentes_consultadas: ['cache'],
          num_abstracts_recuperados: cached.fuentes.length,
          abstracts_pmids: cached.fuentes
            .map((s) => (s.ref as { pmid?: string }).pmid ?? null)
            .filter(Boolean),
          filtros_aplicados: filtros,
          sintetizar: data.sintetizar === true,
          ai_act_disclaimer_shown: true,
          patient_link_broken: true,
          cache_hit: true,
          cache_key: cacheKey,
          duracion_ms: Date.now() - start,
          timestamp: FieldValue.serverTimestamp(),
        });
      } catch {
        /* best-effort */
      }
      bumpEviCacheHit(db, cacheKey).catch(() => {
        /* best-effort */
      });
      logger.info('evidenciaSearch.cacheHit', { uid, hash: cacheKey });
      return {
        ok: true,
        consultaId: refHit.id,
        pregunta: v.sanitized,
        fuentes: cached.fuentes,
        aemps: cached.aemps,
        ensayos: cached.ensayos ?? [],
        crossref_meta: {},
        pico: cached.pico,
        sintesis: cached.sintesis,
        evidence_grade: cachedGrade,
        prompt_version_pico: currentPromptVersions().pico,
        prompt_version_synth: currentPromptVersions().synth,
        threadId,
        threadTurnIndex: 0,
        cached: true,
        meta: {
          pubmed_count: cached.meta.pubmed_count,
          europepmc_count: cached.meta.europepmc_count,
          openalex_count: cached.meta.openalex_count,
          aemps_count: cached.meta.aemps_count,
          cochrane_count: cached.meta.cochrane_count ?? 0,
          ensayos_count: cached.meta.ensayos_count ?? 0,
          oa_enrichments: cached.meta.oa_enrichments ?? 0,
          core_count: cached.meta.core_count ?? 0,
          s2_count: cached.meta.s2_count ?? 0,
          preprints_count: cached.meta.preprints_count ?? 0,
          tldr_enrichments: cached.meta.tldr_enrichments ?? 0,
          crossref_enrichments: cached.meta.crossref_enrichments ?? 0,
          duracion_ms: Date.now() - start,
          errors: {},
        },
      };
    }
    const pubTypesPubmed = filtros.soloRevisiones
      ? ['Systematic Review', 'Meta-Analysis', 'Randomized Controlled Trial']
      : undefined;
    const pubTypesEpmc = filtros.soloRevisiones
      ? ['systematic-review', 'review', 'research-article']
      : undefined;

    const errors: Record<string, string> = {};
    const safeSecret = (s: ReturnType<typeof defineSecret>): string | undefined => {
      // Devuelve undefined si la secret no existe, está vacía, contiene
      // solo whitespace, o es el sentinel "__DISABLED__" (placeholder
      // explícito para mantener defineSecret() satisfecho cuando aún
      // no hemos conseguido API key real). Esto permite desplegar la
      // función sin claves reales y activarlas más tarde con
      // `firebase functions:secrets:set <NAME>` sin redeploy del código.
      try {
        const raw = s.value();
        if (!raw) return undefined;
        const trimmed = raw.trim();
        if (!trimmed || trimmed === '__DISABLED__') return undefined;
        return raw;
      } catch {
        return undefined;
      }
    };
    const ncbiKey = safeSecret(NCBI_API_KEY);
    const coreKey = safeSecret(CORE_API_KEY);
    const s2Key = safeSecret(S2_API_KEY);
    const aiSecrets = {
      deepseekKey: DEEPSEEK_API_KEY.value(),
      openrouterKey: OPENROUTER_API_KEY.value(),
    };

    // Extracción PICO opcional — si el cliente pide sintetizar, también
    // generamos queries optimizadas. Si falla, fallback a la pregunta cruda.
    let pico: PicoExtraction | null = null;
    let queryPubmed = v.sanitized;
    let queryEpmc = v.sanitized;
    let terminoFarmaco = v.sanitized.slice(0, 80);
    if (data.sintetizar === true) {
      try {
        pico = await extractPico({ pregunta: v.sanitized, secrets: aiSecrets });
        if (pico.query_pubmed) queryPubmed = pico.query_pubmed;
        if (pico.query_europepmc) queryEpmc = pico.query_europepmc;
        if (pico.contiene_farmaco && pico.farmaco) terminoFarmaco = pico.farmaco;
      } catch (e: unknown) {
        errors['pico'] = (e as Error).message ?? String(e);
        logger.warn('evidencia.pico.failed', { err: errors['pico'] });
      }
    }

    const pubmedP = searchPubmed(queryPubmed, {
      maxResults: 15,
      dateFrom,
      pubTypes: pubTypesPubmed,
      apiKey: ncbiKey || undefined,
      timeoutMs: 8000,
    }).catch((e: Error) => {
      errors['pubmed'] = e.message ?? String(e);
      return [] as PubmedAbstract[];
    });

    const epmcP = searchEuropePMC(queryEpmc, {
      pageSize: 10,
      resultType: 'core',
      pubTypes: pubTypesEpmc,
      dateFrom,
      timeoutMs: 8000,
      email: 'carlosgalera2roman@gmail.com',
    }).catch((e: Error) => {
      errors['europepmc'] = e.message ?? String(e);
      return [] as EpmcAbstract[];
    });

    const openalexP = searchOpenAlex(queryEpmc, {
      perPage: 10,
      dateFrom,
      pubTypes: filtros.soloRevisiones ? ['review'] : undefined,
      timeoutMs: 8000,
    }).catch((e: Error) => {
      errors['openalex'] = e.message ?? String(e);
      return [] as OpenAlexAbstract[];
    });

    // Auto-AEMPS: si el usuario no pidió explícitamente AEMPS, activamos
    // la búsqueda automáticamente cuando la pregunta tiene marcadores
    // farmacológicos claros (heurística determinista en drugDetection.ts
    // O señal positiva del PICO extractor). Paridad con la auto-detección
    // de Kleia. Cero fricción para el clínico que pregunta sobre medicación.
    const aempsAutoTriggered = !filtros.incluirAemps && (
      (pico?.contiene_farmaco === true) || detectDrugQuery(v.sanitized)
    );
    const aempsActive = !!filtros.incluirAemps || aempsAutoTriggered;
    const aempsP: Promise<AempsMedicamento[]> = aempsActive
      ? searchAemps(terminoFarmaco, { timeoutMs: 5000, pageSize: 5 }).catch((e: Error) => {
          errors['aemps'] = e.message ?? String(e);
          return [] as AempsMedicamento[];
        })
      : Promise.resolve([] as AempsMedicamento[]);

    // Búsqueda extra dirigida a Cochrane Database Syst Rev — alta calidad,
    // típicamente devuelve 1-3 SR muy relevantes que sumamos al pool antes
    // de re-ranquear (no duplica si ya estaba via PubMed normal).
    const cochraneP: Promise<PubmedAbstract[]> = filtros.priorizarCochrane
      ? searchPubmed(queryPubmed, {
          maxResults: 5,
          dateFrom,
          journals: ['Cochrane Database Syst Rev'],
          apiKey: ncbiKey || undefined,
          timeoutMs: 8000,
        }).catch((e: Error) => {
          errors['cochrane'] = e.message ?? String(e);
          return [] as PubmedAbstract[];
        })
      : Promise.resolve([] as PubmedAbstract[]);

    // ClinicalTrials.gov — ensayos en marcha o completados (NIH, gratis,
    // sin auth). Se devuelve aparte de los abstracts (no se rerankea).
    const ensayosP: Promise<ClinicalTrial[]> = filtros.incluirEnsayos
      ? searchClinicalTrials(queryEpmc, {
          pageSize: 8,
          dateFrom,
          onlyActive: !!filtros.soloEnsayosActivos,
          onlyEUorSpain: !!filtros.soloEnsayosUE,
          timeoutMs: 8000,
        }).catch((e: Error) => {
          errors['clinicaltrials'] = e.message ?? String(e);
          return [] as ClinicalTrial[];
        })
      : Promise.resolve([] as ClinicalTrial[]);

    // CORE — agregador OA (Open University UK). Solo si hay CORE_API_KEY.
    const coreP: Promise<CoreWork[]> = filtros.incluirCore && coreKey
      ? searchCore(queryEpmc, { limit: 8, dateFrom, apiKey: coreKey, timeoutMs: 8000 })
          .catch((e: Error) => {
            errors['core'] = e.message ?? String(e);
            return [] as CoreWork[];
          })
      : Promise.resolve([] as CoreWork[]);

    // Semantic Scholar — fuente complementaria con TLDR.
    const s2P: Promise<S2Paper[]> = filtros.incluirS2
      ? searchSemanticScholar(queryEpmc, {
          limit: 8,
          yearFrom: dateFrom,
          apiKey: s2Key,
          timeoutMs: 8000,
        }).catch((e: Error) => {
          errors['s2'] = e.message ?? String(e);
          return [] as S2Paper[];
        })
      : Promise.resolve([] as S2Paper[]);

    // Preprints (medRxiv/bioRxiv vía Europe PMC SRC:PPR). Penalizados en
    // rerank pero útiles para evidencia muy reciente.
    const preprintsP: Promise<EpmcAbstract[]> = filtros.incluirPreprints
      ? searchEuropePMC(queryEpmc, {
          pageSize: 6,
          resultType: 'core',
          dateFrom,
          onlyPreprints: true,
          timeoutMs: 8000,
          email: 'carlosgalera2roman@gmail.com',
        }).catch((e: Error) => {
          errors['preprints'] = e.message ?? String(e);
          return [] as EpmcAbstract[];
        })
      : Promise.resolve([] as EpmcAbstract[]);

    const [pubmed, epmc, openalex, aemps, cochrane, ensayos, core, s2, preprints] = await Promise.all([
      pubmedP, epmcP, openalexP, aempsP, cochraneP, ensayosP, coreP, s2P, preprintsP,
    ]);

    const reranked = rerank(
      [...pubmed, ...cochrane, ...epmc, ...openalex, ...core, ...s2, ...preprints],
      { maxResults: 8 },
    );
    const evidenceGrade = gradeEvidence(reranked);

    // ─── Enriquecimiento Semantic Scholar (TLDRs) ────────────────────
    // Para cada fuente top con DOI o PMID, batch 1-shot a S2 para
    // recuperar el TLDR (1 frase generada por IA) y mutarlo en el campo
    // abstract (prepend) — así la síntesis RAG tiene un contexto más
    // denso y el clínico ve un resumen rápido en la UI. Best-effort.
    let tldrEnrichments = 0;
    if (filtros.enriquecerTLDR && reranked.length > 0) {
      try {
        const dois = reranked
          .map((s) => (s.ref as { doi?: string | null }).doi ?? null)
          .filter((x): x is string => typeof x === 'string' && x.length > 0);
        const pmids = reranked
          .map((s) => (s.ref as { pmid?: string | null }).pmid ?? null)
          .filter((x): x is string => typeof x === 'string' && x.length > 0);
        const { tldrByDoi, tldrByPmid } = await enrichTldrs(
          { dois, pmids },
          { apiKey: s2Key, timeoutMs: 6000 },
        );
        for (const s of reranked) {
          const ref = s.ref as { doi?: string | null; pmid?: string | null; abstract?: string };
          let tldr: string | undefined;
          if (ref.doi) tldr = tldrByDoi.get(ref.doi.toLowerCase());
          if (!tldr && ref.pmid) tldr = tldrByPmid.get(ref.pmid);
          if (tldr) {
            s.reasons.push('TLDR Semantic Scholar');
            // Prependemos al abstract (no lo sobrescribimos para conservar
            // el original como verificable).
            if (typeof ref.abstract === 'string') {
              ref.abstract = `[TLDR] ${tldr}\n\n${ref.abstract}`;
            }
            tldrEnrichments++;
          }
        }
      } catch (e: unknown) {
        errors['s2_tldr'] = (e as Error).message ?? String(e);
      }
    }

    // ─── Enriquecimiento Crossref (licencia + tipo) ───────────────────
    // Añade `crossref` con info de licencia (CC-BY, propietaria…) y tipo
    // canónico para mostrar badges en UI. Best-effort.
    let crossrefEnrichments = 0;
    const crossrefByDoi = new Map<string, CrossrefMeta>();
    if (filtros.enriquecerCrossref && reranked.length > 0) {
      try {
        const dois = reranked
          .map((s) => (s.ref as { doi?: string | null }).doi ?? null)
          .filter((x): x is string => typeof x === 'string' && x.length > 0);
        if (dois.length) {
          const map = await enrichCrossref(dois, {
            concurrency: 4,
            perRequestTimeoutMs: 3500,
            totalBudgetMs: 5000,
          });
          for (const [k, m] of map) crossrefByDoi.set(k, m);
          for (const s of reranked) {
            const doi = (s.ref as { doi?: string | null }).doi;
            if (doi && map.has(doi.toLowerCase())) {
              const m = map.get(doi.toLowerCase());
              if (m?.license_name) s.reasons.push(`licencia ${m.license_name}`);
              crossrefEnrichments++;
            }
          }
        }
      } catch (e: unknown) {
        errors['crossref'] = (e as Error).message ?? String(e);
      }
    }

    // ─── Enriquecimiento Unpaywall ────────────────────────────────────
    // Para cada fuente top con DOI, intentamos resolver versión OA. Si la
    // hay, mutamos full_text_url. Best-effort con presupuesto 6s — si
    // Unpaywall tarda, no bloquea la respuesta.
    let oaEnrichments = 0;
    if (filtros.enriquecerOA) {
      const dois = reranked
        .map((s) => (s.ref as { doi?: string | null }).doi ?? null)
        .filter((x): x is string => typeof x === 'string' && x.length > 0);
      if (dois.length) {
        try {
          const resMap = await resolveManyDois(dois, {
            concurrency: 4,
            perRequestTimeoutMs: 3500,
            totalBudgetMs: 6000,
          });
          for (const s of reranked) {
            const ref = s.ref as { doi?: string | null; full_text_url?: string | null };
            if (!ref.doi) continue;
            const oa = resMap.get(ref.doi);
            if (!oa) continue;
            const url = oa.oa_url_for_pdf || oa.oa_url;
            if (url && !ref.full_text_url) {
              ref.full_text_url = url;
              s.reasons.push('full text OA (Unpaywall)');
              oaEnrichments++;
            }
          }
        } catch (e: unknown) {
          errors['unpaywall'] = (e as Error).message ?? String(e);
        }
      }
    }

    // Si la consulta forma parte de un hilo conversacional, recuperar
    // las 2 últimas turns de ese hilo para inyectarlas como contexto al
    // synth. Best-effort: si falla, seguimos sin historial.
    let threadHistory: Array<{ pregunta: string; sintesis: string }> = [];
    if (data.sintetizar === true && data.threadId) {
      try {
        const histSnap = await db
          .collection('evidencia_consultas')
          .where('uid', '==', uid)
          .where('threadId', '==', threadId)
          .orderBy('timestamp', 'desc')
          .limit(2)
          .get();
        threadHistory = histSnap.docs.map((d) => {
          const x = d.data() as { pregunta_original?: string; sintesis_resumen?: string };
          return {
            pregunta: x.pregunta_original ?? '',
            sintesis: x.sintesis_resumen ?? '',
          };
        });
      } catch (e: unknown) {
        // El error típico aquí es "índice compuesto requerido". No bloquea
        // la búsqueda — solo significa que esta turn no tendrá contexto.
        logger.warn('evidencia.thread.history.failed', { err: (e as Error).message });
      }
    }
    const threadTurnIndex = threadHistory.length; // 0=primera turn

    // Síntesis RAG opcional con verificación de citas.
    let sintesis: SynthOutput | null = null;
    if (data.sintetizar === true && reranked.length > 0) {
      try {
        sintesis = await synthesize({
          pregunta: v.sanitized,
          fuentes: reranked,
          especialidadLabel: especialidadKey !== 'general' ? especialidadLabel : undefined,
          threadHistory: threadHistory.length ? threadHistory : undefined,
          secrets: aiSecrets,
        });
      } catch (e: unknown) {
        errors['sintesis'] = (e as Error).message ?? String(e);
        logger.warn('evidencia.synth.failed', { err: errors['sintesis'] });
      }
    }

    // Contexto compacto que se persiste en el doc para alimentar el chat
    // de seguimiento sin tener que volver a llamar a PubMed/EuropePMC.
    // Limitado a top 12 abstracts y 800 chars por abstract (margen para
    // mantenernos muy por debajo del límite 1 MB de Firestore por doc).
    const chatCtxFuentes = reranked.slice(0, 12).map((s, i) => {
      const a = s.ref as {
        title?: string; abstract?: string; doi?: string | null;
        pmid?: string | null; journal?: string; year?: number | null;
      };
      return {
        idx: i + 1,
        title: (a.title ?? '').slice(0, 360),
        abstract: (a.abstract ?? '').slice(0, 800),
        journal: (a.journal ?? '').slice(0, 200),
        year: typeof a.year === 'number' ? a.year : null,
        doi: a.doi ?? null,
        pmid: a.pmid ?? null,
      };
    });

    // Log a Firestore (best-effort).
    const ref = db.collection('evidencia_consultas').doc();
    const consultaId = ref.id;
    try {
      await ref.set({
        uid,
        pregunta_original: v.sanitized,
        rechazada: false,
        fuentes_consultadas: [
          ...(pubmed.length ? ['pubmed'] : []),
          ...(cochrane.length ? ['cochrane'] : []),
          ...(epmc.length ? ['europepmc'] : []),
          ...(openalex.length ? ['openalex'] : []),
          ...(core.length ? ['core'] : []),
          ...(s2.length ? ['s2'] : []),
          ...(preprints.length ? ['preprints'] : []),
          ...(aemps.length ? ['aemps'] : []),
          ...(ensayos.length ? ['clinicaltrials'] : []),
        ],
        num_abstracts_recuperados: reranked.length,
        abstracts_pmids: reranked
          .map((s) => (s.ref as { pmid?: string }).pmid ?? null)
          .filter(Boolean),
        filtros_aplicados: filtros,
        sintetizar: data.sintetizar === true,
        pico_query_pubmed: pico ? pico.query_pubmed : null,
        pico_provider: pico ? pico.raw_provider : null,
        sintesis_provider: sintesis ? sintesis.provider : null,
        sintesis_model: sintesis ? sintesis.model : null,
        sintesis_citas_emitidas: sintesis ? sintesis.verificacion.citationsEmitted : 0,
        sintesis_citas_verificadas: sintesis ? sintesis.verificacion.citationsVerified : 0,
        sintesis_citas_ratio: sintesis ? sintesis.verificacion.ratio : 0,
        sintesis_follow_ups: sintesis ? sintesis.follow_ups.length : 0,
        // Versionado prompts (AI Act art. 12 — reproducibilidad).
        prompt_version_pico: currentPromptVersions().pico,
        prompt_version_synth: currentPromptVersions().synth,
        evidence_grade: evidenceGrade.grade,
        cochrane_count: cochrane.length,
        ensayos_count: ensayos.length,
        oa_enrichments: oaEnrichments,
        core_count: core.length,
        s2_count: s2.length,
        preprints_count: preprints.length,
        tldr_enrichments: tldrEnrichments,
        crossref_enrichments: crossrefEnrichments,
        aemps_auto_triggered: aempsAutoTriggered,
        especialidad: especialidadKey,
        threadId,
        threadTurnIndex,
        // Resumen corto para que la siguiente turn del hilo tenga contexto
        // sin tener que cargar el texto sintetizado completo.
        sintesis_resumen: sintesis ? sintesis.texto_sintetizado.replace(/\s+/g, ' ').slice(0, 360) : '',
        // Texto sintetizado completo + abstracts compactos: contexto que
        // alimenta `evidenciaChat` (turnos de seguimiento sobre los mismos
        // resultados, sin re-buscar en PubMed). Solo se guarda si hubo
        // síntesis exitosa — chats sin síntesis no aportarían valor.
        sintesis_texto: sintesis ? sintesis.texto_sintetizado.slice(0, 8000) : null,
        chatCtx: sintesis ? { fuentes: chatCtxFuentes, especialidad: especialidadKey } : null,
        ai_act_disclaimer_shown: true,
        // Evidencia procedimental de la Estrategia 3 (vínculo roto). La
        // pregunta llegó al modelo IA sanitizada y sin PII por construcción.
        // Ver docs/aiact/12-mdr-classification-rationale.md.
        patient_link_broken: true,
        duracion_ms: Date.now() - start,
        timestamp: FieldValue.serverTimestamp(),
      });
    } catch (e) {
      logger.warn('evidencia.log.failed', { err: (e as Error).message });
    }

    logger.info('evidenciaSearch.ok', {
      uid,
      consultaId,
      pubmed: pubmed.length,
      epmc: epmc.length,
      openalex: openalex.length,
      aemps: aemps.length,
      cochrane: cochrane.length,
      ensayos: ensayos.length,
      core: core.length,
      s2: s2.length,
      preprints: preprints.length,
      oa_enrichments: oaEnrichments,
      tldr_enrichments: tldrEnrichments,
      crossref_enrichments: crossrefEnrichments,
      reranked: reranked.length,
      duracion_ms: Date.now() - start,
      errors: Object.keys(errors),
    });

    // Cache write (best-effort, solo si tenemos resultado decente).
    if (reranked.length > 0) {
      setEviCached(db, cacheKey, {
        pregunta: v.sanitized,
        fuentes: reranked,
        aemps,
        ensayos,
        pico,
        sintesis,
        meta: {
          pubmed_count: pubmed.length,
          europepmc_count: epmc.length,
          openalex_count: openalex.length,
          aemps_count: aemps.length,
          cochrane_count: cochrane.length,
          ensayos_count: ensayos.length,
          oa_enrichments: oaEnrichments,
          core_count: core.length,
          s2_count: s2.length,
          preprints_count: preprints.length,
          tldr_enrichments: tldrEnrichments,
          crossref_enrichments: crossrefEnrichments,
          duracion_ms: Date.now() - start,
        },
      }).catch((e) => logger.warn('evidencia.cache.set.failed', { err: (e as Error).message }));
    }

    // Crossref meta serializable por DOI lowercase para el frontend.
    const crossrefMetaOut: Record<string, CrossrefMeta> = {};
    for (const [k, m] of crossrefByDoi) crossrefMetaOut[k] = m;

    return {
      ok: true,
      consultaId,
      pregunta: v.sanitized,
      fuentes: reranked,
      aemps,
      ensayos,
      crossref_meta: crossrefMetaOut,
      pico,
      sintesis,
      evidence_grade: evidenceGrade,
      prompt_version_pico: currentPromptVersions().pico,
      prompt_version_synth: currentPromptVersions().synth,
      threadId,
      threadTurnIndex,
      cached: false,
      meta: {
        pubmed_count: pubmed.length,
        europepmc_count: epmc.length,
        openalex_count: openalex.length,
        aemps_count: aemps.length,
        cochrane_count: cochrane.length,
        ensayos_count: ensayos.length,
        oa_enrichments: oaEnrichments,
        core_count: core.length,
        s2_count: s2.length,
        preprints_count: preprints.length,
        tldr_enrichments: tldrEnrichments,
        crossref_enrichments: crossrefEnrichments,
        duracion_ms: Date.now() - start,
        errors,
      },
    };
  },
);
