#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${DEPLOY_DIR}/.env.local"
EXAMPLE_FILE="${DEPLOY_DIR}/.env.local.example"
PROD_COMPOSE="${DEPLOY_DIR}/docker-compose.prod.yml"
LOCAL_COMPOSE="${DEPLOY_DIR}/docker-compose.local.yml"

if [[ ! -f "${ENV_FILE}" ]]; then
  if [[ -f "${EXAMPLE_FILE}" ]]; then
    cp "${EXAMPLE_FILE}" "${ENV_FILE}"
  else
    echo "Missing ${ENV_FILE} and ${EXAMPLE_FILE}."
    exit 1
  fi
fi

docker compose --env-file "${ENV_FILE}" -f "${PROD_COMPOSE}" -f "${LOCAL_COMPOSE}" down

echo "Local stack stopped."
