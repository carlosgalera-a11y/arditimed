# 12 · Clasificación MDR + AI Act · justificación legal

> **Tesis**: EvidenciaIA NO es producto sanitario bajo MDR 2017/745 ni sistema de IA de alto riesgo bajo AI Act 2024/1689 art. 6 + Anexo III. Es un sistema de IA de **riesgo limitado** sujeto a las obligaciones de transparencia del art. 50.
>
> **Base legal**: combinación de las estrategias 1 ("consulta de evidencia, no de diagnóstico") + 3 ("second opinion sin vínculo al paciente concreto"), con opción adicional de la estrategia 4 (art. 5(5) MDR · uso in-house) para despliegue formal en SMS Murcia.
>
> **Última revisión**: 2026-05-05.

---

## 12.1 Las cuatro estrategias legales para una IA tipo OpenEvidence en la UE

A continuación se documentan las cuatro vías reconocidas por la doctrina actual (artificialintelligenceact.eu, pro.campus, mdxcro.com, comentario académico) para operar una herramienta funcionalmente equivalente a OpenEvidence sin convertirse en SaMD clase IIa/IIb. EvidenciaIA combina las estrategias 1 y 3 explícitamente; la estrategia 4 queda disponible como vía de despliegue institucional.

### Estrategia 1 · Consulta de evidencia, no de diagnóstico

> El modelo más limpio legalmente es el de Consensus o UpToDate: la herramienta NO diagnostica ni sugiere tratamientos sobre el paciente, sino que **recupera y resume evidencia científica** sobre condiciones o fármacos. El médico hace la pregunta, recibe literatura sintetizada y aplica su criterio.

**Consecuencias regulatorias**:
- NO es producto sanitario bajo MDR (no tiene "intended purpose" diagnóstico ni terapéutico individual).
- NO entra en el Anexo III del AI Act como sistema de alto riesgo (no es sistema de soporte a decisión clínica regulado).

**Funcionalmente** se siente igual que OpenEvidence para el médico, pero **jurídicamente** es muy diferente.

**EvidenciaIA aplica esta estrategia**:
- Ver `01-system-purpose.md` §1.2 (uso previsto) y §1.3 (NO uso previsto).
- Las salvaguardas de `safeguards.ts` rechazan en tiempo de ejecución cualquier pregunta que solicite diagnóstico o tratamiento individual antes de invocar al modelo IA.
- El system prompt de la síntesis (`ragSynthesizer.ts`) instruye explícitamente al modelo a "sintetizar ÚNICAMENTE el contenido de los abstracts" y a rechazar consultas individualizadas.

### Estrategia 2 · Formación y simulación clínica

> Si el contexto declarado es **formación de profesionales** (simulación de casos, entrenamiento diagnóstico), el AI Act la saca explícitamente del Anexo III de alto riesgo. Permite hacer diagnóstico diferencial, interpretación de imágenes, propuesta de tratamiento — **pero en casos simulados o históricos anonimizados, no sobre pacientes reales en tiempo real**.

**Consecuencias regulatorias**:
- AI Act Anexo III no aplica a IA usada para fines exclusivamente formativos sobre casos no-individualizados.
- Permite explorar funcionalidades más avanzadas (Dx diferencial sobre vignettes) sin escalar a alto riesgo.

**EvidenciaIA NO se posiciona aquí actualmente**, pero queda como reserva táctica si en el futuro se abre un módulo "Casos clínicos formativos" sobre vignettes anonimizados.

### Estrategia 3 · Second opinion sin vínculo al paciente concreto

> Si la herramienta **nunca toca datos del paciente real** (sin nombre, sin historial clínico cargado), sino que el médico describe un caso de forma anónima y recibe información general, **el nexo entre la IA y el paciente se rompe legalmente**. El médico es entonces quien hace la conexión mental, no el sistema. Esto la acerca más a una **calculadora clínica avanzada** (como MDCalc, que opera sin certificación SaMD de alto riesgo).

**Consecuencias regulatorias**:
- Sin vínculo IA→paciente, no hay "intended purpose" de diagnóstico/terapia sobre un individuo concreto → no es SaMD.
- La responsabilidad del salto cognitivo "información general → aplicar a mi paciente" recae en el clínico, no en el sistema.
- Modelo MDCalc, BMJ Best Practice (consulta), DynaMed (consulta) — todos operan sin marcado CE como dispositivos médicos.

**EvidenciaIA aplica esta estrategia explícitamente**:
- Las salvaguardas (`safeguards.ts`) rechazan input con DNI/NIE, fechas de nacimiento, teléfonos.
- Las salvaguardas rechazan formulaciones "mi paciente", "qué le pongo", "qué le receto".
- La pregunta llega anónima al modelo IA por construcción (validación regex pre-modelo).
- El log `evidencia_consultas` registra `patient_link_broken: true` como evidencia procedimental de que el sistema no creó vínculo paciente→IA.

### Estrategia 4 · Uso interno en entorno sanitario acreditado (B2B in-house)

> Las herramientas de IA desplegadas dentro de un sistema hospitalario o centro de salud como herramienta interna **NO están obligadas a obtener Marcado CE** si el propio centro sanitario las desarrolla o encarga para uso propio, bajo el **artículo 5(5) del MDR**. Podrías venderla como un proyecto de implementación a medida para clínicas o centros de salud, no como producto comercial empaquetado. La responsabilidad recae en el centro, no en ti como fabricante.

**Consecuencias regulatorias**:
- Art. 5(5) MDR: exención "in-house" cuando un centro sanitario desarrolla o encarga la herramienta para uso propio.
- La responsabilidad clínica reside en el centro, no en el desarrollador/encargado.
- No requiere marcado CE ni notified body.
- Permite a la herramienta funcionar incluso con capacidades que serían SaMD si se vendiesen B2C.

**EvidenciaIA tiene esta vía abierta**:
- Aunque el posicionamiento por defecto es Estrategia 1 + 3 (público para profesionales autenticados de cualquier centro), nada impide que SMS Murcia / HSL Cartagena adopten EvidenciaIA como herramienta interna bajo art. 5(5). La negociación queda en `roadmap.md`.

---

## 12.2 Combinación elegida: 1 + 3 (operación pública por defecto)

EvidenciaIA opera por defecto bajo **Estrategia 1 + Estrategia 3 simultáneamente**:

| Mecanismo | Estrategia 1 (consulta de evidencia) | Estrategia 3 (sin vínculo al paciente) |
|---|---|---|
| Input del usuario | Validado contra patrones diagnósticos/terapéuticos individuales | Validado contra patrones PII (DNI, NIE, fecha, teléfono) |
| Procesamiento IA | System prompt instruye "sintetizar abstracts, no diagnosticar" | Modelo recibe pregunta anónima sin metadatos del paciente |
| Output | Síntesis con citas verificables, no recomendación individual | Información general aplicable; el clínico hace el salto |
| UI | Disclaimer art. 50 + GRADE + tooltip de citas | Banner permanente "no SaMD · no sustituye juicio clínico" |
| Logging | `evidencia_consultas` con `rechazada` + `motivo_rechazo` | `patient_link_broken: true` por defecto + safeguards anti-PII |

**Resultado**: funcionalmente OpenEvidence-like, jurídicamente fuera del MDR + fuera del Anexo III del AI Act.

---

## 12.3 Mecanismos técnicos que articulan estas estrategias

### Para Estrategia 1 (consulta de evidencia)

- `safeguards.ts` rechaza 6 patrones diagnósticos: "qué tiene mi paciente", "diagnóstico de mi paciente", "tiene cáncer/tumor/infarto/ictus", "es maligno/benigno", "es un cáncer", "diagnóstico diferencial de este/mi/un paciente".
- `safeguards.ts` rechaza 5 patrones terapéuticos individuales: "qué le receto/prescribo/pongo/doy/administro", "qué dosis le pongo a mi paciente", "es urgente operar/intervenir/derivar", "tengo que operarlo", "a qué hospital lo derivo".
- System prompt de `ragSynthesizer.ts` declara explícitamente: "NO eres un médico ni das consejos médicos · NO recomiendas tratamientos, diagnósticos ni actuaciones para pacientes concretos · Sintetizas ÚNICAMENTE el contenido de los abstracts".
- Si la pregunta es individualizada, el modelo está instruido a responder: "Esta consulta requiere juicio clínico individualizado y queda fuera del alcance de EvidenciaIA. Te puedo ayudar a buscar evidencia sobre [reformulación general]".

### Para Estrategia 3 (vínculo IA→paciente roto)

- `safeguards.ts` rechaza 4 patrones PII: DNI, NIE, fecha dd/mm/yyyy, teléfono español.
- La pregunta sanitizada (sin PII) es la única que viaja al modelo IA y a las APIs externas (PubMed, etc.).
- No se almacenan ni transmiten: nombres, NHC, número de cama, diagnóstico individual, fechas de visita.
- En cada respuesta, el log persiste `patient_link_broken: true` como evidencia procedimental de la ausencia de vínculo.
- En el disclaimer art. 50, el lenguaje refuerza: "El médico describe el caso de forma anónima; el sistema responde con literatura general. La conexión IA→paciente la hace el clínico, no el software".

---

## 12.4 ¿Y si el clínico aún así nos cuenta del paciente?

Capa adicional de defensa (defense in depth):

1. **Validación regex pre-modelo**: si el texto contiene patrón PII reconocible, rechazo inmediato sin tocar IA.
2. **Truncado de pregunta a 500 caracteres**: limita la cantidad de contexto clínico que un usuario puede pegar.
3. **Sin ingestión de archivos**: el textarea es texto puro; no hay upload de PDF/imagen/historial. La superficie de exfiltración accidental es mínima.
4. **System prompt instruye al modelo a NO procesar contenido PII** aunque llegue: si detecta nombre+DNI+NHC, debe responder con la respuesta de rechazo individualizada.
5. **Logging permite auditoría retrospectiva**: si en 6 meses surge un incidente, podemos demostrar que el sistema rechazó X% de inputs sospechosos.

---

## 12.5 Cómo presentar esto a SMS Murcia / UMU / auditor

**Resumen de una página** para llevar a una reunión:

1. **¿Qué es EvidenciaIA?** Herramienta formativa de búsqueda bibliográfica con síntesis IA. NO produce diagnóstico ni tratamiento individual.
2. **¿Por qué NO es producto sanitario?** Combina Estrategia 1 (consulta de evidencia, NO diagnóstico) + Estrategia 3 (vínculo IA→paciente roto por construcción técnica).
3. **¿Cómo se garantiza?** Salvaguardas regex pre-modelo + system prompt restrictivo + logging completo + bias audit harness ejecutable + dossier público en `docs/aiact/`.
4. **¿Cómo se diferencia jurídicamente de OpenEvidence?** OpenEvidence se posiciona como CDSS (USA, sin marcado CE conocido en UE). EvidenciaIA se posiciona como herramienta formativa de evidencia sin vínculo al paciente. Funcional ≠ Jurídico.
5. **¿Vía de despliegue institucional?** Si SMS Murcia adopta la herramienta como uso interno bajo art. 5(5) MDR, la responsabilidad clínica es del centro y no requiere marcado CE.

---

## 12.6 Cuándo SÍ pasaría a ser producto sanitario

Si en algún momento futuro se introducen las siguientes funcionalidades, EvidenciaIA pasaría a ser SaMD y requeriría reclasificación + marcado CE:

- **Diagnóstico diferencial sobre paciente concreto**: el clínico introduce datos de un paciente real (incluso anonimizados pero individualizables) y la IA propone diagnósticos.
- **Recomendación de dosis/fármaco/derivación para un paciente concreto**.
- **Triaje sintomático con vínculo a un paciente identificable** (incluso por uid/NHC).
- **Predicción de outcome individual** (riesgo cardiovascular a 10 años de un paciente concreto, p.ej.).
- **Procesamiento de imágenes médicas** con output diagnóstico.

Cualquiera de estos cambios obligaría a:
1. Re-evaluar la clasificación MDR (probablemente clase IIa o IIb).
2. Iniciar proceso de marcado CE (notified body, ISO 13485, IEC 62304, ISO 14971, clinical evaluation).
3. Re-evaluar la clasificación AI Act (probablemente sistema de alto riesgo, Anexo III).
4. Revisar este dossier completo y re-emitir.

**Política**: cualquier propuesta de añadir funcionalidad de las anteriores requiere Plan + revisión legal antes de codificar.

---

## 12.7 Referencias

- Reglamento (UE) 2017/745 — Reglamento sobre Productos Sanitarios (MDR), especialmente art. 5(5) (uso in-house) y Anexo VIII (reglas de clasificación).
- Reglamento (UE) 2024/1689 — Reglamento de Inteligencia Artificial (AI Act), especialmente art. 6 (sistemas de alto riesgo), art. 50 (transparencia) y Anexo III (lista de sistemas de alto riesgo).
- Comentario doctrinal: artificialintelligenceact.eu, pro.campus, mdxcro.com (sobre las cuatro estrategias).
- Modelos comparables operando sin marcado CE como referencia: Consensus, UpToDate, MDCalc, BMJ Best Practice, DynaMed.
