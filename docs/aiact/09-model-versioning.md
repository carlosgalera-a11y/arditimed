# 09 · Model & Prompt Versioning

## 9.1 Por qué versionar

Una respuesta IA depende de tres ingredientes mutables:
1. El **system prompt** (instrucciones al modelo).
2. El **modelo IA concreto** (DeepSeek V3.2 vs Gemini 2.5 Flash-Lite vs Mistral Small 3.1…).
3. El **proveedor** (DeepSeek API vs OpenRouter vs Vertex AI…).

Si cualquiera cambia y no lo trazamos, una respuesta histórica se vuelve no reproducible y no auditable. AI Act art. 12 requiere trazabilidad → versionamos los tres.

## 9.2 Implementación

### Prompt versioning
Los system prompts (PICO + síntesis RAG) se hashean en `functions/src/evidencia/promptRegistry.ts`:

```ts
export const PROMPT_VERSIONS = {
  pico: hashPrompt(PICO_SYSTEM_PROMPT),       // sha256 truncado a 12 chars
  synth: hashPrompt(SYNTH_SYSTEM_PROMPT),
};
```

Cada respuesta del modelo loguea `prompt_version_pico` y `prompt_version_synth` en `evidencia_consultas`. Si modificamos un prompt, el hash cambia automáticamente.

### Modelo versioning
La cadena de fallback en `routing.ts` devuelve el `provider` y `model` concreto de la respuesta exitosa. Se loguea como `sintesis_provider` (ej. `deepseek`) y `sintesis_model` (ej. `deepseek-chat-v3.2`).

### Histórico de prompts
Los cambios de prompt quedan en git history (`git log functions/src/evidencia/picoExtractor.ts functions/src/evidencia/ragSynthesizer.ts`). Cada commit con cambio de prompt usa convención:

```
chore(prompt): bump synth v[hash] — motivo del cambio

- Cambio concreto (líneas añadidas/quitadas).
- Justificación clínica/regulatoria.
- Tests afectados.
```

## 9.3 Política de cambio de prompt

| Tipo de cambio | Aprobación requerida | Validación previa |
|---|---|---|
| Cambio mínimo (typo, claridad) | Auto-approve responsable | Tests existentes verdes |
| Cambio menor (refinar instrucción, añadir constraint) | Responsable + post-mortem rápido | Tests + bias audit harness verde |
| Cambio mayor (nueva sección, cambio de estructura) | Responsable + entrada en CHANGELOG | Tests + bias audit + revisión manual de 10 escenarios |
| Cambio crítico (nueva safeguard, refactor estructural) | Responsable + actualización risk assessment | Tests + bias audit + revisión clínica externa (residente senior) |

## 9.4 Política de cambio de modelo IA

| Cambio | Aprobación |
|---|---|
| Promoción de fallback a primario (ej. Gemini → DeepSeek) | Responsable + bias audit verde |
| Nuevo modelo añadido a la cadena | Responsable + tests + bias audit |
| Eliminación de modelo de la cadena | Responsable + comprobar que la cadena restante cubre todos los `type` |
| Cambio de proveedor (ej. OpenRouter → Vertex AI directo) | Responsable + actualizar `03-data-governance.md` (transferencias internacionales) |

## 9.5 Política de cambio de safeguards

Los safeguards (`safeguards.ts`) son crítica de seguridad. Cambios:

- **Añadir patrón de rechazo**: tests obligatorios + entrada en CHANGELOG + revisión de tasa de false positives en producción ×7 días post-deploy.
- **Eliminar patrón de rechazo**: PROHIBIDO sin justificación documentada y revisión externa. Cualquier eliminación requiere nuevo análisis de riesgos en `02-risk-assessment.md`.
- **Modificar mensaje al usuario**: libre, mientras se mantenga el espíritu (formativo, no diagnóstico).

## 9.6 Versiones actuales (snapshot 2026-05-04)

| Componente | Versión |
|---|---|
| EvidenciaIA módulo | Tag git asociado al PR #144 |
| `pico` system prompt | hash pendiente de calcular tras este pack |
| `synth` system prompt | hash pendiente de calcular tras este pack |
| Modelos IA primarios | DeepSeek V3.2 (educational) · Qwen2.5-VL-72B (clinical_case/vision) |
| Fallback chain | Gemini 2.5 Flash-Lite EU → Mistral Small → OpenRouter |
| Safeguards version | Ver `safeguards.ts` head (incluye 6 patrones diagnósticos + 5 terapéuticos + 4 PII) |
| Reranker version | gradeEvidence A/B/C/D + preprint penalty −2 |
| Cache TTL | 24h |
| Frontend SW | v152 |

## 9.7 Auditoría retrospectiva

Para reproducir una respuesta histórica:

1. Localizar el documento `evidencia_consultas` por `consultaId`.
2. Leer `prompt_version_pico` y `prompt_version_synth`.
3. Buscar en git history el commit que produjo ese hash:
   ```bash
   for c in $(git log --pretty=%H -- functions/src/evidencia/ragSynthesizer.ts); do
     git show $c:functions/src/evidencia/ragSynthesizer.ts \
       | node -e 'process.stdout.write(require("crypto").createHash("sha256").update(require("fs").readFileSync(0,"utf8").match(/SYNTH_SYSTEM_PROMPT = \[[\s\S]*?\]\.join/)[0]).digest("hex").slice(0,12))'
   done
   ```
4. Hacer checkout de ese commit, deploy local, replay con la misma pregunta + filtros + provider/model.
5. Diferencias residuales se atribuyen a cambios en fuentes externas (PubMed añade/elimina papers) o no-determinismo del modelo IA.

## 9.8 Proveedor IA externo: política de actualización

Los proveedores actualizan modelos sin previo aviso. Mitigación:

- Logueamos `model` exacto en cada respuesta.
- Si el proveedor anuncia deprecación de un modelo: actualizar `routing.ts` antes de la fecha + bias audit + entrada en CHANGELOG.
- Cuando un modelo se renombra silenciosamente (ej. `deepseek-chat` → `deepseek-chat-v3.2`), el log lo capta automáticamente.
