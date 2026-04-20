import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

export const MAX_PER_MIN = 30;

function minuteKey(now: Date = new Date()): string {
  // YYYY-MM-DDTHH:MM en UTC → partición por minuto.
  return now.toISOString().substring(0, 16).replace(':', '-');
}

function sanitizeIp(ip: string): string {
  // Firestore doc id no admite `/` ni `.` como primer char; normalizamos.
  return ip.replace(/[^0-9a-fA-F:.]/g, '_').substring(0, 64) || 'unknown';
}

/**
 * Rate limit por IP con ventana deslizante de 1 minuto.
 * Bucket por minuto → 30 req/min máximo.
 *
 * @throws HttpsError('resource-exhausted') si se supera.
 */
export async function checkIpRateLimit(
  db: Firestore,
  ip: string,
  now: Date = new Date(),
): Promise<void> {
  const key = `${sanitizeIp(ip)}__${minuteKey(now)}`;
  const ref = db.collection('rate_limits_ip').doc(key);

  const exceeded = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const currentCount = snap.exists ? (snap.data()?.count ?? 0) : 0;
    if (currentCount >= MAX_PER_MIN) return true;
    if (snap.exists) {
      tx.update(ref, {
        count: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      // TTL: 2 minutos (Firestore TTL policy se encarga de limpiar).
      tx.set(ref, {
        count: 1,
        ip: sanitizeIp(ip),
        expiresAt: new Date(now.getTime() + 2 * 60 * 1000),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    return false;
  });

  if (exceeded) {
    throw new HttpsError(
      'resource-exhausted',
      `Demasiadas peticiones (máx ${MAX_PER_MIN}/min). Reintenta en 1 minuto.`,
    );
  }
}
