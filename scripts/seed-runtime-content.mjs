import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function loadEnv() {
  try {
    const env = readFileSync(resolve('.env'), 'utf-8');
    return Object.fromEntries(
      env
        .split(/\r?\n/)
        .filter(Boolean)
        .filter(line => !line.trim().startsWith('#'))
        .map(line => {
          const index = line.indexOf('=');
          return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
        })
    );
  } catch {
    return {};
  }
}

function loadArrayFromJson(relativePath) {
  const generatedPath = relativePath.replace('cms/seed/', 'cms/seed/generated/');
  if (existsSync(resolve(generatedPath))) {
    console.log(`
→ Используем generated JSON: ${generatedPath}`);
    return JSON.parse(readFileSync(resolve(generatedPath), 'utf-8'));
  }
  return JSON.parse(readFileSync(resolve(relativePath), 'utf-8'));
}

function loadJsonIfExists(relativePath) {
  if (!existsSync(resolve(relativePath))) {
    return null;
  }

  console.log(`
→ Используем managed JSON: ${relativePath}`);
  return JSON.parse(readFileSync(resolve(relativePath), 'utf-8'));
}

function hasStructuredSeoFields(item = {}) {
  return Boolean(
    item.h1 ||
    item.subtitle ||
    item.problem_title ||
    item.solution_title ||
    item.sticky_cta_title
  );
}

function normalizeFaqItems(items = []) {
  return items
    .filter(Boolean)
    .map((item) => ({
      q: item.q || item.question || '',
      a: item.a || item.answer || '',
    }))
    .filter((item) => item.q && item.a);
}

function normalizeStepItems(items = []) {
  return items
    .filter(Boolean)
    .map((item, index) => ({
      step: String(index + 1),
      title: item.title || `Step ${index + 1}`,
      desc: item.desc || item.text || item.description || '',
    }))
    .filter((item) => item.title || item.desc);
}

function normalizeRoiItems(items = []) {
  return items
    .filter(Boolean)
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }

      return [item.value, item.label, item.text].filter(Boolean).join(' - ');
    })
    .filter(Boolean);
}

function buildStructuredContent(item = {}) {
  const blocks = [];

  const pushText = (value) => {
    if (typeof value === 'string' && value.trim()) {
      blocks.push(value.trim());
    }
  };

  const pushList = (items = []) => {
    items.forEach((value) => {
      if (typeof value === 'string' && value.trim()) {
        blocks.push(`- ${value.trim()}`);
      }
    });
  };

  const pushCardList = (items = []) => {
    items.forEach((entry) => {
      const title = entry?.title || entry?.question || '';
      const text = entry?.text || entry?.answer || '';

      if (title) {
        blocks.push(`### ${title}`);
      }

      pushText(text);
    });
  };

  if (item.h1) {
    blocks.push(`# ${item.h1}`);
  }

  pushText(item.subtitle);

  if (item.problem_title) {
    blocks.push(`## ${item.problem_title}`);
  }
  pushText(item.problem_intro);
  pushCardList(item.problems);

  if (item.solution_title) {
    blocks.push(`## ${item.solution_title}`);
  }
  pushText(item.solution_intro);
  pushCardList(item.solution_steps);

  if (item.features_title) {
    blocks.push(`## ${item.features_title}`);
  }
  pushCardList(item.features);

  if (item.roi_title) {
    blocks.push(`## ${item.roi_title}`);
  }
  pushList(item.roi_without_items);
  pushList(item.roi_with_items);
  pushText(item.roi_quote);

  if (Array.isArray(item.faqs) && item.faqs.length) {
    blocks.push('## FAQ');
    pushCardList(item.faqs);
  }

  if (item.sticky_cta_title) {
    blocks.push(`## ${item.sticky_cta_title}`);
  }
  pushText(item.sticky_cta_text);

  return blocks.join('\n\n').trim();
}

function prepareStructuredSeedItem(endpoint, item) {
  if (!hasStructuredSeoFields(item)) {
    return item;
  }

  const base = {
    slug: item.slug,
    name: item.name,
    emoji: item.emoji || '',
    icon: item.icon || '',
    description: item.description || item.subtitle || '',
    h1: item.h1 || item.name || '',
    subtitle: item.subtitle || item.description || '',
    problem_title: item.problem_title || '',
    problem_intro: item.problem_intro || item.pain || '',
    problems: Array.isArray(item.problems) ? item.problems : [],
    solution_title: item.solution_title || '',
    solution_intro: item.solution_intro || item.solution || '',
    solution_steps: Array.isArray(item.solution_steps) ? item.solution_steps : (Array.isArray(item.steps) ? item.steps : []),
    features_title: item.features_title || '',
    features: Array.isArray(item.features) ? item.features : [],
    roi_title: item.roi_title || '',
    roi_without_items: Array.isArray(item.roi_without_items) ? item.roi_without_items : [],
    roi_with_items: Array.isArray(item.roi_with_items) ? item.roi_with_items : [],
    roi_quote: item.roi_quote || '',
    faq_title: item.faq_title || 'FAQ',
    sticky_cta_title: item.sticky_cta_title || '',
    sticky_cta_text: item.sticky_cta_text || '',
    cta: item.cta || '',
    seo_title: item.seo_title || (item.h1 ? `${item.h1} | Chat Plus` : ''),
    seo_description: item.seo_description || item.subtitle || item.description || '',
    faq: normalizeFaqItems(item.faq || item.faqs || []),
    content: buildStructuredContent(item),
  };

  // Backwards compatibility
  if (endpoint === 'channels' || endpoint === 'industries' || endpoint === 'solutions') {
    base.roi_metrics = normalizeRoiItems(item.roi_metrics || item.roi_with_items || []);
  }

  if (endpoint === 'channels' || endpoint === 'solutions') {
    base.steps = normalizeStepItems(item.steps || item.solution_steps || []);
  }

  if (endpoint === 'industries' || endpoint === 'solutions') {
    base.pain = base.problem_intro;
    base.solution = base.solution_intro;
  }

  return base;
}

function prepareCollectionItem(endpoint, item) {
  const stripReservedKeys = value => {
    if (Array.isArray(value)) {
      return value.map(stripReservedKeys);
    }

    if (value && typeof value === 'object') {
      const {
        id,
        documentId,
        createdAt,
        updatedAt,
        publishedAt,
        ...rest
      } = value;

      return Object.fromEntries(
        Object.entries(rest).map(([key, nested]) => [key, stripReservedKeys(nested)])
      );
    }

    return value;
  };

  if (
    endpoint === 'channels' ||
    endpoint === 'industries' ||
    endpoint === 'solutions' ||
    endpoint === 'integrations' ||
    endpoint === 'features'
  ) {
    return prepareStructuredSeedItem(endpoint, item);
  }

  if (endpoint === 'business-types') {
    const { sticky_cta_title, sticky_cta_text, ...rest } = item;
    return stripReservedKeys(rest);
  }

  return stripReservedKeys(item);
}

const env = loadEnv();
const STRAPI_URL = env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = env.STRAPI_TOKEN || '';
const now = new Date().toISOString();

if (!STRAPI_TOKEN) {
  console.error('STRAPI_TOKEN not found in .env');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${STRAPI_TOKEN}`,
};

async function request(path, init = {}) {
  const res = await fetch(`${STRAPI_URL}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers || {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${init.method || 'GET'} ${path} failed: ${res.status} ${JSON.stringify(json)}`);
  }
  return json;
}

async function upsertCollection(endpoint, item) {
  const preparedItem = prepareCollectionItem(endpoint, item);
  const found = await request(`/api/${endpoint}?filters[slug][$eq]=${encodeURIComponent(preparedItem.slug)}`);
  const existing = found.data?.[0];
  const data = { ...preparedItem, publishedAt: now };
  if (existing) {
    const key = existing.documentId || existing.id;
    await request(`/api/${endpoint}/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ data }),
    });
    return 'updated';
  }
  await request(`/api/${endpoint}`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
  return 'created';
}

async function upsertSingle(endpoint, data) {
  const stripReservedKeys = value => {
    if (Array.isArray(value)) {
      return value.map(stripReservedKeys);
    }

    if (value && typeof value === 'object') {
      const {
        id,
        documentId,
        createdAt,
        updatedAt,
        publishedAt,
        ...rest
      } = value;

      return Object.fromEntries(
        Object.entries(rest).map(([key, nested]) => [key, stripReservedKeys(nested)])
      );
    }

    return value;
  };

  await request(`/api/${endpoint}`, {
    method: 'PUT',
    body: JSON.stringify({ data: { ...stripReservedKeys(data), publishedAt: now } }),
  });
}

async function seedCollection(endpoint, items) {
  console.log(`\n${endpoint}: ${items.length}`);
  for (const item of items) {
    const action = await upsertCollection(endpoint, item);
    console.log(`- ${action} ${item.slug}`);
  }
}

const channelEmoji = {
  whatsapp: '💬',
  telegram: 'вњ€пёЏ',
  viber: '📳',
  instagram: '📸',
  sms: '📱',
  email: '📧',
  voip: '📞',
};

const industryEmoji = {
  beauty: '💅',
  med: '🩺',
  fitness: '💪',
  horeca: '🍽️',
  'real-estate': '🏠',
  hr: '👥',
  education: '🎓',
  auto: '🚗',
  travel: 'вњ€пёЏ',
  insurance: '🛡️',
  legal: 'вљ–пёЏ',
  logistics: '🚚',
  retail: '🛍️',
};

const channels = loadArrayFromJson('cms/seed/channels.json').map(item => ({
  ...item,
  emoji: channelEmoji[item.slug] || '',
}));

const industries = loadArrayFromJson('cms/seed/industries.json').map(item => ({
  ...item,
  emoji: item.emoji || industryEmoji[item.slug] || '',
}));

const integrations = loadArrayFromJson('cms/seed/integrations.json');
const features = loadArrayFromJson('cms/seed/features.json');
const solutions = loadArrayFromJson('cms/seed/solutions.json');

const businessTypes = loadArrayFromJson('cms/seed/businessTypes.json').map(item => ({
  ...item,
  hero_eyebrow: item.hero_eyebrow || 'Chat Plus для',
  hero_title: `Chat Plus для ${item.name}`,
  hero_secondary_cta_label: item.hero_secondary_cta_label || 'Как это работает',
  hero_secondary_cta_url: item.hero_secondary_cta_url || '#how',
  problem_title: `Типичная проблема ${item.name}`,
  problem_points: item.problem_points || [
    'Клиенты пишут в разные каналы — команда теряет заявки и контекст.',
    'Ответы занимают часы, конкуренты отвечают быстрее.',
    'Рост обращений означает рост штата и расходов.'
  ],
  solution_title: `Chat Plus для ${item.name}`,
  solution_points: item.solution_points || [
    'Все каналы собираются в одном окне и не теряются.',
    'AI отвечает мгновенно и разгружает команду.',
    'Автоматизация масштабирует процесс без роста операционных затрат.'
  ],
  features_title: item.features_title || 'Что включено',
  steps_title: 'Как запустить за 15 минут',
  steps: item.steps || [
    { step: '1', title: 'Подключите каналы', desc: 'WhatsApp, Telegram, Instagram и другие каналы подключаются в одном окне Chat Plus.' },
    { step: '2', title: 'Настройте под бизнес', desc: `Готовые сценарии и шаблоны для ${item.name} запускаются без разработки.` },
    { step: '3', title: 'Включите AI', desc: 'AI отвечает 24/7, квалифицирует лиды и автоматизирует рутину.' },
    { step: '4', title: 'Масштабируйте', desc: 'Фиксированная модель работы позволяет расти без роста хаоса.' }
  ],
  integrations_title: item.integrations_title || 'Работает с вашими инструментами',
  integrations_intro: item.integrations_intro || 'Подключите привычные сервисы и сохраните текущий процесс.',
  integrations: item.integrations || [
    { name: 'WhatsApp', icon: 'simple-icons:whatsapp', href: '/channels/whatsapp' },
    { name: 'Telegram', icon: 'simple-icons:telegram', href: '/channels/telegram' },
    { name: 'AmoCRM', icon: 'lucide:link', href: '/integrations/amocrm' },
    { name: 'Bitrix24', icon: 'lucide:building-2', href: '/integrations/bitrix24' },
    { name: 'HubSpot', icon: 'simple-icons:hubspot', href: '/integrations/hubspot' },
    { name: 'Zapier', icon: 'simple-icons:zapier', href: '/integrations/zapier' }
  ],
  integrations_more_text: item.integrations_more_text || 'Также доступны Instagram, Viber, SMS, Salesforce, Pipedrive, n8n и другие интеграции.',
  roi_title: item.roi_title || 'Результаты клиентов Chat Plus',
  roi_intro: item.roi_intro || 'Средние метрики после внедрения и настройки сценариев.',
  roi_metrics: item.roi_metrics || [
    { icon: 'lucide:zap', value: '15 мин', label: 'до первого запуска' },
    { icon: 'lucide:trending-up', value: '+35%', label: 'рост конверсии из обращений' },
    { icon: 'lucide:clock', value: '-60%', label: 'снижение нагрузки на команду' },
    { icon: 'lucide:dollar-sign', value: '×3', label: 'ROI за первые 90 дней' }
  ],
  roi_quote: item.roi_quote || 'Внедрение занимает день, а команда перестаёт тонуть в переписках уже на старте.',
  roi_quote_author: `Клиент Chat Plus · ${item.name}`,
  faq_title: item.faq_title || 'Частые вопросы',
  faq: item.faq || [
    { q: `Подходит ли Chat Plus для ${item.name}?`, a: `Да. Решение адаптируется под процессы ${item.name} и запускается без отдельной разработки.` },
    { q: 'Какие каналы поддерживаются?', a: 'WhatsApp Business API, Telegram, Instagram Direct, Viber, SMS, Email и VoIP.' },
    { q: 'Какие интеграции есть?', a: 'AmoCRM, Bitrix24, HubSpot, Salesforce, Pipedrive, Google Calendar и другие сервисы.' },
    { q: 'Есть ли тестовый период?', a: 'Да, можно начать с пилота и проверить сценарии на реальных обращениях.' },
    { q: `Сколько стоит Chat Plus для ${item.name}?`, a: 'Стоимость зависит от сценариев и подключений, но модель остаётся заметно дешевле тяжёлых enterprise-решений.' }
  ],
  related_types_title: item.related_types_title || 'Другие типы бизнеса',
  related_links_intro: item.related_links_intro || 'Смежные сценарии по отраслям и каналам.',
  pricing_link_label: item.pricing_link_label || 'Цены →',
  final_cta_title: 'Запустите Chat Plus в своём процессе',
  final_cta_text: 'Подключение занимает минуты, а основной контент и сценарии уже готовы для запуска.',
  final_cta_label: item.final_cta_label || item.cta,
}));

const competitors = loadArrayFromJson('cms/seed/competitors.json').map(item => ({
  slug: item.slug,
  name: item.name,
  price: item.price,
  our_price: item.our_price || item.ourPrice,
  seo_title: item.seo_title || `Chat Plus vs ${item.name} — сравнение`,
  seo_description: `Сравнение Chat Plus и ${item.name}: цены, функции, различия и итоговый вывод.`,
  eyebrow: item.eyebrow || 'Сравнение',
  hero_title: item.hero_title || `Chat Plus vs ${item.name}`,
  hero_description: item.hero_description || item.verdict,
  pricing_title: item.pricing_title || 'Сравнение цен',
  our_price_label: item.our_price_label || 'Chat Plus',
  our_price_caption: item.our_price_caption || 'Фиксированная цена',
  competitor_price_caption: item.competitor_price_caption || '+ скрытые платежи',
  strengths_title: item.strengths_title || '✓ Преимущества Chat Plus',
  weaknesses_title: `✕ Слабые стороны ${item.name}`,
  our_strengths: item.our_strengths || item.ourStrengths,
  weaknesses: item.weaknesses,
  final_cta_title: item.final_cta_title || `Переходите с ${item.name} на Chat Plus`,
  final_cta_text: item.final_cta_text || 'Поможем перенести процессы и собрать рабочий пилот без затяжного внедрения.',
  final_cta_label: item.final_cta_label || 'Попробовать бесплатно'
}));

const businessTypesPage = {
  meta_title: 'Chat Plus для бизнеса',
  meta_description: 'B2B, B2C, enterprise, SMB, агентства и маркетплейсы — подберите сценарий Chat Plus под ваш тип бизнеса.',
  hero_title: 'Chat Plus для вашего типа бизнеса',
  hero_description: 'От стартапа до enterprise — страницы и сценарии под разные модели бизнеса с единым управлением через Strapi.',
  hero_cta_label: 'Попробовать бесплатно'
};

const tendersPage = {
  meta_title: 'Chat Plus Tenders — AI-уведомления о тендерах в мессенджерах',
  meta_description: 'Мгновенные уведомления о тендерах по 44-ФЗ и 223-ФЗ прямо в WhatsApp, Telegram и CRM. AI анализирует документацию, напоминает о дедлайнах и помогает не пропустить закупки.',
  h1: 'Chat Plus Tenders — превращаем тендеры из рутины в конвейер побед',
  subtitle: 'Ваши конкуренты проиграли не потому, что предложили цену выше. Они просто не увидели тендер вовремя. Chat Plus доставляет уведомления о релевантных закупках прямо в WhatsApp, Telegram или CRM вашей команды — за секунды после публикации.',
  canonical: 'https://chatplus.com/solutions/tenders',
  hreflang_ru: 'https://chatplus.com/ru/solutions/tenders',
  hreflang_uk: 'https://chatplus.com/uk/solutions/tenders',
  hreflang_en: 'https://chatplus.com/en/solutions/tenders',
  breadcrumb: ['Главная', 'Решения', 'Тендеры и госзакупки'],
  schema_type: 'SoftwareApplication',
  target_keywords: [
    'уведомления о тендерах в мессенджер',
    'автоматизация госзакупок',
    'тендеры whatsapp telegram',
    'мониторинг закупок CRM',
    '44-ФЗ 223-ФЗ уведомления'
  ],
  word_count: 2200,
  hero_cta_primary_label: 'Попробовать бесплатно',
  hero_cta_primary_url: '/demo',
  hero_cta_secondary_label: 'Заказать демо для тендерного отдела',
  hero_cta_secondary_url: '/demo',
  hero_trust_facts: [
    '20 000+ новых закупок ежедневно на площадках РФ и СНГ',
    '70% проигрышей в тендерах — из-за пропущенных сроков, а не из-за цены',
    '327 000 торгов в 2025 году остались вообще без заявок'
  ],
  problem_title: 'Почему тендерные отделы теряют деньги',
  problem_intro: 'Рынок государственных и коммерческих закупок в России — это десятки тысяч новых торгов каждый день, разбросанных по сотням площадок. Именно поэтому ручной мониторинг перестал работать.',
  problems: [
    { title: 'Проблема 1: Информационный шум', text: 'Менеджер мониторит сразу несколько площадок, получает десятки писем и тонет в нерелевантных уведомлениях.' },
    { title: 'Проблема 2: Дедлайны горят незаметно', text: 'Изменения в документации и переносы сроков обнаруживаются слишком поздно — иногда через письма, попавшие в спам.' },
    { title: 'Проблема 3: Команда работает вслепую', text: 'Руководитель не видит, кто отвечает за тендер и на каком этапе находится подготовка заявки.' },
    { title: 'Проблема 4: Агрегаторы дорогие и негибкие', text: 'Подписка на сервис есть, но уведомления приходят с задержкой, а CRM и дедлайны живут отдельно.' }
  ],
  problem_summary: 'Компании теряют не потому, что их предложение хуже. Они теряют потому, что информация приходит слишком поздно, в неудобном формате и без привязки к рабочему процессу.',
  solution_title: 'Как Chat Plus решает задачи тендерного отдела',
  solution_intro: 'Chat Plus — не замена тендерного агрегатора, а коммуникационный и автоматизационный слой поверх него.',
  solution_steps: [
    { title: 'Шаг 1. Подключение источников', text: 'Через API, webhook, RSS или email-парсинг вы подключаете текущий агрегатор и начинаете получать данные в реальном времени.' },
    { title: 'Шаг 2. AI-фильтрация и обогащение', text: 'AI сопоставляет тендер с ключевыми словами, ОКПД2, регионами и бюджетом, отсеивает лишнее и добавляет короткое резюме.' },
    { title: 'Шаг 3. Мгновенная доставка в мессенджеры', text: 'Релевантный тендер приходит в Telegram или WhatsApp через секунды после публикации, а не через часы.' },
    { title: 'Шаг 4. Автоматическая карточка в CRM', text: 'В CRM сразу создаётся карточка с номером тендера, ФЗ, НМЦК, дедлайнами и ссылками на документацию.' },
    { title: 'Шаг 5. Умные напоминания', text: 'Ключевые даты автоматически попадают в календарь и напоминают команде о дедлайнах каскадом.' },
    { title: 'Шаг 6. Командная работа', text: 'Переписка, назначение ответственных и статусы ведутся прямо в одном канале или чате.' }
  ],
  features_title: '5 фич Chat Plus, которые меняют работу с тендерами',
  features: [
    { title: '1. Мгновенные уведомления в Telegram и WhatsApp', text: 'Команда получает уведомления в том канале, который уже открыт, а не в отдельном приложении или почте.' },
    { title: '2. AI-анализ тендерной документации', text: 'AI читает приложения и выдаёт короткое человеческое резюме: требования, риски, сертификаты, лицензии.' },
    { title: '3. Автоматическое создание карточек в CRM', text: 'Каждый релевантный тендер превращается в сделку с уже заполненными полями и ссылками.' },
    { title: '4. Дедлайн-трекинг через AI Calendar', text: 'Все ключевые даты уходят в календарь и автоматически обновляются при изменениях у заказчика.' },
    { title: '5. Аналитическая панель по воронке тендеров', text: 'Руководитель видит сколько тендеров в работе, сколько заявок подано и какой win rate получается по периодам.' }
  ],
  integrations_title: 'С чем работает Chat Plus Tenders',
  integration_blocks: [
    { label: 'Мессенджеры', text: 'Telegram, WhatsApp Business API, Viber и веб-чат для доставки уведомлений.' },
    { label: 'CRM', text: 'AmoCRM, Bitrix24, HubSpot, Salesforce, Pipedrive, 1C:CRM.' },
    { label: 'Тендерные агрегаторы', text: 'Контур.Закупки, РосТендер, Синапс, СБИС Торги, TenderPlan и другие источники данных.' },
    { label: 'Календари', text: 'Google Calendar, Microsoft Outlook, Яндекс.Календарь и CalDAV-совместимые решения.' },
    { label: 'Автоматизация', text: 'Zapier, Make, n8n и прямой Chat Plus API для кастомных workflow.' }
  ],
  roi_title: 'Экономика: сколько стоит пропущенный тендер',
  roi_intro: 'Даже при умеренной тендерной активности одна пропущенная возможность быстро перекрывает стоимость подписки.',
  roi_without_items: [
    '2–3 тендера в месяц пропускаются из-за поздних уведомлений или неотслеженных изменений',
    '1 проигрыш из-за ошибки в документации, которую не заметили вовремя',
    'Менеджер тратит около 2 часов в день на ручной мониторинг площадок',
    'Итого потери: 1–2 контракта в квартал и 2–4 млн ₽ упущенной выручки'
  ],
  roi_with_items: [
    '0 пропущенных тендеров за счёт мгновенных уведомлений и AI-фильтрации',
    'AI-анализ документации снижает количество ошибок на 60–80%',
    'Менеджер экономит около 1.5 часов в день',
    'Подписка Chat Plus начинается от 4 900 ₽ в месяц',
    'ROI достигает x40–80 от стоимости подписки'
  ],
  roi_quote: 'Если к текущему тендерному сервису добавить мгновенную доставку в мессенджеры, AI-анализ и автоматическую CRM — это и есть Chat Plus Tenders.',
  use_cases_title: 'Кому подходит Chat Plus Tenders',
  use_cases: [
    { audience: 'Тендерные отделы компаний-поставщиков', text: 'Получают уведомления раньше конкурентов, автоматизируют подготовку заявок и контролируют дедлайны.' },
    { audience: 'Руководители коммерческих служб', text: 'Видят полную воронку тендеров в реальном времени без Excel и еженедельных сводок.' },
    { audience: 'Фрилансеры и малый бизнес', text: 'Участвуют в закупках для малого бизнеса без найма отдельного тендерного специалиста.' },
    { audience: 'Брокеры и тендерные агентства', text: 'Масштабируют мониторинг сразу на десятки клиентов и разводят уведомления по отдельным каналам.' },
    { audience: 'Государственные заказчики', text: 'Организуют внутренние закупочные процессы и уведомляют поставщиков о новых запросах через мессенджеры.' }
  ],
  comparison_title: 'Chat Plus Tenders vs традиционные подходы',
  comparison_rows: [
    { parameter: 'Скорость уведомления', email_aggregator: '1–4 часа', mobile_aggregator: '15–30 минут', chatplus: 'Секунды' },
    { parameter: 'Где видит менеджер', email_aggregator: 'Почта', mobile_aggregator: 'Отдельное приложение', chatplus: 'WhatsApp / Telegram' },
    { parameter: 'Создание карточки в CRM', email_aggregator: 'Вручную', mobile_aggregator: 'Вручную', chatplus: 'Автоматически' },
    { parameter: 'AI-анализ документов', email_aggregator: 'Нет', mobile_aggregator: 'Ограниченный', chatplus: 'Полный' },
    { parameter: 'Дедлайн в календаре', email_aggregator: 'Вручную', mobile_aggregator: 'Вручную', chatplus: 'Автоматически' },
    { parameter: 'Командная работа', email_aggregator: 'Пересылки email', mobile_aggregator: 'Нет', chatplus: 'В одном чате с ролями' },
    { parameter: 'Стоимость', email_aggregator: 'От 21 000 ₽/год', mobile_aggregator: 'Включено в подписку', chatplus: 'От 4 900 ₽/мес' }
  ],
  faq_title: 'Часто задаваемые вопросы',
  faqs: [
    { question: 'Chat Plus заменяет тендерные агрегаторы типа Контур.Закупки или РосТендер?', answer: 'Нет. Chat Plus — это коммуникационный и автоматизационный слой поверх вашего текущего агрегатора.' },
    { question: 'Какие площадки госзакупок поддерживаются?', answer: 'Любые, которые отдают данные через API, webhook, RSS или email. Это включает ЕИС, РТС-Тендер, Сбербанк-АСТ, Фабрикант и другие.' },
    { question: 'Как быстро приходят уведомления?', answer: 'В течение секунд после поступления данных от источника, что быстрее email-рассылок и push-уведомлений приложений.' },
    { question: 'Можно ли настроить фильтрацию по ОКПД2, регионам и бюджету?', answer: 'Да. AI и фильтры работают по ОКПД2, регионам, НМЦК, типу закупки и ключевым словам.' },
    { question: 'Сколько стоит Chat Plus Tenders?', answer: 'Тарифы начинаются от 4 900 ₽/мес и включают уведомления, AI-анализ, CRM-интеграции и дедлайн-трекинг.' },
    { question: 'Работает ли это для тендеров Prozorro?', answer: 'Да. Для Украины предусмотрен отдельный модуль Chat Plus Prozorro.' },
    { question: 'Нужна ли электронная подпись для работы с Chat Plus?', answer: 'Нет. Подача заявки и подписание контракта по-прежнему происходят на вашей ЭТП с вашей ЭЦП.' },
    { question: 'Можно ли использовать Chat Plus для внутренних закупок?', answer: 'Да. Решение подходит и для заказчиков, которые собирают предложения и маршрутизируют закупочные процессы внутри компании.' }
  ],
  internal_links_title: '',
  internal_links: [
    { title: 'Chat Plus Prozorro', url: '/solutions/tenders', description: 'Мониторинг украинских госзакупок с AI-уведомлениями' },
    { title: 'Chat Plus Government', url: '/for/government', description: 'Омниканальная коммуникация для государственных организаций' },
    { title: 'Chat Plus B2B', url: '/for/b2b', description: 'Коммуникационная платформа для B2B-продаж и закупок' },
    { title: 'Chat Plus CRM', url: '/integrations/amocrm', description: 'Интеграции с AmoCRM, Bitrix24, HubSpot и Salesforce' },
    { title: 'Chat Plus AI', url: '/features/ai', description: 'AI-агенты для анализа документов и автоматизации ответов' },
    { title: 'Chat Plus Automation', url: '/features/automation', description: 'No-code конструктор workflow для бизнес-процессов' },
    { title: 'Chat Plus WhatsApp', url: '/channels/whatsapp', description: 'WhatsApp Business API без наценок' },
    { title: 'Chat Plus Telegram', url: '/channels/telegram', description: 'Telegram-боты и каналы для бизнеса' },
    { title: 'Chat Plus API', url: '/features/api', description: 'API для разработчиков и кастомных интеграций' }
  ],
  sticky_cta_title: 'Ваш следующий тендер уже опубликован. Вы об этом знаете?',
  sticky_cta_text: 'Пока вы читаете эту страницу, на площадках госзакупок появляются новые тендеры. Подключите Chat Plus Tenders и узнайте о подходящих закупках первыми.',
  sticky_cta_primary_label: 'Начать бесплатно — настройка за 10 минут',
  sticky_cta_primary_url: '/demo',
  sticky_cta_secondary_label: 'Заказать демо для тендерного отдела',
  sticky_cta_secondary_url: '/demo',
  software_schema: {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: 'Chat Plus Tenders',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, iOS, Android',
    description: 'AI-платформа для мгновенных уведомлений о тендерах и госзакупках в мессенджерах и CRM.',
    url: 'https://chatplus.com/solutions/tenders',
    author: {
      "@type": 'Organization',
      name: 'Chat Plus'
    },
    offers: {
      "@type": 'Offer',
      price: '4900',
      priceCurrency: 'RUB',
      priceValidUntil: '2026-12-31'
    },
    aggregateRating: {
      "@type": 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '124'
    }
  },
  faq_schema: {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: 'Chat Plus заменяет тендерные агрегаторы типа Контур.Закупки или РосТендер?',
        acceptedAnswer: { "@type": 'Answer', text: 'Нет. Chat Plus — это коммуникационный и автоматизационный слой поверх вашего текущего агрегатора.' }
      },
      {
        "@type": "Question",
        name: 'Какие площадки госзакупок поддерживаются?',
        acceptedAnswer: { "@type": 'Answer', text: 'Любые площадки, которые отдают данные через API, webhook, RSS или email.' }
      },
      {
        "@type": "Question",
        name: 'Как быстро приходят уведомления?',
        acceptedAnswer: { "@type": 'Answer', text: 'Уведомления доставляются в течение секунд после получения данных от источника.' }
      },
      {
        "@type": "Question",
        name: 'Можно ли настроить фильтрацию по ОКПД2, регионам и бюджету?',
        acceptedAnswer: { "@type": 'Answer', text: 'Да. Фильтрация работает по ОКПД2, регионам, бюджету и типу закупки.' }
      }
    ]
  }
};

const siteSetting = {
  site_name: 'Chat Plus',
  site_url: 'https://chatplus.ru',
  default_description: 'Омниканальная платформа для бизнеса: WhatsApp, Telegram и другие каналы в одном окне с AI и автоматизацией.',
  organization_description: 'Chat Plus объединяет каналы коммуникации, автоматизацию и AI-слои в единой платформе для бизнеса.',
  header_links: [
    { label: 'Каналы', href: '/channels' },
    { label: 'Отрасли', href: '/industries' },
    { label: 'Интеграции', href: '/integrations' },
    { label: 'Решения', href: '/solutions' },
    { label: 'Возможности', href: '/features' },
    { label: 'Для бизнеса', href: '/for' },
    { label: 'Цены', href: '/pricing' },
    { label: 'Партнёрам', href: '/partnership' }
  ],
  header_cta_label: 'Попробовать',
  header_cta_url: '/demo',
  footer_tagline: 'Мы продаём не чаты — мы продаём то, что чаты делают возможным.',
  footer_columns: [
    {
      title: 'Продукт',
      links: [
        { label: 'Цены', href: '/pricing' },
        { label: 'Демо', href: '/demo' },
        { label: 'Партнёрам', href: '/partnership' },
        { label: 'Для бизнеса', href: '/for' }
      ]
    },
    {
      title: 'Каталоги',
      links: [
        { label: 'Каналы', href: '/channels' },
        { label: 'Отрасли', href: '/industries' },
        { label: 'Интеграции', href: '/integrations' },
        { label: 'Решения', href: '/solutions' },
        { label: 'Возможности', href: '/features' }
      ]
    },
    {
      title: 'Ресурсы',
      links: [
        { label: 'Документация', href: '/docs' },
        { label: 'Помощь', href: '/help' },
        { label: 'Академия', href: '/academy' },
        { label: 'Блог', href: '/blog' },
        { label: 'Статус', href: '/status' }
      ]
    },
    {
      title: 'Компания',
      links: [
        { label: 'Медиа', href: '/media' },
        { label: 'Команда', href: '/team' },
        { label: 'Диалоги', href: '/conversation' },
        { label: 'Видео', href: '/tv' }
      ]
    },
    {
      title: 'Спецразделы',
      links: [
        { label: 'Промо', href: '/promo' },
        { label: 'Prozorro', href: '/prozorro' },
        { label: 'Сравнения', href: '/compare' },
        { label: 'Карта сайта', href: '/site-map' }
      ]
    }
  ],
  footer_copyright: '© 2026 Chat Plus. Все права защищены.',
  sticky_cta_text: 'Попробуйте Chat Plus бесплатно и соберите рабочий сценарий под ваш бизнес.',
  sticky_cta_label: 'Записаться на демо',
  sticky_cta_url: '/demo',
  page_templates: {
    shared: {
      structured_page: {
        roi_without_title: 'Без Chat Plus',
        roi_with_title: 'С Chat Plus',
        comparison_header_parameter: 'Параметр',
        comparison_header_one: 'Подход 1',
        comparison_header_two: 'Подход 2',
        comparison_header_chat_plus: 'Chat Plus'
      }
    },
    directories: {
      channels: {
        meta_title: 'Каналы Chat Plus — WhatsApp, Telegram, Instagram и другие',
        meta_description: 'Подключите WhatsApp Business API, Telegram, Instagram Direct, Viber, SMS и Email в единый омниканальный инбокс. Все сообщения в одном окне с AI и CRM.',
        h1: 'Все каналы коммуникации в одном окне',
        subtitle: 'WhatsApp, Telegram, Instagram, Viber, SMS, Email и VoIP — подключайте любые каналы и управляйте всеми диалогами в единой платформе с AI и автоматизацией.',
        hero_cta_primary_label: 'Попробовать бесплатно',
        hero_cta_primary_url: '/demo',
        card_cta_label: 'Подключить',
        base_path: '/channels',
        sticky_cta_title: 'Подключите все каналы в одном окне',
        sticky_cta_text: 'Перестаньте терять заявки из-за разрозненных мессенджеров. Один интерфейс, единая история клиента, AI 24/7.',
        sticky_cta_primary_label: 'Записаться на демо',
        sticky_cta_primary_url: '/demo'
      },
      industries: {
        meta_title: 'Chat Plus по отраслям — Beauty, Медицина, Фитнес, Недвижимость',
        meta_description: 'Готовые сценарии автоматизации коммуникации для каждой отрасли. Beauty, медицина, фитнес, недвижимость, HoReCa, образование и другие.',
        h1: 'Готовые сценарии Chat Plus для вашей отрасли',
        subtitle: 'Автоматизация коммуникации с учётом специфики бизнеса: готовые шаблоны, сценарии и настройки для beauty, медицины, фитнеса, недвижимости и других отраслей.',
        hero_cta_primary_label: 'Попробовать бесплатно',
        hero_cta_primary_url: '/demo',
        card_cta_label: 'Посмотреть сценарий',
        base_path: '/industries',
        sticky_cta_title: 'Найдите готовый сценарий для вашей отрасли',
        sticky_cta_text: 'За 30 минут подключаем каналы и запускаем автоответы под специфику вашего бизнеса.',
        sticky_cta_primary_label: 'Записаться на демо',
        sticky_cta_primary_url: '/demo'
      },
      integrations: {
        meta_title: 'Интеграции Chat Plus — AmoCRM, Bitrix24, HubSpot и другие',
        meta_description: 'Chat Plus интегрируется с AmoCRM, Bitrix24, HubSpot, Salesforce, Zapier и сотнями других инструментов. Синхронизируйте каналы с вашим стеком без потери данных.',
        h1: 'Chat Plus работает с вашими инструментами',
        subtitle: 'AmoCRM, Bitrix24, HubSpot, Salesforce и сотни других интеграций. Ваши инструменты работают вместе с Chat Plus — без потери данных и привычных процессов.',
        hero_cta_primary_label: 'Попробовать бесплатно',
        hero_cta_primary_url: '/demo',
        card_cta_label: 'Подключить',
        base_path: '/integrations',
        sticky_cta_title: 'Подключите ваш стек без дублирования данных',
        sticky_cta_text: 'Chat Plus встраивается в текущий процесс и не требует отказа от привычных инструментов.',
        sticky_cta_primary_label: 'Записаться на демо',
        sticky_cta_primary_url: '/demo'
      },
      features: {
        meta_title: 'Возможности Chat Plus — AI, автоматизация, рассылки, аналитика',
        meta_description: 'AI-агенты, чат-боты, массовые рассылки, no-code автоматизация, аналитика и API. Все инструменты для роста продаж и автоматизации коммуникации.',
        h1: 'Возможности Chat Plus для вашего бизнеса',
        subtitle: 'AI-агенты, чат-боты, рассылки, автоматизация, аналитика и API — всё для роста продаж, скорости обработки обращений и масштабирования без новых менеджеров.',
        hero_cta_primary_label: 'Попробовать бесплатно',
        hero_cta_primary_url: '/demo',
        card_cta_label: 'Подробнее',
        base_path: '/features',
        sticky_cta_title: 'Попробуйте все возможности Chat Plus',
        sticky_cta_text: 'Запустите пилот и проверьте какие функции решают вашу задачу на реальных обращениях.',
        sticky_cta_primary_label: 'Записаться на демо',
        sticky_cta_primary_url: '/demo'
      },
      solutions: {
        meta_title: 'Решения Chat Plus — продажи, поддержка, AI-автоматизация',
        meta_description: 'Омниканальная поддержка, AI-воронки продаж, тендеры, рассылки — готовые бизнес-решения Chat Plus для роста конверсии и снижения операционной нагрузки.',
        h1: 'Бизнес-решения Chat Plus',
        subtitle: 'Омниканальная поддержка, воронки продаж, AI-обработка лидов, тендеры — готовые бизнес-сценарии для роста конверсии и снижения операционной нагрузки на команду.',
        hero_cta_primary_label: 'Попробовать бесплатно',
        hero_cta_primary_url: '/demo',
        card_cta_label: 'Открыть решение',
        base_path: '/solutions',
        sticky_cta_title: 'Найдите решение под вашу задачу',
        sticky_cta_text: 'Каждый сценарий настраивается под специфику бизнеса и запускается за один рабочий день.',
        sticky_cta_primary_label: 'Записаться на демо',
        sticky_cta_primary_url: '/demo'
      },
      business_types: {
        meta_title: 'Chat Plus для вашего типа бизнеса — B2B, B2C, SMB, Enterprise',
        meta_description: 'Chat Plus адаптируется под любую модель бизнеса: малый бизнес, B2B, enterprise, агентства, маркетплейсы. Готовые сценарии под ваш сегмент.',
        h1: 'Chat Plus под ваш тип бизнеса',
        subtitle: 'Малый бизнес, B2B, enterprise, агентства, маркетплейсы — Chat Plus адаптируется под модель и масштаб вашего бизнеса с готовыми сценариями и шаблонами.',
        hero_cta_primary_label: 'Попробовать бесплатно',
        hero_cta_primary_url: '/demo',
        card_cta_label: 'Смотреть сценарий',
        base_path: '/for',
        sticky_cta_title: 'Запустите сценарий под ваш тип бизнеса',
        sticky_cta_text: 'Подключение занимает день, а основные сценарии автоматизации настраиваются без программиста.',
        sticky_cta_primary_label: 'Записаться на демо',
        sticky_cta_primary_url: '/demo'
      }
    },
    details: {
      channels: {
        meta_title: 'Chat Plus {name}',
        h1: 'Chat Plus {name}',
        hero_cta_secondary_label: 'Как это работает',
        hero_cta_secondary_url: '#solution',
        problem_title: 'Почему {name} без платформы тормозит команду',
        problem_intro: '{name} сам по себе не решает проблему скорости ответа, прозрачности процессов и передачи данных в CRM.',
        problem_points: [
          { title: 'Разрозненные диалоги', text: 'Команда переключается между окнами, теряет контекст и скорость реакции.' },
          { title: 'Нет единой истории клиента', text: 'Данные живут в канале и не попадают в воронку без ручной работы.' },
          { title: 'Сложно масштабировать', text: 'Рост обращений быстро превращается в рост хаоса и операционных затрат.' }
        ],
        problem_summary: 'Нужен не просто канал, а связка канала, автоматизации и CRM-слоя.',
        solution_title: 'Как Chat Plus усиливает {name}',
        solution_intro: 'Chat Plus превращает канал в управляемый бизнес-процесс с AI, CRM и автоматизацией.',
        features_title: 'Что уже есть в сценарии',
        integrations_title: '{name} + CRM и сервисы команды',
        roi_title: 'Результат после подключения {name}',
        roi_intro: 'Эти блоки дальше можно заменить на финальные коммерческие цифры через Strapi.',
        faq_title: 'Частые вопросы',
        internal_links_title: '',
        pricing_label: 'Цены Chat Plus',
        pricing_description: 'Посмотреть общую коммерческую модель',
        sticky_cta_title: 'Подключите {name} через Chat Plus',
        sticky_cta_text: 'Попробуйте Chat Plus и убедитесь, как {name} в единой платформе ускоряет команду и снижает нагрузку.',
        sticky_cta_primary_label: 'Записаться на демо'
      },
      industries: {
        meta_title: 'Chat Plus для {name}',
        h1: 'Chat Plus для {name}',
        hero_cta_secondary_label: 'Посмотреть демо',
        hero_cta_secondary_url: '/demo',
        problem_title: 'Типичные проблемы коммуникации в {name}',
        problem_point_title: 'Ключевая операционная проблема',
        solution_title: 'Как Chat Plus решает задачи {name}',
        features_title: 'Что можно автоматизировать',
        integrations_title: 'С какими каналами и системами это работает',
        use_cases_title: 'Сценарии применения в {name}',
        internal_links_title: '',
        sticky_cta_title: 'Запустите Chat Plus в вашем {name}-бизнесе',
        sticky_cta_text: 'Запустите пилот под сегмент {name} и проверьте результат на реальных обращениях.',
        sticky_cta_primary_label: 'Записаться на демо'
      },
      integrations: {
        meta_title: 'Интеграция Chat Plus + {name}',
        h1: 'Интеграция Chat Plus + {name}',
        problem_title: 'Зачем нужна интеграция Chat Plus с {name}',
        problem_intro: 'Без единой платформы данные из мессенджеров и {name} живут раздельно, и команда теряет контекст при каждом переключении.',
        solution_title: 'Как Chat Plus работает с {name}',
        solution_intro: 'Chat Plus синхронизирует все каналы коммуникации с {name} — история переписки, статусы и контакты обновляются автоматически.',
        features_title: 'Что входит в интеграцию',
        use_cases_title: 'Где это применяется',
        internal_links_title: '',
        sticky_cta_title: 'Подключите {name} к Chat Plus',
        sticky_cta_text: 'Подключите {name} к Chat Plus без потери данных и привычного рабочего процесса.',
        sticky_cta_primary_label: 'Записаться на демо'
      },
      features: {
        meta_title: '{name} в Chat Plus — возможности и настройка',
        h1: '{name} РІ Chat Plus',
        problem_title: 'Зачем нужен модуль {name}',
        problem_intro: 'Без централизованного управления {name} превращается в точечный инструмент, который не интегрируется с остальным процессом.',
        solution_title: 'Как работает {name} в Chat Plus',
        solution_intro: 'Модуль {name} встроен в единую платформу — он работает в связке с каналами, CRM и другими инструментами без дополнительных настроек.',
        features_title: 'Что включает модуль',
        integrations_title: 'С какими сервисами работает {name}',
        use_cases_title: 'Где {name} приносит результат',
        internal_links_title: '',
        docs_label: 'Документация',
        docs_description: 'Технические материалы и следующая детализация',
        sticky_cta_title: 'Подключите {name} в вашем процессе',
        sticky_cta_text: 'Включите модуль {name} и посмотрите, как он работает на вашем потоке обращений.',
        sticky_cta_primary_label: 'Записаться на демо'
      },
      solutions: {
        meta_title: 'Chat Plus: {name} — готовое решение для бизнеса',
        h1: '{name} на базе Chat Plus',
        problem_title: 'Почему нужен отдельный сценарий {name}',
        problem_intro: 'Типовые инструменты не учитывают специфику задачи {name}. Chat Plus предлагает готовый сценарий с каналами, AI и автоматизацией.',
        solution_title: 'Как Chat Plus реализует сценарий {name}',
        solution_intro: 'Chat Plus собирает полный workflow под задачу {name}: каналы, автоответы, CRM-интеграция и аналитика в одном месте.',
        features_title: 'Что входит в решение',
        integrations_title: 'Что можно подключить',
        use_cases_title: 'Для кого это подходит',
        internal_links_title: '',
        sticky_cta_title: 'Запустите сценарий {name}',
        sticky_cta_text: 'Запустите сценарий {name} и проверьте ROI на реальных задачах вашей команды.',
        sticky_cta_primary_label: 'Записаться на демо'
      },
      compare: {
        meta_title: 'Chat Plus vs {name} — сравнение платформ',
        h1: 'Chat Plus vs {name}',
        problem_title: 'Что ограничивает {name}',
        solution_title: 'Чем Chat Plus лучше {name}',
        features_title: 'Преимущества Chat Plus',
        comparison_title: 'Подробное сравнение',
        price_parameter_label: 'Цена',
        model_parameter_label: 'Модель',
        model_option_one: 'Текущий стек',
        model_option_two: 'Дополнительные ограничения',
        model_chat_plus: 'Единая платформа',
        internal_links_title: 'Другие сравнения',
        sticky_cta_title: 'Переходите с {name} на Chat Plus',
        sticky_cta_text: 'Помогаем перенести процессы и собрать рабочий пилот без затяжного внедрения.',
        sticky_cta_primary_label: 'Записаться на демо'
      },
      vs: {
        meta_title: '{name} или Chat Plus — что выбрать?',
        h1: '{name} или Chat Plus',
        problem_title: 'Что ограничивает {name}',
        solution_title: 'Почему выбирают Chat Plus',
        features_title: 'Преимущества Chat Plus',
        comparison_title: 'Ключевое сравнение',
        price_parameter_label: 'Цена',
        model_parameter_label: 'Модель',
        model_option_one: 'Текущий стек',
        model_option_two: 'Дополнительные ограничения',
        model_chat_plus: 'Единая платформа',
        internal_links_title: 'Другие сравнения',
        sticky_cta_title: 'Убедитесь сами — попробуйте Chat Plus',
        sticky_cta_text: 'Сравните Chat Plus с {name} на реальных задачах вашего бизнеса.',
        sticky_cta_primary_label: 'Записаться на демо'
      },
      channel_industry: {
        meta_title: 'Chat Plus {channel} для {industry}',
        meta_description: 'Автоматизация коммуникации в {channel} для бизнеса в {industry}. Подключите {channel} через Chat Plus и управляйте всеми диалогами в единой платформе.',
        h1: 'Chat Plus {channel} для {industry}',
        subtitle: 'Готовый сценарий автоматизации {channel} под специфику {industry}. Подключайтесь и управляйте всеми обращениями в одном окне.',
        hero_cta_primary_label: 'Попробовать бесплатно',
        problem_title: 'Почему {channel} в {industry} требует отдельного сценария',
        solution_title: 'Как Chat Plus настраивает {channel} для {industry}',
        features_title: 'Что входит в готовый сценарий',
        integrations_title: 'Связанные интеграции',
        internal_links_title: '',
        sticky_cta_title: 'Запустите {channel} для {industry}',
        sticky_cta_text: 'Готовый сценарий {channel} для {industry} запускается за 30 минут без участия разработчика.',
        sticky_cta_primary_label: 'Записаться на демо'
      }
    }
  }
};

function makeLandingPage({
  slug,
  metaTitle,
  metaDescription,
  h1,
  subtitle,
  primaryLabel = 'Попробовать бесплатно',
  primaryUrl = '/demo',
  secondaryLabel = 'Записаться на демо',
  secondaryUrl = '/demo',
  problemContext,
  solutionContext,
  featureContext,
  integrationContext,
  roiContext,
  useCaseContext,
  internalLinks = [],
  heroTrustFacts,
  problemItems,
  solutionItems,
  featureItems,
  integrationItems,
  roiWithoutItems,
  roiWithItems,
  roiQuote,
  useCases,
  faqItems,
  comparisonTitle,
  comparisonRows,
  stickyTitle,
  stickyText,
}) {
  return {
    slug,
    meta_title: metaTitle,
    meta_description: metaDescription,
    h1,
    subtitle,
    canonical: `https://chatplus.ru${slug === 'home' ? '/' : `/${slug}`}`,
    schema_type: 'SoftwareApplication',
    target_keywords: [slug, 'chat plus', 'omnichannel', 'automation'],
    word_count: 1800,
    hero_cta_primary_label: primaryLabel,
    hero_cta_primary_url: primaryUrl,
    hero_cta_secondary_label: secondaryLabel,
    hero_cta_secondary_url: secondaryUrl,
    hero_trust_facts: heroTrustFacts || [
      'Подключение за 15 минут без разработчика',
      'WhatsApp, Telegram, Instagram, Viber, SMS и Email в одном окне',
      'AI-агенты отвечают клиентам 24/7'
    ],
    problem_title: 'Что мешает бизнесу эффективно работать с клиентами',
    problem_intro: problemContext,
    problems: problemItems || [
      { title: 'Клиенты пишут в разные каналы — команда теряет заявки', text: 'Сообщения из WhatsApp, Telegram и Instagram приходят в разные места, менеджеры переключаются и упускают горячих клиентов.' },
      { title: 'Медленные ответы — клиент уходит к конкурентам', text: 'Первый, кто ответил, получает клиента. Медленная реакция — прямые потери конверсии.' },
      { title: 'Данные не попадают в CRM — аналитика слепая', text: 'История переписки остаётся в мессенджерах, CRM не обновляется, воронка непрозрачна.' }
    ],
    problem_summary: 'Без единой платформы рост бизнеса превращается в рост операционного хаоса.',
    solution_title: 'Как Chat Plus решает эти задачи',
    solution_intro: solutionContext,
    solution_steps: solutionItems || [
      { title: 'Единый инбокс для всех каналов', text: 'Все сообщения из WhatsApp, Telegram, Instagram и других каналов собираются в одном интерфейсе.' },
      { title: 'AI-агент отвечает мгновенно', text: 'AI закрывает типовые запросы, квалифицирует лидов и передаёт горячих клиентов нужному менеджеру.' },
      { title: 'Автоматическая синхронизация с CRM', text: 'Каждый контакт и диалог автоматически попадает в CRM — история клиента всегда актуальна.' }
    ],
    features_title: 'Возможности Chat Plus',
    features: featureItems || [
      { title: 'Омниканальный инбокс', text: 'Все каналы в одном окне. История клиента не зависит от того, в каком канале он написал.' },
      { title: featureContext, text: 'AI-агенты, рассылки, автоматизация и CRM-интеграции включены в платформу.' },
      { title: 'Аналитика и отчёты', text: 'Дашборд в реальном времени: каналы, агенты, воронки и конверсия.' }
    ],
    integrations_title: 'Работает с вашим стеком',
    integration_blocks: integrationItems || [
      { label: 'WhatsApp Business API', text: 'Официальный API без наценок на сообщения.' },
      { label: 'AmoCRM и Bitrix24', text: 'Двусторонняя синхронизация контактов и сделок.' },
      { label: integrationContext, text: 'Zapier, n8n, Google Calendar и другие интеграции.' }
    ],
    roi_title: 'Результаты после внедрения',
    roi_intro: roiContext,
    roi_without_items: roiWithoutItems || [
      'Заявки теряются в разных мессенджерах',
      'Медленные ответы и потеря конверсии',
      'CRM не обновляется, воронка непрозрачна'
    ],
    roi_with_items: roiWithItems || [
      'Ни одна заявка не теряется — всё в одном окне',
      'AI отвечает мгновенно — конверсия растёт',
      'CRM всегда актуальна — аналитика работает'
    ],
    roi_quote: roiQuote || 'Chat Plus позволяет обрабатывать в 3 раза больше обращений той же командой.',
    use_cases_title: 'Кому подходит Chat Plus',
    use_cases: useCases || [
      { audience: 'Отделы продаж', text: useCaseContext },
      { audience: 'Команды поддержки', text: 'Единый инбокс снижает нагрузку на операторов и ускоряет время ответа.' },
      { audience: 'Маркетинг', text: 'Массовые рассылки по сегментам с персонализацией и аналитикой открытий.' }
    ],
    faq_title: 'Частые вопросы',
    faqs: faqItems || [
      { question: 'Подходит ли Chat Plus для малого бизнеса?', answer: 'Да. Chat Plus работает для команд от 1 человека. Минимальный план охватывает ключевые каналы и автоматизацию.' },
      { question: 'Сколько времени занимает подключение?', answer: 'Первые каналы подключаются за 15 минут. Полный запуск с настройкой сценариев занимает 1 рабочий день.' },
      { question: 'Нужен ли разработчик для настройки?', answer: 'Нет. Всё настраивается через no-code конструктор без программиста.' }
    ],
    comparison_title: comparisonTitle ?? null,
    comparison_rows: comparisonRows ?? [],
    internal_links_title: '',
    internal_links: internalLinks.map((item) => ({
      title: item.label,
      url: item.href,
      description: item.description
    })),
    sticky_cta_title: stickyTitle || 'Попробуйте Chat Plus бесплатно',
    sticky_cta_text: stickyText || 'Подключайтесь за 15 минут и убедитесь, что ни одна заявка больше не теряется.',
    sticky_cta_primary_label: primaryLabel,
    sticky_cta_primary_url: primaryUrl,
    sticky_cta_secondary_label: secondaryLabel,
    sticky_cta_secondary_url: secondaryUrl,
    software_schema: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: h1,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: metaDescription,
      url: `https://chatplus.ru${slug === 'home' ? '/' : `/${slug}`}`,
      author: {
        '@type': 'Organization',
        name: 'Chat Plus'
      }
    },
    faq_schema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Подходит ли Chat Plus для малого бизнеса?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Да. Chat Plus работает для команд от 1 человека и масштабируется до enterprise.'
          }
        },
        {
          '@type': 'Question',
          name: 'Сколько времени занимает подключение Chat Plus?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Первые каналы подключаются за 15 минут. Полный запуск с настройкой сценариев занимает 1 рабочий день.'
          }
        },
        {
          '@type': 'Question',
          name: 'Нужен ли разработчик для настройки?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Нет. Всё настраивается через no-code конструктор. Разработчик нужен только для кастомных интеграций через API.'
          }
        }
      ]
    }
  };
}

const landingPages = [
  {
    slug: 'home',
    meta_title: 'Chat Plus — омниканальная платформа для бизнеса',
    meta_description: 'Chat Plus объединяет WhatsApp, Telegram, Instagram и другие каналы в одном окне. AI-агенты, автоматизация и CRM-интеграции для роста продаж и снижения нагрузки на команду.',
    h1: 'Все каналы клиентов в одном окне — WhatsApp, Telegram и другие',
    subtitle: 'Chat Plus собирает сообщения из всех мессенджеров, автоматизирует ответы с AI и синхронизирует данные с вашей CRM. Ни одна заявка не теряется.',
    canonical: 'https://chatplus.ru/',
    schema_type: 'SoftwareApplication',
    target_keywords: [
      'омниканальная платформа',
      'чат-бот для бизнеса',
      'whatsapp для бизнеса',
      'автоматизация мессенджеров',
      'chat plus'
    ],
    word_count: 2000,
    hero_cta_primary_label: 'Попробовать бесплатно',
    hero_cta_primary_url: '/demo',
    hero_cta_secondary_label: 'Записаться на демо',
    hero_cta_secondary_url: '/demo',
    hero_trust_facts: [
      'Подключение за 15 минут — без разработчика',
      'WhatsApp, Telegram, Instagram, Viber, SMS и Email в одном интерфейсе',
      'AI отвечает клиентам 24/7 без участия менеджера'
    ],
    problem_title: 'Почему бизнес теряет клиентов в мессенджерах',
    problem_intro: 'Клиенты пишут в WhatsApp, Telegram и Instagram одновременно. Менеджеры не успевают отслеживать все каналы — заявки теряются, ответы запаздывают.',
    problems: [
      { title: 'Клиенты пишут в 5+ каналов, команда теряет заявки', text: 'Менеджеры переключаются между приложениями, теряют контекст и не успевают ответить первыми — а первый ответ получает клиента.' },
      { title: 'Ответы занимают часы, конкуренты отвечают быстрее', text: 'Скорость ответа напрямую влияет на конверсию. 78% клиентов покупают у того, кто ответил первым.' },
      { title: 'Данные не попадают в CRM, аналитика слепая', text: 'История переписки остаётся в личных телефонах менеджеров. CRM пустует, воронка непрозрачна, аналитика невозможна.' }
    ],
    problem_summary: 'Без единой платформы рост числа обращений = рост хаоса и операционных затрат.',
    solution_title: 'Chat Plus — единый инбокс для всех каналов',
    solution_intro: 'Chat Plus собирает все сообщения в одном окне и автоматизирует рутинные задачи — так команда отвечает быстрее при той же нагрузке.',
    solution_steps: [
      { title: 'Подключите каналы за 15 минут', text: 'WhatsApp Business API, Telegram, Instagram Direct, Viber, SMS и Email подключаются через готовый конструктор без разработчика.' },
      { title: 'Получайте все сообщения в одном инбоксе', text: 'Все входящие из любых каналов попадают в единый интерфейс. Вся история клиента — в одной карточке, независимо от канала.' },
      { title: 'Включите AI-агента', text: 'AI отвечает на типовые запросы, квалифицирует лидов, записывает на встречи и передаёт сложные вопросы нужному менеджеру.' },
      { title: 'Автоматизируйте воронку', text: 'No-code конструктор: автоответы, рассылки, триггеры и передача задач в CRM — без программиста.' }
    ],
    features_title: 'Всё необходимое для коммуникации с клиентами',
    features: [
      { title: 'Омниканальный инбокс', text: 'Все каналы в одном интерфейсе. История клиента не зависит от того, в каком канале он написал.' },
      { title: 'AI-агенты 24/7', text: 'AI отвечает мгновенно, квалифицирует лидов и передаёт горячих клиентов менеджеру в нужный момент.' },
      { title: 'Массовые рассылки', text: 'Сегментированные рассылки по WhatsApp, Telegram и SMS. Персонализация, аналитика открытий и кликов.' },
      { title: 'No-code автоматизация', text: 'Воронки, триггеры и сценарии без программиста. Визуальный конструктор с условной логикой.' },
      { title: 'CRM-интеграции', text: 'Двусторонняя синхронизация с AmoCRM, Bitrix24, HubSpot, Salesforce и другими CRM.' },
      { title: 'Аналитика и отчёты', text: 'Дашборд в реальном времени: каналы, агенты, воронки, конверсия. Знайте что работает.' }
    ],
    integrations_title: 'Работает с вашим стеком',
    integration_blocks: [
      { label: 'WhatsApp Business API', text: 'Официальный API без наценок на сообщения. Рассылки, чат-боты, AI-агенты.' },
      { label: 'AmoCRM и Bitrix24', text: 'Двусторонняя синхронизация контактов, сделок и переписки. Данные всегда актуальны.' },
      { label: 'HubSpot, Salesforce', text: 'Интеграции с ведущими enterprise CRM. Настройка через готовые коннекторы.' },
      { label: 'Zapier и n8n', text: 'Подключайте любые сервисы через no-code автоматизацию без написания кода.' },
      { label: 'Google Calendar', text: 'AI автоматически записывает встречи и напоминает клиентам о дедлайнах.' }
    ],
    roi_title: 'Результаты после внедрения Chat Plus',
    roi_intro: 'Средние показатели клиентов Chat Plus через 30 дней после запуска.',
    roi_without_items: [
      'Менеджер переключается между 5+ приложениями и теряет контекст',
      'Клиент ждёт ответа часами — и уходит к конкуренту',
      'Данные в личных телефонах — CRM пустует, воронка слепая',
      'Рост числа клиентов = пропорциональный рост нагрузки на команду'
    ],
    roi_with_items: [
      'Все каналы в одном окне — ни одна заявка не теряется',
      'AI отвечает мгновенно — конверсия из обращений растёт на 35%+',
      'Каждый контакт синхронизируется с CRM — воронка прозрачна',
      'Автоматизация масштабирует процесс без роста операционных затрат'
    ],
    roi_quote: 'За первый месяц работы с Chat Plus мы закрыли на 40% больше сделок при той же команде менеджеров.',
    use_cases_title: 'Где Chat Plus даёт результат',
    use_cases: [
      { audience: 'Отделы продаж', text: 'Ускоряет первый ответ, квалифицирует лидов и передаёт горячие обращения в CRM.' },
      { audience: 'Поддержка и сервис', text: 'Собирает все каналы в одном окне, включает AI-first line и снижает нагрузку на команду.' },
      { audience: 'Сети и франшизы', text: 'Даёт общие стандарты коммуникации, прозрачную аналитику и сценарии для масштабирования.' }
    ],
    comparison_title: null,
    comparison_rows: [],
    faq_title: 'Частые вопросы о Chat Plus',
    faqs: [
      { question: 'Подходит ли Chat Plus для малого бизнеса?', answer: 'Да. Chat Plus работает для команд от 1 человека. Минимальный план охватывает основные каналы и автоматизацию без избыточных функций.' },
      { question: 'Сколько времени занимает подключение?', answer: 'Первые каналы подключаются за 15 минут. Полный запуск с настройкой сценариев занимает 1 рабочий день.' },
      { question: 'Нужен ли разработчик для настройки?', answer: 'Нет. Всё настраивается через no-code конструктор. Разработчик нужен только для кастомных интеграций через API.' },
      { question: 'Какие каналы поддерживаются?', answer: 'WhatsApp Business API, Telegram, Instagram Direct, Viber, SMS, Email и VoIP. Подключение через единый интерфейс без технических ограничений.' },
      { question: 'Есть ли интеграция с AmoCRM и Bitrix24?', answer: 'Да. Двусторонняя синхронизация с AmoCRM, Bitrix24, HubSpot, Salesforce, Pipedrive и другими CRM включена в базовый план.' }
    ],
    internal_links_title: '',
    internal_links: [
      { title: 'Каналы', url: '/channels', description: 'WhatsApp, Telegram, Instagram и другие' },
      { title: 'Возможности', url: '/features', description: 'AI, автоматизация, рассылки, аналитика' },
      { title: 'Интеграции', url: '/integrations', description: 'AmoCRM, Bitrix24, HubSpot и другие' },
      { title: 'Решения', url: '/solutions', description: 'Готовые сценарии для вашего бизнеса' },
      { title: 'Цены', url: '/pricing', description: 'Коммерческая модель Chat Plus' }
    ],
    sticky_cta_title: 'Попробуйте Chat Plus бесплатно',
    sticky_cta_text: 'Подключайтесь за 15 минут и убедитесь, что ни одна заявка больше не теряется.',
    sticky_cta_primary_label: 'Попробовать бесплатно',
    sticky_cta_primary_url: '/demo',
    sticky_cta_secondary_label: 'Записаться на демо',
    sticky_cta_secondary_url: '/demo',
    software_schema: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Chat Plus',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, iOS, Android',
      description: 'Омниканальная платформа для бизнеса: WhatsApp, Telegram, Instagram и другие каналы в одном окне с AI и автоматизацией.',
      url: 'https://chatplus.ru',
      author: {
        '@type': 'Organization',
        name: 'Chat Plus'
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'RUB',
        description: 'Бесплатный пробный период'
      }
    },
    faq_schema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Подходит ли Chat Plus для малого бизнеса?',
          acceptedAnswer: { '@type': 'Answer', text: 'Да. Chat Plus работает для команд от 1 человека и масштабируется до enterprise.' }
        },
        {
          '@type': 'Question',
          name: 'Сколько времени занимает подключение Chat Plus?',
          acceptedAnswer: { '@type': 'Answer', text: 'Первые каналы подключаются за 15 минут. Полный запуск занимает 1 рабочий день.' }
        },
        {
          '@type': 'Question',
          name: 'Нужен ли разработчик для настройки Chat Plus?',
          acceptedAnswer: { '@type': 'Answer', text: 'Нет. Всё настраивается через no-code конструктор без программиста.' }
        },
        {
          '@type': 'Question',
          name: 'Какие каналы поддерживает Chat Plus?',
          acceptedAnswer: { '@type': 'Answer', text: 'WhatsApp Business API, Telegram, Instagram Direct, Viber, SMS, Email и VoIP.' }
        }
      ]
    }
  },
  makeLandingPage({
    slug: 'pricing',
    metaTitle: 'Цены Chat Plus — тарифы и стоимость подключения',
    metaDescription: 'Прозрачные цены Chat Plus без скрытых платежей. Фиксированная ежемесячная подписка, бесплатный пилот и поддержка при подключении.',
    h1: 'Цены Chat Plus',
    subtitle: 'Фиксированная подписка, никаких наценок за сообщения и скрытых платежей. Подберите план под размер вашей команды.',
    problemContext: 'Большинство омниканальных платформ берут деньги за каждое сообщение, добавляют скрытые комиссии и не дают предсказуемого бюджета.',
    solutionContext: 'Chat Plus работает по фиксированной модели подписки — вы всегда знаете сколько платите и не получаете сюрпризов в счёте.',
    featureContext: 'Все планы включают омниканальный инбокс, AI-агентов, автоматизацию и CRM-интеграции.',
    integrationContext: 'Можно начать с пилота на одном канале и масштабироваться по мере роста.',
    roiContext: 'Даже один подключённый канал и базовая автоматизация быстро окупают стоимость подписки.',
    useCaseContext: 'От малого бизнеса до enterprise — Chat Plus масштабируется вместе с вами.',
    heroTrustFacts: [
      'Фиксированный ежемесячный платёж',
      'Без платы за каждое сообщение',
      'Пилот с командой Chat Plus'
    ],
    problemItems: [
      { title: 'Цена растёт вместе с объёмом сообщений', text: 'Счёт становится непредсказуемым уже на первом росте входящего потока.' },
      { title: 'Нужные функции продаются как допы', text: 'CRM, автоматизация и AI часто оплачиваются отдельно и раздувают бюджет.' },
      { title: 'Сложно сравнить реальные условия', text: 'На лендинге одна цена, а после звонка появляются лимиты, роли и скрытые комиссии.' }
    ],
    solutionItems: [
      { title: 'Фиксируете модель оплаты', text: 'Сразу понимаете, сколько стоит запуск и дальнейшая работа команды.' },
      { title: 'Выбираете план под сценарий', text: 'От одного канала и пилота до полноценного омниканального контура.' },
      { title: 'Расширяете стек без пересборки', text: 'Добавляете AI, CRM и автоматизацию внутри одной платформы.' }
    ],
    featureItems: [
      { title: 'Прозрачные тарифы', text: 'Без скрытых платежей и сюрпризов в ежемесячном счёте.' },
      { title: 'Готовность к масштабированию', text: 'Переход между планами без миграции на другой стек.' },
      { title: 'Поддержка на запуске', text: 'Команда Chat Plus помогает дойти до первого рабочего сценария.' }
    ],
    integrationItems: [
      { label: 'Пилотный запуск', text: 'Можно начать с одного канала и проверить экономику на реальном потоке.' },
      { label: 'CRM и AI в одном контуре', text: 'Нет отдельной платы за связку разных сервисов и подрядчиков.' },
      { label: 'Масштабирование по этапам', text: 'Сначала команда, потом процессы, потом новые каналы.' }
    ],
    roiWithoutItems: [
      'Бюджет плавает от месяца к месяцу',
      'Функции покупаются кусками у разных вендоров',
      'Рост нагрузки = рост непредсказуемых расходов'
    ],
    roiWithItems: [
      'Финмодель понятна заранее',
      'Один стек вместо трёх-четырёх подписок',
      'Расходы растут управляемо, а не хаотично'
    ],
    roiQuote: 'Chat Plus удобен тем, что коммерческая модель понятна сразу: без скрытых доплат и с нормальным пилотом на старте.',
    useCases: [
      { audience: 'Команды до 5 человек', text: 'Можно запустить один канал, AI-ответы и базовую автоматизацию без лишнего оверхеда.' },
      { audience: 'Операционные команды', text: 'Подходит для бизнеса, где важно заранее понимать unit-экономику поддержки и продаж.' },
      { audience: 'Enterprise и сети', text: 'План расширяется вместе с ростом команды и числа процессов.' }
    ],
    faqItems: [
      { question: 'Есть ли оплата за каждое сообщение?', answer: 'Нет. Базовая модель Chat Plus строится на фиксированной подписке, а не на наценке за каждый диалог.' },
      { question: 'Можно ли начать с пилота?', answer: 'Да. Обычно запуск начинается с одного канала и одного сценария, чтобы проверить экономику и процесс.' },
      { question: 'Что входит в базовый план?', answer: 'Омниканальный инбокс, базовая автоматизация, AI-сценарии и CRM-интеграции в рамках выбранного тарифа.' },
      { question: 'Как выбрать подходящий тариф?', answer: 'На демо мы оцениваем объём входящего потока, состав команды и нужные интеграции, после чего предлагаем рабочую конфигурацию.' }
    ],
    stickyTitle: 'Посмотрите реальную модель стоимости Chat Plus',
    stickyText: 'На демо разложим цену по вашему сценарию: каналы, команда, AI, CRM и этапы запуска.',
    internalLinks: [
      { label: 'Главная', href: '/', description: 'Возможности платформы' },
      { label: 'Demo', href: '/demo', description: 'Записаться на демо и обсудить условия' }
    ]
  }),
  makeLandingPage({
    slug: 'demo',
    metaTitle: 'Записаться на демо Chat Plus — бесплатная демонстрация',
    metaDescription: 'Запишитесь на бесплатное демо Chat Plus. Покажем как подключить WhatsApp, Telegram и другие каналы, настроить AI и автоматизацию под ваш бизнес.',
    h1: 'Запишитесь на бесплатное демо Chat Plus',
    subtitle: 'За 30 минут покажем как Chat Plus решает вашу задачу: подключение каналов, AI-агенты, автоматизация и CRM-интеграция.',
    problemContext: 'Выбрать омниканальную платформу сложно без практической демонстрации под конкретные задачи вашего бизнеса.',
    solutionContext: 'На демо мы не показываем слайды — мы запускаем платформу под ваш сценарий и показываем результат в режиме реального времени.',
    featureContext: 'Подключим один канал, настроим AI-ответ и покажем как данные попадают в вашу CRM.',
    integrationContext: 'После демо получаете пилот с вашими реальными каналами и сценарием.',
    roiContext: 'Большинство клиентов принимают решение уже во время демо, потому что видят результат своими глазами.',
    useCaseContext: 'Подходит для команд от 2 до 500 человек, для любой отрасли и любого набора каналов.',
    heroTrustFacts: [
      '30 минут на ваш сценарий',
      'Без слайдов — сразу в интерфейсе',
      'После встречи можно запустить пилот'
    ],
    problemItems: [
      { title: 'Сложно оценить платформу по лендингу', text: 'По описанию функций не видно, как система поведёт себя на вашем процессе.' },
      { title: 'Демо у вендоров часто формальное', text: 'Показывают общий продукт, но не реальную задачу команды.' },
      { title: 'Риск купить не тот стек', text: 'Ошибочный выбор платформы стоит месяцев интеграций и переработок.' }
    ],
    solutionItems: [
      { title: 'Разбираем ваш кейс до звонка', text: 'Фиксируем каналы, роли команды, CRM и желаемый результат.' },
      { title: 'Показываем живой сценарий', text: 'На встрече запускаем маршрут сообщения, AI и передачу данных в CRM.' },
      { title: 'Формируем следующий шаг', text: 'После демо у вас есть понятный план пилота, сроков и состава запуска.' }
    ],
    featureItems: [
      { title: 'Реальные каналы', text: 'Показываем на примерах, близких к вашему входящему потоку.' },
      { title: 'AI и автоматизация', text: 'Сразу видно, что можно отдать боту, а что оставить команде.' },
      { title: 'CRM-синхронизация', text: 'Демонстрируем, как карточка клиента и история диалога попадают в систему.' }
    ],
    integrationItems: [
      { label: 'WhatsApp и Telegram', text: 'Подключаем и показываем маршрут входящего сообщения.' },
      { label: 'CRM-сценарий', text: 'Показываем, как диалог, контакты и сделки оказываются в CRM.' },
      { label: 'Пилот после демо', text: 'Если сценарий подтверждается, переходим к запуску без длинной паузы.' }
    ],
    roiWithoutItems: [
      'Покупка платформы вслепую',
      'Растянутый цикл согласования',
      'Риск ошибиться с архитектурой запуска'
    ],
    roiWithItems: [
      'Видите систему на своём сценарии',
      'Быстро принимаете решение по пилоту',
      'Сразу понимаете состав первого запуска'
    ],
    roiQuote: 'Хорошее демо — это не презентация, а короткий запуск вашего процесса в боевом интерфейсе.',
    useCases: [
      { audience: 'Отделы продаж', text: 'Покажем скорость ответа, AI-квалификацию и передачу горячих лидов в CRM.' },
      { audience: 'Поддержка и сервис', text: 'Разберём очереди, SLA, шаблоны, AI-first line и маршрутизацию на операторов.' },
      { audience: 'Руководители', text: 'На встрече быстро понятно, где платформа даст экономию времени и снимет операционный хаос.' }
    ],
    faqItems: [
      { question: 'Сколько длится демо?', answer: 'Обычно 30 минут. Если сценарий сложный и включает несколько систем, встреча может идти до 45 минут.' },
      { question: 'Что нужно подготовить заранее?', answer: 'Достаточно описать каналы, CRM, состав команды и цель запуска. Этого хватает, чтобы провести предметную встречу.' },
      { question: 'Будет ли демо под наш кейс?', answer: 'Да. Мы адаптируем демонстрацию под ваш поток, а не показываем общий tour по интерфейсу.' },
      { question: 'Что происходит после демо?', answer: 'Либо фиксируем, что продукт подходит, и переходим к пилоту, либо честно говорим, если сценарий не совпадает.' }
    ],
    stickyTitle: 'Покажем Chat Plus на вашем процессе',
    stickyText: 'Приходите с реальной задачей. Уйдёте с пониманием, что именно запускать и в какой последовательности.',
    internalLinks: [
      { label: 'Цены', href: '/pricing', description: 'Понять коммерческую модель до записи' },
      { label: 'Возможности', href: '/features', description: 'Подробнее о функциях платформы' }
    ]
  }),
  makeLandingPage({
    slug: 'partnership',
    metaTitle: 'Партнёрская программа Chat Plus — для агентств и интеграторов',
    metaDescription: 'Партнёрская программа Chat Plus для агентств, интеграторов и реселлеров. Зарабатывайте на подключении и сопровождении клиентов на омниканальной платформе.',
    h1: 'Партнёрская программа Chat Plus',
    subtitle: 'Зарабатывайте на внедрении Chat Plus у своих клиентов. Агентства, интеграторы и реселлеры получают партнёрскую комиссию и приоритетную техническую поддержку.',
    problemContext: 'Клиентам нужна омниканальная автоматизация, но самостоятельное внедрение занимает месяцы. Агентства и интеграторы могут заполнить этот пробел.',
    solutionContext: 'Chat Plus предлагает партнёрскую модель с комиссией за каждого привлечённого клиента, совместными продажами и co-branding возможностями.',
    featureContext: 'Партнёры получают обучение, демо-среду, маркетинговые материалы и выделенного менеджера.',
    integrationContext: 'Партнёрский портал для отслеживания клиентов, начислений и заявок находится в разработке.',
    roiContext: 'Средний партнёр зарабатывает на повторных платежах клиентов — пассивный доход растёт с каждым новым подключением.',
    useCaseContext: 'Подходит для digital-агентств, IT-интеграторов, CRM-внедренцев и консалтинга.',
    heroTrustFacts: [
      'Комиссия с привлечённых клиентов',
      'Совместные сделки и демо',
      'Материалы и поддержка на запуске'
    ],
    problemItems: [
      { title: 'После внедрения у агентства заканчивается выручка', text: 'Проект закрыт — и доход обрывается вместе с этапом настройки.' },
      { title: 'Клиентам нужен понятный продукт, а не конструктор из сервисов', text: 'Собирать стек из нескольких подрядчиков дольше и дороже.' },
      { title: 'Сложно продавать без сильного вендора рядом', text: 'На сложных сделках нужна продуктовая команда, которая подключается в пресейл.' }
    ],
    solutionItems: [
      { title: 'Получаете продукт для повторяемых продаж', text: 'Chat Plus легко упаковывать в сценарии для отраслей, CRM и каналов.' },
      { title: 'Ведёте клиента вместе с нами', text: 'На ключевых сделках подключаемся к демо, архитектуре и запуску.' },
      { title: 'Зарабатываете не только на внедрении', text: 'Появляется повторяющаяся выручка с действующих клиентов.' }
    ],
    featureItems: [
      { title: 'Партнёрская комиссия', text: 'Доход с новых клиентов и база для долгого LTV.' },
      { title: 'Sales enablement', text: 'Презентации, демо-сценарии, продуктовые материалы и аргументы для продажи.' },
      { title: 'Техническая опора', text: 'Команда Chat Plus помогает на этапе предпродажи и запуска.' }
    ],
    integrationItems: [
      { label: 'Агентства', text: 'Можно продавать Chat Plus как часть готового клиентского сервиса.' },
      { label: 'Интеграторы', text: 'Подходит для CRM-проектов, где нужен омниканальный контур и AI.' },
      { label: 'Реселлеры', text: 'Можно строить recurring-модель на базе повторных платежей.' }
    ],
    roiWithoutItems: [
      'Разовая выручка только на проекте внедрения',
      'Длинный цикл согласования без вендорской поддержки',
      'Слабая продуктовая упаковка для продажи клиенту'
    ],
    roiWithItems: [
      'Recurring-доход с клиентской базы',
      'Совместные продажи с продуктовой командой',
      'Готовый оффер для омниканальных проектов'
    ],
    roiQuote: 'Сильная партнёрская программа — это не просто комиссия, а вендор, который помогает выигрывать сделки и удерживать клиентов.',
    useCases: [
      { audience: 'Digital-агентства', text: 'Можно добавить Chat Plus в свой пакет услуг и увеличить средний чек за сопровождение клиента.' },
      { audience: 'CRM-интеграторы', text: 'Хорошо работает как слой поверх AmoCRM, Bitrix24 и других проектов автоматизации.' },
      { audience: 'Консалтинг и аутсорсинг', text: 'Даёт понятный продукт, на котором можно строить долгосрочное сопровождение.' }
    ],
    faqItems: [
      { question: 'Кому подходит партнёрская программа?', answer: 'Агентствам, интеграторам, CRM-внедренцам, консалтингу и командам, которые уже ведут клиентские цифровые проекты.' },
      { question: 'Есть ли совместные продажи?', answer: 'Да. На перспективных сделках мы подключаемся к демо, проработке сценария и аргументации для клиента.' },
      { question: 'Что получает партнёр на старте?', answer: 'Материалы, вводное обучение, поддержку на первом кейсе и понятный сценарий входа в продажи.' },
      { question: 'Как считается вознаграждение?', answer: 'Модель зависит от формата партнёрства: referral, resale или сопровождение запуска. Условия обсуждаем на отдельной встрече.' }
    ],
    stickyTitle: 'Обсудим партнёрскую модель под ваш формат',
    stickyText: 'Разберём, как встроить Chat Plus в ваш текущий сервис, продажи и клиентское сопровождение.',
    internalLinks: [
      { label: 'Demo', href: '/demo', description: 'Обсудить партнёрский сценарий' },
      { label: 'Цены', href: '/pricing', description: 'Партнёрские условия и комиссии' }
    ]
  }),
  makeLandingPage({
    slug: 'academy',
    metaTitle: 'Академия Chat Plus',
    metaDescription: 'Гайды, разборы и рабочие материалы для команд, которые внедряют Chat Plus и запускают омниканальные сценарии без хаоса.',
    h1: 'Академия Chat Plus',
    subtitle: 'Практический раздел для onboarding, обучения команды и запуска первых сценариев без лишней ручной расшифровки.',
    problemContext: 'Обучающие разделы быстро теряют ценность, когда превращаются в архив заметок без маршрута и связи с продуктом.',
    solutionContext: 'Академия Chat Plus помогает быстрее переводить знания в рабочие действия: от понимания логики платформы до запуска конкретного сценария.',
    featureContext: 'Гайды, разборы, методички и материалы, которые удобно использовать и внутри команды, и в клиентском показе.',
    integrationContext: 'Раздел связывает знания с docs, демо и соседними сценариями, а не живет отдельным информационным островом.',
    roiContext: 'Сильная академия сокращает время на onboarding и делает запуск Chat Plus для команды намного предсказуемее.',
    useCaseContext: 'Подходит для onboarding, presale, клиентских презентаций и быстрого погружения новых специалистов в продукт.',
    internalLinks: [
      { label: 'Документация', href: '/docs', description: 'Технический слой по API, интеграциям и архитектуре.' },
      { label: 'Блог', href: '/blog', description: 'Кейсы, заметки и практические материалы по автоматизации.' }
    ]
  }),
  makeLandingPage({
    slug: 'blog',
    metaTitle: 'Блог Chat Plus — советы по автоматизации и омниканальным продажам',
    metaDescription: 'Полезные статьи о автоматизации коммуникации, мессенджер-маркетинге, AI-агентах и CRM-интеграциях. Кейсы клиентов Chat Plus.',
    h1: 'Блог Chat Plus',
    subtitle: 'Практические статьи об омниканальных продажах, автоматизации с AI и работе с клиентами в мессенджерах. Кейсы, гайды и обзоры для бизнеса.',
    problemContext: 'Бизнесу нужны практические материалы, а не абстрактные советы — конкретные кейсы и инструкции по настройке.',
    solutionContext: 'В блоге Chat Plus — только практика: кейсы реальных клиентов, пошаговые гайды и разборы инструментов.',
    featureContext: 'Статьи об AI-агентах, рассылках, CRM-интеграциях и отраслевых кейсах.',
    integrationContext: 'Материалы о Zapier, AmoCRM, Bitrix24, WhatsApp API и других инструментах.',
    roiContext: 'Читатели блога внедряют решения быстрее — они уже знают что работает.',
    useCaseContext: 'Подходит для маркетологов, владельцев бизнеса и руководителей отделов продаж.',
    internalLinks: [
      { label: 'Академия', href: '/academy', description: 'Обучающие материалы и видеокурсы' },
      { label: 'Документация', href: '/docs', description: 'Техническая документация' }
    ]
  }),
  makeLandingPage({
    slug: 'docs',
    metaTitle: 'Документация Chat Plus',
    metaDescription: 'API, интеграции, ограничения и технические материалы, которые помогают быстрее запускать Chat Plus в реальном проекте.',
    h1: 'Документация Chat Plus',
    subtitle: 'Единый технический слой по API, интеграциям и ограничениям платформы, который помогает быстрее перейти от интереса к рабочему запуску.',
    problemContext: 'Техническая документация не должна выглядеть как случайный набор статей без маршрута, контекста и понятного перехода дальше.',
    solutionContext: 'Документация Chat Plus помогает быстро найти технический ответ и связывает его с реальным сценарием внедрения.',
    featureContext: 'Материалы по API, интеграциям, ограничениям, логике платформы и следующему шагу для команды внедрения.',
    integrationContext: 'Раздел связан со справкой, демо и продуктовыми страницами, поэтому не выпадает из общей логики сайта.',
    roiContext: 'Чем понятнее технический слой, тем меньше ручных объяснений и тем быстрее команда переходит к рабочему пилоту.',
    useCaseContext: 'Документация нужна клиентским техлидам, интеграторам, presale и внутренним командам запуска.',
    internalLinks: [
      { label: 'Помощь', href: '/help', description: 'Справочный маршрут для быстрых ответов на частые вопросы.' },
      { label: 'Статус', href: '/status', description: 'Прозрачная картина по доступности сервисов и изменениям.' }
    ]
  }),
  makeLandingPage({
    slug: 'help',
    metaTitle: 'Справка Chat Plus',
    metaDescription: 'Справочный слой Chat Plus для onboarding, частых вопросов и понятной навигации по следующему шагу.',
    h1: 'Справка Chat Plus',
    subtitle: 'Понятный справочный слой, который помогает быстро снять вопрос, не потерять контекст и перейти к следующему осмысленному шагу.',
    problemContext: 'Справочные страницы быстро теряют ценность, если расползаются по коду, звучат сухо и не ведут пользователя дальше.',
    solutionContext: 'Справка Chat Plus работает как быстрый маршрут: закрывает типовой вопрос и сразу предлагает логичное продолжение.',
    featureContext: 'FAQ, перелинковка, связка с docs и CTA позволяют использовать страницу и как help-слой, и как presale-ресурс.',
    integrationContext: 'Раздел не живет отдельно: он связан с документацией, демо и соседними сценариями сайта.',
    roiContext: 'Хорошая справка снижает количество ручных объяснений и ускоряет переход от вопроса к действию.',
    useCaseContext: 'Подходит для onboarding, клиентской поддержки, presale и навигации по продукту после первого интереса.',
    internalLinks: [
      { label: 'Документация', href: '/docs', description: 'Технический слой по API, интеграциям и архитектуре.' },
      { label: 'Демо', href: '/demo', description: 'Связаться с командой и разобрать ваш сценарий.' }
    ]
  }),
  makeLandingPage({
    slug: 'status',
    metaTitle: 'Статус Chat Plus',
    metaDescription: 'Прозрачный служебный слой Chat Plus о доступности сервисов, изменениях и рабочем состоянии платформы.',
    h1: 'Статус Chat Plus',
    subtitle: 'Служебная страница для прозрачной картины по доступности сервисов, изменениям и рабочему ритму команды.',
    problemContext: 'Даже сильный продукт теряет доверие, если в момент инцидента или обновления пользователь не понимает, что происходит и где искать статус.',
    solutionContext: 'Статус Chat Plus должен быстро показывать текущую картину по сервисам и не смешивать служебную коммуникацию с маркетинговыми сообщениями.',
    featureContext: 'Раздел поддерживает доверие, снимает часть вопросов у клиентов и помогает быстрее сориентироваться команде.',
    integrationContext: 'Статус связан со справкой, docs и support-маршрутом, поэтому остается частью общей логики продукта.',
    roiContext: 'Чем прозрачнее служебный слой, тем спокойнее клиентский контур и тем меньше ручной нагрузки на команду поддержки.',
    useCaseContext: 'Страница статуса нужна для доверия, прозрачности и быстрого объяснения текущего состояния платформы клиентам и партнерам.',
    internalLinks: [
      { label: 'Помощь', href: '/help', description: 'Получить справку и инструкции по следующему шагу.' },
      { label: 'Документация', href: '/docs', description: 'Технические материалы по API, интеграциям и ограничениям.' }
    ]
  })
];

const managedLandingPages = loadJsonIfExists('cms/seed/generated/landingPages.json');
const managedTendersPage = loadJsonIfExists('cms/seed/generated/tendersPage.json');
const managedSiteSetting = loadJsonIfExists('cms/seed/generated/siteSetting.json');
const managedBusinessTypesPage = loadJsonIfExists('cms/seed/generated/businessTypesPage.json');

async function main() {
  console.log(`Seeding ${STRAPI_URL}`);
  await seedCollection('channels', channels);
  await seedCollection('industries', industries);
  await seedCollection('integrations', integrations);
  await seedCollection('features', features);
  await seedCollection('solutions', solutions);
  await seedCollection('business-types', businessTypes);
  await seedCollection('competitors', competitors);
  await upsertSingle('site-setting', managedSiteSetting || siteSetting);
  console.log('\n- upserted site-setting');
  await seedCollection('landing-pages', managedLandingPages || landingPages);
  await upsertSingle('business-types-page', managedBusinessTypesPage || businessTypesPage);
  console.log('\n- upserted business-types-page');
  await upsertSingle('tenders-page', managedTendersPage || tendersPage);
  console.log('- upserted tenders-page');
  console.log('\nDone');
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});





