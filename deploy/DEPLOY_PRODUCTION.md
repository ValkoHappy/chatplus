# Production-развёртывание CHATPLUS

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
  - reverse proxy с `strapi.<domain>` на `Strapi`
- helper containers:
  - `portal-builder`
  - `tools`
  - `certbot`

## 2. Что подготовить заранее

До первого deploy нужны:

- чистая Ubuntu `22.04 LTS` или `24.04 LTS`
- SSH-доступ
- один публичный домен для сайта
- один отдельный домен или поддомен для `Strapi`
- DNS A-records на VPS
- открытые порты `80` и `443`

Рекомендуемый и уже проверенный вариант:

- публичный сайт: `astro.<domain>`
- CMS: `strapi.<domain>`

Минимум для VPS:

- `2 vCPU`
- `4 GB RAM`
- `40-60 GB SSD`

## 3. Первичная подготовка сервера

Из корня проекта на VPS:

```bash
sudo ./deploy/scripts/bootstrap-ubuntu.sh
```

После этого склонируйте репозиторий, например в `/srv/chatplus`.

После клона и настройки `deploy/.env` рекомендуется сразу установить регулярные ops-задачи:

```bash
./deploy/scripts/install-ops-cron.sh
```

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
- `LETSENCRYPT_EMAIL`
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
  - `GITHUB_ACTIONS_TOKEN` только для optional GitHub-dispatch режима
  - `GITHUB_REPOSITORY`
  - `GITHUB_DISPATCH_EVENT`
  - `RELAY_ALLOWED_MODELS`
- upload provider:
  - `UPLOAD_PROVIDER`
  - по умолчанию `UPLOAD_PROVIDER=local`
- AI draft generation:
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL`

Важно:

- `deploy/.env` не коммитится
- `WEBHOOK_TOKEN` должен совпадать с токеном, который `Strapi` отправляет relay-сервису
- placeholder-значения `replace-with-*` и `replace-me-*` нельзя оставлять в production

Рекомендуемое значение:

```env
RELAY_INTERNAL_URL=http://content-relay:8787/strapi/publish
```

## 5. Первый запуск контейнеров и первичная выдача SSL

На чистом VPS правильный первый шаг такой:

```bash
./deploy/scripts/deploy.sh
```

Сценарий:

- поднимает `postgres`, `strapi`, `content-relay`, `nginx`
- выпускает SSL-сертификаты
- валидирует `deploy/.env`
- если `STRAPI_API_TOKEN` ещё не задан, не пытается слепо прогонять importer и build
- публикует bootstrap-страницу вместо немого `403`

Важно:

- на чистой установке это ожидаемое поведение
- сначала надо поднять контур и открыть `Strapi`
- только потом завершать content bootstrap и первую сборку публичного сайта

## 6. Создание первого администратора Strapi

Откройте:

- `https://strapi.<domain>/admin`

И вручную создайте admin user.

## 7. Создание API-токена Strapi

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

После записи токена на чистой установке обязательно выполните:

```bash
./deploy/scripts/finalize-first-launch.sh
```

Этот шаг:

- валидирует env
- импортирует стартовый контент
- собирает первый публичный Astro artifact

## 8. Настройка webhook публикации в `Strapi`

Automation в production-модели строится через relay.

В `Strapi admin`:

1. Откройте `Settings -> Webhooks`
2. Создайте webhook с URL:

```text
https://strapi.<domain>/__relay/strapi/publish
```

3. Добавьте header:

```text
Key: Authorization
Value: Bearer <WEBHOOK_TOKEN из deploy/.env>
```

4. Включите события:

- `entry.publish`
- `entry.unpublish`

Рекомендация:

- для production rebuild достаточно опираться на `entry.publish`
- черновики и промежуточные edit-save не должны триггерить deploy
- если вы хотите, чтобы новые `page_v2` managed pages тоже автоматически пересобирали сайт после `Publish`, `page-v2` должен быть включён в `RELAY_ALLOWED_MODELS`

## 9. Импорт каталога и SEO-данных

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

Отчёт:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml run --no-deps --rm tools node scripts/seed-runtime-content.mjs --report
```

Важно:

- `managed` записи importer не меняет
- `imported` записи обновляются только по system-owned полям
- editor-owned правки не должны теряться при обычном sync

## 10. Сборка и публикация публичного сайта

Ручной rebuild:

```bash
./deploy/scripts/build-portal.sh
```

Команда:

- читает live `Strapi`
- собирает `Astro`
- записывает artifact в `deploy/data/public-site/current`
- `nginx` отдаёт этот artifact на публичном домене

Автоматический rebuild:

- publish webhook идёт в relay
- relay запускает локальный `build-portal.sh`
- сайт обновляется прямо на VPS

## 11. Проверка готовности рабочего `Strapi` к manual-first миграции

После deploy нового кода, но до переноса managed routes, прогоните readiness-check:

```powershell
npm run page-v2:live:ready
```

Проверка должна подтвердить:

- открывается live `Strapi admin`
- доступен `/api/page-v2s`
- доступен `/api/generation-jobs`

Если readiness-check не зелёный, не начинайте migration `Wave 1/2/3`.

Подробный handoff следующего шага:

- [../docs/manual-first-production-handoff.md](../docs/manual-first-production-handoff.md)

## 12. Операции после запуска

### Обновление managed-контента

1. Редактор меняет запись в `Strapi`
2. Нажимает `Publish`
3. Webhook запускает content publish pipeline

Если automation временно отключён:

```bash
./deploy/scripts/build-portal.sh
```

### Обновление imported-контента

1. Обновить `cms/seed/*.json`
2. Забрать код на сервер
3. Проверить `plan`
4. Выполнить `seed-content.sh`
5. При необходимости опубликовать затронутые записи
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

## 13. Хранилище и медиа

Server-first production в этом проекте использует локальное storage-хранилище на VPS.

Production default:

- `UPLOAD_PROVIDER=local`
- uploads живут в docker volume `strapi_uploads`
- backup обязан включать и `Postgres`, и uploads
- перенос на новый VPS делается через `postgres.sql` + `strapi-uploads.tar.gz` + `deploy/.env`

S3-compatible storage остаётся future path:

- `UPLOAD_PROVIDER=aws-s3`
- `AWS_*` и `CDN_URL` заполняются только при отдельной миграции

## 14. Резервное копирование

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
- [deploy/system/cron.page-v2-ai.example](system/cron.page-v2-ai.example)

## 15. Восстановление на другом Ubuntu VPS

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

## 16. Полезные команды

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

## 17. Локальная smoke-проверка перед переносом на VPS

Локально можно использовать Docker smoke contour:

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

## 18. Критерии готовности к production-развёртыванию

Production rollout можно считать доведённым до зрелого переходного состояния, когда:

- editor-facing типы работают с `draft/publish`
- relay принимает publish webhooks
- relay реально запускает локальный rebuild и сайт обновляется
- importer работает в safe-sync модели
- editor не теряет ручные правки после повторного import
- public artifact собирается из live `Strapi`
- backup и restore поднимают тот же CMS state

Отдельный operator checklist:

- [docs/production-setup-checklist.md](../docs/production-setup-checklist.md)
