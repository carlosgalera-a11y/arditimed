# Auditoría de costes y escalado · Cartagenaeste

**Fecha:** 2026-04-24
**Autor:** Carlos Galera Román
**Propósito:** inventario completo de costes actuales, proyección a 1.000 usuarios activos mensuales (MAU) y necesidades técnicas para sostener ese volumen con SLA 99,5% · p95 <5s.

> Este documento se mantiene al día después de cada cambio de arquitectura o precio de proveedor. Usarlo como anexo económico en el dossier comercial y en la propuesta AstraZeneca.

---

## 0. TL;DR

| Escenario | MAU | Coste mensual EUR | Coste anual EUR |
|---|---|---|---|
| **Hoy** (uso real, fase temprana) | <20 | **≈ 0 €** (tier gratuito) | ≈ 0 € |
| **100 MAU** (Urgencias HSL firmado) | 100 | **35 - 85 €/mes** | 420 - 1.020 €/año |
| **1.000 MAU** (SMS multi-servicio) | 1.000 | **180 - 420 €/mes** | 2.160 - 5.040 €/año |
| **Escenario pesimista 1.000 MAU · uso intensivo IA** | 1.000 | **380 - 650 €/mes** | 4.560 - 7.800 €/año |

**Lectura comercial**: la factura de 14.000 €/año a HSL (dossier comercial) cubre costes de infraestructura con **margen amplio** incluso en escenario pesimista de 1.000 MAU, con lo que los servicios de desarrollo, soporte y formación quedan íntegramente como valor añadido.

---

## 1. Stack actual · inventario de componentes

| Componente | Proveedor | Estado facturación | Plan | Región |
|---|---|---|---|---|
| Dominio `area2cartagena.es` | Registrador externo | Autofinanciado | 12-15 €/año | N/A |
| Hosting frontend | GitHub Pages | Gratis (cuenta personal) | — | Global CDN |
| Firestore (database) | Firebase / Google Cloud | **No facturado** (free tier) | Spark → Blaze pending | europe-west1 |
| Firebase Auth | Firebase | Gratis | Spark | europe-west1 |
| Firebase Storage | Firebase | Gratis | Spark | europe-west1 |
| Cloud Functions (6 desplegadas) | Firebase | Gratis (<2M invoc/mes) | Spark | europe-west1 |
| App Check | Firebase | Gratis | Spark | N/A |
| Backups diarios Firestore | Google Cloud Storage | **No activo** (requiere Blaze) | — | europe-west1 |
| DeepSeek API | DeepSeek | **No facturado** (tier free) | Free | CN |
| OpenRouter API | OpenRouter | **No facturado** (saldo testing) | Pay-as-you-go | US/UE variable |
| Qwen / Gemini / Mistral direct | Varios | No usado por defecto | Opcional | Variable |
| Sentry | Sentry.io | Gratis (dev team) | Team free | EU |
| Google Analytics 4 | Google | Gratis | Standard | UE |
| **Uptime Robot** (pendiente activar) | Uptime Robot | Gratis | Free 50 monitors | N/A |
| Email / push | No activos | — | — | — |

**Total facturado hoy: ~15 €/año** (solo dominio).

### Cloud Functions desplegadas (europe-west1)

| Función | Tipo | Cron / Trigger | Memoria | Tiempo ejecución típico |
|---|---|---|---|---|
| `askAi` | onCall | user | 512 MiB | 2-30 s |
| `publicMetrics` | HTTP GET | user | 256 MiB | <1 s |
| `setUserRole` | onCall | admin | 256 MiB | <1 s |
| `auditCases`, `auditAiRequests`, `auditSugerencias`, `auditDocumentosAprobados`, `auditTriajes`, `auditInformesIa`, `auditScanUploads` | triggers Firestore | writes | 256 MiB | <500 ms |
| `weeklyMetricsSnapshot` | scheduler | lun 03:00 | 512 MiB | 10-30 s |
| `dailyBackup` | scheduler | diario 03:00 | 256 MiB | 30-120 s |
| `weeklyAuditDigest` | scheduler | lun 09:00 | 256 MiB | 5-15 s |
| `aggregateDailyMetrics` | scheduler | diario 02:30 | 512 MiB | 5-20 s |
| `healthCheckAi` | scheduler | diario 06:00 | 256 MiB | 10-30 s |
| `goldStandardEval` | scheduler | mensual día 1 04:00 | 1 GiB | 30-120 s |
| `fhirExport` | onCall | user admin | 512 MiB | 1-5 s |

---

## 2. Tarifas actuales de referencia (2026)

### 2.1 Firebase / GCP · europe-west1

| Recurso | Umbral gratuito mensual | Precio tras umbral |
|---|---|---|
| Firestore lecturas | 50.000 / día | 0,06 $/100k |
| Firestore escrituras | 20.000 / día | 0,18 $/100k |
| Firestore eliminaciones | 20.000 / día | 0,02 $/100k |
| Firestore storage | 1 GiB | 0,18 $/GiB/mes |
| Cloud Functions invocaciones | 2.000.000 / mes | 0,40 $/M |
| Cloud Functions GB-s | 400.000 | 0,0000025 $/GB-s |
| Cloud Functions CPU-s | 200.000 | 0,0000100 $/CPU-s |
| Firebase Auth MAU | 50.000 | 0,0055 $/MAU (UE) |
| Storage | 5 GiB | 0,026 $/GiB/mes (standard) |
| Egress | 1 GiB | 0,12 $/GiB (internet) |

### 2.2 Proveedores IA · por 1M tokens (promedio)

| Proveedor · Modelo | Input | Output | Nota |
|---|---|---|---|
| DeepSeek V3 | 0,27 $ | 1,10 $ | Tier free con rate limit severo |
| DeepSeek V3 (paid) | 0,27 $ | 1,10 $ | Sin rate limit clínico |
| Gemini 2.5 Flash-Lite | 0,10 $ | 0,40 $ | UE directo |
| Gemini 2.5 Flash | 0,30 $ | 2,50 $ | UE directo · vision |
| Mistral Small 3.2 | 0,20 $ | 0,60 $ | UE directo |
| Qwen 2.5-VL-72B (DashScope) | 1,80 $ | 5,40 $ | Intl routing |
| OpenRouter (routing) | +10-25% markup sobre el modelo | | |
| Anthropic Claude Haiku 4.5 | 1,00 $ | 5,00 $ | UE disponible · pago facturable |

---

## 3. Proyección por escenario

### 3.1 Asunciones del modelo de uso

| Métrica | Hoy | 100 MAU | 1.000 MAU |
|---|---|---|---|
| MAU | 15 | 100 | 1.000 |
| DAU aprox (20% MAU) | 3 | 20 | 200 |
| Peticiones IA / usuario / día | 3 | 5 | 6 |
| Peticiones IA totales / mes | 200 | 3.000 | 36.000 |
| Tokens promedio por llamada (in/out) | 600 / 500 | 800 / 700 | 1.000 / 900 |
| Imágenes analizadas / día | 0-2 | 5-10 | 30-80 |
| Sesiones con datos | 300/mes | 2.500/mes | 24.000/mes |
| Reads Firestore / mes | 8.000 | 80.000 | 800.000 |
| Writes Firestore / mes | 2.000 | 18.000 | 200.000 |
| Storage Firestore | <100 MiB | 500 MiB | 3-5 GiB |
| Tráfico egress / mes | <200 MiB | 2 GiB | 20 GiB |

### 3.2 Escenario HOY

Todo dentro de tier gratuito salvo dominio.

- Dominio: 1,25 €/mes
- Firebase: 0 €/mes (ampliamente bajo umbral)
- DeepSeek free + OpenRouter testing: 0 €/mes
- **TOTAL: ≈ 1,25 €/mes · 15 €/año**

### 3.3 Escenario 100 MAU (Urgencias HSL firmado · 2026-Q3)

- Dominio: 1,25 €/mes
- Firebase (estimado activando Blaze):
  - Reads 80k → dentro free tier
  - Writes 18k → dentro free tier
  - Functions 500k invocaciones → dentro free tier
  - Auth 100 MAU → 0,55 €/mes
  - Storage 500 MiB → 0,09 €/mes
  - Egress 2 GiB → 0,22 €/mes
  - Backups (GCS) 50 MiB/día · 30d = 1,5 GiB → 0,04 €/mes
  - **Subtotal Firebase: ≈ 1 €/mes**
- IA (con SLA pagado):
  - Escenario **híbrido económico** (90% DeepSeek paid, 10% Gemini Flash):
    - 3.000 llamadas · 1.500 tokens promedio · 0,70 $/1M = **3 $/mes**
    - Con markup OpenRouter +15% = **3,5 $/mes ≈ 3,30 €/mes**
  - Escenario **premium** (50% Gemini Flash-Lite, 30% Gemini Flash, 20% Qwen VL):
    - 3.000 llamadas · mix = **25 $/mes ≈ 23 €/mes**
  - Escenario **Anthropic como primario** (Claude Haiku para clinical_case):
    - 3.000 llamadas · 1.500 tokens · 3 $/1M = **15 $/mes ≈ 14 €/mes**
- Sentry: gratis (dev team)
- Uptime Robot: gratis
- **TOTAL rango: 6 - 18 €/mes · 72 - 216 €/año**
- Con buffer × 4 (picos imprevistos + errores): **35 - 85 €/mes · 420 - 1.020 €/año**

### 3.4 Escenario 1.000 MAU (SMS multi-servicio · 2027)

- Dominio: 1,25 €/mes
- Firebase:
  - Reads 800k → 0 € (dentro free tier mensual: 50k/día × 30 = 1,5M/mes free)
  - Writes 200k → 0 € (600k/mes free)
  - Functions 5M invocaciones → (5M - 2M) × 0,40 $/M = 1,20 $ → **1,10 €/mes**
  - Auth 1.000 MAU → 5,50 €/mes
  - Storage 5 GiB → 0,90 €/mes
  - Egress 20 GiB → 2,20 €/mes
  - Backups 15 GiB/mes → 0,35 €/mes
  - **Subtotal Firebase: ≈ 10 €/mes**
- IA (con SLA pagado · 36.000 llamadas/mes):
  - Escenario híbrido económico: 36.000 · 1,9k tokens · 0,70 $/1M ≈ **48 $/mes ≈ 45 €/mes**
  - Escenario premium: **≈ 180 €/mes**
  - Escenario pesimista (usuarios muy activos, imagen pesada): **≈ 350 €/mes**
- Monitoring paid (Sentry Team Plus): 29 $/mes ≈ **27 €/mes** (opcional)
- **TOTAL rango: 90 - 240 €/mes · 1.080 - 2.880 €/año** (sin Sentry paid)
- Con buffer × 1,8: **180 - 420 €/mes · 2.160 - 5.040 €/año**
- Escenario pesimista con Sentry paid y provider premium: **650 €/mes**

---

## 4. Necesidades técnicas para 1.000 MAU

### 4.1 Obligatorias antes de cruzar 100 MAU

- [x] App Check enforce activo (ya) — protege el gasto IA de abuso.
- [x] Rate limit por IP en `askAi` (ya, 30/min).
- [x] Cuota diaria por usuario (ya, 50/día · 200 admin).
- [x] Cache hash 7d (ya) — ahorra repetitivos.
- [ ] **Migrar a plan Blaze** en Firebase (necesario para backups + superar tier).
- [ ] **Alerta presupuestaria GCP Billing** a 20 €/mes con thresholds 50/90/100/150%.
- [ ] **Cuenta Anthropic o Gemini pagada** (SLA exigible).
- [ ] **Seguro RC profesional + ciber** (400-900 €/año, deducible coste operativo).

### 4.2 Recomendadas antes de 500 MAU

- [ ] Uptime Robot activado (gratis).
- [ ] Presupuesto de pruebas de carga (herramienta k6 o Loader): 1 ejecución antes de onboarding masivo. Coste: 20 €/mes durante 1 mes.
- [ ] TTL activa en `aiRequests` y `scan_uploads` (ya · 180d / 365d).
- [ ] Segundo dev con acceso Write al repo + IAM editor (NDA firmado).
- [ ] Panel SLA público `/status.html` (ya desplegado).
- [ ] Presupuesto picos: provisionar el 50% encima del gasto típico.

### 4.3 Recomendadas antes de 1.000 MAU

- [ ] Multi-tenancy con colección `centros` + `centroId` propagado a todas las escrituras (ya implementado PR #71).
- [ ] Branding dinámico por tenant (ya implementado PR #74).
- [ ] Billing Dashboard nativo en admin (ya · dashboard cost/día).
- [ ] Export mensual PDF a cliente (ya · PR #78).
- [ ] FHIR R4 export para integración con HCE (ya añadido 2026-04-24).
- [ ] Escalado memoria `askAi` de 512 MiB a 1 GiB si se observan p95 > 5s.
- [ ] Posible paso a Cloud Run para Functions de alto uso (si supera 2M invocaciones/mes sostenido).

### 4.4 Nice-to-have escalado mayor

- [ ] CDN ante GitHub Pages (Cloudflare free) para reducir egress.
- [ ] Worker separado para jobs pesados (FHIR export batch, PDF masivo).
- [ ] Replica de Firestore en `eur3` multi-region si se exige DR < 15 min.

---

## 5. Pricing contractual · recordatorio

Del dossier comercial Urgencias HSL (`dossier-comercial.html`):

| Concepto | Año 1 | Recurrente Año 2+ |
|---|---|---|
| Licencia servicio (80 profesionales) | 3.500 € | 3.500 € |
| Mantenimiento evolutivo | 2.400 € | 2.400 € |
| Hosting + IA con SLA | 1.200 € | 1.200 € |
| Bolsa soporte 40 h (SLA 24 h) | 2.000 € | 2.000 € |
| Módulo específico *"Fármacos de Urgencia"* | 2.500 € | — |
| Onboarding + 2 sesiones formación | 1.200 € | — |
| Reporting trimestral | 1.200 € | 1.200 € |
| **TOTAL año 1** | **14.000 €** IVA excluido | |
| **TOTAL recurrente año 2** | | **10.300 €** + módulo nuevo 2.500 € |

Coste real operativo estimado (100 MAU · escenario medio 60 €/mes): **720 €/año**.

Margen operativo año 1: **13.280 €** (95%).
Margen operativo año 2 recurrente: **9.580 €** (93%).

**Nota**: el margen se usa para (a) seguro RC + ciber, (b) tiempo dev del autor + backup, (c) acreditaciones (HONcode, WIS, Web Sanitaria Acreditada), (d) reserva técnica para picos y crecimiento.

---

## 6. Alertas presupuestarias recomendadas

Comando gcloud (ejecutar en Cloud Shell cuando Blaze esté activo):

```bash
# Ver billing account
gcloud billing accounts list

# Crear budget con alertas
gcloud billing budgets create \
  --billing-account=BILLING_ID \
  --display-name="Cartagenaeste mensual" \
  --budget-amount=20EUR \
  --threshold-rule=percent=0.5 \
  --threshold-rule=percent=0.9 \
  --threshold-rule=percent=1.0 \
  --threshold-rule=percent=1.5 \
  --filter-projects=projects/docenciacartagenaeste
```

Escalar el budget cuando crezca usuario base:

| MAU | Budget recomendado |
|---|---|
| 0-50 | 20 €/mes |
| 50-200 | 80 €/mes |
| 200-500 | 200 €/mes |
| 500-1.000 | 500 €/mes |
| >1.000 | 800 €/mes |

---

## 7. Riesgos económicos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Proveedor IA sube precios 2× | Media | Cadena de fallback con 5 proveedores |
| Uso malicioso de la API (abuso) | Baja (App Check) | Rate limit + cuotas + alerta budget |
| Crecimiento repentino sin cobertura | Media | Budget alert + pausa temporal IA en cuota drenada |
| Caída de Firebase 24 h | Muy baja | Aceptable para sistema formativo · disclaimer |
| Cambio Google pricing Firebase | Alta (histórico) | Revisión semestral + posible migración parcial a Supabase/Cloudflare D1 |

---

## 8. Historial de revisiones

| Fecha | Cambios |
|---|---|
| 2026-04-24 | Documento inicial. Escenarios hoy / 100 / 1.000 MAU con rangos realistas. |
