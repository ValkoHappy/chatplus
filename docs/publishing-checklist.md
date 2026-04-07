# Чеклист публикации

## 1. До сборки

Проверить:

- Strapi запущен
- если менялись imported catalog/SEO данные через source payload, выполнен `npm.cmd run seed-content`
- если менялись managed pages, правки сохранены в Strapi

## 2. Обязательная локальная проверка

```powershell
npm.cmd run test:contracts
npm.cmd run check:docs-consistency
```

И только потом:

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
## 5. Optional demo snapshot

```powershell
npm.cmd --prefix portal run snapshot:github-demo
```

Проверить, что `pages-preview/` действительно обновился, только если вы сознательно поддерживаете showcase-flow.

## 6. Перед push

Проверить:

- нет лишних временных файлов в коммите
- закоммичены нужные изменения
- `pages-preview/` попал в commit, только если обновлялся optional demo
- если изменения шли через PR, workflow `CI` должен быть зеленым или осознанно skipped на fork PR без secrets

## 7. После push

Проверить:

- для production-flow: deploy на VPS завершился успешно и сайт обновился
- для optional demo-flow: workflow `Deploy Demo Snapshot` завершился успешно
- нет старых стилей или старого контента

Если стили выглядят старыми, сделать `Ctrl+F5`.

## 8. Что проверяет PR CI

Workflow `CI` на `pull_request` проверяет:

- install в корне и в `portal/`
- `npm run test:contracts`
- `npm run check:docs-consistency`
- `npm --prefix portal run build`
- `content-check`
- `link-graph`
- `encoding-check`
- `npm run seed-content` как runtime-smoke, если в CI доступны `STRAPI_URL` и `STRAPI_TOKEN`

Это не deploy и не замена ручного QA. Это защитный gate до merge.

## 9. Contract guardrails

Перед publish желательно и локально, и на PR иметь зелеными:

```powershell
npm.cmd run test:contracts
npm.cmd run check:docs-consistency
```

Если они красные, публиковать изменение не надо даже при зеленом build.
