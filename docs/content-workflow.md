# Контентный workflow CHATPLUS

## 1. Главная идея

Контентный pipeline проекта выглядит так:

`cms/seed/*.json -> scripts/seed-runtime-content.mjs -> cms/seed/generated/*.json -> Strapi -> Astro build`

Это защита проекта от дрейфа между:

- seeds
- Strapi
- frontend

## 2. Три класса контента

### Programmatic content

Создается только через seeds/generator.

Сюда относятся:

- channels
- industries
- integrations
- solutions
- features
- business types
- competitors
- generated landing pages

Для этого слоя:

- source of truth = `cms/seed/*.json`
- ownership = `content_origin = generated`

### Managed singleton content

Редактируется напрямую в Strapi.

Сюда относятся:

- `/`
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
- `/pricing`
- `/partnership`
- `/solutions/tenders`, если он ведется как managed singleton

Для этого слоя:

- source of truth = Strapi admin
- ownership = `content_origin = managed`

### Global content

Живет в `site-setting`.

Сюда относятся:

- header/footer
- global labels
- template defaults
- generator defaults
- shared CTA defaults

## 3. Где править что

### Править seeds, если:

- добавляется новый `solution`
- добавляется новый `industry`
- добавляется новый `integration`
- добавляется новый `competitor`
- одна и та же проблема затрагивает много generated-страниц
- правка относится к generator-owned family

### Править Strapi, если:

- страница managed
- правка точечная и относится к одной singleton page
- контентом должен управлять редактор или маркетолог

### Править frontend, если:

- меняется верстка
- меняется шаблон
- меняется адаптив
- меняется rendering logic
- меняется normalization/fallback behavior

## 4. Основной generator/import script

Operational entry point:

- [seed-runtime-content.mjs](../scripts/seed-runtime-content.mjs)

Он отвечает за:

- чтение source seeds
- materialization данных для Strapi
- validation content contracts
- upsert/import в Strapi
- соблюдение правил `generated` / `managed`

## 5. Source-level и generated-level файлы

### Source-level

Редактируются вручную:

- `cms/seed/channels.json`
- `cms/seed/industries.json`
- `cms/seed/integrations.json`
- `cms/seed/solutions.json`
- `cms/seed/features.json`
- `cms/seed/businessTypes.json`
- `cms/seed/competitors.json`

### Generated-level

Не считаются местом ручного редактирования:

- `cms/seed/generated/channels.json`
- `cms/seed/generated/industries.json`
- `cms/seed/generated/integrations.json`
- `cms/seed/generated/solutions.json`
- `cms/seed/generated/features.json`
- `cms/seed/generated/businessTypes.json`
- `cms/seed/generated/competitors.json`
- `cms/seed/generated/landingPages.json`
- `cms/seed/generated/siteSetting.json`
- `cms/seed/generated/tendersPage.json`

Если проблема системная, исправлять нужно source/generator-слой, а не generated JSON руками.

## 6. Import/upsert rules

Текущие правила:

- upsert по slug
- generated records можно обновлять повторно
- managed records нельзя silently overwrite как generator-owned контент
- managed records можно bootstrap-нуть, если они отсутствуют
- import должен быть идемпотентным
- данные валидируются до записи

Дополнительная важная логика:

- когда появляются новые source-owned template fields, импорт может безопасно дозаполнить ими существующие managed-записи без полного overwrite

## 7. Минимальные правила валидации

Перед импортом должны проверяться:

- уникальность slug
- валидность `template_kind`
- валидность `content_origin`
- наличие обязательных полей
- согласованность `generated` / `managed`

## 8. Как добавить новую generated page

1. Добавить запись в нужный `cms/seed/*.json`.
2. Запустить:

```powershell
npm.cmd run seed-content
```

3. Проверить, что запись появилась или обновилась в Strapi.
4. Собрать фронтенд:

```powershell
npm.cmd --prefix portal run build
```

5. Проверить route локально.

## 9. Как добавить managed singleton page

1. Создать запись в Strapi.
2. Выставить:
   - `template_kind`
   - `content_origin = managed`
3. Заполнить hero, section labels, FAQ, CTA и metadata.
4. Проверить, что slug реально поддерживается route/template mapping.
5. Прогнать build.
6. Проверить страницу локально.

Подробный практический сценарий:

- [how-to-add-page.md](how-to-add-page.md)

## 10. Какие шаблонные блоки уже переведены в CMS-owned

- `HomePage` proof bar -> `proof_facts`
- `PricingPage` hero panel -> `hero_panel_items`
- `PricingPage` pricing cards -> `pricing_tiers`
- `PricingPage` supporting proof cards -> `proof_cards`
- `TendersPage` hero panel stream -> `hero_panel_items`
- `PartnershipPage` helper labels -> `section_labels`

## 11. Что нельзя делать

- создавать generator-owned записи руками в Strapi
- редактировать generated JSON как основной рабочий метод
- хардкодить пользовательский текст в шаблон, если блок уже CMS-owned
- менять `content_origin` без понимания ownership-последствий

## 12. Частые команды

Обновить content layer:

```powershell
npm.cmd run seed-content
```

Проверить сборку:

```powershell
npm.cmd --prefix portal run build
```

Проверить локально:

```powershell
npm.cmd --prefix portal run dev -- --host 127.0.0.1
```

## 13. Связанные документы

- [CMS-модель](cms-model.md)
- [Контракты шаблонов](template-contracts.md)
- [Контракт безопасных изменений](change-safety.md)
- [AI Generation для блоков](ai-block-generation.md)
- [Гайд оператора](operator-guide.md)
- [Деплой](../DEPLOY.md)
