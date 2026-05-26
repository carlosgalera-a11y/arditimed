# Runbook · Deploy de entrenamir en Cloudflare Pages + Access

**Estado:** ✅ **DESPLEGADO Y PROTEGIDO** (2026-05-25).

**URL pública (siempre detrás de auth):** https://entrenamir.pages.dev
**Team Cloudflare Access:** `filehub` (login: `filehub.cloudflareaccess.com`)
**Cuenta Cloudflare:** `carlosgalera2roman@gmail.com` (account ID `c090be89a466795f36c01457a68e94b1`)
**Project ID Cloudflare Pages:** `entrenamir` (production branch `main`)
**Identity provider:** One-time PIN (email)
**Session duration:** 24h
**Coste:** 0 € (Cloudflare Pages Free + Cloudflare Access Zero Trust Free hasta 50 users autorizados).

**Objetivo:** publicar el repo privado `carlosgalera-a11y/entrenamir` en Cloudflare Pages **detrás de Cloudflare Access** (auth por email), para entregar demos navegables a EGS y otros bajo NDA. GH Pro NO sirve para esto: la API devuelve `422 Current plan does not support private GitHub Pages` — Pages privado real solo lo da Enterprise Cloud ($21/mes mínimo).

**Tiempo estimado de redeploy:** ~30 segundos vía `wrangler pages deploy` desde local.

---

## Prerrequisitos

- Cuenta Cloudflare (si no la tienes, crea una en `dash.cloudflare.com` — gratis).
- Cuenta GitHub con el repo privado `carlosgalera-a11y/entrenamir` (ya creado).
- Email/dominio que vas a autorizar para acceder (por ejemplo, `carlosgaleraroman@gmail.com` y los emails de EGS cuando los necesites).

---

## Paso 1 — Conectar Cloudflare Pages al repo privado

1. Entrar en `dash.cloudflare.com` → **Workers & Pages** → pestaña **Pages** → **Create application** → **Connect to Git**.
2. **Connect GitHub** → autorizar la cuenta `carlosgalera-a11y`. Cuando GitHub pregunte el scope, **elegir "Only select repositories"** y marcar solo `entrenamir`. **No darle acceso a Cartagenaeste ni a los mirrors.**
3. Seleccionar el repo `entrenamir` → **Begin setup**.
4. Configuración del proyecto:
   - **Project name:** `entrenamir` (esto define la URL: `entrenamir.pages.dev`).
   - **Production branch:** `main`.
   - **Build command:** *(dejar vacío — es HTML estático)*.
   - **Build output directory:** `/` *(raíz)*.
   - **Environment variables:** *(ninguna)*.
5. **Save and Deploy.** Espera ~1 minuto al primer build.
6. Verificar que la URL `https://entrenamir.pages.dev` responde con la página. **OJO: en este punto la página es pública.** Sigue al paso 2 inmediatamente.

---

## Paso 2 — Activar Cloudflare Access (Zero Trust)

1. En `dash.cloudflare.com` → menú lateral → **Zero Trust** → si es la primera vez, te pide crear un team name (elige algo neutro, por ejemplo `cge-private`). Plan: **Free**.
2. **Access → Applications → Add an application** → tipo **Self-hosted**.
3. Configuración de la aplicación:
   - **Application name:** `entrenamir-demo`.
   - **Session duration:** `24 hours` (los usuarios autenticados no tienen que volver a logarse durante 24 h).
   - **Application domain:**
     - **Subdomain:** `entrenamir`.
     - **Domain:** `pages.dev`.
     - **Path:** *(dejar vacío para proteger todo)*.
   - **Identity providers:** marca **One-time PIN** (envía PIN al email) y, si quieres, **Google**.
   - **App Launcher visibility:** OFF.
4. **Next → Add policy:**
   - **Policy name:** `Allowed emails`.
   - **Action:** `Allow`.
   - **Configure rules:**
     - **Include → Emails:** añade tu email (`carlosgaleraroman@gmail.com`) y los de EGS que vas a autorizar (`jesus@egs.es`, etc.).
     - Alternativa más restrictiva: **Include → Emails ending in** `@egs.es` (todos los del dominio EGS de golpe).
5. **Next → Next → Add application.**
6. Verificar: abre `https://entrenamir.pages.dev` en una pestaña incógnita. Cloudflare debe pedirte email → PIN. Solo emails autorizados entran.

---

## Paso 3 — Comprobaciones de seguridad

- [ ] Abrir `https://entrenamir.pages.dev` en navegador SIN sesión → debe mostrar pantalla de login Cloudflare Access, **no** el contenido.
- [ ] Intentar con un email NO autorizado → debe denegar.
- [ ] Intentar con el email autorizado → recibe PIN por email → entra → ve la app.
- [ ] Verificar `https://entrenamir.pages.dev/robots.txt` — también debería estar protegido (todo bajo Access).
- [ ] Verificar en Google: `site:entrenamir.pages.dev` debería devolver 0 resultados (puede tardar días). El `<meta name="robots" content="noindex">` ya está en el HTML por si Google igualmente lo crawlea antes de que Access esté activo.

---

## Paso 4 — Entregar acceso a EGS (cuando llegue el momento)

1. Volver a **Zero Trust → Access → Applications → entrenamir-demo → Policies → Allowed emails**.
2. Añadir los emails específicos del equipo EGS que vayan a ver la demo.
3. Mandarles email con:
   - URL: `https://entrenamir.pages.dev`
   - Instrucciones: "*Al entrar te pedirá tu email corporativo y un PIN que te llegará al correo. Sesión 24h. Si pierdes el PIN, vuelve a entrar y pide otro.*"
   - **NDA firmado adjunto** (no enviar la URL sin NDA firmado).
4. Cuando termine la negociación (positiva o negativa), **revocar acceso**: borrar sus emails de la policy. Cloudflare invalida la sesión.

---

## Paso 5 — Si quieres dominio propio

Opcional. En Pages → **Custom domains** → `entrenamir.cartagenaeste.es` o `demo.area2cartagena.es`. Configurar CNAME en tu DNS. Access se mueve automáticamente al dominio nuevo.

**No recomendado en este caso**: usar dominio neutro (`entrenamir.pages.dev`) mantiene la operación discreta y desligada del branding de Cartagenaeste.

---

## Mantenimiento

### Redeploy tras cambios en el contenido

El deploy actual se hizo vía `wrangler pages deploy` (directo, sin integración Git). Para redeployar:

```bash
# Asegurarte de que el contenido está actualizado en /tmp/entrenamir-bootstrap/
# (o clonar entrenamir repo a otra ruta)
cd /tmp/entrenamir-bootstrap
wrangler pages deploy . --project-name=entrenamir --branch=main --commit-dirty=true
```

Wrangler ya está autenticado (token en `~/Library/Preferences/.wrangler/config/default.toml`). Verifica con `wrangler whoami`.

### Activar deploy automático desde el repo (opcional)

Si quieres que cada push a `carlosgalera-a11y/entrenamir/main` dispare un build automático:
1. `https://dash.cloudflare.com/c090be89a466795f36c01457a68e94b1/pages/view/entrenamir/settings/source`
2. **Connect to Git** → autorizar GitHub a leer `entrenamir` (solo ese repo).
3. Build settings: production branch `main`, build command vacío, output directory `/`.

Actualmente está en modo "Direct Upload" (sin conexión Git), porque la API de Cloudflare no permite conectar Git via CLI/wrangler — requiere el OAuth GitHub interactivo. Es opcional: con `wrangler pages deploy` cubres el caso.

### Rollback

Desde el dashboard de Pages → **Deployments → Rollback** a una versión anterior.

### Gestión de usuarios autorizados

**Zero Trust → Access → Applications → entrenamir-demo → Policies → Allowed emails → Edit**

Acción rápida desde CLI (cuando llegue EGS y haya que añadirlos):

```bash
# El OAuth de wrangler NO incluye scope access:* — esta operación es solo UI.
# Si lo automatizas en el futuro, requiere API token con "Access: Edit".
```

---

## Si algo va mal

| Síntoma | Causa probable | Solución |
|---|---|---|
| Cloudflare no ve el repo | Permisos GitHub no incluyen `entrenamir` | GitHub → Settings → Applications → Cloudflare → Repository access → añadir |
| Build falla | El `.nojekyll` no está commiteado | `git ls-files /tmp/entrenamir-bootstrap/.nojekyll` debe existir |
| Página accesible sin login | Access no aplicado al subdominio correcto | Revisar **Application domain** en Access — debe ser `entrenamir.pages.dev` exacto |
| PIN no llega | Cloudflare Free tiene rate limit de envío | Esperar 60 s y reintentar |

---

**Última revisión:** 25 de mayo de 2026 · Carlos Galera Román
