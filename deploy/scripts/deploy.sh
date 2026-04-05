#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WITH_SEED="false"

for arg in "$@"; do
  case "${arg}" in
    --with-seed)
      WITH_SEED="true"
      ;;
    *)
      echo "Unknown argument: ${arg}"
      echo "Usage: $0 [--with-seed]"
      exit 1
      ;;
  esac
done

"${SCRIPT_DIR}/issue-ssl.sh"

if [[ "${WITH_SEED}" == "true" ]]; then
  "${SCRIPT_DIR}/seed-content.sh"
fi

"${SCRIPT_DIR}/build-portal.sh"

echo "Production deploy completed."
