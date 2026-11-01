#!/usr/bin/env bash
# ─────────────────────────────────────────────────
# Actualiza eccursos en el servidor con lo último de GitHub.
# Uso (en la VM):   bash /var/www/eccursos/deploy/deploy.sh [rama]
# Por defecto despliega la rama main.
# ─────────────────────────────────────────────────
set -euo pipefail

BRANCH="${1:-main}"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

echo "▶ Descargando cambios de origin/$BRANCH…"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "▶ Instalando dependencias del backend…"
npm ci --prefix backend --omit=dev

echo "▶ Compilando el frontend…"
npm ci --prefix frontend
npm run build --prefix frontend

echo "▶ Reiniciando el backend con PM2…"
pm2 startOrReload ecosystem.config.js --env production --update-env
pm2 save

echo "▶ Comprobando la API…"
sleep 2
curl -fsS http://127.0.0.1:5100/api/health && echo
echo "✅ eccursos desplegado ($(git rev-parse --short HEAD))"
