#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${DEPLOY_DIR}/.env"
REQUIRE_TOKEN="false"

for arg in "$@"; do
  case "${arg}" in
    --require-token)
      REQUIRE_TOKEN="true"
      ;;
    *)
      echo "Unknown argument: ${arg}"
      echo "Usage: $0 [--require-token]"
      exit 1
      ;;
  esac
done

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Copy deploy/.env.example to deploy/.env first."
  exit 1
fi

duplicate_keys=()
for key in \
  PUBLIC_DOMAIN \
  CMS_DOMAIN \
  PUBLIC_SITE_URL \
  CMS_PUBLIC_URL \
  HOST_PROJECT_ROOT \
  STRAPI_INTERNAL_URL \
  STRAPI_API_TOKEN \
  WEBHOOK_TOKEN \
  POSTGRES_DB \
  POSTGRES_USER \
  POSTGRES_PASSWORD \
  APP_KEYS \
  API_TOKEN_SALT \
  ADMIN_JWT_SECRET \
  TRANSFER_TOKEN_SALT \
  JWT_SECRET \
  ENCRYPTION_KEY; do
  count="$(grep -c "^${key}=" "${ENV_FILE}" || true)"
  if [[ "${count}" -gt 1 ]]; then
    duplicate_keys+=("${key}")
  fi
done

if [[ "${#duplicate_keys[@]}" -gt 0 ]]; then
  echo "Duplicate keys found in deploy/.env:"
  printf ' - %s\n' "${duplicate_keys[@]}"
  echo "Keep only one value for each key before continuing."
  exit 1
fi

set -a
source "${ENV_FILE}"
set +a

required_keys=(
  PUBLIC_DOMAIN
  CMS_DOMAIN
  PUBLIC_SITE_URL
  CMS_PUBLIC_URL
  HOST_PROJECT_ROOT
  STRAPI_INTERNAL_URL
  WEBHOOK_TOKEN
  POSTGRES_DB
  POSTGRES_USER
  POSTGRES_PASSWORD
  APP_KEYS
  API_TOKEN_SALT
  ADMIN_JWT_SECRET
  TRANSFER_TOKEN_SALT
  JWT_SECRET
  ENCRYPTION_KEY
)

missing_keys=()
for key in "${required_keys[@]}"; do
  value="${!key:-}"
  if [[ -z "${value}" ]]; then
    missing_keys+=("${key}")
  fi
done

if [[ "${#missing_keys[@]}" -gt 0 ]]; then
  echo "Missing required values in deploy/.env:"
  printf ' - %s\n' "${missing_keys[@]}"
  exit 1
fi

sensitive_keys=(
  POSTGRES_PASSWORD
  APP_KEYS
  API_TOKEN_SALT
  ADMIN_JWT_SECRET
  TRANSFER_TOKEN_SALT
  JWT_SECRET
  ENCRYPTION_KEY
  WEBHOOK_TOKEN
)

placeholder_keys=()
for key in "${sensitive_keys[@]}"; do
  value="${!key:-}"
  if [[ "${value}" == *replace-with-* || "${value}" == *replace-me-* ]]; then
    placeholder_keys+=("${key}")
  fi
done

if [[ "${#placeholder_keys[@]}" -gt 0 ]]; then
  echo "Placeholder secrets found in deploy/.env. Replace them before continuing:"
  printf ' - %s\n' "${placeholder_keys[@]}"
  exit 1
fi

if [[ "${REQUIRE_TOKEN}" == "true" ]]; then
  if [[ -z "${STRAPI_API_TOKEN:-}" || "${STRAPI_API_TOKEN}" == "replace-with-strapi-api-token" ]]; then
    echo "STRAPI_API_TOKEN is not set yet."
    echo "Create the first Strapi admin user, create an API token in Settings -> API Tokens,"
    echo "write it to deploy/.env, then rerun this command."
    exit 1
  fi
fi
