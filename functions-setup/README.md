# Despliegue Cloud Function — Cartagenaeste

Guía paso a paso para mover las API keys al backend de Firebase.

**Objetivo:** que las keys `DEEPSEEK_KEY` y `OPENROUTER_KEY` dejen de estar en el frontend (ofuscadas con XOR-42) y pasen a variables de entorno de Firebase, inaccesibles desde DevTools del navegador.

**Tiempo estimado:** 15–25 minutos si nunca has usado Firebase CLI.

---

## Paso 0 — Requisitos previos

Necesitas:
- Node.js 20+ instalado (`node --version` debe devolver v20.x o superior).
- Cuenta Google con acceso al proyecto `docenciacartagenaeste` en Firebase Console.
- Las API keys actuales:
  - DeepSeek: `sk-a89dd17f...` (la que ya tienes en `app-main.js` XOR-obfuscada, hay que rotarla después de este despliegue).
  - OpenRouter: la que está en `_dk()` — también rotar.

---

## Paso 1 — Instalar Firebase CLI

```bash
npm install -g firebase-tools
firebase --version   # debe devolver 13.x o superior
```

Luego autentícate:

```bash
firebase login
# Se abre el navegador, te pide login con la cuenta Google que tiene acceso a docenciacartagenaeste
```

---

## Paso 2 — Copiar los archivos de `functions-setup/` a tu máquina

En tu ordenador, crea una carpeta fuera del repo (no mezclar con el sitio):

```bash
mkdir ~/cartagenaeste-backend
cd ~/cartagenaeste-backend
```

Copia el contenido de `functions-setup/` del repo:

```bash
cp -r /ruta/al/repo/functions-setup/. .
# Ahora deberías ver: firebase.json, .firebaserc, functions/
```

Verifica que estás apuntando al proyecto correcto:

```bash
firebase use
# Debería mostrar: Active Project: default (docenciacartagenaeste)
```

---

## Paso 3 — Actualizar el plan de Firebase a Blaze (pago por uso)

**Importante:** Cloud Functions requiere plan Blaze. Pero para tu volumen:
- Primeras 2 millones de invocaciones al mes: **gratis**.
- Primeros 400.000 GB-segundos de cómputo: **gratis**.

Con tu uso real (residentes consultando DeepSeek, ~100-500 req/día), **pagarás 0€** casi seguro. Pero sin Blaze no se pueden desplegar.

Ve a https://console.firebase.google.com/project/docenciacartagenaeste/usage/details y activa Blaze. Pon un alerta de facturación en 5€ por si acaso.

---

## Paso 4 — Instalar dependencias y guardar los secrets

```bash
cd functions
npm install
cd ..
```

Guarda las keys como Secrets (encrypted at rest, no en el código):

```bash
firebase functions:secrets:set DEEPSEEK_KEY
# Te pide pegar la clave. Pega sk-a89dd17f... y pulsa Enter.

firebase functions:secrets:set OPENROUTER_KEY
# Pega la clave de OpenRouter.
```

Verifica:

```bash
firebase functions:secrets:access DEEPSEEK_KEY
# Debe devolver la clave que acabas de introducir.
```

---

## Paso 5 — Activar App Check en Firebase Console

1. Ve a https://console.firebase.google.com/project/docenciacartagenaeste/appcheck
2. Pestaña **Apps** → selecciona la app web de Cartagenaeste.
3. En proveedor elige **reCAPTCHA v3**.
4. Ve a https://www.google.com/recaptcha/admin/create
   - Tipo: **reCAPTCHA v3**
   - Dominios: `carlosgalera-a11y.github.io`, `cartagenaeste.es`, `localhost`
   - Aceptar condiciones, Enviar.
5. Copia la **Site Key** (pública) — la usarás en el frontend.
6. Copia la **Secret Key** (privada) — pégala en la configuración de App Check en Firebase.
7. Vuelve a Firebase Console → App Check → pestaña **APIs** → activa enforcement para **Cloud Functions**.

---

## Paso 6 — Desplegar las Cloud Functions

```bash
firebase deploy --only functions
```

Primera vez tarda ~3-5 minutos. Output final debe contener:

```
✔  functions[llamarIA(europe-west1)] Successful create operation.
✔  functions[scanIA(europe-west1)] Successful create operation.
```

Copia las URLs que aparecen (las necesitas en Paso 7).

---

## Paso 7 — Conectar el frontend a las Cloud Functions

Edita `index.html` del sitio. Busca el bloque donde está cargado el SDK Firebase y añade los módulos `functions` y `app-check`.

**Añade después de los SDKs existentes de Firebase:**

```html
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-functions-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-check-compat.js"></script>
```

**Y en el bloque de inicialización de Firebase, añade:**

```javascript
// Activar App Check — PÉGA AQUÍ TU SITE KEY DE reCAPTCHA v3
const appCheck = firebase.appCheck();
appCheck.activate('TU_RECAPTCHA_V3_SITE_KEY', true);

// Conectar al backend europe-west1
const functions = firebase.app().functions('europe-west1');
```

**Reemplaza la función `llamarIA` en `app-main.js` (línea 971) por esto:**

```javascript
async function llamarIA(up, sp) {
  up = sanitizeAI(up || '');
  if (!up) return '⚠️ Consulta vacía o inválida.';
  try { aiRateLimiter.check(); } catch(e) { return e.message; }

  if (!firebase.auth().currentUser) {
    return '⚠️ Debes iniciar sesión para usar la IA.';
  }

  try {
    const call = firebase.app().functions('europe-west1').httpsCallable('llamarIA');
    const result = await call({ user: up, system: sp });
    return result.data.text || '⚠️ Respuesta vacía del servidor.';
  } catch (e) {
    console.error('llamarIA error:', e);
    if (e.code === 'functions/resource-exhausted') return '⏱️ ' + (e.message || 'Límite alcanzado.');
    if (e.code === 'functions/unauthenticated') return '⚠️ Sesión expirada. Vuelve a iniciar sesión.';
    return '⚠️ Error del servicio de IA: ' + (e.message || 'intenta de nuevo más tarde.');
  }
}
```

**Análogamente, en ScanIA (línea ~2040) reemplaza el fetch directo por:**

```javascript
const call = firebase.app().functions('europe-west1').httpsCallable('scanIA');
const result = await call({
  imageBase64: scanB64,
  systemPrompt: sys,
  userText: userText,
  modelPref: 'qwen'
});
const txt = result.data.text;
const usedModel = result.data.model;
```

---

## Paso 8 — Borrar las keys del frontend

En `app-main.js`:
1. Borra la función `_dk()` (línea 57) — ya no se usa.
2. Borra la función `_xd()` (línea 55) si no la usa nada más.
3. Borra las llamadas `var DS_KEY = _xd(...)` y `var OR_KEY = _dk()`.
4. Borra `SCAN_GROQ_KEY_DEFAULT`, `EMBEDDED_GROQ_KEY`, `SCAN_GROQ_KEY`, `getScanGroqKey`.

---

## Paso 9 — ROTAR las keys antiguas

**Esto es crítico.** Las keys que están en el historial Git siguen expuestas. Ve a:

1. https://platform.deepseek.com/api_keys → revoca `sk-a89dd17f...` → crea una nueva → guárdala con `firebase functions:secrets:set DEEPSEEK_KEY`.
2. https://openrouter.ai/keys → revoca la actual → crea nueva → `firebase functions:secrets:set OPENROUTER_KEY`.
3. Redeploy: `firebase deploy --only functions`.

---

## Paso 10 — Verificar

En el navegador, abre DevTools → Network. Al hacer una consulta, ahora debe aparecer:

```
POST https://europe-west1-docenciacartagenaeste.cloudfunctions.net/llamarIA
```

Y NO debe aparecer ninguna llamada directa a `api.deepseek.com` ni a `openrouter.ai`. Si aparece, algo quedó sin migrar.

En la cabecera Authorization del request, ya NO ves `Bearer sk-...` de DeepSeek — solo ves un token Firebase ID (que es temporal y del usuario, no una API key compartida).

---

## ¿Qué has ganado?

| Antes | Después |
|---|---|
| Key DeepSeek visible con DevTools en 30s | Key vive en Google Cloud, nunca sale |
| Cualquiera con la URL puede gastar tus créditos | Solo usuarios logueados con App Check |
| Rate limit bypasseable recargando | Rate limit en servidor por UID |
| 0€ si key filtrada y te gastan 100€ | 0€ + key rotable en segundos |

---

## Cuándo me necesitas de vuelta

Cuando hayas hecho los Pasos 1–6 (que son los que requieren tu cuenta), dime y te paso el **diff exacto** del `index.html` y `app-main.js` para los Pasos 7–10. Prefiero no tocar el frontend antes de saber que tu backend está vivo.

Tiempo real tuyo estimado: ~40 minutos si nunca has usado Firebase CLI, ~15 si ya lo conoces.
