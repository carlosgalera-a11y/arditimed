# Runbook · Cartagenaeste

Operación del proyecto. Comandos frecuentes, despliegues, troubleshooting.

> **Hosting**: GitHub Pages (regla #9 de CLAUDE.md). Deploy frontend = `git push origin main`.
> **Backend**: Firebase — Firestore, Auth, Storage, Cloud Functions (europe-west1).

---

## 1 · Setup inicial (una vez)

### 1.1 Instalar Firebase CLI

```bash
npm install -g firebase-tools@latest
firebase login
firebase use docenciacartagenaeste
```

### 1.2 Instalar dependencias de functions

```bash
cd functions
npm install
```

---

## 2 · Secretos en Secret Manager

Todas las claves IA viven en Google Secret Manager, **nunca** en el repo ni en `.env` desplegado. Se cargan en Cloud Function en tiempo de ejecución vía `defineSecret()`.

### 2.1 Crear/rotar cada secreto

```bash
# Cada comando abre un prompt interactivo; pega el valor cuando lo pida.
# NUNCA pegues la key como argumento de línea de comandos (queda en shell history).

firebase functions:secrets:set DEEPSEEK_API_KEY
firebase functions:secrets:set GEMINI_API_KEY
firebase functions:secrets:set MISTRAL_API_KEY
firebase functions:secrets:set QWEN_API_KEY
```

### 2.2 Verificar que existen (sin ver el valor entero)

```bash
firebase functions:secrets:access DEEPSEEK_API_KEY | head -c 10 ; echo "..."
firebase functions:secrets:access GEMINI_API_KEY | head -c 10 ; echo "..."
firebase functions:secrets:access MISTRAL_API_KEY | head -c 10 ; echo "..."
firebase functions:secrets:access QWEN_API_KEY | head -c 10 ; echo "..."
```

### 2.3 Rotación

```bash
# Al revocar una key en el provider, generar la nueva y:
firebase functions:secrets:set DEEPSEEK_API_KEY
# Redeploy para que la Cloud Function recoja la nueva versión:
firebase deploy --only functions:askAi
```

### 2.4 Inventario de secretos activos

| Secret name | Provider | Consola |
|---|---|---|
| `DEEPSEEK_API_KEY` | DeepSeek | https://platform.deepseek.com/api_keys |
| `GEMINI_API_KEY` | Google AI Studio (Gemini) | https://aistudio.google.com/apikey |
| `MISTRAL_API_KEY` | Mistral EU | https://console.mistral.ai/api-keys/ |
| `QWEN_API_KEY` | DashScope (Alibaba Cloud) | https://dashscope.console.aliyun.com/apiKey |

---

## 3 · Desarrollo local con emuladores

### 3.1 Arrancar emuladores

```bash
# Desde la raíz del repo:
firebase emulators:start --only functions,firestore,auth
```

El emulador de Functions corre la función compilada en `functions/lib/`. Antes:

```bash
cd functions && npm run build
```

O en modo watch:

```bash
cd functions && npm run build:watch
```

### 3.2 Tests unitarios

```bash
cd functions
npm test               # una pasada
npm run test:watch     # modo watch
npm run test:coverage  # con reporte de cobertura (target ≥70% líneas/funciones)
```

Salida esperada:
```
Test Files  7 passed (7)
Tests      63 passed (63)
Coverage   ~90% statements, ~80% branches
```

### 3.3 Pruebas manuales del callable en emulador

Desde el frontend en modo dev:

```js
firebase.functions().useEmulator('localhost', 5001);
const askAi = firebase.functions().httpsCallable('askAi');
await askAi({
  type: 'educational',
  prompt: 'Explícame la fisiopatología del ictus isquémico en 3 líneas.',
  systemPrompt: 'Eres un MFyC formador.',
});
```

---

## 4 · Deploy a producción

### 4.1 Cloud Functions

```bash
# Build + deploy
cd functions && npm run build && cd ..
firebase deploy --only functions:askAi
```

### 4.2 Firestore rules + indexes

```bash
firebase deploy --only firestore
```

### 4.3 Frontend (GitHub Pages)

```bash
# El deploy es git push. No usar firebase deploy --only hosting (ver regla #9 CLAUDE.md).
git push origin main
# GitHub Pages propaga en ~1 min a https://area2cartagena.es/
```

### 4.4 Verificación post-deploy

```bash
# Smoke tests
bash test-deploy.sh

# Logs en vivo de la función
firebase functions:log --only askAi --lines 50
```

---

## 5 · Modelo Firestore usado por `askAi`

| Colección | Documento | Acceso | Finalidad |
|---|---|---|---|
| `users/{uid}` | — | read/write: dueño | Perfil + campo `role: 'admin' \| 'user'` (controla límite 200 vs 50) |
| `users/{uid}/quotas/{YYYY-MM-DD}` | `{ count, limit, updatedAt }` | Function-only | Cuota diaria por usuario (UTC) |
| `users/{uid}/aiRequests/{autoId}` | metadatos (sin prompt) | read: dueño o admin | Auditoría por usuario |
| `aiCache/{sha256}` | `{ text, provider, model, tokensIn, tokensOut, expiresAt }` | Function-only | Caché compartida 7 días |
| `rate_limits_ip/{ip}__{YYYY-MM-DDTHH-MM}` | `{ count, expiresAt }` | Function-only | Rate limit por IP (30/min) |

Para limpieza automática, crear una **TTL policy** en Firestore Console:
- Collection: `aiCache`, field: `expiresAt`
- Collection: `rate_limits_ip`, field: `expiresAt`

---

## 6 · Errores y respuestas esperadas en el frontend

| Código HttpsError | Cuándo ocurre | Copy user-facing sugerido |
|---|---|---|
| `unauthenticated` | Sin `firebase.auth().currentUser` | Redirigir a login |
| `invalid-argument` | Prompt vacío, con DNI/NIE/NHC, o >8000 chars | Toast con `error.message` (incluye razón) |
| `resource-exhausted` | Cuota 50/día o 30/min IP superadas | Modal "Has alcanzado tu límite diario. Vuelve mañana." / toast "Reintenta en 1 min" |
| `unavailable` | Todos los providers fallaron | Toast "IA temporalmente no disponible. Reintenta." |
| `deadline-exceeded` | Timeout 60s | Reintentar 1 vez con delay 3s |
| `failed-precondition` | App Check faltante o inválido | Verificar reCAPTCHA/debug token |

Template de manejo en frontend (vanilla JS, sin dependencias):

```js
async function askAi(payload) {
  try {
    const call = firebase.functions().httpsCallable('askAi');
    const { data } = await call(payload);
    return data;
  } catch (e) {
    switch (e.code) {
      case 'functions/unauthenticated': location.href = '/index.html#login'; break;
      case 'functions/resource-exhausted':
        alert(e.message); break;
      case 'functions/unavailable':
        toast('IA temporalmente no disponible. Reintenta en 1 minuto.'); break;
      case 'functions/deadline-exceeded':
        return askAi(payload); // un reintento
      default:
        toast(e.message || 'Error inesperado'); break;
    }
    throw e;
  }
}
```

---

## 7 · App Check

### 7.1 Activar enforce en consola

https://console.firebase.google.com/project/docenciacartagenaeste/appcheck

- Cloud Functions → Enforce: **ON**
- Firestore → Enforce: **ON**
- Storage → Enforce: **ON**

### 7.2 reCAPTCHA v3 en el frontend

```js
if (!firebase.appCheck) {
  const { initializeAppCheck, ReCaptchaV3Provider } = window;
  initializeAppCheck(firebase.app(), {
    provider: new ReCaptchaV3Provider('TU_RECAPTCHA_SITE_KEY'),
    isTokenAutoRefreshEnabled: true,
  });
}
```

`RECAPTCHA_SITE_KEY` se mete en `.env.local` para dev y en una constante global en producción (es pública, no es secreto).

---

## 8 · Troubleshooting

### 8.1 `Failed to deploy functions: Error: Secret DEEPSEEK_API_KEY not found`

El secret no está creado o la cuenta no tiene permisos. Ver §2.1.

### 8.2 Rate limit aparentemente agresivo en tests

Los tests comparten el mismo bucket de IP. En dev con emuladores, el rate_limit_ip usa Firestore emulator — se resetea al reiniciar.

### 8.3 Cache no se limpia

Verificar que la TTL policy de Firestore está creada (§5). Sin ella, `aiCache` crece indefinidamente. La función igualmente respeta `expiresAt` en lectura.

### 8.4 Ver costes estimados

`firebase functions:log --only askAi | grep costEstimateEur`

---

_Mantener este runbook al día cada vez que se toque functions o Firestore. Referenciar desde CLAUDE.md._
