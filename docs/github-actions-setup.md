# GitHub Actions · Activar deploy automatizado

Estado actual:
- ✅ [.github/workflows/ci.yml](../.github/workflows/ci.yml) — typecheck + tests + secret scan + html-validate. Funciona desde PR #21.
- ✅ [.github/workflows/regex-pii-check.yml](../.github/workflows/regex-pii-check.yml) — DNI/NIE/NHC/nombres en código. Funciona.
- ✅ [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) — workflow definido pero **no ejecuta** porque faltan dos secretos.
- ❌ Secrets `FIREBASE_SERVICE_ACCOUNT` + `AREA2_PAT` — **no configurados** (`gh secret list` devuelve vacío).

Esto significa que cada deploy de Cloud Functions hoy es manual:

```bash
firebase deploy --only functions:askAi --project docenciacartagenaeste
```

Activando los secretos, los pushes a tags `v*` (o disparos manuales del workflow) ejecutan el deploy automáticamente.

## Pasos manuales (Carlos · 15 min)

### 1. Crear Service Account en GCP IAM (5 min)

1. https://console.cloud.google.com/iam-admin/serviceaccounts/create?project=docenciacartagenaeste
2. Nombre: `github-actions-deploy`. Description: `CI/CD desde Cartagenaeste repo`.
3. **CREATE AND CONTINUE**.
4. Asignar roles (uno por uno):
   - `Cloud Functions Developer` (`roles/cloudfunctions.developer`)
   - `Service Account User` (`roles/iam.serviceAccountUser`)
   - `Secret Manager Secret Accessor` (`roles/secretmanager.secretAccessor`)
   - `Firebase Hosting Admin` (`roles/firebasehosting.admin`) — aunque no usas Firebase Hosting hoy, el action `FirebaseExtended/action-hosting-deploy` lo verifica.
   - `Cloud Run Admin` (`roles/run.admin`) — porque askAi es Gen2 (Cloud Run debajo).
   - `Artifact Registry Writer` (`roles/artifactregistry.writer`) — para que Cloud Build pueda subir la imagen.
5. **DONE**.
6. Click sobre el SA recién creado → tab **KEYS** → **ADD KEY** → **Create new key** → **JSON** → guardar el archivo.

⚠️ Borrar el JSON descargado tras el siguiente paso.

### 2. Pegar como secret en GitHub (2 min)

```bash
cd ~/Downloads  # donde se descargó el .json
gh secret set FIREBASE_SERVICE_ACCOUNT \
  --repo carlosgalera-a11y/Cartagenaeste \
  --body "$(cat github-actions-deploy@docenciacartagenaeste.iam.gserviceaccount.com.json)"
rm github-actions-deploy@docenciacartagenaeste.iam.gserviceaccount.com.json
```

O vía GUI: https://github.com/carlosgalera-a11y/Cartagenaeste/settings/secrets/actions/new
- Name: `FIREBASE_SERVICE_ACCOUNT`
- Secret: pegar todo el contenido del JSON.

### 3. Crear PAT fine-grained para sync a area2 (5 min)

1. https://github.com/settings/personal-access-tokens/new
2. Token name: `cartagenaeste-area2-sync`
3. Resource owner: `carlosgalera-a11y`
4. Repository access: **Only select repositories** → `area2cartagena`
5. Permissions:
   - Repository → **Contents**: Read and write
   - Repository → **Metadata**: Read-only
6. Expiration: 1 año (renovar manualmente).
7. **GENERATE TOKEN** → copiar el `github_pat_...`.

### 4. Pegar el PAT (1 min)

```bash
gh secret set AREA2_PAT --repo carlosgalera-a11y/Cartagenaeste
# Pegar el token cuando pida input.
```

### 5. Verificar (2 min)

```bash
gh secret list --repo carlosgalera-a11y/Cartagenaeste
# Debe mostrar:
#   AREA2_PAT
#   FIREBASE_SERVICE_ACCOUNT
```

### 6. Probar (5 min · opcional)

Disparar el workflow manualmente sin tagear:

```bash
gh workflow run deploy.yml --repo carlosgalera-a11y/Cartagenaeste --ref main
gh run list --workflow=deploy.yml --repo carlosgalera-a11y/Cartagenaeste --limit 1
gh run watch --repo carlosgalera-a11y/Cartagenaeste $(gh run list --workflow=deploy.yml --repo carlosgalera-a11y/Cartagenaeste --json databaseId --jq '.[0].databaseId')
```

Si pasa todo: el deploy debería resultar en una invocación visible en Cloud Functions logs y un push de `pre-sync-backup-YYYY-MM-DD-shorthash` + force-push de main a `area2cartagena`.

### 7. Tag de release a partir de aquí (cuando quieras)

```bash
git tag -a v1.0.1 -m "Sentry backend + App Check prep + monitoring"
git push origin v1.0.1
# El workflow se dispara automáticamente.
```

## Mejoras opcionales del workflow

El [deploy.yml](../.github/workflows/deploy.yml) actual usa `FirebaseExtended/action-hosting-deploy@v0` para `target: functions`. Funciona pero el nombre es engañoso (la action nació para hosting). Alternativa más limpia:

```yaml
- uses: google-github-actions/auth@v2
  with:
    credentials_json: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
- uses: google-github-actions/setup-gcloud@v2
- run: npm install -g firebase-tools
- run: firebase deploy --only functions:askAi --project docenciacartagenaeste --non-interactive
```

No bloqueante. Cambiarlo en otro PR si se quiere.
