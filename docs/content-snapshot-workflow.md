# Workflow Strapi content snapshot

Этот документ нужен, чтобы другой разработчик или AI работал с тем же состоянием сайта, что и мы.

## Коротко

Git хранит код и схемы. Strapi хранит контент. Поэтому для полного воспроизведения сайта нужен не только commit, но и content snapshot.

Правильная формула:

```text
рабочее состояние сайта = Git commit + Strapi content snapshot + env/секреты
```

Если перенести только Git, но не перенести Strapi content snapshot, сервер или локальная машина будут собирать сайт из другой базы. Визуально это выглядит как “пропали блоки”, “навигация другая”, “страницы не такие как локально”.

## Что входит в content snapshot

Через Strapi export/import переносится:

- `Page` / `page_v2`;
- `Page Blueprint`;
- `Page Version`;
- `Generation Job`;
- legacy `landing-page` и другие старые managed записи;
- entities: `channel`, `industry`, `integration`, `solution`, `feature`, `business_type`, `competitor`;
- связи между записями;
- publish state.

Файлы media/uploads можно переносить вместе с snapshot, если права на сервере настроены. Если импорт `files` падает из-за прав, сначала переносим `content`, а uploads чинятся отдельным шагом.

## Что не входит в Git

Не коммитить:

- `.env`;
- пароли Strapi admin;
- `STRAPI_API_TOKEN`;
- `POSTGRES_PASSWORD`;
- `WEBHOOK_TOKEN`;
- JWT/session salts;
- raw `.db` файлы;
- Postgres dumps без отдельного решения;
- приватные ключи SSH.

Даже если репозиторий private, секреты лучше передавать через владельца, password manager или server env.

## Где хранить snapshot

Рекомендуемый вариант:

- маленькие инструкции и manifest храним в Git;
- большие `.tar` snapshots храним в GitHub Releases, Git LFS или в защищенном server backup storage;
- в commit/handoff пишем имя snapshot, дату и ожидаемые counts.

Для локальных временных архивов используется:

```text
deploy/data/backups/
```

Эта папка игнорируется Git, кроме `.gitkeep`.

## Экспорт локального Strapi-контента

Команда из корня проекта:

```powershell
npm.cmd --prefix cms run strapi -- export --only content,files --no-encrypt --no-compress --file ..\deploy\data\backups\chatplus-local-content-YYYYMMDD-HHMMSS
```

Если нужны только записи без uploads:

```powershell
npm.cmd --prefix cms run strapi -- export --only content --no-encrypt --no-compress --file ..\deploy\data\backups\chatplus-local-content-YYYYMMDD-HHMMSS
```

На выходе появится архив:

```text
deploy/data/backups/chatplus-local-content-YYYYMMDD-HHMMSS.tar
```

## Импорт snapshot на VPS

Перед импортом обязательно сделать backup:

```powershell
ssh root@188.120.236.230 "cd /srv/chatplus && ./deploy/scripts/backup.sh"
```

Скопировать архив:

```powershell
scp deploy\data\backups\chatplus-local-content-YYYYMMDD-HHMMSS.tar root@188.120.236.230:/srv/chatplus/deploy/data/backups/
```

Импортировать контент:

```powershell
ssh root@188.120.236.230 "cd /srv/chatplus && docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml run --rm -v /srv/chatplus/deploy/data/backups/chatplus-local-content-YYYYMMDD-HHMMSS.tar:/tmp/chatplus-local-content.tar strapi npm run strapi -- import -f /tmp/chatplus-local-content.tar --force --only content"
```

Если отдельно переносите files/uploads и права уже исправлены, можно использовать `--only content,files`.

После импорта поднять Strapi и пересобрать публичный сайт:

```powershell
ssh root@188.120.236.230 "cd /srv/chatplus && docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml up -d strapi && ./deploy/scripts/build-portal.sh"
```

## Проверка после импорта

Проверить counts ключевых таблиц. Пример SQL:

```sql
select 'page_v2s', count(*) from page_v2s
union all select 'page_blueprints', count(*) from page_blueprints
union all select 'page_versions', count(*) from page_versions
union all select 'landing_pages', count(*) from landing_pages
union all select 'channels', count(*) from channels
union all select 'industries', count(*) from industries
union all select 'integrations', count(*) from integrations
union all select 'solutions', count(*) from solutions
union all select 'features', count(*) from features
union all select 'business_types', count(*) from business_types
union all select 'competitors', count(*) from competitors;
```

Команда для запуска SQL на сервере:

```powershell
ssh root@188.120.236.230 "cd /srv/chatplus && docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml exec -T postgres psql -U chatplus -d chatplus -At"
```

Ожидаемый ориентир после полного локального snapshot:

```text
page_v2s = 1600
page_blueprints = 9
page_versions = 19263
landing_pages = 32
channels = 14
industries = 30
integrations = 32
solutions = 20
features = 28
business_types = 22
competitors = 10
portal build = около 802 pages
```

Эти числа могут меняться после новых страниц, но если они резко меньше, значит контент перенесен не полностью.

## Рабочий процесс для разработчика

### Перед изменениями

1. `git pull`.
2. Получить актуальный snapshot или снять export с сервера.
3. Импортировать snapshot локально.
4. Запустить Strapi и Astro.
5. Проверить route, который будете менять.

### После изменений

1. Прогнать проверки:

```powershell
npm.cmd run test:contracts
npm.cmd run check:docs-consistency
npm.cmd --prefix portal run build
```

2. Если менялся Strapi-контент, сделать новый export.
3. В handoff указать:

```text
Git commit:
Content snapshot:
Дата:
Что изменено:
Какие counts ожидать:
Какие routes проверены:
```

4. На сервер переносить код и snapshot вместе.

## Рабочий процесс для AI-агента

AI не должен предполагать, что Git содержит весь сайт.

Перед задачей, связанной с контентом, AI должен:

1. Прочитать `AGENTS.md`.
2. Прочитать этот документ.
3. Проверить, какая база подключена локально.
4. Если есть риск рассинхрона, сначала попросить или создать актуальный content snapshot.
5. После изменений явно написать, нужен ли новый snapshot для сервера.

## Почему не просто удалить серверную базу

Можно сделать destructive import, но только по правилам:

- сначала backup;
- затем import snapshot;
- затем rebuild portal;
- затем smoke routes;
- затем проверка counts.

Удалять базу без backup нельзя: Strapi хранит не только страницы, но и связи, publish state, историю, users/permissions и служебные данные.

## Как понять, что сервер и локалка совпадают

Сравнить:

- Git SHA локально и на сервере;
- counts таблиц;
- `portal build` pages count;
- несколько representative routes:
  - `/`
  - `/pricing`
  - `/compare/respond-io`
  - `/channels/email/amocrm`
  - `/site-map`
- Strapi admin открывается и видит `Page`, `Page Blueprint`, `Page Version`.

Если код совпадает, а страницы отличаются, почти всегда причина в разном Strapi content snapshot.

