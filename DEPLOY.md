# Deploy

## Сценарий 1. Обновить Pages-демо сейчас

Текущий режим: GitHub Pages demo snapshot.

Этот режим используется сейчас, пока нет внешнего сервера со `Strapi`.

### 1. Поднять локальный CMS

```powershell
cd E:\Проекты\НоваяГлава\CHATPLUS
npm.cmd --prefix cms run develop
```

Дождитесь строки `Strapi started successfully`.

### 2. Собрать и обновить демо-снимок

Во втором окне PowerShell:

```powershell
cd E:\Проекты\НоваяГлава\CHATPLUS
npm.cmd --prefix portal run snapshot:github-demo
```

Что делает команда:
- собирает `Astro` из локального `Strapi`
- прогоняет QA-проверки
- обновляет папку `pages-preview`

### 3. Отправить снимок в GitHub

Если `git` не добавлен в `PATH`, используйте полный путь:

```powershell
& "C:\Program Files\Git\cmd\git.exe" add .
& "C:\Program Files\Git\cmd\git.exe" commit -m "Update GitHub Pages demo snapshot"
& "C:\Program Files\Git\cmd\git.exe" push origin main
```

### 4. Проверить деплой

- Откройте `GitHub -> Actions`
- Дождитесь зеленого workflow `Deploy Demo Snapshot`
- Откройте опубликованную версию:

```text
https://valkohappy.github.io/chatplus
```

Если стили выглядят устаревшими, сделайте `Ctrl+F5`.

## Сценарий 2. Будущий production flow

Модель: live Strapi -> build -> deploy.

Когда появится внешний сервер со `Strapi`, можно перейти на обычную схему:

1. Хостинг `Strapi` на публичном URL, например `https://cms.chatplus.ru`
2. GitHub Secrets:
   - `STRAPI_URL`
   - `STRAPI_TOKEN`
3. GitHub Actions собирает `portal/dist` напрямую из CMS
4. Публикация идет без snapshot-папки, сразу из build-артефакта

### Что потребуется заранее

- публичный `STRAPI_URL`, доступный из GitHub Actions
- read-only `STRAPI_TOKEN`
- `Pages -> Source -> GitHub Actions`
- если будет custom domain:
  - `CNAME`
  - DNS на GitHub Pages
  - включенный HTTPS

### Что не нужно делать сейчас

- не переключать основной workflow на live-`Strapi`, пока сервера нет
- не указывать `localhost` или `127.0.0.1` в GitHub Secrets

## Быстрый чек перед публикацией

- `npm.cmd --prefix portal run build` проходит локально
- `pages-preview/index.html` обновился
- `Actions` завершился без ошибок
- `compare`, `site-map`, `pricing`, `channels`, `industries`, `integrations`, `for` открываются на опубликованной версии
