# CHATPLUS для владельца

Это самый короткий нетехнический вход в проект.

Используйте его, если вы:

- владелец проекта
- партнер
- менеджер
- контент-оператор, который не хочет сначала читать полную инженерную документацию

## 1. Что это за проект

`CHATPLUS` — это публичный сайт продукта `Chat Plus`.

У него есть две части:

- публичный сайт, который видят посетители
- CMS-админка, где редактируется контент

В этом проекте CMS — это `Strapi`, а публичный сайт собирается на `Astro`.

Простая модель:

- `site` = публичные страницы
- `CMS` = админка для контента

## 2. Что и где редактируется

В проекте есть два контентных режима.

### Managed content

Редактируется напрямую в `Strapi`.

Типичные примеры:

- главная страница
- pricing
- partnership
- docs/media/promo-подобные managed pages

Если вы хотите изменить текст на такой странице, нормальное место для этого — CMS admin panel.

### Generated content

Такой контент не редактируется вручную в Strapi как основной источник.

Он генерируется из seed-файлов проекта и потом импортируется в Strapi.

Типичные примеры:

- channels
- industries
- integrations
- features
- solutions
- competitors

Если нужно изменить такой контент, его источник обычно находится в `cms/seed/*.json`.

## 3. Как выглядит обычное обновление

### Если кто-то изменил контент в Strapi

Следующий шаг — пересобрать публичный сайт.

В Docker/VPS flow это обычно значит:

```bash
./deploy/scripts/build-portal.sh
```

В local/demo flow это обычно значит:

```powershell
npm.cmd --prefix portal run build
```

### Если кто-то изменил generated seed files

Нормальный порядок такой:

1. обновить `cms/seed/*.json`
2. выполнить content import
3. пересобрать публичный сайт

В Docker/VPS flow:

```bash
./deploy/scripts/seed-content.sh
./deploy/scripts/build-portal.sh
```

## 4. Какая инфраструктура уже есть

Сейчас есть два deploy contour.

### Demo contour

- local Strapi
- Astro build
- `pages-preview`
- GitHub Pages

Подходит для showcase/demo publishing.

### Production contour

- `postgres`
- `strapi`
- `nginx`
- одноразовые build/import containers
- `docker compose`

Это уже повторяемый server-ready contour.

## 5. Что нужно от сервера

Рекомендуемый минимум для VPS:

- `2 vCPU`
- `4 GB RAM`
- `40-60 GB SSD`

Что проекту нужно со стороны сервера:

- Ubuntu `22.04` или `24.04`
- Docker / Docker Compose
- основной домен для публичного сайта
- поддомен `cms.` для Strapi
- SSH-доступ для настройки

## 6. Что уже автоматизировано

В проекте уже есть:

- воспроизводимые Docker-based deploy files
- build/import scripts
- backup/restore scripts
- CI-проверки для PR
- документация для local, demo и production flow

Это значит, что проект больше не зависит только от сценария «кто-то помнит, как это однажды настроили».

## 7. Что пока остается ручным

На текущем этапе человек все еще контролирует:

- согласование контентных изменений
- visual QA
- решение, когда публиковать изменения
- запуск rebuild/update команд в текущем flow

Для текущего уровня зрелости проекта это нормально.

## 8. Если нужны только три файла

Начинайте отсюда:

1. [DEPLOY.md](/e:/Проекты/НоваяГлава/CHATPLUS/DEPLOY.md)
2. [release-flow.md](/e:/Проекты/НоваяГлава/CHATPLUS/docs/release-flow.md)
3. [operator-guide.md](/e:/Проекты/НоваяГлава/CHATPLUS/docs/operator-guide.md)

## 9. Самое короткое резюме

- сайт для посетителей статический
- контент управляется через Strapi
- часть контента редактируется в CMS, часть приходит из seed-файлов
- после контентных изменений сайт нужно пересобирать
- у проекта уже есть повторяемый Docker-based production contour
