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

bash "${SCRIPT_DIR}/validate-env.sh" --require-token

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Copy deploy/.env.example to deploy/.env first."
  exit 1
fi

if [[ "${SKIP_PULL}" != "true" ]]; then
  git pull --ff-only
fi

bash "${SCRIPT_DIR}/validate-env.sh" --require-token

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d --build strapi content-relay nginx
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d --force-recreate nginx
bash "${SCRIPT_DIR}/ensure-public-placeholder.sh"

if [[ "${WITH_SEED}" == "true" ]]; then
  bash "${SCRIPT_DIR}/seed-content.sh"
fi

bash "${SCRIPT_DIR}/build-portal.sh"

echo "Production update completed."
