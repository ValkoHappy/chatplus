/**
 * Seed script: загружает статические данные в Strapi 5
 *
 * Запуск:
 *   node scripts/seed-strapi.mjs
 *
 * Требует: Strapi запущен на localhost:1337, STRAPI_TOKEN задан в portal/.env
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Читаем токен из portal/.env
const envPath = resolve(__dirname, '../portal/.env');
const envContent = readFileSync(envPath, 'utf-8');
const tokenMatch = envContent.match(/STRAPI_TOKEN=(.+)/);
const STRAPI_TOKEN = tokenMatch ? tokenMatch[1].trim() : '';
const STRAPI_URL = 'http://localhost:1337';

if (!STRAPI_TOKEN) {
  console.error('STRAPI_TOKEN не найден в portal/.env');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${STRAPI_TOKEN}`,
};

async function postToStrapi(endpoint, data) {
  const res = await fetch(`${STRAPI_URL}/api/${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data }),
  });
  const json = await res.json();
  if (!res.ok) {
    console.error(`  ✗ Ошибка: ${JSON.stringify(json.error?.message || json)}`);
    return false;
  }
  return true;
}

async function seedCollection(name, endpoint, items) {
  console.log(`\nЗагружаю ${name} (${items.length} записей)...`);
  let ok = 0;
  for (const item of items) {
    const success = await postToStrapi(endpoint, item);
    if (success) { ok++; process.stdout.write('.'); }
    else { process.stdout.write('x'); }
  }
  console.log(`\n  ${ok}/${items.length} загружено`);
}

// --- Данные ---

const channels = [
  { slug: "whatsapp", name: "WhatsApp", icon: "simple-icons:whatsapp", description: "Подключите WhatsApp Business API без наценок на сообщения. Рассылки, чат-боты, AI-агенты.", features: ["Официальный WhatsApp Business API", "Массовые рассылки", "AI-автоответы", "Интеграция с CRM"], cta: "Подключить WhatsApp" },
  { slug: "telegram", name: "Telegram", icon: "simple-icons:telegram", description: "Telegram-боты и каналы для бизнеса. Автоматизация, рассылки, поддержка клиентов.", features: ["Telegram-боты", "Каналы и группы", "Inline-кнопки", "Платежи через Telegram Pay"], cta: "Подключить Telegram" },
  { slug: "viber", name: "Viber", icon: "simple-icons:viber", description: "Viber для бизнеса — бесплатные сообщения клиентам, которые уже используют Viber.", features: ["Viber Business Messages", "Рассылки", "Чат-боты", "Аналитика доставки"], cta: "Подключить Viber" },
  { slug: "instagram", name: "Instagram", icon: "simple-icons:instagram", description: "Автоответы в Instagram Direct. Обрабатывайте заявки из сторис и постов автоматически.", features: ["Instagram Direct API", "Ответы на комментарии", "Stories автоматизация", "Интеграция с каталогом"], cta: "Подключить Instagram" },
  { slug: "sms", name: "SMS", icon: "lucide:smartphone", description: "SMS-рассылки и уведомления. Высокая открываемость — 98% сообщений читают в первые 3 минуты.", features: ["Массовые SMS-рассылки", "Персонализация", "Статистика доставки", "Двусторонний SMS"], cta: "Подключить SMS" },
  { slug: "email", name: "Email", icon: "lucide:mail", description: "Email-маркетинг в связке с мессенджерами. Единая история переписки с клиентом.", features: ["SMTP интеграция", "Шаблоны писем", "Автосерии", "Единый инбокс"], cta: "Подключить Email" },
  { slug: "voip", name: "VoIP / Звонки", icon: "lucide:phone", description: "IP-телефония прямо в платформе. Звонки, запись разговоров, автодозвон.", features: ["SIP/VoIP интеграция", "Запись звонков", "Автодозвон", "История в карточке клиента"], cta: "Подключить VoIP" },
];

const industries = [
  { slug: "beauty", name: "Салоны красоты", icon: "lucide:scissors", description: "Автозапись клиентов из WhatsApp и Telegram. Снизьте количество неявок на 40%.", pain: "Администраторы тонут в сообщениях, клиенты не приходят без напоминаний.", solution: "AI читает сообщения и автоматически создаёт запись в Altegio/YCLIENTS.", features: ["Автозапись из мессенджеров", "Напоминания о визите", "Интеграция с Altegio", "Рассылки по базе"], cta: "Попробовать для салона" },
  { slug: "med", name: "Медицина", icon: "lucide:heart-pulse", description: "Запись к врачу через WhatsApp и Telegram. Напоминания, анкеты, результаты анализов — автоматически.", pain: "Колл-центр перегружен, пациенты не записываются онлайн, много неявок.", solution: "Чат-бот записывает к нужному врачу, уточняет жалобы и напоминает о приёме.", features: ["Запись к врачу 24/7", "Предварительные анкеты", "Напоминания о приёме", "Телемедицина в чате"], cta: "Попробовать для клиники" },
  { slug: "fitness", name: "Фитнес", icon: "lucide:dumbbell", description: "Запись на тренировки и управление абонементами через мессенджеры. Больше продлений, меньше оттока.", pain: "Клиенты замораживают абонементы, не продлевают, уходят без предупреждения.", solution: "AI отслеживает активность клиента и предлагает продление в нужный момент.", features: ["Запись на тренировки", "Управление абонементами", "Продление через чат", "Уведомления о расписании"], cta: "Попробовать для фитнес-клуба" },
  { slug: "horeca", name: "Рестораны и отели", icon: "lucide:utensils", description: "Бронирование столиков и номеров через Instagram и Telegram. Автоподтверждения и напоминания.", pain: "Звонки с бронированием пропускаются, столики простаивают, нет напоминаний.", solution: "Гость пишет в Instagram — AI бронирует, подтверждает и напоминает за час.", features: ["Бронирование столиков", "Управление номерами", "Программа лояльности", "Сбор отзывов"], cta: "Попробовать для ресторана" },
  { slug: "real-estate", name: "Недвижимость", icon: "lucide:home", description: "Обработка заявок с Авито, ЦИАН и сайта в одном окне. Автоматическое назначение показов.", pain: "Заявки теряются в разных каналах, менеджеры не успевают отвечать быстро.", solution: "Все входящие в одном инбоксе, AI квалифицирует лид и записывает на показ.", features: ["Единый инбокс", "Квалификация лидов", "Запись на показы", "Интеграция с CRM"], cta: "Попробовать для агентства" },
  { slug: "hr", name: "HR и рекрутинг", icon: "lucide:users", description: "Автоматизация найма: отбор резюме, назначение собеседований, онбординг через мессенджеры.", pain: "HR тратит часы на переписку с кандидатами и организацию собеседований.", solution: "Бот собирает данные кандидата, AI оценивает и назначает собеседование в календарь.", features: ["Скрининг кандидатов", "Назначение собеседований", "Онбординг через чат", "HR-рассылки"], cta: "Попробовать для HR" },
  { slug: "education", name: "Образование", icon: "lucide:graduation-cap", description: "Запись на курсы, напоминания о занятиях и коммуникация со студентами через мессенджеры.", pain: "Студенты пропускают занятия, не получают домашние задания вовремя.", solution: "Автоматические напоминания о занятиях, рассылка материалов, сбор ДЗ через чат.", features: ["Запись на курсы", "Напоминания о занятиях", "Рассылка материалов", "Сбор ДЗ"], cta: "Попробовать для учебного центра" },
  { slug: "auto", name: "Автобизнес", icon: "lucide:car", description: "Запись на сервис, уведомления о готовности авто, продажа запчастей через WhatsApp.", pain: "Клиенты не знают статус ремонта, мастера теряют заявки, нет повторных продаж.", solution: "Автоуведомления о статусе ремонта, запись на ТО из чата, предложения по запчастям.", features: ["Запись на сервис", "Статус ремонта в чат", "Продажа запчастей", "Напоминания о ТО"], cta: "Попробовать для автосервиса" },
  { slug: "travel", name: "Туризм", icon: "lucide:plane", description: "Подбор туров, бронирование и сопровождение туристов через мессенджеры 24/7.", pain: "Туристы пишут в разные каналы, менеджеры теряют заявки, нет сопровождения.", solution: "AI консультирует по турам, собирает заявку и передаёт менеджеру готового клиента.", features: ["Подбор туров через чат", "Бронирование онлайн", "Документы в мессенджер", "Поддержка в поездке"], cta: "Попробовать для турагентства" },
  { slug: "insurance", name: "Страхование", icon: "lucide:shield", description: "Консультации по полисам, оформление ОСАГО и КАСКО через WhatsApp без офиса.", pain: "Клиенты не хотят звонить, оформление страховки долгое и сложное.", solution: "Бот собирает данные авто, рассчитывает стоимость и оформляет полис прямо в чате.", features: ["Расчёт стоимости в чате", "Оформление полисов", "Напоминания о продлении", "Урегулирование убытков"], cta: "Попробовать для страховой" },
  { slug: "legal", name: "Юридические услуги", icon: "lucide:scale", description: "Первичные консультации, сбор документов и ведение дел через мессенджеры.", pain: "Потенциальные клиенты не доходят до офиса, первичная квалификация занимает часы.", solution: "Бот проводит первичную квалификацию дела и записывает на консультацию к юристу.", features: ["Первичная консультация", "Сбор документов", "Запись к юристу", "Статус дела в чате"], cta: "Попробовать для юридической фирмы" },
  { slug: "retail", name: "Ритейл", icon: "lucide:shopping-bag", description: "Поддержка покупателей, статус заказов и возвраты через мессенджеры.", pain: "Колл-центр перегружен, покупатели ждут часами, много негативных отзывов.", solution: "AI отвечает на вопросы о заказах, наличии и возвратах без участия оператора.", features: ["Статус заказа в чат", "Возвраты через мессенджер", "Брошенные корзины", "Программа лояльности"], cta: "Попробовать для магазина" },
  { slug: "logistics", name: "Логистика", icon: "lucide:truck", description: "Уведомления о доставке, статус груза и коммуникация с водителями через мессенджеры.", pain: "Клиенты постоянно звонят с вопросом 'где мой груз', диспетчеры перегружены.", solution: "Автоматические уведомления о статусе доставки, трекинг в чате, алерты о задержках.", features: ["Трекинг в мессенджере", "Уведомления о доставке", "Коммуникация с водителями", "Алерты о задержках"], cta: "Попробовать для логистики" },
  { slug: "crypto", name: "Крипто и Web3", icon: "lucide:bitcoin", description: "Поддержка трейдеров, уведомления о сделках и KYC через мессенджеры.", pain: "Трейдеры требуют мгновенных ответов, KYC медленный, поддержка 24/7 дорого.", solution: "AI отвечает на типовые вопросы, проводит первичный KYC и эскалирует сложные случаи.", features: ["Поддержка трейдеров 24/7", "KYC в мессенджере", "Уведомления о сделках", "Алерты о курсах"], cta: "Попробовать для крипто-биржи" },
  { slug: "fintech", name: "Финтех", icon: "lucide:credit-card", description: "Клиентский сервис для банков и финтех-стартапов через мессенджеры.", pain: "Банки теряют клиентов из-за плохой поддержки, онбординг медленный.", solution: "AI проводит онбординг новых клиентов, отвечает на вопросы и решает типовые проблемы.", features: ["Онбординг клиентов", "Поддержка 24/7", "Уведомления об операциях", "Compliance-режим"], cta: "Попробовать для финтех" },
];

const integrations = [
  { slug: "amocrm", name: "AmoCRM", icon: "lucide:link-2", category: "CRM", description: "Все переписки из WhatsApp, Telegram и Instagram автоматически попадают в AmoCRM. Сделки создаются сами.", features: ["Автосоздание сделок", "Синхронизация контактов", "Задачи из чата", "Воронка в мессенджерах"], cta: "Подключить AmoCRM" },
  { slug: "bitrix24", name: "Bitrix24", icon: "lucide:building-2", category: "CRM", description: "Интеграция Chat Plus с Bitrix24 — звонки, чаты и заявки в одном месте.", features: ["Открытые линии", "Автосоздание лидов", "CRM-формы в мессенджерах", "Задачи и проекты"], cta: "Подключить Bitrix24" },
  { slug: "altegio", name: "Altegio", icon: "lucide:calendar-check", category: "Запись", description: "Онлайн-запись из мессенджеров прямо в Altegio. Клиент пишет — AI записывает.", features: ["Автозапись из WhatsApp", "Синхронизация расписания", "Напоминания клиентам", "Журнал записей"], cta: "Подключить Altegio" },
  { slug: "yclients", name: "YCLIENTS", icon: "lucide:calendar-days", category: "Запись", description: "YCLIENTS + Chat Plus — автоматизация записи для салонов, клиник и фитнес-клубов.", features: ["Запись через мессенджеры", "Уведомления о визите", "Сбор отзывов", "Управление базой клиентов"], cta: "Подключить YCLIENTS" },
  { slug: "hubspot", name: "HubSpot", icon: "simple-icons:hubspot", category: "CRM", description: "Объедините HubSpot с мессенджерами. Все контакты, сделки и переписки в одном месте.", features: ["Синхронизация контактов", "Автообновление сделок", "Workflows из чата", "Аналитика"], cta: "Подключить HubSpot" },
  { slug: "salesforce", name: "Salesforce", icon: "simple-icons:salesforce", category: "CRM", description: "Интеграция Chat Plus с Salesforce — все переписки и лиды из мессенджеров в вашем CRM.", features: ["Автосоздание лидов", "Синхронизация контактов", "Активности из чата", "Отчёты и дашборды"], cta: "Подключить Salesforce" },
  { slug: "pipedrive", name: "Pipedrive", icon: "lucide:bar-chart-2", category: "CRM", description: "Переписки из мессенджеров автоматически привязываются к сделкам в Pipedrive.", features: ["Логирование переписок", "Автообновление сделок", "Напоминания", "Отчёты"], cta: "Подключить Pipedrive" },
  { slug: "google-calendar", name: "Google Calendar", icon: "simple-icons:googlecalendar", category: "Календарь", description: "AI создаёт события в Google Calendar прямо из разговора. Клиент подтвердил — встреча в календаре.", features: ["Автосоздание событий", "Приглашения участникам", "Напоминания", "Синхронизация расписания"], cta: "Подключить Google Calendar" },
  { slug: "zapier", name: "Zapier", icon: "simple-icons:zapier", category: "Автоматизация", description: "Подключите Chat Plus к 5000+ приложениям через Zapier. Без кода.", features: ["5000+ интеграций", "Триггеры из чатов", "Автоматические действия", "Мультишаговые запы"], cta: "Подключить Zapier" },
  { slug: "n8n", name: "n8n", icon: "simple-icons:n8n", category: "Автоматизация", description: "Self-hosted автоматизация через n8n. Полный контроль над данными, без ограничений.", features: ["Self-hosted", "Webhook интеграция", "Сложные воронки", "Без лимитов"], cta: "Подключить n8n" },
  { slug: "shopify", name: "Shopify", icon: "simple-icons:shopify", category: "E-commerce", description: "Уведомления о заказах, брошенные корзины и поддержка покупателей через мессенджеры.", features: ["Уведомления о заказах", "Брошенные корзины", "Статус доставки", "Возвраты через чат"], cta: "Подключить Shopify" },
  { slug: "notion", name: "Notion", icon: "simple-icons:notion", category: "Продуктивность", description: "Сохраняйте важные переписки и данные клиентов прямо в Notion базы данных.", features: ["Сохранение переписок", "База данных клиентов", "Задачи из чата", "Шаблоны"], cta: "Подключить Notion" },
  { slug: "1c", name: "1С", icon: "lucide:factory", category: "ERP", description: "Синхронизация заказов, клиентов и складских остатков между 1С и мессенджерами.", features: ["Синхронизация клиентов", "Статус заказов из 1С", "Уведомления об оплате", "Остатки на складе"], cta: "Подключить 1С" },
  { slug: "make", name: "Make (Integromat)", icon: "simple-icons:make", category: "Автоматизация", description: "Визуальная автоматизация через Make. Сотни сценариев для мессенджеров без кода.", features: ["Визуальный редактор", "500+ приложений", "Сложные сценарии", "Роутинг данных"], cta: "Подключить Make" },
  { slug: "woocommerce", name: "WooCommerce", icon: "simple-icons:woocommerce", category: "E-commerce", description: "Уведомления о заказах WordPress/WooCommerce прямо в WhatsApp и Telegram покупателя.", features: ["Статус заказа в чат", "Брошенные корзины", "Поддержка покупателей", "Отзывы после покупки"], cta: "Подключить WooCommerce" },
  { slug: "outlook", name: "Outlook", icon: "simple-icons:microsoftoutlook", category: "Календарь", description: "AI создаёт встречи в Outlook Calendar из переписки. Корпоративный стандарт для Enterprise.", features: ["Автосоздание встреч", "Приглашения коллегам", "Синхронизация с Teams", "Exchange поддержка"], cta: "Подключить Outlook" },
];

const features = [
  { slug: "ai", name: "AI-агенты", icon: "lucide:bot", description: "AI отвечает клиентам 24/7, квалифицирует лиды и записывает на встречи — без участия человека.", features: ["Ответы 24/7", "Квалификация лидов", "Автозапись в календарь", "Обучаемый на ваших данных"], cta: "Попробовать AI" },
  { slug: "bots", name: "Чат-боты", icon: "lucide:cpu", description: "Конструктор чат-ботов без кода. Воронки, сценарии, кнопки — всё через визуальный редактор.", features: ["Визуальный конструктор", "Условная логика", "Кнопки и быстрые ответы", "A/B тесты"], cta: "Создать бота" },
  { slug: "broadcasting", name: "Рассылки", icon: "lucide:megaphone", description: "Массовые рассылки по WhatsApp, Telegram и SMS. Персонализация, сегментация, аналитика.", features: ["Массовые рассылки", "Сегментация базы", "Персонализация", "Аналитика открытий"], cta: "Запустить рассылку" },
  { slug: "automation", name: "Автоматизация", icon: "lucide:settings", description: "No-code конструктор воронок. Автоответы, триггеры, условия — без программиста.", features: ["No-code воронки", "Триггеры и условия", "Тайминг сообщений", "Интеграция с CRM"], cta: "Настроить автоматизацию" },
  { slug: "analytics", name: "Аналитика", icon: "lucide:bar-chart-2", description: "Полная статистика по каналам, агентам и воронкам. Знайте что работает, а что нет.", features: ["Дашборд в реальном времени", "Отчёты по агентам", "Конверсия воронок", "Экспорт данных"], cta: "Смотреть аналитику" },
  { slug: "api", name: "API", icon: "lucide:plug", description: "REST API и вебхуки для разработчиков. Полная интеграция в любую систему.", features: ["REST API", "Webhooks", "SDK", "Документация"], cta: "Смотреть документацию" },
  { slug: "white-label", name: "White-Label", icon: "lucide:tag", description: "Продавайте Chat Plus под своим брендом. Полная кастомизация для агентств и реселлеров.", features: ["Свой домен и логотип", "Кастомные цвета", "Отдельные аккаунты клиентов", "Ваш прайс-лист"], cta: "Стать реселлером" },
  { slug: "calls", name: "Звонки", icon: "lucide:phone", description: "VoIP-звонки прямо в платформе. История переписки и звонков в одной карточке клиента.", features: ["IP-телефония", "Запись разговоров", "Автодозвон", "Транскрибация звонков"], cta: "Подключить звонки" },
];

const solutions = [
  { slug: "sales", name: "Продажи", icon: "lucide:trending-up", description: "Увеличьте конверсию лидов с помощью автоматических follow-up в мессенджерах.", pain: "Менеджеры теряют лиды, не успевают отвечать быстро, нет системы follow-up.", solution: "AI мгновенно отвечает на первое сообщение, квалифицирует лид и передаёт менеджеру только готовых к покупке.", features: ["Мгновенный первый ответ", "Квалификация лидов AI", "Автоматический follow-up", "Сделки в CRM автоматически"], cta: "Увеличить продажи" },
  { slug: "support", name: "Служба поддержки", icon: "lucide:headphones", description: "Омниканальный хелпдеск. Все обращения в одном окне — WhatsApp, Telegram, Email, соцсети.", pain: "Операторы переключаются между 5+ вкладками, клиенты ждут ответа часами, нет истории обращений.", solution: "Единый инбокс для всех каналов. AI решает типовые вопросы сам, сложные — маршрутизирует нужному специалисту.", features: ["Единый инбокс", "AI первая линия", "Умная маршрутизация", "SLA и отчёты"], cta: "Улучшить поддержку" },
  { slug: "hr", name: "HR и рекрутинг", icon: "lucide:users", description: "Автоматизируйте найм: скрининг резюме, назначение собеседований, онбординг — всё через мессенджеры.", pain: "HR тратит 80% времени на рутину: ответы кандидатам, координацию собеседований, отправку документов.", solution: "Бот собирает данные кандидата, AI оценивает и назначает собеседование в календарь без участия HR.", features: ["Скрининг кандидатов", "Автоназначение собеседований", "Онбординг через чат", "HR-рассылки"], cta: "Автоматизировать найм" },
  { slug: "marketing", name: "Маркетинг", icon: "lucide:megaphone", description: "Рассылки, чат-боты для лид-магнитов и автоматические воронки прогрева. Мессенджеры вместо email.", pain: "Email-рассылки дают 15-20% open rate. Мессенджеры — 80-95%. Но настройка сложна.", solution: "Конструктор воронок в мессенджерах без кода. Лид-магниты, прогрев, продажа — автоматически.", features: ["Воронки в мессенджерах", "Лид-магниты", "Сегментация базы", "A/B тесты"], cta: "Запустить маркетинг" },
  { slug: "nps", name: "NPS и обратная связь", icon: "lucide:star", description: "Собирайте NPS и отзывы автоматически после каждого контакта с клиентом. Прямо в WhatsApp.", pain: "Клиенты не заполняют длинные анкеты на сайте. Реальная обратная связь не собирается.", solution: "После визита или звонка клиент получает 1 вопрос в WhatsApp. Ответить — 1 нажатие. Конверсия 60%+.", features: ["Автосбор NPS", "Отзывы после визита", "Дашборд обратной связи", "Алерты на негатив"], cta: "Начать собирать NPS" },
  { slug: "retention", name: "Удержание клиентов", icon: "lucide:refresh-cw", description: "Автоматические кампании по реактивации спящих клиентов. Напомните о себе в нужный момент.", pain: "Клиенты уходят молча. База стареет, повторных покупок мало.", solution: "AI отслеживает активность клиента и автоматически отправляет персональное предложение в нужный момент.", features: ["Реактивация спящих", "Персональные предложения", "Программа лояльности", "Аналитика оттока"], cta: "Удержать клиентов" },
];

// --- Запуск ---

async function main() {
  console.log('🚀 Seed Strapi — Chat Plus\n');
  console.log(`URL: ${STRAPI_URL}`);
  console.log(`Token: ${STRAPI_TOKEN.slice(0, 20)}...`);

  await seedCollection('Каналы', 'channels', channels);
  await seedCollection('Отрасли', 'industries', industries);
  await seedCollection('Интеграции', 'integrations', integrations);
  await seedCollection('Возможности', 'features', features);
  await seedCollection('Решения', 'solutions', solutions);

  console.log('\n✅ Seed завершён!');
  console.log('Открой http://localhost:1337/admin чтобы проверить данные.');
  console.log('Не забудь опубликовать (publish) все записи в Strapi!');
}

main().catch(err => {
  console.error('\n❌ Ошибка:', err.message);
  process.exit(1);
});
