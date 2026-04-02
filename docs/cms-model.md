# CMS-модель CHATPLUS

## 1. Назначение

CMS-модель нужна для того, чтобы:

- контент редактировался в предсказуемом месте
- `generated` и `managed`-контент не конфликтовали
- frontend не становился вторым источником истины
- новые страницы можно было добавлять без ручной путаницы

## 2. Основной принцип

В проекте действует CMS-first модель с разделением ownership:

- `generated` — контентом владеет seed/generator pipeline
- `managed` — контентом владеет Strapi

Frontend владеет только:

- шаблонами
- стилями
- layout
- адаптивом
- render-логикой
- normalization/fallback layer

## 3. Главные content types

### `landing-page`

Используется для:

- home
- resource pages
- brand/content pages
- campaign pages
- части специальных singleton pages
- части generated landing pages

Ключевые поля:

- `slug`
- `template_kind`
- `content_origin`
- `hero_eyebrow`
- `hero_variant`
- `hero_highlights_label`
- `hero_highlights`
- `hero_panel_items`
- `proof_facts`
- `pricing_tiers`
- `proof_cards`
- `section_labels`
- `quote_title`
- `quote_text`
- `quote_author`
- `presentation_flags`

### `competitor`

Используется для:

- `/compare/[slug]`
- `/vs/[slug]`

Ключевые поля:

- `slug`
- `content_origin`
- `hero_eyebrow`
- `compare_summary`
- `compare_points`
- `advantages_title`
- `advantages_intro`
- `faq_title`
- `sticky_cta_title`
- `sticky_cta_text`
- `section_labels`

### `site-setting`

Используется для:

- header/footer
- global labels
- template defaults
- generator defaults

Ключевые поля:

- `template_defaults`
- `special_page_defaults`
- `global_labels`
- `generator_defaults`

### `tenders-page`

Отдельный singleton content type для `/solutions/tenders`.

Ключевые поля:

- `content_origin`
- `hero_eyebrow`
- `hero_panel_items`
- `section_labels`

## 4. Поле `content_origin`

Допустимые значения:

- `generated`
- `managed`

### `generated`

Означает:

- запись создается и обновляется генератором
- ручные правки в Strapi считаются небезопасными
- при повторном импорте генератор может обновить поля записи

### `managed`

Означает:

- запись редактируется вручную в Strapi
- генератор может bootstrap-нуть ее, если записи еще нет
- после создания генератор не должен затирать ее как generator-owned контент
- допускается безопасное дозаполнение новыми source-owned полями, если это предусмотрено import-логикой

## 5. Поле `template_kind`

Для `landing-page` используется выбор шаблона через `template_kind`.

Активные значения:

- `home`
- `structured`
- `resource_hub`
- `brand_content`
- `campaign`
- `generic`

## 6. Что считается CMS-owned

В Strapi должны жить:

- hero text
- eyebrow и labels
- section titles и intros
- CTA text
- FAQ title и items
- compare narrative text
- proof/stat labels
- pricing tiers, hero panel items, proof cards, если они уже объявлены CMS-owned

В Strapi не должны жить:

- CSS-параметры
- цвета
- отступы
- тени
- визуальные токены
- микро-варианты UI, которые относятся к верстке, а не к контенту

## 7. Что считается frontend-owned

Во frontend остаются:

- компоненты и шаблоны
- layout
- responsive behavior
- shared styles
- normalization/adapters
- fallback-и
- shared UI logic

Если блок уже объявлен CMS-owned, frontend не должен оставаться его главным источником текста.

## 8. Правила импорта

Текущая operational-логика импорта живет в:

- [seed-runtime-content.mjs](../scripts/seed-runtime-content.mjs)

Это public CLI entrypoint. После декомпозиции внутренняя логика разнесена по:

- `scripts/seed-runtime-content/ownership.mjs`
- `scripts/seed-runtime-content/rules.mjs`
- `scripts/seed-runtime-content/normalizers.mjs`
- `scripts/seed-runtime-content/validators.mjs`
- `scripts/seed-runtime-content/strapi-client.mjs`

Правила:

- upsert по slug
- validation до импорта
- `generated` записи обновляются генератором
- `managed` записи не перезаписываются как generator-owned контент
- допускается bootstrap create для отсутствующей managed-записи
- import должен быть идемпотентным

## 9. Когда расширять schema

Schema расширяется только если:

- появился новый CMS-owned блок
- появился новый `template_kind`
- существующему шаблону нужны новые редактируемые поля
- новый data contract нельзя выразить через уже существующие поля

Schema не расширяется для:

- чисто визуальных правок
- spacing/layout-only изменений
- локальных стилистических улучшений

## 10. Связанные документы

- [Контентный workflow](content-workflow.md)
- [Контракты шаблонов](template-contracts.md)
- [Контракт безопасных изменений](change-safety.md)
- [Гайд оператора](operator-guide.md)
