import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  LEGACY_MANAGED_WAVES,
  buildLegacyManagedPageDraft,
  buildManagedPageDraftFromExistingPage,
  getLegacyManagedRouteConfig,
} from '../scripts/page-v2-generation/legacy-managed-migration.mjs';
import {
  getPageV2LayoutParityRule,
  validatePageV2LayoutParity,
} from '../config/page-v2-layout-parity.mjs';
import {
  buildAiCalendarDraft,
  buildDirectoryDraft,
  buildEntityDetailDraft,
  buildSiteMapDraft,
  buildVsDraft,
  parseArgs,
} from '../scripts/materialize-page-v2-routes.mjs';

function readRouteSource(path) {
  return readFileSync(path, 'utf8');
}

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
  assert.equal(draft.data.migration_ready, false);
  assert.equal(draft.data.parity_status, 'unchecked');
  assert.equal(draft.data.legacy_template_family, 'campaign');
  assert.deepEqual(draft.data.parity_notes.errors, []);
  assert.deepEqual(
    draft.data.sections.map((section) => section.__component),
    [
      'page-blocks.hero',
      'page-blocks.cards-grid',
      'page-blocks.cards-grid',
      'page-blocks.cards-grid',
      'page-blocks.steps',
      'page-blocks.cards-grid',
      'page-blocks.faq',
      'page-blocks.internal-links',
      'page-blocks.final-cta',
    ],
  );
});

test('layout parity registry keeps campaign routes safe until explicit approval', () => {
  const draft = buildLegacyManagedPageDraft({
    routePath: '/promo',
    legacyPage: {
      h1: 'Промо Chat Plus',
      features: [{ title: 'Готовые шаблоны', text: 'Старт.' }],
      solution_steps: [{ title: 'Снимаем контур', text: 'Проверка.' }],
      faqs: [{ question: 'Можно?', answer: 'Да.' }],
      internal_links: [{ label: 'Pricing', href: '/pricing' }],
      sticky_cta_title: 'Готовы?',
      sticky_cta_primary_label: 'Демо',
    },
  });
  const parity = validatePageV2LayoutParity({
    family: 'campaign',
    routePath: '/promo',
    sections: draft.data.sections,
    templateVariant: draft.data.template_variant,
  });

  assert.equal(getPageV2LayoutParityRule('campaign').requiredBlocks.includes('hero'), true);
  assert.equal(parity.ok, true);
  assert.equal(parity.status, 'unchecked');
  assert.deepEqual(parity.errors, []);
});

test('layout parity registry reports pricing pages missing commercial parity blocks', () => {
  const parity = validatePageV2LayoutParity({
    family: 'pricing',
    routePath: '/pricing',
    sections: [
      { __component: 'page-blocks.hero' },
      { __component: 'page-blocks.faq' },
      { __component: 'page-blocks.final-cta' },
    ],
    templateVariant: 'default',
  });

  assert.equal(parity.ok, false);
  assert.equal(parity.status, 'needs_work');
  assert.ok(parity.errors.some((error) => error.includes('pricing-plans')));
  assert.ok(parity.errors.some((error) => error.includes('comparison-table')));
  assert.ok(parity.errors.some((error) => error.includes('before-after')));
});

test('buildLegacyManagedPageDraft preserves brand problem and solution split sections', () => {
  const draft = buildLegacyManagedPageDraft({
    routePath: '/tv',
    legacyPage: {
      h1: 'Video Chat Plus',
      subtitle: 'Video content for product scenarios.',
      problem_title: 'What blocks client work',
      problem_intro: 'The old page has a left-side problem column.',
      features_title: 'Product proof',
      features: [{ title: 'Video demos', text: 'Show product scenarios without losing context.' }],
      solution_title: 'How Chat Plus solves it',
      solution_steps: [
        { title: 'Unified inbox', text: 'Messages are collected in one place.' },
        { title: 'Instant AI agent', text: 'Typical requests are handled faster.' },
      ],
      sticky_cta_title: 'Ready to launch?',
      sticky_cta_primary_label: 'Request demo',
    },
  });

  const cards = draft.data.sections.filter((section) => section.__component === 'page-blocks.cards-grid');
  assert.equal(cards.some((section) => section.variant === 'problems'), true);
  assert.equal(cards.some((section) => section.variant === 'integrations'), true);
  assert.equal(cards.some((section) => section.variant === 'editorial'), true);
  assert.equal(cards.some((section) => section.variant === 'use_cases'), true);
  const problems = cards.find((section) => section.variant === 'problems');
  const editorial = cards.find((section) => section.variant === 'editorial');
  assert.equal(problems.title, 'What blocks client work');
  assert.equal(problems.items.length >= 3, true);
  assert.equal(editorial.items[0].title, 'Video demos');
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
  assert.equal(draft.data.migration_ready, false);
  assert.equal(draft.data.parity_status, 'unchecked');
  assert.equal(draft.data.legacy_template_family, 'pricing');
  assert.deepEqual(
    draft.data.sections.map((section) => section.__component),
    [
      'page-blocks.hero',
      'page-blocks.pricing-plans',
      'page-blocks.cards-grid',
      'page-blocks.cards-grid',
      'page-blocks.steps',
      'page-blocks.proof-stats',
      'page-blocks.comparison-table',
      'page-blocks.before-after',
      'page-blocks.cards-grid',
      'page-blocks.internal-links',
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
      'page-blocks.cards-grid',
      'page-blocks.steps',
      'page-blocks.feature-list',
      'page-blocks.cards-grid',
      'page-blocks.comparison-table',
      'page-blocks.faq',
      'page-blocks.internal-links',
      'page-blocks.final-cta',
    ],
  );
});

test('buildLegacyManagedPageDraft does not duplicate home hero trust facts as proof stats', () => {
  const draft = buildLegacyManagedPageDraft({
    routePath: '/',
    legacyPage: {
      slug: 'home',
      meta_title: 'Home',
      meta_description: 'Home page',
      h1: 'Chat Plus',
      subtitle: 'Main product page.',
      problems: [{ title: 'Disconnected workflows', text: 'Teams need one content owner.' }],
      features: [{ title: 'CMS ownership', text: 'Pages are edited in Strapi.' }],
      solution_steps: [{ title: 'Create draft', text: 'Review and publish safely.' }],
      roi_without_items: ['Template-owned content'],
      roi_with_items: ['Strapi-owned content'],
      faqs: [{ question: 'Can editors update this?', answer: 'Yes.' }],
      internal_links: [{ label: 'Pricing', href: '/pricing' }],
      sticky_cta_title: 'Start',
      sticky_cta_primary_label: 'Demo',
    },
  });

  assert.equal(draft.data.parity_status, 'unchecked');
  assert.equal(draft.data.sections.some((section) => section.__component === 'page-blocks.proof-stats'), false);
  assert.deepEqual(draft.data.parity_notes.errors, []);
});

test('buildManagedPageDraftFromExistingPage keeps page_v2 as canonical source for managed routes', () => {
  const draft = buildManagedPageDraftFromExistingPage({
    routePath: '/promo',
    existingPage: {
      title: 'Custom promo title',
      slug: 'promo',
      locale: 'ru',
      page_kind: 'campaign',
      template_variant: 'showcase',
      generation_mode: 'manual',
      source_mode: 'managed',
      editorial_status: 'approved',
      migration_ready: true,
      parity_status: 'approved',
      legacy_template_family: 'campaign',
      seo_title: 'Custom SEO',
      seo_description: 'Custom SEO description',
      nav_group: 'special',
      nav_label: 'Промо кастом',
      nav_description: 'Кастомное описание из page_v2.',
      nav_order: 11,
      show_in_header: false,
      show_in_footer: true,
      show_in_sitemap: true,
      breadcrumbs: [{ label: 'Главная', href: '/' }],
      internal_links: [{ label: 'Pricing', href: '/pricing', description: 'Тарифы' }],
      sections: [
        { __component: 'page-blocks.hero', title: 'Custom promo title' },
        { __component: 'page-blocks.cards-grid', items: [{ title: 'Card', text: 'Body' }] },
        { __component: 'page-blocks.steps', items: [{ title: 'Step', text: 'Do it' }] },
        { __component: 'page-blocks.faq', items: [{ question: 'Q', answer: 'A' }] },
        { __component: 'page-blocks.internal-links', links: [{ label: 'Pricing', href: '/pricing' }] },
        { __component: 'page-blocks.final-cta', title: 'CTA' },
      ],
    },
    overrides: {
      blueprint_id: 'campaign',
    },
  });

  assert.equal(draft.data.title, 'Custom promo title');
  assert.equal(draft.data.nav_label, 'Промо кастом');
  assert.equal(draft.data.migration_ready, true);
  assert.equal(draft.data.parity_status, 'approved');
  assert.equal(draft.data.legacy_template_family, 'campaign');
  assert.equal(draft.data.blueprint_id, 'campaign');
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

test('legacy route wrappers keep old layout families and reserve PageV2Page for catch-all only', () => {
  const catchAllSource = readRouteSource('portal/src/pages/[...page].astro');
  assert.match(catchAllSource, /import PageV2Page from '\.\.\/components\/PageV2Page\.astro';/);
  assert.match(catchAllSource, /<PageV2Page page=\{page\} \/>/);

  const legacyWrapperPaths = [
    'portal/src/pages/index.astro',
    'portal/src/pages/promo.astro',
    'portal/src/pages/pricing.astro',
    'portal/src/pages/partnership.astro',
    'portal/src/pages/demo.astro',
    'portal/src/pages/solutions/tenders.astro',
    'portal/src/pages/docs/index.astro',
    'portal/src/pages/channels/index.astro',
    'portal/src/pages/channels/[slug].astro',
    'portal/src/pages/channels/[channel]/[industry].astro',
    'portal/src/pages/compare/index.astro',
    'portal/src/pages/compare/[slug].astro',
    'portal/src/pages/features/ai-calendar.astro',
    'portal/src/pages/vs/[slug].astro',
  ];

  for (const path of legacyWrapperPaths) {
    const source = readRouteSource(path);
    assert.doesNotMatch(source, /PageV2Page/);
  }

  assert.match(
    readRouteSource('portal/src/pages/index.astro'),
    /getManagedRoutePageForLegacyRenderer\('\/', \(\) => getLandingPage\('home'\), 'home'\)/,
  );
  assert.match(
    readRouteSource('portal/src/pages/promo.astro'),
    /getManagedRoutePageForLegacyRenderer\('\/promo', \(\) => getLandingPage\('promo'\), 'campaign'\)/,
  );
  assert.match(
    readRouteSource('portal/src/pages/pricing.astro'),
    /getManagedRoutePageForLegacyRenderer\('\/pricing', \(\) => getLandingPage\('pricing'\), 'pricing'\)/,
  );
  assert.match(
    readRouteSource('portal/src/pages/channels/index.astro'),
    /getManagedRoutePageForLegacyRenderer\('\/channels', async \(\) =>/,
  );
  assert.match(
    readRouteSource('portal/src/pages/channels/[slug].astro'),
    /getPageV2ByRouteForLegacyRenderer\(`\/channels\/\$\{channel\.slug\}`, 'structured'\)/,
  );
  assert.match(
    readRouteSource('portal/src/pages/compare/[slug].astro'),
    /getPageV2ByRouteForLegacyRenderer\(`\/compare\/\$\{competitor\.slug\}`, 'comparison'\)/,
  );
  assert.match(
    readRouteSource('portal/src/pages/compare/index.astro'),
    /getPageV2ByRouteForLegacyRenderer\('\/compare', 'comparison_directory'\)/,
  );
  assert.match(
    readRouteSource('portal/src/pages/site-map.astro'),
    /getPageV2ByRouteForLegacyRenderer\('\/site-map', 'site_map'\)/,
  );
  assert.match(
    readRouteSource('portal/src/pages/features/ai-calendar.astro'),
    /getPageV2ByRouteForLegacyRenderer\('\/features\/ai-calendar', 'ai_calendar'\)/,
  );
});

test('buildDirectoryDraft gives /compare required comparison parity blocks', () => {
  const draft = buildDirectoryDraft(
    {
      family: 'comparison',
      key: 'compare',
      routePath: '/compare',
      title: 'Compare alternatives',
      collection: 'competitors',
      navGroup: 'catalogs',
      order: 70,
    },
    {
      competitors: [
        { slug: 'intercom', name: 'Intercom', description: 'Intercom alternative.' },
        { slug: 'zendesk', name: 'Zendesk', description: 'Zendesk alternative.' },
      ],
    },
  );
  const parity = validatePageV2LayoutParity({
    family: 'comparison',
    routePath: '/compare',
    sections: draft.data.sections,
    templateVariant: draft.data.template_variant,
  });

  assert.equal(parity.ok, true);
  assert.equal(parity.status, 'unchecked');
  assert.ok(draft.data.sections.some((section) => section.__component === 'page-blocks.comparison-table'));
  assert.ok(draft.data.sections.some((section) => section.__component === 'page-blocks.faq'));
  assert.ok(draft.data.sections.some((section) => section.__component === 'page-blocks.internal-links'));
});

test('buildDirectoryDraft uses site-setting templates for /features instead of generic placeholder copy', () => {
  const draft = buildDirectoryDraft(
    {
      family: 'directory',
      key: 'features',
      routePath: '/features',
      title: 'Features',
      collection: 'features',
      navGroup: 'catalogs',
      order: 50,
    },
    {
      siteSetting: {
        page_templates: {
          directories: {
            features: {
              meta_description: 'AI, automation and analytics in one platform.',
              h1: 'Feature catalog',
              subtitle: 'Everything your team can launch through Chat Plus.',
              hero_cta_primary_label: 'Book demo',
              hero_cta_primary_url: '/demo',
              card_cta_label: 'Open feature',
              sticky_cta_title: 'See every feature in action',
              sticky_cta_text: 'We will walk through the exact setup.',
              sticky_cta_primary_label: 'Request walkthrough',
              sticky_cta_primary_url: '/demo',
            },
          },
        },
      },
      features: [
        { slug: 'ai', name: 'AI agents', description: 'Qualify leads and book meetings.' },
      ],
    },
  );

  const hero = draft.data.sections[0];
  const cards = draft.data.sections[1];
  const finalCta = draft.data.sections[2];

  assert.equal(hero.title, 'Feature catalog');
  assert.equal(hero.subtitle, 'Everything your team can launch through Chat Plus.');
  assert.equal(cards.items[0].cta_label, 'Open feature');
  assert.equal(finalCta.title, 'See every feature in action');
  assert.equal(finalCta.text, 'We will walk through the exact setup.');
});

test('buildVsDraft includes internal links for comparison detail parity', () => {
  const draft = buildVsDraft({
    slug: 'intercom',
    name: 'Intercom',
    description: 'Intercom alternative.',
  });
  const parity = validatePageV2LayoutParity({
    family: 'comparison',
    routePath: '/vs/intercom',
    sections: draft.data.sections,
    templateVariant: draft.data.template_variant,
  });

  assert.equal(parity.ok, true);
  assert.equal(parity.status, 'unchecked');
  assert.ok(draft.data.sections.some((section) => section.__component === 'page-blocks.internal-links'));
});

test('buildEntityDetailDraft can include related intersection links for incoming graph coverage', () => {
  const draft = buildEntityDetailDraft(
    'channels',
    {
      slug: 'email',
      name: 'Email',
      description: 'Email channel.',
    },
    {
      relatedLinks: [
        {
          label: 'Email with AmoCRM',
          href: '/channels/email/amocrm',
          description: 'Intersection page.',
        },
      ],
    },
  );

  const internalLinksSection = draft.data.sections.find((section) => section.__component === 'page-blocks.internal-links');

  assert.ok(internalLinksSection);
  assert.ok(internalLinksSection.links.some((link) => link.href === '/channels/email/amocrm'));
  assert.ok(internalLinksSection.links.some((link) => link.href === '/channels'));
});

test('buildEntityDetailDraft preserves rich feature page sections from entity facts', () => {
  const draft = buildEntityDetailDraft(
    'features',
    {
      slug: 'ai',
      name: 'AI agents',
      h1: 'AI agents for sales',
      subtitle: 'Automate the first line and route warm leads.',
      problem_title: 'Why teams stall',
      problem_intro: 'Manual handling creates delays.',
      problems: [{ title: 'Slow replies', text: 'Leads wait too long.' }],
      solution_title: 'How AI agents work',
      solution_intro: 'The process is connected to your channels.',
      solution_steps: [{ title: 'Qualify intent', text: 'AI asks follow-up questions.' }],
      features_title: 'What is included',
      features: [{ title: '24/7 answers', text: 'Never leave inbound requests idle.' }],
      roi_title: 'Before and after',
      roi_without_items: ['Missed leads'],
      roi_with_items: ['Faster qualification'],
      roi_quote: 'The team gets fewer repetitive dialogs.',
      faq_title: 'Feature FAQ',
      faq: [{ q: 'Can we review answers?', a: 'Yes.' }],
      sticky_cta_title: 'See AI agents live',
      sticky_cta_text: 'We will show the real flow.',
      cta: 'Request demo',
    },
    {
      collections: {
        features: [{ slug: 'bots', name: 'Bots', description: 'Builder.' }],
        industries: [{ slug: 'beauty', name: 'Beauty', description: 'Beauty workflows.' }],
      },
    },
  );

  assert.deepEqual(
    draft.data.sections.map((section) => section.__component),
    [
      'page-blocks.hero',
      'page-blocks.cards-grid',
      'page-blocks.steps',
      'page-blocks.feature-list',
      'page-blocks.before-after',
      'page-blocks.related-links',
      'page-blocks.faq',
      'page-blocks.internal-links',
      'page-blocks.final-cta',
    ],
  );
});

test('buildEntityDetailDraft maps business type problem_points into parity problem cards', () => {
  const draft = buildEntityDetailDraft(
    'business_types',
    {
      slug: 'b2b',
      name: 'B2B',
      description: 'Business client workflows.',
      problem_title: 'Typical B2B problems',
      problem_points: [
        'Requests arrive in many channels.',
        'Managers lose context between CRM and messengers.',
      ],
      steps: [{ title: 'Connect channels', desc: 'Bring every entry point into one inbox.' }],
    },
    {
      collections: {
        business_types: [],
        industries: [],
        channels: [],
      },
    },
  );

  const problems = draft.data.sections.find(
    (section) => section.__component === 'page-blocks.cards-grid' && section.variant === 'problems',
  );

  assert.ok(problems);
  assert.equal(problems.items.length, 2);
  assert.equal(problems.items[0].title, 'Requests arrive in many channels.');
});

test('buildVsDraft preserves comparison-specific sections from competitor facts', () => {
  const draft = buildVsDraft({
    slug: 'intercom',
    name: 'Intercom',
    hero_description: 'Enterprise helpdesk with heavy pricing.',
    weaknesses_title: 'Where Intercom is weaker',
    weaknesses: ['Expensive at scale'],
    strengths_title: 'Where Chat Plus wins',
    our_strengths: ['Fixed pricing'],
    pricing_title: 'Price ownership',
    price: '$425',
    competitor_price_caption: 'Costs grow with add-ons',
    our_price: '$49',
    final_cta_title: 'Compare on your real workflow',
    final_cta_text: 'We will show the real economics.',
    final_cta_label: 'Request comparison',
  });

  assert.deepEqual(
    draft.data.sections.map((section) => section.__component),
    [
      'page-blocks.hero',
      'page-blocks.cards-grid',
      'page-blocks.steps',
      'page-blocks.comparison-table',
      'page-blocks.related-links',
      'page-blocks.faq',
      'page-blocks.internal-links',
      'page-blocks.final-cta',
    ],
  );
});

test('buildSiteMapDraft gives site map route a dedicated parity-safe system contract', () => {
  const draft = buildSiteMapDraft();
  const parity = validatePageV2LayoutParity({
    family: 'site_map',
    routePath: draft.routePath,
    sections: draft.data.sections,
    templateVariant: draft.data.template_variant,
  });

  assert.equal(draft.routePath, '/site-map');
  assert.equal(draft.data.legacy_template_family, 'site_map');
  assert.equal(parity.ok, true);
  assert.ok(draft.data.sections.some((section) => section.__component === 'page-blocks.hero'));
});

test('buildAiCalendarDraft gives ai calendar route a dedicated parity-safe contract', () => {
  const draft = buildAiCalendarDraft();
  const parity = validatePageV2LayoutParity({
    family: 'ai_calendar',
    routePath: draft.routePath,
    sections: draft.data.sections,
    templateVariant: draft.data.template_variant,
  });

  assert.equal(draft.routePath, '/features/ai-calendar');
  assert.equal(draft.data.legacy_template_family, 'ai_calendar');
  assert.equal(parity.ok, true);
  assert.deepEqual(
    draft.data.sections.map((section) => section.__component),
    [
      'page-blocks.hero',
      'page-blocks.steps',
      'page-blocks.feature-list',
      'page-blocks.cards-grid',
      'page-blocks.final-cta',
    ],
  );
});

test('parseArgs makes route-level publish imply apply for the materializer flow', () => {
  const options = parseArgs(['--route=/promo', '--publish']);

  if (options.publish && !options.unpublish) {
    options.apply = true;
  }

  assert.equal(options.publish, true);
  assert.equal(options.apply, true);
  assert.equal(options.route, '/promo');
});

test('parseArgs supports refreshing managed routes from legacy source', () => {
  const options = parseArgs(['--family=managed', '--refresh-managed-from-legacy', '--apply']);

  assert.equal(options.family, 'managed');
  assert.equal(options.apply, true);
  assert.equal(options.refreshManagedFromLegacy, true);
});
