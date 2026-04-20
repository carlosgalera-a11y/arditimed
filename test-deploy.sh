#!/bin/bash
# ══════════════════════════════════════════════════════════════════════
# test-deploy.sh — Smoke tests para la PWA Área II Cartagena
# Ejecutar después de cada deploy: bash test-deploy.sh
# ══════════════════════════════════════════════════════════════════════

BASE_URL="https://carlosgalera-a11y.github.io/Cartagenaeste"
PASS=0
FAIL=0
WARN=0

green() { echo -e "\033[32m✓ $1\033[0m"; PASS=$((PASS+1)); }
red()   { echo -e "\033[31m✗ $1\033[0m"; FAIL=$((FAIL+1)); }
yellow(){ echo -e "\033[33m⚠ $1\033[0m"; WARN=$((WARN+1)); }

echo "══════════════════════════════════════════════════"
echo "🏥 Smoke Tests — Área II Cartagena PWA"
echo "   $(date '+%Y-%m-%d %H:%M:%S')"
echo "══════════════════════════════════════════════════"
echo ""

# ── 1. Página principal carga ──
echo "── Carga básica ──"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
if [ "$HTTP" = "200" ]; then green "index.html carga (HTTP $HTTP)"; else red "index.html NO carga (HTTP $HTTP)"; fi

# ── 2. Archivos JS críticos ──
echo ""
echo "── Archivos JS ──"
for f in app-main.js app-modules.js triaje-ia.js api-config.js escalas-clinicas.js; do
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/$f")
  if [ "$HTTP" = "200" ]; then green "$f OK"; else red "$f FALTA (HTTP $HTTP)"; fi
done

# ── 3. Service Worker ──
echo ""
echo "── Service Worker ──"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/sw.js")
if [ "$HTTP" = "200" ]; then green "sw.js presente"; else yellow "sw.js no accesible (HTTP $HTTP)"; fi

# ── 4. Manifest PWA ──
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/manifest.json")
if [ "$HTTP" = "200" ]; then green "manifest.json presente"; else yellow "manifest.json no accesible"; fi

# ── 5. Contenido HTML — secciones principales ──
echo ""
echo "── Secciones HTML ──"
HTML=$(curl -s "$BASE_URL/")
for section in pageLanding pagePatients pageProfessionals pageProtocolosAP pageProtocolosUrgencias pageTriaje pageScanIA pageEnfermeria; do
  if echo "$HTML" | grep -q "id=\"$section\""; then green "$section presente"; else red "$section FALTA en HTML"; fi
done

# ── 6. API Keys NO expuestas en texto claro ──
echo ""
echo "── Seguridad: API Keys ──"
# Patrones genéricos de claves expuestas (no hardcodeamos la clave aquí)
MODULES=$(curl -s "$BASE_URL/app-modules.js")
if echo "$HTML"    | grep -qE 'sk-[a-f0-9]{32}'; then red "Posible clave sk- expuesta en index.html"; else green "Sin claves sk- en index.html"; fi
if echo "$MODULES" | grep -qE 'sk-[a-f0-9]{32}'; then red "Posible clave sk- expuesta en app-modules.js"; else green "Sin claves sk- en app-modules.js"; fi
if echo "$HTML"    | grep -qE '192\.168\.[0-9]+\.[0-9]+'; then red "IP privada expuesta en index.html"; else green "Sin IPs privadas en index.html"; fi

# ── 7. Fármacos de Urgencia ──
echo ""
echo "── Fármacos de Urgencia ──"
if echo "$HTML" | grep -q "urg-farmacos-content"; then green "Sección Fármacos presente"; else red "Sección Fármacos FALTA"; fi
if echo "$HTML" | grep -q "URG_FARMACOS"; then green "Array fármacos cargado"; else red "Array fármacos FALTA"; fi

# ── 8. Triaje — Fix auth permanente ──
echo ""
echo "── Triaje: Fix auth ──"
if echo "$MODULES" | grep -q "firebase.auth().currentUser"; then green "Guard auth en triaje presente"; else red "Guard auth en triaje FALTA — riesgo de 'insufficient permissions'"; fi
if echo "$MODULES" | grep -q "NO ELIMINAR"; then green "Comentario protección permanente OK"; else yellow "Comentario protección no encontrado"; fi

# ── 9. Triaje ficha ──
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/triaje-ficha.html")
if [ "$HTTP" = "200" ]; then green "triaje-ficha.html accesible"; else yellow "triaje-ficha.html no accesible (HTTP $HTTP)"; fi

# ── 10. PDFs de trípticos (muestra) ──
echo ""
echo "── Recursos (muestra) ──"
for pdf in "tripticos/triptico-fibrilacion-auricular.pdf" "recursos-sociales-grado-dependencia.pdf"; do
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/$pdf")
  if [ "$HTTP" = "200" ]; then green "$pdf OK"; else yellow "$pdf no accesible (HTTP $HTTP)"; fi
done

# ── 11. API endpoints (solo si LOCAL_AI_PROXY está definido) ──
echo ""
echo "── API proxy local (opcional) ──"
if [ -n "$LOCAL_AI_PROXY" ]; then
  NAS_HTTP=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "$LOCAL_AI_PROXY/health" 2>/dev/null)
  if [ "$NAS_HTTP" = "200" ]; then
    green "Proxy local accesible"
    AI_HTTP=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 -X POST "$LOCAL_AI_PROXY/ai/chat" -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"test"}],"max_tokens":5}' 2>/dev/null)
    if [ "$AI_HTTP" = "200" ]; then green "Proxy AI endpoint responde"; else yellow "Proxy AI endpoint: HTTP $AI_HTTP"; fi
  else
    yellow "Proxy local no accesible"
  fi
else
  yellow "LOCAL_AI_PROXY no definido — test omitido (producción usa Cloud Function)"
fi

# ── Resumen ──
echo ""
echo "══════════════════════════════════════════════════"
TOTAL=$((PASS+FAIL+WARN))
echo "📊 Resultados: $PASS/$TOTAL passed, $FAIL failed, $WARN warnings"
if [ "$FAIL" -gt 0 ]; then
  echo -e "\033[31m❌ HAY FALLOS — revisar antes de continuar\033[0m"
  exit 1
else
  echo -e "\033[32m✅ Todo OK — deploy seguro\033[0m"
  exit 0
fi
