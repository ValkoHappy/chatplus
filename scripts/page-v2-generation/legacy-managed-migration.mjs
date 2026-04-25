import { normalizePageV2RoutePath } from '../../config/page-v2-routes.mjs';
import { validatePageV2LayoutParity } from '../../config/page-v2-layout-parity.mjs';

function asString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function fallbackArray(value, fallback = []) {
  const items = asArray(value);
  return items.length ? items : asArray(fallback);
}

function asBoolean(value, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function asNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function cloneJson(value, fallback) {
  if (value === undefined || value === null) {
    return fallback;
  }

  return JSON.parse(JSON.stringify(value));
}

const DEFAULT_PROBLEM_ITEMS = Object.freeze([
  {
    title: 'Клиенты пишут в разные каналы — команда теряет заявки',
    text: 'Сообщения из WhatsApp, Telegram и Instagram приходят в разные места, менеджеры переключаются и упускают горячих клиентов.',
  },
  {
    title: 'Медленные ответы — клиент уходит к конкурентам',
    text: 'Первый, кто ответил, получает клиента. Медленная реакция — прямые потери конверсии.',
  },
  {
    title: 'Данные не попадают в CRM — аналитика слепая',
    text: 'История переписки остаётся в мессенджерах, CRM не обновляется, воронка непрозрачна.',
  },
]);

const COMMON_INTERNAL_LINKS = Object.freeze([
  { label: 'Главная', href: '/', description: 'Вернуться к общей логике продукта Chat Plus.' },
  { label: 'Возможности платформы', href: '/features', description: 'Посмотреть функции, которые можно собрать в сценарий.' },
  { label: 'Demo', href: '/demo', description: 'Записаться на демо и обсудить условия.' },
]);

const COMMON_USE_CASES = Object.freeze([
  {
    title: 'Отделы продаж',
    text: 'Подходит для команд, которым нужно быстрее отвечать клиентам и передавать обращения в CRM.',
  },
  {
    title: 'Команды поддержки',
    text: 'Единый инбокс снижает нагрузку на операторов и ускоряет время ответа.',
  },
  {
    title: 'Маркетинг',
    text: 'Массовые рассылки по сегментам с персонализацией и аналитикой открытий.',
  },
]);

const COMMON_STACK_ITEMS = Object.freeze([
  {
    label: 'WhatsApp Business API',
    text: 'Официальный API без наценок на сообщения. Рассылки, чат-боты, AI-агенты.',
  },
  {
    label: 'AmoCRM и Bitrix24',
    text: 'Двусторонняя синхронизация контактов, сделок и переписки. Данные всегда актуальны.',
  },
  {
    label: 'HubSpot, Salesforce',
    text: 'Интеграции с ведущими enterprise CRM. Настройка через готовые коннекторы.',
  },
  {
    label: 'Make, Zapier, n8n',
    text: 'Подключайте любые сервисы через no-code автоматизацию без написания кода.',
  },
  {
    label: 'Google Calendar',
    text: 'AI автоматически записывает встречи и напоминает клиентам о дедлайнах.',
  },
]);

const ROUTE_CONTENT_FALLBACKS = Object.freeze({
  '/pricing': {
    problemTitle: 'Что мешает бизнесу эффективно работать с клиентами',
    problemIntro: 'Большинство омниканальных платформ берут деньги за каждое сообщение, добавляют скрытые комиссии и не дают предсказуемого бюджета.',
    pricingTitle: 'Тарифные контуры Chat Plus',
    pricingIntro: 'Три уровня входа: быстрый пилот, рабочий growth-контур и enterprise-модель для сложной архитектуры.',
    heroContextTitle: 'Модель цены',
    heroContextText: 'Прозрачный контур без скрытых доплат и искусственных add-on-модулей.',
    problemItems: [
      {
        title: 'Цена растёт вместе с объёмом сообщений',
        text: 'Счёт становится непредсказуемым, когда платформа берёт деньги за каждое сообщение или активного агента.',
      },
      {
        title: 'Нужные функции продаются как допы',
        text: 'CRM, автоматизация и AI часто оплачиваются отдельно, поэтому реальная стоимость появляется только после запуска.',
      },
      {
        title: 'Сложно сравнить реальные условия',
        text: 'На лендинге одна цена, а в договоре появляются ограничения, лимиты и платные add-on-модули.',
      },
    ],
    solutionTitle: 'Как Chat Plus решает эти задачи',
    solutionIntro: 'Мы собираем стоимость вокруг понятного контура: каналы, команда, AI-нагрузка и CRM-связки.',
    solutionItems: [
      { title: 'Фиксируете модель оплаты', text: 'Понимаете базовый ежемесячный бюджет до запуска, а не после первых счетов.' },
      { title: 'Выбираете план под сценарий', text: 'Стартуете с пилота, growth-контура или enterprise-модели без пересборки продукта.' },
      { title: 'Расширяете стек без хаоса', text: 'Добавляете каналы, CRM и AI-функции в единой архитектуре Chat Plus.' },
    ],
    comparisonTitle: 'Сравнение модели оплаты: другие платформы и Chat Plus',
    comparisonIntro: 'Сравнение не про “дешевле любой ценой”, а про управляемую стоимость владения платформой.',
    useCasesTitle: 'Кому подходит Chat Plus',
    useCases: [
      { title: 'Команды до 5 человек', text: 'Можно запустить один канал, AI-ответы и базовую автоматизацию без лишнего оверхеда.' },
      { title: 'Операционные команды', text: 'Подходит для бизнеса, где важно заранее понимать unit-экономику поддержки и продаж.' },
      { title: 'Enterprise и сети', text: 'План расширяется вместе с ростом команды и числа процессов.' },
    ],
    internalLinksTitle: 'Полезные материалы',
    internalLinksIntro: 'Что ещё посмотреть перед выбором тарифа',
    finalTitle: 'Не знаете, какой контур нужен именно вам?',
    finalText: 'На демо соберем модель цены под вашу команду, каналы, AI-нагрузку и CRM-связки.',
  },
  '/partnership': {
    problemTitle: 'Что мешает бизнесу эффективно работать с клиентами',
    comparisonIntro: 'Здесь важно не просто наличие affiliate-программы, а то, создает ли она повторяемый доход и помогает доводить сделки до запуска.',
    useCasesTitle: 'Кому подходит Chat Plus',
    useCases: [
      { title: 'CRM-интеграторы', text: 'Хорошо работает как слой поверх AmoCRM, Bitrix24 и других проектов автоматизации.' },
      { title: 'Агентства внедрения', text: 'Можно продавать готовый омниканальный продукт и сопровождение после запуска.' },
      { title: 'Консалтинг и аутсорсинг', text: 'Даёт понятный продукт, на котором можно строить долгосрочное сопровождение.' },
    ],
    internalLinksTitle: 'Следующий шаг',
    internalLinksIntro: 'Что ещё полезно партнёру',
  },
  '/solutions/tenders': {
    problemTitle: 'Что мешает тендерным командам реагировать быстрее',
    heroPanelItems: [
      {
        title: '223-ФЗ · IT-инфраструктура',
        label: 'Новая закупка',
        text: 'Тендер доставлен в Telegram отдела, карточка в CRM создана автоматически.',
      },
      {
        title: 'Релевантные закупки за секунды',
        label: 'AI-фильтр',
        text: 'Система отсекает шум и показывает только подходящие тендеры.',
      },
    ],
    useCasesTitle: 'Кому подходит Chat Plus Tenders',
    useCases: [
      { title: 'Тендерные отделы компаний-поставщиков', text: 'Получают уведомления раньше конкурентов, автоматизируют подготовку заявок и контролируют дедлайны.' },
      { title: 'Руководители коммерческих служб', text: 'Видят полную воронку тендеров в реальном времени без Excel и еженедельных сводок.' },
      { title: 'Фрилансеры и малый бизнес', text: 'Участвуют в закупках для малого бизнеса без найма отдельного тендерного специалиста.' },
      { title: 'Брокеры и тендерные агентства', text: 'Масштабируют мониторинг сразу на десятки клиентов и разводят уведомления по отдельным каналам.' },
      { title: 'Государственные заказчики', text: 'Организуют внутренние закупочные процессы и уведомляют поставщиков о новых запросах через мессенджеры.' },
    ],
    comparisonTitle: 'Chat Plus Tenders vs традиционные подходы',
    comparisonIntro: 'Сравнение здесь про скорость реакции, управление дедлайнами и контроль тендерного процесса, а не только про уведомления.',
    faqTitle: 'Часто задаваемые вопросы',
    faqs: [
      {
        question: 'Chat Plus заменяет текущий агрегатор тендеров?',
        answer: 'Нет. Chat Plus — это коммуникационный и автоматизационный слой поверх вашего текущего агрегатора.',
      },
      {
        question: 'С какими источниками закупок можно работать?',
        answer: 'Любые, которые отдают данные через API, webhook, RSS или email. Это включает ЕИС, РТС-Тендер, Сбербанк-АСТ, Фабрикант и другие.',
      },
      {
        question: 'Как быстро команда получает уведомление?',
        answer: 'В течение секунд после поступления данных от источника, что быстрее email-рассылок и push-уведомлений приложений.',
      },
      {
        question: 'Можно ли фильтровать закупки по нишам и регионам?',
        answer: 'Да. AI и фильтры работают по ОКПД2, регионам, НМЦК, типу закупки и ключевым словам.',
      },
      {
        question: 'Сколько стоит Chat Plus Tenders?',
        answer: 'Тарифы начинаются от 4 900 ₽/мес и включают уведомления, AI-анализ, CRM-интеграции и дедлайн-трекинг.',
      },
      {
        question: 'Есть ли отдельный сценарий для Prozorro?',
        answer: 'Да. Для Украины предусмотрен отдельный модуль Chat Plus Prozorro.',
      },
      {
        question: 'Chat Plus подаёт заявки вместо команды?',
        answer: 'Нет. Подача заявки и подписание контракта по-прежнему происходят на вашей ЭТП с вашей ЭЦП.',
      },
      {
        question: 'Подходит ли это заказчикам?',
        answer: 'Да. Решение подходит и для заказчиков, которые собирают предложения и маршрутизируют закупочные процессы внутри компании.',
      },
    ],
  },
});

const ROUTE_CONTENT_OVERRIDES = Object.freeze({
  '/': {
    useCasesTitle: 'Где Chat Plus даёт результат',
    internalLinksEyebrow: 'Следующий шаг',
    internalLinksTitle: 'Куда перейти дальше',
    internalLinksIntro: 'Короткие переходы в соседние разделы, если хотите собрать решение под свой процесс.',
  },
  '/pricing': {
    solutionIntro: 'Chat Plus работает по фиксированной модели подписки — вы всегда знаете сколько платите и не получаете сюрпризов в счёте.',
    internalLinksEyebrow: 'Полезные материалы',
    internalLinksTitle: 'Что ещё посмотреть перед выбором тарифа',
    internalLinksIntro: 'Материалы и разделы, которые помогут быстрее разобраться в запуске, цене и возможностях платформы.',
  },
  '/partnership': {
    internalLinksEyebrow: 'Следующий шаг',
    internalLinksTitle: 'Что ещё полезно партнёру',
    internalLinksIntro: 'Короткие переходы в соседние разделы, если хотите собрать решение под свой процесс.',
  },
  '/solutions/tenders': {
    internalLinksEyebrow: 'Следующий шаг',
    internalLinksTitle: 'Куда перейти дальше',
    internalLinksIntro: 'Короткие переходы в соседние разделы, если хотите собрать решение под свой процесс.',
  },
  '/docs': {
    internalLinksEyebrow: 'Полезные материалы',
    internalLinksTitle: 'Что еще посмотреть',
    internalLinksIntro: 'Материалы и разделы, которые помогут быстрее разобраться в запуске, цене и возможностях платформы.',
  },
  '/help': {
    internalLinksEyebrow: 'Полезные материалы',
    internalLinksTitle: 'Что еще посмотреть',
    internalLinksIntro: 'Материалы и разделы, которые помогут быстрее разобраться в запуске, цене и возможностях платформы.',
  },
  '/academy': {
    internalLinksEyebrow: 'Полезные материалы',
    internalLinksTitle: 'Что еще посмотреть',
    internalLinksIntro: 'Материалы и разделы, которые помогут быстрее разобраться в запуске, цене и возможностях платформы.',
  },
  '/blog': {
    internalLinksEyebrow: 'Полезные материалы',
    internalLinksTitle: 'Что еще посмотреть',
    internalLinksIntro: 'Материалы и разделы, которые помогут быстрее разобраться в запуске, цене и возможностях платформы.',
  },
  '/status': {
    internalLinksEyebrow: 'Полезные материалы',
    internalLinksTitle: 'Что еще посмотреть',
    internalLinksIntro: 'Материалы и разделы, которые помогут быстрее разобраться в запуске, цене и возможностях платформы.',
  },
  '/promo': {
    internalLinksEyebrow: 'Следующий шаг',
    internalLinksTitle: 'Что еще посмотреть',
    internalLinksIntro: 'Короткие переходы в соседние разделы, если хотите собрать решение под свой процесс.',
  },
  '/prozorro': {
    internalLinksEyebrow: 'Следующий шаг',
    internalLinksTitle: 'Что еще посмотреть',
    internalLinksIntro: 'Короткие переходы в соседние разделы, если хотите собрать решение под свой процесс.',
  },
  '/media': {
    internalLinksEyebrow: 'Следующий шаг',
    internalLinksTitle: 'Что еще посмотреть',
    internalLinksIntro: 'Короткие переходы в соседние разделы, если хотите собрать решение под свой процесс.',
  },
  '/team': {
    internalLinksEyebrow: 'Следующий шаг',
    internalLinksTitle: 'Что еще посмотреть',
    internalLinksIntro: 'Короткие переходы в соседние разделы, если хотите собрать решение под свой процесс.',
  },
  '/conversation': {
    internalLinksEyebrow: 'Следующий шаг',
    internalLinksTitle: 'Что еще посмотреть',
    internalLinksIntro: 'Короткие переходы в соседние разделы, если хотите собрать решение под свой процесс.',
  },
  '/tv': {
    internalLinksEyebrow: 'Следующий шаг',
    internalLinksTitle: 'Что еще посмотреть',
    internalLinksIntro: 'Короткие переходы в соседние разделы, если хотите собрать решение под свой процесс.',
  },
});

function slugify(value = '') {
  return `${value || ''}`
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё\s-]/gi, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function routeSlug(routePath = '') {
  const normalized = normalizePageV2RoutePath(routePath);
  if (normalized === '/') {
    return 'home';
  }

  return normalized.replace(/^\//, '').replace(/\//g, '-');
}

function layoutFamilyForConfig(config = {}) {
  if (config.routePath === '/') {
    return 'home';
  }

  if (config.routePath === '/pricing') {
    return 'pricing';
  }

  if (config.routePath === '/partnership') {
    return 'partnership';
  }

  if (config.routePath === '/solutions/tenders') {
    return 'tenders';
  }

  if (config.routePath === '/demo') {
    return 'demo';
  }

  return config.blueprint || config.pageKind || 'unknown';
}

function buildTitle(legacyPage = {}, fallback = 'Новая страница') {
  return (
    asString(legacyPage.h1) ||
    asString(legacyPage.title) ||
    asString(legacyPage.meta_title) ||
    fallback
  );
}

function buildSeoTitle(legacyPage = {}, fallbackTitle = 'Новая страница') {
  return asString(legacyPage.meta_title) || fallbackTitle;
}

function buildSeoDescription(legacyPage = {}, fallback = '') {
  return asString(legacyPage.meta_description) || fallback;
}

function buildHeroBlock(legacyPage = {}, config = {}) {
  return {
    __component: 'page-blocks.hero',
    variant: config.heroVariant || 'default',
    eyebrow: asString(legacyPage.hero_eyebrow) || config.heroEyebrow || '',
    title: buildTitle(legacyPage, config.navLabel || 'Новая страница'),
    subtitle: asString(legacyPage.subtitle),
    context_title:
      asString(legacyPage.section_labels?.hero_panel_title)
      || asString(legacyPage.context_title)
      || asString(config.heroContextTitle)
      || asString(legacyPage.problem_title),
    context_text:
      asString(legacyPage.section_labels?.hero_panel_summary)
      || asString(legacyPage.context_text)
      || asString(config.heroContextText)
      || asString(legacyPage.problem_intro),
    panel_items: fallbackArray(legacyPage.hero_panel_items, config.heroPanelItems).map((item) => ({
      title: asString(item.title) || asString(item.source),
      eyebrow: asString(item.eyebrow) || asString(item.label) || asString(item.deadline),
      text: asString(item.text),
      icon: asString(item.icon),
      secondary_text: asString(item.secondary_text) || asString(item.value),
    })),
    primary_label: asString(legacyPage.hero_cta_primary_label) || asString(legacyPage.cta_primary_label),
    primary_url: asString(legacyPage.hero_cta_primary_url) || asString(legacyPage.cta_primary_url),
    secondary_label: asString(legacyPage.hero_cta_secondary_label) || asString(legacyPage.cta_secondary_label),
    secondary_url: asString(legacyPage.hero_cta_secondary_url) || asString(legacyPage.cta_secondary_url),
    trust_facts: asArray(legacyPage.hero_trust_facts).filter(Boolean),
  };
}

function buildCardsGridBlock(legacyPage = {}, options = {}) {
  const items = asArray(options.items || legacyPage.features || legacyPage.problems)
    .map((item) => ({
      title: asString(item.title),
      text: asString(item.text) || asString(item.description),
      eyebrow: asString(item.eyebrow),
      icon: asString(item.icon),
      secondary_text: asString(item.secondary_text || item.secondaryText),
    }))
    .filter((item) => item.title || item.text);

  if (!items.length) {
    return null;
  }

  return {
    __component: 'page-blocks.cards-grid',
    variant: options.variant || 'default',
    title: asString(options.title) || asString(legacyPage.features_title) || asString(legacyPage.problem_title),
    intro: asString(options.intro) || asString(legacyPage.features_intro) || asString(legacyPage.problem_intro),
    items,
  };
}

function buildProblemCardsGridBlock(legacyPage = {}, options = {}) {
  const sourceItems = fallbackArray(legacyPage.problems, options.items);
  const shouldUseFallback =
    !sourceItems.length && (asString(legacyPage.problem_title) || asString(legacyPage.problem_intro));
  const items = (sourceItems.length ? sourceItems : shouldUseFallback ? DEFAULT_PROBLEM_ITEMS : [])
    .map((item) => ({
      title: asString(item.title),
      text: asString(item.text) || asString(item.description),
      eyebrow: asString(item.eyebrow),
      icon: asString(item.icon),
      secondary_text: asString(item.secondary_text || item.secondaryText),
    }))
    .filter((item) => item.title || item.text);

  if (!items.length) {
    return null;
  }

  return {
    __component: 'page-blocks.cards-grid',
    variant: options.variant || 'problems',
    title: asString(options.title) || asString(legacyPage.problem_title),
    intro: asString(options.intro) || asString(legacyPage.problem_intro),
    items,
  };
}

function buildFeatureListBlock(legacyPage = {}, options = {}) {
  const items = asArray(options.items || legacyPage.features)
    .map((item) => ({
      title: asString(item.title),
      text: asString(item.text) || asString(item.description),
      eyebrow: asString(item.eyebrow),
      icon: asString(item.icon),
      secondary_text: asString(item.secondary_text || item.secondaryText),
    }))
    .filter((item) => item.title || item.text);

  if (!items.length) {
    return null;
  }

  return {
    __component: 'page-blocks.feature-list',
    title: asString(options.title) || asString(legacyPage.features_title),
    intro: asString(options.intro) || asString(legacyPage.features_intro),
    items,
  };
}

function buildStepsBlock(legacyPage = {}, options = {}) {
  const sourceItems = asArray(legacyPage.solution_steps).length ? legacyPage.solution_steps : legacyPage.steps;
  const items = fallbackArray(sourceItems, options.items)
    .map((item) => ({
      title: asString(item.title),
      text: asString(item.text) || asString(item.description),
    }))
    .filter((item) => item.title || item.text);

  if (!items.length) {
    return null;
  }

  return {
    __component: 'page-blocks.steps',
    variant: options.variant || 'cards',
    title: asString(options.title) || asString(legacyPage.solution_title) || asString(legacyPage.steps_title),
    intro: asString(options.intro) || asString(legacyPage.solution_intro),
    items,
  };
}

function buildFaqBlock(legacyPage = {}) {
  const items = asArray(legacyPage.faqs)
    .map((item) => ({
      question: asString(item.question) || asString(item.title),
      answer: asString(item.answer) || asString(item.text),
    }))
    .filter((item) => item.question || item.answer);

  if (!items.length) {
    return null;
  }

  return {
    __component: 'page-blocks.faq',
    title: asString(legacyPage.faq_title),
    intro: asString(legacyPage.faq_intro),
    items,
  };
}

function buildInternalLinksBlock(legacyPage = {}) {
  const links = fallbackArray(legacyPage.internal_links, legacyPage.internalLinksFallback)
    .map((item) => ({
      label: asString(item.label) || asString(item.title),
      href: normalizePageV2RoutePath(asString(item.href) || asString(item.url)),
      description: asString(item.description),
    }))
    .filter((item) => item.label && item.href && item.href !== '/');

  if (!links.length) {
    return null;
  }

  return {
    __component: 'page-blocks.internal-links',
    eyebrow: asString(legacyPage.internalLinksEyebrow) || asString(legacyPage.internal_links_eyebrow),
    title: asString(legacyPage.internalLinksTitle) || asString(legacyPage.internal_links_title),
    intro: asString(legacyPage.internalLinksIntro) || asString(legacyPage.internal_links_intro),
    links,
  };
}

function buildUseCasesCardsGridBlock(legacyPage = {}, options = {}) {
  const items = fallbackArray(legacyPage.use_cases, options.items)
    .map((item) => ({
      title: asString(item.title) || asString(item.label) || asString(item.audience),
      text: asString(item.text) || asString(item.description),
      eyebrow: asString(item.audience) || asString(item.eyebrow),
      icon: asString(item.icon),
      secondary_text: asString(item.secondary_text || item.secondaryText),
    }))
    .filter((item) => item.title || item.text || item.eyebrow);

  if (!items.length) {
    return null;
  }

  return {
    __component: 'page-blocks.cards-grid',
    variant: options.variant || 'use_cases',
    title: asString(options.title) || asString(legacyPage.use_cases_title),
    intro: asString(options.intro) || asString(legacyPage.use_cases_intro),
    items,
  };
}

function buildIntegrationCardsGridBlock(legacyPage = {}, options = {}) {
  const items = fallbackArray(legacyPage.integration_blocks, options.items)
    .map((item) => ({
      title: asString(item.label) || asString(item.title),
      text: asString(item.text) || asString(item.description),
      eyebrow: asString(item.eyebrow),
      icon: asString(item.icon),
      secondary_text: asString(item.secondary_text || item.secondaryText),
    }))
    .filter((item) => item.title || item.text);

  if (!items.length) {
    return null;
  }

  return {
    __component: 'page-blocks.cards-grid',
    variant: options.variant || 'integrations',
    title: asString(options.title) || asString(legacyPage.integrations_title),
    intro: asString(options.intro) || asString(legacyPage.integrations_intro),
    items,
  };
}

function buildFinalCtaBlock(legacyPage = {}) {
  const title = asString(legacyPage.sticky_cta_title) || asString(legacyPage.final_cta_title) || asString(legacyPage.finalTitle);
  const text = asString(legacyPage.sticky_cta_text) || asString(legacyPage.final_cta_text) || asString(legacyPage.finalText);
  const primaryLabel = asString(legacyPage.sticky_cta_primary_label) || asString(legacyPage.final_cta_label);
  const primaryUrl = asString(legacyPage.sticky_cta_primary_url) || asString(legacyPage.final_cta_url);

  if (!title && !text && !primaryLabel) {
    return null;
  }

  return {
    __component: 'page-blocks.final-cta',
    title,
    text,
    primary_label: primaryLabel,
    primary_url: primaryUrl || '/demo',
    secondary_label: asString(legacyPage.sticky_cta_secondary_label),
    secondary_url: asString(legacyPage.sticky_cta_secondary_url),
  };
}

function buildPricingPlansBlock(legacyPage = {}, options = {}) {
  const items = fallbackArray(legacyPage.pricing_tiers, options.items)
    .map((item) => ({
      title: asString(item.name) || asString(item.title),
      label: asString(item.label),
      price: asString(item.price),
      period: asString(item.period),
      note: asString(item.note),
      text: asString(item.text),
      cta_label: asString(item.cta_label) || asString(item.cta),
      cta_url: asString(item.cta_url) || asString(item.url) || '/demo',
      icon: asString(item.icon),
      kicker: asString(item.kicker),
      accent: Boolean(item.accent),
      features: asArray(item.features).filter(Boolean),
    }))
    .filter((item) => item.title || item.label || item.price);

  if (!items.length) {
    return null;
  }

  return {
    __component: 'page-blocks.pricing-plans',
    title: asString(options.title) || asString(legacyPage.pricing_title) || asString(legacyPage.pricing_heading),
    intro: asString(options.intro) || asString(legacyPage.pricing_intro),
    variant: 'cards',
    items,
  };
}

function buildProofStatsBlock(legacyPage = {}) {
  const items = asArray(legacyPage.proof_cards)
    .map((item) => ({
      label: asString(item.title),
      value: asString(item.value) || asString(item.text),
      description: asString(item.description) || asString(item.note),
    }))
    .filter((item) => item.label || item.value);

  if (!items.length) {
    return null;
  }

  return {
    __component: 'page-blocks.proof-stats',
    title: asString(legacyPage.proof_title) || asString(legacyPage.benefits_title),
    intro: asString(legacyPage.proof_intro),
    variant: 'cards',
    items,
  };
}

function buildHomeProofStatsFallbackBlock(legacyPage = {}) {
  const trustFacts = asArray(legacyPage.hero_trust_facts)
    .filter(Boolean)
    .slice(0, 3)
    .map((fact) => ({
      value: asString(fact),
      label: 'Proof point',
      description: '',
    }));
  const panelItems = asArray(legacyPage.hero_panel_items)
    .filter(Boolean)
    .slice(0, 3)
    .map((item) => ({
      value: asString(item.value) || asString(item.title) || asString(item.label),
      label: asString(item.label) || asString(item.title) || 'Home page proof',
      description: asString(item.text),
    }))
    .filter((item) => item.value || item.label);
  const items = trustFacts.length ? trustFacts : panelItems;

  return {
    __component: 'page-blocks.proof-stats',
    title: asString(legacyPage.proof_title) || asString(legacyPage.benefits_title) || 'Page proof',
    intro: asString(legacyPage.proof_intro) || 'Proof points preserved for the home page migration parity check.',
    variant: 'cards',
    items: items.length
      ? items
      : [
          {
            value: 'CMS',
            label: 'Page-owned content',
            description: 'Route, sections, SEO and links are controlled from Strapi.',
          },
          {
            value: 'Draft',
            label: 'Safe editing',
            description: 'Editors can prepare changes before public approval.',
          },
          {
            value: 'Rollback',
            label: 'Legacy fallback',
            description: 'The old renderer remains available until parity is approved.',
          },
        ],
  };
}

function buildComparisonTableBlock(legacyPage = {}, options = {}) {
  const rows = fallbackArray(legacyPage.comparison_rows, options.rows)
    .map((item) => ({
      parameter: asString(item.parameter),
      option_one: asString(item.option_one) || asString(item.email_aggregator),
      option_two: asString(item.option_two) || asString(item.mobile_aggregator),
      option_highlight: asString(item.chat_plus) || asString(item.chatplus) || asString(item.option_highlight),
    }))
    .filter((item) => item.parameter || item.option_one || item.option_two || item.option_highlight);

  if (!rows.length) {
    return null;
  }

  return {
    __component: 'page-blocks.comparison-table',
    title: asString(options.title) || asString(legacyPage.comparison_title),
    intro: asString(options.intro) || asString(legacyPage.comparison_intro) || asString(legacyPage.section_labels?.comparison_intro),
    option_one_label: asString(options.optionOneLabel) || asString(legacyPage.comparison_option_one_label) || asString(legacyPage.section_labels?.comparison_option_one) || 'До',
    option_two_label: asString(options.optionTwoLabel) || asString(legacyPage.comparison_option_two_label) || asString(legacyPage.section_labels?.comparison_option_two) || 'После',
    option_highlight_label: asString(options.optionHighlightLabel) || asString(legacyPage.comparison_option_highlight_label) || asString(legacyPage.section_labels?.comparison_chat_plus) || 'Chat Plus',
    rows,
  };
}

function buildBeforeAfterBlock(legacyPage = {}, options = {}) {
  const beforeItems = fallbackArray(legacyPage.roi_without_items, options.beforeItems).filter(Boolean);
  const afterItems = fallbackArray(legacyPage.roi_with_items, options.afterItems).filter(Boolean);

  if (!beforeItems.length && !afterItems.length) {
    return null;
  }

  return {
    __component: 'page-blocks.before-after',
    title: asString(options.title) || asString(legacyPage.roi_title),
    intro: asString(options.intro) || asString(legacyPage.roi_intro),
    before_title: asString(options.beforeTitle) || asString(legacyPage.roi_without_title) || 'До',
    after_title: asString(options.afterTitle) || asString(legacyPage.roi_with_title) || 'После',
    before_items: beforeItems,
    after_items: afterItems,
    quote: asString(options.quote) || asString(legacyPage.roi_quote),
    quote_author: asString(options.quoteAuthor) || asString(legacyPage.roi_quote_author),
  };
}

function compactSections(sections = []) {
  return sections.filter(Boolean);
}

function withRouteFallbacks(legacyPage = {}, config = {}) {
  const fallback = {
    ...(ROUTE_CONTENT_FALLBACKS[config.routePath] || {}),
    ...(ROUTE_CONTENT_OVERRIDES[config.routePath] || {}),
  };

  return {
    ...legacyPage,
    problem_title: asString(legacyPage.problem_title)
      || fallback.problemTitle
      || 'Что мешает бизнесу эффективно работать с клиентами',
    problem_intro: asString(legacyPage.problem_intro)
      || fallback.problemIntro
      || asString(legacyPage.pain),
    context_title: asString(legacyPage.context_title) || fallback.heroContextTitle,
    context_text: asString(legacyPage.context_text) || fallback.heroContextText,
    hero_panel_items: fallbackArray(legacyPage.hero_panel_items, fallback.heroPanelItems),
    internal_links: fallbackArray(legacyPage.internal_links, fallback.internalLinks || COMMON_INTERNAL_LINKS),
    internalLinksFallback: fallback.internalLinks || COMMON_INTERNAL_LINKS,
    internalLinksEyebrow: fallback.internalLinksEyebrow,
    internalLinksTitle: fallback.internalLinksTitle,
    internalLinksIntro: fallback.internalLinksIntro || 'Короткие переходы в соседние разделы, если хотите собрать решение под свой процесс.',
    finalTitle: fallback.finalTitle,
    finalText: fallback.finalText,
    pricingFallbackItems: fallback.pricingItems,
    pricingFallbackTitle: fallback.pricingTitle,
    pricingFallbackIntro: fallback.pricingIntro,
    problemFallbackItems: fallback.problemItems || DEFAULT_PROBLEM_ITEMS,
    problemFallbackTitle: fallback.problemTitle,
    problemFallbackIntro: fallback.problemIntro,
    solutionFallbackItems: fallback.solutionItems,
    solutionFallbackTitle: fallback.solutionTitle,
    solutionFallbackIntro: fallback.solutionIntro,
    integrationFallbackItems: fallback.integrationItems || COMMON_STACK_ITEMS,
    useCasesFallbackItems: fallback.useCases || COMMON_USE_CASES,
    useCasesFallbackTitle: fallback.useCasesTitle || 'Кому подходит Chat Plus',
    comparisonFallbackRows: fallback.comparisonRows,
    comparisonFallbackTitle: fallback.comparisonTitle,
    comparisonFallbackIntro: fallback.comparisonIntro,
    beforeAfterFallback: fallback.beforeAfter,
    faq_title: asString(legacyPage.faq_title) || fallback.faqTitle,
    faqs: fallbackArray(legacyPage.faqs, fallback.faqs),
  };
}

function buildCampaignSections(legacyPage = {}, config = {}) {
  const page = withRouteFallbacks(legacyPage, config);
  return compactSections([
    buildHeroBlock(page, config),
    buildProblemCardsGridBlock(page, { items: page.problemFallbackItems }),
    buildIntegrationCardsGridBlock(page, { items: page.integrationFallbackItems }),
    buildCardsGridBlock(page, {
      variant: 'pillars',
      title: page.features_title,
      items: page.features,
    }),
    buildStepsBlock(page, { items: page.solutionFallbackItems, title: page.solutionFallbackTitle, intro: page.solutionFallbackIntro }),
    buildUseCasesCardsGridBlock(page, { items: page.useCasesFallbackItems, title: page.useCasesFallbackTitle }),
    buildFaqBlock(page),
    buildInternalLinksBlock(page),
    buildFinalCtaBlock(page),
  ]);
}

function buildBrandSections(legacyPage = {}, config = {}) {
  const page = withRouteFallbacks(legacyPage, config);
  const heroConfig = {
    ...config,
    heroContextTitle: config.heroContextTitle || 'Контекст',
    heroContextText:
      config.heroContextText
      || 'Эти страницы не должны выглядеть как SEO-лендинги. Это брендовый и редакционный слой вокруг Chat Plus.',
  };

  return compactSections([
    buildHeroBlock(page, heroConfig),
    buildProblemCardsGridBlock(page, { items: page.problemFallbackItems }),
    buildIntegrationCardsGridBlock(page, { items: page.integrationFallbackItems }),
    buildCardsGridBlock(page, {
      variant: 'editorial',
      title: page.features_title,
      items: page.features,
    }),
    buildStepsBlock(page, { items: page.solutionFallbackItems, title: page.solutionFallbackTitle, intro: page.solutionFallbackIntro }),
    buildUseCasesCardsGridBlock(page, { items: page.useCasesFallbackItems, title: page.useCasesFallbackTitle }),
    buildFaqBlock(page),
    buildInternalLinksBlock(page),
    buildFinalCtaBlock(page),
  ]);
}

function buildResourceSections(legacyPage = {}, config = {}) {
  const page = withRouteFallbacks(legacyPage, config);
  const richTextBody = [
    asString(page.problem_intro),
    asString(page.solution_intro),
    asString(page.content_intro),
  ].filter(Boolean).join('\n\n');

  const richText = richTextBody
    ? {
        __component: 'page-blocks.rich-text',
        title: asString(page.content_title) || asString(page.features_title) || 'Основной материал',
        body: richTextBody,
      }
    : null;

  return compactSections([
    buildHeroBlock(page, config),
    richText,
    buildProblemCardsGridBlock(page, { items: page.problemFallbackItems }),
    buildIntegrationCardsGridBlock(page, { items: page.integrationFallbackItems }),
    buildCardsGridBlock(page, {
      variant: 'editorial',
      title: page.features_title,
      items: page.features,
    }),
    buildStepsBlock(page, { items: page.solutionFallbackItems, title: page.solutionFallbackTitle, intro: page.solutionFallbackIntro }),
    buildUseCasesCardsGridBlock(page, { items: page.useCasesFallbackItems, title: page.useCasesFallbackTitle }),
    buildFaqBlock(page),
    buildInternalLinksBlock(page),
    buildFinalCtaBlock(page),
  ]);
}

function buildPricingSections(legacyPage = {}, config = {}) {
  const page = withRouteFallbacks(legacyPage, config);
  return compactSections([
    buildHeroBlock(page, { ...config, heroVariant: 'panel' }),
    buildPricingPlansBlock(page, { items: page.pricingFallbackItems, title: page.pricingFallbackTitle, intro: page.pricingFallbackIntro }),
    buildProblemCardsGridBlock(page, { items: page.problemFallbackItems }),
    buildIntegrationCardsGridBlock(page, { items: page.integrationFallbackItems }),
    buildStepsBlock(page, { items: page.solutionFallbackItems, title: page.solutionFallbackTitle, intro: page.solutionFallbackIntro }),
    buildProofStatsBlock(page),
    buildComparisonTableBlock(page, { rows: page.comparisonFallbackRows, title: page.comparisonFallbackTitle, intro: page.comparisonFallbackIntro }),
    buildBeforeAfterBlock(page, page.beforeAfterFallback || {}),
    buildUseCasesCardsGridBlock(page, { items: page.useCasesFallbackItems, title: page.useCasesFallbackTitle }),
    buildInternalLinksBlock(page),
    buildFaqBlock(page),
    buildFinalCtaBlock(page),
  ]);
}

function buildPartnershipSections(legacyPage = {}, config = {}) {
  const page = withRouteFallbacks(legacyPage, config);
  return compactSections([
    buildHeroBlock(page, config),
    buildProblemCardsGridBlock(page, { items: page.problemFallbackItems }),
    buildIntegrationCardsGridBlock(page, { items: page.integrationFallbackItems }),
    buildCardsGridBlock(page, {
      variant: 'pillars',
      title: page.features_title,
      items: page.features,
    }),
    buildStepsBlock(page, { items: page.solutionFallbackItems, title: page.solutionFallbackTitle, intro: page.solutionFallbackIntro }),
    buildComparisonTableBlock(page, { rows: page.comparisonFallbackRows, title: page.comparisonFallbackTitle, intro: page.comparisonFallbackIntro }),
    buildBeforeAfterBlock(page, page.beforeAfterFallback || {}),
    buildUseCasesCardsGridBlock(page, { items: page.useCasesFallbackItems, title: page.useCasesFallbackTitle }),
    buildFaqBlock(page),
    buildInternalLinksBlock(page),
    buildFinalCtaBlock(page),
  ]);
}

function buildLandingSections(legacyPage = {}, config = {}) {
  const page = withRouteFallbacks(legacyPage, config);
  return compactSections([
    buildHeroBlock(page, config),
    buildProofStatsBlock(page),
    buildCardsGridBlock(page, {
      variant: 'default',
      title: page.problem_title,
      items: page.problems?.length ? page.problems : page.features,
    }),
    buildIntegrationCardsGridBlock(page, { items: page.integrationFallbackItems }),
    buildFeatureListBlock(page),
    buildStepsBlock(page, { items: page.solutionFallbackItems, title: page.solutionFallbackTitle, intro: page.solutionFallbackIntro }),
    buildBeforeAfterBlock(page, page.beforeAfterFallback || {}),
    buildUseCasesCardsGridBlock(page, { items: page.useCasesFallbackItems, title: page.useCasesFallbackTitle }),
    buildFaqBlock(page),
    buildInternalLinksBlock(page),
    buildFinalCtaBlock(page),
  ]);
}

function buildTendersSections(legacyPage = {}, config = {}) {
  const page = withRouteFallbacks(legacyPage, config);
  return compactSections([
    buildHeroBlock(page, { ...config, heroVariant: 'panel' }),
    buildCardsGridBlock(page, {
      variant: 'problems',
      title: page.problem_title,
      items: page.problems,
    }),
    buildIntegrationCardsGridBlock(page, { items: page.integrationFallbackItems }),
    buildStepsBlock(page, { items: page.solutionFallbackItems, title: page.solutionFallbackTitle, intro: page.solutionFallbackIntro }),
    buildFeatureListBlock(page),
    buildBeforeAfterBlock(page, page.beforeAfterFallback || {}),
    buildUseCasesCardsGridBlock(page, { items: page.useCasesFallbackItems, title: page.useCasesFallbackTitle }),
    buildComparisonTableBlock(page, { rows: page.comparisonFallbackRows, title: page.comparisonFallbackTitle, intro: page.comparisonFallbackIntro }),
    buildFaqBlock(page),
    buildInternalLinksBlock(page),
    buildFinalCtaBlock(page),
  ]);
}

export const LEGACY_MANAGED_WAVES = Object.freeze({
  wave1: [
    '/promo',
    '/prozorro',
    '/media',
    '/team',
    '/conversation',
    '/tv',
    '/docs',
    '/help',
    '/academy',
    '/blog',
    '/status',
  ],
  wave2: ['/pricing', '/partnership'],
  wave3: ['/', '/demo', '/solutions/tenders'],
});

export const LEGACY_MANAGED_ROUTE_CONFIGS = Object.freeze([
  {
    routePath: '/promo',
    wave: 'wave1',
    legacySource: { endpoint: 'landing-pages', slug: 'promo' },
    blueprint: 'campaign',
    pageKind: 'campaign',
    templateVariant: 'showcase',
    navGroup: 'special',
    navLabel: 'Промо',
    navDescription: 'Спецстраница для маркетингового оффера и быстрого запуска.',
    navOrder: 10,
    showInHeader: false,
    showInFooter: true,
    showInSitemap: true,
    sectionBuilder: buildCampaignSections,
  },
  {
    routePath: '/prozorro',
    wave: 'wave1',
    legacySource: { endpoint: 'landing-pages', slug: 'prozorro' },
    blueprint: 'campaign',
    pageKind: 'campaign',
    templateVariant: 'showcase',
    navGroup: 'special',
    navLabel: 'Prozorro',
    navDescription: 'Сценарий для работы с закупками и тендерами.',
    navOrder: 20,
    showInHeader: false,
    showInFooter: true,
    showInSitemap: true,
    sectionBuilder: buildCampaignSections,
  },
  {
    routePath: '/media',
    wave: 'wave1',
    legacySource: { endpoint: 'landing-pages', slug: 'media' },
    blueprint: 'brand',
    pageKind: 'brand',
    templateVariant: 'showcase',
    navGroup: 'company',
    navLabel: 'Медиа',
    navDescription: 'Медиаматериалы, презентации и публичные ресурсы команды.',
    navOrder: 10,
    showInHeader: false,
    showInFooter: true,
    showInSitemap: true,
    sectionBuilder: buildBrandSections,
  },
  {
    routePath: '/team',
    wave: 'wave1',
    legacySource: { endpoint: 'landing-pages', slug: 'team' },
    blueprint: 'brand',
    pageKind: 'brand',
    templateVariant: 'showcase',
    navGroup: 'company',
    navLabel: 'Команда',
    navDescription: 'Кто стоит за Chat Plus и как с нами связаться.',
    navOrder: 20,
    showInHeader: false,
    showInFooter: true,
    showInSitemap: true,
    sectionBuilder: buildBrandSections,
  },
  {
    routePath: '/conversation',
    wave: 'wave1',
    legacySource: { endpoint: 'landing-pages', slug: 'conversation' },
    blueprint: 'brand',
    pageKind: 'brand',
    templateVariant: 'showcase',
    navGroup: 'company',
    navLabel: 'Диалоги',
    navDescription: 'Подход Chat Plus к клиентским диалогам как к системе.',
    navOrder: 30,
    showInHeader: false,
    showInFooter: true,
    showInSitemap: true,
    sectionBuilder: buildBrandSections,
  },
  {
    routePath: '/tv',
    wave: 'wave1',
    legacySource: { endpoint: 'landing-pages', slug: 'tv' },
    blueprint: 'brand',
    pageKind: 'brand',
    templateVariant: 'showcase',
    navGroup: 'company',
    navLabel: 'Видео',
    navDescription: 'Демо, разборы интерфейса и визуальный слой продукта.',
    navOrder: 40,
    showInHeader: false,
    showInFooter: true,
    showInSitemap: true,
    sectionBuilder: buildBrandSections,
  },
  {
    routePath: '/docs',
    wave: 'wave1',
    legacySource: { endpoint: 'landing-pages', slug: 'docs' },
    blueprint: 'resource',
    pageKind: 'resource',
    templateVariant: 'editorial',
    navGroup: 'resources',
    navLabel: 'Документация',
    navDescription: 'Документация, материалы и продуктовые инструкции.',
    navOrder: 10,
    showInHeader: false,
    showInFooter: true,
    showInSitemap: true,
    sectionBuilder: buildResourceSections,
  },
  {
    routePath: '/help',
    wave: 'wave1',
    legacySource: { endpoint: 'landing-pages', slug: 'help' },
    blueprint: 'resource',
    pageKind: 'resource',
    templateVariant: 'editorial',
    navGroup: 'resources',
    navLabel: 'Помощь',
    navDescription: 'Справка и вспомогательные материалы по запуску.',
    navOrder: 20,
    showInHeader: false,
    showInFooter: true,
    showInSitemap: true,
    sectionBuilder: buildResourceSections,
  },
  {
    routePath: '/academy',
    wave: 'wave1',
    legacySource: { endpoint: 'landing-pages', slug: 'academy' },
    blueprint: 'resource',
    pageKind: 'resource',
    templateVariant: 'editorial',
    navGroup: 'resources',
    navLabel: 'Академия',
    navDescription: 'Обучающий раздел по внедрению и сценариям.',
    navOrder: 30,
    showInHeader: false,
    showInFooter: true,
    showInSitemap: true,
    sectionBuilder: buildResourceSections,
  },
  {
    routePath: '/blog',
    wave: 'wave1',
    legacySource: { endpoint: 'landing-pages', slug: 'blog' },
    blueprint: 'resource',
    pageKind: 'resource',
    templateVariant: 'editorial',
    navGroup: 'resources',
    navLabel: 'Блог',
    navDescription: 'Контент-маркетинг, кейсы и материалы команды.',
    navOrder: 40,
    showInHeader: false,
    showInFooter: true,
    showInSitemap: true,
    sectionBuilder: buildResourceSections,
  },
  {
    routePath: '/status',
    wave: 'wave1',
    legacySource: { endpoint: 'landing-pages', slug: 'status' },
    blueprint: 'resource',
    pageKind: 'resource',
    templateVariant: 'editorial',
    navGroup: 'resources',
    navLabel: 'Статус',
    navDescription: 'Служебная страница статуса и доступности платформы.',
    navOrder: 50,
    showInHeader: false,
    showInFooter: true,
    showInSitemap: true,
    sectionBuilder: buildResourceSections,
  },
  {
    routePath: '/pricing',
    wave: 'wave2',
    legacySource: { endpoint: 'landing-pages', slug: 'pricing' },
    blueprint: 'landing',
    pageKind: 'landing',
    templateVariant: 'default',
    navGroup: 'product',
    navLabel: 'Цены',
    navDescription: 'Тарифы, коммерческая модель и формат запуска.',
    navOrder: 10,
    showInHeader: true,
    showInFooter: true,
    showInSitemap: true,
    sectionBuilder: buildPricingSections,
  },
  {
    routePath: '/partnership',
    wave: 'wave2',
    legacySource: { endpoint: 'landing-pages', slug: 'partnership' },
    blueprint: 'landing',
    pageKind: 'landing',
    templateVariant: 'default',
    navGroup: 'product',
    navLabel: 'Партнерам',
    navDescription: 'Программа для агентств, интеграторов и реселлеров.',
    navOrder: 20,
    showInHeader: true,
    showInFooter: true,
    showInSitemap: true,
    sectionBuilder: buildPartnershipSections,
  },
  {
    routePath: '/',
    wave: 'wave3',
    legacySource: { endpoint: 'landing-pages', slug: 'home' },
    blueprint: 'landing',
    pageKind: 'landing',
    templateVariant: 'default',
    navGroup: 'primary',
    navLabel: 'Главная',
    navDescription: 'Главная страница продукта и вход в экосистему Chat Plus.',
    navOrder: 0,
    showInHeader: false,
    showInFooter: false,
    showInSitemap: true,
    sectionBuilder: buildLandingSections,
  },
  {
    routePath: '/demo',
    wave: 'wave3',
    legacySource: { endpoint: 'landing-pages', slug: 'demo' },
    blueprint: 'landing',
    pageKind: 'landing',
    templateVariant: 'default',
    navGroup: 'product',
    navLabel: 'Демо',
    navDescription: 'Запись на демонстрацию и быстрый старт с командой.',
    navOrder: 15,
    showInHeader: false,
    showInFooter: true,
    showInSitemap: true,
    sectionBuilder: buildLandingSections,
  },
  {
    routePath: '/solutions/tenders',
    wave: 'wave3',
    legacySource: { endpoint: 'tenders-page', slug: 'tenders' },
    blueprint: 'landing',
    pageKind: 'landing',
    templateVariant: 'default',
    navGroup: 'product',
    navLabel: 'Тендеры',
    navDescription: 'Сценарий работы с тендерами, закупками и командными реакциями.',
    navOrder: 30,
    showInHeader: false,
    showInFooter: true,
    showInSitemap: true,
    sectionBuilder: buildTendersSections,
  },
]);

export function getLegacyManagedRouteConfig(routePath = '') {
  const normalized = normalizePageV2RoutePath(routePath);
  const config = LEGACY_MANAGED_ROUTE_CONFIGS.find((item) => item.routePath === normalized);

  if (!config) {
    throw new Error(`Unknown legacy managed route: ${normalized}`);
  }

  return config;
}

export function listLegacyManagedRoutesByWave(wave = '') {
  return [...(LEGACY_MANAGED_WAVES[wave] || [])];
}

export function buildLegacyManagedPageDraft({ routePath, legacyPage = {}, overrides = {} }) {
  const config = getLegacyManagedRouteConfig(routePath);
  const title = buildTitle(legacyPage, config.navLabel || routeSlug(config.routePath));
  const seoDescription = buildSeoDescription(
    legacyPage,
    `${title} в новом manual-first page layer Chat Plus.`,
  );
  const sections = config.sectionBuilder(legacyPage, config);
  const layoutFamily = layoutFamilyForConfig(config);
  const parity = validatePageV2LayoutParity({
    family: layoutFamily,
    routePath: config.routePath,
    sections,
    templateVariant: config.templateVariant,
  });
  const breadcrumbs = asArray(legacyPage.breadcrumb)
    .map((item) => {
      if (typeof item === 'string') {
        return { label: item, href: item === 'Главная' ? '/' : '' };
      }

      return {
        label: asString(item.label) || asString(item.title),
        href: normalizePageV2RoutePath(asString(item.href) || asString(item.url)),
      };
    })
    .filter((item) => item.label);
  const internalLinks = asArray(legacyPage.internal_links)
    .map((item) => ({
      label: asString(item.label) || asString(item.title),
      href: normalizePageV2RoutePath(asString(item.href) || asString(item.url)),
      description: asString(item.description),
    }))
    .filter((item) => item.label && item.href && item.href !== '/');

  return {
    config,
    data: {
      title,
      slug: slugify(asString(legacyPage.slug) || routeSlug(config.routePath)) || routeSlug(config.routePath),
      route_path: config.routePath,
      locale: 'ru',
      page_kind: config.pageKind,
      template_variant: config.templateVariant,
      generation_mode: 'manual',
      source_mode: 'managed',
      editorial_status: 'approved',
      migration_ready: false,
      parity_status: parity.status,
      legacy_template_family: layoutFamily,
      legacy_layout_signature: parity.signature,
      parity_notes: {
        errors: parity.errors,
        missing_blocks: parity.missing_blocks,
      },
      seo_title: buildSeoTitle(legacyPage, title),
      seo_description: seoDescription,
      canonical: asString(legacyPage.canonical),
      robots: asString(legacyPage.robots) || 'index,follow',
      nav_group: config.navGroup,
      nav_label: config.navLabel,
      nav_description: config.navDescription,
      nav_order: config.navOrder,
      show_in_header: config.showInHeader,
      show_in_footer: config.showInFooter,
      show_in_sitemap: config.showInSitemap,
      breadcrumbs,
      internal_links: internalLinks,
      sections,
      ...overrides,
    },
  };
}

export function buildManagedPageDraftFromExistingPage({ routePath, existingPage = {}, overrides = {} }) {
  const config = getLegacyManagedRouteConfig(routePath);
  const layoutFamily = asString(existingPage.legacy_template_family) || layoutFamilyForConfig(config);
  const title = asString(existingPage.title, config.navLabel || routeSlug(config.routePath));
  const templateVariant = asString(existingPage.template_variant, config.templateVariant);
  const sections = cloneJson(asArray(existingPage.sections), []);
  const parity = validatePageV2LayoutParity({
    family: layoutFamily,
    routePath: config.routePath,
    sections,
    templateVariant,
  });

  return {
    config,
    data: {
      title,
      slug: slugify(asString(existingPage.slug) || routeSlug(config.routePath)) || routeSlug(config.routePath),
      route_path: config.routePath,
      locale: asString(existingPage.locale, 'ru'),
      page_kind: asString(existingPage.page_kind, config.pageKind),
      template_variant: templateVariant,
      generation_mode: asString(existingPage.generation_mode, 'manual'),
      source_mode: asString(existingPage.source_mode, 'managed'),
      editorial_status: asString(existingPage.editorial_status, 'approved'),
      migration_ready: asBoolean(existingPage.migration_ready, false),
      parity_status: asString(existingPage.parity_status, parity.status),
      legacy_template_family: layoutFamily,
      legacy_layout_signature: parity.signature,
      parity_notes: {
        ...(existingPage.parity_notes && typeof existingPage.parity_notes === 'object'
          ? cloneJson(existingPage.parity_notes, {})
          : {}),
        errors: parity.errors,
        missing_blocks: parity.missing_blocks,
      },
      seo_title: asString(existingPage.seo_title, title),
      seo_description: asString(
        existingPage.seo_description,
        `${title} в новом manual-first page layer Chat Plus.`,
      ),
      canonical: asString(existingPage.canonical),
      robots: asString(existingPage.robots) || 'index,follow',
      nav_group: asString(existingPage.nav_group, config.navGroup),
      nav_label: asString(existingPage.nav_label, config.navLabel),
      nav_description: asString(existingPage.nav_description, config.navDescription),
      nav_order: asNumber(existingPage.nav_order, config.navOrder),
      show_in_header: asBoolean(existingPage.show_in_header, config.showInHeader),
      show_in_footer: asBoolean(existingPage.show_in_footer, config.showInFooter),
      show_in_sitemap: asBoolean(existingPage.show_in_sitemap, config.showInSitemap),
      breadcrumbs: cloneJson(asArray(existingPage.breadcrumbs), []),
      internal_links: cloneJson(asArray(existingPage.internal_links), []),
      sections,
      ...overrides,
    },
  };
}
