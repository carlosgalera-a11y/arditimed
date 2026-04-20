import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

let env: RulesTestEnvironment;
const PROJECT = 'demo-rules-test';

const ALICE = 'alice-uid';
const BOB = 'bob-uid';

async function asAlice() {
  return env.authenticatedContext(ALICE, { email: 'alice@example.com' });
}
async function asBob() {
  return env.authenticatedContext(BOB, { email: 'bob@example.com' });
}
async function asAdmin() {
  return env.authenticatedContext('admin-uid', {
    email: 'carlosgalera2roman@gmail.com',
    role: 'superadmin',
    admin: true,
  });
}
async function unauth() {
  return env.unauthenticatedContext();
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: {
      rules: readFileSync('../firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  // Seed con datos base (usando privilegio admin).
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users', ALICE), { name: 'Alice', role: 'user' });
    await setDoc(doc(db, 'users', BOB), { name: 'Bob', role: 'user' });
    await setDoc(doc(db, 'informes_ia', 'inf-alice'), { uid: ALICE, texto: 'x' });
    await setDoc(doc(db, 'informes_ia', 'inf-bob'), { uid: BOB, texto: 'x' });
    await setDoc(doc(db, 'mis_plantillas', ALICE), { data: 'x' });
    await setDoc(doc(db, 'mis_plantillas', BOB), { data: 'x' });
    await setDoc(doc(db, 'aiCache', 'hash1'), { text: 'cached' });
    await setDoc(doc(db, 'users', ALICE, 'quotas', '2026-04-21'), { count: 3, limit: 50 });
    await setDoc(doc(db, 'users', ALICE, 'aiRequests', 'req1'), { type: 'educational' });
    await setDoc(doc(db, 'auditLogs', 'log1'), { action: 'create' });
    await setDoc(doc(db, 'metrics_snapshots', '2026-16'), { usuariosTotal: 10 });
  });
});

// ═════════════════ ANÓNIMO NO LEE NADA ═════════════════
describe('Unauthenticated user (deny-by-default)', () => {
  it('no puede leer users/{uid}', async () => {
    const db = (await unauth()).firestore();
    await assertFails(getDoc(doc(db, 'users', ALICE)));
  });
  it('no puede leer informes_ia', async () => {
    const db = (await unauth()).firestore();
    await assertFails(getDoc(doc(db, 'informes_ia', 'inf-alice')));
  });
  it('no puede leer mis_plantillas', async () => {
    const db = (await unauth()).firestore();
    await assertFails(getDoc(doc(db, 'mis_plantillas', ALICE)));
  });
  it('no puede escribir aiCache', async () => {
    const db = (await unauth()).firestore();
    await assertFails(setDoc(doc(db, 'aiCache', 'nuevo'), { text: 'x' }));
  });
  it('no puede leer auditLogs', async () => {
    const db = (await unauth()).firestore();
    await assertFails(getDoc(doc(db, 'auditLogs', 'log1')));
  });
});

// ═════════════════ AISLAMIENTO ENTRE USUARIOS ═════════════════
describe('User A cannot read user B data', () => {
  it('alice no lee informes_ia de bob', async () => {
    const db = (await asAlice()).firestore();
    await assertFails(getDoc(doc(db, 'informes_ia', 'inf-bob')));
  });
  it('alice no lee mis_plantillas de bob', async () => {
    const db = (await asAlice()).firestore();
    await assertFails(getDoc(doc(db, 'mis_plantillas', BOB)));
  });
  it('alice no escribe mis_notebooks de bob', async () => {
    const db = (await asAlice()).firestore();
    await assertFails(setDoc(doc(db, 'mis_notebooks', BOB), { data: 'x' }));
  });
  it('alice no lee quotas de bob', async () => {
    const db = (await asAlice()).firestore();
    await assertFails(getDoc(doc(db, 'users', BOB, 'quotas', '2026-04-21')));
  });
  it('alice no lee aiRequests de bob', async () => {
    const db = (await asAlice()).firestore();
    await assertFails(getDoc(doc(db, 'users', BOB, 'aiRequests', 'req1')));
  });
});

// ═════════════════ USUARIO NO PUEDE ESCALAR PRIVILEGIOS ═════════════════
describe('User cannot modify own role field', () => {
  it('alice no puede cambiar su role a superadmin', async () => {
    const db = (await asAlice()).firestore();
    await assertFails(updateDoc(doc(db, 'users', ALICE), { role: 'superadmin' }));
  });
  it('alice SI puede actualizar otros campos', async () => {
    const db = (await asAlice()).firestore();
    await assertSucceeds(updateDoc(doc(db, 'users', ALICE), { name: 'Alice Updated' }));
  });
});

// ═════════════════ CLIENTE NO ESCRIBE COLECCIONES SERVER-ONLY ═════════════════
describe('Client cannot write server-only collections', () => {
  it('alice no escribe aiCache', async () => {
    const db = (await asAlice()).firestore();
    await assertFails(setDoc(doc(db, 'aiCache', 'manual'), { text: 'x' }));
  });
  it('alice no escribe quotas', async () => {
    const db = (await asAlice()).firestore();
    await assertFails(setDoc(doc(db, 'users', ALICE, 'quotas', '2026-04-22'), { count: 1 }));
  });
  it('alice no escribe aiRequests', async () => {
    const db = (await asAlice()).firestore();
    await assertFails(setDoc(doc(db, 'users', ALICE, 'aiRequests', 'fake'), { type: 'x' }));
  });
  it('alice no escribe auditLogs', async () => {
    const db = (await asAlice()).firestore();
    await assertFails(setDoc(doc(db, 'auditLogs', 'manual'), { action: 'x' }));
  });
  it('alice no escribe rate_limits_ip', async () => {
    const db = (await asAlice()).firestore();
    await assertFails(setDoc(doc(db, 'rate_limits_ip', 'x'), { count: 1 }));
  });
  it('alice no escribe metrics_snapshots', async () => {
    const db = (await asAlice()).firestore();
    await assertFails(setDoc(doc(db, 'metrics_snapshots', 'x'), { usuariosTotal: 0 }));
  });
});

// ═════════════════ DNI/NIE VALIDATORS EN CASES ═════════════════
describe('DNI/NIE rejected in cases.notes', () => {
  it('case con DNI en notes es rechazado', async () => {
    const db = (await asAlice()).firestore();
    await assertFails(setDoc(doc(db, 'users', ALICE, 'cases', 'c1'), {
      initials: 'JRM',
      notes: 'Paciente 12345678Z con HTA',
    }));
  });
  it('case con NIE en notes es rechazado', async () => {
    const db = (await asAlice()).firestore();
    await assertFails(setDoc(doc(db, 'users', ALICE, 'cases', 'c2'), {
      initials: 'EX',
      notes: 'Paciente X1234567L',
    }));
  });
  it('case válido es aceptado', async () => {
    const db = (await asAlice()).firestore();
    await assertSucceeds(setDoc(doc(db, 'users', ALICE, 'cases', 'c3'), {
      initials: 'JRM',
      notes: 'Paciente con dolor torácico',
    }));
  });
  it('initials > 4 chars es rechazado', async () => {
    const db = (await asAlice()).firestore();
    await assertFails(setDoc(doc(db, 'users', ALICE, 'cases', 'c4'), {
      initials: 'LONGNAME',
      notes: 'algo',
    }));
  });
});

// ═════════════════ ADMIN LEE COSAS ═════════════════
describe('Admin has broader read permissions', () => {
  it('admin lee aiRequests de otro usuario', async () => {
    const db = (await asAdmin()).firestore();
    await assertSucceeds(getDoc(doc(db, 'users', ALICE, 'aiRequests', 'req1')));
  });
  it('admin lee auditLogs', async () => {
    const db = (await asAdmin()).firestore();
    await assertSucceeds(getDoc(doc(db, 'auditLogs', 'log1')));
  });
  it('admin lee metrics_snapshots', async () => {
    const db = (await asAdmin()).firestore();
    await assertSucceeds(getDoc(doc(db, 'metrics_snapshots', '2026-16')));
  });
});

// ═════════════════ AUDITLOGS INMUTABLE ═════════════════
describe('Audit logs are immutable', () => {
  it('nadie puede update auditLog', async () => {
    const db = (await asAdmin()).firestore();
    await assertFails(updateDoc(doc(db, 'auditLogs', 'log1'), { action: 'modified' }));
  });
  it('nadie puede delete auditLog', async () => {
    const db = (await asAdmin()).firestore();
    await assertFails(deleteDoc(doc(db, 'auditLogs', 'log1')));
  });
});

// ═════════════════ SUGERENCIAS: CREAR TODOS, LEER ADMIN ═════════════════
describe('Sugerencias: create any auth, read admin only', () => {
  it('alice crea sugerencia', async () => {
    const db = (await asAlice()).firestore();
    await assertSucceeds(setDoc(doc(db, 'sugerencias', 's1'), { mensaje: 'test', uid: ALICE }));
  });
  it('alice no lee sugerencia', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'sugerencias', 's2'), { mensaje: 'x' });
    });
    const db = (await asAlice()).firestore();
    await assertFails(getDoc(doc(db, 'sugerencias', 's2')));
  });
  it('admin lee sugerencia', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'sugerencias', 's3'), { mensaje: 'x' });
    });
    const db = (await asAdmin()).firestore();
    await assertSucceeds(getDoc(doc(db, 'sugerencias', 's3')));
  });
});
