# CLAUDE.md · Contexto del proyecto Cartagenaeste

## Identidad
- Proyecto: Cartagenaeste · App formativa y organizador personal de guardia
- Repo: carlosgalera-a11y/Cartagenaeste
- Webapp en producción: https://area2cartagena.es/
- Firebase project: docenciacartagenaeste (region europe-west1)
- Autor único y propietario IP: Carlos Galera Román
- Registro Propiedad Intelectual: 00765-03096622 (Art. 51 LPI declarado)
- Ya en uso clínico activo en Urgencias H.G.U. Santa Lucía (Área II Cartagena)

## Stack actual fijo
- Frontend: vanilla JS modularizado (~4,300 líneas index.html + módulos lazy-loaded)
- PWA con sw.js (versión actual v66 a fecha 20 abril 2026)
- Hosting: GitHub Pages + dominio area2cartagena.es
- Backend: Firebase Auth + Firestore + Storage + Cloud Functions
- IA actual a unificar: DeepSeek V3.2, DeepSeek free, Qwen3.5-Flash, Gemini 3.1 Flash Lite
- Analytics: GA4 con 7 eventos clínicos custom
- API keys actualmente XOR-obfuscadas en api-config.js (clave 42) → MIGRAR a Cloud Function
- NAS proxy local en REDACTED_INTERNAL_IP:3100 → eliminar referencias del código público

## Reglas innegociables
1. NUNCA exponer claves IA en el frontend. Todas las llamadas IA pasan por Cloud Function askAi en europe-west1.
2. NUNCA guardar nombres completos, DNI/NIE, NHC. Solo iniciales (max 4) + no cama + edad.
3. Region siempre europe-west1. Datos en UE.
4. Disclaimer formativo permanente: "Plataforma formativa. No diagnóstica. No sustituye juicio clínico."
5. Cero marcas comerciales farma. Siempre clase terapéutica + principio activo.
6. App Check enforce activo en Firestore + Functions + Storage.
7. Plan antes de código. Una rama por sesión. PR por feature. Carlos revisa rules y secretos.
8. Nunca hacer force push a main. Nunca borrar commits de otros.
9. Hosting es GitHub Pages. No usar `firebase deploy --only hosting`. Las cabeceras de seguridad van como `<meta>` tags en HTML, no en `firebase.json`. El frontend se despliega con `git push` a main.
10. **Dos repos en GitHub, mismo contenido**. `carlosgalera-a11y/Cartagenaeste` es el source of truth (aquí se trabaja y se abren PRs). `carlosgalera-a11y/area2cartagena` es una copia conectada al dominio custom `area2cartagena.es` vía GitHub Pages. Tras cada merge a `Cartagenaeste/main`, re-sincronizar el segundo repo con: `git push area2 main:main --force-with-lease` (remote `area2` apunta a github.com/carlosgalera-a11y/area2cartagena). Hacer siempre backup antes: `git clone --mirror https://github.com/carlosgalera-a11y/area2cartagena.git /tmp/area2cartagena-backup-$(date +%F).git` y `git push area2 refs/remotes/area2/main:refs/heads/pre-sync-backup-$(date +%F)` para dejar rama de rescate en remoto.

## Operaciones en dos repos (procedimiento)

```bash
# Una vez por sesión fresca:
cd /Users/carlos/cartagenaestewebappSOLIDA
git remote add area2 https://github.com/carlosgalera-a11y/area2cartagena.git 2>/dev/null || true
git fetch area2

# Tras cada merge a Cartagenaeste/main, sincronizar:
TODAY=$(date +%F)
git clone --mirror https://github.com/carlosgalera-a11y/area2cartagena.git /tmp/area2cartagena-backup-$TODAY.git
git push area2 "refs/remotes/area2/main:refs/heads/pre-sync-backup-$TODAY"
git push area2 main:main --force-with-lease

# Verificar que GitHub Pages rebuild completó:
until [ "$(gh api repos/carlosgalera-a11y/area2cartagena/pages/builds/latest --jq .status)" = "built" ]; do sleep 5; done
curl -sI "https://area2cartagena.es/" | grep -i last-modified
```

## Posicionamiento
Plataforma FORMATIVA y organizador personal de guardia. NO diagnóstica. Datos seudonimizados con fines docentes. Sin co-branding institucional hasta firma.

## Modelo Firestore actual (a revisar y endurecer, no recrear)
Colecciones existentes: users, informes_ia, mis_plantillas, mis_notebooks, megacuaderno_backups, scan_uploads, triajes, sugerencias, documentos_aprobados, accesos_profesionales.
Añadir: aiCache, auditLogs, metrics_snapshots, users/{uid}/cases, users/{uid}/aiRequests, users/{uid}/quotas/{date}, users/{uid}/progress.

## Política IA
- type='clinical_case' → Gemini 2.5 Flash-Lite EU primario, Mistral Small EU fallback
- type='educational' → DeepSeek V3 primario, Gemini 2.5 Flash-Lite EU fallback
- type='vision' → Gemini 2.5 Flash primario, Qwen-VL fallback
- Cuota dura 50/usuario/día. Caché 7d por hash. Rate limit 30/min por IP.
- NAS local desactivado en producción (mantener solo para uso personal offline).

## Co-branding
INSTITUTION_BRANDING=none. No activar UMU ni farma sin aprobación explícita Carlos.

## Comandos frecuentes
- firebase emulators:start
- npm run test --prefix functions
- firebase deploy --only functions:askAi
- firebase deploy --only firestore
- git push origin main  # deploy frontend (GitHub Pages)

## Lo que NO debe hacer Claude Code
- No reescribir la estética actual (vanilla JS funciona).
- No migrar los 132 docs clínicos embebidos a Firestore (ahorra lecturas).
- No introducir React/Vue ni bundlers pesados.
- No mencionar UMU, AstraZeneca ni ningún partner en código ni copy.
- No hacer force push.
- No commitear secretos. Si los detecta, alerta a Carlos antes de proseguir.

## Referencias internas
- docs/clinical/ — contenido clínico verificado
- docs/legal/ — privacidad, aviso legal, política contenido
- docs/runbook.md — operación
- docs/security-audit-*.md — hallazgos de seguridad
