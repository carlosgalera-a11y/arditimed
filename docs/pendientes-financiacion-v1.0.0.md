# Pendientes para hacer Cartagenaeste vendible / conseguir financiación
Fecha: 2026-04-21 · Autor: Carlos Galera Román · Registro IP: 00765-03096622

## Estado actual (lo que YA está listo para mostrar)

- ✅ Webapp en producción: https://area2cartagena.es/ + https://carlosgalera-a11y.github.io/Cartagenaeste/
- ✅ Release v1.0.0 etiquetada (19 PRs mergeadas en 1 día)
- ✅ Cloud Function `askAi` en europe-west1 (UE), routing DeepSeek + OpenRouter (Gemini/Mistral/Qwen)
- ✅ Secretos en Google Secret Manager (nunca en cliente)
- ✅ Firestore rules deny-by-default + 25+ tests unitarios
- ✅ TTL policies activas (`aiCache`, `rate_limits_ip`)
- ✅ Audit log inmutable (7 colecciones con triggers onWrite)
- ✅ Backup diario programado con lifecycle 365d→Archive
- ✅ Status page pública (`/status.html`) con métricas agregadas
- ✅ CI/CD workflows GitHub Actions (no activos, falta secret service-account)
- ✅ Documentación completa: LICENSE propietaria, IP_ATTESTATION, README, CHANGELOG
- ✅ En uso clínico real (H.G.U. Santa Lucía · Área II Cartagena)
- ✅ Cuota 50/día/usuario + rate limit 30/min/IP

---

## 🔴 BLOQUEANTES — resolver antes de pitch a inversores/CDTI

### 1. Rotar las 3 claves que siguen vivas en código público
- [ ] **DeepL** `adaad50f-aa27-…` (traducción) — https://www.deepl.com/account/summary
- [ ] **FH_BLOG_WP** `REDACTED_FH_WP_2026-04` (blog cartagenaeste.es) — WordPress admin
- [ ] **Groq** `gsk_GTTqfTXpC5…` — https://console.groq.com/keys (borrar, no rotar: ya no se usa)

**Por qué bloquea**: cualquier due diligence tech scan de un inversor detectará claves en commits. Mala imagen.

### 2. Purgar claves antiguas del histórico git (git filter-repo)
- [ ] Ejecutar `git filter-repo --replace-text` sobre las ~12 claves rotadas. Requiere ventana de mantenimiento y force-push coordinado en ambos repos (`Cartagenaeste` + `area2cartagena`).
- [ ] Comandos listos en `docs/security-audit-2026-04-21.md` §5.2.

**Por qué bloquea**: GitHub Secret Scanning expone claves históricas. El código es público.

### 3. Branch protection en `main` (2 min en GUI)
- [ ] https://github.com/carlosgalera-a11y/Cartagenaeste/settings/branches → Add rule: require PR, block force push, include administrators.

**Por qué bloquea**: un repo público sin branch protection es red flag para due diligence.

### 4. Verificar usuario admin fantasma borrado
- [ ] `redacted@example.invalid / REDACTED_PASSWORD_2026-04` estaba en ADMIN-CREDENTIALS.md. Confirmar en Firebase Console → Authentication que NO existe como usuario activo.

---

## 🟡 ALTO IMPACTO — necesarios para "vendible" a B2B sanitario

### 5. App Check enforce ON (hoy OFF)
- [ ] Crear site key reCAPTCHA v3: https://www.google.com/recaptcha/admin/create (dominio `area2cartagena.es`).
- [ ] Añadir `window.RECAPTCHA_SITE_KEY = '...'` en index.html, app.html, notebook-local.html, chatbot-medicacion.html, triaje-ai.html, pacientes.html, corrector-clinico.html, analiticas.html, transcripcion.html, plantillas-informes.html.
- [ ] Cambiar `enforceAppCheck: false → true` en `functions/src/askAi.ts` + redeploy.
- [ ] Activar enforce en Firestore + Storage desde Firebase Console.

**Por qué importa**: sin esto cualquier script externo puede llamar a la Cloud Function. Los reviewers técnicos lo detectan.

### 6. Sentry activo (código ya está, falta DSN)
- [ ] Crear cuenta sentry.io (free tier, 5k events/mes).
- [ ] Obtener DSN del proyecto.
- [ ] Añadir `window.SENTRY_DSN = '...'` en HTMLs principales (inline, no hay SSR).
- [ ] En Cloud Functions: `firebase functions:secrets:set SENTRY_DSN` + integrar `@sentry/google-cloud-serverless`.

**Por qué importa**: sin observabilidad, un inversor asume incidentes sin detectar. Hoy solo tenemos Cloud Monitoring nativo de GCP.

### 7. GitHub Actions secrets para deploy automatizado
- [ ] Crear Service Account en GCP con role `roles/cloudfunctions.developer` + `roles/firebasehosting.admin`.
- [ ] Descargar JSON → GitHub Settings → Secrets → `FIREBASE_SERVICE_ACCOUNT`.
- [ ] PAT fine-grained con `repo:write` sobre `area2cartagena` → `AREA2_PAT`.

**Por qué importa**: hoy deploy es manual (`firebase deploy`). Un auditor quiere ver CI/CD funcional.

### 8. Cloud Monitoring dashboard + 8 alertas
- [ ] Dashboard "Cartagenaeste Producción" con: latencia p50/p95/p99 askAi, error rate, invocaciones/h, Firestore reads/writes, coste mensual, usuarios activos.
- [ ] Alertas email → carlosgalera2roman@gmail.com:
  - Error rate askAi >5% en 10 min → ALTA
  - p95 askAi >8s en 5 min → MEDIA
  - Firestore reads >200k/h → MEDIA
  - Coste mensual >50€ → ALTA
  - Cualquier 5xx hosting → MEDIA

**Por qué importa**: sin alertas proactivas, pierdes "operational excellence" en la defensa.

### 9. Firebase Performance Monitoring
- [ ] Verificar si está activo en Console → Firebase Performance.
- [ ] Si no, añadir SDK compat en HTMLs principales.

---

## 🟢 PARA VENDER A FARMA / HOSPITAL / CDTI NEOTEC

### 10. Dossier de evidencia técnica (`docs/release-v1.0.0-evidence/`)
- [ ] 10+ screenshots en producción (desktop + móvil: home, casos-clínicos, calculadoras, IA chat, status)
- [ ] Lighthouse report HTML (Performance ≥75, A11y ≥85, Best Practices ≥85, PWA=100)
- [ ] gitleaks scan output (limpio)
- [ ] Tests output (63 unit + 25 rules)
- [ ] Capturas Cloud Monitoring dashboard
- [ ] Capturas Sentry dashboard
- [ ] Captura Firestore auditLogs con acción de prueba
- [ ] PDF de `/status.html` y de `IP_ATTESTATION.md`

**Formato**: carpeta numerada `01-screenshots/`, `02-tests/`, `03-security/`, `04-monitoring/`, `05-compliance/`.

### 11. EU AI Act 2024/1689 compliance dossier
- [ ] Documentar clasificación del sistema (IA de alto riesgo en contexto sanitario).
- [ ] Matriz de controles: transparencia (disclaimer formativo), supervisión humana, robustez, trazabilidad (audit log).
- [ ] Registro de proveedores IA usados y data residency (europe-west1 + OpenRouter fallback con TODO EU-residency estricta).
- [ ] Plan de gestión de riesgos (impact assessment de errores IA en decisiones clínicas).
- [ ] Documento en `docs/ai-act-compliance.md`.

**Por qué importa para farma**: AstraZeneca Medical Affairs, Pfizer y similares exigen AI Act assessment antes de co-branding.

### 12. RGPD / LOPDGDD completo
- [ ] Registro de Actividades de Tratamiento (RAT) en `docs/legal/rat.md`.
- [ ] Evaluación de Impacto (EIPD/DPIA) — pseudonimización + base jurídica + medidas técnicas.
- [ ] Contratos de encargado (DPA) firmados con Google Cloud + OpenRouter + DeepSeek.
- [ ] Política de retención de datos documentada (hoy: audit 1 año, aiCache 7d, rate_limit 2min).
- [ ] Figura de Delegado de Protección de Datos (DPO): interno o externo.

### 13. Certificación ISO 27001 / SOC 2 (opcional, diferencial)
- [ ] Inventario de activos.
- [ ] Política de seguridad de la información.
- [ ] Plan de continuidad de negocio (backups ya hay, falta BCP formal).
- [ ] Auditoría externa (~3-6k€ anuales).

**Por qué importa**: requisito habitual para integración con sistemas clínicos hospitalarios.

### 14. Marcado CE / MDR (Medical Device Regulation)
- [ ] **Decisión crítica**: ¿es dispositivo médico?
  - Si la IA sugiere diagnósticos o tratamientos a profesionales → SÍ, clase IIa mínimo → marcado CE obligatorio.
  - Si es "organizador personal" + formación sin reclamo médico → fuera de alcance.
- [ ] Consultar con notified body (p.ej. TÜV, SGS) para clasificación formal.
- [ ] Posicionamiento actual CLAUDE.md ("formativa, NO diagnóstica") es defendible, pero la línea se difumina con MegaCuaderno IA.

**Este es probablemente el punto más crítico legal-comercial**. Recomiendo asesoría legal especializada antes de cualquier venta hospitalaria.

### 15. Business case cuantitativo
- [ ] Métricas de uso actuales (DAU, MAU, casos creados/mes, preguntas IA/mes) → ya tienes publicMetrics.
- [ ] Ahorro de tiempo demostrado: cronometrar en Santa Lucía cuánto se tarda con vs sin la app en preparar un pase de guardia.
- [ ] Coste por usuario/mes (hoy ~1-3€ IA + ~0.5€ infra Firebase).
- [ ] Propuesta de pricing: freemium + €15/mes profesional individual + €300/mes hospital ilimitado.
- [ ] TAM: médicos de urgencias España (~12.000) + residentes MIR activos (~8.000) + medicina interna/AP = ~60.000 profesionales.

### 16. Roadmap técnico 12 meses (para slide deck)
- [ ] Integración HL7 FHIR con SELENE/OMI (HCE del SMS).
- [ ] Módulo de voz con Whisper para transcripción clínica.
- [ ] Vision mejorada: lectura DICOM (RX, TAC) con modelos EU-residency.
- [ ] App móvil nativa iOS/Android (hoy PWA).
- [ ] Exportación/integración con plantillas oficiales SERAM, SEMG, etc.
- [ ] Plugin para Microsoft Teams del SMS.

### 17. Marca y presencia
- [ ] Logo profesional (hoy falta, solo texto).
- [ ] Identidad visual coherente (paleta definida pero sin brand book).
- [ ] LinkedIn Company Page.
- [ ] Video demo 90s para pitch.
- [ ] Landing de producto separada de la webapp clínica (p.ej. `cartagenaeste.com` con CTA "solicita demo").

---

## 🔵 MEJORAS TÉCNICAS (no bloqueantes pero elevan percepción)

### 18. Responsive audit profesional
- [ ] Lighthouse mobile en 375px, 412px, 768px, 1440px.
- [ ] Corregir font-size <0.75rem en móviles.
- [ ] Wrapping de tablas (`overflow-x: auto`) en analiticas.html y plantillas-informes.html.
- [ ] Test en iOS Safari + Chrome Android real.

### 19. Accesibilidad WCAG 2.1 AA
- [ ] Audit con axe-core o WAVE.
- [ ] Contraste de colores revisado (modo claro + oscuro).
- [ ] Navegación por teclado verificada.
- [ ] Skip to main content link.
- [ ] aria-labels en iconos.

### 20. Cleanup código muerto
- [ ] Eliminar `megaCallNAS`, `megaCallDeepSeek`, `megaCallOpenRouter`, `megaCallPollinations`, `ckCallOR` (huérfanas tras refactor).
- [ ] Eliminar `about:disabled-*` residuales.
- [ ] Eliminar `_dk()`, `MEGA_OR_KEY`, `MEGA_DS_KEY` (ya no se usan).
- [ ] Eliminar `ENDPOINTS` config de app.html (ya no se usa).
- [ ] Eliminar funciones viejas en Firebase (llamarIA, scanIA, apiMetricas us-central1, etc.).

### 21. Tests E2E con Playwright
- [ ] Smoke test: login Google → pregunta IA → respuesta.
- [ ] Test de checklist clínico.
- [ ] Test de triaje QR completo.
- [ ] Integrar en CI.

### 22. Documentación de API interna
- [ ] OpenAPI spec de Cloud Functions (askAi, publicMetrics, setUserRole).
- [ ] Decisión architectural records (ADRs) para decisiones clave.

### 23. Internacionalización
- [ ] Hoy solo español. Si hay interés internacional: i18n con claves JSON + inglés mínimo.

---

## Priorización sugerida

**Semana 1 (10h)**: #1, #2, #3, #4, #5, #6 → seguridad bloqueante resuelta.

**Semana 2 (10h)**: #7, #8, #10 → observabilidad + dossier.

**Semana 3-4 (20h)**: #11, #12, #15 → compliance + business case → listo para pitch.

**Semana 5+ (opcional)**: #14 (dispositivo médico), #17 (marca).

Con semanas 1-2 ya puedes abrir conversaciones con:
- INFO Murcia (acelerador regional)
- CDTI Neotec (financiación pública I+D)
- Ayudas DGPolítica Digital (NGEU Next Generation)

Con semanas 1-4 podrías ir a:
- AstraZeneca Medical Affairs
- Dirección H.G.U. Santa Lucía (uso oficial institucional)
- UCAM HiTech / UMU OTRI (spin-off universitaria)
- Almirall, Pfizer (programas de innovación open)

**Recomendación personal**: focaliza #1-#8 antes de dedicar tiempo a #10-#17. Sin seguridad endurecida, el mejor pitch se cae en la primera pregunta técnica.
