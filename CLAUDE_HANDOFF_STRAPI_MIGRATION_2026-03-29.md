# CHATPLUS — handoff по миграции на Strapi

Дата: `2026-03-29`  
Проект: `CHATPLUS`  
Цель документа: передать другому агенту/разработчику полную картину того, что уже сделано в проекте, почему это было сделано именно так, в каком состоянии сейчас находится архитектура, и что логично делать дальше.

---

## 1. Контекст задачи

Изначальная проблема проекта была не в том, что сайт не собирался как таковой, а в том, что контент и архитектура источников данных были смешаны:

- часть страниц брала данные из `Strapi`
- часть страниц держала тексты и структуру в коде
- были локальные fallback-данные
- из-за этого было неясно, что является источником истины
- дальнейшее масштабирование через AI/API стало бы хаотичным

Параллельно был предоставлен документ `chatPlusTenders.pdf`, который по сути задаёт **каноническую структуру продающей страницы**:

- SEO/meta
- Hero
- Problem
- Solution
- Features
- Integrations
- ROI
- Use cases
- Comparison
- FAQ
- Internal links
- CTA
- JSON-LD

После обсуждения была зафиксирована правильная инженерная цель:

> Сейчас не переносить старые тексты вручную один в один, а довести систему до состояния, где **все страницы сайта рендерятся из Strapi**, а потом уже массово наполнять их через нейронку, API или seed.

Это решение определило всю дальнейшую архитектуру.

---

## 2. Ключевой архитектурный принцип

Был принят следующий принцип:

- `Strapi` = **единственный источник контента**
- `Astro` = **только рендер, маршруты и компоненты**
- никаких runtime fallback-данных
- если данных нет в `Strapi`, это ошибка конфигурации, а не скрытая подмена локальным массивом

Это значит:

- локальные `portal/src/data/*` больше **не участвуют в рендере сайта**
- они временно остались только как вход для первичного сидинга в `Strapi`
- финальная цель — при желании убрать и это, вынеся сиды в отдельные JSON/fixtures

---

## 3. Что было сделано по факту

### 3.1. Убрана логика fallback в портале

Раньше портал допускал работу на локальных заглушках, если `Strapi` недоступен.  
Это было сознательно убрано.

Почему:

- fallback размывает источник истины
- разработчик может не заметить, что работает не из CMS
- массовая генерация контента после этого становится опасной

Итог:

- сайт больше не должен “тихо” брать локальные данные
- контент идёт из `Strapi`

Ключевой файл:

- `portal/src/lib/strapi.ts:198`

---

### 3.2. Подготовлены и/или доведены Strapi content types

В проекте теперь есть следующие content types в `cms/src/api`:

- `channel`
- `industry`
- `integration`
- `feature`
- `solution`
- `business-type`
- `business-types-page`
- `competitor`
- `landing-page`
- `site-setting`
- `tenders-page`

Список директорий:

- `cms/src/api`

Это означает, что в CMS покрыты:

- каталог каналов
- каталог отраслей
- каталог интеграций
- каталог возможностей
- каталог решений
- каталог типов бизнеса
- сравнения с конкурентами
- одиночные продающие страницы
- глобальные настройки сайта
- отдельно страница `tenders`

Ключевые схемы:

- `cms/src/api/site-setting/content-types/site-setting/schema.json:56`
- `cms/src/api/landing-page/content-types/landing-page/schema.json:7`
- `cms/src/api/tenders-page/content-types/tenders-page/schema.json:7`

---

### 3.3. Добавлена общая CMS-модель одиночной продающей страницы

Для обычных маркетинговых страниц добавлен content type `landing-page`.

Он покрывает поля уровня PDF-структуры:

- `slug`
- `meta_title`
- `meta_description`
- `h1`
- `subtitle`
- `hero_trust_facts`
- `problem_*`
- `solution_*`
- `features`
- `integration_blocks`
- `roi_*`
- `use_cases`
- `comparison_rows`
- `faqs`
- `internal_links`
- `software_schema`
- `faq_schema`

Это даёт универсальную модель для страниц вроде:

- `/`
- `/pricing`
- `/demo`
- `/partnership`
- `/academy`
- `/blog`
- `/docs`
- `/help`
- `/status`

Ключевая схема:

- `cms/src/api/landing-page/content-types/landing-page/schema.json:14`
- `cms/src/api/landing-page/content-types/landing-page/schema.json:71`
- `cms/src/api/landing-page/content-types/landing-page/schema.json:141`
- `cms/src/api/landing-page/content-types/landing-page/schema.json:149`
- `cms/src/api/landing-page/content-types/landing-page/schema.json:157`
- `cms/src/api/landing-page/content-types/landing-page/schema.json:180`

---

### 3.4. Для `tenders` сохранена отдельная структурированная модель

Поскольку `chatPlusTenders.pdf` был дан как эталон и содержал явную структуру страницы, для него оставлен отдельный type:

- `tenders-page`

Это осознанно:

- можно было грубо свести всё к `landing-page`
- но отдельная сущность для `tenders` на данном этапе сохраняет читаемость и связь с исходным документом

Ключевая схема:

- `cms/src/api/tenders-page/content-types/tenders-page/schema.json:14`
- `cms/src/api/tenders-page/content-types/tenders-page/schema.json:135`
- `cms/src/api/tenders-page/content-types/tenders-page/schema.json:143`
- `cms/src/api/tenders-page/content-types/tenders-page/schema.json:151`
- `cms/src/api/tenders-page/content-types/tenders-page/schema.json:174`

---

### 3.5. Добавлены глобальные настройки сайта

Создан `site-setting`, который хранит глобальные данные сайта:

- название сайта
- базовый URL
- дефолтное описание
- описание организации
- header links
- header CTA
- footer tagline
- footer columns
- footer copyright
- sticky CTA
- шаблоны для остальных страниц (`page_templates`)

Это один из ключевых шагов, потому что теперь глобальные тексты тоже не размазаны по шаблонам.

Ключевая схема:

- `cms/src/api/site-setting/content-types/site-setting/schema.json:14`
- `cms/src/api/site-setting/content-types/site-setting/schema.json:29`
- `cms/src/api/site-setting/content-types/site-setting/schema.json:56`

---

### 3.6. В `site-setting` добавлен `page_templates`

Это один из важнейших шагов всей миграции.

Проблема была такая:

- даже если сущности (`channel`, `industry`, `feature` и т.д.) уже лежат в Strapi
- сами детальные страницы всё ещё могли содержать текстовые “обвязки” в коде:
  - заголовки секций
  - служебные тексты
  - CTA
  - объясняющие блоки
  - названия колонок таблиц и т.п.

Чтобы не плодить десятки новых CMS-type только ради служебных текстов, в `site-setting` был добавлен `page_templates`.

`page_templates` хранит:

- shared labels для structured-page
- шаблоны каталогов (`directories`)
- шаблоны detail-страниц (`details`)

За счёт этого теперь:

- страницы сущностей строятся из данных сущности + шаблона из CMS
- текстовая обвязка больше не хранится в коде Astro

Где это сделано:

- схема: `cms/src/api/site-setting/content-types/site-setting/schema.json:56`
- сиды: `scripts/seed-runtime-content.mjs:463`
- чтение: `portal/src/lib/strapi.ts:204`

---

### 3.7. Переписан загрузчик Strapi для портала

Файл:

- `portal/src/lib/strapi.ts`

Что в нём теперь важно:

1. Есть прямые fetch-функции для всех коллекций и single-type.
2. Нет fallback-подмены локальными данными.
3. Есть нормализация сложных структур, включая:
   - `landing-page`
   - `tenders-page`
4. Есть `getSiteSettings()`, который возвращает и `page_templates`.

Ключевые функции:

- `portal/src/lib/strapi.ts:189` — `getTendersPage()`
- `portal/src/lib/strapi.ts:193` — `getLandingPage(slug)`
- `portal/src/lib/strapi.ts:198` — `getSiteSettings()`

---

### 3.8. Сделан единый рендерер структурированных страниц

Создан компонент:

- `portal/src/components/StructuredLandingPage.astro:1`

Его задача:

- принимать уже нормализованный `page`
- рендерить весь продающий каркас
- использовать глобальные CMS-лейблы из `site-setting.page_templates.shared.structured_page`

Что он умеет рендерить:

- Hero
- Problem
- Solution
- Features
- Integrations
- ROI
- Use Cases
- Comparison
- FAQ
- Internal Links
- CTA
- JSON-LD

Также здесь была исправлена проблема с JSON-LD:

- схемы теперь вставляются как готовый JSON
- а не как literal-строка с `JSON.stringify(...)`

Ключевые места:

- `portal/src/components/StructuredLandingPage.astro:60`
- `portal/src/components/StructuredLandingPage.astro:179`
- `portal/src/components/StructuredLandingPage.astro:226`

---

### 3.9. Сделан единый рендерер каталогов

Создан отдельный компонент:

- `portal/src/components/DirectoryPage.astro:1`

Он нужен для индексных страниц:

- `/channels`
- `/industries`
- `/integrations`
- `/features`
- `/solutions`
- `/for`

Он рендерит:

- hero каталога
- карточки сущностей
- sticky CTA

Теперь индексные страницы не держат локальную вёрстку каждая по-своему.

Ключевые места:

- `portal/src/components/DirectoryPage.astro:14`
- `portal/src/components/DirectoryPage.astro:28`

---

### 3.10. Сделан слой адаптеров между Strapi-сущностями и шаблонами Astro

Создан файл:

- `portal/src/lib/page-adapters.ts:1`

Это центральный инженерный слой миграции.

Зачем он нужен:

- сущности в Strapi имеют разные поля
- но фронт хочет рендерить единый `StructuredLandingPage`
- адаптер преобразует конкретную сущность в общую структуру страницы

Список адаптеров:

- `adaptChannelPage` — `portal/src/lib/page-adapters.ts:73`
- `adaptIndustryPage` — `portal/src/lib/page-adapters.ts:116`
- `adaptIntegrationPage` — `portal/src/lib/page-adapters.ts:153`
- `adaptFeaturePage` — `portal/src/lib/page-adapters.ts:184`
- `adaptSolutionPage` — `portal/src/lib/page-adapters.ts:216`
- `adaptBusinessTypePage` — `portal/src/lib/page-adapters.ts:248`
- `adaptCompetitorPage` — `portal/src/lib/page-adapters.ts:289`
- `adaptChannelIndustryPage` — `portal/src/lib/page-adapters.ts:333`
- `adaptDirectoryPage` — `portal/src/lib/page-adapters.ts:365`

Почему это правильное решение:

- не пришлось плодить десятки почти одинаковых Astro-шаблонов
- логика преобразования сосредоточена в одном месте
- теперь можно расширять CMS-поля без разрастания фронта

---

## 4. Какие страницы переведены на Strapi

Ниже важно различать две вещи:

- страница использует `Strapi` в рантайме
- страница всё ещё зависит от локальных `portal/src/data/*`

На текущем этапе:

- **все страницы сайта используют `Strapi` в рантайме**
- **`portal/src/data/*` больше не участвуют в рендере**

### 4.1. Одиночные страницы

Через `landing-page` / `tenders-page`:

- `/` — `portal/src/pages/index.astro`
- `/pricing` — `portal/src/pages/pricing.astro`
- `/demo` — `portal/src/pages/demo.astro`
- `/partnership` — `portal/src/pages/partnership.astro`
- `/academy` — `portal/src/pages/academy/index.astro`
- `/blog` — `portal/src/pages/blog/index.astro`
- `/docs` — `portal/src/pages/docs/index.astro`
- `/help` — `portal/src/pages/help/index.astro`
- `/status` — `portal/src/pages/status/index.astro`
- `/solutions/tenders` — `portal/src/pages/solutions/tenders.astro`

### 4.2. Индексные каталоги

Через `DirectoryPage` + `page_templates`:

- `/channels` — `portal/src/pages/channels/index.astro:7`
- `/industries` — `portal/src/pages/industries/index.astro:7`
- `/integrations` — `portal/src/pages/integrations/index.astro:7`
- `/features` — `portal/src/pages/features/index.astro:7`
- `/solutions` — `portal/src/pages/solutions/index.astro:7`
- `/for` — `portal/src/pages/for/index.astro:7`

### 4.3. Детальные страницы сущностей

Через адаптеры + `StructuredLandingPage`:

- `/channels/[slug]` — `portal/src/pages/channels/[slug].astro:21`
- `/industries/[slug]` — `portal/src/pages/industries/[slug].astro:21`
- `/integrations/[slug]` — `portal/src/pages/integrations/[slug].astro:21`
- `/features/[slug]` — `portal/src/pages/features/[slug].astro:21`
- `/solutions/[slug]` — `portal/src/pages/solutions/[slug].astro:24`
- `/for/[slug]` — `portal/src/pages/for/[slug].astro:17`

### 4.4. Сравнения с конкурентами

Через `competitor` + шаблон detail:

- `/compare/[slug]` — `portal/src/pages/compare/[slug].astro:16`
- `/vs/[slug]` — `portal/src/pages/vs/[slug].astro:16`

### 4.5. Комбинационные SEO-страницы

Через `channel + industry` + detail template:

- `/channels/[channel]/[industry]` — `portal/src/pages/channels/[channel]/[industry].astro:22`

---

## 5. Что осталось от старой архитектуры и почему это не ломает рантайм

В репозитории всё ещё существуют:

- `portal/src/data/channels.ts`
- `portal/src/data/industries.ts`
- `portal/src/data/integrations.ts`
- `portal/src/data/features.ts`
- `portal/src/data/solutions.ts`
- `portal/src/data/businessTypes.ts`
- `portal/src/data/competitors.ts`

Но это важно трактовать правильно.

### Они больше не являются источником контента сайта

Сейчас они используются только в:

- `scripts/seed-runtime-content.mjs`

То есть:

- при запуске сайта контент идёт из `Strapi`
- при сборке сайта контент идёт из `Strapi`
- данные из `src/data` не участвуют в рендере страниц

Почему это было оставлено:

- чтобы быстро и безопасно довести архитектуру до рабочего состояния
- чтобы не смешивать задачу “перевести сайт на Strapi” с задачей “выбросить все старые seed-источники”

Иными словами:

- **сайт уже CMS-first**
- **seed-слой ещё можно дочистить отдельно**

---

## 6. Какой именно план был зафиксирован в ходе работы

По сути был зафиксирован следующий план:

### Этап A. Стабилизировать архитектуру

- убрать fallback
- сделать Strapi источником истины
- зафиксировать единую page-структуру по PDF

### Этап B. Сделать общие модели CMS

- `site-setting`
- `landing-page`
- `tenders-page`
- существующие справочники для каталогов и detail-страниц

### Этап C. Перевести фронт на единые рендереры

- `StructuredLandingPage`
- `DirectoryPage`
- адаптеры сущностей

### Этап D. Засидить минимальный контент

- чтобы всё собиралось и не было пустых страниц

### Этап E. Проверить сборку

- `cms build`
- `seed`
- `portal build`

Этот план выполнен.

---

## 7. Что именно было целью, а что сознательно НЕ делалось

### Было целью

- сделать так, чтобы всё работало
- убрать ambiguity в источнике данных
- перевести все страницы на рендер из `Strapi`
- сохранить возможность потом массово заливать контент

### Сознательно НЕ делалось на этом этапе

- не переносился вручную весь финальный продающий контент
- не устраивалась финальная редакторская вычитка
- не удалялись все старые seed-источники из `portal/src/data`
- не делался production deployment
- не настраивались редакторские workflows внутри Strapi
- не делалась генерация контента через AI/API прямо сейчас

Это важно: задача была именно **довести архитектуру до рабочего CMS-first состояния**, а не закончить весь контент-маркетинг проекта.

---

## 8. Seed-логика

Сидинг выполняется файлом:

- `scripts/seed-runtime-content.mjs`

В нём:

- грузятся старые массивы данных
- преобразуются в формат Strapi
- апсертятся коллекции и single-type
- сидаются:
  - `channels`
  - `industries`
  - `integrations`
  - `features`
  - `solutions`
  - `business-types`
  - `competitors`
  - `site-setting`
  - `landing-pages`
  - `business-types-page`
  - `tenders-page`

Ключевые места:

- `scripts/seed-runtime-content.mjs:226` — `tendersPage`
- `scripts/seed-runtime-content.mjs:404` — `siteSetting`
- `scripts/seed-runtime-content.mjs:463` — `page_templates`
- `scripts/seed-runtime-content.mjs:848` — `landingPages`
- `scripts/seed-runtime-content.mjs:1005` — `main()`

Зачем это оставлено:

- чтобы не оставлять проект в состоянии “архитектура есть, но контента нет”
- чтобы другой агент/разработчик мог быстро поднять локальное окружение

---

## 9. Валидация, которая уже была сделана

На текущем этапе были выполнены следующие проверки:

### Проверка Strapi

- `npm --prefix cms run build` — проходит

### Проверка запуска Strapi

Strapi поднимался локально на:

- `http://localhost:1337`

### Проверка сидинга

- `node scripts/seed-runtime-content.mjs` — проходит

### Проверка портала

- `npm --prefix portal run build` — проходит

### Результат сборки

Собирается:

- `194` страницы

Это подтверждает, что:

- все роуты проходят через Strapi-данные
- шаблоны не падают
- sitemap создаётся

---

## 10. Как запускать проект локально

### Запуск Strapi

В одном окне:

```bash
npm --prefix cms run start
```

Адрес:

- `http://localhost:1337`

### Запуск Astro

Во втором окне:

```bash
npm --prefix portal run dev
```

Адрес:

- обычно `http://localhost:4321`

### Проверка production build

```bash
npm --prefix portal run build
npm --prefix portal run preview
```

---

## 11. Что важно понимать про текущее состояние

### 11.1. Сайт уже работает от Strapi

Это главный результат.

Если коротко и без двусмысленности:

- **да, сейчас страницы Astro переведены на Strapi**

### 11.2. Но “контентная зрелость” и “архитектурная зрелость” — это не одно и то же

Архитектурно сейчас порядок:

- единый источник данных
- единый рендер
- единые шаблоны
- единая структура для масштабирования

Контентно проект ещё можно дальше улучшать:

- финальные офферы
- редактура
- SEO-усиление
- генерация новых страниц
- правка seed-источников

### 11.3. Старые data-файлы не участвуют в рантайме

Это стоит повторить, потому что это ключевая точка возможной путаницы.

Если кто-то видит `portal/src/data/*`, это **не значит**, что сайт работает от них.

Сайт работает от `Strapi`.

---

## 12. Что логично делать дальше

Ниже — следующий адекватный инженерный план. Не обязательно делать всё сразу, но именно это направление выглядит правильным.

### Шаг 1. Убрать зависимость seed-скрипта от `portal/src/data/*`

Зачем:

- чтобы в проекте не осталось второго скрытого “источника контента”
- чтобы структура была ещё чище

Как:

- вынести сиды в отдельную папку, например `scripts/seed-data/*.json`
- или хранить fixtures в `cms/seed`

Это не обязательно для работы сайта, но желательно для чистоты архитектуры.

### Шаг 2. Подготовить массовый импорт контента через API

Поскольку пользователь явно хочет потом заполнять страницы через нейронку/API, логичный следующий слой:

- генерация JSON в формате `landing-page` / `tenders-page` / `site-setting.page_templates`
- импорт через Strapi API

Лучше всего делать так:

1. зафиксировать JSON-схемы для генератора
2. собрать pipeline генерации
3. валидировать перед отправкой в Strapi

### Шаг 3. Нормализовать часть типов, если захочется ещё больше строгости

Сейчас `page_templates` хранится как JSON, это прагматичное решение.

Если потом появится потребность в более строгом редакторском UI, можно:

- разнести часть JSON-шаблонов на отдельные component-типы
- но это стоит делать только если реально нужен редакторский контроль на уровне полей

### Шаг 4. Принять решение по `tenders-page`

Возможны два пути:

#### Вариант A — оставить как есть

- `tenders-page` как отдельный type
- `landing-page` для остальных одиночных страниц

Это нормально и прагматично.

#### Вариант B — потом свести `tenders-page` в общий `landing-page`

Это можно сделать, если захочется максимальной унификации.

Но на текущем этапе это не критично.

### Шаг 5. Настроить контентную генерацию

После архитектуры следующий естественный слой:

- генерировать контент по шаблону PDF
- заливать в `Strapi`
- прогонять smoke-test страниц

---

## 13. Потенциальные слабые места и оговорки

### 13.1. `page_templates` — это JSON, а не строго typed components

Это компромисс.

Плюсы:

- быстро
- гибко
- не раздувает CMS-схему

Минусы:

- меньше редакторской строгости
- при ручном редактировании можно сделать неаккуратный JSON

На текущем этапе это оправдано.

### 13.2. Seed-данные пока ещё растут из старых TS-массивов

Это не рантайм-проблема, но это архитектурный хвост.

### 13.3. Не всё контентно идеально

Сейчас задача была:

- “всё должно работать”

Она решена.

Но это не означает, что:

- все тексты коммерчески вылизаны
- все SEO-формулировки финальные
- все comparison/use-case блоки являются окончательными

Это уже следующий контентный этап.

---

## 14. Рекомендуемая стратегия для дальнейшей работы с Claude

Если этот документ передаётся Claude или другому агенту, правильный способ продолжения такой:

### Claude должен исходить из следующих фактов

1. Сайт уже переведён на Strapi в рантайме.
2. Не нужно возвращать fallback.
3. Не нужно заново строить архитектуру.
4. Не нужно переносить обратно контент в код.
5. Следующий реальный этап — не “ещё раз миграция”, а:
   - либо чистка сидов
   - либо генерация и заливка контента
   - либо дальнейшее уплотнение CMS-моделей

### Что Claude не должен делать

- не должен тащить страницы обратно на локальные массивы
- не должен добавлять новые runtime fallback
- не должен разводить ещё один параллельный источник данных

### Что Claude может делать дальше безопасно

- рефакторить seed-слой
- строить AI import pipeline
- генерировать и заливать контент
- улучшать редакторскую модель Strapi
- усиливать SEO-структуру

---

## 15. Итог в одной формулировке

На момент написания этого handoff:

> Проект приведён к рабочему состоянию, в котором **все страницы Astro рендерятся из Strapi**, единая структура страниц построена вокруг PDF-подхода, общий рендер вынесен в reusable-компоненты, глобальные и шаблонные тексты вынесены в `site-setting.page_templates`, сборка проходит, сид проходит, и проект готов к следующему этапу — массовому наполнению контентом через API/AI.

---

## 16. Краткая контрольная карта файлов

### CMS

- `cms/src/api/site-setting/content-types/site-setting/schema.json`
- `cms/src/api/landing-page/content-types/landing-page/schema.json`
- `cms/src/api/tenders-page/content-types/tenders-page/schema.json`

### Портал

- `portal/src/lib/strapi.ts`
- `portal/src/lib/page-adapters.ts`
- `portal/src/components/StructuredLandingPage.astro`
- `portal/src/components/DirectoryPage.astro`

### Роуты

- `portal/src/pages/channels/[slug].astro`
- `portal/src/pages/industries/[slug].astro`
- `portal/src/pages/integrations/[slug].astro`
- `portal/src/pages/features/[slug].astro`
- `portal/src/pages/solutions/[slug].astro`
- `portal/src/pages/for/[slug].astro`
- `portal/src/pages/compare/[slug].astro`
- `portal/src/pages/vs/[slug].astro`
- `portal/src/pages/channels/[channel]/[industry].astro`
- `portal/src/pages/channels/index.astro`
- `portal/src/pages/industries/index.astro`
- `portal/src/pages/integrations/index.astro`
- `portal/src/pages/features/index.astro`
- `portal/src/pages/solutions/index.astro`
- `portal/src/pages/for/index.astro`

### Seed

- `scripts/seed-runtime-content.mjs`

---

## 17. Финальный practical next step

Если продолжать работу сразу после этого документа, самый рациональный следующий шаг:

1. вынести сиды из `portal/src/data/*` в отдельные `JSON/fixtures`
2. зафиксировать JSON-схемы для AI-генерации контента
3. сделать импорт в `Strapi` по этим схемам

Это даст уже полностью чистую и масштабируемую систему.

