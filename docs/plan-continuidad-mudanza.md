# Plan de continuidad · Mudanza a Barcelona

**Ventana crítica:** 29 julio – 11 agosto 2026 (14 días)
**Autor:** Carlos Galera Román
**Versión:** 1.0 · 2026-04-23
**Estado:** borrador, pendiente de firmar NDA con dev de backup antes de aplicar

> Este documento detalla el plan operativo para que la plataforma Cartagenaeste siga funcionando **sin interrupción** durante la mudanza profesional/personal de Carlos a Barcelona a finales de julio/agosto 2026. Se alinea con §9.8 del [runbook.md](runbook.md) y con la semana 15-16 del *Roadmap de monetización Cartagenaeste*.

---

## 1. Objetivos

1. **Cero incidencias visibles para clientes contractuales** (Urgencias HSL, Docencia, AZ si ya firmada) durante los 14 días de ventana.
2. **Cero deterioro de SLA** (uptime 99.5%, p95 < 5s IA, RTO 60 min, RPO 24 h).
3. **Cobertura técnica asegurada** por al menos 1 dev de backup con acceso revocable al finalizar la ventana.
4. **Comunicación proactiva y controlada**: clientes avisados antes de empezar la ventana, no durante un incidente.
5. **Descanso real de Carlos** durante al menos 5 días consecutivos dentro de la ventana.

---

## 2. Criterios de éxito

Al cierre del 11 agosto 2026:

- [ ] Ningún incidente SEV-1 o SEV-2 no resuelto.
- [ ] Ningún cliente ha escalado queja por indisponibilidad.
- [ ] Al menos 1 incidente real gestionado por el dev de backup sin intervención de Carlos (si se produce).
- [ ] Simulacro previo (antes del 28 jul) ejecutado con éxito.
- [ ] Carlos ha descansado ≥ 5 días consecutivos.

---

## 3. Pre-requisitos (a completar ANTES del 28 julio)

### 3.1 Legal y contractual

- [ ] **NDA firmado** con el dev de backup (plantilla estándar del abogado).
- [ ] **Contrato de servicios** con el dev de backup: 10-15 h/mes retenidas, tarifa acordada, forma de pago, cláusula de confidencialidad reforzada para datos sanitarios, seguro propio o extensión del nuestro.
- [ ] **Seguro de RC profesional + ciber** vigente a fecha 29 jul (ver tarea S4-S6 del roadmap).
- [ ] **Comunicación formal a clientes**: email a ≤ 15 días del inicio informando de la ventana de cobertura reducida con contacto alternativo. Plantilla en §7.

### 3.2 Acceso técnico al dev de backup

- [ ] Invitar como colaborador Write en el repo `carlosgalera-a11y/Cartagenaeste` (GitHub).
- [ ] Rol IAM `editor` en el proyecto `docenciacartagenaeste` (GCP/Firebase Console).
- [ ] Lectura en Secret Manager de los secretos operativos (no administrativos):
  - `DEEPSEEK_API_KEY`, `OPENROUTER_API_KEY`, `QWEN_API_KEY`, `GEMINI_API_KEY` (lectura)
  - NO acceder a secretos raíz (Firebase App Check debug token, Admin SDK).
- [ ] Email `backup@[dominio-del-dev]` añadido a `ADMIN_EMAILS` en [admin-dashboard.html](admin-dashboard.html) (solo durante la ventana).
- [ ] Alerta de Sentry duplicada a su email.
- [ ] 2FA activo con app authenticator (no SMS).
- [ ] Acceso de lectura al gestor de contraseñas compartido (solo credenciales operativas, no personales).

### 3.3 Documentación

- [ ] `runbook.md` revisado y al día (hecho en este PR).
- [ ] `CLAUDE.md` revisado (alineado con el procedimiento).
- [ ] **Walkthrough grabado** (video 20-30 min) cubriendo:
  1. Tour del repo y la app.
  2. Deploy típico (`git push` a main + sync area2).
  3. Deploy de functions (`firebase deploy --only functions:xxx`).
  4. Cómo ver logs, cómo ver cuotas, cómo ver errores Sentry.
  5. Cómo aislar un componente problemático (§9.5 del runbook).
  6. Cómo contactar con Carlos en emergencia.
  Guardar en Drive privado (no GitHub, no YouTube público).

### 3.4 Comunicación

- [ ] Teléfono de emergencia de Carlos accesible (no WhatsApp a horas intempestivas salvo SEV-1).
- [ ] Teléfono del dev de backup conocido por Carlos.
- [ ] Canal de Slack/Telegram/Signal privado "Cartagenaeste-ops" con los dos.
- [ ] Status page pública en `https://area2cartagena.es/status.html` actualizable por ambos.

---

## 4. Simulacro obligatorio (semana del 22 julio)

**Objetivo:** demostrar que el dev de backup puede operar autónomamente durante **7 días naturales** sin intervención de Carlos, antes de irse realmente 14 días.

### Escenario del simulacro
- **Fecha:** 22-28 julio 2026 (lunes-domingo previo a la mudanza).
- **Condición:** Carlos marca su status como "simulando ausencia" en el canal de ops. No responde mensajes técnicos a menos que haya SEV-1 real.
- **Ejercicios inducidos**:
  1. Deploy de un cambio menor a prod por el dev de backup (ej. typo en un copy).
  2. Restauración de un snapshot Firestore en proyecto de staging.
  3. Apagado-encendido simulado de `aggregateDailyMetrics` (`firebase functions:delete` + re-deploy).
  4. Respuesta a un ticket simulado de usuario ("no me funciona la IA").
  5. Post-mortem de un incidente simulado.

### Criterio de aceptación del simulacro
- [ ] Deploy ejecutado correctamente.
- [ ] Restauración completada en proyecto de staging sin pérdida de datos.
- [ ] Redeploy de function funciona.
- [ ] Respuesta a ticket < 4 h en horario laboral.
- [ ] Post-mortem publicado en 24 h.
- [ ] Carlos ha revisado todo al final de la semana SIN haber tenido que intervenir.

Si el simulacro falla, **la mudanza se pospone** o se contrata un segundo dev para doblar la cobertura.

---

## 5. Plan día a día durante la ventana (29 jul – 11 ago)

### Semana A · 29 jul – 4 ago (mudanza física)

| Día | Carlos | Dev de backup |
|---|---|---|
| Lun 29 | Empaquetado · disponible por teléfono SEV-1 | Full ownership operativa |
| Mar 30 | Empaquetado | Full ownership · daily standup 10:00 opcional |
| Mié 31 | Viaje BCN | Full ownership |
| Jue 1 | Instalación vivienda · sin laptop | Full ownership |
| Vie 2 | Instalación · sin laptop | Full ownership · envío informe semanal |
| Sáb-Dom | Descanso | On-call rotatorio SEV-1 |

### Semana B · 5 – 11 ago (consolidación BCN)

| Día | Carlos | Dev de backup |
|---|---|---|
| Lun 5 | Check-in semanal 60 min | Full ownership · entrega informe |
| Mar-Mié | Tiempo personal | Full ownership |
| Jue 7 | Reintegración gradual · revisión PRs | Ownership compartida |
| Vie 8 | Reintegración completa | Transición back a Carlos |
| Sáb-Dom | Carlos recupera ownership | Off-duty |

### Ownership de componentes durante la ventana

| Componente | Owner primario | Owner backup |
|---|---|---|
| Incidentes SEV-1 (datos expuestos) | Dev de backup + Carlos (notificación AEPD) | — |
| Incidentes SEV-2 (IA caída) | Dev de backup | Carlos si disponible |
| Tickets usuarios | Dev de backup | — |
| Deploys de rutina | Pausados salvo emergencia | — |
| Nuevos módulos/features | **Pausados** hasta 12 ago | — |
| Reuniones con clientes | Pospuestas | — |
| Facturación Urgencias / Docencia | **Adelantada antes del 28 jul** | — |
| Facturación AZ (si aplica) | Adelantada si el hito coincide | — |

---

## 6. Qué NO se hace durante la ventana

- ❌ Nuevas features o refactors.
- ❌ Migración de datos.
- ❌ Rotación de claves (salvo por compromiso).
- ❌ Cambios en rules Firestore o IAM.
- ❌ Cambios en branch protection.
- ❌ Reuniones comerciales nuevas.
- ❌ Firmas de contratos nuevos.
- ❌ Publicación de contenido formativo nuevo (AstraZeneca → cola para 12 ago+).

---

## 7. Plantillas de comunicación

### 7.1 Email pre-ventana a clientes contractuales (enviar 15 jul aprox.)

```
Asunto: Aviso programado de cobertura técnica reducida · 29 julio - 11 agosto 2026

Estimado/a [Jefe de Servicio / Coordinador],

Le escribo para informarle de una ventana de cobertura técnica reducida
en la plataforma Cartagenaeste durante el periodo 29 de julio al 11 de
agosto de 2026 (14 días naturales), motivada por un traslado profesional
programado.

Medidas adoptadas para garantizar la continuidad del servicio:
 · Cobertura técnica por desarrollador de backup con acceso completo
   a la infraestructura y formación previa (simulacro ejecutado con
   éxito el 22-28 julio).
 · Monitoreo 24/7 sin cambios.
 · Capacidad de intervención en <60 min para incidentes críticos.
 · Respaldo diario en región UE (europe-west1) operativo.
 · No se realizarán despliegues ni cambios de configuración durante
   esta ventana, salvo emergencia.

Durante este periodo, para incidentes o consultas técnicas el canal
preferente es:
  · Email: [backup-dev-email]
  · Para urgencias (afectación asistencial): [tel-ops-24h]

Volveré a la operación regular el 12 de agosto de 2026.

Cualquier duda previa, no dude en consultarme. Quedo a su disposición.

Un cordial saludo,
Carlos Galera Román
```

### 7.2 Nota breve en `/status.html`

```
⚠️ Ventana de cobertura técnica reducida
29 jul 2026 - 11 ago 2026

La plataforma funciona con normalidad. Durante estos días la atención
a tickets no urgentes puede tener una demora mayor. Incidencias
críticas: [backup-dev-email] · [tel-ops-24h].

Volvemos a ritmo normal el 12 agosto.
```

### 7.3 Email post-ventana a clientes (enviar 12 ago)

```
Asunto: Fin de ventana de cobertura reducida · operación normal

Estimado/a [Jefe de Servicio / Coordinador],

Le confirmo el fin de la ventana de cobertura técnica reducida que
anuncié el 15 de julio. La operación regular con mi interlocución
directa se reanuda hoy 12 de agosto de 2026.

Resumen de la ventana:
 · Incidentes gestionados: [N]
 · SLA cumplido: [sí/no, con nota si aplica]
 · Acciones pendientes de mi revisión: [listar si hay]

Si surgió alguna consulta no crítica durante la ventana que quedó en
cola, la atenderé esta semana. Para cualquier punto, quedo a su
disposición.

Un saludo,
Carlos Galera Román
```

---

## 8. Al cierre de la ventana (12 agosto)

- [ ] **Revocar accesos extra** del dev de backup si el contrato es puntual (solo ventana); mantenerlos si el contrato es continuo.
- [ ] **Revisar Sentry y logs** de los 14 días.
- [ ] **Auditoría de accesos** a Firestore/Functions (Cloud Audit Logs).
- [ ] **Retrospectiva** con el dev de backup (60 min): qué funcionó, qué falló, qué se mejora.
- [ ] **Actualizar este documento** con aprendizajes para la próxima ventana.
- [ ] **Pago** al dev de backup según contrato.
- [ ] **Email post-ventana** a clientes (§7.3).

---

## 9. Contingencia si algo falla

### Si el dev de backup no puede cubrir por causa mayor
- Plan B: otro dev de confianza (identificar ANTES del 28 jul).
- Plan C: pausar funcionalidad avanzada (IA) y dejar solo contenido estático + organizador personal. La app no se cae, solo pierde IA. Mensaje banner: "Funcionalidad IA en mantenimiento programado".

### Si Carlos no puede reintegrarse el 12 agosto (enfermedad, retraso mudanza)
- Extender ventana de cobertura del backup (contrato debe prever prórroga de hasta 30 días con tarifa acordada).
- Notificar a clientes la extensión antes de consumir >3 días más.

### Si ocurre SEV-1 durante la ventana con Carlos indispuesto
- Dev de backup notifica AEPD dentro de las 72 h (tiene la plantilla en runbook §9.4).
- Dev de backup comunica a clientes afectados.
- Carlos se incorpora al post-mortem cuando esté disponible, idealmente <48 h.

---

## 10. Referencias

- [runbook.md §9 · Continuidad operativa](runbook.md)
- [CLAUDE.md · Reglas innegociables](../CLAUDE.md)
- Roadmap de monetización · §3 punto crítico 3 (bus factor) · §4 semanas 15-16.
- Código de Buenas Prácticas Farmaindustria (si hay patrocinio AZ activo durante la ventana: publicación pospuesta en lugar de retirada).

---

_Última revisión: 2026-04-23. Próxima revisión programada: 22 julio 2026 (confirmación final pre-ventana)._
