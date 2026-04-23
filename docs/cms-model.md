# CMS-модель CHATPLUS

## Главное правило

`Strapi` — главная редакторская система проекта.

Frontend рендерит публичные страницы, но не должен становиться вторым источником истины для copy, SEO или navigation decisions.

## Модель ownership для записей

Активная operational model:

- `managed` — запись создаётся и редактируется вручную в `Strapi`
- `imported` — запись создаётся importer-ом и затем живёт в `Strapi` с safe merge-поведением
- `settings` — singleton и system records

`content_origin` остаётся legacy compatibility-полем для старых frontend paths, но больше не считается основной редакторской моделью.

## Что живёт в `Strapi`

В `Strapi` живут:

- legacy managed pages
- новые `page_v2` managed pages
- singleton pages
- site settings
- imported catalog и SEO entities после импорта

## Чем владеет importer

Importer больше не является постоянным владельцем live site content.

Он отвечает за:

- чтение seed или generated source data
- выполнение `plan`, `apply`, `force-sync` и `report`
- обновление только system-owned полей imported records
- сохранение manual overrides, если этого требует policy

Importer не имеет права молча перезаписывать editor-owned content.

## Чем владеет фронтенд

Frontend владеет:

- rendering logic
- layout
- styling
- safe shape normalization

Frontend не должен придумывать скрытый marketing text и не должен дублировать SEO-content, который должен редактироваться в `Strapi`.

## Managed-типы контента

Текущие managed editorial types:

- `page-v2`
- `landing-page` как legacy managed singleton layer
- `tenders-page`
- `business-types-page`

## Settings-типы контента

- `site-setting`

## Imported-типы контента

- `channel`
- `industry`
- `integration`
- `feature`
- `solution`
- `business-type`
- `competitor`

## Метаданные imported-записей

Imported catalog и SEO entities используют:

- `record_mode`
- `external_id`
- `import_batch_id`
- `last_imported_at`
- `sync_strategy`
- `manual_override_fields`
- `last_import_diff`
- `last_import_payload`

Эти поля нужны для safe sync и защиты ручных правок.

## Жизненный цикл публикации

Editor-facing types используют `draftAndPublish`:

- `page-v2`
- `landing-page`
- `tenders-page`
- `business-types-page`
- `site-setting`

Это поддерживает production flow:

`Strapi Publish -> webhook -> relay -> rebuild -> deploy`

## `page_v2` как будущая модель managed-страниц

`page_v2` — основная модель для всех новых ручных managed pages.

Она нужна для того, чтобы page creation стала page-first, а не route-template-first.

`page_v2` владеет:

- `route_path`
- section composition
- SEO metadata
- navigation flags
- sitemap flags
- breadcrumb hierarchy
- internal linking

## Модель legacy-bridge

Для selected managed routes поддерживается bridge resolution:

- если на exact route есть published `page_v2`, frontend рендерит `page_v2`
- иначе frontend рендерит legacy source

Это позволяет мигрировать routes без удаления legacy wrappers.

### Переносимые точные managed-routes

- `/`
- `/pricing`
- `/partnership`
- `/docs`
- `/help`
- `/academy`
- `/blog`
- `/status`
- `/media`
- `/team`
- `/conversation`
- `/tv`
- `/promo`
- `/prozorro`
- `/demo`
- `/solutions/tenders`

### Непереносимые зарезервированные routes

Для `page_v2` остаются заблокированными:

- `/admin`
- `/api`
- `/site-map`
- `/compare`
- importer-owned catalog roots и другие system-owned route families

## Manual-first подход до AI

Будущая AI generation не создаёт отдельную page system.

AI пишет только в `page_v2 draft` после того, как manual builder уже стабилен.

Правила:

- никакого direct publish от AI
- никакого route ownership поверх immutable reserved paths
- AI проходит те же validation rules для blocks и blueprints, что и человек
- AI включён только для подтверждённых manual families

## Решения по strict parity

Чтобы между ранним архитектурным документом и текущей реализацией не оставалось двусмысленности, фиксируем текущие решения прямо в CMS-модели.

### `page_blueprint`

Отдельный CMS content type для `page_blueprint` в этом этапе не вводится.

Сейчас:

- blueprints живут в code registry
- источник истины по ним — `config/page-v2-blueprints.mjs`
- редактор использует готовый page contract, а не конфигурирует blueprints вручную в `Strapi`

### `page_version`

Отдельный `page_version` content type тоже не вводится в этом этапе.

Сейчас:

- версияция опирается на историю `Strapi`
- рабочая дисциплина идёт через `draft -> review -> approved -> publish`
- route-level rollback делается через `unpublish` published `page_v2`, после чего ownership возвращается к legacy source

Это осознанное решение текущего этапа, а не забытый архитектурный хвост.

## Связанные документы

- [Конструктор managed-страниц](page-v2-manual-builder.md)
- [Миграция managed routes](managed-route-migration.md)
- [Как добавлять страницы](how-to-add-page.md)
- [Матрица маршрутов и ownership](route-ownership-matrix.md)
- [Контентный workflow](content-workflow.md)
- [Политика импорта](import-policy.md)
