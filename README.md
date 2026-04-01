# CHATPLUS

Главный вход в проект. Если вы впервые открыли репозиторий, начинайте отсюда.

## Что это

`CHATPLUS` — это публичный сайт на `Astro` и CMS на `Strapi`, связанные через CMS-first контур:

- `portal/` — публичный фронтенд
- `cms/` — Strapi с контентом
- `scripts/` — генерация и импорт programmatic-контента
- `pages-preview/` — статический снапшот для GitHub Pages demo

Проект сочетает:

- singleton-страницы верхнего уровня
- каталоги и detail-страницы
- programmatic SEO-маршруты
- compare/vs страницы
- resource-hub страницы
- brand/content страницы
- campaign страницы

## С чего читать

Если вы инженер или агентная модель:

1. [Главная карта документации](docs/index.md)
2. [Архитектура](docs/architecture.md)
3. [CMS-модель](docs/cms-model.md)
4. [Контентный workflow](docs/content-workflow.md)
5. [Контракты шаблонов](docs/template-contracts.md)
6. [Контракт безопасных изменений](docs/change-safety.md)
7. [Деплой](DEPLOY.md)

Если вы оператор/контент-менеджер:

1. [Главная карта документации](docs/index.md)
2. [Гайд оператора](docs/operator-guide.md)
3. [Как добавить страницу](docs/how-to-add-page.md)
4. [Чеклист публикации](docs/publishing-checklist.md)
5. [Деплой](DEPLOY.md)

## Быстрый запуск

Из корня репозитория:

### Strapi

```powershell
npm.cmd --prefix cms run develop
```

### Astro

Во втором окне:

```powershell
npm.cmd --prefix portal run dev -- --host 127.0.0.1
```

Открыть:

```text
http://127.0.0.1:4321/
```

## Быстрые команды

### Полная проверка фронтенда

```powershell
npm.cmd --prefix portal run build
```

### Обновить generator-owned контент в Strapi

```powershell
npm.cmd run seed-content
```

### Собрать demo snapshot для GitHub Pages

```powershell
npm.cmd --prefix portal run snapshot:github-demo
```

## Главные правила проекта

- `generated`-страницы не создают вручную в Strapi.
- `managed`-страницы редактируют в Strapi и не должны затираться генератором.
- Пользовательский текст должен жить в Strapi/seeds, а не размазываться по шаблонам.
- Перед публикацией обязательно должен проходить `npm.cmd --prefix portal run build`.

## Где истина

- Для programmatic family: `cms/seed/*.json` + генератор/import pipeline
- Для managed singleton pages: Strapi admin
- Для шаблонов, стилей, адаптивного поведения и render-логики: Astro frontend

## Активные шаблоны

В проекте сейчас 10 активных шаблонов:

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

Подробно:

- [Контракты шаблонов](docs/template-contracts.md)
- [Route-to-template registry](portal/src/lib/page-template-map.ts)

## Legacy-документы

В корне есть старые документы и handoff-артефакты. Они не являются главным operational-источником, пока это явно не указано в самом файле. Основной документационный пакет теперь живет в:

- [docs/index.md](docs/index.md)
