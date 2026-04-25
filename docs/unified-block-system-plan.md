# Единая система блоков и безопасная эволюция макетов

## Зачем это нужно

Сейчас в проекте уже есть правильная основа: страницы живут в `page_v2`, а старые URL могут брать контент из Strapi и рендериться через свои проверенные legacy-шаблоны. Но внутри фронтенда ещё осталась старая проблема: одинаковые визуальные паттерны повторяются в разных компонентах.

Примеры повторяющихся блоков:

- hero с заголовком, subtitle, CTA и trust facts;
- карточки проблем, преимуществ, сценариев и ресурсов;
- steps / timeline;
- FAQ;
- final CTA;
- comparison table;
- before-after / ROI;
- internal links.

Из-за этого один и тот же по смыслу блок может выглядеть по-разному на разных страницах. Пример: FAQ на одних страницах был узким, а на других широким, потому что разные шаблоны задавали разные локальные `max-width`.

Цель: сделать так, чтобы общие блоки имели единый контракт, единые базовые стили и понятные варианты отображения, а уникальные старые макеты не ломались.

## Главный принцип

Нельзя просто заменить все старые шаблоны на один универсальный renderer. Так мы уже видели риск потери блоков, текста и композиции.

Правильная модель:

```text
Strapi page_v2
  -> sections
  -> block registry
  -> shared block primitives
  -> legacy family preset или native page_v2 renderer
```

То есть:

- `page_v2.sections` хранит контент блоков;
- block registry знает все доступные типы блоков;
- shared block primitives отвечают за общие стили и HTML-паттерны;
- legacy family renderer может использовать те же primitives, но со своим preset;
- новый native page renderer использует те же primitives напрямую.

## Слои системы

### 1. CMS contract layer

Это Strapi-компоненты и поля внутри `page_v2.sections`.

Здесь фиксируются только данные:

- `hero`;
- `rich-text`;
- `proof-stats`;
- `cards-grid`;
- `feature-list`;
- `steps`;
- `faq`;
- `testimonial`;
- `related-links`;
- `internal-links`;
- `final-cta`;
- `pricing-plans`;
- `comparison-table`;
- `before-after`.

Правило: новый визуальный блок нельзя добавлять только в Astro. Сначала нужен Strapi contract, потом renderer, потом blueprint/adapter.

### 2. Block primitive layer

Это общие frontend-компоненты и общие CSS-классы.

Нужны общие primitives:

- `BlockSection`;
- `BlockHeader`;
- `BlockCard`;
- `BlockGrid`;
- `BlockCtaPair`;
- `BlockFaq`;
- `BlockTable`;
- `BlockLinkGrid`;
- `BlockBeforeAfter`;
- `BlockHero`.

Их задача не заменить все макеты сразу, а убрать дубли там, где блоки реально одинаковые.

Пример: FAQ должен быть один общий `BlockFaq`, а не пять разных локальных реализаций с разной шириной.

### 3. Variant / preset layer

Один блок может иметь разные варианты, но варианты должны быть явными.

Примеры:

- `hero.variant = default | split-panel | editorial | compact | product-window`;
- `cards-grid.variant = problems | benefits | use_cases | resources | editorial`;
- `steps.variant = cards | timeline | numbered-list`;
- `proof-stats.variant = band | cards | sidebar`;
- `faq.variant = default | compact`;
- `final-cta.variant = light | dark | split`.

Старые страницы не должны иметь случайные локальные стили. Они должны использовать preset:

```text
legacy_template_family = pricing
block = faq
preset = pricing.faq
```

Если `pricing.faq` визуально совпадает с общим FAQ, он использует общий стиль. Если там есть отличие, отличие оформляется как preset, а не как копия CSS внутри страницы.

### 4. Legacy family bridge layer

Старые URL пока продолжают рендериться через свои family:

- `home`;
- `campaign`;
- `brand`;
- `resource`;
- `pricing`;
- `partnership`;
- `directory`;
- `comparison`;
- `structured`;
- `tenders`;
- `system`.

Но эти family должны постепенно перестать держать собственные копии одинаковых блоков.

Правило миграции:

1. Сначала найти повторяющийся блок.
2. Вынести его в общий primitive.
3. Подключить primitive в один legacy family.
4. Сравнить визуально со старым выводом.
5. Подключить в следующий family.
6. Только после parity переносить дальше.

## Как добавлять новый блок

Новый блок добавляется только через полный путь:

1. Создать Strapi component в `cms/src/components/page-blocks`.
2. Добавить тип блока в `config/page-v2-blueprints.mjs`.
3. Добавить renderer в `portal/src/components/page-v2`.
4. Если блок общий, добавить primitive в `portal/src/components/blocks`.
5. Добавить CSS в общий блоковый слой, а не в конкретную страницу.
6. Обновить materializer, если старые страницы должны уметь переносить этот блок.
7. Обновить bridge adapter, если legacy renderer должен получать этот блок.
8. Добавить contract test.
9. Добавить browser smoke для representative route.
10. Обновить документацию редактора.

Если хотя бы один пункт пропущен, блок считается неполным.

## Как менять старый блок

Старый блок нельзя менять вслепую по одному шаблону.

Правильный порядок:

1. Найти все страницы/family, где этот паттерн используется.
2. Проверить, есть ли уже общий primitive.
3. Если primitive есть, менять его и прогнать representative pages.
4. Если primitive нет, сначала создать primitive и подключить только одну family.
5. Прогнать parity report.
6. Прогнать browser smoke.
7. Только потом расширять на остальные family.

Пример: FAQ.

Мы не должны править ширину FAQ в `PricingPage`, `PartnershipPage`, `CampaignPage` отдельно. Правильное место - общий `FaqSection` / будущий `BlockFaq`.

## Что надо сделать дальше

### Phase 1. Inventory

Составить карту повторяющихся блоков:

- какие CSS-классы повторяются;
- какие блоки уже есть в `page-v2`;
- какие legacy family используют похожий HTML;
- где есть уникальная визуальная логика, которую нельзя объединять сразу.

Результат: таблица `block -> current implementations -> target primitive`.

### Phase 2. Shared styles without visual changes

Создать общий CSS-слой:

- `portal/src/styles/block-primitives.css`;
- подключить его в основной layout;
- перенести туда только безопасные токены и primitives:
  - section spacing;
  - card radius/border/shadow;
  - grid gaps;
  - FAQ width;
  - button pair layout;
  - table wrapper.

Важно: на этом этапе нельзя менять композицию страниц. Только выносить одинаковые стили.

### Phase 3. Shared components

Создать `portal/src/components/blocks/`:

```text
portal/src/components/blocks/
|- BlockSection.astro
|- BlockHeader.astro
|- BlockCard.astro
|- BlockGrid.astro
|- BlockFaq.astro
|- BlockTable.astro
|- BlockFinalCta.astro
```

Сначала подключать только самые безопасные:

- FAQ;
- internal links;
- related links;
- final CTA;
- simple cards.

Не начинать с `hero`, `pricing`, `tenders`, потому что там больше всего уникального layout.

### Phase 4. Legacy family adoption

Подключать shared primitives волнами:

1. `resource` и `brand`;
2. `campaign`;
3. `comparison`;
4. `pricing` и `partnership`;
5. `home`, `tenders`, `structured`.

Каждая волна должна проходить:

- unit/contract tests;
- local build;
- browser smoke;
- parity report.

### Phase 5. Native page builder maturity

Когда shared primitives покрывают основные блоки, новые страницы можно будет создавать быстрее:

- редактор выбирает blueprint;
- добавляет секции;
- секции используют те же primitives, что и старые страницы;
- AI позже генерирует такие же sections, а не отдельный формат.

## Что нельзя делать

- Нельзя массово заменить legacy family на общий `PageV2Page`.
- Нельзя объединять блоки только потому, что у них похожие названия.
- Нельзя терять уникальный layout старой страницы ради чистоты кода.
- Нельзя добавлять новый блок только в frontend без Strapi schema.
- Нельзя держать разные стили одного и того же блока в пяти шаблонах.
- Нельзя публиковать migrated route без parity approval.

## Критерий готовности

Единая система блоков считается готовой, когда:

- каждый общий блок имеет один CMS contract;
- каждый общий блок имеет один renderer или один shared primitive;
- variants/presets описаны явно;
- legacy family используют shared primitives там, где это безопасно;
- новые страницы можно собирать из тех же блоков;
- AI draft flow использует те же block contracts;
- parity report не показывает потерю старых секций;
- browser smoke подтверждает, что старые макеты не просели.

## Практический вывод

Нам нужна не просто "единая CSS-библиотека", а управляемая block system:

```text
единые данные в Strapi
+ единые блоковые primitives
+ явные variants/presets
+ legacy bridge без потери макетов
= страницы можно безопасно менять, удалять, добавлять и генерировать
```

Это и есть нормальная перспективная архитектура: старый сайт не ломается, а новая система постепенно становится проще, чище и удобнее.

## Текущее локальное внедрение

Первая безопасная волна уже вынесена в общий слой:

- общий CSS: `portal/src/styles/block-primitives.css`;
- primitives: `portal/src/components/blocks`;
- `FaqSection` теперь является тонкой обёрткой над `BlockFaq`;
- page-v2 blocks `faq`, `related-links`, `internal-links`, `final-cta`, `comparison-table` используют общие primitives;
- legacy `InternalLinksSection` использует `BlockLinkGrid`, но старые family-renderers остаются на месте.

Что важно: это не означает массовую замену старых страниц на `PageV2Page`. Старые route families продолжают использовать свои renderer-компоненты. Общий слой отвечает только за повторяющиеся безопасные блоки.

Подробная таблица статусов лежит в [инвентаризации общих блоков](block-primitives-inventory.md).
