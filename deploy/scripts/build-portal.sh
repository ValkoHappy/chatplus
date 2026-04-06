#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.prod.yml"
ENV_FILE="${DEPLOY_DIR}/.env"
PUBLIC_ARTIFACT_DIR="${DEPLOY_DIR}/data/public-site/current"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Copy deploy/.env.example to deploy/.env first."
  exit 1
fi

mkdir -p "${PUBLIC_ARTIFACT_DIR}"

set -a
source "${ENV_FILE}"
set +a

if [[ -z "${STRAPI_API_TOKEN:-}" || "${STRAPI_API_TOKEN}" == "replace-with-strapi-api-token" ]]; then
  echo "Set STRAPI_API_TOKEN in deploy/.env before building the portal."
  exit 1
fi

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" build portal-builder
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" run --no-deps --rm portal-builder
