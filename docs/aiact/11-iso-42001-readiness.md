# 11 · ISO/IEC 42001:2023 Readiness Statement

> **Estado**: declaración voluntaria de alineamiento. EvidenciaIA NO está certificada ISO/IEC 42001 a fecha de este documento. Esta sección documenta el grado de alineamiento del sistema con los controles de la norma como base para una eventual certificación o como evidencia ante interlocutores institucionales (SMS Murcia, UMU, auditores).
>
> **Fecha**: 2026-05-05 · **Próxima revisión**: 2026-11-05.

## 11.1 Por qué ISO 42001

ISO/IEC 42001:2023 es el primer estándar internacional para Sistemas de Gestión de Inteligencia Artificial (AIMS — *Artificial Intelligence Management Systems*). Define controles análogos a los de ISO 27001 pero específicos para IA: gestión de datos, sesgo, transparencia, supervisión humana, evaluación continua de impacto.

Los competidores europeos en IA médica formativa/clínica que ya la han conseguido (ej. Kleia/iDoctus) la usan como diferenciador comercial. Para EvidenciaIA, alinearse con ISO 42001 sin certificarla formalmente:

- Da lenguaje regulatorio común con interlocutores como SMS Murcia y UMU.
- Prepara el camino si en el futuro se decide certificar (Puerta C del roadmap).
- Refuerza la Puerta A (formativo) demostrando rigor sin sobre-prometer.

## 11.2 Mapeo controles ISO 42001 → implementación EvidenciaIA

### Cláusula 4 · Contexto de la organización

| Control | Estado | Evidencia |
|---|---|---|
| 4.1 Comprensión organización + contexto | ✅ | `index.md` + `01-system-purpose.md` |
| 4.2 Necesidades partes interesadas | ✅ | `01-system-purpose.md` §1.4 (usuarios objetivo) |
| 4.3 Alcance del AIMS | ✅ | `01-system-purpose.md` §1.2 + 1.3 |
| 4.4 Sistema gestión de IA | parcial | Documentado pero sin auditor externo |

### Cláusula 5 · Liderazgo

| Control | Estado | Evidencia |
|---|---|---|
| 5.1 Compromiso de la dirección | ✅ | Carlos Galera Román = autor + dirección + decisor único |
| 5.2 Política IA | ✅ | `index.md` + `04-transparency.md` |
| 5.3 Roles y responsabilidades | parcial | Single-person; documentado en `08-incident-response.md` (procedimientos P0-P3) |

### Cláusula 6 · Planificación

| Control | Estado | Evidencia |
|---|---|---|
| 6.1 Riesgos y oportunidades | ✅ | `02-risk-assessment.md` (matriz 15 riesgos) |
| 6.1.2 Evaluación de impacto IA | ✅ | `03-data-governance.md` + `02-risk-assessment.md` |
| 6.2 Objetivos IA | ✅ | `06-accuracy-robustness.md` §6.1 (métricas con umbrales) |
| 6.3 Planificación de cambios | ✅ | `09-model-versioning.md` (política cambio prompt + modelo + safeguards) |

### Cláusula 7 · Soporte

| Control | Estado | Evidencia |
|---|---|---|
| 7.1 Recursos | parcial | Documentado en `index.md` (financiación personal del autor) |
| 7.2 Competencia | parcial | Autor MFyC + Reg. PI 00765-03096622 |
| 7.3 Concienciación | ✅ | Disclaimer obligatorio + `04-transparency.md` (8 capas) |
| 7.4 Comunicación | ✅ | Email `carlosgalera2roman@gmail.com` + canal feedback estructurado en UI |
| 7.5 Información documentada | ✅ | `docs/aiact/` completo, versionado en git público |

### Cláusula 8 · Operación

| Control | Estado | Evidencia |
|---|---|---|
| 8.1 Planificación y control operacional | ✅ | `evidenciaSearch.ts` con safeguards + cuotas + cache + logging |
| 8.2 Evaluación de impacto IA | ✅ | `02-risk-assessment.md` + bias audit harness (`biasAudit.ts`) |
| 8.3 Tratamiento de riesgos identificados | ✅ | Mitigaciones en `02-risk-assessment.md` |

### Cláusula 9 · Evaluación del desempeño

| Control | Estado | Evidencia |
|---|---|---|
| 9.1 Seguimiento, medición, análisis | ✅ | `07-logging-traceability.md` + dashboard admin |
| 9.2 Auditoría interna | ✅ automatizada | Bias audit harness en CI vitest cada push (`biasAudit.ts` runFullAudit) |
| 9.3 Revisión por la dirección | parcial | Revisión semestral documentada en `02-risk-assessment.md` §2.5 |

### Cláusula 10 · Mejora

| Control | Estado | Evidencia |
|---|---|---|
| 10.1 No conformidades y acciones correctivas | ✅ | `08-incident-response.md` (P0-P3 + post-mortem público en CHANGELOG) |
| 10.2 Mejora continua | ✅ | `10-post-market-surveillance.md` ciclo continuo |

## 11.3 Anexo A · Controles específicos IA

Mapeo a los controles del Anexo A de ISO 42001 (objetivos de control AI-específicos):

| Control A.x | EvidenciaIA |
|---|---|
| **A.2** Política IA | ✅ |
| **A.3** Estructura organizativa | parcial (single-author) |
| **A.4** Recursos IA | ✅ documentados |
| **A.5** Evaluación impacto sistemas IA | ✅ `02-risk-assessment.md` |
| **A.6** Ciclo de vida del sistema IA | ✅ `09-model-versioning.md` |
| **A.6.2.4** Verificación y validación | ✅ bias audit harness automatizado |
| **A.7** Datos para sistemas IA | ✅ `03-data-governance.md` |
| **A.7.2** Procedencia y calidad datos | ✅ tabla de fuentes con licencias |
| **A.7.3** Preparación datos | ✅ deduplicación, dedup DOI/PMID, sanitización safeguards |
| **A.8** Información para partes interesadas | ✅ `04-transparency.md` |
| **A.8.2** Documentación al usuario | ✅ disclaimer + dossier público |
| **A.9** Uso de sistemas IA | ✅ login + safeguards + logging |
| **A.9.2** Procesos para uso responsable | ✅ humano-en-el-bucle |
| **A.9.3** Objetivos para uso responsable | ✅ `01-system-purpose.md` (formativo) |
| **A.10** Relaciones con partes terceras | ✅ `03-data-governance.md` §3.6 (transferencias internacionales) |

## 11.4 Brechas reconocidas vs certificación formal

Para una **certificación ISO 42001 real** (no solo readiness) faltaría:

1. **Auditor independiente** que revise la documentación + el sistema en operación.
2. **Evidencia operacional** durante 3-6 meses (logs, incidentes, mejoras aplicadas).
3. **Política de competencia formal** con planes de formación documentados (cláusula 7.2).
4. **Revisión por la dirección periódica documentada** con actas (cláusula 9.3) — single-author lo hace difícil pero no imposible.
5. **Procedimientos formales documentados** firmados con sello de versión + aprobación.

Coste estimado certificación formal: 8-15k€ + 6 meses calendario. Decidir si proceder es elección estratégica (ver `index.md` y la "Puerta C" del análisis).

## 11.5 Diferenciador vs Kleia (iDoctus)

| Aspecto | EvidenciaIA | Kleia |
|---|---|---|
| ISO 27001 (seguridad información) | en proceso (no formal) | ✅ certificada |
| ISO 42001 (gestión IA) | **alineada con docs**, no certificada | ✅ certificada |
| ISO 13485 (QMS sanitario) | no aplica (formativo) | en proceso |
| CE Mark MDR | no aplica (formativo) | en proceso |
| Dossier AI Act público | ✅ open source en git | no visible |
| Bias audit harness automatizado | ✅ en CI (40+ escenarios) | declarado, no público |
| Coste para usuario | gratuito | a definir comercial |

EvidenciaIA gana en **transparencia** (dossier público + bias audit en CI público) y **coste**; Kleia gana en **certificación formal** y **base instalada** (~600k médicos hispanohablantes).

## 11.6 Plan de mejora 2026

- [ ] Q3 2026: revisión externa del dossier por consultor de cumplimiento (presupuesto pendiente).
- [ ] Q4 2026: explorar viabilidad económica de certificación ISO 42001 si SMS Murcia/UMU lo respaldan.
- [ ] Q4 2026: añadir programa de pen-testing trimestral (control A.9 §A.9.2.5).
- [ ] Continuo: bumpear `SCENARIOS_VERSION` en `biasAudit.ts` cada vez que se añadan ≥5 escenarios nuevos.
