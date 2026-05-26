# Propuesta comercial · Cartagenaeste → EGS

**De:** Carlos Galera Román (MFyC) · titular único Cartagenaeste · RPI 00765-03096622
**Para:** EGS · Jesús `[apellido]` y equipo
**Fecha:** 25 de mayo de 2026
**Asunto:** Licencia de módulos formativos para integración en plataforma EGS

---

## 1. Resumen ejecutivo

He revisado vuestro plan **EGS TeK** y os entiendo perfectamente la lógica. Pero mi situación ha cambiado desde la primera reunión del 29 de abril:

- Conversaciones activas con **AstraZeneca**, **Gilead** y **ViiV Healthcare**.
- **Premio SEMERGEN 2026** (recién ganado).
- Adopción clínica creciente en Área II Cartagena (HGU Santa Lucía).
- Proyecto paralelo **"Todos a una"** (VIH · beca ViiV Hii Future).

**No puedo asumir el rol de CTO 4h/día, ni ceder PI, ni firmar pacto de socios.**

En su lugar, os ofrezco lo que para vosotros vale más a corto plazo: **dos módulos listos para integrar en vuestra plataforma**, bajo licencia anual. Los tenéis operativos en semanas, sin riesgo de desarrollo, sin coste de equipo técnico. Yo mantengo la titularidad; vosotros la operación comercial.

---

## 2. Producto A — Módulo MIR Quiz

### Contenido
- **136 casos clínicos** tipo MIR, opción múltiple con explicación razonada.
- **17 especialidades**: cardiología, neumología, digestivo, nefrología, endocrino, infecciosas, hematología, neurología, reumatología, oncología, ginecología, pediatría, psiquiatría, dermatología, traumatología, urología, urgencias.
- Filtros por especialidad, dificultad y nº de preguntas por sesión.
- Sistema de puntuación local (aciertos, fallos, racha, % global).

### Características técnicas
- HTML standalone, JS vanilla, **cero dependencias externas**.
- Funciona offline tras primera carga.
- Sin backend, sin tracking, sin cookies de terceros.
- Compatible con cualquier LMS vía iframe o enlace directo.

### Demo privada
Disponible bajo NDA. URL y credenciales se entregan tras firma del NDA.

### Modalidades de licencia

| Modalidad | Qué incluye | Precio anual |
|---|---|---|
| **A1. Licencia de contenido (API/export)** | Vosotros integráis los casos en vuestra plataforma (Evolcampus u otra). Os entrego el banco de preguntas en JSON estructurado + API REST de lectura. Actualización trimestral. | **5.000 €/año** (≤ 500 usuarios activos) · **8.000 €/año** (501–2.000) · **12.000 €/año** (>2.000) |
| **A2. White-label hosted** | Os entrego el módulo completo con vuestra marca (EGS TeK o la que decidáis), alojado en mi infraestructura, accesible desde vuestra plataforma vía iframe o enlace personalizado. Vosotros no tocáis código. Hosting + mantenimiento + actualizaciones incluidos. | **8.000 €/año** (≤ 500) · **12.000 €/año** (501–2.000) · **15.000 €/año** (>2.000) |

---

## 3. Producto B — Módulo Urgencias (Paratus)

### Contenido
- **93 condiciones de urgencia** (adultas, pediátricas, neonatales).
- **71 procedimientos** con paso a paso clínico.
- **360 fármacos** de uso urgente con dosis, vía, indicaciones, contraindicaciones.
- **Visor de urgencias** con triaje rápido y árboles de decisión.
- Tres modos de vista: adultos · pediatría · neonatos.

### Por qué encaja con vuestro core
EGS tiene curso de formación en urgencias y emergencias. **Paratus es el producto natural de venta cruzada post-curso**: el alumno termina el curso, compra la suscripción anual a Paratus como herramienta de bolsillo. Vosotros os quedáis margen sobre la licencia que me pagáis a mí.

### Modalidades de licencia

| Modalidad | Qué incluye | Precio anual |
|---|---|---|
| **B1. Licencia de contenido (JSON + API)** | Banco completo (`paratus_all.json`, ~700k líneas) más documentación API. Vosotros lo integráis en vuestra app/web. Actualización trimestral. | **10.000 €/año** (≤ 500) · **14.000 €/año** (501–2.000) · **18.000 €/año** (>2.000) |
| **B2. White-label hosted** | Visor completo branded, alojado por mí, iframe o subdominio (`urgencias.egstek.es`). | **12.000 €/año** (≤ 500) · **16.000 €/año** (501–2.000) · **20.000 €/año** (>2.000) |

---

## 4. Modelo de pack combinado (descuento)

Si licenciáis ambos módulos en la misma modalidad:

- **A1 + B1**: 13.500 € → **12.000 €/año** (≤ 500 usuarios). Ahorro 1.500 €.
- **A2 + B2**: 20.000 € → **17.500 €/año** (≤ 500 usuarios). Ahorro 2.500 €.

---

## 5. Términos no negociables

1. **Titularidad de PI**: yo (Carlos Galera Román) mantengo el 100 % de los derechos sobre código, contenidos clínicos y datos. RPI 00765-03096622 declarado bajo Art. 51 LPI. La licencia es **de uso, no de cesión**.
2. **Revocabilidad**: la licencia es **revocable con preaviso de 90 días** en caso de impago, uso fuera del scope acordado, o cesión a terceros sin autorización.
3. **Sublicencia**: prohibida. Vosotros no podéis sublicenciar a terceros (otros centros formativos, otras plataformas) sin acuerdo escrito específico por cada caso.
4. **Branding clínico**: en cualquier modalidad debe aparecer disclaimer formativo permanente: *"Plataforma formativa. No diagnóstica. No sustituye juicio clínico."* No retirable.
5. **RGPD y residencia de datos**: si el módulo trata datos personales de vuestros alumnos, vosotros sois el Responsable del Tratamiento y firmamos DPA (encargado del tratamiento) por separado. Datos en UE (europe-west1).
6. **Sin co-branding institucional**: hasta nuevo aviso, ninguna integración debe mencionar UMU, SMS, Servicio Murciano de Salud, ni ningún laboratorio farmacéutico (AstraZeneca, ViiV, Gilead, etc.).
7. **Auditoría de uso**: derecho a auditar nº de usuarios activos contra la franja de precio una vez al año, con preaviso de 15 días.
8. **Pago**: 50 % al firmar contrato anual, 50 % a 90 días. Factura emitida por Carlos Galera Román (autónomo, NIF privado).

---

## 6. Lo que NO os ofrezco (y por qué)

| Lo que pedíais en EGS TeK | Mi respuesta | Por qué |
|---|---|---|
| Cesión de PI | ❌ | Compromete las conversaciones con AZ/Gilead/ViiV. Mi PI es mi activo principal. |
| Pacto de socios / co-fundación | ❌ | Implicaría exclusividad de facto que rompe Bernal, AZ y "Todos a una". |
| CTO 4h/día filial EGS TeK | ❌ | Mi tiempo está repartido entre 4 proyectos. 4h/día con vosotros = imposible. |
| Integración HubSpot / CRM EGS | ❌ | Eso es vuestra capa operativa, no la mía. |
| Acceso a repos privados (Cartagenaeste, mirrors) | ❌ | Os entrego los módulos como producto, no el código del producto. |
| Reescribir la app para vuestra plataforma | ⚠️ Solo bajo proyecto facturado aparte | Si necesitáis customización específica, lo facturamos como proyecto (€/hora) además de la licencia anual. |

---

## 7. Calendario propuesto

| Fase | Plazo | Acción |
|---|---|---|
| 1. Vosotros decidís modalidad | 2 semanas desde recepción | A1, A2, B1, B2 o pack combinado |
| 2. Borrador de contrato | 1 semana | Mi abogado redacta, vosotros revisáis |
| 3. Firma | 1 semana | Contrato + DPA + NDA actualizado |
| 4. Onboarding técnico | 2 semanas | Entrego acceso, JSON, API key (A1/B1) o iframe/subdominio (A2/B2) |
| 5. Go-live | Total ≈ 6 semanas desde firma | Operativo en vuestra plataforma |

---

## 8. Próximo paso

Decidme:
1. **Modalidad de interés** (A1/A2/B1/B2 o pack).
2. **Volumen de usuarios estimado** para fijar franja de precio.
3. **Marca** que queréis usar si white-label (EGS TeK u otra).
4. **Persona de contacto** para coordinar el onboarding técnico.

Respondo a dudas por email o en llamada de 30 minutos.

---

*Documento confidencial. Propuesta válida 30 días desde la fecha indicada.*
*Carlos Galera Román · carlosgaleraroman@gmail.com*
