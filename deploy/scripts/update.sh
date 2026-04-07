#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.prod.yml"
ENV_FILE="${DEPLOY_DIR}/.env"
WITH_SEED="false"
SKIP_PULL="false"

for arg in "$@"; do
  case "${arg}" in
    --with-seed)
      WITH_SEED="true"
      ;;
    --skip-pull)
      SKIP_PULL="true"
      ;;
    *)
      echo "Unknown argument: ${arg}"
      echo "Usage: $0 [--with-seed] [--skip-pull]"
      exit 1
      ;;
  esac
done

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Copy deploy/.env.example to deploy/.env first."
  exit 1
fi

if [[ "${SKIP_PULL}" != "true" ]]; then
  git pull --ff-only
fi
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d --build strapi content-relay nginx

if [[ "${WITH_SEED}" == "true" ]]; then
  "${SCRIPT_DIR}/seed-content.sh"
fi

"${SCRIPT_DIR}/build-portal.sh"

echo "Production update completed."
