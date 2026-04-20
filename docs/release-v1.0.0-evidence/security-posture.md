# Security posture · Cartagenaeste v1.0.0

## Capas defensivas

### 1. Autenticación
- Firebase Authentication: Google OAuth + Email/Password.
- Tokens JWT firmados con rotación automática.
- Claves Firebase Web (API key) pública por diseño — hardening vía App Check + restricciones de Referrer.

### 2. Autorización (Firestore rules)
- **Deny-by-default** en `match /{document=**}`.
- Helper `isAdmin()` basado en custom claims (`request.auth.token.admin == true` + `role in ['admin','superadmin']`) + bootstrap email allowlist.
- Aislamiento estricto entre usuarios: `users/{uid}/**` solo accesible por el propio `uid` o admin.
- Colecciones server-only: `aiCache`, `rate_limits_ip`, `auditLogs`, `metrics_snapshots`, `quotas`, `aiRequests` → cliente **no puede escribir**.
- Validador `noDni()` sobre `cases.notes`: rechaza strings con patrón DNI (8 dígitos + letra) o NIE (XYZ + 7 dígitos + letra).
- Máximo `initials.size() <= 4` para evitar nombre completo.

### 3. Cloud Function askAi
- `enforceAppCheck: false` actualmente (pendiente reCAPTCHA v3 + frontend integration).
- Auth required: `request.auth.uid` obligatorio.
- Rate limit IP: 30 req/min por IP (Firestore counter).
- Quota user: 50 req/día (200 admin), Firestore transaction.
- Validación DNI/NIE/NHC en el prompt (además del filter en rules).
- Secrets en **Secret Manager** (Cloud KMS behind the scenes): `DEEPSEEK_API_KEY`, `OPENROUTER_API_KEY`.
- Logging estructurado sin texto del prompt ni respuesta, solo metadatos + hash sha256.

### 4. Storage rules
- `scan_uploads/{uid}/*`: solo dueño, máx 5 MB, MIME image/* o PDF.
- `propuestas/*`: auth required, máx 50 MB, MIME documento.

### 5. Audit log inmutable
- 7 colecciones cubiertas por triggers Cloud Function `onDocumentWritten`.
- Entradas en `auditLogs/{autoId}`: solo metadatos (uid, action, resourceType, resourceId, changedFields, timestamp).
- `create: if false` en rules → **ningún cliente puede escribir** auditLogs. Solo server.
- `update, delete: if false` → inmutable.

### 6. Backup y recuperación
- `dailyBackup` Cloud Function (cron 03:00 Europe/Madrid) exporta Firestore a `gs://docenciacartagenaeste-backups/firestore/{YYYY-MM-DD}/`.
- Lifecycle bucket: Standard 90d → Archive 1 año → delete (Carlos configura manualmente).
- Recuperación: `gcloud firestore import gs://docenciacartagenaeste-backups/firestore/{YYYY-MM-DD}`.

### 7. Monitoring & alertas
- Sentry frontend (opt-in via `window.SENTRY_DSN`) con scrubber PII (redacta notes/diagnosis/treatment/observations/prompt).
- Cloud Logging estructurado en todas las Functions.
- Alertas recomendadas (Carlos configura en consola): error rate askAi >5% en 10 min, latencia p95 >8s, coste mensual >50€.

### 8. Secretos
- **Cero secretos en frontend** tras la auditoría S1.2 (ver [docs/security-audit-2026-04-21.md](../../security-audit-2026-04-21.md)).
- Rotación documentada: 8 claves identificadas y rotadas (DeepSeek × 2, OpenRouter × 2, DeepL, FH_BLOG_WP, Groq).
- `gitleaks` en CI + pre-commit hook previene fugas futuras.
- `.gitleaks.toml` con reglas custom para groq/deepseek/openrouter.

### 9. Transport security
- HTTPS enforced por GitHub Pages (HSTS max-age=1 año).
- Cert gestionado por GitHub (Let's Encrypt renovación automática).
- CSP meta tag con `default-src 'self' https:` + lista de orígenes permitidos.
- `Permissions-Policy` meta: camera/microphone `self`, geolocation/payment/usb `none`.

### 10. Input validation
- Server-side sanitize: prompts limitados a 8000 chars; systemPrompt 4000; image 5 MB.
- Regex DNI/NIE/NHC como reject.
- Control chars (0x00-0x1F excepto whitespace) eliminados.

## Controles pendientes (roadmap inmediato)

- [ ] App Check enforce en Functions (requiere reCAPTCHA v3 site key).
- [ ] App Check enforce en Firestore + Storage (requiere frontend enviando token).
- [ ] Firebase Performance Monitoring activado en consola.
- [ ] Cloud Monitoring custom dashboard con SLOs.
- [ ] `git filter-repo` sobre historia para purgar las 8 claves rotadas (coordinar ventana).
- [ ] Branch protection en `main` (GitHub Settings).

## Evidencia de trazabilidad

- `docs/diagnostico-2026-04-21.md` — auditoría inicial (68 entradas catalogadas).
- `docs/security-audit-2026-04-21.md` — auditoría de secretos detallada.
- `docs/security-audit-2026-04-21-addendum.md` — hallazgos posteriores (S10/S11).
- `CHANGELOG.md` — histórico de cambios de seguridad.
- `auditLogs` collection — log inmutable runtime de todas las acciones críticas.
