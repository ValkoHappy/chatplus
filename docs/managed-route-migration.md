# Миграция managed-маршрутов в page-first слой

Этот документ нужен для финального перехода от legacy managed routes к новому page-first слою без поломки старых шаблонов.

Главный принцип:

- legacy wrappers остаются на месте
- route переводится по одному
- published `page_v2` выигрывает у legacy source только после parity smoke
- rollback делается быстро: через снятие published state у `page_v2`

## Что уже сделано в коде

В проекте уже есть:

- safe bridge для legacy managed routes
- block-based renderer для `page_v2`
- migration registry по всем волнам
- CLI-скрипт для controlled migration route-by-route

Команды:

```powershell
npm run page-v2:migrate:managed:report
npm run page-v2:migrate:managed -- --route=/promo
npm run page-v2:migrate:managed -- --route=/promo --apply --publish
npm run page-v2:migrate:managed -- --route=/promo --unpublish
```

## Волны миграции

### Волна 1

- `/promo`
- `/prozorro`
- `/media`
- `/team`
- `/conversation`
- `/tv`
- `/docs`
- `/help`
- `/academy`
- `/blog`
- `/status`

### Волна 2

- `/pricing`
- `/partnership`

### Волна 3

- `/`
- `/demo`
- `/solutions/tenders`

## Безопасный сценарий миграции одного route

1. Снять baseline legacy route в браузере.
2. Проверить registry:

```powershell
npm run page-v2:migrate:managed -- --route=/promo
```

3. Убедиться, что legacy source возвращает ожидаемые данные в `Strapi`.
4. Создать или обновить `page_v2`:

```powershell
npm run page-v2:migrate:managed -- --route=/promo --apply
```

5. Проверить draft в `Strapi`.
6. Если parity выглядит корректной, опубликовать route:

```powershell
npm run page-v2:migrate:managed -- --route=/promo --apply --publish
```

7. Проверить, что route реально рендерится через `page_v2`, а не через legacy fallback.
8. Проверить nav, sitemap, breadcrumbs и internal links.

## Откат

Если migrated route ведёт себя не так, как ожидалось, откат делается без emergency code rollback:

```powershell
npm run page-v2:migrate:managed -- --route=/promo --unpublish
```

После этого legacy wrapper снова начнёт обслуживать route.

## Что проверять для parity

### Для всех routes

- route открывается без 404 и без пустого экрана
- ключевой hero сохранён
- CTA не потеряны
- nav/footer/mobile nav корректны
- sitemap корректен
- breadcrumbs корректны
- internal links не сломаны

### Для `campaign`

- hero
- proof / value sections
- steps
- FAQ
- final CTA

### Для `brand`

- editorial hero
- card/story sections
- final CTA
- место страницы в footer и sitemap

### Для `resource`

- hub intro
- content cards
- section grouping
- discoverability через nav/footer/sitemap

### Для `pricing`

- pricing plans
- proof cards
- hero panel
- comparison table
- before/after
- FAQ

### Для `partnership`

- ROI pattern
- comparison logic
- CTA structure

### Для `home`, `demo`, `tenders`

- плотный hero composition
- mixed section density
- conversion path
- breadcrumbs и sitemap, если применимо

## Решение по strict parity

Чтобы не оставлять двусмысленность между ранним архитектурным документом и текущей реализацией, фиксируем:

### `page_blueprint`

Отдельный CMS content type для `page_blueprint` в этом этапе не вводится.

Осознанное решение:

- blueprints остаются в code registry
- источник истины по ним — `config/page-v2-blueprints.mjs`
- редактор работает с уже готовыми допустимыми block combinations, а не настраивает blueprints руками в CMS

Почему так:

- это уменьшает риск расползания contract logic по двум системам
- даёт стабильный migration bridge
- не мешает позже вынести blueprints в CMS, если это действительно понадобится

### `page_version`

Отдельный `page_version` content type в этом этапе тоже не вводится.

Осознанное решение:

- versioning пока закрывается через историю `Strapi`, `draft/publish` discipline и route-level rollback
- быстрый откат migrated route делается через `unpublish`, а не через отдельную version graph модель

Почему так:

- сейчас критичнее безопасно завершить migration managed routes
- отдельная версияция — это уже следующий слой зрелости, а не blocker для manual-first architecture

## Что остаётся legacy после завершения этапа

Даже после успешной миграции:

- legacy wrappers остаются как compatibility layer
- imported catalog и SEO families не переводятся в `page_v2`
- `/site-map` остаётся utility route

Это нормально. Cleanup legacy слоя — отдельный будущий этап, а не часть безопасной migration.

## Что делать следующим production-этапом

Когда придёт время реального deploy и live migration:

- сначала прогоните readiness-check:

```powershell
npm run page-v2:live:ready
```

- потом переходите к controlled migration wave-by-wave

Подробный handoff:

- [manual-first-production-handoff.md](manual-first-production-handoff.md)

