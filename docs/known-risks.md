# Known Risks CHATPLUS

Этот файл фиксирует не баги “на потом”, а текущие ограничения и осознанные риски проекта, чтобы их не путали с неожиданными поломками.

## 1. Local Strapi — это не production contour

Сейчас основной рабочий режим проекта — demo-mode.

Это значит:

- Strapi может быть локальным
- frontend собирается вручную
- demo публикуется snapshot-ом на GitHub Pages

Риск:

- проект еще зависит от человека, который знает текущий publish flow

## 2. GitHub Pages — это витрина, а не live CMS

На GitHub Pages живет только статический frontend.

Там нет:

- Strapi admin
- live Node backend
- CMS execution layer

Риск:

- если это не понимать, можно ошибочно ожидать “редактирование контента прямо на Pages”

## 3. Safe fallback-и все еще существуют

В adapters и templates все еще есть безопасные fallback-и, потому что они нужны для устойчивости imported/catalog family.

Это не баг, если:

- fallback derived из entity data
- fallback не превращается в скрытый marketing copy

Риск:

- новый инженер может попытаться “добить до нуля” все fallback-и и сломать устойчивость build

## 4. Block system пока contract-first, но не fully dynamic

Сейчас проект не использует полноценную универсальную dynamic block-system.

Это означает:

- новый CMS-owned block требует docs + schema + validation + adapters
- нельзя просто сохранить freeform JSON и надеяться, что frontend “как-нибудь поймет”

Риск:

- попытка быстро добавить новый блок “просто в CMS” приведет к расхождению contracts

## 5. Programmatic family нельзя вести как ручной контент

`solution`, `feature`, `industry`, `integration`, `competitor` и пересечения остаются importer-driven catalog family.

Риск:

- если начать заводить их руками в Strapi, source-of-truth расползется

## 6. Замена шаблона — это часто schema-level change

Нельзя считать замену одного `template_kind` другим просто “переключением компонента”.

Риск:

- route начнет ждать другой набор полей
- docs, adapters и validation разъедутся

## 7. Ручной visual QA все еще обязателен

Даже если:

- build зеленый
- checks зеленые
- import прошел

это не гарантирует, что:

- CTA не съехали
- footer не развалился
- hero не потерял контраст
- tablet/mobile выглядят корректно

Риск:

- полагаться только на build как на единственный критерий готовности

## 8. Документация сильная, но ее надо поддерживать живой

Docs уже покрывают проект хорошо, но только пока их обновляют вместе с кодом.

Риск:

- если новый шаблон, блок или ownership change не отражен в docs, handoff снова станет неоднозначным

## 9. Что считается нормой, а не дефектом

Следующие вещи в текущей архитектуре являются осознанным решением:

- гибрид `imported + managed + settings`
- materialized copy в Strapi
- fallback-и для imported/catalog family
- demo-mode через GitHub Pages

Это не надо “чинить” просто потому, что система не выглядит fully headless или fully manual.

## 10. Следующий большой этап

Следующий уровень зрелости проекта — не переделка шаблонов, а:

- hosted Strapi
- CI/CD from live CMS
- production deploy contour
- operational ownership и backup strategy

## 11. Первый CI gate уже есть, но он не убирает secret dependency

PR workflow `CI` улучшает защиту до merge, но не снимает текущее ограничение:

- contract tests и docs/code consistency уже ловят часть regressions без live Strapi
- frontend build и `seed-content` smoke зависят от `STRAPI_URL` и `STRAPI_TOKEN`
- для fork PR GitHub Secrets недоступны

Риск:

- внешние PR не получают полноценный runtime-check
- текущий CI по-прежнему частично зависит от live CMS access

## 12. Canonical `template_kind` vs public names

Внутренний контракт теперь унифицирован на canonical values:

- `resource_hub`
- `brand_content`

При этом docs и route registry по-прежнему используют public names:

- `resource-hub`
- `brand-content`

Это безопасно только пока mapping централизован в `config/template-kinds.mjs`.
