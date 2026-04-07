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

# Remove bootstrap-only dummy certificate paths before asking certbot to create
# the real Let's Encrypt material in the same location.
rm -rf \
  "${LETSENCRYPT_DIR}/live/${PUBLIC_DOMAIN}" \
  "${LETSENCRYPT_DIR}/live/${CMS_DOMAIN}"

CERTBOT_ARGS=(
  certonly
  --webroot
  -w /var/www/certbot
  -d "${PUBLIC_DOMAIN}"
  -d "${CMS_DOMAIN}"
  --agree-tos
  --keep-until-expiring
)

if [[ -n "${LETSENCRYPT_EMAIL:-}" ]]; then
  CERTBOT_ARGS+=(--email "${LETSENCRYPT_EMAIL}" --no-eff-email)
else
  echo "LETSENCRYPT_EMAIL is empty. Registering Let's Encrypt account without email."
  CERTBOT_ARGS+=(--register-unsafely-without-email)
fi

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" run --rm certbot "${CERTBOT_ARGS[@]}"

PRIMARY_CERT_DIR="$(find "${LETSENCRYPT_DIR}/live" -maxdepth 1 -mindepth 1 -type d -name "${PUBLIC_DOMAIN}*" | sort | tail -n 1)"

if [[ -z "${PRIMARY_CERT_DIR}" ]]; then
  echo "Could not find issued certificate directory for ${PUBLIC_DOMAIN} in ${LETSENCRYPT_DIR}/live."
  exit 1
fi

for domain in "${PUBLIC_DOMAIN}" "${CMS_DOMAIN}"; do
  TARGET_DIR="${LETSENCRYPT_DIR}/live/${domain}"

  if [[ "${TARGET_DIR}" != "${PRIMARY_CERT_DIR}" ]]; then
    rm -rf "${TARGET_DIR}"
    ln -s "${PRIMARY_CERT_DIR}" "${TARGET_DIR}"
  fi
done

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" exec nginx nginx -s reload

echo "Let's Encrypt certificates issued or renewed for ${PUBLIC_DOMAIN} and ${CMS_DOMAIN}."
