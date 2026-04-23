#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.prod.yml"
ENV_FILE="${DEPLOY_DIR}/.env"

bash "${SCRIPT_DIR}/validate-env.sh" --require-token

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" build tools
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" run --no-deps --rm tools node scripts/seed-runtime-content.mjs
