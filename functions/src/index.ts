import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { askAi } from './askAi';
export { setUserRole } from './setUserRole';
export { publicMetrics } from './publicMetrics';

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
