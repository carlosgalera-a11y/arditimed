# Dossier HONcode · Cartagenaeste

**Documento de soporte a la solicitud de acreditación HONcode**
Versión 1.0 · 2026-04-23
Solicitante: Carlos Galera Román · carlosgalera2roman@gmail.com
Web: https://area2cartagena.es
Idioma principal: español · secundario inglés (README técnico)

---

## 0. Resumen ejecutivo

Cartagenaeste es una **plataforma formativa y organizador personal de guardia** dirigida a profesionales sanitarios (medicina, enfermería) y pacientes, desarrollada y mantenida por Carlos Galera Román, MFyC (residente R4 de Medicina Familiar y Comunitaria en el H.G.U. Santa Lucía, Área II Cartagena, Servicio Murciano de Salud). Actualmente en uso clínico activo en Urgencias de dicho hospital.

La plataforma es de acceso libre en su contenido público, no recopila datos identificativos de pacientes, y cumple RGPD, LOPDGDD, EU AI Act 2024/1689 y el articulado clínico correspondiente. Se solicita la acreditación HONcode para los 8 principios éticos como garantía adicional de calidad de la información sanitaria publicada.

---

## 1. Principio 1 · Autoría (Authority)

> *Cualquier consejo médico ofrecido será dado por profesionales médicos cualificados, a menos que se explicite claramente que una consejo ofrecido es de un no-médico o de una organización.*

### Identificación del autor
- **Nombre:** Carlos Galera Román
- **Titulación:** Licenciado en Medicina (España)
- **Especialidad en formación:** Medicina Familiar y Comunitaria (R4)
- **Centro:** Hospital General Universitario Santa Lucía · Área II Cartagena · Servicio Murciano de Salud
- **Colegiación:** Colegio Oficial de Médicos de la Región de Murcia (nº pendiente de incorporación pública al dossier)
- **Contacto profesional:** carlosgalera2roman@gmail.com

### Credenciales verificables
- Registro de Propiedad Intelectual: **00765-03096622** (Art. 51 RDL 1/1996 declarado)
- Proyecto en uso clínico activo y verificable en la Unidad de Urgencias del H.G.U. Santa Lucía.
- Repositorio público con historial completo: https://github.com/carlosgalera-a11y/Cartagenaeste

### Revisión editorial
El contenido formativo orientado a profesionales se revisa internamente por el autor antes de publicación. Los protocolos incorporados (pej. PROA, ATLS, guías SEN) son **documentos oficiales de sociedades científicas o del SMS**, no redacción propia. La app marca con claridad cuando cita contenido de terceros vs. contenido propio (fichas, casos, calculadoras).

Cualquier consejo de no-médico (pej. contenido patronal o administrativo) va marcado como "contenido administrativo, no clínico" en las secciones correspondientes.

### Página pública de autoría
https://area2cartagena.es/about.html

---

## 2. Principio 2 · Complementariedad (Complementarity)

> *La información proporcionada en este sitio está diseñada para apoyar, no reemplazar, la relación existente entre un paciente/visitante y su médico.*

### Disclaimer permanente
En **todas las páginas** de la plataforma se muestra, vía `footer-global.js`:

> **Plataforma formativa.** No diagnóstica. No sustituye al juicio clínico. Datos seudonimizados con fines docentes conforme a RGPD y LOPDGDD.

El disclaimer aparece con `border-left: 3px solid #f59e0b` para garantizar visibilidad.

### Contenido orientado a profesionales
- Secciones marcadas: Urgencias, Panel Profesional, Plantillas, Notebook, Docencia.
- Requieren autenticación (Firebase Auth · Google Sign-In) para acceso a funciones de IA.
- Las herramientas de IA llevan aviso explícito *"Herramienta docente. No sustituye lectura radiológica / juicio clínico"* en los prompts enviados al modelo.

### Contenido orientado a pacientes
- Secciones: Consejos de salud, Prepara tu consulta, Recursos comunitarios, Fichas de información al paciente.
- Cada ficha incluye: "Esta información no sustituye la consulta con tu médico. Si tus síntomas empeoran o tienes dudas, acude a tu centro de salud o a Urgencias."

### Página de política de contenido
https://area2cartagena.es/aviso-legal.html

---

## 3. Principio 3 · Confidencialidad (Confidentiality)

> *La información personal y médica del paciente/visitante del sitio web es tratada confidencialmente.*

### No se almacenan datos identificativos
- El módulo de casos docentes almacena **como máximo 4 iniciales + edad + número de cama**. Nunca DNI, NIE, NHC, nombre completo, dirección ni teléfono.
- Regla Firestore que bloquea activamente DNI/NIE: [`firestore.rules:17-21`](../firestore.rules).
- Las llamadas a IA (`askAi` Cloud Function, región europe-west1) **no guardan el texto del prompt ni la respuesta**. Solo metadatos: tipo, modelo, latencia, tokens, coste estimado, hash del prompt (SHA-256 truncado).

### Residencia de datos
- **Toda la infraestructura Firebase en europe-west1** (Bélgica): Firestore, Cloud Functions, Storage, Auth.
- Proveedores de IA:
  - DeepSeek / Qwen / Mistral / Gemini vía Cloud Function en europe-west1.
  - Gemini directo: europe-west1 disponible.
  - DashScope Intl (Qwen VL): no garantiza UE; la política de la plataforma prioriza Gemini directo UE para `clinical_case` vía `modelOverride`.

### Seguridad técnica
- **App Check enforce** activo en Firestore + Functions + Storage.
- **Firestore Rules** con control granular por rol y campo (ver `firestore.rules`).
- Backups diarios automatizados a bucket UE (`dailyBackup` Cloud Function, `scheduledJobs.ts`).
- Rotación de claves documentada en `docs/s1.2-rotacion-claves-carlos.md`.
- Auditoría de seguridad realizada 2026-04-21, sin hallazgos críticos pendientes (`docs/security-audit-2026-04-21.md`).

### Derechos ARCO+
- **Acceso / rectificación / cancelación / oposición / portabilidad / limitación**: el usuario puede solicitar por email a `carlosgalera2roman@gmail.com`.
- Función *Eliminar mi cuenta* autoservicio: https://area2cartagena.es/eliminar-cuenta.html

### Política de privacidad completa
https://area2cartagena.es/privacidad.html

---

## 4. Principio 4 · Atribución (Attribution)

> *Cuando sea apropiado, la información contenida en este sitio estará apoyada en referencias claras a los datos fuente y, si fuera posible, mostrará enlaces específicos a esos datos.*

### Página pública de fuentes
https://area2cartagena.es/fuentes-recursos.html

### Fuentes clínicas de referencia
- **Guías clínicas**: SEMFYC, semFYC+Fisterra, SEN, SEC, SEMES, GEMA (Asma), GOLD (EPOC), NICE, UpToDate (referenciado), Fisterra.
- **Organismos oficiales**: Ministerio de Sanidad, Consejería de Sanidad Región de Murcia, AEMPS (Agencia Española de Medicamentos), Sociedad Murciana de Medicina Familiar.
- **Protocolos institucionales**: Protocolos de la Unidad de Urgencias del H.G.U. Santa Lucía, Plan PROA Murcia, protocolo 061.

### Datos primarios y datasets
- PTB-XL (PhysioNet) para ECG
- MURA (Stanford) para Rx ósea
- ISIC Archive para dermatología
- CheXpert, MIMIC-CXR, PadChest, VinDr-CXR para Rx tórax
- DeepLesion (NIH), AbdomenCT-1K para abdomen
- Todos con enlace directo a la fuente original desde la ficha del modelo.

### Fechas de revisión
Cada documento formativo lleva `<meta name="last-reviewed" content="YYYY-MM-DD">` (actualmente `2026-04-23` para todo el set). Cadencia: revisión semestral (enero y julio).

### Referencias bibliográficas
Las sesiones clínicas incluidas (PDFs en `/docs/`) mantienen su autoría y bibliografía original. La plataforma indica claramente autor y fuente de cada sesión.

---

## 5. Principio 5 · Justificabilidad (Justifiability)

> *Toda afirmación sobre los beneficios o el rendimiento de un tratamiento, producto o servicio será apoyada con evidencias adecuadas y equilibradas siguiendo el esquema del principio 4.*

### No hay promociones comerciales
- **Cero marcas comerciales farma** en todo el código y contenido (ver CLAUDE.md §5): siempre **clase terapéutica + principio activo**.
- No se publica publicidad de terceros ni enlaces afiliados.
- No hay recomendaciones de dispositivos médicos ni productos sanitarios concretos.

### Afirmaciones sobre beneficios
- En contenido formativo (pej. calculadoras, escalas) se indica el estudio de validación y el rango de confianza si aplica.
- En herramientas de IA (Scan IA) se muestra explícitamente:
  - Modelo usado (`xresnet1d101`, `ConvNeXt-Base`, etc.) + dataset de entrenamiento.
  - Benchmark publicado si aplica.
  - Nota de limitaciones: *"El modelo real requiere señal digital, no foto de papel"* (ECG), *"No existe equivalente a TorchXRayVision para Rx simple de abdomen"*, etc.

### Equilibrio
- Se muestran alternativas terapéuticas cuando aplica, no un único fármaco.
- Los protocolos de urgencias incluyen contraindicaciones, efectos adversos y dosis de rescate.

---

## 6. Principio 6 · Transparencia editorial (Transparency)

> *Los diseñadores del sitio web se esforzarán en proporcionar la información de la forma más clara posible y proporcionarán una dirección de contacto.*

### Contacto visible
- Email: `carlosgalera2roman@gmail.com` en footer global, página About y en cada página de transparencia/privacidad.
- Formulario de sugerencias: dentro de la app (colección Firestore `sugerencias`).

### Accesibilidad
- Diseño responsive móvil-primero (usado mayoritariamente en móvil en guardias).
- Contraste comprobado y corregido en 2026-04-22 (PR #63 tras feedback de usuario).
- Soporte `prefers-color-scheme`: modo claro y oscuro automáticos.
- Semántica HTML (roles aria, headers, landmarks).

### Contacto técnico
- Reporte de errores: https://github.com/carlosgalera-a11y/Cartagenaeste/issues
- Política de seguridad: `docs/security-audit-*.md`

---

## 7. Principio 7 · Financiación y patrocinio (Financial disclosure)

> *Se identificará el apoyo económico al sitio de forma clara, incluyendo las identidades de las organizaciones comerciales y no comerciales que hayan contribuido con fondos, servicios o materiales para el sitio.*

### Página pública de financiación
https://area2cartagena.es/financiacion.html
https://area2cartagena.es/transparencia.html

### Estado actual (2026-04-23)
| Fuente | Estado | Importe | Concepto |
|---|---|---|---|
| Autofinanciación del autor | Activa | 100% | Dominio, Firebase, APIs de IA, desarrollo |
| Subvenciones públicas | Ninguna | — | — |
| Contratación por centro sanitario | Propuesta en curso | — | Servicio de Urgencias del H.G.U. Santa Lucía (Área II, SMS) |
| Patrocinio industria farma | Ninguno | — | Espacio reservado con condiciones públicas (§3 de /transparencia.html) |
| Subvenciones colegios profesionales | Ninguna | — | — |

### Compromiso de actualización
Cualquier acuerdo comercial o de patrocinio se publica en `/transparencia.html` en un plazo máximo de **30 días desde la firma**, con entidad, objeto, importe y fecha.

### Ingresos del autor por esta plataforma
Ninguno a fecha de solicitud. Se prevé ingresar contraprestación por contratación con el SMS para el servicio de Urgencias HSL (pendiente de autorización ex-Ley 53/1984 si procede); en ese caso, los ingresos se destinan íntegramente a mantenimiento de infraestructura y desarrollo, no a distribución de beneficios.

---

## 8. Principio 8 · Política publicitaria (Advertising policy)

> *Si la publicidad es una fuente de ingresos del sitio, se dirá claramente. Se describirán brevemente los criterios seguidos para escoger a los anunciantes. El material publicitario será presentado de tal forma que sea fácilmente diferenciable del material creado por la institución que maneja el sitio.*

### Cartagenaeste NO acepta publicidad comercial directa
- No hay banners, adsense, anuncios de Google Ads, afiliación (Amazon, etc.) ni patrocinios display.
- No hay mención de marcas comerciales farma ni dispositivos.
- No hay redirección a webs de terceros con fines promocionales. Los enlaces externos (PhysioNet, guías clínicas, Colegios Oficiales) tienen **propósito exclusivamente informativo y/o educativo**.

### Excepción: patrocinio educativo futuro (reservado)
Como se detalla en §7 y en `/transparencia.html`, la plataforma puede aceptar en el futuro **patrocinio educativo independiente** de la industria farmacéutica bajo estas condiciones **no negociables**:

1. Código de Buenas Prácticas de Farmaindustria + EFPIA Disclosure Code.
2. Interlocución exclusiva con Medical Affairs, no con Comercial.
3. Fondos destinados a infraestructura y contenido formativo no promocional.
4. Línea editorial íntegramente bajo control del autor, sin revisión previa del patrocinador.
5. Sin marca comercial: clase terapéutica + principio activo.
6. Divulgación pública del acuerdo en `/transparencia.html` <30 días desde la firma.
7. El patrocinador no accede a datos de usuarios, logs ni métricas.

### Diferenciación del material patrocinado
Si en el futuro se publica material con patrocinio educativo, llevará:
- Etiqueta visible *"Contenido con patrocinio educativo de [Entidad]"* al inicio del artículo/sección.
- Color de borde diferenciado (`border-left: 4px solid var(--amber)`).
- Declaración al pie: *"El patrocinador no ha intervenido en la redacción ni revisión del contenido"*.

---

## 9. Medios técnicos de cumplimiento

### Infraestructura
- Frontend: vanilla JS modular, PWA (Service Worker v125).
- Hosting: GitHub Pages + dominio `area2cartagena.es` (HTTPS TLS 1.3).
- Backend: Firebase (Auth, Firestore, Functions, Storage, App Check), región europe-west1.
- Observabilidad: Sentry (errores), GA4 anonimizado (`G-JW29V64END`, anonymize_ip), Cloud Function `aggregateDailyMetrics` para métricas agregadas.

### Meta tags de compliance en todas las páginas
```html
<meta name="author" content="Carlos Galera Román, MFyC">
<meta name="medical-organization" content="H.G.U. Santa Lucía · Área II · Servicio Murciano de Salud">
<meta name="compliance" content="RGPD · EU AI Act 2024/1689 · LPI Art. 51">
<meta name="last-reviewed" content="2026-04-23">
```

### Otras acreditaciones (estado)
| Acreditación | Estado |
|---|---|
| HONcode | **En trámite** (esta solicitud) |
| Web Sanitaria Acreditada · COM Murcia | En trámite |
| Registro Propiedad Intelectual | ✅ Activo (00765-03096622) |
| RGPD + LOPDGDD | ✅ Autoacreditado (DPIA disponible) |
| EU AI Act 2024/1689 | ✅ Sistema documentado como de riesgo limitado |

---

## 10. Compromiso

El firmante se compromete a:
- Mantener la plataforma bajo los 8 principios HONcode mientras dure la acreditación.
- Mostrar el sello HONcode en el footer global tras recibir el certificado.
- Responder en <7 días laborables a cualquier auditoría o requerimiento de Health On the Net Foundation.
- Comunicar cambios estructurales (patrocinios, adquisiciones, cambio de titularidad) en <30 días.

Cartagena, 23 de abril de 2026
**Carlos Galera Román**
carlosgalera2roman@gmail.com
Registro Propiedad Intelectual 00765-03096622

---

## Anexos (entregados con la solicitud)
1. Copia del título de Licenciado en Medicina (PDF).
2. Certificado de residencia en curso MFyC (H.G.U. Santa Lucía).
3. Certificado de colegiación del Colegio Oficial de Médicos de Murcia.
4. Declaración responsable de inexistencia de conflictos de interés firmada (§5 de `/transparencia.html`).
5. Política de privacidad consolidada (PDF de `/privacidad.html`).
6. Capturas de pantalla de las secciones Quiénes somos / Financiación / Transparencia / Acreditaciones.
7. Informe de seguridad 2026-04-21 (`docs/security-audit-2026-04-21.md`).
