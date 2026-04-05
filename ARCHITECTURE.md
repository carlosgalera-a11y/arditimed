# Arquitectura — Área II Cartagena PWA

## Estructura actual (abril 2026)

### Archivos principales
```
index.html          ← 6600+ líneas (monolito HTML + JS inline)
app-main.js         ← Funciones core: auth, navegación, protocolos, IA
app-modules.js      ← Triaje, enfermería, funciones auxiliares
api-config.js       ← ⭐ NUEVO: Config centralizada de APIs
triaje-ia.js        ← Motor de triaje con IA conversacional
escalas-clinicas.js ← Calculadoras/escalas médicas
guardia-notas.js    ← Notas de guardia
turnos-guardia.js   ← Gestión de turnos
sw.js / sw-v2.js    ← Service Workers
test-deploy.sh      ← ⭐ NUEVO: Smoke tests post-deploy
```

### Secciones en index.html (12 pages)
```
Líneas   | ID                      | Descripción              | Tamaño
---------|-------------------------|--------------------------|-------
190-360  | pageLanding             | Inicio / Dashboard       | 170 L
361-678  | pagePatients            | Pacientes                | 317 L
679-797  | pageTraductor           | Traductor multilingüe    | 118 L
798-864  | pageProfessionals       | Profesionales            | 66 L
865-1164 | pageProtocolosAP        | Protocolos AP            | 299 L
1165-1872| pageProtocolosUrgencias | Protocolos Urgencias     | 707 L ⬛
1873-1900| pageTelefonos           | Directorio teléfonos     | 27 L
1901-2060| pageTriaje              | Autotriaje urgencias     | 159 L
2061-3363| pageScanIA              | Scan IA + Cuaderno + ... | 1302 L ⬛⬛
3364-3716| pageEnfermeria          | Enfermería               | 352 L ⬛
3717-3829| pageFilehub             | Filehub integrado        | 112 L
3830-3877| pagePrivacidad          | Política privacidad      | 47 L

Modales y JS global: líneas 3878-6634 (~2756 L)
```

## APIs y Keys

### Principio: NUNCA keys en el cliente
```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Browser    │────▶│  NAS Proxy       │────▶│  DeepSeek    │
│  (sin key)  │     │  REDACTED_INTERNAL_IP    │     │  OpenRouter  │
│             │     │  :3100           │     │  Anthropic   │
└─────────────┘     │  (keys aquí)     │     └──────────────┘
                    └──────────────────┘
                           │
                    Si no hay NAS ──▶ Modelos :free (sin key)
```

### Estado de migración de keys
| Key | Estado | Ubicación |
|-----|--------|-----------|
| DeepSeek `sk-...` | ✅ ELIMINADA | Era: app-modules.js → Ahora: vacía |
| OpenRouter `_KP` | ⚠️ DEPRECADA | index.html + app-main.js (base64 ofuscada) |
| Firebase Web | ✅ OK (pública) | index.html — necesaria para Firebase SDK |

### Proxy NAS — Endpoints
```
POST /ai/chat          → Chat genérico (auto-selecciona modelo)
POST /api/deepseek     → DeepSeek directo
POST /api/openrouter   → OpenRouter con key
POST /api/anthropic    → Claude/Haiku
POST /api/vision       → Análisis de imagen
GET  /health           → Health check
```

## Roadmap de modularización

### Fase 1 — COMPLETADA ✅
- [x] api-config.js centralizado
- [x] Keys de DeepSeek eliminadas del cliente
- [x] Test script post-deploy
- [x] Documentación de arquitectura

### Fase 2 — Próximo
- [ ] Migrar llamadas que usan `_dk()` a `API_CONFIG.fetchAI()`
- [ ] Eliminar `_KP` del código fuente
- [ ] Extraer `pageScanIA` (1302 L) a `sections/scan-ia.html` + lazy load
- [ ] Extraer `pageProtocolosUrgencias` (707 L) a `sections/urgencias.html`

### Fase 3 — Futuro
- [ ] Extraer `pageEnfermeria` (352 L)
- [ ] Extraer `pagePatients` (317 L)
- [ ] Convertir modales a componentes web reutilizables
- [ ] Service Worker con precaching de secciones
- [ ] CI/CD con GitHub Actions ejecutando test-deploy.sh

## Cómo hacer deploy
```bash
# 1. Hacer cambios
# 2. Ejecutar tests
bash test-deploy.sh

# 3. Si pasan, commit y push
git add -A
git commit -m "descripción"
git push

# 4. Esperar ~60s y re-ejecutar tests contra producción
sleep 60 && bash test-deploy.sh
```

## Configuraciones protegidas (NO TOCAR)
- `TRIAJE-CONFIG.md` — Autotriaje sin login obligatorio
- `api-config.js` — Keys solo en NAS proxy
- `test-deploy.sh` — Verificación automática post-deploy
