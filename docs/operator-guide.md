# Гайд оператора

Этот документ для человека, который обновляет контент и публикует demo, не влезая глубоко во frontend-код.

## 1. Короткое правило

### Правим seeds, если страница `generated`

Примеры:

- channels
- industries
- integrations
- solutions
- features
- business types
- competitors

### Правим Strapi, если страница `managed`

Примеры:

- `/`
- `/docs`
- `/media`
- `/promo`
- `/pricing`
- `/partnership`

## 2. Как запустить проект локально

### Запустить Strapi

```powershell
npm.cmd --prefix cms run develop
```

### Запустить Astro

Во втором окне:

```powershell
npm.cmd --prefix portal run dev -- --host 127.0.0.1
```

Открыть:

```text
http://127.0.0.1:4321/
```

## 3. Как обновить generated-контент

Если вы меняли generator-owned данные, запускайте:

```powershell
npm.cmd run seed-content
```

После этого обязательно:

```powershell
npm.cmd --prefix portal run build
```

## 4. Как добавить новую generated page

1. Открыть нужный файл в `cms/seed/`.
2. Добавить новую запись.
3. Запустить:

```powershell
npm.cmd run seed-content
```

4. Убедиться, что запись появилась в Strapi.
5. Запустить build:

```powershell
npm.cmd --prefix portal run build
```

## 5. Как добавить managed singleton page

1. Создать запись в Strapi.
2. Выставить:
   - `template_kind`
   - `content_origin = managed`
3. Заполнить контент.
4. Убедиться, что маршрут поддерживается frontend.
5. Прогнать build.

## 6. Как понять, что все в порядке

Проект считается здоровым, если проходит:

```powershell
npm.cmd --prefix portal run build
```

## 7. Как выпустить demo

1. Запустить Strapi.
2. Если меняли generated content — выполнить `seed-content`.
3. Собрать demo snapshot:

```powershell
npm.cmd --prefix portal run snapshot:github-demo
```

4. Закоммитить изменения.
5. Запушить.
6. Проверить workflow `Deploy Demo Snapshot`.

## 8. Что делать, если что-то пошло не так

### Build падает

Проверить:

- запущен ли Strapi
- не забыли ли прогнать `seed-content`
- нет ли ошибок в новых seed-данных

### Страница не появилась

Проверить:

- добавлена ли запись в правильный source seed
- был ли выполнен `seed-content`
- появился ли объект в Strapi
- поддерживается ли маршрут frontend

### На GitHub Pages старые стили

Проверить:

- обновился ли `pages-preview/`
- был ли закоммичен новый snapshot
- прошел ли workflow
- сделать `Ctrl+F5`

### В Telegram нет новой превьюхи

Проверить:

- опубликован ли новый `og:image`
- обновился ли live HTML
- если live уже обновился, почистить кэш Telegram через `@WebpageBot`

## 9. К кому идти, если проблема не решается

- контент страницы -> контентщик или владелец Strapi
- шаблон или верстка -> frontend developer
- генератор или seeds -> инженер, который ведет content pipeline
- публикация, GitHub Pages, secrets -> devops или техлид
## 10. Совсем короткий слой для владельца

Если нужно объяснение без инженерных деталей, сначала откройте:

- [Быстрый вход для владельца](owner-quickstart.md)
- [Деплой](../DEPLOY.md)
