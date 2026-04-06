# Деплой CHATPLUS

У `CHATPLUS` сейчас есть два режима работы:

- `demo-mode` для showcase-потока `pages-preview/ -> GitHub Pages`
- `production-mode` для переходного боевого контура `VPS + docker`, где живут `Strapi`, `Postgres`, relay и сборка сайта

Главное изменение новой модели:

- `Strapi` — главный редакторский интерфейс
- `Astro` — только сборка и рендер статики
- importer загружает SEO/catalog данные в `Strapi`, но не считается вечным главным владельцем live-контента
- публикация строится вокруг схемы `Publish -> webhook -> relay -> CI rebuild -> deploy`

## 1. Demo-mode

Текущий demo publishing flow:

`local Strapi -> Astro build -> pages-preview -> GitHub Pages`

Используйте demo-mode, когда нужно быстро обновить публичный showcase, не трогая production VPS.

### Demo operator flow

1. Запустить локальный Strapi:

```powershell
npm.cmd --prefix cms run develop
```

2. Если менялся импортируемый catalog/SEO контент, сначала посмотреть план:

```powershell
npm.cmd run seed-content:plan
```

3. Если план корректный, применить импорт:

```powershell
npm.cmd run seed-content
```

4. Собрать GitHub Pages snapshot:

```powershell
npm.cmd --prefix portal run snapshot:github-demo
```

5. Закоммитить и запушить обновленный `pages-preview/`.

## 2. Production-mode

Production больше не описывается как ручная SSH-сессия, где все держится на памяти.

Переходный production contour сейчас такой:

- `postgres` для CMS-данных
- `strapi` для админки и API
- `content-relay` для безопасного приема `Strapi` webhooks и вызова `repository_dispatch`
- `nginx` для публичного сайта и reverse proxy на CMS
- одноразовые контейнеры:
  - `portal-builder`
  - `tools`
  - `certbot`

Production runbook:

- [deploy/DEPLOY_PRODUCTION.md](deploy/DEPLOY_PRODUCTION.md)
- [Production setup checklist](docs/production-setup-checklist.md)

Главные production entrypoints:

- [deploy.sh](deploy/scripts/deploy.sh)
- [update.sh](deploy/scripts/update.sh)
- [backup.sh](deploy/scripts/backup.sh)
- [restore.sh](deploy/scripts/restore.sh)

## 3. Новая operational-модель

Старая user-facing логика `generated vs managed` считается legacy.

Рабочая модель теперь такая:

- `managed`
  - запись создается и редактируется руками в `Strapi`
  - importer ее не трогает
- `imported`
  - запись создается importer-ом
  - живет в `Strapi`
  - повторный sync обновляет только `system-owned` поля
- `settings`
  - singleton/system records

Legacy-поле `content_origin` временно остается ради совместимости со старыми данными и текущим frontend.

Подробно:

- [docs/cms-model.md](docs/cms-model.md)
- [docs/content-workflow.md](docs/content-workflow.md)
- [docs/import-policy.md](docs/import-policy.md)

## 4. Что редактор меняет руками

Руками в `Strapi` теперь в первую очередь меняется:

- `Landing Page`
- `Tenders Page`
- `Business Types Page`
- `Site Settings`

Imported catalog/SEO сущности:

- `Competitor`
- `Solution`
- `Channel`
- `Industry`
- `Integration`
- `Feature`
- `Business Type`

остаются в CMS, но работают по safe-sync правилам. Обычный редактор не должен использовать их как свободный ручной каталог.

Гайд оператора:

- [docs/operator-guide.md](docs/operator-guide.md)

## 5. Publish flow

Целевая publish-схема сейчас уже зафиксирована в коде и workflow-файлах:

1. Редактор меняет запись в `Strapi`
2. Нажимает `Publish`
3. `Strapi webhook` уходит в relay
4. Relay валидирует токен и вызывает `repository_dispatch`
5. GitHub Actions запускает:
   - `Astro build`
   - `content-check`
   - `link-graph`
   - `encoding-check`
   - deploy static artifact

Важно:

- для editor-facing типов включен `draftAndPublish`
- relay не встроен напрямую в `Strapi`, а живет отдельным небольшим сервисом
- code deploy и content publish идут разными pipeline

Подробно:

- [docs/release-flow.md](docs/release-flow.md)

## 6. Что уже поддерживает production-mode

- воспроизводимый deploy на чистую Ubuntu VPS
- `Postgres` для Strapi
- переход к `Strapi-first` редакторской модели
- safe importer с режимами:
  - `plan`
  - `apply`
  - `force-sync`
  - `report`
- relay для publish automation
- backup/restore scripts
- S3-compatible upload provider в production-конфиге

## 7. Что production-mode пока не делает

- не убирает VPS полностью
- не делает финальный static CDN cutover за вас
- не включает enterprise IaC уровня Terraform/Ansible
- не делает автоматическое создание Strapi webhook через код
- не заменяет ручную первоначальную настройку ролей и токенов

То есть это уже зрелый переходный production layer, но еще не финальная hosted delivery-модель.

## 8. Local Docker smoke mode

Если на локальной машине есть Docker Desktop, можно проверить CMS/data plane и публичную сборку локально.

Windows-friendly entrypoints:

- [preflight-local.cmd](deploy/scripts/preflight-local.cmd)
- [local-up.cmd](deploy/scripts/local-up.cmd)
- [local-build-portal.cmd](deploy/scripts/local-build-portal.cmd)
- [local-seed-content.cmd](deploy/scripts/local-seed-content.cmd)
- [local-down.cmd](deploy/scripts/local-down.cmd)

PowerShell-варианты:

- [preflight-local.ps1](deploy/scripts/preflight-local.ps1)
- [local-up.ps1](deploy/scripts/local-up.ps1)
- [local-build-portal.ps1](deploy/scripts/local-build-portal.ps1)
- [local-seed-content.ps1](deploy/scripts/local-seed-content.ps1)
- [local-down.ps1](deploy/scripts/local-down.ps1)

Быстрый старт:

```powershell
Copy-Item deploy/.env.local.example deploy/.env.local
.\deploy\scripts\local-up.cmd
```

Дальше:

1. Открыть `http://127.0.0.1:1337/admin`
2. Создать первого Strapi admin user
3. Создать `API Token`
4. Записать его в `deploy/.env.local` как `STRAPI_API_TOKEN`
5. При необходимости проверить импорт:

```powershell
.\deploy\scripts\local-seed-content.cmd
```

6. Собрать публичный сайт:

```powershell
.\deploy\scripts\local-build-portal.cmd
```

Локальные адреса:

- `http://127.0.0.1:1337/admin`
- `http://127.0.0.1:8080`

Примечания:

- локальный `content-relay` тоже поднимается как часть local stack
- WSL integration с личной `Ubuntu` для этого проекта не обязательна; нужен только рабочий Docker engine
- `PUBLIC_SITE_URL` в `deploy/.env.local` можно держать production-like, чтобы локальная проверка проходила те же canonical/content checks

## 9. Связанные документы

- [Модель CMS](docs/cms-model.md)
- [Контентный workflow](docs/content-workflow.md)
- [Политика импорта](docs/import-policy.md)
- [Гайд оператора](docs/operator-guide.md)
- [Production runbook](deploy/DEPLOY_PRODUCTION.md)
