# Передача следующего production-этапа

Этот документ нужен для следующего шага после текущего `commit-ready` состояния.

Сейчас в репозитории уже готовы:

- `page_v2` как новый page-first слой для ручных managed pages
- safe bridge `published page_v2 -> render page_v2`, иначе legacy source
- migration CLI для route-by-route переноса managed routes
- `generation_job` и AI draft flow

В этот этап **не входят**:

- commit / push
- deploy нового CMS-кода в production
- live migration waves
- live AI cutover

Ниже описан именно handoff для следующего прод-этапа.

## 1. Что сделать сразу после будущего деплоя

После того как новый код `cms` и `portal` окажется на VPS, нужно проверить, что live `Strapi` уже видит новые content types и готов к migration.

Локально или на сервере с выставленными `STRAPI_URL` и `STRAPI_TOKEN` выполните:

```powershell
npm run page-v2:live:ready
```

Проверка должна подтвердить:

- открывается live `Strapi admin`
- доступен `/api/page-v2s`
- доступен `/api/generation-jobs`

Если нужен машиночитаемый отчёт:

```powershell
npm run page-v2:live:ready -- --json
```

## 2. Что делать, если проверка готовности не прошла

### Не открывается `/admin`

Проверьте:

- контейнер `strapi`
- `nginx`
- SSL и домен `strapi.<domain>`

### Не открывается `/api/page-v2s`

Это обычно значит одно из трёх:

- новый CMS-код ещё не задеплоен
- `Strapi` не пересобран после обновления
- используется невалидный `STRAPI_TOKEN`

### Не открывается `/api/generation-jobs`

Проверьте те же вещи, что и для `page_v2`, но уже применительно к `generation_job`.

Пока readiness-check не зелёный, **не начинайте live migration routes**.

## 3. Волны контролируемой миграции

После зелёного readiness-check идём только route-by-route.

Сначала смотрим план:

```powershell
npm run page-v2:migrate:managed:report
```

### Волна 1

- `/promo`
- `/prozorro`
- `/media`
- `/team`
- `/conversation`
- `/tv`
- `/docs`
- `/help`
- `/academy`
- `/blog`
- `/status`

### Волна 2

- `/pricing`
- `/partnership`

### Волна 3

- `/`
- `/demo`
- `/solutions/tenders`

## 4. Перенос по одному маршруту

Для каждого route порядок один и тот же:

1. Снять baseline текущей live страницы.
2. Подготовить draft через migration CLI:

```powershell
npm run page-v2:migrate:managed -- --route=/promo
```

3. Создать или обновить draft в `Strapi`:

```powershell
npm run page-v2:migrate:managed -- --route=/promo --apply
```

4. Проверить draft в `Strapi`.
5. Проверить parity:
   - hero
   - CTA
   - nav/footer/mobile nav
   - sitemap
   - breadcrumbs
   - internal links
6. Только после этого публиковать route:

```powershell
npm run page-v2:migrate:managed -- --route=/promo --apply --publish
```

7. Подтвердить, что route реально рендерится из `page_v2`, а не из legacy fallback.

## 5. Быстрый откат

Если после publish route ведёт себя не так, как ожидалось:

```powershell
npm run page-v2:migrate:managed -- --route=/promo --unpublish
```

После этого ownership route возвращается к legacy source через bridge.

Отдельный emergency code rollback для такой ситуации не нужен.

## 6. Проверочная live AI smoke-сессия

AI включаем только после ручной parity для разрешённых family:

- `campaign`
- `brand`
- `resource`

Не включаем в первом live AI этапе:

- `pricing`
- `comparison`
- `home`
- `demo`
- `tenders`

### Ручной запрос

1. Создайте `generation_job` в `Strapi`
2. Укажите `job_type=manual_request`
3. Запустите:

```powershell
npm run page-v2:generate -- --job-id=JOB_ID
```

Ожидаемое поведение:

- создаётся только `page_v2 draft`
- ничего не публикуется автоматически

### Плановая smoke-проверка

```powershell
npm run page-v2:generate:scheduled
```

Ожидаемое поведение:

- queued scheduled jobs переходят в обработку
- создаются только drafts
- редактор дальше решает, публиковать их или нет

## 7. Что считается успешным следующим этапом

Можно считать следующий production-этап успешным, только если:

- readiness-check зелёный
- хотя бы один route из каждой wave прошёл live parity smoke
- rollback через `--unpublish` подтверждён
- `manual_request` AI smoke создаёт только draft
- `scheduled` AI smoke создаёт только draft

## 8. Что остаётся legacy даже после этого

Даже после успешного прод-этапа это нормально:

- legacy wrappers остаются compatibility layer
- imported catalog и SEO families не переезжают в `page_v2`
- `/site-map` остаётся utility route

Удаление legacy слоя — это отдельная будущая cleanup-задача, не часть текущего безопасного перехода.
