import { getPageV2Blueprint } from './page-v2-blueprints.mjs';

export const AI_BLOCK_LIBRARY = Object.freeze({
  hero: {
    goal: 'Open the page, explain the offer, and provide primary/secondary CTAs.',
    bestFor: ['headline', 'offer', 'positioning', 'cta', 'trust facts'],
    avoid: ['long body text', 'full FAQ', 'dense comparison data'],
  },
  'rich-text': {
    goal: 'Explain context, background, or editorial guidance in prose.',
    bestFor: ['guide', 'article', 'documentation', 'explanation'],
    avoid: ['card lists', 'pricing plans', 'comparison rows'],
  },
  'proof-stats': {
    goal: 'Show compact proof points, metrics, or factual reassurance.',
    bestFor: ['metrics', 'proof', 'stats', 'confidence', 'numbers'],
    avoid: ['duplicating hero trust facts', 'invented metrics'],
  },
  'cards-grid': {
    goal: 'Group multiple related ideas as cards.',
    bestFor: ['benefits', 'problems', 'use cases', 'resources', 'pillars'],
    avoid: ['step-by-step processes', 'pricing plans'],
  },
  'feature-list': {
    goal: 'Describe product capabilities or feature groups.',
    bestFor: ['features', 'capabilities', 'functions', 'modules'],
    avoid: ['competitor comparisons', 'long prose'],
  },
  steps: {
    goal: 'Explain a sequence, implementation flow, or workflow.',
    bestFor: ['process', 'workflow', 'steps', 'setup', 'how it works'],
    avoid: ['unordered benefits', 'FAQ'],
  },
  faq: {
    goal: 'Answer practical objections and recurring questions.',
    bestFor: ['questions', 'objections', 'risks', 'pricing doubts'],
    avoid: ['marketing claims without direct answers'],
  },
  testimonial: {
    goal: 'Add a quote or editorial proof note.',
    bestFor: ['quote', 'customer voice', 'editorial note'],
    avoid: ['invented customer names or unsupported claims'],
  },
  'related-links': {
    goal: 'Link to related public pages.',
    bestFor: ['navigation', 'discoverability', 'related pages'],
    avoid: ['self-links', 'duplicate links'],
  },
  'final-cta': {
    goal: 'Close the page with the next action.',
    bestFor: ['conversion', 'demo', 'trial', 'contact'],
    avoid: ['new unrelated topics'],
  },
  'pricing-plans': {
    goal: 'Show plans, price tiers, packages, or commercial options.',
    bestFor: ['pricing', 'plans', 'tariffs', 'packages'],
    avoid: ['non-commercial pages without prices'],
  },
  'comparison-table': {
    goal: 'Compare alternatives across rows and columns.',
    bestFor: ['comparison', 'versus', 'competitor', 'alternatives'],
    avoid: ['simple benefit lists'],
  },
  'before-after': {
    goal: 'Show the before/after or ROI change.',
    bestFor: ['roi', 'before after', 'cost', 'efficiency', 'losses'],
    avoid: ['generic benefits without contrast'],
  },
  'internal-links': {
    goal: 'Create page-owned internal linking blocks.',
    bestFor: ['next pages', 'site structure', 'SEO linking'],
    avoid: ['external link dumps', 'self-links'],
  },
});

export const AI_BLUEPRINT_BLOCK_PLANS = Object.freeze({
  campaign: {
    defaultBlocks: ['hero', 'cards-grid', 'steps', 'faq', 'related-links', 'final-cta'],
    optionalBlocks: ['proof-stats', 'rich-text', 'testimonial'],
  },
  brand: {
    defaultBlocks: ['hero', 'cards-grid', 'steps', 'faq', 'internal-links', 'final-cta'],
    optionalBlocks: ['testimonial', 'rich-text', 'related-links'],
  },
  resource: {
    defaultBlocks: ['hero', 'rich-text', 'cards-grid', 'faq', 'internal-links', 'final-cta'],
    optionalBlocks: ['related-links'],
  },
});

const INTENT_KEYWORDS = Object.freeze({
  'proof-stats': ['metric', 'metrics', 'stat', 'stats', 'proof', 'number', 'numbers', 'цифр', 'метрик', 'статистик'],
  'cards-grid': ['benefit', 'benefits', 'problem', 'problems', 'use case', 'use cases', 'выгод', 'проблем', 'кейсы', 'сценар'],
  'feature-list': ['feature', 'features', 'capability', 'capabilities', 'функц', 'возможност'],
  steps: ['step', 'steps', 'workflow', 'process', 'setup', 'how it works', 'шаг', 'процесс', 'воркфлоу', 'настрой'],
  faq: ['faq', 'question', 'questions', 'objection', 'objections', 'вопрос', 'возражен'],
  testimonial: ['quote', 'testimonial', 'review', 'отзыв', 'цитат'],
  'pricing-plans': ['price', 'pricing', 'tariff', 'plan', 'plans', 'цена', 'тариф', 'стоимост'],
  'comparison-table': ['compare', 'comparison', 'versus', 'vs', 'alternative', 'competitor', 'сравн', 'конкурент', 'альтернатив'],
  'before-after': ['roi', 'before', 'after', 'cost', 'saving', 'до и после', 'окуп', 'эконом', 'расход'],
  'internal-links': ['internal links', 'related pages', 'перелинк', 'внутренн', 'ссылк'],
});

function normalizeBlockType(value = '') {
  return `${value || ''}`.trim();
}

function uniqueInOrder(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const normalized = normalizeBlockType(item);
    if (!normalized || seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
}

function extractRequestedBlocks(job = {}) {
  const raw = job.target_blocks || job.requested_blocks || job.block_plan;
  if (Array.isArray(raw)) {
    return raw.map((item) => normalizeBlockType(typeof item === 'string' ? item : item?.block_type || item?.type));
  }
  if (typeof raw === 'string') {
    return raw.split(',').map((item) => normalizeBlockType(item));
  }
  return [];
}

function detectIntentBlocks(prompt = '') {
  const normalizedPrompt = `${prompt || ''}`.toLowerCase();
  return Object.entries(INTENT_KEYWORDS)
    .filter(([, keywords]) => keywords.some((keyword) => normalizedPrompt.includes(keyword)))
    .map(([blockType]) => blockType);
}

export function getAiBlockPlan(job = {}) {
  const blueprintId = normalizeBlockType(job.target_blueprint || job.blueprint || 'campaign');
  const blueprint = getPageV2Blueprint(blueprintId);
  if (!blueprint) {
    throw new Error(`Unknown page_v2 blueprint for AI block planning: ${blueprintId}`);
  }

  const configuredPlan = AI_BLUEPRINT_BLOCK_PLANS[blueprintId] || {};
  const allowed = new Set(blueprint.allowedBlocks || []);
  const required = blueprint.requiredBlocks || [];
  const strategy = normalizeBlockType(job.block_strategy || 'auto') || 'auto';
  const requested = extractRequestedBlocks(job);
  const intentBlocks = strategy === 'blueprint_default'
    ? []
    : detectIntentBlocks(`${job.title || ''}\n${job.request_prompt || ''}`);
  const preferredBase = strategy === 'custom' && requested.length
    ? requested
    : configuredPlan.defaultBlocks || required;
  const preferredBlocks = uniqueInOrder([
    ...required,
    ...preferredBase,
    ...requested,
    ...intentBlocks,
  ]).filter((blockType) => allowed.has(blockType));
  const rejectedBlocks = uniqueInOrder([...requested, ...intentBlocks]).filter((blockType) => blockType && !allowed.has(blockType));

  return {
    blueprint: blueprintId,
    strategy,
    requiredBlocks: [...required],
    allowedBlocks: [...allowed],
    preferredBlocks,
    optionalBlocks: (configuredPlan.optionalBlocks || []).filter((blockType) => allowed.has(blockType)),
    rejectedBlocks,
    blockContracts: [...allowed].map((blockType) => ({
      block_type: blockType,
      ...(AI_BLOCK_LIBRARY[blockType] || {
        goal: 'Use this block only when the blueprint requires it.',
        bestFor: [],
        avoid: [],
      }),
    })),
  };
}

export function formatAiBlockPlanForPrompt(plan) {
  return [
    `Block strategy: ${plan.strategy}`,
    `Required blocks: ${plan.requiredBlocks.join(', ') || 'none'}`,
    `Recommended blocks for this request: ${plan.preferredBlocks.join(', ') || 'none'}`,
    `Optional blocks: ${plan.optionalBlocks.join(', ') || 'none'}`,
    `Allowed blocks: ${plan.allowedBlocks.join(', ')}`,
    'Block contracts:',
    ...plan.blockContracts.map((contract) => [
      `- ${contract.block_type}: ${contract.goal}`,
      `  best_for: ${(contract.bestFor || []).join(', ') || '-'}`,
      `  avoid: ${(contract.avoid || []).join(', ') || '-'}`,
    ].join('\n')),
    'Rules:',
    '- The model may choose fewer optional blocks, but every required block must be present.',
    '- Do not duplicate the same information in multiple blocks.',
    '- Use the block whose goal best matches the information.',
    '- If the prompt asks for pricing/comparison/ROI but the blueprint disallows that block, skip it and keep the draft within the allowed blueprint.',
  ].join('\n');
}
