# Инвентаризация общих блоков

Этот файл фиксирует, какие повторяющиеся блоки уже вынесены в общий primitive-слой, а какие пока нельзя трогать без отдельной parity-проверки.

| Блок | Где используется сейчас | Общий primitive | Статус | Representative route |
| --- | --- | --- | --- | --- |
| FAQ | `FaqSection`, page-v2 `faq`, legacy families через `FaqSection` | `BlockFaq` | Вынесен в общий primitive | `/pricing`, `/promo`, `/docs` |
| Internal links | `InternalLinksSection`, page-v2 `internal-links` | `BlockLinkGrid` | Вынесен в общий primitive | `/channels/email/amocrm`, `/compare/respond-io` |
| Related links | page-v2 `related-links` | `BlockLinkGrid` | Вынесен в общий primitive | native page-v2 route |
| Final CTA | page-v2 `final-cta` | `BlockFinalCta` | Вынесен в общий primitive для page-v2 | native page-v2 route |
| Comparison table | page-v2 `comparison-table` | `BlockTable` | Вынесен в общий primitive для page-v2 | `/compare/respond-io` |
| Simple cards | разные legacy cards и page-v2 cards | `BlockCard`, `BlockGrid` | Primitive создан, массовая замена не начата | `/media`, `/docs` |
| Hero | home/campaign/pricing/structured families | пока нет общего cutover | Не трогать в первой волне | `/`, `/pricing` |
| Pricing plans | pricing family, page-v2 `pricing-plans` | пока family-specific | Не трогать в первой волне | `/pricing` |
| Tenders panels | tenders family | пока family-specific | Не трогать в первой волне | `/solutions/tenders` |
| Structured detail/intersection | catalog/detail/intersection pages | пока family-specific | Не трогать в первой волне | `/channels/email/amocrm` |

## Правило изменения

Новый общий блок добавляется только через полный путь:

1. Strapi schema/component.
2. Нормализация данных.
3. Renderer или adapter.
4. Primitive в `portal/src/components/blocks`.
5. Общий CSS в `portal/src/styles/block-primitives.css`.
6. Контрактный тест.
7. Browser smoke на representative route.
8. Обновление документации.

Если старый блок имеет уникальный макет, его нельзя “упростить” до generic block. Сначала создаётся preset/variant, затем проверяется визуальная parity.
