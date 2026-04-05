#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.prod.yml"
ENV_FILE="${DEPLOY_DIR}/.env"
LETSENCRYPT_DIR="${DEPLOY_DIR}/data/letsencrypt"
WEBROOT_DIR="${DEPLOY_DIR}/data/certbot-webroot"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Copy deploy/.env.example to deploy/.env first."
  exit 1
fi

set -a
source "${ENV_FILE}"
set +a

if [[ -z "${PUBLIC_DOMAIN:-}" || -z "${CMS_DOMAIN:-}" || -z "${LETSENCRYPT_EMAIL:-}" ]]; then
  echo "PUBLIC_DOMAIN, CMS_DOMAIN and LETSENCRYPT_EMAIL must be set in deploy/.env."
  exit 1
fi

mkdir -p "${LETSENCRYPT_DIR}/live/${PUBLIC_DOMAIN}" \
  "${LETSENCRYPT_DIR}/live/${CMS_DOMAIN}" \
  "${WEBROOT_DIR}"

create_dummy_cert() {
  local domain="$1"
  local cert_dir="${LETSENCRYPT_DIR}/live/${domain}"

  if [[ ! -f "${cert_dir}/fullchain.pem" || ! -f "${cert_dir}/privkey.pem" ]]; then
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
      -keyout "${cert_dir}/privkey.pem" \
      -out "${cert_dir}/fullchain.pem" \
      -subj "/CN=${domain}"
  fi
}

create_dummy_cert "${PUBLIC_DOMAIN}"
create_dummy_cert "${CMS_DOMAIN}"

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d --build postgres strapi nginx

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" run --rm certbot \
  certonly --webroot -w /var/www/certbot \
  -d "${PUBLIC_DOMAIN}" -d "${CMS_DOMAIN}" \
  --email "${LETSENCRYPT_EMAIL}" \
  --agree-tos \
  --no-eff-email \
  --keep-until-expiring

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" exec nginx nginx -s reload

echo "Let's Encrypt certificates issued or renewed for ${PUBLIC_DOMAIN} and ${CMS_DOMAIN}."
