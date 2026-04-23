# Карта файлов CHATPLUS

Быстрая карта проекта: куда идти, если нужно найти конкретную логику.

## 1. Общая структура

- `portal/` — frontend на Astro
- `cms/` — Strapi schema и CMS-данные
- `scripts/` — generator/import/export scripts
- `docs/` — handoff и runbooks
- `pages-preview/` — demo snapshot

## 2. Фронтенд

### Layout-слой и глобальная обвязка

- `portal/src/layouts/Base.astro` — header, footer, глобальный layout
- `portal/src/styles/global.css` — глобальные стили

### Активные шаблоны страниц

- `portal/src/components/HomePage.astro`
- `portal/src/components/StructuredLandingPage.astro`
- `portal/src/components/DirectoryPage.astro`
- `portal/src/components/PricingPage.astro`
- `portal/src/components/PartnershipPage.astro`
- `portal/src/components/TendersPage.astro`
- `portal/src/components/ResourceHubPage.astro`
- `portal/src/components/BrandContentPage.astro`
- `portal/src/components/ComparisonPage.astro`
- `portal/src/components/CampaignPage.astro`

### Общие секции

- `portal/src/components/FaqSection.astro`
- `portal/src/components/InternalLinksSection.astro`
- `portal/src/components/NavigationGroupsSection.astro`
- `portal/src/components/ChatIllustration.astro`

### Доступ к данным и адаптеры

- `portal/src/lib/strapi.ts` — fetch и нормализация данных из Strapi
- `portal/src/lib/page-adapters.ts` — public facade для adapters; старый import path сохранен
- `portal/src/lib/page-adapters/shared.ts` — shared adapter utils и helper builders
- `portal/src/lib/page-adapters/details.ts` — detail adapters для channel/industry/integration/feature/solution/business type
- `portal/src/lib/page-adapters/intersections.ts` — adapters для intersection-страниц
- `portal/src/lib/page-adapters/specialized.ts` — specialized adapters для comparison/directory и похожих кейсов
- `portal/src/lib/page-template-map.ts` — route/template registry
- `portal/src/lib/special-pages.ts` — compatibility/meta-layer для special pages
- `portal/src/lib/navigation.ts` — навигация
- `portal/src/lib/link-sections.ts` — internal link sections

## 3. CMS

### Главные content-типы

- `cms/src/api/landing-page/content-types/landing-page/schema.json`
- `cms/src/api/competitor/content-types/competitor/schema.json`
- `cms/src/api/site-setting/content-types/site-setting/schema.json`
- `cms/src/api/tenders-page/content-types/tenders-page/schema.json`

### Сгенерированные определения типов

- `cms/types/generated/contentTypes.d.ts`

## 4. Seed-данные и materialized-data

### Seed-данные уровня источника

- `cms/seed/channels.json`
- `cms/seed/industries.json`
- `cms/seed/integrations.json`
- `cms/seed/features.json`
- `cms/seed/solutions.json`
- `cms/seed/competitors.json`

### Снимки сгенерированного уровня

Materialized snapshot-слой, а не ручной рабочий источник истины:

- `cms/seed/generated/channels.json`
- `cms/seed/generated/industries.json`
- `cms/seed/generated/integrations.json`
- `cms/seed/generated/features.json`
- `cms/seed/generated/solutions.json`
- `cms/seed/generated/businessTypes.json`
- `cms/seed/generated/competitors.json`
- `cms/seed/generated/landingPages.json`
- `cms/seed/generated/siteSetting.json`
- `cms/seed/generated/tendersPage.json`

## 5. Scripts

### Генерация, импорт и экспорт

- `scripts/seed-runtime-content.mjs` — CLI orchestrator и public entrypoint для `seed-content`
- `scripts/seed-runtime-content/env.mjs` — загрузка `.env` и JSON source-файлов
- `scripts/seed-runtime-content/ownership.mjs` — merge/ownership rules для `imported`, `managed` и legacy compatibility-слоя
- `scripts/seed-runtime-content/rules.mjs` — константы, singleton maps и helper inferrers
- `scripts/seed-runtime-content/normalizers.mjs` — normalizers и preparers для seed/runtime контента
- `scripts/seed-runtime-content/validators.mjs` — validation слоя и top-level contract checks
- `scripts/seed-runtime-content/strapi-client.mjs` — Strapi request/upsert logic
- `scripts/export-from-strapi.mjs` — export materialized data обратно в legacy bootstrap-слой `cms/seed/generated`

### QA фронтенда

- `portal/scripts/check-content-quality.mjs`
- `portal/scripts/check-internal-links.mjs`
- `portal/scripts/check-encoding.mjs`

## 6. Документация

- `docs/index.md` — главная карта docs
- `docs/architecture.md` — архитектура
- `docs/cms-model.md` — CMS-модель
- `docs/content-workflow.md` — ownership и generator/import flow
- `docs/template-contracts.md` — contracts по 10 шаблонам
- `docs/route-ownership-matrix.md` — route -> template -> ownership
- `docs/change-safety.md` — safe-change rules
- `docs/how-to-add-page.md` — runbooks по новым страницам и шаблонам
- `docs/publishing-checklist.md` — publish checklist
- `docs/operator-guide.md` — operator flow
- `docs/glossary.md` — словарь терминов
- `docs/troubleshooting.md` — типовые проблемы
- `docs/release-flow.md` — линейный release runbook
- `docs/known-risks.md` — текущие ограничения и осознанные риски

## 7. Если нужно найти что-то очень быстро

### Где меняется шаблон маршрута

- `portal/src/lib/page-template-map.ts`

### Где меняется ownership-логика

- `scripts/seed-runtime-content/ownership.mjs`
- `scripts/seed-runtime-content/rules.mjs`
- `docs/route-ownership-matrix.md`

### Где меняются fallback-и и адаптация данных

- `portal/src/lib/page-adapters.ts` как facade
- `portal/src/lib/page-adapters/shared.ts`
- `portal/src/lib/page-adapters/details.ts`
- `portal/src/lib/page-adapters/intersections.ts`
- `portal/src/lib/page-adapters/specialized.ts`

### Где менять Open Graph / глобальную SEO-обвязку

- `portal/src/layouts/Base.astro`

### Где искать, почему page contract сломан

- `docs/template-contracts.md`
- `docs/change-safety.md`
- `scripts/seed-runtime-content/validators.mjs`
- `scripts/seed-runtime-content/rules.mjs`

### Где искать, почему Strapi import/upsert ведет себя не так

- `scripts/seed-runtime-content/strapi-client.mjs`
- `scripts/seed-runtime-content/ownership.mjs`
- `scripts/seed-runtime-content.mjs`

### Где смотреть поток публикации

- `docs/release-flow.md`
- `docs/publishing-checklist.md`
- `DEPLOY.md`
