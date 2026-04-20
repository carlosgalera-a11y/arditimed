import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getApp } from 'firebase-admin/app';
import { logger } from 'firebase-functions/v2';

const VALID_ROLES = ['user', 'admin', 'superadmin'] as const;
type Role = (typeof VALID_ROLES)[number];

// Bootstrap list: emails que siempre tienen superadmin al invocarse.
// Útil mientras no haya ningún superadmin en claims todavía.
const BOOTSTRAP_EMAILS = [
  'carlosgalera2roman@gmail.com',
];

/**
 * Callable que asigna custom claim `role` a un usuario por email.
 * Solo invocable por un superadmin existente, o (modo bootstrap) por un email de la BOOTSTRAP_EMAILS.
 *
 * Input:
 *   { targetEmail: string, role: 'user' | 'admin' | 'superadmin' }
 *
 * Output:
 *   { ok: true, uid: string, role: string }
 */
export const setUserRole = onCall(
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
  async (request): Promise<{ ok: boolean; uid: string; role: Role }> => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');

    const callerEmail = request.auth.token.email ?? '';
    const callerClaim = request.auth.token.role ?? '';
    const isBootstrap = BOOTSTRAP_EMAILS.includes(callerEmail);
    const isSuperadmin = callerClaim === 'superadmin';

    if (!isSuperadmin && !isBootstrap) {
      logger.warn('setUserRole.denied', { callerEmail, callerClaim });
      throw new HttpsError('permission-denied', 'Solo un superadmin puede asignar roles.');
    }

    const targetEmail = String(request.data?.targetEmail ?? '').trim().toLowerCase();
    const role = String(request.data?.role ?? '') as Role;

    if (!targetEmail || !targetEmail.includes('@')) {
      throw new HttpsError('invalid-argument', 'targetEmail inválido.');
    }
    if (!VALID_ROLES.includes(role)) {
      throw new HttpsError('invalid-argument', `role debe ser uno de ${VALID_ROLES.join(', ')}.`);
    }

    const auth = getAuth(getApp());
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(targetEmail);
    } catch {
      throw new HttpsError('not-found', `Usuario con email ${targetEmail} no existe.`);
    }

    const newClaims = {
      ...(userRecord.customClaims ?? {}),
      role,
      admin: role === 'admin' || role === 'superadmin',
    };
    await auth.setCustomUserClaims(userRecord.uid, newClaims);

    logger.info('setUserRole.ok', { callerEmail, targetEmail, uid: userRecord.uid, role });
    return { ok: true, uid: userRecord.uid, role };
  },
);
