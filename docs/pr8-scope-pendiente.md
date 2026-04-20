# PR #8 · Alcance pendiente del refactor frontend askAi

PR #7 (`refactor/frontend-askai`) migra los call sites "ligeros" del frontend a `window.askAi()`. Esto deja 2 archivos enormes con múltiples fetches IA aún sin migrar: **`index.html`** (484 KB, MegaCuaderno + ScanIA) y **`notebook-local.html`** (389 KB, clones de las mismas funciones). PR #8 cierra el círculo.

## Ámbito literal

### 1. `index.html` (entre líneas 2445 y ~3610)

Funciones con fetches directos a providers IA:
- Array `_KP` + función `_dk()` base64-split — **clave OpenRouter en producción** (S11 del audit).
- ScanIA con Groq vision: `var SCAN_GROQ_KEY = _dk();` y varios fetch a Groq/OpenRouter.
- MegaCuaderno IA: `var MEGA_OR_KEY = _dk();` + fetch directo a OpenRouter.
- Sección "Config" que muestra a usuario instrucciones para introducir key Groq.
- Fetch a `dashscope.aliyuncs.com` y otros providers.

Acción:
- Migrar cada fetch a `window.askAi({type: 'vision'|'educational', ...})`.
- Eliminar `_KP`, `_dk()`, `SCAN_GROQ_KEY`, `MEGA_OR_KEY`.
- Simplificar la UI de "Config IA" a un disclaimer ("IA sin configuración — gestionada por el equipo").

### 2. `notebook-local.html` (~líneas 2080 a 3600)

Estructura paralela a index.html (parece un fork/copy). Los mismos patrones aparecen.

Acción: idéntica a index.html.

### 3. Rename `notebook-groq.html` → `notebook-ia.html`

- `git mv notebook-groq.html notebook-ia.html` y eliminar el texto "Groq" del contenido.
- Actualizar referencias a `notebook-groq.html` en otros archivos (menús, links).

### 4. `app.html` (642 KB)

Contiene código casi idéntico a `index.html` (versionado?). Múltiples fetches directos a Groq, OpenRouter, DashScope. Si `app.html` ya no se usa (quizás es un artefacto), borrarlo. Si se usa, el mismo refactor que `index.html`.

### 5. `casos-clinicos.html` (6.4 MB)

Usar `Grep` para localizar fetches IA; puede tener pocos o ninguno (es mayormente contenido).

### 6. Rename `cuadernos-ia.html`

Revisar si necesita refactor: ya carga Firebase + ya hay un contexto de `firebase.functions`. Si llama IA directamente, migrar.

### 7. `agenda-guardia.html`

Fetch directo a OpenRouter (línea ~242). Migrar.

## Estrategia sugerida para PR #8

1. **index.html** primero (es el entry point).
2. **notebook-local.html** segundo (es casi gemelo).
3. **app.html**: decidir si se usa. Si no → borrar. Si sí → mismo refactor.
4. Resto: agenda, cuadernos-ia, casos-clinicos en ese orden.
5. `git mv notebook-groq.html notebook-ia.html`.
6. Smoke test: `git grep -E 'api\.groq|openrouter\.ai/api|pollinations|dashscope|api\.deepseek|api\.mistral'` debe devolver 0 líneas en archivos productivos.
7. PR #8 con diff esperado de ~2000 líneas.

## Criterio de "hecho" del refactor frontend completo

```bash
# Este grep debe devolver 0 matches en archivos .html/.js productivos:
git grep -nE '(api\.groq|api\.deepseek|api\.mistral|openrouter\.ai/api|pollinations\.ai|dashscope\.aliyuncs)' -- '*.html' '*.js' \
  | grep -v -E '(docs/|AUDIT|^functions/|cartagena-este-webapp/)'

# DevTools en producción con un user logged: solo debe haber llamadas a
#   https://<region>-docenciacartagenaeste.cloudfunctions.net/askAi
# o
#   https://europe-west1-docenciacartagenaeste.cloudfunctions.net/askAi
```

_Generado por Claude Code · 2026-04-21 · rama `refactor/frontend-askai`_
