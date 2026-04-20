# Architecture summary · Cartagenaeste v1.0.0

## Stack tecnológico

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO (navegador / PWA)                │
│  HTML vanilla + JS + Service Worker v74 (network-first)     │
│  Firebase Auth compat + App Check compat + Functions compat │
│  ai-client.js → window.askAi()                              │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│         Cloud Functions · europe-west1 · Node 22 TS         │
│  askAi         → routing + quota + cache + rate-limit       │
│  setUserRole   → custom claims                              │
│  publicMetrics → HTTP público con JSON agregado             │
│  auditCases, auditAiRequests, auditSugerencias, ...         │
│  dailyBackup, weeklyMetricsSnapshot, weeklyAuditDigest      │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│               Proveedores IA externos                       │
│   DeepSeek (directo)   OpenRouter (→ Gemini, Qwen, Mistral) │
└─────────────────────────────────────────────────────────────┘
               │
┌─────────────────────────────────────────────────────────────┐
│   Firestore · europe-west1 · region EU                      │
│  users/{uid} + /cases + /aiRequests + /quotas + /progress   │
│  aiCache  rate_limits_ip  auditLogs  metrics_snapshots      │
│  informes_ia  mis_plantillas  triajes  sugerencias  ...     │
│  Rules deny-by-default + validador DNI/NIE                  │
└─────────────────────────────────────────────────────────────┘
               │
┌─────────────────────────────────────────────────────────────┐
│   Cloud Storage · bucket EU                                 │
│  scan_uploads/{uid}/* · propuestas/*                        │
│  Rules: 5 MB scan / 50 MB propuestas                        │
│  Backup bucket: gs://docenciacartagenaeste-backups/         │
└─────────────────────────────────────────────────────────────┘
```

## Flujo de una petición IA

1. Usuario escribe en chatbot → `window.askAi({type, prompt, systemPrompt})` (ai-client.js).
2. Cliente verifica Firebase Auth (`currentUser`), añade token App Check, invoca `httpsCallable('askAi')`.
3. Cloud Function `askAi`:
   - Valida input (sanitize + DNI/NIE blocker).
   - Chequea rate limit por IP (`rate_limits_ip/{ip}__{minute}`).
   - Chequea y consume cuota diaria (`users/{uid}/quotas/{YYYY-MM-DD}`, transacción).
   - Busca en caché sha256 (`aiCache/{hash}`, TTL 7d).
   - Si miss → provider chain (DeepSeek direct → OpenRouter fallbacks).
   - Escribe entrada en `users/{uid}/aiRequests/{autoId}` (metadatos, sin texto).
   - Responde al cliente con `{provider, model, text, cached, latencyMs, tokensIn, tokensOut}`.
4. Logger estructurado emite `askAi.call` con metadatos. **Nunca** texto del prompt.

## Observabilidad

- **Audit log** (`auditLogs`): trigger onDocumentWritten sobre 7 colecciones. Inmutable.
- **Backup**: `dailyBackup` → `gs://docenciacartagenaeste-backups/firestore/{YYYY-MM-DD}/`.
- **Métricas**: `weeklyMetricsSnapshot` → `metrics_snapshots/{YYYY-Www}`. Publicadas vía `publicMetrics` HTTP.
- **Alertas**: Sentry opt-in (`window.SENTRY_DSN`) en frontend; Cloud Logging + Monitoring en backend.

## Residencia de datos

- Todos los servicios Firebase están configurados en `europe-west1` (Bélgica) o `eur3` (multi-region EU).
- Proveedores IA externos:
  - DeepSeek: infraestructura en China.
  - OpenRouter: routing global (puede enviar a proveedores fuera de UE).
  - Los prompts/respuestas NO contienen PII por validador DNI/NIE + seudonimización obligatoria.
- Cloud Functions logs: Google Cloud Logging, región EU.

## Tests y CI

- **63 tests unitarios** (validation, cache, quotas, rate-limit, routing, providers, logging).
- **25+ tests de Firestore rules** (aislamiento, role escalation, DNI/NIE, inmutabilidad auditLogs).
- **gitleaks** en cada PR + push a main.
- **CI workflow**: typecheck + unit tests + secret scan + html-validate (warn only).
- **Deploy workflow**: push tag v* → build → test → firebase deploy + sync a repo del dominio custom.
