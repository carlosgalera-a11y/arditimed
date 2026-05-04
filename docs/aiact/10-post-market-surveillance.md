# 10 · Post-Market Surveillance (voluntaria)

> EvidenciaIA NO es SaMD bajo MDR, por lo que la vigilancia post-comercialización del MDR art. 83 no es legalmente exigible. Aun así, implementamos un programa voluntario para detectar problemas pronto y mantener la calidad clínica.

## 10.1 Objetivos

1. Detectar regresiones en exactitud o sesgo antes de que afecten a múltiples usuarios.
2. Recoger feedback estructurado del clínico para mejora continua.
3. Mantener una visión retrospectiva de cómo se está usando el sistema y si encaja con el `intended use`.
4. Cumplir el espíritu del AI Act art. 9 (gestión continua de riesgos) sin necesidad de los procesos formales del MDR.

## 10.2 Métricas vigiladas

### Continuas (dashboard `/admin-dashboard.html`)
- Volumen consultas/día, tendencia 7d.
- Latencia p50/p95/p99 por proveedor IA.
- Tasa de error por provider externo (PubMed/EPMC/etc.).
- Cache hit ratio.
- Citation verification ratio promedio (alerta si <90%).
- Distribución GRADE: % A vs B vs C vs D.
- Tasa de rechazos por safeguards: por motivo.
- Feedback ratios: 👍 útil / 👎 incorrecto / ⚠️ cita falsa / 🚩 sesgo (alerta si la suma de "incorrecto + cita_falsa + sesgo" supera 10% en 7d).

### Periódicas
- **Diaria**: revisión por el responsable de los rechazos (`rechazada=true`) en `evidencia_consultas` para detectar falsos positivos del filtro.
- **Semanal**: revisión de los 10 feedbacks "incorrecto" / "sesgo" más recientes; reproducir + clasificar.
- **Mensual**: ejecución completa del bias audit harness; comparar métricas vs mes anterior.
- **Trimestral**: revisión completa del dossier; actualizar `02-risk-assessment.md` si han surgido riesgos nuevos.
- **Semestral**: pen-test (cuando haya recursos) + red team específico de prompt injection.

## 10.3 Triggers de actuación

| Métrica | Umbral | Acción |
|---|---|---|
| Citation verification ratio | <90% en 24h | Investigar el modelo IA: ¿ha cambiado el proveedor? Auditar 20 respuestas recientes manualmente |
| Sum(incorrecto+cita_falsa+sesgo)/total feedback | >10% en 7d | Pausar deploys + bias audit completo + revisión system prompt |
| Tasa de rechazos safeguards | Variación >50% vs baseline | Investigar: ¿nuevos patrones legítimos rechazados? ¿O baseline estaba mal calibrado? |
| Provider externo (cualquiera) error rate | >50% en 1h | Banner en UI; activar fallback más agresivo |
| Latencia p95 | >30s | Investigar; degradar funcionalidad opcional (TLDR/Crossref) si necesario |
| Volumen | Caída >70% día sobre día | Investigar (¿caída del servicio? ¿bloqueo de App Check?) |

## 10.4 Programa de calidad clínica

- **Champions clínicos**: identificar 3-5 residentes/adjuntos del HSL como usuarios beta que reporten problemas activamente vía formulario `/sugerencias`.
- **Encuesta semestral** a usuarios autenticados: utilidad percibida, errores notados, mejoras deseadas. Resultados anonimizados publicados en CHANGELOG.
- **Sesión clínica** anual de revisión del módulo en el HSL (cuando haya autorización).

## 10.5 Reporting externo voluntario

- **AEMPS** (no obligado, pero recomendable buena práctica):
  - Si surge un incidente que sugiera daño potencial, notificar voluntariamente al canal de farmacovigilancia y/o vigilancia de productos sanitarios para sentar precedente de buena fe.
- **AEPD**:
  - Brechas de datos personales: notificación obligatoria <72h (RGPD art. 33). Procedimiento en `08-incident-response.md`.
- **Comisión Europea / Oficina IA**:
  - AI Act establece la AI Office como autoridad. Cuando se publiquen sus canales (probablemente 2026-2027), reportar voluntariamente cualquier incidente significativo con sistema IA aunque no sea de alto riesgo.

## 10.6 Auditoría externa

Pendiente de:
- Acuerdo con SMS Murcia (BiblioSalud) para validación clínica del módulo dentro del entorno SMS.
- Acuerdo con UMU (Cátedra MFyC) para evaluación académica con metodología publicable.
- Auditor independiente de cumplimiento RGPD/AI Act (consultorías especializadas; presupuesto pendiente).

## 10.7 Ciclo de mejora continua

```
[Métricas + feedback] → [Análisis mensual del responsable] →
[Backlog priorizado] → [Implementación + tests + bias audit] →
[Deploy + bumpear SW] → [Vigilancia post-deploy 7d] →
[Documentar en CHANGELOG] → [Volver al inicio]
```

## 10.8 Plan de discontinuación

Si el sistema deja de mantenerse (autor incapacitado, cambio de prioridades, etc.):

1. Aviso público con 30 días de antelación en `/evidencia-ia.html` y home.
2. Permitir export de las consultas propias del usuario.
3. Mantener `docs/aiact/` y el código en GitHub público para transparencia.
4. Eliminar gradualmente datos personales según política de retención.
5. Mantener al menos un endpoint estático con disclaimer "servicio descontinuado, consulte su biblioteca virtual" durante 6 meses.
