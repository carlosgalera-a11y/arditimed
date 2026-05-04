# 02 · Risk Assessment (AI Act art. 9)

> Análisis de riesgos del sistema EvidenciaIA. Sigue el modelo ISO 14971 adaptado a sistema IA de riesgo limitado bajo AI Act art. 9. Revisión semestral.

## 2.1 Metodología

- **Severidad**: 1 (insignificante) → 5 (crítica, daño irreversible al paciente).
- **Probabilidad**: 1 (improbable) → 5 (frecuente).
- **Riesgo bruto** = severidad × probabilidad.
- **Riesgo residual** = tras aplicar las mitigaciones implementadas.
- Aceptable cuando residual ≤ 6.

## 2.2 Matriz de riesgos

| # | Riesgo | Sev | Prob | Bruto | Mitigación implementada | Resid |
|---|---|---:|---:|---:|---|---:|
| R-01 | Usuario aplica recomendación a paciente concreto sin verificar | 5 | 4 | 20 | Disclaimer art. 50 obligatorio + checkbox sesión + safeguards rechazan preguntas individuales + badge GRADE recordatorio + chips de verificación deep-link | 6 |
| R-02 | IA inventa cita/referencia (alucinación) | 4 | 3 | 12 | `citationVerifier.ts` post-hoc marca citas inválidas como "[cita no verificable]"; ratio de verificación visible al usuario; warning si ratio<umbral | 4 |
| R-03 | IA tergiversa abstract en la síntesis | 4 | 2 | 8 | Tooltip inline `[n]` muestra abstract original al hover → verificación en flujo; deep-link a fuente; system prompt explícito "sintetiza ÚNICAMENTE el contenido de los abstracts" | 4 |
| R-04 | Sesgo geográfico/idiomático (sub-representación de evidencia europea/española) | 3 | 4 | 12 | Reranker prima Cochrane/NICE/ESC/GuíaSalud; búsqueda dirigida a Cochrane Database Syst Rev; integración Preevid/MEDES/SciELO/AEMPS | 4 |
| R-05 | Filtrado de PII del paciente en la pregunta | 4 | 2 | 8 | Regex pre-validación bloquea DNI/NIE/fecha/teléfono; sanitización `safeguards.ts`; rechazo loguado | 4 |
| R-06 | Exposición de claves IA al cliente | 5 | 1 | 5 | Todas las llamadas IA pasan por Cloud Function `askAi`; secrets en Secret Manager; nunca en frontend; CSP estricto | 2 |
| R-07 | Síntesis sesgada por modelo (gender/edad/etnia) | 4 | 2 | 8 | Bias audit harness (test suite con 30 escenarios canónicos, ver `06-accuracy-robustness.md`); penalización preprints; logging completo para auditoría retrospectiva | 4 |
| R-08 | Preprint sin revisión por pares se confunde con evidencia validada | 3 | 3 | 9 | Badge ⚠️ Preprint rojo + penalización −2 en reranker + sección visualmente diferenciada | 3 |
| R-09 | Fallo de proveedor IA externo (DeepSeek/Gemini/Mistral) | 2 | 4 | 8 | Cadena de fallback en `routing.ts`; respuesta degrada a "solo abstracts re-rankeados" si síntesis falla; errores expuestos en UI | 3 |
| R-10 | Caché Firestore devuelve resultado obsoleto | 2 | 3 | 6 | TTL 24h + hash incluye 15 filtros para invalidar correctamente; cache hit visible en meta-info | 3 |
| R-11 | Sobrecarga de cuota IA (cost overrun) | 2 | 3 | 6 | Cuota dura 50/usuario/día + rate limit 30/min/IP + caché 7d por hash | 2 |
| R-12 | Inyección de prompt vía pregunta del usuario | 3 | 2 | 6 | Pregunta truncada a 500 chars; longitud mínima 15 chars; sanitización; safeguards bloquean intentos de "ignora instrucciones previas"; aislamiento de la pregunta del system prompt | 3 |
| R-13 | Acceso no autorizado a `evidencia_consultas` | 4 | 1 | 4 | Firestore rules: solo Admin SDK puede escribir; lectura solo desde Cloud Function autenticada; App Check enforce | 2 |
| R-14 | Deep-link externo expone PII al destino | 3 | 1 | 3 | Solo se pasa la pregunta validada por safeguards (sin PII); `target=_blank rel=noopener` | 2 |
| R-15 | Modelo IA cambia comportamiento sin previo aviso (proveedor actualiza) | 3 | 4 | 12 | Prompt versioning + logging del modelo concreto utilizado en cada respuesta (ver `09-model-versioning.md`); fallback chain | 6 |

## 2.3 Riesgos residuales aceptados

Todos los riesgos residuales son ≤ 6, aceptable bajo el criterio definido en 2.1. Los más altos (R-01 y R-15 = 6) están mitigados por capas independientes (disclaimer + safeguards + GRADE + verificación humana obligatoria; versioning + fallback) y se vigilan en el log post-market.

## 2.4 Riesgos NO aplicables

- **R-N1** Diagnóstico erróneo automático → N/A: el sistema rechaza preguntas diagnósticas.
- **R-N2** Prescripción incorrecta automática → N/A: el sistema rechaza preguntas terapéuticas individuales.
- **R-N3** Daño físico directo → N/A: software solo, sin actuadores ni dispositivos físicos.
- **R-N4** Discriminación a usuario por origen/género → N/A: el sistema sirve por igual a cualquier usuario autenticado.

## 2.5 Plan de re-evaluación

- **Trigger 1**: cada 6 meses (próximo: 2026-11-04).
- **Trigger 2**: ante cambio sustancial del system prompt, modelo IA primario, o estructura de safeguards.
- **Trigger 3**: tras un incidente reportado (procedimiento en `08-incident-response.md`).
- **Trigger 4**: ante publicación de un acto delegado relevante de la Comisión bajo AI Act.
