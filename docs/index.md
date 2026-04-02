# Документация CHATPLUS

Главная карта проекта. Это первый файл, который должен открыть человек или другая нейросеть перед работой с репозиторием.

## Что это за проект

`CHATPLUS` — это публичный сайт на `Astro`, который берет контент из `Strapi` и частично из generator-owned seed-пайплайна.

Проект состоит из:

- `portal/` — фронтенд
- `cms/` — Strapi и content types
- `scripts/` — генерация и импорт контента
- `pages-preview/` — демо-снапшот для GitHub Pages

## Главный принцип

В проекте есть два ownership-режима:

- `generated` — контентом владеет `seed/generator`-контур
- `managed` — контентом владеет Strapi admin

Фронтенд не должен становиться вторым источником истины для пользовательского текста.

## Порядок чтения для инженера или следующей нейронки

1. [Архитектура](architecture.md)
2. [Глоссарий](glossary.md)
3. [CMS-модель](cms-model.md)
4. [Контентный workflow](content-workflow.md)
5. [Матрица маршрутов и ownership](route-ownership-matrix.md)
6. [Контракты шаблонов](template-contracts.md)
7. [Карта файлов](file-map.md)
8. [Контракт безопасных изменений](change-safety.md)
9. [AI Generation для блоков](ai-block-generation.md)
10. [Troubleshooting](troubleshooting.md)
11. [Release Flow](release-flow.md)
12. [Known Risks](known-risks.md)
13. [Гайд оператора](operator-guide.md)
14. [Деплой](../DEPLOY.md)

## Порядок чтения для оператора или контент-менеджера

1. [Гайд оператора](operator-guide.md)
2. [Release Flow](release-flow.md)
3. [Как добавить страницу](how-to-add-page.md)
4. [Чеклист публикации](publishing-checklist.md)
5. [Troubleshooting](troubleshooting.md)
6. [Контентный workflow](content-workflow.md)
7. [Деплой](../DEPLOY.md)

## Где что лежит

```text
CHATPLUS/
|- portal/          # Astro frontend
|- cms/             # Strapi CMS
|- scripts/         # generator/import scripts
|- docs/            # актуальная документация
|- pages-preview/   # snapshot для GitHub Pages demo
|- .github/         # workflows
|- DEPLOY.md        # deploy runbook
`- README.md        # главный вход в проект
```

## Где источник истины

### Programmatic pages

Источник истины:

- `cms/seed/*.json`
- `scripts/seed-runtime-content.mjs`

### Managed singleton pages

Источник истины:

- Strapi admin

### Frontend

Во frontend должны жить:

- шаблоны
- стили
- layout
- responsive behavior
- shared UI behavior
- adapters и fallback-логика

## Активные шаблоны

В системе сейчас 10 шаблонов:

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

Подробный контракт по каждому:

- [Контракты шаблонов](template-contracts.md)
- [Матрица маршрутов и ownership](route-ownership-matrix.md)

## Быстрый маршрут по типу задачи

### Если нужно поправить только верстку

Читайте:

- [Архитектура](architecture.md)
- [Контракты шаблонов](template-contracts.md)
- [Карта файлов](file-map.md)
- [Контракт безопасных изменений](change-safety.md)

### Если нужно добавить новую страницу

Читайте:

- [Как добавить страницу](how-to-add-page.md)
- [Контентный workflow](content-workflow.md)
- [Troubleshooting](troubleshooting.md)

### Если нужно изменить существующий шаблон или заменить его

Читайте:

- [Как добавить страницу](how-to-add-page.md)
- [Контракт безопасных изменений](change-safety.md)
- [Контракты шаблонов](template-contracts.md)
- [Карта файлов](file-map.md)

### Если нужно добавить новый CMS-owned блок

Читайте:

- [CMS-модель](cms-model.md)
- [Контракт безопасных изменений](change-safety.md)
- [Контентный workflow](content-workflow.md)
- [Карта файлов](file-map.md)

### Если нужно генерировать тексты для блоков через ИИ

Читайте:

- [AI Generation для блоков](ai-block-generation.md)
- [Контентный workflow](content-workflow.md)
- [Контракты шаблонов](template-contracts.md)

### Если нужно выпустить demo

Читайте:

- [Release Flow](release-flow.md)
- [Гайд оператора](operator-guide.md)
- [Чеклист публикации](publishing-checklist.md)
- [Деплой](../DEPLOY.md)

## Zero-Ambiguity правила

- Не создавайте `generated`-страницы руками в Strapi.
- Не меняйте `content_origin`, если не понимаете последствия.
- Не хардкодьте user-facing copy в шаблон, если его должен менять редактор.
- Не добавляйте новый CMS-owned блок без обновления схемы, адаптеров и документации.
- Не публикуйте demo, пока не прошел `npm.cmd --prefix portal run build`.
