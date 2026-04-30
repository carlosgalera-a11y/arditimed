# Sesión Claude Code · Cartagenaeste · 2026-04-29 / 2026-04-30

> Resumen exhaustivo de la sesión para retomar el trabajo desde cualquier ordenador con tu cuenta de GitHub.
> **Repositorio**: https://github.com/carlosgalera-a11y/Cartagenaeste
> **Webapp en producción**: https://area2cartagena.es/

---

## 0. Cómo retomar esta sesión en otro ordenador

```bash
# 1. Clonar el repo
git clone https://github.com/carlosgalera-a11y/Cartagenaeste.git
cd Cartagenaeste

# 2. Configurar Firebase CLI con tu cuenta
npm install -g firebase-tools@latest
firebase login
firebase use docenciacartagenaeste

# 3. Instalar dependencias de functions
cd functions && npm install && cd ..

# 4. Verificar que tienes los secretos configurados
firebase functions:secrets:access DEEPSEEK_API_KEY | head -c 8 ; echo "..."
firebase functions:secrets:access OPENROUTER_API_KEY | head -c 8 ; echo "..."
firebase functions:secrets:access GMAIL_APP_PASSWORD | head -c 8 ; echo "..."  # añadido en esta sesión

# 5. Configurar el remote del repo mirror que sirve area2cartagena.es
git remote add area2 https://github.com/carlosgalera-a11y/area2cartagena.git 2>/dev/null

# 6. Leer este documento + docs/dossier-cartagenaeste-2026-04-29.md para retomar el contexto
```

---

## 1. PRs mergeados a main en esta sesión

| PR | Título | Estado |
|---|---|---|
| #127 | fix(h09-h10-h11): higiene documental — fechas, versionado y protocolo brecha | ✅ Merged |
| #130 | feat: dossier completo + PDF costes Blaze + Mi Guardia volver inicio + inhaladores | ✅ Merged |
| #131 | feat(dashboard): 6 nuevas secciones de métricas + fixes errores GA4/SLA | ✅ Merged |
| #132 | feat(combined): #128 saldo API + audiencia + #129 getAudienceDetail + email + tests (rebased) | ✅ Merged |
| #128 | feat(dashboard): alerta saldo API + audiencia total + widget créditos | 🔁 Cerrado (vía #132) |
| #129 | feat(functions): getAudienceDetail + email alerta saldo + 29 tests | 🔁 Cerrado (vía #132) |

---

## 2. Cloud Functions desplegadas en europe-west1

| Función | Tipo | Propósito |
|---|---|---|
| `getApiBalances` | onRequest | Saldo en tiempo real DeepSeek + OpenRouter (admin only via ID token) |
| `getAudienceDetail` | onRequest | GA4: 5 dimensiones (device, country, newVsReturning, browser, OS) |
| `getGaReportingHub` | onRequest | GA4 Reporting Hub completo (realtime + adquisición + engagement + eventos + geo) |
| `getGaSegmentAnalysis` | onRequest | Análisis profundo Profesionales vs Pacientes con frases auto para venta |
| `dailyBalanceCheck` | onSchedule | Cron 09:00 Madrid · email vía Gmail SMTP cuando saldo < $5 |

URLs:
- `https://europe-west1-docenciacartagenaeste.cloudfunctions.net/getApiBalances`
- `https://europe-west1-docenciacartagenaeste.cloudfunctions.net/getAudienceDetail`
- `https://getgareportinghub-telyea63va-ew.a.run.app`
- `https://getgasegmentanalysis-telyea63va-ew.a.run.app`

---

## 3. Auditoría legal · estado tras la sesión

**11 hallazgos de la auditoría 2026-04-28 · estado actual:**

| ID | Severidad | Estado |
|---|---|---|
| H-01 | 🔴 | ⏳ Pendiente — espera reCAPTCHA site key (Carlos) |
| H-02 | 🔴 | ⏳ Pendiente — solicitar DPA a OpenRouter + DeepSeek (Carlos) |
| H-03 | 🔴 | ✅ Cerrado · PR #125 |
| H-04 | 🔴 | ✅ Cerrado · PR #125 |
| H-05 | 🟡 | ✅ Cerrado · PR #126 |
| H-06 | 🟡 | ✅ Cerrado · HSTS ya activo en GitHub Pages |
| H-07 | 🟡 | ✅ Cerrado · PR #126 |
| H-08 | 🟡 | ✅ Cerrado · PR #126 |
| H-09 | 🟢 | ✅ Cerrado · PR #127 (last-reviewed bumpeado a 2026-04-29 en 79 HTMLs) |
| H-10 | 🟢 | ✅ Cerrado · PR #127 (front-matter version/commit en 11 docs legales) |
| H-11 | 🟢 | ✅ Cerrado · PR #127 (protocolo brecha §11 runbook + breach-register.md) |

**Pendiente solo H-01 (App Check enforce) y H-02 (DPAs DeepSeek/OpenRouter).**

---

## 4. Documentos PDF generados

Todos en `docs/pdfs/`:

| PDF | Tamaño | Contenido |
|---|---|---|
| `auditoria-costes-cartagenaeste-blaze-2026-04-29.pdf` | 1.0 MB | Costes con plan Blaze · escenarios uso actual / 500 DAU / 1000 DAU · guía completa Firebase Billing |
| `dossier-cartagenaeste-2026-04-29.pdf` | 1.4 MB | Dossier maestro 10 secciones (legal · módulo paciente · concursos · certificaciones · estrategia comercial · módulos vendibles · hoja de ruta) |
| `auditoria-costes-5000eur-2026-04-30.pdf` | ~950 KB | Auditoría con techo presupuesto 5.000 € · datos reales 7d · distribución óptima |

Los HTML originales están en `docs/auditoria-costes-2026-04-29.html`, `docs/dossier-cartagenaeste-2026-04-29.html` y `docs/auditoria-costes-5000eur-2026-04-30.html` por si quieres regenerarlos.

---

## 5. Cambios al admin dashboard (admin-dashboard.html)

### Errores reparados
- ❌→✅ `firebase.app(...).functions is not a function` (faltaba `firebase-functions-compat.js`)
- ❌→✅ Panel SLA `The query requires an index` (añadido índice metrics_snapshots a firestore.indexes.json)

### 11 secciones nuevas
1. 💳 **Créditos API** (DeepSeek + OpenRouter con saldo en tiempo real + alerta)
2. 👥 **Audiencia total** (visitantes anónimos + registrados + pageviews)
3. 🧭 **Uso por apartado · Profesionales vs Pacientes** (KPIs + donut + top páginas)
4. 🕐 **Heatmap horario 24h × 7 días** de calls IA
5. 🔻 **Embudo de conversión** (anónimos → registrados → activos → power users)
6. 🧩 **Uso por módulo del producto** (10 colecciones Firestore)
7. 🔁 **Retención por cohorte D1/D7/D14**
8. ⚡ **Latencia detallada por modelo** (p50/p95/p99)
9. 📊 **GA4 Reporting Hub completo** (realtime · adquisición · engagement · eventos · geo · idiomas · páginas con engagement · cómo llegan nuevos usuarios)
10. 🎯 **Análisis profundo Pro vs Pac** (insights auto-generados para venta + KPIs side-by-side + comparativa devices/horarios/fuentes/páginas/ciudades)
11. 🟢 Banner de **alerta saldo bajo** (rojo) en cabecera

---

## 6. Cambios al frontend público

- **Mi Guardia** (modal en `panel-medico.html`): nuevo botón "🏠 Volver a inicio" en `guardia-notas.js` que devuelve a `index.html`
- **Consejos de Salud** (`consejos-salud.html`): nueva ficha **"💨 Cómo usar bien los inhaladores"** con técnica MDI vs polvo seco, importancia de enjuagar boca con corticoides (prevenir candidiasis + disfonía), citando GEMA 5.4, GesEPOC 2024, semFYC, SEMERGEN, GINA 2024

---

## 7. Datos reales del dashboard registrados al cierre de sesión

**Período: últimos 7 días (22-29 abril 2026)**
- 70 llamadas IA · 8 usuarios únicos · 10 DAU promedio
- 163.461 tokens totales (64.061 in / 99.400 out)
- Cache hit: 20% · Errores: 0
- Coste IA real: ≈ 0,15 €/semana ≈ 0,65 €/mes
- Coste total operación actual: **1,90 €/mes** (incluyendo dominio)

**Distribución por modelo:**
- DeepSeek V3 (OpenRouter): 40 calls
- Gemini 2.5 Flash-Lite (OR): 22 calls
- Qwen 2.5 VL: 7 calls (43% del coste — modelo más caro)
- Gemini 2.5 Flash: 1 call

**Top usuarios:**
1. Carlos Galera (autor) — 31 calls
2. María Asunción Román (familia) — 22 calls
3. Fátima Delgado — 6 calls
4. Salvador Cánovas (alumni.unav.es) — 4 calls
5-8. Carmen Paniagua, Federico Martínez, Victoria R.V., Juan Diego Alfonseda — 1-3 calls

---

## 8. Tareas pendientes para Carlos (acciones humanas)

### Crítico

1. **Push del mirror a `area2cartagena.es`** (último paso para que el dashboard nuevo esté visible)
   ```bash
   cd /Users/carlos/cartagenaestewebappSOLIDA
   git remote add area2 https://github.com/carlosgalera-a11y/area2cartagena.git 2>/dev/null
   git push area2 main:main
   ```

2. **Verificar el secret GMAIL_APP_PASSWORD**
   ```bash
   firebase functions:secrets:access GMAIL_APP_PASSWORD | head -c 8 ; echo "..."
   # Si imprime "PLACEHO..." es placeholder, hay que cambiarlo:
   firebase functions:secrets:set GMAIL_APP_PASSWORD
   # → pegar la App Password real (16 chars de myaccount.google.com/apppasswords)
   firebase deploy --only functions:dailyBalanceCheck
   ```

### Alta prioridad (auditoría legal)

3. **H-01 · App Check enforce ON**
   - Crear site key reCAPTCHA v3 en https://www.google.com/recaptcha/admin/create
   - Dominios: `area2cartagena.es`, `carlosgalera-a11y.github.io`
   - Pegar en `recaptcha-key.js`
   - Flipar `enforceAppCheck: true` en `functions/src/askAi.ts` y redeploy

4. **H-02 · Solicitar DPAs**
   - OpenRouter: https://openrouter.ai/ → privacy/legal
   - DeepSeek: https://platform.deepseek.com/

### Media prioridad

5. **Presentación HSL 8 mayo** — usar dossier comercial + PDFs generados
6. **Solicitar HONcode** (gratis): https://www.hon.ch/HONcode/
7. **Solicitar WIS COMB** (~250 €/año): https://wma.comb.es/
8. **NEOTEC CDTI** convocatoria mayo 2026 (250.000 € subvención)

---

## 9. Próximos hilos de trabajo (cuando retomes la sesión)

### Frontend
- Implementar módulo paciente seguro (TA + glucemia) según estrategia del dossier (sección 3 del PDF dossier)
- Activar las 14 ideas adicionales para sección pacientes (recordatorio medicación, calendario citas, generador informe para médico, etc.)
- Aplicar el banner cookies (#125) en todos los HTML que falten
- Implementar el modal ScanIA al cargar imagen real (aunque H-05 está cerrado, comprobar UX)

### Backend
- Activar `enforceAppCheck: true` en askAi.ts (H-01)
- Migrar primario clinical_case a Gemini directo si los DPAs de OR no llegan (Plan B de H-02)

### Comercial
- Sesión clínica acreditada SEAFORMEC (Q3)
- Comunicación a congreso SEMERGEN/semFYC
- Contactar primer servicio fuera Área II (top recomendados: SAS Almería, Conselleria Valenciana, SESCAM Albacete)

### Documentación
- Actualizar trimestralmente la auditoría costes
- Actualizar `docs/legal/auditoria-2026-04-28.md` cuando se cierren H-01 y H-02

---

## 10. Comandos frecuentes (referencia rápida)

```bash
# Trabajo en el repo
cd /Users/carlos/cartagenaestewebappSOLIDA
git pull origin main

# Ver estado
git status
gh pr list --state open

# Local development
firebase emulators:start --only functions,firestore,auth
cd functions && npm test          # 124 tests pasan
cd functions && npm run build

# Deploy
firebase deploy --only functions:askAi
firebase deploy --only firestore:indexes
firebase deploy --only functions  # todo

# Frontend (GitHub Pages)
git push origin main              # repo principal
git push area2 main:main          # mirror que sirve area2cartagena.es
```

---

## 11. Referencias importantes en el repo

- **CLAUDE.md** — instrucciones permanentes del proyecto · reglas innegociables
- **docs/legal/auditoria-2026-04-28.md** — auditoría legal completa
- **docs/legal/rgpd-eipd.md** — EIPD/DPIA
- **docs/legal/rgpd-rat.md** — RAT
- **docs/legal/eu-ai-act-dossier.md** — dossier AI Act
- **docs/legal/ce-mdr-analysis.md** — análisis MDR
- **docs/runbook.md** — operación · §11 protocolo brecha de seguridad
- **docs/dossier-cartagenaeste-2026-04-29.html** — dossier maestro (también PDF)
- **docs/auditoria-costes-2026-04-29.html** — costes Blaze
- **docs/auditoria-costes-5000eur-2026-04-30.html** — presupuesto 5.000 €
- **scripts/send-pdfs-email.py** — script para enviar PDFs por Gmail SMTP

---

## 12. Posicionamiento del proyecto (para tener presente)

**Cartagenaeste es:**
- Plataforma FORMATIVA y organizador personal de guardia
- NO diagnóstica
- Datos seudonimizados con fines docentes
- Disclaimer permanente
- Licencia propietaria · RPI 00765-03096622

**No olvidar:**
- Cero marcas comerciales farma (regla CLAUDE.md #5)
- Hosting GitHub Pages (regla CLAUDE.md #9), NO Firebase Hosting
- Dos repos sincronizados (regla CLAUDE.md #10): trabajar en `Cartagenaeste`, sincronizar con `area2cartagena`
- Branch protection activa en ambos repos (regla CLAUDE.md #11): cambios entran por PR

---

**Generado**: 2026-04-30 · final de la sesión Claude Code
**Sesión ID**: bca52c04-7a28-465c-965f-09a42482570b
**Para reanudar el contexto exacto**: el JSONL local está en `~/.claude/projects/-Users-carlos-cartagenaestewebappSOLIDA/bca52c04-7a28-465c-965f-09a42482570b.jsonl` (solo accesible en este Mac). Para retomar en otro ordenador: clonar repo + leer este documento + leer `docs/dossier-cartagenaeste-2026-04-29.md`.
