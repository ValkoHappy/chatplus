# Архитектура CHATPLUS

## 1. Общая схема

Проект состоит из трех рабочих слоев:

1. `cms/` — Strapi, где хранится контент
2. `portal/` — Astro, где живут шаблоны, стили и рендер
3. `scripts/` + `cms/seed/` — генерационный слой для programmatic-контента

Текущий публичный demo-контур:

`local Strapi -> Astro build -> pages-preview -> GitHub Pages`

## 2. Структура репозитория

```text
CHATPLUS/
|- cms/
|- docs/
|- pages-preview/
|- portal/
|- scripts/
|- DEPLOY.md
`- README.md
```

### `portal/`

Главный публичный frontend.

Ключевые папки:

```text
portal/src/
|- components/   # шаблоны страниц и shared sections
|- layouts/      # глобальный shell
|- lib/          # fetchers, adapters, registry, navigation, helpers
|- pages/        # Astro routes
`- styles/       # глобальные стили и design tokens
```

### `cms/`

`Strapi 5` с контентными моделями:

- `landing-page`
- `site-setting`
- `channel`
- `industry`
- `integration`
- `solution`
- `feature`
- `business-type`
- `business-types-page`
- `competitor`
- `tenders-page`

### `scripts/`

Слой генерации, импорта и repair-утилит.

Главный operational script:

- [scripts/seed-runtime-content.mjs](../scripts/seed-runtime-content.mjs)

После декомпозиции он остается CLI orchestrator, а внутренняя логика разнесена по:

- `scripts/seed-runtime-content/env.mjs`
- `scripts/seed-runtime-content/ownership.mjs`
- `scripts/seed-runtime-content/rules.mjs`
- `scripts/seed-runtime-content/normalizers.mjs`
- `scripts/seed-runtime-content/validators.mjs`
- `scripts/seed-runtime-content/strapi-client.mjs`

## 3. Архитектура фронтенда

### Layout layer

Глобальный shell:

- [Base.astro](../portal/src/layouts/Base.astro)

Он отвечает за:

- `<head>` и мета-теги
- header
- desktop navigation
- burger/mobile navigation
- footer
- sticky CTA
- легкий client-side UI behavior

### Data access layer

Главный gateway к CMS:

- [strapi.ts](../portal/src/lib/strapi.ts)

Он отвечает за:

- запросы к Strapi
- нормализацию массивов и nullable-полей
- нормализацию `template_kind`
- нормализацию `content_origin`
- нормализацию FAQ, compare rows, section labels, proof facts и похожих structured blocks

Page adaptation layer:

- [page-adapters.ts](../portal/src/lib/page-adapters.ts)

Этот файл теперь остается public facade, а внутренняя логика разложена по:

- `portal/src/lib/page-adapters/shared.ts`
- `portal/src/lib/page-adapters/details.ts`
- `portal/src/lib/page-adapters/intersections.ts`
- `portal/src/lib/page-adapters/specialized.ts`

### Registry layer

Route-to-template registry:

- [page-template-map.ts](../portal/src/lib/page-template-map.ts)

Это источник правды для того, какой шаблон обслуживает какой тип маршрута.

## 4. Активная шаблонная система

В проекте 10 активных шаблонов:

- `home`
- `structured`
- `directory`
- `pricing`
- `partnership`
- `tenders`
- `resource-hub`
- `brand-content`
- `comparison`
- `campaign`

Реализация:

- [HomePage.astro](../portal/src/components/HomePage.astro)
- [StructuredLandingPage.astro](../portal/src/components/StructuredLandingPage.astro)
- [DirectoryPage.astro](../portal/src/components/DirectoryPage.astro)
- [PricingPage.astro](../portal/src/components/PricingPage.astro)
- [PartnershipPage.astro](../portal/src/components/PartnershipPage.astro)
- [TendersPage.astro](../portal/src/components/TendersPage.astro)
- [ResourceHubPage.astro](../portal/src/components/ResourceHubPage.astro)
- [BrandContentPage.astro](../portal/src/components/BrandContentPage.astro)
- [ComparisonPage.astro](../portal/src/components/ComparisonPage.astro)
- [CampaignPage.astro](../portal/src/components/CampaignPage.astro)

Подробный контракт:

- [template-contracts.md](template-contracts.md)

## 5. Shared sections

Ключевые shared-компоненты:

- [FaqSection.astro](../portal/src/components/FaqSection.astro)
- [InternalLinksSection.astro](../portal/src/components/InternalLinksSection.astro)
- [NavigationGroupsSection.astro](../portal/src/components/NavigationGroupsSection.astro)
- [ChatIllustration.astro](../portal/src/components/ChatIllustration.astro)

## 6. Контентная архитектура

### Generator-owned слой

Источник истины:

- `cms/seed/*.json`
- `scripts/seed-runtime-content.mjs` как orchestration entrypoint

Используется для:

- channels
- industries
- integrations
- solutions
- features
- business types
- competitors
- generated landing pages

### Managed слой

Источник истины:

- Strapi admin

Используется для:

- home
- resource pages
- brand/content pages
- campaign pages
- pricing
- partnership
- другие singleton pages, если они переведены в managed-режим

### Ownership flags

Ключевые поля:

- `template_kind`
- `content_origin`

Значения `content_origin`:

- `generated`
- `managed`

Смысл:

- `generated` можно безопасно обновлять генератором
- `managed` нельзя перезаписывать генератором после bootstrap-этапа

## 7. Маршрутный слой

### Managed singleton pages

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
- `/pricing`
- `/partnership`
- `/demo`

### Catalog pages

- `/channels`
- `/industries`
- `/integrations`
- `/solutions`
- `/features`
- `/for`

### Programmatic/detail pages

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
- `/compare/[slug]`
- `/vs/[slug]`

### Technical/supporting pages

- `/compare`
- `/site-map`
- `/dev`

## 8. Build и QA

Основная команда:

```powershell
npm.cmd --prefix portal run build
```

Она включает:

1. `astro build`
2. `check-content-quality.mjs`
3. `check-internal-links.mjs`
4. `check-encoding.mjs`

## 9. Деплой

### Сейчас

- local Strapi
- `seed-content` при необходимости
- `snapshot:github-demo`
- публикация `pages-preview/`
- GitHub Pages

### Потом

- hosted Strapi
- CI build from live CMS
- deploy artifact

Operational details:

- [DEPLOY.md](../DEPLOY.md)
