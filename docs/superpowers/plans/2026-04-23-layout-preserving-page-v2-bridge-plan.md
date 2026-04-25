# Layout-Preserving `page_v2` Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перевести ownership контента в `Strapi/page_v2`, сохранив все существующие семейства макетов через bridge-адаптеры вместо общего `PageV2Page`.

**Architecture:** Route wrappers продолжают выбирать renderer family. Если route approved для новой схемы, wrapper берёт данные из `page_v2`, прогоняет их через family-specific bridge и рендерит старый проверенный компонент. Legacy source остаётся fallback до полного family parity.

**Tech Stack:** Strapi 5, Astro, Node.js scripts, legacy Astro page components, `page_v2`, `page_version`, route-level migration gate.

---

### Task 1: Зафиксировать безопасное локальное состояние

**Files:**
- Modify: `scripts/bulk-local-page-v2-cutover.mjs`
- Test: `tests/bulk-local-page-v2-cutover.test.mjs`
- Modify: `docs/superpowers/plans/2026-04-23-strapi-single-source-content-plan.md`

- [x] Добавить предохранитель против массового `activate-all-safe` без явного `unsafe`-флага.
- [x] Добавить тест, который подтверждает отказ без `--unsafe-allow-all-routes`.
- [x] Откатить локальный массовый cutover в rollback-safe состояние.

### Task 2: Сделать central bridge file для `page_v2 -> legacy props`

**Files:**
- Create: `portal/src/lib/page-v2-legacy-bridge.ts`
- Test: `tests/page-v2-legacy-bridge.test.mjs`

- [ ] Добавить базовые mapper functions для:
  - `hero`
  - `cards-grid`
  - `feature-list`
  - `steps`
  - `faq`
  - `internal-links`
  - `final-cta`
  - `proof-stats`
  - `pricing-plans`
  - `comparison-table`
  - `before-after`
- [ ] Реализовать family-level mapping:
  - `home`
  - `campaign`
  - `brand`
  - `resource`
  - `pricing`
  - `partnership`
  - `structured`
  - `tenders`
- [ ] Добавить тесты, которые проверяют преобразование representative `page_v2` payload в legacy shape.

### Task 3: Переключить managed wrappers на legacy renderer с bridge

**Files:**
- Modify: `portal/src/pages/index.astro`
- Modify: `portal/src/pages/promo.astro`
- Modify: `portal/src/pages/prozorro.astro`
- Modify: `portal/src/pages/media.astro`
- Modify: `portal/src/pages/team.astro`
- Modify: `portal/src/pages/conversation.astro`
- Modify: `portal/src/pages/tv.astro`
- Modify: `portal/src/pages/docs/index.astro`
- Modify: `portal/src/pages/help/index.astro`
- Modify: `portal/src/pages/academy/index.astro`
- Modify: `portal/src/pages/blog/index.astro`
- Modify: `portal/src/pages/status/index.astro`
- Modify: `portal/src/pages/pricing.astro`
- Modify: `portal/src/pages/partnership.astro`
- Modify: `portal/src/pages/demo.astro`
- Modify: `portal/src/pages/solutions/tenders.astro`

- [ ] Для `resolved.kind === 'page_v2'` перестать сразу рендерить `PageV2Page`.
- [ ] Вместо этого прокинуть `resolved.page` через `mapPageV2ToLegacyPage(...)`.
- [ ] Рендерить тот же family component, что и раньше.
- [ ] Оставить `PageV2Page` только для catch-all/new-native pages.

### Task 4: Переключить dynamic/detail/intersection wrappers на bridge

**Files:**
- Modify: `portal/src/pages/channels/[slug].astro`
- Modify: `portal/src/pages/industries/[slug].astro`
- Modify: `portal/src/pages/integrations/[slug].astro`
- Modify: `portal/src/pages/solutions/[slug].astro`
- Modify: `portal/src/pages/features/[slug].astro`
- Modify: `portal/src/pages/for/[slug].astro`
- Modify: `portal/src/pages/channels/[channel]/[industry].astro`
- Modify: `portal/src/pages/channels/[channel]/[integration].astro`
- Modify: `portal/src/pages/industries/[industry]/[solution].astro`
- Modify: `portal/src/pages/integrations/[integration]/[solution].astro`
- Modify: `portal/src/pages/for/[businessType]/[industry].astro`

- [ ] Для structured-family routes использовать `mapPageV2ToLegacyPage(page, 'structured')`.
- [ ] Сохранять текущий fallback на entity/importer source, если `page_v2` не active.
- [ ] Не менять route ownership policy для неутверждённых страниц.

### Task 5: Отдельно обработать directory/comparison families

**Files:**
- Modify: `portal/src/pages/channels/index.astro`
- Modify: `portal/src/pages/industries/index.astro`
- Modify: `portal/src/pages/integrations/index.astro`
- Modify: `portal/src/pages/solutions/index.astro`
- Modify: `portal/src/pages/features/index.astro`
- Modify: `portal/src/pages/for/index.astro`
- Modify: `portal/src/pages/compare/index.astro`
- Modify: `portal/src/pages/compare/[slug].astro`
- Modify: `portal/src/pages/vs/[slug].astro`
- Create or modify: `portal/src/components/DirectoryPage.astro`
- Create or modify: `portal/src/components/ComparisonPage.astro`

- [ ] Подтянуть page_v2-backed props для directory family без потери listing layout.
- [ ] Подтянуть page_v2-backed props для comparison family без потери compare layout.
- [ ] Оставить page-owned nav/sitemap, но renderer family-specific.

### Task 6: Зафиксировать route approval policy в коде и docs

**Files:**
- Modify: `docs/managed-route-migration.md`
- Modify: `docs/operator-guide.md`
- Modify: `docs/how-to-add-page.md`
- Modify: `docs/page-v2-manual-builder.md`

- [ ] Явно прописать, что approval переводит route на `page_v2-backed legacy renderer`, а не на общий `PageV2Page`.
- [ ] Обновить инструкции так, чтобы оператор не ожидал “новый шаблон для старых страниц”.
- [ ] Описать различие между `new-native page` и `migrated legacy page`.

### Task 7: Проверить локально ключевые family routes

**Files:**
- Test: `tests/page-v2.test.ts`
- Test: `tests/page-v2-migration.test.mjs`
- Test: `tests/navigation.test.ts`

- [ ] Прогнать `npm.cmd run test:contracts`.
- [ ] Прогнать `npm.cmd run check:docs-consistency`.
- [ ] Прогнать `npm.cmd --prefix cms run build`.
- [ ] Прогнать `npm.cmd --prefix portal run build`.
- [ ] Проверить локально маршруты:
  - `/`
  - `/promo`
  - `/pricing`
  - `/docs`
  - `/channels/whatsapp`
  - `/channels/email/amocrm`
  - `/compare`
  - `/vs/intercom`
  - `/solutions/tenders`

### Task 8: Подготовить следующий серверный этап без включения всего сайта

**Files:**
- Modify: `docs/manual-first-production-handoff.md`
- Modify: `docs/superpowers/plans/2026-04-23-strapi-single-source-content-plan.md`

- [ ] Зафиксировать, что на сервер идёт уже bridge-модель, а не universal renderer cutover.
- [ ] Сохранить правило: deploy можно делать, mass activation нельзя.
- [ ] Route-by-route approval оставляем обязательным даже после server rollout.
