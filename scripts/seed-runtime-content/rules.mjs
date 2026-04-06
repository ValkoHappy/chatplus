import {
  ACTIVE_CANONICAL_TEMPLATE_KINDS,
  toCanonicalTemplateKind,
} from '../../config/template-kinds.mjs';

export const LANDING_PAGE_TEMPLATE_KINDS = new Set(
  ACTIVE_CANONICAL_TEMPLATE_KINDS.filter((kind) => kind !== 'directory' && kind !== 'tenders' && kind !== 'comparison').concat('generic'),
);

export const CONTENT_ORIGINS = new Set(['generated', 'managed']);
export const RECORD_MODES = new Set(['managed', 'imported', 'settings']);

export const GENERATED_SINGLETON_SLUGS = new Set([]);
export const MANAGED_SINGLETON_SLUGS = new Set([
  'home',
  'docs',
  'help',
  'academy',
  'blog',
  'status',
  'media',
  'team',
  'conversation',
  'tv',
  'promo',
  'prozorro',
  'demo',
  'pricing',
  'partnership',
]);

export const MANAGED_SINGLETON_TEMPLATE_KINDS = {
  home: 'home',
  docs: 'resource_hub',
  help: 'resource_hub',
  academy: 'resource_hub',
  blog: 'resource_hub',
  status: 'resource_hub',
  media: 'brand_content',
  team: 'brand_content',
  conversation: 'brand_content',
  tv: 'brand_content',
  promo: 'campaign',
  prozorro: 'campaign',
  demo: 'structured',
  pricing: 'pricing',
  partnership: 'partnership',
};

export function normalizeLandingPageTemplateKind(value = '') {
  return toCanonicalTemplateKind(value) || value;
}

export function inferLandingPageTemplateKind(slug = '') {
  if (slug === 'home') {
    return 'home';
  }

  if (slug === 'pricing') {
    return 'pricing';
  }

  if (slug === 'partnership') {
    return 'partnership';
  }

  if (['docs', 'help', 'academy', 'blog', 'status'].includes(slug)) {
    return 'resource_hub';
  }

  if (['media', 'team', 'conversation', 'tv'].includes(slug)) {
    return 'brand_content';
  }

  if (['promo', 'prozorro'].includes(slug)) {
    return 'campaign';
  }

  if (slug === 'demo') {
    return 'structured';
  }

  return 'generic';
}

export function inferLandingPageContentOrigin(slug = '') {
  if (GENERATED_SINGLETON_SLUGS.has(slug)) {
    return 'generated';
  }

  if (MANAGED_SINGLETON_SLUGS.has(slug)) {
    return 'managed';
  }

  return 'managed';
}

export function inferLandingPageRecordMode(slug = '') {
  return inferLandingPageContentOrigin(slug) === 'managed' ? 'managed' : 'imported';
}

export function hasMeaningfulValue(value) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (value && typeof value === 'object') {
    return Object.keys(value).length > 0;
  }

  return value !== undefined && value !== null && String(value).trim() !== '';
}

export const LANDING_PAGE_REQUIRED_FIELDS_BY_TEMPLATE = {
  home: ['subtitle', 'hero_eyebrow', 'sticky_cta_title', 'sticky_cta_text'],
  structured: ['subtitle', 'problem_title', 'solution_title', 'sticky_cta_title'],
  pricing: ['subtitle', 'hero_eyebrow', 'sticky_cta_title', 'sticky_cta_text'],
  partnership: ['subtitle', 'hero_eyebrow', 'sticky_cta_title', 'sticky_cta_text'],
  resource_hub: ['subtitle'],
  brand_content: ['subtitle'],
  campaign: ['subtitle', 'sticky_cta_title'],
  generic: ['subtitle'],
};

export const LANDING_PAGE_REQUIRED_SECTION_LABELS = {
  home: ['roi_without_title', 'roi_with_title', 'pricing_teaser_title', 'pricing_teaser_intro', 'faq_title'],
  structured: ['roi_without_title', 'roi_with_title', 'comparison_header_parameter', 'comparison_header_one', 'comparison_header_two', 'comparison_header_chat_plus'],
  pricing: [
    'hero_panel_title',
    'hero_panel_summary',
    'pricing_title',
    'pricing_intro',
    'tier_popular',
    'bottom_cta_title',
    'bottom_cta_text',
    'bottom_cta_primary',
    'bottom_cta_secondary',
    'comparison_intro',
    'comparison_parameter',
    'comparison_option_one',
    'comparison_option_two',
    'comparison_chat_plus',
    'roi_without_title',
    'roi_with_title',
  ],
  partnership: [
    'comparison_intro',
    'comparison_parameter',
    'comparison_option_one',
    'comparison_option_two',
    'comparison_chat_plus',
    'roi_without_title',
    'roi_with_title',
  ],
  resource_hub: ['hero_eyebrow', 'panel_title'],
  brand_content: ['hero_eyebrow', 'context_title', 'context_text'],
  campaign: ['hero_eyebrow'],
};

export const TENDERS_REQUIRED_SECTION_LABELS = [
  'hero_eyebrow',
  'hero_panel_title',
  'hero_panel_summary',
  'comparison_intro',
  'comparison_parameter',
  'comparison_option_one',
  'comparison_option_two',
  'comparison_chat_plus',
  'roi_without_title',
  'roi_with_title',
];

export const COMPETITOR_REQUIRED_SECTION_LABELS = [
  'compare_badge',
  'comparison_parameter',
  'comparison_option_one',
  'comparison_option_two',
  'comparison_chat_plus',
];
