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

Сначала прогоните легкий contract guardrail:

```powershell
npm.cmd run test:contracts
npm.cmd run check:docs-consistency
```

После этого прогоняйте полную frontend-сборку:

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

## 8. Если релиз идет в production-mode

Для production VPS flow другой:

### Managed content

1. Редактор меняет контент в Strapi admin.
2. Оператор на сервере запускает:

```bash
./deploy/scripts/build-portal.sh
```

### Generated content

1. Обновить `cms/seed/*.json` и закоммитить изменения.
2. На сервере подтянуть новый код.
3. Выполнить:

```bash
./deploy/scripts/seed-content.sh
./deploy/scripts/build-portal.sh
```

### Первичный production deploy

Использовать runbook:

- [deploy/DEPLOY_PRODUCTION.md](e:/Проекты/НоваяГлава/CHATPLUS/deploy/DEPLOY_PRODUCTION.md)
- быстрый entrypoint:

```bash
./deploy/scripts/deploy.sh --with-seed
```

### Обновление production-кода

Если production contour уже поднят:

```bash
./deploy/scripts/update.sh
```

Если вместе с кодом менялся generated content:

```bash
./deploy/scripts/update.sh --with-seed
```

### Локальная Docker-проверка перед VPS

Если нужно быстро прогнать production-like контур на Windows-машине:

```powershell
Copy-Item deploy/.env.local.example deploy/.env.local
.\deploy\scripts\local-up.cmd
```

Потом:

1. открыть `http://127.0.0.1:1337/admin`
2. создать Strapi admin
3. создать API token
4. записать его в `deploy/.env.local` как `STRAPI_API_TOKEN`
5. на чистой локальной базе выполнить:

```powershell
.\deploy\scripts\local-seed-content.cmd
```

6. собрать локальный public site:

```powershell
.\deploy\scripts\local-build-portal.cmd
```

Проверить:

- `http://127.0.0.1:8080/`
- `http://127.0.0.1:8080/pricing/`
- `http://127.0.0.1:8080/solutions/tenders/`

## 9. Коммит и push

```powershell
git add .
git commit -m "Describe your change"
git push origin main
```

## 9a. Что происходит на PR

До merge GitHub Actions запускает workflow `CI`.

Он проверяет:

- `npm run test:contracts`
- `npm run check:docs-consistency`
- `npm --prefix portal run build`
- `content-check`
- `link-graph`
- `encoding-check`
- `npm run seed-content` как runtime-smoke, если доступны `STRAPI_URL` и `STRAPI_TOKEN`

Ограничение текущей архитектуры:

- для fork PR workflow может пропустить build/smoke, потому что проекту нужны live Strapi secrets
- это не заменяет локальную проверку, особенно для крупных contract-level изменений

## 10. После push

1. Проверить GitHub Pages.
2. Проверить representative routes на live.
3. Если менялись Open Graph данные, проверить превью ссылки.

Если релиз идет в production-mode, вместо GitHub Pages проверить:

- public domain
- `cms.` subdomain
- representative routes после rebuild

## 11. Когда релиз считается готовым

Изменение считается не просто “собирается”, а реально готово, когда:

- build зеленый
- contract tests зеленые
- docs/code consistency checker зеленый
- PR CI зеленый или осознанно skipped на fork из-за secrets
- docs не противоречат коду
- ownership не сломан
- representative routes проверены руками
- published snapshot или production static site отражают изменения
