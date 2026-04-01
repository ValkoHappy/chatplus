# Контракты шаблонов

Этот документ нужен для инженера или другой нейросети. Его задача — убрать догадки: какой шаблон что рендерит, откуда берет данные и что можно менять безопасно.

## Общие правила

Для любого шаблона:

- шаблон владеет версткой и поведением
- CMS владеет пользовательским текстом и structured content
- fallback-и допустимы только как safety layer, а не как главный источник истины

## 1. `home`

Назначение: только `/`.

Источник данных:

- `landing-page`

Обязательные поля:

- `slug`
- `template_kind = home`
- `content_origin = managed`
- hero title/subtitle

Желательные поля:

- `hero_eyebrow`
- `proof_facts`
- `section_labels`
- FAQ / CTA copy

## 2. `structured`

Назначение:

- detail/SEO pages
- intersections
- `/demo`

Источник данных:

- catalog entities
- generated landing content

Обязательные поля:

- slug
- content for hero/problem/solution flow

Желательные поля:

- `hero_eyebrow`
- `section_labels`
- FAQ
- internal links

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

## 4. `pricing`

Назначение: `/pricing`.

Источник данных:

- `landing-page` managed record

Ключевые поля:

- `hero_panel_items`
- `pricing_tiers`
- `proof_cards`
- `section_labels`
- bottom CTA copy

## 5. `partnership`

Назначение: `/partnership`.

Источник данных:

- `landing-page` managed record

Ключевые поля:

- `hero_eyebrow`
- `section_labels`
- ROI/comparison labels
- FAQ / CTA copy

## 6. `tenders`

Назначение: `/solutions/tenders`.

Источник данных:

- `tenders-page`

Ключевые поля:

- `content_origin`
- `hero_eyebrow`
- `hero_panel_items`
- `section_labels`

## 7. `resource-hub`

Назначение:

- `/docs`
- `/help`
- `/academy`
- `/blog`
- `/status`

Источник данных:

- `landing-page` managed records

Ключевые поля:

- `template_kind = resource_hub`
- `content_origin = managed`
- hero copy
- section labels
- FAQ / CTA

## 8. `brand-content`

Назначение:

- `/media`
- `/team`
- `/conversation`
- `/tv`

Источник данных:

- `landing-page` managed records

Ключевые поля:

- `template_kind = brand_content`
- `content_origin = managed`
- story/proof copy
- section labels
- CTA / FAQ

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

## 10. `campaign`

Назначение:

- `/promo`
- `/prozorro`

Источник данных:

- `landing-page` managed records

Ключевые поля:

- `template_kind = campaign`
- `content_origin = managed`
- hero eyebrow
- section labels
- proof blocks
- CTA / FAQ

## Что обязательно проверять после изменения шаблона

1. Не стал ли шаблон источником пользовательского текста вместо CMS.
2. Не нарушился ли `template_kind` contract.
3. Не понадобилось ли новое поле schema/import layer.
4. Проходит ли:

```powershell
npm.cmd --prefix portal run build
```

5. Не сломались ли representative routes этого шаблона.
