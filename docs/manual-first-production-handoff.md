# Передача следующего production-этапа

Этот документ отделяет локальную готовность от серверного cutover.

## Что уже должно быть готово локально

- `page_v2` работает как основной page-layer.
- `page_blueprint` существует в Strapi.
- `page_version` существует в Strapi.
- Materializer умеет создавать страницы для managed, directory, detail, comparison и intersection routes.
- Safety gate защищает старые маршруты.
- Layout-preserving bridge сохраняет старые family-макеты.
- AI работает только как draft-flow.
- Локальные проверки зеленые.

## Что это НЕ означает

Это не означает, что сервер уже переключен.

До серверного этапа нельзя говорить:

- “все на проде уже перенесено”;
- “legacy можно удалить”;
- “можно делать массовый cutover”;
- “секреты уже ротированы”.

## Серверный порядок работ

1. Сделать backup базы.
2. Сделать backup `.env`.
3. Задеплоить новый `cms`.
4. Проверить API:
   - `/api/page-v2s`;
   - `/api/page-blueprints`;
   - `/api/page-versions`;
   - `/api/generation-jobs`.
5. Задеплоить новый `portal`.
6. Синхронизировать blueprints:

```powershell
npm.cmd run page-v2:sync-blueprints
```

7. Снять report:

```powershell
npm.cmd run page-v2:materialize:report
```

8. Создать live drafts:

```powershell
npm.cmd run page-v2:materialize -- --apply --all
```

9. Публиковать и approve только по одному route.

## Как переключать route на сервере

Пример для `/promo`:

```powershell
npm.cmd run page-v2:materialize -- --route=/promo --apply --publish
npm.cmd run page-v2:materialize -- --route=/promo --approve
```

После этого:

1. Запустить rebuild/deploy.
2. Открыть страницу в браузере.
3. Проверить макет.
4. Проверить меню, footer, sitemap.
5. Если плохо — откатить:

```powershell
npm.cmd run page-v2:materialize -- --route=/promo --mark-not-ready
```

## Почему нельзя массово включать все routes

У разных страниц разные макеты. Даже если данные заполнены, конкретный family-renderer может требовать особое поле.

Поэтому:

- materialize all — можно;
- publish all — осторожно и только как техническая подготовка;
- approve all на сервере — нельзя без отдельного контролируемого решения.

## Scheduled AI

Cron-файл:

- `deploy/system/cron.page-v2-ai.example`

Нужные env:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `STRAPI_URL`
- `STRAPI_TOKEN`

Правило:

- AI создает drafts;
- AI не включает `migration_ready`;
- AI не удаляет ручные изменения;
- auto-publish для старых маршрутов запрещен.

## Ротация секретов

Перед ротацией:

1. Backup базы.
2. Backup `.env`.
3. Проверить, какие токены реально используются.
4. Подготовить maintenance window для Strapi salts.

Ротировать:

- `POSTGRES_PASSWORD`;
- `WEBHOOK_TOKEN`;
- `STRAPI_API_TOKEN`;
- GitHub/relay tokens;
- Strapi session/JWT salts.

`ENCRYPTION_KEY` менять только после отдельной preflight-проверки, иначе можно потерять доступ к зашифрованным данным.

После успешной проверки убрать:

- `ALLOW_PLACEHOLDER_SECRETS=true`

## Когда можно думать об удалении legacy

Только после:

- live cutover всех нужных routes;
- успешного browser smoke;
- успешного rollback smoke;
- подтверждения, что `page_v2` полностью покрывает нужный page contract;
- отдельного cleanup-плана.

До этого legacy wrappers — это страховка, а не мусор.
