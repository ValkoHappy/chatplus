#!/usr/bin/env bash

set -euo pipefail

CHECK_ONLY=false

if [[ $# -eq 2 && "$1" == "--check" ]]; then
  CHECK_ONLY=true
  BACKUP_SOURCE="$2"
elif [[ $# -eq 1 ]]; then
  BACKUP_SOURCE="$1"
else
  echo "Usage: $0 [--check] <backup-directory>"
  exit 1
fi

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

PROJECT_ROOT="${HOST_PROJECT_ROOT:-$(cd "${DEPLOY_DIR}/.." && pwd)}"
if [[ "${BACKUP_SOURCE}" != /* ]]; then
  BACKUP_SOURCE="${PROJECT_ROOT}/${BACKUP_SOURCE#./}"
fi

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

if [[ "${CHECK_ONLY}" == "true" ]]; then
  if [[ ! -s "${BACKUP_SOURCE}/postgres.sql" ]]; then
    echo "postgres.sql exists but is empty in ${BACKUP_SOURCE}"
    exit 1
  fi

  if ! tar tzf "${BACKUP_SOURCE}/strapi-uploads.tar.gz" >/dev/null 2>&1; then
    echo "strapi-uploads.tar.gz exists but cannot be read as a valid gzip tar archive."
    exit 1
  fi

  echo "Restore check passed for ${BACKUP_SOURCE}"
  echo "Files found:"
  echo "- ${BACKUP_SOURCE}/postgres.sql"
  echo "- ${BACKUP_SOURCE}/strapi-uploads.tar.gz"
  echo "Archive readability verified."
  echo "No changes were applied."
  exit 0
fi

PROJECT_NAME="${COMPOSE_PROJECT_NAME:-chatplus}"
UPLOADS_VOLUME="${PROJECT_NAME}_strapi_uploads"

echo "Creating a safety backup before destructive restore..."
"${SCRIPT_DIR}/backup.sh"

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d postgres
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" stop strapi content-relay nginx >/dev/null 2>&1 || true

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

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d strapi content-relay nginx

until docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" exec -T strapi \
  node -e "fetch('http://127.0.0.1:1337/admin').then((res) => process.exit(res.ok ? 0 : 1)).catch(() => process.exit(1))" >/dev/null 2>&1; do
  sleep 3
done

echo "Restore completed. A safety backup was created before restore."
echo "Run deploy/scripts/build-portal.sh to refresh the public site."
