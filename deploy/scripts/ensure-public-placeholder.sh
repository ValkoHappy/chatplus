#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${DEPLOY_DIR}/.env"
PUBLIC_ROOT="${DEPLOY_DIR}/data/public-site"
RELEASES_DIR="${PUBLIC_ROOT}/releases"
CURRENT_DIR="${PUBLIC_ROOT}/current"
PLACEHOLDER_RELEASE="bootstrap-placeholder"
PLACEHOLDER_DIR="${RELEASES_DIR}/${PLACEHOLDER_RELEASE}"

"${SCRIPT_DIR}/validate-env.sh"

set -a
source "${ENV_FILE}"
set +a

mkdir -p "${PLACEHOLDER_DIR}"

cat > "${PLACEHOLDER_DIR}/index.html" <<HTML
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CHATPLUS setup in progress</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0b1020;
      --panel: #111833;
      --text: #eef2ff;
      --muted: #b5bfd8;
      --accent: #7c8cff;
    }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background:
        radial-gradient(circle at top, rgba(124, 140, 255, 0.24), transparent 35%),
        linear-gradient(180deg, #0a1020, #0b1328 55%, #0a0f1d);
      color: var(--text);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    main {
      width: min(720px, calc(100vw - 32px));
      padding: 32px;
      border-radius: 24px;
      background: rgba(17, 24, 51, 0.88);
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
    }
    h1 {
      margin: 0 0 16px;
      font-size: clamp(2rem, 3vw, 3rem);
      line-height: 1.05;
    }
    p, li {
      color: var(--muted);
      font-size: 1rem;
      line-height: 1.7;
    }
    code {
      color: var(--text);
      background: rgba(255, 255, 255, 0.08);
      padding: 2px 6px;
      border-radius: 8px;
    }
    a {
      color: var(--accent);
    }
  </style>
</head>
<body>
  <main>
    <h1>CHATPLUS is almost ready</h1>
    <p>The server is up, but the public site has not been published yet.</p>
    <p>Next steps:</p>
    <ol>
      <li>Open <a href="${CMS_PUBLIC_URL}/admin">${CMS_PUBLIC_URL}/admin</a>.</li>
      <li>Create the first Strapi admin user.</li>
      <li>Create an API token in <code>Settings -> API Tokens</code>.</li>
      <li>Write it to <code>deploy/.env</code> as <code>STRAPI_API_TOKEN=...</code>.</li>
      <li>Run <code>./deploy/scripts/finalize-first-launch.sh</code>.</li>
    </ol>
    <p>If you expected a live site here, the setup is incomplete rather than broken.</p>
  </main>
</body>
</html>
HTML

cat > "${PLACEHOLDER_DIR}/404.html" <<HTML
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CHATPLUS setup incomplete</title>
</head>
<body>
  <p>CHATPLUS setup is still in progress.</p>
</body>
</html>
HTML

cat > "${PLACEHOLDER_DIR}/robots.txt" <<TXT
User-agent: *
Disallow:
TXT

if [[ ! -e "${CURRENT_DIR}" ]]; then
  ln -sfn "releases/${PLACEHOLDER_RELEASE}" "${CURRENT_DIR}"
fi

echo "Public placeholder is ready at ${CURRENT_DIR}"

