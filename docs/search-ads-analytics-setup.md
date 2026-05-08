# Подготовка сайта к поиску, Метрике и рекламе

Этот документ описывает, что нужно настроить для Google, Яндекса, Яндекс Метрики, Яндекс Директа и рекламных конверсий.

Публичный сайт сейчас собирается как статический Astro artifact. Поэтому счетчики, verification-коды и домен попадают в HTML во время build. После изменения env нужно пересобрать portal.

## Что уже подготовлено в коде

- canonical и sitemap берут домен из `PUBLIC_SITE_URL`;
- `robots.txt` указывает на `https://astro.integromat.ru/sitemap-index.xml`;
- preview и AI preview страницы должны оставаться закрытыми от индексации через `robots=noindex`;
- в общий layout добавлены env-driven теги для Google/Yandex verification;
- добавлена поддержка Яндекс Метрики;
- добавлена поддержка Google tag или Google Tag Manager;
- CTA-кнопки отправляют единое событие `cta_try_click`;
- на странице доступен helper `window.chatplusTrack(eventName, params)` для будущих целей.

## Env-переменные

Все значения можно оставлять пустыми, пока аккаунты не созданы.

```env
PUBLIC_SITE_URL=https://astro.integromat.ru

PUBLIC_GOOGLE_SITE_VERIFICATION=
PUBLIC_YANDEX_SITE_VERIFICATION=

PUBLIC_YANDEX_METRIKA_ID=
PUBLIC_YANDEX_METRIKA_WEBVISOR=false

PUBLIC_GOOGLE_TAG_ID=
PUBLIC_GOOGLE_TAG_MANAGER_ID=
```

Правило:

- `PUBLIC_GOOGLE_TAG_MANAGER_ID` имеет приоритет над `PUBLIC_GOOGLE_TAG_ID`;
- если включен GTM, обычный Google tag из `PUBLIC_GOOGLE_TAG_ID` не выводится;
- `PUBLIC_YANDEX_METRIKA_WEBVISOR=true` включайте только если нужен Вебвизор;
- реальные ID и verification-коды не коммитятся в Git, они живут в server/Railway env.

## Google Search Console

1. Открыть Google Search Console.
2. Добавить ресурс для домена или URL-prefix `https://astro.integromat.ru`.
3. Выбрать verification через DNS, HTML-файл или meta tag.
4. Если выбран meta tag, взять значение из `content="..."` и записать:

```env
PUBLIC_GOOGLE_SITE_VERIFICATION=значение-из-content
```

5. Пересобрать portal.
6. В Search Console отправить sitemap:

```text
https://astro.integromat.ru/sitemap-index.xml
```

## Яндекс Вебмастер

1. Открыть Яндекс Вебмастер.
2. Добавить сайт `https://astro.integromat.ru`.
3. Выбрать подтверждение через meta tag, HTML-файл или DNS.
4. Если выбран meta tag, взять значение из `content="..."` и записать:

```env
PUBLIC_YANDEX_SITE_VERIFICATION=значение-из-content
```

5. Пересобрать portal.
6. В Вебмастере отправить sitemap:

```text
https://astro.integromat.ru/sitemap-index.xml
```

## Яндекс Метрика

1. Создать счетчик в Яндекс Метрике.
2. Взять номер счетчика.
3. Записать:

```env
PUBLIC_YANDEX_METRIKA_ID=12345678
```

4. Если нужен Вебвизор:

```env
PUBLIC_YANDEX_METRIKA_WEBVISOR=true
```

5. Пересобрать portal.
6. Открыть сайт и проверить в Метрике, что счетчик видит посещение.

## Google tag или GTM

Для простого GA4/Google Ads можно использовать:

```env
PUBLIC_GOOGLE_TAG_ID=G-XXXXXXXXXX
```

или:

```env
PUBLIC_GOOGLE_TAG_ID=AW-XXXXXXXXXX
```

Для рекламы, ретаргетинга и сложных целей удобнее GTM:

```env
PUBLIC_GOOGLE_TAG_MANAGER_ID=GTM-XXXXXXX
```

Если указаны оба значения, код использует GTM.

## События и цели

Базовое событие уже есть:

```text
cta_try_click
```

Оно срабатывает на CTA в шапке, мобильном меню, футере и sticky CTA.

Для будущих форм и кнопок используйте:

```html
<button data-analytics-event="demo_click" data-analytics-location="hero">
  Записаться на демо
</button>
```

или вручную:

```js
window.chatplusTrack('lead_submit', {
  location: 'demo_form',
  plan: 'business',
});
```

Рекомендуемый набор целей:

| Событие | Что означает |
| --- | --- |
| `cta_try_click` | клик по основной CTA |
| `demo_click` | клик на запись на демо |
| `lead_submit` | успешная отправка формы |
| `phone_click` | клик по телефону |
| `messenger_click` | клик по WhatsApp/Telegram/другому мессенджеру |
| `pricing_view` | просмотр или переход к ценам |

В Яндекс Метрике эти события создаются как JavaScript-цели с теми же именами. В Яндекс Директе затем выбираются цели из Метрики.

## UTM для рекламы

Для Директа и Google Ads договоритесь об одном формате:

```text
utm_source=yandex
utm_medium=cpc
utm_campaign=search_brand
utm_content=ad_group_or_creative
utm_term=keyword
```

Если на сайте появятся формы заявок, нужно сохранять UTM вместе с заявкой. Пока формальный слой отправки заявок не описан, не теряйте UTM в редиректах и CTA.

## Проверка после настройки

После добавления env:

```powershell
npm.cmd run test:contracts
npm.cmd run check:docs-consistency
npm.cmd --prefix portal run build
```

После deploy на сервер:

```bash
curl -I https://astro.integromat.ru/robots.txt
curl -I https://astro.integromat.ru/sitemap-index.xml
curl -s https://astro.integromat.ru/ | grep -E "google-site-verification|yandex-verification|mc.yandex.ru|googletagmanager"
```

В браузере можно проверить:

```js
window.chatplusTrack('test_event', { location: 'manual_check' })
```

Если счетчики подключены, событие уйдет в Метрику и Google/GTM.

## При смене домена

1. Сначала поменять `PUBLIC_SITE_URL`.
2. Пересобрать portal.
3. Проверить canonical, robots и sitemap на новом домене.
4. Добавить новый домен в Google Search Console и Яндекс Вебмастер.
5. Перенести или создать новые verification-коды.
6. Проверить, что счетчики видят новый домен.

Не меняйте счетчики в Strapi-контенте. Это runtime/env-настройка сайта, а не контент страницы.
