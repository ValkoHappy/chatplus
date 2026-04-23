# Релизный поток CHATPLUS

## 1. Понять тип изменения

Перед выпуском ответьте на два вопроса:

1. Это `managed` или `imported` изменение?
2. Это контент, importer, frontend или deploy automation?

## 2. Релиз managed-контента

Если меняли `managed`-страницу:

1. правим запись в `Strapi`
2. нажимаем `Publish`
3. webhook уходит в relay
4. relay запускает локальный `build-portal.sh` на VPS
5. сайт пересобирается и выкатывается на том же сервере

## 3. Релиз imported-контента

Если меняли source data:

1. обновить `cms/seed/*.json`
2. прогнать dry-run:

```powershell
npm run seed-content:plan
```

3. если diff корректный, выполнить:

```powershell
npm run seed-content
```

4. если нужен принудительный overwrite:

```powershell
npm run seed-content:force
```

5. после sync выполнить publish flow

## 4. Локальные обязательные проверки

```powershell
npm run test:contracts
npm run check:docs-consistency
npm --prefix portal run build
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

## 6. Точки входа автоматизации

### Публикация контента

- trigger по умолчанию: `Strapi webhook -> relay -> local rebuild`
- entrypoint: `content-relay` + `./deploy/scripts/build-portal.sh`

### Кодовый конвейер

- workflow: `.github/workflows/code-pipeline.yml`
- trigger: `push` в `main` и `workflow_dispatch`

## 7. Переходный прод-контур

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
