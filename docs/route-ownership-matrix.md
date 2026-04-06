# Матрица маршрутов и ownership

Этот файл нужен как быстрый reference. Если нужно понять, какой шаблон рендерит маршрут и где у него источник истины, начинайте отсюда.

## Правило

- `managed` = запись редактируется руками в `Strapi`
- `imported` = запись загружается importer-ом в `Strapi` и потом живет там по merge-правилам
- `settings` = singleton/system records
- frontend не должен становиться вторым источником истины для user-facing copy

## Активные template families

| Маршрут / family | Шаблон | Content type | Ownership | Источник истины |
|---|---|---|---|---|
| `/` | `home` | `landing-page` | `managed` | Strapi |
| `/pricing` | `pricing` | `landing-page` | `managed` | Strapi |
| `/partnership` | `partnership` | `landing-page` | `managed` | Strapi |
| `/docs`, `/help`, `/academy`, `/blog`, `/status` | `resource-hub` | `landing-page` | `managed` | Strapi |
| `/media`, `/team`, `/conversation`, `/tv` | `brand-content` | `landing-page` | `managed` | Strapi |
| `/promo`, `/prozorro` | `campaign` | `landing-page` | `managed` | Strapi |
| `/demo` | `structured` | `landing-page` | `managed` | Strapi |
| `/solutions/tenders` | `tenders` | `tenders-page` | `managed` | Strapi |
| `/compare/[slug]`, `/vs/[slug]` | `comparison` | `competitor` | `imported` | importer + Strapi |
| `/channels`, `/industries`, `/integrations`, `/solutions`, `/features`, `/for` | `directory` | catalog collections | mixed | Strapi catalog + settings |
| `/channels/[slug]`, `/industries/[slug]`, `/integrations/[slug]`, `/solutions/[slug]`, `/features/[slug]`, `/for/[slug]` | `structured` | catalog entity + landing glue | в основном `imported` | importer + Strapi |
| intersections (`/channels/[channel]/[industry]`, `/channels/[channel]/[integration]`, `/industries/[industry]/[solution]`, `/integrations/[integration]/[solution]`, `/for/[businessType]/[industry]`) | `structured` | imported landing content | `imported` | importer + Strapi |

## Что нельзя делать

- Не создавайте `imported` catalog/SEO записи руками в Strapi как основной workflow.
- Не переводите `managed`-маршрут в `imported` или наоборот без изменения docs, validation и import logic.
- Не добавляйте новый маршрут в existing template family без обновления этой матрицы и [template-contracts.md](template-contracts.md).

## Когда обновлять этот файл

Обновляйте матрицу, если меняется хотя бы одно из:

- новый публичный маршрут
- новый `template_kind`
- новый content type
- смена ownership (`managed` / `imported` / `settings`)
- смена источника истины
