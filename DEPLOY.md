# Деплой CHATPLUS

У `CHATPLUS` сейчас есть два контура развертывания:

- `demo-mode` для текущего showcase-потока `pages-preview/ -> GitHub Pages`
- `production-mode` для воспроизводимого деплоя на Ubuntu VPS через `docker compose`

## 1. Demo-mode

Текущий demo publishing flow:

`local Strapi -> Astro build -> pages-preview -> GitHub Pages`

Используйте demo-mode, когда нужно обновить публичный showcase, не трогая production VPS.

### Demo operator flow

1. Запустить локальный Strapi:

```powershell
npm.cmd --prefix cms run develop
```

2. Если менялся generated content, обновить Strapi:

```powershell
npm.cmd run seed-content
```

3. Собрать GitHub Pages snapshot:

```powershell
npm.cmd --prefix portal run snapshot:github-demo
```

4. Закоммитить и запушить обновленный `pages-preview/`.

## 2. Production-mode

Production больше не описывается как ручная SSH-сессия, где все держится на памяти.

Целевой production contour:

- контейнер `postgres`
- контейнер `strapi`
- контейнер `nginx` для публичного сайта и CMS reverse proxy
- одноразовые контейнеры `portal-builder` и `tools` для build/import-операций

Production runbook лежит здесь:

- [deploy/DEPLOY_PRODUCTION.md](deploy/DEPLOY_PRODUCTION.md)

Главные production entrypoints:

- [deploy.sh](deploy/scripts/deploy.sh)
- [update.sh](deploy/scripts/update.sh)

## 3. Ownership в обоих режимах одинаковый

- `generated`-страницы по-прежнему идут через `cms/seed/*.json -> scripts/seed-runtime-content.mjs -> Strapi`
- `managed`-страницы по-прежнему редактируются напрямую в Strapi admin
- структура публичных маршрутов и ownership шаблонов не меняются между demo и production

## 4. Поддерживаемые production defaults

- Ubuntu `22.04 LTS` или `24.04 LTS`
- `docker compose`
- `Postgres` для Strapi
- основной публичный домен для сайта
- поддомен `cms.` для Strapi admin/API

Рекомендуемый минимум для VPS:

- `2 vCPU`
- `4 GB RAM`
- `40-60 GB SSD`

## 5. Что добавляет production-mode

- воспроизводимый deploy на чистую Ubuntu VPS
- постоянное хранение Postgres и uploads
- backup и restore scripts
- задокументированный rebuild flow после managed или generated изменений
- путь миграции на другой VPS без пересборки схемы по памяти

## 6. Что production-mode пока не добавляет

- Terraform
- Ansible
- multi-server orchestration
- webhook-driven automatic rebuilds
- hosted observability/monitoring stack

Этот первый production-шаг сознательно сделан как `Docker Prod`, а не как full IaC.

## 7. Локальный Docker smoke mode

Если на локальной машине есть Docker Desktop, можно использовать облегченный local contour.

Windows-friendly локальные entrypoints:

- [preflight-local.cmd](deploy/scripts/preflight-local.cmd)
- [local-up.cmd](deploy/scripts/local-up.cmd)
- [local-build-portal.cmd](deploy/scripts/local-build-portal.cmd)
- [local-seed-content.cmd](deploy/scripts/local-seed-content.cmd)
- [local-down.cmd](deploy/scripts/local-down.cmd)
- [preflight-local.ps1](deploy/scripts/preflight-local.ps1)
- [local-up.ps1](deploy/scripts/local-up.ps1)
- [local-build-portal.ps1](deploy/scripts/local-build-portal.ps1)
- [local-seed-content.ps1](deploy/scripts/local-seed-content.ps1)
- [local-down.ps1](deploy/scripts/local-down.ps1)

Рекомендуемый Windows quickstart:

```powershell
Copy-Item deploy/.env.local.example deploy/.env.local
.\deploy\scripts\local-up.cmd
```

Дальше:

1. Открыть `http://127.0.0.1:1337/admin`
2. Создать первого Strapi admin user
3. В `Settings -> API Tokens` создать token
4. Записать token в `deploy/.env.local` как `STRAPI_API_TOKEN`

Если это чистая локальная база, сначала импортируйте generator-owned контент:

```powershell
.\deploy\scripts\local-seed-content.cmd
```

После этого соберите локальный публичный сайт:

```powershell
.\deploy\scripts\local-build-portal.cmd
```

Примечания:

- локальные сервисы доступны по адресам:
  - `http://127.0.0.1:1337/admin`
  - `http://127.0.0.1:8080`
- `PUBLIC_SITE_URL` в `deploy/.env.local` специально остается равным `https://chatplus.ru`, чтобы local smoke использовал production-style canonical URLs и проходил тот же `content-check`
- если Docker Desktop спрашивает про WSL integration с вашей личной `Ubuntu`, для этого проекта она необязательна; local smoke flow требует только рабочий Docker engine

Вспомогательные файлы:

- [deploy/.env.local.example](deploy/.env.local.example)
- [local-up.sh](deploy/scripts/local-up.sh)
- [local-build-portal.sh](deploy/scripts/local-build-portal.sh)
- [local-seed-content.sh](deploy/scripts/local-seed-content.sh)
- [local-down.sh](deploy/scripts/local-down.sh)
