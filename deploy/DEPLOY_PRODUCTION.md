# Production Deploy CHATPLUS

Этот runbook описывает переходный production contour для `CHATPLUS`:

- `Strapi + Postgres` живут на VPS
- `content-relay` принимает `Strapi` publish webhooks и запускает локальный rebuild
- `Astro` собирает статический сайт
- публичный artifact выкладывается отдельным pipeline

Это не финальная CDN-only архитектура, а безопасный production bridge к ней.

## 1. Что входит в этот контур

- `postgres` для CMS data
- `strapi` для admin и API
- `content-relay` для signed publish automation и локального rebuild на VPS
- `nginx` для:
  - публичного сайта
  - reverse proxy с `cms.<domain>` на Strapi
- helper containers:
  - `portal-builder`
  - `tools`
  - `certbot`

## 2. Что подготовить заранее

До первого deploy нужны:

- чистая Ubuntu `22.04 LTS` или `24.04 LTS`
- SSH-доступ
- один публичный домен для сайта
- один поддомен `cms.` для Strapi
- DNS A-records на VPS
- открытые порты `80` и `443`

Рекомендуемый минимум для VPS:

- `2 vCPU`
- `4 GB RAM`
- `40-60 GB SSD`

## 3. Bootstrap сервера

Из корня проекта на VPS:

```bash
sudo ./deploy/scripts/bootstrap-ubuntu.sh
```

После этого склонируйте репозиторий, например в `/srv/chatplus`.

## 4. Создание production env-файла

Скопируйте пример:

```bash
cp deploy/.env.example deploy/.env
```

Минимум заполните:

- домены:
  - `PUBLIC_DOMAIN`
  - `CMS_DOMAIN`
  - `PUBLIC_SITE_URL`
  - `CMS_PUBLIC_URL`
- SMTP/SSL:
- `LETSENCRYPT_EMAIL`
  - можно временно оставить пустым, тогда certbot зарегистрируется без email
- БД:
  - `POSTGRES_DB`
  - `POSTGRES_USER`
  - `POSTGRES_PASSWORD`
- Strapi secrets:
  - `APP_KEYS`
  - `API_TOKEN_SALT`
  - `ADMIN_JWT_SECRET`
  - `TRANSFER_TOKEN_SALT`
  - `JWT_SECRET`
  - `ENCRYPTION_KEY`
- publish relay:
  - `HOST_PROJECT_ROOT`
  - `RELAY_DISPATCH_TARGET`
  - `RELAY_LOCAL_COMMAND`
  - `WEBHOOK_TOKEN`
  - `RELAY_INTERNAL_URL`
  - `GITHUB_ACTIONS_TOKEN` — только для optional GitHub-dispatch режима
  - `GITHUB_REPOSITORY`
  - `GITHUB_DISPATCH_EVENT`
  - `RELAY_ALLOWED_MODELS`
- upload provider:
  - `UPLOAD_PROVIDER`
  - по умолчанию `UPLOAD_PROVIDER=local`
  - `CDN_URL` только если позже появится внешний CDN перед локальным storage
  - `AWS_*` нужны только если вы осознанно переводите uploads на S3-compatible storage

Важно:

- `deploy/.env` не коммитится
- `WEBHOOK_TOKEN` должен совпадать с токеном, который Strapi будет отправлять relay-сервису
- `RELAY_INTERNAL_URL` по умолчанию должен указывать на внутренний docker hostname:

```env
RELAY_INTERNAL_URL=http://content-relay:8787/strapi/publish
```

## 5. Первый запуск контейнеров и SSL bootstrap

Быстрый путь:

```bash
./deploy/scripts/deploy.sh --with-seed
```

Этот сценарий:

- поднимает `postgres`, `strapi`, `content-relay`, `nginx`
- выпускает SSL-сертификаты
- при флаге `--with-seed` запускает importer
- собирает публичный Astro artifact

Если нужен ручной путь:

```bash
./deploy/scripts/issue-ssl.sh
```

Скрипт:

- создает временные self-signed сертификаты
- поднимает базовые сервисы
- выпускает настоящие Let's Encrypt сертификаты
- перезагружает `nginx`

## 6. Создание первого Strapi admin user

Откройте:

- `https://cms.<domain>/admin`

И вручную создайте admin user.

## 7. Создание Strapi API token

В `Strapi admin`:

1. Откройте `Settings -> API Tokens`
2. Создайте токен для build/import операций
3. Запишите его в `deploy/.env` как:

```env
STRAPI_API_TOKEN=...
```

Этот токен нужен для:

- `build-portal.sh`
- `seed-content.sh`
- CI build against live CMS

## 8. Настройка publish webhook в Strapi

Automation в production-модели строится через relay. По умолчанию relay запускает локальный rebuild на VPS; GitHub-dispatch режим остается optional.

В `Strapi admin`:

1. Откройте `Settings -> Webhooks`
2. Создайте webhook с URL:

```text
https://cms.<domain>/__relay/strapi/publish
```

3. Добавьте header:

```text
Key: Authorization
Value: Bearer <WEBHOOK_TOKEN из deploy/.env>
```

4. Включите события:

- `entry.publish`
- `entry.unpublish`

5. При необходимости дополнительно:

- `entry.create`
- `entry.update`

Рекомендация:

- для production rebuild достаточно опираться на `entry.publish`
- черновики и промежуточные edit-save не должны триггерить deploy

Авторизация:

- relay валидирует `Authorization: Bearer ${WEBHOOK_TOKEN}` перед запуском rebuild
- если header не задан, publish сохранится в Strapi, но локальный rebuild не запустится и в логах relay появится `relay.unauthorized`

## 9. Импорт catalog/SEO данных

Новая модель считает importer отдельным safe-sync слоем.

Перед применением всегда смотрите план:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml run --no-deps --rm tools node scripts/seed-runtime-content.mjs --plan
```

Применить импорт:

```bash
./deploy/scripts/seed-content.sh
```

Принудительный sync:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml run --no-deps --rm tools node scripts/seed-runtime-content.mjs --force-sync
```

Отчет по текущему состоянию:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml run --no-deps --rm tools node scripts/seed-runtime-content.mjs --report
```

Важно:

- `managed` записи importer не меняет
- `imported` записи обновляются только по system-owned полям
- editor-owned ручные правки не должны теряться при обычном sync

Подробно:

- [docs/import-policy.md](../docs/import-policy.md)

## 10. Сборка и публикация публичного сайта

Ручной rebuild:

```bash
./deploy/scripts/build-portal.sh
```

Команда:

- читает live `Strapi`
- собирает `Astro`
- записывает artifact в `deploy/data/public-site/current`
- `nginx` отдает этот artifact на публичном домене

Автоматический rebuild:

- publish webhook идет в relay
- relay запускает локальный `build-portal.sh`
- сайт обновляется прямо на VPS

### GitHub secrets для server-first deploy

Для workflow-файлов `.github/workflows/deploy.yml` и `.github/workflows/code-pipeline.yml`
должны быть заданы:

- `STRAPI_URL`
- `STRAPI_TOKEN`
- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_APP_DIR`
- `VPS_SSH_PORT` — опционально, если SSH не на `22`

## 11. Day-2 operations

### Обновление managed content

1. Редактор меняет запись в `Strapi`
2. Нажимает `Publish`
3. Webhook запускает content publish pipeline

Если automation временно отключен, оператор может вручную:

```bash
./deploy/scripts/build-portal.sh
```

### Обновление imported content

1. Обновить `cms/seed/*.json`
2. Забрать код на сервер
3. Проверить план:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml run --no-deps --rm tools node scripts/seed-runtime-content.mjs --plan
```

4. Применить импорт:

```bash
./deploy/scripts/seed-content.sh
```

5. Опубликовать затронутые записи, если нужно
6. Дождаться automation или вручную пересобрать сайт

### Обновление кода приложения

Если на VPS изменился код:

```bash
./deploy/scripts/update.sh
```

Если вместе с кодом есть новые seed changes:

```bash
./deploy/scripts/update.sh --with-seed
```

## 12. Storage / media

Server-first production для этого проекта использует локальное storage-хранилище на VPS.

Production default:

- `UPLOAD_PROVIDER=local`
- uploads живут в локальном docker volume `strapi_uploads`
- backup обязан включать и `Postgres`, и uploads
- перенос на новый VPS делается через `postgres.sql` + `strapi-uploads.tar.gz` + `deploy/.env`

S3-compatible storage остается только как future path:

- `UPLOAD_PROVIDER=aws-s3`
- `AWS_*` и `CDN_URL` заполняются только при отдельной миграции
- это не обязательная часть текущего production rollout

## 13. Backup

Создать backup:

```bash
./deploy/scripts/backup.sh
```

Backup включает:

- `postgres.sql`
- `strapi-uploads.tar.gz`

Backup не включает:

- `deploy/.env`
- DNS/регистратор
- SSH-ключи

Примеры cron:

- [deploy/system/cron.backup.example](system/cron.backup.example)
- [deploy/system/cron.ssl-renew.example](system/cron.ssl-renew.example)

## 14. Restore на другой Ubuntu VPS

1. Повторите bootstrap и настройку env
2. Поднимите базовые сервисы
3. Перенесите backup directory
4. Выполните:

```bash
./deploy/scripts/restore.sh /path/to/backup-directory
./deploy/scripts/build-portal.sh
```

Это восстановит:

- CMS data
- uploads
- публичный static artifact после rebuild

## 15. Полезные команды

Статус сервисов:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml ps
```

Логи:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml logs -f strapi
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml logs -f content-relay
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml logs -f nginx
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml logs -f postgres
```

Обновить код и пересобрать:

```bash
./deploy/scripts/update.sh
```

Проверить importer plan:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml run --no-deps --rm tools node scripts/seed-runtime-content.mjs --plan
```

## 16. Локальный smoke перед переносом на VPS

Локально на машине разработчика можно использовать Docker smoke contour:

```powershell
Copy-Item deploy/.env.local.example deploy/.env.local
.\deploy\scripts\local-up.cmd
```

Дальше:

1. создать Strapi admin
2. создать `API Token`
3. при необходимости проверить importer:

```powershell
.\deploy\scripts\local-seed-content.cmd
```

4. собрать сайт:

```powershell
.\deploy\scripts\local-build-portal.cmd
```

Проверить:

- `http://127.0.0.1:1337/admin`
- `http://127.0.0.1:8080`

## 17. Что считается Definition of Done для production rollout

Production rollout можно считать доведенным до зрелого переходного состояния, когда:

- editor-facing типы работают с `draft/publish`
- relay принимает publish webhooks
- relay реально запускает локальный rebuild и сайт обновляется
- importer работает в safe-sync модели
- editor не теряет ручные правки после повторного import
- public artifact собирается из live `Strapi`
- backup/restore поднимают тот же CMS state

Отдельный operator checklist:

- [docs/production-setup-checklist.md](../docs/production-setup-checklist.md)
