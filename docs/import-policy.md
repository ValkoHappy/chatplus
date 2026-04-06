# Политика импорта CHATPLUS

## Что делает importer

Importer берет source data из `cms/seed/*.json` и синхронизирует ее с `Strapi`.

Он не должен быть “тайным главным владельцем” live-контента.

## Режимы записи

### `managed`

- создается руками в CMS
- importer не трогает

### `imported`

- создается importer-ом
- потом живет в CMS
- поддерживает безопасный merge sync

### `settings`

- singleton/system record
- не используется для catalog sync

## Sync strategy

Поддерживаемые значения:

- `merge`
- `frozen`
- `system_only`

Сейчас рабочий стандарт:

- imported catalog/SEO записи создаются с `merge`

## Что такое manual override

Когда редактор меняет imported-запись руками, importer сравнивает текущее значение с `last_import_payload`.

Если значение отличается, поле попадает в:

- `manual_override_fields`

Следующий обычный sync это поле не перетирает.

## Когда использовать force sync

`force-sync` нужен только если:

- source data нужно сознательно сделать главнее CMS-правок
- ручные изменения больше не актуальны
- команда понимает, что editor-owned поля будут перезаписаны

Обычный редактор не должен использовать `force-sync`.

## Identity contract

Для imported family используются:

- `external_id` как основной ключ
- `slug` как fallback key

Это нужно, чтобы importer не зависел только от slug и мог безопаснее обновлять записи.

## Что смотреть в CMS

У imported-записи важно:

- `record_mode`
- `sync_strategy`
- `last_imported_at`
- `manual_override_fields`
- `last_import_diff`

Эти поля считаются служебными и не должны быть частью обычного редакторского UX.
