# Guía detallada — pasos 🟡 alto impacto (#5–#8)

Tras cerrar los 4 bloqueantes del TOP-4 (secretos rotados, historia purgada, branch protection, admin fantasma), los 4 siguientes pasos son "alto impacto": elevan la percepción técnica del proyecto sin ser bloqueantes, pero son necesarios para pitch a B2B sanitario (farma, hospital, CDTI).

Orden sugerido: **#6 Sentry → #5 App Check → #7 GH Actions → #8 Monitoring**. De menor a mayor complejidad. Cada paso tiene instrucciones paso a paso.

---

## #6 · Sentry activo (DSN) · 20 min

**Qué es**: plataforma de captura de errores en runtime. Hoy el código tiene el scaffolding listo (PR #13) pero NO está activo porque falta el DSN. Sin esto, un inversor asume "incidentes sin detectar".

### Paso a paso

1. **Crear cuenta en Sentry** (free tier, 5000 eventos/mes):
   - Abre https://sentry.io/signup/
   - Sign up with Google (usa `carlosgalera2roman@gmail.com`).
   - En "What do you want to monitor?": **Browser JavaScript**.
   - Organization name: `cartagenaeste`.
   - Project name: `cartagenaeste-frontend`.
   - Platform: **Browser JavaScript**.

2. **Copiar el DSN**:
   - Tras crear el proyecto verás una pantalla con algo como:
     ```js
     Sentry.init({
       dsn: "https://abc123xyz@o12345.ingest.sentry.io/67890",
       ...
     });
     ```
   - **Copia el valor completo del `dsn`** (empieza por `https://` y termina con un número).

3. **Pasarme el DSN aquí en el chat** (es una URL pública del endpoint de Sentry, no es sensible — aparece en el source del frontend, diseñado para ser público).

4. Lo que haré yo entonces:
   - Añadiré `<script>window.SENTRY_DSN='TU_DSN'</script>` antes de cargar ai-client.js en los HTMLs principales (index.html, app.html, notebook-local.html, chatbot-medicacion.html, triaje-ai.html, pacientes.html, plantillas-informes.html, analiticas.html, transcripcion.html, corrector-clinico.html).
   - Cargar Sentry CDN y activar `Sentry.init()` con:
     - `tracesSampleRate: 0.1` (10% de requests para performance monitoring)
     - `beforeSend` filter: scrubbing obligatorio de campos `notes`, `observations`, `diagnosis`, `treatment`, `initials`, `prompt` (RGPD).
     - `denyUrls`: `/^chrome-extension:\/\//`, `/^moz-extension:\/\//` (ignora extensiones de navegador).
   - PR + merge + deploy.

5. **Test de validación** (lo haces tú tras merge):
   - Abre https://area2cartagena.es/ → DevTools Console → ejecuta:
     ```js
     throw new Error('Test Sentry desde Carlos ' + new Date().toISOString());
     ```
   - Ve a https://sentry.io/organizations/cartagenaeste/issues/
   - Deberías ver el error en <30 segundos.

### Opcional — Sentry también en Cloud Functions (otros 15 min)

Si quieres ir más lejos (detectar crashes de askAi y audit triggers):

```bash
cd /Users/carlos/cartagenaestewebappSOLIDA/functions
npm install @sentry/google-cloud-serverless --save
firebase functions:secrets:set SENTRY_DSN
# pega el DSN (el mismo que el frontend, no hace falta otro proyecto)
firebase deploy --only functions
```

Y luego yo añado `Sentry.init()` en `functions/src/index.ts`.

---

## #5 · App Check enforce ON · 30 min

**Qué es**: Firebase App Check verifica que las llamadas a Cloud Functions/Firestore/Storage vienen de **tu** frontend (area2cartagena.es), no de scripts externos. Sin esto, cualquiera con el endpoint puede llamar a `askAi` desde Postman.

**Hoy está OFF** (`enforceAppCheck: false` en `functions/src/askAi.ts`). Activarlo requiere reCAPTCHA v3 como proveedor de atestación.

### Paso a paso

#### 5.1 · Crear site key de reCAPTCHA v3

1. Abre https://www.google.com/recaptcha/admin/create
2. Login con la misma cuenta Google del proyecto (`ramongalera22@gmail.com`).
3. Rellena el form:
   - **Label**: `Cartagenaeste Producción`
   - **reCAPTCHA type**: **v3** (Score-based, no v2 que pide checkbox).
   - **Domains** (añade uno por línea):
     ```
     area2cartagena.es
     www.area2cartagena.es
     carlosgalera-a11y.github.io
     ```
   - **Owners**: deja tu email.
   - Acepta términos → **Submit**.

4. **Copia dos valores** que te muestra:
   - **Site key** (público, va en el frontend — típicamente empieza por `6L...`).
   - **Secret key** (privado, NO lo uses ni lo pegues en chat — no lo necesitas para App Check v3; solo sería si hicieras tú la verificación server-side).

5. **Pásame SOLO el site key** aquí (se expone en el source HTML de la web — es público por diseño).

#### 5.2 · Lo que haré yo

Una vez me pases el site key:

1. Añadir `<script>window.RECAPTCHA_SITE_KEY='6L...'</script>` en los 10 HTMLs principales (antes de `ai-client.js`).
2. `ai-client.js` ya tiene `initAppCheck()` preparado para leer `window.RECAPTCHA_SITE_KEY` (PR #4) — automáticamente se activa.
3. Cambiar `enforceAppCheck: false → true` en `functions/src/askAi.ts` + redeploy `firebase deploy --only functions:askAi`.
4. PR + merge + sync.

#### 5.3 · Activar enforce en Firebase Console (GUI, 2 min, lo haces tú)

Tras el deploy de la función:

1. Abre https://console.firebase.google.com/project/docenciacartagenaeste/appcheck/products
2. Pestaña **Apps** → encuentra tu web app registrada:
   - Si no está registrada, "Register app" → selecciona **reCAPTCHA v3** como proveedor → pega el **site key**.
3. Pestaña **APIs** → para cada servicio:
   - **Cloud Functions (1st-gen + 2nd-gen)** → botón "Enforce" → confirma.
   - **Cloud Firestore** → "Enforce".
   - **Firebase Authentication** → déjalo en "Monitor" (enforce rompe logins si algo está mal).
   - **Storage** → "Enforce".

#### 5.4 · Test de validación

1. Abre https://area2cartagena.es/ en navegador normal → Login → MegaCuaderno IA → pregunta cualquier cosa → debe funcionar.
2. Abre https://area2cartagena.es/ en ventana incógnito **sin logear** → cualquier request debería fallar con `functions/failed-precondition` (lo que queremos).
3. Opcional: desde otra máquina con `curl` contra el endpoint — debe devolver 401/403.

---

## #7 · GitHub Actions secrets para deploy automatizado · 15 min

**Qué es**: hoy los deploys (`firebase deploy --only functions`) son manuales desde tu Mac. Con GH Actions configurados, cada `git push` a un tag `v*` (como `v1.0.0`, `v1.0.1`...) dispara deploy automático. El workflow ya existe (`.github/workflows/deploy.yml` — PR #14) pero no puede correr porque faltan los secrets.

### Paso a paso

#### 7.1 · Crear Service Account en GCP

1. Abre https://console.cloud.google.com/iam-admin/serviceaccounts?project=docenciacartagenaeste
2. **Create service account**:
   - Name: `github-actions-deploy`
   - ID: se rellena solo (`github-actions-deploy@docenciacartagenaeste.iam.gserviceaccount.com`)
   - Description: `Deploy from GitHub Actions CI/CD`
   - Click **Create and continue**.

3. **Grant access — asignar roles** (uno por uno, click "Add another role"):
   - `Cloud Functions Admin` (`roles/cloudfunctions.admin`)
   - `Firebase Hosting Admin` (`roles/firebasehosting.admin`)
   - `Service Account User` (`roles/iam.serviceAccountUser`) — necesario para que la SA pueda "act as" el runtime default.
   - `Cloud Run Admin` (`roles/run.admin`) — Cloud Functions v2 usa Cloud Run.
   - `Secret Manager Secret Accessor` (`roles/secretmanager.secretAccessor`) — leer secretos del askAi.
   - `Artifact Registry Writer` (`roles/artifactregistry.writer`) — subir imágenes de la función.
   - Click **Continue** → **Done**.

4. **Generar key JSON**:
   - En la lista de SAs, click en `github-actions-deploy@...`
   - Pestaña **Keys** → **Add key** → **Create new key** → **JSON** → **Create**.
   - Se descarga un `.json` con un blob enorme.

5. **Abrir el .json** con un editor y copiar TODO el contenido (es como 2000 chars con `{..., "private_key": "-----BEGIN..."...}`).

#### 7.2 · Añadir el secret a GitHub

1. Abre https://github.com/carlosgalera-a11y/Cartagenaeste/settings/secrets/actions
2. **New repository secret**:
   - **Name**: `FIREBASE_SERVICE_ACCOUNT`
   - **Secret**: pega el JSON completo del paso 7.1.5.
   - **Add secret**.

3. **Borrar el .json descargado** de tu Mac:
   ```bash
   rm ~/Downloads/docenciacartagenaeste-*.json
   ```
   (O el nombre que tenga. Si queda en Papelera, vaciar Papelera.)

#### 7.3 · Secret AREA2_PAT (para sync al repo espejo)

1. Abre https://github.com/settings/personal-access-tokens/new
2. **Token name**: `cartagenaeste-deploy-sync-area2`
3. **Expiration**: 90 days (renovable después).
4. **Repository access**: Only select repositories → selecciona `carlosgalera-a11y/area2cartagena`.
5. **Repository permissions**:
   - `Contents`: **Read and write** ← importante para push.
   - `Metadata`: Read-only (viene por defecto).
   - Deja el resto sin tocar.
6. **Generate token**.
7. Copia el valor que empieza por `github_pat_...`.
8. En https://github.com/carlosgalera-a11y/Cartagenaeste/settings/secrets/actions:
   - **New repository secret** → Name: `AREA2_PAT` → pega el token → **Add**.

#### 7.4 · Test de validación

Tras tener los 2 secrets:

```bash
cd /Users/carlos/cartagenaestewebappSOLIDA
git tag v1.0.1 -m "Release v1.0.1 — test CI/CD"
git push origin v1.0.1
```

Abre https://github.com/carlosgalera-a11y/Cartagenaeste/actions → deberías ver el workflow "Deploy" corriendo. Si pasa verde, tienes CI/CD funcional.

Si falla, lo más probable es roles insuficientes en la SA. Me pegas el log y lo resolvemos.

---

## #8 · Cloud Monitoring dashboard + 8 alertas · 30 min

**Qué es**: hoy GCP registra métricas por defecto (invocaciones, latencia, errores) pero no las vemos de forma agregada ni recibimos alertas proactivas. Con esto montado, cualquier anomalía (5% error rate, coste >50€/mes) llega a tu email en minutos.

### 8.1 · Notification channel (email, 2 min, tú)

**NOTA**: este paso requiere GUI por la verificación del email. Todo lo demás lo puedo hacer yo vía `gcloud`.

1. Abre https://console.cloud.google.com/monitoring/alerting/notifications?project=docenciacartagenaeste
2. Pestaña **Email** → **Add new**.
3. Email: `carlosgalera2roman@gmail.com`
4. Display name: `Carlos — alertas Cartagenaeste`
5. **Save**.
6. GCP enviará un correo de confirmación — confírmalo.

#### Opcional pero recomendable — SMS también (3 min)

Para alertas críticas (error rate >5%, 5xx en hosting) te conviene SMS además de email.

1. En la misma página, pestaña **SMS** → **Add new**.
2. Teléfono con prefijo +34...
3. GCP manda un SMS con código.
4. Meter el código para confirmar.

(SMS de GCP es gratis hasta límites generosos — ni te vas a enterar.)

#### 8.2 · Lo que haré yo por CLI

Tras confirmar el email, te pido el ID del canal y monto por `gcloud`:
- 8 políticas de alerta (error rate askAi, p95 latencia, Firestore reads, coste, 5xx...).
- 1 dashboard "Cartagenaeste Producción" con 6 gráficas.

Output: todo en YAML en `docs/monitoring/` del repo, commiteado como infra-as-code.

### 8.3 · Test de validación

Forzar un error para disparar una alerta:

```bash
# En tu terminal, con ?=user autenticado
firebase functions:shell
```

Dentro:
```js
// Esto hará fallar la función (payload inválido)
askAi({type:'invalid', prompt:''}, {auth:{uid:'x'}})
```

Repetir 30 veces rápido → error rate >5% en 10 min → alerta email.

---

## Orden de ejecución recomendado

**Hoy (si tienes 60 min)**:
1. Crear cuenta Sentry → pasarme el DSN (5 min tú).
2. Crear reCAPTCHA v3 → pasarme el site key (5 min tú).
3. Crear notification channel email en Monitoring (3 min tú).
4. Yo hago PRs para #6, #5, #8 con toda la config (30 min mi tiempo).
5. Tras merge, tú activas "Enforce" en App Check console (2 min tú).
6. Test de validación (5 min tú).

**Otro día** (con más tiempo):
- Paso #7 GH Actions (15 min tú — más largo porque hay varios panels).
- Hacer el Service Account + token + secrets requiere algo de atención.

## Lo que puedo hacer **ya mismo sin input tuyo** (cierro el resto del 🟡)

Sí hay partes que no requieren nada de ti:
- Añadir el scaffolding completo de Sentry en los 10 HTMLs (queda listo; solo necesita el DSN que me pases después para que envíe eventos).
- Crear el archivo `.github/workflows/deploy.yml` refactorizado (ya existe de PR #14, pero puedo endurecerlo).
- Escribir los manifests YAML de las 8 alertas de Monitoring (sin crear canal aún).

Dime qué prefieres:
- (A) te paso DSN Sentry + site key reCAPTCHA + confirmo el email channel, y en 1h tienes #5, #6, #8 cerrados.
- (B) haces #7 (GH Actions) primero porque prefieres automatización de deploy.
- (C) voy haciendo lo que pueda sin input y te dejo todo listo para que solo tengas que pegar 2 valores cuando puedas.
