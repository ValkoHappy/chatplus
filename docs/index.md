# Документация CHATPLUS

Главная карта проекта. Это первый файл, который стоит открыть перед работой с репозиторием.

## Что это за проект

`CHATPLUS` — это контентный сайт на `Astro`, который берет данные из `Strapi`.

В проекте есть:

- `portal/` — фронтенд
- `cms/` — Strapi CMS
- `scripts/` — importer, генерация и служебные content-скрипты
- `pages-preview/` — legacy demo snapshot для showcase-режима

Основной рабочий режим проекта сейчас server-first:

- `Strapi + Postgres + uploads` живут на VPS
- `Astro` собирает публичную статику
- `nginx` отдает сайт и reverse proxy на CMS
- `pages-preview/` нужен только для optional demo-потока

## Главный принцип

Текущая рабочая модель:

- `managed` — запись редактируется руками в `Strapi`
- `imported` — запись создается importer-ом и живет в `Strapi`
- `settings` — singleton/system records

Старый термин `generated` теперь считается legacy-слоем совместимости и не должен использоваться как основная редакторская логика.

## Порядок чтения для инженера

1. [Архитектура](architecture.md)
2. [Глоссарий](glossary.md)
3. [CMS-модель](cms-model.md)
4. [Контентный workflow](content-workflow.md)
5. [Политика импорта](import-policy.md)
6. [Матрица маршрутов и ownership](route-ownership-matrix.md)
7. [Контракты шаблонов](template-contracts.md)
8. [Карта файлов](file-map.md)
9. [Контракт безопасных изменений](change-safety.md)
10. [Troubleshooting](troubleshooting.md)
11. [Release Flow](release-flow.md)
12. [Гайд оператора](operator-guide.md)
13. [Деплой](../DEPLOY.md)

## Порядок чтения для оператора или редактора

1. [Быстрый запуск на VPS](start-here-vps.md)
2. [Быстрый вход для владельца](owner-quickstart.md)
3. [Гайд оператора](operator-guide.md)
4. [Контентный workflow](content-workflow.md)
5. [Release Flow](release-flow.md)
6. [Деплой](../DEPLOY.md)

## Где что лежит

```text
CHATPLUS/
|- portal/          # Astro frontend
|- cms/             # Strapi CMS
|- scripts/         # importer и content-скрипты
|- docs/            # актуальная документация
|- pages-preview/   # optional demo snapshot
|- .github/         # workflows
|- DEPLOY.md        # deploy guide
`- README.md        # главный вход в проект
```

## Где источник истины

### CMS

`Strapi` — главный редакторский интерфейс.

В нем живут:

- landing pages
- singleton pages
- site settings
- imported catalog/SEO записи после загрузки

### Importer

Importer:

- читает `cms/seed/*.json`
- умеет `plan`, `apply`, `force-sync`, `report`
- пишет записи в `Strapi`
- не должен слепо затирать ручные редакторские правки

### Frontend

Frontend владеет только:

- шаблонами
- layout
- стилями
- render logic
- shape normalization

Frontend не должен становиться вторым источником пользовательского текста.

## Быстрый маршрут по типу задачи

### Нужно понять CMS-модель

Читайте:

- [CMS-модель](cms-model.md)
- [Политика импорта](import-policy.md)
- [Контентный workflow](content-workflow.md)

### Нужно менять шаблоны или адаптеры

Читайте:

- [Архитектура](architecture.md)
- [Контракты шаблонов](template-contracts.md)
- [Карта файлов](file-map.md)

### Нужно разбираться с публикацией

Читайте:

- [Release Flow](release-flow.md)
- [Гайд оператора](operator-guide.md)
- [Production setup checklist](production-setup-checklist.md)
- [Деплой](../DEPLOY.md)

### Нужно быстро объяснить проект владельцу

Начинайте отсюда:

- [Быстрый вход для владельца](owner-quickstart.md)

## Zero-Ambiguity правила

- не используйте `generated` как главный user-facing ownership термин
- не правьте imported catalog/SEO записи руками как основной workflow
- не хардкодьте user-facing copy во frontend, если его должен менять редактор
- не добавляйте новый CMS-owned блок без обновления схемы, адаптеров и docs
- не публикуйте изменения без успешного `portal build`
