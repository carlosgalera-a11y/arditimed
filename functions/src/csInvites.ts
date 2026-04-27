import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getApp } from 'firebase-admin/app';
import { logger } from 'firebase-functions/v2';

const REGION = 'europe-west1';
const CORS = [
  'https://area2cartagena.es',
  'https://carlosgalera-a11y.github.io',
  'http://localhost:5000',
];

const VALID_ROLES = ['redactor', 'coordinador'] as const;
type CsRol = (typeof VALID_ROLES)[number];

function isAdminClaim(token: Record<string, unknown> | undefined): boolean {
  if (!token) return false;
  if (token.admin === true) return true;
  if (token.role === 'admin' || token.role === 'superadmin') return true;
  const email = String(token.email ?? '').toLowerCase();
  return email === 'carlosgalera2roman@gmail.com' || email === 'ramongalera22@gmail.com';
}

function genCodigo(): string {
  // 8 caracteres legibles, sin 0/O/1/I para evitar errores al teclear.
  const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += ABC.charAt(Math.floor(Math.random() * ABC.length));
  return s.slice(0, 4) + '-' + s.slice(4);
}

/**
 * `csCreateInvite` — sólo admin/superadmin. Crea un código de invitación
 * de un solo uso para un centro de salud.
 *
 * Input: { centroId: string, rol: 'redactor'|'coordinador', expiraEnDias?: number }
 * Output: { ok, codigo, centroId, rol, expiraISO }
 */
export const csCreateInvite = onCall(
  { region: REGION, memory: '256MiB', timeoutSeconds: 15, cors: CORS },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
    if (!isAdminClaim(request.auth.token)) {
      throw new HttpsError('permission-denied', 'Sólo admin puede crear códigos.');
    }

    const centroId = String(request.data?.centroId ?? '').trim();
    const rol = String(request.data?.rol ?? '') as CsRol;
    const dias = Math.max(1, Math.min(30, Number(request.data?.expiraEnDias ?? 7)));

    if (!/^[a-z0-9-]{3,50}$/.test(centroId)) {
      throw new HttpsError('invalid-argument', 'centroId inválido (slug a-z, 0-9, -, 3-50 chars).');
    }
    if (!VALID_ROLES.includes(rol)) {
      throw new HttpsError('invalid-argument', `rol debe ser ${VALID_ROLES.join(' | ')}.`);
    }

    const db = getFirestore(getApp());
    const expiraAt = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);

    // Reintentar hasta 5 veces si hay colisión de código (extremadamente raro).
    for (let i = 0; i < 5; i++) {
      const codigo = genCodigo();
      const ref = db.collection('cs_invites').doc(codigo);
      try {
        await db.runTransaction(async (tx) => {
          const snap = await tx.get(ref);
          if (snap.exists) throw new Error('collision');
          tx.set(ref, {
            centroId,
            rol,
            expiraAt,
            usado: false,
            usadoPor: null,
            usadoAt: null,
            creadoPor: request.auth!.uid,
            creadoPorEmail: request.auth!.token.email ?? null,
            creadoAt: FieldValue.serverTimestamp(),
          });
        });
        logger.info('csInvites.create.ok', {
          codigo,
          centroId,
          rol,
          creadoPorEmail: request.auth.token.email,
        });
        return { ok: true, codigo, centroId, rol, expiraISO: expiraAt.toISOString() };
      } catch (err) {
        if ((err as Error).message !== 'collision') throw err;
      }
    }
    throw new HttpsError('internal', 'No se pudo generar un código único.');
  },
);

/**
 * `csRedeemInvite` — cualquier autenticado canjea un código y recibe el rol
 * indicado en su /users/{uid}.csRoles[centroId]. Atómico: el doc del invite
 * pasa a usado=true en la misma transacción.
 *
 * Input: { codigo: string }
 * Output: { ok, centroId, rol }
 */
export const csRedeemInvite = onCall(
  { region: REGION, memory: '256MiB', timeoutSeconds: 15, cors: CORS },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');

    const codigo = String(request.data?.codigo ?? '').trim().toUpperCase();
    if (!/^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(codigo)) {
      throw new HttpsError('invalid-argument', 'Formato de código incorrecto (XXXX-XXXX).');
    }

    const db = getFirestore(getApp());
    const inviteRef = db.collection('cs_invites').doc(codigo);
    const userRef = db.collection('users').doc(request.auth.uid);

    const result = await db.runTransaction(async (tx) => {
      const inv = await tx.get(inviteRef);
      if (!inv.exists) throw new HttpsError('not-found', 'Código no válido.');
      const data = inv.data() as {
        centroId: string;
        rol: CsRol;
        expiraAt: FirebaseFirestore.Timestamp;
        usado: boolean;
      };
      if (data.usado) throw new HttpsError('failed-precondition', 'Código ya utilizado.');
      if (data.expiraAt.toMillis() < Date.now()) {
        throw new HttpsError('failed-precondition', 'Código caducado.');
      }

      tx.set(
        userRef,
        {
          csRoles: { [data.centroId]: data.rol },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      tx.update(inviteRef, {
        usado: true,
        usadoPor: request.auth!.uid,
        usadoPorEmail: request.auth!.token.email ?? null,
        usadoAt: FieldValue.serverTimestamp(),
      });
      return { centroId: data.centroId, rol: data.rol };
    });

    logger.info('csInvites.redeem.ok', {
      codigo,
      uid: request.auth.uid,
      email: request.auth.token.email,
      centroId: result.centroId,
      rol: result.rol,
    });
    return { ok: true, ...result };
  },
);
