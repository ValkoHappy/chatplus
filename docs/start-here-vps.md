# Быстрый запуск на VPS

Этот файл нужен для самого простого первого запуска на чистой Ubuntu VPS.

Если вы не хотите читать архитектуру и длинные runbook-документы, идите по шагам ниже.

## 1. Что нужно заранее

Нужно всего четыре вещи:

- чистый Ubuntu VPS `22.04` или `24.04`
- SSH-доступ к серверу
- домен под сайт
- поддомен `cms.` под админку `Strapi`

Минимум по серверу:

- `2 vCPU`
- `4 GB RAM`
- `40-60 GB SSD`

DNS должен смотреть на IP сервера:

- `astro.<domain>` -> IP VPS
- `strapi.<domain>` -> IP VPS

## 2. Подключиться к серверу

С локального компьютера:

```bash
ssh root@YOUR_SERVER_IP
```

Если `git` и Docker еще не стоят:

```bash
apt update
apt install -y git
```

Из корня проекта на сервере:

```bash
sudo ./deploy/scripts/bootstrap-ubuntu.sh
```

## 3. Склонировать проект

Пример:

```bash
mkdir -p /srv
cd /srv
git clone https://github.com/ValkoHappy/chatplus.git
cd chatplus
```

Если проект уже лежит на сервере:

```bash
cd /srv/chatplus
git pull
```

## 4. Создать production env

Скопировать пример:

```bash
cp deploy/.env.example deploy/.env
```

Открыть файл:

```bash
nano deploy/.env
```

Минимум заполнить:

```env
PUBLIC_DOMAIN=astro.example.com
CMS_DOMAIN=strapi.example.com
PUBLIC_SITE_URL=https://astro.example.com
CMS_PUBLIC_URL=https://strapi.example.com
HOST_PROJECT_ROOT=/srv/chatplus
LETSENCRYPT_EMAIL=

POSTGRES_DB=chatplus
POSTGRES_USER=chatplus
POSTGRES_PASSWORD=replace-with-strong-db-password

APP_KEYS=replace-me-1,replace-me-2,replace-me-3,replace-me-4
API_TOKEN_SALT=replace-with-random-string
ADMIN_JWT_SECRET=replace-with-random-string
TRANSFER_TOKEN_SALT=replace-with-random-string
JWT_SECRET=replace-with-random-string
ENCRYPTION_KEY=replace-with-random-string

WEBHOOK_TOKEN=replace-with-random-string
RELAY_DISPATCH_TARGET=local
RELAY_LOCAL_COMMAND=/srv/chatplus/deploy/scripts/build-portal.sh
GITHUB_ACTIONS_TOKEN=
GITHUB_REPOSITORY=ValkoHappy/chatplus
GITHUB_DISPATCH_EVENT=strapi-content-publish
RELAY_ALLOWED_MODELS=landing-page,tenders-page,business-types-page,site-setting,competitor,solution,channel,industry,integration,feature,business-type

UPLOAD_PROVIDER=local
```

Если пока нет email для Let's Encrypt:

- можно оставить `LETSENCRYPT_EMAIL=` пустым
- сертификат все равно выпустится

## 5. Первый запуск

Из корня проекта:

```bash
./deploy/scripts/deploy.sh --with-seed
```

Что делает эта команда:

- поднимает `postgres`
- поднимает `strapi`
- поднимает `content-relay`
- поднимает `nginx`
- выпускает SSL
- прогоняет importer
- собирает публичный сайт

## 6. Что должно открыться

После успешного запуска:

- сайт: `https://astro.<domain>`
- CMS: `https://strapi.<domain>/admin`

Если CMS открылась:

1. создать первого admin user
2. зайти в `Settings -> API Tokens`
3. создать токен с `Full access`
4. записать его в `deploy/.env` как:

```env
STRAPI_API_TOKEN=your-token-here
```

После этого обновить importer и публичный сайт:

```bash
./deploy/scripts/seed-content.sh
./deploy/scripts/build-portal.sh
```

## 7. Как обновлять проект

### Если обновился код

```bash
cd /srv/chatplus
git pull
./deploy/scripts/update.sh
```

### Если обновился код и imported-данные

```bash
cd /srv/chatplus
git pull
./deploy/scripts/update.sh --with-seed
```

### Если поменяли контент в Strapi

Нормальный flow такой:

1. изменить запись в `Strapi`
2. нажать `Publish`
3. если webhook уже настроен с `Authorization: Bearer <WEBHOOK_TOKEN>`, сайт пересоберется автоматически

Если webhook еще не настроен:

```bash
./deploy/scripts/build-portal.sh
```

## 8. Как сделать backup

```bash
./deploy/scripts/backup.sh
```

Backup включает:

- `Postgres`
- uploads
- рабочие данные deploy-контура

## 9. Как восстановить проект

```bash
./deploy/scripts/restore.sh /path/to/backup-directory
./deploy/scripts/build-portal.sh
```

## 10. Если что-то не открылось

Сначала проверить контейнеры:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml ps
```

Если проблема со `Strapi`:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml logs -f strapi
```

Если проблема с `nginx`:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml logs -f nginx
```

Если сайт не обновился после изменения контента:

```bash
./deploy/scripts/build-portal.sh
```

## 11. Самое короткое резюме

Первый запуск:

```bash
cp deploy/.env.example deploy/.env
nano deploy/.env
./deploy/scripts/deploy.sh --with-seed
```

Обычное обновление:

```bash
git pull
./deploy/scripts/update.sh
```

Обновление с importer:

```bash
git pull
./deploy/scripts/update.sh --with-seed
```

Главные ссылки:

- [Production Deploy](../deploy/DEPLOY_PRODUCTION.md)
- [Production setup checklist](production-setup-checklist.md)
- [Гайд оператора](operator-guide.md)
