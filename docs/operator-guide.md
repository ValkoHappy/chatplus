# Гайд оператора

## Короткое правило

### Если это managed-контент

Правим в `Strapi`.

Примеры:

- `page_v2` pages
- legacy landing pages
- singleton pages
- site settings

### Если это imported-контент

Правим source data и запускаем importer.

Примеры:

- channels
- industries
- integrations
- solutions
- features
- business types
- competitors

## Основные команды

### Проверить importer без записи

```powershell
npm run seed-content:plan
```

### Выполнить sync

```powershell
npm run seed-content
```

### Принудительно перезаписать imported-записи

```powershell
npm run seed-content:force
```

### Посмотреть отчёт

```powershell
npm run seed-content:report
```

### Запустить AI-генерацию черновика для одного job

```powershell
npm run page-v2:generate -- --job-id=JOB_ID
```

### Обработать ручные AI-задачи в очереди

```powershell
npm run page-v2:generate:queued -- --job-type=manual_request
```

### Обработать плановые AI-задачи в очереди

```powershell
npm run page-v2:generate:scheduled
```

### Посмотреть отчёт по `generation_job`

```powershell
npm run page-v2:generate:report
```

### Посмотреть план миграции по managed-маршрутам

```powershell
npm run page-v2:migrate:managed:report
```

### Проверить готовность рабочего `Strapi` после будущего deploy

```powershell
npm run page-v2:live:ready
```

### Подготовить один legacy route к переносу

```powershell
npm run page-v2:migrate:managed -- --route=/promo
```

### Создать или обновить draft для одного route

```powershell
npm run page-v2:migrate:managed -- --route=/promo --apply
```

После этого:

- откройте draft в `Strapi`
- проверьте parity с legacy route
- проверьте hero, CTA, nav/footer/mobile nav, sitemap, breadcrumbs и internal links

### Опубликовать route только после parity smoke-проверки

```powershell
npm run page-v2:migrate:managed -- --route=/promo --apply --publish
```

### Быстрый откат на legacy-источник

```powershell
npm run page-v2:migrate:managed -- --route=/promo --unpublish
```

### Проверить резервную копию перед восстановлением

```bash
./deploy/scripts/restore.sh --check /path/to/backup-directory
```

## Локальная проверка перед релизом

```powershell
npm run test:contracts
npm run check:docs-consistency
npm --prefix portal run build
```

## Что не надо делать

- не править imported catalog и SEO-записи руками как основной способ работы
- не менять `content_origin` вручную без понимания migration logic
- не использовать `force-sync` как обычный publish flow
- не считать frontend источником истины для copy и SEO
- не создавать новые managed routes через legacy `landing-page`, если подходит `page_v2`
- не включать auto-publish для AI-генерации черновиков

## Политика безопасной миграции

Migration managed routes идёт только через bridge.

Правила:

- legacy wrappers остаются на месте
- route сначала проходит parity smoke
- только после этого published `page_v2` может заменить legacy source
- rollback делается снятием published state у `page_v2`

То есть:

- `page_v2 published` -> render `page_v2`
- otherwise -> render legacy source

## Если нужно объяснение без технички

Для владельца проекта:

- [owner-quickstart.md](owner-quickstart.md)

Для общей модели:

- [cms-model.md](cms-model.md)
- [content-workflow.md](content-workflow.md)
- [managed-route-migration.md](managed-route-migration.md)
- [manual-first-production-handoff.md](manual-first-production-handoff.md)

Для первого боевого запуска:

- [production-setup-checklist.md](production-setup-checklist.md)

