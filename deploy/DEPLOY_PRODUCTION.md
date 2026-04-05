# Production Deploy CHATPLUS

This runbook describes the first repeatable production contour for `CHATPLUS` on a clean Ubuntu VPS.

## 1. What this contour includes

- `postgres` for production Strapi data
- `strapi` for CMS admin and API
- `nginx` for:
  - the public static Astro site
  - reverse proxying `cms.<domain>` to Strapi
- one-off helper containers:
  - `portal-builder` for static site rebuilds
  - `tools` for `seed-content`
  - `certbot` for Let's Encrypt
- orchestration scripts:
  - `deploy.sh`
  - `update.sh`

## 2. Prerequisites

Before the first deploy, prepare:

- a clean Ubuntu `22.04 LTS` or `24.04 LTS` VPS
- SSH access
- one public domain for the site
- one `cms.` subdomain for Strapi
- DNS A records for both hosts pointed to the VPS
- open ports `80` and `443`

Recommended minimum server:

- `2 vCPU`
- `4 GB RAM`
- `40-60 GB SSD`

## 3. Bootstrap the server

From the project root on the VPS:

```bash
sudo ./deploy/scripts/bootstrap-ubuntu.sh
```

Then clone or copy the repository to the server, for example into `/srv/chatplus`.

## 4. Create the production env file

Copy the example:

```bash
cp deploy/.env.example deploy/.env
```

Fill at least:

- `PUBLIC_DOMAIN`
- `CMS_DOMAIN`
- `PUBLIC_SITE_URL`
- `CMS_PUBLIC_URL`
- `LETSENCRYPT_EMAIL`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `APP_KEYS`
- `API_TOKEN_SALT`
- `ADMIN_JWT_SECRET`
- `TRANSFER_TOKEN_SALT`
- `JWT_SECRET`
- `ENCRYPTION_KEY`

Do not commit `deploy/.env`.

## 5. First container start and SSL bootstrap

Fast path:

```bash
./deploy/scripts/deploy.sh --with-seed
```

Manual path:

```bash
./deploy/scripts/issue-ssl.sh
```

This script:

- creates temporary self-signed certificates so `nginx` can start
- brings up `postgres`, `strapi` and `nginx`
- requests real Let's Encrypt certificates for:
  - `${PUBLIC_DOMAIN}`
  - `${CMS_DOMAIN}`
- reloads `nginx` after issuance

## 6. Create the first Strapi admin user

Open:

- `https://cms.<domain>/admin`

Create the admin user manually in Strapi.

## 7. Create a Strapi API token for build/import

In Strapi admin:

1. Open `Settings -> API Tokens`
2. Create a token with enough permissions for build/import reads and updates
3. Put the token into:

```bash
STRAPI_API_TOKEN=...
```

inside `deploy/.env`

This token is used by:

- `deploy/scripts/seed-content.sh`
- `deploy/scripts/build-portal.sh`

## 8. Seed generator-owned content if needed

If this environment needs the initial generated data:

`deploy.sh --with-seed` already covers this. Manual path:

```bash
./deploy/scripts/seed-content.sh
```

## 9. Build and publish the public site

`deploy.sh` already covers this. Manual path:

```bash
./deploy/scripts/build-portal.sh
```

This rebuilds the Astro site against live Strapi and places the output into the `portal_dist` volume that `nginx` serves on the public domain.

## 10. Day-2 operations

### Managed content update

1. Editor changes content in Strapi
2. Operator runs:

```bash
./deploy/scripts/build-portal.sh
```

### Generated content update

1. Update `cms/seed/*.json` in the repository
2. Pull the changes on the server
3. Run:

```bash
./deploy/scripts/seed-content.sh
./deploy/scripts/build-portal.sh
```

### App code update

If repository code changed on the VPS:

```bash
./deploy/scripts/update.sh
```

If the update also includes new generated seed content:

```bash
./deploy/scripts/update.sh --with-seed
```

## 11. Backup

Create a backup:

```bash
./deploy/scripts/backup.sh
```

Backup includes:

- `postgres.sql`
- `strapi-uploads.tar.gz`

Backup does not include:

- `deploy/.env`
- domain registrar or DNS settings
- SSH keys

Example cron entries:

- [deploy/system/cron.backup.example](/e:/Проекты/НоваяГлава/CHATPLUS/deploy/system/cron.backup.example)
- [deploy/system/cron.ssl-renew.example](/e:/Проекты/НоваяГлава/CHATPLUS/deploy/system/cron.ssl-renew.example)

## 12. Restore on another clean Ubuntu VPS

1. Repeat sections `2-7`
2. Copy the backup directory to the new server
3. Run:

```bash
./deploy/scripts/restore.sh /path/to/backup-directory
./deploy/scripts/build-portal.sh
```

That restores:

- Postgres data
- Strapi uploads
- the public static site after rebuild

## 13. Useful commands

Show service status:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml ps
```

View logs:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml logs -f strapi
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml logs -f nginx
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml logs -f postgres
```

Pull new code and rebuild:

```bash
./deploy/scripts/update.sh
```

## 14. Local Docker smoke on a developer PC

If you want to verify the deploy package locally before moving to the VPS:

1. Install Docker Desktop
2. If Docker Desktop offers WSL integration with your personal `Ubuntu` distro, it is safe to skip it for this project. The local smoke flow only needs the Docker engine itself.
3. Create local env:

```powershell
Copy-Item deploy/.env.local.example deploy/.env.local
```

4. Start local services:

```powershell
.\deploy\scripts\local-up.cmd
```

5. Open:

- `http://127.0.0.1:1337/admin`
- `http://127.0.0.1:8080`

6. In Strapi admin:

- create the first admin user
- create an API token in `Settings -> API Tokens`
- put the token into `deploy/.env.local` as `STRAPI_API_TOKEN`

7. If this is a clean local database, import generator-owned content:

```powershell
.\deploy\scripts\local-seed-content.cmd
```

8. Build the public local site:

```powershell
.\deploy\scripts\local-build-portal.cmd
```

9. Stop local services when finished:

```powershell
.\deploy\scripts\local-down.cmd
```

Notes:

- local public site is served at `http://127.0.0.1:8080`
- `deploy/.env.local` keeps `PUBLIC_SITE_URL=https://chatplus.ru` on purpose, so local smoke validates production-style canonical URLs instead of local `127.0.0.1`
