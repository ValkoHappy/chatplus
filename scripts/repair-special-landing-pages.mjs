import fs from 'node:fs';
import path from 'node:path';

const filePath = path.resolve('cms/seed/generated/landingPages.json');
const pages = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));

const TRUST = [
  'Единый маршрут вместо разрозненных заметок и ссылок.',
  'Материалы помогают пресейлу, внедрению и customer success говорить на одном языке.',
  'После просмотра страницы у пользователя всегда есть понятный следующий шаг.',
];

const CONFIG = {
  academy: {
    title: 'Академия',
    meta: 'Гайды, разборы и рабочие материалы для команд, которые внедряют Chat Plus и запускают омниканальные сценарии без хаоса.',
    canonical: 'https://chatplus.ru/academy',
    eyebrow: 'Материалы для запуска',
    variant: 'resource',
    highlights: ['Гайды по запуску', 'Onboarding для команды', 'Разборы сценариев и интеграций'],
    links: [
      { title: 'Документация', url: '/docs', description: 'Технический слой по API, интеграциям и архитектуре.' },
      { title: 'Блог', url: '/blog', description: 'Кейсы, заметки и практические материалы по автоматизации.' },
    ],
  },
  docs: {
    title: 'Документация',
    meta: 'API, интеграции, ограничения и технические материалы, которые помогают быстрее запускать Chat Plus в реальном проекте.',
    canonical: 'https://chatplus.ru/docs',
    eyebrow: 'API и интеграции',
    variant: 'resource',
    highlights: ['API reference', 'Webhook-события', 'Интеграции и ограничения'],
    links: [
      { title: 'Помощь', url: '/help', description: 'Справочный маршрут для быстрого ответа на частые вопросы.' },
      { title: 'Статус', url: '/status', description: 'Прозрачная картина по доступности сервисов и изменениям.' },
    ],
  },
  help: {
    title: 'Помощь',
    meta: 'Справочный слой Chat Plus для онбординга, частых вопросов и понятной навигации по следующему шагу.',
    canonical: 'https://chatplus.ru/help',
    eyebrow: 'Справочный маршрут',
    variant: 'resource',
    highlights: ['Быстрые ответы', 'Onboarding по продукту', 'Связка с docs, demo и support'],
    links: [
      { title: 'Документация', url: '/docs', description: 'Технический слой по API, интеграциям и архитектуре.' },
      { title: 'Демо', url: '/demo', description: 'Связаться с командой и разобрать ваш сценарий.' },
    ],
  },
  status: {
    title: 'Статус',
    meta: 'Прозрачный служебный слой Chat Plus о доступности сервисов, изменениях и рабочем состоянии платформы.',
    canonical: 'https://chatplus.ru/status',
    eyebrow: 'Служебный контур',
    variant: 'resource',
    highlights: ['Доступность сервисов', 'Прозрачность для клиентов', 'Понятный рабочий ритм команды'],
    links: [
      { title: 'Помощь', url: '/help', description: 'Справочный слой по запуску и частым вопросам.' },
      { title: 'Документация', url: '/docs', description: 'Технические материалы по интеграциям и API.' },
    ],
  },
  media: {
    title: 'Медиа',
    meta: 'Материалы для публикаций, внешней упаковки и согласованной публичной коммуникации вокруг Chat Plus.',
    canonical: 'https://chatplus.ru/media',
    eyebrow: 'Публичная упаковка',
    variant: 'company',
    highlights: ['Пресс-материалы', 'Короткие формулировки', 'Внешняя подача продукта'],
    links: [
      { title: 'Команда', url: '/team', description: 'Кто стоит за продуктом и как мы думаем о развитии Chat Plus.' },
      { title: 'Промо', url: '/promo', description: 'Офферы и упаковка для маркетинга, продаж и партнеров.' },
    ],
  },
  team: {
    title: 'Команда',
    meta: 'Страница о людях и подходе Chat Plus: кто делает продукт и как мы думаем о клиентском результате.',
    canonical: 'https://chatplus.ru/team',
    eyebrow: 'Люди за продуктом',
    variant: 'company',
    highlights: ['Кто делает продукт', 'Как мы принимаем решения', 'Почему это важно клиенту'],
    links: [
      { title: 'Медиа', url: '/media', description: 'Материалы для внешней упаковки и публичной коммуникации.' },
      { title: 'Партнерам', url: '/partnership', description: 'Как мы строим совместные сценарии с агентствами и интеграторами.' },
    ],
  },
  conversation: {
    title: 'Диалоги',
    meta: 'Раздел о подходе Chat Plus к клиентскому разговору как к управляемой системе, а не набору случайных сообщений.',
    canonical: 'https://chatplus.ru/conversation',
    eyebrow: 'Подход к коммуникации',
    variant: 'company',
    highlights: ['Диалог как система', 'Меньше хаоса в сообщениях', 'Связка с CRM, AI и процессом'],
    links: [
      { title: 'Каналы', url: '/channels', description: 'Как Chat Plus собирает каналы и контекст в одном окне.' },
      { title: 'Интеграции', url: '/integrations', description: 'Как диалоговый слой связывается с CRM и остальным стеком.' },
    ],
  },
  tv: {
    title: 'Видео',
    meta: 'Видео-слой Chat Plus: демо, разборы интерфейса и наглядные объяснения продукта в движении.',
    canonical: 'https://chatplus.ru/tv',
    eyebrow: 'Видео и демонстрации',
    variant: 'campaign',
    highlights: ['Демо в движении', 'Разборы интерфейса', 'Материалы для пресейла и прогрева'],
    links: [
      { title: 'Демо', url: '/demo', description: 'Разобрать ваш сценарий вместе с командой Chat Plus.' },
      { title: 'Промо', url: '/promo', description: 'Офферы и упаковка для маркетинга, пресейла и партнеров.' },
    ],
  },
  promo: {
    title: 'Промо',
    meta: 'Промо-слой Chat Plus: офферы, упаковка и материалы, которые помогают маркетингу, продажам и партнерам говорить точнее.',
    canonical: 'https://chatplus.ru/promo',
    eyebrow: 'Офферы и упаковка',
    variant: 'campaign',
    highlights: ['Офферы для сегментов', 'Материалы для маркетинга', 'Связка с product-led сценарием'],
    links: [
      { title: 'Медиа', url: '/media', description: 'Внешняя упаковка и материалы для публикаций.' },
      { title: 'Видео', url: '/tv', description: 'Демо и визуальные объяснения продукта в движении.' },
    ],
  },
  prozorro: {
    title: 'Prozorro',
    meta: 'Специальный сценарий Chat Plus для мониторинга закупок, реакции команды и контроля следующего шага в одном контуре.',
    canonical: 'https://chatplus.ru/prozorro',
    eyebrow: 'Тендерный сценарий',
    variant: 'campaign',
    highlights: ['Сигналы по закупкам', 'Реакция команды в одном окне', 'Контроль дедлайнов и касаний'],
    links: [
      { title: 'Тендеры', url: '/solutions/tenders', description: 'Главный сценарий по закупкам, дедлайнам и реакции команды.' },
      { title: 'Интеграции', url: '/integrations', description: 'Связка с CRM, automation и остальным стеком.' },
    ],
  },
};

function makeBlock(title, meta, section) {
  return `${section} для раздела «${title}» помогает объяснить продукт без хаоса, ручных пересказов и потери следующего шага.`;
}

function makePage(cfg) {
  const { title, meta, canonical, eyebrow, variant, highlights, links } = cfg;
  return {
    meta_title: `${title} Chat Plus`,
    meta_description: meta,
    h1: `${title} Chat Plus`,
    subtitle: meta,
    canonical,
    hero_eyebrow: eyebrow,
    hero_variant: variant,
    hero_highlights_label: 'Что внутри',
    hero_highlights: highlights,
    hero_trust_facts: TRUST,
    problem_title: `Почему раздел «${title}» важен для клиентского показа`,
    problem_intro: `Когда раздел «${title}» звучит сыро или недописанно, он снижает доверие к Chat Plus и ломает ощущение зрелого продукта.`,
    problem_summary: `Раздел «${title}» должен быть частью продуктового маршрута, а не отдельной технической заглушкой.`,
    problems: [
      { title: 'Слишком много ручных объяснений', text: makeBlock(title, meta, 'Контент') },
      { title: 'Нет понятного следующего шага', text: `Пользователь понимает идею раздела «${title}», но не всегда видит, что делать дальше: читать docs, идти на демо или смотреть сценарий.` },
      { title: 'Страница не выглядит как часть продукта', text: `Раздел «${title}» должен усиливать ощущение цельного B2B-сервиса, а не выпадать из общей архитектуры сайта.` },
    ],
    solution_title: `Как работает раздел «${title}» в Chat Plus`,
    solution_intro: `Мы используем этот раздел как управляемый слой контента: он помогает быстрее объяснять продукт, вести пользователя по маршруту и не терять контекст.`,
    solution_steps: [
      { title: 'Собираем контекст в один слой', text: `Раздел «${title}» объясняет тему так, чтобы продажи, внедрение, маркетинг и support говорили на одном языке.` },
      { title: 'Связываем контент с маршрутом', text: 'У пользователя всегда есть логичный переход к демо, смежному разделу или следующему действию.' },
      { title: 'Упаковываем страницу как продуктовую сцену', text: 'Текст, композиция и CTA должны выглядеть как часть зрелого Chat Plus, а не как временная заготовка.' },
    ],
    features_title: `Что дает раздел «${title}»`,
    features: [
      { title: 'Более понятный клиентский показ', text: `Раздел «${title}» помогает быстрее донести ценность Chat Plus без устных расшифровок.` },
      { title: 'Меньше повторяющейся рутины', text: 'Команда опирается на готовый слой материалов и не собирает объяснение с нуля под каждый кейс.' },
      { title: 'Лучшая связка с навигацией', text: 'Пользователь видит продолжение маршрута по сайту, а не тупиковую точку.' },
      { title: 'Более зрелое восприятие продукта', text: 'Даже служебные и специальные страницы выглядят как часть сильной B2B-платформы.' },
    ],
    integrations_title: `Как раздел «${title}» связан с остальными страницами Chat Plus`,
    integration_blocks: [
      { label: 'Документация и справка', text: 'Раздел не живет отдельно, а поддерживает общий маршрут по сайту.' },
      { label: 'Демо и пресейл', text: 'Страница помогает быстрее перевести интерес в конкретный следующий разговор.' },
      { label: 'Навигация по сценарию', text: 'Пользователь видит понятные переходы к смежным страницам и кейсам.' },
    ],
    roi_title: `Что дает сильный раздел «${title}»`,
    roi_intro: `Страница «${title}» нужна не ради галочки, а ради более понятного маршрута и лучшего клиентского восприятия продукта.`,
    roi_without_items: [
      'Команда объясняет всё вручную и каждый раз заново',
      'Пользователь теряется между интересом и следующим шагом',
      'Специальный раздел выглядит вторичным и не усиливает продукт',
    ],
    roi_with_items: [
      'Появляется единый управляемый слой материалов',
      'Пользователь быстрее понимает, куда идти дальше',
      'Сайт воспринимается как зрелая и собранная платформа',
    ],
    roi_quote: `Хороший раздел «${title}» помогает не просто показать тему, а поддержать общий продуктовый маршрут Chat Plus.`,
    use_cases_title: `Где раздел «${title}» особенно полезен`,
    use_cases: [
      { title: 'Клиентский показ', text: `Раздел «${title}» помогает быстрее донести идею продукта и снять часть вопросов до демо.` },
      { title: 'Работа команды', text: 'Маркетинг, продажи и внедрение используют один и тот же слой вместо разрозненных объяснений.' },
      { title: 'Навигация по сайту', text: 'Страница усиливает перелинковку и делает маршрут по продукту более понятным.' },
    ],
    comparison_title: null,
    comparison_rows: [],
    faq_title: `Вопросы о разделе «${title}»`,
    faqs: [
      { question: `Для чего нужен раздел «${title}»?`, answer: `Чтобы быстрее объяснять ценность Chat Plus в этом контексте и переводить интерес в следующий рабочий шаг.` },
      { question: `Можно ли использовать страницу «${title}» в клиентском показе?`, answer: 'Да. Она должна выглядеть как зрелый продуктовый слой, а не как временная техническая заготовка.' },
      { question: 'Что должен сделать пользователь после просмотра?', answer: 'Перейти к демо, смежному сценарию, документации или следующему этапу принятия решения.' },
    ],
    internal_links_title: 'Что еще посмотреть',
    internal_links_variant: 'docs',
    internal_links: links,
    sticky_cta_title: `Покажем, как использовать раздел «${title}» в вашем сценарии`,
    sticky_cta_text: `Разберем, как слой «${title}» помогает в пресейле, внедрении, customer success и связке со всем сайтом Chat Plus.`,
    sticky_cta_primary_label: 'Запросить демо',
    sticky_cta_primary_url: '/demo',
    sticky_cta_secondary_label: 'Посмотреть цены',
    sticky_cta_secondary_url: '/pricing',
    software_schema: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: `${title} Chat Plus`,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: meta,
      url: canonical,
      author: { '@type': 'Organization', name: 'Chat Plus' },
    },
    faq_schema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: `Для чего нужен раздел «${title}»?`, acceptedAnswer: { '@type': 'Answer', text: `Чтобы быстрее объяснять ценность Chat Plus в этом контексте и переводить интерес в следующий рабочий шаг.` } },
        { '@type': 'Question', name: `Можно ли использовать страницу «${title}» в клиентском показе?`, acceptedAnswer: { '@type': 'Answer', text: 'Да. Она должна выглядеть как зрелый продуктовый слой, а не как временная техническая заготовка.' } },
        { '@type': 'Question', name: 'Что должен сделать пользователь после просмотра?', acceptedAnswer: { '@type': 'Answer', text: 'Перейти к демо, смежному сценарию, документации или следующему этапу принятия решения.' } },
      ],
    },
  };
}

for (const item of pages) {
  const cfg = CONFIG[item.slug];
  if (!cfg) continue;
  Object.assign(item, makePage(cfg));
}

fs.writeFileSync(filePath, `${JSON.stringify(pages, null, 2)}\n`, 'utf8');
console.log('special landing pages repaired');
