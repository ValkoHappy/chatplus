# Strapi Single Source Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Strapi the only source of content for every public URL while keeping legacy templates as a temporary rollback-safe renderer until every route passes layout parity.

**Architecture:** Strapi owns page records, sections, SEO, navigation, sitemap, breadcrumbs, blueprints, versions, and AI drafts. Astro first asks for a safe-approved `page_v2`; if the page is not approved for migration, Astro renders the existing legacy template as fallback. Migration is route-by-route: materialize draft, validate parity, publish, approve, smoke test, then later remove legacy only after production stability.

**Tech Stack:** Strapi 5, Astro, PostgreSQL, Node.js scripts, `page_v2`, `page_blueprint`, `page_version`, `generation_job`, existing legacy Astro templates as fallback.

---

## Control Rule

This document is the source of truth for the remaining migration. Before any implementation, server deploy, Strapi publish, route approval, AI cron enablement, or legacy cleanup, return to this file and update the relevant checkbox.

Execution priority:

1. Finish the technical Strapi/page_v2 migration layer first: Tasks 1-8.
2. Do not start operator documentation simplification until the Strapi flow is technically complete.
3. After Tasks 1-8 are complete and verified, do Task 9 so the final instructions match the real system.
4. Only after that continue with secrets and later legacy cleanup.

The project is not considered fully migrated until:

- [x] `npm.cmd run page-v2:materialize:report` reports `needs_work=0`.
- [ ] Live Strapi contains `page_v2` records for every public URL.
- [x] Local Strapi contains `page_v2` records for every current public URL.
- [x] Each local migrated route has passed visual/layout parity smoke.
- [x] Each local migrated route now has `published + editorial_status=approved + migration_ready=true + parity_status=approved`.
- [x] Locally, legacy templates are renderer/fallback only; managed migration tooling now treats existing `page_v2` as canonical source and uses legacy only for bootstrap when `page_v2` does not exist yet.
- [x] AI scheduled generation creates drafts only and never publishes directly.
- [ ] Secret rotation is completed or explicitly documented as deferred with a reason.

---

## Current Local Status

Last verified locally on 2026-04-23:

- [x] `page_v2` exists as the universal page content type.
- [x] `page_blueprint` exists as a Strapi content type.
- [x] `page_version` exists as a Strapi content type.
- [x] `generation_job` exists for AI draft generation.
- [x] `page_v2` has migration safety fields: `migration_ready`, `parity_status`, `legacy_template_family`, `legacy_layout_signature`, `parity_notes`.
- [x] Frontend only renders `page_v2` when the page is safe-approved.
- [x] Legacy templates remain available as fallback.
- [x] Legacy managed, directory, structured detail/intersection, and comparison detail wrappers now use a layout-preserving bridge instead of the generic `PageV2Page`.
- [x] `PageV2Page` is now reserved for truly new catch-all pages and no longer replaces old route families by default.
- [x] Mass `--publish --all` is blocked by the materializer safety gate.
- [x] Local materializer writes dynamic-zone sections through Strapi Document Service, not public REST.
- [x] Local AI draft generator uses Strapi Document Service for draft-safe `generation_job` and `page_v2` updates when `STRAPI_URL` points to local Strapi.
- [x] Local report materializes 800 public routes.
- [x] New local catch-all page smoke passed: `/manual-test-page` rendered from Strapi with no route file, then was unpublished.
- [x] Local all-route materialization preflight passed: 800 drafts created, 0 published left after rollback cleanup.
- [x] Local route safety loop passed on `/promo`: `publish -> approve -> mark-not-ready -> unpublish`.
- [x] Local AI smoke passed:
  - `manual_request` created a draft-only page with `migration_ready=false`, `publishedAt=null`, and public route `404`
  - `scheduled` created a draft-only page with `generation_mode=ai_generated`, `publishedAt=null`, and public route `404`
  - unsupported blueprint (`pricing`) failed safely with `generation_job.status=failed` and no created page
- [x] Local ownership audit is available through `npm.cmd run page-v2:local:audit`.
- [x] Local ownership audit now reports the complete route set in active approved state:
  - `draft.total = 800`
  - `draft.approved_ready = 800`
  - `published.total = 800`
  - `published.approved_ready = 800`
  - representative routes now sit in `editorial_status=approved + migration_ready=true + parity_status=approved`
- [x] Local representative cutover smoke passed for:
  - `/`
  - `/promo`
  - `/pricing`
  - `/compare`
  - `/channels/email/amocrm`
  - `/industries/auto/retention`
  - `/site-map`
  - cycle verified: `publish -> approve -> HTTP 200 -> mark-not-ready -> fallback HTTP 200 -> unpublish`
- [x] Local bridge verification proved that approved `page_v2` routes can still render legacy layout families:
  - `/solutions` stayed on `DirectoryPage` layout
  - `/channels/email/amocrm` stayed on `StructuredLandingPage` layout
  - generic `pagev2-shell` markup did not replace those old route families
- [x] Local full safe cutover passed and remains active in the local workspace:
  - `npm.cmd run page-v2:local:bulk-cutover -- --activate-all-safe --unsafe-allow-all-routes --json`
  - verified snapshot after cutover: `draft_total = 800`, `published_total = 800`
  - follow-up audit confirms `draft.approved_ready = 800` and `published.approved_ready = 800`
  - route wrappers still preserve legacy family layouts while public ownership stays on approved `page_v2`
- [x] Local tests/builds passed:
  - `npm.cmd run test:contracts` -> 98/98 pass
  - `npm.cmd run check:docs-consistency` -> OK
  - `npm.cmd --prefix cms run build` -> OK
  - `npm.cmd --prefix portal run build` -> OK, 802 pages
  - internal link graph -> OK for all 800 public pages
- [x] Local `page_version` rollback is verified:
  - `node --env-file=.env scripts/rollback-page-v2-version.mjs --route=/promo` -> report OK
  - `node --env-file=.env scripts/rollback-page-v2-version.mjs --route=/promo --apply` restored a safe draft with `editorial_status=review`, `migration_ready=false`, `parity_status=unchecked`
  - route was then returned to approved local state through `page-v2:materialize -- --route=/promo --apply --publish` and `--approve`
- [x] Local mass-cutover safety was tightened after the regression:
  - `page-v2:local:bulk-cutover -- --activate-all-safe` without explicit route scoping is now blocked
  - full-route activation now requires either `--routes=/a,/b` or an explicit `--unsafe-allow-all-routes`
- [x] Managed migration tooling no longer depends on legacy managed records once a route already has `page_v2`:
  - `scripts/materialize-page-v2-routes.mjs` now reuses existing `page_v2` as canonical source for managed routes
  - `scripts/migrate-managed-pages-to-page-v2.mjs --route=/promo` now reports `"source":"page_v2"`
  - legacy managed records are now bootstrap-only for routes that do not yet exist in `page_v2`

Current local parity gaps:

- [x] `/` requires `proof-stats`.
- [x] `/compare` requires `comparison-table`, `faq`, `internal-links`.
- [x] `/vs/intercom` requires `internal-links`.
- [x] `/vs/respond-io` requires `internal-links`.
- [x] `/vs/wati` requires `internal-links`.
- [x] `/vs/zendesk` requires `internal-links`.
- [x] `/vs/tidio` requires `internal-links`.

Current materializer parity status:

- [x] `npm.cmd run page-v2:materialize:report` -> `total=800`, `needs_work=0`.

Local remaining work before server push:

- [x] We have a complete local draft set for all current public routes.
- [x] We have already proven that a complete local published-and-approved set can be produced for all current public routes.
- [x] Representative local route families have already been published and approved successfully during cutover smoke.
- [x] Local representative cutover smoke tooling is available through `npm.cmd run page-v2:local:cutover-smoke`.
- [x] We ran and reviewed a deliberate local representative cutover smoke for multiple route families, not only `/promo`.
- [x] Legacy fallback still works after `mark-not-ready` and `unpublish`.
- [x] Current local runtime state is page-first and still rollback-safe:
  - approved routes render from `page_v2` through legacy family layouts
  - if a route is later marked not ready or unpublished, the legacy wrapper still exists as fallback renderer
- [x] Local layout-preserving browser smoke is available through `npm.cmd run page-v2:local:layout-smoke`.
- [x] The default layout smoke is read-only: it reuses the current `portal/dist` build and does not write to Strapi, so it no longer creates hidden rollback or database-lock side effects. Use `npm.cmd run page-v2:local:layout-smoke:build` when a fresh rebuild inside the smoke is required.
- [x] Representative legacy family layout markers now pass locally for:
  - `/`
  - `/promo`
  - `/pricing`
  - `/docs`
  - `/media`
  - `/channels`
  - `/channels/email/amocrm`
  - `/compare`
  - `/compare/intercom`
  - `/vs/intercom`
  - `/solutions/tenders`
  - `/site-map`
  - `/features/ai-calendar`
- [x] Layout smoke confirms representative approved routes keep legacy family renderers and do not fall through to generic `pagev2-shell`.
- [x] Local documentation now has a clearer operator/editor entrypoint:
  - `docs/index.md` separates editor, operator, owner, and server handoff paths
  - `docs/operator-guide.md` explicitly separates local-only checks from server-only steps
  - `docs/manual-first-production-handoff.md` now states the honest safe local default state
  - `docs/local-readiness-checklist.md` lists the exact commands that must be green before any server work
- [ ] The server phase is still required to repeat this workflow on live Strapi and keep routes approved there permanently.

---

## File Map

### CMS Contracts

- `cms/src/api/page-v2/content-types/page-v2/schema.json`
  - Universal page schema, migration gate fields, relations, SEO/nav/sitemap fields.
- `cms/src/api/page-v2/content-types/page-v2/lifecycles.ts`
  - Publish/update validation and page version snapshot behavior.
- `cms/src/utils/page-v2-migration-gate.ts`
  - Shared safety validation for `migration_ready`.
- `cms/src/api/page-blueprint/`
  - CMS-owned blueprint model.
- `cms/src/api/page-version/`
  - Snapshot/version model for rollback.
- `cms/src/api/generation-job/`
  - AI generation job model.

### Frontend Rendering

- `portal/src/lib/strapi.ts`
  - `getPageV2Pages`, `getPageV2ByRoute`, `getManagedRoutePage`, `isPageV2Renderable`.
- `portal/src/lib/strapi-schemas.ts`
  - `page_v2` normalization and `is_migration_visible`.
- `portal/src/components/PageV2Page.astro`
  - Primary renderer for safe-approved `page_v2`.
- `portal/src/components/page-blocks/`
  - Section/block renderers.
- `portal/src/pages/**/*.astro`
  - Route wrappers that prefer safe-approved `page_v2` and fall back to legacy.

### Route And Blueprint Policy

- `config/page-v2-routes.mjs`
  - Public route policy, bridged paths, immutable reserved paths, enum values.
- `config/page-v2-blueprints.mjs`
  - Bootstrap/fallback blueprint registry.
- `config/page-v2-layout-parity.mjs`
  - Layout parity requirements by route family.

### Migration And AI Scripts

- `scripts/materialize-page-v2-routes.mjs`
  - Main route materializer for managed, system, directory, detail, comparison, and intersection pages.
- `scripts/sync-page-v2-blueprints.mjs`
  - Syncs code blueprint registry into Strapi `page_blueprint`.
- `scripts/rollback-page-v2-version.mjs`
  - Restores a `page_v2` draft from `page_version`.
- `scripts/generate-page-v2-drafts.mjs`
  - AI draft generation from `generation_job`.
- `scripts/page-v2-generation/legacy-managed-migration.mjs`
  - Legacy managed route to `page_v2` draft mapper.
- `scripts/page-v2-generation/shared.mjs`
  - Shared AI/materializer draft normalization.

### Tests And Docs

- `tests/page-v2.test.ts`
  - Schema, normalization, safety gate, lifecycle utility tests.
- `tests/page-v2-migration.test.mjs`
  - Managed migration and parity registry tests.
- `tests/page-v2-generation.test.mjs`
  - AI draft-only contract tests.
- `tests/navigation.test.ts`
  - Header/footer/sitemap integration tests.
- `docs/page-v2-manual-builder.md`
  - Editor-facing manual builder guide.
- `docs/managed-route-migration.md`
  - Safe migration runbook.
- `docs/operator-guide.md`
  - Operator workflow.
- `docs/manual-first-production-handoff.md`
  - Production handoff.

---

## Task 1: Close Local Layout Parity Gaps

**Purpose:** Make the local materializer produce clean drafts for all 800 current public routes without `needs_work`.

**Files:**

- Modify: `scripts/materialize-page-v2-routes.mjs`
- Modify: `scripts/page-v2-generation/legacy-managed-migration.mjs`
- Modify: `config/page-v2-layout-parity.mjs` only if the registry is too strict or inaccurate.
- Modify: `tests/page-v2-migration.test.mjs`

- [x] **Step 1: Add or confirm tests for home and comparison gaps**

Add assertions that `/`, `/compare`, and `/vs/intercom` produce required parity blocks.

Expected test intent:

```js
assert.equal(homeDraft.data.parity_status, 'unchecked');
assert.ok(homeDraft.data.sections.some((section) => section.__component === 'page-blocks.proof-stats'));

assert.equal(compareDraft.data.parity_status, 'unchecked');
assert.ok(compareDraft.data.sections.some((section) => section.__component === 'page-blocks.comparison-table'));
assert.ok(compareDraft.data.sections.some((section) => section.__component === 'page-blocks.faq'));
assert.ok(compareDraft.data.sections.some((section) => section.__component === 'page-blocks.internal-links'));

assert.equal(vsDraft.data.parity_status, 'unchecked');
assert.ok(vsDraft.data.sections.some((section) => section.__component === 'page-blocks.internal-links'));
```

- [x] **Step 2: Run tests for the new parity coverage**

Run:

```powershell
npm.cmd run test:contracts
```

Expected after implementation: tests pass and cover home proof stats, `/compare` comparison/FAQ/internal links, and `/vs/*` internal links.

- [x] **Step 3: Add `proof-stats` to home materialization**

In the managed route mapper, ensure `/` receives a `page-blocks.proof-stats` section sourced from legacy home metrics/proof content. If legacy has no explicit stats, generate conservative proof items from existing home section labels instead of inventing unsupported claims.

The section must use existing block schema fields only.

- [x] **Step 4: Add comparison parity blocks to `/compare`**

In the materializer path for comparison directory root, add:

- `page-blocks.comparison-table`
- `page-blocks.faq`
- `page-blocks.internal-links`

The comparison table should summarize comparison alternatives using existing competitor/entity facts. FAQ and internal links must come from existing generated/legacy content or safe generic navigation labels.

- [x] **Step 5: Add `internal-links` to `/vs/*` comparison detail pages**

Every `/vs/[slug]` page draft must include a `page-blocks.internal-links` section pointing to related comparison pages, `/compare`, and relevant product/catalog pages where available.

- [x] **Step 6: Run materializer report**

Run:

```powershell
npm.cmd run page-v2:materialize:report
```

Expected:

```text
total = 800
needs_work = 0
```

If the total changes because new routes were added, update this document with the new count and explain why.

- [x] **Step 7: Run full local verification**

Run:

```powershell
npm.cmd run test:contracts
npm.cmd run check:docs-consistency
npm.cmd --prefix cms run build
npm.cmd --prefix portal run build
git diff --check
```

Expected:

- tests pass
- docs consistency passes
- Strapi build passes
- Astro build passes
- no whitespace errors from `git diff --check`

---

## Task 2: Confirm Strapi Is The Only Content Source For New Pages

**Purpose:** Ensure brand-new pages can be created and edited entirely in Strapi without code changes.

**Files:**

- Review: `docs/how-to-add-page.md`
- Review: `docs/page-v2-manual-builder.md`
- Review: `portal/src/pages/[...page].astro`
- Review: `portal/src/lib/strapi.ts`

- [x] **Step 1: Create a local or test Strapi draft page**

Create one test `page_v2` record with:

```text
route_path = /manual-test-page
slug = manual-test-page
page_kind = campaign
template_variant = default
generation_mode = manual
source_mode = managed
editorial_status = approved
migration_ready = true
parity_status = approved
show_in_sitemap = false
sections = hero + rich-text + final-cta
```

This route is new, so it does not replace a legacy route.

- [x] **Step 2: Verify the route renders through catch-all**

Run portal locally and open:

```text
http://127.0.0.1:4321/manual-test-page
```

Expected:

- HTTP 200
- page content comes from Strapi
- no code route file was added
- no console errors

- [x] **Step 3: Remove or unpublish the test page**

Unpublish the test page after verification so it does not become production content.

Expected:

- `/manual-test-page` no longer appears in sitemap/nav
- no unrelated public route changes

---

## Task 3: Deploy Code To Server Without Migrating Routes Yet

**Purpose:** Put the new CMS models, frontend safety gate, and migration tooling on the server without switching old pages.

**Files:**

- Use repo state after local verification.
- Do not manually edit live generated files.

- [ ] **Step 1: Commit only after local verification**

Run:

```powershell
git status --short
git diff --check
npm.cmd run test:contracts
npm.cmd --prefix cms run build
npm.cmd --prefix portal run build
```

Expected: no failures.

- [ ] **Step 2: Push code**

Commit message:

```text
feat: add safe page_v2 single-source migration layer
```

Expected:

- GitHub receives code with CMS schemas and frontend safety gate.
- No live route migration has happened yet.

- [ ] **Step 3: Deploy server code**

On the server, update repo and rebuild services according to the existing VPS runbook.

Expected:

- Strapi admin opens.
- Public site opens.
- Legacy pages still render because no route has been approved yet.

- [ ] **Step 4: Verify server endpoints**

Run against live Strapi:

```text
/api/page-v2s
/api/page-blueprints
/api/page-versions
/api/generation-jobs
```

Expected:

- all return 200 with valid API token
- no placeholder secret bypass is required

---

## Task 4: Sync Blueprints To Live Strapi

**Purpose:** Make blueprints editable/visible in CMS while preserving code registry as bootstrap/fallback.

**Files:**

- Use: `scripts/sync-page-v2-blueprints.mjs`
- Source: `config/page-v2-blueprints.mjs`

- [ ] **Step 1: Preview blueprint sync**

Run:

```powershell
npm.cmd run page-v2:sync-blueprints:report
```

Expected:

- all blueprint ids are listed
- no invalid required/allowed block references

- [ ] **Step 2: Apply blueprint sync on live**

Run with live env:

```powershell
npm.cmd run page-v2:sync-blueprints
```

Expected:

- Strapi contains active `page_blueprint` records
- no existing pages are published or migrated by this step

---

## Task 5: Materialize Live Page Drafts For All Public Routes

**Purpose:** Create or update `page_v2` records for every public URL while keeping them invisible to public rendering until approval.

**Files:**

- Use: `scripts/materialize-page-v2-routes.mjs`

- [ ] **Step 1: Run live dry-run report**

Run:

```powershell
npm.cmd run page-v2:materialize:report
```

Expected:

- route count matches local expected count
- `needs_work=0`
- every generated draft has `migrationReady=false`

- [ ] **Step 2: Apply drafts without publish**

Run:

```powershell
npm.cmd run page-v2:materialize -- --all --apply
```

Expected:

- Strapi receives `page_v2` drafts
- public site does not switch to `page_v2`
- legacy pages still render

- [ ] **Step 3: Verify drafts do not enter public nav/sitemap**

Run:

```powershell
npm.cmd --prefix portal run build
```

Expected:

- build succeeds
- pages without safe approval do not become public `page_v2` catch-all pages
- legacy routes still exist

---

## Task 6: Publish And Approve Routes One By One

**Purpose:** Switch public pages to Strapi-owned content only after layout parity has been checked.

**Wave 1: lower-risk managed pages**

- [ ] `/promo`
- [ ] `/prozorro`
- [ ] `/media`
- [ ] `/team`
- [ ] `/conversation`
- [ ] `/tv`
- [ ] `/docs`
- [ ] `/help`
- [ ] `/academy`
- [ ] `/blog`
- [ ] `/status`

**Wave 2: commercial pages**

- [ ] `/pricing`
- [ ] `/partnership`

**Wave 3: highest-risk pages**

- [ ] `/`
- [ ] `/demo`
- [ ] `/solutions/tenders`

**Catalog and generated route families**

- [ ] Directory roots: `/channels`, `/industries`, `/integrations`, `/solutions`, `/features`, `/for`, `/compare`
- [ ] Entity detail pages
- [ ] Entity intersection pages
- [ ] Comparison detail pages: `/vs/*`, `/compare/*`
- [ ] System pages: `/site-map`, `/features/ai-calendar`

For every route:

- [ ] **Step 1: Publish the route record without approval**

Run:

```powershell
npm.cmd run page-v2:materialize -- --route=/example --publish
```

Expected:

- `page_v2` is published
- route still renders legacy because `migration_ready=false`

- [ ] **Step 2: Compare legacy and `page_v2` preview**

Check:

- hero layout
- CTA count and placement
- cards/steps/proof sections
- FAQ
- comparison/pricing/ROI blocks where relevant
- breadcrumbs
- SEO title and description
- nav/footer/sitemap settings
- mobile layout

- [ ] **Step 3: Approve only after parity is clean**

Run:

```powershell
npm.cmd run page-v2:materialize -- --route=/example --approve
```

Expected:

- `migration_ready=true`
- `parity_status=approved`
- frontend now renders `PageV2Page`

- [ ] **Step 4: Browser smoke**

Open:

```text
https://target-domain/example
```

Expected:

- HTTP 200
- no console errors
- visually acceptable parity
- page source/content comes from Strapi

- [ ] **Step 5: Rollback smoke on representative routes**

For at least one route per family, run:

```powershell
npm.cmd run page-v2:materialize -- --route=/example --mark-not-ready
```

Expected:

- route returns to legacy fallback
- public page does not disappear

After rollback smoke, re-approve only if the page is still accepted.

---

## Task 7: Confirm Strapi Is The Only Content Source After Migration

**Purpose:** Validate that editing content in Strapi changes the public page and editing legacy content no longer matters for migrated routes.

- [ ] **Step 1: Edit a migrated page section in Strapi**

Change a safe text field on an approved migrated route.

Expected:

- Strapi publish triggers rebuild/deploy
- public page reflects the Strapi change

- [ ] **Step 2: Confirm legacy fallback is inactive for that route**

Temporarily inspect route resolution or page marker.

Expected:

- route resolves to `PageV2Page`
- legacy template is not used unless `migration_ready=false` or unpublish is applied

- [ ] **Step 3: Repeat for representative families**

Check at least:

- one managed campaign page
- one brand page
- one resource page
- one pricing/commercial page
- one directory page
- one entity detail page
- one intersection page
- one comparison page

---

## Task 8: Enable AI Draft Flow Safely

**Purpose:** Allow AI to create drafts in Strapi without direct publishing.

**Files:**

- `scripts/generate-page-v2-drafts.mjs`
- `docs/ai-page-generation.md`
- server cron from `deploy/system/cron.page-v2-ai.example` if present

- [x] **Step 1: Manual AI smoke**

Create a `generation_job` with:

```text
job_type = manual_request
status = queued
target_blueprint = campaign
```

Run:

```powershell
npm.cmd run page-v2:generate:queued
```

Expected:

- generated page is a draft
- `migration_ready=false`
- `parity_status` is not automatically `approved`
- no public route changes

Local verification on 2026-04-23:

- local `manual_request` job reached `draft_ready`
- linked `page_v2` stayed draft-only and hidden from the public route

- [x] **Step 2: Scheduled AI smoke**

Create or queue a scheduled job:

```text
job_type = scheduled
status = queued
target_blueprint = resource
```

Run:

```powershell
npm.cmd run page-v2:generate:scheduled
```

Expected:

- draft only
- no publish
- no nav/sitemap entry until human approval

Local verification on 2026-04-23:

- local `scheduled` job reached `draft_ready`
- created draft had `generation_mode=ai_generated`
- public route remained `404` until publish and migration approval

- [x] **Step 3: Reject unsupported AI families**

Attempt unsupported target, for example:

```text
target_blueprint = pricing
```

Expected:

- job fails safely
- no page is created or published

Local verification on 2026-04-23:

- unsupported `pricing` job finished with `status=failed`
- `run_report.error` explained the allowed blueprint families
- no `page_v2` was created

- [ ] **Step 4: Install production cron only after manual migration is stable**

Expected:

- cron has `OPENAI_API_KEY`, `OPENAI_MODEL`, `STRAPI_URL`, `STRAPI_TOKEN`
- cron only processes allowed draft scopes
- failures are visible in `generation_job.run_report`

---

## Task 9: Make Operator Instructions Simple Enough For Non-AI Users

**Purpose:** Replace complex architecture-heavy instructions with clear operator runbooks that a person who does not use AI tools and does not write code can follow safely.

**Start condition:** Do not start this task until Tasks 1-8 are complete and verified. The operator docs must describe the real finished Strapi workflow, not a moving target.

This task is required before production handoff. The system is not truly manageable from Strapi if only a developer or AI assistant can understand the workflow.

**Files:**

- Modify: `docs/operator-guide.md`
- Modify: `docs/how-to-add-page.md`
- Modify: `docs/page-v2-manual-builder.md`
- Modify: `docs/managed-route-migration.md`
- Modify: `docs/manual-first-production-handoff.md`
- Optionally create: `docs/editor-quickstart.md`

- [x] **Step 1: Create a one-page editor quickstart**

Create `docs/editor-quickstart.md` with a simple path for day-to-day work:

```text
1. Как зайти в Strapi.
2. Где находится список страниц.
3. Как создать новую страницу.
4. Какие поля обязательны.
5. Как добавить блок.
6. Как посмотреть preview.
7. Как отправить на review.
8. Как опубликовать.
9. Что делать, если страница пропала или выглядит неправильно.
10. Кого звать, если видишь ошибку.
```

The document must avoid architecture terms unless they are explained in one sentence.

- [x] **Step 2: Add a "daily tasks" section**

The quickstart must include exact workflows:

```text
Мне нужно поменять текст на странице.
Мне нужно добавить блок FAQ.
Мне нужно добавить новую страницу.
Мне нужно убрать страницу с сайта.
Мне нужно добавить страницу в меню.
Мне нужно убрать страницу из sitemap.
Мне нужно откатить ошибочное изменение.
```

Each workflow must be written as numbered steps, not paragraphs.

- [x] **Step 3: Add safe field explanations**

Add a plain-language table:

```text
route_path - адрес страницы на сайте.
title - внутреннее название в админке.
seo_title - заголовок для поисковиков.
seo_description - описание для поисковиков.
sections - блоки страницы.
show_in_header - показывать в верхнем меню.
show_in_footer - показывать в нижнем меню.
show_in_sitemap - показывать в карте сайта.
editorial_status - редакторский статус.
migration_ready - включать только после проверки старой страницы.
parity_status - статус проверки, что макет не потерян.
```

The explanation for `migration_ready` must explicitly say: do not enable it unless the route was checked.

- [x] **Step 4: Add screenshots checklist placeholder without requiring screenshots**

Add a checklist for future screenshots:

```text
[ ] Список страниц в Strapi
[ ] Форма создания страницы
[ ] Dynamic zone sections
[ ] SEO fields
[ ] Nav/sitemap fields
[ ] Publish button
[ ] Review/approved status
```

Do not block the release on screenshots, but make the missing screenshots visible.

- [x] **Step 5: Rewrite migration docs for operators first**

In `docs/managed-route-migration.md`, add an opening section called "Коротко для оператора":

```text
1. Создать draft новой страницы.
2. Проверить, что она похожа на старую.
3. Опубликовать draft.
4. Не включать migration_ready сразу.
5. После проверки включить approve.
6. Если что-то пошло не так, снять migration_ready.
```

The deeper technical explanation can remain below this section.

- [x] **Step 6: Add a mistake recovery section**

Add a non-technical recovery table:

```text
Проблема: новая страница выглядит плохо.
Что сделать: снять migration_ready или выполнить mark-not-ready.

Проблема: страница не появилась.
Что проверить: published, editorial_status, route_path, parity_status.

Проблема: страница пропала из меню.
Что проверить: show_in_header, nav_group, nav_order.

Проблема: страница попала в Google, хотя не должна.
Что проверить: show_in_sitemap, robots, canonical.
```

- [x] **Step 7: Add glossary for non-technical users**

Add or update `docs/glossary.md` with simple definitions for:

```text
Strapi
Page
Block
Blueprint
Draft
Review
Approved
Publish
Migration
Fallback
Rollback
Sitemap
SEO
Canonical
Noindex
AI draft
```

Each definition must be one or two short sentences.

- [x] **Step 8: Run docs verification**

Run:

```powershell
npm.cmd run check:docs-consistency
```

Expected:

- docs consistency passes
- no contradictions between editor quickstart and technical migration docs

- [ ] **Step 9: Human readability smoke**

Ask one person who does not work with AI tools or the codebase to read `docs/editor-quickstart.md` and answer:

```text
Can you create a page from this instruction?
Can you change text on a page from this instruction?
Can you understand what not to touch?
Can you recover if the page looks wrong?
```

If the answer is not yes for all four questions, simplify the docs before production handoff.

---

## Task 10: Rotate Secrets After Backups

**Purpose:** Remove known/temporary secrets safely after the new system is stable.

- [ ] **Step 1: Take backups**

Create:

- database backup
- `deploy/.env` backup
- Strapi API token inventory

- [ ] **Step 2: Rotate low-risk tokens first**

Rotate:

- `WEBHOOK_TOKEN`
- Strapi API token
- GitHub/relay token

Expected:

- webhook relay still works
- build/deploy still works

- [ ] **Step 3: Rotate database password in maintenance window**

Rotate:

- `POSTGRES_PASSWORD`

Expected:

- Strapi reconnects
- portal build still reads content

- [ ] **Step 4: Rotate Strapi salts only with admin relogin plan**

Rotate:

- session/JWT salts

Expected:

- admins may be logged out
- API tokens are recreated if needed

- [ ] **Step 5: Preserve or rotate encryption key based on preflight**

Only rotate `ENCRYPTION_KEY` if preflight proves no encrypted payload becomes unreadable.

Expected:

- if preserved, document exception
- if rotated, verify Strapi can read all protected settings

- [ ] **Step 6: Remove placeholder bypass**

Set:

```text
ALLOW_PLACEHOLDER_SECRETS=false
```

Expected:

- validation passes without placeholder secrets

---

## Task 11: Legacy Cleanup After Production Stability

**Purpose:** Remove old content ownership only after Strapi has proven stable as source of truth.

Do not start this task until every route family has been migrated and stable in production.

- [ ] **Step 1: Identify legacy code that is no longer used**

List:

- legacy wrappers that always resolve to approved `page_v2`
- legacy template components no longer used
- old docs that describe legacy as active workflow

- [ ] **Step 2: Keep emergency rollback path if required**

Before deleting a legacy renderer, confirm:

- equivalent `page_v2` exists
- `page_version` rollback works
- source content exists in Strapi
- no route depends on legacy-only data

- [ ] **Step 3: Delete in small PRs/commits**

Remove one family at a time:

- managed campaign
- brand
- resource
- pricing/partnership
- directories
- entity detail
- intersections
- comparison

- [ ] **Step 4: Run full verification after each family**

Run:

```powershell
npm.cmd run test:contracts
npm.cmd --prefix portal run build
```

Expected:

- no public route removed
- no sitemap regression
- no broken internal links

---

## Локальная контрольная точка: 2026-04-25

Эта контрольная точка фиксирует текущее локальное состояние до отправки на сервер и до live cutover.

- Полная локальная сборка Astro создала 802 страницы.
- Полный legacy HTML parity report сравнил 801 публичный маршрут с `https://astro.integromat.ru`.
- Результат parity: `missingLocal=0`, `missingLegacy=0`, `withMissingChunks=0`, `missingChunks=0`, `averageCoverage=1`.
- Контрактные тесты прошли: `118/118`.
- Проверка документации прошла.
- Проверка качества данных `page_v2` прошла без ошибок.
- Сборка CMS admin прошла.
- Browser smoke подтвердил, что representative legacy family layouts не падают в generic `PageV2Page` shell.

Маршруты, проверенные в browser smoke:

- `/tv`
- `/team`
- `/features`
- `/pricing`
- `/partnership`
- `/compare/respond-io`
- `/channels/email`
- `/solutions/erp`

Важное правило безопасности: legacy templates всё ещё намеренно остаются renderer/fallback-слоем. Их нельзя удалять, пока production стабильно не отработает с approved `page_v2` записями и пока не будет проверен route-level rollback.

---

## Final Acceptance Checklist

- [x] Every public route has a `page_v2` record in local Strapi.
- [x] Every public route is editable from local Strapi.
- [x] New pages can be created from Strapi without code changes.
- [x] Header/footer/mobile nav can be controlled from Strapi for migrated pages.
- [x] Sitemap visibility is controlled from Strapi.
- [x] Breadcrumbs and internal links are controlled from Strapi.
- [x] Entities remain as factual data, not public page owners.
- [x] AI creates drafts only.
- [x] `page_version` rollback works.
- [ ] A non-technical operator can create, edit, publish, unpublish, and recover a page using the docs.
- [ ] Legacy templates are no longer required for normal rendering.
- [ ] Production secret rotation is completed or documented with explicit exception.

---

## Standard Verification Commands

Run before every commit, server deploy, or production migration wave:

```powershell
npm.cmd run test:contracts
npm.cmd run check:docs-consistency
npm.cmd --prefix cms run build
npm.cmd --prefix portal run build
git diff --check
```

Run before route approval:

```powershell
npm.cmd run page-v2:materialize -- --route=/target-route --dry-run
```

Run to ensure no local materializer gaps:

```powershell
npm.cmd run page-v2:materialize:report
npm.cmd run page-v2:local:audit
npm.cmd run page-v2:local:cutover-smoke
npm.cmd --prefix portal run build
npm.cmd run page-v2:local:layout-smoke
```

Run to rollback a route without code deploy:

```powershell
npm.cmd run page-v2:materialize -- --route=/target-route --mark-not-ready
```

---

## Operating Principle

Speed is less important than not losing page-specific layout and content. If the materializer cannot preserve a route's structure, the route must stay on legacy fallback until the missing block or variant is added.

The end state is not "legacy templates are hidden by routing." The end state is "Strapi contains and owns the content for every public page."
