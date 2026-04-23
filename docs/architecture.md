# Архитектура CHATPLUS

## 1. Общая схема

Проект состоит из трех рабочих слоев:

1. `cms/` — Strapi, где хранится контент
2. `portal/` — Astro, где живут шаблоны, стили и рендер
3. `scripts/` + `cms/seed/` — генерационный слой для programmatic-контента

Текущий основной production-контур:

`Strapi + Postgres + uploads on VPS -> Astro build -> static artifact on VPS -> nginx`

Optional legacy demo-контур:

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

### Слой layout

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

### Слой доступа к данным

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

### Слой реестров

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

## 5. Общие секции

Ключевые shared-компоненты:

- [FaqSection.astro](../portal/src/components/FaqSection.astro)
- [InternalLinksSection.astro](../portal/src/components/InternalLinksSection.astro)
- [NavigationGroupsSection.astro](../portal/src/components/NavigationGroupsSection.astro)
- [ChatIllustration.astro](../portal/src/components/ChatIllustration.astro)

## 6. Контентная архитектура

### Слой imported

Источник live-данных:

- записи в `Strapi`

Источник bootstrap/generation payload:

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
- programmatic landing families

### Слой managed

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

### Слой settings

Источник истины:

- singleton/system records в Strapi

Используется для:

- site-wide settings
- shared operational CMS values

### Флаги ownership

Ключевые поля:

- `template_kind`
- `content_origin`

В новой operational-модели важнее поле `record_mode`:

- `managed`
- `imported`
- `settings`

`content_origin` остается только как legacy compatibility flag.

## 7. Маршрутный слой

### Managed singleton-страницы

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

### Каталоговые страницы

- `/channels`
- `/industries`
- `/integrations`
- `/solutions`
- `/features`
- `/for`

### Programmatic/detail-страницы

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

### Технические и вспомогательные страницы

- `/compare`
- `/site-map`
- `/dev`

## 8. Сборка и QA

Основная команда:

```powershell
npm --prefix portal run build
```

Она включает:

1. `astro build`
2. `check-content-quality.mjs`
3. `check-internal-links.mjs`
4. `check-encoding.mjs`

## 9. Деплой

### Сейчас

- `Strapi + Postgres + uploads` на VPS
- `seed-content` при необходимости
- `build-portal.sh` для production rebuild
- `nginx` отдает актуальный static artifact
- publish automation по умолчанию идет через `Strapi webhook -> relay -> local rebuild -> deploy на VPS`

### Опциональная demo-витрина

- local Strapi
- `snapshot:github-demo`
- публикация `pages-preview/`
- GitHub Pages только как showcase-витрина

Operational details:

- [DEPLOY.md](../DEPLOY.md)

