# Как добавить страницу

Этот документ разделяет три сценария:

- добавить новую generated page
- добавить новую managed singleton page
- добавить новый template kind

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

## Что проверить после добавления страницы

- страница открывается локально
- прошел `npm.cmd --prefix portal run build`
- новый маршрут соответствует ownership-модели
- страница не нарушает `generated` / `managed` contract
