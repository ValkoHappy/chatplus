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

## Если вы редактор

Читайте в таком порядке:

1. [Карта интерфейса Strapi](strapi-ui-map.md)
2. [Понятная инструкция для редактора Strapi](strapi-editor-handbook.md)
3. [Рецепты заполнения страниц](strapi-page-recipes.md)
4. [Быстрый старт редактора](editor-quickstart.md)
5. [Как добавлять страницы](how-to-add-page.md)
6. [Конструктор страниц в Strapi](page-v2-manual-builder.md)
7. [Глоссарий](glossary.md)

Главная идея: чтобы изменить контент, откройте `Content Manager -> Page`, найдите страницу по `route_path`, измените блоки в `sections`, сохраните и опубликуйте.

## Если вы разработчик или AI-агент

Читайте в таком порядке:

1. [Контекст для AI и разработчика](ai-agent-context.md)
2. [CMS-модель](cms-model.md)
3. [Единая система блоков](unified-block-system-plan.md)
4. [Контракты шаблонов](template-contracts.md)
5. [Миграция маршрутов](managed-route-migration.md)
6. [Гайд оператора](operator-guide.md)
7. [Production handoff](manual-first-production-handoff.md)

Главное правило для разработки: не переписывать старую страницу в generic `PageV2Page`, если у неё есть legacy family. Старый URL должен сохранять свой family-renderer, а `page_v2` становится владельцем контента и метаданных.

## Если позже нужно будет работать с AI-генерацией

Читайте:

1. [AI-генерация черновиков](ai-page-generation.md)
2. [План AI-генерации и автопубликации](ai-scheduled-autopublish-plan.md)
3. [Контекст для AI и разработчика](ai-agent-context.md)

Сейчас обычный редакторский процесс ручной: человек создаёт и меняет `Page` в Strapi. AI-генерация описана как будущий отдельный процесс и не нужна для ручного добавления страниц.

## Где что лежит

```text
CHATPLUS/
|- portal/          # Astro frontend и renderer страниц
|- cms/             # Strapi CMS, схемы content types и components
|- scripts/         # materializer, проверки, importer, будущий AI generation runner
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
- `generation_job` подготовлен для будущих AI drafts, но ручной процесс не зависит от него;
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
