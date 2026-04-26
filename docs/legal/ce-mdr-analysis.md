# Análisis CE / MDR · ¿Es Cartagenaeste un dispositivo médico?

**Reglamento (UE) 2017/745 (MDR) · Reglamento (UE) 2017/746 (IVDR)**

⚠️ **Aviso preliminar**: este documento es un **análisis interno para soporte de decisiones**. La calificación final de un producto como dispositivo médico es competencia de un **organismo notificado** o autoridad competente (AEMPS en España). Antes de cualquier afirmación pública o contractual sobre la categoría del producto, **consultar con un asesor jurídico especializado en MDR / Medical Affairs**.

---

| Campo | Valor |
|---|---|
| Producto | Cartagenaeste · Asistente formativo con IA |
| Versión analizada | v1.x (estado abril 2026) |
| Posicionamiento declarado | "Plataforma formativa y organizador personal de guardia. NO diagnóstica. NO sustituye juicio clínico." |
| Conclusión interna | **NO es dispositivo médico bajo MDR** en el uso actual, manteniendo el posicionamiento estricto. |
| Riesgo de reclasificación | **Medio-alto** si evoluciona hacia ayuda decisional clínica directa. |

## 1. Definición legal de dispositivo médico

MDR art. 2.1 — un producto es dispositivo médico si su finalidad prevista declarada por el fabricante incluye:

- (a) Diagnóstico, prevención, monitorización, predicción, pronóstico, tratamiento o alivio de enfermedad.
- (b) Diagnóstico, monitorización, tratamiento, alivio o compensación de una lesión o discapacidad.
- (c) Investigación, sustitución o modificación de la anatomía o de procesos fisiológicos.
- (d) Suministro de información mediante examen in vitro de muestras humanas (IVDR).

→ Lo que **importa es la finalidad prevista declarada**, no las capacidades técnicas del producto.

## 2. Software como dispositivo médico (SaMD)

La guía MDCG 2019-11 (Manual sobre la cualificación y clasificación del software bajo MDR/IVDR) precisa cuándo software es dispositivo médico:

> "El software se considera dispositivo médico cuando ha sido específicamente destinado por el fabricante para ser utilizado, solo o en combinación, con uno o varios fines médicos establecidos en la definición de producto sanitario."

**Tres pruebas clave** para que software NO sea dispositivo médico:

1. **¿La salida del software se usa para una decisión clínica sobre un paciente concreto?** — Si NO, no es dispositivo médico.
2. **¿La salida puede sustituir o aumentar el juicio del profesional sanitario?** — Si NO, no es dispositivo médico.
3. **¿El software es de propósito general o gestión administrativa?** — Si SÍ (gestión, agenda, formación, biblioteca, calculadora simple), no es dispositivo médico.

## 3. Aplicación a Cartagenaeste · módulo a módulo

| Módulo | Finalidad declarada | ¿Decide sobre paciente concreto? | ¿Sustituye juicio? | Calificación |
|---|---|---|---|---|
| **Casos clínicos formativos** | Material docente entre pares | No | No | NO dispositivo médico |
| **MegaCuaderno IA** | Generación de resúmenes formativos para estudio | No | No | NO dispositivo médico |
| **ScanIA (Rx, derma, ECG)** | Apoyo educativo para residentes — práctica de interpretación | ⚠️ Riesgo si se usa con caso real sin disclaimer | No (con disclaimer) | NO dispositivo médico **mientras** se mantenga el contexto formativo |
| **Triaje formativo** | Práctica de algoritmos de triaje para residentes MIR | No (es práctica) | No | NO dispositivo médico |
| **Calculadoras clínicas** (CHA2DS2-VASc, qSOFA, NIHSS…) | Calculadora administrativa | No (calculadora pura) | No (resultado es matemático) | NO dispositivo médico (calculadora estándar, no "decisión clínica") |
| **Buscador vademécum** | Consulta de información de fármacos | No | No | NO dispositivo médico (biblioteca) |
| **Protocolos y guías** | Lectura de protocolos preexistentes | No | No | NO dispositivo médico (biblioteca) |
| **Plantillas de informes** | Soporte administrativo | No | No | NO dispositivo médico |
| **Agenda de guardia** | Organizador personal | No | No | NO dispositivo médico |
| **Recursos para pacientes** | Información de salud pública (pre/post consulta, recursos sociales, dejar de fumar) | No | No | NO dispositivo médico (biblioteca / educación) |

## 4. Zonas grises actuales

### 4.1 ScanIA con caso clínico real

Si un médico carga la radiografía de un paciente actual y lee la respuesta de ScanIA antes de decidir, **podría argumentarse** que el software contribuye a una decisión clínica sobre paciente concreto. Mitigaciones actuales:

- Disclaimer permanente "Generado con IA · Uso exclusivamente docente · No es producto sanitario (MDR 2017/745)".
- Posicionamiento "para residentes / formación" en UI.
- No se almacena el caso del paciente identificado.

**Recomendación**: en la próxima iteración, añadir un *modal* explícito al cargar imagen — "Esta función es exclusivamente docente. Si la imagen pertenece a un paciente bajo su cuidado, NO use esta respuesta para decisión clínica" — con aceptación obligatoria.

### 4.2 MegaCuaderno con prompt clínico

Si un médico pregunta "Paciente con disnea + FA + edema bimaleolar — ¿qué hago?" — la respuesta puede acercarse a "ayuda decisional clínica". Mitigaciones:

- Validador anti-PII (no acepta DNI/NIE/NHC/nombres).
- Footer permanente con disclaimer.
- systemPrompt server-side fijado a "asistente formativo, no diagnóstico".

### 4.3 Sugerencia futura: integración con HCE

Si en el futuro se integra con la HCE del SMS/SELENE para cargar datos del paciente automáticamente → **cruza claramente la línea** y pasaría a SaMD clase IIa mínimo. Documento de transición preparado en `docs/legal/ai-act-high-risk-transition-plan.md` (a redactar cuando se decida).

## 5. Clase de SaMD si se reclasificase

Si se reclasificase como dispositivo médico, según MDR Anexo VIII regla 11:

> "Software intended to provide information used to take decisions with diagnosis or therapeutic purposes is classified as **class IIa**, except if such decisions have an impact that may cause [...] **death or irreversible deterioration** → class III, [...] serious deterioration → class IIb."

| Caso | Clase MDR |
|---|---|
| ScanIA usado para decisión sobre Rx torácica de un paciente real | **IIa o IIb** según riesgo |
| Asistente decisional para urgencias (sepsis, ICC) | **IIb** (decisión que puede causar deterioro grave) |
| Asistente decisional para oncología o cirugía | **III** (decisión que puede causar muerte) |

Cumplimiento clase IIa/IIb requeriría:
- Sistema de gestión de calidad ISO 13485.
- Documentación técnica completa Anexo IV MDR.
- Notified body para conformity assessment.
- Marcado CE.
- Vigilancia post-mercado.
- Coste estimado primera certificación: 30.000 – 80.000 € + 12-18 meses de proceso.

## 6. Recomendación interna

| Decisión | Acción |
|---|---|
| **Mantener posicionamiento formativo estricto** | Recomendado para v1.x. Mantener disclaimers, no integrar HCE de paciente identificado, no añadir features que sugieran diagnóstico autónomo. |
| **Reforzar disclaimers en zonas grises** | ScanIA y MegaCuaderno: añadir modal explícito con aceptación al primer uso. |
| **Documentar la decisión** | Este doc + revisión semestral con asesor MDR. |
| **Plan B documentado para reclasificación** | Si negocio exige cruzar la línea (p.ej. AstraZeneca pide certificación), tener listo el plan IIa con presupuesto y partner notified body identificado. |

## 7. Comunicación pública

**Lo que SÍ se puede afirmar**:
- "Plataforma formativa para profesionales sanitarios."
- "Organizador personal de guardia."
- "Asistente educativo para residentes."
- "Calculadoras y biblioteca de protocolos."

**Lo que NO se puede afirmar** sin marcado CE:
- ❌ "Asistente diagnóstico."
- ❌ "Ayuda a decisiones clínicas." (CDS · Clinical Decision Support sí entra en MDR).
- ❌ "Sistema clínico inteligente."
- ❌ "Mejora la precisión diagnóstica del residente."
- ❌ Cualquier reclamo de eficacia clínica medida.

## 8. Próximas acciones

- [ ] Revisión de la página principal y dossier comercial para asegurar que ningún copy cruce la línea.
- [ ] Modal de primer uso en ScanIA con aceptación obligatoria.
- [ ] Asesoría jurídica externa con un bufete especializado en MDR (TÜV España, BSI, IMQ, etc.) — presupuesto estimado: 1.500 – 3.000 € por consulta inicial documentada.
- [ ] Si se firma con primer hospital: cláusula contractual explícita de "uso exclusivamente formativo, no clínico".

---

*Documento de análisis interno — no constituye dictamen legal vinculante.*
*Carlos Galera Román · Cartagenaeste © 2026 · LPI 00765-03096622*
