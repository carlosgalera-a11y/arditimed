# Plantilla de Data Processing Agreement (DPA) · Cartagenaeste

**Plantilla para acuerdos con clientes (B2B sanitario) que actúen como responsable del tratamiento cuando Cartagenaeste actúa como encargado.**

> Para los **encargados** que utiliza Cartagenaeste (Google, OpenRouter, DeepSeek, Sentry…), se firman los DPAs propios de cada proveedor o se adhiere a sus términos. Ver §5.

---

## ENCABEZADO

**Acuerdo de tratamiento de datos personales (DPA)**
**Conforme al Reglamento (UE) 2016/679 (RGPD) art. 28**

Entre:

- **EL RESPONSABLE**: [Razón social del cliente · NIF · Domicilio · Representante]
- **EL ENCARGADO**: Carlos Galera Román · NIF [omitido aquí] · [Domicilio] · titular de Cartagenaeste (RPI 00765-03096622)

Ambas partes reconocen mutuamente capacidad legal y suscriben el presente acuerdo.

---

## 1. Objeto

El Encargado tratará datos personales por cuenta del Responsable con la finalidad de prestar el servicio de la plataforma Cartagenaeste, en los términos del Anexo I.

## 2. Anexo I · Características del tratamiento

| Campo | Valor |
|---|---|
| Finalidad | Plataforma formativa para profesionales sanitarios con asistente IA |
| Naturaleza | Almacenamiento, consulta, generación de respuesta IA, audit log |
| Tipo de datos | Identificadores anonimizados (UID), email profesional, casos clínicos seudonimizados (iniciales 4 chars + edad + cama), prompts a IA |
| Categorías de interesados | Profesionales sanitarios autorizados; pacientes seudonimizados |
| Duración | Mientras dure la prestación del servicio + obligaciones de retención legal |

## 3. Obligaciones del Encargado (art. 28.3 RGPD)

El Encargado se compromete a:

1. **Tratar los datos solo siguiendo instrucciones documentadas del Responsable** (este DPA + las políticas de configuración del servicio).
2. **Garantizar la confidencialidad** de las personas autorizadas a tratar los datos (en este caso, el propio Encargado y las herramientas que delega).
3. **Adoptar medidas técnicas y organizativas apropiadas** según el art. 32 RGPD, descritas en el Anexo II.
4. **No subcontratar** sin autorización por escrito del Responsable. Subencargados ya autorizados al inicio del contrato:
   - Google LLC (Firebase / Google Cloud) — datos en EU (europe-west1)
   - OpenRouter (US) — routing de modelos IA
   - DeepSeek (CN/US) — modelo IA primario
   - Anthropic (UE/US) — modelo IA fallback opcional
   - Mistral AI (FR) — modelo IA fallback EU-residency
   - Google (Vertex AI EU) — modelo Gemini EU-residency
   - Sentry.io (Frankfurt, UE) — observabilidad
5. **Asistir al Responsable** para cumplir solicitudes de derechos de los interesados (acceso, rectificación, supresión, portabilidad, oposición, limitación). Plazo interno: 7 días naturales.
6. **Asistir en evaluaciones de impacto** (EIPD) y consultas previas a autoridad de control.
7. **Notificar brechas de seguridad** sin dilación indebida (max. 24h tras detección) a `[email del Responsable]`.
8. **Suprimir o devolver** los datos al Responsable al término del contrato salvo obligación legal de conservación.
9. **Poner a disposición del Responsable** la información necesaria para demostrar el cumplimiento, incluyendo auditorías razonables (max. 1/año, con preaviso de 30 días).

## 4. Anexo II · Medidas técnicas y organizativas

### Cifrado
- TLS 1.3 en tránsito (entre cliente, frontend, Firebase, Cloud Functions, providers IA).
- AES-256 en reposo (Google Cloud por defecto).
- Pseudonimización aplicada en origen (validador rechaza DNI/NIE/NHC/nombres).

### Control de acceso
- Firebase Auth con OAuth Google + Email link.
- App Check enforce (reCAPTCHA v3).
- Firestore rules deny-by-default; permisos por UID y rol.
- IAM Google Cloud con principle of least privilege.
- 2FA obligatorio para cuenta admin del Encargado.

### Resiliencia
- Backups diarios a Cloud Storage con lifecycle 365 días → Archive.
- Plan de recuperación documentado en `docs/runbook.md`.

### Seguridad operacional
- Audit log inmutable de toda escritura sensible.
- Cloud Monitoring + alertas configuradas.
- Sentry para errores con scrubbing PII.
- gitleaks en CI/CD.
- Branch protection + PR obligatorio en repos.

### Trazabilidad
- Audit log retenido 1 año.
- Logs de Cloud Functions retenidos 30 días.

## 5. Encargados subcontratados (DPAs vigentes)

El Responsable autoriza expresamente la subcontratación con los siguientes terceros, cada uno bajo su propio DPA:

| Subencargado | Datos tratados | DPA vigente | Ubicación | Cláusulas |
|---|---|---|---|---|
| Google LLC (Firebase + GCP) | Auth, datos en Firestore EU, logs | [DPA Google Cloud](https://cloud.google.com/terms/data-processing-addendum) (firmado por adhesión) + SCC + DPF | EU + transferencias residuales US bajo SCC | SCC 2021/914, DPF 2023 |
| OpenRouter | Texto del prompt + respuesta IA | [DPA OpenRouter](https://openrouter.ai/terms) — pendiente firma explícita | US | A negociar |
| DeepSeek | Texto del prompt + respuesta | DPA pendiente — usado vía OpenRouter por defecto | CN | A negociar o sustituir por EU-only |
| Sentry.io | Eventos de error con scrubbing | [DPA Sentry](https://sentry.io/legal/dpa/) | Frankfurt EU | SCC vigentes |
| Anthropic | Reservado, no usado por defecto | [DPA Anthropic](https://www.anthropic.com/legal/dpa) | EU | SCC + DPF |
| Mistral AI | Reservado fallback EU | [DPA Mistral](https://mistral.ai/terms/) | París, FR | UE intra-comunitario |

⚠️ Para el uso clínico real con el Responsable que firma este DPA, se debe **garantizar EU-residency contractual**: configurar `GEMINI_API_KEY` directo o `MISTRAL_API_KEY` directo y forzarlos como primarios para `clinical_case`. Por defecto (DeepSeek vía OpenRouter) **no se garantiza EU-residency**.

## 6. Transferencias internacionales

Si una parte del tratamiento implica transferencia fuera del EEE:
- **Google Cloud** transfiere metadatos a US bajo Cláusulas Contractuales Tipo (CCT/SCC) y Data Privacy Framework.
- **OpenRouter, Anthropic** transfieren a US bajo SCC.
- **DeepSeek** transfiere a CN — **se desaconseja** para datos clínicos seudonimizados sin garantías adicionales. El Responsable puede exigir su no uso configurando providers EU-only.

## 7. Duración y terminación

- Vigencia: igual al contrato principal de servicio.
- A la terminación: el Encargado, a elección del Responsable, suprimirá o devolverá todos los datos personales en plazo máximo de 30 días naturales, salvo obligación legal de conservación.

## 8. Auditoría

El Responsable podrá auditar el cumplimiento del Encargado:
- Frecuencia: máximo una vez al año (salvo indicio fundado de incumplimiento).
- Preaviso: 30 días naturales.
- Coste: a cargo del Responsable (auditoría propia o tercero).
- Alternativa: certificación reconocida (ISO 27001, SOC 2 Type II) cuando se obtenga.

## 9. Notificación de brechas

- Detección por el Encargado → notificación al Responsable en max. **24 horas**.
- Contenido: naturaleza de la brecha, categorías de datos, número aproximado de afectados, medidas adoptadas, posibles consecuencias.
- Plazo Responsable a AEPD: 72 h desde notificación del Encargado.

## 10. Responsabilidad

Cada parte responde de su incumplimiento. El Encargado no responde por los actos del Responsable que excedan instrucciones documentadas.

Limitación de responsabilidad del Encargado: hasta el importe anual facturado por el contrato principal en el año del incidente, salvo dolo o culpa grave.

## 11. Ley aplicable y jurisdicción

Ley española (LOPDGDD 3/2018) y RGPD. Tribunales del domicilio del Encargado, salvo norma imperativa que disponga otra cosa.

---

**Firmas**

| Responsable | Encargado |
|---|---|
| _______________________ | Carlos Galera Román |
| Cargo: | Cartagenaeste |
| Fecha: | Fecha: |

---

## Notas para el redactor

1. Antes de firmar, sustituir todos los `[corchetes]` con datos reales del Responsable.
2. Validar el Anexo II contra la versión más reciente del runbook técnico (`docs/runbook.md`).
3. Si el Responsable es una administración pública, añadir cláusulas LCSP correspondientes.
4. Si el Responsable opera en > 1 país UE, considerar la cláusula de "lead supervisory authority".

*Carlos Galera Román · Cartagenaeste © 2026 · LPI 00765-03096622*
