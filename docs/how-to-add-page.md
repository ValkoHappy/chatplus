# Как добавлять страницы

Этот документ разделяет реальные сценарии создания страниц в `CHATPLUS`.

## Главное правило

Если вам нужна новая публичная managed page, создавайте её через `page_v2`.

Не продолжайте по умолчанию расширять legacy `landing-page` как основную модель новых routes.

## Сценарий 1. Новая managed page через `page_v2`

Используйте этот путь для:

- новых campaign pages
- новых brand pages
- новых resource pages
- любых новых manual routes вне imported catalog families

### Шаги

1. Создайте запись `page-v2` в `Strapi`
2. Заполните минимум:
   - `slug`
   - `route_path`
   - `title`
   - `page_kind`
   - `template_variant`
   - `seo_title`
   - `seo_description`
3. Если страница должна участвовать в структуре сайта, дополнительно задайте:
   - `show_in_header`
   - `show_in_footer`
   - `show_in_sitemap`
   - `nav_group`
   - `nav_label`
   - `nav_order`
   - `parent_page`
4. Соберите страницу через dynamic zone `sections`
5. При необходимости свяжите её с entities
6. Сохраните как draft
7. Прогоните локальную сборку:

```powershell
npm --prefix portal run build
```

8. Опубликуйте страницу
9. Убедитесь, что сайт пересобрался

### Важно

- `route_path` не должен конфликтовать с immutable reserved routes вроде `/admin`, `/api`, `/site-map`, `/compare` и imported catalog roots
- для новых `page_v2` routes не нужен новый `.astro` файл
- navigation и sitemap управляются из самой CMS-записи

## Сценарий 2. Миграция существующего legacy managed-маршрута

Используйте этот путь, когда route уже существует в legacy wrapper-ах и вы хотите передать ownership `page_v2`, не удаляя wrapper.

Поддерживаемые migratable exact routes:

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

### Правило выбора источника

- если published `page_v2` существует на exact route, frontend рендерит `page_v2`
- иначе frontend остаётся на legacy source

Draft не может перехватить legacy route.

### Рекомендуемый сценарий миграции

1. Создайте `page_v2` с тем же `route_path`
2. Воссоздайте content structure через blueprint и blocks
3. Настройте nav, sitemap, breadcrumbs и internal links в `page_v2`
4. Проверьте страницу локально
5. Только потом публикуйте
6. После publish подтвердите, что route реально рендерится из `page_v2`

### Правило защиты от поломок

Нельзя считать route migrated только потому, что `page_v2` создан.

Route считается migrated только если:

- сохранены ключевые section patterns
- nav и sitemap не сломаны
- breadcrumbs корректны
- parity smoke пройден

Если parity ломается, route остаётся на legacy source.

## Сценарий 3. Новая imported page

Используйте этот путь для imported catalog и SEO entities:

- `solution`
- `feature`
- `industry`
- `integration`
- `channel`
- `business-type`
- `competitor`

### Шаги

1. Обновите source seed или generation payload
2. Запустите importer:

```powershell
npm run seed-content
```

3. Убедитесь, что запись появилась в `Strapi` как `record_mode = imported`
4. Соберите frontend:

```powershell
npm --prefix portal run build
```

5. Проверьте публичный route локально

## Сценарий 4. Поддержка старой legacy singleton-страницы

Используйте это только когда надо поддерживать уже существующую legacy family и вы пока не переводите её в `page_v2`.

### Шаги

1. Обновите legacy content type, например `landing-page` или `tenders-page`
2. Сохраните текущий `slug`, `template_kind` и ownership contract
3. Соберите проект и проверьте representative routes

### Важно

- не добавляйте новые manual route families через legacy `landing-page`
- legacy content types — это maintenance path, а не preferred future model

## Сценарий 5. Добавление нового CMS-owned блока

Это уже engineering change, а не только editor work.

### Шаги

1. Определите block contract
2. Добавьте schema компонента в `Strapi`
3. Добавьте normalization во frontend data layer
4. Добавьте renderer
5. Добавьте тесты
6. Прогоните build и representative route checks

## Сценарий 6. Изменение существующего template или page family

Это тоже engineering change.

### Шаги

1. Определите, влияет ли изменение только на styling или ещё и на data contract
2. Обновите нужные adapters или `page_v2` renderer
3. Если меняется data contract, обновите schema и docs вместе
4. Пересоберите проект и проверьте representative routes

## Что проверять после добавления или migration страницы

- route открывается локально
- `npm --prefix portal run build` проходит
- страница соблюдает managed/imported ownership rules
- если это новая managed page, она использует `page_v2`
- если это migrated route, `page_v2` выигрывает только после publish
- sitemap и navigation корректны
- breadcrumbs и internal links идут из page-owned data

## Связанные документы

- [Конструктор managed-страниц](page-v2-manual-builder.md)
- [Миграция managed routes](managed-route-migration.md)
- [Гайд оператора](operator-guide.md)

