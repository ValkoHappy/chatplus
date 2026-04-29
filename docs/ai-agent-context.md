# Контекст для AI и разработчика

Этот файл нужно читать первым, если вы AI-агент, новый разработчик или человек, который будет продолжать миграцию.

Перед работой также прочитайте `AGENTS.md` в корне репозитория и [Workflow Strapi content snapshot](content-snapshot-workflow.md). Они фиксируют, как синхронизировать контент между локалкой, сервером и другими разработчиками.

## Главная цель проекта

CHATPLUS должен стать Strapi-first системой:

- каждая публичная страница имеет запись `Page` (`page_v2`) в Strapi;
- Strapi управляет route, SEO, блоками, навигацией, sitemap, internal links и AI jobs;
- Astro остаётся renderer/build layer;
- legacy templates не удаляются, пока не завершён отдельный cleanup;
- AI создаёт страницы через тот же page contract, что и редактор.

## Правило полного состояния

Git хранит код, схемы, renderer logic, scripts и docs. Strapi хранит контент сайта.

Поэтому полное состояние проекта:

```text
Git commit + Strapi content snapshot + runtime env/секреты
```

Если код обновлен, но Strapi content snapshot не импортирован, сайт может отличаться от локальной версии: часть страниц, блоков, nav, SEO или связей будет другой. Не делайте вывод “код сломан”, пока не проверили, что локальная и серверная Strapi база синхронизированы.

Для переноса контента используйте [Workflow Strapi content snapshot](content-snapshot-workflow.md). Не коммитьте live `.env`, токены, пароли и raw database files.

## Важное различие

`page_v2` - это не просто новый generic шаблон. Это **контентный контракт страницы**.

Для старых URL нельзя автоматически делать так:

```text
published page_v2 -> generic PageV2Page
```

Для старых URL должно быть так:

```text
approved + migration_ready + parity approved page_v2 -> legacy family renderer with page_v2 content
otherwise -> legacy fallback
```

`PageV2Page` нужен для новых native pages, у которых нет старого уникального family layout.

## Основные сущности Strapi

### Page / page_v2

Одна публичная страница сайта.

Ключевые поля:

- `route_path` - публичный URL.
- `page_kind` - тип страницы.
- `blueprint` - правила доступных блоков.
- `sections` - порядок и данные блоков.
- `seo_title`, `seo_description`, `canonical`, `robots` - SEO.
- `show_in_header`, `show_in_footer`, `show_in_sitemap` - структура сайта.
- `breadcrumbs`, `internal_links` - навигация внутри сайта.
- `legacy_template_family` - какой старый renderer должен обслуживать старый URL.
- `migration_ready`, `parity_status` - safety gate.
- `generation_mode`, `source_mode`, `human_review_required` - AI/importer workflow.

### Page Blueprint

Правила для типа страницы:

- какие blocks обязательны;
- какие blocks допустимы;
- какой `page_kind` и `template_variant` ожидаются;
- какие default sections можно создать.

Code registry остаётся bootstrap/fallback, но Strapi blueprint нужен для редактора и AI.

### Page Version

Snapshot страницы для истории и rollback.

Используется, чтобы видеть, что менялось, и восстановить payload страницы при ошибке.

### Generation Job

Задача на AI-генерацию.

AI runner читает `generation_job`, выбирает разрешённые блоки, создаёт `page_v2` draft и пишет результат в `run_report`.

## Route families

Старые страницы имеют family. Family нельзя менять случайно.

Основные families:

- `home`
- `campaign`
- `brand`
- `resource`
- `pricing`
- `partnership`
- `directory`
- `comparison`
- `structured`
- `tenders`
- `demo`
- `system`

Правило: если route уже принадлежал legacy family, он должен продолжать рендериться через этот family renderer, пока отдельная visual migration не докажет, что generic/native renderer сохраняет макет.

## Единая система блоков

Новые и старые страницы должны постепенно использовать общий слой primitives:

- `BlockSection`
- `BlockHeader`
- `BlockCard`
- `BlockGrid`
- `BlockFaq`
- `BlockTable`
- `BlockFinalCta`
- `BlockLinkGrid`

CSS для общих primitives находится в:

```text
portal/src/styles/block-primitives.css
```

Стратегия:

- сначала выносить безопасные общие куски: FAQ, CTA, link cards, simple cards, table wrappers;
- не трогать массово hero, pricing plans, tenders panels и сложные structured layouts;
- если блок повторяется на нескольких страницах, стиль должен жить в primitive/preset, а не копироваться в каждом шаблоне;
- page-v2 renderer и legacy renderer должны быть адаптерами к одной UI-системе, а не двумя отдельными мирами.

## AI block planner

AI может выбирать блоки, но только внутри правил blueprint.

Поля job:

- `block_strategy = auto` - AI сам выбирает допустимые блоки.
- `block_strategy = blueprint_default` - используется дефолт blueprint.
- `block_strategy = custom` - оператор задаёт `target_blocks`.
- `target_blocks` - явный список блоков для custom режима.

AI не должен:

- создавать неизвестные block types;
- добавлять блок, который запрещён blueprint;
- включать `migration_ready`;
- публиковать старый route без parity;
- менять legacy family;
- делать auto-publish для старых страниц без отдельного production решения.

## Что нельзя ломать

Нельзя:

- удалять legacy wrappers;
- заменять старые routes на generic `PageV2Page` без family bridge;
- терять секции старой страницы при materialize;
- оставлять тестовые тексты вроде `Can this page be edited in Strapi?`;
- делать массовое approval/cutover без проверки;
- игнорировать `parity_status`;
- делать AI bypass для route policy.

## Что проверять после изменений

Базовый набор:

```powershell
npm.cmd run test:contracts
npm.cmd run check:docs-consistency
npm.cmd --prefix portal run build
```

Если менялись Strapi schemas:

```powershell
npm.cmd --prefix cms run build
```

Если менялись materializer, bridge или page data:

```powershell
npm.cmd run page-v2:data-quality -- --problems --json
npm.cmd run page-v2:parity-report -- --json
npm.cmd run page-v2:rendered-coverage -- --problems --json
npm.cmd run page-v2:local:layout-smoke -- --json
```

Если менялись подсказки Strapi:

```powershell
npm.cmd run strapi:help:ru
npm.cmd run test:contracts
```

## Browser smoke routes

После UI/layout изменений проверять минимум:

- `/`
- `/pricing`
- `/partnership`
- `/promo`
- `/docs`
- `/media`
- `/compare`
- `/compare/respond-io`
- `/solutions/tenders`
- `/channels/email/amocrm`

Проверять:

- нет generic shell на legacy route;
- шапка и футер не разваливаются;
- FAQ имеет нормальную ширину;
- CTA присутствует;
- нет тестового английского контента;
- таблицы не пустые;
- related/internal links не дублируют одно и то же.

## Как безопасно откатить плохой route

Если старый route выглядит плохо:

```powershell
npm.cmd run page-v2:materialize -- --route=/pricing --mark-not-ready
```

Если нужно снять публикацию:

```powershell
npm.cmd run page-v2:materialize -- --route=/pricing --unpublish
```

После этого route должен вернуться на legacy fallback.

## Как продолжать разработку

1. Сначала понять family route.
2. Проверить, какие blocks уже есть в Strapi.
3. Проверить, какие sections реально рендерятся.
4. Если секция потеряна, чинить materializer/bridge, а не скрывать проблему CSS.
5. Если одинаковый блок повторяется, выносить в primitive/preset.
6. После каждого изменения прогонять contract tests и targeted browser smoke.
7. Обновлять docs в том же PR/commit, где меняется contract.
