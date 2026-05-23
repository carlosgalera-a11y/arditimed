#!/usr/bin/env bash
# sync-mirrors.sh — Sincroniza main del repo fuente (Cartagenaeste) a los dos
# mirrors que sirven los dominios custom vía GitHub Pages.
#
# Tras cada merge a Cartagenaeste/main:
#   ./scripts/sync-mirrors.sh
#
# Hace:
#   1. Empuja main tal cual a `area2` → sirve area2cartagena.es (CNAME ya correcto).
#   2. Para `arditimed` debe swapear CNAME=arditimed.es antes de empujar, así que
#      usa un worktree temporal y un commit overlay con solo ese cambio.
#   3. Espera a que ambas builds de Pages terminen y muestra last-modified de cada
#      dominio para verificar.
#
# Requisitos (una vez por sesión fresca):
#   git remote add area2     https://github.com/carlosgalera-a11y/area2cartagena.git
#   git remote add arditimed https://github.com/carlosgalera-a11y/arditimed.git
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

# Asegurar que los remotos existen
git remote get-url area2     >/dev/null 2>&1 || git remote add area2     https://github.com/carlosgalera-a11y/area2cartagena.git
git remote get-url arditimed >/dev/null 2>&1 || git remote add arditimed https://github.com/carlosgalera-a11y/arditimed.git

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "[sync] estás en '$CURRENT_BRANCH', no en main. Cambia a main primero." >&2
  exit 1
fi

# ── 1. area2cartagena (push directo, mismo CNAME) ──
echo "[sync] → area2cartagena.es ..."
git push area2 main:main

# ── 2. arditimed (swap CNAME en commit overlay) ──
echo "[sync] → arditimed.es ..."
SHA="$(git rev-parse HEAD)"
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT
git clone --quiet --branch main https://github.com/carlosgalera-a11y/arditimed.git "$TMPDIR/arditimed"
cd "$TMPDIR/arditimed"

# Fetchea el árbol del commit fuente y crea un commit overlay con CNAME swapeado
git fetch --quiet "$REPO_ROOT" main
# Hard-reset al árbol fuente
git reset --hard FETCH_HEAD
# Swap CNAME
echo "arditimed.es" > CNAME
git -c user.email=mirror@arditimed.es -c user.name="mirror-bot" \
    add CNAME && \
git -c user.email=mirror@arditimed.es -c user.name="mirror-bot" \
    commit -m "chore(mirror): swap CNAME a arditimed.es (sync de ${SHA:0:7})" --quiet
git push origin main --force-with-lease
cd "$REPO_ROOT"

# ── 3. Esperar builds de Pages ──
echo "[sync] esperando builds de GitHub Pages ..."
for r in area2cartagena arditimed; do
  while [ "$(gh api repos/carlosgalera-a11y/$r/pages/builds/latest --jq .status 2>/dev/null)" != "built" ]; do
    sleep 5
  done
  echo "[sync] ✓ ${r} build OK"
done

# ── 4. Verificar last-modified de cada dominio ──
for d in area2cartagena.es arditimed.es; do
  lm="$(curl -sI "https://${d}/" | grep -i '^last-modified' | tr -d '\r')"
  echo "[sync]   ${d}: ${lm:-(no responde)}"
done

echo "[sync] OK · ambos mirrors al día con ${SHA:0:7}"
