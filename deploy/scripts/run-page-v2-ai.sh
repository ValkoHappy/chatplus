#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
DEPLOY_DIR="${PROJECT_ROOT}/deploy"

cd "${DEPLOY_DIR}"

if [ -f ".env" ]; then
  set -a
  # shellcheck disable=SC1091
  . ".env"
  set +a
fi

if [ -z "${AI_API_KEY:-}" ] && [ -n "${DEEPSEEK_API_KEY:-}" ]; then
  AI_API_KEY="${DEEPSEEK_API_KEY}"
fi

if [ -z "${AI_MODEL:-}" ] && [ -n "${DEEPSEEK_MODEL:-}" ]; then
  AI_MODEL="${DEEPSEEK_MODEL}"
fi

if [ -z "${AI_API_BASE_URL:-}" ] && [ -n "${DEEPSEEK_API_KEY:-}" ]; then
  AI_API_BASE_URL="https://api.deepseek.com/v1"
fi

if [ -z "${AI_API_KEY:-}" ] && [ -n "${OPENROUTER_API_KEY:-}" ]; then
  AI_API_KEY="${OPENROUTER_API_KEY}"
fi

if [ -z "${AI_API_KEY:-}" ] && [ -n "${OPENAI_API_KEY:-}" ]; then
  AI_API_KEY="${OPENAI_API_KEY}"
fi

if [ -z "${AI_API_KEY:-}" ]; then
  echo "AI_API_KEY, DEEPSEEK_API_KEY, OPENROUTER_API_KEY, or OPENAI_API_KEY is required in deploy/.env." >&2
  exit 1
fi

echo "Running page_v2 AI generator inside the Strapi container..."
docker compose exec -T \
  -e STRAPI_URL="http://127.0.0.1:1337" \
  -e STRAPI_TOKEN="local-mode" \
  -e STRAPI_APP_DIR="/app/cms" \
  -e AI_API_KEY="${AI_API_KEY:-}" \
  -e AI_API_BASE_URL="${AI_API_BASE_URL:-}" \
  -e AI_MODEL="${AI_MODEL:-}" \
  -e DEEPSEEK_API_KEY="${DEEPSEEK_API_KEY:-}" \
  -e DEEPSEEK_MODEL="${DEEPSEEK_MODEL:-}" \
  -e OPENROUTER_API_KEY="${OPENROUTER_API_KEY:-}" \
  -e OPENROUTER_MODEL="${OPENROUTER_MODEL:-}" \
  -e OPENAI_API_KEY="${OPENAI_API_KEY:-}" \
  -e OPENAI_MODEL="${OPENAI_MODEL:-}" \
  strapi node /app/scripts/generate-page-v2-drafts.mjs "$@"
