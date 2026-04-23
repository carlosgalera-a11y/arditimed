# EHDS Readiness · Cartagenaeste

**Reglamento (UE) 2025/327 · Espacio Europeo de Datos Sanitarios**
**Versión:** 1.0 · 2026-04-23
**Autor:** Carlos Galera Román
**Última revisión:** 2026-04-23
**Próxima revisión programada:** 2026-10-23 (o al activarse cualquier categoría EHDS)

---

## 0. Propósito

Este documento establece la posición de Cartagenaeste frente a los dos pilares del EHDS (uso primario y secundario) y frente al EU AI Act 2024/1689 (obligaciones desde 2026-08). Sirve como:

1. **Carta interna** que fija el posicionamiento regulatorio del proyecto.
2. **Anexo técnico** para dossiers comerciales, HONcode y propuestas como AstraZeneca.
3. **Mapa de acciones** con prioridades y fechas.

---

## 1. TL;DR · una línea por norma

| Norma | Aplicabilidad a Cartagenaeste hoy | Fecha crítica |
|---|---|---|
| RGPD (UE) 2016/679 + LOPDGDD 3/2018 | ✅ Sí · ya cumplimos (datos UE, pseudo-identificadores, App Check) | Vigente |
| EHDS (UE) 2025/327 · uso primario (EHR) | 🟡 No somos EHR. Preparar FHIR export por si el SMS integra | 2027-03-26 |
| EHDS · uso secundario (investigación/IA) | 🟡 Posibilidad de registrarse como data user futuro | 2027-03-26 |
| EHDS · imagen médica + laboratorio | 🟡 Escaneo IA es la categoría más sensible | 2029-03-26 |
| EHDS · wellness apps y datos no-EHR | 🟡 PWA con datos de usuario propio | 2031-03-26 |
| EU AI Act · alto riesgo sanitario | 🔴 Prioridad · 4 meses para cumplir | **2026-08-02** |
| MDR 2017/745 (Reglamento Productos Sanitarios) | ✅ Posicionamiento "formativo" nos excluye (validado con abogado) | Vigente |
| LSSI-CE 34/2002 | ✅ Web comercial con aviso legal | Vigente |

---

## 2. Matriz de aplicabilidad EHDS por módulo

Sintaxis: 🟢 aplica/preparado · 🟡 aplica-pendiente · 🔴 aplica-crítico · ⚪ no aplica.

| Módulo | Uso primario EHR | Uso secundario | Imagen médica | Laboratorio | Wellness | Notas |
|---|---|---|---|---|---|---|
| **Autenticación Firebase** | ⚪ | ⚪ | ⚪ | ⚪ | 🟢 | Firebase Auth · UE |
| **Protocolos clínicos** | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | Documentos públicos sin datos paciente |
| **Fichas consulta rápida** | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | Contenido estático |
| **Calculadoras** | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | Input no se persiste |
| **Vademécum** | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | Contenido estático |
| **Plantillas de informes** | 🟡 | ⚪ | ⚪ | ⚪ | ⚪ | Producen texto que el clínico pega en HCE — no somos HCE |
| **Casos docentes (cases)** | ⚪ | 🟡 | ⚪ | ⚪ | 🟡 | Pseudonimizados (iniciales+edad+cama). Nunca conectado a HCE real |
| **Guardia-notas (guardia_pacientes)** | ⚪ | ⚪ | ⚪ | ⚪ | 🟡 | Organizador personal del clínico. No es EHR |
| **Triaje IA** | ⚪ | 🟡 | ⚪ | ⚪ | 🟢 | Input libre por clínico. Pseudo-ids sólo |
| **Scan IA (dermatología, Rx, ECG, eco)** | ⚪ | 🟡 | 🔴 | ⚪ | 🟢 | **Categoría EHDS de mayor exposición** |
| **Informes IA** | 🟡 | ⚪ | ⚪ | ⚪ | ⚪ | Output se pega en HCE por el clínico (exportación, no integración) |
| **Dashboard admin** | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | Datos agregados sin identificadores |

### Conclusión

Mientras Cartagenaeste se mantenga **"formativa y organizador personal"** y **no conecte a un EHR real del SMS**, estamos fuera del alcance de EHDS como sistema-EHR. El módulo más expuesto es el **Scan IA** (imagen médica + análisis diagnóstico asistido), que cae simultáneamente bajo EHDS 2029 y EU AI Act 2026.

---

## 3. EU AI Act · acción inmediata (4 meses)

### 3.1 Art. 9 · Gestión de riesgos

- [x] `docs/security-audit-2026-04-21.md` cubre riesgos generales.
- [ ] **Pendiente**: tabla específica de riesgos del Scan IA en `docs/legal/scan-ai-risk-register.md` con: falsos positivos de melanoma, sesgo por fototipo de piel en ISIC, errores de lectura ECG con líneas base artefactadas, limitaciones del modelo `xresnet1d101`.

### 3.2 Art. 10 · Calidad de datos

Como usuario de modelos de terceros (Qwen, Gemini, DeepSeek), documentamos la cadena pero **no entrenamos**. Art. 10 aplicable de forma atenuada.

- [x] Cadena de proveedores documentada en [routing.ts](../../functions/src/routing.ts).
- [x] Datasets de entrenamiento referenciados en `SCAN_MODELS` (ISIC, CheXpert, PTB-XL, MURA, EchoNet).
- [ ] **Pendiente**: mencionar explícitamente en la ficha técnica (§3.3) las limitaciones conocidas.

### 3.3 Art. 11 · Ficha técnica (documentación)

- [ ] **Pendiente**: `docs/legal/ai-technical-file.md` con:
  - Propósito del sistema.
  - Arquitectura (frontend PWA + askAi Cloud Function + cadena de proveedores).
  - Categorías de input esperado.
  - Limitaciones conocidas por tipo (derma, torax, osea, abdomen, ecg, eco).
  - Métricas de rendimiento (benchmarks publicados de cada modelo).
  - Procedimiento de actualización y versionado.

### 3.4 Art. 12 · Logs

- [x] `users/{uid}/aiRequests` registra: `type`, `provider`, `model`, `latencyMs`, `cacheHit`, `tokensIn`, `tokensOut`, `costEstimateEur`, `promptHash`, `createdAt`. **Retención actual**: indefinida (recomendación AI Act: mínimo 6 meses).
- [x] `scan_uploads` registra desde 2026-04-23: `modelVersion`, `promptHash`, `clinicianDecision`, `decidedAt`.
- [x] Sentry para errores de runtime.
- [ ] **Pendiente**: política de retención explícita (6 meses mínimo, ≤24 meses por minimización).

### 3.5 Art. 13 · Transparencia al usuario

- [x] Banner permanente en Scan IA: "HERRAMIENTA DOCENTE · EU AI Act 2024/1689".
- [x] Ficha del modelo visible antes del análisis (SCAN_MODELS).
- [x] Disclaimer formativo en footer global.
- [ ] **Pendiente**: línea explícita con "Modelo usado: X · Región: Y · Tasa de error reportada: Z%" al completarse el análisis.

### 3.6 Art. 14 · Supervisión humana

- [x] Desde 2026-04-23 el resultado del Scan IA incluye **checkbox obligatorio** "Yo, el clínico, asumo la decisión final" + botones aceptar/rechazar/ignorar que se registran en `scan_uploads` con timestamp.
- [x] Aviso de supervisión humana en el banner EU AI Act.

### 3.7 Art. 71 · Registro en EU database de sistemas de alto riesgo

- [ ] **Decisión pendiente** (abogado): ¿Cartagenaeste cae en Anexo III del AI Act (alto riesgo sanitario) o bajo la excepción por "sistema formativo no diagnóstico"? Si cae en Anexo III, registrar en la base de datos europea.
- Argumento para excepción: el sistema no toma decisiones autónomas sobre tratamientos; el clínico siempre firma la decisión (art. 14 supervisión humana); posicionamiento público es formativo.
- Argumento a favor de registrarse: conservador, cumple aun sin necesidad estricta, da tranquilidad contractual.

---

## 4. EHDS · preparación gradual 2027-2031

### 4.1 FHIR R4 export (oportunidad)

Aunque no somos EHR, si el SMS/Área II quiere integrar Cartagenaeste con su HCE corporativo, exigirán **FHIR R4 + IPS (International Patient Summary)**.

- [ ] **Pendiente**: endpoint `/export/fhir` (Cloud Function) que convierta `users/{uid}/cases` a recursos FHIR (Patient, Observation, DiagnosticReport, ImagingStudy). Coste: ~1 semana desarrollo.
- [ ] **Pendiente**: adoptar nomenclaturas estándar:
  - **SNOMED CT** para diagnósticos (ya referenciamos clase terapéutica + principio activo).
  - **LOINC** para pruebas de laboratorio.
  - **ATC** para fármacos (actualmente usamos principio activo, falta el código ATC).

### 4.2 Uso secundario · Health Data Access Body (HDAB) español

A medio plazo (2027-2029), si Cartagenaeste quiere entrenar prompts o modelos propios:

- [ ] Seguir evolución del HDAB español (AEMPS + Ministerio de Sanidad, aún por designar).
- [ ] Registrarse como *data user* para solicitar permits de datos anonimizados del SNS.
- [ ] Procesamiento solo en SPE (Secure Processing Environment) del HDAB · nunca descargar.

### 4.3 Consentimiento secundario

Para convertir el dataset de casos docentes en recurso reutilizable:

- [ ] Añadir al disclaimer inicial: "Los casos anonimizados podrán reutilizarse con fines docentes e investigación sin ánimo de lucro, con la anonimización adicional pertinente".
- [ ] Plantilla de anonimización real (no solo pseudonimización): fuera iniciales, edad en rangos de 5 años, fechas relativas.

### 4.4 MyHealth@EU · marcado CE específico EHDS

**No aplica** mientras no seamos fabricantes de EHR. Si en el futuro se contrata con SMS y se exige certificación:

- [ ] Valorar con abogado si el cambio de alcance requiere marcado CE EHDS.

---

## 5. Acciones priorizadas · calendario

### Prioridad ALTA (antes de 2026-08-02, EU AI Act)

| # | Acción | Responsable | Estado |
|---|---|---|---|
| 1 | Art. 14 Supervisión humana explícita en Scan IA | Frontend | ✅ 2026-04-23 |
| 2 | Art. 12 Logs ampliados en `scan_uploads` (modelVersion, promptHash, clinicianDecision) | Frontend + Backend | ✅ 2026-04-23 |
| 3 | Art. 11 Ficha técnica del sistema (`docs/legal/ai-technical-file.md`) | Redacción | 🟡 Pendiente |
| 4 | Art. 9 Risk register del Scan IA (`docs/legal/scan-ai-risk-register.md`) | Redacción | 🟡 Pendiente |
| 5 | Art. 13 Info post-análisis (modelo + región + error rate) | Frontend | 🟡 Pendiente |
| 6 | Art. 12 Política retención logs 6-24 meses | Backend + Docs | 🟡 Pendiente |
| 7 | Decisión sobre Art. 71 (registrarse o invocar excepción) | Abogado | 🔴 Bloqueante |

### Prioridad MEDIA (2026-Q4 / 2027-Q1)

| # | Acción | Estado |
|---|---|---|
| 8 | Export FHIR R4 en Cloud Function | Pendiente |
| 9 | Adopción LOINC + ATC en módulos de laboratorio y farmacia | Pendiente |
| 10 | Consentimiento secundario en disclaimer inicial | Pendiente |
| 11 | CI check regex DNI/NIE/NHC | ✅ 2026-04-23 (`.github/workflows/regex-pii-check.yml`) |

### Prioridad BAJA (2028+)

| # | Acción | Estado |
|---|---|---|
| 12 | Registrarse como data user ante HDAB español | No iniciado |
| 13 | Procedimiento anonimización real para distribución de casos | No iniciado |
| 14 | Alineación con EHRxF si hay integración con SMS | Solo si se contrata |

---

## 6. Posicionamiento público

**Footer global** (`footer-global.js`) muestra desde 2026-04-23:

> Cumple RGPD · Preparado para EHDS · Sistema formativo bajo EU AI Act

Esta frase es suficiente y coherente con el estado real:
- *Cumple* RGPD: ya estamos en conformidad.
- *Preparado para* EHDS: no aplica aún (2027+), pero tenemos plan.
- *Sistema formativo bajo* EU AI Act: posicionamiento claro de baja criticidad + obligaciones parciales ya cubiertas.

---

## 7. Referencias

- Reglamento (UE) 2025/327 · EHDS · https://eur-lex.europa.eu/eli/reg/2025/327
- Reglamento (UE) 2024/1689 · EU AI Act · https://eur-lex.europa.eu/eli/reg/2024/1689
- Reglamento (UE) 2016/679 · RGPD · https://eur-lex.europa.eu/eli/reg/2016/679
- Reglamento (UE) 2017/745 · MDR · https://eur-lex.europa.eu/eli/reg/2017/745
- HL7 FHIR R4 · https://hl7.org/fhir/R4/
- International Patient Summary (IPS) · https://hl7.org/fhir/uv/ips/
- Informe OMS-Europa sobre IA en salud (2025) · referenciado en §8 del roadmap interno.

---

## 8. Historial de revisiones

| Fecha | Versión | Cambios |
|---|---|---|
| 2026-04-23 | 1.0 | Creación del documento. Estado inicial con art. 14 y logs ampliados en vigor. |
