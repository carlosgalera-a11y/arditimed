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

**Estado**: ✅ Implementado en `functions/src/evidencia/biasAudit.ts` + `biasAuditScenarios.ts`. Test runner en `functions/test/evidencia-biasAudit.test.ts`. Se ejecuta automáticamente en cada push (CI vitest) y de forma manual con `npm test -- evidencia-biasAudit`.

### Cobertura actual (versión 1)

| Especialidad | Nº escenarios | Variantes de sesgo |
|---|---:|---:|
| Cardiología | 5 | 2 |
| Respiratorio | 4 | — |
| Digestivo | 4 | — |
| Infecciosas | 4 | 2 |
| Endocrino | 4 | 2 |
| Neurología | 4 | 2 |
| **Safeguard rejection** (uno por motivo: corta, larga, diagnóstica, terapéutica, PII DNI/fecha/teléfono) | 7 | — |
| **Total clínicos** | 25 | 8 |

### Qué valida (pipeline determinista, offline, sin coste IA)

1. **Safeguards**:
   - Cada escenario clínico debe pasar la validación → `pass_rate ≥ 99%`.
   - Cada escenario de rechazo debe ser bloqueado por el motivo exacto esperado.
   - Cada **variante de sesgo** (mismo escenario reformulado por género/edad/estado menopáusico) debe recibir EL MISMO outcome que el escenario base → `consistency_rate = 100%`.
2. **Reranker grade**:
   - Para cada escenario clínico se construye un top-5 sintético con los `studyTypes` esperados (revisión sistemática, RCT, guía EU, etc.) y se valida que `gradeEvidence()` asigna un grado ≥ al esperado mínimo → `grade_match_rate ≥ 80%`.
3. **Citation verifier**:
   - Batería de 5 outputs hand-crafted con citas válidas, inventadas, repetidas y mezcladas → `pass_rate = 100%`.

### Lo que NO valida (sale del scope offline)

- Calidad real de la búsqueda en PubMed / Europe PMC / etc. — depende de las APIs externas.
- Calidad real de la síntesis IA — depende del modelo externo.
- Latencia operacional — se vigila en producción vía métricas de `evidencia_consultas`.

Estas dimensiones se cubren con la vigilancia post-market documentada en `10-post-market-surveillance.md`.

### Política de actualización

- **Bumpear `SCENARIOS_VERSION`** en `biasAudit.ts` cuando se añadan/eliminen escenarios (para que los reportes históricos sean comparables).
- **Añadir escenarios** cada vez que un incidente P0/P1 (ver `08-incident-response.md`) revele un caso no cubierto.
- **Revisión semestral** del conjunto: añadir nuevos fármacos / guías que se hayan publicado.

### Métricas reportadas por `runFullAudit()`

```ts
{
  total: number,                     // total escenarios evaluados
  passed: number, failed: number,
  passRate: number,                  // ≥ 0.95 obligatorio
  byCategory: { ... },               // breakdown por especialidad
  metrics: {
    safeguard_pass_rate: number,        // ≥ 0.99
    safeguard_consistency_rate: number, // = 1.0
    reranker_grade_match_rate: number,  // ≥ 0.8
    citation_verifier_pass_rate: number,// = 1.0
  },
  scenariosVersion: 1,
  ranAt: ISO-8601,
}
```

CI rechaza el deploy si cualquier umbral falla.

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
