# EU AI Act · Dossier ejecutivo · Cartagenaeste

**Reglamento (UE) 2024/1689 del Parlamento Europeo y del Consejo de 13 de junio de 2024**
**Documento ejecutivo · resumen para inversores, partners y auditores**

---

| Campo | Valor |
|---|---|
| Sistema | Cartagenaeste · Asistente formativo con IA |
| URL | https://area2cartagena.es |
| Proveedor | Carlos Galera Román · RPI 00765-03096622 |
| Fecha | 2026-04-26 |
| Estado obligaciones | Sistema NO de alto riesgo, NO prohibido. Aplican obligaciones de transparencia (art. 52). |

## 1. Clasificación según el AI Act

### 1.1 Análisis de riesgo

El AI Act clasifica los sistemas en cuatro niveles. Cartagenaeste cae en **riesgo limitado** porque:

| Categoría AI Act | Aplica a Cartagenaeste | Motivo |
|---|---|---|
| **Prohibido** (art. 5) | ❌ No | No realiza scoring social, manipulación subliminal, identificación biométrica remota, etc. |
| **Alto riesgo Anexo III §5** (acceso a servicios sanitarios) | ❌ No | No es dispositivo médico bajo MDR (no diagnóstica, no prescribe). Posicionamiento formativo declarado y trazado en disclaimer permanente. |
| **Alto riesgo Anexo III §1** (gestión infraestructura crítica) | ❌ No | No gestiona infra crítica. |
| **Riesgo limitado** (art. 50, 52) | ✅ Sí | Interactúa con humanos a través de IA. **Obligación: avisar al usuario que está interactuando con IA**. |
| **Riesgo mínimo** | parcialmente | Calculadoras y módulos no-IA quedan aquí. |

### 1.2 Justificación de la clasificación "riesgo limitado"

- **Posicionamiento formativo, no diagnóstico**: declarado en footer permanente (`footer-global.js`), CLAUDE.md, LICENSE y dossier comercial.
- **Supervisión humana obligatoria**: ningún output de IA actúa sobre paciente sin que un profesional sanitario lo revise. La IA **sugiere**, el médico **decide**.
- **No clasificable como producto sanitario**: no entra en el alcance del MDR (Reglamento 2017/745) en su uso actual. Análisis CE/MDR detallado en [docs/legal/ce-mdr-analysis.md](ce-mdr-analysis.md).

### 1.3 Reclasificación si cambia el alcance

Si Cartagenaeste evolucionara para:
- Sugerir diagnósticos a profesionales como ayuda decisional clínica directa, o
- Procesar imágenes médicas con conclusión diagnóstica autónoma, o
- Actuar como dispositivo médico bajo MDR

→ pasaría a **alto riesgo Anexo III §5** y requeriría:
- Sistema de gestión de calidad (art. 17).
- Documentación técnica completa Anexo IV.
- Conformity assessment + marcado CE.
- Registro en base de datos UE de sistemas de IA.
- Vigilancia post-comercialización.

## 2. Obligaciones aplicables (riesgo limitado)

### 2.1 Transparencia (art. 50, 52)

| Obligación | Implementación actual | Evidencia |
|---|---|---|
| Informar al usuario de que interactúa con un sistema de IA | ✅ Disclaimer permanente en footer + en cada respuesta IA | `footer-global.js`, todos los HTMLs |
| Etiquetar contenido generado/modificado por IA | ✅ Cada respuesta IA marcada en UI con icono y disclaimer "Generado con IA · Uso exclusivamente docente" | `ai-client.js`, casos clínicos, MegaCuaderno |
| Etiquetar deepfakes / contenido sintético | N/A | No se generan deepfakes |
| Detección de emociones / categorización biométrica | N/A | No se usa |

### 2.2 Buenas prácticas voluntarias (art. 95)

Aunque no obligatorias para "riesgo limitado", se aplican voluntariamente por reputación y preparación:

- ✅ Trazabilidad: audit log inmutable (`auditLogs/{tenantId}/{collection}/{docId}`).
- ✅ Robustez: chain de fallback con 5 proveedores.
- ✅ Supervisión humana: revisión manual de casos clínicos guardados, función `goldStandardEval` mensual.
- ✅ Cibersegurirad: App Check enforce, firestore rules deny-by-default, gitleaks en CI.
- ✅ Datos: pseudonimización (iniciales máx 4 chars, no DNI/NIE/NHC), residencia UE en `europe-west1`.

## 3. Modelos de IA usados (registro de proveedores)

| Modelo | Proveedor | Routing | Residencia datos | Uso |
|---|---|---|---|---|
| DeepSeek V3 paid | DeepSeek (CN) vía OpenRouter (US/EU) | OpenRouter routing variable | No garantizada UE | Casos clínicos, educational |
| Gemini 2.5 Flash-Lite | Google Cloud (Vertex AI EU) | Directo si secret presente, fallback OpenRouter | UE garantizada (directo) | Educational fallback |
| Qwen 2.5-VL-72B | Alibaba (DashScope Intl) | OpenRouter o directo | No garantizada UE (DashScope Intl) | Visión ScanIA |
| Mistral Small 3.2 | Mistral AI (FR) | Directo si secret, fallback OpenRouter | UE garantizada (directo) | Casos clínicos fallback |
| Anthropic Claude Haiku 4.5 | Anthropic (vía AWS Bedrock o Vertex AI EU) | No usado por defecto, opcional | UE disponible | Reservado |

**Notas EU residency**:
- DeepSeek vía OpenRouter no garantiza routing a servidores UE — los datos pueden cruzar a US/CN.
- Para data EU-residency estricta se debe configurar `GEMINI_API_KEY` o `MISTRAL_API_KEY` y forzar `modelOverride` que dirija a esos providers.
- Procesado: solo el prompt del médico (sin PII) y la respuesta IA.

## 4. Análisis de riesgos (Risk Management System equivalent)

Inventario de riesgos potenciales y sus mitigaciones, en formato AI Act art. 9:

| ID | Riesgo | Severidad | Probabilidad | Mitigación |
|---|---|---|---|---|
| AI-01 | IA produce respuesta clínicamente incorrecta usada en decisión real | Alta | Media | Disclaimer + supervisión humana obligatoria + posicionamiento formativo |
| AI-02 | Hallucination de fuente / cita inexistente | Media | Media | Footer "verificar siempre con fuente oficial" + futuro RAG con fuentes citadas |
| AI-03 | Sesgo demográfico (entrenamiento occidental → menor calidad para minorías) | Media | Media | A documentar en gold standard eval mensual; advertir en MegaCuaderno |
| AI-04 | Fuga de PII clínica al provider IA | Alta | Baja | Validador `validatePrompt()` rechaza DNI/NIE/NHC/nombres; iniciales solo |
| AI-05 | Provider IA cae 24h | Baja | Media | Cadena fallback 5 proveedores + cache 7d + disclaimer "no es producto sanitario" |
| AI-06 | Coste descontrolado por abuso (scraper / bot) | Media | Baja | App Check + rate limit IP + cuota/usuario |
| AI-07 | Adversarial prompt injection | Media | Baja | systemPrompt fijado server-side, prompt usuario validado, no se ejecuta código |
| AI-08 | Dependencia de provider único (cierre, sanción) | Alta | Baja | 5 proveedores con fallback automático; planes de migración |

Riesgos completos en [docs/legal/scan-ai-risk-register.md](scan-ai-risk-register.md) (más detalle por feature).

## 5. Conformidad continua

| Control | Frecuencia | Responsable | Evidencia |
|---|---|---|---|
| Revisión de la clasificación de riesgo | Trimestral | Carlos Galera | Doc fechado |
| Revisión de proveedores y residencia datos | Trimestral | Carlos Galera | Tabla §3 actualizada |
| Auditoría de logs IA | Continuo | Cloud Monitoring + Sentry | `dashboard-cartagenaeste-prod.json` |
| Revisión del sistema de cuotas y abuso | Mensual | Carlos Galera | Métricas en admin-dashboard |
| Gold standard eval (calidad respuestas) | Mensual | `goldStandardEval` función | Firestore `goldStandardRuns/` |
| Test de integridad del disclaimer | Continuo | regex-pii-check.yml | CI failure si falta |

## 6. Obligaciones del despliegue (Carlos)

- ✅ Disclaimer formativo permanente desplegado.
- ✅ Trazabilidad activa (audit log inmutable).
- ✅ Documentación técnica versionada (`docs/legal/`).
- ✅ Plan de retención de datos (`docs/legal/data-retention-policy.md`).
- ⏳ Conformity self-declaration en sede pública (próxima publicación).
- ⏳ Si se firma con primera institución sanitaria: contractual SLA + compromiso de notificación de incidentes.

## 7. Si la clasificación cambia (escalada a alto riesgo)

Documento de transición pre-redactado en [docs/legal/ai-act-high-risk-transition-plan.md](ai-act-high-risk-transition-plan.md) (a redactar si decisión MDR cambia el posicionamiento). Contendría:

- Sistema de gestión de calidad ISO 13485 mínimo.
- Documentación técnica Anexo IV completa.
- Notified body para conformity assessment.
- Marcado CE.
- Inscripción en EUDAMED y base de datos AI Act.
- DPO designado formalmente.
- Plan de vigilancia post-mercado.

## 8. Anexos relacionados

- [ai-technical-file.md](ai-technical-file.md) — ficha técnica completa art. 11 EU AI Act.
- [ehds-readiness.md](ehds-readiness.md) — preparación European Health Data Space.
- [scan-ai-risk-register.md](scan-ai-risk-register.md) — registro de riesgos ScanIA.
- [ce-mdr-analysis.md](ce-mdr-analysis.md) — análisis MDR / dispositivo médico.
- [data-retention-policy.md](data-retention-policy.md) — política de retención de datos.
- [rgpd-rat.md](rgpd-rat.md) — Registro de Actividades de Tratamiento.
- [rgpd-eipd.md](rgpd-eipd.md) — Evaluación de Impacto de Protección de Datos.

---

*Documento ejecutivo · Carlos Galera Román · Cartagenaeste © 2026 · LPI 00765-03096622*
