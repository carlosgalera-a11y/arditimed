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

### 2.1 Secretos mínimos para deploy (obligatorios)

Con solo estos 2, `askAi` funciona para los 3 tipos (clinical_case / educational / vision). OpenRouter enruta Gemini, Mistral y Qwen.

```bash
# Cada comando abre un prompt interactivo; pega el valor cuando lo pida.
# NUNCA pegues la key como argumento de línea de comandos (queda en shell history).

firebase functions:secrets:set DEEPSEEK_API_KEY
firebase functions:secrets:set OPENROUTER_API_KEY
```

### 2.2 Secretos opcionales (direct keys — prioridad sobre OpenRouter)

Añadir solo si quieres cumplir EU-residency estricta (clinical_case nunca sale de la UE) o bajar coste:

```bash
firebase functions:secrets:set GEMINI_API_KEY   # Google AI Studio
firebase functions:secrets:set MISTRAL_API_KEY  # Mistral EU
firebase functions:secrets:set QWEN_API_KEY     # DashScope
```

Tras añadir cualquiera, activarla en `functions/src/askAi.ts` descomentando su `defineSecret` y añadiéndola al array `secrets: [...]`, y descomentando la línea correspondiente en `buildProviderChain`. Redeploy.

### 2.3 Verificar que existen (sin ver el valor entero)

```bash
firebase functions:secrets:access DEEPSEEK_API_KEY | head -c 10 ; echo "..."
firebase functions:secrets:access OPENROUTER_API_KEY | head -c 10 ; echo "..."
```

### 2.4 Rotación

```bash
# Al revocar una key en el provider, generar la nueva y:
firebase functions:secrets:set DEEPSEEK_API_KEY
# Redeploy para que la Cloud Function recoja la nueva versión:
firebase deploy --only functions:askAi
```

### 2.5 Inventario de secretos

| Secret name | Estado | Provider | Consola |
|---|---|---|---|
| `DEEPSEEK_API_KEY` | **Obligatorio** | DeepSeek | https://platform.deepseek.com/api_keys |
| `OPENROUTER_API_KEY` | **Obligatorio** | OpenRouter | https://openrouter.ai/keys |
| `GEMINI_API_KEY` | Opcional (EU-strict) | Google AI Studio | https://aistudio.google.com/apikey |
| `MISTRAL_API_KEY` | Opcional (EU-strict) | Mistral EU | https://console.mistral.ai/api-keys/ |
| `QWEN_API_KEY` | Opcional (ahorro) | DashScope | https://dashscope.console.aliyun.com/apiKey |

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

## 9 · Continuidad operativa y respuesta a incidentes

### 9.1 RTO / RPO objetivo

| Métrica | Valor objetivo | Cómo se mide |
|---|---|---|
| RTO (Recovery Time Objective) | **≤ 60 min** para restaurar funcionalidad core | Tiempo entre detección → restauración confirmada |
| RPO (Recovery Point Objective) | **≤ 24 h** de pérdida máxima tolerable | Frecuencia del `dailyBackup` (02:30 Madrid) |
| Uptime objetivo | **99,5 %** (≈ 3,6 h/mes indisponibilidad tolerada) | Sentry + GA4 + monitor externo (ver §9.7) |
| Latencia p95 IA | **< 5 s** texto, **< 8 s** visión | Cloud Function `aggregateDailyMetrics` |

Estos valores son exigibles contractualmente en ofertas futuras (Urgencias HSL, Docencia, AstraZeneca). El runbook debe permitir cumplirlos.

### 9.2 Política de backups

- **Firestore**: `dailyBackup` Cloud Function (cron 03:00 Madrid) → `gs://docenciacartagenaeste-backups/firestore/YYYY-MM-DD/` en región UE.
- **Código**: repositorio duplicado GitHub (`Cartagenaeste` + mirror `area2cartagena`). Commits firmados si aplica.
- **Secretos**: gestor cifrado personal (1Password / Bitwarden) + Secret Manager GCP. Nunca commits, nunca email, nunca Slack.
- **Snapshots manuales** antes de operaciones destructivas (`git filter-repo`, migraciones de schema):
  ```bash
  git clone --mirror https://github.com/carlosgalera-a11y/Cartagenaeste.git \
    /tmp/Cartagenaeste-backup-$(date +%F).git
  git clone --mirror https://github.com/carlosgalera-a11y/area2cartagena.git \
    /tmp/area2cartagena-backup-$(date +%F).git
  ```
- **Retención**:
  - Firestore: 30 días (lifecycle policy del bucket).
  - Código: ilimitado (git).
  - Snapshots manuales: 90 días en `/tmp` local o equivalente.

### 9.3 Procedimiento de restauración (probado)

**Simulacro obligatorio**: ejecutar una vez por trimestre (Q1, Q2, Q3, Q4). Documentar resultado en `docs/simulacros/YYYY-QN.md`.

#### Restauración Firestore completa
```bash
# 1. Identificar el snapshot a restaurar
gsutil ls gs://docenciacartagenaeste-backups/firestore/

# 2. (opcional, recomendado) Crear proyecto de staging y restaurar ahí primero
# 3. Importar (destruye docs existentes de las colecciones afectadas)
gcloud firestore import gs://docenciacartagenaeste-backups/firestore/2026-MM-DD/

# 4. Verificar colecciones clave
gcloud firestore operations list --limit=5
```

#### Restauración parcial (una colección)
```bash
gcloud firestore import gs://docenciacartagenaeste-backups/firestore/2026-MM-DD/ \
  --collection-ids=centros,users
```

#### Restauración de código
```bash
# Si el repo remoto está comprometido, clonar del mirror
git clone --mirror /tmp/Cartagenaeste-backup-2026-MM-DD.git Cartagenaeste-restore
cd Cartagenaeste-restore
git push --mirror https://github.com/carlosgalera-a11y/Cartagenaeste-new.git
```

#### Rotación completa de secretos (incidente de exposición)
Ver §2.4 arriba + `docs/s1.2-rotacion-claves-carlos.md` (procedimiento completo con re-locking de branch protection).

### 9.4 Respuesta a incidentes · playbook general

Ante cualquier incidente (caída IA, 5xx masivos, error de seguridad, pérdida de datos):

1. **Detectar** (≤ 5 min): alertas Sentry, llamadas de usuarios, health check.
2. **Aislar** (≤ 15 min): deshabilitar el componente afectado. Ver §9.5.
3. **Evaluar impacto** (≤ 30 min): usuarios afectados, datos afectados, duración.
4. **Comunicar** (según severidad, ver matriz abajo).
5. **Restaurar** (≤ 60 min idealmente): aplicar fix o rollback.
6. **Post-mortem** (≤ 24 h): documentar en `docs/post-mortems/YYYY-MM-DD-titulo.md`.

#### Matriz de comunicación
| Severidad | Criterio | Comunicar a | Plazo |
|---|---|---|---|
| **SEV-1** | Datos personales expuestos | AEPD (art. 33 RGPD) + usuarios + clientes contractuales | ≤ 72 h a AEPD |
| **SEV-2** | IA caída > 30 min en horario asistencial | Clientes contractuales (HSL, etc.) | ≤ 2 h |
| **SEV-3** | Degradación parcial < 30 min | Nota en status page | ≤ 24 h |
| **SEV-4** | Bug cosmético / no crítico | Changelog interno | Siguiente release |

### 9.5 Aislamiento rápido por componente

#### Desactivar `askAi` (si la IA está causando problemas)
```bash
# Opción A: bloqueo total por cuota drenada
firebase functions:config:set askai.disabled=true
firebase deploy --only functions:askAi

# Opción B: mensaje informativo a usuarios sin tocar deploy
# Editar una bandera en Firestore config/ops y leerla desde el frontend
```

#### Desactivar módulo concreto del frontend
Publicar un commit que muestre un banner de mantenimiento en la sección afectada y mergear/pushear a `main` + area2 (deploy en <2 min).

#### Bloquear un usuario abusivo
```bash
# Admin Firestore console → users/{uid} → role = 'blocked'
# Las rules ya niegan acceso con role != 'admin' || 'user'
```

### 9.6 Plantilla de post-mortem

Crear `docs/post-mortems/YYYY-MM-DD-titulo.md` con:

```markdown
# Post-mortem · [Título corto] · YYYY-MM-DD

## Resumen ejecutivo (3-5 líneas)
## Impacto
- Usuarios afectados: [número aproximado]
- Duración: [hora inicio → hora restauración]
- Severidad: SEV-[1-4]
- Datos personales implicados: [sí/no, detalle]

## Cronología
- HH:MM — [evento]
- HH:MM — [acción tomada]

## Causa raíz (5 Whys)

## Acciones correctoras
- [ ] Acción 1 · responsable · plazo
- [ ] Acción 2 · responsable · plazo

## Qué salió bien / mal
## Aprendizajes
```

### 9.7 Monitoring externo (recomendado, pendiente de activar)

- **Uptime**: [Uptime Robot](https://uptimerobot.com) free tier → 1 check HTTP/5min a `https://area2cartagena.es/status.html`. Alerta por email si baja.
- **IA health**: Cloud Scheduler + Cloud Function `healthCheckAi` (ping diario con prompt trivial a cada proveedor). Alerta si un proveedor falla.
- **Facturas Firebase**: alerta presupuestaria en GCP Billing → aviso al superar 20 €/mes (umbral bajo para detectar abuso temprano).

### 9.8 Acceso de emergencia (bus factor)

El bus factor actual del proyecto es **1** (Carlos). Hasta formalizar backup dev con NDA:

- Credenciales maestras guardadas en gestor personal cifrado (1Password/Bitwarden).
- Persona de emergencia física con acceso al gestor: [pendiente definir con familiar/persona de confianza].
- Instrucciones escritas selladas para esa persona sobre cómo contactar al dev de backup cuando éste exista.

**Prioridad S1**: una vez firmado NDA con dev de backup, añadirlo aquí como Operator-2 con:
- Acceso colaborador al repo GitHub (nivel Write).
- Rol `editor` en proyecto Firebase `docenciacartagenaeste`.
- Lectura de secretos específicos (no todos) vía Secret Manager IAM.
- Teléfono de contacto 24/7 durante los horarios pactados.

Ver `docs/plan-continuidad-mudanza.md` para el procedimiento concreto de traspaso durante la mudanza a Barcelona (29 jul – 11 ago 2026).

---

---

## 10 · TTL policies en Firestore (retención automática)

EU AI Act art. 12 exige retención de logs ≥ 6 meses. RGPD principio de minimización empuja hacia ≤ 24 meses. El balance acordado:

| Colección | TTL | Campo | Justificación |
|---|---|---|---|
| `users/{uid}/aiRequests` | **180 días (6 meses)** | `expiresAt` | AI Act art. 12 mínimo |
| `scan_uploads` | **365 días (12 meses)** | `expiresAt` | Decisión clínica art. 14, evidencia ampliada |
| `aiCache` | 7 días | `expiresAt` | Cache funcional |
| `healthchecks` | 90 días | `expiresAt` (si se añade) | Opcional |

El campo `expiresAt` se calcula y escribe desde las Cloud Functions. La política TTL la activa Firestore automáticamente **después de habilitarla con gcloud**.

### 10.1 Activar TTL (una vez por colección)

```bash
# Requiere gcloud auth login con cuenta admin del proyecto.
gcloud config set project docenciacartagenaeste

# users/{uid}/aiRequests (collection-group porque está bajo users)
gcloud firestore fields ttls update expiresAt \
  --collection-group=aiRequests --enable-ttl

# scan_uploads
gcloud firestore fields ttls update expiresAt \
  --collection-group=scan_uploads --enable-ttl

# aiCache (si no estaba activo)
gcloud firestore fields ttls update expiresAt \
  --collection-group=aiCache --enable-ttl

# Verificar
gcloud firestore fields ttls list
```

### 10.2 Desactivar TTL temporal (operaciones especiales)

Ante una migración o auditoría regulatoria, se puede desactivar la TTL durante un periodo corto:

```bash
gcloud firestore fields ttls update expiresAt \
  --collection-group=aiRequests --disable-ttl
```

**IMPORTANTE**: reactivar en <48 h. Documentar motivo en `docs/post-mortems/` si ocurre.

### 10.3 Verificar retención efectiva

```bash
# Cuenta docs con createdAt > 180 días (deberían estar eliminados ya si TTL activa).
gcloud firestore query --collection-group=aiRequests \
  --where "createdAt<$(date -u -v-180d +%Y-%m-%dT%H:%M:%SZ)" \
  --limit 5
```

### 10.4 Backup previo a cambios de retención

Antes de habilitar/cambiar TTL por primera vez, ejecutar un backup manual (§9.2) y guardar la referencia del snapshot en caso de borrado prematuro no planeado.

---

_Mantener este runbook al día cada vez que se toque functions o Firestore. Referenciar desde CLAUDE.md._
