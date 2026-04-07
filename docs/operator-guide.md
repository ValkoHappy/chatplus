# Гайд оператора

## Короткое правило

### Если это managed content

Правим в `Strapi`.

Примеры:

- landing pages
- singleton pages
- site settings

### Если это imported content

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
npm.cmd run seed-content:plan
```

### Выполнить sync

```powershell
npm.cmd run seed-content
```

### Принудительно перезаписать imported-записи

```powershell
npm.cmd run seed-content:force
```

### Посмотреть report

```powershell
npm.cmd run seed-content:report
```

### Проверить backup перед восстановлением

```bash
./deploy/scripts/restore.sh --check /path/to/backup-directory
```

## Локальная проверка перед релизом

```powershell
npm.cmd run test:contracts
npm.cmd run check:docs-consistency
npm.cmd --prefix portal run build
```

## Что не надо делать

- не править imported catalog/SEO записи руками как основной способ
- не менять `content_origin` вручную без понимания миграции
- не использовать `force-sync` как обычный publish flow
- не считать frontend источником copy/SEO текста

## Если нужно объяснение без технички

Для владельца проекта:

- [owner-quickstart.md](owner-quickstart.md)

Для общей модели:

- [cms-model.md](cms-model.md)
- [content-workflow.md](content-workflow.md)

Для первого боевого запуска:

- [production-setup-checklist.md](production-setup-checklist.md)
