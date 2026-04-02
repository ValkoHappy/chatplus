# Как добавить страницу

Этот документ разделяет три сценария:

- добавить новую generated page
- добавить новую managed singleton page
- добавить новый template kind
- изменить существующий шаблон
- заменить один шаблон другим

## Сценарий 1. Новая generated page

Примеры:

- новый `solution`
- новый `feature`
- новый `industry`
- новый `integration`
- новый `competitor`

### Шаги

1. Найти нужный source seed в `cms/seed/*.json`.
2. Добавить новую запись.
3. Запустить:

```powershell
npm.cmd run seed-content
```

4. Проверить, что запись появилась в Strapi.
5. Собрать frontend:

```powershell
npm.cmd --prefix portal run build
```

6. Открыть новый route локально.

## Сценарий 2. Новая managed singleton page

Примеры:

- новая resource page
- новая brand page
- новая campaign page

### Шаги

1. Создать запись `landing-page` в Strapi.
2. Выставить:
   - `slug`
   - `template_kind`
   - `content_origin = managed`
3. Заполнить контент.
4. Убедиться, что frontend знает, какой шаблон рендерить для такого slug и template.
5. Собрать frontend:

```powershell
npm.cmd --prefix portal run build
```

6. Проверить страницу локально.

## Сценарий 3. Новый `template_kind`

Это уже инженерная задача.

Нужно:

1. Описать новый template contract.
2. Обновить schema, если нужны новые CMS-owned поля.
3. Обновить import/generator validation.
4. Обновить route-template mapping.
5. Обновить документацию.
6. Только потом внедрять шаблон.

## Сценарий 4. Новый CMS-owned блок

Это не “версточная мелочь”, а изменение контракта.

### Шаги

1. Описать block contract в docs:
   - `block_type`
   - allowed `template_kind`
   - ownership
   - required fields
   - optional fields
   - fallback behavior
2. Если блок идет из CMS, обновить schema.
3. Обновить generator/import validation.
4. Обновить adapter layer.
5. Только после этого рендерить блок во frontend.
6. Прогнать build и representative routes.

## Сценарий 5. Изменить существующий шаблон

Это самый частый реальный сценарий: шаблон уже есть, но нужно поменять его верстку, порядок секций, карточки, CTA или поведение на tablet/mobile.

### Шаги

1. Определить, что именно меняется:
   - только layout/styling
   - contract текущего блока
   - required fields
   - ownership блока
2. Проверить контракт шаблона в `docs/template-contracts.md`.
3. Если меняется только визуал, работать можно во frontend без schema changes.
4. Если меняется CMS-owned блок или набор его полей:
   - обновить docs
   - обновить schema при необходимости
   - обновить generator/import validation
   - обновить adapter layer
5. Проверить representative routes этого template family.
6. Прогнать build:

```powershell
npm.cmd --prefix portal run build
```

### Важно

- Нельзя хардкодить новый пользовательский текст в шаблон, если этот текст должен редактироваться в CMS.
- Нельзя менять template-owned блок так, чтобы он начинал ждать CMS-поля без обновления контракта.
- Если правка затрагивает секции, CTA, FAQ, hero или side-panels, нужно проверить desktop, tablet и mobile.

## Сценарий 6. Заменить один шаблон другим

Это уже не просто версточная правка, а изменение route/template contract.

Примеры:

- страница раньше рендерилась как `resource-hub`, а должна стать `brand-content`
- singleton page переводится на новый `template_kind`
- старый шаблон выводится из эксплуатации

### Шаги

1. Проверить ownership маршрута:
   - `managed` или `generated`
2. Проверить, поддерживает ли новый шаблон существующие поля страницы.
3. Если не поддерживает:
   - описать новый contract
   - обновить schema
   - обновить generator/import validation
   - обновить adapters
4. Обновить route-template mapping во frontend.
5. Если это `managed` singleton:
   - обновить `template_kind` в Strapi
   - убедиться, что `content_origin` не меняется случайно
6. Если это `generated` family:
   - обновить source seed/generator contract
   - не делать такой перевод вручную только в админке
7. Обновить документацию:
   - `template-contracts.md`
   - `route-ownership-matrix.md`
   - при необходимости `docs/index.md`
8. Прогнать build и representative routes.

### Важно

- Замена шаблона без обновления docs и adapters считается unsafe change.
- Нельзя просто переключить route на другой `.astro`, если новый шаблон ждет другой набор полей.
- Если старый шаблон выводится из эксплуатации, это надо явно зафиксировать в docs.

## Что проверить после добавления страницы

- страница открывается локально
- прошел `npm.cmd --prefix portal run build`
- новый маршрут соответствует ownership-модели
- страница не нарушает `generated` / `managed` contract
- если добавлялся новый блок, его contract описан в docs и валидируется
- если менялся или заменялся шаблон, route-template mapping и docs обновлены синхронно
