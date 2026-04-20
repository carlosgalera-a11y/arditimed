import { createHash } from 'node:crypto';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import type { ProviderResult } from './types';

export const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

export function hashKey(
  type: string,
  prompt: string,
  systemPrompt: string,
  model: string,
): string {
  const h = createHash('sha256');
  h.update(type);
  h.update('\x00');
  h.update(prompt);
  h.update('\x00');
  h.update(systemPrompt);
  h.update('\x00');
  h.update(model);
  return h.digest('hex');
}

export interface CacheEntry extends ProviderResult {
  hash: string;
  provider: string;
  createdAt: FirebaseFirestore.Timestamp;
  expiresAt: FirebaseFirestore.Timestamp;
}

export async function getCached(
  db: Firestore,
  hash: string,
  now: Date = new Date(),
): Promise<CacheEntry | null> {
  const snap = await db.collection('aiCache').doc(hash).get();
  if (!snap.exists) return null;
  const data = snap.data() as CacheEntry | undefined;
  if (!data) return null;
  // Verificar TTL defensivamente (por si TTL policy de Firestore no ha corrido).
  const expiresAt = data.expiresAt?.toMillis?.() ?? 0;
  if (expiresAt && expiresAt <= now.getTime()) return null;
  return data;
}

export async function setCached(
  db: Firestore,
  hash: string,
  provider: string,
  result: ProviderResult,
  now: Date = new Date(),
): Promise<void> {
  const expiresAt = new Date(now.getTime() + CACHE_TTL_MS);
  await db.collection('aiCache').doc(hash).set({
    hash,
    provider,
    text: result.text,
    model: result.model,
    tokensIn: result.tokensIn ?? 0,
    tokensOut: result.tokensOut ?? 0,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt,
  });
}
