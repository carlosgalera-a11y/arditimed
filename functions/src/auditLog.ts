import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getApp } from 'firebase-admin/app';
import { logger } from 'firebase-functions/v2';

interface AuditEntry {
  uid: string;
  action: 'create' | 'update' | 'delete';
  resourceType: string;
  resourceId: string;
  changedFields?: string[];
  timestamp: FirebaseFirestore.FieldValue;
}

async function writeAudit(
  resourceType: string,
  resourceId: string,
  uidFromPath: string | undefined,
  before: FirebaseFirestore.DocumentSnapshot | undefined,
  after: FirebaseFirestore.DocumentSnapshot | undefined,
): Promise<void> {
  const db = getFirestore(getApp());
  const afterExists = !!after?.exists;
  const beforeExists = !!before?.exists;
  let action: AuditEntry['action'];
  if (!beforeExists && afterExists) action = 'create';
  else if (beforeExists && !afterExists) action = 'delete';
  else if (beforeExists && afterExists) action = 'update';
  else return; // ambos no existen → nada que loguear

  const uid = uidFromPath || after?.get('uid') || before?.get('uid') || 'unknown';
  let changedFields: string[] | undefined;
  if (action === 'update') {
    const beforeData = before?.data() ?? {};
    const afterData = after?.data() ?? {};
    const keys = new Set([...Object.keys(beforeData), ...Object.keys(afterData)]);
    changedFields = [];
    for (const k of keys) {
      if (JSON.stringify(beforeData[k]) !== JSON.stringify(afterData[k])) {
        changedFields.push(k);
      }
    }
  }

  const entry: AuditEntry = {
    uid,
    action,
    resourceType,
    resourceId,
    ...(changedFields ? { changedFields } : {}),
    timestamp: FieldValue.serverTimestamp(),
  };

  try {
    await db.collection('auditLogs').add(entry);
  } catch (e) {
    logger.error('auditLog.writeFailed', { resourceType, resourceId, error: (e as Error).message });
  }
}

const COMMON_OPTS = {
  region: 'europe-west1',
  memory: '256MiB' as const,
  timeoutSeconds: 30,
};

export const auditCases = onDocumentWritten(
  { ...COMMON_OPTS, document: 'users/{uid}/cases/{cid}' },
  async (event) => {
    await writeAudit('users.cases', event.params.cid, event.params.uid, event.data?.before, event.data?.after);
  },
);

export const auditAiRequests = onDocumentWritten(
  { ...COMMON_OPTS, document: 'users/{uid}/aiRequests/{rid}' },
  async (event) => {
    await writeAudit('users.aiRequests', event.params.rid, event.params.uid, event.data?.before, event.data?.after);
  },
);

export const auditSugerencias = onDocumentWritten(
  { ...COMMON_OPTS, document: 'sugerencias/{id}' },
  async (event) => {
    await writeAudit('sugerencias', event.params.id, undefined, event.data?.before, event.data?.after);
  },
);

export const auditDocumentosAprobados = onDocumentWritten(
  { ...COMMON_OPTS, document: 'documentos_aprobados/{id}' },
  async (event) => {
    await writeAudit('documentos_aprobados', event.params.id, undefined, event.data?.before, event.data?.after);
  },
);

export const auditTriajes = onDocumentWritten(
  { ...COMMON_OPTS, document: 'triajes/{id}' },
  async (event) => {
    await writeAudit('triajes', event.params.id, undefined, event.data?.before, event.data?.after);
  },
);

export const auditInformesIa = onDocumentWritten(
  { ...COMMON_OPTS, document: 'informes_ia/{id}' },
  async (event) => {
    await writeAudit('informes_ia', event.params.id, undefined, event.data?.before, event.data?.after);
  },
);

export const auditScanUploads = onDocumentWritten(
  { ...COMMON_OPTS, document: 'scan_uploads/{id}' },
  async (event) => {
    await writeAudit('scan_uploads', event.params.id, undefined, event.data?.before, event.data?.after);
  },
);
