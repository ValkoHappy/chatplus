# Production Setup Checklist

Этот чеклист нужен для первого боевого запуска.

Он специально покрывает те вещи, которые по официальной модели `Strapi 5` настраиваются через админку и не должны автоматизироваться хрупкими обходными путями.

## 1. Перед стартом

- заполнен `deploy/.env`
- домен сайта указывает на VPS
- поддомен `cms.` указывает на VPS
- Docker и `docker compose` работают
- HTTPS на `80/443` открыт

## 2. После первого `deploy.sh`

Проверьте:

- `https://cms.<domain>/admin` открывается
- `https://<public-domain>` открывается
- контейнер `content-relay` запущен
- `postgres`, `strapi`, `nginx` healthy

## 3. Первый администратор

В `Strapi`:

1. создать первого admin user
2. войти под ним

## 4. API token

В `Strapi`:

1. открыть `Settings -> API Tokens`
2. создать токен для build/import flow
3. записать его в `deploy/.env` как `STRAPI_API_TOKEN`

## 5. Webhook

В `Strapi`:

1. открыть `Settings -> Webhooks`
2. создать webhook на:

```text
https://cms.<domain>/__relay/strapi/publish
```

3. добавить header:

```text
Key: Authorization
Value: Bearer <WEBHOOK_TOKEN из deploy/.env>
```

4. включить события:
- `entry.publish`
- `entry.unpublish`

Дополнительно при необходимости:
- `entry.create`
- `entry.update`

Важно:

- `entry.publish` работает только для типов с `draftAndPublish`
- relay использует `Authorization: Bearer ${WEBHOOK_TOKEN}` и по умолчанию запускает локальный rebuild на VPS
- если header не задан, publish сохранится в Strapi, но сайт автоматически не пересоберется

## 6. Роли

Официальная модель `Strapi 5` предполагает настройку admin roles через админку.

Минимально настройте:

### `editor`

Должен уметь:

- читать и редактировать editorial content
- публиковать managed страницы
- не иметь доступа к системным настройкам, токенам и storage-конфигу

### `seo-operator`

Должен уметь:

- работать с imported catalog/SEO сущностями
- публиковать затронутые записи
- видеть webhook/API token разделы только если это реально нужно процессу

### `admin`

Должен уметь:

- все настройки CMS
- webhooks
- API tokens
- роли и permissions

## 7. Storage

Для текущего server-first production storage по умолчанию локальный:

- проверить `UPLOAD_PROVIDER=local`
- убедиться, что uploads пишутся в локальный volume `strapi_uploads`
- включить uploads в backup и restore-сценарии
- загрузить тестовый файл в Media Library
- убедиться, что файл переживает backup/restore

Если позже появится отдельная storage migration:

- только тогда переключать `UPLOAD_PROVIDER=aws-s3`
- только тогда заполнять `AWS_*` и `CDN_URL`
- не считать S3-compatible storage обязательной частью текущего rollout

## 8. Importer smoke

Перед первым массовым sync:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml run --no-deps --rm tools node scripts/seed-runtime-content.mjs --plan
```

Если diff корректен:

```bash
./deploy/scripts/seed-content.sh
```

## 9. Publish smoke

Проверьте на одной managed-странице:

1. изменить контент
2. нажать `Publish`
3. убедиться, что webhook дошел до relay
4. убедиться, что relay запустил локальный rebuild и сайт обновился
5. убедиться, что публичный сайт обновился

## 10. GitHub secrets для production pipelines

Для server-first deploy должны быть заполнены:

- `STRAPI_URL`
- `STRAPI_TOKEN`
- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_APP_DIR`
- `VPS_SSH_PORT` — только если используется нестандартный SSH-port

## 11. Recovery baseline

Перед реальным запуском:

- один раз выполнить `backup.sh`
- проверить, куда пишется backup
- убедиться, что команда `restore.sh` понятна оператору

## 12. Definition of Ready

Production setup можно считать готовым к боевой работе, когда:

- есть admin user
- есть `STRAPI_API_TOKEN`
- webhook настроен
- роли созданы
- importer `plan` работает
- build/rebuild workflow реально стартует
- backup/restore понятны оператору
