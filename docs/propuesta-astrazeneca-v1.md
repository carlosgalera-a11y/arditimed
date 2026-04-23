# Propuesta de patrocinio educativo independiente

**De:** Carlos Galera Román · Cartagenaeste · https://area2cartagena.es
**Para:** AstraZeneca Farmacéutica Spain, S.A. — **Departamento de Medical Affairs**
**Asunto:** Propuesta de patrocinio educativo independiente · Plataforma formativa Cartagenaeste · Área II Cartagena (SMS)
**Versión:** 1.0 · 2026-04-23
**Clasificación:** CONFIDENCIAL — propuesta preliminar. No distribuir sin consentimiento del autor.

> ⚠️ **Aviso**: Esta propuesta se dirige **exclusivamente a Medical Affairs**. **NO debe remitirse al departamento comercial ni de ventas**. Cualquier contacto iniciado por departamento comercial será redirigido a Medical Affairs o rechazado, conforme al Código de Buenas Prácticas de Farmaindustria y al EFPIA Disclosure Code.

---

## Índice

1. Resumen ejecutivo
2. Contexto clínico y necesidad
3. Descripción de la plataforma
4. Adecuación al interés público y formativo
5. Propuesta de patrocinio educativo
6. Contrapartida para el patrocinador
7. Garantías de independencia editorial
8. Condiciones y cláusulas innegociables
9. Marco normativo y cumplimiento
10. Calendario propuesto y entregables
11. Presupuesto orientativo
12. Contacto y siguientes pasos

---

## 1. Resumen ejecutivo

**Cartagenaeste** es una plataforma formativa y organizador personal de guardia en uso clínico activo en la Unidad de Urgencias del Hospital General Universitario Santa Lucía (Área II Cartagena · Servicio Murciano de Salud). Su autor es Carlos Galera Román, Licenciado en Medicina y residente R4 MFyC, con Registro de Propiedad Intelectual activo (00765-03096622).

Propongo un **acuerdo de patrocinio educativo independiente** dirigido al departamento de Medical Affairs de AstraZeneca, bajo los términos del Código de Buenas Prácticas de Farmaindustria y del EFPIA Disclosure Code, por un importe orientativo de **12.000 € – 24.000 €** anuales (desglose en §11), destinados íntegramente a:

1. Desarrollo de módulos formativos independientes en áreas terapéuticas afines (cardiovascular, respiratoria, oncología).
2. Mantenimiento de infraestructura y compliance (Firebase UE, auditorías, acreditaciones HONcode y Web Sanitaria Acreditada).
3. Programa de formación continuada para residentes del Área II (≈ 40 MIR/año).

La línea editorial se mantiene íntegramente bajo control del autor. El patrocinador **no revisa, aprueba ni modifica contenidos**. Todas las menciones de fármacos en los contenidos formativos continuarán siendo por **clase terapéutica + principio activo**, sin marca comercial.

El acuerdo se hará **público** en `https://area2cartagena.es/transparencia.html` en <30 días desde la firma, con entidad, objeto, importe y cláusulas.

---

## 2. Contexto clínico y necesidad

### 2.1 El Área II Cartagena

El Área II de Salud de Cartagena cubre una población de **≈ 275.000 habitantes** (Cartagena, La Unión, Fuente Álamo, parte de Mazarrón) y se articula en torno al HGU Santa Lucía (hospital de referencia) y una red de 17 centros de salud con medicina familiar y urgencias de atención primaria.

Características relevantes:
- Servicio de Urgencias con **>120.000 atenciones/año**.
- Unidad Docente MFyC con 40+ residentes en formación activa.
- Perfil poblacional con alta prevalencia de patología cardiovascular y respiratoria (corresponsable con el perfil turístico y laboral).

### 2.2 La carencia

Hoy el residente y el adjunto de guardia consultan:
- Protocolos institucionales en PDFs sueltos en la intranet.
- Vademécum general sin contextualización local.
- Guías de sociedades científicas en navegadores abiertos uno a uno.
- Informes clínicos redactados desde cero en cada guardia.

Esto genera: (a) **heterogeneidad asistencial** entre turnos, (b) **pérdida de tiempo** clínico-productivo, (c) **riesgos de prescripción** por consulta incompleta.

### 2.3 La solución

Cartagenaeste centraliza, en una PWA instalable en móvil y sobremesa:
- Protocolos institucionales del HSL.
- Vademécum contextualizado con interacciones, ajuste renal/hepático.
- Fichas de consulta rápida.
- Calculadoras clínicas validadas.
- Herramientas de IA (análisis de imagen, redacción de informes).
- Organizador personal de guardia (cuaderno clínico seudonimizado).

Todo ello cumpliendo RGPD, EU AI Act, sin publicidad ni marcas.

---

## 3. Descripción de la plataforma

### 3.1 Volumen y uso

| Métrica | Valor (estimación 2026-Q1) |
|---|---|
| Profesionales registrados | en fase temprana de adopción |
| Secciones públicas | 80+ páginas |
| Protocolos clínicos indexados | 132 |
| Calculadoras disponibles | 40+ |
| Cadena de IA | 5 proveedores (Gemini, DeepSeek, Qwen, Mistral, OpenRouter) |
| Cumplimiento | App Check enforce · cifrado en reposo · UE europe-west1 |

*Los datos de adopción serán auditables y reportados mensualmente al patrocinador sin datos personales, solo agregados.*

### 3.2 Arquitectura

- **Frontend**: PWA vanilla JS + Service Worker.
- **Backend**: Firebase (Auth, Firestore, Functions, Storage, App Check) en europe-west1.
- **IA**: Cloud Function `askAi` única, tráfico saliente enmascarado por el backend (el frontend nunca ve las API keys).
- **Observabilidad**: Sentry + GA4 anonimizado + métricas agregadas vía Cloud Function `aggregateDailyMetrics` (cron diario).

### 3.3 Acreditaciones y cumplimiento

| Acreditación | Estado | Valor para el patrocinador |
|---|---|---|
| RGPD + LOPDGDD | ✅ Autoacreditado | Ningún dato personal de paciente. No afecta a la responsabilidad del patrocinador. |
| EU AI Act 2024/1689 | ✅ Sistema documentado (riesgo limitado) | Uso de IA bajo marco europeo, trazabilidad completa. |
| Registro Propiedad Intelectual | ✅ 00765-03096622 | Titularidad clara, sin disputas. |
| HONcode | 🟡 En trámite | Sello ético reconocido internacionalmente. |
| Web Sanitaria Acreditada (ICOM Murcia) | 🟡 En trámite | Sello local de referencia profesional. |
| WIS Applauded | 🟡 Prevista | Acreditación internacional de Web Sanitaria. |

---

## 4. Adecuación al interés público y formativo

El Código de Buenas Prácticas de Farmaindustria (art. 11-13) permite el patrocinio educativo siempre que:

- El objeto sea **formativo o científico**, no promocional.
- El destinatario sea **profesional sanitario**.
- El patrocinio sea **proporcionado** y declarado públicamente.
- Exista **independencia editorial** del receptor.

Cartagenaeste cumple los cuatro puntos:

1. **Objeto formativo**: la plataforma es una herramienta docente de uso clínico en guardia y programa de formación continuada para residentes MFyC.
2. **Destinatarios profesionales**: las secciones con funciones de IA requieren autenticación médica. Las secciones de pacientes llevan disclaimer formativo y no diagnóstico.
3. **Patrocinio proporcionado**: presupuesto (§11) alineado con programas similares (jornadas, cursos online, congresos) de valor equivalente.
4. **Independencia editorial**: garantizada por contrato (§7-8).

---

## 5. Propuesta de patrocinio educativo

### 5.1 Opción A · Patrocinio general de plataforma (recomendada)

- Duración: **12 meses**, renovable por acuerdo previo con 90 días de antelación.
- Importe: **24.000 € + IVA** anuales (2.000 €/mes), pagaderos trimestralmente.
- Destino: infraestructura + acreditaciones + desarrollo de **3 módulos formativos nuevos** de elección del autor (no del patrocinador) en áreas clínicas afines al perfil del patrocinador (cardiovascular, respiratoria, oncología).
- Reporting: informe trimestral de uso agregado (sin datos personales) y progreso de módulos nuevos, exportado desde el Panel de administración (`aggregateDailyMetrics`).

### 5.2 Opción B · Patrocinio de una jornada formativa

- Evento: **I Jornada Formativa Cartagenaeste** — sesión presencial para residentes del Área II Cartagena + streaming para CS del Área.
- Duración del acuerdo: 1 evento.
- Importe: **6.000 € + IVA** (honorarios ponentes independientes, alquiler sala, material).
- Reconocimiento: "Con patrocinio educativo de AstraZeneca" en el pie del programa + en `/transparencia.html`.

### 5.3 Opción C · Patrocinio de módulo formativo específico

- Objeto: un módulo formativo concreto (ej.: *Manejo agudo de la insuficiencia cardíaca en urgencias de primer nivel*) redactado por el autor con revisión por un comité clínico independiente designado por el autor.
- Duración: única entrega + actualización a los 12 meses.
- Importe: **12.000 € + IVA** (redacción, revisión, edición, ilustración, integración).
- Contenido: **siempre por clase y principio activo**, sin marca comercial, con bibliografía primaria referenciada.

---

## 6. Contrapartida para el patrocinador

### Lo que **SÍ** obtiene el patrocinador

| Ítem | Detalle |
|---|---|
| **Reconocimiento público** | Mención en `/transparencia.html` + página de agradecimientos. En opciones B y C, mención en el pie del material formativo concreto. |
| **Reporting auditable** | Informes trimestrales de uso agregado (total llamadas, secciones accedidas, usuarios únicos, meses). Sin datos personales. Auditable via `metrics_snapshots` en Firestore. |
| **Alineación de marca** | Asociación con una plataforma ética, acreditada, local, en uso clínico real. |
| **Visibilidad en programa formativo** | Acceso como patrocinador a las convocatorias abiertas a residentes MFyC y MIR del Área II. |
| **Informe de impacto anual** | Entrega de un informe de impacto formativo con métricas, testimonios y bibliografía adicional generada. |

### Lo que **NO** obtiene el patrocinador

| Ítem | Motivo |
|---|---|
| ❌ Acceso a datos de usuarios | Violación RGPD + principio 3 HONcode. |
| ❌ Revisión previa de contenidos | Compromete la independencia editorial. |
| ❌ Priorización de fármacos/productos | Contenido siempre por clase y principio activo. |
| ❌ Publicidad display/banners | Principio 8 HONcode + política interna. |
| ❌ Redirección a webs comerciales | Política de enlaces: solo guías clínicas oficiales. |
| ❌ Listas de correo de usuarios | RGPD + consentimiento explícito ausente. |
| ❌ Uso del logotipo Cartagenaeste en material propio del patrocinador sin autorización escrita | Protección de marca. |
| ❌ Coparticipación en el diseño de eventos formativos | Independencia editorial. |

---

## 7. Garantías de independencia editorial

1. **Comité editorial único**: el autor es la única autoridad editorial sobre el contenido. Puede consultar a pares clínicos, pero la decisión final es suya.
2. **Prohibición de intercambio de contenidos previo**: el patrocinador no recibe borradores ni pruebas previas a la publicación.
3. **Auditoría externa independiente**: si cualquiera de las partes lo solicita, se podrá encargar una auditoría externa del contenido a una tercera parte sanitaria independiente (sociedad científica, hospital docente), costeada por quien solicite la auditoría.
4. **Retirada de contenido**: si el patrocinador considera que un contenido específico es perjudicial para su imagen, puede solicitar **la retirada de la mención del patrocinio** (no del contenido) en ese módulo concreto. El autor se reserva el derecho a mantener publicado el contenido sin patrocinio.
5. **Cláusula de rescisión limpia**: cualquiera de las partes puede rescindir el acuerdo con 60 días de preaviso. Los fondos ya entregados por trimestres completados no se devuelven. Los contenidos ya publicados permanecen publicados, con la mención "previamente con patrocinio educativo de AstraZeneca hasta [FECHA]".

---

## 8. Condiciones y cláusulas innegociables

### 8.1 Editorial
- **Ninguna marca comercial farma** en el contenido. Solo clase + principio activo.
- **Ninguna comparativa** de producto entre fármacos de mismo grupo si no se ha publicado en guías clínicas oficiales o metaanálisis con peer review.
- **Ningún enlace** directo a productos, fichas técnicas comerciales o material promocional del patrocinador.

### 8.2 Cumplimiento
- **Transparencia pública obligatoria**: el acuerdo, con importe y objeto, aparece en `/transparencia.html` <30 días desde la firma.
- **Declaración del autor**: el autor declarará el patrocinio en ponencias, publicaciones y actividad docente conforme al Código de Buenas Prácticas.
- **Cumplimiento EFPIA Disclosure**: el patrocinador se compromete a incluir el acuerdo en su informe anual de transferencias de valor (o equivalente) conforme al EFPIA Disclosure Code.

### 8.3 Datos
- El patrocinador **no accede** a datos técnicos, logs, configuraciones, claves API, infraestructura ni métricas no agregadas.
- Los reportes son siempre **agregados mensuales**, sin posibilidad de identificar individuos.

### 8.4 Exclusividad
- **NO** se ofrece exclusividad en un área terapéutica. El autor puede firmar acuerdos similares con otros laboratorios siempre que no haya conflicto con este, y con el mismo nivel de transparencia.

---

## 9. Marco normativo y cumplimiento

- **Código de Buenas Prácticas de la Industria Farmacéutica (Farmaindustria)** · edición vigente.
- **EFPIA Disclosure Code**: transferencias de valor a profesionales sanitarios y organizaciones sanitarias.
- **Ley 29/2006** de garantías y uso racional de los medicamentos y productos sanitarios.
- **Real Decreto 1416/1994** sobre publicidad de medicamentos de uso humano (inaplicable porque no hay publicidad).
- **RGPD + LOPDGDD** · independientes del patrocinador porque no hay transferencia de datos.
- **Ley 41/2002** de autonomía del paciente.
- **EU AI Act 2024/1689** · sistema de riesgo limitado, documentado.
- **Ley 53/1984** de Incompatibilidades del Personal al Servicio de las Administraciones Públicas · el autor solicitará autorización previa si el acuerdo genera ingresos incompatibles con su condición MIR.

---

## 10. Calendario propuesto y entregables

### T0 · Firma del acuerdo
- Envío del contrato (borrador redactado por asesoría jurídica del patrocinador, revisado por la del autor).
- Publicación en `/transparencia.html` en <30 días.

### T+30 días
- Primer pago trimestral.
- Anuncio en programa de residentes del Área II.
- Arranque de desarrollo de módulos nuevos (Opción A) o kickoff de jornada (Opción B).

### T+90 días
- Entrega del primer informe trimestral de uso (agregado).
- Publicación del primer módulo formativo nuevo (Opción A/C).

### T+180 días
- Segundo informe trimestral.
- Segundo módulo formativo (Opción A).

### T+270 días
- Tercer informe trimestral.
- Tercer módulo formativo (Opción A).

### T+360 días
- Informe anual de impacto.
- Revisión del acuerdo y decisión de renovación.

---

## 11. Presupuesto orientativo

### Opción A · Patrocinio general (recomendada)

| Partida | Coste anual | % |
|---|---|---|
| Infraestructura (Firebase, dominio, APIs IA, Sentry, backups) | 4.800 € | 20% |
| Acreditaciones (HONcode, WIS, Colegio Médicos, auditorías) | 2.400 € | 10% |
| Desarrollo de 3 módulos formativos nuevos | 9.600 € | 40% |
| Mantenimiento y soporte | 3.600 € | 15% |
| Reporting y transparencia | 1.200 € | 5% |
| Auditoría externa opcional | 2.400 € | 10% |
| **Total anual** | **24.000 €** | **100%** |

*Importes sin IVA. IVA aplicable conforme a la normativa vigente.*

### Opción B · Jornada formativa

| Partida | Coste |
|---|---|
| Honorarios ponentes clínicos independientes (3 × 600 €) | 1.800 € |
| Alquiler sala (Colegio Médicos / Universidad Politécnica) | 1.200 € |
| Material formativo impreso + certificados | 900 € |
| Streaming + grabación profesional | 1.500 € |
| Coordinación y comunicación | 600 € |
| **Total** | **6.000 €** |

### Opción C · Módulo formativo específico

| Partida | Coste |
|---|---|
| Redacción y edición (120 h × 50 €/h) | 6.000 € |
| Revisión por comité clínico independiente (3 revisores × 800 €) | 2.400 € |
| Ilustración y material visual | 1.800 € |
| Integración en la plataforma + QA | 1.200 € |
| Actualización a los 12 meses | 600 € |
| **Total** | **12.000 €** |

---

## 12. Contacto y siguientes pasos

### 12.1 Contacto del autor

- **Nombre:** Carlos Galera Román
- **Email:** carlosgalera2roman@gmail.com
- **Teléfono:** [COMPLETAR SI PROCEDE antes de enviar]
- **Dirección profesional:** Hospital General Universitario Santa Lucía · Unidad de Urgencias · Cartagena (Murcia)
- **LinkedIn / ORCID:** [COMPLETAR]
- **Plataforma:** https://area2cartagena.es
- **Repositorio público:** https://github.com/carlosgalera-a11y/Cartagenaeste

### 12.2 Siguientes pasos sugeridos

1. **Reunión inicial** (60 min · presencial o videollamada) con Medical Affairs para:
   - Revisar esta propuesta.
   - Determinar opción preferida (A / B / C).
   - Identificar áreas terapéuticas de interés común.
2. **Due diligence legal** (15 días laborables) · ambas partes.
3. **Redacción del contrato** por asesoría jurídica del patrocinador (base habitual).
4. **Revisión por asesoría del autor** · 10 días laborables.
5. **Firma** y publicación en `/transparencia.html` en <30 días desde la firma.

### 12.3 Plazo de vigencia de esta propuesta

Esta propuesta tiene vigencia de **90 días naturales** desde la fecha de envío. Tras ese plazo puede requerir revisión de importes, condiciones o estado de la plataforma (acreditaciones obtenidas, etc.).

---

## Anexos recomendados (a enviar con la propuesta)

1. **Dossier HONcode** (`docs/honcode-dossier.md`).
2. **Política de privacidad** (`/privacidad.html`).
3. **Página de transparencia** (`/transparencia.html`).
4. **Página de acreditaciones** (`/acreditaciones.html`).
5. **Página About** (`/about.html`).
6. **Registro de Propiedad Intelectual** (copia del certificado 00765-03096622).
7. **CV del autor** con credenciales y línea MIR verificable.
8. **Capturas de la plataforma** en uso clínico (sección Urgencias, panel médico, fichas).

---

## Firma

Cartagena, 23 de abril de 2026

**Carlos Galera Román**
Licenciado en Medicina · MIR R4 MFyC
Autor y titular único de Cartagenaeste
Registro Propiedad Intelectual 00765-03096622
carlosgalera2roman@gmail.com

---

> **Nota final**: Esta propuesta está pensada para ser **enviada SOLO a Medical Affairs de AstraZeneca**, NO al departamento comercial. Si el primer contacto se produce con comercial, redirigir la conversación a Medical Affairs o declinar hasta identificar al interlocutor correcto.
>
> Recomendación: antes de enviar, consultar con un asesor legal (mercantil + sanitario) la coherencia del acuerdo con la Ley 53/1984 mientras se mantenga la condición MIR.
