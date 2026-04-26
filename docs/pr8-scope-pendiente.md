# PR #8 · Alcance pendiente del refactor frontend askAi (estado 2026-04-26)

> Estado actualizado tras revisión 2026-04-26. **`index.html` ya está limpio** (0 ocurrencias de `_KP`/`_dk`/`MEGA_*`/etc.). El refactor pendiente se concentra en 2 archivos: `notebook-local.html` y `panel-medico.html`.

## Estado por archivo (auditoría 2026-04-26)

| Archivo | Líneas | Ocurrencias `_dk`/`_KP`/`MEGA_*` | Estado |
|---|---|---|---|
| `index.html` | 531 | 0 | ✅ Limpio |
| `notebook-local.html` | 4.536 | 8 | 🟡 Refactor pendiente |
| `panel-medico.html` | 5.431 | 8 | 🟡 Refactor pendiente |
| `app.html` | — | — | ❌ NO existe (ya borrado) |
| `notebook-groq.html` | — | — | ✅ Renombrado / borrado |
| `app-main.js` | 3.522 | stubs deprecados (no-op) | 🟢 Mantener stubs hasta limpiar callers |

## Líneas concretas pendientes

### `notebook-local.html`

| Línea | Símbolo / función | Acción |
|---|---|---|
| 2089-2093 | Comentario DEPRECATED + `var _KP=[]` + `function _dk()` | Eliminar tras eliminar callers |
| 3079 | `function megaCallNAS(sp, msgs, btn)` | Reemplazar cuerpo por delegación a `window.askAi({type:'educational',...})` |
| 3104 | `var MEGA_DS_KEY = ""` + función `megaCallDeepSeek` | Eliminar; ya estaba inerte (key vacía) |
| 3135 | `var MEGA_OR_KEY = _dk()` + función `megaCallOpenRouter` | Eliminar; reemplazado por askAi |
| 3491 | `var k = typeof MEGA_OR_KEY !== "undefined" ? MEGA_OR_KEY : ""` | Eliminar (parte de `ckCallOR` legacy) |

### `panel-medico.html`

Mismo patrón paralelo:

| Línea | Símbolo / función | Acción |
|---|---|---|
| 2511-2515 | DEPRECATED `_KP` + `_dk()` | Eliminar |
| 3128 | `key = _dk() || ''` | Eliminar el call site |
| 3749 | `var MEGA_OR_KEY = _dk()` | Eliminar |
| 4143 | `typeof MEGA_OR_KEY !== "undefined"` | Eliminar |

## Funciones huérfanas a borrar (después del refactor)

Una vez cada call site esté migrado a `window.askAi()`:

```
megaCallNAS, megaCallDeepSeek, megaCallOpenRouter, megaCallPollinations, ckCallOR
```

En `app-main.js` (stubs a borrar tras limpiar callers en HTMLs):

```
_dk(), _xd(), _KP_ENC, ENDPOINTS={}, orFetch (deprecated wrapper)
```

## Estrategia recomendada para abrir PR #8

1. Crear rama `refactor/pr8-frontend-askai`.
2. Refactor de `notebook-local.html` (más pequeño, sirve como template).
3. Refactor de `panel-medico.html` (idéntico patrón).
4. Limpiar `app-main.js` stubs deprecados.
5. Smoke test E2E (PR #106 ya añadió Playwright + axe).
6. Verificar con grep:

```bash
git grep -nE '(api\.groq|api\.deepseek|api\.mistral|openrouter\.ai/api|pollinations\.ai|dashscope\.aliyuncs)' -- '*.html' '*.js' \
  | grep -v -E '(docs/|AUDIT|^functions/)'
# Debe devolver 0 matches.
```

7. DevTools en producción con user logged: solo llamadas a:
   ```
   https://europe-west1-docenciacartagenaeste.cloudfunctions.net/askAi
   ```

## Por qué no se hace en este PR

Este refactor toca ~8 funciones IA críticas (MegaCuaderno + ScanIA) sobre ~10.000 líneas de HTML. Cualquier error rompe el feature insignia con usuarios clínicos activos. Necesita:

- Sesión dedicada con tests E2E ya en su sitio (PR #106 los añade).
- Verificación manual lado a lado de cada función ANTES de borrar la implementación legacy.
- Posibilidad de feature flag (`window.USE_LEGACY_MEGACALL = true`) durante la transición.

Estimación: 6-10 h de trabajo dedicado en sesión propia.

## Criterio de "hecho"

```bash
# 0 matches en código productivo:
git grep -nE '(_dk\(|_KP\b|MEGA_OR_KEY|MEGA_DS_KEY|SCAN_GROQ_KEY|megaCallNAS|megaCallDeepSeek|megaCallOpenRouter|megaCallPollinations|ckCallOR)' \
  -- '*.html' '*.js' | grep -v 'docs/'

# 0 fetches directos a providers en código productivo:
git grep -nE '(api\.groq|api\.deepseek|api\.mistral|openrouter\.ai/api|pollinations\.ai|dashscope\.aliyuncs)' \
  -- '*.html' '*.js' | grep -v -E '(docs/|^functions/)'

# Tests E2E pasan (smoke + a11y).
npx playwright test
```

## Histórico

- 2026-04-21: doc original creado tras PR #7 (call sites ligeros migrados).
- 2026-04-26: actualizado. `index.html` y `app.html` limpios. Pendiente solo en `notebook-local.html` + `panel-medico.html`.
