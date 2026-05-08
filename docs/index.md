# Документация CHATPLUS

Это главная карта проекта. Если вы открыли репозиторий впервые, начните отсюда.

## Коротко

CHATPLUS сейчас строится вокруг модели **Strapi-first**:

- `Strapi` хранит страницы, блоки, SEO, навигацию, связи и редакторские статусы.
- `Astro` рендерит сайт из данных Strapi и собирает статический frontend.
- Старые шаблоны пока не удаляются: они остаются защитным renderer/fallback-слоем, чтобы перенос не ломал внешний вид.
- Новая универсальная сущность страницы технически называется `page_v2`, но в интерфейсе Strapi её можно воспринимать просто как `Page`.
- Для старых URL действует safety gate: страница заменяет legacy только после проверки `migration_ready=true` и `parity_status=approved`.
- Для новых страниц можно сразу использовать Strapi-конструктор без добавления нового route в код.

Проект уже работает на VPS:

- публичный сайт: `https://astro.integromat.ru`
- Strapi admin: `https://strapi.integromat.ru/admin`

Если вы просто редактируете контент, вам не нужно читать команды, Docker, Git и server runbook-и. Идите сразу в раздел для редактора ниже.

## Если вы редактор

Читайте в таком порядке:

1. [Быстрый старт редактора](editor-quickstart.md)
2. [AI-генерация черновиков](ai-page-generation.md)
3. [AI-черновик: проверка до публикации](ai-draft-preview-workflow.md)
4. [Справочники: каналы, отрасли, интеграции и страницы по ним](entity-catalog-editor-workflow.md)
5. [Понятная инструкция для редактора Strapi](strapi-editor-handbook.md)
6. [Карта интерфейса Strapi](strapi-ui-map.md)
7. [Как добавлять страницы](how-to-add-page.md)
8. [Рецепты заполнения страниц](strapi-page-recipes.md)
9. [Глоссарий](glossary.md)

Для технической уборки Strapi без потери контента используйте отдельный план: [Strapi Cleanup Plan](strapi-cleanup-plan.md).

Главная идея: теперь основной путь для AI идет прямо из `Page`. Сначала нужна `Page` с правильным макетом, потом в правой панели страницы нажимается `Сгенерировать через AI`. Strapi сам создает связанную `Generation Job`, уже подставляет эту `Page` в `target_page` и открывает задачу. Нейросеть заполняет или дорабатывает эту же `Page`, не меняя порядок блоков, `block_type` и `variant`; редактор запускает генерацию, смотрит preview кандидата, принимает результат в `Page` и только потом публикует. Для маленькой правки можно открыть `Content Manager -> Page`, найти страницу по `route_path`, изменить блоки в `sections`, сохранить и опубликовать.

Рабочая роль редактора в Strapi: `AI Draft Editor`. Она нужна, чтобы редактор мог без кода создавать `Page`, редактировать текст и блоки, удалять тестовые или согласованные страницы, публиковать проверенные страницы и создавать `Generation Job` для AI-доработки. Эта роль не дает редактору работу с VPS, Docker, GitHub Actions, `.env`, API tokens, Strapi schema/settings и серверными snapshot. Логины, email, пароли и другие данные конкретных пользователей не хранятся в документации и Git.

Редактору не нужно читать `content-snapshot-workflow`, `release-flow`, `deploy` и команды npm. Это документы для разработчика или оператора. Если меняете контент, не заходите на VPS, в Docker, GitHub Actions, терминал и `.env`: работайте только в Strapi.

Редактору также не нужно открывать `start-here-vps.md`. Это аварийный runbook для чистого/сломавшегося сервера, а не инструкция по редактированию сайта.

## Если вы разработчик или AI-агент

Читайте в таком порядке:

1. [Инструкции для AI/разработчика](../AGENTS.md)
2. [Контекст для AI и разработчика](ai-agent-context.md)
3. [Workflow Strapi content snapshot](content-snapshot-workflow.md)
4. [CMS-модель](cms-model.md)
5. [Единая система блоков](unified-block-system-plan.md)
6. [Контракты шаблонов](template-contracts.md)
7. [Миграция маршрутов](managed-route-migration.md)
8. [Гайд оператора](operator-guide.md)
9. [Смена домена production](domain-change-guide.md)
10. [Подготовка сайта к поиску, Метрике и рекламе](search-ads-analytics-setup.md)
11. [Перенос на Railway](railway-migration-guide.md)
12. [Production handoff](manual-first-production-handoff.md)

Главное правило для разработки: не переписывать старую страницу в generic `PageV2Page`, если у неё есть legacy family. Старый URL должен сохранять свой family-renderer, а `page_v2` становится владельцем контента и метаданных.

Второе главное правило: полный сайт не равен одному Git commit. Если задача касается страниц, блоков, Strapi, SEO, навигации или sitemap, сначала синхронизируйте content snapshot по [Workflow Strapi content snapshot](content-snapshot-workflow.md).

## AI-заполнение страниц

Читайте:

1. [AI-заполнение страниц](ai-page-generation.md)
2. [AI-черновик: проверка до публикации](ai-draft-preview-workflow.md)
3. [План AI-генерации и автопубликации](ai-scheduled-autopublish-plan.md)
4. [Контекст для AI и разработчика](ai-agent-context.md)

AI теперь считается удобным способом для крупных правок и заполнения новых каркасов страниц, но без автопубликации и без свободного создания макета. Основной сценарий: открыть `Page`, нажать `Сгенерировать через AI`, перейти в созданную `Generation Job`, запустить runner, посмотреть preview, затем вручную принять результат в `Page`. `Generation Job` обязан иметь `target_page`; `target_blueprint` должен совпадать с `page_kind`. Простая расшифровка: `campaign` - продающая страница, `brand` - направление или категория, `resource` - гайд или инструкция. Категории `channel`, `industry`, `integration`, `solution`, `feature`, `business_type`, `competitor` можно выбирать как контекст для prompt.

Справочники `Channel`, `Industry`, `Integration`, `Solution`, `Feature`, `Business Type` и `Competitor` можно пополнять вручную в Strapi или через подтвержденные AI-предложения. `Generation Job` сначала пишет предложения в `run_report.proposed_entities` и ставит `job_status = needs_entity_review`; после подтверждения runner создает записи как черновики `managed/frozen`, привязывает их к задаче и обновляет выбранную `Page`. Новый справочник публикуется отдельно после проверки, потому что публикация может добавить новые catalog/intersection routes. Подробный порядок: [Справочники: каналы, отрасли, интеграции и страницы по ним](entity-catalog-editor-workflow.md).

Формы справочников специально упрощены: редактор видит только короткие безопасные поля, например `slug`, `name`, `description`, а для отдельных типов `pain`, `solution`, `category`, `price`. Старые поля вроде `icon`, `emoji`, `hero_*`, `seo_*`, `roi_*`, `faq`, `sticky_cta_*` не удалены из базы, но скрыты из `Content Manager`; публичные страницы через них больше не собираются. Если нужно поменять текст или блок на сайте, работайте с `Page`.

## Где что лежит

```text
CHATPLUS/
|- portal/          # Astro frontend и renderer страниц
|- cms/             # Strapi CMS, схемы content types и components
|- scripts/         # materializer, проверки, importer, AI generation runner
|- docs/            # документация и runbook-и
|- deploy/          # серверные примеры, cron, env и runbook-и
|- pages-preview/   # legacy/demo snapshot
`- README.md        # общий вход в проект
```

## Статус локальной модели

Локально подготовлена модель, где:

- текущие публичные URL материализованы как `page_v2`;
- старые страницы сохраняют legacy family-renderer;
- `page_blueprint` хранит правила допустимых блоков;
- `page_version` хранит snapshots для истории и rollback;
- `generation_job` используется для AI drafts и доработки существующих черновиков;
- проверки показывали целевое состояние `800/800` по materialized public pages, без bridge losses и без data quality issues.

Важно: это не означает, что live server уже полностью cutover. Серверный перенос делается отдельно, по controlled waves, с smoke-проверками и rollback.

## Главные правила безопасности

- Не удалять legacy templates до отдельного cleanup-этапа.
- Не включать `migration_ready` без визуальной проверки страницы.
- Не делать массовый cutover старых страниц без route-by-route smoke.
- Не считать `published` достаточным условием для старого URL: нужен approved статус и parity gate.
- Если страница выглядит плохо, выключить `migration_ready` или снять publish, затем чинить bridge/materializer.
- Новый блок добавляется только через Strapi schema, frontend primitive/renderer, tests и docs.

## Частые ответы

**Можно ли добавить новую страницу?**  
Да. Создайте запись `Page` в Strapi, заполните `route_path`, SEO, blueprint и `sections`, затем publish.

**Можно ли удалить старую страницу?**  
Публично убрать можно через unpublish или `migration_ready=false`. Физически удалять legacy template пока нельзя: он нужен для rollback до полного cleanup-этапа.

**Весь ли контент в Strapi?**  
Целевая локальная модель: публичные страницы имеют `page_v2` записи, а entities остаются источником фактов. Legacy templates пока остаются не как владелец контента, а как renderer/fallback для сохранения макета.

**Как понять, что ничего не потеряли?**  
Запустите проверки:

```powershell
npm.cmd run page-v2:data-quality -- --problems --json
npm.cmd run page-v2:parity-report -- --json
npm.cmd run page-v2:rendered-coverage -- --problems --json
npm.cmd run test:contracts
npm.cmd --prefix portal run build
```

**Где смотреть понятные подсказки в Strapi?**  
Описание полей и блоков хранится в схемах Strapi. Для обновления русских подсказок запустите:

```powershell
npm.cmd run strapi:help:ru
```
