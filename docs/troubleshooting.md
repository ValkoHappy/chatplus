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

## 4. Новая generated page не появилась

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

4. Маршрут действительно входит в generator-owned family.
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

Что делать:

1. Прогнать build.
2. Если нужен demo snapshot:

```powershell
npm.cmd --prefix portal run snapshot:github-demo
```

3. Commit + push.
4. После публикации сделать `Ctrl+F5`.

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
