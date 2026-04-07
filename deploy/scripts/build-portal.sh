#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.prod.yml"
ENV_FILE="${DEPLOY_DIR}/.env"
PUBLIC_ROOT="${DEPLOY_DIR}/data/public-site"
RELEASES_DIR="${PUBLIC_ROOT}/releases"
CURRENT_DIR="${PUBLIC_ROOT}/current"
PREVIOUS_DIR="${PUBLIC_ROOT}/previous"
RELEASE_ID="${RELEASE_ID:-local-$(date +%Y%m%d-%H%M%S)}"
NEXT_DIR="${PUBLIC_ROOT}/incoming-${RELEASE_ID}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Copy deploy/.env.example to deploy/.env first."
  exit 1
fi

mkdir -p "${RELEASES_DIR}"
rm -rf "${NEXT_DIR}"

set -a
source "${ENV_FILE}"
set +a

if [[ -z "${STRAPI_API_TOKEN:-}" || "${STRAPI_API_TOKEN}" == "replace-with-strapi-api-token" ]]; then
  echo "Set STRAPI_API_TOKEN in deploy/.env before building the portal."
  exit 1
fi

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" build portal-builder
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" run --no-deps --rm \
  -e "PORTAL_OUTPUT_DIR=/portal-output/incoming-${RELEASE_ID}" \
  portal-builder

if [[ ! -f "${NEXT_DIR}/index.html" ]]; then
  echo "Build did not produce ${NEXT_DIR}/index.html"
  exit 1
fi

CURRENT_TARGET=""
if [[ -L "${CURRENT_DIR}" ]]; then
  CURRENT_TARGET="$(readlink "${CURRENT_DIR}")"
elif [[ -d "${CURRENT_DIR}" ]]; then
  rm -rf "${PREVIOUS_DIR}"
  mv "${CURRENT_DIR}" "${PREVIOUS_DIR}"
fi

rm -rf "${RELEASES_DIR:?}/${RELEASE_ID}"
mv "${NEXT_DIR}" "${RELEASES_DIR}/${RELEASE_ID}"

TMP_CURRENT_LINK="${PUBLIC_ROOT}/.current-${RELEASE_ID}"
ln -sfn "releases/${RELEASE_ID}" "${TMP_CURRENT_LINK}"
mv -Tf "${TMP_CURRENT_LINK}" "${CURRENT_DIR}"

if [[ -n "${CURRENT_TARGET}" && -d "${CURRENT_TARGET}" ]]; then
  TMP_PREVIOUS_LINK="${PUBLIC_ROOT}/.previous-${RELEASE_ID}"
  ln -sfn "${CURRENT_TARGET}" "${TMP_PREVIOUS_LINK}"
  rm -rf "${PREVIOUS_DIR}"
  mv -Tf "${TMP_PREVIOUS_LINK}" "${PREVIOUS_DIR}"
fi
