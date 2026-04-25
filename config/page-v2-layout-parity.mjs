const EMPTY_RULE = Object.freeze({
  family: 'unknown',
  requiredBlocks: [],
  requiredPatterns: [],
  notes: 'No layout parity rule is registered for this family.',
});

export const PAGE_V2_LAYOUT_PARITY_RULES = Object.freeze({
  home: {
    family: 'home',
    requiredBlocks: ['hero', 'cards-grid', 'feature-list', 'steps', 'before-after', 'faq', 'internal-links', 'final-cta'],
    requiredPatterns: ['hero composition', 'mixed section density', 'conversion CTA path', 'internal links'],
  },
  pricing: {
    family: 'pricing',
    requiredBlocks: ['hero', 'pricing-plans', 'proof-stats', 'comparison-table', 'before-after', 'faq', 'final-cta'],
    requiredPatterns: ['hero side panel', 'pricing tiers', 'proof rows/cards', 'comparison table', 'ROI before/after', 'CTA pair'],
  },
  partnership: {
    family: 'partnership',
    requiredBlocks: ['hero', 'cards-grid', 'steps', 'comparison-table', 'before-after', 'faq', 'internal-links', 'final-cta'],
    requiredPatterns: ['ROI before/after', 'offer/comparison logic', 'CTA structure'],
  },
  campaign: {
    family: 'campaign',
    requiredBlocks: ['hero', 'cards-grid', 'steps', 'faq', 'internal-links', 'final-cta'],
    requiredPatterns: ['campaign hero', 'cards/use cases', 'steps', 'FAQ', 'internal links', 'final CTA'],
  },
  brand: {
    family: 'brand',
    requiredBlocks: ['hero', 'cards-grid', 'steps', 'faq', 'internal-links', 'final-cta'],
    requiredPatterns: ['editorial hero', 'story/card sections', 'CTA', 'footer/nav placement'],
  },
  resource: {
    family: 'resource',
    requiredBlocks: ['hero', 'rich-text', 'cards-grid', 'faq', 'internal-links', 'final-cta'],
    requiredPatterns: ['hub intro', 'content cards', 'section grouping', 'discoverability'],
  },
  directory: {
    family: 'directory',
    requiredBlocks: ['hero', 'cards-grid', 'final-cta'],
    requiredPatterns: ['directory intro', 'listing cards', 'sitemap inclusion'],
  },
  comparison_directory: {
    family: 'comparison_directory',
    requiredBlocks: ['hero', 'cards-grid', 'internal-links'],
    requiredPatterns: ['comparison directory hero', 'compare cards', 'vs cards'],
  },
  entity_detail: {
    family: 'entity_detail',
    requiredBlocks: ['hero', 'feature-list', 'faq', 'internal-links', 'final-cta'],
    requiredPatterns: ['entity facts', 'manual composition overlay', 'related links'],
  },
  entity_intersection: {
    family: 'entity_intersection',
    requiredBlocks: ['hero', 'steps', 'internal-links', 'final-cta'],
    requiredPatterns: ['two-entity context', 'workflow steps', 'related links'],
  },
  comparison: {
    family: 'comparison',
    requiredBlocks: ['hero', 'comparison-table', 'faq', 'internal-links', 'final-cta'],
    requiredPatterns: ['comparison hero', 'comparison table', 'FAQ', 'internal links'],
  },
  tenders: {
    family: 'tenders',
    requiredBlocks: ['hero', 'cards-grid', 'steps', 'feature-list', 'comparison-table', 'internal-links', 'final-cta'],
    requiredPatterns: ['hero composition', 'structured conversion path', 'comparison logic', 'internal links'],
  },
  demo: {
    family: 'demo',
    requiredBlocks: ['hero', 'cards-grid', 'steps', 'faq', 'internal-links', 'final-cta'],
    requiredPatterns: ['demo hero', 'conversion path', 'FAQ', 'CTA'],
  },
  system: {
    family: 'system',
    requiredBlocks: ['rich-text'],
    requiredPatterns: ['system renderer compatibility'],
  },
  site_map: {
    family: 'site_map',
    requiredBlocks: ['hero'],
    requiredPatterns: ['site-map hero', 'legacy sitemap renderer'],
  },
  ai_calendar: {
    family: 'ai_calendar',
    requiredBlocks: ['hero', 'steps', 'feature-list', 'cards-grid', 'final-cta'],
    requiredPatterns: ['ai calendar hero', 'automation steps', 'integration list', 'industry cards', 'final cta'],
  },
});

function normalizeBlockType(section = {}) {
  const component = typeof section.__component === 'string' ? section.__component : '';
  const fromComponent = component.split('.').pop() || '';
  const blockType = typeof section.block_type === 'string' ? section.block_type : '';

  return blockType || fromComponent;
}

export function getPageV2LayoutParityRule(family = '') {
  return PAGE_V2_LAYOUT_PARITY_RULES[family] || EMPTY_RULE;
}

export function getPageV2BlockTypesFromSections(sections = []) {
  return sections.map((section) => normalizeBlockType(section)).filter(Boolean);
}

export function buildPageV2LayoutSignature({
  family = '',
  routePath = '',
  sections = [],
  templateVariant = '',
} = {}) {
  const rule = getPageV2LayoutParityRule(family);
  const blockTypes = getPageV2BlockTypesFromSections(sections);

  return {
    family: rule.family,
    route_path: routePath,
    template_variant: templateVariant,
    block_types: blockTypes,
    required_blocks: rule.requiredBlocks,
    required_patterns: rule.requiredPatterns,
  };
}

export function validatePageV2LayoutParity({
  family = '',
  routePath = '',
  sections = [],
  templateVariant = '',
} = {}) {
  const rule = getPageV2LayoutParityRule(family);
  const blockTypes = new Set(getPageV2BlockTypesFromSections(sections));
  const missingBlocks = rule.requiredBlocks.filter((blockType) => !blockTypes.has(blockType));
  const errors = missingBlocks.map((blockType) => (
    `${routePath || family || 'page'} is missing required layout parity block: ${blockType}`
  ));

  return {
    ok: errors.length === 0,
    status: errors.length === 0 ? 'unchecked' : 'needs_work',
    family: rule.family,
    errors,
    missing_blocks: missingBlocks,
    signature: buildPageV2LayoutSignature({ family, routePath, sections, templateVariant }),
  };
}
