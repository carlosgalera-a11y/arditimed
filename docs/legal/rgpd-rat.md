# Registro de Actividades de Tratamiento (RAT) · Cartagenaeste

**Reglamento General de Protección de Datos (UE) 2016/679 · Art. 30**
**LOPDGDD 3/2018 · Art. 31**

---

| Campo | Valor |
|---|---|
| Responsable del tratamiento | Carlos Galera Román (persona física, autónomo) |
| NIF | (omitido en doc público) |
| Domicilio | (omitido en doc público) |
| Contacto RGPD | carlosgalera2roman@gmail.com |
| Delegado de Protección de Datos (DPD/DPO) | No designado (no obligatorio según art. 37 RGPD; ver §X) |
| Fecha actualización | 2026-04-28 (revisión post-auditoría auditoria-2026-04-28.md) |

---

## Actividad de tratamiento 1 · Cuentas de usuario profesional

| Campo | Valor |
|---|---|
| **Finalidad** | Autenticación de profesionales sanitarios para uso de la plataforma formativa |
| **Base jurídica** | Consentimiento (art. 6.1.a RGPD) — alta voluntaria por el profesional |
| **Categorías de interesados** | Profesionales sanitarios (médicos, enfermería, MIR/EIR, residentes) |
| **Categorías de datos** | Email, nombre visible, foto Google (si Google sign-in), dominio del email, fecha de último acceso, UID anonimizado |
| **Categorías especiales** | No aplica |
| **Destinatarios** | Google LLC (Firebase Auth, encargado del tratamiento) |
| **Transferencias internacionales** | Posibles a EE.UU. bajo Cláusulas Contractuales Tipo (SCC) y Data Privacy Framework — Google Cloud Platform |
| **Plazo de conservación** | Mientras el usuario mantenga la cuenta activa + 12 meses tras última actividad. Eliminación a petición. |
| **Medidas de seguridad técnicas** | Firebase Auth (OAuth Google + Email Link); App Check enforce; cifrado en tránsito (TLS 1.3) y reposo (AES-256) |
| **Medidas organizativas** | Acceso solo a Carlos Galera (admin); rules Firestore deny-by-default; audit log inmutable |

## Actividad de tratamiento 2 · Casos clínicos formativos

| Campo | Valor |
|---|---|
| **Finalidad** | Almacenamiento de casos clínicos seudonimizados para fines docentes |
| **Base jurídica** | Interés legítimo (art. 6.1.f RGPD) — formación de profesionales sanitarios; consentimiento del autor del caso |
| **Categorías de interesados** | Pacientes (datos seudonimizados) cuyos casos son seleccionados como material formativo |
| **Categorías de datos** | Iniciales máx. 4 caracteres + número de cama + edad. **NO** se almacenan: DNI, NIE, NHC, nombre completo, dirección, teléfono, fecha exacta de nacimiento. |
| **Categorías especiales** | Datos de salud seudonimizados (art. 9.2.h y 9.2.j RGPD: tratamiento por profesional sanitario sujeto a secreto + investigación científica con garantías) |
| **Destinatarios** | Encargados de tratamiento: Google Cloud (Firestore EU), proveedores IA bajo contrato (DeepSeek, OpenRouter, Google Cloud Vertex AI) |
| **Transferencias internacionales** | DeepSeek vía OpenRouter (US/UE variable) — bajo SCC. Para EU-residency estricta: Gemini directo o Mistral directo. |
| **Plazo de conservación** | TTL 365 días sobre `cases/` colección. Audit log: 1 año. |
| **Medidas de seguridad técnicas** | Pseudonimización en origen (validador rechaza PII); cifrado en tránsito y reposo; no se replican casos a sistemas con identificación. |
| **Medidas organizativas** | Solo profesionales autenticados pueden leer sus propios casos; admin solo ve agregados; audit log de cualquier acceso. |

## Actividad de tratamiento 3 · Peticiones a IA (askAi)

| Campo | Valor |
|---|---|
| **Finalidad** | Procesar consultas formativas con IA externa para generar respuestas educativas |
| **Base jurídica** | Consentimiento implícito al usar la función + interés legítimo formativo |
| **Categorías de interesados** | Profesional sanitario emisor del prompt; pacientes solo si el profesional incluye iniciales (caso seudonimizado) |
| **Categorías de datos** | Texto del prompt (validado contra PII), respuesta de IA, hash del prompt para cache, metadatos (modelo, latencia, tokens, coste) |
| **Categorías especiales** | Posibles datos de salud seudonimizados si el profesional incluye contexto clínico |
| **Destinatarios** | Encargados subcontratados: DeepSeek (CN/US), OpenRouter (US), Google Cloud Vertex AI (UE), Mistral AI (FR), Anthropic (UE) |
| **Transferencias internacionales** | DeepSeek a CN; OpenRouter routing variable. Mitigación: configurar GEMINI_API_KEY directo si EU-residency es contractualmente requerida. |
| **Plazo de conservación** | Audit `aiRequests/` 180 días; cache `aiCache/` 7 días; quotas `quotas/{date}` 90 días. TTL automático. |
| **Medidas de seguridad técnicas** | App Check; rate limit por IP; cuota diaria por usuario; validador anti-PII; secrets en Google Secret Manager; logs sin texto del prompt (solo hash) |
| **Medidas organizativas** | DPA pendiente firma con DeepSeek y OpenRouter; SCC vigentes con Google Cloud y Mistral por adhesión a sus templates oficiales |

## Actividad de tratamiento 4 · Auditoría y métricas

| Campo | Valor |
|---|---|
| **Finalidad** | Cumplimiento legal (RGPD art. 30, AI Act art. 12), prevención de abuso, soporte a usuarios, métricas de calidad |
| **Base jurídica** | Obligación legal (art. 6.1.c) + interés legítimo (art. 6.1.f) |
| **Categorías de interesados** | Profesionales sanitarios (UID anonimizado) |
| **Categorías de datos** | UID, acción realizada, timestamp, IP truncada, tipo de IA invocada, hash del prompt, NO el contenido |
| **Categorías especiales** | No |
| **Destinatarios** | Solo Carlos Galera (admin); Google Cloud Logging |
| **Transferencias internacionales** | Cloud Logging europe-west1 (UE) |
| **Plazo de conservación** | Audit log 1 año (TTL); Cloud Logging 30 días (configurable) |
| **Medidas de seguridad técnicas** | Audit log inmutable (rules deny update/delete); cifrado |
| **Medidas organizativas** | Solo el admin puede leerlo |

## Actividad de tratamiento 5 · Comunicación con usuarios

| Campo | Valor |
|---|---|
| **Finalidad** | Notificaciones de servicio (alertas de cuota, mantenimiento, actualizaciones) |
| **Base jurídica** | Ejecución de contrato (art. 6.1.b) — relación de prestación del servicio |
| **Categorías de interesados** | Profesionales sanitarios registrados |
| **Categorías de datos** | Email |
| **Plazo de conservación** | Igual a actividad 1 |
| **Destinatarios** | Firebase Auth (envío de magic link y verificación) |
| **Transferencias internacionales** | Google LLC bajo SCC + DPF |

## Actividad de tratamiento 6 · EvidenciaIA · búsqueda bibliográfica con síntesis

| Campo | Valor |
|---|---|
| **Finalidad** | Apoyo a la lectura crítica formativa: el profesional formula una pregunta clínica (PICO), el sistema busca en PubMed/Europe PMC/AEMPS/OpenAlex y devuelve una síntesis IA con citas verificadas |
| **Base jurídica** | Interés legítimo (art. 6.1.f) — formación continua del profesional |
| **Categorías de interesados** | Profesionales sanitarios autenticados |
| **Categorías de datos** | UID, email, texto de la pregunta clínica (sanitizado: rechaza DNI/NIE/fecha/teléfono), filtros aplicados, abstracts recuperados (PMID), texto sintetizado, ratio de citas verificadas |
| **Categorías especiales** | El texto de la pregunta puede contener menciones a categorías clínicas (no a paciente identificable — los safeguards rechazan PII) |
| **Destinatarios** | Google (Cloud Function europe-west1), DeepSeek o Gemini (proveedor IA), Sentry (errores) |
| **Transferencias internacionales** | DeepSeek/OpenRouter cuando aplica (US/CN) bajo SCC; Gemini en EU |
| **Plazo de conservación** | `evidencia_consultas`: 24 meses (auditoría AI Act art. 12). `evidenciaCache`: 24 horas TTL automático. `evidencia_feedback`: 24 meses |
| **Medidas técnicas** | Validador anti-PII server-side (`safeguards.ts`); flag `ai_act_disclaimer_shown:true` obligatorio; verificador de citas inventadas; rate limit 30 req/min/IP, cuota 50/día/usuario |
| **Medidas organizativas** | Disclaimer Art. 50 AI Act visible y aceptación obligatoria; logging exhaustivo para auditoría; refuse de consultas diagnósticas/terapéuticas individuales |

## Actividad de tratamiento 7 · Centros de Salud · directorio y foro privado

| Campo | Valor |
|---|---|
| **Finalidad** | Mantenimiento del directorio interconectado de los 14 centros del Área II (info, horarios, recursos) + foro privado de preguntas/respuestas restringido a miembros de cada centro (residentes ↔ adjuntos) |
| **Base jurídica** | Interés legítimo (art. 6.1.f) — formación interna del equipo del centro |
| **Categorías de interesados** | Profesionales del Área II Cartagena con código de invitación canjeado |
| **Categorías de datos** | UID, email, nombre, rol asignado en `csRoles[centroId]` (`miembro/redactor/coordinador`); preguntas y respuestas del foro con autoría visible para los miembros del centro |
| **Categorías especiales** | Texto formativo que puede mencionar patología (sin identificar paciente — bloqueo regex DNI/NIE en cliente) |
| **Destinatarios** | Solo miembros del mismo centro (regla Firestore `csEsMiembro(cid)` con `exists()` + `get()`) |
| **Transferencias internacionales** | Google Cloud Firestore EU |
| **Plazo de conservación** | Mientras el usuario sea miembro del centro; al revocar el rol, sus contribuciones permanecen como aportación histórica salvo solicitud de supresión |
| **Códigos de invitación** | `cs_invites/{codigo}`: caducidad 1-30 días, un solo uso, marca `usadoPor` + `fechaUso`. Generados solo por admin |
| **Medidas técnicas** | Reglas Firestore explícitas (catch-all wildcard removido tras hallazgo en PR #121); validación cliente DNI/NIE; transacción atómica en canje |

## Actividad de tratamiento 8 · Cola de correo (notificaciones de aprobación y foro)

| Campo | Valor |
|---|---|
| **Finalidad** | Encolar correos transaccionales: (a) aviso al proponente cuando se aprueba su contenido; (b) aviso al autor cuando le responden en el foro privado |
| **Base jurídica** | Ejecución de contrato (art. 6.1.b) — funcionalidad esperada por el usuario |
| **Categorías de interesados** | Profesionales registrados |
| **Categorías de datos** | Email destino, asunto, cuerpo del mensaje, metadata de origen (qué propuesta/pregunta) |
| **Destinatarios** | Firebase Trigger Email Extension (cuando se instale) → SMTP del proveedor configurado |
| **Plazo de conservación** | Hasta despacho exitoso. Cron mensual a futuro borra `delivery.state == SUCCESS` >30 días |
| **Medidas técnicas** | Reglas Firestore: `create` solo `canModerate()` o trigger Cloud Function; `read/update/delete` solo admin |

## Actividad de tratamiento 9 · Boletín diario MegaCuaderno (digest agregado)

| Campo | Valor |
|---|---|
| **Finalidad** | Generar resumen agregado por categoría de las aportaciones aprobadas en las últimas 24h, para mostrar como "Novedades del día" en el panel de profesionales |
| **Base jurídica** | Interés legítimo (art. 6.1.f) — formación continua |
| **Categorías de interesados** | Sin interesado individual: el digest agrega títulos + descripciones de aportaciones, no datos personales |
| **Categorías de datos** | Títulos de documentos, descripciones, conteo agregado por categoría |
| **Destinatarios** | DeepSeek (síntesis IA) |
| **Plazo de conservación** | 30 días por documento `megacuaderno_digests/{YYYY-MM-DD}` |
| **Medidas técnicas** | Cron Cloud Function 06:45 Madrid; sin contenido personal en el prompt; reglas Firestore read-only para signedIn, write solo cron |

## Actividad de tratamiento 10 · Solicitudes de derechos del interesado

| Campo | Valor |
|---|---|
| **Finalidad** | Recoger solicitudes de ejercicio de derechos RGPD (acceso, rectificación, supresión, limitación, oposición, portabilidad) y trazarlas hasta su resolución |
| **Base jurídica** | Cumplimiento obligación legal (art. 6.1.c) — RGPD arts. 15-22 |
| **Categorías de interesados** | Cualquier titular de datos que ejerce su derecho |
| **Categorías de datos** | Email, derecho ejercido, descripción de la petición, fecha, estado (pendiente / resuelto / rechazado), email/UID del solicitante |
| **Destinatarios** | Carlos Galera Román (responsable). En el futuro, DPO si se designa |
| **Plazo de conservación** | 5 años desde resolución (acreditación de cumplimiento ante AEPD) |
| **Medidas técnicas** | Formulario público en `derechos-rgpd.html` (PR H-07); reglas Firestore: `create` por cualquier signedIn limitado a sus propios datos; `read/update` solo admin; encolado de email de confirmación al solicitante |

---

## Encargados del tratamiento

| Encargado | Función | Contrato | Ubicación |
|---|---|---|---|
| Google LLC (Firebase + Cloud) | Auth, Firestore, Storage, Functions, Logging | Términos de servicio Firebase + DPA estándar Google Cloud (firmado por adhesión) | EU (datos en europe-west1) + US para metadatos |
| OpenRouter | Routing de modelos IA | DPA estándar OpenRouter — pendiente firma explícita | US |
| DeepSeek | Modelo IA primario para clinical_case y educational | Términos de servicio API · DPA pendiente | CN |
| Anthropic | Reservado (Claude Haiku no usado por defecto) | DPA estándar Anthropic | EU/US |
| Mistral AI | Reservado (fallback EU-residency) | DPA estándar Mistral | EU |
| Sentry.io | Observabilidad de errores | DPA estándar Sentry (firmado por adhesión) | EU (Frankfurt) |

⚠️ Para uso clínico real con datos seudonimizados se debe **firmar DPA explícito** con DeepSeek y OpenRouter, o migrar a providers EU-only con DPA confirmado.

---

## Derechos de los interesados

Procedimiento general:
1. Solicitud por email a `carlosgalera2roman@gmail.com` con asunto "RGPD - [Derecho]".
2. Verificación de identidad (vía email del que se registró + UID).
3. Resolución en plazo máximo de 1 mes (prorrogable a 3 si compleja).

| Derecho | Procedimiento técnico |
|---|---|
| Acceso (art. 15) | Export del Firestore vía Cloud Function admin a JSON |
| Rectificación (art. 16) | Edición directa en Firestore por el admin |
| Supresión (art. 17 · "derecho al olvido") | `firebase auth:delete <uid>` + script borrado de subcolecciones |
| Limitación (art. 18) | Flag `restricted: true` en `users/{uid}` que el frontend respeta |
| Portabilidad (art. 20) | Export JSON a petición |
| Oposición (art. 21) | Cierre de cuenta = cesa el tratamiento |
| Decisiones automatizadas (art. 22) | No aplica — no hay decisiones automatizadas con efectos jurídicos |

Plazo respuesta: **1 mes** (prorrogable a 3).

## Notificación de brechas de seguridad

- **Detección**: Cloud Monitoring + Sentry + revisión semanal de audit log.
- **Plazo a la AEPD**: 72 h desde detección (RGPD art. 33).
- **Plazo a interesados**: sin demora indebida si alto riesgo (RGPD art. 34).
- **Documentación interna**: `docs/incident-log/YYYY-MM-DD-<slug>.md`.

## Designación del DPO

**Decisión actual**: NO designado.

**Justificación legal** (RGPD art. 37):
- (a) **No es autoridad pública**.
- (b) **No realiza observación a gran escala** de interesados (sistema cerrado a profesionales registrados).
- (c) **Categorías especiales no son la actividad principal "a gran escala"**: el tratamiento de datos de salud seudonimizados es accesorio a la formación, no es el core business.

**Consideraciones para reevaluación**:
- Al cruzar 5.000 MAU se debe reevaluar si "a gran escala" aplica.
- Si se firma con la primera institución sanitaria que requiera contractualmente DPO → designar DPO externo (servicio especializado, ~80–120 €/mes).
- Si se cambia posicionamiento a "asistente diagnóstico" → DPO obligatorio.

Próxima revisión: 2026-12-31 o al alcanzar 1.000 MAU (lo que ocurra antes).

---

*Carlos Galera Román · Cartagenaeste © 2026 · LPI 00765-03096622*
