#!/usr/bin/env bash
# wait-arditimed-dns.sh — Espera a que el DNS de arditimed.es resuelva a las
# IPs de GitHub Pages, verifica el dominio en GitHub, activa HTTPS forzado y
# espera al certificado Let's Encrypt.
#
# Tras configurar los registros A en DonDominio:
#   ./scripts/wait-arditimed-dns.sh
#
# Lo ejecutas y lo dejas corriendo en segundo plano — te avisa cuando esté listo.
set -euo pipefail

DOMAIN="arditimed.es"
REPO="carlosgalera-a11y/arditimed"

# IPs esperadas de GitHub Pages (apex)
EXPECTED_IPS=(
  "185.199.108.153"
  "185.199.109.153"
  "185.199.110.153"
  "185.199.111.153"
)

# ── 1. Esperar a que dig devuelva las 4 IPs ──
echo "[dns] esperando propagación DNS de ${DOMAIN}..."
echo "[dns] (Ctrl+C para abortar)"
attempt=0
while true; do
  attempt=$((attempt+1))
  resolved="$(dig +short +time=2 +tries=1 "$DOMAIN" A 2>/dev/null | sort -u || true)"
  ok=true
  for ip in "${EXPECTED_IPS[@]}"; do
    echo "$resolved" | grep -q "^${ip}$" || ok=false
  done
  if $ok; then
    echo "[dns] ✓ DNS resuelto correctamente a las 4 IPs de GitHub Pages."
    break
  fi
  if [ $((attempt % 6)) -eq 1 ]; then
    echo "[dns]   intento $attempt — IPs actuales: ${resolved:-(ninguna)}"
  fi
  sleep 20
done

# ── 2. Verificar dominio en GitHub Pages ──
echo "[gh] solicitando verificación del dominio en GitHub Pages..."
# Reaplicar CNAME fuerza a GitHub a recomprobar el DNS
gh api -X PUT "repos/${REPO}/pages" --input - <<EOF >/dev/null 2>&1 || true
{"cname":"${DOMAIN}","https_enforced":false}
EOF

# Esperar a protected_domain_state=verified
attempt=0
while true; do
  attempt=$((attempt+1))
  state="$(gh api "repos/${REPO}/pages" --jq '.protected_domain_state' 2>/dev/null || echo "null")"
  if [ "$state" = "verified" ]; then
    echo "[gh] ✓ dominio verificado por GitHub."
    break
  fi
  if [ $((attempt % 6)) -eq 1 ]; then
    echo "[gh]   intento $attempt — estado: ${state}"
  fi
  if [ "$attempt" -gt 60 ]; then
    echo "[gh] ⚠ no se ha podido verificar tras 30 min. Revisa la pestaña Settings → Pages del repo en GitHub para ver el motivo." >&2
    exit 1
  fi
  sleep 30
done

# ── 3. Activar HTTPS forzado (GitHub aprovisiona Let's Encrypt) ──
echo "[gh] activando HTTPS forzado..."
gh api -X PUT "repos/${REPO}/pages" --input - <<EOF >/dev/null
{"cname":"${DOMAIN}","https_enforced":true}
EOF

# ── 4. Esperar al certificado SSL (~5-15 min) ──
echo "[ssl] esperando provisión del certificado Let's Encrypt..."
attempt=0
while true; do
  attempt=$((attempt+1))
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "https://${DOMAIN}/" 2>/dev/null || echo "000")"
  if [ "$code" = "200" ]; then
    echo "[ssl] ✓ HTTPS funcionando, status 200."
    break
  fi
  if [ $((attempt % 4)) -eq 1 ]; then
    echo "[ssl]   intento $attempt — status: ${code}"
  fi
  if [ "$attempt" -gt 60 ]; then
    echo "[ssl] ⚠ HTTPS aún no responde 200 tras 30 min. Revisa Settings → Pages → Enforce HTTPS en el repo." >&2
    exit 1
  fi
  sleep 30
done

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  ✅ arditimed.es está LIVE en HTTPS"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Última verificación:"
curl -sI "https://${DOMAIN}/" | grep -iE 'last-modified|cf-cache|x-github|server' | head -6
echo ""
echo "🔔 SIGUIENTE PASO: configurar Firebase Auth + OAuth client."
echo "   Sin esto, el botón 'Iniciar sesión con Google' fallará en arditimed.es."
echo ""
echo "   Firebase Auth:"
echo "   https://console.firebase.google.com/project/docenciacartagenaeste/authentication/settings"
echo "   → Authorized domains → ADD DOMAIN → arditimed.es"
echo ""
echo "   Google OAuth client (Firebase usa este por debajo):"
echo "   https://console.cloud.google.com/apis/credentials?project=docenciacartagenaeste"
echo "   → editar OAuth 2.0 Client ID 'Web client (auto created by Google Service)'"
echo "   → Authorized JavaScript origins: añadir https://arditimed.es"
echo "   → Authorized redirect URIs: añadir https://arditimed.es/__/auth/handler"
