// ══════════════════════════════════════════════════════════════════════
// Cartagenaeste — Cloud Functions · entrypoint
// © 2026 Carlos Galera Román · Licencia propietaria · LPI 00765-03096622
// Ver LICENSE y NOTICE.md · Reutilización requiere autorización escrita.
// ══════════════════════════════════════════════════════════════════════

import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { askAi } from './askAi';
export { setUserRole } from './setUserRole';
export { publicMetrics } from './publicMetrics';
export { getGaMetrics } from './getGaMetrics';
export { csCreateInvite, csRedeemInvite } from './csInvites';

export {
  auditCases,
  auditAiRequests,
  auditSugerencias,
  auditDocumentosAprobados,
  auditTriajes,
  auditInformesIa,
  auditScanUploads,
} from './auditLog';

export { weeklyMetricsSnapshot, dailyBackup, weeklyAuditDigest } from './scheduledJobs';
export { aggregateDailyMetrics } from './aggregateDailyMetrics';
export { healthCheckAi } from './healthCheckAi';
export { goldStandardEval } from './goldStandardEval';
export { fhirExport } from './fhirExport';
