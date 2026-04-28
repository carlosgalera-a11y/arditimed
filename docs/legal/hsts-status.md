# HSTS · estado de Strict-Transport-Security en `area2cartagena.es`

**Hallazgo H-06 de la auditoría 2026-04-28**: ¿hay HSTS activo?

## Verificación 2026-04-28

```bash
curl -sI "https://area2cartagena.es/" | grep -i strict-transport-security
# strict-transport-security: max-age=31556952
```

**Resultado: HSTS activo** con `max-age=31556952` (~1 año), emitido por GitHub Pages al tener "Enforce HTTPS" activado en el repo `area2cartagena/area2cartagena`. Idéntico para `carlosgalera-a11y.github.io`.

## Limitaciones del HSTS actual

GitHub Pages emite HSTS con la directiva mínima:
- ✅ `max-age=31556952` (1 año, suficiente).
- ❌ **NO** incluye `includeSubDomains`.
- ❌ **NO** incluye `preload`.

Esto significa:
- Subdominios futuros (ej. `api.area2cartagena.es`) no quedarían cubiertos automáticamente.
- El dominio NO aparece en la lista de preload del navegador, por lo que la **primera** visita de cada usuario nuevo aún acepta HTTP antes del primer redirect.

## Acciones para reforzar (opcional, no bloqueante)

### 1. Solicitar inclusión en HSTS preload list

Requisitos previos (cumplidos por GitHub Pages):
- HTTPS válido y completo.
- Redirect 301 de HTTP → HTTPS.
- Todos los subdominios sirven HTTPS.
- HSTS header presente en respuestas.

Pero **no** se puede solicitar preload sin que el header incluya `includeSubDomains; preload`. GitHub Pages no permite añadir esas directivas a la respuesta. Para activarlo habría que:

- **Opción A**: poner Cloudflare Pages o Cloudflare en modo proxy delante de GitHub Pages, y configurar HSTS allí con las directivas extendidas.
- **Opción B**: migrar a Firebase Hosting (que sí permite headers personalizados vía `firebase.json`). Esto cambia el modelo (CLAUDE.md regla #9 dice explícitamente que el hosting es GitHub Pages, no Firebase Hosting).

### 2. Documentar el riesgo residual

Riesgo de la primera visita sin HSTS preload: ataque MITM en hotspot público (cafetería, aeropuerto) podría secuestrar la primera visita de un usuario nuevo. Mitigaciones complementarias ya activas:
- TLS 1.3 obligatorio en GitHub Pages.
- CSP estricta limita el daño post-MITM.
- App Check + reCAPTCHA (cuando se active) protege la Cloud Function aunque el navegador haya sido degradado.

## Conclusión

**H-06 cerrado como ✅ resuelto al nivel que GitHub Pages permite**. La activación de `includeSubDomains; preload` queda como mejora futura si el proyecto se mueve a infra que lo permita (Cloudflare/Firebase Hosting), pero no es un hallazgo bloqueante para el modelo actual.

Verificar trimestralmente:
```bash
curl -sI "https://area2cartagena.es/" | grep -i strict-transport-security
```

Si el header desaparece (regresión de configuración GitHub Pages), reabrir como hallazgo crítico.
