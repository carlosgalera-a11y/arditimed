# 08 · Incident Response

## 8.1 Definición de incidente

| Severidad | Definición | Ejemplo |
|---|---|---|
| **Crítica (P0)** | Posible daño al paciente derivado de uso del sistema; fuga PII; manipulación maliciosa | Usuario reporta haber aplicado a paciente una recomendación errónea de EvidenciaIA; filtración de claves IA |
| **Alta (P1)** | Síntesis con error grave (p.ej. dosis incorrecta) sin daño confirmado; sesgo demostrado | Múltiples reports de "cita inventada" en el mismo día; síntesis que recomienda fármaco contraindicado en escenario canónico |
| **Media (P2)** | Calidad degradada; provider externo caído; jailbreak reproducible | PubMed responde 500 durante 1h; usuario consigue saltarse safeguards con prompt específico |
| **Baja (P3)** | UX degradada; warning amarillo; bug cosmético | Tooltip mal alineado; PDF se exporta sin badge GRADE |

## 8.2 Canales de reporte

| Origen | Canal |
|---|---|
| Usuario | Botones de feedback en cada respuesta (`incorrecto`, `cita_falsa`, `sesgo`); email a `carlosgalera2roman@gmail.com` |
| Auditor / autoridad | Email + carta certificada |
| Sistema (alerta automática) | Sentry alert; dailyBalanceCheck (`functions/src/dailyBalanceCheck.ts`); umbral en métricas operacionales |
| Equipo dev (auto-detección) | Test fail en CI; revisión de logs |

## 8.3 Procedimiento P0 (crítica)

**Tiempo objetivo de mitigación: <1h**

1. **Aislar** (≤15 min):
   - Si origen es módulo IA: deshabilitar `evidenciaSearch` desplegando versión que devuelve `unavailable` (`firebase deploy --only functions:evidenciaSearch`).
   - Si fuga de claves: rotar inmediatamente vía Secret Manager + invalidar tokens IA del proveedor.
   - Si es Firestore breach: revocar Admin SDK temporalmente.
2. **Comunicar** (≤30 min):
   - Banner en `evidencia-ia.html`: "Servicio temporalmente suspendido por revisión. Volveremos pronto."
   - Notificar al usuario afectado (si identificable) por email.
3. **Investigar** (≤4h):
   - Capturar `consultaId` y todos los logs asociados (`evidencia_consultas` + Cloud Logging).
   - Reproducir el escenario en local con la misma versión de prompt + modelo + caché frío.
   - Documentar timeline completo en `docs/incidents/YYYY-MM-DD-pXX-incidentname.md`.
4. **Notificar a autoridades** si procede:
   - **AEPD** si fuga de datos personales (≤72h, RGPD art. 33).
   - **AEMPS** voluntariamente si daño potencial al paciente (no obligatorio al no ser SaMD, pero recomendable por buena fe).
5. **Mitigar definitivamente**:
   - Patch en código + tests de regresión.
   - Revisión de la matriz de riesgos en `02-risk-assessment.md`.
   - Update del system prompt o safeguards si procede.
6. **Restaurar servicio** con cambios desplegados + bumpear SW para invalidar caché PWA.
7. **Post-mortem público** en CHANGELOG.md y opcionalmente entrada en blog.

## 8.4 Procedimiento P1 (alta)

**Tiempo objetivo: <24h**

1. Validar reproducibilidad.
2. Si reproducible y afecta calidad clínica: parche urgente.
3. Si afecta a citas/sesgo: ajustar `citationVerifier.ts` o `safeguards.ts` o reranker.
4. Tests de regresión obligatorios.
5. Documentar en `docs/incidents/`.
6. Sin notificación obligatoria a autoridades a menos que se identifique daño consumado.

## 8.5 Procedimiento P2 (media)

**Tiempo objetivo: <72h**

1. Triage en backlog.
2. Si provider externo: implementar fallback adicional o degradar UX (mostrar warning al usuario).
3. Si jailbreak: añadir patrón a `safeguards.ts` y test de regresión.

## 8.6 Procedimiento P3 (baja)

Triage normal del backlog del responsable.

## 8.7 Auditoría posterior

Cada incidente P0/P1 genera:
- Entrada en `docs/incidents/` con timeline + root cause + mitigación + lecciones aprendidas.
- Update de `02-risk-assessment.md` si surge un riesgo no contemplado.
- Posible review de los packs 1-10 de este dossier.
- Mención pública en CHANGELOG.md (sin exponer detalles que faciliten un ataque idéntico).

## 8.8 Lista de incidentes

> Esta sección se mantiene actualizada con la lista de incidentes ocurridos.

| Fecha | ID | Severidad | Resumen | Estado |
|---|---|---|---|---|
| — | — | — | Sin incidentes a fecha 2026-05-04 | — |

## 8.9 Backups y recuperación

- Firestore: backup automático diario, retención 30d.
- Código: GitHub `Cartagenaeste` + mirror `area2cartagena`.
- Secrets: rotación documentada en `docs/s1.2-rotacion-claves-carlos.md`.
- RTO objetivo: 4h. RPO objetivo: 24h.
