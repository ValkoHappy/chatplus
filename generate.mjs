// generate.mjs — генерация контента для Chat Plus
// Сейчас: шаблонный режим
// Потом: добавь ANTHROPIC_API_KEY в .env — автоматически переключится на Claude

import 'dotenv/config';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

// === ГЕНЕРАЦИЯ КОНТЕНТА ===
async function generateContent(type, item) {
  if (ANTHROPIC_API_KEY) {
    // Claude API — подключится автоматически когда добавишь ключ
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `Напиши SEO-оптимизированный текст для страницы на сайте Chat Plus.

Тип: ${type}
Название: ${item.name}
Описание: ${item.description}
Проблема клиента: ${item.pain || ''}
Решение: ${item.solution || ''}
Возможности: ${item.features ? item.features.join(', ') : ''}

Напиши 4 абзаца уникального контента на русском. Первый абзац — проблема, второй — решение Chat Plus, третий — конкретные выгоды, четвёртый — призыв к действию. Без markdown, только текст. Минимум 400 слов.`
        }]
      })
    });
    const data = await res.json();
    if (data.content) return data.content[0].text;
    console.error('Claude API error:', data);
  }

  // Шаблонная генерация (без API ключа)
  return [
    `${item.name} — одно из ключевых направлений Chat Plus. ${item.description}`,
    item.pain ? `Многие компании сталкиваются с этой проблемой каждый день: ${item.pain} Это приводит к потере клиентов, лишним расходам и стрессу для сотрудников. Chat Plus создан именно для того, чтобы решить эту задачу раз и навсегда.` : '',
    item.solution ? `Наш подход прост и эффективен: ${item.solution} Клиенты Chat Plus отмечают результат уже в первую неделю после подключения. Автоматизация освобождает время сотрудников для действительно важных задач.` : '',
    `Chat Plus предоставляет всё необходимое: ${item.features ? item.features.join(', ') : 'автоматизацию, интеграции и AI-агентов'}. Начните с бесплатного 14-дневного периода — никаких обязательств, настройка за 15 минут.`,
  ].filter(Boolean).join('\n\n');
}

// === ЗАГРУЗКА В STRAPI ===
async function uploadToStrapi(endpoint, slug, content, item) {
  const headers = {
    'Authorization': `Bearer ${STRAPI_TOKEN}`,
    'Content-Type': 'application/json',
  };

  // Проверяем существует ли запись
  const check = await fetch(`${STRAPI_URL}/api/${endpoint}?filters[slug][$eq]=${slug}`, { headers });
  const existing = await check.json();

  const body = {
    data: {
      slug,
      name: item.name,
      description: item.description,
      content,
      seo_title: `Chat Plus ${item.name} — автоматизация через мессенджеры`,
      seo_description: item.description.slice(0, 160),
      features: item.features || [],
      cta: item.cta || 'Попробовать бесплатно',
    }
  };

  if (existing.data?.length > 0) {
    const docId = existing.data[0].documentId;
    const res = await fetch(`${STRAPI_URL}/api/${endpoint}/${docId}`, {
      method: 'PUT', headers, body: JSON.stringify(body)
    });
    return res.ok ? 'обновлено' : `ошибка ${res.status}`;
  } else {
    const res = await fetch(`${STRAPI_URL}/api/${endpoint}`, {
      method: 'POST', headers, body: JSON.stringify(body)
    });
    return res.ok ? 'создано' : `ошибка ${res.status}`;
  }
}

// === ДАННЫЕ ===
const channels = [
  { slug: "whatsapp", name: "WhatsApp", description: "Подключите WhatsApp Business API без наценок. Рассылки, чат-боты, AI-агенты.", pain: "Бизнес теряет клиентов из-за медленных ответов и отсутствия автоматизации в WhatsApp.", solution: "Chat Plus подключает WhatsApp Business API и автоматизирует ответы через AI.", features: ["Официальный WhatsApp Business API", "Массовые рассылки", "AI-автоответы", "Интеграция с CRM"], cta: "Подключить WhatsApp" },
  { slug: "telegram", name: "Telegram", description: "Telegram-боты и каналы для бизнеса. Автоматизация, рассылки, поддержка клиентов.", pain: "Telegram-боты требуют программиста, рассылки сложно настроить.", solution: "Chat Plus даёт конструктор Telegram-ботов без кода и встроенные рассылки.", features: ["Telegram-боты без кода", "Каналы и группы", "Inline-кнопки", "Платежи через Telegram Pay"], cta: "Подключить Telegram" },
  { slug: "viber", name: "Viber", description: "Viber для бизнеса — бесплатные сообщения клиентам.", pain: "Viber Business сложно настроить без технических знаний.", solution: "Chat Plus подключает Viber за 15 минут и автоматизирует переписку.", features: ["Viber Business Messages", "Рассылки", "Чат-боты", "Аналитика доставки"], cta: "Подключить Viber" },
  { slug: "instagram", name: "Instagram", description: "Автоответы в Instagram Direct. Обрабатывайте заявки из сторис и постов автоматически.", pain: "Сотни комментариев и DM остаются без ответа — теряются клиенты.", solution: "AI отвечает в Instagram Direct и комментариях автоматически, 24/7.", features: ["Instagram Direct API", "Ответы на комментарии", "Stories автоматизация", "Интеграция с каталогом"], cta: "Подключить Instagram" },
  { slug: "sms", name: "SMS", description: "SMS-рассылки и уведомления. 98% сообщений читают в первые 3 минуты.", pain: "SMS-рассылки дорогие и сложные в настройке у большинства провайдеров.", solution: "Chat Plus интегрирует SMS в единый инбокс с мессенджерами по лучшей цене.", features: ["Массовые SMS-рассылки", "Персонализация", "Статистика доставки", "Двусторонний SMS"], cta: "Подключить SMS" },
  { slug: "email", name: "Email", description: "Email-маркетинг в связке с мессенджерами. Единая история переписки.", pain: "Email и мессенджеры живут отдельно — нет единой истории клиента.", solution: "Chat Plus объединяет Email и мессенджеры в одной карточке клиента.", features: ["SMTP интеграция", "Шаблоны писем", "Автосерии", "Единый инбокс"], cta: "Подключить Email" },
  { slug: "voip", name: "VoIP / Звонки", description: "IP-телефония прямо в платформе. Звонки, запись разговоров, автодозвон.", pain: "Звонки и чаты хранятся в разных системах — нет полной картины клиента.", solution: "Chat Plus объединяет звонки и переписку в одной карточке.", features: ["SIP/VoIP интеграция", "Запись звонков", "Автодозвон", "История в карточке клиента"], cta: "Подключить VoIP" },
];

const industries = [
  { slug: "beauty", name: "Салоны красоты", description: "Автозапись клиентов из WhatsApp и Telegram. Снизьте количество неявок на 40%.", pain: "Администраторы тонут в сообщениях, клиенты не приходят без напоминаний.", solution: "AI читает сообщения и автоматически создаёт запись в Altegio/YCLIENTS.", features: ["Автозапись из мессенджеров", "Напоминания о визите", "Интеграция с Altegio", "Рассылки по базе"], cta: "Попробовать для салона" },
  { slug: "med", name: "Медицина", description: "Запись к врачу через WhatsApp и Telegram. Напоминания, анкеты, результаты анализов.", pain: "Колл-центр перегружен, пациенты не записываются онлайн, много неявок.", solution: "Чат-бот записывает к нужному врачу, уточняет жалобы и напоминает о приёме.", features: ["Запись к врачу 24/7", "Предварительные анкеты", "Напоминания о приёме", "Телемедицина в чате"], cta: "Попробовать для клиники" },
  { slug: "fitness", name: "Фитнес", description: "Запись на тренировки и управление абонементами через мессенджеры.", pain: "Клиенты замораживают абонементы, не продлевают, уходят без предупреждения.", solution: "AI отслеживает активность клиента и предлагает продление в нужный момент.", features: ["Запись на тренировки", "Управление абонементами", "Продление через чат", "Уведомления о расписании"], cta: "Попробовать для фитнес-клуба" },
  { slug: "horeca", name: "Рестораны и отели", description: "Бронирование столиков и номеров через Instagram и Telegram.", pain: "Звонки с бронированием пропускаются, столики простаивают.", solution: "Гость пишет в Instagram — AI бронирует, подтверждает и напоминает за час.", features: ["Бронирование столиков", "Управление номерами", "Программа лояльности", "Сбор отзывов"], cta: "Попробовать для ресторана" },
  { slug: "real-estate", name: "Недвижимость", description: "Обработка заявок с Авито, ЦИАН и сайта в одном окне.", pain: "Заявки теряются в разных каналах, менеджеры не успевают отвечать быстро.", solution: "Все входящие в одном инбоксе, AI квалифицирует лид и записывает на показ.", features: ["Единый инбокс", "Квалификация лидов", "Запись на показы", "Интеграция с CRM"], cta: "Попробовать для агентства" },
  { slug: "education", name: "Образование", description: "Запись на курсы, напоминания о занятиях и коммуникация со студентами.", pain: "Студенты пропускают занятия, не получают домашние задания вовремя.", solution: "Автоматические напоминания о занятиях, рассылка материалов, сбор ДЗ через чат.", features: ["Запись на курсы", "Напоминания о занятиях", "Рассылка материалов", "Сбор ДЗ"], cta: "Попробовать для учебного центра" },
  { slug: "auto", name: "Автобизнес", description: "Запись на сервис, уведомления о готовности авто, продажа запчастей через WhatsApp.", pain: "Клиенты не знают статус ремонта, мастера теряют заявки.", solution: "Автоуведомления о статусе ремонта, запись на ТО из чата.", features: ["Запись на сервис", "Статус ремонта в чат", "Продажа запчастей", "Напоминания о ТО"], cta: "Попробовать для автосервиса" },
  { slug: "travel", name: "Туризм", description: "Подбор туров, бронирование и сопровождение туристов через мессенджеры 24/7.", pain: "Туристы пишут в разные каналы, менеджеры теряют заявки.", solution: "AI консультирует по турам, собирает заявку и передаёт менеджеру.", features: ["Подбор туров через чат", "Бронирование онлайн", "Документы в мессенджер", "Поддержка в поездке"], cta: "Попробовать для турагентства" },
  { slug: "insurance", name: "Страхование", description: "Консультации по полисам, оформление ОСАГО и КАСКО через WhatsApp.", pain: "Клиенты не хотят звонить, оформление страховки долгое и сложное.", solution: "Бот собирает данные авто, рассчитывает стоимость и оформляет полис прямо в чате.", features: ["Расчёт стоимости в чате", "Оформление полисов", "Напоминания о продлении", "Урегулирование убытков"], cta: "Попробовать для страховой" },
  { slug: "legal", name: "Юридические услуги", description: "Первичные консультации, сбор документов и ведение дел через мессенджеры.", pain: "Потенциальные клиенты не доходят до офиса, первичная квалификация занимает часы.", solution: "Бот проводит первичную квалификацию и записывает на консультацию к юристу.", features: ["Первичная консультация", "Сбор документов", "Запись к юристу", "Статус дела в чате"], cta: "Попробовать для юридической фирмы" },
  { slug: "retail", name: "Ритейл", description: "Поддержка покупателей, статус заказов и возвраты через мессенджеры.", pain: "Колл-центр перегружен, покупатели ждут часами, много негативных отзывов.", solution: "AI отвечает на вопросы о заказах, наличии и возвратах без участия оператора.", features: ["Статус заказа в чат", "Возвраты через мессенджер", "Брошенные корзины", "Программа лояльности"], cta: "Попробовать для магазина" },
  { slug: "logistics", name: "Логистика", description: "Уведомления о доставке, статус груза и коммуникация с водителями.", pain: "Клиенты постоянно звонят с вопросом где мой груз, диспетчеры перегружены.", solution: "Автоматические уведомления о статусе доставки, трекинг в чате.", features: ["Трекинг в мессенджере", "Уведомления о доставке", "Коммуникация с водителями", "Алерты о задержках"], cta: "Попробовать для логистики" },
];

// === ЗАПУСК ===
async function main() {
  console.log(ANTHROPIC_API_KEY ? '\n🤖 Режим: Claude API\n' : '\n📝 Режим: шаблонный (добавь ANTHROPIC_API_KEY для AI-контента)\n');

  console.log('📱 Каналы...');
  for (const item of channels) {
    const content = await generateContent('channel', item);
    const status = await uploadToStrapi('channels', item.slug, content, item);
    console.log(`  ${status.includes('ошибка') ? '❌' : '✅'} ${item.name} — ${status}`);
  }

  console.log('\n🏭 Отрасли...');
  for (const item of industries) {
    const content = await generateContent('industry', item);
    const status = await uploadToStrapi('industries', item.slug, content, item);
    console.log(`  ${status.includes('ошибка') ? '❌' : '✅'} ${item.name} — ${status}`);
  }

  console.log('\n✅ Готово!\n');
}

main().catch(console.error);
