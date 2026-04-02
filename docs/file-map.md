# File Map CHATPLUS

Быстрая карта проекта: куда идти, если нужно найти конкретную логику.

## 1. Общая структура

- `portal/` — frontend на Astro
- `cms/` — Strapi schema и CMS-данные
- `scripts/` — generator/import/export scripts
- `docs/` — handoff и runbooks
- `pages-preview/` — demo snapshot

## 2. Frontend

### Layout и глобальная обвязка

- `portal/src/layouts/Base.astro` — header, footer, глобальный layout
- `portal/src/styles/global.css` — глобальные стили

### Активные page templates

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

### Shared sections

- `portal/src/components/FaqSection.astro`
- `portal/src/components/InternalLinksSection.astro`
- `portal/src/components/NavigationGroupsSection.astro`
- `portal/src/components/ChatIllustration.astro`

### Data access и adapters

- `portal/src/lib/strapi.ts` — fetch и нормализация данных из Strapi
- `portal/src/lib/page-adapters.ts` — приведение сущностей к template-friendly форме
- `portal/src/lib/page-template-map.ts` — route/template registry
- `portal/src/lib/special-pages.ts` — compatibility/meta-layer для special pages
- `portal/src/lib/navigation.ts` — навигация
- `portal/src/lib/link-sections.ts` — internal link sections

## 3. CMS

### Главные content types

- `cms/src/api/landing-page/content-types/landing-page/schema.json`
- `cms/src/api/competitor/content-types/competitor/schema.json`
- `cms/src/api/site-setting/content-types/site-setting/schema.json`
- `cms/src/api/tenders-page/content-types/tenders-page/schema.json`

### Generated type definitions

- `cms/types/generated/contentTypes.d.ts`

## 4. Seeds и materialized data

### Source-level seeds

- `cms/seed/channels.json`
- `cms/seed/industries.json`
- `cms/seed/integrations.json`
- `cms/seed/features.json`
- `cms/seed/solutions.json`
- `cms/seed/competitors.json`

### Generated-level snapshots

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

### Generator/import/export

- `scripts/seed-runtime-content.mjs` — главный generator/import контракт
- `scripts/export-from-strapi.mjs` — export materialized data обратно в `cms/seed/generated`

### Frontend QA

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

- `scripts/seed-runtime-content.mjs`
- `docs/route-ownership-matrix.md`

### Где меняются fallback-и и адаптация данных

- `portal/src/lib/page-adapters.ts`

### Где менять Open Graph / global SEO shell

- `portal/src/layouts/Base.astro`

### Где искать, почему page contract сломан

- `docs/template-contracts.md`
- `docs/change-safety.md`
- `scripts/seed-runtime-content.mjs`

### Где смотреть publish flow

- `docs/release-flow.md`
- `docs/publishing-checklist.md`
- `DEPLOY.md`
