# Матрица маршрутов и ownership

Этот файл нужен как быстрый reference. Если нужно понять, какой шаблон рендерит маршрут и где у него источник истины, начинайте отсюда.

## Правило

- `generated` = источник истины `cms/seed/*.json -> scripts/seed-runtime-content.mjs -> Strapi`
- `managed` = источник истины Strapi admin
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
| `/compare/[slug]`, `/vs/[slug]` | `comparison` | `competitor` | `generated` | seeds/generator |
| `/channels`, `/industries`, `/integrations`, `/solutions`, `/features`, `/for` | `directory` | catalog collections | mixed | Strapi catalog + settings |
| `/channels/[slug]`, `/industries/[slug]`, `/integrations/[slug]`, `/solutions/[slug]`, `/features/[slug]`, `/for/[slug]` | `structured` | catalog entity + landing glue | в основном `generated` | seeds/generator + Strapi |
| intersections (`/channels/[channel]/[industry]`, `/channels/[channel]/[integration]`, `/industries/[industry]/[solution]`, `/integrations/[integration]/[solution]`, `/for/[businessType]/[industry]`) | `structured` | generated landing content | `generated` | seeds/generator |

## Что нельзя делать

- Не создавайте `generated`-страницы руками в Strapi.
- Не переводите `managed`-маршрут в `generated` или наоборот без изменения docs, validation и import logic.
- Не добавляйте новый маршрут в existing template family без обновления этой матрицы и [template-contracts.md](template-contracts.md).

## Когда обновлять этот файл

Обновляйте матрицу, если меняется хотя бы одно из:

- новый публичный маршрут
- новый `template_kind`
- новый content type
- смена ownership (`generated` / `managed`)
- смена источника истины
