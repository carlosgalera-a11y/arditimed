#!/bin/bash
# ══════════════════════════════════════════════════════════════════════
# test-deploy.sh · Smoke tests post-deploy para Cartagenaeste
# Uso: bash test-deploy.sh  (BASE_URL override opcional)
# ══════════════════════════════════════════════════════════════════════

set -u
BASE_URL="${BASE_URL:-https://area2cartagena.es}"
PASS=0
FAIL=0
WARN=0

green()  { echo -e "\033[32m✓ $1\033[0m"; PASS=$((PASS+1)); }
red()    { echo -e "\033[31m✗ $1\033[0m"; FAIL=$((FAIL+1)); }
yellow() { echo -e "\033[33m⚠ $1\033[0m"; WARN=$((WARN+1)); }

echo "══════════════════════════════════════════════════"
echo "🏥 Smoke Tests · Cartagenaeste · $BASE_URL"
echo "   $(date '+%Y-%m-%d %H:%M:%S')"
echo "══════════════════════════════════════════════════"

# ── 1. URLs principales ──
echo ""
echo "── 1. Carga básica ──"
for path in "/" "/notebook-local.html" "/chatbot-medicacion.html" "/status.html" "/privacidad.html" "/offline.html" "/manifest.json" "/sw.js" "/ai-client.js" "/errorMessages.js"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE_URL$path")
  if [ "$code" = "200" ]; then green "$path"; else red "$path HTTP $code"; fi
done

# ── 2. Manifest PWA ──
echo ""
echo "── 2. Manifest PWA ──"
if curl -sf "$BASE_URL/manifest.json" | python3 -m json.tool >/dev/null 2>&1; then
  green "manifest.json JSON válido"
else
  red "manifest.json inválido"
fi

# ── 3. Claves API ──
echo ""
echo "── 3. Claves API en frontend ──"
HTML=$(curl -s "$BASE_URL/index.html")
MODULES=$(curl -s "$BASE_URL/app-modules.js")
APPMAIN=$(curl -s "$BASE_URL/app-main.js")
combined="$HTML$MODULES$APPMAIN"

for pattern in 'sk-[a-f0-9]\{32\}' 'sk-or-v1-[a-f0-9]\{20,\}' 'gsk_[a-zA-Z0-9]\{20,\}' 'fh_[a-zA-Z0-9]\{10,\}'; do
  count=$(echo "$combined" | grep -cE "$pattern" || true)
  if [ "$count" = "0" ]; then green "Patrón '$pattern' ausente"; else red "Patrón '$pattern' presente ($count)"; fi
done

# ── 4. URLs directas a proveedores IA ──
echo ""
echo "── 4. URLs directas IA ──"
for endpoint in "api.groq.com" "api.deepseek.com" "api.mistral.ai" "openrouter.ai/api" "pollinations.ai" "dashscope-intl.aliyuncs"; do
  count=$(echo "$combined" | grep -cF "$endpoint" || true)
  if [ "$count" = "0" ]; then green "Sin $endpoint"; else red "$count refs a $endpoint"; fi
done

# ── 5. IP interna ──
echo ""
echo "── 5. IP interna ──"
count=$(echo "$combined" | grep -cE "192\.168\.[0-9]+\.[0-9]+" || true)
if [ "$count" = "0" ]; then green "Sin IPs internas"; else red "$count IPs internas"; fi

# ── 6. Service Worker ──
echo ""
echo "── 6. Service Worker ──"
SW=$(curl -s "$BASE_URL/sw.js")
if echo "$SW" | grep -qE "CACHE_NAME\s*=\s*'area2-v7[4-9]|'area2-v[89][0-9]"; then green "sw.js v74+"; else yellow "sw.js versión anterior a v74"; fi
if echo "$SW" | grep -q "skipWaiting"; then green "skipWaiting presente"; else red "sw.js sin skipWaiting"; fi

# ── 7. Headers / meta seguridad ──
echo ""
echo "── 7. Security headers ──"
HDR=$(curl -sI "$BASE_URL/"; echo "---"; echo "$HTML" | head -100)
echo "$HDR" | grep -qi "strict-transport-security"    && green "HSTS"          || yellow "HSTS ausente"
echo "$HDR" | grep -qi "x-content-type-options.*nosniff" && green "nosniff"    || yellow "nosniff ausente"
echo "$HDR" | grep -qi "Permissions-Policy"           && green "Permissions-Policy" || yellow "Permissions-Policy ausente"
echo "$HDR" | grep -qi "Content-Security-Policy"      && green "CSP"           || red "CSP ausente"

# ── 8. publicMetrics endpoint ──
echo ""
echo "── 8. publicMetrics ──"
M_URL="https://europe-west1-docenciacartagenaeste.cloudfunctions.net/publicMetrics"
MS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$M_URL")
if [ "$MS" = "200" ]; then
  green "publicMetrics HTTP 200"
  if curl -sf "$M_URL" | python3 -m json.tool >/dev/null 2>&1; then green "publicMetrics JSON válido"; fi
else
  yellow "publicMetrics HTTP $MS (¿función no desplegada?)"
fi

# ── 9. Metadatos limpios ──
echo ""
echo "── 9. Metadatos ──"
if echo "$HTML" | grep -qE "build 17[0-9]{8}"; then red "Title con build timestamp"; else green "Title limpio"; fi
if echo "$HTML" | grep -qiE "IA diagn[oó]stica"; then red "Copy 'IA diagnóstica'"; else green "Copy 'IA docente'"; fi

# ── Resumen ──
echo ""
echo "══════════════════════════════════════════════════"
TOTAL=$((PASS+FAIL+WARN))
echo "📊 Resultados: $PASS/$TOTAL ok, $FAIL fail, $WARN warn"
if [ "$FAIL" -gt 0 ]; then
  echo -e "\033[31m❌ HAY FALLOS\033[0m"
  exit 1
else
  echo -e "\033[32m✅ Smoke tests OK\033[0m"
  exit 0
fi
