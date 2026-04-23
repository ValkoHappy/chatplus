# Контракты шаблонов

Этот документ нужен для инженера или другой нейросети. Его задача — убрать догадки: какой шаблон что рендерит, откуда берет данные и что можно менять безопасно.

## Общие правила

Для любого шаблона:

- шаблон владеет версткой и поведением
- CMS владеет пользовательским текстом и structured content
- fallback-и допустимы только как safety layer, а не как главный источник истины
- imported catalog pages могут использовать безопасные data-derivation fallback-и из самих сущностей
- managed singleton pages не должны держать hidden marketing copy в adapters или компонентах

## Быстрая матрица

| Шаблон | Маршруты | Основной источник данных | Ownership |
|---|---|---|---|
| `home` | `/` | `landing-page` | `managed` |
| `structured` | detail pages, intersections, `/demo` | catalog entities + imported landing content | в основном `imported` |
| `directory` | `/channels`, `/industries`, `/integrations`, `/solutions`, `/features`, `/for` | catalog collections + `site-setting` labels | mixed |
| `pricing` | `/pricing` | `landing-page` | `managed` |
| `partnership` | `/partnership` | `landing-page` | `managed` |
| `tenders` | `/solutions/tenders` | `tenders-page` | обычно `managed` |
| `resource-hub` | `/docs`, `/help`, `/academy`, `/blog`, `/status` | `landing-page` | `managed` |
| `brand-content` | `/media`, `/team`, `/conversation`, `/tv` | `landing-page` | `managed` |
| `comparison` | `/compare/[slug]`, `/vs/[slug]` | `competitor` | в основном `imported` |
| `campaign` | `/promo`, `/prozorro` | `landing-page` | `managed` |

Подробная привязка маршрутов и ownership:

- [Матрица маршрутов и ownership](route-ownership-matrix.md)

Отдельно:

- новые manual routes через `page_v2` не образуют еще один legacy `template_kind`
- они используют `template_variant` как layout hint и section registry как page composition layer
- для них ориентиром служит [Конструктор managed-страниц](page-v2-manual-builder.md)

## 1. `home`

Назначение:

- только `/`

Источник данных:

- `landing-page`

Обязательные поля:

- `slug`
- `template_kind = home`
- `content_origin = managed`
- hero title
- hero subtitle

Желательные поля:

- `hero_eyebrow`
- `proof_facts`
- `section_labels`
- FAQ
- final CTA copy

Безопасно менять без schema changes:

- layout hero
- spacing
- responsive behavior
- visual treatment карточек и секций

Требует schema/import changes:

- новый CMS-owned блок в hero
- новый тип статистического блока
- новый editable section contract

## 2. `structured`

Назначение:

- `/channels/[slug]`
- `/industries/[slug]`
- `/integrations/[slug]`
- `/solutions/[slug]`
- `/features/[slug]`
- `/for/[slug]`
- `/channels/[channel]/[industry]`
- `/channels/[channel]/[integration]`
- `/industries/[industry]/[solution]`
- `/integrations/[integration]/[solution]`
- `/for/[businessType]/[industry]`
- `/demo`

Источник данных:

- catalog entities
- imported landing content

Обязательные поля:

- slug
- hero content
- problem/solution flow content

Желательные поля:

- `hero_eyebrow`
- `section_labels`
- FAQ
- internal links

Shared sections:

- FAQ
- internal links
- navigation groups

Безопасно менять:

- сетку и верстку секций
- styling карточек
- spacing и responsive behavior

Требует schema/import changes:

- новый CMS-owned problem/step block
- новый тип panel/items contract

## 3. `directory`

Назначение:

- `/channels`
- `/industries`
- `/integrations`
- `/solutions`
- `/features`
- `/for`

Источник данных:

- catalog collections
- `site-setting` / template defaults / helper labels

Обязательные поля:

- список сущностей каталога
- title и intro каталога

Желательные поля:

- helper labels
- CTA labels

Shared sections:

- internal links
- navigation groups

Безопасно менять:

- grid/list layout
- card visual styles

Требует schema/import changes:

- новый editable card block beyond current entity model

## 4. `pricing`

Назначение:

- `/pricing`

Источник данных:

- `landing-page`

Ключевые поля:

- `template_kind = pricing`
- `content_origin = managed`
- `hero_panel_items`
- `pricing_tiers`
- `proof_cards`
- `section_labels`
- bottom CTA copy

Shared sections:

- FAQ
- internal links

Безопасно менять:

- карточки тарифов
- responsive layout
- hero/panel styling

Требует schema/import changes:

- новый editable тип тарифа
- новый CMS-owned pricing sub-block

## 5. `partnership`

Назначение:

- `/partnership`

Источник данных:

- `landing-page`

Ключевые поля:

- `template_kind = partnership`
- `content_origin = managed`
- `hero_eyebrow`
- `section_labels`
- ROI/comparison labels
- FAQ
- CTA copy

Безопасно менять:

- hero layout
- stat cards styling
- final CTA styling

Требует schema/import changes:

- новый editable ROI block
- новый structured partner-offer block

## 6. `tenders`

Назначение:

- `/solutions/tenders`

Источник данных:

- `tenders-page`

Ключевые поля:

- `content_origin = managed`
- `hero_eyebrow`
- `hero_panel_items`
- `section_labels`
- FAQ
- CTA copy

Безопасно менять:

- vertical landing layout
- panel and fact styling

Требует schema/import changes:

- новый editable tender-specific block

## 7. `resource-hub`

Назначение:

- `/docs`
- `/help`
- `/academy`
- `/blog`
- `/status`

Источник данных:

- `landing-page`

Ключевые поля:

- `template_kind = resource_hub`
- `content_origin = managed`
- hero copy
- section labels
- FAQ
- CTA

Безопасно менять:

- hub cards
- chips
- story/feed layout

Требует schema/import changes:

- новый editable hub block type

## 8. `brand-content`

Назначение:

- `/media`
- `/team`
- `/conversation`
- `/tv`

Источник данных:

- `landing-page`

Ключевые поля:

- `template_kind = brand_content`
- `content_origin = managed`
- story/proof copy
- section labels
- CTA
- FAQ

Безопасно менять:

- editorial/brand layout
- story card styling

Требует schema/import changes:

- новый editable story collection block

## 9. `comparison`

Назначение:

- `/compare/[slug]`
- `/vs/[slug]`

Источник данных:

- `competitor`

Ключевые поля:

- `hero_eyebrow`
- `compare_summary`
- `compare_points`
- `advantages_title`
- `advantages_intro`
- `faq_title`
- `sticky_cta_title`
- `sticky_cta_text`
- `section_labels`

Безопасно менять:

- compare table layout
- summary card visual styling

Требует schema/import changes:

- новый editable compare structure
- новый comparison-specific block type

## 10. `campaign`

Назначение:

- `/promo`
- `/prozorro`

Источник данных:

- `landing-page`

Ключевые поля:

- `template_kind = campaign`
- `content_origin = managed`
- hero eyebrow
- section labels
- proof blocks
- CTA
- FAQ

Безопасно менять:

- campaign hero
- proof cards
- CTA block layout

Требует schema/import changes:

- новый editable campaign block

## Что обязательно проверять после изменения шаблона

1. Не стал ли шаблон источником пользовательского текста вместо CMS.
2. Не нарушился ли `template_kind` contract.
3. Не понадобилось ли новое schema/import поле.
4. Проходит ли:

```powershell
npm --prefix portal run build
```

5. Не сломались ли representative routes этого шаблона.

