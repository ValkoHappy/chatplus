# Перенос новых страниц и изменение стилей

Этот документ для разработчика или AI-агента. Он нужен, когда появилась новая страница в Strapi, поменялись блоки или нужно поправить стили так, чтобы локальная версия, Git и сервер не разъехались.

Для редактора без кода достаточно инструкции [Как добавить страницу](how-to-add-page.md). Этот runbook объясняет техническую часть: что переносить, где менять CSS и как проверить прод.

## Главное правило

Полное изменение сайта состоит из двух частей:

```text
Git commit + Strapi content snapshot/import
```

Git переносит код, схемы, компоненты, стили и сборочные скрипты. Strapi переносит сами страницы, порядок `sections`, тексты, SEO, связи, publish state и настройки навигации.

Если новая страница видна локально, но не видна на сервере, почти всегда не хватает одного из шагов:

- код не запушен или не обновлен на сервере;
- Strapi-контент не импортирован на сервер;
- portal не пересобран после импорта;
- браузер показывает старый CSS из кеша.

## Новая страница через Strapi

1. Создать или подготовить `Content Manager -> Page`.
2. Проверить обязательное:
   - `route_path` начинается с `/`;
   - `page_kind` соответствует типу страницы;
   - `blueprint` выбран;
   - `sections` не пустые;
   - SEO заполнено;
   - CTA и internal links ведут на реальные URL.
3. Для новой native-страницы обычно не трогать `migration_ready`.
4. Для старого URL не включать `migration_ready`, пока нет visual parity.
5. Проверить preview в Strapi.
6. Опубликовать только после проверки.

Новый route не требует отдельного `.astro` файла, если это обычная `page_v2` страница. После `Publish` и rebuild ее должен подхватить общий routing layer.

## Перенос страницы с локалки на сервер

Если страница создана или изменена в локальной Strapi, одного `git push` недостаточно.

Нужно:

1. Сделать backup сервера.
2. Экспортировать локальный Strapi content snapshot.
3. Импортировать snapshot на сервер.
4. Пересобрать portal.
5. Проверить URL.

Подробные команды находятся в [Workflow Strapi content snapshot](content-snapshot-workflow.md).

Минимальная проверка после переноса:

```powershell
curl.exe -I https://astro.integromat.ru/reactivator
```

Ожидаемо:

```text
HTTP/2 200
```

Для точечной проверки HTML можно искать ключевые заголовки страницы:

```powershell
node -e "fetch('https://astro.integromat.ru/reactivator',{cache:'no-store'}).then(r=>r.text()).then(t=>console.log(t.includes('Тарифы'), t.includes('Что еще посмотреть')))"
```

## Изменение стилей

Сначала определить, где живет блок:

- generic/native `PageV2Page`;
- legacy family renderer;
- общий primitive;
- отдельный компонент блока.

Не чинить стиль случайным CSS по конкретному URL, если блок переиспользуется. Для повторяемого блока стиль должен жить в компоненте или primitive.

Типовые места:

```text
portal/src/components/PageV2Page.astro
portal/src/components/page-v2/*.astro
portal/src/styles/block-primitives.css
portal/src/layouts/Base.astro
```

Пример: если сломались кнопки тарифов, сначала искать компонент pricing block, а не править весь сайт:

```text
portal/src/components/page-v2/PricingPlansBlock.astro
```

После правки проверить:

- desktop;
- mobile;
- длинный русский текст в кнопке;
- hover/focus;
- что кнопка не сжимается до ширины текста;
- что блок не ломает другие страницы, где используется тот же component.

## Когда нужен новый block type

Новый визуальный блок нельзя добавить только в Astro.

Полный путь:

1. Strapi component schema.
2. Dynamic zone разрешает этот component.
3. TypeScript types обновлены.
4. Portal normalizer понимает payload.
5. Renderer/component отрисовывает блок.
6. Tests/contracts обновлены.
7. Docs обновлены.
8. Контент в Strapi создан или импортирован.

Если пропустить Strapi/schema часть, редактор не сможет добавить блок в `sections`. Если пропустить portal renderer, блок сохранится в Strapi, но не появится на сайте.

## Старые family и PageV2Page

`page_v2` - это общий content contract, но не всегда общий визуальный renderer.

Правило:

- новые native pages могут идти через `PageV2Page`;
- старые URL с family layout не переводить на generic `PageV2Page` без safety gate;
- старый route можно переключать только при `migration_ready=true`, `parity_status=approved`, `editorial_status=approved` и после visual smoke.

Если старый route выглядит странно, сначала проверить family/bridge/materializer, а не пытаться “докрутить” generic CSS.

## Проверки перед коммитом

Если менялся только frontend или docs:

```powershell
npm.cmd run test:contracts
npm.cmd run check:docs-consistency
npm.cmd --prefix portal run build
```

Если менялись Strapi schemas:

```powershell
npm.cmd --prefix cms run build
npm.cmd run test:contracts
```

Если менялся Strapi-контент:

1. Сделать новый content snapshot.
2. Записать в handoff, какой snapshot соответствует commit.
3. На сервере импортировать snapshot.
4. Пересобрать portal.

## Проверки после деплоя на сервер

Проверить:

- `git rev-parse --short HEAD` на сервере совпадает с нужным commit;
- `./deploy/scripts/build-portal.sh` завершился успешно;
- нужный route возвращает `200`;
- на странице есть ключевые блоки;
- CSS bundle содержит ожидаемое правило, если менялись стили;
- в браузере после `Ctrl+F5` нет старой версии.

Пример для CSS:

```powershell
node -e "fetch('https://astro.integromat.ru/reactivator',{cache:'no-store'}).then(r=>r.text()).then(console.log)"
```

Если HTML обновился, а CSS визуально старый, сначала сделать hard reload. Если не помогло, проверить, что серверный build собран после последнего commit.

## Что писать в handoff

После работы с новой страницей или стилями оставить короткую запись:

```text
Git commit:
Content snapshot:
Routes changed:
Blocks changed:
Styles changed:
Server build:
Smoke checked:
Known risks:
```

Так следующий разработчик поймет, что именно было перенесено: код, контент или обе части.

