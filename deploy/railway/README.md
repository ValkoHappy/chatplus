# Railway deployment profile

Этот профиль нужен, чтобы развернуть CHATPLUS на Railway, не ломая текущий VPS production.

Текущий VPS-профиль остается в `deploy/docker-compose.prod.yml` и `deploy/scripts/*`. Railway-профиль живет отдельно в `deploy/railway/*`.

## Целевая схема

```text
Railway Project
|- Postgres
|- Strapi CMS service
|  |- config: deploy/railway/cms.railway.json
|  |- Dockerfile: cms/Dockerfile.prod
|  `- volume: /app/cms/public/uploads
`- Portal service
   |- config: deploy/railway/portal.railway.json
   `- Dockerfile: portal/Dockerfile.preview
```

На первом этапе Railway не использует:

- VPS nginx;
- certbot;
- `deploy/docker-compose.prod.yml`;
- `content-relay`;
- Docker socket;
- static release папки из `deploy/data/public-site`.

Railway сам дает HTTPS и временные домены `*.up.railway.app`.

## Railway CLI и agent skill

Для работы из Codex/AI-агента можно поставить официальный Railway skill:

```powershell
railway skills --agent codex
```

Альтернативный официальный способ:

```powershell
npx skills add https://github.com/railwayapp/railway-skills --skill use-railway
```

После установки перезапустите Codex, чтобы skill появился в списке доступных навыков. Railway CLI должен быть залогинен:

```powershell
railway login
railway whoami
```

## Важное ограничение первого этапа

Публичный Portal сейчас собирает страницы статически во время build/start. Это значит:

- Strapi preview работает через Portal service;
- опубликованный контент из Strapi попадет на публичные страницы после redeploy/restart Portal service;
- для автоматического rebuild после publish нужно добавить Railway Deploy Hook и вызвать его из Strapi webhook.

Это специально проще, чем переносить VPS `content-relay` как есть.

## Создание Railway project

1. Создайте новый Railway project.
2. Подключите GitHub repository `ValkoHappy/chatplus`.
3. Добавьте Railway Postgres service.
4. Создайте service `Strapi CMS` из того же GitHub repo.
5. В настройках Strapi service укажите config file path:

```text
deploy/railway/cms.railway.json
```

6. Создайте service `Portal` из того же GitHub repo.
7. В настройках Portal service укажите config file path:

```text
deploy/railway/portal.railway.json
```

Если Railway UI не предлагает config file path, укажите Dockerfile path вручную:

```text
Strapi: cms/Dockerfile.prod
Portal: portal/Dockerfile.preview
```

## Strapi variables

Заполните Railway variables для Strapi по примеру:

```text
deploy/railway/strapi.env.example
```

Минимально нужны:

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=${{PORT}}
PUBLIC_URL=https://REPLACE_WITH_RAILWAY_STRAPI_DOMAIN
CMS_PUBLIC_URL=https://REPLACE_WITH_RAILWAY_STRAPI_DOMAIN
PUBLIC_SITE_URL=https://REPLACE_WITH_RAILWAY_PORTAL_DOMAIN
DATABASE_CLIENT=postgres
DATABASE_URL=${{Postgres.DATABASE_URL}}
DATABASE_SCHEMA=public
DATABASE_SSL=false
APP_KEYS=...
API_TOKEN_SALT=...
ADMIN_JWT_SECRET=...
TRANSFER_TOKEN_SALT=...
JWT_SECRET=...
ENCRYPTION_KEY=...
PREVIEW_TOKEN=...
```

Для AI generation через DeepSeek:

```env
DEEPSEEK_API_KEY=...
DEEPSEEK_MODEL=deepseek-chat
```

Секреты не коммитить. Для реального переноса production лучше переносить значения Strapi secrets с текущего VPS или ротировать их отдельно.

## Strapi uploads

Если используется local upload storage:

1. Добавьте Railway Volume к Strapi service.
2. Mount path:

```text
/app/cms/public/uploads
```

3. Оставьте:

```env
UPLOAD_PROVIDER=local
```

Без volume загруженные файлы могут потеряться при redeploy.

## Portal variables

Заполните Railway variables для Portal по примеру:

```text
deploy/railway/portal.env.example
```

Минимально нужны:

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=${{PORT}}
STRAPI_URL=https://REPLACE_WITH_RAILWAY_STRAPI_DOMAIN
STRAPI_TOKEN=...
PREVIEW_TOKEN=...
PUBLIC_SITE_URL=https://REPLACE_WITH_RAILWAY_PORTAL_DOMAIN
PUBLIC_BASE_PATH=
PUBLIC_GOOGLE_SITE_VERIFICATION=
PUBLIC_YANDEX_SITE_VERIFICATION=
PUBLIC_YANDEX_METRIKA_ID=
PUBLIC_YANDEX_METRIKA_WEBVISOR=false
PUBLIC_GOOGLE_TAG_ID=
PUBLIC_GOOGLE_TAG_MANAGER_ID=
```

`STRAPI_TOKEN` создается в Strapi admin: `Settings -> API Tokens`.

## Первый запуск

1. Deploy Postgres.
2. Deploy Strapi.
3. Откройте Strapi Railway domain и создайте первого admin user, если база пустая.
4. Создайте API token для Portal.
5. Запишите token в Portal service variable `STRAPI_TOKEN`.
6. Deploy Portal.
7. Откройте Portal Railway domain.

## Перенос контента

Полный сайт это Git + Strapi content snapshot + runtime env/secrets.

Для staging-проверки можно импортировать snapshot локально в Railway Postgres через Railway env:

```powershell
railway link
railway service
railway run npm.cmd --prefix cms run strapi -- import -f deploy\data\backups\chatplus-content.tar --force --only content
```

На практике команда зависит от выбранного Railway project/service и имени snapshot. Перед destructive import всегда сделайте backup текущего источника.

Uploads переносятся отдельно:

- либо через Strapi export/import с files;
- либо вручную в Railway Volume;
- либо позже через S3-compatible storage.

## Preview

Проверка:

1. В Strapi откройте любую `Page`.
2. Нажмите preview.
3. Preview должен открыться на `PUBLIC_SITE_URL`.
4. Если preview 404 или invalid token, проверьте:
   - `PUBLIC_SITE_URL` в Strapi service;
   - `PREVIEW_TOKEN` в Strapi service;
   - `PREVIEW_TOKEN` в Portal service;
   - что Portal был redeploy после изменения variables.

## Publish rebuild

На VPS publish запускает `content-relay`, который пересобирает static Portal.

Правильный Railway-вариант для редактора:

1. Редактор меняет Page или создает AI Generation Job в Strapi.
2. Strapi сохраняет результат в своей базе Railway Postgres.
3. Редактор нажимает Publish.
4. Strapi webhook вызывает Railway Deploy Hook для Portal service.
5. Railway пересобирает Portal из Git + текущего Strapi content.
6. Редактор проверяет публичный route и preview без SSH и без ручных команд.

Ручной fallback, если Deploy Hook еще не настроен:

1. Publish в Strapi.
2. Redeploy Portal service вручную.
3. Проверьте публичный route.

Опциональная автоматизация:

1. Создайте Deploy Hook для Portal service в Railway.
2. В Strapi `Settings -> Webhooks` добавьте webhook на этот Deploy Hook.
3. Включите события `entry.publish`, `entry.update`, `entry.unpublish`.
4. Проверьте, что publish запускает новый Portal deployment.

## Домены

Для теста домен покупать не нужно:

```text
Strapi: https://...up.railway.app
Portal: https://...up.railway.app
```

Когда все проверено, можно подключить custom domains:

```text
astro.integromat.ru
strapi.integromat.ru
```

После смены доменов обновите:

- `PUBLIC_URL`;
- `CMS_PUBLIC_URL`;
- `PUBLIC_SITE_URL`;
- `STRAPI_URL`;
- canonical/site settings в Strapi, если там были absolute старые URL.

## Smoke checks

Проверить минимум:

- Strapi admin открывается.
- Portal `/` открывается.
- `/academy` открывается.
- `/industries/beauty` открывается.
- Preview draft открывается.
- AI Generation Job запускается кнопкой.
- После publish и redeploy Portal публичная страница обновляется.
- Upload в Media Library переживает redeploy, если подключен volume.

## Когда оставаться на VPS

VPS лучше оставить основным, если нужны:

- полный контроль над nginx;
- server-side static release history;
- локальные backup/restore scripts;
- content-relay с Docker socket;
- привычный SSH workflow.

Railway лучше как staging или более простой managed deploy, если хочется меньше администрировать сервер.
