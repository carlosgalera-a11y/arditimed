# 07 · Logging & Traceability (AI Act art. 12)

## 7.1 Política de logging

Toda interacción con EvidenciaIA queda registrada en logs estructurados que permiten reconstruir a posteriori:
- Quién consultó (uid).
- Qué preguntó (pregunta validada, sin PII).
- Qué fuentes se consultaron (PubMed/Cochrane/Europe PMC/OpenAlex/CORE/S2/preprints/AEMPS/ClinicalTrials).
- Qué modelo IA + versión de prompt se usaron.
- Qué se devolvió (PMIDs top, citas emitidas/verificadas, GRADE asignado).
- Cuándo y cuánto tardó.
- Si se rechazó, por qué.

## 7.2 Estructura del log `evidencia_consultas`

Campos persistidos en Firestore (collection `evidencia_consultas`):

| Campo | Tipo | Propósito |
|---|---|---|
| `uid` | string | Usuario autenticado (anonimizable a posteriori) |
| `pregunta_original` | string | Pregunta validada (max 500 chars, sin PII) |
| `rechazada` | bool | True si safeguards la bloquearon |
| `motivo_rechazo` | enum | `consulta_diagnostica` / `consulta_terapeutica_individual` / `pii_*` / `demasiado_corta/larga` |
| `fuentes_consultadas` | array | Subconjunto de `[pubmed, cochrane, europepmc, openalex, core, s2, preprints, aemps, clinicaltrials]` |
| `num_abstracts_recuperados` | int | Tras dedup + rerank top-N |
| `abstracts_pmids` | array | PMIDs del top reranqueado |
| `filtros_aplicados` | object | Snapshot de los 15 filtros del usuario |
| `sintetizar` | bool | True si se invocó síntesis IA |
| `pico_query_pubmed` | string | Query PubMed que generó el extractor PICO |
| `pico_provider` | string | Modelo IA usado para PICO |
| `prompt_version_pico` | string | SHA-256 corto del system prompt PICO usado |
| `sintesis_provider` | string | Modelo IA usado para síntesis (provider/model) |
| `sintesis_model` | string | Identificador concreto del modelo |
| `prompt_version_synth` | string | SHA-256 corto del system prompt de síntesis usado |
| `sintesis_citas_emitidas` | int | [n] que el modelo escribió |
| `sintesis_citas_verificadas` | int | [n] que apuntan a fuente real |
| `sintesis_citas_ratio` | float | verified/emitted |
| `sintesis_follow_ups` | int | Número de follow-ups extraídos |
| `evidence_grade` | enum | A / B / C / D / insuficiente |
| `cochrane_count`, `ensayos_count`, `core_count`, `s2_count`, `preprints_count` | int | Contadores por fuente |
| `oa_enrichments`, `tldr_enrichments`, `crossref_enrichments` | int | Contadores de enriquecimiento |
| `cache_hit` | bool | True si se sirvió desde caché |
| `cache_key` | string | Hash SHA-256 del cache key |
| `ai_act_disclaimer_shown` | bool | Siempre true (validado por backend) |
| `duracion_ms` | int | Latencia total |
| `timestamp` | server timestamp | UTC, no manipulable cliente |

## 7.3 Log de feedback `evidencia_feedback`

| Campo | Propósito |
|---|---|
| `uid` | Usuario |
| `consultaId` | FK a `evidencia_consultas` |
| `tipo` | `util` / `incorrecto` / `cita_falsa` / `sesgo` |
| `texto_libre` | Comentario opcional |
| `timestamp` | UTC |

## 7.4 Logs operacionales

- **Cloud Logging (`functions.log`)**: cada llamada a `evidenciaSearch` emite `evidenciaSearch.ok` con counts de cada provider y duración. Errores emiten `evidencia.<provider>.failed`.
- **Sentry**: errores no manejados, sampling 100% en producción.
- **GA4**: eventos custom `evidencia_consulta`, `evidencia_query_rechazada`, `evidencia_feedback`, `evidencia_pdf_export`, `evidencia_followup_click`. Sin PII.

## 7.5 Retención

| Log | Retención | Borrado |
|---|---|---|
| `evidencia_consultas` (Firestore) | 24 meses | Anonimización (uid→null) o borrado tras eliminación de cuenta |
| `evidencia_feedback` | 24 meses | Idem |
| Cloud Logging | 30 días default Firebase | Auto |
| Sentry | 90 días | Auto |
| GA4 | 14 meses (max permitido GA4 EU) | Auto |
| Backups Firestore | 30 días | Auto |

## 7.6 Acceso a los logs

- **Responsable** (Carlos): acceso completo vía Firebase Console + Admin SDK + dashboard `/admin-dashboard.html`.
- **Usuario**: acceso a sus propias consultas (futuro: panel "mi historial"; actual: bajo demanda vía formulario derechos RGPD).
- **Autoridades** (AEPD, AEMPS): acceso bajo requerimiento legal escrito.
- **Auditores externos**: acceso bajo NDA y propósito explícito.

## 7.7 Inmutabilidad

Los logs en `evidencia_consultas` se escriben con `Admin SDK` y las Firestore Rules prohíben modificación post-creación. Cualquier intento de borrado por el responsable queda en el audit log de Firebase.

## 7.8 Reproducibilidad

Combinando los campos `pregunta_original` + `filtros_aplicados` + `prompt_version_*` + `sintesis_provider`/`model` + `cache_key`, una consulta es reproducible (modulo cambios en las fuentes externas y comportamiento del modelo IA externo).

El campo `prompt_version_*` se calcula como `sha256(SYSTEM_PROMPT)[:12]` y permite vincular cada respuesta a la versión exacta del prompt en uso (ver `09-model-versioning.md`).
