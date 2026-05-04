# 04 · Transparency (AI Act art. 13 + 50)

## 4.1 Implementación del art. 50 (deber de transparencia ante el usuario)

Toda persona que interactúa con EvidenciaIA es informada DE FORMA INEQUÍVOCA de que está usando un sistema de IA. Implementación:

| Capa | Mecanismo | Bloqueante |
|---|---|---|
| 1 — Antes de buscar | Disclaimer textual con fondo destacado: "⚠️ Aviso de transparencia (EU AI Act art. 50). Este sistema usa IA para extraer la pregunta PICO y para sintetizar abstracts. La síntesis NO constituye diagnóstico ni recomendación terapéutica. Cada cita debe verificarse en la fuente original." | ✅ Checkbox obligatorio antes de poder buscar |
| 2 — Backend valida | `evidenciaSearch` rechaza con `failed-precondition` si `ai_act_disclaimer_shown !== true` | ✅ |
| 3 — En la respuesta | Cada respuesta IA muestra: provider + modelo concreto utilizado en meta-info; ratio de citas verificadas; warning si ratio < umbral | Visible siempre |
| 4 — En cada cita | Tooltip al hover sobre `[n]` muestra abstract original → permite verificación inmediata | Disponible siempre |
| 5 — En el grado | Badge GRADE muestra rationale: "Esto es una heurística, no GRADE formal" | Visible siempre |
| 6 — En follow-ups | Chips de preguntas relacionadas rellenan textarea pero NO ejecutan automáticamente — usuario debe revisar y pulsar buscar | Por diseño |
| 7 — En PDF | El export incluye disclaimer art. 50 destacado al final | Siempre |
| 8 — Logging | Cada consulta loguea `ai_act_disclaimer_shown=true` para evidencia de aceptación | Auditoría |

## 4.2 Información proporcionada al usuario (art. 13)

Antes y durante el uso, el usuario tiene acceso a:

- **Identidad del proveedor**: Carlos Galera Román, MFyC. Footer + página `/about.html`.
- **Uso previsto y limitaciones**: este dossier (`docs/aiact/`), enlace en footer.
- **Naturaleza IA**: explícito en disclaimer + cada respuesta + meta-info.
- **Modelo concreto utilizado**: visible en meta-info de cada respuesta (`provider/model`).
- **Categoría regulatoria**: "Plataforma formativa. No diagnóstica. No SaMD" en disclaimer + cada respuesta.
- **Cumplimiento**: meta `compliance="RGPD · EU AI Act 2024/1689 art. 50 · LPI Art. 51"` en HTML head.
- **Política de privacidad**: `/privacidad.html`, enlazada en footer.
- **Aviso legal**: `/aviso-legal.html`, enlazado en footer.
- **Derechos RGPD**: `/derechos-rgpd.html`, formulario.
- **Vías de reclamación**: email del responsable + autoridades de control (AEPD).

## 4.3 Marca temporal y contexto formativo

El módulo lleva la etiqueta `📚 Uso formativo` permanente en la cabecera y la palabra "Plataforma formativa. No diagnóstica" se repite en:
- Hero principal
- Disclaimer
- Footer global
- PDF export
- Cada respuesta (badge "Uso formativo")

## 4.4 Comunicación de cambios sustanciales

Cualquier cambio en el system prompt, el modelo IA primario, los safeguards o las salvaguardas se versiona (ver `09-model-versioning.md`) y queda en el historial git público (`carlosgalera-a11y/Cartagenaeste`). Los cambios mayores se anuncian en CHANGELOG.md.

## 4.5 Idioma de la información de transparencia

Toda la información de transparencia está disponible en **español** (idioma principal de los usuarios objetivo). Las fuentes técnicas pueden estar en inglés.

## 4.6 Marcadores AI-generated content

Toda la salida del sistema marcada como generada por IA es identificable como tal:
- La síntesis está dentro de una caja con label "Síntesis de la evidencia" precedida del disclaimer.
- El TLDR se marca con prefijo "TL;DR · " y estilo visual diferenciado.
- Los follow-ups son chips marcados ↪.
- El PDF exporta con cabecera "Síntesis IA · verifica cada cita".
- Las citas inválidas se sanitizan a "[cita no verificable]" en rojo.
