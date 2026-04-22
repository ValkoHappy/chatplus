# CHATPLUS

Главный вход в проект. Если вы впервые открыли репозиторий, начинайте отсюда.

## Что это

`CHATPLUS` — это публичный сайт на `Astro` и контентный слой на `Strapi`.

Проект состоит из четырех главных частей:

- `portal/` — фронтенд, шаблоны, маршруты и сборка
- `cms/` — Strapi, content types, админка и CMS-данные
- `scripts/` — importer, генерация и служебные content-скрипты
- `pages-preview/` — legacy demo snapshot для showcase-режима

Основной рабочий контур сейчас server-first:

- `Strapi + Postgres + uploads` живут на VPS
- `Astro` собирает публичную статику
- `nginx` отдает публичный сайт и reverse proxy на CMS
- publish flow по умолчанию идет по схеме `Publish -> webhook -> relay -> local rebuild -> deploy на VPS`

## Текущая модель проекта

Проект больше не описывается как `generated vs managed` в пользовательском смысле.

Рабочая модель теперь такая:

- `managed` — запись редактируется руками в `Strapi`
- `imported` — запись создается importer-ом, живет в `Strapi` и безопасно синхронизируется
- `settings` — singleton/system records

Что это значит на практике:

- `Strapi` — главный редакторский интерфейс
- `Astro` — только рендер и сборка статики
- importer загружает SEO/catalog данные в `Strapi`, но не должен тупо перетирать ручные правки
- publish flow строится вокруг схемы:
  - `Publish -> webhook -> relay -> local rebuild -> deploy`

## С чего читать

### Если вы инженер

Читайте в таком порядке:

1. [Карта документации](docs/index.md)
2. [Архитектура](docs/architecture.md)
3. [CMS-модель](docs/cms-model.md)
4. [Контентный workflow](docs/content-workflow.md)
5. [Политика импорта](docs/import-policy.md)
6. [Матрица маршрутов и ownership](docs/route-ownership-matrix.md)
7. [Контракты шаблонов](docs/template-contracts.md)
8. [Карта файлов](docs/file-map.md)
9. [Контракт безопасных изменений](docs/change-safety.md)
10. [Troubleshooting](docs/troubleshooting.md)
11. [Release Flow](docs/release-flow.md)
12. [Деплой](DEPLOY.md)

### Если вы оператор, редактор или владелец

Читайте в таком порядке:

1. [Быстрый запуск на VPS](docs/start-here-vps.md)
2. [Production setup checklist](docs/production-setup-checklist.md)
3. [Быстрый вход для владельца](docs/owner-quickstart.md)
4. [Гайд оператора](docs/operator-guide.md)
5. [Release Flow](docs/release-flow.md)
6. [Деплой](DEPLOY.md)

## Быстрый запуск

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

## Локальный Docker smoke

Если нужно проверить production-like контур локально:

```powershell
Copy-Item deploy/.env.local.example deploy/.env.local
.\deploy\scripts\local-up.cmd
```

Дальше:

1. открыть `http://127.0.0.1:1337/admin`
2. создать первого Strapi admin user
3. создать `API Token`
4. записать его в `deploy/.env.local` как `STRAPI_API_TOKEN`
5. до этого момента публичный локальный сайт может быть пустым или в bootstrap-состоянии, и это нормально
6. при необходимости проверить importer:

```powershell
.\deploy\scripts\local-seed-content.cmd
```

7. собрать локальный публичный сайт:

```powershell
.\deploy\scripts\local-build-portal.cmd
```

Результат:

- `Strapi`: `http://127.0.0.1:1337/admin`
- публичный сайт: `http://127.0.0.1:8080`

## Основные команды

### Проверить importer plan

```powershell
npm.cmd run seed-content:plan
```

### Применить importer

```powershell
npm.cmd run seed-content
```

### Принудительный sync

```powershell
npm.cmd run seed-content:force
```

### Посмотреть importer report

```powershell
npm.cmd run seed-content:report
```

### Полная сборка с QA-проверками

```powershell
npm.cmd run test:contracts
npm.cmd run check:docs-consistency
npm.cmd --prefix portal run build
```

## Главные правила проекта

- не правьте imported catalog/SEO контент руками как основной workflow
- не используйте `force-sync` как обычный publish flow
- не хардкодьте user-facing copy во frontend, если ее должен редактировать редактор
- перед публикацией всегда должен проходить `portal build`
- deploy и content publish считаются отдельными pipeline

## Где источник истины

- для `managed` и `settings` контента — `Strapi`
- для batch generation — `cms/seed/*.json` как bootstrap/import layer
- для шаблонов, layout и render logic — `portal/`

## Важные ссылки

- [Карта документации](docs/index.md)
- [CMS-модель](docs/cms-model.md)
- [Контентный workflow](docs/content-workflow.md)
- [Политика импорта](docs/import-policy.md)
- [Гайд оператора](docs/operator-guide.md)
- [Быстрый запуск на VPS](docs/start-here-vps.md)
- [Release Flow](docs/release-flow.md)
- [Деплой](DEPLOY.md)
