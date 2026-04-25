# План AI-генерации и автопубликации страниц

Этот документ фиксирует целевую схему для будущего этапа: страницы создаются через AI по запросу или по расписанию, но остаются обычными `page_v2` страницами в Strapi.

## Главный принцип

AI не получает отдельную систему страниц. Он работает как автоматический редактор:

1. читает `generation_job`;
2. выбирает blueprint;
3. выбирает подходящие блоки из разрешённого списка;
4. создаёт `page_v2` draft;
5. проходит validation;
6. либо ждёт ручной проверки, либо уходит в безопасную автопубликацию по расписанию;
7. publish запускает текущий VPS flow: `Strapi publish -> webhook -> Astro rebuild -> deploy`.

## Что уже заложено локально

- `generation_job` поддерживает `manual_request` и `scheduled`.
- `generation_job.block_strategy` управляет выбором блоков:
  - `auto` — AI сам выбирает блоки по prompt, blueprint и intent;
  - `blueprint_default` — использовать стандартный набор blueprint;
  - `custom` — оператор задаёт `target_blocks`, AI работает внутри этого списка.
- `generation_job.target_blocks` позволяет оператору подсказать желаемые блоки.
- `config/page-v2-ai-block-planner.mjs` содержит правила выбора блоков и описание block contracts.
- Runner передаёт AI не просто тему, а block plan: required blocks, allowed blocks, recommended blocks, optional blocks и правила, где какой блок использовать.
- Draft всё равно валидируется через blueprint и не может добавить запрещённые блоки.

## Как AI выбирает блок

AI получает block plan и должен выбрать блок по смыслу:

- `hero` — оффер, заголовок, CTA, trust facts;
- `rich-text` — объяснение, статья, документация;
- `proof-stats` — метрики и короткие доказательства, без выдуманных цифр;
- `cards-grid` — проблемы, выгоды, кейсы, ресурсные карточки;
- `feature-list` — возможности продукта;
- `steps` — процесс, workflow, настройка;
- `faq` — вопросы, возражения, риски;
- `testimonial` — цитата или редакторская заметка;
- `related-links` / `internal-links` — перелинковка;
- `final-cta` — финальный следующий шаг;
- `pricing-plans`, `comparison-table`, `before-after` — только если blueprint это разрешает.

Если prompt просит таблицу сравнения, но blueprint `campaign` её не разрешает, runner не даст этому блоку попасть в draft. AI должен выбрать ближайший безопасный формат, например `cards-grid` или `steps`.

## Safe mode

Safe mode нужен для запуска:

- AI создаёт только draft;
- `editorial_status = review`;
- `human_review_required = true`;
- `migration_ready = false`;
- `parity_status` не становится `approved` автоматически;
- редактор проверяет страницу и публикует вручную.

Это режим по умолчанию.

## Auto mode

Auto mode можно включать только после стабильного safe mode.

Условия автопубликации:

- blueprint входит в allowlist;
- route свободен и не reserved;
- SEO поля заполнены;
- нет пустых блоков;
- нет технических placeholder-фраз;
- validation и data-quality проходят без issues;
- дневной лимит генерации не превышен;
- есть `page_version` snapshot для rollback.

Даже в auto mode AI сначала создаёт draft, затем отдельный publisher проверяет draft и только после этого вызывает publish.

## Первый допустимый scope

Для автогенерации по расписанию сначала разрешены:

- `campaign`;
- `brand`;
- `resource`.

Позже, после проверки качества, можно добавить:

- `directory`;
- `entity_detail`;
- `entity_intersection`.

Не включать первыми:

- `home`;
- `pricing`;
- `comparison`;
- `demo`;
- `tenders`.

## Cron на VPS

Базовый scheduled runner:

```powershell
npm.cmd run page-v2:generate:scheduled
```

Продакшн cron должен запускать runner с серверными переменными:

- `STRAPI_URL`;
- `STRAPI_TOKEN`;
- `OPENAI_API_KEY`;
- `OPENAI_MODEL`.

Отдельный future publisher может запускаться после генератора, но только когда будет реализован auto mode validation.

## Что нельзя делать

- Нельзя публиковать AI страницу без validation.
- Нельзя давать AI менять legacy templates.
- Нельзя давать AI обходить blueprint allowed blocks.
- Нельзя давать AI автоматически включать `migration_ready`.
- Нельзя массово перетирать существующие approved страницы без версии и rollback.

## Проверки перед включением на сервере

```powershell
npm.cmd run test:contracts
npm.cmd run page-v2:data-quality -- --json
npm.cmd run page-v2:rendered-coverage -- --problems
npm.cmd --prefix cms run build
npm.cmd --prefix portal run build
```

Для mock smoke:

```powershell
npm.cmd run page-v2:generate:queued -- --mock-response-file=scripts/page-v2-generation/mock-response.sample.json --dry-run
```
