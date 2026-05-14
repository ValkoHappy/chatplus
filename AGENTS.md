# CHATPLUS Agent Instructions

Эти правила обязательны для AI-агентов и разработчиков, которые работают в этом репозитории.

## Сначала прочитать

Перед изменениями откройте эти документы:

1. `docs/ai-agent-context.md`
2. `docs/content-snapshot-workflow.md`
3. `docs/index.md`
4. `docs/strapi-editor-handbook.md`, если задача касается Strapi-контента
5. `docs/rendering-safety-map.md`, если задача касается страниц, route, renderer family, блоков, верстки или шаблонов
6. `docs/unified-block-system-plan.md`, если задача касается блоков, верстки или шаблонов
7. `docs/page-transfer-and-style-change-runbook.md`, если задача касается новой страницы, переноса Strapi-контента на сервер или правки стилей

## Главное правило проекта

Полный сайт это не только Git.

Полный сайт = `Git commit` + `Strapi content snapshot` + runtime env/секреты.

Если обновить только код, но не перенести Strapi-контент, сайт может выглядеть иначе: навигация, страницы, блоки, SEO и связи будут отличаться от локальной версии. Поэтому перед любой серьезной задачей сначала проверьте, с каким content snapshot вы работаете.

## Что хранится где

- Код, схемы Strapi, скрипты, документация и renderer logic живут в Git.
- Страницы, блоки, SEO, navigation, sitemap, internal links, entities и page snapshots живут в Strapi.
- Полный перенос контента делается через `strapi export/import`, а не через ручное копирование таблиц.
- Секреты, live `.env`, пароли, токены и приватные ключи не коммитятся даже в private repository.

## Перед началом работы

1. Выполнить `git pull`.
2. Уточнить, нужен ли свежий контент с VPS или достаточно локального snapshot.
3. Если задача касается страниц, блоков, Strapi, навигации, sitemap или SEO, синхронизировать content snapshot по `docs/content-snapshot-workflow.md`.
4. Запустить локально Strapi и Astro.
5. Проверить минимум один затронутый route в браузере.

## После изменений

Если менялся только код:

```powershell
npm.cmd run test:contracts
npm.cmd run check:docs-consistency
npm.cmd --prefix portal run build
```

Если менялись Strapi schemas:

```powershell
npm.cmd --prefix cms run build
```

Если менялся контент в Strapi:

1. Создать новый content snapshot.
2. Записать в handoff, какой snapshot соответствует коммиту.
3. Не говорить, что сервер обновлен, пока snapshot не импортирован на сервер и portal не пересобран.

## Правила безопасности для page_v2

- Старые templates и wrappers не удалять без отдельного cleanup-плана.
- Старые URL не переводить на generic `PageV2Page`, если у route есть legacy family.
- Для старых URL публичный cutover допустим только через safety gate: `migration_ready=true`, `parity_status=approved`, approved editorial status.
- Если route выглядит плохо, сначала выключить `migration_ready` или снять publish, потом чинить materializer/bridge.
- Новый блок добавляется только через Strapi schema, frontend primitive/renderer, тесты и документацию.

## Карта рендеринга страниц и блоков

Перед изменением страниц, route, blocks, styles, templates или adapters прочитайте `docs/rendering-safety-map.md`.

Коротко:

- `page_v2` - общий content contract, но не всегда общий visual renderer.
- `PageV2Page` - только для новых/native страниц без старого уникального family layout.
- Старые route families (`home`, `campaign`, `brand`, `resource`, `directory`, `comparison`, `structured` и другие) нельзя случайно заменять generic renderer.
- Новый block type добавляется только полным контрактом: Strapi schema -> dynamic zone -> portal normalization -> renderer -> primitive/component -> tests -> docs.
- Улучшать и унифицировать систему можно, но поэтапно: сначала сохранить текущий route contract, затем выносить общее в primitives, проверять parity и оставлять rollback.

## Работа с сервером

- Перед destructive Strapi import всегда делать server backup.
- Git push не обновляет Strapi DB сам по себе.
- После server import обязательно пересобрать portal.
- Проверять counts ключевых таблиц и несколько representative routes.

## Что нельзя делать

- Не коммитить `deploy/.env`, `cms/.env`, raw database files, API tokens, пароли и приватные ключи.
- Не считать локальный SQLite или серверный Postgres “одноразовыми”: это часть состояния сайта.
- Не делать массовый publish/cutover без smoke-проверок.
- Не оставлять тестовый английский контент вроде `Can this page be edited in Strapi?` в production pages.
