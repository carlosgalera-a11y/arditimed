# Runbook: purgar `REDACTED_INTERNAL_IP` del histórico git

**Estado**: pendiente de luz verde de Carlos. Operación destructiva
(reescribe historia en `Cartagenaeste/main` y `area2cartagena/main`).

## Por qué

5 commits históricos contienen la IP interna `REDACTED_INTERNAL_IP` del NAS local
en código (`*.html`, `*.js`):

| commit  | descripción                             |
|---------|-----------------------------------------|
| f349166 | security(s1.2): limpiar claves, IP interna y archivos comprometidos |
| 57a9134 | (mismo, otra rama)                      |
| 803b8e4 | revert: restaurar app-main.js, index.html y sw.js al estado de ce8eb96 |
| f04a144 | revert: restaurar app-main.js, index.html y sw.js al estado de 54526d8 |
| 1cc7b1e | feat(backend): frontend conectado a Cloud Functions Firebase, keys fuera del cliente |

HEAD ya está limpio (live HTML no expone la IP). El riesgo es bajo
(RFC1918, no enrutable desde Internet) pero **due diligence técnica** de
inversores hará grep de IPs privadas en todo el histórico.

## Riesgo / blast radius

- Reescribe **todos los hashes de commit** posteriores a los más antiguos
  afectados. Toda referencia (PRs, tags, ramas locales, clones de Carlos
  o de cualquier colaborador) queda obsoleta.
- Force-push a `main` en **dos repos** (`Cartagenaeste` + `area2cartagena`).
- Branch protection en ambos repos bloquea force-push: hay que relajarla
  temporalmente vía `gh api -X PUT` y re-lockar inmediatamente después.
- Si algo sale mal entre la relajación y el re-locking, queda una ventana
  donde cualquier admin podría force-pushear sin advertencia.

**Por eso este runbook NO se ejecuta en automático.** Carlos confirma "sí"
antes de cada bloque marcado con 🔴.

---

## Procedimiento

### 0. Preparación local (no destructiva)

```bash
cd /Users/carlos/cartagenaestewebappSOLIDA
TODAY=$(date +%F)

# 1. Verificar que filter-repo está instalado.
which git-filter-repo || pip install git-filter-repo
```

### 1. Backups inmutables (no destructiva)

```bash
git clone --mirror https://github.com/carlosgalera-a11y/Cartagenaeste.git \
  /tmp/Cartagenaeste-backup-$TODAY.git
git clone --mirror https://github.com/carlosgalera-a11y/area2cartagena.git \
  /tmp/area2cartagena-backup-$TODAY.git
```

Verifica que los dos backups existen y tienen tamaño razonable antes de
seguir:

```bash
du -sh /tmp/Cartagenaeste-backup-$TODAY.git /tmp/area2cartagena-backup-$TODAY.git
```

### 2. Snapshot de la branch protection actual (no destructiva)

```bash
gh api repos/carlosgalera-a11y/Cartagenaeste/branches/main/protection \
  > /tmp/Cartagenaeste-prot-$TODAY.json
gh api repos/carlosgalera-a11y/area2cartagena/branches/main/protection \
  > /tmp/area2cartagena-prot-$TODAY.json
```

Confirma que ambos archivos contienen JSON válido:

```bash
jq '.allow_force_pushes' /tmp/Cartagenaeste-prot-$TODAY.json
jq '.allow_force_pushes' /tmp/area2cartagena-prot-$TODAY.json
# Esperado: { "enabled": false } en ambos.
```

### 3. 🔴 Filter-repo en clone de trabajo (destructiva en local)

```bash
mkdir -p /tmp/cae-rewrite && cd /tmp/cae-rewrite
git clone https://github.com/carlosgalera-a11y/Cartagenaeste.git
cd Cartagenaeste

# Crea el archivo de reemplazos. Cada línea = "buscar==>reemplazar".
cat > /tmp/replacements.txt <<'EOF'
REDACTED_INTERNAL_IP==>REDACTED_INTERNAL_IP
REDACTED_INTERNAL_IP:3100==>REDACTED_INTERNAL_IP:3100
EOF

# Ejecuta filter-repo.
git filter-repo --replace-text /tmp/replacements.txt --force

# Verificación: ningún match en histórico de código (ignora docs).
git log --all -p --pickaxe-regex -S "192\.168\.1\.35" -- '*.html' '*.js' | head
# Salida esperada: VACÍA.
```

### 4. 🔴 Relajar protección en `Cartagenaeste/main`

```bash
gh api -X PUT repos/carlosgalera-a11y/Cartagenaeste/branches/main/protection \
  --input - <<'EOF'
{
  "required_status_checks": null,
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": true,
  "allow_deletions": false
}
EOF
```

### 5. 🔴 Force-push a `Cartagenaeste/main`

```bash
cd /tmp/cae-rewrite/Cartagenaeste
git remote set-url origin https://github.com/carlosgalera-a11y/Cartagenaeste.git
git push --force --all origin
git push --force --tags origin
```

### 6. 🟢 Re-lockar protección de `Cartagenaeste/main` (CRÍTICO, hacer inmediatamente)

```bash
gh api -X PUT repos/carlosgalera-a11y/Cartagenaeste/branches/main/protection \
  --input /tmp/Cartagenaeste-prot-$TODAY.json
```

Verifica:

```bash
gh api repos/carlosgalera-a11y/Cartagenaeste/branches/main/protection \
  --jq '.allow_force_pushes.enabled'
# Esperado: false.
```

### 7. 🔴 Repetir 4-6 con `area2cartagena/main`

```bash
gh api -X PUT repos/carlosgalera-a11y/area2cartagena/branches/main/protection \
  --input - <<'EOF'
{
  "required_status_checks": null,
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": true,
  "allow_deletions": false
}
EOF

# Sync el filter-repo al mirror.
cd /tmp/cae-rewrite/Cartagenaeste
git remote add area2 https://github.com/carlosgalera-a11y/area2cartagena.git
git push --force --all area2
git push --force --tags area2

# Re-lockar.
gh api -X PUT repos/carlosgalera-a11y/area2cartagena/branches/main/protection \
  --input /tmp/area2cartagena-prot-$TODAY.json
```

### 8. Verificación final (no destructiva)

```bash
# El sitio sigue sirviendo HEAD correcto:
curl -sI "https://area2cartagena.es/" | grep -i last-modified

# El histórico ya no contiene la IP:
gh api -X GET search/code -f q='REDACTED_INTERNAL_IP repo:carlosgalera-a11y/Cartagenaeste' \
  --jq '.total_count'
# Esperado: 0 (puede tardar minutos en re-indexar).

# Workdir local actualizado:
cd /Users/carlos/cartagenaestewebappSOLIDA
git fetch --all
git reset --hard origin/main
```

### 9. Comunicar a colaboradores

Cualquier clon local/PR existente hay que recrear. Mensaje plantilla:

> "Acabo de reescribir el histórico de `Cartagenaeste/main` para purgar
> una IP interna. Si tienes un clon local, bórralo y re-clona. Cualquier
> rama tuya en curso → rebase contra el nuevo `main`."

---

## Si algo sale mal entre el paso 5 y el 6

Las protecciones están relajadas. Restáuralas YA:

```bash
gh api -X PUT repos/carlosgalera-a11y/Cartagenaeste/branches/main/protection \
  --input /tmp/Cartagenaeste-prot-$TODAY.json
gh api -X PUT repos/carlosgalera-a11y/area2cartagena/branches/main/protection \
  --input /tmp/area2cartagena-prot-$TODAY.json
```

## Si se quiere abortar todo y restaurar al estado pre-filter-repo

Los mirrors `/tmp/*-backup-$TODAY.git` son fuente de verdad:

```bash
cd /tmp/Cartagenaeste-backup-$TODAY.git
git push --force --mirror https://github.com/carlosgalera-a11y/Cartagenaeste.git
cd /tmp/area2cartagena-backup-$TODAY.git
git push --force --mirror https://github.com/carlosgalera-a11y/area2cartagena.git
```

(Requiere relajar protección antes, igual que en el paso 4.)

---

**Confirmar con Carlos antes de ejecutar pasos 3, 4, 5, 7.**
