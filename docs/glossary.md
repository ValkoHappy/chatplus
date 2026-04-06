# Глоссарий CHATPLUS

Короткий словарь терминов проекта. Этот файл нужен, чтобы инженер, оператор или следующая нейронка одинаково понимали ключевые слова и не путали ownership слои.

## Основные термины

### `imported`

Контент, который создается importer-ом из source data и потом живет в `Strapi`.

Source data по-прежнему может приходить из:

- `cms/seed/*.json`
- AI batch payloads
- других структурированных источников

Но live-запись после импорта существует уже в `Strapi` и подчиняется merge/sync policy.

`scripts/seed-runtime-content.mjs` — это public CLI entrypoint; внутренняя sync/validation/upsert логика после декомпозиции живет в отдельных модулях.

### `managed`

Контент, которым владеет редакторский слой в Strapi admin.

Обычно это singleton и special pages, которые наполняются вручную и не должны silently затираться importer-ом.

### `settings`

Singleton/system records, которые управляют общими настройками сайта и тоже живут в `Strapi`.

### `source of truth`

Главный источник истины для конкретного типа данных.

В проекте теперь есть два живых редакторских режима:

- для `managed` записей source of truth — Strapi admin
- для `imported` записей source of truth — Strapi record + sync policy

Source data в `cms/seed/*.json` остается bootstrap/generation layer, но не должен безусловно перетирать live CMS-контент.

Frontend не должен становиться третьим источником истины для пользовательского текста.

### `template_kind`

Тип шаблона страницы. По нему frontend понимает, какой `.astro`-шаблон рендерить.

Активные значения сейчас:

- `home`
- `structured`
- `directory`
- `pricing`
- `partnership`
- `tenders`
- `resource-hub`
- `brand-content`
- `comparison`
- `campaign`

### `content_origin`

Legacy-поле совместимости, которое осталось для старых данных и переходного слоя frontend.

Его не нужно использовать как главный operational rule в новой модели.

### `programmatic page`

Типовая страница, которая создается системно через importer flow, а не руками в Strapi.

Примеры:

- `solution`
- `feature`
- `industry`
- `integration`
- `competitor`
- пересечения catalog family

### `managed singleton`

Обычная отдельная страница, которая создается и редактируется в Strapi вручную.

Примеры:

- `/`
- `/pricing`
- `/partnership`
- `/docs`
- `/media`
- `/promo`

### `CMS-owned block`

Блок, текст или структура которого должны редактироваться через CMS.

Такой блок нельзя добавлять только версткой. Для него нужен контракт:

- docs
- schema при необходимости
- validation/import
- adapter layer

### `template-owned block`

Блок, который принадлежит frontend-слою и не редактируется контентщиком.

Обычно это:

- декоративные элементы
- layout
- visual wrappers
- purely presentational structure

### `adapter layer`

Слой нормализации данных между Strapi/seed-данными и шаблонами frontend.

В проекте это в первую очередь:

- `portal/src/lib/strapi.ts`
- `portal/src/lib/page-adapters.ts`

`page-adapters.ts` остается public facade; внутренняя адаптация разложена по `shared.ts`, `details.ts`, `intersections.ts`, `specialized.ts`.

### `materialized copy`

Данные, которые уже импортированы в Strapi из source data.

То есть bootstrap/source слой может жить в `cms/seed/*.json`, но materialized live copy живет в Strapi.

### `representative route`

Маршрут, который используется для ручной проверки целой template family.

Примеры:

- `/`
- `/pricing`
- `/partnership`
- `/solutions/tenders`
- `/docs`
- `/media`
- `/promo`
- `/compare/respond-io`

### `route-template mapping`

Привязка маршрута к шаблону.

Ключевой файл:

- `portal/src/lib/page-template-map.ts`

### `schema-level change`

Изменение, которое уже нельзя считать просто версточной правкой.

Примеры:

- новый `template_kind`
- новый CMS-owned block
- новый expected field в шаблоне
- замена одного шаблона другим, если они ждут разные данные

## Практическое правило

Если неясно, куда относится изменение, задайте себе вопрос:

- это про текст/данные, которые должен менять редактор?
- или это про визуал/верстку, которыми владеет frontend?

Если ответ “данные редактора”, значит почти наверняка нужно смотреть в schema, validation, adapters и docs, а не только в `.astro`.
