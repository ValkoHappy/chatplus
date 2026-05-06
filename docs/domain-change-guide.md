# Смена домена production

Этот документ нужен, когда публичный сайт и Strapi нужно перенести на другой домен.

В проекте домен живет не в одном месте. Нужно обновить DNS, `deploy/.env`, SSL-сертификаты, пересобрать Astro и проверить Strapi preview. Если менялись SEO-поля в Strapi, нужен content snapshot.

## Короткий чеклист

1. Подготовить новый публичный домен и CMS-поддомен.
2. Направить DNS на VPS.
3. Запустить упрощенный скрипт смены домена.
4. Проверить сайт, Strapi admin, preview, sitemap и canonical.
5. Если менялись Strapi SEO/site settings, сделать content snapshot.

## Самый простой способ

На VPS:

```bash
cd /srv/chatplus
bash deploy/scripts/change-domain.sh astro.integromat.ru strapi.integromat.ru ops@example.com --apply --ssl --rebuild
```

Эта команда:

- создает backup `deploy/.env`;
- делает server backup через `deploy/scripts/backup.sh`;
- меняет `PUBLIC_DOMAIN`, `CMS_DOMAIN`, `PUBLIC_SITE_URL`, `CMS_PUBLIC_URL` и `LETSENCRYPT_EMAIL`;
- выпускает SSL через `deploy/scripts/issue-ssl.sh`;
- пересобирает production через `deploy/scripts/update.sh --skip-pull`;
- в конце показывает команды для проверки.

Если нужно только посмотреть, что будет изменено, запустите без `--apply`:

```bash
cd /srv/chatplus
bash deploy/scripts/change-domain.sh astro.integromat.ru strapi.integromat.ru ops@example.com
```

Если нужно сначала подтянуть свежий Git, добавьте `--pull`:

```bash
cd /srv/chatplus
bash deploy/scripts/change-domain.sh astro.integromat.ru strapi.integromat.ru ops@example.com --apply --ssl --rebuild --pull
```

Если backup Strapi уже сделан вручную и нужно не тратить время:

```bash
cd /srv/chatplus
bash deploy/scripts/change-domain.sh astro.integromat.ru strapi.integromat.ru ops@example.com --apply --ssl --rebuild --no-site-backup
```

## Какие домены нужны

Обычно используются два host:

| Что | Пример | Где используется |
| --- | --- | --- |
| Публичный сайт | `example.com` или `astro.example.com` | Astro, sitemap, canonical, preview страницы |
| Strapi admin | `strapi.example.com` | Strapi admin, API, publish webhook |

Не смешивайте публичный сайт и Strapi admin на одном host без отдельного nginx-плана. Текущий production compose ожидает два server name: `PUBLIC_DOMAIN` и `CMS_DOMAIN`.

## DNS

У регистратора или в DNS-панели создайте записи:

```text
example.com         A     188.120.236.230
strapi.example.com  A     188.120.236.230
```

Если используется `www`, добавьте его отдельно:

```text
www.example.com     CNAME example.com
```

Проверьте, что DNS уже смотрит на VPS:

```bash
dig +short example.com
dig +short strapi.example.com
```

или на Windows:

```powershell
nslookup example.com
nslookup strapi.example.com
```

SSL не выпустится, пока оба домена не указывают на сервер.

## Backup перед сменой

На VPS:

```bash
cd /srv/chatplus
cp deploy/.env "deploy/.env.bak-domain-$(date +%Y%m%d-%H%M%S)"
./deploy/scripts/backup.sh
```

Backup важен, потому что полный сайт это не только Git: Strapi DB тоже часть production-состояния.

## Что менять в deploy/.env

Откройте `/srv/chatplus/deploy/.env` и поменяйте только доменные значения:

```env
PUBLIC_DOMAIN=example.com
CMS_DOMAIN=strapi.example.com
PUBLIC_SITE_URL=https://example.com
CMS_PUBLIC_URL=https://strapi.example.com
LETSENCRYPT_EMAIL=ops@example.com
```

Правила:

- `PUBLIC_DOMAIN` - только host публичного сайта, без `https://`.
- `CMS_DOMAIN` - только host Strapi, без `https://`.
- `PUBLIC_SITE_URL` - полный origin публичного сайта, без slash в конце.
- `CMS_PUBLIC_URL` - полный origin Strapi, без slash в конце.
- `LETSENCRYPT_EMAIL` - email для Let's Encrypt уведомлений.

Пример правильно:

```env
PUBLIC_DOMAIN=astro.integromat.ru
CMS_DOMAIN=strapi.integromat.ru
PUBLIC_SITE_URL=https://astro.integromat.ru
CMS_PUBLIC_URL=https://strapi.integromat.ru
```

## Если Astro должен быть на основном домене

Это нормальная схема: публичный Astro сайт открывается без поддомена, а Strapi остается на отдельном CMS-поддомене.

В `deploy/.env`:

```env
PUBLIC_DOMAIN=astro.integromat.ru
CMS_DOMAIN=strapi.integromat.ru
PUBLIC_SITE_URL=https://astro.integromat.ru
CMS_PUBLIC_URL=https://strapi.integromat.ru
```

DNS:

```text
astro.integromat.ru   A     188.120.236.230
strapi.integromat.ru  A     188.120.236.230
```

В этом случае не нужно указывать дополнительный host вроде `www` или `root`-домена. Переменная `PUBLIC_DOMAIN` должна быть именно тем host, на котором пользователь открывает сайт.

Пример плохо:

```env
PUBLIC_DOMAIN=https://astro.integromat.ru/
PUBLIC_SITE_URL=https://astro.integromat.ru/
CMS_DOMAIN=strapi.integromat.ru/admin
```

Секреты, токены, пароли и API keys при смене домена обычно не трогаются.

## Выпустить SSL

После DNS:

```bash
cd /srv/chatplus
./deploy/scripts/issue-ssl.sh
```

Скрипт делает временный self-signed certificate, поднимает nginx, запрашивает Let's Encrypt для `PUBLIC_DOMAIN` и `CMS_DOMAIN`, затем перезагружает nginx.

Если команда падает:

- проверьте `PUBLIC_DOMAIN` и `CMS_DOMAIN` в `deploy/.env`;
- проверьте DNS;
- проверьте, что порты `80` и `443` открыты;
- посмотрите nginx/certbot logs.

## Пересобрать сайт

После смены домена и SSL нужно пересобрать production:

```bash
cd /srv/chatplus
./deploy/scripts/update.sh --skip-pull
```

Если надо подтянуть свежий Git с GitHub:

```bash
cd /srv/chatplus
./deploy/scripts/update.sh
```

Почему пересборка обязательна:

- Astro берет `PUBLIC_SITE_URL` для canonical и sitemap.
- Strapi admin preview берет `PUBLIC_SITE_URL` для preview-ссылок.
- nginx берет `PUBLIC_DOMAIN` и `CMS_DOMAIN` из `deploy/.env`.
- public build лежит в `deploy/data/public-site/current`.

## Проверки после смены

На VPS:

```bash
cd /srv/chatplus
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml ps
curl -I https://example.com
curl -I https://strapi.example.com/admin
curl -s https://example.com/robots.txt
curl -I https://example.com/sitemap-index.xml
```

В браузере:

1. Откройте `https://example.com`.
2. Откройте `https://strapi.example.com/admin`.
3. В Strapi откройте любую `Page`.
4. Нажмите preview.
5. Убедитесь, что preview открывается на новом публичном домене.
6. Опубликуйте тестовую правку только если реально проверяете publish flow.

## Strapi content и SEO

`PUBLIC_SITE_URL` перекидывает build на новый домен, но в Strapi могут остаться абсолютные старые URL:

- `Site Settings -> site_url`;
- SEO field `canonical`;
- абсолютные ссылки внутри блоков;
- sitemap/nav-related поля, если они вручную ссылались на старый host.

Если меняете эти поля через Strapi, после правки:

1. Создайте content snapshot.
2. Запишите, какой snapshot соответствует смене домена.
3. Импортируйте snapshot на production, если домен менялся сначала локально.
4. Пересоберите portal.

Для внутренних ссылок лучше использовать относительные URL: `/pricing`, `/academy`, `/channels/telegram`.

## Robots и sitemap

Проверьте:

```bash
curl -s https://example.com/robots.txt
curl -s https://example.com/sitemap-index.xml | head
```

В sitemap/canonical не должно остаться старого домена. Если осталось, почти всегда причина одна из двух:

- production пересобрали со старым `PUBLIC_SITE_URL`;
- в Strapi SEO/canonical вручную записан старый absolute URL.

## Publish и rebuild

Публикация в Strapi должна дернуть `content-relay`:

```env
RELAY_INTERNAL_URL=http://content-relay:8787/strapi/publish
RELAY_LOCAL_COMMAND=/srv/chatplus/deploy/scripts/build-portal.sh
```

После смены домена проверьте один publish flow:

1. В Strapi измените безопасную тестовую страницу.
2. Нажмите publish.
3. Посмотрите, что сайт пересобрался.
4. Откройте публичный URL на новом домене.

Логи:

```bash
cd /srv/chatplus
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml logs --tail=100 content-relay
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml logs --tail=100 strapi
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml logs --tail=100 nginx
```

## Откат

Если новый домен не заработал:

```bash
cd /srv/chatplus
cp deploy/.env.bak-domain-YYYYMMDD-HHMMSS deploy/.env
./deploy/scripts/update.sh --skip-pull
```

Если DNS уже переключен, верните DNS на старые значения или временно оставьте оба домена направленными на VPS.

## Частые ошибки

| Ошибка | Что происходит | Как исправить |
| --- | --- | --- |
| В `PUBLIC_DOMAIN` записали `https://...` | nginx/certbot не находят корректный server name | Оставить только host |
| В `PUBLIC_SITE_URL` есть slash в конце | canonical/preview могут склеиваться криво | Убрать trailing slash |
| Поменяли только DNS | сайт открывается со старым canonical/sitemap | Обновить `deploy/.env` и пересобрать |
| Поменяли только `PUBLIC_SITE_URL` | Strapi admin остался на старом домене | Обновить `CMS_DOMAIN` и `CMS_PUBLIC_URL` |
| SSL выпущен до DNS | certbot падает | Дождаться DNS propagation |
| Забыли content snapshot | локально и production отличаются по SEO/страницам | Экспортировать/import Strapi snapshot |
| Старый домен в Strapi canonical | sitemap/build выглядит новым, а страница отдает старый canonical | Исправить SEO в `Page` или `Site Settings` |

## Где это связано в коде

- `deploy/.env.example` - список production env-переменных.
- `deploy/docker-compose.prod.yml` - проброс доменов в Strapi, Astro и nginx.
- `deploy/nginx/templates/public-site.conf.template` - nginx для публичного сайта.
- `deploy/nginx/templates/cms-site.conf.template` - nginx для Strapi.
- `deploy/scripts/issue-ssl.sh` - выпуск Let's Encrypt.
- `deploy/scripts/update.sh` - production update и rebuild.
- `portal/astro.config.mjs` - `PUBLIC_SITE_URL` для Astro site/sitemap.
- `cms/config/admin.ts` - preview origin для Strapi admin.
