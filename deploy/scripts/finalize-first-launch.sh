#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

bash "${SCRIPT_DIR}/validate-env.sh" --require-token
"${SCRIPT_DIR}/seed-content.sh"
"${SCRIPT_DIR}/build-portal.sh"

echo "First launch finalized: content imported and public site built."
