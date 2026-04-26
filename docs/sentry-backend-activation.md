# Sentry backend (Cloud Functions) · pasos restantes

Estado tras este PR (claude/sentry-integration):

- ✅ Frontend ya está activo: `sentry-init.js` con scrubbing PII robusto, `window.SENTRY_DSN` definido en [index.html:35](../index.html#L35), proyecto Sentry `o4511258495090688` ya recibiendo eventos.
- ✅ `@sentry/google-cloud-serverless@8.40.0` añadido a [functions/package.json](../functions/package.json).
- ✅ `functions/src/sentry.ts` con `initSentry()`, `captureException()`, `setUser()` defensivos (no-op sin DSN).
- ✅ `functions/src/askAi.ts` integrado: `initSentry()` + `setUser(uid)` + `captureException(e, {type, model, uid})` en el catch del provider chain.
- ✅ Tests pasan (63/63), TypeScript OK.

❌ **Falta**: configurar el secret `SENTRY_DSN` en Secret Manager y redeploy.

## Pasos manuales (Carlos · 5 min)

### 1. Crear proyecto backend en Sentry (2 min)

Si quieres separar errores frontend de backend (recomendado para alertas distintas):

1. https://carlosgalera.sentry.io/projects/new/
2. Platform: **Node.js** → **Google Cloud Functions**.
3. Project name: `cartagenaeste-functions`.
4. Team: el por defecto.
5. Copiar el DSN (formato `https://abc@o4511258495090688.ingest.de.sentry.io/...`).

Si prefieres todo en el mismo proyecto que el frontend, reutiliza el DSN de [index.html:35](../index.html#L35).

### 2. Establecer el secret (2 min)

```bash
cd /Users/carlos/cartagenaestewebappSOLIDA
firebase functions:secrets:set SENTRY_DSN --project docenciacartagenaeste
# Pega el DSN cuando pida input. Enter para confirmar.
```

### 3. Redeploy askAi (3 min)

```bash
firebase deploy --only functions:askAi --project docenciacartagenaeste
```

### 4. Disparar un evento de prueba (1 min)

Provocar un error controlado: hacer una llamada a `askAi` con un `type` inválido vía DevTools console:

```js
firebase.functions('europe-west1').httpsCallable('askAi')({type:'__forceErr', prompt:'x'}).catch(e=>console.log(e));
```

Esto devuelve `invalid-argument` (esperado). Si quieres provocar un 5xx, mata la cuota:

```js
for (let i=0; i<60; i++) firebase.functions('europe-west1').httpsCallable('askAi')({type:'educational', prompt:'ping '+i}).catch(()=>{});
```

Verificar en Sentry: **Issues** → debe aparecer `HttpsError: Servicio IA temporalmente no disponible` con tags `type=educational`, `model=...`, contexto del UID anonimizado.

## Ya hecho (no requiere acción)

- Frontend captura errores JS no atrapados, fetch fails, console errors, console warns.
- Scrubbing PII frontend redacta DNI, NIE, NHC, API keys, bearer tokens.
- `beforeSend` filtra request bodies, cookies, auth headers.
- User: solo ID anonimizado (hash del UID), nunca email.

## Coste estimado

Free tier Sentry: 5.000 events/mes. Con frontend + backend integrados:
- Producción Cartagenaeste actual (~58 users) genera ~50–200 events/mes.
- Margen amplio. No se prevé pasar a tier de pago.
