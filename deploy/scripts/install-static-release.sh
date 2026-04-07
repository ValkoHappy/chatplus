#!/usr/bin/env bash

set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "Usage: $0 <artifact-tarball> [release-id]"
  exit 1
fi

ARTIFACT_PATH="$1"
RELEASE_ID="${2:-manual-$(date +%Y%m%d-%H%M%S)}"

if [[ ! -f "${ARTIFACT_PATH}" ]]; then
  echo "Artifact not found: ${ARTIFACT_PATH}"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
PUBLIC_ROOT="${DEPLOY_DIR}/data/public-site"
RELEASES_DIR="${PUBLIC_ROOT}/releases"
NEXT_DIR="${PUBLIC_ROOT}/incoming-${RELEASE_ID}"
CURRENT_DIR="${PUBLIC_ROOT}/current"
PREVIOUS_DIR="${PUBLIC_ROOT}/previous"

mkdir -p "${RELEASES_DIR}"
rm -rf "${NEXT_DIR}"
mkdir -p "${NEXT_DIR}"

tar xzf "${ARTIFACT_PATH}" -C "${NEXT_DIR}"

if [[ ! -f "${NEXT_DIR}/index.html" ]]; then
  echo "Static artifact is missing index.html in ${NEXT_DIR}"
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
  mv -Tf "${TMP_PREVIOUS_LINK}" "${PREVIOUS_DIR}"
fi

echo "Installed static release ${RELEASE_ID} into ${CURRENT_DIR}"
