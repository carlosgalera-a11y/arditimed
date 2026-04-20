## [1.0.0] — 2026-04-22

### Solidez para Financiación

Primer release etiquetado para presentación a evaluadores técnicos (incubadoras, CDTI, farma, administraciones públicas). App pitch-ready con seguridad endurecida, audit log inmutable, backup diario automático, monitoring activo, documentación completa. En uso clínico activo en H.G.U. Santa Lucía (Área II Cartagena).

### Added
- **Cloud Function `askAi`** unificada en `europe-west1` (TypeScript Node 22) con routing por tipo (clinical_case / educational / vision), cuota 50 req/día por usuario (200 admin), caché 7 días por sha256, rate limit 30/min por IP, validación DNI/NIE/NHC en el prompt, logging estructurado sin texto del prompt.
- **Cloud Function `setUserRole`** callable para asignar custom claims (admin/superadmin) por email.
- **Cloud Functions de audit log** (7 triggers onDocumentWritten) que escriben entradas inmutables en `auditLogs`.
- **Cloud Function programada `dailyBackup`** (03:00 Europe/Madrid) que exporta Firestore a bucket UE.
- **Cloud Function programada `weeklyMetricsSnapshot`** (lunes 03:00) + **`weeklyAuditDigest`** (lunes 09:00).
- **Endpoint HTTP público `publicMetrics`** con métricas agregadas sin PII (cache 1h, CORS abierto).
- **Página `status.html`** con KPIs en vivo y estado de disponibilidad.
- **`ai-client.js`** frontend: cliente único `window.askAi()` con manejo de errores, reintento en timeout, init App Check opt-in.
- **`sw.js` v74**: network-first con timeout 3s para navegación, stale-while-revalidate para assets, bypass Firestore/Auth/Functions/Storage.
- **`sw-update.js`**: banner "Nueva versión disponible" no bloqueante.
- **`errorMessages.js`**: traducción código→mensaje en español para Firebase Auth/Functions/Firestore.
- **`sentry-init.js`** + **`global-error-handler.js`**: Sentry opt-in via `window.SENTRY_DSN`, scrubber PII, toast UX.
- **Firestore rules deny-by-default** con helpers `signedIn/isOwner/isAdmin`, validador DNI/NIE, subcolecciones `users/{uid}/{cases,aiRequests,quotas,progress}`, `aiCache`, `rate_limits_ip`, `auditLogs`, `metrics_snapshots`.
- **Storage rules tightened**: límite 5 MB en scan_uploads, 50 MB en propuestas, tipos MIME validados.
- **25+ tests** con `@firebase/rules-unit-testing` para verificar aislamiento entre usuarios y deny-by-default.
- **63 tests unitarios** en `functions/` con cobertura statements >95%.
- **CLAUDE.md** con reglas innegociables del proyecto y procedimiento de sync entre los dos repos (`Cartagenaeste` + `area2cartagena`).
- **Documentación**: `README.md`, `LICENSE` (propietaria + Art. 51 LPI), `IP_ATTESTATION.md`, `AUTHORS.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`.
- **CI en GitHub Actions**: lint + typecheck + test-unit + test-rules + secret-scan con gitleaks.
- **`test-deploy.sh`** con verificaciones automatizables post-deploy.

### Changed
- **Eliminados todos los fetches directos** del frontend a proveedores IA (DeepSeek, OpenRouter, Pollinations, Groq, DashScope/Qwen): 35+ URLs purgadas en `index.html`, `app.html`, `notebook-local.html`, 7 HTMLs standalones migrados a `httpsCallable('askAi')`.
- **XOR-42 obfuscation retirada**: `_dk()`, `_xd()`, `_KP`, `_KP_ENC`, `FH_GROQ_KEY` base64-split → todos vacíos.
- **Título HTML** limpiado: sufijo "build 1775728909" eliminado de `<title>`, `meta description`, `meta keywords`, Open Graph, schema.org JSON-LD.
- **`manifest.json`** start_url y scope pasan de `/Cartagenaeste/` a `/` (dominio custom `area2cartagena.es`).
- **Copy "IA diagnóstica" → "IA docente"** en metas SEO (regla innegociable: plataforma formativa).
- **Política de privacidad** actualizada: flujo IA vía Cloud Function propia, proveedores Gemini/DeepSeek/OpenRouter reemplazan mención a Groq.
- **CSP**: IP interna `http://REDACTED_INTERNAL_IP:3100` eliminada de `connect-src`.
- **`Permissions-Policy`** añadida vía `<meta>` (GitHub Pages no permite headers server-side).

### Removed
- `ADMIN-CREDENTIALS.md` (credenciales en texto plano — **rotadas por Carlos**).
- `sw-v2.js` (service worker obsoleto auto-destructivo).
- `login-fix.html` (página de debug que desregistraba todos los SW).
- `app-v1773346150.html` (copia versionada obsoleta).
- `notebook-local (4).html`, `notebook-groq.html`, `notebook-groq-demo.html`, `obtener-groq-key.html`.
- `backend/` (proxy NAS con secretos — movido a repo privado).
- `cartagena-este-webapp/` (duplicado en subcarpeta).
- Referencias a la IP `REDACTED_INTERNAL_IP` en 9 archivos (quedan comentarios en docs).

### Security — Carlos rotó tras la auditoría S1.2
- OpenRouter API key `sk-or-v1-6f0e1c0c…` (XOR-42).
- OpenRouter API key #2 `sk-or-v1-9ccad5a7…` (base64 split `_KP`).
- DeepSeek API key `sk-a89dd17f…` (XOR-42) + antigua `sk-6a5ea8df…`.
- DeepL API key `adaad50f-aa27-…` (plaintext en `app-main.js`).
- FH_BLOG_WP token `fh_k8x2pL…` (plaintext).
- Groq key `gsk_GTTqfTXpC5…` (base64 split).

Ver [docs/security-audit-2026-04-21.md](docs/security-audit-2026-04-21.md) y addendum para detalle completo.

