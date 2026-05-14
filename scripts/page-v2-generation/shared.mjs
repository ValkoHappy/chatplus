import { getPageV2Blueprint, validatePageV2BlueprintSections } from '../../config/page-v2-blueprints.mjs';
import { validatePageV2LayoutParity } from '../../config/page-v2-layout-parity.mjs';
import { isReservedPageV2Route, normalizePageV2RoutePath } from '../../config/page-v2-routes.mjs';

export const AI_ALLOWED_PAGE_V2_BLUEPRINTS = Object.freeze([
  'landing',
  'directory',
  'entity_detail',
  'entity_intersection',
  'comparison',
  'campaign',
  'resource',
  'brand',
  'system',
]);
export const CATALOG_ENTITY_FAMILIES = Object.freeze({
  channels: {
    jobField: 'target_channels',
    pageField: 'channels',
    uid: 'api::channel.channel',
    endpoint: 'channels',
    label: 'Channel',
  },
  industries: {
    jobField: 'target_industries',
    pageField: 'industries',
    uid: 'api::industry.industry',
    endpoint: 'industries',
    label: 'Industry',
  },
  integrations: {
    jobField: 'target_integrations',
    pageField: 'integrations',
    uid: 'api::integration.integration',
    endpoint: 'integrations',
    label: 'Integration',
  },
  solutions: {
    jobField: 'target_solutions',
    pageField: 'solutions',
    uid: 'api::solution.solution',
    endpoint: 'solutions',
    label: 'Solution',
  },
  features: {
    jobField: 'target_features',
    pageField: 'features',
    uid: 'api::feature.feature',
    endpoint: 'features',
    label: 'Feature',
  },
  business_types: {
    jobField: 'target_business_types',
    pageField: 'business_types',
    uid: 'api::business-type.business-type',
    endpoint: 'business-types',
    label: 'Business Type',
  },
  competitors: {
    jobField: 'target_competitors',
    pageField: 'competitors',
    uid: 'api::competitor.competitor',
    endpoint: 'competitors',
    label: 'Competitor',
  },
});

const DEFAULT_AI_API_BASE_URL = 'https://api.openai.com/v1';
const CHAT_COMPLETIONS_PATH = '/chat/completions';

const DEFAULT_ROUTE_PREFIX_BY_BLUEPRINT = Object.freeze({
  landing: '/pages',
  directory: '/directories',
  entity_detail: '/pages',
  entity_intersection: '/pages',
  comparison: '/pages',
  campaign: '/campaigns',
  resource: '/resources',
  brand: '/brand',
  system: '/pages',
});

const COMPONENT_BY_BLOCK_TYPE = Object.freeze({
  hero: 'page-blocks.hero',
  'rich-text': 'page-blocks.rich-text',
  'proof-stats': 'page-blocks.proof-stats',
  'cards-grid': 'page-blocks.cards-grid',
  'feature-list': 'page-blocks.feature-list',
  steps: 'page-blocks.steps',
  faq: 'page-blocks.faq',
  testimonial: 'page-blocks.testimonial',
  'related-links': 'page-blocks.related-links',
  'final-cta': 'page-blocks.final-cta',
  'pricing-plans': 'page-blocks.pricing-plans',
  'comparison-table': 'page-blocks.comparison-table',
  'before-after': 'page-blocks.before-after',
  'internal-links': 'page-blocks.internal-links',
});

const PAGE_V2_TEMPLATE_VARIANTS = Object.freeze(['default', 'editorial', 'showcase', 'minimal', 'directory', 'comparison', 'sitemap']);
const PAGE_V2_NAV_GROUPS = Object.freeze(['primary', 'product', 'catalogs', 'resources', 'company', 'special']);
const PAGE_V2_SITEMAP_CHANGEFREQS = Object.freeze(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']);

const CYRILLIC_TO_LATIN = Object.freeze({
  '\u0430': 'a',
  '\u0431': 'b',
  '\u0432': 'v',
  '\u0433': 'g',
  '\u0434': 'd',
  '\u0435': 'e',
  '\u0451': 'e',
  '\u0436': 'zh',
  '\u0437': 'z',
  '\u0438': 'i',
  '\u0439': 'y',
  '\u043a': 'k',
  '\u043b': 'l',
  '\u043c': 'm',
  '\u043d': 'n',
  '\u043e': 'o',
  '\u043f': 'p',
  '\u0440': 'r',
  '\u0441': 's',
  '\u0442': 't',
  '\u0443': 'u',
  '\u0444': 'f',
  '\u0445': 'h',
  '\u0446': 'ts',
  '\u0447': 'ch',
  '\u0448': 'sh',
  '\u0449': 'sch',
  '\u044a': '',
  '\u044b': 'y',
  '\u044c': '',
  '\u044d': 'e',
  '\u044e': 'yu',
  '\u044f': 'ya',
});

function asString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asFiniteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function pickEnum(value, allowedValues, fallback, warnings, fieldName) {
  const normalized = asString(value);
  if (!normalized) {
    return fallback;
  }

  if (allowedValues.includes(normalized)) {
    return normalized;
  }

  warnings.push(`Invalid ${fieldName} "${normalized}" was replaced with "${fallback}".`);
  return fallback;
}

function normalizeCtaLabel(value, fallback = '') {
  const label = asString(value);
  if (/^request demo$/i.test(label)) {
    return 'Записаться на демо';
  }
  if (/^request comparison$/i.test(label)) {
    return 'Запросить сравнение';
  }

  return label || fallback;
}

function normalizeApiBaseUrl(value) {
  const baseUrl = asString(value, DEFAULT_AI_API_BASE_URL).replace(/\/+$/, '');
  return baseUrl || DEFAULT_AI_API_BASE_URL;
}

export function buildAiChatClientConfig(env = process.env) {
  const hasOpenRouterKey = Boolean(asString(env.OPENROUTER_API_KEY));
  const hasDeepSeekKey = Boolean(asString(env.DEEPSEEK_API_KEY));
  const apiBaseUrl = normalizeApiBaseUrl(
    env.AI_API_BASE_URL
      || env.OPENAI_API_BASE_URL
      || (hasOpenRouterKey ? 'https://openrouter.ai/api/v1' : '')
      || (hasDeepSeekKey ? 'https://api.deepseek.com/v1' : ''),
  );

  return {
    apiKey: asString(env.AI_API_KEY || env.DEEPSEEK_API_KEY || env.OPENROUTER_API_KEY || env.OPENAI_API_KEY),
    model: asString(env.AI_MODEL || env.DEEPSEEK_MODEL || env.OPENROUTER_MODEL || env.OPENAI_MODEL, hasDeepSeekKey ? 'deepseek-chat' : 'gpt-4o-mini'),
    apiBaseUrl,
    chatCompletionsUrl: `${apiBaseUrl}${CHAT_COMPLETIONS_PATH}`,
  };
}

export function parseAiJsonObject(value = '') {
  return JSON.parse(asString(value).replace(/^\uFEFF/, ''));
}

function slugifySegment(value = '') {
  const transliterated = `${value || ''}`
    .toLowerCase()
    .split('')
    .map((character) => CYRILLIC_TO_LATIN[character] ?? character)
    .join('');

  return transliterated
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/gi, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeIdentity(value = '') {
  return asString(value).toLowerCase().replace(/\s+/g, ' ');
}

function getProposalContainer(aiDraft = {}) {
  const candidates = [
    aiDraft.proposed_entities,
    aiDraft.catalog_entity_proposals,
    aiDraft.entity_proposals,
  ];

  return candidates.find((value) => value && typeof value === 'object' && !Array.isArray(value)) || {};
}

function findExistingCatalogEntity(proposal = {}, existingEntities = []) {
  const proposalSlug = normalizeIdentity(proposal.slug);
  const proposalName = normalizeIdentity(proposal.name);

  return existingEntities.find((entity) => {
    const entitySlug = normalizeIdentity(entity?.slug);
    const entityName = normalizeIdentity(entity?.name || entity?.title);
    return (proposalSlug && entitySlug === proposalSlug) || (proposalName && entityName === proposalName);
  }) || null;
}

export function normalizeCatalogEntityProposals({
  aiDraft = {},
  existingEntitiesByFamily = {},
  maxPerFamily = 5,
} = {}) {
  const container = getProposalContainer(aiDraft);
  const proposals = {};
  const warnings = [];

  for (const [family, config] of Object.entries(CATALOG_ENTITY_FAMILIES)) {
    const rawItems = asArray(container[family] || container[config.endpoint]).slice(0, maxPerFamily);
    const seen = new Set();
    const normalizedItems = [];

    for (const item of rawItems) {
      const name = asString(item?.name || item?.title);
      const slug = slugifySegment(asString(item?.slug) || name);
      const description = asString(item?.description);

      if (!name || !slug || !description) {
        warnings.push(`Skipped incomplete ${family} proposal: name, slug and description are required.`);
        continue;
      }

      const identity = `${family}:${slug}`;
      if (seen.has(identity)) {
        continue;
      }
      seen.add(identity);

      const duplicate = findExistingCatalogEntity({ name, slug }, asArray(existingEntitiesByFamily[family]));
      normalizedItems.push({
        family,
        endpoint: config.endpoint,
        uid: config.uid,
        job_field: config.jobField,
        page_field: config.pageField,
        status: duplicate ? 'duplicate' : 'pending',
        name,
        slug,
        description,
        seo_title: asString(item?.seo_title),
        seo_description: asString(item?.seo_description),
        reason: asString(item?.reason),
        duplicate_match: duplicate
          ? {
              id: duplicate.id || null,
              documentId: duplicate.documentId || null,
              name: asString(duplicate.name || duplicate.title),
              slug: asString(duplicate.slug),
            }
          : null,
      });
    }

    if (normalizedItems.length) {
      proposals[family] = normalizedItems;
    }
  }

  return {
    proposals,
    pending: Object.values(proposals).flat().filter((item) => item.status === 'pending'),
    duplicates: Object.values(proposals).flat().filter((item) => item.status === 'duplicate'),
    warnings,
  };
}

export function buildCatalogEntityCreateData(proposal = {}) {
  return {
    name: asString(proposal.name),
    slug: slugifySegment(asString(proposal.slug) || proposal.name),
    description: asString(proposal.description),
    seo_title: asString(proposal.seo_title),
    seo_description: asString(proposal.seo_description),
    content_origin: 'managed',
    record_mode: 'managed',
    sync_strategy: 'frozen',
  };
}

function normalizeLinkItem(item = {}) {
  const label = asString(item.label) || asString(item.title);
  const href = normalizePageV2RoutePath(asString(item.href) || asString(item.url));

  if (!label || !href || href === '/') {
    return null;
  }

  return {
    label,
    href,
    description: asString(item.description),
  };
}

function routeIsAllowedForAiLink(href = '', existingRoutes = []) {
  const normalized = normalizePageV2RoutePath(href);
  const safeRoutes = new Set([
    '/',
    '/channels',
    '/industries',
    '/integrations',
    '/solutions',
    '/features',
    '/for',
    '/pricing',
    '/demo',
    '/docs',
    '/help',
    '/site-map',
  ]);
  const knownRoutes = new Set(existingRoutes.map((route) => normalizePageV2RoutePath(route)).filter(Boolean));
  return safeRoutes.has(normalized) || knownRoutes.has(normalized);
}

function sanitizeAiInternalLinks(links = [], existingRoutes = [], warnings = []) {
  const fallbackLinks = [
    { label: 'Возможности CHATPLUS', href: '/features', description: 'Раздел с функциями платформы.' },
    { label: 'Решения CHATPLUS', href: '/solutions', description: 'Сценарии применения для разных задач.' },
    { label: 'Интеграции CHATPLUS', href: '/integrations', description: 'Подключения к каналам и рабочим системам.' },
    { label: 'Демо CHATPLUS', href: '/demo', description: 'Показать сценарий на демо.' },
  ];
  const safeLinks = asArray(links).filter((link) => routeIsAllowedForAiLink(link?.href, existingRoutes));
  const dropped = asArray(links).length - safeLinks.length;

  if (dropped > 0) {
    warnings.push(`Replaced ${dropped} AI internal link(s) that did not match a known route.`);
  }

  const seen = new Set(safeLinks.map((link) => normalizePageV2RoutePath(link.href)));
  for (const link of fallbackLinks) {
    if (safeLinks.length >= 3) {
      break;
    }

    const href = normalizePageV2RoutePath(link.href);
    if (!seen.has(href) && routeIsAllowedForAiLink(href, existingRoutes)) {
      safeLinks.push(link);
      seen.add(href);
    }
  }

  return safeLinks;
}

function sanitizeAiSectionLinks(sections = [], existingRoutes = [], warnings = []) {
  for (const section of sections) {
    const blockType = asString(section.__component).replace(/^page-blocks\./, '');
    if (blockType === 'hero') {
      if (!routeIsAllowedForAiLink(section.primary_url, existingRoutes)) {
        if (section.primary_url) {
          warnings.push(`Replaced unsafe AI hero primary URL "${section.primary_url}" with /demo.`);
        }
        section.primary_url = '/demo';
      }

      if (section.secondary_url && !routeIsAllowedForAiLink(section.secondary_url, existingRoutes)) {
        warnings.push(`Replaced unsafe AI hero secondary URL "${section.secondary_url}" with /features.`);
        section.secondary_url = '/features';
      }
    }

    if (blockType === 'final-cta' && !routeIsAllowedForAiLink(section.primary_url, existingRoutes)) {
      if (section.primary_url) {
        warnings.push(`Replaced unsafe AI final CTA URL "${section.primary_url}" with /demo.`);
      }
      section.primary_url = '/demo';
    }

    if (!['related-links', 'internal-links'].includes(blockType)) {
      continue;
    }

    section.links = sanitizeAiInternalLinks(section.links, existingRoutes, warnings);
  }

  return sections;
}

function normalizeCardItem(item = {}) {
  const title = asString(item.title || item.heading || item.label || item.name);
  const text = asString(item.text)
    || asString(item.description)
    || asString(item.body)
    || asString(item.content)
    || asString(item.summary)
    || asString(item.details)
    || asString(item.value);

  if (!title && !text) {
    return null;
  }

  return {
    title: title || 'Преимущество',
    text,
    eyebrow: asString(item.eyebrow),
    icon: asString(item.icon),
    secondary_text: asString(item.secondary_text || item.secondaryText),
  };
}

function normalizeStatItem(item = {}) {
  const label = asString(item.label || item.title || item.heading || item.name);
  const value = asString(item.value || item.number || item.metric);

  if (!label && !value) {
    return null;
  }

  return {
    label: label || 'Метрика',
    value: value || 'Значение',
    description: asString(item.description),
  };
}

function normalizeStepItem(item = {}) {
  const title = asString(item.title || item.heading || item.label || item.name);
  const text = asString(item.text)
    || asString(item.description)
    || asString(item.body)
    || asString(item.content)
    || asString(item.summary)
    || asString(item.details);

  if (!title && !text) {
    return null;
  }

  return {
    title: title || 'Шаг',
    text,
  };
}

function unwrapTargetPageRecord(entry) {
  if (!entry) {
    return null;
  }

  if (entry.attributes && typeof entry.attributes === 'object') {
    return {
      id: entry.id,
      documentId: entry.documentId || entry.attributes.documentId,
      ...entry.attributes,
    };
  }

  return entry;
}

function limitPromptText(value = '', maxLength = 700) {
  const text = asString(value);
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1)}…`;
}

function redactUnsupportedClaimsForPrompt(value = '') {
  const text = asString(value);
  if (!text) {
    return '';
  }

  const timeUnit = '(?:seconds?|minutes?|hours?|days?|weeks?|\\u0441\\u0435\\u043a\\u0443\\u043d\\u0434|\\u043c\\u0438\\u043d\\u0443\\u0442|\\u0447\\u0430\\u0441\\u0430?|\\u0447\\u0430\\u0441\\u043e\\u0432|\\u0434\\u043d\\u044f?|\\u0434\\u043d\\u0435\\u0439|\\u043d\\u0435\\u0434\\u0435\\u043b)';

  return text
    .replace(/\b24\s*\/\s*7\b/giu, '[redacted unsupported availability claim]')
    .replace(new RegExp(`\\b\\d+\\s*[-\\u2013\\u2014]?\\s*${timeUnit}`, 'giu'), '[redacted unsupported time claim]')
    .replace(/\u0434\u043e\s+\u043d\u0435\u0434\u0435\u043b/giu, '[redacted unsupported time claim]')
    .replace(/\u043d\u0435\u0441\u043a\u043e\u043b\u044c\u043a[\u0430\u043e]\s+(?:\u0441\u0435\u043a\u0443\u043d\u0434|\u043c\u0438\u043d\u0443\u0442|\u0447\u0430\u0441\u043e\u0432|\u0434\u043d\u0435\u0439|\u043d\u0435\u0434\u0435\u043b\u044c)/giu, '[redacted unsupported time claim]');
}

function safePromptText(value = '', maxLength = 700) {
  return limitPromptText(redactUnsupportedClaimsForPrompt(value), maxLength);
}

function summarizeSectionForPrompt(section = {}) {
  const blockType = getPageV2SectionBlockType(section);
  const variant = asString(section.variant);

  const summary = {
    block_type: blockType,
    title: safePromptText(section.title, 180),
  };
  if (variant) {
    summary.variant = variant;
  }

  for (const key of ['eyebrow', 'subtitle', 'body', 'text', 'context_title', 'context_text']) {
    const value = safePromptText(section[key], key === 'body' ? 900 : 260);
    if (value) {
      summary[key] = value;
    }
  }

  const cards = asArray(section.cards || section.items || section.panel_items)
    .map((item) => safePromptText(item?.title || item?.question || item?.label, 120))
    .filter(Boolean)
    .slice(0, 8);
  if (cards.length) {
    summary.item_titles = cards;
  }

  const faq = asArray(section.faq || section.questions)
    .map((item) => safePromptText(item?.question || item?.title, 160))
    .filter(Boolean)
    .slice(0, 8);
  if (faq.length) {
    summary.questions = faq;
  }

  return summary;
}

export function getTargetPageContext(job = {}) {
  const page = unwrapTargetPageRecord(job.target_page);
  if (!page) {
    return null;
  }

  const routePath = normalizePageV2RoutePath(page.route_path);
  if (!routePath && !asString(page.title)) {
    return null;
  }

  return {
    id: page.id || null,
    documentId: page.documentId || null,
    title: asString(page.title),
    route_path: routePath,
    page_kind: asString(page.page_kind),
    template_variant: asString(page.template_variant),
    seo_title: safePromptText(page.seo_title, 180),
    seo_description: safePromptText(page.seo_description, 320),
    nav_label: safePromptText(page.nav_label, 120),
    nav_group: asString(page.nav_group),
    nav_order: page.nav_order ?? null,
    nav_description: safePromptText(page.nav_description, 260),
    show_in_header: Boolean(page.show_in_header),
    show_in_footer: Boolean(page.show_in_footer),
    show_in_sitemap: page.show_in_sitemap !== false,
    sitemap_priority: page.sitemap_priority ?? null,
    sitemap_changefreq: asString(page.sitemap_changefreq),
    legacy_template_family: asString(page.legacy_template_family),
    sections: asArray(page.sections).map((section) => summarizeSectionForPrompt(section)),
  };
}

export function getPageV2SectionBlockType(section = {}) {
  return asString(section.block_type)
    || asString(section.blockType)
    || asString(section.__component).replace(/^page-blocks\./, '');
}

function getPageV2SectionVariant(section = {}) {
  return asString(section.variant);
}

export function getPageV2LayoutSignature(sections = []) {
  return asArray(sections).map((section) => ({
    block_type: getPageV2SectionBlockType(section),
    variant: getPageV2SectionVariant(section),
  }));
}

export function validateLockedPageV2Layout(targetSections = [], nextSections = []) {
  const expected = getPageV2LayoutSignature(targetSections);
  const actual = getPageV2LayoutSignature(nextSections);
  const errors = [];

  if (actual.length !== expected.length) {
    errors.push(`Locked AI content mode requires exactly ${expected.length} section(s); AI returned ${actual.length}.`);
  }

  const count = Math.min(expected.length, actual.length);
  for (let index = 0; index < count; index += 1) {
    const target = expected[index];
    const next = actual[index];
    if (target.block_type !== next.block_type) {
      errors.push(`Section ${index + 1} must stay "${target.block_type}", but AI returned "${next.block_type}".`);
    }
    if (target.variant && target.variant !== next.variant) {
      errors.push(`Section ${index + 1} variant must stay "${target.variant}", but AI returned "${next.variant || '(empty)'}".`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    expected,
    actual,
  };
}

function hasLockedTargetLayout(targetPageContext = null) {
  return asArray(targetPageContext?.sections).length > 0;
}

function normalizeFaqItem(item = {}) {
  const question = asString(item.question) || asString(item.title) || asString(item.heading) || asString(item.q);
  const answer = asString(item.answer)
    || asString(item.text)
    || asString(item.description)
    || asString(item.body)
    || asString(item.content)
    || asString(item.a);

  if (!question && !answer) {
    return null;
  }

  return {
    question: question || 'Вопрос для проверки',
    answer: answer || 'Ответ нужно проверить перед публикацией.',
  };
}

function normalizeComparisonRow(item = {}) {
  const parameter = asString(item.parameter || item.feature || item.criterion || item.criteria || item.metric || item.name || item.title);
  const optionOne = asString(item.option_one || item.optionOne || item.without || item.before || item.alternative || item.competitor || item.option_a || item.optionA);
  const optionTwo = asString(item.option_two || item.optionTwo || item.with || item.after || item.recommended || item.option_b || item.optionB);
  const optionHighlight = asString(item.option_highlight || item.optionHighlight || item.chat_plus || item.chatPlus || item.chatplus || item.highlight || item.recommendation);

  if (!parameter && !optionOne && !optionTwo && !optionHighlight) {
    return null;
  }

  return {
    parameter: parameter || 'Критерий',
    option_one: optionOne,
    option_two: optionTwo,
    option_highlight: optionHighlight,
  };
}

function normalizeBeforeAfterList(items = []) {
  return asArray(items)
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim();
      }

      const title = asString(item?.title || item?.label || item?.name || item?.problem || item?.result);
      const text = asString(item?.text || item?.description || item?.body || item?.content || item?.details);

      if (!title && !text) {
        return null;
      }

      return text ? { title: title || 'Пункт', text } : title;
    })
    .filter(Boolean);
}

function normalizeSection(section = {}) {
  const blockType = asString(section.block_type || section.blockType);
  if (!blockType || !COMPONENT_BY_BLOCK_TYPE[blockType]) {
    return null;
  }

  switch (blockType) {
    case 'hero':
      return {
        __component: COMPONENT_BY_BLOCK_TYPE[blockType],
        title: asString(section.title || section.heading || section.headline) || 'Черновик страницы',
        eyebrow: asString(section.eyebrow),
        subtitle: asString(section.subtitle) || asString(section.description) || asString(section.text),
        variant: asString(section.variant) || 'default',
        context_title: asString(section.context_title || section.contextTitle),
        context_text: asString(section.context_text || section.contextText),
        panel_items: asArray(section.panel_items || section.panelItems).map((item) => normalizeCardItem(item)).filter(Boolean),
        primary_label: normalizeCtaLabel(section.primary_label || section.primaryLabel),
        primary_url: asString(section.primary_url || section.primaryUrl),
        secondary_label: normalizeCtaLabel(section.secondary_label || section.secondaryLabel),
        secondary_url: asString(section.secondary_url || section.secondaryUrl),
        trust_facts: asArray(section.trust_facts || section.trustFacts).filter(Boolean),
      };
    case 'rich-text':
      return {
        __component: COMPONENT_BY_BLOCK_TYPE[blockType],
        title: asString(section.title),
        body: asString(section.body) || asString(section.text) || 'Редактор уточнит этот блок перед публикацией.',
      };
    case 'proof-stats':
      return {
        __component: COMPONENT_BY_BLOCK_TYPE[blockType],
        title: asString(section.title || section.heading),
        intro: asString(section.intro) || asString(section.description) || asString(section.text),
        variant: asString(section.variant) || 'cards',
        items: asArray(section.items || section.stats || section.metrics || section.numbers)
          .map((item) => normalizeStatItem(item))
          .filter(Boolean),
      };
    case 'cards-grid':
      return {
        __component: COMPONENT_BY_BLOCK_TYPE[blockType],
        title: asString(section.title || section.heading),
        intro: asString(section.intro) || asString(section.description) || asString(section.text),
        variant: asString(section.variant) || 'default',
        items: asArray(section.items
          || section.cards
          || section.points
          || section.benefits
          || section.problems
          || section.use_cases
          || section.useCases
          || section.features
          || section.advantages
          || section.solutions
          || section.scenarios
          || section.cases
          || section.usecases)
          .map((item) => normalizeCardItem(item))
          .filter(Boolean),
      };
    case 'feature-list':
      return {
        __component: COMPONENT_BY_BLOCK_TYPE[blockType],
        title: asString(section.title || section.heading),
        intro: asString(section.intro) || asString(section.description) || asString(section.text),
        items: asArray(section.items || section.features || section.benefits || section.points)
          .map((item) => normalizeCardItem(item))
          .filter(Boolean),
      };
    case 'steps':
      return {
        __component: COMPONENT_BY_BLOCK_TYPE[blockType],
        title: asString(section.title || section.heading),
        intro: asString(section.intro) || asString(section.description) || asString(section.text),
        variant: asString(section.variant) || 'cards',
        items: asArray(section.items || section.steps || section.process || section.workflow || section.flow)
          .map((item) => normalizeStepItem(item))
          .filter(Boolean),
      };
    case 'faq':
      return {
        __component: COMPONENT_BY_BLOCK_TYPE[blockType],
        title: asString(section.title || section.heading),
        intro: asString(section.intro) || asString(section.description) || asString(section.text),
        items: asArray(section.items || section.faq || section.faqs || section.questions || section.qa)
          .map((item) => normalizeFaqItem(item))
          .filter(Boolean),
      };
    case 'testimonial':
      return {
        __component: COMPONENT_BY_BLOCK_TYPE[blockType],
        title: asString(section.title),
        quote: asString(section.quote) || asString(section.text) || 'Редактор уточнит этот отзыв перед публикацией.',
        author: asString(section.author_name || section.authorName || section.author),
        role: asString(section.author_role || section.authorRole || section.role),
      };
    case 'related-links':
      return {
        __component: COMPONENT_BY_BLOCK_TYPE[blockType],
        title: asString(section.title),
        intro: asString(section.intro),
        links: asArray(section.links).map((item) => normalizeLinkItem(item)).filter(Boolean),
      };
    case 'final-cta':
      const cta = section.cta && typeof section.cta === 'object' && !Array.isArray(section.cta) ? section.cta : {};
      return {
        __component: COMPONENT_BY_BLOCK_TYPE[blockType],
        title: asString(section.title || section.heading || cta.title).replace(/^Ready for the next step\?$/i, 'Следующий шаг') || 'Следующий шаг',
        text: asString(section.text) || asString(section.subtitle) || asString(section.description) || asString(cta.text),
        primary_label: normalizeCtaLabel(section.primary_label || section.primaryLabel || cta.label || cta.primary_label || cta.primaryLabel, 'Записаться на демо'),
        primary_url: asString(section.primary_url || section.primaryUrl || cta.url || cta.href || cta.primary_url || cta.primaryUrl) || '/demo',
        secondary_label: normalizeCtaLabel(section.secondary_label || section.secondaryLabel || cta.secondary_label || cta.secondaryLabel),
        secondary_url: asString(section.secondary_url || section.secondaryUrl || cta.secondary_url || cta.secondaryUrl),
      };
    case 'pricing-plans':
      return {
        __component: COMPONENT_BY_BLOCK_TYPE[blockType],
        title: asString(section.title),
        intro: asString(section.intro),
        variant: asString(section.variant) || 'cards',
        items: asArray(section.items).map((item) => {
          const current = item || {};
          return {
            title: asString(current.title),
            label: asString(current.label),
            price: asString(current.price),
            period: asString(current.period),
            note: asString(current.note),
            text: asString(current.text),
            cta_label: asString(current.cta_label || current.ctaLabel),
            cta_url: asString(current.cta_url || current.ctaUrl),
            icon: asString(current.icon),
            kicker: asString(current.kicker),
            accent: Boolean(current.accent),
            features: asArray(current.features).filter(Boolean),
          };
        }).filter((item) => item.title || item.label || item.price),
      };
    case 'comparison-table':
      const comparisonRows = asArray(section.rows || section.items || section.comparison_rows || section.comparisonRows || section.criteria);
      return {
        __component: COMPONENT_BY_BLOCK_TYPE[blockType],
        title: asString(section.title),
        intro: asString(section.intro),
        option_one_label: asString(section.option_one_label || section.optionOneLabel || section.alternative_label || section.alternativeLabel),
        option_two_label: asString(section.option_two_label || section.optionTwoLabel || section.recommended_label || section.recommendedLabel),
        option_highlight_label: asString(section.option_highlight_label || section.optionHighlightLabel || section.chat_plus_label || section.chatPlusLabel),
        rows: comparisonRows.map((item) => normalizeComparisonRow(item)).filter(Boolean),
      };
    case 'before-after':
      const beforeItems = section.before_items || section.beforeItems || section.before || section.problems || section.without || section.current_state || section.currentState;
      const afterItems = section.after_items || section.afterItems || section.after || section.results || section.with_chatplus || section.withChatplus || section.target_state || section.targetState;
      const pairedItems = asArray(section.items || section.pairs);
      return {
        __component: COMPONENT_BY_BLOCK_TYPE[blockType],
        title: asString(section.title),
        intro: asString(section.intro),
        before_title: asString(section.before_title || section.beforeTitle),
        after_title: asString(section.after_title || section.afterTitle),
        before_items: normalizeBeforeAfterList(beforeItems || pairedItems.map((item) => item?.before || item?.problem || item?.current).filter(Boolean)),
        after_items: normalizeBeforeAfterList(afterItems || pairedItems.map((item) => item?.after || item?.result || item?.target).filter(Boolean)),
        quote: asString(section.quote),
        quote_author: asString(section.quote_author || section.quoteAuthor),
      };
    case 'internal-links':
      return {
        __component: COMPONENT_BY_BLOCK_TYPE[blockType],
        eyebrow: asString(section.eyebrow),
        title: asString(section.title),
        intro: asString(section.intro),
        links: asArray(section.links).map((item) => normalizeLinkItem(item)).filter(Boolean),
      };
    default:
      return null;
  }
}

function buildFallbackSection(blockType, context) {
  const title = context.title || 'Черновик страницы';

  switch (blockType) {
    case 'hero':
      return normalizeSection({
        block_type: 'hero',
        eyebrow: 'CHATPLUS',
        title,
        subtitle: context.summary || 'AI-черновик готов и ожидает редакторской проверки.',
        primary_label: 'Записаться на демо',
        primary_url: '/demo',
      });
    case 'rich-text':
      return normalizeSection({
        block_type: 'rich-text',
        title: 'О странице',
        body: context.summary || context.prompt || 'Редактор уточнит этот блок после AI-генерации.',
      });
    case 'cards-grid':
    case 'feature-list':
      return normalizeSection({
        block_type: blockType,
        title: 'Ключевые акценты',
        items: [
          { title: 'Быстрый черновик', text: 'Страница создана как AI-черновик и требует редакторской проверки.' },
          { title: 'Гибкое редактирование', text: 'Редактор может доработать контент в Strapi без изменений кода.' },
        ],
      });
    case 'steps':
      return normalizeSection({
        block_type: 'steps',
        title: 'Следующие шаги',
        items: [
          { title: 'Проверить черновик', text: 'Откройте страницу в Strapi и уточните важные формулировки.' },
          { title: 'Проверить SEO', text: 'Проверьте title, description и внутренние ссылки перед публикацией.' },
        ],
      });
    case 'faq':
      return normalizeSection({
        block_type: 'faq',
        title: 'Частые вопросы',
        items: [
          {
            question: 'Можно ли редактировать эту страницу вручную?',
            answer: 'Да. Это обычный черновик Page, который можно доработать в Strapi перед публикацией.',
          },
        ],
      });
    case 'testimonial':
      return normalizeSection({
        block_type: 'testimonial',
        title: 'Редакторская заметка',
        quote: 'AI-черновики ускоряют подготовку страниц, но финальное решение остаётся за человеком.',
        author_name: 'Команда CHATPLUS',
        author_role: 'Редакторская проверка',
      });
    case 'related-links':
      return normalizeSection({
        block_type: 'related-links',
        title: 'Полезные ссылки',
        links: [{ label: 'Документация', href: '/docs', description: 'Материалы по продукту и редакторскому процессу.' }],
      });
    case 'final-cta':
      return normalizeSection({
        block_type: 'final-cta',
        title: 'Следующий шаг',
        text: 'После редакторской проверки страницу можно опубликовать и добавить в навигацию сайта.',
        primary_label: 'Записаться на демо',
        primary_url: '/demo',
      });
    default:
      return null;
  }
}

export function isAiBlueprintAllowed(blueprintId = '') {
  return AI_ALLOWED_PAGE_V2_BLUEPRINTS.includes(asString(blueprintId));
}

export function assertAiBlueprintAllowed(blueprintId = '') {
  if (!isAiBlueprintAllowed(blueprintId)) {
    throw new Error(
      `AI draft generation is not allowed for blueprint "${blueprintId}". ` +
      `Allowed blueprints: ${AI_ALLOWED_PAGE_V2_BLUEPRINTS.join(', ')}.`,
    );
  }
}

export function assertAiGenerationJobAllowed(job = {}) {
  const targetPageContext = getTargetPageContext(job);
  if (!targetPageContext) {
    throw new Error(
      'AI generation is locked to existing Page drafts. Select target_page first; free page creation is disabled.',
    );
  }

  const targetBlueprint = asString(job.target_blueprint) || asString(targetPageContext.page_kind);
  assertAiBlueprintAllowed(targetBlueprint);

  if (targetPageContext.page_kind && targetBlueprint !== targetPageContext.page_kind) {
    throw new Error(
      `Generation Job target_blueprint "${targetBlueprint}" must match target_page page_kind "${targetPageContext.page_kind}".`,
    );
  }
}

export function buildSafePageV2RoutePath({
  title = '',
  suggestedRoutePath = '',
  blueprintId = 'landing',
  existingRoutes = [],
  jobId = '',
}) {
  const warnings = [];
  const normalizedExisting = new Set(existingRoutes.map((item) => normalizePageV2RoutePath(item)).filter(Boolean));
  const blueprint = getPageV2Blueprint(blueprintId);
  const preferredPrefix = DEFAULT_ROUTE_PREFIX_BY_BLUEPRINT[blueprintId] || '/pages';
  const titleSlug = slugifySegment(title) || 'draft-page';
  const requestedPath = normalizePageV2RoutePath(suggestedRoutePath || `${preferredPrefix}/${titleSlug}`);

  let candidate = requestedPath;
  if (candidate === '/') {
    candidate = `${preferredPrefix}/${titleSlug}`;
  }

  if (isReservedPageV2Route(candidate)) {
    warnings.push(`Route ${candidate} collides with reserved routes and was moved under ${preferredPrefix}.`);
    candidate = normalizePageV2RoutePath(`${preferredPrefix}/${slugifySegment(candidate) || titleSlug}`);
  }

  if (!candidate.startsWith(`${preferredPrefix}/`) && candidate !== preferredPrefix) {
    warnings.push(`Route ${candidate} was moved under the standard ${blueprintId} prefix ${preferredPrefix}.`);
    candidate = normalizePageV2RoutePath(`${preferredPrefix}/${slugifySegment(candidate) || titleSlug}`);
  }

  let counter = 0;
  while (normalizedExisting.has(candidate)) {
    counter += 1;
    const suffix = jobId ? `-${jobId}` : `-${counter}`;
    warnings.push(`Route ${candidate} already exists. Added suffix ${suffix}.`);
    const baseSlug = slugifySegment(title) || 'draft-page';
    candidate = normalizePageV2RoutePath(`${preferredPrefix}/${baseSlug}${suffix}`);
  }

  if (blueprint && isReservedPageV2Route(candidate)) {
    throw new Error(`Could not build a safe route for blueprint ${blueprint.id}.`);
  }

  return {
    routePath: candidate,
    warnings,
  };
}

export function normalizeGeneratedPageV2Draft({ job = {}, aiDraft = {}, existingRoutes = [], blueprintDocumentId = null, blockPlan = null }) {
  const targetPageContext = getTargetPageContext(job);
  const blueprintId = asString(job.target_blueprint) || asString(targetPageContext?.page_kind) || 'landing';
  const blueprint = getPageV2Blueprint(blueprintId);
  if (!blueprint) {
    throw new Error(`Unknown page_v2 blueprint: ${blueprintId}`);
  }

  const title = asString(aiDraft.title) || asString(job.title) || 'Черновик страницы';
  const summary = asString(aiDraft.summary) || asString(job.request_prompt);
  let routePath = '';
  let warnings = [];

  if (targetPageContext?.route_path) {
    routePath = targetPageContext.route_path;
    const suggestedRoute = normalizePageV2RoutePath(aiDraft.route_path);
    if (suggestedRoute && suggestedRoute !== routePath) {
      warnings.push(`AI suggested route ${suggestedRoute}, but target_page route ${routePath} was preserved.`);
    }
    if (isReservedPageV2Route(routePath)) {
      warnings.push(`Selected target_page uses reserved route ${routePath}; migration safety flags remain disabled.`);
    }
  } else {
    const routeResult = buildSafePageV2RoutePath({
      title,
      suggestedRoutePath: asString(aiDraft.route_path),
      blueprintId,
      existingRoutes,
      jobId: `${job.id || ''}`.trim(),
    });
    routePath = routeResult.routePath;
    warnings = routeResult.warnings;
  }

  const sections = asArray(aiDraft.sections)
    .map((section) => normalizeSection(section))
    .filter(Boolean);

  if (hasLockedTargetLayout(targetPageContext)) {
    const targetSignature = getPageV2LayoutSignature(targetPageContext.sections);
    sections.forEach((section, index) => {
      const expectedVariant = targetSignature[index]?.variant || '';
      const actualVariant = getPageV2SectionVariant(section);
      if (expectedVariant && expectedVariant !== actualVariant) {
        warnings.push(`Section ${index + 1} variant "${actualVariant || '(empty)'}" was reset to locked target variant "${expectedVariant}".`);
        section.variant = expectedVariant;
      }
    });

    const layoutValidation = validateLockedPageV2Layout(targetPageContext.sections, sections);
    if (!layoutValidation.ok) {
      throw new Error(`Locked AI content mode rejected layout changes. ${layoutValidation.errors.join(' ')}`);
    }
  } else {
    for (const requiredBlock of blueprint.requiredBlocks) {
      const hasBlock = sections.some((section) => {
        const component = COMPONENT_BY_BLOCK_TYPE[requiredBlock];
        return section?.__component === component;
      });

      if (!hasBlock) {
        const fallback = buildFallbackSection(requiredBlock, {
          title,
          summary,
          prompt: asString(job.request_prompt),
        });
        if (fallback) {
          sections.push(fallback);
          warnings.push(`Added fallback required block: ${requiredBlock}.`);
        }
      }
    }
  }

  const simplifiedSections = sections.map((section) => ({
    block_type: Object.entries(COMPONENT_BY_BLOCK_TYPE).find(([, component]) => component === section.__component)?.[0] || '',
  }));
  if (!targetPageContext) {
    const validation = validatePageV2BlueprintSections(blueprintId, simplifiedSections);
    if (!validation.ok) {
      throw new Error(validation.errors.join(' '));
    }
  }
  const templateVariant = pickEnum(
    aiDraft.template_variant,
    PAGE_V2_TEMPLATE_VARIANTS,
    blueprint.templateVariant,
    warnings,
    'template_variant',
  );
  const navGroup = pickEnum(aiDraft.nav_group, PAGE_V2_NAV_GROUPS, 'resources', warnings, 'nav_group');
  const sitemapChangefreq = pickEnum(
    aiDraft.sitemap_changefreq,
    PAGE_V2_SITEMAP_CHANGEFREQS,
    'weekly',
    warnings,
    'sitemap_changefreq',
  );

  const parity = validatePageV2LayoutParity({
    family: blueprintId,
    routePath,
    sections,
    templateVariant,
  });

  const relationData = {};
  for (const config of Object.values(CATALOG_ENTITY_FAMILIES)) {
    const relationIds = asArray(job[config.jobField])
      .map((item) => item?.documentId || item?.id)
      .filter(Boolean);
    if (!targetPageContext || relationIds.length) {
      relationData[config.pageField] = relationIds;
    }
  }
  const preserveBoolean = (fieldName, fallback) => (
    targetPageContext ? Boolean(targetPageContext[fieldName]) : fallback
  );
  const preserveValue = (fieldName, fallback = '') => (
    targetPageContext && targetPageContext[fieldName] !== undefined && targetPageContext[fieldName] !== null && targetPageContext[fieldName] !== ''
      ? targetPageContext[fieldName]
      : fallback
  );

  return {
    data: {
      ...(blueprintDocumentId ? { blueprint: blueprintDocumentId } : {}),
      title,
      slug: slugifySegment(asString(aiDraft.slug) || title) || 'draft-page',
      route_path: routePath,
      locale: asString(aiDraft.locale) || 'ru',
      page_kind: asString(targetPageContext?.page_kind) || blueprint.pageKind,
      template_variant: asString(targetPageContext?.template_variant) || templateVariant,
      generation_mode: job.job_type === 'scheduled' ? 'ai_generated' : 'ai_assisted',
      source_mode: 'hybrid',
      editorial_status: 'review',
      migration_ready: false,
      parity_status: parity.status,
      legacy_template_family: asString(targetPageContext?.legacy_template_family) || blueprintId,
      legacy_layout_signature: parity.signature,
      parity_notes: {
        errors: parity.errors,
        missing_blocks: parity.missing_blocks,
        warnings,
      },
      seo_title: asString(aiDraft.seo_title) || title,
      seo_description: asString(aiDraft.seo_description) || summary || 'AI-черновик страницы ожидает редакторской проверки.',
      canonical: asString(aiDraft.canonical),
      robots: asString(aiDraft.robots) || 'index,follow',
      nav_group: preserveValue('nav_group', navGroup),
      nav_label: asString(aiDraft.nav_label) || title,
      nav_description: asString(aiDraft.nav_description) || targetPageContext?.nav_description || (!targetPageContext ? summary : ''),
      nav_order: asFiniteNumber(preserveValue('nav_order', aiDraft.nav_order), 100),
      show_in_header: preserveBoolean('show_in_header', Boolean(aiDraft.show_in_header)),
      show_in_footer: preserveBoolean('show_in_footer', Boolean(aiDraft.show_in_footer)),
      show_in_sitemap: preserveBoolean('show_in_sitemap', aiDraft.show_in_sitemap !== false),
      sitemap_priority: asFiniteNumber(preserveValue('sitemap_priority', aiDraft.sitemap_priority), 0.5),
      sitemap_changefreq: preserveValue('sitemap_changefreq', sitemapChangefreq),
      generation_prompt: asString(job.request_prompt),
      ai_metadata: {
        blueprint: blueprintId,
        blueprint_document_id: blueprintDocumentId || null,
        block_plan: blockPlan
          ? {
              strategy: blockPlan.strategy,
              preferred_blocks: blockPlan.preferredBlocks,
              rejected_blocks: blockPlan.rejectedBlocks,
            }
          : null,
        generated_from_job_id: job.id || null,
        refines_target_page_id: targetPageContext?.id || null,
        refines_target_page_document_id: targetPageContext?.documentId || null,
        generated_at: new Date().toISOString(),
        requested_by: asString(job.requested_by),
        warnings,
        locked_layout: Boolean(targetPageContext),
        layout_signature: getPageV2LayoutSignature(sections),
      },
      human_review_required: true,
      owner: asString(job.requested_by),
      reviewer: asString(aiDraft.reviewer),
      breadcrumbs: [],
      internal_links: sanitizeAiInternalLinks(
        asArray(aiDraft.internal_links).map((item) => normalizeLinkItem(item)).filter(Boolean),
        existingRoutes,
        warnings,
      ),
      sections: sanitizeAiSectionLinks(sections, existingRoutes, warnings),
      ...relationData,
    },
    warnings,
    blueprint,
  };
}

export function validateVisiblePageV2DraftContent(pageDraftData = {}) {
  const errors = [];
  const sections = asArray(pageDraftData.sections);
  const componentName = (section = {}) => asString(section.__component).replace(/^page-blocks\./, '');
  const sectionsByBlockType = (blockType) => sections.filter((section) => componentName(section) === blockType);
  const cardsGrids = () => sectionsByBlockType('cards-grid');
  const hasCardsVariant = (variants = []) => {
    const normalized = new Set(variants.map((variant) => asString(variant).toLowerCase()));
    return cardsGrids().some((section) => normalized.has(asString(section.variant).toLowerCase()));
  };
  const hasLinkBlock = () => sections.some((section) => ['related-links', 'internal-links'].includes(componentName(section)));
  const firstHero = () => sectionsByBlockType('hero')[0] || null;
  const textValues = [];
  const collectText = (value) => {
    if (!value) {
      return;
    }

    if (typeof value === 'string' || typeof value === 'number') {
      textValues.push(String(value));
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        collectText(item);
      }
      return;
    }

    if (typeof value === 'object') {
      for (const item of Object.values(value)) {
        collectText(item);
      }
    }
  };

  if (!asString(pageDraftData.title)) {
    errors.push('Page title is empty.');
  }

  if (!asString(pageDraftData.seo_title)) {
    errors.push('SEO title is empty.');
  }

  if (!asString(pageDraftData.seo_description)) {
    errors.push('SEO description is empty.');
  }

  collectText(pageDraftData.title);
  collectText(pageDraftData.seo_title);
  collectText(pageDraftData.seo_description);
  collectText(pageDraftData.nav_label);
  collectText(pageDraftData.nav_description);
  collectText(sections);

  if (!sections.length) {
    errors.push('Page has no sections.');
  }

  for (const section of sections) {
    const blockType = componentName(section);
    if (!blockType) {
      continue;
    }

    if (['cards-grid', 'feature-list', 'steps', 'faq', 'proof-stats', 'pricing-plans'].includes(blockType)) {
      if (!asArray(section.items).length) {
        errors.push(`${blockType} section "${asString(section.title) || '(untitled)'}" has no items.`);
      }
    }

    if (['related-links', 'internal-links'].includes(blockType) && !asArray(section.links).length) {
      errors.push(`${blockType} section "${asString(section.title) || '(untitled)'}" has no links.`);
    }

    if (blockType === 'comparison-table' && !asArray(section.rows).length) {
      errors.push(`comparison-table section "${asString(section.title) || '(untitled)'}" has no rows.`);
    }

    if (blockType === 'before-after' && !asArray(section.before_items).length && !asArray(section.after_items).length) {
      errors.push(`before-after section "${asString(section.title) || '(untitled)'}" has no before_items or after_items.`);
    }

    if (blockType === 'hero' && !asString(section.title)) {
      errors.push('Hero section title is empty.');
    }

    if (blockType === 'final-cta' && !asString(section.title) && !asString(section.text)) {
      errors.push('Final CTA has neither title nor text.');
    }
  }

  if (['campaign', 'brand', 'resource'].includes(asString(pageDraftData.page_kind))) {
    const pageKind = asString(pageDraftData.page_kind);
    const hero = firstHero();
    const heroFacts = asArray(hero?.trust_facts).filter(Boolean);
    const faq = sectionsByBlockType('faq')[0] || null;
    const faqCount = asArray(faq?.items).length;

    if (sections.length < (pageKind === 'resource' ? 7 : 8)) {
      errors.push(`${pageKind} family draft is too sparse for preview: expected a complete family layout section set.`);
    }

    if (heroFacts.length < 3) {
      errors.push(`${pageKind} family draft needs at least 3 hero trust_facts for the family hero panel.`);
    }

    if (!hasCardsVariant(['problems'])) {
      errors.push(`${pageKind} family draft needs a cards-grid section with variant "problems".`);
    }

    if (!hasCardsVariant(['pillars', 'editorial'])) {
      errors.push(`${pageKind} family draft needs a cards-grid section with variant "pillars" or "editorial".`);
    }

    if (pageKind !== 'brand' && !hasCardsVariant(['use_cases', 'use-cases'])) {
      errors.push(`${pageKind} family draft needs a cards-grid section with variant "use_cases".`);
    }

    if (!sectionsByBlockType('steps').length) {
      errors.push(`${pageKind} family draft needs a steps section for the family process block.`);
    }

    if (faqCount < 4) {
      errors.push(`${pageKind} family draft needs at least 4 FAQ items.`);
    }

    if (!hasLinkBlock()) {
      errors.push(`${pageKind} family draft needs related-links or internal-links for the link section.`);
    }
  }

  const allText = textValues.join('\n').toLowerCase();
  const unsupportedClaimPatterns = [
    { pattern: /24\s*\/\s*7|круглосуточ/i, label: '24/7 or round-the-clock claim' },
    { pattern: /увелич(ьте|ит|ение)[^.\n]{0,80}(конверси|продаж|прибыл|выручк)/i, label: 'growth or profit claim' },
    { pattern: /повыс(ьте|ит|ить|им)[^.\n]{0,80}(лояльност|прибыл|выручк|конверси)/i, label: 'unsupported improvement claim' },
    { pattern: /\b\d+\s*[-–]\s*\d+\s*(секунд|минут|дн|дня|дней|час|часа|часов|недел)/i, label: 'specific implementation time claim' },
    { pattern: /до\s+недел/i, label: 'specific implementation time claim' },
    { pattern: /нескольк[ао]\s+(секунд|минут|часов|дней|недель)/i, label: 'specific implementation time claim' },
    { pattern: /(\d+[\s\u00a0]*(₽|руб|р\.|usd|eur|\$|€)|от\s+\d+|за\s+\d+)[^.\n]{0,80}(цен[аы]|стоимост|тариф|план|подписк)/i, label: 'price or tariff claim' },
    { pattern: /(цен[аы]|стоимост|тариф|план|подписк)[^.\n]{0,80}(\d+[\s\u00a0]*(₽|руб|р\.|usd|eur|\$|€)|от\s+\d+|за\s+\d+)/i, label: 'price or tariff claim' },
    { pattern: /гарант/i, label: 'guarantee claim' },
  ];

  for (const { pattern, label } of unsupportedClaimPatterns) {
    if (pattern.test(allText)) {
      errors.push(`Unsupported AI claim detected: ${label}.`);
    }
  }

  const unsupportedNeedles = [
    { needles: ['24/7', '\u043a\u0440\u0443\u0433\u043b\u043e\u0441\u0443\u0442'], label: '24/7 or round-the-clock claim' },
    { needles: ['\u0440\u043e\u0441\u0442 \u043f\u0440\u043e\u0434\u0430\u0436', '\u0440\u043e\u0441\u0442 \u0432\u044b\u0440\u0443\u0447'], label: 'unsupported growth or improvement claim' },
    { needles: ['\u0433\u0430\u0440\u0430\u043d\u0442'], label: 'guarantee claim' },
  ];
  const unsupportedPatterns = [
    { pattern: /\b\d+\s*[-–]\s*\d+\s*(\u0441\u0435\u043a\u0443\u043d\u0434|\u043c\u0438\u043d\u0443\u0442|\u0434\u043d|\u0434\u043d\u044f|\u0434\u043d\u0435\u0439|\u0447\u0430\u0441|\u0447\u0430\u0441\u0430|\u0447\u0430\u0441\u043e\u0432|\u043d\u0435\u0434\u0435\u043b)/i, label: 'specific implementation time claim' },
    { pattern: /\u0434\u043e\s+\u043d\u0435\u0434\u0435\u043b/i, label: 'specific implementation time claim' },
    { pattern: /\u043d\u0435\u0441\u043a\u043e\u043b\u044c\u043a[\u0430\u043e]\s+(\u0441\u0435\u043a\u0443\u043d\u0434|\u043c\u0438\u043d\u0443\u0442|\u0447\u0430\u0441\u043e\u0432|\u0434\u043d\u0435\u0439|\u043d\u0435\u0434\u0435\u043b\u044c)/i, label: 'specific implementation time claim' },
  ];

  for (const { needles, label } of unsupportedNeedles) {
    if (needles.some((needle) => allText.includes(needle))) {
      errors.push(`Unsupported AI claim detected: ${label}.`);
    }
  }

  for (const { pattern, label } of unsupportedPatterns) {
    if (pattern.test(allText)) {
      errors.push(`Unsupported AI claim detected: ${label}.`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function buildGenerationReport({ job = {}, pageDraft, warnings = [], model = '', dryRun = false, blockPlan = null }) {
  const targetPageContext = getTargetPageContext(job);

  return {
    ok: true,
    dry_run: dryRun,
    mode: targetPageContext ? 'refine_existing' : 'create_new',
    job_type: job.job_type || null,
    blueprint: job.target_blueprint || null,
    target_page_id: targetPageContext?.id || null,
    target_page_document_id: targetPageContext?.documentId || null,
    page_title: pageDraft.data.title,
    route_path: pageDraft.data.route_path,
    page_kind: pageDraft.data.page_kind,
    template_variant: pageDraft.data.template_variant,
    generation_mode: pageDraft.data.generation_mode,
    generated_preview: buildGeneratedPreview(pageDraft.data),
    section_types: pageDraft.data.sections.map((section) => section.__component),
    block_plan: blockPlan
      ? {
          strategy: blockPlan.strategy,
          preferred_blocks: blockPlan.preferredBlocks,
          rejected_blocks: blockPlan.rejectedBlocks,
        }
      : null,
    warnings,
    model,
    generated_at: new Date().toISOString(),
  };
}

function buildGeneratedPreview(pageData = {}) {
  const sections = Array.isArray(pageData.sections) ? pageData.sections : [];

  return {
    title: pageData.title || null,
    route_path: pageData.route_path || null,
    seo_title: pageData.seo_title || null,
    seo_description: pageData.seo_description || null,
    sections: sections.map((section, index) => {
      const items = Array.isArray(section.items) ? section.items : [];
      const questions = Array.isArray(section.questions) ? section.questions : items;
      const links = Array.isArray(section.links) ? section.links : [];

      return {
        index: index + 1,
        component: section.__component || null,
        block_type: section.block_type || null,
        variant: section.variant || null,
        title: section.title || section.heading || null,
        intro: section.intro || section.subtitle || section.description || null,
        items: items.slice(0, 5).map((item) => ({
          title: item.title || item.label || item.question || null,
          text: item.text || item.description || item.answer || null,
        })),
        questions: questions.slice(0, 5).map((item) => ({
          question: item.question || item.title || null,
          answer: item.answer || item.text || null,
        })),
        links: links.slice(0, 5).map((item) => ({
          label: item.label || item.title || null,
          href: item.href || item.url || null,
        })),
      };
    }),
  };
}
