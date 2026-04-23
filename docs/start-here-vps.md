# Быстрый запуск на VPS

Этот файл нужен для самого простого первого запуска на чистой Ubuntu VPS.

Если вы не хотите сначала читать всю архитектуру и длинные runbook-документы, идите по шагам ниже.

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

Важно:

- в этом проекте мы используем два отдельных боевых домена: публичный сайт и CMS
- в примерах ниже это `astro.<domain>` и `strapi.<domain>`
- если вы хотите другие имена, меняйте их консистентно и в DNS, и в `deploy/.env`

## 2. Подключиться к серверу

С локального компьютера:

```bash
ssh root@YOUR_SERVER_IP
```

Если `git` и Docker ещё не стоят:

```bash
apt update
apt install -y git
```

Из корня проекта на сервере:

```bash
sudo ./deploy/scripts/bootstrap-ubuntu.sh
```

После первого клона репозитория и настройки `deploy/.env` можно сразу поставить регулярные ops-задачи:

```bash
./deploy/scripts/install-ops-cron.sh
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

## 4. Создать production env-файл

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
RELAY_ALLOWED_MODELS=landing-page,page-v2,tenders-page,business-types-page,site-setting,competitor,solution,channel,industry,integration,feature,business-type

UPLOAD_PROVIDER=local
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

Если пока нет email для Let's Encrypt:

- можно оставить `LETSENCRYPT_EMAIL=` пустым
- сертификат всё равно выпустится

Если AI-генерация черновиков пока не нужна:

- `OPENAI_API_KEY` можно оставить пустым
- на deploy и обычный publish flow это не влияет

## 5. Первый запуск: сначала контур, потом первичная подготовка CMS

Из корня проекта:

```bash
./deploy/scripts/deploy.sh
```

Что делает команда:

- поднимает `postgres`
- поднимает `strapi`
- поднимает `content-relay`
- поднимает `nginx`
- выпускает SSL
- проверяет `deploy/.env`
- если `STRAPI_API_TOKEN` ещё не задан, не пытается слепо запускать importer и build
- создаёт bootstrap-страницу вместо немого `403`

Важно:

- на чистом сервере это нормальный первый шаг
- после него `Strapi` уже должен открываться
- публичный домен на этом этапе может показывать bootstrap-страницу, а не финальный сайт

## 6. Что должно открыться

После успешного запуска:

- CMS: `https://strapi.<domain>/admin`
- сайт: `https://astro.<domain>`

Если CMS открылась:

1. создайте первого admin user
2. зайдите в `Settings -> API Tokens`
3. создайте токен с `Full access`
4. запишите его в `deploy/.env` как:

```env
STRAPI_API_TOKEN=your-token-here
```

После этого завершите первый запуск:

```bash
./deploy/scripts/finalize-first-launch.sh
```

Что делает `finalize-first-launch.sh`:

- валидирует `deploy/.env`
- проверяет, что `STRAPI_API_TOKEN` реально задан
- прогоняет importer
- собирает публичный сайт уже против live `Strapi`

После этого `https://astro.<domain>` должен стать обычным живым сайтом.

## 7. Что проверить после будущего deploy manual-first слоя

Когда вы будете выкатывать новый CMS-код с `page_v2` и `generation_job`, перед route migration сначала прогоните readiness-check:

```powershell
npm run page-v2:live:ready
```

Если проверка не зелёная, не начинайте перенос managed routes.

Подробный handoff:

- [manual-first-production-handoff.md](manual-first-production-handoff.md)

## 8. Как обновлять проект

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

### Если поменяли контент в `Strapi`

Нормальный flow такой:

1. изменить запись в `Strapi`
2. нажать `Publish`
3. если webhook уже настроен с `Authorization: Bearer <WEBHOOK_TOKEN>`, сайт пересоберётся автоматически

Если webhook ещё не настроен:

```bash
./deploy/scripts/build-portal.sh
```

## 9. Как сделать резервную копию

```bash
./deploy/scripts/backup.sh
```

Backup включает:

- `Postgres`
- uploads

Backup не включает:

- `deploy/.env`
- DNS-настройки
- SSH-ключи и другие внешние секреты

## 10. Как восстановить проект

Сначала безопасно проверьте backup без изменений:

```bash
./deploy/scripts/restore.sh --check /path/to/backup-directory
```

Если всё в порядке:

```bash
./deploy/scripts/restore.sh /path/to/backup-directory
./deploy/scripts/build-portal.sh
```

Во время restore теперь автоматически создаётся safety backup текущего состояния.

## 11. Если что-то не открылось

Сначала проверьте контейнеры:

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

Если браузер пишет `NET::ERR_CERT_AUTHORITY_INVALID`:

```bash
./deploy/scripts/issue-ssl.sh
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml logs --tail=100 nginx
```

Если публичный домен показывает bootstrap-страницу:

- значит первый запуск не завершён до конца
- нужно создать admin user, создать `API Token`, записать `STRAPI_API_TOKEN` в `deploy/.env`
- потом выполнить:

```bash
./deploy/scripts/finalize-first-launch.sh
```

## 11. Самое короткое резюме

Первый запуск на чистой Ubuntu:

```bash
cp deploy/.env.example deploy/.env
nano deploy/.env
./deploy/scripts/deploy.sh
```

Потом завершение CMS bootstrap:

```bash
nano deploy/.env
./deploy/scripts/finalize-first-launch.sh
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

