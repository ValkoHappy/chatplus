import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(ROOT, relativePath), 'utf8'));
}

function writeJson(relativePath, value) {
  writeFileSync(join(ROOT, relativePath), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function applyDescriptions(relativePath, infoDescription, attributeDescriptions) {
  const schema = readJson(relativePath);
  schema.info = schema.info ?? {};
  schema.info.description = infoDescription;

  for (const [name, description] of Object.entries(attributeDescriptions)) {
    if (schema.attributes?.[name]) {
      schema.attributes[name].description = description;
    }
  }

  writeJson(relativePath, schema);
}

applyDescriptions(
  'cms/src/api/page-v2/content-types/page-v2/schema.json',
  'Главная запись страницы. Здесь задаются URL, SEO, навигация, блоки и статус миграции. Для старых URL включайте migration_ready только после проверки макета.',
  {
    slug: 'Внутренний ключ страницы. Обычно создаётся из title. Пример: pricing или compare-respond-io.',
    route_path: 'Публичный URL страницы на сайте. Всегда начинается с /. Примеры: /pricing, /promo, /compare/respond-io, /test-page.',
    locale: 'Язык страницы. Сейчас для основного сайта обычно ru.',
    title: 'Внутреннее название записи в Strapi. Помогает найти страницу редактору. Пример: Цены Chat Plus.',
    page_kind: 'Тип страницы. landing - обычный лендинг, campaign - промо, brand - компания/медиа, resource - docs/help/blog, comparison - сравнение, directory - каталог, entity_detail/entity_intersection - SEO-страницы каталога, system - служебная.',
    template_variant: 'Вариант отображения страницы. Для обычных страниц чаще default/editorial/showcase. Для каталогов directory, для сравнений comparison, для карты сайта sitemap.',
    generation_mode: 'Как создана страница: manual - руками, ai_assisted - AI помогал, ai_generated - AI создал черновик.',
    source_mode: 'Источник страницы: managed - ручная, generated - сгенерирована из сущностей, hybrid - была сгенерирована, но потом редактировалась человеком.',
    blueprint: 'Blueprint задаёт рекомендуемый набор блоков и ограничения. Для новой страницы выберите подходящий тип: campaign, brand, resource и т.д.',
    entity_refs: 'Связанные сущности каталога. Используйте, если страница относится к каналам, отраслям, интеграциям, решениям, функциям или конкурентам.',
    sections: 'Основной конструктор страницы. Добавляйте блоки в том порядке, в котором они должны идти на сайте: hero, cards, FAQ, CTA и другие.',
    seo_title: 'SEO title для браузера и поисковиков. Заполните перед публикацией.',
    seo_description: 'SEO description. Коротко объясните пользу страницы для поисковика и пользователя.',
    canonical: 'Canonical URL, если нужен. Обычно совпадает с route_path на основном домене.',
    robots: 'Правила индексации. Обычно index,follow. Для черновых/служебных страниц можно noindex,nofollow.',
    og_image: 'Картинка для соцсетей и превью ссылок.',
    hreflang_policy: 'Правило hreflang для мультиязычности. Если не уверены, оставьте пустым.',
    show_in_header: 'Показывать страницу в верхнем меню. Включайте только для важных публичных разделов.',
    show_in_footer: 'Показывать страницу в футере. Удобно для разделов, ресурсов и служебных страниц.',
    show_in_sitemap: 'Добавлять страницу в sitemap. Для публичных страниц обычно включено.',
    nav_group: 'Группа навигации. Примеры: product, catalogs, resources, company, special.',
    nav_label: 'Название ссылки в меню. Пример: Цены, Документация, Сравнения.',
    nav_description: 'Короткое пояснение для расширенного меню или футера.',
    nav_order: 'Порядок внутри группы. Чем меньше число, тем выше ссылка.',
    parent_page: 'Родительская страница для хлебных крошек и иерархии. Например, /compare для /compare/respond-io.',
    breadcrumbs: 'Ручные хлебные крошки, если автоматических от parent_page недостаточно.',
    internal_links: 'Внутренние ссылки страницы. Используйте для блока “Что ещё посмотреть” и перелинковки.',
    editorial_status: 'Редакторский статус: draft, review, approved, archived. Для публичного cutover нужен approved.',
    owner: 'Ответственный за страницу. Пример: content, marketing, Alex.',
    reviewer: 'Кто проверяет страницу перед публикацией.',
    generation_prompt: 'Исходный prompt, если страницу создавали или дорабатывали через AI.',
    ai_metadata: 'Техническая информация AI: выбранные блоки, отчёт генерации, ограничения.',
    human_review_required: 'Требовать ручную проверку. Для AI-страниц обычно должно быть включено.',
    migration_ready: 'Главный safety-переключатель. Пока false, старый URL продолжит рендериться legacy-шаблоном даже при published Page.',
    parity_status: 'Статус совпадения со старым макетом: unchecked, needs_work, approved, failed. Для замены legacy нужен approved.',
    legacy_template_family: 'Семейство старого шаблона: home, pricing, brand, resource, comparison, directory, structured и т.д.',
    legacy_layout_signature: 'Технический снимок ожидаемого старого макета. Нужен для parity-report.',
    parity_notes: 'Заметки проверки: что совпало, что нужно доделать, какие блоки нельзя потерять.',
  },
);

applyDescriptions(
  'cms/src/api/generation-job/content-types/generation-job/schema.json',
  'Задание для AI. Создаёт или обновляет черновик Page, но не публикует страницу само.',
  {
    title: 'Понятное название задания. Пример: AI черновик страницы про WhatsApp для салонов.',
    job_type: 'manual_request - запустить по запросу редактора. scheduled - задание по расписанию.',
    status: 'Статус выполнения: queued - ждёт, running - в работе, draft_ready - черновик готов, failed - ошибка.',
    target_blueprint: 'Какой тип страницы сделать. Сейчас безопасные варианты: campaign, brand, resource. Пример: campaign.',
    block_strategy: 'Как AI выбирает блоки: auto - сам по задаче, blueprint_default - строго по blueprint, custom - использовать target_blocks.',
    target_blocks: 'Список нужных блоков для custom-режима. Пример JSON: ["hero", "cards-grid", "faq", "final-cta"]. Неподдержанные блоки будут отклонены.',
    request_prompt: 'Задание для AI. Опишите тему, аудиторию, цель страницы, нужные CTA, SEO и ограничения.',
    requested_by: 'Кто создал задание. Пример: Alex или content-manager.',
    target_page: 'Если AI должен доработать существующую страницу, выберите её здесь. Для новой страницы оставьте пустым.',
    target_channels: 'Каналы для контекста генерации. Пример: WhatsApp, Telegram.',
    target_industries: 'Отрасли для контекста. Пример: медицина, ритейл.',
    target_integrations: 'Интеграции для контекста. Пример: AmoCRM, Bitrix24.',
    target_solutions: 'Решения для контекста. Пример: продажи, поддержка.',
    target_features: 'Функции для контекста. Пример: AI-ответы, аналитика.',
    target_business_types: 'Типы бизнеса для контекста. Пример: агентства, салоны.',
    target_competitors: 'Конкуренты для сравнений. Для AI это важно, если генерируется comparison-страница.',
    run_report: 'Отчёт после запуска: что создано, какие блоки выбрал AI, ошибки, ссылка на черновик.',
  },
);

applyDescriptions(
  'cms/src/api/page-blueprint/content-types/page-blueprint/schema.json',
  'Blueprint страницы. Это шаблон-правило: какие блоки обязательны, какие разрешены и какой стартовый набор дать редактору или AI.',
  {
    blueprint_id: 'Уникальный ключ blueprint. Примеры: campaign, brand, resource, comparison.',
    page_kind: 'Для какого типа страниц используется blueprint.',
    template_variant: 'Рекомендуемый вариант отображения для страниц этого blueprint.',
    required_blocks: 'JSON-массив обязательных блоков. Пример: ["hero", "faq", "final-cta"].',
    allowed_blocks: 'JSON-массив разрешённых блоков. AI и редактор не должны выходить за этот список без решения разработчика.',
    default_sections: 'Стартовый набор секций для новой страницы. Можно использовать как пример заполнения.',
    description: 'Пояснение для редакторов: когда использовать этот blueprint и какие страницы он покрывает.',
    is_active: 'Если выключить, blueprint не должен использоваться для новых страниц и AI-заданий.',
  },
);

const componentDescriptions = {
  'before-after.json': [
    'Блок “до/после” или ROI. Подходит для сравнения старого процесса и результата после Chat Plus.',
    {
      title: 'Заголовок блока.',
      intro: 'Короткое вступление перед сравнением.',
      before_title: 'Заголовок левой колонки. Пример: Сейчас.',
      after_title: 'Заголовок правой колонки. Пример: После Chat Plus.',
      before_items: 'Список проблем или текущих ограничений.',
      after_items: 'Список улучшений после внедрения.',
      quote: 'Короткая цитата или вывод под блоком.',
      quote_author: 'Автор цитаты, если нужен.',
    },
  ],
  'card-item.json': [
    'Карточка для сеток, hero-панелей и ссылок.',
    {
      eyebrow: 'Маленькая подпись над заголовком.',
      title: 'Заголовок карточки.',
      text: 'Основной текст карточки.',
      secondary_text: 'Дополнительный текст, если нужен второй уровень пояснения.',
      icon: 'Ключ иконки. Пример: chat, crm, chart, play.',
      href: 'Ссылка карточки. Обычно внутренний URL вида /docs.',
      url: 'Альтернативное поле ссылки для старых данных. Если есть выбор, используйте href.',
      cta_label: 'Текст действия. Пример: Смотреть раздел.',
      badges: 'JSON со значками/метками, если макет их поддерживает.',
    },
  ],
  'cards-grid.json': [
    'Сетка карточек. Используется для преимуществ, проблем, сценариев, ресурсов и редакционных подборок.',
    {
      variant: 'Вариант карточек: problems, use_cases, pillars, editorial, resources, benefits.',
      title: 'Заголовок секции.',
      intro: 'Короткое описание секции.',
      items: 'Карточки внутри сетки. Добавляйте по одной карточке на смысловой пункт.',
    },
  ],
  'comparison-row.json': [
    'Одна строка таблицы сравнения.',
    {
      parameter: 'Что сравниваем. Пример: Стоимость масштабирования.',
      option_one: 'Значение в первой колонке.',
      option_two: 'Значение во второй колонке.',
      option_highlight: 'Вывод или подсветка преимущества, если нужна.',
    },
  ],
  'comparison-table.json': [
    'Таблица сравнения тарифов, решений, конкурентов или подходов.',
    {
      title: 'Заголовок таблицы.',
      intro: 'Короткое пояснение перед таблицей.',
      option_one_label: 'Название первой колонки. Пример: Без Chat Plus.',
      option_two_label: 'Название второй колонки. Пример: С Chat Plus.',
      option_highlight_label: 'Название колонки вывода/подсветки, если используется.',
      rows: 'Строки сравнения.',
    },
  ],
  'faq-item.json': [
    'Один вопрос и ответ.',
    {
      question: 'Вопрос, который увидит пользователь.',
      answer: 'Ответ. Пишите коротко и конкретно.',
    },
  ],
  'faq.json': [
    'Блок частых вопросов.',
    {
      title: 'Заголовок блока. Пример: Частые вопросы.',
      intro: 'Дополнительное пояснение перед вопросами, если нужно.',
      items: 'Список вопросов и ответов.',
    },
  ],
  'feature-list.json': [
    'Список возможностей или преимуществ.',
    {
      title: 'Заголовок списка.',
      intro: 'Короткое описание перед списком.',
      items: 'Пункты списка. Можно использовать карточки с иконками.',
    },
  ],
  'final-cta.json': [
    'Финальный CTA-блок внизу страницы.',
    {
      title: 'Главный призыв. Пример: Посмотрите реальную модель стоимости Chat Plus.',
      text: 'Пояснение под заголовком.',
      primary_label: 'Текст главной кнопки. Пример: Попробовать бесплатно.',
      primary_url: 'Ссылка главной кнопки. Пример: /demo.',
      secondary_label: 'Текст второй кнопки.',
      secondary_url: 'Ссылка второй кнопки.',
    },
  ],
  'hero.json': [
    'Первый экран страницы: заголовок, подзаголовок, CTA и важные факты.',
    {
      variant: 'Вариант hero: default - обычный, showcase - большой визуальный, panel - с правой панелью, editorial - текстовый.',
      eyebrow: 'Маленькая подпись над заголовком. Пример: PROMO или Сравнение платформ.',
      title: 'Главный заголовок первого экрана. Самый важный текст страницы.',
      subtitle: 'Подзаголовок: 1-2 предложения, объясняющие пользу страницы.',
      primary_label: 'Текст главной кнопки. Пример: Попробовать бесплатно.',
      primary_url: 'Ссылка главной кнопки. Пример: /demo.',
      secondary_label: 'Текст второй кнопки. Пример: Записаться на демо.',
      secondary_url: 'Ссылка второй кнопки. Пример: /pricing или /demo.',
      context_title: 'Заголовок дополнительной панели/контекста, если нужен.',
      context_text: 'Текст дополнительной панели/контекста.',
      panel_items: 'Карточки внутри hero-панели: факты, сценарии, короткие преимущества.',
      trust_facts: 'Список коротких фактов JSON-массивом. Пример: ["AI 24/7", "Подключение за 15 минут"].',
    },
  ],
  'internal-links.json': [
    'Блок внутренних ссылок “Что ещё посмотреть”.',
    {
      eyebrow: 'Маленькая подпись над блоком. Пример: По теме страницы.',
      title: 'Заголовок блока.',
      intro: 'Короткое пояснение, почему эти ссылки полезны.',
      links: 'Ссылки на другие страницы сайта.',
    },
  ],
  'link-item.json': [
    'Одна внутренняя ссылка.',
    {
      label: 'Название ссылки.',
      href: 'URL ссылки. Пример: /pricing.',
      description: 'Короткое описание ссылки.',
    },
  ],
  'pricing-plan-item.json': [
    'Одна карточка тарифа или пакета.',
    {
      title: 'Название тарифа.',
      label: 'Метка тарифа. Пример: Популярный.',
      price: 'Цена или формулировка стоимости.',
      period: 'Период оплаты. Пример: в месяц.',
      note: 'Короткая сноска под ценой.',
      text: 'Описание тарифа.',
      cta_label: 'Текст кнопки тарифа.',
      cta_url: 'Ссылка кнопки тарифа.',
      icon: 'Иконка тарифа, если нужна.',
      kicker: 'Маленький акцент над названием.',
      accent: 'Включите, если тариф нужно визуально выделить.',
      features: 'JSON-массив возможностей тарифа.',
    },
  ],
  'pricing-plans.json': [
    'Блок тарифов или пакетов.',
    {
      title: 'Заголовок блока тарифов.',
      intro: 'Короткое пояснение перед тарифами.',
      variant: 'Вариант отображения тарифов.',
      items: 'Карточки тарифов.',
    },
  ],
  'proof-stats.json': [
    'Блок доказательств, цифр и коротких фактов.',
    {
      variant: 'Вариант отображения: band - полоса, cards - карточки, sidebar - боковой блок.',
      title: 'Заголовок блока.',
      intro: 'Пояснение перед цифрами.',
      items: 'Факты или метрики.',
    },
  ],
  'related-links.json': [
    'Блок связанных страниц.',
    {
      title: 'Заголовок блока.',
      intro: 'Короткое пояснение.',
      links: 'Ссылки на связанные страницы.',
    },
  ],
  'rich-text.json': [
    'Текстовый редакционный блок.',
    {
      title: 'Заголовок текстового блока.',
      body: 'Основной текст. Подходит для описаний, инструкций и редакционных страниц.',
    },
  ],
  'stat-item.json': [
    'Одна цифра или факт.',
    {
      value: 'Главная цифра или короткий факт. Пример: 15 мин.',
      label: 'Подпись к цифре.',
      description: 'Дополнительное пояснение.',
    },
  ],
  'step-item.json': [
    'Один шаг процесса.',
    {
      title: 'Название шага.',
      text: 'Что происходит на этом шаге.',
    },
  ],
  'steps.json': [
    'Блок шагов или процесса.',
    {
      variant: 'Вариант отображения: cards - карточки, timeline - последовательность.',
      title: 'Заголовок блока.',
      intro: 'Короткое описание процесса.',
      items: 'Шаги процесса.',
    },
  ],
  'testimonial.json': [
    'Цитата, отзыв или редакционный вывод.',
    {
      title: 'Заголовок блока, если нужен.',
      quote: 'Текст цитаты.',
      author: 'Автор цитаты.',
      role: 'Роль или компания автора.',
    },
  ],
};

for (const [fileName, [infoDescription, descriptions]] of Object.entries(componentDescriptions)) {
  applyDescriptions(`cms/src/components/page-blocks/${fileName}`, infoDescription, descriptions);
}

console.log('Russian Strapi help text applied.');
