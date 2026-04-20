# IP Attestation · Cartagenaeste

## Registro formal de propiedad intelectual

| Campo | Valor |
|---|---|
| Obra | Cartagenaeste — Plataforma formativa y organizador personal de guardia |
| Autor | Carlos Galera Román |
| Número de registro | **00765-03096622** |
| Organismo | Registro de la Propiedad Intelectual de la Región de Murcia |
| Marco legal | Ley de Propiedad Intelectual española (RDL 1/1996) |
| Cláusula específica | Declaración expresa al amparo del **Artículo 51 LPI** |

## Declaración del autor (Art. 51 LPI)

> La presente obra es propiedad personal y exclusiva del autor, Carlos Galera Román, y **no constituye obra derivada de relación laboral** con el Servicio Murciano de Salud, con ninguna entidad sanitaria pública o privada, ni con ninguna universidad o institución docente. El desarrollo se ha realizado en tiempo personal y con medios propios del autor. El Registro de la Propiedad Intelectual de la Región de Murcia ha verificado y protocolizado esta declaración con el número de expediente **00765-03096622**.

## Uso clínico actual

- **En uso activo** en el Servicio de Urgencias del Hospital General Universitario Santa Lucía, Área II de Cartagena (Servicio Murciano de Salud).
- Uso personal y voluntario por parte de profesionales sanitarios del área como herramienta formativa complementaria.
- **Sin contrato de suministro ni relación comercial** con el SMS a día de esta atestación.
- La aplicación es formativa y docente; **no es un producto sanitario** según el Reglamento (UE) 2017/745 (MDR).

## Componentes de terceros incorporados

Este repositorio usa software open source de terceros bajo sus propias licencias. La Licencia Propietaria de Cartagenaeste **no se extiende** a estos componentes.

| Componente | Licencia | Uso |
|---|---|---|
| Firebase SDK (app, auth, firestore, storage, functions, app-check) | Apache 2.0 | Plataforma backend (Auth, Firestore, Storage, Cloud Functions) |
| firebase-admin (Node) | Apache 2.0 | Cloud Functions runtime |
| firebase-functions (Node) | Apache 2.0 | Cloud Functions framework |
| google-auth-library | Apache 2.0 | Cloud Functions: invocación Firestore Admin API |
| Vitest | MIT | Tests unitarios |
| @vitest/coverage-v8 | MIT | Cobertura de tests |
| @firebase/rules-unit-testing | Apache 2.0 | Tests de Firestore rules |
| TypeScript | Apache 2.0 | Compilador |
| Google Fonts (Source Sans 3, Playfair Display, DM Sans, JetBrains Mono) | OFL 1.1 | Tipografía |
| Sentry Browser SDK | MIT | Error tracking (opcional, inert sin DSN) |
| DOMPurify (futuro) | Apache 2.0 / MPL 2.0 | Sanitización HTML pendiente |
| Chart.js (donde aparezca) | MIT | Visualización de datos |

Ningún componente comercial propietario de terceros está integrado en esta versión.

## Tratamiento de datos y cumplimiento

- **Región de datos**: `europe-west1` (Firebase Functions y Firestore configurados en UE).
- **RGPD (UE 2016/679)**: no se almacenan identificadores personales completos. Las notas clínicas rechazan automáticamente patrones de DNI y NIE españoles (Firestore rules `noDni()`).
- **Proveedores de IA**: llamadas enrutadas por Cloud Function propia (`askAi` en europe-west1). No se envían datos de paciente no seudonimizados a ningún modelo de lenguaje. Ver [docs/security-audit-2026-04-21.md](docs/security-audit-2026-04-21.md).
- **Auditoría**: colección `auditLogs` en Firestore con entradas inmutables (triggers Cloud Function). Backup diario a bucket UE.

## Procedimiento para solicitar licencia comercial

Escribe a **carlosgalera2roman@gmail.com** con asunto `[LICENCIA]` indicando:

1. Entidad solicitante (razón social, CIF).
2. Uso previsto (institucional, SaaS, integración con HIS/EHR, etc.).
3. Volumen estimado de usuarios / centros sanitarios.
4. Ámbito geográfico.
5. Modelo económico propuesto (tarifa por usuario/mes, single-payment, etc.).

Se responde en **menos de 7 días naturales** con una propuesta inicial o una solicitud de información adicional. Acuerdos estándar: 2 semanas. Acuerdos con personalización: 4-6 semanas.

## Contactos de materias específicas

| Materia | Contacto |
|---|---|
| Licencias | carlosgalera2roman@gmail.com — asunto `[LICENCIA]` |
| Vulnerabilidades | carlosgalera2roman@gmail.com — asunto `[SECURITY]` (ver SECURITY.md) |
| Partnerships / inversión | carlosgalera2roman@gmail.com — asunto `[PARTNER]` |
| Medios y prensa | carlosgalera2roman@gmail.com — asunto `[PRENSA]` |

---

_Este documento es referenciado desde `LICENSE` y `README.md`. La firma formal del registro reside en el Registro de la Propiedad Intelectual de la Región de Murcia bajo el número 00765-03096622._
