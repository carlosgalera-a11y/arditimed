# Addendum · Auditoría de secretos · 2026-04-21

Complemento a [docs/security-audit-2026-04-21.md](security-audit-2026-04-21.md) tras la refactorización del frontend en PR #7 (`refactor/frontend-askai`).

## Claves adicionales detectadas durante el refactor

La tabla original listaba 8 claves. Al limpiar los call sites del frontend aparecieron **dos más**:

| # | Archivo:línea | Tipo | Valor (primeros 8 chars) | Ofuscación | Severidad | Acción |
|---|---|---|---|---|---|---|
| S10 | [app-modules.js:130](app-modules.js:130) (pre-PR #7) | **Groq** (FH_GROQ_KEY) | `gsk_GTTqfTXpC5…` aprox. | Base64 split-array + atob | **CRÍTICA** (live hasta el merge de PR #7) | Rotar en https://console.groq.com/keys |
| S11 | [index.html:2448](index.html:2448) · [notebook-local.html:2087](notebook-local.html:2087) | **OpenRouter** (segunda clave distinta) | `sk-or-v1-9ccad5a7…` | Base64 split-array + atob (`_KP.join().atob()`) | **CRÍTICA** (live hoy) | Rotar en https://openrouter.ai/keys |

### Demostración del revert

```bash
# S10 (Groq via base64 split):
node -e "console.log(atob(['Z3NrX0dU','VHFmVFhwQzV','IR3lNSFRr','RzByV0dkeW','IzRllPSHNnVVRB','OE5ZalVWVDROOVd5ak1NeFQ='].join('')))"

# S11 (OpenRouter #2):
node -e "console.log(atob(['c2stb3ItdjEtOWNjYWQ1YTcwM','TcyM2I3ZDQwMjY3ZmZlOGYwOT','Q5YWU5OTg4YjdmYWEwM2QzMGI','wZWMwNTM3YWM0YTE5ZGIxMQ=='].join('')))"
```

### Estado tras PR #7

- **S10** (`FH_GROQ_KEY` base64-split): eliminado de `app-modules.js`. Las llamadas IA de FileHub (chat + blog publisher) pasan ahora por `window.askAi()`.
- **S11** (`_KP` base64-split): **sigue presente** en `index.html` y `notebook-local.html`. Estos dos archivos son enormes (389 K y 484 K respectivamente) con múltiples call sites (MegaCuaderno, ScanIA, vision). Su refactor completo queda para PR #8.

## Claves que Carlos debe rotar tras merge de PR #7

Total: **11 claves** a revocar. Tras la rotación y el `git filter-repo`, la historia del repo queda limpia.

| ID | Tipo | Ubicación |
|---|---|---|
| S01 | OpenRouter #1 | app-main.js XOR-42 (línea 57) |
| S02 | DeepSeek actual | app-modules.js XOR-42 |
| S03 | DeepL | app-main.js plaintext (línea 2672) |
| S04 | FH_BLOG_WP token | app-modules.js plaintext |
| S06 | Firebase `_1o` variante | agenda-guardia.html, cuadernos-ia.html |
| S07 | DeepSeek antigua | AUDIT_2026-04-04.md histórico |
| S10 | Groq FH_GROQ_KEY | app-modules.js base64-split |
| S11 | OpenRouter #2 | index.html + notebook-local.html `_KP` |

(S05, S08 son no-rotables: S05 es Firebase Web key pública, S08 es histórico genérico).

## Verificación post-merge

```bash
cd /Users/carlos/cartagenaestewebappSOLIDA
# Debe devolver 0 matches en archivos productivos (excluye docs/ y AUDIT histórico):
git grep -E 'sk-[a-zA-Z0-9-]{30,}|AIza[0-9A-Za-z_-]{35}|gsk_[a-zA-Z0-9]{20,}|fh_[a-zA-Z0-9]{10,}' -- '*.js' '*.html' | grep -v -E '(AUDIT|diagnostico|security-audit)'
```

Si devuelve algo distinto a 0 líneas, hay que investigar antes del `git filter-repo`.

_Generado por Claude Code · 2026-04-21 · rama `refactor/frontend-askai`_
