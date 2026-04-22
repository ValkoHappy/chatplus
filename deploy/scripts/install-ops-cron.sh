#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
PROJECT_ROOT="$(cd "${DEPLOY_DIR}/.." && pwd)"
BACKUP_TEMPLATE="${DEPLOY_DIR}/system/cron.backup.example"
SSL_TEMPLATE="${DEPLOY_DIR}/system/cron.ssl-renew.example"
TMP_FILE="$(mktemp)"

cleanup() {
  rm -f "${TMP_FILE}"
}

trap cleanup EXIT

if ! command -v crontab >/dev/null 2>&1; then
  echo "crontab command is not available. Install cron first."
  exit 1
fi

if [[ ! -f "${BACKUP_TEMPLATE}" || ! -f "${SSL_TEMPLATE}" ]]; then
  echo "Cron template files are missing in deploy/system."
  exit 1
fi

BACKUP_LINE="$(sed "s|/srv/chatplus|${PROJECT_ROOT}|g" "${BACKUP_TEMPLATE}")"
SSL_LINE="$(sed "s|/srv/chatplus|${PROJECT_ROOT}|g" "${SSL_TEMPLATE}")"

{
  crontab -l 2>/dev/null | grep -v 'chatplus-backup.log' | grep -v 'chatplus-ssl-renew.log' || true
  echo "${BACKUP_LINE}"
  echo "${SSL_LINE}"
} > "${TMP_FILE}"

crontab "${TMP_FILE}"

echo "Installed CHATPLUS cron jobs:"
echo " - ${BACKUP_LINE}"
echo " - ${SSL_LINE}"
