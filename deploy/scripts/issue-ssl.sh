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

if [[ -z "${PUBLIC_DOMAIN:-}" || -z "${CMS_DOMAIN:-}" ]]; then
  echo "PUBLIC_DOMAIN and CMS_DOMAIN must be set in deploy/.env."
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

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d --build postgres strapi content-relay nginx

# Keep the bootstrap-only dummy certificates in place while Certbot runs.
# Nginx must stay online on port 80 for the webroot challenge. Certbot writes
# the real certificate under a separate name, then we point both domains to it.
CERT_NAME="${PUBLIC_DOMAIN}-le"

CERTBOT_ARGS=(
  certonly
  --webroot
  -w /var/www/certbot
  --cert-name "${CERT_NAME}"
  -d "${PUBLIC_DOMAIN}"
  -d "${CMS_DOMAIN}"
  --agree-tos
  --keep-until-expiring
  --non-interactive
)

if [[ -n "${LETSENCRYPT_EMAIL:-}" ]]; then
  CERTBOT_ARGS+=(--email "${LETSENCRYPT_EMAIL}" --no-eff-email)
else
  echo "LETSENCRYPT_EMAIL is empty. Registering Let's Encrypt account without email."
  CERTBOT_ARGS+=(--register-unsafely-without-email)
fi

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" run --rm certbot "${CERTBOT_ARGS[@]}"

PRIMARY_CERT_DIR="${LETSENCRYPT_DIR}/live/${CERT_NAME}"

if [[ ! -f "${PRIMARY_CERT_DIR}/fullchain.pem" || ! -f "${PRIMARY_CERT_DIR}/privkey.pem" ]]; then
  echo "Could not find issued certificate files for ${CERT_NAME} in ${PRIMARY_CERT_DIR}."
  exit 1
fi

for domain in "${PUBLIC_DOMAIN}" "${CMS_DOMAIN}"; do
  TARGET_DIR="${LETSENCRYPT_DIR}/live/${domain}"

  if [[ "${TARGET_DIR}" != "${PRIMARY_CERT_DIR}" ]]; then
    rm -rf "${TARGET_DIR}"
    ln -s "${CERT_NAME}" "${TARGET_DIR}"
  fi
done

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" exec nginx nginx -s reload

echo "Let's Encrypt certificates issued or renewed for ${PUBLIC_DOMAIN} and ${CMS_DOMAIN}."
