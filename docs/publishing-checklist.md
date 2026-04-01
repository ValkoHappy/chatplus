# Чеклист публикации

## 1. До сборки

Проверить:

- Strapi запущен
- если менялись generator-owned данные, выполнен `npm.cmd run seed-content`
- если менялись managed pages, правки сохранены в Strapi

## 2. Обязательная локальная проверка

```powershell
npm.cmd --prefix portal run build
```

Build должен пройти полностью.

## 3. Representative routes

Минимум открыть локально:

- `/`
- `/pricing`
- `/partnership`
- `/solutions/tenders`
- `/docs`
- `/media`
- `/promo`
- `/compare/respond-io`

## 4. Сборка demo snapshot

```powershell
npm.cmd --prefix portal run snapshot:github-demo
```

Проверить, что `pages-preview/` действительно обновился.

## 5. Перед push

Проверить:

- нет лишних временных файлов в коммите
- закоммичены нужные изменения
- `pages-preview/` попал в коммит, если обновлялся demo

## 6. После push

Проверить:

- workflow `Deploy Demo Snapshot` завершился успешно
- открывается опубликованный demo
- нет старых стилей или старого контента

Если стили выглядят старыми, сделать `Ctrl+F5`.
