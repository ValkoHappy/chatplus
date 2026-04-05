# CHATPLUS

Главный вход в проект. Если вы впервые открыли репозиторий, начинайте отсюда.

## Что это

`CHATPLUS` — это публичный сайт на `Astro` и контентный слой на `Strapi`.

Проект состоит из четырех основных частей:

- `portal/` — фронтенд, шаблоны, стили, маршруты и сборка
- `cms/` — Strapi, content types, админка и CMS-данные
- `scripts/` — генерация и импорт generator-owned контента
- `pages-preview/` — статический snapshot для GitHub Pages demo

Контентная модель гибридная:

- `generated`-страницы создаются через `cms/seed/*.json -> scripts/seed-runtime-content.mjs -> Strapi`
- `managed`-страницы редактируются напрямую в Strapi
- фронтенд отвечает за верстку, адаптив, шаблоны и render-логику

После декомпозиции внутренней логики:

- `portal/src/lib/page-adapters.ts` остается публичным entrypoint для фронтенда
- `scripts/seed-runtime-content.mjs` остается CLI entrypoint для `seed-content`
- внутренняя логика разложена по internal modules, но внешний контракт не менялся

## С чего читать

### Если вы инженер или следующая нейронка

Читайте в таком порядке:

1. [Главная карта документации](docs/index.md)
2. [Глоссарий](docs/glossary.md)
3. [Архитектура](docs/architecture.md)
4. [CMS-модель](docs/cms-model.md)
5. [Контентный workflow](docs/content-workflow.md)
6. [Матрица маршрутов и ownership](docs/route-ownership-matrix.md)
7. [Контракты шаблонов](docs/template-contracts.md)
8. [Карта файлов](docs/file-map.md)
9. [Контракт безопасных изменений](docs/change-safety.md)
10. [AI Generation для блоков](docs/ai-block-generation.md)
11. [Troubleshooting](docs/troubleshooting.md)
12. [Release Flow](docs/release-flow.md)
13. [Known Risks](docs/known-risks.md)
14. [Деплой и публикация](DEPLOY.md)

### Если вы оператор, контент-менеджер или владелец проекта

Читайте в таком порядке:

1. [Главная карта документации](docs/index.md)
2. [Гайд оператора](docs/operator-guide.md)
3. [Release Flow](docs/release-flow.md)
4. [Как добавить страницу](docs/how-to-add-page.md)
5. [Чеклист публикации](docs/publishing-checklist.md)
6. [Troubleshooting](docs/troubleshooting.md)
7. [Деплой и публикация](DEPLOY.md)

## Быстрый запуск

Из корня репозитория.

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

Если нужно локально проверить production-like контур через Docker Desktop:

```powershell
Copy-Item deploy/.env.local.example deploy/.env.local
.\deploy\scripts\local-up.cmd
```

Дальше:

1. открыть `http://127.0.0.1:1337/admin`
2. создать первого Strapi admin user
3. создать API token
4. записать его в `deploy/.env.local` как `STRAPI_API_TOKEN`
5. на чистой локальной базе выполнить:

```powershell
.\deploy\scripts\local-seed-content.cmd
```

6. собрать локальный публичный сайт:

```powershell
.\deploy\scripts\local-build-portal.cmd
```

Результат:

- `Strapi`: `http://127.0.0.1:1337/admin`
- публичный сайт: `http://127.0.0.1:8080`

Если Docker Desktop спрашивает про WSL integration с `Ubuntu`, для этого проекта ее можно пропустить. Локальному smoke-flow нужен Docker engine, а не Docker CLI внутри вашей личной Ubuntu-дистрибуции.

## Основные команды

### Обновить generator-owned контент

```powershell
npm.cmd run seed-content
```

### Полная сборка с QA

```powershell
npm.cmd --prefix portal run build
```

### PR CI

На каждый `pull_request` в `main` запускается workflow `CI`:

- `npm run test:contracts`
- `npm run check:docs-consistency`
- `portal build`
- `content-check`
- `link-graph`
- `encoding-check`
- условный `seed-content` smoke при доступных secrets

Важно:

- deploy workflows не заменены, это отдельный защитный PR gate
- для fork PR build/smoke могут быть skipped, потому что текущая архитектура требует `STRAPI_URL` и `STRAPI_TOKEN`

Локально тот же набор проверок:

```powershell
npm.cmd run test:contracts
npm.cmd run check:docs-consistency
npm.cmd --prefix portal run build
```

### Собрать snapshot для GitHub Pages demo

```powershell
npm.cmd --prefix portal run snapshot:github-demo
```

## Главные правила проекта

- Не создавайте `generated`-страницы вручную в Strapi.
- Не меняйте `content_origin`, если не понимаете ownership-последствия.
- Не хардкодьте новый пользовательский текст в шаблон, если блок должен редактироваться через CMS.
- Любой новый CMS-owned блок требует обновления схемы, адаптеров и документации.
- Перед публикацией всегда должен проходить `npm.cmd --prefix portal run build`.
- Перед merge в `main` должен быть зеленый PR workflow `CI`, если PR не ограничен отсутствием secrets.

## Где источник истины

- Для programmatic family: `cms/seed/*.json` и `scripts/seed-runtime-content.mjs` как orchestration entrypoint
- Для managed singleton pages: Strapi admin
- Для шаблонов, стилей, адаптива и shared UI behavior: `portal/`

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

Подробнее:

- [Контракты шаблонов](docs/template-contracts.md)
- [Матрица маршрутов и ownership](docs/route-ownership-matrix.md)
- [Route-to-template registry](portal/src/lib/page-template-map.ts)

## Важные ссылки

- [Главная карта документации](docs/index.md)
- [Глоссарий](docs/glossary.md)
- [Гайд оператора](docs/operator-guide.md)
- [Матрица маршрутов и ownership](docs/route-ownership-matrix.md)
- [Контракты шаблонов](docs/template-contracts.md)
- [Карта файлов](docs/file-map.md)
- [Контракт безопасных изменений](docs/change-safety.md)
- [AI Generation для блоков](docs/ai-block-generation.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Release Flow](docs/release-flow.md)
- [Known Risks](docs/known-risks.md)
- [Деплой](DEPLOY.md)

## Вход для владельца без технички

Если нужен самый короткий вход для владельца, партнера или менеджера, начните отсюда:

- [Быстрый вход для владельца](docs/owner-quickstart.md)
- [Гайд оператора](docs/operator-guide.md)
- [Деплой](DEPLOY.md)
