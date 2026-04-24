# Guión · Sesión general en el hospital HSL

**Fecha:** viernes 8 de mayo de 2026
**Duración:** 20-30 minutos + 10 min Q&A
**Objetivo:** conseguir **10 early adopters firmantes** + **aval institucional** que puedas llevar a Dirección Médica para pedir financiación.

---

## 🎯 La tesis de la presentación

> **"Tengo una herramienta que ya se usa informalmente en Urgencias, que cumple todo el compliance europeo, y que puede ahorrar tiempo clínico a este hospital. Necesito tres cosas: primer dato de uso, feedback crítico, y un presupuesto pequeño para escalarlo bien. Hoy os pido el primer y el segundo; el tercero llegará después."**

No es una venta agresiva. Es una invitación a ser **early adopters con aval** en un piloto.

---

## 👥 Audiencia esperada

- Residentes MIR (todos los años, todas las especialidades del Área II).
- Adjuntos de Urgencias, Medicina Interna, Medicina Familiar.
- Jefes de Servicio (Urgencias, Docencia, Medicina Interna).
- Jefatura de Estudios / Unidad Docente.
- Dirección Médica (si asiste).
- Algún representante de Farmacia / Calidad si los invitas.

**Estimación realista**: 30-80 personas.

---

## 🧭 Orden de los 25 minutos

### Bloque 1 · Posicionamiento (2 min)

- *Buenos días. Gracias por venir. Soy Carlos Galera, R4 MFyC. Acabo la residencia el 30 de mayo.*
- *Durante los últimos meses he construido una plataforma que ya usan informalmente algunos compañeros de Urgencias: Cartagenaeste.*
- *Hoy quiero enseñárosla, pediros feedback honesto, y proponer un piloto estructurado.*
- *No vengo a venderos nada. Vengo a invitaros a usarlo y a criticarlo.*

### Bloque 2 · El problema (3 min)

Preguntar al público (a mano alzada):

- *"¿Cuántos tenéis abierto ahora mismo un PDF de protocolo institucional mientras escribís en la HCE?"*
- *"¿Cuántos buscáis vademécum en el móvil en medio de la guardia?"*
- *"¿Cuántos mantenéis una libreta personal o notas en el móvil con vuestros propios pacientes de la guardia?"*

**El dolor:** información asistencial dispersa en 5 pestañas + cuaderno personal que no está versionado + heterogeneidad asistencial entre turnos.

Dato visual: *"Según Deloitte, el 30% del tiempo de la guardia es consulta de documentación. Ese tiempo es recuperable."*

### Bloque 3 · La solución · demo (10 min · lo más importante)

Abrir `area2cartagena.es` en pantalla. Demo corta por bloques:

**3.1 · Landing y catálogo (30 s)**
- *"Una URL. 132 protocolos. 40+ calculadoras. Vademécum contextualizado. Todo gratis."*

**3.2 · Panel profesional (3 min)**
- Entrar en `/profesionales.html`.
- Mostrar las 8 secciones: Urgencias, Panel Médico, Plantillas, Notebook, Docencia, Fichas consulta rápida, Vademécum, Protocolos.
- Abrir **Plantillas** y generar un informe de alta con IA (caso sencillo tipo dolor torácico no coronario).
- Resaltar: *"Yo decido qué pego en la HCE. La IA propone, el médico dispone. Banner EU AI Act art. 14 siempre visible."*

**3.3 · Organizador personal de guardia (2 min)**
- Entrar en `/guardia-notas.js`-equivalente (apartado Mi guardia).
- Mostrar cómo se crea un paciente con **iniciales ≤ 4 + edad + cama**. Nunca nombre/DNI/NHC.
- Explicar la pseudonimización y cumplimiento RGPD.

**3.4 · Scan IA (2 min · el show-off)**
- Entrar en módulo Scan IA, pestaña **ECG**.
- Subir una imagen de ejemplo (llevar tú un ECG despersonalizado).
- Mostrar: análisis generado + caja de transparencia (modelo + región + benchmark) + checkbox "Yo, el clínico, asumo la decisión final" + botones Aceptar/Rechazar.
- Resaltar: **OCR local detectaría cualquier nombre/DNI en la imagen y bloquearía el envío**.

**3.5 · Admin dashboard breve (1 min)**
- Solo para los Jefes de Servicio que asistan: enseñar el panel SLA que ya existe con latencias p50/p95, errores y coste estimado.
- *"Si firmamos un piloto, este panel lo tenéis vosotros como Jefatura de Servicio para vigilar el servicio en tiempo real."*

**3.6 · Transparencia (30 s)**
- Entrar en `/transparencia.html`.
- Mostrar la tabla de financiación actual (100% autofinanciación) y las cláusulas de no publicidad + no marca farma.

### Bloque 4 · Compliance en 60 segundos (1 min)

Una sola slide con 6 iconos:

- ✅ RGPD + LOPDGDD
- ✅ EU AI Act 2024/1689 (art. 9/10/11/12/13/14/15 cubiertos)
- ✅ EHDS-ready (FHIR R4 export funcional)
- ✅ Datos en UE (europe-west1)
- ✅ App Check enforce + TTL 180 d en logs
- ✅ Sin marcas comerciales · sin publicidad

*"Todo documentado. Podéis pedirme las fichas técnicas si las necesitáis para auditoría."*

### Bloque 5 · Uso real hoy (1 min)

Capturas del `admin-dashboard.html` mostrando:
- Últimos 30 días de uso (llamadas IA, usuarios únicos).
- Secciones más usadas.
- Tiempo p95 de respuesta.

*"Estos son datos reales. No son demos. Se están usando ahora."*

### Bloque 6 · Qué pido · petición concreta (3 min)

Tres peticiones, en orden:

**6.1 · Usadla.** (2 semanas de prueba sin compromiso)

> *"Os pido que escaneéis el QR, la instaléis en el móvil, y la probéis durante 2 semanas en vuestras guardias. Si al cabo de 2 semanas no le habéis cogido el punto, me lo decís y me callo. Si sí, pasamos a la siguiente petición."*

QR en pantalla con `?utm_source=sesion-hospital-8mayo&utm_medium=qr`.

**6.2 · Firmadme una carta de apoyo** si la usáis.

> *"Tengo preparada una carta breve — una página — que dice que habéis probado la plataforma y consideráis que tiene utilidad formativa. Sin compromiso económico. Sin compromiso contractual. Es solo un aval técnico/clínico para poder llegar con garantías a Dirección Médica y a Docencia."*

Mostrar el modelo de carta (1 página). Mencionar que **la meta son 10 firmantes** — y si son más mejor.

**6.3 · Buzón de mejoras · crítica abierta**

> *"El tercer pedido: cuando uséis la web, abrid un issue en GitHub o escribidme a carlosgalera2roman@gmail.com con lo que NO funciona. Quejaros. Sed críticos. Vuestro feedback vale más que cualquier encuesta."*

### Bloque 7 · Financiación · sinceridad total (2 min)

> *"Tengo que hablaros de dinero porque si no, esto no se sostiene."*

- *"Ahora mismo la plataforma está financiada 100% por mí."*
- *"El coste operativo mensual es pequeño — unos 80 € al mes — pero incluye IA con SLA pagado, seguro RC + ciber, acreditaciones (HONcode, Web Sanitaria Acreditada)."*
- *"He planteado al Jefe de Urgencias formalizar el uso como contrato menor (≤ 15.000 € IVA excluido). No está cerrado, pero es la ruta."*
- *"Si cualquiera de vosotros conoce una vía para micro-financiación (Docencia, Fundación HSL, Cátedra, premio, beca), me avisa. No necesito mucho para empezar, pero necesito algo."*

Mostrar slide con la escala de umbrales:

| Umbral | Importe anual | Qué cubre |
|---|---|---|
| Tokens DeepSeek abundantes | 240 €/año | IA con SLA decente |
| Seguro RC + ciber | 600 €/año | Cobertura mínima |
| Mínimo viable | 12.000 €/año | Todo + tiempo del autor |

### Bloque 8 · Preguntas · 10 minutos abiertos

---

## 🎥 Material imprescindible

- [ ] Presentación en 8-10 slides (no más). Playground recomendado: Keynote con tema minimalista.
- [ ] Portátil + cable HDMI + cargador.
- [ ] Wi-fi del hospital + tethering móvil como backup.
- [ ] **QR impreso grande** en papel A3 (apuntando a la URL con UTM).
- [ ] **40 hojas** con la carta de apoyo impresa (1 página, 2 copias por asistente estimado).
- [ ] Un **ECG de ejemplo despersonalizado** en el móvil para la demo del Scan IA.
- [ ] Bolígrafo × 10 (para firmar las cartas en mesa).
- [ ] Carpeta / archivador para recoger cartas firmadas.
- [ ] Screenshots backup por si internet falla (todas las secciones que vas a mostrar).

---

## ⚠️ Qué NO hacer

- ❌ No acusar a nadie de "no digitalizarse". Tono siempre constructivo.
- ❌ No criticar el sistema ni la dirección del hospital.
- ❌ No prometer fechas de contrato firmado que dependen del Jefe de Urgencias.
- ❌ No mostrar datos personales de pacientes en las capturas (obvio).
- ❌ No recitar tarifas externas sin contexto — hablar de valor antes que de precio.
- ❌ No más de 10 slides. Si hay más, el público desconecta.
- ❌ No pedir firma de la carta antes de haber hecho la demo.

---

## 🎯 Cómo medir el éxito

Métricas inmediatas (esa misma tarde / sábado):

| KPI | Fuente | Objetivo razonable |
|---|---|---|
| Visitas a `area2cartagena.es` con `utm_source=sesion-hospital-8mayo` | GA4 Realtime | ≥ 40 visitas únicas |
| Cartas de apoyo firmadas en mesa | Conteo físico | ≥ 10 firmantes |
| PWAs instaladas | Evento `beforeinstallprompt` | ≥ 15 |
| Uso en las 2 semanas siguientes | `admin-dashboard.html` | ≥ 25 usuarios activos en 14 d |

Si llegas a 10 cartas firmadas → tienes aval institucional para reunión con Dirección Médica y Docencia.

---

## 💬 Preguntas frecuentes esperadas · respuestas preparadas

| Pregunta | Respuesta |
|---|---|
| *"¿Esto reemplaza al vademécum oficial?"* | *"No. Complementa. El vademécum oficial lo tienes donde siempre. Esto es un recordatorio rápido con clase + principio activo, nunca marca comercial."* |
| *"¿Y si la IA se equivoca?"* | *"La IA no toma decisiones. Tú decides. Hay checkbox obligatorio de supervisión humana (EU AI Act art. 14), y todo el uso queda logueado para auditoría."* |
| *"¿Dónde están mis datos?"* | *"Firebase en Bélgica (europe-west1). No hay datos en China ni en EE.UU. Y no guardo prompts ni respuestas literales, solo metadatos."* |
| *"¿Quién te paga?"* | *"Nadie ahora mismo. Busco firmar con el hospital o con patrocinio educativo sin marca. Todos los acuerdos se publicarían en /transparencia.html."* |
| *"¿Y si te vas del hospital?"* | *"Aunque me vaya, la plataforma sigue funcionando. Está en infraestructura externa. Y tengo plan de continuidad documentado con un dev de backup."* |
| *"¿Puedo desactivar la IA?"* | *"Sí. Las secciones de IA son opcionales. Puedes usar la web solo como biblioteca de protocolos y calculadoras."* |
| *"¿Funciona sin internet?"* | *"La PWA funciona offline para buena parte del contenido (protocolos precacheados). La IA requiere conexión por razones obvias."* |
| *"¿Y si un paciente me denuncia?"* | *"La app es formativa. El responsable clínico final siempre eres tú. Hay logs de trazabilidad que protegen tu decisión."* |
| *"¿Por qué lo estás regalando?"* | *"No lo regalo. Busco que el hospital lo pague para mantenerlo bien. Mientras, quiero que lo uséis para validar que merece la pena pagar por él."* |

---

## 📦 Paquete para llevar

1. `presentacion-cartagenaeste-8mayo.keynote` (a crear).
2. `docs/guion-sesion-hospital-8-mayo.pdf` · este doc impreso.
3. `docs/carta-apoyo-early-adopter.pdf` × 50 copias impresas.
4. QR impreso grande.
5. Dossier comercial × 3 copias (para Jefes de Servicio que se acerquen al final).
6. Ficha técnica AI Act + EHDS readiness × 2 copias cada una (si algún auditor/Calidad pregunta).
7. Tarjetas con tu email + web.

---

## 🗓️ Después de la sesión

**Mismo viernes 8 por la tarde:**
- [ ] Contar cartas firmadas. Escanear y guardar en Google Drive privado.
- [ ] Ver GA4 Realtime: nº de asistentes que entraron a la web.
- [ ] Email breve agradeciendo asistencia + link nuevamente.

**Lunes 11 mayo:**
- [ ] Revisar `admin-dashboard.html` con filtro `utm_source=sesion-hospital-8mayo`.
- [ ] Exportar ranking de secciones más usadas.

**Miércoles 13 mayo:**
- [ ] Solicitar reunión con Dirección Médica **con las cartas firmadas como anexo**.
- [ ] Si se llega a 15+ firmantes, escalar también a Gerencia del Área II.
