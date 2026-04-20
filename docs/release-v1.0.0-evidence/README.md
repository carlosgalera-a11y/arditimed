# Evidencia v1.0.0 · Release "Solidez para Financiación"

Esta carpeta reúne el material que acompaña al release v1.0.0, pensado para usarse como adjunto técnico en:
- Dossier para **INFO Murcia**
- Memoria técnica **CDTI Neotec**
- Dossier para **AstraZeneca Medical Affairs** u otro partner farma
- Propuesta a dirección de **H.G.U. Santa Lucía** / **Área II Cartagena (SMS)**
- Solicitud **UCAM HiTech** u otra incubadora universitaria

## Artefactos incluidos

| Archivo | Qué demuestra |
|---|---|
| `README.md` (este) | Índice y guía de lectura |
| `changelog-v1.0.0.md` | Cambios del release (copia de CHANGELOG §1.0.0) |
| `ip-attestation-summary.md` | Resumen del registro PI + Art. 51 LPI |
| `smoke-test-output.txt` | Resultado de `test-deploy.sh` contra producción |
| `architecture-summary.md` | Descripción técnica alto nivel del stack |
| `security-posture.md` | Resumen de controles: rules, App Check, audit log, backup |

## Artefactos pendientes (Carlos captura)

Estos requieren GUI (imposibles de generar desde CLI):

- [ ] `screenshot-home.png` · Home desktop 1440px
- [ ] `screenshot-chatbot.png` · Chatbot-medicación respondiendo (mostrando `provider:deepseek` en Network)
- [ ] `screenshot-vision.png` · ScanIA analizando una imagen anonimizada
- [ ] `screenshot-triaje-qr.png` · Triaje completo con QR generado
- [ ] `screenshot-status.png` · `/status.html` con KPIs en vivo
- [ ] `screenshot-firebase-console-rules.png` · Firestore rules desplegadas
- [ ] `screenshot-firebase-appcheck.png` · App Check enforce ON (Functions)
- [ ] `screenshot-auditLogs.png` · Firestore Data Viewer mostrando colección auditLogs
- [ ] `screenshot-cloud-monitoring.png` · Dashboard con latencia askAi
- [ ] `screenshot-sentry.png` · Issue de prueba en Sentry (opcional)
- [ ] `lighthouse-home.html` · `npx lighthouse https://area2cartagena.es/ --output=html`
- [ ] `lighthouse-v1.0.0.md` · Scores Performance/A11y/BP/SEO/PWA
- [ ] `gitleaks-scan.txt` · `gitleaks detect --source . --report-format=json`
- [ ] `tests-output.txt` · `cd functions && npm test` output

## Cómo usar esta carpeta en un pitch

1. Abrir el dossier desde `README.md` como índice.
2. Adjuntar `ip-attestation-summary.md` como primera página técnica (autoría + IP).
3. Incluir `security-posture.md` si el evaluador pregunta por compliance / ENS / RGPD.
4. Presentar capturas en orden: home → chatbot-IA → triaje → status → console backend → monitoring.
5. `changelog-v1.0.0.md` como prueba de trazabilidad versión-a-versión.

## Formato y reusabilidad

- Los `.md` están listos para convertir a PDF con `pandoc -o out.pdf file.md` (Carlos lo hace según destinatario).
- Las capturas se guardan en la misma carpeta con nombres descriptivos (sin espacios, minúsculas, separador `-`).

---

_Generado como parte de PR #15 · 2026-04-22._
