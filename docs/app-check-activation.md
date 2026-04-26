# Activación de App Check enforce — pasos restantes

Estado tras este PR (claude/app-check-prep):

- ✅ `firebase-init.js` activa App Check automáticamente al cargar si `window.RECAPTCHA_SITE_KEY` está definido (ya no requiere primera llamada a `askAi`).
- ✅ `prepara-consulta.html` carga `firebase-app-check-compat.js` (era el único HTML con `askAi` que faltaba).
- ✅ `ai-client.js` ya tenía `initAppCheck()` defensivo (idempotente, warn si falta key).
- ❌ `enforceAppCheck: false` sigue en [functions/src/askAi.ts:47](functions/src/askAi.ts:47). El flip se hace en otro PR cuando estos pasos manuales estén listos.

## Pasos manuales (Carlos)

### 1. Crear reCAPTCHA v3 site key (5 min)

1. Ir a https://www.google.com/recaptcha/admin/create
2. Configurar:
   - Label: `Cartagenaeste Production`
   - reCAPTCHA type: **reCAPTCHA v3**
   - Domains:
     - `area2cartagena.es`
     - `carlosgalera-a11y.github.io`
   - Owners: `carlosgalera2roman@gmail.com`
3. Aceptar términos → SUBMIT.
4. Copiar **Site Key** (formato `6Lc...`). La Secret Key se ignora (no se usa en cliente).

### 2. Registrar el site key en Firebase App Check (3 min)

1. https://console.firebase.google.com/project/docenciacartagenaeste/appcheck
2. Tab **Apps** → seleccionar la app web → **reCAPTCHA v3** → pegar el Site Key.
3. **Token TTL**: 1 hour (default).
4. Save.

### 3. Inyectar el site key en cada HTML (10 min)

Añadir **antes** de `<script src="firebase-init.js">` en los 12 HTMLs que llaman a `askAi`:

```html
<script>window.RECAPTCHA_SITE_KEY='6Lc...';</script>
```

HTMLs afectados:
- `analiticas.html`
- `chatbot-medicacion.html`
- `corrector-clinico.html`
- `docencia.html`
- `notebook-local.html`
- `pacientes.html`
- `panel-medico.html`
- `plantillas-informes.html`
- `prepara-consulta.html`
- `proa.html`
- `transcripcion.html`
- `triaje-ai.html`

(Alternativa: añadir el `<script>` en `firebase-init.js` directamente como constante hardcoded — el site key es público.)

### 4. Verificar en producción (5 min)

1. Recargar cualquier HTML del listado en `https://area2cartagena.es/`.
2. DevTools → Application → Cookies → buscar `_GRECAPTCHA` (debe estar presente).
3. DevTools → Network → filtrar `appCheck` → debe haber un POST a `firebaseappcheck.googleapis.com` que devuelve `200`.
4. Hacer una pregunta IA → debe funcionar normalmente.

### 5. Activar enforce en backend (último paso, otro PR)

Cuando los pasos 1–4 estén verificados:

```ts
// functions/src/askAi.ts:47
enforceAppCheck: true,
```

Y redeploy:

```
firebase deploy --only functions:askAi --project docenciacartagenaeste
```

A partir de ese momento, cualquier llamada a `askAi` sin token App Check válido devuelve `failed-precondition` y `ai-client.js` lo traduce a "Verificación de seguridad (App Check) fallida. Recarga la página."

### 6. Activar enforce en Firestore + Storage (opcional, recomendado)

https://console.firebase.google.com/project/docenciacartagenaeste/appcheck/products

Cambiar **Firestore** y **Storage** a "Enforced" cuando confirmes que >95% de tráfico viene con token. Hasta entonces, dejar en "Unenforced" para no bloquear usuarios legítimos.
