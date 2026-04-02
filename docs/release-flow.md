# Release Flow CHATPLUS

Короткий end-to-end сценарий выпуска изменений. Это не deep dive, а линейный runbook: что делать от правки до публикации.

## 1. Определить тип изменения

Перед началом ответьте на три вопроса:

1. Это `generated` или `managed` контент?
2. Это только visual/frontend change или schema-level change?
3. Нужен ли новый snapshot для GitHub Pages?

## 2. Если менялся generated content

1. Обновить source seed:

- `cms/seed/*.json`

2. Загрузить изменения в Strapi:

```powershell
npm.cmd run seed-content
```

3. При необходимости обновить materialized JSON:

```powershell
node scripts/export-from-strapi.mjs
```

## 3. Если менялся managed content

1. Внести изменения в Strapi admin.
2. Проверить:
   - `template_kind`
   - `content_origin`
   - что маршрут действительно относится к managed family

## 4. Если менялся frontend или шаблон

1. Проверить, visual это change или contract-level.
2. Если contract-level:
   - обновить docs
   - schema при необходимости
   - validation/import
   - adapters
3. Если visual-only:
   - править frontend
   - проверить representative routes

## 5. Обязательная локальная сборка

```powershell
npm.cmd --prefix portal run build
```

Build должен пройти вместе с:

- `content-check`
- `link-graph`
- `encoding-check`

## 6. Ручная проверка

Открыть representative routes:

- `/`
- `/pricing`
- `/partnership`
- `/solutions/tenders`
- `/docs`
- `/media`
- `/promo`
- `/compare/respond-io`

Проверить:

- hero
- CTA
- FAQ
- internal links
- header/footer
- tablet/mobile behavior

## 7. Если нужен demo snapshot

```powershell
npm.cmd --prefix portal run snapshot:github-demo
```

## 8. Коммит и push

```powershell
git add .
git commit -m "Describe your change"
git push origin main
```

## 9. После push

1. Проверить GitHub Pages.
2. Проверить representative routes на live.
3. Если менялись Open Graph данные, проверить превью ссылки.

## 10. Когда релиз считается готовым

Изменение считается не просто “собирается”, а реально готово, когда:

- build зеленый
- docs не противоречат коду
- ownership не сломан
- representative routes проверены руками
- published snapshot или live pages отражают изменения
