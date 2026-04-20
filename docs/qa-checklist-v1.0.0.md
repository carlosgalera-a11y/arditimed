# QA Checklist · Cartagenaeste v1.0.0

Fecha del ejercicio: 2026-04-22.
Ejecutor: Carlos Galera Román.
URL de referencia: https://area2cartagena.es/

---

## Autenticación

- [ ] Login Google funciona en producción (popup → cuenta → redirige con avatar).
- [ ] Login email+password funciona (si lo activas en la UI).
- [ ] Logout funciona y oculta datos personales.
- [ ] Recuperación de contraseña funciona (email de reset).
- [ ] Timeout sesión: tras ~30 min idle, token refreshed transparentemente.

## Funcionalidad core

- [ ] Crear caso docente con iniciales ≤4 chars (rechaza >4 por firestore rule).
- [ ] Editar caso → persiste en `users/{uid}/cases`.
- [ ] Borrar caso → aparece entrada en `auditLogs` (acción `delete`).
- [ ] MegaCuaderno IA responde (llamada real a `askAi`, Network 200).
- [ ] Análisis de imagen IA funciona (tipo `vision`).
- [ ] Triaje QR completo: paciente → QR → escanear → ficha 24h.
- [ ] 5 calculadoras al azar (BMI, MELD, CHA2DS2-VASc, Glasgow, Wells) dan resultados correctos.
- [ ] Buscador vacuna por edad funciona.
- [ ] Generador turnos crea PDF descargable.
- [ ] Casos clínicos MIR: 17 especialidades, >100 preguntas.
- [ ] Fármacos urgencia: 51 entries listados.
- [ ] Buzón sugerencias → `sugerencias/{autoId}` creado.
- [ ] Plantillas informes: 3 tabs funcionando.
- [ ] Enfermería módulo accesible desde menú principal.
- [ ] Camas y ambulancias accesibles.
- [ ] Mapa sanitario carga.
- [ ] Dashboard accesible tras login superadmin.

## Seguridad y compliance

- [ ] DevTools → Network al usar IA: **única** llamada a `*-docenciacartagenaeste.cloudfunctions.net/askAi`. Cero a groq/openrouter/deepseek/pollinations/dashscope/mistral directo.
- [ ] App Check enforce: tras activar en consola (fase posterior), petición desde origen no autorizado → `failed-precondition`.
- [ ] Firestore rules: usuario A no lee datos de usuario B. Verificar con dos cuentas Google + DevTools Firestore inspect.
- [ ] Cookie banner aparece a usuario nuevo.
- [ ] Disclaimer formativo visible en home y páginas clínicas.
- [ ] `/privacidad.html` accesible y actualizada.
- [ ] `/informacion.html` (aviso legal) accesible.
- [ ] Headers de seguridad presentes: `curl -I https://area2cartagena.es/ | grep -Ei "strict-transport|content-type-options|permissions-policy"`.
- [ ] `gitleaks detect --source .` → 0 findings en el último commit.
- [ ] Grep control en prod: `curl -s https://area2cartagena.es/index.html | grep -cE "api.(groq|deepseek|mistral).com|openrouter.ai/api|pollinations|dashscope"` = 0.

## Datos

- [ ] Exportar mis datos: botón genera JSON con mis casos/notas.
- [ ] Eliminar mi cuenta: borra docs `users/{uid}` y subcolecciones. `auditLogs` preserva la traza.
- [ ] Backup diario: verificar en bucket `gs://docenciacartagenaeste-backups/firestore/YYYY-MM-DD/` (tras primera ejecución del cron).
- [ ] Audit log inmutable: intentar `db.collection('auditLogs').doc('foo').update({x:1})` desde consola de un usuario → permission-denied.

## Monitoring

- [ ] Sentry recibe exception de prueba en <30s (tras setear `window.SENTRY_DSN`).
- [ ] `firebase functions:log --only askAi --lines 10` muestra entradas con metadatos (sin texto del prompt).
- [ ] `/status.html` muestra métricas reales.
- [ ] Alerta de prueba por email (forzar error rate > 5% con 10 llamadas a askAi con prompt inválido).

## PWA y rendimiento

- [ ] PWA installable en Chrome desktop (icono + en barra de direcciones).
- [ ] PWA installable en Safari iOS (Compartir → Añadir a pantalla de inicio).
- [ ] Service Worker v74 activo: DevTools → Application → Service Workers → status "activated".
- [ ] Update flow funciona: merge trivial + redeploy → banner "Nueva versión disponible".
- [ ] Lighthouse Performance mobile ≥ 75 en `/`.
- [ ] Lighthouse Accessibility ≥ 85.
- [ ] Lighthouse Best Practices ≥ 85.
- [ ] Lighthouse PWA = 100.
- [ ] Sin console errors en `/`, `/casos-clinicos.html`, `/calculadoras.html`, `/mapa.html`, `/status.html`.

## Responsive

- [ ] 375px (iPhone SE) — layout no roto.
- [ ] 412px (Pixel / Android estándar) — layout no roto.
- [ ] 768px (iPad) — layout adapta a 2 columnas donde aplica.
- [ ] 1440px (desktop) — layout usa ancho máx 1200-1400px.

## Repositorio

- [ ] README renderiza bien en GitHub.
- [ ] LICENSE visible y legible.
- [ ] IP_ATTESTATION.md visible con datos correctos (Reg. 00765-03096622).
- [ ] CHANGELOG.md refleja v1.0.0.
- [ ] CI verde en main (última build).
- [ ] Branch protection activa en `main` (Settings → Branches → add rule).
- [ ] No secretos en `git log -p | grep -iE 'sk-[a-f0-9]{32}|AIza[0-9A-Za-z_-]{35}|gsk_[a-zA-Z0-9]{20,}'` (tras `git filter-repo`).

## Script automatizable

Ejecutar:
```bash
bash test-deploy.sh
```

Debe retornar 0 failures.

---

**Firma**: ________________________ **Fecha**: __________
