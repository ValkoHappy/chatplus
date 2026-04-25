# CMS-модель CHATPLUS

Этот документ объясняет, какие сущности живут в `Strapi` и кто за что отвечает.

## Главное правило

`Strapi` должен быть главным источником контента: страницы, SEO, навигация, sitemap, breadcrumbs и редакторские статусы хранятся в CMS.

Frontend отвечает за рендер, стили, layout и безопасную нормализацию данных. Он не должен быть вторым скрытым местом, где живёт основной текст страницы.

## `page_v2`

`page_v2` — главный content type для публичных страниц.

В нём хранится:

- `route_path` — публичный URL;
- `slug` — человекочитаемый ключ;
- `title` — внутреннее название страницы;
- `page_kind` — тип страницы;
- `template_variant` — вариант отображения;
- `source_mode` — `managed`, `generated` или `hybrid`;
- `generation_mode` — `manual`, `ai_assisted` или `ai_generated`;
- `blueprint` — связь с шаблоном-схемой;
- `sections` — блоки страницы;
- SEO-поля;
- nav/sitemap-флаги;
- `parent_page`, `breadcrumbs`, `internal_links`;
- `editorial_status`;
- safety-gate поля миграции.

## Safety gate

Старая страница не должна переключаться на новый слой только потому, что запись опубликована.

Для cutover нужны все условия:

- `page_v2` опубликована;
- `editorial_status=approved`;
- `migration_ready=true`;
- `parity_status=approved`.

Если хотя бы одно условие не выполнено, route остаётся на legacy fallback.

Ключевые поля:

- `migration_ready` — можно ли публично использовать запись;
- `parity_status` — прошла ли страница проверку на сохранение макета;
- `legacy_template_family` — какая старая family отвечает за рендер;
- `legacy_layout_signature` — снимок важных макетных требований;
- `parity_notes` — заметки о проверке или проблемах.

## `page_blueprint`

`page_blueprint` — CMS-сущность, которая описывает допустимую структуру страницы.

Поля:

- `blueprint_id`;
- `page_kind`;
- `template_variant`;
- `required_blocks`;
- `allowed_blocks`;
- `default_sections`;
- `description`;
- `is_active`.

Blueprint помогает редактору и AI понимать, какие блоки нужны для страницы. Code registry остаётся bootstrap/fallback-слоем.

## `page_version`

`page_version` хранит снимки страницы для истории и rollback.

Поля:

- связь с `page_v2`;
- `version_number`;
- `route_path`;
- `editorial_status`;
- `published_at_snapshot`;
- `snapshot`;
- `checksum`;
- `source_action`;
- `created_by_label`.

Lifecycle `page_v2` создаёт версии на ключевые изменения. Для быстрого публичного rollback всё равно используется безопасное правило: снять publish или отключить `migration_ready`.

## Entities

Предметные сущности остаются в `Strapi` как источник фактов:

- `channel`;
- `industry`;
- `integration`;
- `solution`;
- `feature`;
- `business-type`;
- `competitor`.

Они больше не должны быть единственным владельцем публичной страницы. Их задача — хранить факты, связи и данные, из которых materializer может собрать `page_v2`.

## `source_mode`

`managed` — страница создана и ведётся человеком.

`generated` — страница создана materializer/importer на основе сущностей.

`hybrid` — страница началась как generated, но затем была доработана редактором или AI.

## `generation_job`

`generation_job` нужен для AI draft flow.

Правила:

- AI создаёт только draft;
- AI не включает `migration_ready`;
- AI не публикует страницу напрямую;
- человек или оператор проверяет draft перед публичным cutover.

## Legacy templates

Legacy templates пока остаются в коде.

Это не ошибка и не недоделка. Они нужны как:

- защита от потери старого макета;
- fallback при ошибке в `page_v2`;
- быстрый rollback без emergency code deploy;
- эталон для visual parity.

Удалять legacy templates можно только отдельным cleanup-этапом после подтверждённого live parity.
