export const PAGE_V2_PAGE_KINDS = [
  'landing',
  'directory',
  'entity_detail',
  'entity_intersection',
  'comparison',
  'campaign',
  'resource',
  'brand',
  'system',
];

export const PAGE_V2_TEMPLATE_VARIANTS = [
  'default',
  'editorial',
  'showcase',
  'minimal',
];

export const PAGE_V2_GENERATION_MODES = [
  'manual',
  'ai_assisted',
  'ai_generated',
];

export const PAGE_V2_SOURCE_MODES = [
  'managed',
  'hybrid',
];

export const PAGE_V2_EDITORIAL_STATUSES = [
  'draft',
  'review',
  'approved',
  'archived',
];

export const PAGE_V2_NAV_GROUPS = Object.freeze({
  primary: 'Primary',
  product: 'Product',
  catalogs: 'Catalogs',
  resources: 'Resources',
  company: 'Company',
  special: 'Special',
});

export const PAGE_V2_MIGRATABLE_MANAGED_PATHS = Object.freeze([
  '/',
  '/pricing',
  '/partnership',
  '/docs',
  '/help',
  '/academy',
  '/blog',
  '/status',
  '/media',
  '/team',
  '/conversation',
  '/tv',
  '/promo',
  '/prozorro',
  '/demo',
  '/solutions/tenders',
]);

export const PAGE_V2_IMMUTABLE_RESERVED_EXACT_PATHS = Object.freeze([
  '/admin',
  '/api',
  '/business-types',
  '/channels',
  '/compare',
  '/features',
  '/for',
  '/industries',
  '/integrations',
  '/site-map',
  '/solutions',
  '/vs',
]);

export const PAGE_V2_IMMUTABLE_RESERVED_PREFIXES = Object.freeze([
  '/admin/',
  '/api/',
  '/channels/',
  '/compare/',
  '/features/',
  '/for/',
  '/industries/',
  '/integrations/',
  '/solutions/',
  '/vs/',
]);

export function normalizePageV2RoutePath(value = '') {
  const current = `${value || ''}`.trim();
  if (!current) {
    return '/';
  }

  const withLeadingSlash = current.startsWith('/') ? current : `/${current}`;
  const normalized = withLeadingSlash.replace(/\/{2,}/g, '/').replace(/\/+$/, '');
  return normalized || '/';
}

export function isMigratableManagedPageV2Route(routePath = '') {
  const normalized = normalizePageV2RoutePath(routePath);
  return PAGE_V2_MIGRATABLE_MANAGED_PATHS.includes(normalized);
}

export function isImmutableReservedPageV2Route(routePath = '') {
  const normalized = normalizePageV2RoutePath(routePath);

  if (PAGE_V2_IMMUTABLE_RESERVED_EXACT_PATHS.includes(normalized)) {
    return true;
  }

  return PAGE_V2_IMMUTABLE_RESERVED_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

export function isReservedPageV2Route(routePath = '') {
  return isImmutableReservedPageV2Route(routePath) || isMigratableManagedPageV2Route(routePath);
}

export function canPageV2UseRoute(routePath = '') {
  return !isImmutableReservedPageV2Route(routePath);
}

export function shouldGeneratePageV2CatchAllRoute(routePath = '') {
  const normalized = normalizePageV2RoutePath(routePath);
  return normalized !== '/' && !isMigratableManagedPageV2Route(normalized);
}

export function toPageV2CatchAllParam(routePath = '') {
  const normalized = normalizePageV2RoutePath(routePath);

  if (normalized === '/') {
    return undefined;
  }

  return normalized.replace(/^\//, '');
}
