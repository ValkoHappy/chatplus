# Контракт безопасных изменений

Этот документ нужен, чтобы никто не ломал проект при изменении верстки, CMS-модели, генератора или шаблонов.

## 1. Базовый принцип

Нельзя менять систему только в одном месте. В CHATPLUS почти любое изменение живет сразу в одном из трех слоев:

- frontend
- CMS schema/content
- generator/import pipeline

Если вы меняете CMS-owned блок, почти наверняка придется затронуть не только шаблон, но и schema, adapter или импорт.

## 2. Что можно менять без schema changes

Можно менять без изменения Strapi schema и generator/import contract:

- стили
- layout
- spacing
- grid behavior
- responsive behavior
- типографику
- локальные визуальные улучшения
- hover/focus states

Но даже здесь нужно проверить:

1. representative pages
2. tablet/mobile
3. build + QA

## 3. Что уже требует schema/import changes

Любая из этих правок требует обновления CMS/model layer:

- новый `template_kind`
- новый CMS-owned блок
- новый тип hero/panel/proof structure
- новый тип cards, которые редактор должен наполнять из Strapi
- новый compare block contract
- замена шаблона на другой `template_kind`, если меняется ожидаемый набор полей

## 4. Что нельзя делать

- Хардкодить user-facing copy в шаблон, если блок уже CMS-owned.
- Создавать importer-owned catalog/SEO записи вручную в Strapi как основной workflow.
- Менять `content_origin` без понимания ownership-последствий.
- Добавлять новый блок в верстку без описанного контракта в docs и adapters.

## 5. Как безопасно менять верстку

1. Определить, template-owned это изменение или CMS-owned.
2. Проверить, какие поля этот блок уже использует.
3. Проверить, есть ли fallback behavior.
4. Если блок CMS-owned, убедиться, что не ломается контракт полей.
5. Прогнать:

```powershell
npm.cmd --prefix portal run build
```

6. Проверить representative routes вручную.

Если меняется только:

- spacing
- карточная сетка
- типографика
- порядок декоративных блоков
- responsive behavior

это обычно safe frontend-only change.

Если меняется:

- набор CMS-owned секций
- структура hero/proof/CTA блока
- route-template mapping
- expected fields у шаблона

это уже contract-level change, а не просто правка верстки.

## 5a. Как безопасно изменить существующий шаблон

1. Открыть контракт шаблона в `docs/template-contracts.md`.
2. Зафиксировать, меняется ли только визуал или меняется data contract.
3. Определить, в каком internal adapter module лежит нужная логика:
   - shared helpers -> `portal/src/lib/page-adapters/shared.ts`
   - detail pages -> `portal/src/lib/page-adapters/details.ts`
   - intersections -> `portal/src/lib/page-adapters/intersections.ts`
   - specialized pages -> `portal/src/lib/page-adapters/specialized.ts`
4. Если меняется только визуал:
   - править frontend
   - прогнать build
   - проверить representative routes
5. Если меняется contract:
   - сначала обновить docs
   - потом schema/import/adapters
   - и только потом рендер

Фасад `portal/src/lib/page-adapters.ts` трогайте только если меняется public contract exports, а не внутренняя реализация.

## 5b. Как безопасно заменить один шаблон другим

1. Проверить, какой `template_kind` у маршрута сейчас и какой будет после замены.
2. Сверить required fields старого и нового шаблона.
3. Если новый шаблон требует другие поля, это schema-level change.
4. Обновить:
   - route-template mapping
   - docs
   - adapters
   - validation/import contract
5. Не менять шаблон маршрута “втихую” без обновления ownership и template docs.

## 6. Как безопасно вводить новый блок

1. Описать block contract.
2. Зафиксировать allowed templates.
3. Зафиксировать required и optional fields.
4. Обновить schema, если блок CMS-owned.
5. Обновить `strapi.ts` и/или import/generator layer.
6. Обновить документацию.
7. Только потом рендерить блок во frontend.

Минимум для block contract:

- `block_type`
- allowed `template_kind`
- ownership (`imported` / `managed` / `settings` / mixed-by-page)
- required fields
- optional fields
- fallback behavior

Короткий runbook:

1. Сначала обновить docs и явно записать, для каких `template_kind` блок разрешен.
2. Если блок хранится в CMS, это schema-level change:
   - обновить schema/content model
   - обновить generator/import validation
   - обновить adapter layer
3. Если блок не описан в docs и не валидируется, его нельзя рендерить во frontend.
4. После этого прогнать build и representative routes.

Если меняется seed/import/runtime contract, сначала определите, где именно это живет:

- `rules.mjs` — константы, карты, required fields и inferrers
- `validators.mjs` — runtime validation
- `ownership.mjs` — merge/ownership behavior
- `normalizers.mjs` — preparers/normalizers
- `strapi-client.mjs` — request/upsert в Strapi

Фасад `scripts/seed-runtime-content.mjs` трогайте только если меняется CLI/public orchestration contract.

## 7. Self-check перед merge или publish

- Понятно, кто владеет изменяемым блоком: frontend или CMS.
- Если блок CMS-owned, его поля описаны и валидируются.
- `imported`, `managed` и `settings` не перепутаны.
- Build и checks зеленые.
- Представительные страницы просмотрены вручную.
- Документация не противоречит новой реальности проекта.
