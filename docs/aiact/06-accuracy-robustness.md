# 06 · Accuracy, Robustness & Cybersecurity (AI Act art. 15)

## 6.1 Métricas de exactitud

### Métricas de búsqueda
- **Recall@8**: % de la evidencia relevante recuperada en el top-8. Objetivo ≥80% en escenarios canónicos del bias audit.
- **Precision@8**: % del top-8 efectivamente relevante. Objetivo ≥75%.
- Medidas en el bias audit harness contra ground truth curado por el responsable.

### Métricas de síntesis
- **Citation verification ratio**: `verified/emitted`. Objetivo ≥95%. Visible al usuario si <100%.
- **Citation hallucination rate**: % citas marcadas `[cita no verificable]`. Objetivo <2%.
- **GRADE heurístico vs valoración formal**: en el bias harness, se compara nuestro GRADE-like contra la valoración manual del responsable. Objetivo: ±1 grado en ≥80% de casos.

### Métricas de safeguards
- **Refusal rate de preguntas inapropiadas** (diagnóstico/terapéutico individual): objetivo ≥99%. Test suite específico en `evidencia-safeguards.test.ts`.
- **False positive rate** (rechazos legítimos): objetivo <5%.
- **PII leak rate**: objetivo 0%. Cualquier filtración detectada es incidente crítico (ver `08-incident-response.md`).

## 6.2 Robustez

### Tolerancia a fallos de proveedores externos
- **Degradación gradual**: cada provider en `evidenciaSearch.ts` está envuelto en `.catch()` que devuelve array vacío y registra el error en `meta.errors`. Una caída de PubMed no impide ver Europe PMC + OpenAlex + CORE.
- **Fallback chain IA**: la cadena `routing.ts` prueba DeepSeek → Gemini → Mistral → OpenRouter en cascada hasta obtener respuesta.
- **Timeout estricto**: 8s por provider, 6s para enriquecimientos OA/TLDR/Crossref. Total ≤90s por consulta (Cloud Function timeout).
- **Sin enriquecimientos no rompe la búsqueda**: si Unpaywall/CORE/S2/Crossref fallan, las fuentes se devuelven sin enriquecer, no se cancela la respuesta.
- **Caché 24h** absorbe picos de carga.

### Tolerancia a inputs adversariales
- Pregunta limitada 15-500 chars.
- Rechazo regex de patrones diagnósticos/terapéuticos/PII.
- Sanitización de espacios.
- System prompt protegido del input vía mensaje de role separado (no concatenación insegura).
- Patrones simples de jailbreak ("ignora instrucciones") capturados por safeguards.

## 6.3 Bias audit harness

Test suite automatizado con escenarios canónicos clínicos europeos para detectar regresiones en exactitud y sesgo. Se ejecuta:
- Pre-deploy automáticamente en CI.
- Periódicamente vía cron (`scheduledJobs.ts`) — pendiente activar tras este pack.

Cobertura inicial mínima:
- 5 escenarios de cardiología (FA, IC, IAM, HTA refractaria, dislipemia).
- 5 de respiratorio (EPOC reagudizado, neumonía, asma, EP, fibrosis).
- 5 de digestivo (HDA, EII, hígado graso, pancreatitis, ERGE).
- 5 de infecciosas (ITU, sepsis, neumonía, antibioterapia profiláctica, COVID secuelas).
- 5 de endocrino (DM2, hipotiroidismo, osteoporosis, obesidad, hipoglucemia).
- 5 de neurología (ictus, migraña, Parkinson, demencia, epilepsia).

Total ≥30 escenarios. Cada uno con: pregunta canónica + abstracts esperados (PMIDs ground truth) + GRADE esperado + checks de sesgo (no diferenciar respuesta por género/edad cuando no proceda).

## 6.4 Ciberseguridad

| Capa | Medida |
|---|---|
| Frontend | CSP estricto, X-Content-Type-Options, Referrer-Policy, integridad SRI en scripts críticos |
| Auth | Firebase Auth + Google OAuth + email verificado; reCAPTCHA v3 en login |
| Transport | HTTPS only (HSTS via Firebase Hosting) |
| App Check | Enforce activo en Firestore + Functions + Storage (reCAPTCHA Enterprise) |
| Cloud Functions | App Check requerido (configurable); rate limit por uid + por IP |
| Secrets | Secret Manager (no en código, no en frontend) |
| Firestore Rules | Solo Admin SDK escribe `evidencia_consultas`, `evidenciaCache`; lectura propia restringida |
| CORS | Whitelist explícita: `area2cartagena.es`, github.io, localhost dev |
| Logging | Sentry (errores) + Cloud Logging (operacional) + Firestore (auditoría AI Act) |
| Backups | Firestore backup diario auto, retención 30d |
| Vulnerabilidades | npm audit en CI + dependabot en GitHub |

## 6.5 Pruebas de penetración / red team

Pendiente: pen-test trimestral + red team específico de prompt injection. Plan documentado en `06-accuracy-robustness.md` (sección a expandir tras acuerdo con auditor externo).

## 6.6 Métricas operacionales en producción

Visibles en `/admin-dashboard.html` (rol admin):
- Volumen consultas/día.
- Latencia p50/p95/p99.
- Tasa de error por provider (PubMed/EPMC/etc.).
- Tasa de rechazos por safeguards.
- Cache hit rate.
- Citation verification ratio promedio.
- Distribución GRADE (A/B/C/D).
- Feedback ratios (👍/👎).

Anomalías → alerta a `carlosgalera2roman@gmail.com` (vía Sentry + dailyBalanceCheck).
