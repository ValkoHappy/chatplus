# Миграция публичных маршрутов в page_v2

Этот документ объясняет, как переносить старые страницы так, чтобы не потерять макет и контент.

## Главное правило

Мы не заменяем старый шаблон вслепую. Мы переносим контент в `page_v2`, но старый renderer family остается fallback и страховкой.

Маршрут переключается только после проверки.

## Как работает route precedence

```text
Если page_v2 опубликована
и editorial_status = approved
и migration_ready = true
и parity_status = approved
то сайт берет контент из page_v2.

Иначе сайт показывает старый legacy fallback.
```

Обычный `Publish` не равен cutover.

## Какие маршруты входят в перенос

### Managed routes

- `/`
- `/pricing`
- `/partnership`
- `/docs`
- `/help`
- `/academy`
- `/blog`
- `/status`
- `/media`
- `/team`
- `/conversation`
- `/tv`
- `/promo`
- `/prozorro`
- `/demo`
- `/solutions/tenders`

### Directory roots

- `/channels`
- `/industries`
- `/integrations`
- `/solutions`
- `/features`
- `/for`
- `/compare`

### Detail pages

- `/channels/[slug]`
- `/industries/[slug]`
- `/integrations/[slug]`
- `/solutions/[slug]`
- `/features/[slug]`
- `/for/[slug]`
- `/compare/[slug]`
- `/vs/[slug]`

### Intersection pages

- `/channels/[channel]/[industry]`
- `/channels/[channel]/[integration]`
- `/industries/[industry]/[solution]`
- `/integrations/[integration]/[solution]`
- `/for/[businessType]/[industry]`

### System pages

- `/site-map`
- `/features/ai-calendar`

## Команды миграции

Посмотреть отчет:

```powershell
npm.cmd run page-v2:materialize:report
```

Создать или обновить draft одного route:

```powershell
npm.cmd run page-v2:materialize -- --route=/promo --apply
```

Опубликовать запись, но не включать публичный cutover:

```powershell
npm.cmd run page-v2:materialize -- --route=/promo --apply --publish
```

Разрешить cutover после проверки:

```powershell
npm.cmd run page-v2:materialize -- --route=/promo --approve
```

Вернуть route на старый fallback:

```powershell
npm.cmd run page-v2:materialize -- --route=/promo --mark-not-ready
```

Снять публикацию:

```powershell
npm.cmd run page-v2:materialize -- --route=/promo --unpublish
```

## Что проверять перед approve

Для каждой страницы:

- hero совпадает по смыслу;
- CTA на месте;
- основные блоки не потеряны;
- таблицы заполнены;
- FAQ заполнен;
- internal links есть;
- breadcrumbs корректны;
- sitemap и nav работают как нужно;
- страница не стала generic shell вместо своего family-макета;
- mobile view не разваливается.

## Автоматические отчеты

Проверка данных в Strapi:

```powershell
npm.cmd run page-v2:data-quality -- --problems --json
```

Проверка parity и bridge:

```powershell
npm.cmd run page-v2:parity-report -- --json
```

Проверка фактически собранного HTML:

```powershell
npm.cmd run page-v2:rendered-coverage -- --problems --json
```

Если в `rows` пусто, отчет не нашел проблем.

## Что делать, если отчет нашел проблему

### Не хватает блока

Добавьте правильный блок в `sections`. Не заменяйте уникальный старый паттерн неподходящим generic-блоком.

### Блок есть, но не попал в HTML

Проверьте bridge `mapPageV2ToLegacyPage`. Скорее всего поле не мапится в старый renderer.

### Страница выглядит плохо

Выполните:

```powershell
npm.cmd run page-v2:materialize -- --route=/problem-route --mark-not-ready
```

И исправляйте без давления: публичный сайт снова будет на fallback.

## Почему старые шаблоны пока не удаляем

Пока идет перенос, старые шаблоны нужны как:

- fallback;
- эталон макета;
- быстрый rollback без emergency code deploy.

Удаление legacy wrappers — отдельный будущий этап после live cutover и проверки.
