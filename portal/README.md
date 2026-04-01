# Portal

Это фронтенд CHATPLUS на `Astro`.

Основная документация по проекту находится не здесь, а в корне репозитория:

- [Главный README](../README.md)
- [Карта документации](../docs/index.md)

## Что лежит в `portal/`

- `src/components/` — шаблоны страниц и shared sections
- `src/layouts/` — глобальный shell
- `src/lib/` — загрузка данных, adapters, registry и helper-логика
- `src/pages/` — Astro-маршруты
- `src/styles/` — глобальные стили
- `public/` — статические ассеты
- `scripts/` — build/check/export-утилиты фронтенда

## Команды

Из папки `portal/`:

```powershell
npm.cmd run dev -- --host 127.0.0.1
npm.cmd run build
npm.cmd run snapshot:github-demo
```

Из корня репозитория:

```powershell
npm.cmd --prefix portal run dev -- --host 127.0.0.1
npm.cmd --prefix portal run build
npm.cmd --prefix portal run snapshot:github-demo
```

## Важно

Не используйте этот файл как главный источник истины по архитектуре проекта. Для этого есть:

- [Архитектура](../docs/architecture.md)
- [Контракты шаблонов](../docs/template-contracts.md)
- [Контракт безопасных изменений](../docs/change-safety.md)
