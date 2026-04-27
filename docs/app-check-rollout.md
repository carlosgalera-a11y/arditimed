# Rollout de App Check en producción

Estado al **2026-04-27**: la infraestructura de App Check está cableada en
el cliente pero `enforceAppCheck` sigue en `false` en `functions/src/askAi.ts`
para no tirar producción. Este documento es el runbook **paso a paso** para
flipar el enforce sin downtime.

> Por qué importa: sin App Check enforce, cualquier script externo que
> conozca la URL de `askAi` puede llamar a la Cloud Function. Con enforce,
> sólo el cliente legítimo (con token reCAPTCHA v3 válido) puede invocarla.

---

## Lo que YA está hecho

- [x] `firebase-app-check-compat.js` cargado en los HTMLs principales
  (`index.html`, `profesionales.html`, `admin-dashboard.html`,
  `pacientes.html`, `chatbot-medicacion.html`, `corrector-clinico.html`,
  `analiticas.html`, `panel-medico.html`, `notebook-local.html`,
  `plantillas-informes.html`, `proa.html`, `docencia.html`).
- [x] `firebase-init.js` activa App Check sólo si `window.RECAPTCHA_SITE_KEY`
  contiene un site key real. Sin la key, salta limpio (no rompe la app).
- [x] `askAi.ts` con un comentario flag claro encima de `enforceAppCheck`.

## Lo que falta — pasos en orden estricto

### 1. Crear la reCAPTCHA v3 site key (5 min · Carlos GUI)

URL: <https://www.google.com/recaptcha/admin/create>

- Tipo: **reCAPTCHA v3**.
- Etiqueta: `Cartagenaeste prod`.
- Dominios: `area2cartagena.es`, `carlosgalera-a11y.github.io`.
- Acepta los términos y guarda.

Tras guardar, Google devuelve **dos** valores:

- `Site key` (público, va al frontend) — empieza por `6L…`.
- `Secret key` (privado) — **no se usa** con App Check; es para verificación
  server-side directa, que aquí no necesitamos.

Anota el **site key**.

### 2. Registrar el site key en Firebase App Check (3 min · Carlos GUI)

URL: <https://console.firebase.google.com/project/docenciacartagenaeste/appcheck/apps>

1. App: **Cartagenaeste PWA** (web app `1:1056320755107:web:126637bf63c13bbb297616`).
2. Botón "Registrar" → proveedor "**reCAPTCHA v3**".
3. Pega el site key obtenido en el paso 1.
4. Guardar.

Esto **no activa el enforce** todavía — solo enseña a Firebase qué key
considerar válida.

### 3. Inyectar el site key en los HTMLs (1 PR · Claude Code)

En **cada** uno de los HTMLs principales (los listados arriba) añadir, justo
ANTES de `<script src="firebase-init.js">`:

```html
<script>window.RECAPTCHA_SITE_KEY='6Lc…paste_real_site_key_here';</script>
```

Una sola línea, idéntica en todos. Tras hacer merge y push:

- Abrir `https://area2cartagena.es/` en DevTools → Console.
- Esperar mensaje: `[app-check] activado con reCAPTCHA v3`.
- Network → cualquier llamada a `askAi` → ver header
  `X-Firebase-AppCheck: ey…` en la request.

Si no se ve el header, **no continuar al paso 4** — App Check no está
emitiendo token y flipar enforce dejaría la IA inaccesible.

### 4. Activar enforce en askAi (1 PR · Claude Code)

En `functions/src/askAi.ts`:

```ts
enforceAppCheck: true,   // antes era false
```

Build y deploy:

```bash
cd functions && npm run build
firebase deploy --only functions:askAi
```

Tras el deploy, validar en producción:

- Petición legítima desde `area2cartagena.es` → 200, IA responde.
- Petición sin token (curl directo a la URL de la Cloud Function) → 401
  con `{ error: { status: 'unauthenticated', message: 'App Check token …' } }`.

### 5. Activar enforce en Firestore + Storage (5 min · Carlos GUI)

URL: <https://console.firebase.google.com/project/docenciacartagenaeste/appcheck>

Pestaña "APIs":

- **Cloud Firestore** → Enforce.
- **Cloud Storage** → Enforce.
- (`Cloud Functions for Firebase` ya está cubierto por el flag del paso 4.)

Esto puede tardar hasta 15 min en propagarse. Durante ese tiempo, peticiones
desde clientes sin App Check empezarán a recibir `permission-denied`.

---

## Rollback

Si algo se rompe tras el paso 4 (p.ej. tokens no llegan en Safari iOS):

```bash
# Edit functions/src/askAi.ts → enforceAppCheck: false
firebase deploy --only functions:askAi
```

Y en la Console de App Check, des-marcar "Enforce" en Firestore/Storage.
La app vuelve al estado pre-flip. Documentar la causa antes de reintentar.

---

## Métricas a vigilar tras el flip

- Cloud Monitoring → invocaciones de `askAi`: no debería caer >5% respecto
  a la semana previa (si cae más, hay un cliente legítimo que no obtiene
  token — investigar).
- Firebase Console → App Check → "Token requests" — debería ser ~igual al
  número de peticiones a `askAi`.
- Sentry: cualquier error nuevo del tipo `app-check-token-is-invalid`
  apunta a un cliente que cayó del rollout.
