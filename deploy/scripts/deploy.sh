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

bash "${SCRIPT_DIR}/validate-env.sh"
"${SCRIPT_DIR}/issue-ssl.sh"
bash "${SCRIPT_DIR}/ensure-public-placeholder.sh"

if grep -q '^STRAPI_API_TOKEN=replace-with-strapi-api-token$' "${SCRIPT_DIR}/../.env" || ! grep -q '^STRAPI_API_TOKEN=' "${SCRIPT_DIR}/../.env"; then
  echo "Core services and SSL are ready."
  echo "Next steps:"
  echo "  1. Open Strapi admin and create the first admin user."
  echo "  2. Create a full-access API token in Settings -> API Tokens."
  echo "  3. Save it to deploy/.env as STRAPI_API_TOKEN=..."
  echo "  4. Run ./deploy/scripts/finalize-first-launch.sh"
  exit 0
fi

if [[ "${WITH_SEED}" == "true" ]]; then
  "${SCRIPT_DIR}/seed-content.sh"
fi

"${SCRIPT_DIR}/build-portal.sh"

echo "Production deploy completed."
