# Plan de modularización del código — pendiente (refactor largo)

Fecha: 2026-04-21 · Al cerrar PR del rediseño de landing.

## Estado actual

- `index.html` (nuevo): landing minimal 200 líneas. Clean.
- `panel-medico.html`: antiguo `index.html` de **5009 líneas** con TODO el panel profesional (MegaCuaderno IA, calculadoras, fármacos, casos clínicos, scan IA, quiz NIH, etc.).
- `app.html`: **5676 líneas** con herramientas, enfermería, FileHub, informes.
- `profesionales.html` (nuevo): hub con 7 botones. 220 líneas. Clean.
- `urgencias.html` (nuevo): protocolos + camas/ambulancias. 180 líneas. Clean.
- `docencia.html` (nuevo): generador casos + MIR. 320 líneas. Clean.
- `buscas.html` (nuevo): directorio con gate. 180 líneas. Clean.

**Problema:** `panel-medico.html` y `app.html` juntos superan las **10.600 líneas**. Un bug en cualquier módulo arrastra al resto.

## Plan de refactor a módulos

### Fase 1 — Extraer a `sections/` (HTML parciales)

Ya existe la carpeta `sections/` con 3 archivos:
- `sections/page-urgencias.html`
- `sections/page-scan-ia.html`
- `sections/page-enfermeria.html`

Expandir a:

| Archivo                              | Contenido extraído de                           | Líneas aprox |
|--------------------------------------|-------------------------------------------------|--------------|
| `sections/mega-cuaderno.html`        | index.html:3300–3900 (MegaCuaderno IA + chat)   | 600          |
| `sections/checklist-clinico.html`    | index.html:3750–4030 (Checklist Clínico IA)     | 280          |
| `sections/generador-informes.html`   | index.html:2850–3140 (Generador Informes IA)    | 290          |
| `sections/calculadoras.html`         | index.html:1100–1800 (calculadoras)             | 700          |
| `sections/farmacos-urgencia.html`    | index.html:1800–2300 (51 fichas fármacos)       | 500          |
| `sections/casos-clinicos.html`       | ya existe en casos-clinicos.html                | —            |
| `sections/scan-ia.html`              | app.html:1580–1700 + JS                         | 600          |
| `sections/nih-quiz.html`             | app.html:1628–1720 + JS NIH                     | 400          |
| `sections/enfermeria.html`           | app.html:4900–5100                              | 200          |
| `sections/filehub.html`              | app.html:5100–5400                              | 300          |

### Fase 2 — Carga dinámica `fetch` + `innerHTML`

`panel-medico.html` queda como shell (~500 líneas):
- Head + Firebase + auth gate + navigation.
- `<main>` con `<div id="section-root"></div>` vacío.
- Al cargar una sección: `fetch('sections/mega-cuaderno.html').then(r => r.text()).then(h => document.getElementById('section-root').innerHTML = h)`.
- Ejecutar scripts inline de la sección con `new Function(...)` (o mover scripts a módulos JS separados y usar `import()`).

### Fase 3 — Módulos JavaScript ES6

Crear carpeta `modules/`:

```
modules/
├── mega-cuaderno.js       (megaDispatch, megaHistory, MEGA_KB)
├── checklist.js           (ckCallAI, ckGenerate, ckRender)
├── scan-ia.js             (SCAN_MODELS, SCAN_PROMPTS, scanAnalyze)
├── nih-quiz.js            (NIH_CASES, nihRender, nihCheckAnswer)
├── calculadoras.js        (Framingham, Glasgow, Wells, CHA2DS2-VASc...)
├── farmacos.js            (FARMACOS_URG, render, search)
├── informes.js            (infGenerar, infResultadoTexto)
├── enfermeria.js          (enfCallAI, enfHacerPregunta)
└── filehub.js             (fhSendMsg, fhBlogGeneratePost)
```

Cada módulo:
- Exporta funciones con `export function`.
- Carga diferida con `<script type="module" src="modules/mega-cuaderno.js">`.
- Usa `window.askAi` global (definido en `ai-client.js`).

### Fase 4 — Tests unitarios por módulo

Tests con `vitest` en `modules/__tests__/`:
- `mega-cuaderno.test.js`: mock `window.askAi`, probar historial compactado, cap KB.
- `scan-ia.test.js`: probar routing de SCAN_MODELS.
- `calculadoras.test.js`: probar fórmulas (Framingham, Wells, etc.) con casos conocidos.

### Beneficios

- **Aislamiento de fallos**: un bug en generador-informes no afecta al MegaCuaderno.
- **Performance**: carga diferida = first paint más rápido.
- **Mantenibilidad**: una sección = un archivo. PRs más pequeños.
- **Testing**: cada módulo testeable en aislamiento.
- **Colaboración**: si entran más devs, pueden trabajar en paralelo sin merge conflicts.

### Coste estimado

- Fase 1 (extraer HTMLs a `sections/`): **4-6 horas**.
- Fase 2 (carga dinámica desde shell): **2-3 horas**.
- Fase 3 (módulos JS ES6): **6-8 horas**.
- Fase 4 (tests unitarios): **4-6 horas**.

**Total: 16-23 horas de trabajo técnico**, distribuible en 3-4 sesiones sin bloquear otras mejoras.

### Prioridad

**Media**. El refactor NO es bloqueante para el pitch a inversores ni afecta a la seguridad. Es mejora estructural para cuando:
- Se detecten bugs repetidamente en los archivos grandes.
- Entre un segundo desarrollador.
- Se quiera reducir el tamaño del bundle inicial.

## Qué SÍ está modularizado ya (post-rediseño)

- `index.html` (landing): independiente, 200 líneas.
- `profesionales.html` (hub): independiente, 220 líneas.
- `urgencias.html`: independiente, 180 líneas.
- `docencia.html`: independiente, 320 líneas.
- `buscas.html`: independiente, 180 líneas.
- `pacientes.html`: independiente con contador.
- `triaje-ai.html`: independiente.
- Scripts JS reutilizables: `ai-client.js`, `firebase-init.js`, `sentry-init.js`, `update-button.js`, `sw-update.js`, `errorMessages.js`, `global-error-handler.js`.

Ya es un avance grande respecto al monolito anterior. Lo que queda (panel-medico.html + app.html) se ataca en el refactor estructurado de arriba.
