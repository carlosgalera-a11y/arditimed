# Ficha técnica del sistema de IA · Cartagenaeste

**Reglamento (UE) 2024/1689 · EU AI Act · Art. 11**
Documento técnico requerido para sistemas de IA con obligaciones desde 2026-08-02.

| Campo | Valor |
|---|---|
| **Nombre del sistema** | Cartagenaeste · Asistente formativo con IA |
| **Versión del sistema** | v1.x (PWA con Service Worker `v126`) |
| **Fecha del documento** | 2026-04-23 |
| **Autor / Proveedor** | Carlos Galera Román — RPI 00765-03096622 |
| **Contacto** | carlosgalera2roman@gmail.com |
| **Clasificación de riesgo autoasignada** | Riesgo limitado con componentes formativos · **no diagnóstico** |
| **URL pública** | https://area2cartagena.es |

---

## 1. Propósito del sistema

Cartagenaeste es una **plataforma formativa y organizador personal de guardia** para profesionales sanitarios (medicina, enfermería) y pacientes. Integra módulos asistidos por IA para:

- Generación de informes y plantillas docentes.
- Triaje formativo para residentes MIR.
- Análisis de imágenes médicas como apoyo educativo (dermatología, Rx tórax/ósea/abdomen, ECG, ecografía).
- Consulta conversacional de protocolos y guías clínicas.
- Búsqueda en vademécum y calculadoras clínicas.

### Lo que el sistema NO hace

- ❌ No emite diagnósticos médicos autónomos.
- ❌ No prescribe ni recomienda tratamiento específico sin revisión humana.
- ❌ No sustituye al profesional sanitario.
- ❌ No integra datos de pacientes identificados con HCE corporativo.
- ❌ No toma decisiones con efecto sobre un paciente concreto sin que un profesional sanitario ejerza supervisión humana (EU AI Act art. 14).

El posicionamiento formativo está declarado explícitamente en el disclaimer permanente en footer (`footer-global.js`) y validado con asesoría jurídica respecto al MDR (Reglamento 2017/745).

---

## 2. Arquitectura del sistema

```
┌────────────────────────────────────────────────────────────┐
│  Frontend PWA (vanilla JS + Service Worker)                 │
│  · index.html, profesionales.html, panel-medico.html, ...   │
│  · Módulo Scan IA (app-main.js)                             │
│  · ai-client.js · wrapper de askAi con retry + SLA event    │
└────────────┬───────────────────────────────────────────────┘
             │ HTTPS callable (Firebase SDK)
             │ App Check enforce + Firebase Auth
┌────────────▼───────────────────────────────────────────────┐
│  Cloud Function `askAi` (Node.js 22, europe-west1)         │
│  functions/src/askAi.ts                                     │
│  · Validación input (validation.ts)                         │
│  · Rate limit por IP (rateLimit.ts)                         │
│  · Cuota diaria por usuario (quotas.ts)                     │
│  · Cache 7d por hash (cache.ts)                             │
│  · Provider chain (routing.ts · buildProviderChain)         │
└────────────┬───────────────────────────────────────────────┘
             │ HTTPS salida al proveedor de IA
             ▼
┌────────────────────────────────────────────────────────────┐
│  Proveedores de IA (terceros)                               │
│  · Qwen 2.5-VL-72B · vision + clinical_case (primario)      │
│  · DeepSeek V3 · educational (primario)                     │
│  · Gemini 2.5 Flash-Lite · fallback                         │
│  · Mistral Small · fallback                                 │
│  · OpenRouter · routing multi-modelo fallback universal     │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  Observabilidad y cumplimiento                              │
│  · users/{uid}/aiRequests — log por llamada (art. 12)       │
│  · scan_uploads — clinicianDecision + modelVersion + hash   │
│  · auditLogs — triggers Firestore para colecciones críticas │
│  · metrics_snapshots/daily-YYYY-MM-DD — aggregateDailyMetrics│
│  · healthchecks/YYYY-MM-DD — healthCheckAi cron diario      │
│  · Sentry — errores runtime                                 │
│  · GA4 (G-JW29V64END, anonymize_ip) — eventos clínicos      │
└────────────────────────────────────────────────────────────┘
```

### Hosting y región

- **Frontend**: GitHub Pages · dominio `area2cartagena.es`.
- **Backend**: Firebase europe-west1 (Bélgica, UE). Firestore, Auth, Functions, Storage.
- **Observabilidad**: Sentry (servidor EU) + GA4 (anonymize_ip).

### Código fuente

- Repositorio público: https://github.com/carlosgalera-a11y/Cartagenaeste
- Mirror dominio: https://github.com/carlosgalera-a11y/area2cartagena
- Branch protection activa en ambos. PRs con squash merge.
- Tests automatizados: 63 tests en `functions/` (vitest).

---

## 3. Categorías de input esperado

### 3.1 Entradas del usuario profesional (autenticado)

| Módulo | Tipo input | Formato | Límites |
|---|---|---|---|
| Triaje IA | Texto libre (síntomas, contexto) | UTF-8 | ≤ 4000 chars prompt, ≤ 6000 chars sistema |
| Scan IA derma/Rx/ECG/eco | Imagen médica JPEG/PNG | ≤ 1024px (comprimida cliente), ≤ 5 MB | 1 imagen por análisis |
| Plantillas informes | Texto libre clínico | UTF-8 | ídem texto |
| Vademécum conversacional | Texto libre | UTF-8 | ídem texto |

### 3.2 Entradas del usuario paciente (no autenticado)

No se envía ninguna consulta a IA desde el espacio público de pacientes. Contenido estático únicamente.

### 3.3 Restricciones de contenido aplicadas

- Bloqueo activo de **DNI/NIE** en contenido clínico (regla Firestore `noDni()`, [firestore.rules:17-21](../../firestore.rules)).
- Tamaño máximo de iniciales de paciente: **4 caracteres** (`firestore.rules:41`).
- Disclaimer RGPD Art. 9 obligatorio antes del primer envío de imagen clínica ([app-main.js](../../app-main.js) en `scanAnalyze`).
- CI automático (`.github/workflows/regex-pii-check.yml`) que bloquea push/PR con DNI o NIE reales en código.

---

## 4. Limitaciones conocidas por modalidad

Cada limitación se acompaña de la **medida de mitigación** aplicada.

### 4.1 Scan IA · dermatología

- **Sesgo de fototipo**: ISIC Archive (dataset de entrenamiento de ConvNeXt-Base ISIC) contiene infrarrepresentación de fototipos V-VI. Los modelos pueden tener menor sensibilidad en piel oscura.
  - **Mitigación**: disclaimer en la ficha del modelo · recomendación al clínico de revisión presencial siempre · no emitir probabilidad única sino diferencial ABCDE.
- **Lesiones no cutáneas**: los modelos pueden confundirse si la imagen muestra mucosa oral, uñas o pliegues con piel normal.
  - **Mitigación**: prompt sistema enumera explícitamente categorías ISIC.

### 4.2 Scan IA · Rx tórax

- **Falsos negativos en nódulo pequeño**: modelos tipo CheXNet tienen AUROC 0.75-0.85 para nódulo <8mm. No son sustitutivos de TC.
  - **Mitigación**: recomendación Fleischner 2017 para nódulo incidental incluida en el prompt sistema.
- **Errores en proyección AP vs PA**: un AP interpretado como PA puede sobreestimar cardiomegalia (ICT >0.5).
  - **Mitigación**: el prompt pide declarar proyección en el primer paso.

### 4.3 Scan IA · Rx ósea

- **Dominio**: MURA entrenado solo en Rx de **extremidad superior** (codo, muñeca, mano). Rendimiento en miembro inferior inexplorado.
  - **Mitigación**: disclaimer explícito en la ficha.
- **Edad ósea**: la estimación Greulich-Pyle es solo orientativa, no legal.

### 4.4 Scan IA · abdomen

- **No hay benchmark consolidado** (MONAI enfocado a TC, no Rx simple).
  - **Mitigación**: disclaimer que recomienda TC si hay sospecha seria.

### 4.5 Scan IA · ECG

- **Input subóptimo**: el modelo `xresnet1d101` está entrenado con señal digital WFDB 500Hz, no con fotos de papel. Las fotos de ECG pueden tener:
  - Artefactos de escaneado/curvatura del papel.
  - Pérdida de derivaciones por doblados.
  - Calibración variable no detectable por visión.
  - **Mitigación**: disclaimer de la ficha + herramienta externa ECG-GPT (Yale CarDS Lab) como segunda opinión.
- **Ritmos poco representados**: bloqueos AV avanzados y disritmias raras pueden no estar bien representados en PTB-XL.

### 4.6 Scan IA · ecografía

- EchoNet-Dynamic entrenado en 4C apical adulto. Planos alternativos o pediatría fuera de validación.

### 4.7 Triaje IA y informes

- **Alucinaciones**: los LLMs pueden generar información plausible pero incorrecta (nombres de fármacos inexistentes, dosis incorrectas, guías inventadas).
  - **Mitigación**: prompt sistema exige citar guías reconocidas · supervisión humana obligatoria · integración con vademécum propio para validar principio activo.

---

## 5. Métricas de rendimiento (benchmarks publicados)

| Modelo | Dataset | Métrica | Valor |
|---|---|---|---|
| ConvNeXt-Base ISIC | ISIC 2019 | Top-1 accuracy | ~85-90% |
| CheXNet (DenseNet-121) | ChestX-ray14 | AUROC medio 14 etiq | >0.92 |
| xresnet1d101 | PTB-XL | Macro-AUC 5 superclases | 0.93 |
| DenseNet-169 MURA | MURA | Cohen kappa | 0.71-0.78 (rendimiento radiólogo) |
| EchoNet-Dynamic | EchoNet | MAE FEVI | ~4% |
| Qwen2.5-VL-72B | MMMU, MathVista | Varios | Líder en VL open-weight 2025 |
| DeepSeek V3 | MMLU, HumanEval | Benchmarks texto | Competitivo |

Fuentes: papers originales citados en `SCAN_MODELS` ([app-main.js](../../app-main.js)), páginas de los modelos en HuggingFace.

**Las métricas propias del sistema (no del modelo)** se recogen en `metrics_snapshots/daily-YYYY-MM-DD` por la Cloud Function `aggregateDailyMetrics` y son visibles en [admin-dashboard.html](../../admin-dashboard.html):

- Latencia p50/p95/p99 por proveedor.
- Error rate por proveedor.
- Cache hit rate global.
- Coste estimado en EUR por día.
- Llamadas por tipo (clinical_case, educational, vision).

---

## 6. Datos de entrenamiento (uso de modelos de terceros)

Cartagenaeste **no entrena modelos propios**. Utiliza:

| Proveedor | Modelo | Datos de entrenamiento (públicos) |
|---|---|---|
| Alibaba / DashScope | Qwen 2.5-VL-72B | Mix propietario multilingüe + vision (detalles en paper técnico) |
| DeepSeek | V3 / R1 | Mix web + código (detalles en paper V3) |
| Google | Gemini 2.5 Flash / Flash-Lite | Multi-modal propietario |
| Mistral | Small 3.2-24b-instruct | Web multilingüe (Apache 2.0) |
| OpenRouter | Routing a los anteriores | N/A (enrutador) |

**Cartagenaeste no envía datos de entrenamiento a ninguno de estos proveedores**. Cada llamada es stateless salvo por la caché interna propia (Firestore `aiCache`, TTL 7 días, no se comparte).

---

## 7. Procedimiento de actualización y versionado

### Frontend PWA
- Versión declarada en `sw.js` constant `CACHE_NAME = 'area2-vNNN'`.
- Cada cambio de assets precacheados → bump `vNNN → vNNN+1`.
- Service Worker hace `skipWaiting + clients.claim` para forzar update.
- PRs con squash merge a `main` → deploy automático GitHub Pages.

### Cloud Functions
- `firebase deploy --only functions:<name>` tras `npm run test` y `npx tsc --noEmit`.
- Secretos en Secret Manager GCP (no en código).
- 63 tests vitest obligatorios antes de deploy (CI `.github/workflows/ci.yml`).

### Modelos
- Cuando un proveedor publica versión nueva (ej. Qwen 3.0 cuando salga), se evalúa en staging.
- Si se cambia el modelo primario, se actualiza:
  1. `functions/src/routing.ts` (provider chain).
  2. `app-main.js` `SCAN_MODELS.<modalidad>.model` y campos asociados.
  3. Esta ficha técnica (§5 · §6).
  4. `modelVersion` en `scan_uploads` escrituras.

### Política de cambio
- Cambios en la cadena de proveedores se registran en `docs/legal/ehds-readiness.md` y en el CHANGELOG.
- Cambios en prompts sistema se versionan via git (promptHash detectará el cambio).

---

## 8. Procedimiento de evaluación previa al despliegue

Para cada cambio que afecta a la IA (nuevo modelo, nuevo prompt sistema, nueva modalidad):

1. **Revisión de prompt sistema** por el autor.
2. **Benchmark informal**: al menos 10 casos conocidos evaluados manualmente antes de promocionar a prod.
3. **Actualización de `scan-ai-risk-register.md`** con nuevos modos de fallo detectados.
4. **Actualización de esta ficha** (§4 · §5).

---

## 9. Supervisión humana (art. 14)

La supervisión humana está implementada en las 4 capas siguientes:

### 9.1 Capa de interfaz
- Banner permanente EU AI Act art. 14 en cada resultado del Scan IA.
- **Checkbox explícito** "Yo, el clínico, asumo la decisión final".
- Botones Aceptar / Rechazar / Ignorar tras cada análisis.

### 9.2 Capa de datos
- Toda decisión clínica (`accepted`, `rejected`, `ignored`) se persiste en `scan_uploads` con `uid`, `modelVersion`, `promptHash`, `decidedAt`.
- Las llamadas a IA se registran en `users/{uid}/aiRequests` con todos los metadatos de trazabilidad.

### 9.3 Capa organizativa
- Disclaimer permanente "Plataforma formativa. No diagnóstica."
- Política de nomenclatura: clase terapéutica + principio activo, nunca marca comercial.
- Módulos pediátricos y embarazo marcados como consulta obligatoria con adjunto.

### 9.4 Capa contractual
- La `propuesta-astrazeneca-v1.md` y los dossiers comerciales futuros incluyen la cláusula de supervisión humana como obligación del cliente (el clínico siempre decide).

---

## 10. Gestión de riesgos continua

- **Auditoría de seguridad** ejecutada 2026-04-21 (`docs/security-audit-2026-04-21.md`).
- **Risk register** actualizado en `docs/legal/scan-ai-risk-register.md`.
- **Revisión de esta ficha**: semestral (enero y julio) + al incorporar modelo nuevo.
- **Notificación de cambios sustanciales** a clientes contractuales con 30 días de antelación.

---

## 11. Retención de logs y datos

| Colección | Retención | TTL field | Política |
|---|---|---|---|
| `users/{uid}/aiRequests` | **6 meses** (EU AI Act art. 12 mínimo) | `expiresAt` (180 d desde `createdAt`) | TTL automático gcloud |
| `scan_uploads` | **12 meses** (decisiones clínicas) | `expiresAt` (365 d desde `decidedAt`) | TTL automático gcloud |
| `aiCache` | 7 días | `expiresAt` | TTL automático gcloud |
| `metrics_snapshots` | Indefinido (agregado, sin PII) | — | Manual |
| `auditLogs` | **3 años** | — | Manual (inmutable por rules) |
| `healthchecks` | **90 días** | `expiresAt` (si se añade) | TTL automático gcloud |

Procedimiento de configuración TTL en `docs/runbook.md` §10 (nuevo).

---

## 12. Declaración de conformidad

El firmante, Carlos Galera Román (RPI 00765-03096622), declara que:

- Ha elaborado esta ficha técnica conforme al **art. 11 del Reglamento (UE) 2024/1689**.
- Cartagenaeste cumple con las obligaciones de transparencia (art. 13), supervisión humana (art. 14) y registro de logs (art. 12) aplicables a la fecha de este documento.
- La aplicabilidad del art. 71 (registro en EU database of high-risk AI systems) está **pendiente de decisión jurídica**, con fecha límite 2026-08-02.
- Esta ficha se mantendrá actualizada y disponible a la autoridad de mercado correspondiente.

Cartagena, 23 de abril de 2026
**Carlos Galera Román**
carlosgalera2roman@gmail.com
