# Rendering Safety Map

Этот документ нужен для разработчиков и AI-агентов, которые меняют страницы, блоки, стили, route wrappers, adapters или шаблоны.

Главная цель: можно улучшать и унифицировать систему, но нельзя случайно сломать старые family layouts, Strapi content workflow или production fallback.

## Главное различие

`page_v2` - это единый content contract страницы, а не всегда единый visual renderer.

Старые route families могут брать контент из `page_v2`, но продолжать рендериться через свой legacy family renderer. Это сделано специально, чтобы сохранить внешний вид и иметь rollback.

Неправильная модель:

```text
published page_v2 -> generic PageV2Page для всех routes
```

Правильная модель для старых routes:

```text
approved page_v2 + migration_ready + parity approved
  -> bridge/adapters
  -> legacy family renderer

otherwise
  -> legacy fallback/source
```

`PageV2Page` используется для новых native страниц, у которых нет старого уникального family layout.

## Слои системы

### Strapi content layer

`Page` / `page_v2` хранит:

- `route_path`;
- `page_kind`;
- `blueprint`;
- `sections`;
- SEO fields;
- header/footer/sitemap flags;
- breadcrumbs/internal links;
- `legacy_template_family`;
- `migration_ready`;
- `parity_status`;
- AI/editorial fields.

Это источник контента, а не гарантия конкретного renderer.

### Legacy family renderer layer

Старые проверенные макеты:

- `home`;
- `campaign`;
- `brand`;
- `resource`;
- `pricing`;
- `partnership`;
- `directory`;
- `comparison`;
- `structured`;
- `tenders`;
- `demo`;
- `system`.

Если route принадлежит legacy family, он должен сохранять family composition, пока отдельная migration/parity работа не докажет, что его можно перевести.

### Bridge / adapter layer

Bridge/adapters преобразуют `page_v2` content в props старого family renderer.

Их задача:

- позволить Strapi стать владельцем контента;
- не менять визуальный макет старого route;
- сохранить fallback;
- позволить route-by-route rollback.

### Native PageV2Page layer

`PageV2Page` подходит для:

- новых manual pages без legacy family;
- catch-all/native pages;
- страниц, где общий renderer уже явно принят как целевой.

`PageV2Page` не должен автоматически заменять старые family routes.

### Shared block primitive layer

Shared primitives нужны, чтобы постепенно убрать дубли:

- `BlockSection`;
- `BlockHeader`;
- `BlockCard`;
- `BlockGrid`;
- `BlockFaq`;
- `BlockTable`;
- `BlockFinalCta`;
- `BlockLinkGrid`;
- другие общие UI building blocks.

Primitive layer не означает массовую замену всех шаблонов. Он должен улучшать повторяющиеся части без потери route contract.

## Перед любой правкой

Перед изменением страницы, блока, стиля, шаблона или adapter нужно определить:

1. Какой route, family или component затрагивается.
2. Кто сейчас рендерит route:
   - legacy family renderer;
   - bridged `page_v2`;
   - native `PageV2Page`;
   - directory/detail/intersection adapter;
   - special component.
3. Какие другие routes используют тот же block, primitive, adapter или CSS.
4. Нужен ли свежий Strapi content snapshot для проверки.
5. Какие smoke routes надо открыть после изменения.

Не делайте вывод "сломался код", пока не проверили, что локальная Strapi DB соответствует нужному content snapshot.

## Изменение существующих стилей

Если меняются стили существующего блока:

- предпочитайте scoped правку конкретного component/primitive;
- не меняйте широкие global CSS правила без понимания affected families;
- проверьте хотя бы один representative route, где блок используется;
- если блок общий, проверьте и legacy route, и native/`PageV2Page` route, если оба затрагиваются;
- следите, чтобы shared primitive не менял неожиданно композицию старых family pages.

Примеры риска:

- общий `max-width` сделал блок слишком узким на старой resource page;
- grid primitive поменял количество колонок во всех detail pages;
- CTA style начал открывать форму там, где должен быть внешний link;
- hero primitive съел family-specific visual asset.

## Добавление нового block type

Новый block type нельзя добавлять только как Astro component.

Нужен полный контракт:

1. Strapi component/schema.
2. Разрешение в `Page.sections` dynamic zone или нужном contract layer.
3. Portal schema/normalization.
4. Renderer mapping.
5. Astro component или shared primitive.
6. Empty/partial-data fallback.
7. Blueprint/materializer support, если блок должен появляться в каркасах страниц.
8. AI generation support, если AI должен его создавать или заполнять.
9. Contract tests.
10. Editor/developer docs.
11. Preview/public smoke-check.

Unknown blocks и неполные block data не должны валить всю страницу.

## Изменение adapters или route wrappers

Adapters и route wrappers опаснее обычных компонентов, потому что могут затронуть сотни страниц.

Перед изменением:

- найдите affected route families;
- проверьте `docs/route-ownership-matrix.md`;
- поймите fallback path;
- проверьте, что draft `page_v2` не перехватывает public route;
- проверьте safety gate: `editorial_status`, `migration_ready`, `parity_status`;
- после изменения запустите contract tests и representative smoke routes.

Если route выглядит плохо:

1. Сначала выключите `migration_ready` или снимите publish.
2. Затем чините bridge/materializer/renderer.
3. Не делайте emergency rewrite всего family на generic renderer.

## Унификация системы

Унификация разрешена и желательна. Проект должен постепенно становиться проще:

- меньше дублей CSS;
- меньше локальных вариантов одного и того же блока;
- больше shared primitives;
- понятнее block contracts;
- меньше legacy-only поведения.

Но унификация должна идти через сохранение поведения, а не через массовую замену.

Правильный путь:

1. Описать affected families/routes.
2. Зафиксировать текущий contract и визуальное поведение.
3. Вынести повторяющийся UI в shared primitive без изменения публичного поведения.
4. Подключить primitive к одному route group или family.
5. Проверить preview/public layout до и после.
6. Оставить rollback: legacy fallback, `migration_ready=false`, unpublish или old renderer.
7. Только после стабильной работы планировать cleanup старого renderer.

Нельзя:

- массово заменить legacy family renderer на `PageV2Page` без migration plan;
- удалить legacy fallback без production stability window;
- включить `migration_ready=true` для группы routes без route-by-route smoke;
- делать abstraction layer, который не сохраняет текущие route contracts.

## Минимальные проверки

Если менялся только frontend component/style:

```powershell
npm.cmd --prefix portal run build
```

Если менялся block contract, adapter или schema:

```powershell
npm.cmd run test:contracts
npm.cmd run check:docs-consistency
npm.cmd --prefix cms run build
npm.cmd --prefix portal run build
```

Если менялся Strapi content:

1. Создайте content snapshot.
2. Зафиксируйте, какой snapshot соответствует изменению.
3. Проверьте preview.
4. После publish дождитесь rebuild Astro.

## Representative routes

Для broad changes подберите routes из нескольких групп:

- home/landing: `/`;
- campaign: `/promo` или `/prozorro`;
- brand/resource: `/media`, `/academy`, `/docs`;
- directory: `/channels`, `/industries`, `/integrations`;
- detail: `/channels/<slug>`, `/industries/<slug>`;
- intersection: `/channels/<channel>/<industry>` или похожий generated route;
- comparison: `/compare/<slug>` или `/vs/<slug>`;
- special: `/demo`, `/pricing`, `/solutions/tenders`.

Не обязательно проверять все каждый раз. Но если изменение общее, smoke set должен покрывать разные renderer families.

## Короткое правило

Сначала понять ownership и renderer. Потом менять. Потом проверять representative routes.

Улучшать систему можно, но нельзя превращать `page_v2` в молоток для всех старых макетов без доказанной parity и rollback.
