# WCAG 2.1 AA · audit baseline

Ejecutado por `e2e/a11y.spec.ts` con `axe-core` sobre las páginas públicas.

## Páginas auditadas

| Página | Ruta | Cobertura |
|---|---|---|
| Home | `/` | ✅ |
| Aviso legal | `/aviso-legal.html` | ✅ |
| Privacidad | `/privacidad.html` | ✅ |
| Transparencia | `/transparencia.html` | ✅ |
| Status | `/status.html` | ✅ |
| Pacientes | `/pacientes.html` | ✅ |
| Recursos sociales (con Atención Temprana) | `/recursos-sociales.html` | ✅ |
| Prepara consulta | `/prepara-consulta.html` | ✅ |
| Dejar de fumar | `/dejar-fumar.html` | ✅ |

## Política de fallo en CI

| Severidad axe-core | Fail CI | Acción |
|---|---|---|
| `critical` | ✅ Sí | Bloquea merge |
| `serious` | ✅ Sí | Bloquea merge |
| `moderate` | ❌ No | Log warning, fix iterativo |
| `minor` | ❌ No | Log warning, fix oportunista |

## Reglas WCAG cubiertas

`AxeBuilder.withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])` — todas las reglas A y AA de WCAG 2.0 + WCAG 2.1.

Categorías habituales que detecta:
- Contraste de colores insuficiente.
- Imágenes sin `alt`.
- Formularios sin `label` asociado.
- Headings fuera de orden.
- ARIA roles inválidos.
- Botones / links sin texto accesible.
- Frame / iframe sin título.
- HTML lang no declarado.
- Tabindex >0.

## Pendientes de mitigación humana

WCAG 2.1 AA pide cosas que axe NO valida automáticamente y requieren revisión manual:

- Navegación por teclado completa (Tab, Shift+Tab, Enter, Escape).
- Foco visible en todos los elementos interactivos.
- Lectura con NVDA/VoiceOver/TalkBack en flujo real.
- Significado del color (no usar solo color para transmitir info).
- Subtítulos en videos (no aplica hoy — sin videos).
- Tiempo suficiente para leer / interactuar (no hay timeouts).

Auditoría manual recomendada cada 6 meses o tras releases mayores.

## Cómo ejecutar localmente

```bash
cd /Users/carlos/cartagenaestewebappSOLIDA
npm install
npm run e2e:install
npm run e2e
npm run e2e:report   # abre HTML report
```

Para auditar contra una versión local en lugar de producción:

```bash
# Servir el repo localmente
python3 -m http.server 5500
# En otra terminal
npm run e2e:local
```

## Iteración

Las violaciones moderate/minor se loguean en cada run pero no rompen CI. La intención es:
1. Ejecutar el audit baseline.
2. Documentar las violaciones encontradas en `docs/audits/wcag-YYYY-MM-DD.md`.
3. Crear PRs específicos para corregirlas.
4. Promover violaciones a "fail CI" una vez resueltas.
