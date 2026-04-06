# CMS-модель CHATPLUS

## Главное правило

В проекте больше не используется старая user-facing operational-модель:

- `generated`
- `managed`

как основная редакторская логика.

Новая модель:

- `managed` — запись создается и редактируется руками в `Strapi`
- `imported` — запись создается importer-ом, живет в `Strapi` и поддерживает безопасный merge sync
- `settings` — singleton/system records

`content_origin` остается только как legacy-слой совместимости для текущего frontend и старых данных. Основная operational-модель теперь строится вокруг `record_mode`.

## Кто чем владеет

### Strapi

`Strapi` — главный редакторский интерфейс.

В нем живут:

- landing pages
- singleton pages
- site settings
- imported catalog/SEO записи после загрузки

### Importer

Importer больше не считается вечным владельцем live-контента.

Он:

- читает `cms/seed/*.json`
- делает `plan`, `apply`, `force-sync`, `report`
- пишет записи в `Strapi` через API
- обновляет только `system-owned` поля
- не должен слепо затирать ручные правки

### Frontend

Frontend владеет только:

- шаблонами
- layout
- стилями
- render logic
- shape-normalization

Frontend не должен быть вторым источником copy/SEO-текста.

## Поля новой record-модели

Для imported catalog/SEO записей используются поля:

- `record_mode`
- `external_id`
- `import_batch_id`
- `last_imported_at`
- `sync_strategy`
- `manual_override_fields`
- `last_import_diff`

Внутреннее служебное поле:

- `last_import_payload`

Оно нужно importer-у, чтобы понимать, какие поля редактор изменил вручную между sync-циклами.

## Какие типы сейчас считаются редакторскими

### `managed`

- `landing-page`
- `tenders-page`
- `business-types-page`

### `settings`

- `site-setting`

### `imported`

- `channel`
- `industry`
- `integration`
- `feature`
- `solution`
- `business-type`
- `competitor`

## Publish lifecycle

Для editor-facing типов включен `draftAndPublish`:

- `landing-page`
- `tenders-page`
- `business-types-page`
- `site-setting`

Это нужно для схемы:

`Strapi Publish -> webhook -> relay -> CI rebuild -> deploy`

## Пилот новой модели

Первый рабочий пилот новой CMS-first схемы:

- `landing-page` как основной `managed` тип
- `competitor` как первый `imported` тип
- `solution` как второй `imported` тип

Остальные catalog-типы уже получили базовые metadata-поля и дальше переводятся по той же модели.

## Связанные документы

- [Контентный workflow](content-workflow.md)
- [Политика импорта](import-policy.md)
- [Гайд оператора](operator-guide.md)
- [Release flow](release-flow.md)
