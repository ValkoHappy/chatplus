# CHATPLUS

Главная точка входа в проект. Если вы впервые открыли репозиторий, начинайте отсюда.

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

## Что читать инженеру

Рекомендуемый порядок:

1. [Карта документации](docs/index.md)
2. [Архитектура](docs/architecture.md)
3. [CMS-модель](docs/cms-model.md)
4. [Конструктор managed-страниц](docs/page-v2-manual-builder.md)
5. [Миграция managed routes](docs/managed-route-migration.md)
6. [Передача следующего production-этапа](docs/manual-first-production-handoff.md)
6. [AI-генерация черновиков](docs/ai-page-generation.md)
6. [Контентный workflow](docs/content-workflow.md)
7. [Политика импорта](docs/import-policy.md)
8. [Матрица маршрутов и ownership](docs/route-ownership-matrix.md)
9. [Контракты шаблонов](docs/template-contracts.md)
10. [Карта файлов](docs/file-map.md)
11. [Контракт безопасных изменений](docs/change-safety.md)
12. [Диагностика неполадок](docs/troubleshooting.md)
13. [Релизный поток](docs/release-flow.md)
15. [Production Deploy](deploy/DEPLOY_PRODUCTION.md)

## Что читать оператору, редактору и владельцу

1. [Быстрый запуск на VPS](docs/start-here-vps.md)
2. [Production setup checklist](docs/production-setup-checklist.md)
3. [Быстрый вход для владельца](docs/owner-quickstart.md)
4. [Гайд оператора](docs/operator-guide.md)
5. [Релизный поток](docs/release-flow.md)
6. [Production Deploy](deploy/DEPLOY_PRODUCTION.md)

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

### Запустить AI-генерацию черновика для одной задачи

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


