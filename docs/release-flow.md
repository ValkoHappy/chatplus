# Release Flow CHATPLUS

## 1. Понять тип изменения

Перед выпуском ответьте на два вопроса:

1. Это `managed` или `imported` изменение?
2. Это контент, importer, frontend или deploy automation?

## 2. Managed release

Если меняли `managed`-страницу:

1. правим запись в `Strapi`
2. нажимаем `Publish`
3. webhook уходит в relay
4. relay вызывает `repository_dispatch`
5. workflow `Content Publish Pipeline` собирает и выкатывает сайт

## 3. Imported release

Если меняли source data:

1. обновить `cms/seed/*.json`
2. прогнать dry-run:

```powershell
npm.cmd run seed-content:plan
```

3. если diff корректный, выполнить:

```powershell
npm.cmd run seed-content
```

4. если нужен принудительный overwrite:

```powershell
npm.cmd run seed-content:force
```

5. после sync выполнить publish flow

## 4. Локальные обязательные проверки

```powershell
npm.cmd run test:contracts
npm.cmd run check:docs-consistency
npm.cmd --prefix portal run build
```

## 5. Что проверять руками

Representative routes:

- `/`
- `/pricing`
- `/partnership`
- `/solutions/tenders`
- `/compare/respond-io`

Нужно проверить:

- hero
- CTA
- internal links
- FAQ
- header/footer
- отсутствие очевидного content drift

## 6. Automation entrypoints

### Content publish

- workflow: `.github/workflows/deploy.yml`
- trigger: `repository_dispatch` с типом `strapi-content-publish`

### Code pipeline

- workflow: `.github/workflows/code-pipeline.yml`
- trigger: `push` в `main` и `workflow_dispatch`

## 7. Transitional production contour

Пока production идет через:

- `VPS + docker` как CMS/data plane
- static deploy как public delivery plane

Operational entrypoints:

- `./deploy/scripts/deploy.sh`
- `./deploy/scripts/update.sh`
- `./deploy/scripts/seed-content.sh`
- `./deploy/scripts/build-portal.sh`

## 8. Когда релиз считается готовым

Релиз готов, когда:

- tests зеленые
- docs consistency зеленый
- build зеленый
- контентный publish/sync завершился без конфликтов
- representative routes проверены руками
