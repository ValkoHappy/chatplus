# Локальный чек-лист готовности

Этот чек-лист отвечает на вопрос: можно ли переходить к серверному этапу.

## Что должно быть готово локально

- Все публичные route материализуются в `page_v2`.
- Старые страницы сохраняют свои family-макеты.
- Новые страницы могут создаваться через Strapi без нового `.astro` файла.
- Legacy fallback остается рабочим.
- Cutover защищен safety gate.
- Rollback возможен через `migration_ready = false` или `unpublish`.
- Документация не противоречит коду.

## Обязательные команды

```powershell
npm.cmd run test:contracts
npm.cmd run check:docs-consistency
npm.cmd --prefix cms run build
npm.cmd --prefix portal run build
npm.cmd run page-v2:data-quality -- --problems --json
npm.cmd run page-v2:parity-report -- --json
npm.cmd run page-v2:rendered-coverage -- --problems --json
npm.cmd run page-v2:local:layout-smoke -- --json
```

`page-v2:local:layout-smoke` проверяет уже собранный `portal/dist` в read-only режиме: он не пишет в Strapi и не откатывает approved routes после себя. Если нужно сделать smoke вместе со свежей пересборкой, используйте `npm.cmd run page-v2:local:layout-smoke:build -- --json`.

## Как читать результаты

### `test:contracts`

Должен завершиться без падений. Он проверяет схемы, materializer, bridge, safety gate, AI draft-flow и rollback.

### `check:docs-consistency`

Должен показать:

```text
docs-consistency OK
```

### `cms build`

Проверяет, что Strapi-схемы и admin panel собираются.

### `portal build`

Проверяет, что Astro собирает сайт.

Хороший признак:

- build завершился успешно;
- public pages собраны;
- internal link graph без orphan pages.

### `page-v2:data-quality`

Хороший результат:

```json
{
  "withIssues": 0,
  "issues": 0,
  "readyWithIssues": 0
}
```

### `page-v2:parity-report`

Хороший результат:

```json
{
  "notReady": 0,
  "needsWork": 0,
  "withMissingSeo": 0,
  "withMissingRequiredBlocks": 0,
  "withBridgeLosses": 0
}
```

### `page-v2:rendered-coverage`

Хороший результат:

```json
{
  "notVisible": 0,
  "missingHtml": 0,
  "withMissingMarkers": 0,
  "missingMarkers": 0
}
```

## Ручной smoke

После build откройте минимум:

- `/`
- `/features`
- `/pricing`
- `/partnership`
- `/solutions`
- `/solutions/tenders`
- `/channels/email/amocrm`
- `/compare/respond-io`
- `/vs/respond-io`
- `/site-map`

Проверьте:

- страница открывается;
- hero на месте;
- таблицы не пустые;
- FAQ есть там, где нужен;
- CTA есть;
- footer и header не развалились;
- старый family-макет не заменился generic shell.

## Что не считается локальным хвостом

Эти задачи относятся к следующему этапу:

- deploy на VPS;
- live materialize drafts;
- live route-by-route cutover;
- live browser smoke;
- ротация секретов;
- удаление legacy wrappers.

## Если чек-лист красный

Не идем на сервер. Сначала исправляем локально.

Самый полезный порядок:

1. `page-v2:data-quality`.
2. `page-v2:parity-report`.
3. `page-v2:rendered-coverage`.
4. `portal build`.
5. browser smoke.
