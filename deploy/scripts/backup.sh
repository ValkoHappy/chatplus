#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.prod.yml"
ENV_FILE="${DEPLOY_DIR}/.env"

"${SCRIPT_DIR}/validate-env.sh"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Copy deploy/.env.example to deploy/.env first."
  exit 1
fi

set -a
source "${ENV_FILE}"
set +a

PROJECT_NAME="${COMPOSE_PROJECT_NAME:-chatplus}"
PROJECT_ROOT="${HOST_PROJECT_ROOT:-$(cd "${DEPLOY_DIR}/.." && pwd)}"
BACKUP_ROOT="${BACKUP_DIR:-${DEPLOY_DIR}/data/backups}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-7}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
if [[ "${BACKUP_ROOT}" != /* ]]; then
  BACKUP_ROOT="${PROJECT_ROOT}/${BACKUP_ROOT#./}"
fi
BACKUP_ROOT="$(realpath -m "${BACKUP_ROOT}")"
TARGET_DIR="${BACKUP_ROOT}/${TIMESTAMP}"
UPLOADS_VOLUME="${PROJECT_NAME}_strapi_uploads"

for forbidden in "/" "/root" "/home" "/srv" "${PROJECT_ROOT}" "${DEPLOY_DIR}" "${DEPLOY_DIR}/data"; do
  if [[ "${BACKUP_ROOT}" == "$(realpath -m "${forbidden}")" ]]; then
    echo "BACKUP_DIR must point to a dedicated backup directory, not ${BACKUP_ROOT}."
    exit 1
  fi
done

mkdir -p "${TARGET_DIR}"
touch "${BACKUP_ROOT}/.chatplus-backup-root"

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d postgres

until docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" exec -T postgres \
  pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" >/dev/null 2>&1; do
  sleep 2
done

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" exec -T postgres \
  pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" > "${TARGET_DIR}/postgres.sql"

docker run --rm \
  -v "${UPLOADS_VOLUME}:/volume:ro" \
  -v "${TARGET_DIR}:/backup" \
  alpine:3.20 \
  sh -lc "tar czf /backup/strapi-uploads.tar.gz -C /volume ."

find "${BACKUP_ROOT}" -mindepth 1 -maxdepth 1 -type d -mtime +"${KEEP_DAYS}" -exec rm -rf {} +

echo "Backup created in ${TARGET_DIR}"
