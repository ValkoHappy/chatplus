export const PAGE_V2_BLOCK_TYPES = Object.freeze([
  'hero',
  'rich-text',
  'proof-stats',
  'cards-grid',
  'feature-list',
  'steps',
  'faq',
  'testimonial',
  'related-links',
  'final-cta',
  'pricing-plans',
  'comparison-table',
  'before-after',
  'internal-links',
]);

export const PAGE_V2_BLUEPRINTS = Object.freeze({
  landing: {
    id: 'landing',
    pageKind: 'landing',
    templateVariant: 'default',
    requiredBlocks: ['hero', 'final-cta'],
    allowedBlocks: ['hero', 'proof-stats', 'cards-grid', 'feature-list', 'steps', 'before-after', 'faq', 'internal-links', 'final-cta', 'rich-text', 'testimonial', 'related-links'],
  },
  directory: {
    id: 'directory',
    pageKind: 'directory',
    templateVariant: 'editorial',
    requiredBlocks: ['hero', 'cards-grid'],
    allowedBlocks: ['hero', 'rich-text', 'cards-grid', 'related-links', 'final-cta'],
  },
  entity_detail: {
    id: 'entity_detail',
    pageKind: 'entity_detail',
    templateVariant: 'default',
    requiredBlocks: ['hero', 'feature-list', 'faq', 'final-cta'],
    allowedBlocks: ['hero', 'rich-text', 'proof-stats', 'feature-list', 'steps', 'faq', 'testimonial', 'related-links', 'internal-links', 'final-cta'],
  },
  entity_intersection: {
    id: 'entity_intersection',
    pageKind: 'entity_intersection',
    templateVariant: 'showcase',
    requiredBlocks: ['hero', 'steps', 'final-cta'],
    allowedBlocks: ['hero', 'rich-text', 'proof-stats', 'cards-grid', 'steps', 'faq', 'related-links', 'internal-links', 'final-cta'],
  },
  comparison: {
    id: 'comparison',
    pageKind: 'comparison',
    templateVariant: 'editorial',
    requiredBlocks: ['hero', 'comparison-table', 'faq', 'final-cta'],
    allowedBlocks: ['hero', 'cards-grid', 'steps', 'comparison-table', 'faq', 'internal-links', 'final-cta', 'testimonial', 'related-links', 'rich-text'],
  },
  campaign: {
    id: 'campaign',
    pageKind: 'campaign',
    templateVariant: 'showcase',
    requiredBlocks: ['hero', 'cards-grid', 'final-cta'],
    allowedBlocks: ['hero', 'proof-stats', 'cards-grid', 'steps', 'faq', 'related-links', 'final-cta', 'rich-text', 'testimonial'],
  },
  resource: {
    id: 'resource',
    pageKind: 'resource',
    templateVariant: 'editorial',
    requiredBlocks: ['hero', 'rich-text'],
    allowedBlocks: ['hero', 'rich-text', 'cards-grid', 'faq', 'internal-links', 'final-cta', 'related-links'],
  },
  brand: {
    id: 'brand',
    pageKind: 'brand',
    templateVariant: 'showcase',
    requiredBlocks: ['hero', 'final-cta'],
    allowedBlocks: ['hero', 'cards-grid', 'steps', 'faq', 'internal-links', 'final-cta', 'testimonial', 'rich-text', 'related-links'],
  },
  system: {
    id: 'system',
    pageKind: 'system',
    templateVariant: 'minimal',
    requiredBlocks: ['rich-text'],
    allowedBlocks: ['hero', 'rich-text', 'related-links'],
  },
});

export function getPageV2Blueprint(id = '') {
  return PAGE_V2_BLUEPRINTS[id] || null;
}

export function validatePageV2BlueprintSections(blueprintId, sections = []) {
  const blueprint = getPageV2Blueprint(blueprintId);
  if (!blueprint) {
    return {
      ok: false,
      errors: [`Unknown page_v2 blueprint: ${blueprintId}`],
      blueprint: null,
    };
  }

  const types = sections
    .map((section) => `${section?.block_type || ''}`.trim())
    .filter(Boolean);

  const missingRequired = blueprint.requiredBlocks.filter((blockType) => !types.includes(blockType));
  const disallowedBlocks = [...new Set(types.filter((blockType) => !blueprint.allowedBlocks.includes(blockType)))];
  const errors = [
    ...missingRequired.map((blockType) => `Missing required block: ${blockType}`),
    ...disallowedBlocks.map((blockType) => `Block is not allowed for blueprint ${blueprintId}: ${blockType}`),
  ];

  return {
    ok: errors.length === 0,
    errors,
    blueprint,
  };
}
