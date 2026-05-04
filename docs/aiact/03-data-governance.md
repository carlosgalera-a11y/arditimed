# 03 · Data Governance (AI Act art. 10)

## 3.1 Origen de los datos consumidos por el sistema

EvidenciaIA NO entrena modelos propios. Consume **datos públicos** de las siguientes fuentes en tiempo real y los pasa al LLM externo como contexto RAG:

| Fuente | Operador | Naturaleza | Licencia | Uso en EvidenciaIA |
|---|---|---|---|---|
| PubMed | NLM/NIH (USA, autoridad pública) | Citas + abstracts biomédicos | Pública (NLM Terms) | Búsqueda + abstracts → contexto RAG |
| Europe PMC | EMBL-EBI (UE) | Citas + abstracts + full-text OA | Pública | Búsqueda + abstracts |
| OpenAlex | OurResearch (non-profit USA) | Catálogo abierto bibliográfico | CC0 | Búsqueda + cited-by counts |
| Cochrane (vía PubMed dirigido) | Cochrane Collaboration (UK) | Revisiones sistemáticas | Pública vía PubMed | Búsqueda dirigida |
| AEMPS CIMA | AEMPS (Min. Sanidad ES) | Fichas técnicas medicamentos ES | Pública (BOE) | Búsqueda farmacológica |
| ClinicalTrials.gov v2 | NIH (USA) | Registro de ensayos clínicos | Pública | Búsqueda de ensayos |
| CORE | Open University (UK) | Agregador OA | Mixed OA licenses | Búsqueda OA full-text |
| Semantic Scholar | Allen Institute (USA, non-profit) | Catálogo + TLDR-IA | Open Data License | Búsqueda + TLDR enrichment |
| Crossref | Crossref (USA, non-profit) | Metadatos canónicos DOI | CC0 | Enrichment licencia + tipo |
| Unpaywall | OurResearch (non-profit) | Resolución DOI → URL OA | CC0 | Enrichment OA URL |
| medRxiv/bioRxiv (vía Europe PMC) | Cold Spring Harbor (USA) | Preprints biomédicos | CC-BY/CC-BY-NC | Búsqueda preprints (penalizados) |

**Ningún dato del paciente se transfiere a estas fuentes**: solo viaja la pregunta validada por safeguards (sin PII).

## 3.2 Datos personales tratados

EvidenciaIA registra los siguientes datos personales del **profesional sanitario usuario** (no del paciente):

| Dato | Origen | Base legal | Retención |
|---|---|---|---|
| `uid` Firebase Auth | Login Google | Consentimiento (art. 6.1.a RGPD) + interés legítimo (art. 6.1.f) | Mientras la cuenta esté activa |
| Email asociado al login | Google OAuth | Consentimiento | Mismo |
| Pregunta de búsqueda (texto literal validado) | Usuario | Consentimiento + interés legítimo formativo | 24 meses |
| Filtros aplicados | Usuario | Consentimiento | 24 meses |
| Timestamp + duración + provider IA usado | Sistema | Trazabilidad AI Act art. 12 | 24 meses |
| Feedback (👍/👎/etc.) | Usuario | Consentimiento | 24 meses |
| IP (pseudoanonimizada por Firebase) | Sistema | Seguridad (art. 6.1.f) | 30 días en logs Cloud |

**NO se registran**:
- Datos del paciente sobre el que el profesional pregunta (las salvaguardas bloquean DNI/NIE/fecha/teléfono).
- Nombres, NHC, número de cama, diagnóstico individual.
- Datos biométricos, de geolocalización fina, ni cookies de seguimiento publicitario.

## 3.3 Calidad de datos

**Datos de origen** (las fuentes consumidas):
- Aceptamos sin modificar el contenido bibliográfico de las fuentes (son autoridades reconocidas).
- Hacemos **deduplicación por DOI/PMID** antes del rerank para evitar contar dos veces el mismo paper.
- Aplicamos **filtros de calidad estructurales**: rechazar resultados sin título, sin abstract; filtros temporales; tipos de publicación.

**Datos de salida** (lo que el sistema produce):
- Verificación de citas: ratio `verified/emitted` visible al usuario; warning si <umbral.
- Sanitización: citas inválidas marcadas `[cita no verificable]`.
- GRADE heurístico calculado del top-5: trazable, reproducible.

## 3.4 Sesgos identificados y mitigaciones

| Sesgo | Origen | Mitigación |
|---|---|---|
| Anglosajón (PubMed, NIH, NEJM…) | Las grandes bases de datos son USA | Reranker prima Europe PMC + guías ESC/NICE/GuíaSalud; integración AEMPS, MEDES, SciELO, WHO IRIS, Preevid |
| Recencia (papers viejos sub-citados) | Algoritmos de re-ranking favorecen recencia | Penalización configurable; el usuario puede pedir "últimos 20 años" |
| Idiomático (literatura en inglés sub-representa España/Latam) | Indexación PubMed | MEDES + SciELO + Preevid en deep-links |
| Por industria (papers patrocinados sobre-representados) | Publishers comerciales | Bonus en reranker para Cochrane (sin patrocinios), penalización implícita por tipo "case report" |
| Sub-cita de revistas open access | Modelo de citación tradicional | Bonus por OA + bonus por citas (acotado +2) en OpenAlex |
| Modelo IA con sesgo cultural USA | LLMs entrenados en datos web USA | Bias audit harness con escenarios europeos (ver `06-accuracy-robustness.md`) |

## 3.5 Validación de la pregunta del usuario

El input pasa por `safeguards.ts` antes de tocar el modelo:
1. Longitud 15-500 caracteres.
2. Patrones diagnósticos rechazados (regex 6 patrones documentados).
3. Patrones terapéuticos individuales rechazados (regex 5 patrones).
4. Patrones PII rechazados (DNI, NIE, fecha, teléfono español).
5. Sanitización de espacios.

Cualquier rechazo se loguea en `evidencia_consultas` con `motivo_rechazo`.

## 3.6 Transferencias internacionales

| Destino | Operador | Garantía |
|---|---|---|
| `europe-west1` (Bélgica) | Google Cloud / Firebase | UE, sin transferencia |
| PubMed/NIH | USA | Tratado UE-USA Data Privacy Framework + datos NO personales (solo pregunta validada) |
| ClinicalTrials.gov | USA | Idem |
| OpenAlex/Unpaywall/Crossref/Semantic Scholar | USA (non-profit) | Idem |
| DeepSeek API | China (proveedor IA) | Solo se envía pregunta validada SIN PII; configurable; alternativa Gemini/Mistral en `routing.ts` para datos sensibles si fuera necesario |
| Gemini API | UE (Vertex AI europe-west1 cuando disponible) o USA (default) | Configurable |
| Mistral API | Francia (UE) | Sin transferencia |

**Política**: cuando un PROVIDER UE está disponible, se prefiere; pero la pregunta nunca contiene PII por construcción.

## 3.7 Conservación y supresión

- `evidencia_consultas`: 24 meses, luego anonimización (uid → null) o borrado.
- Cuenta de usuario eliminada → todas sus consultas se anonimizan en lote (`functions/src/aggregateDailyMetrics.ts` ya implementa este patrón para otros datos).
- Backups Firestore: 30 días, después borrado automático.
