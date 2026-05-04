# 01 · System Purpose Statement

## 1.1 Identidad del sistema

| Campo | Valor |
|---|---|
| Nombre | EvidenciaIA |
| Versión | Ver `09-model-versioning.md` (versión actual del system prompt + modelo IA en cada respuesta) |
| Producto madre | Cartagenaeste PWA (`area2cartagena.es`) |
| Responsable | Carlos Galera Román, MFyC · Reg. PI 00765-03096622 |
| Tecnología | Firebase Cloud Functions (`europe-west1`) + LLM RAG sobre PubMed/EuropePMC/OpenAlex/Cochrane/AEMPS/CORE/Semantic Scholar/ClinicalTrials.gov |
| Categoría regulatoria | **NO es producto sanitario (SaMD)**. Sistema IA de **riesgo limitado** según AI Act (UE) 2024/1689 |

## 1.2 Uso previsto (intended use)

EvidenciaIA es una **herramienta formativa de búsqueda bibliográfica con síntesis IA** dirigida a profesionales sanitarios en formación (residentes MFyC, especialidades hospitalarias) y profesionales en ejercicio que deseen consultar la literatura biomédica reciente sobre temas clínicos generales.

Sus funciones son:

1. Recuperar abstracts/metadatos de bases de datos científicas públicas (PubMed, Europe PMC, OpenAlex, Cochrane, CORE, Semantic Scholar, ClinicalTrials.gov, AEMPS).
2. Re-ranquear los resultados con un sesgo hacia evidencia europea de alta calidad (revisiones sistemáticas, RCT, guías ESC/NICE/GuíaSalud).
3. Generar una **síntesis textual con citas verificadas** `[n]` que el usuario puede contrastar contra la fuente original.
4. Asignar un **grado heurístico de calidad de evidencia** (GRADE-like A/B/C/D) basado en los tipos de estudio del top-5.
5. Sugerir **3 preguntas relacionadas** de búsqueda bibliográfica.
6. Facilitar **deep-links de verificación** a fuentes europeas reguladas (Preevid SMS Murcia, GuíaSalud, NICE, EMA, Cochrane Library, AEMPS CIMA, MEDES, SciELO, WHO IRIS, EU Clinical Trials Register).

## 1.3 NO uso previsto (intended NOT use)

EvidenciaIA **NO debe utilizarse** para:

- Diagnóstico de pacientes concretos.
- Recomendación de tratamiento, prescripción, dosis o duración para un paciente concreto.
- Triaje sintomático de pacientes (esa función la cumple `/triaje-ai.html`, módulo aparte y también marcado como formativo).
- Sustituir el juicio clínico del profesional o las guías oficiales del centro/sociedad científica.
- Prestar consejo médico al paciente final (la audiencia es exclusivamente profesional sanitario).
- Calcular interacciones farmacológicas vinculantes para prescripción (para esto, derivar a un sistema CE certificado tipo Posos o BOT Plus).
- Toma de decisiones automatizada sin supervisión humana (art. 22 RGPD).

Cualquier pregunta que solicite una de estas funciones es **rechazada por las salvaguardas** de `safeguards.ts` antes de invocar al modelo IA, y el rechazo se loguea en `evidencia_consultas` con el motivo.

## 1.4 Usuarios objetivo

| Perfil | Acceso |
|---|---|
| Médicos en formación (MIR, MFyC) | Login Google + verificación email |
| Médicos especialistas | Login Google + verificación email |
| Enfermería | Login Google + verificación email (uso formativo) |
| Pacientes / población general | NO. Página marcada `noindex,nofollow`, login obligatorio, disclaimer formativo bloquea el acceso sin aceptación |
| Personal no sanitario | NO autorizado |

## 1.5 Limitaciones reconocidas

EvidenciaIA tiene las siguientes limitaciones, comunicadas explícitamente al usuario en cada sesión:

1. **No accede a full text licenciado** (NEJM, JAMA, Lancet, etc.) salvo por la versión OA cuando existe (Unpaywall + CORE).
2. **No reemplaza la lectura crítica del original** — cada cita debe verificarse en la fuente.
3. **El modelo IA puede alucinar** referencias o tergiversar abstracts; el verificador `citationVerifier.ts` mitiga pero no elimina este riesgo.
4. **El GRADE asignado es heurístico**, no sustituye una valoración GRADE formal.
5. **La cobertura es la del corpus consultado** (~35M+ abstracts PubMed + complementarios). Evidencia muy reciente (preprints) está marcada como tal.
6. **El modelo IA es de proveedor externo** (DeepSeek/Gemini/Mistral/Qwen vía cadena `routing.ts`), no certificado para uso médico.

## 1.6 Idiomas soportados

Español (predominante) e inglés (cuando la fuente original lo requiera). No se garantiza calidad equivalente en otros idiomas.

## 1.7 Coste y modelo de negocio

EvidenciaIA es **gratuito** para profesionales sanitarios autenticados. No hay publicidad, no hay pasarela de pago, no hay datos comerciales. Se financia con los recursos personales del autor + posible apoyo institucional en negociación.
