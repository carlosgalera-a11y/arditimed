import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

export const DEFAULT_DAILY_LIMIT = 50;
export const ADMIN_DAILY_LIMIT = 200;

export function todayKey(now: Date = new Date()): string {
  // YYYY-MM-DD en UTC. Evita drift entre zonas horarias.
  return now.toISOString().substring(0, 10);
}

/**
 * Consume 1 unidad de cuota del usuario. Usa transacción para evitar race
 * conditions entre invocaciones concurrentes de la función.
 *
 * @throws HttpsError('resource-exhausted') si se supera el límite.
 */
export async function consumeQuota(
  db: Firestore,
  uid: string,
  isAdmin: boolean,
  now: Date = new Date(),
): Promise<{ count: number; limit: number }> {
  const limit = isAdmin ? ADMIN_DAILY_LIMIT : DEFAULT_DAILY_LIMIT;
  const key = todayKey(now);
  const ref = db.collection('users').doc(uid).collection('quotas').doc(key);

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const currentCount = snap.exists ? (snap.data()?.count ?? 0) : 0;
    if (currentCount >= limit) {
      return { exceeded: true, count: currentCount, limit };
    }
    if (snap.exists) {
      tx.update(ref, {
        count: FieldValue.increment(1),
        limit,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      tx.set(ref, {
        count: 1,
        limit,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    return { exceeded: false, count: currentCount + 1, limit };
  });

  if (result.exceeded) {
    throw new HttpsError(
      'resource-exhausted',
      `Has alcanzado tu límite diario de IA (${result.count}/${result.limit}). Vuelve mañana.`,
    );
  }
  return { count: result.count, limit: result.limit };
}
