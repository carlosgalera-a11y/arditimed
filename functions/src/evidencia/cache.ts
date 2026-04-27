// ══════════════════════════════════════════════════════════════════════
// EvidenciaIA · cache de consultas idénticas
// ══════════════════════════════════════════════════════════════════════
// Hash SHA-256 sobre la pregunta normalizada + filtros relevantes.
// TTL 24h (la literatura cambia despacio pero queremos refrescar a diario).
// Una consulta cacheada salta TODO: PubMed/EPMC/OpenAlex/AEMPS, PICO y RAG.
// ══════════════════════════════════════════════════════════════════════

import { createHash } from 'node:crypto';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import type { ScoredAbstract } from './reranker';
import type { AempsMedicamento } from './aemps';
import type { PicoExtraction } from './picoExtractor';
import type { SynthOutput } from './ragSynthesizer';

export const EVI_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export interface CachedEvidencia {
  hash: string;
  pregunta: string;
  fuentes: ScoredAbstract[];
  aemps: AempsMedicamento[];
  pico: PicoExtraction | null;
  sintesis: SynthOutput | null;
  meta: {
    pubmed_count: number;
    europepmc_count: number;
    openalex_count: number;
    aemps_count: number;
    duracion_ms: number;
  };
  createdAt: FirebaseFirestore.Timestamp;
  expiresAt: FirebaseFirestore.Timestamp;
  hits: number;
}

export interface EviCacheKeyParts {
  pregunta: string;
  sintetizar: boolean;
  anios: number;
  soloRevisiones: boolean;
  incluirAemps: boolean;
}

/**
 * Normaliza la pregunta antes de hashear: lowercase, sin tildes, sin
 * puntuación, espacios colapsados. Mantiene los números (importantes:
 * "fa >75 años" ≠ "fa >65 años").
 */
function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s<>=]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hashEviKey(parts: EviCacheKeyParts): string {
  const h = createHash('sha256');
  h.update(normalizar(parts.pregunta));
  h.update('\x00');
  h.update(parts.sintetizar ? '1' : '0');
  h.update('\x00');
  h.update(String(parts.anios));
  h.update('\x00');
  h.update(parts.soloRevisiones ? '1' : '0');
  h.update('\x00');
  h.update(parts.incluirAemps ? '1' : '0');
  return h.digest('hex');
}

export async function getEviCached(
  db: Firestore,
  hash: string,
  now: Date = new Date(),
): Promise<CachedEvidencia | null> {
  const snap = await db.collection('evidenciaCache').doc(hash).get();
  if (!snap.exists) return null;
  const data = snap.data() as CachedEvidencia | undefined;
  if (!data) return null;
  const exp = data.expiresAt?.toMillis?.() ?? 0;
  if (exp && exp <= now.getTime()) return null;
  return data;
}

export async function setEviCached(
  db: Firestore,
  hash: string,
  payload: Omit<CachedEvidencia, 'hash' | 'createdAt' | 'expiresAt' | 'hits'>,
): Promise<void> {
  const now = Date.now();
  await db
    .collection('evidenciaCache')
    .doc(hash)
    .set({
      ...payload,
      hash,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: new Date(now + EVI_CACHE_TTL_MS),
      hits: 0,
    });
}

/**
 * Incrementa el contador de hits. Best-effort (no bloquea la respuesta).
 */
export async function bumpEviCacheHit(db: Firestore, hash: string): Promise<void> {
  try {
    await db.collection('evidenciaCache').doc(hash).update({
      hits: FieldValue.increment(1),
      lastHitAt: FieldValue.serverTimestamp(),
    });
  } catch {
    /* ignorable */
  }
}
