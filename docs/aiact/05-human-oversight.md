# 05 · Human Oversight (AI Act art. 14)

## 5.1 Modelo de supervisión: humano-en-el-bucle por diseño

EvidenciaIA opera bajo el principio de que **el profesional sanitario es el decisor final** y la IA es exclusivamente un asistente bibliográfico. Cada salida del sistema requiere validación humana antes de cualquier aplicación clínica.

## 5.2 Mecanismos implementados

### Pre-uso
- **Login obligatorio** restringe el acceso a profesionales identificados.
- **Disclaimer + checkbox** obliga a reconocer expresamente que el sistema es formativo y requiere verificación.

### Durante el uso
- **No hay autoejecución**: el botón "Buscar evidencia" requiere clic explícito en cada consulta.
- **Sugerencias y follow-ups solo rellenan el textarea**: el usuario debe revisar y confirmar antes de buscar.
- **Filtros explícitos**: el usuario decide los filtros (años, revisiones, Cochrane, OA, preprints, etc.) antes de cada búsqueda.

### Tras la respuesta
- **Tooltips inline** sobre cada `[n]` permiten al clínico verificar el abstract original sin abandonar el flujo.
- **Deep-links de verificación cruzada** a Preevid SMS Murcia, GuíaSalud, NICE, EMA, Cochrane, AEMPS, MEDES, SciELO, WHO IRIS y EU Clinical Trials Register.
- **GRADE rationale visible** explica POR QUÉ el sistema asignó ese grado, permitiendo al clínico cuestionarlo.
- **Citas no verificables marcadas en rojo** para que el clínico no las trate como verdaderas.
- **Feedback estructurado** con botones 👍 Útil / 👎 Incorrecto / ⚠️ Cita no verificable / 🚩 Sesgo, persistido en `evidencia_feedback` para mejora continua.

### Capacidad de detener / cuestionar
- El usuario puede en cualquier momento ignorar la respuesta IA y consultar las fuentes directamente vía deep-link.
- El usuario puede reportar un problema (botones de feedback) que se loguea para auditoría.
- El responsable del sistema puede deshabilitar la síntesis IA (`sintetizar=false`) y dejar solo abstracts re-rankeados, manteniendo funcionalidad básica.
- En última instancia, el responsable puede deshabilitar el módulo completo desactivando `evidenciaSearch` en Cloud Functions.

## 5.3 Limitaciones de la supervisión humana reconocidas

- **Carga cognitiva**: si el clínico no verifica las citas (incluso cuando el sistema le facilita el tooltip), podría aceptar contenido erróneo. Mitigación: el badge GRADE + warning de citas + chips de verificación cruzada actúan como "fricción saludable" para incentivar la verificación.
- **Sesgo de automatización**: tendencia a aceptar lo que la IA dice. Mitigación: disclaimer permanente + grado heurístico explícito + ratio de citas siempre visible.
- **Tiempo limitado en urgencias**: el usuario puede saltarse verificación. Mitigación: el sistema rechaza expresamente preguntas de "qué le doy a mi paciente" antes de procesarlas, lo que obliga al usuario a reformular como pregunta de evidencia.

## 5.4 Capacitación del usuario

EvidenciaIA es accesible solo desde el área `/profesionales.html`, donde el usuario tiene acceso a:
- El disclaimer formativo permanente.
- La política de uso.
- Este dossier (`docs/aiact/`).
- Tutoriales en `/about.html` sobre cómo usar el sistema responsablemente.

No requerimos formación obligatoria, pero recomendamos al usuario familiarizarse con los recursos antes del uso.

## 5.5 Procedimiento de override

El responsable del sistema (Carlos Galera Román) puede:
- **Suspender** el módulo en menos de 5 minutos modificando `firestore.rules` o desplegando una versión deshabilitada de `evidenciaSearch`.
- **Revertir** un cambio a la versión previa via `git revert` + redeploy.
- **Bloquear** un usuario específico añadiendo su uid a una lista de bloqueo.
- **Rotar** secrets (claves IA) en menos de 10 minutos vía Secret Manager.

Procedimientos detallados en `docs/runbook.md` y `docs/s1.2-rotacion-claves-carlos.md`.
