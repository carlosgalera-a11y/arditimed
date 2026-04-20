## ¿Qué cambia?

<!-- 1-3 bullets con lo que hace este PR -->

## ¿Por qué?

<!-- Motivación: bug de producción, feature nueva, deuda técnica, etc. -->

## ¿Cómo probarlo?

- [ ] Test unitarios: `npm --prefix functions test`
- [ ] Test rules: `npm --prefix functions run test:rules`
- [ ] Manual QA:
  <!-- Pasos para reproducir el comportamiento -->

## Checklist

- [ ] Conventional commit en el título.
- [ ] Sin secretos en el diff (`gitleaks detect` en local).
- [ ] CLAUDE.md actualizado si cambian reglas innegociables o comandos.
- [ ] CHANGELOG actualizado (sección `[Unreleased]`).
- [ ] Capturas adjuntas si afecta UI.
- [ ] Si toca Firestore rules → tests actualizados.
- [ ] Si toca Cloud Functions → runbook actualizado.

## Impacto en producción

- [ ] Sin impacto (solo tests o docs).
- [ ] Cambio visible en UI.
- [ ] Requiere redeploy Functions.
- [ ] Requiere acción manual de Carlos (ver checklist interno).

## Issues relacionadas

<!-- Fixes #123, Closes #456 -->
