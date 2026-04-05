# Production Deploy CHATPLUS

Этот runbook описывает первый воспроизводимый production contour для `CHATPLUS` на чистой Ubuntu VPS.

## 1. Что включает этот контур

- `postgres` для production Strapi data
- `strapi` для CMS admin и API
- `nginx` для:
  - публичного статического Astro-сайта
  - reverse proxy с `cms.<domain>` на Strapi
- одноразовые helper containers:
  - `portal-builder` для static site rebuild
  - `tools` для `seed-content`
  - `certbot` для Let's Encrypt
- orchestration scripts:
  - `deploy.sh`
  - `update.sh`

## 2. Предварительные условия

Перед первым deploy подготовьте:

- чистую Ubuntu `22.04 LTS` или `24.04 LTS` VPS
- SSH-доступ
- один публичный домен для сайта
- один поддомен `cms.` для Strapi
- DNS A records для обоих host, направленные на VPS
- открытые порты `80` и `443`

Рекомендуемый минимум для сервера:

- `2 vCPU`
- `4 GB RAM`
- `40-60 GB SSD`

## 3. Bootstrap сервера

Из корня проекта на VPS:

```bash
sudo ./deploy/scripts/bootstrap-ubuntu.sh
```

После этого склонируйте или скопируйте репозиторий на сервер, например в `/srv/chatplus`.

## 4. Создание production env-файла

Скопируйте пример:

```bash
cp deploy/.env.example deploy/.env
```

Минимум заполните:

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

Не коммитьте `deploy/.env`.

## 5. Первый запуск контейнеров и SSL bootstrap

Быстрый путь:

```bash
./deploy/scripts/deploy.sh --with-seed
```

Ручной путь:

```bash
./deploy/scripts/issue-ssl.sh
```

Этот скрипт:

- создает временные self-signed сертификаты, чтобы `nginx` смог стартовать
- поднимает `postgres`, `strapi` и `nginx`
- запрашивает настоящие Let's Encrypt сертификаты для:
  - `${PUBLIC_DOMAIN}`
  - `${CMS_DOMAIN}`
- перезагружает `nginx` после выпуска сертификатов

## 6. Создание первого Strapi admin user

Откройте:

- `https://cms.<domain>/admin`

И вручную создайте admin user в Strapi.

## 7. Создание Strapi API token для build/import

В Strapi admin:

1. Откройте `Settings -> API Tokens`
2. Создайте token с достаточными правами для build/import read и update
3. Запишите token в:

```bash
STRAPI_API_TOKEN=...
```

внутри `deploy/.env`

Этот token используется в:

- `deploy/scripts/seed-content.sh`
- `deploy/scripts/build-portal.sh`

## 8. Импорт generator-owned контента при необходимости

Если этому окружению нужны стартовые generated data:

`deploy.sh --with-seed` уже покрывает этот шаг. Ручной путь:

```bash
./deploy/scripts/seed-content.sh
```

## 9. Сборка и публикация публичного сайта

`deploy.sh` уже покрывает и этот шаг. Ручной путь:

```bash
./deploy/scripts/build-portal.sh
```

Эта команда пересобирает Astro-сайт на основе live Strapi и складывает результат в volume `portal_dist`, который `nginx` отдает на публичном домене.

## 10. Day-2 operations

### Обновление managed content

1. Редактор меняет контент в Strapi
2. Оператор запускает:

```bash
./deploy/scripts/build-portal.sh
```

### Обновление generated content

1. Обновить `cms/seed/*.json` в репозитории
2. Забрать изменения на сервер
3. Запустить:

```bash
./deploy/scripts/seed-content.sh
./deploy/scripts/build-portal.sh
```

### Обновление кода приложения

Если код репозитория на VPS изменился:

```bash
./deploy/scripts/update.sh
```

Если вместе с кодом есть и новые generated seed changes:

```bash
./deploy/scripts/update.sh --with-seed
```

## 11. Backup

Создать backup:

```bash
./deploy/scripts/backup.sh
```

Backup включает:

- `postgres.sql`
- `strapi-uploads.tar.gz`

Backup не включает:

- `deploy/.env`
- настройки доменного регистратора или DNS
- SSH-ключи

Примеры cron entries:

- [deploy/system/cron.backup.example](system/cron.backup.example)
- [deploy/system/cron.ssl-renew.example](system/cron.ssl-renew.example)

## 12. Restore на другой чистой Ubuntu VPS

1. Повторите шаги из разделов `2-7`
2. Скопируйте backup directory на новый сервер
3. Запустите:

```bash
./deploy/scripts/restore.sh /path/to/backup-directory
./deploy/scripts/build-portal.sh
```

Это восстановит:

- Postgres data
- Strapi uploads
- публичный статический сайт после rebuild

## 13. Полезные команды

Показать статус сервисов:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml ps
```

Посмотреть логи:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml logs -f strapi
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml logs -f nginx
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml logs -f postgres
```

Забрать новый код и пересобрать:

```bash
./deploy/scripts/update.sh
```

## 14. Локальный Docker smoke на ПК разработчика

Если хотите проверить deploy package локально перед переносом на VPS:

1. Установите Docker Desktop
2. Если Docker Desktop предлагает WSL integration с вашей личной `Ubuntu`-дистрибуцией, ее можно безопасно пропустить для этого проекта. Local smoke flow требует только сам Docker engine.
3. Создайте локальный env:

```powershell
Copy-Item deploy/.env.local.example deploy/.env.local
```

4. Поднимите локальные сервисы:

```powershell
.\deploy\scripts\local-up.cmd
```

5. Откройте:

- `http://127.0.0.1:1337/admin`
- `http://127.0.0.1:8080`

6. В Strapi admin:

- создайте первого admin user
- создайте API token в `Settings -> API Tokens`
- запишите token в `deploy/.env.local` как `STRAPI_API_TOKEN`

7. Если это чистая локальная база, импортируйте generator-owned контент:

```powershell
.\deploy\scripts\local-seed-content.cmd
```

8. Соберите локальный публичный сайт:

```powershell
.\deploy\scripts\local-build-portal.cmd
```

9. После завершения остановите локальные сервисы:

```powershell
.\deploy\scripts\local-down.cmd
```

Примечания:

- локальный публичный сайт доступен на `http://127.0.0.1:8080`
- `deploy/.env.local` специально держит `PUBLIC_SITE_URL=https://chatplus.ru`, чтобы local smoke проверял production-style canonical URLs, а не локальный `127.0.0.1`
