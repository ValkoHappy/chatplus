# Деплой CHATPLUS

## 1. Текущий режим: demo-mode

Сейчас проект публикуется не из hosted Strapi, а через локальный snapshot:

`local Strapi -> Astro build -> pages-preview -> GitHub Pages`

Это рабочий demo-контур, а не полноценный production DevOps.

## 2. Что делает оператор перед публикацией

### Шаг 1. Запустить локальный Strapi

```powershell
npm.cmd --prefix cms run develop
```

### Шаг 2. Если менялся generated content — обновить Strapi

```powershell
npm.cmd run seed-content
```

### Шаг 3. Собрать demo snapshot

Во втором окне:

```powershell
npm.cmd --prefix portal run snapshot:github-demo
```

### Шаг 4. Commit и push

Если `git` не в `PATH`, можно использовать:

```powershell
& "C:\Program Files\Git\cmd\git.exe" add .
& "C:\Program Files\Git\cmd\git.exe" commit -m "Update demo snapshot"
& "C:\Program Files\Git\cmd\git.exe" push origin main
```

### Шаг 5. Проверить деплой

Проверить workflow:

- `Deploy Demo Snapshot`

## 3. Что обязательно должно быть зеленым

```powershell
npm.cmd --prefix portal run build
```

Это включает:

- Astro build
- content quality check
- internal links check
- encoding check

## 4. Что generator overwrites, а что нет

### Generator может обновлять

- `generated` records
- generator-owned page families
- materialized programmatic content

### Generator не должен silently overwrite

- `managed` singleton pages
- контент, который редактор ведет вручную в Strapi

## 5. Кто владеет чем

### Контентщик или оператор

- Strapi content
- запуск `seed-content`
- публикация demo snapshot

### Разработчик

- шаблоны
- layout
- стили
- адаптив
- adapters и normalization

### DevOps или техлид

- secrets
- GitHub Actions
- будущий production deploy
- внешний Strapi, когда он появится

## 6. Demo-mode и production-mode — разные контуры

### Сейчас: demo-mode

- локальный Strapi
- локальный build
- `pages-preview`
- GitHub Pages

### Потом: production-mode

- hosted Strapi
- GitHub Actions build from live CMS
- deploy artifact

Нельзя использовать в CI:

- `localhost`
- `127.0.0.1`

## 7. Что нужно для production-mode

Следующий этап, если проект переводится в полноценную эксплуатацию:

- поднять внешний Strapi
- завести секреты `STRAPI_URL` и `STRAPI_TOKEN`
- настроить CI/CD build from live CMS
- настроить бэкапы Strapi
- определить роли и права доступа

## 8. Troubleshooting

### Demo не обновился

Проверить:

1. обновился ли `pages-preview/`
2. попал ли snapshot в commit
3. прошел ли workflow
4. сделать `Ctrl+F5`

### Build падает

Проверить:

1. запущен ли Strapi
2. не забыли ли `seed-content`
3. не сломаны ли seeds/generator inputs

### Новая generated page не появилась

Проверить:

1. была ли запись добавлена в source seed
2. запускался ли `seed-content`
3. появилась ли запись в Strapi
4. поддерживает ли frontend нужный route

### В Telegram не обновилось превью

Проверить:

1. live HTML уже отдает новый `og:image`
2. сам `og-image` доступен по URL
3. если сайт уже обновился, почистить кэш Telegram через `@WebpageBot`
