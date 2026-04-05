#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${DEPLOY_DIR}/.env.local"
EXAMPLE_FILE="${DEPLOY_DIR}/.env.local.example"
REQUIRE_TOKEN="false"
SKIP_PORT_CHECK="false"

for arg in "$@"; do
  case "${arg}" in
    --require-token)
      REQUIRE_TOKEN="true"
      ;;
    --skip-port-check)
      SKIP_PORT_CHECK="true"
      ;;
    *)
      echo "Unknown argument: ${arg}"
      echo "Usage: $0 [--require-token] [--skip-port-check]"
      exit 1
      ;;
  esac
done

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker CLI is not installed. Install Docker Desktop or Docker Engine first."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose is not available. Start Docker Desktop or install the compose plugin."
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  if [[ -f "${EXAMPLE_FILE}" ]]; then
    cp "${EXAMPLE_FILE}" "${ENV_FILE}"
    echo "Created ${ENV_FILE} from ${EXAMPLE_FILE}."
    echo "Review it before the first full run."
  else
    echo "Missing ${ENV_FILE} and ${EXAMPLE_FILE}."
    exit 1
  fi
fi

set -a
source "${ENV_FILE}"
set +a

if [[ "${REQUIRE_TOKEN}" == "true" ]]; then
  if [[ -z "${STRAPI_API_TOKEN:-}" || "${STRAPI_API_TOKEN}" == "replace-with-strapi-api-token" ]]; then
    echo "Set STRAPI_API_TOKEN in deploy/.env.local before running this command."
    exit 1
  fi
fi

check_port() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    if ss -ltn "( sport = :${port} )" | grep -q ":${port}"; then
      echo "Port ${port} is already in use. Free it before starting the local stack."
      exit 1
    fi
  elif command -v lsof >/dev/null 2>&1; then
    if lsof -iTCP:"${port}" -sTCP:LISTEN >/dev/null 2>&1; then
      echo "Port ${port} is already in use. Free it before starting the local stack."
      exit 1
    fi
  fi
}

if [[ "${SKIP_PORT_CHECK}" != "true" ]]; then
  check_port 1337
  check_port 8080
fi

echo "Local Docker preflight OK."
