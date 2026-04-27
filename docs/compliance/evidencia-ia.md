# EvidenciaIA · ficha de cumplimiento EU AI Act

**Módulo:** EvidenciaIA · búsqueda bibliográfica clínica con síntesis IA y citas verificadas.
**Fecha:** 2026-04-27.
**Autor / proveedor:** Carlos Galera Román · Reg. PI 00765-03096622.
**Hosting:** Cloud Functions europe-west1 + GitHub Pages (`area2cartagena.es`).

---

## 1. Clasificación regulatoria

| Aspecto | Encuadre |
|---|---|
| Clasificación AI Act | **Riesgo limitado (art. 50)** — sistema de IA generativa con interacción directa con usuario profesional. |
| ¿Es sistema de alto riesgo (art. 6)? | **No.** No participa en decisión clínica, no clasifica pacientes, no triagea, no recomienda tratamiento. |
| ¿Dispositivo médico (MDR 2017/745)? | **No.** Búsqueda bibliográfica formativa, sin reclamo diagnóstico ni terapéutico. |
| Base jurídica RGPD | Art. 6.1.f (interés legítimo del profesional sanitario en formación continua). |
| Datos personales tratados | UID Firebase (autenticación), texto libre de la pregunta. **No se aceptan datos de paciente** — los safeguards los rechazan. |

---

## 2. Obligaciones cumplidas (art. 50)

### a) Aviso de transparencia visible y obligatorio

El usuario debe marcar el checkbox **"He leído el aviso y entiendo que EvidenciaIA es una herramienta de búsqueda bibliográfica formativa"** antes de poder buscar. La Cloud Function rechaza con `failed-precondition` si la flag `ai_act_disclaimer_shown` no llega a `true`.

Texto literal del aviso (`evidencia-ia.html`):
> ⚠️ Aviso de transparencia (EU AI Act art. 50). Este sistema usa IA para extraer la pregunta PICO y para sintetizar abstracts. La síntesis NO constituye diagnóstico ni recomendación terapéutica para un paciente concreto. Cada cita debe verificarse en la fuente original antes de aplicarla. El sistema rechaza preguntas que pidan diagnóstico/tratamiento individual.

### b) Output marcado como generado por IA

- Header del módulo: badges `Beta · UE · Art. 50`.
- Footer de cada respuesta: provider/model usado + ratio de citas verificadas.
- Citas inventadas se sustituyen por marca visible `[cita no verificable]` (`citationVerifier.ts`).

### c) Trazabilidad (art. 12 — aplicable también a riesgo limitado por buena práctica)

Cada consulta se registra en Firestore `/evidencia_consultas` con:
- `uid`, `pregunta_original`, `rechazada` (bool), `motivo_rechazo` si aplica.
- `fuentes_consultadas: ['pubmed','europepmc','aemps']`.
- `num_abstracts_recuperados`, `abstracts_pmids`.
- `pico_query_pubmed`, `pico_provider`.
- `sintesis_provider`, `sintesis_model`, `sintesis_citas_emitidas`, `sintesis_citas_verificadas`, `sintesis_citas_ratio`.
- `ai_act_disclaimer_shown: true` (siempre).
- `duracion_ms`, `timestamp` server.

Retención: 24 meses; pseudonimización (drop de `pregunta_original`) tras 6 meses (script `aggregateDailyMetrics` o cron dedicado a definir).

---

## 3. Safeguards (defensas activas)

`functions/src/evidencia/safeguards.ts` rechaza con `HttpsError invalid-argument`:

- **Consultas diagnósticas individuales** ("qué tiene mi paciente", "tiene cáncer", etc.).
- **Consultas terapéuticas individuales** ("qué dosis le pongo", "es urgente operar", etc.).
- **PII detectada**: DNI, NIE, fecha en formato dd/mm/yyyy, teléfono español de 9 dígitos.
- **Longitud fuera de rango**: <15 o >500 caracteres.

Cada rechazo se loguea en `/evidencia_consultas` con `rechazada: true` y el `motivo` para auditoría.

System prompt del RAG synthesizer (`ragSynthesizer.ts`) incluye fallback explícito:
> Si la pregunta solicita diagnóstico o tratamiento de un paciente concreto, responde: "Esta consulta requiere juicio clínico individualizado y queda fuera del alcance de EvidenciaIA. Te puedo ayudar a buscar evidencia sobre [reformulación general]."

---

## 4. Arquitectura técnica (resumen)

```
Cliente (evidencia-ia.html)
  │
  │  httpsCallable('evidenciaSearch', {pregunta, filtros, sintetizar, ai_act_disclaimer_shown})
  ▼
Cloud Function europe-west1 (evidenciaSearch.ts)
  ├─ safeguards.validarPregunta()
  ├─ [opt] picoExtractor.extractPico() ──► routing.tryProviderChain (DeepSeek/Gemini)
  ├─ Promise.all([searchPubmed, searchEuropePMC, searchAemps?])
  ├─ reranker.rerank() — sesgo europeo
  ├─ [opt] ragSynthesizer.synthesize() ──► routing.tryProviderChain
  │     └─ citationVerifier.verifyCitations()
  ├─ Firestore /evidencia_consultas (Admin SDK, write-only-server)
  └─ return {fuentes, pico, sintesis, meta}
```

Secretos en Google Secret Manager:
- `DEEPSEEK_API_KEY`, `OPENROUTER_API_KEY` (reusados de `askAi`).
- `NCBI_API_KEY` (opcional, sube rate limit PubMed 3→10 req/s).

---

## 5. Métricas y observabilidad

GA4 events emitidos desde `evidencia-ia.html`:
- `evidencia_consulta` — `{num_fuentes, modelo, duracion_ms, sintetizar}`.
- `evidencia_feedback` — `{tipo: util|incorrecto|cita_falsa|sesgo, consulta_id}`.
- `evidencia_query_rechazada` — `{motivo}`.

Sentry (vía `sentry-init.js`): captura excepciones del frontend.
Cloud Logging: `evidenciaSearch.ok`, `evidencia.pico.failed`, `evidencia.synth.failed`, `evidencia.log.failed`.

KPIs a monitorizar:
- Ratio citas verificadas / emitidas (objetivo ≥0.85). Si baja en 5 consultas seguidas, degradar al modelo siguiente del fallback chain.
- Tasa de rechazo por safeguards (objetivo ≥1% — confirma que los safeguards se disparan).
- Latencia p95 (objetivo <25 s en flujo `sintetizar:true`).

---

## 6. Roadmap (fuera de alcance v1)

- Cochrane Library API (requiere licencia institucional).
- OpenAlex como segunda fuente abierta.
- Exportar respuesta + fuentes a PDF firmado para incorporar a un caso del MegaCuaderno IA.
- Cache de consultas idénticas (hash de pregunta normalizada → cacheKey). Reduciría coste IA y latencia.
- Comparación A/B contra OpenEvidence en preguntas tipo MIR (con anotación de experto).

---

## 7. Plan de evaluación pre-promoción a producción

10 preguntas reales (medicina interna, urgencias, AP, pediatría, ginecología, cardiología). Criterios:
- 10/10 devuelven síntesis estructurada con ≥2 citas verificadas.
- 0/10 preguntas diagnósticas/terapéuticas individuales aceptadas.
- Tiempo medio de respuesta < 25 s en flujo completo.
- Ratio citas verificadas ≥ 0.85 en media de las 10.
- Disclaimer Art. 50 visible sin scroll en mobile (375px) y desktop.

Resultados a documentar en `docs/compliance/evidencia-ia-eval-{YYYY-MM-DD}.md` antes de retirar el badge "Beta".
