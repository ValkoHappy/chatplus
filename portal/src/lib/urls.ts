const ABSOLUTE_OR_SPECIAL_URL_RE = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;

function normalizeBase(base = import.meta.env.BASE_URL || '/') {
  if (!base || base === '/') {
    return '';
  }

  return base.endsWith('/') ? base.slice(0, -1) : base;
}

export function withBasePath(href?: string, base = import.meta.env.BASE_URL || '/') {
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

  const normalizedHref = href.startsWith('/') ? href : `/${href}`;
  return `${cleanBase}${normalizedHref}`;
}

export function stripBasePath(pathname: string, base = import.meta.env.BASE_URL || '/') {
  const cleanBase = normalizeBase(base);

  if (!cleanBase) {
    return pathname || '/';
  }

  if (pathname === cleanBase) {
    return '/';
  }

  if (pathname.startsWith(`${cleanBase}/`)) {
    const normalizedPath = pathname.slice(cleanBase.length);
    return normalizedPath || '/';
  }

  return pathname || '/';
}
