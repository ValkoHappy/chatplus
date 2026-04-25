# AI-генерация черновиков для managed-страниц

Этот документ описывает рабочий AI-контур для `page_v2` в `CHATPLUS`.

Главный принцип:

- AI не публикует страницы сам
- AI создаёт только `page_v2 draft`
- AI не ставит `migration_ready=true` автоматически
- итоговое решение всегда остаётся за редактором в `Strapi`

## Что уже есть в проекте

AI-контур построен вокруг двух сущностей:

- `page_v2` — сама страница
- `generation_job` — задача на AI-генерацию draft

`generation_job` используется и для:

- ручного запуска по запросу
- запуска по расписанию

Это означает, что ручной и scheduled режимы используют один и тот же pipeline и один и тот же page contract.

## Главное ограничение текущего этапа

AI включён только для тех page family, где ручная parity уже подтверждена как безопасная.

Разрешённые blueprint:

- `campaign`
- `brand`
- `resource`

AI сейчас не должен использоваться для:

- `landing`
- `comparison`
- `home`
- `demo`
- `tenders`

Если у `generation_job` указан blueprint вне разрешённого списка, runner завершит задачу ошибкой и не создаст draft.

## Что нужно настроить

В `.env` или `deploy/.env` должны быть:

```env
STRAPI_URL=...
STRAPI_TOKEN=...
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
```

Минимум для запуска:

- `STRAPI_URL`
- `STRAPI_TOKEN`

Если нужен реальный запрос в OpenAI, дополнительно нужен `OPENAI_API_KEY`.

## Локальный mock-режим

Если нужно проверить pipeline локально без реального `OPENAI_API_KEY`, можно использовать mock JSON:

```powershell
npm run page-v2:generate:queued -- --mock-response-file=scripts/page-v2-generation/mock-response.sample.json
```

Этот режим всё равно проверяет:

- pickup queued jobs
- route collision handling
- blueprint validation
- создание только draft-страницы
- обновление `run_report`

## Ручной AI-запрос

В `Strapi`:

1. Создайте запись `generation_job`
2. Заполните:
   - `title`
   - `job_type = manual_request`
   - `target_blueprint`
   - `request_prompt`
   - `requested_by`
3. При необходимости добавьте target relations:
   - channels
   - industries
   - integrations
   - solutions
   - features
   - business types
   - competitors
4. Оставьте `status = queued`

Дальше запустите:

```powershell
npm run page-v2:generate -- --job-id=JOB_ID
```

Или обработайте все queued manual jobs:

```powershell
npm run page-v2:generate:queued -- --job-type=manual_request
```

Результат:

- `generation_job.status` станет `draft_ready` или `failed`
- `run_report` заполнится
- в `page_v2` появится draft для редакторского review

## Плановая генерация

Для scheduled задачи в `Strapi`:

- `job_type = scheduled`
- `status = queued`

Обработчик:

```powershell
npm run page-v2:generate:scheduled
```

Этот режим берёт только queued jobs с `job_type = scheduled` и тоже создаёт только drafts.

## Режим отчёта

Посмотреть очередь и статусы:

```powershell
npm run page-v2:generate:report
```

## Пробный прогон

Если нужно проверить prompt, route и block-структуру без записи draft:

```powershell
npm run page-v2:generate -- --job-id=JOB_ID --dry-run
```

В этом режиме:

- job не переводится в `draft_ready`
- `run_report` обновляется
- страница не сохраняется

## Что делает генератор

Runner:

- читает `generation_job`
- проверяет, что blueprint разрешён для AI
- строит prompt под выбранный blueprint
- генерирует JSON draft через OpenAI или mock response
- нормализует blocks под `page_v2`
- валидирует sections по blueprint
- строит безопасный `route_path`
- не даёт draft занять reserved route
- при коллизии добавляет suffix и пишет warning в report
- сохраняет draft как `page_v2`
- выставляет:
  - `generation_mode = ai_assisted` для `manual_request`
  - `generation_mode = ai_generated` для `scheduled`
  - `source_mode = hybrid`
  - `editorial_status = review`
  - `human_review_required = true`

## Что делает редактор после AI

1. Открывает созданный `page_v2 draft`
2. Проверяет:
   - `title`
   - `route_path`
   - SEO
   - sections
   - nav и sitemap flags
   - breadcrumbs
   - internal links
3. Исправляет copy и блоки при необходимости
4. Переводит страницу в `approved`
5. Нажимает `Publish`

Если AI draft относится к мигрируемому legacy route, после publish всё равно нужен отдельный parity approval. До `migration_ready=true` и `parity_status=approved` публичный route остаётся на legacy fallback.

После этого срабатывает обычный publish flow:

`Publish -> webhook -> relay -> rebuild -> deploy`

## Политика защиты от поломок

AI не должен ломать существующие страницы и не участвует в опасной миграции напрямую.

Правила:

- AI не трогает legacy templates
- AI не публикует страницы сам
- AI не перехватывает immutable reserved routes
- AI не получает доступ к family без подтверждённой ручной parity
- AI не выставляет `migration_ready=true`
- rollback делается обычным путём: draft не публикуется, published `page_v2` снимается с публикации или у route снимается `migration_ready`

## Cron для плановой генерации

Пример cron-файла:

- [deploy/system/cron.page-v2-ai.example](../deploy/system/cron.page-v2-ai.example)

## Ограничения текущего этапа

- AI не публикует страницы сам
- AI не мигрирует imported catalog families в `page_v2`
- AI не создаёт новые block types
- AI не обходит reserved route policy
- AI не используется для `pricing`, `comparison`, `home`, `demo`, `tenders`

## Связанные документы

- [Конструктор managed-страниц](page-v2-manual-builder.md)
- [Как добавлять страницы](how-to-add-page.md)
- [Матрица маршрутов и ownership](route-ownership-matrix.md)
- [Гайд оператора](operator-guide.md)
