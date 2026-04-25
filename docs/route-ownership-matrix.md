# Матрица маршрутов и ownership

Этот файл нужен как быстрый reference по тому, кто владеет публичными маршрутами, где уже работает bridge через `page_v2`, а где ещё сохраняется legacy fallback.

## Правила ownership

- `managed` означает ручное управление страницей в `Strapi`
- `generated` означает, что страница материализуется из entity/importer-данных и затем может жить как `page_v2`
- `hybrid` означает, что основу создаёт генератор, но редактор дальше может дорабатывать страницу в `Strapi`
- `settings` означает singleton или системные записи

Главный принцип: публичный route должен уметь сначала искать safe-approved `page_v2`, а уже потом падать обратно в legacy-источник.

## Bridge-правило

Runtime resolution для bridged routes работает так:

- если на route есть published `page_v2` с `editorial_status=approved`, `migration_ready=true` и `parity_status=approved`, рендерится `page_v2`
- если хотя бы один из этих признаков отсутствует, рендерится legacy source
- draft никогда не перехватывает публичный route

## Текущая матрица

| Route или family | Template family | Runtime source | Ownership | Bridge status |
|---|---|---|---|---|
| `/` | `home` | `landing-page` или `page_v2` | `managed` | bridged |
| `/pricing` | `pricing` | `landing-page` или `page_v2` | `managed` | bridged |
| `/partnership` | `partnership` | `landing-page` или `page_v2` | `managed` | bridged |
| `/docs`, `/help`, `/academy`, `/blog`, `/status` | `resource-hub` | `landing-page` или `page_v2` | `managed` | bridged |
| `/media`, `/team`, `/conversation`, `/tv` | `brand-content` | `landing-page` или `page_v2` | `managed` | bridged |
| `/promo`, `/prozorro` | `campaign` | `landing-page` или `page_v2` | `managed` | bridged |
| `/demo` | `structured` | `landing-page` или `page_v2` | `managed` | bridged |
| `/solutions/tenders` | `tenders` | `tenders-page` или `page_v2` | `managed` | bridged |
| `/site-map` | `directory` | legacy renderer + `page_v2` metadata | `system` | bridged |
| `/features/ai-calendar` | `structured` | legacy renderer или `page_v2` | `managed` | bridged |
| Новые managed routes вне legacy families | `structured` | `page_v2` | `managed` | native `page_v2` |
| `/channels`, `/industries`, `/integrations`, `/solutions`, `/features`, `/for`, `/compare`, `/vs` | `directory` | entity collections или `page_v2` | `generated` | bridged |
| `/channels/[slug]`, `/industries/[slug]`, `/integrations/[slug]`, `/solutions/[slug]`, `/features/[slug]`, `/for/[slug]` | `structured` | entity facts + `page_v2` | `generated` / `hybrid` | bridged |
| `/compare/[slug]`, `/vs/[slug]` | `comparison` | competitor facts + `page_v2` | `generated` / `hybrid` | bridged |
| `/channels/[channel]/[industry]`, `/channels/[channel]/[integration]`, `/industries/[industry]/[solution]`, `/integrations/[integration]/[solution]`, `/for/[businessType]/[industry]` | `structured` | generated facts + `page_v2` | `generated` / `hybrid` | bridged |
| `/admin`, `/api` | `system` | infrastructure | `system` | immutable reserved |
| `/_astro/*`, `/assets/*`, `/uploads/*` | `system` | infrastructure | `system` | immutable reserved |

## Exact paths, разрешённые для `page_v2`

- `/`
- `/pricing`
- `/partnership`
- `/docs`
- `/help`
- `/academy`
- `/blog`
- `/status`
- `/media`
- `/team`
- `/conversation`
- `/tv`
- `/promo`
- `/prozorro`
- `/demo`
- `/solutions/tenders`
- `/site-map`
- `/features/ai-calendar`
- `/channels`
- `/industries`
- `/integrations`
- `/solutions`
- `/features`
- `/for`
- `/compare`
- `/vs`

## Immutable reserved paths

`page_v2` не должен занимать следующие системные маршруты:

- `/admin`
- `/api`
- `/_astro/*`
- `/assets/*`
- `/uploads/*`

## Волны managed migration

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

## Политика anti-breakage

- migration идёт через bridge, а не через destructive rewrite
- legacy wrappers остаются compatibility layer на весь этап
- один route = одно publish decision
- route считается migrated только после parity smoke и явного `migration_ready=true`
- rollback делается снятием published state у `page_v2`, без emergency code rollback
- быстрый rollback можно сделать снятием `migration_ready`, без деплоя кода

## Чего не делать

- не добавлять новые manual routes в legacy `landing-page`, если их уже можно делать через `page_v2`
- не считать legacy navigation metadata главным источником истины после публикации `page_v2`
- не редактировать importer-owned entity records как замену page composition
- не удалять legacy wrappers до отдельного cleanup-этапа

## Когда обновлять этот файл

Обновляйте матрицу, если:

- появляется новый публичный route
- route меняет ownership
- route family входит или выходит из bridge-модели
- добавляется новая immutable reserved family
- системный route начинает поддерживать published `page_v2`
