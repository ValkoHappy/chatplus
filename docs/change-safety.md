# Контракт безопасных изменений

Этот документ нужен, чтобы никто не ломал проект при изменении верстки, CMS-модели, генератора или шаблонов.

## 1. Базовый принцип

Нельзя менять систему “в одном месте”. В CHATPLUS почти любое изменение живет сразу в одном из трех слоев:

- frontend
- CMS schema/content
- generator/import pipeline

## 2. Что можно менять безопасно без schema changes

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
- новый CMS-owned block
- новый тип hero/panel/proof structure
- новый тип cards, которые редактор должен наполнять из Strapi
- новый compare block contract

## 4. Что нельзя делать

- Хардкодить user-facing copy в шаблон, если блок уже CMS-owned.
- Создавать generator-owned страницы руками в Strapi.
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

## 6. Как безопасно вводить новый block

1. Описать block contract.
2. Зафиксировать allowed templates.
3. Зафиксировать required/optional fields.
4. Обновить schema, если блок CMS-owned.
5. Обновить `strapi.ts` и/или import/generator layer.
6. Обновить документацию.
7. Только потом рендерить блок во frontend.

## 7. Обязательный self-check перед merge/publish

- Понятно, кто владеет изменяемым блоком: frontend или CMS.
- Если блок CMS-owned, его поля описаны и валидируются.
- `generated` и `managed` не перепутаны.
- Build и checks зеленые.
- Представительные страницы просмотрены вручную.
- Документация не противоречит новой реальности проекта.
