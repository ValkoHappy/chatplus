#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${DEPLOY_DIR}/.env.local"
PROD_COMPOSE="${DEPLOY_DIR}/docker-compose.prod.yml"
LOCAL_COMPOSE="${DEPLOY_DIR}/docker-compose.local.yml"
PUBLIC_ROOT="${DEPLOY_DIR}/data/public-site"
RELEASES_DIR="${PUBLIC_ROOT}/releases"
CURRENT_DIR="${PUBLIC_ROOT}/current"
PREVIOUS_DIR="${PUBLIC_ROOT}/previous"
RELEASE_ID="${RELEASE_ID:-local-$(date +%Y%m%d-%H%M%S)}"
NEXT_DIR="${PUBLIC_ROOT}/incoming-${RELEASE_ID}"

"${SCRIPT_DIR}/preflight-local.sh" --require-token --skip-port-check
mkdir -p "${RELEASES_DIR}"
rm -rf "${NEXT_DIR}"

for _ in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:1337/admin" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

docker compose --env-file "${ENV_FILE}" -f "${PROD_COMPOSE}" -f "${LOCAL_COMPOSE}" build portal-builder
docker compose --env-file "${ENV_FILE}" -f "${PROD_COMPOSE}" -f "${LOCAL_COMPOSE}" run --no-deps --rm \
  -e "PORTAL_OUTPUT_DIR=/portal-output/incoming-${RELEASE_ID}" \
  portal-builder

if [[ ! -f "${NEXT_DIR}/index.html" ]]; then
  echo "Build did not produce ${NEXT_DIR}/index.html"
  exit 1
fi

CURRENT_TARGET=""
if [[ -L "${CURRENT_DIR}" ]]; then
  CURRENT_TARGET="$(readlink -f "${CURRENT_DIR}")"
elif [[ -d "${CURRENT_DIR}" ]]; then
  rm -rf "${PREVIOUS_DIR}"
  mv "${CURRENT_DIR}" "${PREVIOUS_DIR}"
fi

rm -rf "${RELEASES_DIR:?}/${RELEASE_ID}"
mv "${NEXT_DIR}" "${RELEASES_DIR}/${RELEASE_ID}"

TMP_CURRENT_LINK="${PUBLIC_ROOT}/.current-${RELEASE_ID}"
ln -sfn "${RELEASES_DIR}/${RELEASE_ID}" "${TMP_CURRENT_LINK}"
mv -Tf "${TMP_CURRENT_LINK}" "${CURRENT_DIR}"

if [[ -n "${CURRENT_TARGET}" && -d "${CURRENT_TARGET}" ]]; then
  TMP_PREVIOUS_LINK="${PUBLIC_ROOT}/.previous-${RELEASE_ID}"
  ln -sfn "${CURRENT_TARGET}" "${TMP_PREVIOUS_LINK}"
  rm -rf "${PREVIOUS_DIR}"
  mv -Tf "${TMP_PREVIOUS_LINK}" "${PREVIOUS_DIR}"
fi

echo "Local public build completed: http://127.0.0.1:8080"
