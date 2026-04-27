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
import { searchAemps, type AempsMedicamento } from './aemps';
import { rerank, type ScoredAbstract } from './reranker';

// Secreto OPCIONAL: si existe, sube el rate limit de PubMed de 3 a 10 req/s.
// Si no existe, las funciones siguen funcionando sin ella.
const NCBI_API_KEY = defineSecret('NCBI_API_KEY');

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
  ai_act_disclaimer_shown?: boolean;
}

interface SearchResponse {
  ok: boolean;
  consultaId: string;
  pregunta: string;
  fuentes: ScoredAbstract[];
  aemps: AempsMedicamento[];
  meta: {
    pubmed_count: number;
    europepmc_count: number;
    aemps_count: number;
    duracion_ms: number;
    errors: Record<string, string>;
  };
}

export const evidenciaSearch = onCall(
  {
    region: REGION,
    secrets: [NCBI_API_KEY],
    enforceAppCheck: false, // se flipa cuando reCAPTCHA esté en producción
    memory: '512MiB',
    timeoutSeconds: 60,
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

    const pubmedP = searchPubmed(v.sanitized, {
      maxResults: 15,
      dateFrom,
      pubTypes: pubTypesPubmed,
      apiKey: ncbiKey || undefined,
      timeoutMs: 8000,
    }).catch((e: Error) => {
      errors['pubmed'] = e.message ?? String(e);
      return [] as PubmedAbstract[];
    });

    const epmcP = searchEuropePMC(v.sanitized, {
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

    const aempsP: Promise<AempsMedicamento[]> = filtros.incluirAemps
      ? searchAemps(extraerTerminoFarmaco(v.sanitized), { timeoutMs: 5000, pageSize: 5 }).catch(
          (e: Error) => {
            errors['aemps'] = e.message ?? String(e);
            return [] as AempsMedicamento[];
          },
        )
      : Promise.resolve([] as AempsMedicamento[]);

    const [pubmed, epmc, aemps] = await Promise.all([pubmedP, epmcP, aempsP]);

    const reranked = rerank([...pubmed, ...epmc], { maxResults: 8 });

    // Log a Firestore (best-effort).
    const db = getFirestore(getApp());
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
          ...(aemps.length ? ['aemps'] : []),
        ],
        num_abstracts_recuperados: reranked.length,
        abstracts_pmids: reranked
          .map((s) => (s.ref as { pmid?: string }).pmid ?? null)
          .filter(Boolean),
        filtros_aplicados: filtros,
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
      aemps: aemps.length,
      reranked: reranked.length,
      duracion_ms: Date.now() - start,
      errors: Object.keys(errors),
    });

    return {
      ok: true,
      consultaId,
      pregunta: v.sanitized,
      fuentes: reranked,
      aemps,
      meta: {
        pubmed_count: pubmed.length,
        europepmc_count: epmc.length,
        aemps_count: aemps.length,
        duracion_ms: Date.now() - start,
        errors,
      },
    };
  },
);

// Heurística simple — si la pregunta contiene algún sustantivo que pueda
// ser principio activo (mayúscula inicial, longitud razonable), lo usa.
// En PR-2 esto lo sustituye el extractor PICO con LLM.
function extraerTerminoFarmaco(q: string): string {
  // Por ahora, usa la pregunta entera como query libre del CIMA.
  return q.slice(0, 80);
}
