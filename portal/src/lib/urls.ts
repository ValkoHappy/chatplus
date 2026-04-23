const ABSOLUTE_OR_SPECIAL_URL_RE = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;
const FILE_LIKE_PATH_RE = /\/[^/?#]+\.[^/?#]+\/?$/i;

function getDefaultBase() {
  return import.meta.env?.BASE_URL || '/';
}

function splitPathSuffix(value = '') {
  const match = value.match(/^([^?#]*)(.*)$/);
  return {
    pathname: match?.[1] || '',
    suffix: match?.[2] || '',
  };
}

function normalizeBase(base = import.meta.env.BASE_URL || '/') {
  if (!base || base === '/') {
    return '';
  }

  return base.endsWith('/') ? base.slice(0, -1) : base;
}

export function normalizeInternalPath(value = '/') {
  const { pathname, suffix } = splitPathSuffix(value || '/');
  const normalizedPathname = (`/${(pathname || '/').replace(/^\/+/, '')}`)
    .replace(/\/{2,}/g, '/')
    .replace(/\/+$/g, '') || '/';

  return `${normalizedPathname}${suffix}`;
}

export function shouldRedirectTrailingSlash(pathname = '/') {
  if (!pathname || pathname === '/' || !pathname.endsWith('/')) {
    return false;
  }

  return !FILE_LIKE_PATH_RE.test(pathname);
}

export function withBasePath(href?: string, base = getDefaultBase()) {
  if (!href) {
    return href || '';
  }

  if (ABSOLUTE_OR_SPECIAL_URL_RE.test(href)) {
    return href;
  }

  const cleanBase = normalizeBase(base);
  if (href === '/') {
    return cleanBase || '/';
  }

  const normalizedHref = normalizeInternalPath(href.startsWith('/') ? href : `/${href}`);
  return `${cleanBase}${normalizedHref}`;
}

export function stripBasePath(pathname: string, base = getDefaultBase()) {
  const cleanBase = normalizeBase(base);

  if (!cleanBase) {
    return normalizeInternalPath(pathname || '/');
  }

  if (pathname === cleanBase) {
    return '/';
  }

  if (pathname.startsWith(`${cleanBase}/`)) {
    const normalizedPath = pathname.slice(cleanBase.length) || '/';
    return normalizeInternalPath(normalizedPath);
  }

  return normalizeInternalPath(pathname || '/');
}
