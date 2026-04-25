type UnknownRecord = Record<string, any>;

export type LegacyPageFamily =
  | 'home'
  | 'campaign'
  | 'brand'
  | 'resource'
  | 'pricing'
  | 'partnership'
  | 'directory'
  | 'comparison_directory'
  | 'comparison'
  | 'structured'
  | 'tenders'
  | 'site_map'
  | 'ai_calendar';

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function publicLabel(value: unknown, fallback = '') {
  const text = asString(value).trim();
  const technicalLabels = new Set([
    'comparison',
    'compare alternatives',
    'alternative',
    'editorial workflow',
    'manual review in strapi',
    'request demo',
    'request comparison',
  ]);

  return text && !technicalLabels.has(text.toLowerCase()) ? text : fallback;
}

function safeIcon(value: unknown, fallback = '') {
  const icon = asString(value).trim();
  if (!icon) return fallback;
  return icon.includes(':') ? icon : fallback;
}

function asArray<T = unknown>(value: unknown) {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as UnknownRecord) : {};
}

function findBlock(page: UnknownRecord, blockType: string) {
  return asArray<UnknownRecord>(page.sections).find((section) => section?.block_type === blockType) || null;
}

function findBlocks(page: UnknownRecord, blockType: string) {
  return asArray<UnknownRecord>(page.sections).filter((section) => section?.block_type === blockType);
}

function findBlockByVariant(page: UnknownRecord, blockType: string, variant: string) {
  return findBlocks(page, blockType).find((section) => asString(section?.variant) === variant) || null;
}

function mapTextItems(items: unknown) {
  return asArray<UnknownRecord>(items)
    .map((item) => ({
      title: asString(item.title) || asString(item.label) || asString(item.eyebrow),
      text: asString(item.text) || asString(item.description) || asString(item.secondary_text),
    }))
    .filter((item) => item.title || item.text);
}

function mapLinks(value: unknown) {
  return asArray<UnknownRecord>(value)
    .map((item) => ({
      label: asString(item.label) || asString(item.title),
      href: asString(item.href) || asString(item.url),
      description: asString(item.description),
    }))
    .filter((item) => item.label && item.href);
}

function normalizeHref(href = '') {
  const [path] = href.trim().split(/[?#]/);
  if (!path || path === '/') return '/';
  return `/${path.replace(/^\/+|\/+$/g, '')}`;
}

function comparisonEquivalentHref(href = '') {
  const normalized = normalizeHref(href);
  const match = normalized.match(/^\/(compare|vs)\/([^/]+)$/);
  if (!match) return normalized;
  return `comparison:${match[2]}`;
}

function linkQualityScore(item: LinkItemLike) {
  const label = (item.label || '').trim();
  const description = (item.description || '').trim();
  let score = 0;
  if (description) score += 100 + Math.min(description.length, 80);
  if (/^все\s+/i.test(label)) score += 20;
  score += Math.min(label.length, 40);
  return score;
}

function uniqueLinks(links: LinkItemLike[]) {
  const byHref = new Map<string, LinkItemLike>();
  for (const item of links) {
    const key = normalizeHref(item.href || '');
    if (!key) continue;
    const existing = byHref.get(key);
    if (!existing || linkQualityScore(item) > linkQualityScore(existing)) {
      byHref.set(key, { ...item, href: key });
    }
  }
  return [...byHref.values()];
}

type LinkItemLike = {
  label?: string;
  href?: string;
  description?: string;
};

function joinNonEmpty(values: string[], separator = ' / ') {
  const seen = new Set<string>();
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLocaleLowerCase('ru');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(separator);
}

function collectLinkBlocks(page: UnknownRecord) {
  const blocks = [
    ...findBlocks(page, 'internal-links'),
    ...findBlocks(page, 'related-links'),
  ];

  return {
    eyebrow: blocks.map((block) => asString(block.eyebrow)).find(Boolean) || '',
    title: joinNonEmpty(blocks.map((block) => asString(block.title))),
    intro: joinNonEmpty(blocks.map((block) => asString(block.intro)), ' '),
    links: uniqueLinks(blocks.flatMap((block) => mapLinks(block.links))),
  };
}

function routeSlugFromPage(page: UnknownRecord) {
  const routePath = asString(page.route_path) || asString(page.slug);
  const clean = routePath.trim().replace(/^\/+|\/+$/g, '');
  return clean || 'home';
}

function inferLinkContext(page: UnknownRecord, routeSlug: string) {
  const current = asRecord(page.internal_links_context);
  const parts = routeSlug.split('/').filter(Boolean);
  const entityName = asString(page.title) || asString(findBlock(page, 'hero')?.title);
  let entityType = asString(current.entityType);

  if (!entityType) {
    if (parts[0] === 'channels' && parts.length === 2) entityType = 'channel';
    else if (parts[0] === 'industries' && parts.length === 2) entityType = 'industry';
    else if (parts[0] === 'integrations' && parts.length === 2) entityType = 'integration';
    else if (parts[0] === 'solutions' && parts.length === 2) entityType = 'solution';
    else if (parts[0] === 'features' && parts.length === 2) entityType = 'feature';
    else if (parts[0] === 'for' && parts.length === 2) entityType = 'business_type';
    else if (parts[0] === 'compare' || parts[0] === 'vs') entityType = 'competitor';
  }

  return {
    ...current,
    entityType: entityType || asString(current.entityType) || 'generic',
    entityName: asString(current.entityName) || entityName,
    pageSlug: asString(current.pageSlug) || routeSlug,
    preserveTitle: Boolean(current.preserveTitle),
  };
}

function inferInternalLinksVariant(page: UnknownRecord) {
  const routeSlug = routeSlugFromPage(page);

  if (routeSlug === 'compare' || routeSlug.startsWith('compare/') || routeSlug.startsWith('vs/')) {
    return 'comparisons';
  }

  if (
    routeSlug === 'pricing'
    || routeSlug === 'docs'
    || routeSlug === 'help'
    || routeSlug === 'academy'
    || routeSlug === 'blog'
    || routeSlug === 'status'
  ) {
    return 'docs';
  }

  if (routeSlug === 'features' || routeSlug.startsWith('features/') || routeSlug.startsWith('solutions/')) {
    return 'solutions';
  }

  if (
    routeSlug === 'home'
    || routeSlug === 'promo'
    || routeSlug === 'prozorro'
    || routeSlug === 'media'
    || routeSlug === 'team'
    || routeSlug === 'conversation'
    || routeSlug === 'tv'
    || routeSlug === 'demo'
    || routeSlug === 'partnership'
  ) {
    return 'next_steps';
  }

  return 'related';
}

function mapCardLinks(items: unknown) {
  return asArray<UnknownRecord>(items)
    .map((item) => ({
      href: asString(item.href) || asString(item.url),
      title: asString(item.title) || asString(item.label),
      description: asString(item.text) || asString(item.description) || asString(item.secondary_text),
      icon: safeIcon(item.icon),
      badges: asArray<string>(item.badges).filter(Boolean),
      ctaLabel: asString(item.cta_label) || asString(item.ctaLabel),
    }))
    .filter((item) => item.href && item.title);
}

function mapCards(items: unknown) {
  return asArray<UnknownRecord>(items)
    .map((item) => ({
      title: asString(item.title) || asString(item.label),
      text: asString(item.text) || asString(item.description) || asString(item.secondary_text),
      description: asString(item.description) || asString(item.text) || asString(item.secondary_text),
      icon: safeIcon(item.icon),
      href: asString(item.href) || asString(item.url),
      ctaLabel: asString(item.cta_label) || asString(item.ctaLabel),
      eyebrow: asString(item.eyebrow),
      secondaryText: asString(item.secondary_text),
    }))
    .filter((item) => item.title || item.text || item.href);
}

function mapFaqItems(items: unknown) {
  return asArray<UnknownRecord>(items)
    .map((item) => ({
      question: asString(item.question) || asString(item.q),
      answer: asString(item.answer) || asString(item.a),
    }))
    .filter((item) => item.question || item.answer);
}

function buildBasePage(page: UnknownRecord) {
  const hero = findBlock(page, 'hero');
  const finalCta = findBlock(page, 'final-cta');
  const linkBlocks = collectLinkBlocks(page);
  const faq = findBlock(page, 'faq');
  const routeSlug = routeSlugFromPage(page);
  const currentHref = normalizeHref(asString(page.route_path) || `/${routeSlug}`);
  const currentEquivalentHref = comparisonEquivalentHref(currentHref);
  const internalLinks = uniqueLinks([...linkBlocks.links, ...mapLinks(page.internal_links)])
    .filter((item) => {
      const href = normalizeHref(item.href || '');
      return href !== currentHref && comparisonEquivalentHref(href) !== currentEquivalentHref;
    });
  const inferredContext = inferLinkContext(page, routeSlug);

  return {
    meta_title: asString(page.seo_title) || asString(page.title),
    meta_description: asString(page.seo_description),
    canonical: asString(page.canonical),
    h1: asString(hero?.title) || asString(page.title),
    subtitle: asString(hero?.subtitle),
    hero_eyebrow: asString(hero?.eyebrow),
    hero_cta_primary_label: asString(hero?.primary_label),
    hero_cta_primary_url: asString(hero?.primary_url),
    hero_cta_secondary_label: asString(hero?.secondary_label),
    hero_cta_secondary_url: asString(hero?.secondary_url),
    hero_trust_facts: asArray<string>(hero?.trust_facts).filter(Boolean),
    internal_links_eyebrow: linkBlocks.eyebrow,
    internal_links_title: linkBlocks.title,
    internal_links_intro: linkBlocks.intro,
    internal_links_variant: inferInternalLinksVariant(page),
    internal_links: internalLinks,
    internal_links_context: {
      ...inferredContext,
      preserveTitle: Boolean(linkBlocks.title),
    },
    faq_title: asString(faq?.title),
    faqs: mapFaqItems(faq?.items),
    sticky_cta_title: asString(finalCta?.title),
    sticky_cta_text: asString(finalCta?.text),
    sticky_cta_primary_label: asString(finalCta?.primary_label),
    sticky_cta_primary_url: asString(finalCta?.primary_url),
    sticky_cta_secondary_label: asString(finalCta?.secondary_label),
    sticky_cta_secondary_url: asString(finalCta?.secondary_url),
    breadcrumbs: mapLinks(page.breadcrumbs).map((item) => ({ label: item.label, href: item.href })),
    section_labels: {},
  };
}

function applyCardsToProblems(target: UnknownRecord, cardsGrid: UnknownRecord | null) {
  if (!cardsGrid) {
    return;
  }

  target.problem_title = asString(cardsGrid.title);
  target.problem_intro = asString(cardsGrid.intro);
  target.problems = mapTextItems(cardsGrid.items);
}

function applyCardsToFeatures(target: UnknownRecord, cardsGrid: UnknownRecord | null) {
  if (!cardsGrid) {
    return;
  }

  target.features_title = asString(cardsGrid.title);
  target.features = mapTextItems(cardsGrid.items);
}

function applyFeatureList(target: UnknownRecord, featureList: UnknownRecord | null) {
  if (!featureList) {
    return;
  }

  target.features_title = target.features_title || asString(featureList.title);
  target.features = mapTextItems(featureList.items);
}

function applyIntegrationCards(target: UnknownRecord, cardsGrid: UnknownRecord | null) {
  if (!cardsGrid) {
    return;
  }

  target.integrations_title = asString(cardsGrid.title);
  target.integration_blocks = mapCards(cardsGrid.items).map((item) => ({
    label: item.title,
    text: item.text || item.description,
  })).filter((item) => item.label || item.text);
}

function applySteps(target: UnknownRecord, steps: UnknownRecord | null) {
  if (!steps) {
    return;
  }

  target.solution_title = asString(steps.title);
  target.solution_intro = asString(steps.intro);
  target.solution_steps = mapTextItems(steps.items);
}

function applyBeforeAfter(target: UnknownRecord, beforeAfter: UnknownRecord | null) {
  if (!beforeAfter) {
    return;
  }

  const mapRoiItem = (item: unknown) => {
    if (typeof item === 'string') {
      return item;
    }
    const record = asRecord(item);
    const value = asString(record.value);
    const label = asString(record.label) || asString(record.title) || asString(record.text);
    if (value && label) {
      return `${value} — ${label}`;
    }
    return value || label;
  };

  target.roi_title = asString(beforeAfter.title);
  target.roi_intro = asString(beforeAfter.intro);
  target.roi_without_title = asString(beforeAfter.before_title);
  target.roi_with_title = asString(beforeAfter.after_title);
  target.roi_without_items = asArray(beforeAfter.before_items).map(mapRoiItem).filter(Boolean);
  target.roi_with_items = asArray(beforeAfter.after_items).map(mapRoiItem).filter(Boolean);
  target.roi_quote = asString(beforeAfter.quote);
  target.roi_quote_author = asString(beforeAfter.quote_author);
}

function applyComparison(target: UnknownRecord, comparison: UnknownRecord | null) {
  if (!comparison) {
    return;
  }

  target.comparison_title = asString(comparison.title);
  target.comparison_rows = asArray<UnknownRecord>(comparison.rows)
    .map((item) => ({
      parameter: asString(item.parameter),
      option_one: asString(item.option_one),
      option_two: asString(item.option_two),
      chat_plus: asString(item.option_highlight),
    }))
    .filter((item) => item.parameter || item.option_one || item.option_two || item.chat_plus);
  target.section_labels = {
    ...(target.section_labels || {}),
    comparison_intro: asString(comparison.intro),
    comparison_option_one: asString(comparison.option_one_label),
    comparison_option_two: asString(comparison.option_two_label),
    comparison_chat_plus: asString(comparison.option_highlight_label),
  };
}

function applyUseCases(target: UnknownRecord, cardsGrid: UnknownRecord | null) {
  if (!cardsGrid) {
    return;
  }

  target.use_cases_title = asString(cardsGrid.title);
  target.use_cases = mapTextItems(cardsGrid.items);
}

function applyNavigationGroups(target: UnknownRecord, cardsGrid: UnknownRecord | null, title = '') {
  if (!cardsGrid) {
    return;
  }

  const items = mapLinks(cardsGrid.links).filter((item) => item.label && item.href);
  if (!items.length) {
    return;
  }

  target.navigation_groups_title = asString(cardsGrid.title) || title;
  target.navigation_groups_intro = asString(cardsGrid.intro);
  target.navigation_groups = [
    {
      title: asString(cardsGrid.eyebrow) || 'Сценарии',
      items,
    },
  ];
}

function pickFeatureCards(page: UnknownRecord) {
  return (
    findBlockByVariant(page, 'cards-grid', 'pillars') ||
    findBlockByVariant(page, 'cards-grid', 'editorial') ||
    findBlockByVariant(page, 'cards-grid', 'use_cases') ||
    findBlocks(page, 'cards-grid').find((section) => asString(section?.variant) !== 'problems') ||
    null
  );
}

function pickUseCases(page: UnknownRecord) {
  return (
    findBlockByVariant(page, 'cards-grid', 'use_cases') ||
    findBlockByVariant(page, 'cards-grid', 'use-cases') ||
    findBlock(page, 'related-links') ||
    null
  );
}

function pickIntegrationCards(page: UnknownRecord) {
  return (
    findBlockByVariant(page, 'cards-grid', 'integrations') ||
    findBlockByVariant(page, 'cards-grid', 'stack') ||
    null
  );
}

function applyProofStats(target: UnknownRecord, proof: UnknownRecord | null, mode: 'home' | 'pricing' = 'home') {
  if (!proof) {
    return;
  }

  const placeholderLabels = new Set(['Proof point', 'Home page proof']);
  const mapped = asArray<UnknownRecord>(proof.items)
    .map((item) => {
      const label = asString(item.label);
      return {
        value: asString(item.value),
        label: placeholderLabels.has(label) ? '' : label,
        description: asString(item.description),
      };
    })
    .filter((item) => item.value || item.label || item.description);

  if (!mapped.length) {
    return;
  }

  if (mode === 'pricing') {
    target.proof_cards = mapped.map((item) => ({
      title: item.label,
      value: item.value,
      text: item.description || item.value,
      icon: 'lucide:badge-check',
    }));
    return;
  }

  target.proof_facts = mapped.map((item) => ({
    value: item.value,
    label: item.label,
    text: item.description,
  }));
}

function proofStatsDuplicateHeroFacts(proof: UnknownRecord | null, hero: UnknownRecord | null) {
  if (!proof || !hero) return false;

  const heroFacts = asArray<string>(hero.trust_facts)
    .map((item) => asString(item).replace(/\s+/g, ' ').trim().toLowerCase())
    .filter(Boolean);
  const proofValues = asArray<UnknownRecord>(proof.items)
    .map((item) => asString(item.value || item.description || item.label).replace(/\s+/g, ' ').trim().toLowerCase())
    .filter(Boolean);

  return Boolean(
    heroFacts.length &&
      proofValues.length &&
      proofValues.every((value) => heroFacts.includes(value))
  );
}

function applyHeroPanel(target: UnknownRecord, hero: UnknownRecord | null, family: LegacyPageFamily) {
  if (!hero) {
    return;
  }

  const items = asArray<UnknownRecord>(hero.panel_items)
    .map((item) => ({
      title: asString(item.title),
      label: asString(item.eyebrow),
      value: asString(item.secondary_text),
      text: asString(item.text),
      icon: safeIcon(item.icon),
    }))
    .filter((item) => item.title || item.label || item.value || item.text);

  if (!items.length) {
    return;
  }

  if (family === 'pricing') {
    target.hero_panel_items = items;
    target.section_labels = {
      ...(target.section_labels || {}),
      hero_panel_title: asString(hero.context_title) || 'Почему цена окупается',
      hero_panel_summary: asString(hero.context_text) || 'Ключевые аргументы по модели оплаты и запуску.',
      pricing_title: 'Тарифы',
      pricing_intro: 'Соберите план под ваш объём, команду и интеграции.',
      tier_popular: 'Рекомендуем',
    };
    return;
  }

  if (family === 'tenders') {
    target.hero_panel_items = items.map((item) => ({
      source: item.title,
      deadline: item.label,
      text: item.text || item.value,
      icon: item.icon,
      accent: false,
      label: item.label,
    }));
    target.section_labels = {
      ...(target.section_labels || {}),
      hero_panel_title: asString(hero.context_title) || 'Контур тендера',
      hero_panel_summary: asString(hero.context_text) || 'Что контролируем в заявке и сроках.',
    };
    return;
  }

  target.hero_highlights = items.map((item) => item.value || item.title || item.label).filter(Boolean);
  target.hero_highlights_label = asString(hero.context_title);
}

function mapCampaignPage(page: UnknownRecord) {
  const target = buildBasePage(page);
  const hero = findBlock(page, 'hero');

  applyCardsToProblems(target, findBlockByVariant(page, 'cards-grid', 'problems'));
  applyIntegrationCards(target, pickIntegrationCards(page));
  applyCardsToFeatures(target, pickFeatureCards(page));
  applySteps(target, findBlock(page, 'steps'));
  applyUseCases(target, pickUseCases(page));
  target.quote_title = asString(hero?.context_title);
  target.quote_text = asString(hero?.context_text);

  return target;
}

function mapBrandPage(page: UnknownRecord) {
  const target = buildBasePage(page);
  const hero = findBlock(page, 'hero');

  applyCardsToProblems(target, findBlockByVariant(page, 'cards-grid', 'problems'));
  applyIntegrationCards(target, pickIntegrationCards(page));
  applyCardsToFeatures(target, pickFeatureCards(page));
  applySteps(target, findBlock(page, 'steps'));
  applyUseCases(target, pickUseCases(page));
  target.quote_title = asString(hero?.context_title);
  target.quote_text = asString(hero?.context_text);

  return target;
}

function mapResourcePage(page: UnknownRecord) {
  const target = buildBasePage(page);
  const hero = findBlock(page, 'hero');
  const richText = findBlock(page, 'rich-text');

  applyCardsToProblems(target, findBlockByVariant(page, 'cards-grid', 'problems'));
  applyIntegrationCards(target, pickIntegrationCards(page));
  applyCardsToFeatures(target, pickFeatureCards(page));
  applySteps(target, findBlock(page, 'steps'));
  applyUseCases(target, pickUseCases(page));
  target.quote_title = asString(hero?.context_title) || asString(richText?.title);
  target.quote_text = asString(hero?.context_text) || asString(richText?.body);

  return target;
}

function mapPricingPage(page: UnknownRecord) {
  const target = buildBasePage(page);
  const hero = findBlock(page, 'hero');
  const pricingPlans = findBlock(page, 'pricing-plans');

  applyHeroPanel(target, hero, 'pricing');
  applyCardsToProblems(target, findBlockByVariant(page, 'cards-grid', 'problems'));
  applyIntegrationCards(target, pickIntegrationCards(page));
  applySteps(target, findBlock(page, 'steps'));
  applyProofStats(target, findBlock(page, 'proof-stats'), 'pricing');
  applyComparison(target, findBlock(page, 'comparison-table'));
  applyBeforeAfter(target, findBlock(page, 'before-after'));
  applyUseCases(target, pickUseCases(page));

  target.pricing_tiers = asArray<UnknownRecord>(pricingPlans?.items)
    .map((item) => ({
      name: asString(item.title),
      label: asString(item.label),
      price: asString(item.price),
      period: asString(item.period),
      note: asString(item.note),
      text: asString(item.text),
      cta: asString(item.cta_label),
      icon: safeIcon(item.icon, 'lucide:circle'),
      kicker: asString(item.kicker),
      accent: Boolean(item.accent),
      features: asArray<string>(item.features).filter(Boolean),
    }))
    .filter((item) => item.name || item.label || item.price);

  if (pricingPlans) {
    target.section_labels = {
      ...(target.section_labels || {}),
      pricing_title: asString(pricingPlans.title) || 'Тарифы',
      pricing_intro: asString(pricingPlans.intro),
      tier_popular: target.section_labels?.tier_popular || 'Рекомендуем',
    };
  }

  target.section_labels = {
    ...(target.section_labels || {}),
    bottom_cta_title:
      target.section_labels?.bottom_cta_title || 'Не знаете, какой контур нужен именно вам?',
    bottom_cta_text:
      target.section_labels?.bottom_cta_text
      || 'На демо соберем модель цены под вашу команду, каналы, AI-нагрузку и CRM-связки.',
    bottom_cta_primary: target.section_labels?.bottom_cta_primary || 'Рассчитать стоимость',
    bottom_cta_secondary: target.section_labels?.bottom_cta_secondary || 'Получить демо',
  };

  return target;
}

function mapPartnershipPage(page: UnknownRecord) {
  const target = buildBasePage(page);
  const cardsGrid = pickFeatureCards(page);
  const integrationsGrid = pickIntegrationCards(page) || cardsGrid;

  applyCardsToProblems(target, findBlockByVariant(page, 'cards-grid', 'problems'));
  applyCardsToFeatures(target, cardsGrid);
  target.integrations_title = asString(integrationsGrid?.title);
  target.integration_blocks = mapTextItems(integrationsGrid?.items).map((item) => ({
    label: item.title,
    text: item.text,
  }));
  applySteps(target, findBlock(page, 'steps'));
  applyComparison(target, findBlock(page, 'comparison-table'));
  applyBeforeAfter(target, findBlock(page, 'before-after'));
  applyUseCases(target, pickUseCases(page));

  return target;
}

function mapDirectoryPage(page: UnknownRecord) {
  const target = buildBasePage(page);
  const hero = findBlock(page, 'hero');
  const cardsGrid = findBlock(page, 'cards-grid');

  return {
    metaTitle: target.meta_title,
    metaDescription: target.meta_description,
    title: asString(hero?.title) || asString(page.title),
    subtitle: asString(hero?.subtitle),
    primaryLabel: asString(hero?.primary_label),
    primaryUrl: asString(hero?.primary_url),
    items: mapCardLinks(cardsGrid?.items),
    stickyTitle: target.sticky_cta_title,
    stickyText: target.sticky_cta_text,
    stickyPrimaryLabel: target.sticky_cta_primary_label,
    stickyPrimaryUrl: target.sticky_cta_primary_url,
  };
}

function mapComparisonPage(page: UnknownRecord) {
  const target = buildBasePage(page);
  const hero = findBlock(page, 'hero');
  const cardsGrid = findBlock(page, 'cards-grid');
  const comparison = findBlock(page, 'comparison-table');
  const richText = findBlock(page, 'rich-text');
  const stepsBlock = findBlock(page, 'steps');

  applyCardsToProblems(target, cardsGrid);
  applySteps(target, stepsBlock);
  applyComparison(target, comparison);

  const headline = asString(hero?.title) || asString(page.title);
  const comparisonSubject = headline
    .replace(/\s+vs\s+/i, ' и ')
    .replace(/\s+или\s+/i, ' и ');
  target.compare_summary = asString(hero?.context_text)
    || asString(richText?.body)
    || (comparisonSubject ? `Сравнение ${comparisonSubject} по скорости запуска, экономике владения и управляемости омниканального процесса.` : '');
  const stepPoints = asArray<UnknownRecord>(stepsBlock?.items)
    .map((item) => asString(item.title) || asString(item.text) || asString(item.description))
    .filter(Boolean);
  const problemPoints = asArray<UnknownRecord>(cardsGrid?.items)
    .map((item) => asString(item.title) || asString(item.text) || asString(item.description))
    .filter(Boolean)
    .slice(0, 6);
  const heroTrustPoints = asArray<string>(hero?.trust_facts).filter(Boolean);
  const heroPanelPoints = asArray<UnknownRecord>(hero?.panel_items)
    .map((item) => asString(item.title) || asString(item.text) || asString(item.secondary_text) || asString(item.eyebrow))
    .filter(Boolean);
  const cardsVariant = asString(cardsGrid?.variant);
  target.compare_points = (
    heroTrustPoints.length
      ? heroTrustPoints
      : heroPanelPoints.length
        ? heroPanelPoints
        : stepPoints.length && cardsVariant === 'problems'
          ? stepPoints
          : problemPoints
  ).slice(0, 6);
  target.section_labels = {
    ...(target.section_labels || {}),
    compare_badge: publicLabel(hero?.context_title, 'Сравнение'),
    comparison_parameter: publicLabel(comparison?.parameter_label, 'Параметр'),
    comparison_option_one: publicLabel(comparison?.option_one_label, 'Альтернатива'),
    comparison_option_two: publicLabel(comparison?.option_two_label, 'На что смотреть'),
    comparison_chat_plus: publicLabel(comparison?.option_highlight_label, 'Chat Plus'),
  };

  return target;
}

function mapComparisonDirectoryPage(page: UnknownRecord) {
  const target = buildBasePage(page);
  const hero = findBlock(page, 'hero');
  const cardsGrid = findBlock(page, 'cards-grid');
  const internalLinks = findBlock(page, 'internal-links') || findBlock(page, 'related-links');
  const comparison = findBlock(page, 'comparison-table');

  applyComparison(target, comparison);

  return {
    ...target,
    metaTitle: target.meta_title,
    metaDescription: target.meta_description,
    canonical: target.canonical,
    eyebrow: asString(hero?.eyebrow) || 'Сравнения',
    title: asString(hero?.title) || asString(page.title),
    subtitle: asString(hero?.subtitle) || target.meta_description,
    compareSectionTitle: asString(cardsGrid?.title) || 'Подробные сравнения',
    compareSectionText: asString(cardsGrid?.intro),
    compareCards: mapCardLinks(cardsGrid?.items).map((item) => ({
      href: item.href,
      label: item.title,
      description: item.description,
      cta: item.ctaLabel || 'Смотреть сравнение',
    })),
    vsSectionTitle: asString(internalLinks?.title) || 'Формат vs',
    vsSectionText: asString(internalLinks?.intro),
    vsCards: mapLinks(internalLinks?.links).map((item) => ({
      href: item.href,
      label: item.label,
      description: item.description,
      cta: 'Смотреть формат vs',
    })),
  };
}

function mapSiteMapPage(page: UnknownRecord) {
  const hero = findBlock(page, 'hero');

  return {
    metaTitle: asString(page.seo_title) || asString(page.title) || 'Карта сайта',
    metaDescription: asString(page.seo_description),
    canonical: asString(page.canonical),
    eyebrow: asString(hero?.eyebrow) || 'Структура сайта',
    heading: asString(hero?.title) || asString(page.title) || 'Карта сайта',
    subtitle: asString(hero?.subtitle) || asString(page.seo_description),
  };
}

function mapAiCalendarPage(page: UnknownRecord) {
  const hero = findBlock(page, 'hero');
  const steps = findBlock(page, 'steps');
  const featureList = findBlock(page, 'feature-list');
  const cardsGrid = findBlock(page, 'cards-grid');
  const finalCta = findBlock(page, 'final-cta');

  return {
    title: asString(page.seo_title) || asString(page.title),
    description: asString(page.seo_description),
    canonical: asString(page.canonical),
    eyebrow: asString(hero?.eyebrow),
    heroTitle: asString(hero?.title) || asString(page.title),
    heroSubtitle: asString(hero?.subtitle),
    primaryLabel: asString(hero?.primary_label),
    primaryUrl: asString(hero?.primary_url),
    secondaryLabel: asString(hero?.secondary_label),
    secondaryUrl: asString(hero?.secondary_url),
    stepsTitle: asString(steps?.title),
    stepsIntro: asString(steps?.intro),
    steps: mapCards(steps?.items).map((item) => ({
      title: item.title,
      desc: item.text,
      icon: item.icon || 'lucide:message-circle',
    })),
    integrationsTitle: asString(featureList?.title),
    integrationsIntro: asString(featureList?.intro),
    integrations: mapCards(featureList?.items).map((item) => ({
      title: item.title,
      text: item.text,
      icon: item.icon || 'lucide:calendar-days',
    })),
    industriesTitle: asString(cardsGrid?.title),
    industriesIntro: asString(cardsGrid?.intro),
    industries: mapCards(cardsGrid?.items).map((item) => ({
      name: item.title,
      desc: item.text || item.description,
      icon: item.icon || 'lucide:briefcase',
    })),
    finalTitle: asString(finalCta?.title),
    finalText: asString(finalCta?.text),
    finalPrimaryLabel: asString(finalCta?.primary_label),
    finalPrimaryUrl: asString(finalCta?.primary_url),
    finalSecondaryLabel: asString(finalCta?.secondary_label),
    finalSecondaryUrl: asString(finalCta?.secondary_url),
  };
}

function mapHomePage(page: UnknownRecord) {
  const target = buildBasePage(page);
  const hero = findBlock(page, 'hero');
  const cardsGrid = findBlockByVariant(page, 'cards-grid', 'problems') || findBlock(page, 'cards-grid');
  const integrationsGrid = pickIntegrationCards(page);
  const featureList = findBlock(page, 'feature-list');

  const proofStats = findBlock(page, 'proof-stats');
  if (!proofStatsDuplicateHeroFacts(proofStats, hero)) {
    applyProofStats(target, proofStats, 'home');
  }
  applyCardsToProblems(target, cardsGrid);
  applyFeatureList(target, featureList);
  applyIntegrationCards(target, integrationsGrid);
  applySteps(target, findBlock(page, 'steps'));
  applyBeforeAfter(target, findBlock(page, 'before-after'));
  applyUseCases(target, pickUseCases(page));
  applyHeroPanel(target, hero, 'structured');

  if (!asArray(target.integration_blocks).length && featureList) {
    target.integrations_title = asString(featureList.title);
    target.integration_blocks = mapTextItems(featureList.items).map((item) => ({
      label: item.title,
      text: item.text,
    }));
  }

  return target;
}

function mapStructuredPage(page: UnknownRecord) {
  const target = buildBasePage(page);
  const hero = findBlock(page, 'hero');
  const cardsGrid = findBlockByVariant(page, 'cards-grid', 'problems') || findBlock(page, 'cards-grid');
  const integrationsGrid = pickIntegrationCards(page);
  const featureList = findBlock(page, 'feature-list');
  const useCasesGrid = pickUseCases(page);

  applyHeroPanel(target, hero, 'structured');
  applyCardsToProblems(target, cardsGrid);
  applyFeatureList(target, featureList);
  applyIntegrationCards(target, integrationsGrid);
  applySteps(target, findBlock(page, 'steps'));
  applyBeforeAfter(target, findBlock(page, 'before-after'));
  applyComparison(target, findBlock(page, 'comparison-table'));
  applyUseCases(target, useCasesGrid);
  applyNavigationGroups(target, useCasesGrid);

  const breadcrumbs = mapLinks(page.breadcrumbs)
    .map((item) => ({ label: item.label, href: item.href }))
    .filter((item) => item.label);
  if (breadcrumbs.length > 0) {
    target.breadcrumbs = breadcrumbs;
  }

  return target;
}

function mapTendersPage(page: UnknownRecord) {
  const target = buildBasePage(page);
  const hero = findBlock(page, 'hero');
  const cardsGrid = findBlockByVariant(page, 'cards-grid', 'problems') || findBlock(page, 'cards-grid');
  const integrationsGrid = pickIntegrationCards(page);
  const featureList = findBlock(page, 'feature-list');

  applyHeroPanel(target, hero, 'tenders');
  applyCardsToProblems(target, cardsGrid);
  applyFeatureList(target, featureList);
  applyIntegrationCards(target, integrationsGrid);
  applySteps(target, findBlock(page, 'steps'));
  applyBeforeAfter(target, findBlock(page, 'before-after'));
  applyComparison(target, findBlock(page, 'comparison-table'));
  applyUseCases(target, pickUseCases(page));

  return target;
}

export function mapPageV2ToLegacyPage(page: UnknownRecord, family: LegacyPageFamily) {
  switch (family) {
    case 'home':
      return mapHomePage(page);
    case 'campaign':
      return mapCampaignPage(page);
    case 'brand':
      return mapBrandPage(page);
    case 'resource':
      return mapResourcePage(page);
    case 'pricing':
      return mapPricingPage(page);
    case 'partnership':
      return mapPartnershipPage(page);
    case 'directory':
      return mapDirectoryPage(page);
    case 'comparison_directory':
      return mapComparisonDirectoryPage(page);
    case 'comparison':
      return mapComparisonPage(page);
    case 'tenders':
      return mapTendersPage(page);
    case 'site_map':
      return mapSiteMapPage(page);
    case 'ai_calendar':
      return mapAiCalendarPage(page);
    case 'structured':
      return mapStructuredPage(page);
    default:
      return buildBasePage(page);
  }
}
