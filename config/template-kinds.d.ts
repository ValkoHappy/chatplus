export declare const ACTIVE_CANONICAL_TEMPLATE_KINDS: readonly [
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

export declare const CANONICAL_TEMPLATE_KINDS: readonly [
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
  'generic',
];

export declare const ACTIVE_PUBLIC_TEMPLATE_KINDS: readonly [
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

export type ActiveCanonicalTemplateKind = typeof ACTIVE_CANONICAL_TEMPLATE_KINDS[number];
export type CanonicalTemplateKind = typeof CANONICAL_TEMPLATE_KINDS[number];
export type ActivePublicTemplateKind = typeof ACTIVE_PUBLIC_TEMPLATE_KINDS[number];
export type PublicTemplateKind = ActivePublicTemplateKind | 'generic';

export declare const CANONICAL_TO_PUBLIC_TEMPLATE_KIND: Record<CanonicalTemplateKind, PublicTemplateKind>;
export declare const PUBLIC_TO_CANONICAL_TEMPLATE_KIND: Record<PublicTemplateKind, CanonicalTemplateKind>;

export declare function isCanonicalTemplateKind(value: unknown): value is CanonicalTemplateKind;
export declare function isPublicTemplateKind(value: unknown): value is PublicTemplateKind;
export declare function toCanonicalTemplateKind(value?: string): CanonicalTemplateKind | '';
export declare function toPublicTemplateKind(value?: string): PublicTemplateKind | '';
