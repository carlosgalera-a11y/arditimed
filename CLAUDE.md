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
10. **Tres repos en GitHub, mismo contenido**. `carlosgalera-a11y/Cartagenaeste` es el source of truth (aquí se trabaja y se abren PRs). Dos mirrors sirven sendos dominios custom vía GitHub Pages:
    - `carlosgalera-a11y/area2cartagena` → `area2cartagena.es` (CNAME=area2cartagena.es).
    - `carlosgalera-a11y/arditimed` → `arditimed.es` (CNAME=arditimed.es). El sync overlay-commitea el swap del CNAME porque la fuente tiene `area2cartagena.es`.
    Tras cada merge a `Cartagenaeste/main`, lanzar `./scripts/sync-mirrors.sh` (empuja a area2 + clona arditimed, swap CNAME, push, espera builds, verifica last-modified).
11. **Branch protection activa en los tres repos** (2026-05-23 actualizado para arditimed):
    - `Cartagenaeste/main`: PR requerido (0 approvers), force-push bloqueado, delete bloqueado, enforce_admins=true, conversation resolution requerida. Todo cambio entra por PR.
    - `area2cartagena/main`: push directo permitido (mirror del source), force-push bloqueado, delete bloqueado, enforce_admins=true. No se abren PRs aquí.
    - `arditimed/main`: push directo permitido (mirror del source con swap de CNAME), force-push bloqueado pero el script usa `--force-with-lease` porque cada sync es un commit overlay sobre la última `main` fuente (no hay merge directo, así que no hay fast-forward limpio). Branch protection permite force-with-lease vía API mientras `allow_force_pushes=false`; si en el futuro endurecemos eso habrá que reabrir temporalmente igual que en operaciones destructivas.
    - Operaciones destructivas (ej. `git filter-repo`) requieren relajar temporalmente allow_force_pushes vía `gh api -X PUT` y re-locking justo después. Ver `docs/s1.2-rotacion-claves-carlos.md` para el procedimiento exacto.

## Operaciones en los tres repos (procedimiento)

```bash
# Una vez por sesión fresca (idempotente, el script los añade si faltan):
cd /Users/carlos/cartagenaestewebappSOLIDA
git remote add area2     https://github.com/carlosgalera-a11y/area2cartagena.git 2>/dev/null || true
git remote add arditimed https://github.com/carlosgalera-a11y/arditimed.git 2>/dev/null || true

# Tras cada merge a Cartagenaeste/main, sincronizar AMBOS mirrors:
./scripts/sync-mirrors.sh
```

Para operaciones destructivas que requieran reescribir historia (p.ej. `git filter-repo`):
```bash
# 1. Backup mirror antes de nada
git clone --mirror https://github.com/carlosgalera-a11y/area2cartagena.git /tmp/area2cartagena-backup-$(date +%F).git
git clone --mirror https://github.com/carlosgalera-a11y/Cartagenaeste.git /tmp/Cartagenaeste-backup-$(date +%F).git

# 2. Relajar protecciones temporalmente (guardar la config estricta antes)
#    → ver docs/s1.2-rotacion-claves-carlos.md §backup section.

# 3. Hacer la operación + force-push.
# 4. Re-lockar protecciones.
```

## Posicionamiento
Plataforma FORMATIVA y organizador personal de guardia. NO diagnóstica. Datos seudonimizados con fines docentes. Sin co-branding institucional hasta firma.

## Modelo Firestore actual (a revisar y endurecer, no recrear)
Colecciones existentes: users, informes_ia, mis_plantillas, mis_notebooks, megacuaderno_backups, scan_uploads, triajes, sugerencias, documentos_aprobados, accesos_profesionales.
Añadir: aiCache, auditLogs, metrics_snapshots, users/{uid}/cases, users/{uid}/aiRequests, users/{uid}/quotas/{date}, users/{uid}/progress.

## Política IA
- type='clinical_case' → Qwen2.5-VL-72B primario (directo DashScope Intl si hay QWEN_API_KEY, si no OpenRouter `qwen/qwen2.5-vl-72b-instruct`). Fallbacks: Gemini 2.5 Flash-Lite → Mistral Small → OR Gemini → OR Mistral.
- type='educational' → DeepSeek V3 primario, Gemini 2.5 Flash-Lite EU fallback.
- type='vision' → Qwen2.5-VL-72B primario (directo DashScope Intl si hay QWEN_API_KEY, si no OpenRouter). Fallback: Gemini 2.5 Flash directo (si hay key) → OpenRouter Gemini 2.5 Flash.
- Cuota dura 50/usuario/día. Caché 7d por hash. Rate limit 30/min por IP.
- Nota EU residency: DashScope Intl no garantiza routing UE. Si se exige estrictamente UE para clinical_case, hay que preferir Gemini directo (europe-west1) vía modelOverride o reordenar la cadena.
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
