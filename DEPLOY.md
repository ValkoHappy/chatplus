# Deploy CHATPLUS

`CHATPLUS` now has two deployment contours:

- `demo-mode` for the existing `pages-preview/ -> GitHub Pages` showcase flow
- `production-mode` for a repeatable Ubuntu VPS deployment through `docker compose`

## 1. Demo-mode

Current demo publishing flow:

`local Strapi -> Astro build -> pages-preview -> GitHub Pages`

Use demo-mode when you need to refresh the public showcase without touching the production VPS.

### Demo operator flow

1. Start local Strapi:

```powershell
npm.cmd --prefix cms run develop
```

2. If generated content changed, refresh Strapi:

```powershell
npm.cmd run seed-content
```

3. Build the GitHub Pages snapshot:

```powershell
npm.cmd --prefix portal run snapshot:github-demo
```

4. Commit and push the updated `pages-preview/`.

## 2. Production-mode

Production is no longer described as a hand-maintained SSH session.

Target production contour:

- `postgres` container
- `strapi` container
- `nginx` container for public site and CMS reverse proxy
- one-off `portal-builder` and `tools` containers for build/import operations

Production runbook lives here:

- [deploy/DEPLOY_PRODUCTION.md](/e:/Проекты/НоваяГлава/CHATPLUS/deploy/DEPLOY_PRODUCTION.md)

Primary production entrypoints:

- [deploy.sh](/e:/Проекты/НоваяГлава/CHATPLUS/deploy/scripts/deploy.sh)
- [update.sh](/e:/Проекты/НоваяГлава/CHATPLUS/deploy/scripts/update.sh)

## 3. Ownership stays the same in both modes

- `generated` pages still come from `cms/seed/*.json -> scripts/seed-runtime-content.mjs -> Strapi`
- `managed` pages are still edited directly in Strapi admin
- public route structure and template ownership do not change between demo and production

## 4. Supported production defaults

- Ubuntu `22.04 LTS` or `24.04 LTS`
- `docker compose`
- `Postgres` for Strapi
- main public domain for the site
- `cms.` subdomain for Strapi admin/API

Recommended minimum VPS:

- `2 vCPU`
- `4 GB RAM`
- `40-60 GB SSD`

## 5. What production-mode adds

- reproducible deployment on a clean Ubuntu VPS
- persistent Postgres and uploads storage
- backup and restore scripts
- a documented rebuild flow after managed or generated content updates
- migration path to another VPS without rebuilding the setup from memory

## 6. What production-mode does not add yet

- Terraform
- Ansible
- multi-server orchestration
- webhook-driven automatic rebuilds
- hosted observability/monitoring stack

This first production step is intentionally `Docker Prod`, not full IaC.

## 7. Local Docker smoke mode

If Docker Desktop is available on a local machine, there is a lightweight local contour.

Windows-friendly local entrypoints:

- [preflight-local.cmd](/e:/Проекты/НоваяГлава/CHATPLUS/deploy/scripts/preflight-local.cmd)
- [local-up.cmd](/e:/Проекты/НоваяГлава/CHATPLUS/deploy/scripts/local-up.cmd)
- [local-build-portal.cmd](/e:/Проекты/НоваяГлава/CHATPLUS/deploy/scripts/local-build-portal.cmd)
- [local-seed-content.cmd](/e:/Проекты/НоваяГлава/CHATPLUS/deploy/scripts/local-seed-content.cmd)
- [local-down.cmd](/e:/Проекты/НоваяГлава/CHATPLUS/deploy/scripts/local-down.cmd)
- [preflight-local.ps1](/e:/Проекты/НоваяГлава/CHATPLUS/deploy/scripts/preflight-local.ps1)
- [local-up.ps1](/e:/Проекты/НоваяГлава/CHATPLUS/deploy/scripts/local-up.ps1)
- [local-build-portal.ps1](/e:/Проекты/НоваяГлава/CHATPLUS/deploy/scripts/local-build-portal.ps1)
- [local-seed-content.ps1](/e:/Проекты/НоваяГлава/CHATPLUS/deploy/scripts/local-seed-content.ps1)
- [local-down.ps1](/e:/Проекты/НоваяГлава/CHATPLUS/deploy/scripts/local-down.ps1)

Recommended Windows quickstart:

```powershell
Copy-Item deploy/.env.local.example deploy/.env.local
.\deploy\scripts\local-up.cmd
```

Then:

1. Open `http://127.0.0.1:1337/admin`
2. Create the first Strapi admin user
3. In `Settings -> API Tokens`, create a token
4. Put the token into `deploy/.env.local` as `STRAPI_API_TOKEN`

If this is a clean local database, import generator-owned content first:

```powershell
.\deploy\scripts\local-seed-content.cmd
```

After that, build the local public site:

```powershell
.\deploy\scripts\local-build-portal.cmd
```

Notes:

- local services open on:
  - `http://127.0.0.1:1337/admin`
  - `http://127.0.0.1:8080`
- `PUBLIC_SITE_URL` in `deploy/.env.local` intentionally stays `https://chatplus.ru`, so local smoke uses production-style canonical URLs and passes the same `content-check`
- if Docker Desktop asks about WSL integration with personal `Ubuntu`, that integration is optional for this project; the local smoke flow only requires a healthy Docker engine

Supporting files:

- [deploy/.env.local.example](/e:/Проекты/НоваяГлава/CHATPLUS/deploy/.env.local.example)
- [local-up.sh](/e:/Проекты/НоваяГлава/CHATPLUS/deploy/scripts/local-up.sh)
- [local-build-portal.sh](/e:/Проекты/НоваяГлава/CHATPLUS/deploy/scripts/local-build-portal.sh)
- [local-seed-content.sh](/e:/Проекты/НоваяГлава/CHATPLUS/deploy/scripts/local-seed-content.sh)
- [local-down.sh](/e:/Проекты/НоваяГлава/CHATPLUS/deploy/scripts/local-down.sh)
