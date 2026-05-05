# EvidenciaIA · Dossier de cumplimiento AI Act + RGPD

> **Estado**: vigente desde 2026-05-04. Revisión obligatoria cada 6 meses o ante cambio sustancial del sistema.
> **Responsable de cumplimiento**: Carlos Galera Román, MFyC (autor único y propietario IP, Reg. PI 00765-03096622).
> **Producto**: EvidenciaIA — módulo formativo de búsqueda bibliográfica de la PWA Cartagenaeste (`area2cartagena.es`).

## Posicionamiento regulatorio

EvidenciaIA es una **herramienta formativa de búsqueda bibliográfica con síntesis IA**. **NO es un producto sanitario (SaMD) bajo MDR 2017/745**, NO es un sistema de soporte a la decisión clínica (CDSS) y NO está sujeto al marcado CE médico.

Bajo el **Reglamento (UE) 2024/1689 (AI Act)**, EvidenciaIA se clasifica como **sistema de IA de riesgo limitado**, sujeto principalmente a las obligaciones de transparencia del **art. 50** (informar al usuario de que interactúa con IA y que el contenido se ha generado/sintetizado con IA).

> Esta clasificación se justifica por: (a) salvaguardas activas que rechazan preguntas de diagnóstico/terapéutica individual antes de llamar al modelo, (b) disclaimer obligatorio aceptado por checkbox en cada sesión, (c) ausencia de funciones de soporte clínico individualizado, (d) trazabilidad completa en `evidencia_consultas`.

## Índice del dossier

| # | Documento | Cubre |
|---|---|---|
| 01 | [System Purpose Statement](./01-system-purpose.md) | Uso previsto, NO uso previsto, usuarios objetivo |
| 02 | [Risk Assessment](./02-risk-assessment.md) | AI Act art. 9 — análisis de riesgos con matriz |
| 03 | [Data Governance](./03-data-governance.md) | AI Act art. 10 — origen, calidad y sesgo de datos |
| 04 | [Transparency](./04-transparency.md) | AI Act art. 50 + 13 — obligaciones de información |
| 05 | [Human Oversight](./05-human-oversight.md) | AI Act art. 14 — humano-en-el-bucle |
| 06 | [Accuracy & Robustness](./06-accuracy-robustness.md) | AI Act art. 15 — exactitud, robustez, ciberseguridad |
| 07 | [Logging & Traceability](./07-logging-traceability.md) | AI Act art. 12 — qué se loguea, retención |
| 08 | [Incident Response](./08-incident-response.md) | Procedimiento ante síntesis dañinas o sesgadas |
| 09 | [Model & Prompt Versioning](./09-model-versioning.md) | Trazabilidad de versiones de modelo y prompts |
| 10 | [Post-Market Surveillance](./10-post-market-surveillance.md) | Vigilancia voluntaria post-despliegue |
| 11 | [ISO/IEC 42001 Readiness](./11-iso-42001-readiness.md) | Mapeo de controles del estándar AIMS para alineamiento voluntario |
| 12 | [MDR Classification Rationale](./12-mdr-classification-rationale.md) | Las 4 estrategias legales para una IA tipo OpenEvidence en la UE; combinación 1+3 elegida |

## Cumplimiento RGPD

EvidenciaIA cumple el RGPD (Reglamento (UE) 2016/679) y la LOPDGDD por:

- **Minimización de datos** (art. 5): no se recogen DNI/NIE, NHC, nombres completos. Solo iniciales (≤4) + cama + edad cuando proceda.
- **Residencia UE**: Firebase project `docenciacartagenaeste`, region `europe-west1` (Bélgica).
- **Salvaguardas anti-PII** en el input: la pregunta del usuario se valida con regex contra patrones DNI/NIE/fecha/teléfono antes de procesarse.
- **Derechos del interesado** (arts. 15-22): formulario en `/derechos-rgpd.html`.
- **Política de privacidad**: `/privacidad.html`, EIPD documentada.
- **App Check enforce** activo en Firestore + Functions + Storage.

## Consultas

Para auditorías, consultas regulatorias o reportes de incidentes: `carlosgalera2roman@gmail.com`.
