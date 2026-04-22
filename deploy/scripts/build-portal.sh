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
LOCK_DIR="${PUBLIC_ROOT}/.build-lock"
RELEASE_ID="${RELEASE_ID:-local-$(date +%Y%m%d-%H%M%S)-$$-$(date +%N)}"
NEXT_DIR="${PUBLIC_ROOT}/incoming-${RELEASE_ID}"

cleanup() {
  rm -rf "${NEXT_DIR}" "${LOCK_DIR}"
}

resolve_link_target() {
  local link_path="$1"
  local target=""

  target="$(readlink "${link_path}")"
  if [[ "${target}" != /* ]]; then
    target="${PUBLIC_ROOT}/${target}"
  fi

  printf '%s' "${target}"
}

mkdir -p "${RELEASES_DIR}"
rm -rf "${NEXT_DIR}"

if ! mkdir "${LOCK_DIR}" 2>/dev/null; then
  echo "Another public-site build is already in progress."
  exit 1
fi

trap cleanup EXIT

"${SCRIPT_DIR}/validate-env.sh" --require-token

set -a
source "${ENV_FILE}"
set +a

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" build tools
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" run --no-deps --rm tools node scripts/preflight-portal-build.mjs

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
  CURRENT_TARGET="$(resolve_link_target "${CURRENT_DIR}")"
elif [[ -d "${CURRENT_DIR}" ]]; then
  rm -rf "${PREVIOUS_DIR}"
  mv "${CURRENT_DIR}" "${PREVIOUS_DIR}"
fi

mv "${NEXT_DIR}" "${RELEASES_DIR}/${RELEASE_ID}"

TMP_CURRENT_LINK="${PUBLIC_ROOT}/.current-${RELEASE_ID}"
ln -sfn "releases/${RELEASE_ID}" "${TMP_CURRENT_LINK}"
mv -Tf "${TMP_CURRENT_LINK}" "${CURRENT_DIR}"

if [[ -n "${CURRENT_TARGET}" && -d "${CURRENT_TARGET}" ]]; then
  PREVIOUS_TARGET_RELATIVE="$(realpath --relative-to="${PUBLIC_ROOT}" "${CURRENT_TARGET}")"
  TMP_PREVIOUS_LINK="${PUBLIC_ROOT}/.previous-${RELEASE_ID}"
  ln -sfn "${PREVIOUS_TARGET_RELATIVE}" "${TMP_PREVIOUS_LINK}"
  rm -rf "${PREVIOUS_DIR}"
  mv -Tf "${TMP_PREVIOUS_LINK}" "${PREVIOUS_DIR}"
fi

if [[ ! -L "${CURRENT_DIR}" && ! -d "${CURRENT_DIR}" ]]; then
  echo "Current public-site pointer was not created successfully."
  exit 1
fi
