// ══════════════════════════════════════════════════════════════════════
// Cartagenaeste — Cloud Functions · entrypoint
// © 2026 Carlos Galera Román · Licencia propietaria · LPI 00765-03096622
// Ver LICENSE y NOTICE.md · Reutilización requiere autorización escrita.
// ══════════════════════════════════════════════════════════════════════

import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { askAi } from './askAi';
export { embedQuery } from './embedQuery';
export { setUserRole } from './setUserRole';
export { publicMetrics } from './publicMetrics';
export { getGaMetrics } from './getGaMetrics';
export { csCreateInvite, csRedeemInvite } from './csInvites';
export { foroNotifyOnRespuesta } from './foroNotify';
export { evidenciaSearch } from './evidencia/evidenciaSearch';
export { evidenciaFeedback } from './evidencia/evidenciaFeedback';
export { evidenciaHealthCheck } from './evidencia/healthCheck';
export { evidenciaToggleFavorite, evidenciaListFavorites } from './evidencia/evidenciaFavorites';
export { evidenciaCreateShareToken, evidenciaGetShared, evidenciaSaveShareSnapshot } from './evidencia/evidenciaShared';

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
export { megaCuadernoDailyDigest } from './megaCuadernoDigest';
export { aggregateDailyMetrics } from './aggregateDailyMetrics';
export { healthCheckAi } from './healthCheckAi';
export { goldStandardEval } from './goldStandardEval';
export { fhirExport } from './fhirExport';
export { getGaReportingHub } from './getGaReportingHub';
export { getGaSegmentAnalysis } from './getGaSegmentAnalysis';
export { getApiBalances } from './getApiBalances';
export { getAudienceDetail } from './getAudienceDetail';
export { dailyBalanceCheck } from './dailyBalanceCheck';
