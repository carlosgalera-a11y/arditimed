# Email al Jefe de Servicio de Urgencias HSL · versión v2 cerrada

> ⚠️ **NO ENVIADO.** Esta versión está **lista para enviar esta semana** tras revisar que los datos son correctos. Actualiza `docs/email-jefe-urgencias.md` (versión anterior) con importes e hitos concretos del dossier comercial.

---

## Metadatos del envío

| Campo | Valor |
|---|---|
| **Para** | [Email directo del Jefe de Servicio de Urgencias HGU Santa Lucía] |
| **Asunto** | Cartagenaeste · Propuesta formal de contratación · reunión 45 min |
| **De** | Carlos Galera Román `<carlosgalera2roman@gmail.com>` |
| **CC** | (opcional) Jefatura de Estudios / Coordinador de la Unidad Docente MFyC |
| **Adjuntos** | `dossier-comercial.pdf` (6 páginas), `propuesta-economica-urgencias-hsl.pdf` (desglose de 14.000 €), `transparencia.pdf`, `ehds-readiness.pdf` |

---

## Email principal

```
Asunto: Cartagenaeste · Propuesta formal de contratación · reunión 45 min

Estimado [Nombre del Jefe de Servicio],

Siguiendo nuestra conversación informal sobre el uso de Cartagenaeste
en la Unidad de Urgencias del HGU Santa Lucía durante los últimos
meses, te escribo con la propuesta formal de contratación que me
pediste.

Lo adjunto todo en PDF (dossier de 6 páginas + desglose económico +
documentos de cumplimiento). Los puntos clave:

──────────────────────────────────────────────────────────────
1) Estado actual

 · Uso clínico real en Urgencias HSL desde hace varios meses con
   feedback positivo de adjuntos y residentes.
 · 132 protocolos institucionales indexados + plantillas de
   informes + vademécum contextualizado + calculadoras clínicas +
   módulo Scan IA (dermatología, Rx, ECG, eco).
 · Cumplimiento 100%: RGPD, LOPDGDD, EU AI Act 2024/1689, Ley
   41/2002. Datos en UE (europe-west1). Sin marcas comerciales.
   Disclaimer formativo permanente. Supervisión humana obligatoria.
 · Registro Propiedad Intelectual 00765-03096622 vigente.

──────────────────────────────────────────────────────────────
2) Propuesta económica año 1

14.000 € + IVA (21%) = 16.940 € totales. Desglose detallado en PDF:

 · Licencia de uso · servicio Urgencias (~80 profesionales)   3.500 €
 · Mantenimiento evolutivo                                    2.400 €
 · Hosting + infraestructura cloud + IA con SLA               1.200 €
 · Bolsa soporte 40 h · SLA 24 h respuesta                    2.000 €
 · Módulo específico "Fármacos de Urgencia ampliado"          2.500 €
 · Onboarding + 2 sesiones formativas al personal             1.200 €
 · Reporting trimestral de uso e impacto                      1.200 €

Pago trimestral adelantado.

Año 2+ recurrente: ≈ 10.300 €/año (mantiene licencia +
mantenimiento + hosting + soporte + reporting; el módulo
específico se renegocia con objeto distinto cada año).

──────────────────────────────────────────────────────────────
3) Qué obtiene el servicio

 · Uso ilimitado por el personal autorizado (sin cap de llamadas).
 · SLA 99,5% uptime · p95 <5s latencia · soporte 24h respuesta.
 · Monitor público de estado en https://area2cartagena.es/status.html
 · Informe mensual automático de uso agregado (sin datos
   personales, auditable).
 · Formación inicial y onboarding al personal.
 · Mejoras continuas y módulo específico en desarrollo durante
   el año 1.
 · Posibilidad de exportar datos en formato FHIR R4 estándar
   para futuras integraciones con la HCE corporativa.
 · Transparencia completa: repositorio público en GitHub,
   página de transparencia pública con cualquier financiación
   declarada.

──────────────────────────────────────────────────────────────
4) Procedimiento administrativo

Según Ley 9/2017 (Ley de Contratos del Sector Público), el
importe permite procedimiento de contrato menor de servicios
(hasta 15.000 € IVA excluido). Preparado para:

 · Memoria justificativa de necesidad (la redacto yo si te es
   útil).
 · Declaración responsable (AEAT + SS al corriente).
 · Certificación del Registro Propiedad Intelectual.
 · Póliza de RC profesional + ciber en trámite (Hiscox/AIG,
   operativa en mayo).
 · Entrega de contenido y facturación conforme al procedimiento
   del SMS.

──────────────────────────────────────────────────────────────
5) Solicitud concreta

Te propongo una reunión de **45 minutos** en los próximos 10 días
para:

 · Revisar el dossier punto por punto.
 · Ajustar el alcance (módulo específico, nº sesiones formación).
 · Acordar la ruta administrativa con la unidad de contratación
   del hospital.
 · Cerrar calendario de onboarding si procede.

Mis disponibilidades esta semana y la siguiente: [DAR 2-3 FECHAS/
HORAS CONCRETAS ANTES DE ENVIAR].

¿Prefieres que pase yo por el despacho, o quedamos en algún otro
sitio? Lo que te venga mejor.

Muchas gracias por tu confianza desde el principio. Con este paso
lo que hay funcionando de manera informal lo pasamos a tener una
cobertura contractual que protege al hospital, al personal y al
proyecto.

Un saludo cordial,

Carlos Galera Román
Licenciado en Medicina · MIR R4 MFyC
Hospital General Universitario Santa Lucía · Área II Cartagena
Autor y titular de Cartagenaeste
Reg. Propiedad Intelectual 00765-03096622
carlosgalera2roman@gmail.com · [Teléfono]
https://area2cartagena.es
```

---

## Checklist pre-envío

- [ ] Reemplazar "[Nombre del Jefe de Servicio]" por el nombre real.
- [ ] Confirmar el email directo (no secretaría) para llegada prioritaria.
- [ ] Decidir si se copia a Jefatura de Estudios (recomendado si hay buena relación: añade peso institucional).
- [ ] Fijar 2-3 fechas/horarios concretos de reunión.
- [ ] Generar los PDFs:
  - `dossier-comercial.pdf` desde `/dossier-comercial.html` (Chrome → Imprimir → A4).
  - `propuesta-economica-urgencias-hsl.pdf` — documento específico con desglose detallado, puedo generarlo en texto para convertir a PDF si lo pides.
  - `transparencia.pdf` desde `/transparencia.html`.
  - `ehds-readiness.pdf` desde `docs/legal/ehds-readiness.md` vía `pandoc`.
- [ ] Comprimir en `.zip` si >15 MB en total.
- [ ] Verificar que el teléfono está en la firma.
- [ ] Revisión final por 1 persona de confianza (cercano MIR o adjunto) antes de pulsar Enviar.
- [ ] Fijar la reunión en el calendario tuyo con recordatorio 24h antes.

## Siguiente paso después de enviar

1. Espera 5-7 días de respuesta inicial.
2. Si no responde en 10 días, recordatorio corto en copia al coordinador administrativo del servicio.
3. Si sí responde, confirmar hora y enviar 24h antes un email breve con orden del día de 5 puntos.
4. Llevar impresos: 3 copias del dossier + 1 del desglose económico.

## Cómo se elige la hora

- **Hora fuerte**: martes-jueves 08:00-10:00 (antes de la marea de urgencias).
- **Hora mala**: viernes tarde · lunes mañana (post-guardia).
- Si no se encuentra hueco, ofrecer videollamada de 30 min como alternativa.
