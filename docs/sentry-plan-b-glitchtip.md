# Plan B · Migración a GlitchTip self-hosted (cuando Sentry SaaS no baste)

**Estado actual**: Cartagenaeste usa **Sentry SaaS Free** (5.000 eventos/mes, 0€, cero mantenimiento, servidor en Frankfurt/UE). Decisión tomada el 2026-04-21 por ratio coste-beneficio óptimo para ≤1.000 usuarios.

Este documento es el **runbook de escape** si alguna vez se cumple una de estas 3 condiciones:

1. Sentry superó los 5.000 eventos/mes 2 meses seguidos y no quieres pagar 24€/mes de Team plan.
2. Un cliente B2B sanitario (hospital público, farma) exige "datos nunca salen de nuestras premisas, servidor propio en España".
3. Ganas de autogestión y control total.

Con el NAS UGreen 2800 (N100, 8GB RAM, Docker nativo UGOS Pro) es viable en ~90 min.

---

## Arquitectura objetivo

```
Usuario → area2cartagena.es → JS Sentry SDK → sentry.area2cartagena.es
                                                    ↓ (Cloudflare Tunnel gratis)
                                            NAS UGreen 2800 en casa
                                                    ↓ Docker Compose
                                            GlitchTip (web + worker)
                                            PostgreSQL 16
                                            Redis 7
```

- **GlitchTip**: clon open-source 100% compatible con el SDK oficial de Sentry. No cambia código, solo DSN.
- **Cloudflare Tunnel**: el NAS **no abre puertos al router**. La conexión es saliente.
- **Retención**: configurable (default 90 días; con los 500 GB NVMe del NAS, puedes guardar años).
- **Coste**: 0€/mes. Solo electricidad del NAS (ya encendido 24/7 para otros usos).

---

## Preparación del UGreen 2800 (una sola vez)

### 0.1 · Habilitar Docker en UGOS Pro

1. Entra en UGOS Pro (interfaz web del NAS: `http://<ip-nas>:9999` o similar).
2. **App Center** → busca "Docker" → Instalar. Puede aparecer como "Container" en UGOS Pro.
3. Abre Docker, verifica que dice "Running".

### 0.2 · Crear carpeta de datos

En **File Manager** del UGOS, crea:
```
/volume1/docker/glitchtip/
/volume1/docker/glitchtip/postgres/
/volume1/docker/glitchtip/uploads/
/volume1/docker/cloudflared/
```

(La ruta `/volume1/` puede variar según tu configuración. Es la raíz del pool de almacenamiento principal.)

### 0.3 · Generar un SECRET_KEY aleatorio

Abre **Terminal SSH** del UGOS (Control Panel → Terminal → SSH → habilitar; luego `ssh admin@<ip-nas>` desde tu Mac):

```bash
openssl rand -base64 50
```

Copia el string de 66 caracteres. Se usa en el siguiente paso.

---

## 1 · Instalar GlitchTip (30 min)

### 1.1 · Crear `docker-compose.yml`

En la ruta `/volume1/docker/glitchtip/`:

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_HOST_AUTH_METHOD: trust
      POSTGRES_DB: glitchtip
    volumes:
      - ./postgres:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    restart: unless-stopped

  web:
    image: glitchtip/glitchtip:latest
    restart: unless-stopped
    depends_on: [postgres, redis]
    ports:
      - "127.0.0.1:8000:8000"   # Solo LAN; exponemos vía Cloudflare Tunnel
    environment: &env
      DATABASE_URL: postgres://postgres@postgres:5432/glitchtip
      SECRET_KEY: "PEGA_AQUI_EL_SECRET_DEL_PASO_0.3"
      PORT: "8000"
      EMAIL_URL: "consolemail://"   # Sin email al principio; luego SMTP Gmail.
      GLITCHTIP_DOMAIN: "https://sentry.area2cartagena.es"
      DEFAULT_FROM_EMAIL: "sentry@area2cartagena.es"
      # Cuotas anti-abuso
      EVENT_RETENTION_DAYS: "90"
      ENABLE_ORGANIZATION_CREATION: "false"   # Solo tú creas orgs
    volumes:
      - ./uploads:/code/uploads

  worker:
    image: glitchtip/glitchtip:latest
    restart: unless-stopped
    depends_on: [postgres, redis]
    command: ./bin/run-celery-with-beat.sh
    environment: *env
    volumes:
      - ./uploads:/code/uploads
```

### 1.2 · Levantar los contenedores

En SSH dentro del NAS:

```bash
cd /volume1/docker/glitchtip
docker compose pull
docker compose up -d
docker compose logs -f web
# Cuando veas "Listening at: http://0.0.0.0:8000", Ctrl+C para salir del log.
```

### 1.3 · Crear tu usuario admin

```bash
docker compose exec web ./manage.py createsuperuser
# Email: carlosgalera2roman@gmail.com
# Contraseña: la que quieras (guárdala en tu gestor).
```

### 1.4 · Test local

En tu Mac abre **http://<ip-nas>:8000** → debes ver la UI de GlitchTip. Login con el usuario recién creado.

Crea un proyecto de prueba:
- Organization: `cartagenaeste`
- Project: `cartagenaeste-frontend`
- Platform: `Browser JavaScript`

Apunta el DSN que te muestra (formato `https://<hash>@sentry.area2cartagena.es/<id>`). NO coincide con el dominio final aún porque el tunnel no está montado — lo corrige el paso siguiente.

---

## 2 · Cloudflare Tunnel (45 min, gratis, sin abrir puertos)

### 2.1 · Requisitos previos

- Cuenta Cloudflare gratis en https://cloudflare.com (si no la tienes).
- Dominio gestionado por Cloudflare. Puedes usar `area2cartagena.es` si ya está ahí, o crear un subdominio.
  - Si `area2cartagena.es` está en otro DNS: muévelo a Cloudflare (5 min, cambiar nameservers en el registrador). Nada de la webapp se rompe.

### 2.2 · Crear el tunnel desde el panel Cloudflare

1. Abre https://one.dash.cloudflare.com/
2. **Access → Tunnels → Create a tunnel**.
3. **Name**: `cartagenaeste-nas`.
4. **Connector**: Docker. Copia el comando que te muestra (algo como):
   ```bash
   docker run cloudflare/cloudflared:latest tunnel --no-autoupdate run --token eyJhIjoi...
   ```
5. En el NAS (SSH), ejecuta ese comando (o mejor, en compose):

   Crea `/volume1/docker/cloudflared/docker-compose.yml`:
   ```yaml
   services:
     cloudflared:
       image: cloudflare/cloudflared:latest
       restart: unless-stopped
       command: tunnel --no-autoupdate run --token eyJhIjoi_PEGA_AQUI_TU_TOKEN
       network_mode: host
   ```
   Y `docker compose up -d`.

6. En el panel Cloudflare, el tunnel debe mostrar estado **HEALTHY** en ~30 segundos.

### 2.3 · Añadir el hostname público

En el mismo panel, después de crear el tunnel:

1. **Public Hostnames → Add a public hostname**.
2. **Subdomain**: `sentry`
3. **Domain**: `area2cartagena.es`
4. **Service Type**: `HTTP`
5. **URL**: `localhost:8000`
6. **Save hostname**.

### 2.4 · Ajustar `GLITCHTIP_DOMAIN` y regenerar DSN

En `/volume1/docker/glitchtip/docker-compose.yml` verifica que `GLITCHTIP_DOMAIN` sea exactamente `https://sentry.area2cartagena.es`. Ejecuta `docker compose up -d` para reiniciar.

Ve a https://sentry.area2cartagena.es (debería abrir GlitchTip) → login → project → copia el DSN nuevo. Formato:
```
https://<hash>@sentry.area2cartagena.es/<id>
```

### 2.5 · Test de conectividad

Desde otro dispositivo fuera de tu LAN (móvil con datos, por ejemplo):
- Abre https://sentry.area2cartagena.es → debe cargar.
- Verifica certificado SSL válido (candado verde) — Cloudflare lo gestiona automáticamente.

---

## 3 · Apuntar Cartagenaeste al nuevo DSN (5 min)

En el repo:

```bash
cd /Users/carlos/cartagenaestewebappSOLIDA
git checkout -b chore/migrate-to-glitchtip
```

**Reemplaza en los 10 HTMLs** el DSN viejo de Sentry SaaS por el nuevo de GlitchTip. Un `sed` lo hace:

```bash
OLD="https://ABC@o123.ingest.de.sentry.io/456"   # DSN viejo de Sentry SaaS
NEW="https://XYZ@sentry.area2cartagena.es/789"    # DSN nuevo de GlitchTip

for f in index.html app.html notebook-local.html chatbot-medicacion.html triaje-ai.html pacientes.html analiticas.html transcripcion.html corrector-clinico.html plantillas-informes.html; do
  sed -i '' "s|$OLD|$NEW|g" "$f"
done

git add -A
git commit -m "chore(sentry): migrar SaaS → GlitchTip self-hosted en NAS"
git push -u origin chore/migrate-to-glitchtip
gh pr create --title "chore(sentry): migrar a GlitchTip self-host" --body "DSN apunta ahora a sentry.area2cartagena.es en lugar de sentry.io. Mismo SDK, mismo scrubbing, mismo resto de config."
gh pr merge --merge --delete-branch
git push area2 main:main
```

Test:
1. Ventana incógnito en https://area2cartagena.es/
2. DevTools → Network → filtra por "sentry"
3. Provoca un error: `throw new Error('test glitchtip')` en Console
4. Debe aparecer una request a `sentry.area2cartagena.es` (no a `sentry.io`) con status 200.
5. Abre https://sentry.area2cartagena.es/ → Issues → deberías ver el error en <30s.

---

## 4 · Mantenimiento mínimo (una vez al mes)

```bash
# En SSH del NAS
cd /volume1/docker/glitchtip
docker compose pull           # Bajar última imagen (cada 1-3 meses)
docker compose up -d          # Reiniciar con la nueva

# Backup DB (semanal o mensual)
docker compose exec postgres pg_dump -U postgres glitchtip > backup-$(date +%F).sql

# Limpiar eventos viejos >90 días (GlitchTip lo hace solo si EVENT_RETENTION_DAYS funciona)
docker compose exec web ./manage.py shell -c "from events.models import Event; Event.objects.filter(created__lt='2025-01-01').delete()"
```

Guarda los backups en una carpeta del NAS que sea parte del RAID o con snapshots (UGOS Pro soporta Btrfs snapshots).

---

## 5 · SMTP Gmail para alertas email (opcional, 10 min)

Si quieres que GlitchTip mande alertas por email (nuevo issue, alert rule disparada):

1. Genera App Password en https://myaccount.google.com/apppasswords (Gmail → Add app password para "GlitchTip NAS").
2. En `docker-compose.yml`:
   ```yaml
   environment:
     EMAIL_URL: "smtp+tls://carlosgalera2roman%40gmail.com:APPPASSWORD@smtp.gmail.com:587"
     DEFAULT_FROM_EMAIL: "carlosgalera2roman@gmail.com"
   ```
3. `docker compose up -d`.
4. En GlitchTip UI → User Settings → test email.

---

## Comparación final honesta

| Métrica | Sentry SaaS Free (hoy) | GlitchTip self-host (este plan) |
|---|---|---|
| Coste mensual | 0€ hasta 5k eventos | 0€ ilimitado (solo electricidad) |
| Setup inicial | 5 min | 90 min primera vez |
| Mantenimiento mensual | 0 min | 5-15 min (pull, backup) |
| Si el NAS se apaga | N/A — SaaS sigue vivo | **Pierdes visibility hasta que vuelva** |
| Datos en España | Frankfurt (UE, OK RGPD) | **Casa de Carlos (España, RGPD ideal)** |
| Feature parity | 100% | ~90% (no session replays) |
| Argumento para pitch farma | "Usamos Sentry, líder del mercado" | "Self-host, datos NUNCA salen de España" ⭐ |

**Cuándo migrar**: solo si un cliente lo exige explícitamente o superas repetidamente 5k eventos/mes. Mientras eso no pase, **Sentry SaaS es la elección correcta**.

---

## Rollback a Sentry SaaS

Es trivial: si GlitchTip falla, edita los HTMLs y vuelve al DSN anterior. Un `sed` al revés:
```bash
sed -i '' "s|sentry.area2cartagena.es|o123.ingest.de.sentry.io|g" *.html
```

Cero riesgo de lock-in. El SDK y el código de app NO cambian.
