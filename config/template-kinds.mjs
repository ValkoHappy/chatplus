export const ACTIVE_CANONICAL_TEMPLATE_KINDS = [
  'home',
  'structured',
  'directory',
  'pricing',
  'partnership',
  'tenders',
  'resource_hub',
  'brand_content',
  'comparison',
  'campaign',
];

export const CANONICAL_TEMPLATE_KINDS = [
  ...ACTIVE_CANONICAL_TEMPLATE_KINDS,
  'generic',
];

export const ACTIVE_PUBLIC_TEMPLATE_KINDS = [
  'home',
  'structured',
  'directory',
  'pricing',
  'partnership',
  'tenders',
  'resource-hub',
  'brand-content',
  'comparison',
  'campaign',
];

export const CANONICAL_TO_PUBLIC_TEMPLATE_KIND = {
  home: 'home',
  structured: 'structured',
  directory: 'directory',
  pricing: 'pricing',
  partnership: 'partnership',
  tenders: 'tenders',
  resource_hub: 'resource-hub',
  brand_content: 'brand-content',
  comparison: 'comparison',
  campaign: 'campaign',
  generic: 'generic',
};

export const PUBLIC_TO_CANONICAL_TEMPLATE_KIND = Object.freeze(
  Object.fromEntries(
    Object.entries(CANONICAL_TO_PUBLIC_TEMPLATE_KIND).map(([canonicalKind, publicKind]) => [publicKind, canonicalKind]),
  ),
);

export function isCanonicalTemplateKind(value) {
  return typeof value === 'string' && CANONICAL_TEMPLATE_KINDS.includes(value);
}

export function isPublicTemplateKind(value) {
  return typeof value === 'string' && (ACTIVE_PUBLIC_TEMPLATE_KINDS.includes(value) || value === 'generic');
}

export function toCanonicalTemplateKind(value = '') {
  if (isCanonicalTemplateKind(value)) {
    return value;
  }

  return PUBLIC_TO_CANONICAL_TEMPLATE_KIND[value] || '';
}

export function toPublicTemplateKind(value = '') {
  if (isPublicTemplateKind(value)) {
    return value;
  }

  return CANONICAL_TO_PUBLIC_TEMPLATE_KIND[value] || '';
}
