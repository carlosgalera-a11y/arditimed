# Auditoría de secretos · Cartagenaeste · 2026-04-21

Ejecutada sobre rama `chore/s1.2-part-a` (base `fix/security-cleanup`, PR #1 sin mergear). Cubre Parte A de la Sesión 1.2 del plan de 4 días.

- Objetivo: cero secretos en frontend público y pipeline de rotación documentado.
- Método: `git grep` sobre HEAD + `git log --all -p` + revertido manual del XOR-42.

---

## 1 · Tabla de claves detectadas

| # | Archivo:línea | Tipo | Valor (primeros 8 chars) | Ofuscación | Severidad | Acción |
|---|---|---|---|---|---|---|
| S01 | [app-main.js:57](app-main.js:57) | **OpenRouter** | `sk-or-v1-6f0e1c0c…` | XOR-42 (trivial) | **CRÍTICA** (live en prod HOY) | Rotar en https://openrouter.ai/keys |
| S02 | [app-modules.js:38,872](app-modules.js:38) | **DeepSeek** (nuevo) | `sk-a89dd17f…` | XOR-42 (trivial) | **CRÍTICA** (live en prod HOY) | Rotar en https://platform.deepseek.com/api_keys |
| S03 | [app-main.js:2672](app-main.js:2672) | **DeepL** | `adaad50f-aa27-40bb…` | **NINGUNA** (texto plano) | **CRÍTICA** (live en prod HOY) | Rotar en https://www.deepl.com/pro-account/summary |
| S04 | [app-modules.js:156](app-modules.js:156) | **FH_BLOG_WP** token | `fh_k8x2pL9mNqR…` | **NINGUNA** (texto plano) | **CRÍTICA** (live en prod HOY) | Rotar en el backend WP de `cartagenaeste.es` (Settings → FileHub → API Keys) |
| S05 | 21 archivos .html + py | **Firebase Web API** | `AIzaSyAvdYi6BV…oykc` | Ninguna (pública por diseño) | MEDIA | NO se rota (clave pública Firebase). **Hardening: App Check enforce + domain restrictions**. |
| S06 | [agenda-guardia.html:147](agenda-guardia.html:147) · [cuadernos-ia.html:126](cuadernos-ia.html:126) | **Firebase Web API** (variante) | `AIzaSyAvdYi6BV…o_1o` | Ninguna | ALTA | Sufijo `_1o` — posible corrupción tras una copia. Unificar a la key canónica y revocar la otra si existe en Firebase Console. |
| S07 | [AUDIT_2026-04-04.md](AUDIT_2026-04-04.md) · historia git | **DeepSeek** (antigua) | `sk-6a5ea8df…917979f` | XOR-42 | ALTA (ya publicada, asumir comprometida) | Ya detectada 2026-04-04; confirmar que fue rotada. Si no, **rotar también**. |
| S08 | historia git completa | Cualquier clave pasada | — | — | ALTA | `git filter-repo` (ver §5). |

### Notas de evaluación

- **CRÍTICA** = visible en el JavaScript servido hoy por `https://area2cartagena.es/`. DevTools → Sources → Ctrl+F de cualquier visitante basta para extraerla.
- La "ofuscación XOR-42" **no es un mecanismo de seguridad**. Se revierte en 5 líneas de JS (§4). El atacante modelo — un navegador abierto — **no necesita conocer el código fuente** porque el runtime ya expone la clave en claro al hacer `new Request('https://openrouter.ai/…', { headers: { Authorization: 'Bearer '+ _dk() }})`: un listener sobre `fetch` imprime la cabecera.
- Las claves Firebase Web son **públicas por diseño** pero **solo son seguras si**: (1) App Check enforce activo, (2) HTTP Referrer restriction en la Google Cloud Console para esa API key, (3) Firestore rules que deniegan todo sin `request.auth`. Hay que verificar los 3 puntos.

---

## 2 · Referencias a providers deprecados (a eliminar en Parte B)

20 archivos contienen strings de providers que deben migrarse o borrarse:
- **Pollinations AI** (`pollinations.ai`) → ya no alineado con la Política IA del CLAUDE.md, remover.
- **Groq API** (`groq.com`, `groq_api_key` en Firestore) → remover; el plan dice DeepSeek/Gemini/Mistral/Qwen.
- **Anthropic directo** (`anthropic.com/v1`) → pasar por Cloud Function si se necesita Claude.
- **OpenRouter directo** → todas las llamadas deben pasar por `askAi`.

**Hallazgo colateral S09**: [app-main.js:1713](app-main.js:1713) guarda un `groq_api_key` en **`db.collection("config").doc("groq_api_key")`** — si la clave cae ahí con rules laxas, cualquier usuario autenticado la lee. Verificar `firestore.rules` y **purgar el doc**. Añadir a la rotación.

---

## 3 · Verificación de limpieza previa (S1.2 ad-hoc)

Lo hecho en PR #1 vs lo que queda en HEAD actual:

| Ítem | Estado |
|---|---|
| `REDACTED_INTERNAL_IP` en código público | ✅ Eliminado salvo `api-config.js:43` (check legítimo `h.startsWith('192.168.')`) |
| `http://REDACTED_INTERNAL_IP:3100` en CSP | ✅ Eliminado |
| Clave DeepSeek `sk-6a5...979f` en HEAD | ✅ Eliminada (solo queda en docs históricos) |
| ADMIN-CREDENTIALS.md | ✅ Borrado |
| sw-v2.js, login-fix.html, backend/, duplicados | ✅ Borrados |
| Referencias Pollinations | ❌ Siguen en 20 archivos |
| Referencias Groq | ❌ Siguen en notebook-groq*, obtener-groq-key.html, app-main.js |
| _dk() XOR / _KP / _xd | ❌ Siguen — Parte B los elimina |

---

## 4 · XOR-42: mecánica y revert (5 líneas)

El código en `app-main.js:55-57` es:

```js
function _xd(c){return c.split(',').map(function(n){return String.fromCharCode(parseInt(n)^42)}).join('');}
var _KP_ENC='x';
function _dk(){return _xd('89,65,7,69,88,7,92,27,7,28,76,26,79,27,73,26,73,73,79,24,24,31,29,72,31,25,31,79,24,19,75,72,18,24,26,78,72,25,27,78,30,19,73,78,31');}
```

### Cómo se revierte (demostrado hoy, 2026-04-21)

```bash
node -e '
function xd(c){return c.split(",").map(n=>String.fromCharCode(parseInt(n)^42)).join("");}
console.log(xd("89,65,7,69,88,7,92,27,7,28,76,26,79,27,73,26,73,73,79,24,24,31,29,72,31,25,31,79,24,19,75,72,18,24,26,78,72,25,27,28,27,27,30,31,26,78,30,26,18,27,75,19,79,30,24,79,75,28,31,18,27,72,18,79,79,28,31,76,30,19,73,78,31"));
'
# Salida: REDACTED_OPENROUTER_1_2026-04
```

### Por qué no es seguridad

1. **No hay clave secreta**: el "clave" XOR (42) está escrita en claro en la misma función `^42`.
2. **No hay capa de ofuscación**: es XOR de un solo byte, reversible trivialmente incluso sin ver el código (fuerza bruta de 256 posibilidades en microsegundos).
3. **La clave termina en claro en la memoria del navegador**: cualquier extensión con permiso de `Debugger` o un proxy que intercepte tráfico (Burp, mitmproxy) ve la cabecera `Authorization: Bearer sk-or-v1-…`.
4. **Marcos jurídicos**: ante un DPO o auditor, un XOR-42 se califica como **"key en claro"**. No aporta separación de funciones ni no-repudio.

### Evidencia adicional de que la técnica está rota

- El propio código dice `app-main.js:27`: `var decrypted=xorCipher(decodeURIComponent(escape(atob(raw))),getKey());` — el `getKey()` devuelve la misma constante hardcoded.
- Comentario auto-descriptivo en `app-main.js:910`: `"Keys en XOR-42 (_KP → _dk()) y _xd() dentro de llamarIA"` — la arquitectura misma anuncia el mecanismo.

### Fix arquitectónico

Parte B.1 (PR #4) **elimina el mecanismo completo**. No hay clave IA en frontend — todas las llamadas pasan por `httpsCallable('askAi')` con App Check y Firebase Auth. Las claves viven en Secret Manager (`firebase functions:secrets:set …`), accesibles solo al runtime de la Cloud Function.

---

## 5 · Comandos para Carlos · rotación y purga de historia

### 5.1 Rotación de claves (ejecutar tras mergear PR #3)

```bash
# ── OpenRouter ──
open https://openrouter.ai/keys
# Revoca la key sk-or-v1-6f0e1c0c… (hoy en app-main.js:57)
# Genera nueva:
firebase functions:secrets:set OPENROUTER_API_KEY
# (pega la nueva cuando pida input)

# ── DeepSeek ──
open https://platform.deepseek.com/api_keys
# Revoca sk-a89dd17f… (hoy en app-modules.js XOR)
# Revoca también sk-6a5ea8df… si sigue activa (AUDIT_2026-04-04 la registró)
firebase functions:secrets:set DEEPSEEK_API_KEY

# ── DeepL ──
open https://www.deepl.com/pro-account/summary
# Cambiar Authentication Key
firebase functions:secrets:set DEEPL_API_KEY

# ── FH_BLOG_WP (si se usa) ──
# Acceder al WP de cartagenaeste.es → Settings → FileHub → Rotar API key
# Si la integración se va a eliminar en Parte B, simplemente revocar.

# ── Google Gemini (para Parte B) ──
open https://aistudio.google.com/apikey
firebase functions:secrets:set GEMINI_API_KEY

# ── Mistral EU (para Parte B) ──
open https://console.mistral.ai/api-keys/
firebase functions:secrets:set MISTRAL_API_KEY

# ── Qwen / Dashscope (para Parte B) ──
open https://dashscope.console.aliyun.com/apiKey
firebase functions:secrets:set QWEN_API_KEY

# Verificar que los secretos están creados:
firebase functions:secrets:access OPENROUTER_API_KEY | head -c 10
# Debe mostrar los primeros 10 chars de la key nueva.
```

### 5.2 Purgar histórico git con filter-repo

> ⚠️ **DESTRUCTIVO E IRREVERSIBLE.** Reescribe la historia. Avisar a todo colaborador (solo `carlosgalera-a11y` en admin + `carlosgalera2roman-collab` como committer) **antes** de force-push. Todo fork/clon existente quedará desactualizado.

Paso 1 — instalar `git-filter-repo` (si no está):
```bash
brew install git-filter-repo
```

Paso 2 — backup local por si algo sale mal:
```bash
cd ~
git clone --mirror https://github.com/carlosgalera-a11y/Cartagenaeste Cartagenaeste-backup.git
```

Paso 3 — en el repo de trabajo (tras mergear PRs #1, #2, #3):
```bash
cd /Users/carlos/cartagenaestewebappSOLIDA

# a) Eliminar archivos sensibles de TODA la historia
git filter-repo --invert-paths \
  --path ADMIN-CREDENTIALS.md \
  --path "notebook-local (4).html" \
  --path app-v1773346150.html \
  --path backend/server.js \
  --path backend/docker-compose.yml \
  --path backend/Dockerfile \
  --path backend/package.json \
  --path sw-v2.js \
  --path login-fix.html

# b) Reescribir strings (claves) en TODOS los commits
cat > /tmp/replacements.txt <<'REPL'
REDACTED_DEEPSEEK_OLD_2026-04==>REDACTED_DEEPSEEK_OLD_2026-04-04
REDACTED_DEEPSEEK_2026-04==>REDACTED_DEEPSEEK_2026-04-21
REDACTED_OPENROUTER_1_2026-04==>REDACTED_OPENROUTER_2026-04-21
REDACTED_DEEPL_2026-04==>REDACTED_DEEPL_2026-04-21
REDACTED_FH_WP_2026-04==>REDACTED_FH_WP_2026-04-21
redacted@example.invalid==>redacted@example.invalid
REDACTED_PASSWORD_2026-04==>REDACTED_ADMIN_PASSWORD
REPL
git filter-repo --replace-text /tmp/replacements.txt

# c) Confirmar que los strings ya no están:
git log --all -p | grep -c "sk-or-v1-6f0e1c0c" || echo "OK: clave purgada"
git log --all -p | grep -c "sk-a89dd17f"      || echo "OK: clave purgada"

# d) Re-añadir remote y force push
git remote add origin https://github.com/carlosgalera-a11y/Cartagenaeste.git
git push --force-with-lease --all origin
git push --force-with-lease --tags origin
```

Paso 4 — tras verificar que GitHub muestra la historia limpia, notificar a cualquier forks/clones.

### 5.3 Borrar documento Firestore `groq_api_key`

```bash
# Abrir consola
open "https://console.firebase.google.com/project/docenciacartagenaeste/firestore/data/~2Fconfig~2Fgroq_api_key"
# Si existe el doc, Delete document.
```

### 5.4 Verificar App Check y API key restrictions

```bash
# 1. App Check enforce
open "https://console.firebase.google.com/project/docenciacartagenaeste/appcheck"
# Firestore → Enforce: ON
# Cloud Functions → Enforce: ON
# Storage → Enforce: ON

# 2. Restringir la Web API key por dominio
open "https://console.cloud.google.com/apis/credentials?project=docenciacartagenaeste"
# Editar la key AIzaSyAvdYi6BVdltgeFH4KLHD_5iFZrSRgoykc
# Application restrictions → HTTP referrers:
#   https://area2cartagena.es/*
#   https://carlosgalera-a11y.github.io/Cartagenaeste/*
#   http://localhost:5000/*   ← opcional, dev local
# API restrictions → Restrict key → Firebase Authentication, Cloud Firestore, Firebase Storage, Identity Toolkit
```

---

## 6 · Propuesta de branch protection en `main`

Estado actual (capturado 2026-04-21 vía `gh api repos/.../branches/main`):
```
protected: false
```

### 6.1 Config sugerida para empezar (solo Carlos como admin)

Abrir https://github.com/carlosgalera-a11y/Cartagenaeste/settings/branches → Add branch protection rule → Branch name pattern: `main`.

Activar:

| Opción | Estado | Razón |
|---|---|---|
| **Require a pull request before merging** | ✅ | Aunque trabajes solo, fuerza que cualquier cambio pase por PR (deja historial auditable). |
| Require approvals (1) | ⚠️ OPCIONAL mientras seas solo | Activar cuando entre un segundo colaborador. |
| Dismiss stale PR approvals on push | ⚠️ | Solo si activaste approvals. |
| **Require status checks to pass** | ✅ (cuando haya CI) | Añadir GitHub Action `lint+html-validate+npm test` en Parte B. Por ahora dejar sin checks. |
| Require branches to be up to date | ✅ | Evita merge con `main` desactualizado. |
| **Require conversation resolution** | ✅ | Para forzar leer comentarios. |
| Require signed commits | ⚠️ OPCIONAL | Buen estándar, pero exige configurar GPG. |
| Require linear history | ✅ | No merge-commits, solo rebase/squash. Historia más legible. |
| **Include administrators** | ✅ | Te auto-aplica las reglas → evita saltarlas por accidente. |
| **Restrict who can push to matching branches** | ✅ (solo tú como admin) | Bloquea push directo a `main`, obliga a usar PR. |
| **Allow force pushes → Block** | ✅ | Nunca más reescribir `main` sin filter-repo manual. |
| **Allow deletions → Block** | ✅ | Obvio. |

### 6.2 Cuando entre un segundo colaborador

- Activar Require 2 approvals (opcional, 1 mínimo).
- Añadir CODEOWNERS: `firestore.rules @carlosgalera-a11y`, `functions-setup/ @carlosgalera-a11y`, `.github/ @carlosgalera-a11y`.
- Activar "Require review from Code Owners".

---

## 7 · Resumen ejecutivo

- **4 claves CRÍTICAS activas hoy** en frontend público (OpenRouter, DeepSeek nueva, DeepL plaintext, FH_BLOG_WP plaintext).
- **XOR-42** documentado como no-seguridad con demo de revert en 5 líneas.
- **20 archivos** siguen referenciando Pollinations/Groq/Anthropic → Parte B los migra a `askAi`.
- **`.gitignore`** endurecido en esta misma PR.
- **`.env.example`** creado en esta misma PR.
- **Branch protection** propuesta documentada; Carlos la aplica en GitHub (no hay CLI para todos los flags).
- **Historia git**: pendiente `git filter-repo`. Comandos al pie de esta doc.

_Generado por Claude Code · S1.2 Parte A · 2026-04-21 · rama `chore/s1.2-part-a`_
