# Перенос CHATPLUS на Railway

CHATPLUS можно держать в двух production-профилях:

```text
VPS profile      -> deploy/docker-compose.prod.yml + deploy/scripts/*
Railway profile  -> deploy/railway/*
```

Это значит, что текущий VPS не ломается. Railway можно поднять рядом, проверить и только потом переключать домены.

## Что уже подготовлено

Railway-файлы:

```text
deploy/railway/README.md
deploy/railway/cms.railway.json
deploy/railway/portal.railway.json
deploy/railway/strapi.env.example
deploy/railway/portal.env.example
```

Для AI-работы с Railway можно поставить официальный Railway skill:

```powershell
railway skills --agent codex
```

После установки нужно перезапустить Codex.

## Какой профиль выбрать

VPS оставляем для текущего production:

- nginx;
- certbot;
- static Astro build;
- content-relay;
- backups через scripts;
- SSH-операции.

Railway используем как отдельный managed-профиль:

- Railway Postgres;
- Strapi service;
- Portal service;
- Railway domains;
- Railway Volume для uploads.

Целевой правильный вариант после первичной проверки:

- Strapi и Portal живут отдельными Railway services из одного GitHub repo.
- Strapi хранит контент в Railway Postgres.
- Uploads лежат в Railway Volume или S3-compatible storage.
- AI generation работает внутри Strapi service через Railway variables.
- Publish в Strapi дергает Railway Deploy Hook для Portal service.
- Редактору не нужен SSH: он работает в Strapi, смотрит preview и после publish ждет новый Portal deployment.

## Быстрый план Railway

1. Создать Railway project.
2. Подключить GitHub repository.
3. Добавить Postgres.
4. Добавить Strapi service с config `deploy/railway/cms.railway.json`.
5. Добавить Volume к Strapi на `/app/cms/public/uploads`.
6. Заполнить Strapi variables из `deploy/railway/strapi.env.example`.
7. Задеплоить Strapi.
8. Создать Strapi API token.
9. Добавить Portal service с config `deploy/railway/portal.railway.json`.
10. Заполнить Portal variables из `deploy/railway/portal.env.example`.
11. Задеплоить Portal.
12. Импортировать Strapi content snapshot.
13. Проверить routes, preview и AI generation.

Подробный runbook: [Railway deployment profile](../deploy/railway/README.md).

## Важное отличие от VPS

На VPS publish в Strapi запускает `content-relay`, который пересобирает static Astro.

В Railway-профиле первого этапа `content-relay` не переносится. После publish нужно:

- либо вручную redeploy Portal service;
- либо настроить Railway Deploy Hook и вызвать его из Strapi webhook.

Это проще и безопаснее для первого переноса.

## Домен не обязателен

Для проверки можно использовать Railway domains:

```text
https://...up.railway.app
```

Custom domains подключаются позже, когда Railway staging уже проверен.

## Что нельзя забыть

- Git не содержит Strapi content.
- Для полного переноса нужен content snapshot.
- Uploads требуют Railway Volume или отдельный storage.
- Секреты не коммитятся.
- `PUBLIC_SITE_URL`, `CMS_PUBLIC_URL`, `PUBLIC_URL` и `STRAPI_URL` должны совпадать с реальными Railway/custom доменами.
