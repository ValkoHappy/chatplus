# Troubleshooting CHATPLUS

Этот файл нужен для быстрого разбора типичных проблем без долгих поисков по проекту.

## 1. Strapi не отвечает

Признаки:

- `seed-content` падает с `fetch failed`
- `astro build` падает на fetch к `/api/...`
- локально не открывается `http://127.0.0.1:1337/admin`

Что проверить:

1. Запущен ли Strapi:

```powershell
npm.cmd --prefix cms run develop
```

2. Отвечает ли API:

```powershell
Invoke-WebRequest 'http://127.0.0.1:1337/api/channels?pagination[pageSize]=1'
```

3. Нет ли зависшего старого процесса `node`.

## 2. `seed-content` падает

Чаще всего причины две:

- Strapi недоступен
- validation generator/import контракта не сошлась

Что делать:

1. Перезапустить Strapi.
2. Запустить `seed-content` еще раз.
3. Если ошибка повторяется, проверить:
   - `template_kind`
   - `content_origin`
   - required fields per template
   - route/template consistency

Ключевой файл:

- `scripts/seed-runtime-content.mjs`

После декомпозиции чаще всего смотреть сюда:

- `scripts/seed-runtime-content/validators.mjs`
- `scripts/seed-runtime-content/rules.mjs`
- `scripts/seed-runtime-content/ownership.mjs`

## 3. `astro build` падает на fetch

Признаки:

- ошибки вида `Fetch to Strapi failed`
- `Strapi returned no data for ...`

Что делать:

1. Проверить, что Strapi жив.
2. Проверить `.env` и URL до CMS.
3. Повторить build после ответа API.

Команда:

```powershell
npm.cmd --prefix portal run build
```

## 4. Новая imported page не появилась

Что проверить:

1. Запись реально добавлена в `cms/seed/*.json`.
2. Выполнен:

```powershell
npm.cmd run seed-content
```

3. Если нужен materialized JSON snapshot, выполнен:

```powershell
node scripts/export-from-strapi.mjs
```

4. Маршрут действительно входит в importer-owned family.
5. Route-template mapping и ownership не противоречат docs.

## 5. Новая managed singleton page не появилась

Что проверить:

1. В Strapi создана запись `landing-page`.
2. У нее корректны:
   - `slug`
   - `template_kind`
   - `content_origin = managed`
3. Frontend знает, как этот `template_kind` рендерить.
4. После этого прогнан build.

## 6. Страница рендерится “не тем шаблоном”

Что проверить:

1. `route-template mapping`
2. `template_kind`
3. docs в:
   - `docs/template-contracts.md`
   - `docs/route-ownership-matrix.md`

Ключевой файл:

- `portal/src/lib/page-template-map.ts`

Если shape данных кажется “почти правильной, но секция собралась не так”, дополнительно смотрите:

- `portal/src/lib/page-adapters/shared.ts`
- `portal/src/lib/page-adapters/details.ts`
- `portal/src/lib/page-adapters/intersections.ts`
- `portal/src/lib/page-adapters/specialized.ts`

## 7. Контент обновился в Strapi, но на сайте старый

Возможные причины:

- build не был прогнан после изменения
- опубликован старый `pages-preview`
- GitHub Pages держит старый артефакт
- браузер или Telegram показывают кэш
- production VPS не пересобрал статический сайт

Что делать:

1. Прогнать build.
2. Если нужен demo snapshot:

```powershell
npm.cmd --prefix portal run snapshot:github-demo
```

3. Commit + push.
4. После публикации сделать `Ctrl+F5`.

Для production-mode:

```bash
./deploy/scripts/build-portal.sh
```

## 8. На GitHub Pages старые стили

Что делать:

1. Убедиться, что новый snapshot закоммичен.
2. Проверить, что push прошел.
3. Подождать деплой GitHub Pages.
4. Обновить страницу без кэша.

## 9. В Telegram нет новой превьюхи

Что проверить:

1. Есть ли live `og:image`.
2. Возвращает ли картинка `200`.
3. Не держит ли Telegram старый кэш.

Что делать:

- попробовать `@WebpageBot`
- повторно отправить ссылку позже
- при необходимости поменять имя `og-image` файла для cache bust

## 10. После изменения шаблона все “поплыло”

Что проверить:

1. Изменение было только visual или contract-level.
2. Не появился ли новый CMS-owned block без docs/schema/adapters.
3. Не поменялся ли ожидаемый набор полей.
4. Не был ли silently заменен один шаблон другим.

Смотрите:

- `docs/change-safety.md`
- `docs/how-to-add-page.md`
- `docs/template-contracts.md`

## 10a. После декомпозиции непонятно, где искать проблему

Ориентир по типу поломки:

- page shape, fallback, assembled sections -> `portal/src/lib/page-adapters/*`
- import, ownership, required fields -> `scripts/seed-runtime-content/ownership.mjs`, `rules.mjs`, `validators.mjs`
- normalizers/preparers -> `scripts/seed-runtime-content/normalizers.mjs`
- Strapi request/upsert -> `scripts/seed-runtime-content/strapi-client.mjs`
- public orchestration/entrypoint -> `scripts/seed-runtime-content.mjs`

## 11. Если непонятно, куда идти

Сначала откройте:

1. `docs/index.md`
2. `docs/route-ownership-matrix.md`
3. `docs/template-contracts.md`
4. `docs/change-safety.md`

Обычно этого уже достаточно, чтобы понять, проблема в:

- frontend
- CMS schema
- import/generator
- deploy/publish

## 12. PR workflow `CI` красный или skipped

Что означает красный `CI`:

- сломался `portal build`
- не прошли `content-check`, `link-graph` или `encoding-check`
- для внутреннего PR отсутствуют `STRAPI_URL` / `STRAPI_TOKEN`
- не прошел `seed-content` runtime-smoke

Что означает skipped:

- это fork PR и GitHub не дал secrets
- в текущей архитектуре build/smoke могут быть пропущены, потому что проект зависит от live Strapi secrets

Что делать:

1. Для internal PR проверить secrets в GitHub Actions.
2. Повторить локально:

```powershell
npm.cmd run test:contracts
npm.cmd run check:docs-consistency
npm.cmd --prefix portal run build
npm.cmd run seed-content
```

3. Если локально все ок, смотреть логи конкретного job:
- `build-and-check`
- `seed-runtime-smoke`

## 13. Упали contract tests или docs/code consistency

Если краснеет `npm run test:contracts`, смотрите по типу поломки:

- rules и enum drift -> `scripts/seed-runtime-content/rules.mjs`
- ownership merge/hydration -> `scripts/seed-runtime-content/ownership.mjs`
- landing-page validation -> `scripts/seed-runtime-content/validators.mjs`
- adapter output shape -> `portal/src/lib/page-adapters.ts` и `portal/src/lib/page-adapters/*`
- Strapi boundary normalization -> `portal/src/lib/strapi.ts` и `portal/src/lib/strapi-schemas.ts`

Если краснеет `npm run check:docs-consistency`, проверяйте:

- `docs/template-contracts.md`
- `docs/route-ownership-matrix.md`
- `portal/src/lib/page-template-map.ts`
- `config/template-kinds.mjs`

## 14. Production: контейнер Strapi unhealthy

Что проверить:

1. Стартовал ли `postgres`
2. Корректны ли переменные в `deploy/.env`
3. Есть ли драйвер `pg` и production build image собран без ошибок

Команды:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml ps
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml logs -f strapi
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml logs -f postgres
```

## 15. Production: `portal-builder` не может достучаться до CMS

Признаки:

- `build-portal.sh` падает на fetch к Strapi
- `Strapi returned no data for ...`

Что проверить:

1. Жив ли контейнер `strapi`
2. Правилен ли `STRAPI_INTERNAL_URL` в `deploy/.env`
3. Заполнен ли `STRAPI_API_TOKEN`

Команда:

```bash
./deploy/scripts/build-portal.sh
```

## 16. Production: nginx отдает старую статику

Что проверить:

1. Выполнялся ли `build-portal.sh`
2. Не упал ли one-off `portal-builder`
3. Не смотрите ли вы старый кэш браузера/CDN

Полезно повторить:

```bash
./deploy/scripts/build-portal.sh
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml logs -f nginx
```

## 17. Production: перенос на новый VPS после сбоя

Правильный flow:

1. Поднять новую чистую Ubuntu
2. Повторить bootstrap и env setup
3. Перенести backup directory
4. Выполнить:

```bash
./deploy/scripts/restore.sh /path/to/backup-directory
./deploy/scripts/build-portal.sh
```

Основной runbook:

- [deploy/DEPLOY_PRODUCTION.md](../deploy/DEPLOY_PRODUCTION.md)

## 18. Локальный Docker smoke не поднимается

Что нужно для локального режима:

1. установлен Docker Desktop
2. создан `deploy/.env.local`
3. выполнен:

```bash
./deploy/scripts/local-up.sh
```

Если public site пустой, это нормально до первого:

```bash
./deploy/scripts/local-build-portal.sh
```

## 19. Local Docker smoke на Windows

Для реального Windows flow используйте:

```powershell
.\deploy\scripts\local-up.cmd
.\deploy\scripts\local-seed-content.cmd
.\deploy\scripts\local-build-portal.cmd
```

Правильный порядок локального smoke:

1. `local-up`
2. create Strapi admin
3. create API token
4. записать `STRAPI_API_TOKEN` в `deploy/.env.local`
5. `local-seed-content`
6. `local-build-portal`

Если до первой сборки сайт выглядит пустым, это нормально.

## 20. Docker Desktop ругается на WSL integration с Ubuntu

Если Docker Desktop показывает ошибку именно про WSL integration с вашей личной `Ubuntu`-дистрибуцией:

- это не блокер для `CHATPLUS`
- local smoke flow требует только рабочий Docker engine
- интеграцию с личной `Ubuntu` можно пропустить

Безопасные действия:

1. Click `Skip WSL distro integration` if Docker offers it.
2. In `Docker Desktop -> Settings -> Resources -> WSL Integration`, disable integration for `Ubuntu`.
3. Continue using the Windows local scripts.

## 21. Local Docker build проходит, но content-check падает на canonical

Для local smoke это обычно значит, что был изменен `PUBLIC_SITE_URL` в `deploy/.env.local`.

Expected value:

```text
PUBLIC_SITE_URL=https://chatplus.ru
```

Это сделано специально: local Docker smoke проверяет production-style canonical URLs и должен проходить те же `content-check` guardrails, что и обычная сборка.
