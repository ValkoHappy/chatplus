# CHATPLUS

Главная точка входа в проект. Если вы впервые открыли репозиторий, начинайте отсюда.

## Текущий статус

Проект уже работает на VPS:

- публичный сайт: `https://astro.integromat.ru`
- Strapi admin: `https://strapi.integromat.ru/admin`
- основной режим управления контентом: `Strapi -> Content Manager -> Page` для каркаса страницы и точечных правок, `Strapi -> Content Manager -> Generation Job` для AI-заполнения выбранной `target_page`

Полная копия сайта это не один Git commit. Полное состояние = `Git commit + Strapi content snapshot + env/секреты`. Если сервер и локалка выглядят по-разному, сначала проверяйте синхронизацию Strapi-контента.

## Если вы просто меняете контент

Вам не нужно читать команды, Docker, Git, импорт базы и техническую архитектуру.

Не подключайтесь к серверу по SSH и не открывайте `docs/start-here-vps.md`, если ваша задача - поменять текст, блок, ссылку, FAQ, SEO или добавить страницу. Этот документ только для аварийного/первого запуска VPS.

Вам нужны только эти документы:

1. [Быстрый старт редактора](docs/editor-quickstart.md)
2. [AI-генерация черновиков](docs/ai-page-generation.md)
3. [AI-черновик: проверка до публикации](docs/ai-draft-preview-workflow.md)
4. [Справочники: каналы, отрасли, интеграции и страницы по ним](docs/entity-catalog-editor-workflow.md)
5. [Карта интерфейса Strapi](docs/strapi-ui-map.md)
6. [Понятная инструкция для редактора Strapi](docs/strapi-editor-handbook.md)
7. [Рецепты заполнения страниц](docs/strapi-page-recipes.md)

Короткий рецепт:

1. Откройте `https://strapi.integromat.ru/admin`.
2. Войдите под своим Strapi-аккаунтом.
3. Откройте `Content Manager`.
4. Для новой страницы сначала подготовьте `Page` с правильным типом и набором блоков.
5. Для большой правки откройте `Generation Job`, выберите эту `Page` в `target_page`, заполните prompt и оставьте `status = queued`.
6. После генерации откройте связанную `Page`, проверьте Astro preview и текст.
7. Если надо доработать, создайте новый `Generation Job`, выберите эту же страницу в `target_page` и напишите, что исправить.
8. Если всё готово, поставьте у `Page` `editorial_status = approved` и нажмите `Publish`.
9. Для маленькой правки откройте коллекцию `Page`, найдите страницу по `route_path`, измените нужный блок в `sections`, затем `Save` и `Publish`.

Если нужно создать новую страницу, сначала создайте или материализуйте `Page` с правильным макетом, затем используйте `Content Manager -> Generation Job` для заполнения текста этой страницы. Свободное AI-создание страниц без `target_page` отключено: AI не меняет порядок блоков, `block_type` и `variant`. Если нужно добавить новый канал, отрасль, интеграцию, сценарий, функцию, тип бизнеса или конкурента, создайте запись вручную в отдельном справочнике Strapi или проверьте AI-предложение в `run_report.proposed_entities`. AI не создает и не публикует справочники молча: задача сначала получает `status = needs_entity_review`, затем оператор подтверждает создание черновика. Публичную страницу по новой записи проверяйте отдельно как `Page`. Подробно: [Справочники: каналы, отрасли, интеграции и страницы по ним](docs/entity-catalog-editor-workflow.md).

В справочниках редактор видит только короткие безопасные поля вроде `slug`, `name`, `description`, иногда `pain`, `solution`, `category`, `price`. Старые поля `icon`, `emoji`, `hero_*`, `seo_*`, `roi_*`, `faq`, `sticky_cta_*` и похожие не удалены из базы, но скрыты из редакторской формы. Их не нужно заполнять вручную: публичный контент страницы меняется через `Page`.

Роль для обычного редактора в Strapi: `AI Draft Editor`. Она разрешает работать с `Page`: создавать, редактировать, публиковать, снимать с публикации и удалять тестовые или согласованные страницы. Также она разрешает создавать `Generation Job` для AI-доработки выбранной `target_page`. Эта роль не предназначена для VPS, Docker, GitHub Actions, `.env`, API tokens, схем Strapi и серверных snapshot. Логины, email, пароли и другие данные конкретных пользователей не хранятся в документации и Git.

## Если вы разработчик или AI-агент

Сначала прочитайте:

1. [Инструкции для AI/разработчика](AGENTS.md)
2. [Карта документации](docs/index.md)
3. [Контекст для AI и разработчика](docs/ai-agent-context.md)
4. [Workflow Strapi content snapshot](docs/content-snapshot-workflow.md)

Главное правило: Git хранит код, но не весь контент сайта. Перед задачами по страницам, блокам, SEO, navigation или sitemap синхронизируйте Strapi content snapshot.

## Что это

`CHATPLUS` — это публичный сайт на `Astro` и контентный слой на `Strapi`.

Проект состоит из четырёх основных частей:

- `portal/` — фронтенд, шаблоны, маршруты и сборка
- `cms/` — `Strapi`, content types, админка и CMS-данные
- `scripts/` — importer, AI generation и служебные content-скрипты
- `pages-preview/` — legacy demo snapshot для showcase-режима

Текущий рабочий контур server-first:

- `Strapi + Postgres + uploads` живут на VPS
- `Astro` собирает публичную статику
- `nginx` отдаёт публичный сайт и reverse proxy на CMS
- publish flow по умолчанию идёт по схеме `Publish -> webhook -> relay -> local rebuild -> deploy`

## Текущая модель проекта

Пользовательская модель больше не описывается как `generated vs managed`.

Рабочая модель теперь такая:

- `managed` — запись редактируется вручную в `Strapi`
- `imported` — запись создаётся importer-ом, живёт в `Strapi` и синхронизируется по safe merge-правилам
- `settings` — singleton и системные записи

Что это означает на практике:

- `Strapi` — главный редакторский интерфейс
- `Astro` — только рендер и сборка статики
- importer загружает SEO и catalog-данные в `Strapi`, но не должен слепо перетирать ручные правки
- все новые ручные managed pages должны создаваться через `page_v2`, а не через расширение legacy `landing-page`

## Полная инженерная документация

Рекомендуемый порядок:

1. [Инструкции для AI/разработчика](AGENTS.md)
2. [Карта документации](docs/index.md)
3. [Контекст для AI и разработчика](docs/ai-agent-context.md)
4. [Workflow Strapi content snapshot](docs/content-snapshot-workflow.md)
5. [Архитектура](docs/architecture.md)
6. [CMS-модель](docs/cms-model.md)
7. [Конструктор managed-страниц](docs/page-v2-manual-builder.md)
8. [Миграция managed routes](docs/managed-route-migration.md)
9. [Передача следующего production-этапа](docs/manual-first-production-handoff.md)
10. [AI-генерация черновиков](docs/ai-page-generation.md)
11. [Справочники: каналы, отрасли, интеграции и страницы по ним](docs/entity-catalog-editor-workflow.md)
12. [Контентный workflow](docs/content-workflow.md)
13. [Политика импорта](docs/import-policy.md)
14. [Матрица маршрутов и ownership](docs/route-ownership-matrix.md)
15. [Контракты шаблонов](docs/template-contracts.md)
16. [Карта файлов](docs/file-map.md)
17. [Контракт безопасных изменений](docs/change-safety.md)
18. [Диагностика неполадок](docs/troubleshooting.md)
19. [Релизный поток](docs/release-flow.md)
20. [Production Deploy](deploy/DEPLOY_PRODUCTION.md)

Важно: Git commit сам по себе не является полной копией сайта. Для полного воспроизведения нужна связка `Git commit + Strapi content snapshot + env/секреты`. Подробно: [Workflow Strapi content snapshot](docs/content-snapshot-workflow.md).

## Что читать оператору и владельцу сервера

Если сайт уже работает, обычный владелец/редактор начинает не с VPS, а со Strapi:

1. [Быстрый вход для владельца](docs/owner-quickstart.md)
2. [Карта интерфейса Strapi](docs/strapi-ui-map.md)
3. [Понятная инструкция для редактора Strapi](docs/strapi-editor-handbook.md)
4. [Гайд оператора](docs/operator-guide.md)
5. [Релизный поток](docs/release-flow.md)

Только если сервер чистый, сайт не установлен или идёт аварийное восстановление:

1. [Аварийный/первый запуск на VPS](docs/start-here-vps.md)
2. [Production setup checklist](docs/production-setup-checklist.md)
3. [Production Deploy](deploy/DEPLOY_PRODUCTION.md)

## Быстрый локальный запуск

### Strapi

```powershell
npm --prefix cms run develop
```

### Astro

Во втором окне:

```powershell
npm --prefix portal run dev -- --host 127.0.0.1
```

Открыть:

```text
http://127.0.0.1:4321/
```

## Локальная Docker smoke-проверка

Если нужно проверить production-like контур локально:

```powershell
Copy-Item deploy/.env.local.example deploy/.env.local
.\deploy\scripts\local-up.cmd
```

Дальше:

1. открыть `http://127.0.0.1:1337/admin`
2. создать первого `Strapi` admin user
3. создать `API Token`
4. записать его в `deploy/.env.local` как `STRAPI_API_TOKEN`
5. при необходимости прогнать importer:

```powershell
.\deploy\scripts\local-seed-content.cmd
```

6. собрать локальный публичный сайт:

```powershell
.\deploy\scripts\local-build-portal.cmd
```

Результат:

- `Strapi`: `http://127.0.0.1:1337/admin`
- публичный сайт: `http://127.0.0.1:8080`

## Основные команды

### Проверить план importer-а

```powershell
npm run seed-content:plan
```

### Запустить importer

```powershell
npm run seed-content
```

### Принудительная синхронизация

```powershell
npm run seed-content:force
```

### Посмотреть отчёт importer-а

```powershell
npm run seed-content:report
```

### Запустить AI-заполнение выбранной Page для одной задачи

```powershell
npm run page-v2:generate -- --job-id=JOB_ID
```

### Обработать ручные AI-задачи в очереди

```powershell
npm run page-v2:generate:queued -- --job-type=manual_request
```

### Обработать плановые AI-задачи в очереди

```powershell
npm run page-v2:generate:scheduled
```

### Посмотреть отчёт по `generation_job`

```powershell
npm run page-v2:generate:report
```

### Полная локальная проверка

```powershell
npm run test:contracts
npm run check:docs-consistency
npm --prefix portal run build
```

## Главные правила проекта

- не правьте imported catalog и SEO-записи вручную как основной workflow
- не используйте `force-sync` как обычный publish flow
- не хардкодьте user-facing copy во frontend, если её должен редактировать редактор
- не создавайте новые managed pages через legacy `landing-page`, если для этого подходит `page_v2`
- перед публикацией должен проходить `portal build`
- deploy и content publish считаются отдельными pipeline

## Где источник истины

- для `managed` и `settings` контента — `Strapi`
- для batch generation — `cms/seed/*.json` как bootstrap/import layer
- для шаблонов, layout и render logic — `portal/`
- для передачи полного состояния между локалкой, сервером и другими разработчиками — `Strapi export/import` snapshot, см. [Workflow Strapi content snapshot](docs/content-snapshot-workflow.md)

## Важные ссылки

- [Карта документации](docs/index.md)
- [CMS-модель](docs/cms-model.md)
- [Конструктор managed-страниц](docs/page-v2-manual-builder.md)
- [Миграция managed routes](docs/managed-route-migration.md)
- [Передача следующего production-этапа](docs/manual-first-production-handoff.md)
- [AI-генерация черновиков](docs/ai-page-generation.md)
- [Контентный workflow](docs/content-workflow.md)
- [Политика импорта](docs/import-policy.md)
- [Гайд оператора](docs/operator-guide.md)
- [Быстрый запуск на VPS](docs/start-here-vps.md)
- [Production Deploy](deploy/DEPLOY_PRODUCTION.md)
