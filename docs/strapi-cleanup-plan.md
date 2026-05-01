# Strapi Cleanup Plan

Цель: упростить Strapi для редакторов и убрать накопившийся мусор без риска потерять контент.

## Что уже можно чистить безопасно

Первый безопасный слой - скрывать поля из `Content Manager`, не удаляя их из базы и API.

Справочники `Channel`, `Industry`, `Integration`, `Solution`, `Feature`, `Business Type` и `Competitor` содержат старые поля лендингов и технические поля совместимости. Они нужны для импорта, старых fallback-страниц или renderer logic, но редактор не должен собирать через них страницы.

Важно: скрытие поля в редакторской форме не удаляет поле из схемы, базы, API или snapshot. Данные остаются на месте и продолжают участвовать в importer/materializer/renderer logic. Меняется только то, что обычный редактор видит в `Content Manager`.

Текущий безопасный allowlist для справочников:

| Справочник | Поля, которые видит редактор |
| --- | --- |
| `Business Type` | `slug`, `name`, `description` |
| `Channel` | `slug`, `name`, `description` |
| `Feature` | `slug`, `name`, `description` |
| `Industry` | `slug`, `name`, `description`, `pain`, `solution` |
| `Integration` | `slug`, `name`, `category`, `description` |
| `Solution` | `slug`, `name`, `description`, `pain`, `solution` |
| `Competitor` | `slug`, `name`, `price`, `our_price` |

Если для редактора нужно вернуть еще одно поле в форму, его надо осознанно добавить в allowlist и покрыть тестом `legacy catalog page fields stay hidden from Content Manager`. Не открывайте сразу все старые поля обратно: там есть legacy-контент, импортные служебные поля и старые SEO/hero/ROI поля, которые легко спутать с новой системой `Page`.

Для редактора основной экран:

```text
Content Manager -> Page
```

Для AI-заполнения:

```text
Content Manager -> Generation Job
```

## Что нельзя удалять сразу

Не удалять физически без отдельного backup и smoke-проверки:

- скрытые поля справочников `icon`, `emoji`, `h1`, `hero_*`, `seo_*`, `problem_*`, `solution_*`, `features*`, `roi_*`, `faq`, `sticky_cta_*`, `content`;
- старую коллекцию `Landing Page`;
- `Page Version`;
- dynamic zone components и component tables;
- legacy templates/wrappers в коде.

Причина: эти данные могут участвовать в импорте, fallback-рендере, materializer или истории страниц.

## Кандидаты на глубокую чистку

1. `page_versions`
   - сейчас это главный источник объема записей;
   - чистить только retention-скриптом, например оставить последние N версий на страницу;
   - перед запуском обязательно сделать server backup.

2. Orphan component rows
   - компонентные таблицы могут содержать строки, которые больше не привязаны к `page_v2s_cmps`;
   - сначала нужен read-only отчет, потом cleanup script.

3. Старые preview/generated HTML артефакты
   - чистить только локально, если они не входят в production flow.

4. Legacy content collections
   - `Landing Page` и старые entity-поля можно удалять только после отдельного cutover-плана;
   - пока они остаются как совместимость и страховка.

## Безопасный порядок глубокой чистки

1. Сделать `strapi export` или SQL backup на сервере.
2. Снять counts по ключевым таблицам.
3. Запустить read-only audit script.
4. Сохранить отчет в `docs/` или handoff.
5. Запустить cleanup script только для согласованной категории данных.
6. Пересобрать portal.
7. Проверить representative routes:
   - `/`
   - `/pricing`
   - `/compare/respond-io`
   - `/integrations/bitrix24`
   - `/channels/whatsapp/bitrix24`
   - `/for/government/real-estate`
   - `/site-map`
8. Если что-то выглядит плохо, откатить backup или выключить `migration_ready` у проблемной страницы.

## Правило для редакторов

Если нужно изменить страницу, не открывайте `Content-Type Builder`, `Settings`, `API Tokens`, `Page Version` и справочники без отдельной инструкции.

Работайте только здесь:

```text
Content Manager -> Page
Content Manager -> Generation Job
```

Если в справочнике видите только 3-5 полей, это нормально. Остальные поля скрыты специально, чтобы редактор не правил старую техническую модель вместо настоящей страницы. Публичный контент страницы меняется в `Page`, а справочник хранит короткий факт: название, slug, описание и иногда pain/solution/category/price.
