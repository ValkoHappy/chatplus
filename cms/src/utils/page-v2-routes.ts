const MIGRATABLE_MANAGED_PATHS = new Set([
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

const IMMUTABLE_RESERVED_EXACT_PATHS = new Set([
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

const IMMUTABLE_RESERVED_PREFIXES = [
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
];

export function normalizePageV2RoutePath(routePath: string) {
  const current = `${routePath || ''}`.trim();
  if (!current) {
    return '/';
  }

  const withLeadingSlash = current.startsWith('/') ? current : `/${current}`;
  const normalized = withLeadingSlash.replace(/\/{2,}/g, '/').replace(/\/+$/, '');
  return normalized || '/';
}

export function isMigratableManagedPageV2Route(routePath: string) {
  const normalized = normalizePageV2RoutePath(routePath);
  return MIGRATABLE_MANAGED_PATHS.has(normalized);
}

export function isImmutableReservedPageV2Route(routePath: string) {
  const normalized = normalizePageV2RoutePath(routePath);

  if (IMMUTABLE_RESERVED_EXACT_PATHS.has(normalized)) {
    return true;
  }

  return IMMUTABLE_RESERVED_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

export function isReservedPageV2Route(routePath: string) {
  return isImmutableReservedPageV2Route(routePath) || isMigratableManagedPageV2Route(routePath);
}

export function canPageV2UseRoute(routePath: string) {
  return !isImmutableReservedPageV2Route(routePath);
}
