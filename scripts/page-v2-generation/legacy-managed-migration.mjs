import { normalizePageV2RoutePath } from '../../config/page-v2-routes.mjs';

function asString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

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
    context_title: asString(legacyPage.problem_title) || asString(legacyPage.context_title),
    context_text: asString(legacyPage.problem_intro) || asString(legacyPage.context_text),
    panel_items: asArray(legacyPage.hero_panel_items).map((item) => ({
      title: asString(item.title),
      eyebrow: asString(item.label),
      text: asString(item.text),
      icon: asString(item.icon),
      secondary_text: asString(item.value),
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
  const items = asArray(options.items || legacyPage.solution_steps || legacyPage.steps)
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
  const links = asArray(legacyPage.internal_links)
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
    eyebrow: asString(legacyPage.internal_links_eyebrow),
    title: asString(legacyPage.internal_links_title),
    intro: asString(legacyPage.internal_links_intro),
    links,
  };
}

function buildFinalCtaBlock(legacyPage = {}) {
  const title = asString(legacyPage.sticky_cta_title) || asString(legacyPage.final_cta_title);
  const text = asString(legacyPage.sticky_cta_text) || asString(legacyPage.final_cta_text);
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

function buildPricingPlansBlock(legacyPage = {}) {
  const items = asArray(legacyPage.pricing_tiers)
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
    title: asString(legacyPage.pricing_title) || asString(legacyPage.pricing_heading),
    intro: asString(legacyPage.pricing_intro),
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

function buildComparisonTableBlock(legacyPage = {}) {
  const rows = asArray(legacyPage.comparison_rows)
    .map((item) => ({
      parameter: asString(item.parameter),
      option_one: asString(item.option_one),
      option_two: asString(item.option_two),
      option_highlight: asString(item.chat_plus) || asString(item.option_highlight),
    }))
    .filter((item) => item.parameter || item.option_one || item.option_two || item.option_highlight);

  if (!rows.length) {
    return null;
  }

  return {
    __component: 'page-blocks.comparison-table',
    title: asString(legacyPage.comparison_title),
    intro: asString(legacyPage.comparison_intro),
    option_one_label: asString(legacyPage.comparison_option_one_label) || 'До',
    option_two_label: asString(legacyPage.comparison_option_two_label) || 'После',
    option_highlight_label: asString(legacyPage.comparison_option_highlight_label) || 'Chat Plus',
    rows,
  };
}

function buildBeforeAfterBlock(legacyPage = {}) {
  const beforeItems = asArray(legacyPage.roi_without_items).filter(Boolean);
  const afterItems = asArray(legacyPage.roi_with_items).filter(Boolean);

  if (!beforeItems.length && !afterItems.length) {
    return null;
  }

  return {
    __component: 'page-blocks.before-after',
    title: asString(legacyPage.roi_title),
    intro: asString(legacyPage.roi_intro),
    before_title: asString(legacyPage.roi_without_title) || 'До',
    after_title: asString(legacyPage.roi_with_title) || 'После',
    before_items: beforeItems,
    after_items: afterItems,
    quote: asString(legacyPage.roi_quote),
    quote_author: asString(legacyPage.roi_quote_author),
  };
}

function compactSections(sections = []) {
  return sections.filter(Boolean);
}

function buildCampaignSections(legacyPage = {}, config = {}) {
  return compactSections([
    buildHeroBlock(legacyPage, config),
    buildCardsGridBlock(legacyPage, {
      variant: 'pillars',
      title: legacyPage.features_title,
      items: legacyPage.features,
    }),
    buildStepsBlock(legacyPage),
    buildFaqBlock(legacyPage),
    buildInternalLinksBlock(legacyPage),
    buildFinalCtaBlock(legacyPage),
  ]);
}

function buildBrandSections(legacyPage = {}, config = {}) {
  return compactSections([
    buildHeroBlock(legacyPage, config),
    buildCardsGridBlock(legacyPage, {
      variant: 'editorial',
      title: legacyPage.features_title,
      items: legacyPage.features,
    }),
    buildStepsBlock(legacyPage),
    buildFaqBlock(legacyPage),
    buildInternalLinksBlock(legacyPage),
    buildFinalCtaBlock(legacyPage),
  ]);
}

function buildResourceSections(legacyPage = {}, config = {}) {
  const richTextBody = [
    asString(legacyPage.problem_intro),
    asString(legacyPage.solution_intro),
    asString(legacyPage.content_intro),
  ].filter(Boolean).join('\n\n');

  const richText = richTextBody
    ? {
        __component: 'page-blocks.rich-text',
        title: asString(legacyPage.content_title) || asString(legacyPage.features_title) || 'Основной материал',
        body: richTextBody,
      }
    : null;

  return compactSections([
    buildHeroBlock(legacyPage, config),
    richText,
    buildCardsGridBlock(legacyPage, {
      variant: 'editorial',
      title: legacyPage.features_title,
      items: legacyPage.features,
    }),
    buildFaqBlock(legacyPage),
    buildInternalLinksBlock(legacyPage),
    buildFinalCtaBlock(legacyPage),
  ]);
}

function buildPricingSections(legacyPage = {}, config = {}) {
  return compactSections([
    buildHeroBlock(legacyPage, { ...config, heroVariant: 'panel' }),
    buildPricingPlansBlock(legacyPage),
    buildProofStatsBlock(legacyPage),
    buildComparisonTableBlock(legacyPage),
    buildBeforeAfterBlock(legacyPage),
    buildFaqBlock(legacyPage),
    buildFinalCtaBlock(legacyPage),
  ]);
}

function buildPartnershipSections(legacyPage = {}, config = {}) {
  return compactSections([
    buildHeroBlock(legacyPage, config),
    buildCardsGridBlock(legacyPage, {
      variant: 'pillars',
      title: legacyPage.features_title,
      items: legacyPage.features,
    }),
    buildStepsBlock(legacyPage),
    buildComparisonTableBlock(legacyPage),
    buildBeforeAfterBlock(legacyPage),
    buildFaqBlock(legacyPage),
    buildInternalLinksBlock(legacyPage),
    buildFinalCtaBlock(legacyPage),
  ]);
}

function buildLandingSections(legacyPage = {}, config = {}) {
  return compactSections([
    buildHeroBlock(legacyPage, config),
    buildProofStatsBlock(legacyPage),
    buildCardsGridBlock(legacyPage, {
      variant: 'default',
      title: legacyPage.problem_title,
      items: legacyPage.problems?.length ? legacyPage.problems : legacyPage.features,
    }),
    buildFeatureListBlock(legacyPage),
    buildStepsBlock(legacyPage),
    buildBeforeAfterBlock(legacyPage),
    buildFaqBlock(legacyPage),
    buildInternalLinksBlock(legacyPage),
    buildFinalCtaBlock(legacyPage),
  ]);
}

function buildTendersSections(legacyPage = {}, config = {}) {
  return compactSections([
    buildHeroBlock(legacyPage, { ...config, heroVariant: 'panel' }),
    buildCardsGridBlock(legacyPage, {
      variant: 'problems',
      title: legacyPage.problem_title,
      items: legacyPage.problems,
    }),
    buildStepsBlock(legacyPage),
    buildFeatureListBlock(legacyPage),
    buildComparisonTableBlock(legacyPage),
    buildInternalLinksBlock(legacyPage),
    buildFinalCtaBlock(legacyPage),
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
