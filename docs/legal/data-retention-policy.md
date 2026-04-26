# Política de retención de datos · Cartagenaeste

**RGPD art. 5.1.e (limitación del plazo de conservación)**

---

| Campo | Valor |
|---|---|
| Versión | 1.0 |
| Fecha aprobación | 2026-04-26 |
| Próxima revisión | 2027-04-26 |
| Responsable | Carlos Galera Román |

---

## Principio

Solo se conservan los datos **mientras son necesarios** para la finalidad que justificó su recogida. Tras el plazo de retención, los datos se eliminan automáticamente vía Firestore TTL o lifecycle de Cloud Storage.

## Plazos por colección

| Colección Firestore | Contenido | Plazo | Mecanismo |
|---|---|---|---|
| `users/{uid}` | Email, displayName, dominio, lastSeen, role | Mientras la cuenta esté activa + 12 meses tras última actividad | Manual (auditoría trimestral); auto-cleanup planificado |
| `users/{uid}/cases` | Casos clínicos seudonimizados del médico | 365 días (TTL automático) | Firestore TTL |
| `users/{uid}/aiRequests` | Hash + metadatos de consultas IA, sin texto | 180 días | Firestore TTL |
| `users/{uid}/quotas/{date}` | Contador diario de consumo IA | 90 días | Firestore TTL |
| `users/{uid}/progress` | Tracking de aprendizaje formativo | 730 días (2 años) | Manual |
| `aiCache` | Cache de respuestas IA por hash de prompt | 7 días | Firestore TTL |
| `rate_limits_ip/{ip}` | Contadores rate-limit por IP | 2 minutos | Firestore TTL |
| `auditLogs/*` | Audit log inmutable de escrituras | 365 días | Firestore TTL · rules deny update/delete |
| `informes_ia` | Informes generados (multi-tenant) | 730 días | Manual |
| `mis_plantillas` | Plantillas docentes del usuario | Mientras se mantenga la cuenta | Manual |
| `mis_notebooks` | Cuadernos personales del usuario | Mientras se mantenga la cuenta | Manual |
| `megacuaderno_backups` | Backups MegaCuaderno por timestamp | 90 días | Manual + plan de TTL |
| `scan_uploads` | Metadatos de scans realizados (sin imagen) | 365 días | Firestore TTL |
| `triajes` | Triajes formativos completados | 365 días | Manual |
| `sugerencias` | Sugerencias enviadas por usuarios | Mientras estén abiertas; cerradas 365 días | Manual |
| `documentos_aprobados` | Docs validados para uso público | Mientras estén vigentes; al retirar 90 días | Manual |
| `accesos_profesionales` | Solicitudes de acceso pendientes | 30 días si denegada; activos mientras vigentes | Manual |
| `metrics_snapshots` | Snapshots semanales agregados | 730 días (histórico) | Manual |
| `goldStandardRuns` | Resultados de gold standard eval mensual | 730 días | Manual |

## Cloud Storage

| Bucket / prefijo | Contenido | Plazo | Mecanismo |
|---|---|---|---|
| `gs://docenciacartagenaeste-backups/firestore-export/{date}/` | Backup diario completo Firestore | 365 días en Standard → Archive 6 años | Lifecycle GCS (`storage.googleapis.com/lifecycle`) |
| `gs://docenciacartagenaeste-backups/incidents/` | Forenses de incidentes | 6 años | Lifecycle Archive |
| Storage app (no usado por defecto) | Imágenes scan / archivos adjuntos | 90 días | Lifecycle a definir |

## Cloud Logging

| Tipo | Retención |
|---|---|
| Default `_Default` bucket | 30 días (default GCP) |
| `_Required` bucket (Cloud Audit Logs admin) | 400 días (default GCP) |
| Logs custom de askAi | 30 días — suficiente para troubleshooting; metadatos críticos van a Firestore audit log con 365 días |

## Authentication

| Dato | Retención |
|---|---|
| Cuenta Firebase Auth | Activa mientras el usuario no la elimine; tras `auth:delete` borrado inmediato |
| Tokens magic-link | Single-use, expiran 1 hora |
| Refresh tokens | Hasta logout o 30 días de inactividad |

## Sentry

| Dato | Retención | Mecanismo |
|---|---|---|
| Eventos de error scrubbing | 90 días en plan free; 90 días en Team Plus | Sentry default policy |
| Replays / source maps | 30 días | Sentry default |

## Consentimiento de uso

El plazo de retención se comunica al usuario en:
- [Política de privacidad pública](../../privacidad.html)
- [Aviso legal](../../aviso-legal.html)
- Términos al crear cuenta (Firebase Auth → consent screen)

## Procedimiento de purga manual

Para eliminar todos los datos de un usuario tras petición de supresión (RGPD art. 17):

```bash
cd /Users/carlos/cartagenaestewebappSOLIDA/functions
node scripts/purge-user.js <uid>   # script a crear si no existe
firebase auth:delete <uid> --project docenciacartagenaeste
```

Plazo objetivo: 7 días naturales desde la solicitud verificada.

## Verificación

Auditoría trimestral del cumplimiento de TTL:

```bash
# Query Firestore para detectar documentos > plazo
gcloud firestore export gs://docenciacartagenaeste-audit-quarterly --project docenciacartagenaeste
# Inspección manual de fechas de creación más antiguas por colección
```

Resultado documentado en `docs/audits/retention-YYYYQ.md`.

---

*Carlos Galera Román · Cartagenaeste © 2026 · LPI 00765-03096622*
