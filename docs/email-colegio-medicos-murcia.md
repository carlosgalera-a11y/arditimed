# Email al Colegio Oficial de Médicos de la Región de Murcia

> ⚠️ **NO ENVIADO.** Documento preparado — pendiente de que Carlos envíe manualmente cuando tenga el número de colegiado al día y revise el contenido.

---

## Metadatos del envío

| Campo | Valor |
|---|---|
| **Para** | `secretaria@commurcia.es` · `acreditacion@commurcia.es` *(verificar destinatario correcto antes de enviar)* |
| **Asunto** | Solicitud de Web Sanitaria Acreditada · Cartagenaeste · area2cartagena.es |
| **De** | Carlos Galera Román `<carlosgalera2roman@gmail.com>` |
| **CC** | (opcional) Jefe del Servicio de Urgencias HGU Santa Lucía, si procede como aval institucional |
| **Adjuntos** | `honcode-dossier.pdf`, `privacidad.pdf`, `aviso-legal.pdf`, `about.pdf`, `transparencia.pdf`, copia título de Licenciado, certificado de colegiación |

---

## Versión 1 · Cordial / institucional

```
Asunto: Solicitud de Web Sanitaria Acreditada · Cartagenaeste · area2cartagena.es

Estimada Junta Directiva del Colegio Oficial de Médicos de la Región de
Murcia,

Me dirijo a ustedes en calidad de colegiado y autor único de la plataforma
docente Cartagenaeste (https://area2cartagena.es), para solicitar la
incorporación de la misma al sello de Web Sanitaria Acreditada del ICOM
Murcia, conforme a los criterios publicados en su sede.

Breve presentación del proyecto:

 · Autor único y propietario intelectual: Carlos Galera Román, Licenciado
   en Medicina, residente R4 de Medicina Familiar y Comunitaria en el
   Hospital General Universitario Santa Lucía (Área II Cartagena · SMS).
 · Registro de Propiedad Intelectual: 00765-03096622 (Art. 51 RDL 1/1996).
 · Naturaleza: plataforma FORMATIVA y organizador personal de guardia.
   Enfocada a profesionales sanitarios (medicina, enfermería) y pacientes
   del Área II Cartagena. Actualmente en uso clínico activo en la Unidad
   de Urgencias del HGU Santa Lucía.
 · Cumplimiento: RGPD, LOPDGDD, Ley 41/2002, EU AI Act 2024/1689.
   Infraestructura Firebase en región europe-west1 (Bélgica). Sin
   almacenamiento de datos identificativos de pacientes (máximo 4
   iniciales + edad + cama). Sin publicidad comercial ni marcas farma.
   App Check enforce activo. Backups diarios en la UE.
 · Acreditaciones paralelas: solicitud HONcode en curso (mismo dossier
   de soporte adjunto). Registro de Propiedad Intelectual activo.

He preparado un dossier técnico-legal completo que incluye:

  1. Credenciales profesionales verificables.
  2. Declaración de financiación y ausencia de conflictos de interés.
  3. Política editorial y de atribución de fuentes.
  4. Política de privacidad, tratamiento de datos y disclaimer formativo
     permanente.
  5. Declaración de transparencia comercial.

Adjunto a este correo:

  · Dossier HONcode (aplicable también a Web Sanitaria Acreditada).
  · Política de privacidad consolidada.
  · Aviso legal.
  · Página de autoría y equipo (about.html).
  · Página de transparencia (transparencia.html).
  · Copia del título de Licenciado en Medicina.
  · Certificado de colegiación vigente.

Quedo a su disposición para facilitar cualquier documentación adicional,
acceder a las reuniones o paneles de evaluación necesarios, y atender a
los requerimientos técnicos que el procedimiento de acreditación requiera.

Agradezco de antemano su consideración y quedo atento a su respuesta.

Un cordial saludo,

Carlos Galera Román
Licenciado en Medicina · MIR R4 MFyC
Hospital General Universitario Santa Lucía · Área II Cartagena
Colegiado n.º [COMPLETAR ANTES DE ENVIAR] · ICOM Murcia
carlosgalera2roman@gmail.com
https://area2cartagena.es
```

---

## Versión 2 · Más breve / directa

```
Asunto: Solicitud de Web Sanitaria Acreditada · Cartagenaeste

Estimados compañeros,

Soy Carlos Galera Román, colegiado n.º [XXXX] del ICOM Murcia, residente
R4 de Medicina Familiar y Comunitaria en el HGU Santa Lucía (Área II).

Solicito la inclusión de la plataforma formativa Cartagenaeste
(https://area2cartagena.es) en el sello de Web Sanitaria Acreditada.

Resumen:

 · Plataforma formativa y organizador personal de guardia, uso clínico
   activo en Urgencias HSL.
 · Autor único, sin publicidad ni patrocinio comercial activo.
 · Cumple RGPD, LOPDGDD, EU AI Act. Datos en UE.
 · RPI 00765-03096622 · solicitud HONcode paralela en curso.

Adjunto dossier completo con credenciales, políticas y anexos.

Quedo a su disposición para lo que necesiten.

Un saludo,

Carlos Galera Román
[Firma completa como en versión 1]
```

---

## Checklist antes de enviar

- [ ] Confirmar dirección de destinatario con la web del ICOM Murcia o por teléfono (968 283 900). El email indicado es una suposición razonable; confirmar.
- [ ] Tener el **número de colegiado** a mano y sustituir `[COMPLETAR]`.
- [ ] Verificar criterios actuales del sello en https://www.commurcia.es/ (pueden haber cambiado).
- [ ] Convertir a PDF:
  - `/transparencia.html`
  - `/privacidad.html`
  - `/aviso-legal.html`
  - `/about.html`
  - `/acreditaciones.html`
  - `/financiacion.html`
  Usar `Cmd+P → Guardar como PDF` en Chrome con formato A4.
- [ ] Generar PDF del dossier HONcode:
  ```bash
  pandoc docs/honcode-dossier.md -o docs/honcode-dossier.pdf \
    --pdf-engine=xelatex \
    -V mainfont="Helvetica" \
    -V fontsize=10pt \
    -V geometry:margin=2cm
  ```
- [ ] Tener listo el **certificado de colegiación** actualizado.
- [ ] Preparar el **título de Licenciado en Medicina** en PDF.

---

## Recordatorio · seguimiento

Si no hay respuesta en **30 días naturales**, enviar email de recordatorio:

```
Asunto: Seguimiento · Solicitud Web Sanitaria Acreditada · Cartagenaeste

Estimada Junta,

El pasado [FECHA_ENVÍO] remití solicitud para la acreditación Web
Sanitaria de la plataforma Cartagenaeste (https://area2cartagena.es).

Escribo simplemente para confirmar que la solicitud fue recibida y
consultar si necesitan documentación adicional o aclaración sobre algún
aspecto del dossier.

Quedo a su disposición.

Un cordial saludo,
[Firma]
```
