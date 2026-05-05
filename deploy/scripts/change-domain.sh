#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${DEPLOY_DIR}/.env"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

PUBLIC_DOMAIN=""
CMS_DOMAIN=""
LETSENCRYPT_EMAIL_VALUE=""
APPLY="false"
RUN_SITE_BACKUP="true"
RUN_SSL="false"
RUN_REBUILD="false"
UPDATE_PULL="false"

usage() {
  cat <<'TXT'
Usage:
  bash deploy/scripts/change-domain.sh PUBLIC_DOMAIN CMS_DOMAIN [LETSENCRYPT_EMAIL] --apply [--ssl] [--rebuild] [--pull] [--no-site-backup]

Examples:
  bash deploy/scripts/change-domain.sh chatplus.ru strapi.chatplus.ru ops@example.com --apply --ssl --rebuild
  bash deploy/scripts/change-domain.sh astro.example.com strapi.example.com --apply

What it changes in deploy/.env:
  PUBLIC_DOMAIN=chatplus.ru
  CMS_DOMAIN=strapi.chatplus.ru
  PUBLIC_SITE_URL=https://chatplus.ru
  CMS_PUBLIC_URL=https://strapi.chatplus.ru
  LETSENCRYPT_EMAIL=ops@example.com

Flags:
  --apply           Required. Without it the script only prints the planned values.
  --ssl             Run deploy/scripts/issue-ssl.sh after editing deploy/.env.
  --rebuild         Run deploy/scripts/update.sh --skip-pull after SSL/env update.
  --pull            With --rebuild, run update.sh with git pull instead of --skip-pull.
  --no-site-backup  Skip deploy/scripts/backup.sh. The .env backup is always created.
TXT
}

is_flag() {
  [[ "${1:-}" == --* ]]
}

normalize_domain() {
  local value="$1"
  value="${value#http://}"
  value="${value#https://}"
  value="${value%%/*}"
  value="${value%:80}"
  value="${value%:443}"
  printf '%s' "${value}"
}

validate_domain() {
  local name="$1"
  local value="$2"

  if [[ -z "${value}" ]]; then
    echo "${name} is required."
    exit 1
  fi

  if [[ "${value}" == *"://"* || "${value}" == *"/"* ]]; then
    echo "${name} must be a host only, without scheme or path: ${value}"
    exit 1
  fi

  if [[ ! "${value}" =~ ^[A-Za-z0-9.-]+$ ]]; then
    echo "${name} contains unsupported characters: ${value}"
    exit 1
  fi
}

set_env_value() {
  local key="$1"
  local value="$2"
  local temp_file="${ENV_FILE}.tmp-${TIMESTAMP}-${key}"

  if grep -q "^${key}=" "${ENV_FILE}"; then
    awk -v key="${key}" -v value="${value}" '
      BEGIN { replaced = 0 }
      $0 ~ "^" key "=" {
        if (replaced == 0) {
          print key "=" value
          replaced = 1
        }
        next
      }
      { print }
      END {
        if (replaced == 0) {
          print key "=" value
        }
      }
    ' "${ENV_FILE}" > "${temp_file}"
  else
    cp "${ENV_FILE}" "${temp_file}"
    printf '\n%s=%s\n' "${key}" "${value}" >> "${temp_file}"
  fi

  mv "${temp_file}" "${ENV_FILE}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --help|-h)
      usage
      exit 0
      ;;
    --apply)
      APPLY="true"
      shift
      ;;
    --ssl|--issue-ssl)
      RUN_SSL="true"
      shift
      ;;
    --rebuild|--update)
      RUN_REBUILD="true"
      shift
      ;;
    --pull)
      UPDATE_PULL="true"
      shift
      ;;
    --no-site-backup)
      RUN_SITE_BACKUP="false"
      shift
      ;;
    --*)
      echo "Unknown flag: $1"
      usage
      exit 1
      ;;
    *)
      if [[ -z "${PUBLIC_DOMAIN}" ]]; then
        PUBLIC_DOMAIN="$1"
      elif [[ -z "${CMS_DOMAIN}" ]]; then
        CMS_DOMAIN="$1"
      elif [[ -z "${LETSENCRYPT_EMAIL_VALUE}" ]] && ! is_flag "$1"; then
        LETSENCRYPT_EMAIL_VALUE="$1"
      else
        echo "Unexpected argument: $1"
        usage
        exit 1
      fi
      shift
      ;;
  esac
done

PUBLIC_DOMAIN="$(normalize_domain "${PUBLIC_DOMAIN}")"
CMS_DOMAIN="$(normalize_domain "${CMS_DOMAIN}")"

validate_domain "PUBLIC_DOMAIN" "${PUBLIC_DOMAIN}"
validate_domain "CMS_DOMAIN" "${CMS_DOMAIN}"

PUBLIC_SITE_URL="https://${PUBLIC_DOMAIN}"
CMS_PUBLIC_URL="https://${CMS_DOMAIN}"

cat <<TXT
Planned domain values:
  PUBLIC_DOMAIN=${PUBLIC_DOMAIN}
  CMS_DOMAIN=${CMS_DOMAIN}
  PUBLIC_SITE_URL=${PUBLIC_SITE_URL}
  CMS_PUBLIC_URL=${CMS_PUBLIC_URL}
TXT

if [[ -n "${LETSENCRYPT_EMAIL_VALUE}" ]]; then
  echo "  LETSENCRYPT_EMAIL=${LETSENCRYPT_EMAIL_VALUE}"
fi

if [[ "${APPLY}" != "true" ]]; then
  echo
  echo "Dry run only. Add --apply to edit deploy/.env."
  if [[ ! -f "${ENV_FILE}" ]]; then
    echo "Note: ${ENV_FILE} does not exist yet. Copy deploy/.env.example to deploy/.env before applying on a new server."
  fi
  exit 0
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Copy deploy/.env.example to deploy/.env first."
  exit 1
fi

ENV_BACKUP="${ENV_FILE}.bak-domain-${TIMESTAMP}"
cp "${ENV_FILE}" "${ENV_BACKUP}"
echo "deploy/.env backup created: ${ENV_BACKUP}"

if [[ "${RUN_SITE_BACKUP}" == "true" ]]; then
  bash "${SCRIPT_DIR}/backup.sh"
else
  echo "Site backup skipped because --no-site-backup was passed."
fi

set_env_value "PUBLIC_DOMAIN" "${PUBLIC_DOMAIN}"
set_env_value "CMS_DOMAIN" "${CMS_DOMAIN}"
set_env_value "PUBLIC_SITE_URL" "${PUBLIC_SITE_URL}"
set_env_value "CMS_PUBLIC_URL" "${CMS_PUBLIC_URL}"

if [[ -n "${LETSENCRYPT_EMAIL_VALUE}" ]]; then
  set_env_value "LETSENCRYPT_EMAIL" "${LETSENCRYPT_EMAIL_VALUE}"
fi

bash "${SCRIPT_DIR}/validate-env.sh"

if [[ "${RUN_SSL}" == "true" ]]; then
  bash "${SCRIPT_DIR}/issue-ssl.sh"
else
  echo "SSL was not issued. Run later: bash deploy/scripts/issue-ssl.sh"
fi

if [[ "${RUN_REBUILD}" == "true" ]]; then
  if [[ "${UPDATE_PULL}" == "true" ]]; then
    bash "${SCRIPT_DIR}/update.sh"
  else
    bash "${SCRIPT_DIR}/update.sh" --skip-pull
  fi
else
  echo "Site was not rebuilt. Run later: bash deploy/scripts/update.sh --skip-pull"
fi

cat <<TXT

Done.
Check:
  curl -I ${PUBLIC_SITE_URL}
  curl -I ${CMS_PUBLIC_URL}/admin
  curl -s ${PUBLIC_SITE_URL}/robots.txt
  curl -I ${PUBLIC_SITE_URL}/sitemap-index.xml
TXT
