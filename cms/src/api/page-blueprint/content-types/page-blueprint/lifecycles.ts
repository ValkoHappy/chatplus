import { errors } from '@strapi/utils';

const { ApplicationError } = errors;

const VALID_BLOCK_TYPES = new Set([
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

function normalizeBlockList(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => `${item || ''}`.trim()).filter(Boolean)
    : [];
}

function validateBlueprint(data: Record<string, unknown>, options: { partial?: boolean } = {}) {
  if (!options.partial && data.blueprint_id === undefined) {
    throw new ApplicationError('page_blueprint requires blueprint_id.');
  }

  if (data.blueprint_id !== undefined) {
    const blueprintId = typeof data.blueprint_id === 'string' ? data.blueprint_id.trim() : '';
    if (!blueprintId) {
      throw new ApplicationError('page_blueprint requires blueprint_id.');
    }
    data.blueprint_id = blueprintId;
  }

  const requiredBlocks = data.required_blocks === undefined ? [] : normalizeBlockList(data.required_blocks);
  const allowedBlocks = data.allowed_blocks === undefined ? [] : normalizeBlockList(data.allowed_blocks);

  if (!options.partial && data.allowed_blocks === undefined) {
    throw new ApplicationError('page_blueprint requires allowed_blocks.');
  }

  if (data.allowed_blocks !== undefined && !allowedBlocks.length) {
    throw new ApplicationError('page_blueprint requires allowed_blocks.');
  }

  const unknownBlocks = [...new Set([...requiredBlocks, ...allowedBlocks])]
    .filter((blockType) => !VALID_BLOCK_TYPES.has(blockType));

  if (unknownBlocks.length) {
    throw new ApplicationError(`Unknown page block types: ${unknownBlocks.join(', ')}.`);
  }

  const missingAllowedBlocks = requiredBlocks.filter((blockType) => !allowedBlocks.includes(blockType));
  if (missingAllowedBlocks.length) {
    throw new ApplicationError(`required_blocks must be included in allowed_blocks: ${missingAllowedBlocks.join(', ')}.`);
  }

  if (data.required_blocks !== undefined) {
    data.required_blocks = requiredBlocks;
  }

  if (data.allowed_blocks !== undefined) {
    data.allowed_blocks = allowedBlocks;
  }
}

export default {
  beforeCreate(event: { params: { data?: Record<string, unknown> } }) {
    validateBlueprint(event.params.data || {});
  },

  beforeUpdate(event: { params: { data?: Record<string, unknown> } }) {
    validateBlueprint(event.params.data || {}, { partial: true });
  },
};
