---
version: 1.0
date: 2026-04-29
commit: 1b9505b
---

# Auditoría legal interna · Cartagenaeste

**Fecha:** 2026-04-28 (actualizada 2026-04-29 con cierre H-03/04/05/06/07/08/09/10/11)
**Auditor:** Carlos Galera Román (con asistente Claude Code) · barrido sistemático del repo
**Alcance:** RGPD/LOPDGDD · EU AI Act 2024/1689 · MDR 2017/745 · LPI · OWASP top 10 (aplicado) · WCAG 2.1 AA · ePrivacy/cookies
**Estado del repo en la auditoría:** main @ commit posterior a PR #123 · sw.js v145

## Estado de cierre (2026-04-29)

| ID | Severidad inicial | Estado | PR/Doc |
|---|---|---|---|
| H-01 | 🔴 | ⏳ Pendiente — espera reCAPTCHA site key (Carlos) | — |
| H-02 | 🔴 | ⏳ Pendiente — solicitar DPA a OpenRouter + DeepSeek (Carlos) | — |
| H-03 | 🔴 | ✅ Cerrado | PR #125 |
| H-04 | 🔴 | ✅ Cerrado | PR #125 |
| H-05 | 🟡 | ✅ Cerrado | PR #126 |
| H-06 | 🟡 | ✅ Cerrado · HSTS ya activo en GitHub Pages | [hsts-status.md](hsts-status.md) |
| H-07 | 🟡 | ✅ Cerrado | PR #126 |
| H-08 | 🟡 | ✅ Cerrado | PR #126 |
| H-09 | 🟢 | ✅ Cerrado · last-reviewed bumpeado a 2026-04-29 en 79 HTMLs | PR #127 |
| H-10 | 🟢 | ✅ Cerrado · front-matter version/commit en 11 docs legales | PR #127 |
| H-11 | 🟢 | ✅ Cerrado · protocolo brecha §11 en runbook + breach-register.md | PR #127 |

> Este documento es una auditoría **interna**, no sustituye dictamen de letrado. Es deliberadamente directo: los hallazgos están priorizados por riesgo legal real (no por percepción).
> Sirve como input para (a) revisión externa con asesor legal o `alexlegal.ai`, (b) entrega a CDTI/AstraZeneca/SMS en due diligence, (c) cierre interno de los hallazgos resolubles sin abogado.

---

## 0. Resumen ejecutivo

| Severidad | # | Comentario |
|---|---|---|
| 🔴 Alta (resolver antes de pitch / uso clínico real) | 4 | App Check OFF · DPAs pendientes (DeepSeek/OpenRouter) · Política de privacidad desactualizada · Falta banner cookies + opt-out GA4 |
| 🟡 Media (resolver en 1-2 semanas) | 4 | Modal ScanIA paciente real · HSTS · Política tras EIPD · Mecanismo derechos del interesado UI |
| 🟢 Baja (higiene) | 3 | Refresh fecha de revisión · Documentación versionada · Marcado de fuentes |

**Estado neto:** sólido en lo regulatorio (EIPD completa, RAT documentado, AI Act dossier, MDR analizado, audit log inmutable). Las debilidades son de **ejecución** (App Check no activado, DPAs no firmados, banner cookies no implementado) y de **deuda documental** (política pública anterior a la EIPD del 26-abr).

Cero hallazgos en MDR (posicionamiento formativo bien fundamentado), licencia (propietaria + RPI 00765-03096622), ni reproducción no autorizada de guías de terceros.

---

## 1. Hallazgos · matriz priorizada

### 🔴 H-01 · App Check enforce desactivado

- **Dimensión:** seguridad / RGPD art. 32 (medidas técnicas).
- **Hallazgo:** [functions/src/askAi.ts:48](../../functions/src/askAi.ts) `enforceAppCheck: false`. [recaptcha-key.js:19](../../recaptcha-key.js) `window.RECAPTCHA_SITE_KEY = ''` (vacío).
- **Riesgo:** cualquier script externo con un usuario válido puede invocar `askAi` desde fuera de los dominios autorizados. Coste IA inflable; potencial para extracción masiva de respuestas.
- **Fix:**
  1. Crear site key reCAPTCHA v3 en <https://www.google.com/recaptcha/admin/create> (dominios `area2cartagena.es`, `carlosgalera-a11y.github.io`).
  2. Registrarla en Firebase Console → App Check.
  3. Pegar en `recaptcha-key.js`.
  4. Verificar en DevTools que el header `X-Firebase-AppCheck` viaja en cada request.
  5. Flipar `enforceAppCheck: true` en `askAi.ts` y redeploy.
- **Esfuerzo:** 30 min Carlos + 1 PR (10 min Claude).
- **Bloqueante para:** pitch técnico inversores, due diligence farma.
- **Runbook:** [docs/app-check-rollout.md](../app-check-rollout.md).

### 🔴 H-02 · DPAs no firmados con DeepSeek y OpenRouter

- **Dimensión:** RGPD art. 28 (encargado del tratamiento), art. 44-49 (transferencias internacionales).
- **Hallazgo:** [docs/legal/dpa-template.md:100](dpa-template.md) reconoce que para uso clínico real "se debe garantizar EU-residency contractual". Actualmente:
  - DeepSeek: DPA pendiente firmar (proveedor en China — transferencia internacional).
  - OpenRouter: DPA pendiente firmar (US).
- **Riesgo:** sin DPA específico ni mecanismo de transferencia válido (SCC firmadas), AEPD/EDPB pueden considerar el tratamiento ilícito incluso aunque los datos sean seudonimizados. Bloquea co-branding institucional con SMS/AstraZeneca.
- **Fix:**
  1. **OpenRouter** ([dashboard.openrouter.ai](https://openrouter.ai/) → privacy/legal): solicitar DPA + SCC anexo. Plan B: migrar `clinical_case` y `educational` a Gemini directo (Google Cloud EU, DPA ya en SCC vigente desde firebase-init.js).
  2. **DeepSeek** ([platform.deepseek.com](https://platform.deepseek.com/)): mismo proceso. Plan B: limitar uso a `educational` no clínico, o reemplazar por Mistral EU como primario.
  3. Actualizar `docs/legal/dpa-template.md` con los anexos firmados.
- **Esfuerzo:** 2-4 semanas de back-and-forth con cada proveedor + 1 PR para reordenar `routing.ts` si cambia el primario.
- **Bloqueante para:** posicionamiento "EU residency estricta" del CLAUDE.md, integración con SMS, contratos con farma.
- **Mitigante actual:** Sentry y Google Firebase tienen SCC + DPF vigentes; el grueso del audit log no sale de UE.

### 🔴 H-03 · Política de privacidad desactualizada vs EIPD

- **Dimensión:** RGPD art. 13-14 (información al interesado), LOPDGDD art. 11.
- **Hallazgo:** [privacidad.html](../../privacidad.html) última actualización **2026-02-25**. La EIPD ([docs/legal/rgpd-eipd.md](rgpd-eipd.md)) se cerró **2026-04-26** y describe controles que la política pública no menciona (ej. retención exacta, scrubbing PII en Sentry, audit log inmutable).
- **Riesgo:** AEPD considera no transparente lo que la organización hace internamente pero no comunica. Multa típica primer aviso: 0,5-2% facturación o multa fija.
- **Fix:** PR que actualice `privacidad.html` con:
  1. Lista actualizada de proveedores incluyendo Sentry, Anthropic (si se usa), Mistral fallback.
  2. Retención: 365 d casos, 180 d aiRequests, 7 d aiCache, 24 h evidenciaCache.
  3. Mecanismo de derechos: link a formulario o email de contacto.
  4. Mecanismo de transferencias internacionales (SCC mencionadas).
  5. Fecha de revisión: 2026-04-28.
  6. Actualizar `<meta name="last-reviewed">` en cabeza.
- **Esfuerzo:** 1 PR (~30 min).
- **Bloqueante para:** rigor regulatorio, due diligence.

### 🔴 H-04 · Sin banner cookies / sin opt-out GA4

- **Dimensión:** ePrivacy (Directiva 2002/58/CE) art. 5.3, transposición LSSI España art. 22.2.
- **Hallazgo:** [analytics-config.js:33](../../analytics-config.js) carga GA4 `G-DYDVR0N44D` desde el primer pageview. Sin banner. La política dice "No utilizamos cookies de seguimiento ni publicidad" — pero GA4 sí escribe `_ga` cookies, aunque sea con `anonymize_ip:true`.
- **Riesgo:** AEPD sanciona habitualmente GA sin consentimiento. Multa típica 1.000-30.000€ para webs no comerciales con uso intensivo.
- **Fix (orden de severidad):**
  1. **Mínimo viable**: añadir banner discreto con dos botones (Aceptar / Rechazar). Si Rechaza, no se carga `gtag.js`. Lib ligera (~3KB) sin tracker comercial. Implementable en 1 PR.
  2. **Riguroso**: Cookie consent management (Iubenda, Cookiebot, OneTrust) + categorización (necesarias / analítica). Solo si planeas crecer en cookies de marketing.
  3. Eliminar la frase "No utilizamos cookies de seguimiento ni publicidad" de privacidad.html (o cualificar: "no usamos cookies con fines publicitarios; usamos GA4 estrictamente para medir uso").
- **Esfuerzo:** 1 PR (~1 h).
- **Bloqueante para:** ninguno técnicamente, pero es el hallazgo más probable de una inspección AEPD.

---

### 🟡 H-05 · Modal explícito ScanIA al cargar imagen real

- **Dimensión:** MDR / EU AI Act art. 50.
- **Hallazgo:** [docs/legal/ce-mdr-analysis.md:65-66](ce-mdr-analysis.md) recomienda añadir modal de aceptación obligatoria al cargar imagen en ScanIA. **No implementado**.
- **Riesgo:** cruzar la línea hacia "soporte a decisión clínica" si un profesional carga una imagen real sin acuse de recibo del disclaimer. Aleja el módulo de la clasificación "formativo".
- **Fix:** PR en `panel-medico.html` (sección ScanIA) — añadir modal one-shot por sesión que el usuario marque "He leído y entiendo que esta herramienta es formativa, no diagnóstica" antes de subir la primera imagen.
- **Esfuerzo:** 1 PR (~45 min).

### 🟡 H-06 · HSTS no explícito en headers

- **Dimensión:** OWASP A02:2021 (Cryptographic Failures).
- **Hallazgo:** [index.html:25-27](../../index.html) tiene CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. **NO** hay `Strict-Transport-Security`. GitHub Pages emite HSTS por defecto en `*.github.io`, pero no en dominios custom (`area2cartagena.es`).
- **Riesgo:** un MITM en hotspot público podría downgradear a HTTP la primera visita.
- **Fix:** añadir meta tag `<meta http-equiv="Strict-Transport-Security" content="max-age=31536000; includeSubDomains">` (efecto limitado pero documentable). Mejor: configurar HSTS en Cloudflare/CDN si delante de Pages, o cambiar host. Aceptable: dejar como riesgo asumido y documentar.
- **Esfuerzo:** investigar 30 min, 1 PR si aplicable.

### 🟡 H-07 · Mecanismo derechos del interesado sin UI

- **Dimensión:** RGPD art. 15-22 (acceso, rectificación, supresión, oposición, portabilidad).
- **Hallazgo:** [eliminar-cuenta.html](../../eliminar-cuenta.html) existe, pero no hay UI específica para los otros derechos. La política indica "contacto a Carlos Galera Román" sin formulario estructurado.
- **Riesgo:** la respuesta a un derecho debe darse en 1 mes (art. 12.3). Sin proceso estructurado, fácil incumplir.
- **Fix:** PR con `derechos-rgpd.html` standalone que liste los 6 derechos + formulario simple → encola en `/derechos_rgpd/{id}` que admin revisa. Reusa la cola `/mail` para notificar al solicitante con número de expediente.
- **Esfuerzo:** 1 PR (~2 h).

### 🟡 H-08 · Política tras EIPD vs operativa actual

- **Dimensión:** RGPD art. 30 (RAT) + art. 13 (transparencia).
- **Hallazgo:** El RAT [docs/legal/rgpd-rat.md](rgpd-rat.md) menciona 5 actividades. Pero hay nuevas colecciones tras los últimos PRs no recogidas: `evidencia_consultas`, `evidencia_feedback`, `evidenciaCache`, `mail`, `cs_invites`, `centros_salud/{cid}/foro`, `megacuaderno_digests`.
- **Riesgo:** RAT incompleto = arts. 30 + 24 incumplidos.
- **Fix:** PR que añada al RAT cada nueva actividad con (finalidad, base jurídica, categorías, plazo, destinatarios).
- **Esfuerzo:** 1 PR (~1 h).

---

### 🟢 H-09 · Marcas de fecha desactualizadas

- **Dimensión:** higiene documental.
- **Hallazgo:** múltiples HTMLs tienen `<meta name="last-reviewed" content="2026-04-23">` que ya no refleja los cambios post-PR #119. No es un fallo legal, pero las due diligences automáticas lo escanean.
- **Fix:** script de `prebuild` que actualice last-reviewed en HEAD push. O simplemente bumpear todos a la fecha de release.
- **Esfuerzo:** 30 min one-shot.

### 🟢 H-10 · Documentación versionada

- **Dimensión:** trazabilidad regulatoria.
- **Hallazgo:** los docs en `docs/legal/` no llevan número de versión ni hash del estado del código que documentan. Si cambias `enforceAppCheck`, la EIPD del 26-abr queda desactualizada y no se nota.
- **Fix:** front-matter al inicio de cada doc legal con `version: X.Y` y `commit: <sha>`. Cron mensual que verifique y abra PR si hay drift.
- **Esfuerzo:** 1 PR (~1 h) + cron.

### 🟢 H-11 · Comunicación de incidentes

- **Dimensión:** RGPD art. 33-34 (notificación de violaciones de datos).
- **Hallazgo:** [docs/runbook.md](../runbook.md) no tiene un protocolo claro de respuesta ante brecha (cuándo notificar AEPD en 72h, cuándo a interesados).
- **Fix:** sección "Brecha de seguridad" al runbook con árbol de decisión: alcance → notificación AEPD → notificación usuarios → comunicación pública → post-mortem.
- **Esfuerzo:** 1 PR (~1 h, mayoritariamente redacción).

---

## 2. Lo que está bien (para el dossier de venta)

Si llevas esto a un inversor/farma, **estos son los puntos fuertes verificables**:

- ✅ **EIPD/DPIA cerrada** ([docs/legal/rgpd-eipd.md](rgpd-eipd.md)) con 10 riesgos identificados y matriz de mitigación.
- ✅ **RAT documentado** según art. 30 RGPD.
- ✅ **EU AI Act dossier** ([docs/legal/eu-ai-act-dossier.md](eu-ai-act-dossier.md)) con clasificación riesgo limitado fundamentada y disclaimer art. 50 visible en cada respuesta IA.
- ✅ **MDR analysis** concluye no-dispositivo médico con justificación MDCG 2019-11.
- ✅ **Audit log inmutable** ([functions/src/auditLog.ts](../../functions/src/auditLog.ts)) — campos hash de prompt, sin contenido. Trazabilidad art. 12 AI Act cumplida.
- ✅ **Validación PII anti-DNI/NIE** en `validation.ts` y reglas Firestore (`noDni()`).
- ✅ **Disclaimer permanente** en footer + en respuesta IA + obligatorio aceptar en EvidenciaIA.
- ✅ **Licencia propietaria** + RPI 00765-03096622.
- ✅ **WCAG 2.1 AA**: 105 aria-labels en index.html, test Playwright + axe-core en CI ([e2e/a11y.spec.ts](../../e2e/a11y.spec.ts)) que falla si critical/serious.
- ✅ **Pseudonimización**: máx 4 iniciales + edad + nº cama. Validador rechaza DNI/NIE/NHC.
- ✅ **CSP completa**, Referrer-Policy strict, Permissions-Policy bloqueando geo/cam/payment.
- ✅ **Rate limit IP** 30 req/min, cuota usuario 50/día.
- ✅ **Sentry scrubbing PII agresivo** ([sentry-init.js](../../sentry-init.js)) — DNI/NIE/NHC/keys redactados antes de salir del cliente.
- ✅ **HONcode dossier** con declaración de fuentes (`docs/honcode-dossier.md`).

---

## 3. Plan de cierre sugerido (5 días laborables)

| Día | Acción | Responsable |
|---|---|---|
| 1 | H-01 App Check (crear reCAPTCHA + flip) | Carlos GUI · Claude PR |
| 1 | H-04 banner cookies + opt-out GA4 | Claude PR |
| 1 | H-03 actualizar privacidad.html post-EIPD | Claude PR |
| 2 | H-08 actualizar RAT con nuevas colecciones | Claude PR |
| 2 | H-07 derechos-rgpd.html con formulario | Claude PR |
| 3 | H-05 modal ScanIA paciente real | Claude PR |
| 3 | H-06 HSTS investigar + aplicar si procede | Carlos + Claude |
| 4 | H-02 OpenRouter DPA — escribir solicitud | Carlos |
| 4 | H-02 DeepSeek DPA — escribir solicitud | Carlos |
| 4 | H-09 + H-10 + H-11 (higiene doc) | Claude PR |
| 5 | Re-auditoría con este mismo doc, marcando ✅ resueltos | Claude |

---

## 4. Cómo usar este informe con `alexlegal.ai`

Si quieres validar con IA legal externa, sube **únicamente este documento** (no el repo). Pregúntale:

1. *"Mira esta auditoría legal interna de un proyecto SaaS sanitario español con base en RGPD/AI Act/MDR. Para cada 🔴 dame jurisprudencia AEPD/EDPB de los últimos 24 meses con sanciones equivalentes."*
2. *"Para H-02 (DPAs pendientes con DeepSeek y OpenRouter), redacta el correo de solicitud DPA + SCC anexo en inglés legal."*
3. *"Para H-04 (banner cookies), redacta el texto del banner en español ajustado a AEPD Cookies Guide 2024."*
4. *"¿Hay algún hallazgo aquí cubierto por el régimen sandbox AESIA del MIC? ¿Vale la pena solicitar?"*
5. *"Cobertura del seguro RC profesional para autónomo IT que opera plataforma sanitaria formativa: ¿qué cláusula me protege ante el escenario H-01?"*

Llevar el informe ya estructurado le ahorra a la IA legal el descubrimiento. La salida será 4-5x mejor que pedir "audita mi web".

---

## 5. Cómo usar este informe con un letrado humano

Adjuntar tres archivos:
1. Este documento (auditoría).
2. `docs/legal/rgpd-eipd.md` (EIPD).
3. `docs/legal/dpa-template.md` (DPAs).

Pedir al letrado revisión sobre:
- 🔴 H-02 (DPAs): redactar/firmar contratos específicos.
- 🟡 H-07 (derechos del interesado): validar formulario.
- 🟢 H-11 (notificación brecha): validar protocolo.

Resto puede ir cerrado por Carlos + Claude.

---

**Próxima auditoría sugerida:** 2026-07-28 (3 meses) o tras cualquier de:
- Nuevo proveedor IA en routing.ts.
- Apertura del módulo a usuarios fuera del Área II.
- Inclusión real de datos de paciente identificable.
- Llegada de inspección AEPD o requerimiento institucional.
