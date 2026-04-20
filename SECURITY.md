# Security Policy · Cartagenaeste

## Reportar una vulnerabilidad

**Por favor NO abras un issue público** para reportar vulnerabilidades de seguridad.

En su lugar, envía un email a:

**carlosgalera2roman@gmail.com** con asunto `[SECURITY]`

Incluye:
- Descripción de la vulnerabilidad.
- Pasos para reproducirla.
- Impacto estimado (leak PII, RCE, XSS, auth bypass, etc.).
- Tu nombre o alias para reconocimiento en el CHANGELOG si aplica (opcional).

## Compromisos

- **Acuse de recibo**: 48 horas desde el email.
- **Triaje inicial + severidad estimada**: 72 horas.
- **Parche en producción**: 7 días para críticas, 30 días para altas, 90 días para medias/bajas.
- **Disclosure responsable**: coordinar publicación tras el parche o a los 90 días, lo que ocurra antes.

## Scope

En scope:
- Código de este repositorio (`Cartagenaeste`) y su réplica (`area2cartagena`).
- Cloud Functions desplegadas en `docenciacartagenaeste` project.
- Firestore rules y Storage rules.
- Frontend en `area2cartagena.es` y `carlosgalera-a11y.github.io/Cartagenaeste/`.

Fuera de scope (reportar al proveedor correspondiente):
- Firebase Auth / Firestore / Storage issues en infraestructura de Google.
- Librerías de terceros (Sentry, Firebase SDK, etc.) salvo que la integración de Cartagenaeste las use de forma insegura.

## Versiones soportadas

Solo la última versión mayor recibe parches de seguridad.

| Versión | Soporte |
|---|---|
| 1.0.x | ✅ activa |
| 0.x | ❌ end-of-life |

## Historial de incidentes públicos

Ninguno. Los audits internos están en `docs/security-audit-*.md`.

## Safe harbor

Se ofrece safe harbor a investigadores que:
- Actúen de buena fe.
- Limiten las pruebas a cuentas propias.
- NO accedan a datos de terceros.
- NO degraden el servicio.
- Informen antes de 24h de cualquier incidente accidental que afecte a producción.

## Recompensas

No hay bug bounty monetario en esta versión, pero sí:
- Reconocimiento público en el CHANGELOG (si lo deseas).
- Carta formal de agradecimiento firmada.
- Primera referencia a un programa de bug bounty cuando se formalice (en roadmap).

## Actualizaciones

Este documento se actualiza al menos 1 vez por año o tras cualquier incidente público.

Última revisión: 2026-04-22.
