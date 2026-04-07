#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${DEPLOY_DIR}/.env.local"
PROD_COMPOSE="${DEPLOY_DIR}/docker-compose.prod.yml"
LOCAL_COMPOSE="${DEPLOY_DIR}/docker-compose.local.yml"

"${SCRIPT_DIR}/preflight-local.sh" --skip-port-check

docker compose --env-file "${ENV_FILE}" -f "${PROD_COMPOSE}" -f "${LOCAL_COMPOSE}" up -d --build postgres strapi content-relay nginx

echo "Local stack is up."
echo "Strapi admin: http://127.0.0.1:1337/admin"
echo "Public site after build: http://127.0.0.1:8080"
echo "If STRAPI_API_TOKEN is configured, run ./deploy/scripts/local-build-portal.sh"
