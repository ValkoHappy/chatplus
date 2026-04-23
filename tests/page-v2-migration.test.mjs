import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LEGACY_MANAGED_WAVES,
  buildLegacyManagedPageDraft,
  getLegacyManagedRouteConfig,
} from '../scripts/page-v2-generation/legacy-managed-migration.mjs';

test('legacy managed migration defines all planned waves and representative routes', () => {
  assert.deepEqual(LEGACY_MANAGED_WAVES.wave1, [
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
  ]);
  assert.deepEqual(LEGACY_MANAGED_WAVES.wave2, ['/pricing', '/partnership']);
  assert.deepEqual(LEGACY_MANAGED_WAVES.wave3, ['/', '/demo', '/solutions/tenders']);
});

test('getLegacyManagedRouteConfig returns campaign metadata for /promo', () => {
  const config = getLegacyManagedRouteConfig('/promo');

  assert.equal(config.routePath, '/promo');
  assert.equal(config.blueprint, 'campaign');
  assert.equal(config.pageKind, 'campaign');
  assert.equal(config.templateVariant, 'showcase');
  assert.equal(config.navGroup, 'special');
  assert.equal(config.showInSitemap, true);
});

test('buildLegacyManagedPageDraft converts campaign legacy content to page draft blocks', () => {
  const draft = buildLegacyManagedPageDraft({
    routePath: '/promo',
    legacyPage: {
      meta_title: 'Промо оффер',
      meta_description: 'Специальный оффер для запуска Chat Plus.',
      h1: 'Промо Chat Plus',
      subtitle: 'Собираем омниканальные сценарии без отдельной разработки.',
      hero_eyebrow: 'Спецпроект',
      hero_cta_primary_label: 'Запросить демо',
      hero_cta_primary_url: '/demo',
      hero_cta_secondary_label: 'Посмотреть тарифы',
      hero_cta_secondary_url: '/pricing',
      hero_trust_facts: ['Запуск за 14 дней', 'Сценарии под команду продаж'],
      features_title: 'Что входит',
      features: [
        { title: 'Готовые шаблоны', text: 'Сценарии под маркетинг и продажи.' },
        { title: 'Сборка под канал', text: 'Telegram, WhatsApp и email в одном контуре.' },
      ],
      solution_title: 'Как запускаем',
      solution_intro: 'Работаем по понятному production flow.',
      solution_steps: [
        { title: 'Снимаем контур', text: 'Собираем route и CTA path.' },
        { title: 'Настраиваем CMS', text: 'Подключаем редакторский workflow.' },
      ],
      faq_title: 'Частые вопросы',
      faqs: [{ question: 'Можно ли быстро стартовать?', answer: 'Да, через готовые blueprints.' }],
      internal_links_title: 'Что посмотреть дальше',
      internal_links_intro: 'Полезные маршруты для следующего шага.',
      internal_links: [{ label: 'Pricing', href: '/pricing', description: 'Сравнить тарифы.' }],
      sticky_cta_title: 'Готовы обсудить запуск?',
      sticky_cta_text: 'Покажем page-first контур и rollout plan.',
      sticky_cta_primary_label: 'Назначить звонок',
      sticky_cta_primary_url: '/demo',
      breadcrumb: [{ label: 'Главная', href: '/' }],
    },
  });

  assert.equal(draft.data.route_path, '/promo');
  assert.equal(draft.data.page_kind, 'campaign');
  assert.equal(draft.data.template_variant, 'showcase');
  assert.equal(draft.data.nav_group, 'special');
  assert.equal(draft.data.nav_label, 'Промо');
  assert.equal(draft.data.editorial_status, 'approved');
  assert.deepEqual(
    draft.data.sections.map((section) => section.__component),
    [
      'page-blocks.hero',
      'page-blocks.cards-grid',
      'page-blocks.steps',
      'page-blocks.faq',
      'page-blocks.internal-links',
      'page-blocks.final-cta',
    ],
  );
});

test('buildLegacyManagedPageDraft preserves pricing parity blocks for /pricing', () => {
  const draft = buildLegacyManagedPageDraft({
    routePath: '/pricing',
    legacyPage: {
      meta_title: 'Тарифы',
      meta_description: 'Выберите подходящий тариф Chat Plus.',
      h1: 'Тарифы Chat Plus',
      subtitle: 'Планы для запуска и роста.',
      hero_eyebrow: 'Pricing',
      hero_panel_items: [
        { title: 'Pilot', label: 'Запуск', value: '14 дней', text: 'Быстрый старт', icon: 'lucide:rocket' },
      ],
      pricing_tiers: [
        {
          name: 'Growth',
          label: 'Growth',
          price: '49 000 ₽',
          period: '/ мес',
          note: 'Для активной команды',
          text: 'Подходит для production rollout.',
          cta: 'Выбрать план',
          features: ['Омниканальные сценарии', 'Редакторские workflows'],
        },
      ],
      proof_cards: [{ title: 'Без переписывания сайта', text: 'Bridge migration без простоя.', icon: 'lucide:shield-check' }],
      comparison_title: 'Что входит',
      comparison_rows: [{ parameter: 'CMS workflow', option_one: 'Базовый', option_two: 'Продвинутый', chat_plus: 'Page-first' }],
      roi_title: 'До и после',
      roi_intro: 'Как меняется команда.',
      roi_without_items: ['Ручные релизы', 'Сложный page creation'],
      roi_with_items: ['Page-first CMS', 'Draft -> review -> publish'],
      roi_quote: 'Команда двигается быстрее без backend surgery.',
      faq_title: 'Вопросы по тарифам',
      faqs: [{ question: 'Можно ли начать с пилота?', answer: 'Да.' }],
      sticky_cta_title: 'Нужна помощь с выбором?',
      sticky_cta_text: 'Поможем подобрать rollout.',
      sticky_cta_primary_label: 'Обсудить тариф',
      sticky_cta_primary_url: '/demo',
    },
  });

  assert.equal(draft.data.page_kind, 'landing');
  assert.equal(draft.data.template_variant, 'default');
  assert.deepEqual(
    draft.data.sections.map((section) => section.__component),
    [
      'page-blocks.hero',
      'page-blocks.pricing-plans',
      'page-blocks.proof-stats',
      'page-blocks.comparison-table',
      'page-blocks.before-after',
      'page-blocks.faq',
      'page-blocks.final-cta',
    ],
  );
});

test('buildLegacyManagedPageDraft maps /solutions/tenders to landing page with parity blocks', () => {
  const draft = buildLegacyManagedPageDraft({
    routePath: '/solutions/tenders',
    legacyPage: {
      meta_title: 'Тендеры',
      meta_description: 'Сценарий работы с тендерами.',
      h1: 'Автоматизация тендеров',
      subtitle: 'От поиска до реакции команды.',
      hero_eyebrow: 'Solutions',
      hero_trust_facts: ['Единый inbox', 'Приоритетные уведомления'],
      hero_panel_items: [{ label: 'ЕИС', title: 'Новые закупки', text: 'Команда видит срочные тендеры.' }],
      problems: [{ title: 'Потери заявок', text: 'Ручной мониторинг не успевает.' }],
      solution_steps: [{ title: 'Подключаем мониторинг', text: 'Собираем сигналы в едином канале.' }],
      features: [{ title: 'Фильтры', text: 'Приоритеты по категориям закупок.' }],
      comparison_title: 'Почему новый контур лучше',
      comparison_rows: [{ parameter: 'Скорость реакции', option_one: 'Низкая', option_two: 'Средняя', chat_plus: 'Высокая' }],
      internal_links_title: 'Следующие шаги',
      internal_links: [{ label: 'Pricing', href: '/pricing', description: 'Оценить тарифы.' }],
      sticky_cta_title: 'Нужен тендерный сценарий?',
      sticky_cta_text: 'Покажем rollout для вашей команды.',
      sticky_cta_primary_label: 'Запросить демо',
      sticky_cta_primary_url: '/demo',
    },
  });

  assert.equal(draft.data.route_path, '/solutions/tenders');
  assert.equal(draft.data.page_kind, 'landing');
  assert.deepEqual(
    draft.data.sections.map((section) => section.__component),
    [
      'page-blocks.hero',
      'page-blocks.cards-grid',
      'page-blocks.steps',
      'page-blocks.feature-list',
      'page-blocks.comparison-table',
      'page-blocks.internal-links',
      'page-blocks.final-cta',
    ],
  );
});
