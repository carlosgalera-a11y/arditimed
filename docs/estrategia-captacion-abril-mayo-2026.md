# Estrategia de captación y financiación mínima
## Cartagenaeste · Abril-Mayo 2026

**Autor:** Carlos Galera Román
**Fecha:** 24 de abril de 2026
**Horizonte:** 24 abr — 30 may (5 semanas · fin de residencia MIR)

> Documento de decisión personal. Reemplaza el plan previo con **datos reales** del 24 de abril de 2026. No hay compromisos firmados; hay tres conversaciones abiertas y una reunión esta semana.

---

## 0. Situación real (ajustada al 24 de abril)

| Vía | Estado real | Siguiente paso |
|---|---|---|
| **Urgencias HSL** | Conversación informal con el Jefe de Servicio. Pidió **"cifra mensual de gasto"**. | Responder con email corto que da **coste mensual claro** y ofrece reunión. |
| **AstraZeneca** | Primer representante contactado. Pidió **"enviame el proyecto a ver qué se puede hacer"**. | Enviar **one-pager + enlace web**. NO soltar aún el dossier de 12 páginas. |
| **EGS** | **Primera reunión presencial: 29 de abril (en 5 días).** | Preparar agenda, NDA y objetivo claro de la reunión. |
| **Docencia HSL** | Sin conversación abierta. | Abrir vía paralela tras EGS. |
| **Colegio Médicos Murcia (WSA)** | Sin enviar. | Mejor esperar a tener colegiación actualizada y respuesta del abogado. |

**Contexto personal:**
- MIR R4 hasta el **30 de mayo de 2026**. A partir del 1 de junio deja de aplicar la incompatibilidad Ley 53/1984 como MIR.
- Mudanza a Barcelona: 29 julio — 11 agosto 2026.
- Deadline EU AI Act art. 71: 2 agosto 2026.

**Estado técnico:** la plataforma está 100% lista. **Ningún bloqueo depende de código.** Los bloqueos son todos humanos/administrativos.

---

## 1. Financiación mínima viable

### 1.1 Costes operativos mensuales

| Partida | Mes 1 (hoy) | Mes 6 (tras firmar algo) | Año 1 completo |
|---|---|---|---|
| Dominio `area2cartagena.es` | 1,25 € | 1,25 € | 15 € |
| Firebase (hoy gratis, al firmar pasa a Blaze) | 0 € | 5-15 € | 60-180 € |
| IA con SLA pagado (sustituye cadena free) | 0 € (cadena free) | 15-45 € | 180-540 € |
| Seguro RC profesional + ciber (obligado) | — | 40-75 € | 480-900 € |
| Monitoring (Uptime Robot free + Sentry free) | 0 € | 0 € | 0 € |
| **Subtotal operativo** | **1 €** | **60-135 €/mes** | **735-1.635 €/año** |

### 1.2 Costes únicos (one-off)

| Partida | Coste |
|---|---|
| Constitución SL (si se elige esa vía) | 400-800 € |
| Honorarios abogado (tres decisiones · ver email-abogado.md) | 800-2.500 € |
| Acreditación HONcode (tasa solicitud) | 0-200 € |
| Acreditación WIS / WSA (tasa Colegio) | ≈ 100-300 € |
| Imprevistos técnicos | 300-500 € |
| **Subtotal único** | **1.600-4.300 €** |

### 1.3 Coste total año 1 (escenario conservador)

≈ **3.000-6.000 €** entre operativos + únicos.

### 1.4 Umbrales de captación

| Umbral | Importe anual año 1 | Lo que significa |
|---|---|---|
| **Supervivencia** | **≥ 6.000 €** | Cubre costes y deja 0 € de retribución al autor. Sostenible pero no sostenible en el tiempo. |
| **Mínimo viable** | **≥ 12.000 €** | Cubre costes + 500 €/mes para el autor (tiempo + continuidad). |
| **Razonable** | **≥ 18.000 €** | Cubre costes + retribución digna + buffer + acreditaciones sin apretar. |
| **Objetivo del roadmap** | **≥ 30.000 €** | Dos vías firmadas. Permite contratar dev de backup. |

**Conclusión**: con **una sola vía del roadmap** que cuaje (Urgencias HSL 14 k€ o AZ educativo 12-24 k€) ya estoy en **mínimo viable**.

---

## 2. Los 3 hitos de las próximas 2 semanas

### 2.1 Reunión EGS · 29 de abril (5 días)

**Objetivo realista de la primera reunión**: explorar compatibilidad de visiones, NO cerrar un partnership. Detectar si ellos suman valor real o si es solo una conversación de cortesía.

**Qué NO se hace en la primera reunión:**
- ❌ Enseñar código detallado antes de firmar NDA.
- ❌ Compartir credenciales, API keys, estructura de base de datos.
- ❌ Firmar nada.
- ❌ Comprometerse a un modelo de colaboración concreto.

**Qué SÍ se hace:**
- ✅ Presentación de 10 minutos (el propio dossier comercial sirve).
- ✅ Demo de 5 minutos en la webapp pública (`area2cartagena.es`).
- ✅ **Firmar NDA estándar al inicio** si van a ver algo más que el público.
- ✅ Preguntarles a ellos: cartera de clientes hospitalarios, capacidad operativa, interés en partnership de canal.
- ✅ Cerrar segunda reunión con fecha concreta y entregables por ambas partes.

**Agenda propuesta para la reunión (45 minutos máximo):**

```
1. Intros (5 min)
   · Ellos: presentación EGS, clientes actuales, líneas de negocio.
   · Yo: Cartagenaeste en 1 min + por qué los he convocado.

2. Demo rápida pública (5 min)
   · area2cartagena.es · sección pública (profesionales, pacientes,
     docencia).

3. Mi situación ACTUAL (5 min)
   · MIR R4 hasta 30 mayo.
   · Urgencias HSL pidió cifra mensual.
   · AstraZeneca me pidió el proyecto.
   · Busco partner para facturación, soporte operativo y canal
     hospitalario.

4. Qué podría aportar EGS · PREGUNTAS (15 min)
   · ¿Tienen clientes hospitalarios activos en Región de Murcia
     y/o Cataluña?
   · ¿Qué capacidad de soporte 24/7 manejan?
   · ¿Qué modelo de partnership plantean: subcontratación,
     licencia white-label, joint venture?
   · ¿Qué servicios cobran y a qué tarifas aproximadas?
   · ¿Cómo manejan la propiedad intelectual del partner?

5. Qué puedo aportar yo (5 min)
   · Producto construido, IP a mi nombre (RPI 00765-03096622).
   · Caso de uso real validado en Urgencias HSL.
   · Cumplimiento RGPD + EU AI Act + EHDS-ready.
   · Contactos abiertos en HSL y AstraZeneca.

6. Siguientes pasos (10 min)
   · Firma NDA (si aún no se hizo y va a haber intercambio técnico).
   · Fecha de segunda reunión con propuesta concreta por ambas
     partes.
   · Qué documentos intercambiamos (yo: dossier comercial; ellos:
     brochure + referencias de clientes).
```

**NDA**: tengo plantilla estándar en el email-abogado (cláusula prevista). Llevar dos copias firmadas por mi parte, listas para firma en mesa.

**Red flags para abandonar la conversación**:
- Exigen exclusividad territorial amplia sin contrapartida.
- Piden cesión de la IP en lugar de licencia.
- Minimizan el compliance y el posicionamiento formativo.
- No tienen clientes hospitalarios reales.

---

### 2.2 Responder a Jefe Urgencias · coste mensual (3-5 días)

El Jefe te pidió **la cifra mensual**. NO le mandes el dossier de 6 páginas; mándale **un email de menos de 10 líneas** con el coste mensual claro y la oferta de explicarle el detalle si lo quiere.

**Por qué email corto y no dossier:** un Jefe de Servicio en medio de la guardia no lee un dossier de 6 páginas recibido sin contexto. Lee un email de 10 líneas que responde a su pregunta y le ofrece una reunión.

**Borrador listo (ajustar nombre y hora):**

```
Asunto: Cartagenaeste · coste mensual orientativo + propuesta reunión

[Nombre],

Como me pediste, te paso la cifra mensual orientativa para formalizar
el uso de Cartagenaeste en Urgencias HSL:

  · Coste mensual (promedio año 1): 1.160 € + IVA/mes
  · Coste anual año 1:             14.000 € + IVA
  · Coste anual recurrente año 2+: 10.300 € + IVA/año

Está dentro del límite de contrato menor (Ley 9/2017, 15.000 €).
Incluye: licencia uso ilimitada para el servicio (80 profesionales),
mantenimiento, hosting con SLA, bolsa soporte 40 h, onboarding con 2
sesiones, reporting trimestral y un módulo específico para 2026.

Te adjunto desglose de una página (PDF) con el detalle.

¿Te viene bien una reunión corta (30 min) esta semana o la siguiente
para cerrar alcance y calendario? Te ofrezco miércoles-viernes en
la franja 08:00-10:00 o cualquier otro hueco que tú propongas.

Gracias,

Carlos Galera Román
Cartagenaeste · área2cartagena.es
carlosgalera2roman@gmail.com · [Teléfono]
```

**Adjunto recomendado**: un one-pager con el desglose del dossier comercial (sección económica de `dossier-comercial.html`, imprimida A4).

---

### 2.3 Primer envío a AstraZeneca (3-7 días)

El representante te pidió "enviame el proyecto". Ese mensaje, en Medical Affairs farma, significa: *dame algo que pueda leer en 10 minutos y decidir si lo paso a mi superior o lo descarto*. **NO es el momento del dossier de 12 páginas con propuesta económica**.

**Estrategia**: envío en dos tiempos.
- **T+0 (esta semana)**: one-pager + enlace web + invitación a pedir dossier completo si hay interés.
- **T+si responden positivamente**: envío el `propuesta-astrazeneca-v1.md` completo en PDF.

**Borrador listo (ajustar nombre, tono según relación y título del rep):**

```
Asunto: Proyecto Cartagenaeste · para Medical Affairs · 1 página

Hola [Nombre],

Como me pediste, te envío el proyecto Cartagenaeste. Te adjunto una
página con lo esencial (adjunto PDF) y el enlace a la plataforma
pública para que la puedas ver operativa:

https://area2cartagena.es

En resumen:

 · Plataforma formativa y organizador personal de guardia en uso
   clínico activo en Urgencias HSL (Área II Cartagena · SMS) desde
   hace meses.
 · Autor único, Registro Propiedad Intelectual 00765-03096622.
 · Cumplimiento RGPD + LOPDGDD + EU AI Act 2024/1689 + EHDS-ready.
   Datos en UE (europe-west1). Sin publicidad. Sin marcas comerciales
   en contenido (siempre clase terapéutica + principio activo).
 · Herramientas IA con supervisión humana obligatoria y logs
   trazables.

Relación potencial con AstraZeneca: patrocinio educativo independiente
vía Medical Affairs bajo Código de Farmaindustria + EFPIA Disclosure
Code. Alcance y clausulado de independencia editorial alineados con
el Código.

Si el proyecto encaja en lo que buscáis, tengo preparado el dossier
completo (≈ 12 páginas) con las opciones de colaboración, desglose
económico y cronograma. Te lo envío en cuanto me confirmes interés y
la persona concreta de Medical Affairs con la que seguir.

Quedo a tu disposición. Mil gracias por la ventana que abres.

Un saludo cordial,

Carlos Galera Román
MIR R4 MFyC · HGU Santa Lucía · Área II Cartagena
Autor de Cartagenaeste · RPI 00765-03096622
carlosgalera2roman@gmail.com · [Teléfono]
https://area2cartagena.es
```

**Adjunto recomendado**: un one-pager PDF con los mismos puntos. Si te lo piden luego, mandas el dossier v1 completo.

**Línea roja**: si el contacto es de Comercial/Ventas (no de Medical Affairs), redirigir la conversación o declinar.

---

## 3. Estrategia de captación · priorización

### 3.1 Orden de probabilidad × velocidad

| # | Vía | Probabilidad cierre | Plazo estimado | Importe año 1 |
|---|---|---|---|---|
| 1 | **Urgencias HSL** contrato menor | Alta (ya hay conversación + petición cifra) | 6-10 semanas | 14 k€ |
| 2 | **Docencia HSL** sesiones formativas | Media-alta (objeto claro) | 4-8 semanas | 2-6 k€ |
| 3 | **AstraZeneca** educativo | Media | 10-16 semanas | 8-24 k€ |
| 4 | **EGS** partnership | Por validar el 29 abr | 6-12 semanas tras NDA | Variable |
| 5 | **Dirección Médica Área II** escalado | Baja (solo tras #1) | 3-6 meses | 15-40 k€ |

### 3.2 Regla de oro

**Ataca las 4 primeras en paralelo, NO en serie.** Si una tarda, las otras avanzan. Ninguna depende de las demás para arrancar la conversación (aunque #5 sí depende de #1 demostrando uso).

### 3.3 Mínimo para cerrar 2026

- Si solo firma **#1 Urgencias HSL** → cubre costes operativos + margen. **Suficiente para sobrevivir** el año 1.
- Si firma **#1 + #3 AstraZeneca** → viabilidad cómoda + contratar dev de backup.
- Si firma **#1 + #2 + #3** → cierre de roadmap original. Escenario objetivo.

---

## 4. Calendario reestructurado (24 abril — 30 mayo)

### Semana 1 · 24-28 abril

| Día | Acción | Objetivo |
|---|---|---|
| Jue 24 | Enviar email a Jefe Urgencias con cifra mensual (§2.2) | Respuesta rápida a petición |
| Vie 25 | Enviar primer one-pager a AstraZeneca (§2.3) | Mantener la ventana abierta |
| Vie 25 | Preparar agenda + NDA impresos para EGS (§2.1) | Reunión lunes |
| Lun 28 | Última revisión documentos con copia alcance | Nervios fuera |

### Semana 2 · 29 abr - 5 may

| Día | Acción | Objetivo |
|---|---|---|
| **Mar 29** | **Reunión EGS** (45 min) | Validar partnership · cerrar siguiente fecha |
| Mié 30 | Enviar email al abogado con las 3 decisiones (A/B/C) — ver `docs/email-abogado.pdf` | Arrancar plazos legales |
| Jue-Vie | Si Urgencias responde: fijar reunión 30 min | Cerrar alcance y calendario |

### Semana 3 · 6-12 may

- **Reunión 1 con Urgencias HSL** (si aceptan). Llevar dossier de 6 pág impreso + desglose económico.
- **Reunión con abogado** (objetivo: decisión A1/A2/A3 + borrador contrato marco).
- **Reunión 2 con EGS** si la primera fue positiva.
- Si AstraZeneca responde positivamente: enviar dossier v1 completo.

### Semana 4 · 13-19 may

- Expediente de contratación abierto en Urgencias HSL.
- Cotizar seguro RC + ciber (Hiscox, AIG, Chubb). Elegir y contratar.
- Activar Firebase Blaze (requisito operativo previo a facturación).

### Semana 5 · 20-29 may

- Negociación final con Urgencias.
- Si procede, constituir SL o solicitar autorización compatibilidad (según decisión A del abogado).
- Preparar Documentación para firma: certificados AEAT/SS, declaración responsable, RPI 00765-03096622.

### **Viernes 29 de mayo · fin residencia MIR**

### Semana 6 · 1-7 jun

- **1 junio**: ya sin incompatibilidad MIR.
- **Firma contrato Urgencias HSL** (objetivo principal).
- Primera factura emitida.
- Reunión con Medical Affairs AstraZeneca (si se consigue).

---

## 5. Cómo captar el mínimo · recomendación operativa

### 5.1 Táctica de 48 horas (HOY hasta sábado)

1. Enviar **este viernes** el email al Jefe de Urgencias con la cifra mensual.
2. Enviar **este viernes** el one-pager a AstraZeneca.
3. Preparar agenda y NDA para reunión EGS del martes 29.
4. **NO enviar** todavía al abogado (mejor enviar tras la reunión EGS, para incluir en el email la info real que surja de esa conversación).
5. **NO enviar** al Colegio Médicos hasta tener colegiación al día y decisión del abogado (semana 3-4).

### 5.2 Mantra de la captación

- **Cifras claras, no dossieres.** Un número al principio del email captura más que 10 páginas de contexto.
- **Ventanas cortas de reunión.** 30-45 min máximo. Si necesitan más, que lo pidan.
- **Canal correcto.** Medical Affairs (no Comercial). Jefe de Servicio (no secretaría). Abogado que ya conoce el tema (no uno nuevo).
- **Pregunta al final siempre**: "¿Qué necesitas de mí para el siguiente paso?"
- **Documenta cada conversación** en 3 líneas por email al día siguiente. Te sirve para la próxima y protege tu memoria ante mudanza y estrés.

### 5.3 Señales para ampliar / pausar

| Señal | Acción |
|---|---|
| Urgencias responde con "mándame más detalle" | Seguir presionando: dossier completo, referencia a Ley 9/2017. |
| Urgencias responde con silencio > 10 días | Recordatorio al Jefe + copia al coordinador administrativo. |
| AZ responde con "mándame el dossier completo" | Enviar `propuesta-astrazeneca-v1.md` en PDF. |
| AZ responde con silencio > 2 semanas | Un recordatorio corto, si silencio otras 2 semanas: pausar esta vía. |
| EGS quiere firmar rápido sin ver compliance | Frenar. NDA primero siempre. |
| EGS no aparece en segunda reunión en 3 semanas | Archivar esta vía, no es prioritaria. |

---

## 6. Plan B si nada cuaja en 30 días

Probabilidad baja (tienes 3 conversaciones abiertas), pero es sano tener plan B:

1. **Autofinanciación extendida**: seguir con cadena IA gratuita + Firebase free tier. Coste cercano a 0. Compra tiempo.
2. **Publicación académica**: convertir el proyecto en un artículo para AMIA / SEMERGEN / Revista Española de MFyC. Valida el uso clínico y da tracción para escalar con Dirección Médica en otoño.
3. **Ampliar cartera de contactos**: hablar con gerencias de Área III, Rosell, hospitales privados en Murcia/Alicante/Cataluña. Misma conversación que Urgencias HSL, 5 veces en paralelo.
4. **Solicitar ayudas públicas**: convocatorias de digitalización sanitaria SERGAS / ministerios / fondos EU Digital Health. Trámite lento (6-9 meses) pero puente viable.

---

## 7. Riesgos principales · actualizados

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Jefe Urgencias no responde | Media | Recordatorio + escalado a gerencia + ir por Docencia en paralelo |
| AstraZeneca deriva a Comercial | Alta (canal equivocado inicial) | Exigir redirigir a Medical Affairs o declinar |
| EGS quiere exclusividad / IP | Media | NDA + cláusulas innegociables listas |
| Abogado tarda > 3 semanas | Media-alta | Plazos flexibles hasta 1 junio (fin MIR); si no, cambiar de abogado |
| Fuga de datos durante EGS | Baja (NDA) | Nada sensible fuera de NDA firmado |
| Enfermedad / accidente autor | Baja | Plan de continuidad mudanza + dev backup (pdte NDA) |

---

## 8. Checklist para esta semana (24-28 abril)

- [ ] Enviar email a Jefe Urgencias con cifra mensual (§2.2). Incluir PDF one-pager.
- [ ] Enviar email a AstraZeneca con one-pager (§2.3). Adjunto breve.
- [ ] Preparar agenda de EGS para el martes 29 (§2.1). Imprimir.
- [ ] Preparar NDA estándar en papel × 2 copias firmadas por mí.
- [ ] Instalar Uptime Robot (5 min, guía en `docs/uptime-robot-setup.md`).
- [ ] Activar Firebase Blaze y alerta de 20 €/mes (Cloud Shell).
- [ ] Guardar este documento en tu móvil para llevarlo a las reuniones como chuleta.

---

## 9. Historial

| Fecha | Cambio |
|---|---|
| 2026-04-24 | Documento inicial. Reestructura del plan previo con datos reales: EGS 29 abril, Urgencias pidió cifra mensual, AstraZeneca pidió el proyecto. Fin residencia 30 mayo. |
