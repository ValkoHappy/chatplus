# Гайд оператора

Этот документ для человека, который сопровождает систему: запускает проверки, переносит страницы, готовит серверный этап и понимает, что уже готово локально.

## Быстрая карта документов

- [Быстрый старт редактора](editor-quickstart.md) — как работать руками в Strapi.
- [Как добавить страницу](how-to-add-page.md) — как создать новую страницу или перенести старую.
- [Конструктор страниц](page-v2-manual-builder.md) — какие блоки и поля есть.
- [Миграция маршрутов](managed-route-migration.md) — как безопасно переводить старые URL.
- [Локальный чек-лист](local-readiness-checklist.md) — что должно быть зеленым до сервера.
- [Production handoff](manual-first-production-handoff.md) — что делать на VPS после локальной готовности.

## Что сейчас является источником страниц

Основной источник публичных страниц — `page_v2`.

Сущности `channel`, `industry`, `integration`, `solution`, `feature`, `business_type`, `competitor` остаются источниками фактов. Они не должны быть единственным владельцем публичной страницы.

Legacy-модели и старые `.astro` wrappers пока остаются как fallback.

## Главные команды проверки

Запускайте перед серверным шагом:

```powershell
npm.cmd run test:contracts
npm.cmd run check:docs-consistency
npm.cmd --prefix cms run build
npm.cmd --prefix portal run build
npm.cmd run page-v2:data-quality -- --problems --json
npm.cmd run page-v2:parity-report -- --json
npm.cmd run page-v2:rendered-coverage -- --problems --json
npm.cmd run page-v2:local:layout-smoke -- --json
```

`page-v2:local:layout-smoke` проверяет текущий `portal/dist` в read-only режиме: он не пишет в Strapi и оставляет approved routes включенными. Для полной проверки с пересборкой используйте `npm.cmd run page-v2:local:layout-smoke:build -- --json`.

Хороший результат:

- tests проходят;
- builds проходят;
- `data-quality` возвращает `withIssues = 0`;
- `parity-report` возвращает `withBridgeLosses = 0`;
- `rendered-coverage` возвращает `missingMarkers = 0`.

## Как создать записи page_v2 локально

Отчет без изменений:

```powershell
npm.cmd run page-v2:materialize:report
```

Создать или обновить все drafts:

```powershell
npm.cmd run page-v2:materialize -- --apply --all
```

Создать один route:

```powershell
npm.cmd run page-v2:materialize -- --route=/pricing --apply
```

## Как безопасно включить старый route

1. Создать или обновить запись:

```powershell
npm.cmd run page-v2:materialize -- --route=/pricing --apply
```

2. Опубликовать запись:

```powershell
npm.cmd run page-v2:materialize -- --route=/pricing --apply --publish
```

3. Проверить макет.
4. Разрешить cutover:

```powershell
npm.cmd run page-v2:materialize -- --route=/pricing --approve
```

## Как быстро откатить route

```powershell
npm.cmd run page-v2:materialize -- --route=/pricing --mark-not-ready
```

Если нужно снять публикацию:

```powershell
npm.cmd run page-v2:materialize -- --route=/pricing --unpublish
```

## AI-команды

AI пока должен создавать только drafts:

```powershell
npm.cmd run page-v2:generate:report
npm.cmd run page-v2:generate:queued -- --job-type=manual_request
npm.cmd run page-v2:generate:scheduled
```

Правило: AI не включает `migration_ready` и не делает auto-publish для старых маршрутов.

## Что относится к серверному этапу

Это не локальная доделка:

- deploy нового `cms`;
- deploy нового `portal`;
- синхронизация blueprints на live Strapi;
- materialize live drafts;
- live cutover по одному route;
- production smoke;
- ротация секретов.

## Если что-то пошло не так

| Проблема | Что сделать |
| --- | --- |
| Страница открывается, но выглядит плохо | `--mark-not-ready` и проверить bridge/sections. |
| Страница не открывается | Проверить `route_path`, publish, safety gate и build. |
| Таблица пустая | Проверить block `comparison-table` и bridge mapping. |
| Блок есть в Strapi, но его нет на сайте | Запустить `page-v2:rendered-coverage`. |
| Страница пропала из меню | Проверить `show_in_header`, `show_in_footer`, `nav_group`, `nav_order`. |
| Страница попала в sitemap ошибочно | Проверить `show_in_sitemap`, `robots`, `canonical`. |

## Памятка безопасности

- Не включать `migration_ready` без проверки.
- Не делать массовый cutover на сервере.
- Не удалять legacy wrappers до отдельного cleanup-этапа.
- Не менять секреты без backup базы и `.env`.
