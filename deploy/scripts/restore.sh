#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <backup-directory>"
  exit 1
fi

BACKUP_SOURCE="$1"

if [[ ! -d "${BACKUP_SOURCE}" ]]; then
  echo "Backup directory not found: ${BACKUP_SOURCE}"
  exit 1
fi

if [[ ! -f "${BACKUP_SOURCE}/postgres.sql" ]]; then
  echo "Missing postgres.sql in ${BACKUP_SOURCE}"
  exit 1
fi

if [[ ! -f "${BACKUP_SOURCE}/strapi-uploads.tar.gz" ]]; then
  echo "Missing strapi-uploads.tar.gz in ${BACKUP_SOURCE}"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.prod.yml"
ENV_FILE="${DEPLOY_DIR}/.env"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Copy deploy/.env.example to deploy/.env first."
  exit 1
fi

set -a
source "${ENV_FILE}"
set +a

PROJECT_NAME="${COMPOSE_PROJECT_NAME:-chatplus}"
UPLOADS_VOLUME="${PROJECT_NAME}_strapi_uploads"

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d postgres strapi nginx

until docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" exec -T postgres \
  pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" >/dev/null 2>&1; do
  sleep 2
done

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" exec -T postgres \
  psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "DROP SCHEMA IF EXISTS ${POSTGRES_SCHEMA} CASCADE; CREATE SCHEMA ${POSTGRES_SCHEMA};"

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" exec -T postgres \
  psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" < "${BACKUP_SOURCE}/postgres.sql"

docker run --rm \
  -v "${UPLOADS_VOLUME}:/volume" \
  -v "${BACKUP_SOURCE}:/backup:ro" \
  alpine:3.20 \
  sh -lc "rm -rf /volume/* && tar xzf /backup/strapi-uploads.tar.gz -C /volume"

echo "Restore completed. Run deploy/scripts/build-portal.sh to refresh the public site."
