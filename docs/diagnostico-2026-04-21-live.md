# Diagnóstico · Chequeos en vivo · 2026-04-21

Complemento al `docs/diagnostico-2026-04-21.md` (rama `fix/security-cleanup`, PR #1). Cubre los 4 bloques que el análisis estático no podía ver: `html-validate`, enlaces PDF en producción, estado live de `area2cartagena.es` y configuración del repo en GitHub.

- Branch: `chore/s1.1-live-checks`
- Ejecutado contra: `https://area2cartagena.es/` y repo clonado
- Total entradas nuevas: **23**

## 10 · Validación HTML5 (html-validate v10, sin reglas custom)

Se excluyó `no-inline-style` (553 matches solo en `index.html` — previsto por la política de estilos inline actual, se aborda en refactor S4.x).

| # | Sev | Archivo:línea | Problema | Acción | Sesión |
|---|---|---|---|---|---|
| 69 | ALTA | [index.html:82](index.html:82) · [app.html:27](app.html:27) · [notebook-local.html:82](notebook-local.html:82) | `long-title`: título >70 caracteres. Todos por culpa del sufijo `build 1775728909`. | Ya cubierto en #30. Eliminar timestamp → el título baja a ~65 chars. | S4.x |
| 70 | ALTA | [index.html:86](index.html:86) | `void-style`: `<meta ... />` auto-cerrado — inválido en HTML5 (debe ser `<meta ...>` sin barra). Afecta a todos los metas del head. | Eliminar `/` final de todos los `<meta>` y `<link>` vía regex global. | S4.x |
| 71 | ALTA | [index.html:251,257+](index.html:251) · [app.html:382+](app.html:382) · [notebook-local.html:220+](notebook-local.html:220) · [pacientes.html:166+](pacientes.html:166) · [dashboard.html:130](dashboard.html:130) | `no-implicit-button-type`: ~200 botones sin `type="button"`. Si alguno vive dentro de `<form>`, hace submit accidental. | Barrer con sed/codemod: `<button(?! type=)` → `<button type="button"`. | S2.1 |
| 72 | ALTA | [index.html:281-297+](index.html:281) · [notebook-local.html:250-266+](notebook-local.html:250) · [pacientes.html:252-296](pacientes.html:252) | `element-permitted-content`: `<div>` anidado dentro de `<button>`. HTML5 prohíbe contenido de flujo dentro de botones, solo phrasing. Lectores de pantalla lo ignoran mal. | Sustituir `<div>` internos por `<span style="display:block">` o reestructurar. | S2.1 |
| 73 | ALTA | [index.html:257](index.html:257) · [notebook-local.html:226](notebook-local.html:226) | `unique-landmark`: landmark (probable `<nav>` / `<header>`) sin `aria-label`. Lector de pantalla no puede navegar entre secciones. | Añadir `aria-label` al `<nav>` principal. | S2.1 |
| 74 | ALTA | [dashboard.html:127](dashboard.html:127) | `autocomplete-password`: input de password (gate del dashboard) sin `autocomplete="current-password"`. Bloquea gestores de contraseñas. | Añadir `autocomplete="current-password"`. Nota: esta "puerta" es solo la palabra `caridad` hardcoded — S2.2 la sustituye por Auth real. | S2.1 |
| 75 | MEDIA | [pacientes.html:184-251](pacientes.html:184) | `prefer-native-element`: `role="list"`/`role="listitem"`/`role="header"` en 15+ elementos. Deberían ser `<ul>`/`<li>`/`<header>`. | Reemplazar. CSS sigue funcionando con selectores por clase. | S4.x |
| 76 | MEDIA | Resumen agregado | Errores no-style totales por página: `index.html` ~92, `app.html` ~108, `notebook-local.html` ~106, `pacientes.html` ~57, `dashboard.html` 2. El resto de páginas hijas (66 archivos) sin validar. | Validar en CI con `html-validate --config .htmlvalidate.json` tras fijar una config baseline. | S4.x |

## 11 · Enlaces PDF rotos en producción

178 enlaces PDF únicos extraídos. Test: `curl -I` contra https://area2cartagena.es/.

| # | Sev | URL link → archivo real | Problema | Acción | Sesión |
|---|---|---|---|---|---|
| 77 | ALTA | `docs/DISLIPIEMIAS-DEFINITIVO-2.pdf` → existe `DISLIPEMIAS-DEFINITIVO-2.pdf` | **Typo en link**: "DISLIP**IE**MIAS" vs archivo "DISLIPEMIAS". | Buscar en HTML el href roto y corregir a `DISLIPEMIAS-DEFINITIVO-2.pdf`. | S2.1 |
| 78 | ALTA | `docs/TabaquIsmo-Guia-para-dejar-de-fumar_2025.pdf` → existe `Tabaquismo-Guia-para-dejar-de-fumar_2025.pdf` | **Typo casing**: "Tabaqu**I**smo" (mayúscula) vs archivo "Tabaquismo". | Corregir href. GitHub Pages es case-sensitive. | S2.1 |
| 79 | MEDIA | `docs/ATLS_11edicion_2025.pdf` — local OK, prod 404 | Archivo existe en repo pero no en producción. Probablemente añadido después del último deploy con GitHub Pages cacheado/colgado. | Forzar rebuild GitHub Pages (empty commit o Actions re-run). | S2.1 |
| 80 | MEDIA | `docs/Procedimiento-crisis-asmatica-07.pdf` | HTTP 000 (timeout). Archivo local existe y es grande; confirmar tamaño con `ls -l` y considerar mover a Storage. | Deploy + verificar; si persiste, subir a Firebase Storage. | S2.1 |

## 12 · Estado vivo de https://area2cartagena.es/

| # | Sev | Item | Observación | Acción | Sesión |
|---|---|---|---|---|---|
| 81 | CRÍTICA | `server: GitHub.com` en headers | **Producción sirve desde GitHub Pages**, NO desde Firebase Hosting. `firebase.json` nunca se ha desplegado. Por tanto el rewrite catch-all a `/notebook-local.html` (#36) no afecta a prod actual, pero si alguien llega a ejecutar `firebase deploy --only hosting`, rompería todo. | Decidir plataforma única. Si Firebase Hosting: arreglar rewrite antes de deploy. Si GitHub Pages: retirar `firebase.json` de la config de hosting y dejar solo el bloque `firestore`. | S2.1 |
| 82 | ALTA | Title en prod: `"…| Centro de Salud Cartagena Este — build 1775728909"` (109 chars) | El build timestamp **sigue indexado por Google** hoy. | Redeploy con title limpio. | S4.x |
| 83 | MEDIA | `cache-control: max-age=600` (HTML), `etag: …` | GitHub Pages sirve HTML con 10 min de cache. Cada deploy tarda hasta ese plazo en propagar. | Aceptable; solo doc. | diferido |
| 84 | MEDIA | `strict-transport-security: max-age=31556952` | HSTS presente (1 año). OK. | Mantener. | diferido |
| 85 | MEDIA | Falta header CSP en HTTP response | El CSP está solo en `<meta http-equiv>`. HTTP header es más fuerte. | Al migrar a Firebase Hosting: añadir `headers` a `firebase.json`. | S4.x |
| 86 | MEDIA | Sin `Permissions-Policy`, sin `Referrer-Policy` (en headers), sin `X-Frame-Options` | Faltan headers de seguridad modernos. | Añadir cuando se configure Firebase Hosting headers. | S4.x |
| 87 | BAJA | `content-length: 483229` para `/` | Primer HTML = 472 KB (pre-gzip). Gzip debería bajarlo a ~80 KB. | Lighthouse real confirmará; probablemente ya gzipped por Varnish. | diferido |

## 13 · Configuración del repo en GitHub

| # | Sev | Item | Observación | Acción | Sesión |
|---|---|---|---|---|---|
| 88 | ALTA | `protected: false` en rama `main` | **Sin branch protection**. Cualquier colaborador puede forzar push, saltarse reviews. | Habilitar: require PR review, require status checks, restrict force push, restrict deletes. | S1.2+ |
| 89 | ALTA | Commiter del último commit: `carlosgalera2roman-collab` (id 234083412) | Segunda cuenta de Carlos (no es un colaborador externo), pero queda como evidencia de que hay 2 identidades escribiendo a main. Confirmar que es tuya. | Consolidar en una sola cuenta como committer principal. | diferido |
| 90 | BAJA | `size: 508 257 KB` (~509 MB) | Repo **gigante** — por los PDFs en `docs/`. Clonar es lento. | Considerar Git LFS para PDFs >5MB, o mover a Firebase Storage. | S4.x |
| 91 | BAJA | Visibility: `public` | Correcto para webapp educativa, pero significa que cualquier archivo en el repo es público (de ahí la criticidad de borrar ADMIN-CREDENTIALS.md de la historia). | Mantener público; limpiar historia pendiente. | S1.2 |

## 14 · Lighthouse

**No ejecutado** en esta sesión. `npx lighthouse` en headless requiere Chromium, que añade ~250 MB de descarga. Además el output estructurado completo (10+ k líneas) satura el contexto.

Recomendación para Carlos:
```bash
# En tu Mac, una sola vez:
npx --yes lighthouse https://area2cartagena.es/ \
  --output=html --output-path=/tmp/lh.html --only-categories=performance,accessibility,best-practices,seo \
  --chrome-flags="--headless=new"
open /tmp/lh.html
```
Guarda el score (Perf/A11y/BP/SEO) antes de S4 para comparar después.

---

## Resumen

- **23 entradas nuevas** (69–91 en numeración global tras las 68 previas).
- **Top findings**: 4 PDFs rotos (2 typos triviales de nombre, 2 deploy desincronizado), producción sirve desde GitHub Pages sin branch protection, `<div>` dentro de `<button>` (a11y), build timestamp sigue indexado.
- Para S2.1: los fixes #71 (button type), #72 (div en button), #77-78 (typos PDF), #81 (decidir plataforma hosting) son de 1–2 h máximo.
- Para S4.x queda: `long-title`, `void-style`, `prefer-native-element`, headers de seguridad, Lighthouse baseline.

_Generado por Claude Code · S1.1 live · 2026-04-21_
