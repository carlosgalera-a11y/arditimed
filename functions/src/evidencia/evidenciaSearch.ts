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
import { rerank, type ScoredAbstract } from './reranker';
import { extractPico, type PicoExtraction } from './picoExtractor';
import { synthesize, type SynthOutput } from './ragSynthesizer';
import { hashEviKey, getEviCached, setEviCached, bumpEviCacheHit } from './cache';

// Secreto OPCIONAL: si existe, sube el rate limit de PubMed de 3 a 10 req/s.
// Si no existe, las funciones siguen funcionando sin ella.
const NCBI_API_KEY = defineSecret('NCBI_API_KEY');
// Secretos IA — reusados de askAi para extracción PICO + síntesis RAG.
const DEEPSEEK_API_KEY = defineSecret('DEEPSEEK_API_KEY');
const OPENROUTER_API_KEY = defineSecret('OPENROUTER_API_KEY');

const REGION = 'europe-west1';
const CORS = [
  'https://area2cartagena.es',
  'https://carlosgalera-a11y.github.io',
  'http://localhost:5000',
];

interface SearchRequest {
  pregunta: string;
  filtros?: {
    anios?: number;          // años hacia atrás (5, 10, 20)
    soloRevisiones?: boolean;
    incluirAemps?: boolean;
    priorizarGuiasEU?: boolean;
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
  pico: PicoExtraction | null;
  sintesis: SynthOutput | null;
  cached: boolean;
  meta: {
    pubmed_count: number;
    europepmc_count: number;
    openalex_count: number;
    aemps_count: number;
    duracion_ms: number;
    errors: Record<string, string>;
  };
}

export const evidenciaSearch = onCall(
  {
    region: REGION,
    secrets: [NCBI_API_KEY, DEEPSEEK_API_KEY, OPENROUTER_API_KEY],
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
    });
    const cached = await getEviCached(db, cacheKey).catch(() => null);
    if (cached) {
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
        pico: cached.pico,
        sintesis: cached.sintesis,
        cached: true,
        meta: {
          pubmed_count: cached.meta.pubmed_count,
          europepmc_count: cached.meta.europepmc_count,
          openalex_count: cached.meta.openalex_count,
          aemps_count: cached.meta.aemps_count,
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
    const ncbiKey = (() => {
      try {
        return NCBI_API_KEY.value();
      } catch {
        return undefined;
      }
    })();
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

    const aempsP: Promise<AempsMedicamento[]> = filtros.incluirAemps
      ? searchAemps(terminoFarmaco, { timeoutMs: 5000, pageSize: 5 }).catch((e: Error) => {
          errors['aemps'] = e.message ?? String(e);
          return [] as AempsMedicamento[];
        })
      : Promise.resolve([] as AempsMedicamento[]);

    const [pubmed, epmc, openalex, aemps] = await Promise.all([pubmedP, epmcP, openalexP, aempsP]);

    const reranked = rerank([...pubmed, ...epmc, ...openalex], { maxResults: 8 });

    // Síntesis RAG opcional con verificación de citas.
    let sintesis: SynthOutput | null = null;
    if (data.sintetizar === true && reranked.length > 0) {
      try {
        sintesis = await synthesize({
          pregunta: v.sanitized,
          fuentes: reranked,
          secrets: aiSecrets,
        });
      } catch (e: unknown) {
        errors['sintesis'] = (e as Error).message ?? String(e);
        logger.warn('evidencia.synth.failed', { err: errors['sintesis'] });
      }
    }

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
          ...(epmc.length ? ['europepmc'] : []),
          ...(openalex.length ? ['openalex'] : []),
          ...(aemps.length ? ['aemps'] : []),
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
        ai_act_disclaimer_shown: true,
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
        pico,
        sintesis,
        meta: {
          pubmed_count: pubmed.length,
          europepmc_count: epmc.length,
          openalex_count: openalex.length,
          aemps_count: aemps.length,
          duracion_ms: Date.now() - start,
        },
      }).catch((e) => logger.warn('evidencia.cache.set.failed', { err: (e as Error).message }));
    }

    return {
      ok: true,
      consultaId,
      pregunta: v.sanitized,
      fuentes: reranked,
      aemps,
      pico,
      sintesis,
      cached: false,
      meta: {
        pubmed_count: pubmed.length,
        europepmc_count: epmc.length,
        openalex_count: openalex.length,
        aemps_count: aemps.length,
        duracion_ms: Date.now() - start,
        errors,
      },
    };
  },
);
