# AI-заполнение страниц через Generation Job

Этот документ описывает рабочий AI-контур для `page_v2` в `CHATPLUS`.

Главный принцип:

- AI не публикует страницы сам
- AI не работает в свободном режиме и не придумывает страницу с нуля
- AI дорабатывает только выбранную существующую `Page` через `target_page`
- AI сохраняет тот же `route_path`, `page_kind`, порядок блоков, типы блоков и `variant`
- AI не ставит `migration_ready=true` автоматически
- итоговое решение всегда остаётся за редактором в `Strapi`

Рабочая роль редактора в Strapi называется `AI Draft Editor`. Человек с этой ролью может создавать, редактировать, публиковать, снимать с публикации и удалять `Page`, а также создавать `Generation Job`. AI при этом всё равно не получает права публиковать или удалять страницы: публикация и удаление остаются ручным действием редактора после preview-проверки.

### Как понимать `target_blueprint`

`target_blueprint` нужен не для свободы, а для выбора правильного семейства страницы. Это короткая подсказка для runner и AI, чтобы они держались нужного макета.

- `campaign` - промо, спецпроект, продающая страница, страница под конкретный сценарий.
- `brand` - страница направления, категории или бренда.
- `resource` - гайд, инструкция, справка, чеклист.

Правило выбора простое:

- если страница продаёт сценарий - `campaign`;
- если страница объясняет направление или категорию - `brand`;
- если страница учит, объясняет или помогает разобраться - `resource`.

Для URL вида `/channels/...`, `/industries/...`, `/integrations/...` и похожих каталоговых страниц `resource` подходит только тогда, когда это действительно статья или гайд. Если это карточка каталога, пересечение сущностей или обычная продуктовая страница, выбирайте тот `page_kind`, который уже соответствует её макету.

## Текущий приоритет: управлять страницами через AI

Для обычной работы редактора основной путь теперь такой:

1. Сначала выбрать или создать `Page` с правильным макетом и нужным типом страницы.
2. Создать `Generation Job`, чтобы AI заполнил или переписал контент выбранной страницы.
3. Обязательно выбрать эту страницу в `target_page`.
4. В prompt описать задачу человеческим языком: тема, аудитория, цель страницы, CTA, ограничения.
5. При необходимости выбрать связи-категории: `target_channels`, `target_industries`, `target_integrations`, `target_solutions`, `target_features`, `target_business_types`, `target_competitors`.
6. Оставить `job_status = queued`.
7. После запуска runner открыть ту же `Page` как черновик, посмотреть Astro preview и проверить текст.
8. Если страница слабая, создать новый `Generation Job`, снова выбрать эту же страницу в `target_page` и написать prompt на доработку.
9. Публиковать только после человеческой проверки.

Ручное редактирование `Page -> sections` остаётся запасным способом для маленьких точечных правок: заменить фразу, ссылку, CTA или SEO. Для новой страницы сначала нужен правильный каркас `Page`; AI потом заполняет текст внутри этого каркаса.

## Какой способ выбрать

| Ситуация | Что делать |
| --- | --- |
| Нужно заполнить новую страницу с уже готовым макетом | Создать `Generation Job`, выбрать готовую `Page` в `target_page`, написать prompt на заполнение |
| AI сделал черновик, но текст слабый | Создать новый `Generation Job`, выбрать эту же `Page` в `target_page`, написать prompt на доработку |
| Нужно исправить одну фразу, ссылку, CTA, FAQ или SEO | Открыть `Content Manager -> Page`, раскрыть `sections`, исправить руками и сохранить |
| Нужно добавить, удалить или переставить блоки | Делать это как изменение каркаса `Page`, а не через AI prompt |
| Нужен новый тип блока | Нужна техническая задача: Strapi schema + frontend renderer + tests + docs |
| Страница выглядит плохо в preview | Не публиковать. Сначала доработать prompt-ом или руками, затем снова проверить preview |

Главное: AI не является кнопкой "опубликовать". Он делает черновик или доработку черновика. Финальное решение всегда принимает редактор после preview.

## Стандарт страницы для AI

Runner теперь передаёт модели текущую структуру выбранной `Page` и требует сохранить её без изменений. Это нужно, чтобы AI не собирал страницу как случайный набор блоков.

Важное правило: AI больше не выбирает свободный макет. Новая страница должна уже быть `page_v2` с правильным `page_kind`, блоками и variants. Для `campaign`, `brand` и `resource` каркас должен повторять семейный page-v2 layout/preset: столько же смысловых блоков и в том же порядке, как у оригинальных страниц этого типа. Старые legacy-шаблоны не являются способом создания новых AI-страниц. Их можно использовать только как визуальный ориентир для плотности, порядка секций и общего ощущения сайта, пока старые URL ещё живут в своих safety-gate маршрутах.

Для обычной `campaign`-страницы целевой вид такой:

- 8-9 видимых секций.
- Порядок: `hero -> cards-grid(problems) -> cards-grid(pillars) -> rich-text -> steps -> cards-grid(use_cases) -> faq -> related-links/internal-links -> final-cta`.
- `hero` один, с конкретной аудиторией/каналом/интеграцией из задачи и 3-4 `trust_facts`.
- `cards-grid` должен быть разделен по ролям: `variant = problems` для болей, `variant = pillars` или `editorial` для возможностей, `variant = use_cases` для сценариев. Один общий `cards-grid` для всей страницы считается слабым draft.
- `rich-text` нужен как короткое объяснение после карточек, чтобы страница не выглядела набором плиток.
- `steps` обычно 3 шага. 4 шага допустимы только если каждый короткий и реально нужен.
- `faq` обычно 5 практических вопросов.
- `related-links` или `internal-links` - 2-4 реальные внутренние ссылки.
- `final-cta` один, в конце, с основной ссылкой `/demo`.
- `route_path` для `campaign` должен быть внутри `/campaigns/...`; runner дополнительно поправит путь, если AI предложит корневой URL вроде `/campaign-whatsapp`.

Для `brand`-страницы:

- 7-8 видимых секций.
- Порядок: `hero -> cards-grid(problems) -> cards-grid(pillars) -> rich-text -> steps -> faq -> internal-links -> final-cta`.
- `hero` должен содержать 3-4 `trust_facts`.
- `route_path` должен быть внутри `/brand/...`.
- Страница объясняет бренд, категорию или направление продукта, а не делает comparison и не обещает цифры.

Для `resource`-страницы:

- 8-9 видимых секций.
- Порядок: `hero -> rich-text -> cards-grid(problems) -> cards-grid(pillars) -> steps -> cards-grid(use_cases) -> faq -> internal-links -> final-cta`.
- `hero` должен содержать 3-4 `trust_facts`.
- `route_path` должен быть внутри `/resources/...`.
- Тон более справочный: объяснить процесс, чеклист, подход или правила, а не продавать агрессивно.

AI не должен придумывать хлебные крошки и нижние плавающие CTA. Хлебные крошки строит frontend renderer по метаданным страницы, а глобальная липкая CTA отключается, если на странице уже есть `final-cta`.

AI не должен создавать sticky/floating CTA внутри контента. Draft смотрится через тот renderer, который уже положен выбранной `Page`: семейный page-v2 layout для `campaign`/`brand`/`resource` или существующий page-v2/bridge renderer для остальных типов. Legacy-шаблоны остаются только визуальным ориентиром и fallback для старых URL.

Если preview выглядит как вёрсточный черновик, а не как нормальная страница, не публикуйте её. Сначала исправьте каркас страницы или выберите правильную исходную `Page`, затем создайте новый `Generation Job` с `target_page` и prompt на доработку текста. AI не имеет права добавлять недостающие блоки вместо редактора или технического шаблона.

## Как просить доработать уже созданную страницу

В `Generation Job` заполните:

- `target_page` - выберите существующую `Page`, которую надо доработать.
- `target_blueprint` - должен совпадать с `page_kind` выбранной страницы. Если `page_kind = campaign`, здесь тоже `campaign`; если `page_kind = brand`, здесь `brand`; если `page_kind = resource`, здесь `resource`.
- `request_prompt` - напишите, что именно улучшить.
- `job_status = queued`.

Когда `target_page` выбран, runner передает AI краткий снимок текущей страницы: title, route, SEO и структуру блоков. `route_path` выбранной страницы сохраняется, даже если AI предложит другой URL. Результат обновляет черновик этой же `Page`, а не создает отдельную страницу. Если AI вернет другое число секций, другой порядок, другой `block_type` или другой `variant`, runner отклонит результат.

Пример prompt:

```text
Доработай выбранную страницу.
Сохрани route, порядок блоков, типы блоков и variants.
Сделай hero конкретнее для салонов красоты.
Добавь больше практических вопросов в FAQ.
CTA оставь на /demo.
Не публикуй страницу.
```

## Что можно просить в разных категориях

Категории в `Generation Job` не публикуют страницу сами по себе. Они дают AI контекст, чтобы текст был точнее:

- `target_channels` - страницы про канал связи: WhatsApp, Telegram, email.
- `target_industries` - отраслевые страницы: медицина, ритейл, недвижимость, салоны.
- `target_integrations` - страницы про связку с сервисом: amoCRM, Bitrix24, RetailCRM.
- `target_solutions` - сценарии: продажи, поддержка, заявки, повторные продажи.
- `target_features` - функции продукта: AI-ответы, аналитика, виджеты, рассылки.
- `target_business_types` - тип бизнеса: агентство, клиника, интернет-магазин.
- `target_competitors` - контекст для сравнений, но полноценные comparison-страницы пока не включены в безопасный AI cutover.

AI может заполнять контент для всех текущих `page_v2` типов, но только если выбрана существующая `target_page`: `landing`, `directory`, `entity_detail`, `entity_intersection`, `comparison`, `campaign`, `brand`, `resource`, `system`. Свободное создание страниц без `target_page` отключено. Если нужна новая страница, сначала создайте или материализуйте правильный каркас `Page`, а потом запускайте AI на заполнение текста и не забывайте выбрать понятный `target_blueprint`.

### Как выбрать категорию в Strapi

Поля `target_channels`, `target_industries`, `target_integrations`, `target_solutions`, `target_features`, `target_business_types`, `target_competitors` - это relation-поля Strapi.

Важно: выпадающий список показывает только несколько первых записей. Это не значит, что других вариантов нет.

Как искать:

1. Кликните в поле `Add or create a relation`.
2. Начните печатать часть названия: `whatsapp`, `telegram`, `amo`, `bitrix`, `мед`, `салон`, `retail`.
3. Выберите найденный вариант.
4. Если нужного варианта нет, не нажимайте `Create a relation` без согласования. Проще оставить поле пустым и описать контекст в `request_prompt`.

Для тестовой страницы категории можно не выбирать. Но `target_page` обязателен всегда, а `target_blueprint` должен совпадать с `page_kind` выбранной страницы.

Примеры:

- WhatsApp для салонов: `target_channels = WhatsApp`, `target_industries = Красота/салоны`, если такая запись находится поиском.
- Telegram для онлайн-школ: `target_channels = Telegram`, `target_industries = Образование`, если такая запись есть.
- amoCRM для продаж: `target_integrations = AmoCRM`, `target_solutions = Продажи`.

Если нужного варианта нет, есть два безопасных пути:

1. Создать запись вручную в соответствующем справочнике Strapi: `Channel`, `Industry`, `Integration`, `Solution`, `Feature`, `Business Type` или `Competitor`.
2. Позволить AI предложить новую запись в `run_report.proposed_entities`.

Во втором варианте runner ставит `job_status = needs_entity_review` и не обновляет страницу сразу. Оператор проверяет предложения и перезапускает задачу с `--approve-entity-proposals`. Только после этого недостающие справочники создаются как черновики `managed/frozen`, привязываются к задаче, и выбранная `Page` обновляется. Новый справочник не публикуется автоматически: перед публикацией нужно проверить страницу, связи и локальный `portal build`, потому что опубликованная категория может добавить новые catalog/intersection routes. Не создавайте записи случайно через `Create a relation` внутри `Generation Job`. Подробная инструкция: [Справочники: каналы, отрасли, интеграции и страницы по ним](entity-catalog-editor-workflow.md).

Если AI предложил сущность, которая уже есть в справочнике, runner не создает дубль и использует существующую запись как связь.

## Примеры prompt для Generation Job

Заполнение campaign-страницы по отрасли:

```text
Доработай выбранную campaign Page про CHATPLUS для стоматологий.
Не меняй route_path, page_kind, порядок блоков, block_type и variants.
Цель: показать, как клиника обрабатывает обращения из мессенджеров, не теряет заявки и быстрее отвечает пациентам.
Заполни существующие hero, problems, pillars, steps, use_cases, FAQ, links и final CTA нормальным русским текстом.
Пиши по-русски, без выдуманных цифр и медицинских обещаний.
```

Страница по интеграции:

```text
Доработай выбранную brand Page про интеграцию CHATPLUS с Bitrix24.
Сохрани текущий макет и все variants блоков.
Покажи пользу для отдела продаж: сообщения, заявки, история общения, контроль менеджеров.
Заполни каждый существующий блок: hero, problems, pillars, rich-text, steps, FAQ, internal-links и final CTA.
Не обещай функции, сроки, цены и проценты, которых нет в продукте.
```

Страница с новой категорией через AI-предложение:

```text
Доработай выбранную Page про Telegram для детских образовательных центров.
Сохрани текущий каркас страницы.
Если отдельной отрасли "детские образовательные центры" нет в выбранных категориях, предложи ее в proposed_entities.industries, но не создавай молча.
Цель: показать, как отвечать родителям, собирать заявки на пробные занятия и не терять переписки.
Пиши по-русски, без выдуманных цифр. CTA ведет на /demo.
```

Страница по нескольким категориям:

```text
Доработай выбранную campaign Page про WhatsApp + amoCRM для продаж в недвижимости.
Используй выбранные target_channels, target_integrations, target_industries и target_solutions как контекст.
Покажи путь заявки от первого сообщения до фиксации в CRM.
Не добавляй и не удаляй блоки. Перепиши текст внутри уже существующих sections: hero, problems, pillars, rich-text, steps, use_cases, FAQ, links, final CTA.
```

Доработка существующей страницы:

```text
Доработай выбранную страницу.
Сохрани route_path, общий смысл, порядок блоков, block_type и variants.
Сделай hero конкретнее, добавь больше практических примеров, улучши FAQ и убери слишком общие фразы.
Не публикуй страницу.
```

SEO и FAQ без изменения контента:

```text
Доработай выбранную страницу без смены route_path.
Не меняй порядок блоков, block_type и variants.
Усиль seo_title и seo_description, но не меняй основной оффер.
Добавь FAQ про внедрение, несколько каналов, CRM и безопасность доступа.
Не придумывай тарифы, проценты и интеграции, которых нет в текущем контексте.
```

Справочная resource-страница:

```text
Доработай выбранную resource Page "Как проверять AI-ответы перед публикацией".
Сохрани текущий resource-макет: тот же порядок секций и variants.
Цель: дать редактору понятный чеклист проверки текста, ссылок, FAQ и CTA.
Заполни существующие hero, rich-text, cards-grid, steps, FAQ, internal-links и final CTA.
Не используй 24/7, гарантии, проценты, цены и точные сроки.
```

## Что уже есть в проекте

AI-контур построен вокруг двух сущностей:

- `page_v2` — сама страница
- `generation_job` — задача на AI-генерацию draft

`generation_job` используется и для:

- ручного запуска по запросу
- запуска по расписанию

Это означает, что ручной и scheduled режимы используют один и тот же pipeline и один и тот же page contract.

## Главное ограничение текущего этапа

AI включён только как режим заполнения контента выбранной `Page`. Он не создаёт свободный макет и не выбирает тип страницы сам.

Разрешённые blueprint для выбранной `target_page`:

- `landing`
- `directory`
- `entity_detail`
- `entity_intersection`
- `comparison`
- `campaign`
- `brand`
- `resource`
- `system`

Если у `generation_job` нет `target_page`, runner завершит задачу ошибкой и не создаст draft. Если `target_blueprint` не совпадает с `page_kind` выбранной `Page`, runner тоже завершит задачу ошибкой.

## Что нужно настроить

В `.env` или `deploy/.env` должны быть:

```env
STRAPI_URL=...
STRAPI_TOKEN=...
```

Минимум для запуска:

- `STRAPI_URL`
- `STRAPI_TOKEN`

Если нужен реальный AI-запрос, нужен ключ провайдера. Сейчас runner поддерживает OpenAI-compatible chat completions:

```env
# OpenRouter + DeepSeek
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=deepseek/deepseek-chat
```

Можно указать любой другой совместимый endpoint:

```env
AI_API_BASE_URL=https://openrouter.ai/api/v1
AI_API_KEY=...
AI_MODEL=deepseek/deepseek-chat
```

Для прямого OpenAI старые переменные тоже работают:

```env
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
```

Не вставляйте реальные ключи в Git, документацию, issue, pull request или чат. Если ключ уже был отправлен в чат, его нужно считать скомпрометированным и перевыпустить.

## Локальный mock-режим

Если нужно проверить pipeline локально без реального AI-ключа, можно использовать mock JSON:

```powershell
npm run page-v2:generate:queued -- --mock-response-file=scripts/page-v2-generation/mock-response.sample.json
```

Этот режим всё равно проверяет:

- pickup queued jobs
- route collision handling
- blueprint validation
- обновление только выбранной draft-страницы
- обновление `run_report`

## Ручной AI-запрос

В `Strapi`:

1. Создайте запись `generation_job`
2. Заполните:
   - `title`
   - `job_type = manual_request`
   - `target_blueprint`
   - `target_page`
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
4. Оставьте `job_status = queued`

Дальше запустите:

```powershell
npm run page-v2:generate -- --job-id=JOB_ID
```

Или обработайте все queued manual jobs:

```powershell
npm run page-v2:generate:queued -- --job-type=manual_request
```

Результат:

- `generation_job.job_status` станет `draft_ready` или `failed`
- `run_report` заполнится
- выбранная `page_v2` обновится как draft для редакторского review

## Плановая генерация

Для scheduled задачи в `Strapi`:

- `job_type = scheduled`
- `job_status = queued`

Обработчик:

```powershell
npm run page-v2:generate:scheduled
```

Этот режим берёт только queued jobs с `job_type = scheduled` и тоже обновляет только выбранные drafts. Для scheduled jobs `target_page` также обязателен.

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
- проверяет, что `target_page` выбран
- проверяет, что blueprint разрешён для AI и совпадает с `page_kind`
- строит prompt под выбранный blueprint
- генерирует JSON draft через OpenAI или mock response
- нормализует blocks под `page_v2`
- валидирует sections по blueprint
- отклоняет слишком sparse draft для `campaign`/`brand`/`resource`, если нет `trust_facts`, `problems`, `pillars`, `steps`, FAQ или link-section
- сохраняет `route_path` выбранной страницы
- отклоняет результат, если AI поменял число секций, порядок, `block_type` или `variant`
- заменяет AI-ссылки на несуществующие внутренние URL безопасными разделами `/features`, `/solutions`, `/integrations`, `/demo`
- не даёт draft занять reserved route
- сохраняет draft как ту же `page_v2`
- выставляет:
  - `generation_mode = ai_assisted` для `manual_request`
  - `generation_mode = ai_generated` для `scheduled`
  - `source_mode = hybrid`
  - `editorial_status = review`
  - `human_review_required = true`

## Что делает редактор после AI

1. Открывает обновленный `Page` draft
2. Проверяет:
   - `title`
   - `route_path`
   - SEO
   - sections
   - nav и sitemap flags
   - как выглядят breadcrumbs в preview
   - internal links
3. Исправляет copy и блоки при необходимости
4. Переводит страницу в `approved`
5. Нажимает `Publish`

Если страница была создана только для теста или оказалась дублем, редактор может удалить её в Strapi через `Delete`, но только после проверки, что это не старая важная страница и не опубликованный route, который нужен сайту. Если страницу нужно просто временно убрать с сайта, используйте `Unpublish`, а не `Delete`.

Для еженедельного полуручного процесса достаточно такого режима:

1. Редактор или оператор подготавливает несколько `Page` с правильным каркасом.
2. Для каждой страницы создаёт `Generation Job` со статусом `queued` и выбранной `target_page`.
3. Оператор запускает runner и получает пачку обновленных `Page` drafts.
4. Редактор проверяет каждую страницу в Strapi.
5. Плохие drafts остаются unpublished или возвращаются на доработку.
6. Только проверенные страницы получают `editorial_status = approved` и `Publish`.

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
- AI не публикует новые справочники сам
- AI не создаёт новые block types
- AI не создает страницы в свободном режиме без `target_page`
- AI не меняет каркас выбранной страницы: порядок секций, `block_type` и `variant`
- AI не обходит reserved route policy

## Связанные документы

- [Конструктор managed-страниц](page-v2-manual-builder.md)
- [Как добавлять страницы](how-to-add-page.md)
- [Матрица маршрутов и ownership](route-ownership-matrix.md)
- [Гайд оператора](operator-guide.md)
