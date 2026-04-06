# Контентный workflow CHATPLUS

## Общая схема

Текущий pipeline выглядит так:

`cms/seed/*.json -> importer -> Strapi -> Astro build -> static deploy`

Ключевой смысл:

- source data остается в git
- live-контент живет в `Strapi`
- сайт собирается из `Strapi`

## Два рабочих сценария

### 1. Managed content

Используется для:

- landing pages
- singleton pages
- global settings

Сценарий:

1. редактор меняет запись в `Strapi`
2. нажимает `Publish`
3. webhook уходит в relay
4. relay триггерит `repository_dispatch`
5. GitHub Actions собирает сайт и выкатывает новую статику

### 2. Imported content

Используется для:

- catalog/SEO families
- comparison records
- типовых programmatic страниц

Сценарий:

1. обновляется source data в `cms/seed/*.json`
2. запускается importer
3. importer делает `plan` или `apply`
4. записи обновляются в `Strapi`
5. дальше идет publish/rebuild flow

## Importer команды

### Dry run

```powershell
npm.cmd run seed-content:plan
```

Показывает, что будет создано, обновлено или пропущено.

### Обычный sync

```powershell
npm.cmd run seed-content
```

### Force sync

```powershell
npm.cmd run seed-content:force
```

Используется только когда нужно сознательно перезаписать editor-owned поля source-данными.

### Report

```powershell
npm.cmd run seed-content:report
```

Показывает текущее состояние imported-записей и следы последних sync-циклов.

## Правило безопасного sync

- `managed` записи importer не трогает
- `imported` записи обновляются только по `system-owned` полям
- если редактор вручную менял поле, оно попадает в `manual_override_fields`
- повторный import не должен затирать такие поля

## Что считается концом контентного изменения

Изменение считается завершенным, когда:

- запись сохранена в `Strapi`
- нужный publish/sync выполнен
- `npm.cmd run test:contracts` зеленый
- `npm.cmd run check:docs-consistency` зеленый
- `npm.cmd --prefix portal run build` зеленый
- representative routes проверены руками

## Связанные документы

- [CMS-модель](cms-model.md)
- [Политика импорта](import-policy.md)
- [Гайд оператора](operator-guide.md)
- [Release flow](release-flow.md)
