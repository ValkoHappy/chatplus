# Документация CHATPLUS

Главная карта проекта. Этот файл должен быть первой точкой входа и для человека, и для другой нейросети.

## Что за проект

`CHATPLUS` состоит из двух приложений и одного публикационного контура:

- `portal/` — публичный сайт на `Astro`
- `cms/` — `Strapi` как контентный слой
- `pages-preview/` — demo snapshot для GitHub Pages

Контентный принцип проекта:

- `generated`-страницы создаются из `seeds + generator`
- `managed`-страницы редактируются в Strapi
- фронтенд отвечает за шаблоны, стили, адаптив и render-логику

## Куда идти дальше

### Если вы инженер или агентная модель

Читайте в этом порядке:

1. [Архитектура](architecture.md)
2. [CMS-модель](cms-model.md)
3. [Контентный workflow](content-workflow.md)
4. [Контракты шаблонов](template-contracts.md)
5. [Контракт безопасных изменений](change-safety.md)
6. [Гайд оператора](operator-guide.md)
7. [Деплой](../DEPLOY.md)

### Если вы оператор или контент-менеджер

Читайте в этом порядке:

1. [Гайд оператора](operator-guide.md)
2. [Как добавить страницу](how-to-add-page.md)
3. [Чеклист публикации](publishing-checklist.md)
4. [Контентный workflow](content-workflow.md)
5. [Деплой](../DEPLOY.md)

## Из чего состоит репозиторий

```text
CHATPLUS/
|- portal/          # Astro frontend
|- cms/             # Strapi CMS
|- scripts/         # генерация, импорт, repair/util scripts
|- docs/            # актуальная документация
|- pages-preview/   # снапшот для GitHub Pages demo
|- .github/         # workflows
|- DEPLOY.md        # runbook по публикации
`- README.md        # быстрый вход в проект
```

## Где истина

### Programmatic pages

Источник истины:

- `cms/seed/*.json`
- `scripts/seed-runtime-content.mjs`

### Managed singleton pages

Источник истины:

- Strapi admin

### Фронтенд

Во frontend должны жить:

- шаблоны
- стили
- layout
- адаптив
- shared UI behavior
- normalization/fallback layer

## Активные шаблоны

В системе 10 шаблонов:

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

Подробный контракт по каждому шаблону:

- [Контракты шаблонов](template-contracts.md)

## Что запускать

### Локально

Strapi:

```powershell
npm.cmd --prefix cms run develop
```

Astro:

```powershell
npm.cmd --prefix portal run dev -- --host 127.0.0.1
```

### Обновить generator-owned контент

```powershell
npm.cmd run seed-content
```

### Полный build + QA

```powershell
npm.cmd --prefix portal run build
```

### Demo snapshot

```powershell
npm.cmd --prefix portal run snapshot:github-demo
```

## Главные правила безопасности

- Не создавайте generator-owned страницы вручную в Strapi.
- Не меняйте `content_origin` без понимания последствий.
- Не хардкодьте новый user-facing copy в шаблон, если его должны редактировать через CMS.
- Не добавляйте новый CMS-owned block без описанного контракта и обновления adapters/import pipeline.
- Не публикуйте demo, пока не прошел `portal build`.

Подробно:

- [Контракт безопасных изменений](change-safety.md)

## Что делать, если нужно изменить проект

### Если меняется только верстка

Читайте:

- [Архитектура](architecture.md)
- [Контракты шаблонов](template-contracts.md)
- [Контракт безопасных изменений](change-safety.md)

### Если добавляется новый block / новый template contract

Читайте:

- [CMS-модель](cms-model.md)
- [Контентный workflow](content-workflow.md)
- [Контракт безопасных изменений](change-safety.md)

### Если нужно добавить страницу

Читайте:

- [Как добавить страницу](how-to-add-page.md)

### Если нужно выпустить demo

Читайте:

- [Чеклист публикации](publishing-checklist.md)
- [Деплой](../DEPLOY.md)
