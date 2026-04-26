# Evaluación de Impacto en Protección de Datos (EIPD/DPIA) · Cartagenaeste

**RGPD art. 35 · LOPDGDD art. 28**

---

| Campo | Valor |
|---|---|
| Responsable | Carlos Galera Román |
| Sistema | Cartagenaeste · plataforma formativa con IA |
| Fecha de evaluación | 2026-04-26 |
| Próxima revisión | 2027-04-26 (anual) o ante cambio sustancial |
| Resultado global | **Riesgo medio · aceptable con las medidas implementadas** |

## 1. ¿Procede una EIPD?

Según AEPD ([Lista de tipos de tratamientos que requieren EIPD](https://www.aepd.es/sites/default/files/2019-09/listas-DPIA-es-35-4.pdf)) y RGPD art. 35, procede cuando concurren ≥ 2 criterios:

| Criterio | Aplica | Detalle |
|---|---|---|
| Datos categorías especiales (salud) | ✅ Sí | Casos clínicos seudonimizados |
| Tratamiento a gran escala | ⚠️ Parcial | <60 MAU hoy. Se reevalúa al cruzar 1.000 |
| Uso innovador (IA) | ✅ Sí | LLMs para asistencia formativa |
| Toma decisiones automatizadas con efectos jurídicos | ❌ No | Supervisión humana obligatoria |
| Combinación de datos | ❌ No | Datos solo del propio profesional |
| Datos de menores | ❌ No | Solo profesionales adultos |
| Datos biométricos | ❌ No | No se usan |
| Geolocalización sistemática | ❌ No | No se usa |

**Conclusión**: procede EIPD por concurrencia de "datos de salud" + "uso innovador IA".

## 2. Descripción del tratamiento

Ver [rgpd-rat.md](rgpd-rat.md) — actividades 1 a 5.

Flujo simplificado:
```
Profesional → autentica (Firebase Auth) → escribe caso seudonimizado en Firestore
                                       → consulta IA (askAi · validador anti-PII)
                                       → IA contesta vía DeepSeek/Gemini/Qwen
                                       → respuesta cacheada (hash) y auditada (sin texto)
```

## 3. Necesidad y proporcionalidad

| Pregunta | Respuesta |
|---|---|
| ¿Hay base jurídica clara? | Sí: art. 6.1.f (interés legítimo formativo) + 9.2.h y 9.2.j (datos de salud por profesional sanitario y para investigación) |
| ¿Es el tratamiento necesario para la finalidad? | Sí — sin almacenar el caso, no hay material formativo |
| ¿Se han considerado alternativas menos invasivas? | Sí — pseudonimización máxima (iniciales 4 chars, sin DNI/NIE/NHC); cache por hash |
| ¿La finalidad es proporcional al impacto? | Sí — formación profesional vs. PII mínima e indirecta |

## 4. Identificación de riesgos

| ID | Amenaza | Probabilidad | Impacto | Riesgo bruto | Mitigación | Riesgo residual |
|---|---|---|---|---|---|---|
| R-01 | Reidentificación de paciente vía iniciales + cama + edad + ubicación temporal | Baja | Alto | Medio | Iniciales máx 4 chars, sin nombre completo, validador rechaza patrones DNI/NIE/NHC, audit log | Bajo |
| R-02 | Acceso no autorizado a Firestore | Baja | Alto | Medio | Firestore rules deny-by-default, App Check, auth obligatoria, IAM mínimo | Bajo |
| R-03 | Fuga de PII al provider IA en el prompt | Media | Alto | Alto | `validatePrompt()` server-side rechaza DNI/NIE/NHC/nombres comunes; sólo iniciales pasan | Bajo |
| R-04 | Transferencia internacional sin garantías | Media | Medio | Medio | SCC con Google Cloud y Sentry; DPA pendiente con DeepSeek/OpenRouter; opción de EU-residency con Gemini directo | Medio |
| R-05 | Brecha en credenciales de admin | Baja | Crítico | Medio | 2FA obligatorio en Google admin, auditoría manual mensual, secrets rotation tras incidentes | Bajo |
| R-06 | Pérdida de datos por error operativo | Baja | Medio | Bajo | Backup diario `dailyBackup` función, lifecycle a Archive 365 días | Muy bajo |
| R-07 | Provider IA almacena prompts indefinidamente | Media | Medio | Medio | DPA explícito (pendiente) que limite retención; uso preferente de providers EU para datos clínicos | Medio |
| R-08 | Inferencia indebida sobre profesional (no sobre paciente) | Baja | Bajo | Bajo | UID anonimizado; admin solo ve agregados; no se rankean médicos | Muy bajo |
| R-09 | Adversarial prompt injection que extraiga datos de otros usuarios | Baja | Alto | Medio | systemPrompt fijo server-side; cada llamada es stateless; no se cruzan contextos entre usuarios | Bajo |
| R-10 | IA "alucina" datos clínicos que se confunden con reales | Media | Alto | Alto | Disclaimer permanente "Generado con IA · Uso exclusivamente docente"; supervisión humana obligatoria; goldStandardEval mensual | Medio |

### Matriz de riesgo (residual)

```
              IMPACTO
            BAJO  MEDIO  ALTO  CRITICO
ALTA       │     │     │     │       │
PROB       │     │     │     │       │
MEDIA      │     │ R04 │ R07 │       │
           │     │     │ R10 │       │
BAJA       │ R08 │ R06 │ R01 │       │
           │     │     │ R02 │       │
           │     │     │ R03 │       │
           │     │     │ R05 │       │
           │     │     │ R09 │       │
```

## 5. Medidas de mitigación adicionales recomendadas

### Implementables a corto plazo (próximas 4 semanas)

- [ ] Firmar DPA explícito con OpenRouter y DeepSeek (mitigar R-04, R-07).
- [ ] Configurar `GEMINI_API_KEY` directo para forzar EU-residency en clinical_case (mitigar R-04 a "Bajo").
- [ ] Activar App Check enforce (PR #100 ya prepara la infra).
- [ ] Documentar incident response plan en `docs/incident-response.md`.

### A medio plazo (3 meses)

- [ ] Auditoría externa de Firestore rules por especialista.
- [ ] Penetration test ligero (servicio externo ~600 €).
- [ ] Implementar diferenciación visual extra de respuesta IA (ej. fondo morado + watermark) para mitigar R-10.

### Si se cruza 1.000 MAU

- [ ] Reevaluar EIPD completa con consultor RGPD especializado en sanitario.
- [ ] Evaluar designación de DPO externo.

## 6. Consulta a la AEPD

**No procede consulta previa** según RGPD art. 36 — el riesgo residual evaluado es **medio aceptable** y las medidas de mitigación son adecuadas.

Si tras implementar mitigaciones quedase **riesgo residual alto**, sí procedería consulta a la AEPD antes del despliegue.

## 7. Validación

Aprobado por:

- Carlos Galera Román (responsable del tratamiento) — fecha: 2026-04-26
- DPO designado — N/A
- Asesor jurídico externo — pendiente firma con bufete especializado en sanitario

## 8. Anexos

- [rgpd-rat.md](rgpd-rat.md) — Registro de Actividades de Tratamiento.
- [data-retention-policy.md](data-retention-policy.md) — Política de retención.
- [dpa-template.md](dpa-template.md) — Plantilla de Data Processing Agreement.
- [ai-technical-file.md](ai-technical-file.md) — Ficha técnica AI Act.

---

*Carlos Galera Román · Cartagenaeste © 2026 · LPI 00765-03096622*
