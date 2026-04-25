# Layout-Preserving `page_v2` Bridge Design

**Дата:** 2026-04-23

**Цель:** сделать `Strapi` главным источником контента, не ломая существующие макеты страниц и не теряя поведение старых шаблонов.

## Проблема

Предыдущая попытка массового локального cutover показала, что общий рендерер `PageV2Page` не может безопасно заменить все старые шаблоны сразу.

Симптомы:

- старые страницы начинали рендериться через общий layout
- терялись уникальные hero/panel/comparison/pricing/story patterns
- визуальная структура становилась “универсальной”, а не route-specific

Корневой вывод:

`page_v2` уже подходит как единая модель контента, но пока не подходит как единый универсальный renderer для всех route families.

## Решение

Новая архитектура должна быть двухслойной:

1. `Strapi/page_v2` становится единым владельцем контента
2. legacy templates остаются renderer-слоем до тех пор, пока каждый family не получит полноценный layout-preserving bridge

То есть правильный путь не такой:

- `page_v2 -> PageV2Page для всего сайта`

А такой:

- `page_v2 -> bridge adapter -> legacy template family renderer`

## Принцип

Каждый публичный route family сохраняет свой визуальный язык:

- `home` -> `HomePage`
- `campaign` -> `CampaignPage`
- `brand-content` -> `BrandContentPage`
- `resource-hub` -> `ResourceHubPage`
- `pricing` -> `PricingPage`
- `partnership` -> `PartnershipPage`
- `structured` -> `StructuredLandingPage`
- `tenders` -> `TendersPage`
- `comparison` -> `ComparisonPage`
- `directory` -> `DirectoryPage`

`page_v2` больше не должен автоматически означать “рендерить через общий новый шаблон”.

Он означает:

- данные страницы живут в новой CMS-модели
- route wrapper выбирает подходящий renderer family
- bridge преобразует `page_v2` sections и metadata в props старого шаблона

## Что сохраняем

Сохраняем без изменений:

- route wrappers как точку выбора renderer family
- legacy page components как production-proven layout layer
- fallback модель `page_v2 approved+ready -> page_v2-backed renderer`, иначе legacy source

Меняем:

- источник данных для legacy-компонентов
- route approval model
- materializer expectations

## Что запрещаем

На этом этапе запрещено:

- массово включать все routes в `migration_ready=true`
- считать `PageV2Page` универсальной заменой старых family templates
- удалять старые шаблоны до завершения family-specific bridge

## Bridge Model

Нужен отдельный adapter layer:

- вход: нормализованный `page_v2`
- выход: props в формате legacy renderer

Примеры:

- `hero` block -> `h1`, `subtitle`, `hero_cta_*`, `hero_trust_facts`
- `pricing-plans` -> `pricing_tiers`
- `comparison-table` -> `comparison_rows`
- `before-after` -> `roi_*`
- `cards-grid` / `feature-list` / `steps` -> `problems`, `features`, `solution_steps`, `integration_blocks`, `use_cases`
- `internal-links` / `related-links` -> `internal_links`
- `final-cta` -> `sticky_cta_*`

## Route Behavior

Для managed routes:

- если `page_v2` отсутствует -> legacy source как сегодня
- если `page_v2` существует, но route не approved -> legacy source
- если `page_v2` approved -> route wrapper берёт данные из `page_v2`, но рендерит через legacy family component

Для dynamic/detail/intersection routes используется тот же принцип:

- `page_v2` может стать владельцем контента
- но renderer остаётся family-specific

## Почему это перспективнее

Этот подход сразу решает две задачи:

1. не теряем текущие макеты и визуальную зрелость
2. можем постепенно убирать старые источники данных, оставляя старые renderer-компоненты до реального parity

Это даёт нормальную эволюцию:

- сначала `Strapi` становится source of truth
- потом bridge стабилизируется
- потом только по мере готовности можно заменять отдельные renderer families на новые, если вообще будет смысл

## Критерий успеха

Система считается движущейся в правильную сторону, если одновременно выполняются условия:

- новые страницы и отредактированный контент живут в `Strapi`
- старые страницы не теряют свой layout
- включение `page_v2` на маршруте не меняет family renderer
- migration approval route-by-route остаётся обратимым
- любой family можно мигрировать отдельно без mass cutover

## Решение по умолчанию

На ближайший этап фиксируем:

- `Strapi` = единый целевой источник контента
- legacy templates = обязательный renderer layer
- `PageV2Page` не используется для старых family routes как основной renderer
- массовый cutover без route-level approval запрещён
