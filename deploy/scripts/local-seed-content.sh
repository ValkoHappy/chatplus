#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${DEPLOY_DIR}/.env.local"
PROD_COMPOSE="${DEPLOY_DIR}/docker-compose.prod.yml"
LOCAL_COMPOSE="${DEPLOY_DIR}/docker-compose.local.yml"

"${SCRIPT_DIR}/preflight-local.sh" --require-token --skip-port-check

for _ in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:1337/admin" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

docker compose --env-file "${ENV_FILE}" -f "${PROD_COMPOSE}" -f "${LOCAL_COMPOSE}" build tools
docker compose --env-file "${ENV_FILE}" -f "${PROD_COMPOSE}" -f "${LOCAL_COMPOSE}" run --no-deps --rm tools node scripts/seed-runtime-content.mjs

echo "Local seed-content completed."
