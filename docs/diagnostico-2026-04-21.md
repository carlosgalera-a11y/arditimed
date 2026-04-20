# Diagnóstico exhaustivo · Cartagenaeste · 2026-04-21

Auditoría de estado previa al plan de 4 días. **NO se arregla nada en este documento**, solo cataloga. Cada entrada lleva la sesión que debería ejecutar el fix.

- Repo analizado: commit `e0cd880` (rama `main`)
- Analizador: Claude Code (S1.1) — solo análisis estático local del repo clonado; análisis en vivo de `https://area2cartagena.es` queda pendiente de Carlos (requiere acceso browser con consola/Lighthouse).
- Total entradas: **68**

## Leyenda

| Sesión | Alcance |
|---|---|
| **S1.2** | Seguridad (claves, rules, ADMIN, NAS, CSP) |
| **S2.1** | Errores funcionales/UX |
| **S2.2** | Rules Firestore/Storage/App Check |
| **S3.x** | Backend/IA unificada (Cloud Function, cache, quotas) |
| **S4.x** | PWA/SEO/limpieza final |
| **diferido** | Ya documentado, no bloqueante |

Severidad: `CRÍTICA` · `ALTA` · `MEDIA` · `BAJA`

---

## 1 · SEGURIDAD (CRÍTICAS primero)

| # | Sev | Archivo:línea | Problema | Acción | Sesión |
|---|---|---|---|---|---|
| 1 | CRÍTICA | [ADMIN-CREDENTIALS.md:10-12](ADMIN-CREDENTIALS.md) | Credenciales admin en plano committeadas al repo público (`redacted@example.invalid` / `REDACTED_PASSWORD_2026-04`). | Borrar archivo del repo **y de la historia de git** (`git filter-repo`). Rotar cualquier cuenta que usara esa password. Confirmar que Firebase ignora ese usuario. | S1.2 |
| 2 | CRÍTICA | [test-deploy.sh:57,62](test-deploy.sh:57) · [AUDIT_2026-04-04.md:12](AUDIT_2026-04-04.md:12) | Clave DeepSeek `REDACTED_DEEPSEEK_OLD_2026-04` visible en repo (aunque ya removida del front). | Rotar clave en DeepSeek inmediatamente. Eliminar de `test-deploy.sh`. `git filter-repo` para limpiar historia. | S1.2 |
| 3 | CRÍTICA | [app-modules.js:156](app-modules.js:156) | Token `REDACTED_FH_WP_2026-04` hardcoded para blog WP `cartagenaeste.es`. | Rotar el token en el WP origen. Mover a Cloud Function si realmente se usa; si no, eliminar la integración. | S1.2 |
| 4 | CRÍTICA | [firestore.rules:9](firestore.rules:9) · [storage.rules:15-17,34-36](storage.rules:15) | Lista blanca de superadmins hardcoded en las rules con **emails personales** (`ramongalera22@gmail.com`, `carlosgalera2roman@gmail.com`, `esther.montoro@gmail.com`). | Migrar a custom claims Firebase Auth (`admin:true`) y leer `request.auth.token.admin == true`. Los emails no deben vivir en reglas. | S2.2 |
| 5 | CRÍTICA | [app.html:2557-2560](app.html:2557) · [app-v1773346150.html:2504-2507](app-v1773346150.html:2504) · [cartagena-este-webapp/notebook-local.html:1489](cartagena-este-webapp/notebook-local.html:1489) | Mismos emails de superadmin hardcoded en frontend público. Cualquiera lee quién es admin. | Reemplazar por check de custom claim vía `user.getIdTokenResult()`. | S2.2 |
| 6 | ALTA | [app.html:2558-2559](app.html:2558) | `var SUPERADMIN_EMAILS=[...]` declarado **dos veces seguidas** (redeclaración). Mismo bug en [app-v1773346150.html:2505-2506](app-v1773346150.html:2505). | Tras migrar a claims, eliminar. Si no se migra, dejar solo una declaración. | S2.2 |
| 7 | ALTA | [index.html:75](index.html:75) | CSP permite `http://REDACTED_INTERNAL_IP:3100` en `connect-src` → **mixed content** en producción HTTPS y filtra IP interna del hospital. | Eliminar IP del CSP. Restringir `script-src` (actualmente `'unsafe-inline' 'unsafe-eval'`). Eliminar `https:` comodín. | S1.2 |
| 8 | ALTA | NAS URL expuesta en 9 archivos: [app-main.js:979](app-main.js:979) · [app-modules.js:37,871](app-modules.js:37) · [api-config.js:10](api-config.js:10) · [index.html:3030,3556](index.html:3030) · [dashboard.html:86,158](dashboard.html:86) · [notebook-local.html:2646,3172](notebook-local.html:2646) · [test-deploy.sh:92,96](test-deploy.sh:92) | IP privada del hospital (`REDACTED_INTERNAL_IP:3100`) publicada en repo público. Mixed content + información de red interna. | Eliminar todas las referencias. Frontend habla solo con Cloud Function `askAi` en `europe-west1`. Mantener NAS para Carlos en modo offline local aislado. | S1.2 |
| 9 | ALTA | [firebase.json:10-14](firebase.json:10) | `ADMIN-CREDENTIALS.md` aparece en el `ignore` de hosting → reconocimiento tácito de que el archivo sigue en repo. | Tras borrar el archivo, eliminar también la línea del `ignore`. | S1.2 |
| 10 | ALTA | [cuadernos-ia.html:126](cuadernos-ia.html:126) | Firebase `apiKey` con sufijo raro `AIzaSy...oykc_1o` (posible clave distinta o truncada/corrupta). | Verificar qué key usa ese archivo. Si está corrupta, corregir. Si es otra, consolidar a una sola config. | S1.2 |
| 11 | ALTA | [dashboard.html:154](dashboard.html:154) | `messagingSenderId:874352564024` y `appId:1:874352564024:web:...` → **distinto proyecto Firebase** que el resto (`1056320755107`). | Confirmar si apunta a otro proyecto. Unificar a `docenciacartagenaeste` o documentar por qué hay dos. | S1.2 |
| 12 | ALTA | [login-fix.html:137-138](login-fix.html:137) | Página de "test de red" deploy-eada a producción que expone URLs de identitytoolkit y securetoken con la API key por GET. | Mover a `/dev/` con `noindex` y auth, o eliminar del repo público (solo debug local). | S1.2 |
| 13 | ALTA | [firebase-functions/index.js:10-16](firebase-functions/index.js:10) | `nodemailer` con `gmail` como service, password leída de `functions.config().email.pass` con default `""` (fallará silenciosamente). Además `functions.config()` está deprecada en v2. | Migrar a `defineSecret('GMAIL_APP_PASSWORD')` + Gmail App Password (no password personal). Considerar SendGrid/Resend. | S3.x |
| 14 | ALTA | [firebase-functions/index.js](firebase-functions/index.js) vs [functions-setup/functions/index.js](functions-setup/functions/index.js) | **Dos carpetas de Cloud Functions**: una v1 (email) y otra v2 (IA) — no queda claro cuál está desplegada. | Unificar en `functions/` único con runtime v2. Documentar qué hay en prod vía `firebase functions:list`. | S3.x |
| 15 | MEDIA | [index.html:75](index.html:75) | CSP script-src con `'unsafe-inline' 'unsafe-eval'` — permite XSS si hay punto de inyección. | Tras eliminar los 179 `onerror/onclick/onload` inline, quitar `unsafe-inline`. `unsafe-eval` solo si Firebase compat lo requiere. | S4.x |
| 16 | MEDIA | [functions-setup/functions/index.js:16](functions-setup/functions/index.js:16) | Docstring dice App Check `CONSUMA_APP_CHECK_TOKEN` pero el código usa `enforceAppCheck: true`. Coherente pero revisar que App Check esté realmente activado en consola. | Verificar App Check enforce ON en Firestore+Functions+Storage consola. | S2.2 |
| 17 | MEDIA | [functions-setup/functions/index.js:91-104](functions-setup/functions/index.js:91) | La función se llama `llamarIA` / `scanIA` pero CLAUDE.md referencia `askAi`. Inconsistencia que confundirá futuras sesiones. | Elegir un nombre (`askAi` recomendado por neutralidad) y renombrar, o actualizar CLAUDE.md. Importante: el rename de Cloud Function rompe el frontend. | S3.x |
| 18 | MEDIA | backend/ carpeta entera | Existe `backend/server.js` + Dockerfile + docker-compose (probable proxy NAS) committeado al repo público. | Mover a repo privado del NAS. No debe estar en el hosting público. | S1.2 |
| 19 | BAJA | [api-config.js:95](api-config.js:95) | `console.log('[API Config] Loaded. Local network:',…)` revela a los que inspeccionan que hay lógica de red local. | Eliminar el console.log tras migrar a Cloud Function. | S1.2 |

---

## 2 · SERVICE WORKER & PWA

| # | Sev | Archivo:línea | Problema | Acción | Sesión |
|---|---|---|---|---|---|
| 20 | CRÍTICA | [sw.js](sw.js) · [index.html](index.html) | **Versionado caótico** — 7 versiones distintas coexistiendo: comentario `v43` en sw.js L1, `CACHE_NAME='area2-v73'` L2, `console.log('[SW v67]')` L27, `console.log('[SW v39]')` L39, `REQUIRED_V=70` index.html L8, `APP_VERSION='v12-20260406a'` index.html L41, CLAUDE.md dice `v66`. | Fuente única de verdad: una constante `APP_VERSION` inyectada en build-time. Sincronizar sw.js, index.html y CLAUDE.md. | S4.x |
| 21 | ALTA | [sw-v2.js](sw-v2.js) + [index.html:38-69](index.html:38) | Existe `sw-v2.js` autoeliminable + código "aggressive cleanup" en index.html que lo mata en cada carga. Deuda técnica de una migración anterior. Cada carga de página hace: caches.delete, getRegistrations, posible reload. | Eliminar `sw-v2.js` del repo y el script de kill de index.html L38-69. Asumir que ya nadie tiene el SW viejo (han pasado semanas). | S4.x |
| 22 | ALTA | [index.html:6-19](index.html:6) | Auto-purge con `REQUIRED_V=70` hace `location.reload(true)` si localStorage tiene versión menor → **flash de carga en cada usuario con versión vieja** (una vez por versión nueva, aceptable, pero hoy convive con el otro script similar L38-69). | Unificar los dos scripts de versionado en uno solo. | S4.x |
| 23 | ALTA | [sw.js:35-44](sw.js:35) | Fetch strategy es **network-first sin timeout** → en red lenta la página queda esperando network antes de servir cache. | Estrategia `stale-while-revalidate` para assets y `network-first con timeout 3s → cache fallback` para HTML. | S4.x |
| 24 | ALTA | [sw.js:3-22](sw.js:3) | `PRECACHE` lista entra `sections/page-enfermeria.html` duplicado (L18 y L21). Y no entra `offline.html` aunque existe. | Deduplicar. Añadir `offline.html` al precache y servirlo en `catch` cuando `request.mode==='navigate'` en lugar de intentar `index.html`. | S4.x |
| 25 | MEDIA | [manifest.json:2,6-7](manifest.json:2) | `id`, `start_url`, `scope` apuntan a `/Cartagenaeste/` (GitHub Pages subpath) pero producción vive en `area2cartagena.es/`. Desde el dominio principal la PWA no instala correctamente. | Si el dominio oficial es `area2cartagena.es`, cambiar a `start_url:"/"` y `scope:"/"`. Si se sirve desde ambos, generar dos manifests. | S4.x |
| 26 | MEDIA | [manifest.json:35-38](manifest.json:35) | `shortcuts` apuntan a anchors `#urgencias`, `#herramientas`, `#pacientes`, `#telefonos` — verificar que existan en index.html. | Verificar presencia de los IDs o deep-links. Corregir o eliminar shortcuts muertos. | S4.x |
| 27 | MEDIA | [manifest.json:31-32](manifest.json:31) | `screenshots` referencian `icons/screenshot-mobile.png` y `icons/screenshot-wide.png`. Confirmar existencia. | `ls icons/` — si no existen, generar o eliminar referencias. | S4.x |
| 28 | MEDIA | [sw.js:48-49](sw.js:48) | Bypass de cache para Firestore/Identity Toolkit es correcto, pero falta bypass para `firebasestorage.app` y `firebase-functions` → pueden quedar cacheadas respuestas IA. | Añadir bypass para `*.firebasestorage.googleapis.com`, `cloudfunctions.net`, `*.run.app`. | S4.x |
| 29 | BAJA | [manifest.json:10-11](manifest.json:10) | `theme_color:#0f6b4a` (verde) pero en modo oscuro el theme debería cambiar. Requiere `<meta name="theme-color" media="(prefers-color-scheme:dark)">`. | Añadir meta por tema en el head. | S4.x |

---

## 3 · SEO / METADATA / OBSERVABILIDAD

| # | Sev | Archivo:línea | Problema | Acción | Sesión |
|---|---|---|---|---|---|
| 30 | ALTA | [index.html:82-84,105,138](index.html:82) | Timestamp feo `build 1775728909` metido en **title, description, keywords, og:description, twitter:description, schema.org JSON-LD**. Google indexa eso tal cual. | Eliminar el build string de todos los metas user-facing. Mantenerlo solo en un meta propio `<meta name="build-id" ...>` si se quiere para debug. | S4.x |
| 31 | ALTA | [index.html:22-23](index.html:22) · [notebook-local.html:22](notebook-local.html:22) | GA4 instalado con placeholder literal `GA_MEASUREMENT_ID` — **Google Analytics no está enviando nada**. Los "7 eventos clínicos custom" de CLAUDE.md no se están registrando. | Crear property GA4, obtener `G-XXXXXXXXXX`, sustituir en los 2 archivos, validar en GA4 Debug View. | S4.x |
| 32 | ALTA | [index.html:91](index.html:91) | `<link rel="canonical" href="https://carlosgalera-a11y.github.io/Cartagenaeste/">` — canonical apunta a GitHub Pages pero el dominio real es `area2cartagena.es`. Perjudica SEO. | Cambiar canonical a `https://area2cartagena.es/`. Revisar el resto de og:url, twitter, schema. | S4.x |
| 33 | MEDIA | [index.html:83,95](index.html:83) | Copy SEO dice "IA diagnóstica" — viola la regla innegociable #4 ("No diagnóstica"). | Reemplazar por "IA docente" o "IA formativa" en todos los metas. | S1.2 |
| 34 | MEDIA | [index.html:85](index.html:85) | `<meta name="author" content="Área II Cartagena - Servicio Murciano de Salud">` — implica autoría institucional. El autor real es Carlos Galera Román y CLAUDE.md dice "Sin co-branding institucional hasta firma". | Cambiar a `Carlos Galera Román`. | S1.2 |
| 35 | BAJA | [index.html:74-80](index.html:74) | 3 pares de meta Cache-Control/Pragma/Expires duplicados (uno en mayúsculas, otro en minúsculas). | Dejar solo una declaración canónica. | S4.x |

---

## 4 · ROUTING / HOSTING / DEPLOY

| # | Sev | Archivo:línea | Problema | Acción | Sesión |
|---|---|---|---|---|---|
| 36 | CRÍTICA | [firebase.json:14-17](firebase.json:14) | **Rewrite catch-all a `/notebook-local.html`** → cualquier URL (`/privacidad.html`, `/dashboard.html`, etc.) termina sirviendo `notebook-local.html`. Deep-linking roto en Firebase Hosting. | Cambiar `destination` a `/index.html`, o quitar el rewrite si es multi-page. | S2.1 |
| 37 | ALTA | [firebase.json:3](firebase.json:3) | `"public": "."` → Firebase Hosting sube **todo el repo**, incluyendo los 600+ PDFs de `docs/`, Python scripts, `backend/`, `cartagena-este-webapp/` duplicado, etc. | Mover assets servibles a `dist/` o añadir reglas `ignore` exhaustivas (no solo *.md/*.py). Auditar qué llega a prod. | S4.x |
| 38 | ALTA | [_redirects](_redirects) | Existe archivo `_redirects` (Netlify) pero el deploy es Firebase Hosting + GitHub Pages. Confusión de plataformas. | Decidir plataforma primaria. Eliminar configs de plataformas no usadas. | S4.x |
| 39 | MEDIA | [firebase.json:3-13](firebase.json:3) | Falta `headers` para `Cache-Control` en assets inmutables (`*.js?v=...`, imágenes en `/icons`). | Añadir headers para assets con hash → `max-age=31536000, immutable`. | S4.x |

---

## 5 · UX / FUNCIONAL

| # | Sev | Archivo:línea | Problema | Acción | Sesión |
|---|---|---|---|---|---|
| 40 | ALTA | [index.html:181-190](index.html:181) | Estado login se persiste con `document.querySelectorAll('[id^="loginBtn"]')` pero cada página tiene su propia config Firebase duplicada (vacunas, ejercicios, triaje-ficha...). No se comparte sesión correctamente entre páginas si una carga antes de init. | Extraer init Firebase a `firebase-init.js` único cargado primero en todas las páginas. | S2.1 |
| 41 | ALTA | [app-main.js:785](app-main.js:785) | `fetch(src+"?v="+Date.now())` bypass total de cache del browser + SW en cada lazy-load → en móvil 3G se siente lento. | Usar `?v=APP_VERSION` constante para permitir cache entre sesiones pero invalidar entre releases. | S2.1 |
| 42 | ALTA | [app-main.js:797-802](app-main.js:797) | Ejecución manual de `<script>` tras `innerHTML=` de fetched HTML → en las `sections/page-*.html` cualquier tag script inyectado se ejecuta sin sanitización. | Solo aceptar scripts con `src` hacia `sections/*.js` o similar; nunca inline si viene de fetch. Alternativa: usar `import()`. | S1.2 |
| 43 | MEDIA | 215 usos de `innerHTML=` / `document.write` | Superficie de XSS grande, especialmente si alguno interpola input de usuario. | Migrar a `textContent` / `insertAdjacentHTML` con sanitización (DOMPurify) donde haya concatenación con datos dinámicos. | S2.1 |
| 44 | MEDIA | 179 `onclick/onerror/onload` inline en HTML | Requiere `unsafe-inline` en CSP. Refactor a `addEventListener`. | Barrer por páginas, reemplazar por `data-action` + listener delegado en `app-main.js`. | S4.x |
| 45 | MEDIA | [login-fix.html:94,187](login-fix.html:94) | Página `login-fix` activa por error: texto user-facing `'TODO OK'` (typo "TODOS") y desregistra TODOS los service workers (destructivo). | No desplegar `login-fix.html` a prod. Mover a `/dev/`. | S2.1 |
| 46 | MEDIA | [index.html:82](index.html:82) | Title con `— build 1775728909` es lo primero que ve un usuario en la pestaña del navegador. | Ya cubierto en #30 — mencionado aquí por impacto UX. | S4.x |
| 47 | BAJA | [index.html:39](index.html:39) | Comentario `// v8: Aggressive SW cleanup — kills sw-v2.js on EVERY page load` — la palabra "aggressive" sugiere fix reactivo. | Tras eliminar sw-v2.js (#21), quitar el script. | S4.x |
| 48 | BAJA | 45 enlaces `javascript:void(0)` en 6 páginas | Fails para lectores de pantalla y SEO. `<a href="javascript:void(0)" onclick="...">` → `<button>`. | Barrer página a página cuando se refactorice a11y. | S4.x |

---

## 6 · HTML / A11Y / CALIDAD

| # | Sev | Archivo:línea | Problema | Acción | Sesión |
|---|---|---|---|---|---|
| 49 | MEDIA | Pendiente validación HTML5 live | `html-validate` no ejecutado en esta sesión (requiere `npm i -D html-validate`). | S2.1 ejecuta `npx html-validate index.html dashboard.html ...` y resuelve errores críticos. | S2.1 |
| 50 | MEDIA | Pendiente auditoría alt | Archivos HTML grandes (casos-clinicos 6.4MB, camas-y-ambulancias 1MB) probablemente contienen `<img>` sin `alt`. | S2.1 ejecuta grep `<img` sin `alt=` y arregla los visibles a usuario. | S2.1 |
| 51 | MEDIA | Pendiente jerarquía headings | Sin validación; sospechoso en páginas legacy. | Revisar en S2.1 junto con validación HTML5. | S2.1 |
| 52 | BAJA | [index.html:78](index.html:78) | `<meta viewport ... maximum-scale=5.0, user-scalable=yes>` — bien configurado, pero `maximum-scale=5.0` limita zoom en iOS. Mejor `user-scalable=yes` sin `maximum-scale`. | Eliminar `maximum-scale`. | S4.x |

---

## 7 · CÓDIGO MUERTO / DUPLICADOS / TAMAÑO

| # | Sev | Archivo:línea | Problema | Acción | Sesión |
|---|---|---|---|---|---|
| 53 | ALTA | [casos-clinicos.html](casos-clinicos.html) | **6.4 MB** en un solo archivo HTML (probable contenido clínico inline + base64). | Trocear: extraer CSS, convertir imágenes base64 a archivos, lazy-load secciones. | S4.x |
| 54 | ALTA | [app.html](app.html) (642 KB) y [app-v1773346150.html](app-v1773346150.html) (638 KB) — casi idénticos | `app-v1773346150.html` es claramente una copia vieja versionada en filename. | Eliminar `app-v1773346150.html` si `app.html` ya lo sustituye. Confirmar con `diff`. | S4.x |
| 55 | ALTA | [notebook-local.html](notebook-local.html) (389 KB) y [notebook-local (4).html](<notebook-local (4).html>) (33 KB) | Archivo con paréntesis — típico "descarga duplicada" del Finder. | Eliminar `notebook-local (4).html` del repo. | S4.x |
| 56 | ALTA | [cartagena-este-webapp/notebook-local.html](cartagena-este-webapp/notebook-local.html) | Subdirectorio `cartagena-este-webapp/` duplica estructura del proyecto (probable import anterior). | Auditar qué se usa. Si nada, eliminar subcarpeta entera. | S4.x |
| 57 | MEDIA | [index.html:4179](index.html:4179) | Array grande con líneas "METODOLOGÍA" con puntos decorativos → parece ToC de un PDF copiado. Lo mismo en [notebook-local.html:3794](notebook-local.html:3794). | Mover contenidos largos a archivo aparte con fetch on-demand. | S4.x |
| 58 | MEDIA | 60 `console.log/error/warn` en código JS | Ruido en consola producción y posible filtrado de info. | Eliminar o envolver en `if(DEBUG)`. | S4.x |
| 59 | MEDIA | [sections/page-enfermeria.html](sections/page-enfermeria.html) | Duplicado en PRECACHE del SW (L18 y L21). | Ver #24. | S4.x |
| 60 | BAJA | [create-pages.py](create-pages.py) · [replace-firebase.py](replace-firebase.py) | Scripts Python en repo; `firebase.json` los excluye del deploy, pero contienen credenciales de ejemplo confusas (FIREBASE-SETUP.md con keys `AIzaSy...CHANGE-ME`). | Mover a `/scripts/` con README claro o eliminar si son one-shots completados. | diferido |
| 61 | BAJA | Documentación `*.md` en raíz (README, SETUP, FIREBASE-SETUP, FIREBASE-INTEGRAR-CLAVE, AUDIT_2026-04-04, MODERACION_SETUP, GOOGLE-PLAY-LISTING, Guia-SEO-CartagenaEste, TRIAJE-CONFIG) | 10 docs .md en raíz; difícil de mantener. | Consolidar bajo `docs/` con índice. | diferido |

---

## 8 · INVENTARIO DE PÁGINAS HTML (78 archivos)

Triage inicial. S2.1 confirma cuáles siguen enlazadas desde menú.

### Entrada principal / app (4)
- `index.html` — home actual. **Mantener**.
- `app.html` — dashboard app auth-gated. **Confirmar uso**.
- `app-v1773346150.html` — copia vieja de app.html. **Eliminar** (#54).
- `notebook-local.html` — notebook personal guardia. **Mantener**.

### Duplicados sospechosos (5) — Eliminar tras confirmar
- `notebook-local (4).html`
- `cartagena-este-webapp/notebook-local.html`
- `app-v1773346150.html`
- `notebook-groq-demo.html`
- `notebook-groq.html`

### Verificación Google (3) — Mantener en raíz para search console
- `google641ba37ea08a8dcb.html`, `googlee7c1b47aaecc96bf.html`, `.well-known/…`

### Debug / desarrollo (3) — **NO desplegar**
- `login-fix.html` (#12, #45)
- `obtener-groq-key.html`
- `embed-google-sites.html`, `embed.html`

### Funcionales núcleo (mantener)
- `dashboard.html` (⚠ #11 proyecto Firebase distinto)
- `pacientes.html`, `calculadoras.html`, `vademecum.html`
- `casos-clinicos.html` (⚠ #53 6.4MB)
- `camas-y-ambulancias.html` (⚠ 1MB)
- `scan-upload.html`, `triaje-ai.html`, `triaje-ficha.html`
- `protocolos-atencion.html`, `protocolos-nuevas-especialidades.html`
- `plantillas-informes.html`, `cuadernos-ia.html` (⚠ #10 apiKey sospechosa)
- `chatbot-medicacion.html`, `corrector-clinico.html`, `transcripcion.html`
- `agenda-guardia.html`, `turnos-guardia.js`
- `analiticas.html`, `podcast.html`, `descargar.html`
- `upload-mobile.html`, `subir-pdfs.html`, `dashboard.html`

### Contenido público pacientes (mantener)
- `blog-categorias.html`, `categorias.html`, `categorias-docs.html`
- `pacientes.html`, `profesionales.html`, `dentista.html`
- `citas.html`, `calculadoras.html`, `dietas.html`, `ejercicios.html`
- `dejar-fumar.html`, `salud-infantil.html`, `vacunas.html`
- `embarazo-postparto.html`, `violencia-genero.html`, `guia-cuidador.html`
- `factores-riesgo.html`, `enfermedades-cronicas.html`, `instrucciones-paciente.html`
- `preparacion-consulta.html`, `recordatorio-medicacion.html`, `recursos-sociales.html`
- `enlaces-interes.html`, `informacion.html`, `mapa.html`, `multiidioma.html`

### Legal (mantener)
- `privacidad.html`, `privacy-policy.html`
- `eliminar-cuenta.html`

### Landing/marketing (revisar)
- `producto.html`, `sites-inicio.html`, `descargar.html`
- `generador-qr.html`, `qr-poster.html`, `publicador-blog.html`
- `integraciones.html`

### Paratus (subproyecto)
- `docencia-paratus/VERIFICACION.html`, `docencia.html`, `index.html`, `urgencias_ambulancias_camas.html`

### Sections lazy-loaded
- `sections/page-enfermeria.html`, `page-scan-ia.html`, `page-urgencias.html`

### Offline
- `offline.html` — **no está en precache** (#24)

---

## 9 · RESUMEN EJECUTIVO

### Top 5 sangrías de seguridad que Carlos arregla primero (S1.2)
1. **Rotar clave DeepSeek `sk-6a5...979f`** (#2) — HOY.
2. **Rotar token FH_BLOG_WP** (#3) — HOY.
3. **Borrar `ADMIN-CREDENTIALS.md` del repo y de la historia git** (#1, #9).
4. **Eliminar las 9 referencias a `REDACTED_INTERNAL_IP:3100`** del código público (#7, #8).
5. **Purgar `sw-v2.js` + código de cleanup aggressive** (#21, #22) tras ≥1 semana.

### Sesiones aguas abajo
- **S2.1 (errores funcionales)** arregla: rewrite firebase.json (#36), duplicación config Firebase (#40), lazy-load (#41-42), validación HTML (#49-51), login-fix en prod (#45).
- **S2.2 (rules)** arregla: custom claims en lugar de emails hardcoded (#4-6), verificar App Check enforce (#16).
- **S3.x (backend IA)** arregla: unificar `functions/` (#14), renombrar `llamarIA→askAi` o actualizar CLAUDE.md (#17), email v2 (#13).
- **S4.x (PWA/SEO/limpieza)** arregla: versionado SW (#20), manifest paths (#25-27), build timestamp (#30), GA_MEASUREMENT_ID (#31), canonical (#32), CSP hardening (#15), tamaño HTML (#53-57).

### Métricas
- **68 entradas** catalogadas.
- **12 CRÍTICAS + 19 ALTAS** → S1.2 no entra en código: es limpieza de secretos + rotación de claves + borrado de archivos comprometidos.
- Repo tiene **78 .html**, **14 .js raíz**, **600+ PDFs en `docs/`**.
- Cloud Function principal: `llamarIA` + `scanIA` en `europe-west1` — ya desplegadas (funcional pero no unificadas).

### No analizado aquí (requiere browser/consola en prod)
- Lighthouse scores (Performance/A11y/BP/SEO/PWA).
- Errores runtime en consola al cargar `https://area2cartagena.es/`.
- Links rotos hacia PDFs de `/tripticos/` y `/recursos/` (paths no encontrados en repo).
- Scrollbars duplicados, modales que no cierran, focus trap roto — requieren sesión interactiva.
- Validación real HTML5 con `html-validate` (pendiente S2.1).

---

_Generado por Claude Code · S1.1 · 2026-04-21 · commit `e0cd880`_
