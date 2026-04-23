# Конструктор managed-страниц

`page_v2` — это новая page-first модель для ручных managed pages в `CHATPLUS`.

Она даёт один CMS-owned объект, который определяет:

- публичный route
- тип страницы и layout hint
- упорядоченный список sections
- SEO metadata
- участие страницы в navigation и sitemap
- breadcrumb hierarchy

Публичный сайт по-прежнему использует существующий production flow:

`Publish -> webhook -> relay -> rebuild -> deploy`

## Для чего нужен `page_v2`

Используйте `page_v2` для:

- всех новых managed pages
- постепенной миграции существующих legacy managed routes
- будущей AI-assisted draft generation

Не используйте `page_v2` в этом этапе для:

- imported catalog и SEO families
- utility routes вроде `/site-map`
- system-owned routes вроде `/admin` и `/api`

## Безопасный bridge для legacy-маршрутов

Для legacy managed routes действует bridge-модель.

Разрешение route работает так:

1. если на exact route есть published `page_v2`, рендерится `page_v2`
2. иначе рендерится legacy source

Draft `page_v2` никогда не перехватывает legacy route.

### Переносимые managed-маршруты

Следующие exact routes могут перейти под `page_v2`:

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

### Непереносимые зарезервированные маршруты

`page_v2` не может занимать:

- `/admin`
- `/api`
- `/site-map`
- `/compare`
- importer-owned catalog roots и другие system-owned family

## Главный контракт `page_v2`

Основные поля:

- `slug`
- `route_path`
- `locale`
- `title`
- `page_kind`
- `template_variant`
- `generation_mode`
- `source_mode`
- `sections`
- `seo_title`
- `seo_description`
- `canonical`
- `robots`
- `og_image`
- `hreflang_policy`
- `show_in_header`
- `show_in_footer`
- `show_in_sitemap`
- `nav_group`
- `nav_label`
- `nav_description`
- `nav_order`
- `parent_page`
- `breadcrumbs`
- `internal_links`
- `editorial_status`
- `owner`
- `reviewer`

AI-ready поля:

- `generation_prompt`
- `ai_metadata`
- `human_review_required`

### Важные значения по умолчанию

- `slug` — это human key
- `route_path` — реальный публичный route
- иерархию лучше выражать через `parent_page`, а не кодировать в `slug`
- `template_variant` — это display hint, а не отдельный data contract

## Виды страниц

Поддерживаемые `page_kind`:

- `landing`
- `directory`
- `entity_detail`
- `entity_intersection`
- `comparison`
- `campaign`
- `resource`
- `brand`
- `system`

Это taxonomy страниц, а не жёсткая route-template таблица.

## Реестр секций

`page_v2` использует block-based dynamic zone. Текущий список поддерживаемых block types:

- `hero`
- `rich-text`
- `proof-stats`
- `cards-grid`
- `feature-list`
- `steps`
- `faq`
- `testimonial`
- `related-links`
- `final-cta`
- `pricing-plans`
- `comparison-table`
- `before-after`
- `internal-links`

### Зачем добавлены новые блоки возможностей

- `pricing-plans` закрывает parity для legacy pricing tiers и plan cards
- `comparison-table` закрывает parity для comparison rows и compare pages
- `before-after` закрывает ROI и dual-column pattern
- `internal-links` переносит скрытую page-level перелинковку в явный CMS-owned section

### Важные parity-поля

Текущий block registry уже поддерживает:

- `hero.variant`
- hero trust facts
- hero panel items
- hero context title и context text
- `proof-stats.variant`
- `cards-grid.variant`
- `steps.variant`
- `faq.intro`
- icons и secondary text в cards и features

## Матрица blueprints

Blueprints пока code-managed, но в migration phase они уже являются конкретной матрицей page families.

### `campaign`

Основные blocks:

- `hero`
- `proof-stats`
- `cards-grid`
- `steps`
- `faq`
- `related-links`
- `final-cta`

### `brand`

Основные blocks:

- `hero`
- `cards-grid`
- `steps`
- `faq`
- `internal-links`
- `final-cta`

Опционально:

- `testimonial`

### `resource`

Основные blocks:

- `hero`
- `rich-text`
- `cards-grid`
- `faq`
- `internal-links`
- `final-cta`

### `landing`

Основные blocks:

- `hero`
- `proof-stats`
- `cards-grid`
- `feature-list`
- `steps`
- `before-after`
- `faq`
- `internal-links`
- `final-cta`

### `comparison`

Основные blocks:

- `hero`
- `cards-grid`
- `steps`
- `comparison-table`
- `faq`
- `internal-links`
- `final-cta`

### Что пока не входит в этот этап

- `directory`
- imported catalog families
- importer-driven detail и intersection families

## Навигация, sitemap и breadcrumbs

Для migrated routes `page_v2` становится источником истины для:

- header navigation
- footer navigation
- mobile navigation
- sitemap inclusion
- breadcrumb hierarchy
- internal и related links

Главное правило:

- если migrated route опубликован через `page_v2`, nav metadata должна идти из `page_v2`
- legacy nav остаётся fallback только для ещё не migrated routes

Breadcrumb resolution:

1. explicit `breadcrumbs`, если они заданы
2. иначе вывод от `parent_page`

## Волны миграции

Big-bang migration не делаем.

### Волна 1

- `/promo`
- `/prozorro`
- `/media`
- `/team`
- `/conversation`
- `/tv`
- `/docs`
- `/help`
- `/academy`
- `/blog`
- `/status`

Почему:

- минимальный route risk
- эти family уже близки к текущему capability set `page_v2`

### Волна 2

- `/pricing`
- `/partnership`

Почему:

- им нужны новые capability-blocks вроде `pricing-plans`, `comparison-table`, `before-after`

### Волна 3

- `/`
- `/demo`
- `/solutions/tenders`

Почему:

- максимальная плотность sections
- переносить их стоит только после подтверждённой стабильности builder-а

## CLI для контролируемой миграции

Для реальной migration prepared route-by-route используйте отдельный CLI:

```powershell
npm run page-v2:migrate:managed:report
```

Проверить один route без записи:

```powershell
npm run page-v2:migrate:managed -- --route=/promo
```

Создать или обновить `page_v2`:

```powershell
npm run page-v2:migrate:managed -- --route=/promo --apply
```

Опубликовать migrated route:

```powershell
npm run page-v2:migrate:managed -- --route=/promo --apply --publish
```

Откатить route на legacy source:

```powershell
npm run page-v2:migrate:managed -- --route=/promo --unpublish
```

## Редакторский процесс

1. Создать запись `page_v2` в `Strapi`
2. Выбрать `page_kind`
3. Выбрать подходящий blueprint
4. Заполнить `route_path`, SEO и nav/sitemap fields
5. При необходимости связать страницу с entities
6. Собрать страницу через `sections`
7. Сохранить как draft
8. Проверить preview-safe flow или локальную сборку
9. Перевести страницу в `review` и затем в `approved`
10. Нажать `Publish`

## Политика защиты от поломок

В этом этапе нельзя ломать legacy templates ради migration.

Правила:

- legacy wrappers не удаляются
- legacy templates не переписываются “вслепую”
- каждый route мигрируется отдельно
- route считается migrated только после parity smoke
- rollback делается быстро: снятием published state у `page_v2`

То есть:

- `page_v2 published` -> render `page_v2`
- otherwise -> render legacy source

## Политика AI

AI — это второй способ заполнить тот же `page_v2`, а не отдельная page system.

Правила:

- AI создаёт только `page_v2 draft`
- AI никогда не публикует напрямую
- `human_review_required` включён по умолчанию
- scheduled jobs тоже создают только drafts
- AI разрешён только для:
  - `campaign`
  - `brand`
  - `resource`

## Связанные документы

- [Как добавлять страницы](how-to-add-page.md)
- [Миграция managed routes](managed-route-migration.md)
- [Передача следующего production-этапа](manual-first-production-handoff.md)
- [Матрица маршрутов и ownership](route-ownership-matrix.md)
- [Контракты шаблонов](template-contracts.md)
- [CMS-модель](cms-model.md)
- [AI-генерация черновиков](ai-page-generation.md)
