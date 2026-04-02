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

На каждой из этих страниц проверить:

- hero и subtitle
- primary / secondary CTA
- FAQ
- internal links
- ROI / comparison blocks
- header и footer
- отсутствие очевидных fallback-артефактов и битых текстов

## 4. Ручной responsive QA

Минимум посмотреть representative routes в трех режимах:

- desktop
- tablet
- mobile

Проверить:

- перенос заголовков и CTA
- сетки карточек
- burger / header
- footer
- таблицы и длинные карточки
## 5. Сборка demo snapshot

```powershell
npm.cmd --prefix portal run snapshot:github-demo
```

Проверить, что `pages-preview/` действительно обновился.

## 6. Перед push

Проверить:

- нет лишних временных файлов в коммите
- закоммичены нужные изменения
- `pages-preview/` попал в commit, если обновлялся demo

## 7. После push

Проверить:

- workflow `Deploy Demo Snapshot` завершился успешно
- открывается опубликованный demo
- нет старых стилей или старого контента

Если стили выглядят старыми, сделать `Ctrl+F5`.
