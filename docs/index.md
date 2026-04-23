# Документация CHATPLUS

Главная карта проекта. Этот файл стоит открыть первым перед работой с репозиторием.

## Что это за проект

`CHATPLUS` — это контентный сайт на `Astro`, который получает данные из `Strapi`.

В проекте есть:

- `portal/` — фронтенд
- `cms/` — `Strapi` CMS
- `scripts/` — importer, AI generation и служебные content-скрипты
- `pages-preview/` — legacy demo snapshot для showcase-режима

Основной рабочий режим сейчас server-first:

- `Strapi + Postgres + uploads` живут на VPS
- `Astro` собирает публичную статику
- `nginx` отдаёт сайт и проксирует CMS

## Главный принцип

Текущая рабочая модель:

- `managed` — запись редактируется вручную в `Strapi`
- `imported` — запись создаётся importer-ом и затем живёт в `Strapi`
- `settings` — singleton и системные записи

Для всех новых ручных managed pages действует отдельное правило:

- новый route создаётся через `page_v2`
- legacy `landing-page` не расширяется под новые manual routes

## Порядок чтения для инженера

1. [Архитектура](architecture.md)
2. [Глоссарий](glossary.md)
3. [CMS-модель](cms-model.md)
4. [Конструктор managed-страниц](page-v2-manual-builder.md)
5. [Миграция managed routes](managed-route-migration.md)
6. [Передача следующего production-этапа](manual-first-production-handoff.md)
6. [AI-генерация черновиков](ai-page-generation.md)
6. [Контентный workflow](content-workflow.md)
7. [Политика импорта](import-policy.md)
8. [Матрица маршрутов и ownership](route-ownership-matrix.md)
9. [Контракты шаблонов](template-contracts.md)
10. [Карта файлов](file-map.md)
11. [Контракт безопасных изменений](change-safety.md)
12. [Диагностика неполадок](troubleshooting.md)
13. [Релизный поток](release-flow.md)
14. [Гайд оператора](operator-guide.md)
16. [Production Deploy](../deploy/DEPLOY_PRODUCTION.md)

## Порядок чтения для оператора и редактора

1. [Быстрый запуск на VPS](start-here-vps.md)
2. [Быстрый вход для владельца](owner-quickstart.md)
3. [Гайд оператора](operator-guide.md)
4. [Контентный workflow](content-workflow.md)
5. [Релизный поток](release-flow.md)
6. [Production Deploy](../deploy/DEPLOY_PRODUCTION.md)

## Где что лежит

```text
CHATPLUS/
|- portal/          # Astro frontend
|- cms/             # Strapi CMS
|- scripts/         # importer и content-скрипты
|- docs/            # актуальная документация
|- pages-preview/   # optional demo snapshot
|- .github/         # workflows
|- deploy/          # production и local runbooks
`- README.md        # главный вход в проект
```

## Где источник истины

### CMS и админка

`Strapi` — главный редакторский интерфейс.

В нём живут:

- legacy managed pages
- новые `page_v2` managed pages
- singleton pages
- site settings
- imported catalog и SEO-записи после загрузки

### Импорт и генерация

Importer:

- читает `cms/seed/*.json`
- умеет `plan`, `apply`, `force-sync`, `report`
- пишет записи в `Strapi`
- не должен слепо затирать ручные редакторские правки

### Фронтенд

Frontend владеет только:

- шаблонами
- layout
- стилями
- render logic
- safe shape normalization

Frontend не должен становиться вторым источником истины для copy.

## Правила без двусмысленности

- не используйте `generated` как главный user-facing ownership термин
- не правьте imported catalog/SEO записи вручную как основной workflow
- не хардкодьте user-facing copy во frontend, если её должен менять редактор
- не добавляйте новый CMS-owned блок без обновления схемы, рендерера и docs
- не публикуйте изменения без успешного `portal build`

