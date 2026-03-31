import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'dist');
const configuredBasePath = (process.env.PUBLIC_BASE_PATH || '').trim();
const basePath = configuredBasePath && configuredBasePath !== '/'
  ? configuredBasePath.replace(/\/$/, '')
  : '';

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }

    if (entry.isFile() && fullPath.endsWith('.html')) {
      files.push(fullPath);
    }
  }

  return files;
}

function fileToRoute(file) {
  const relative = path.relative(root, file).replace(/\\/g, '/');
  if (relative === 'index.html') return '/';
  if (relative.endsWith('/index.html')) return `/${relative.slice(0, -'/index.html'.length)}`;
  return `/${relative.slice(0, -'.html'.length)}`;
}

function normalizeHref(href) {
  if (!href) return null;
  if (/^(https?:|mailto:|tel:|#)/.test(href)) return null;

  const [pathname] = href.split('#')[0].split('?');
  if (!pathname?.startsWith('/')) return null;

  let normalizedPath = pathname;

  if (basePath) {
    if (normalizedPath === basePath || normalizedPath === `${basePath}/`) {
      normalizedPath = '/';
    } else if (normalizedPath.startsWith(`${basePath}/`)) {
      normalizedPath = normalizedPath.slice(basePath.length) || '/';
    }
  }

  if (normalizedPath.length > 1 && normalizedPath.endsWith('/')) {
    return normalizedPath.slice(0, -1);
  }

  return normalizedPath;
}

const files = walk(root);
const pages = new Map();

for (const file of files) {
  pages.set(fileToRoute(file), {
    file,
    incoming: new Set(),
    outgoing: new Set(),
  });
}

for (const file of files) {
  const fromRoute = fileToRoute(file);
  const html = fs.readFileSync(file, 'utf8');
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);

  for (const href of hrefs) {
    const targetRoute = normalizeHref(href);
    if (!targetRoute || !pages.has(targetRoute)) continue;

    pages.get(fromRoute).outgoing.add(targetRoute);
    pages.get(targetRoute).incoming.add(fromRoute);
  }
}

const excludedRoutes = new Set(['/404', '/dev']);
const publicRoutes = [...pages.entries()].filter(([route]) => !excludedRoutes.has(route));
const orphanRoutes = publicRoutes
  .filter(([, info]) => info.incoming.size === 0)
  .map(([route]) => route)
  .sort();

const distribution = { 0: 0, 1: 0, '2-4': 0, '5+': 0 };
for (const [, info] of publicRoutes) {
  const count = info.incoming.size;
  if (count === 0) distribution[0] += 1;
  else if (count === 1) distribution[1] += 1;
  else if (count <= 4) distribution['2-4'] += 1;
  else distribution['5+'] += 1;
}

const corePatterns = {
  'channels/*/*': /^\/channels\/[^/]+\/[^/]+$/,
  'industries/*/*': /^\/industries\/[^/]+\/[^/]+$/,
  'integrations/*/*': /^\/integrations\/[^/]+\/[^/]+$/,
  'for/*/*': /^\/for\/[^/]+\/[^/]+$/,
};

const coreSummary = Object.fromEntries(
  Object.entries(corePatterns).map(([label, pattern]) => {
    const matching = publicRoutes.filter(([route]) => pattern.test(route));
    const orphanCount = matching.filter(([, info]) => info.incoming.size === 0).length;
    return [label, { total: matching.length, orphanCount }];
  })
);

console.log('[link-graph] public pages:', publicRoutes.length);
console.log('[link-graph] incoming distribution:', JSON.stringify(distribution));
console.log('[link-graph] core summary:', JSON.stringify(coreSummary));

if (orphanRoutes.length > 0) {
  console.error('[link-graph] orphan pages detected:', orphanRoutes.length);
  console.error(orphanRoutes.slice(0, 100).join('\n'));
  process.exit(1);
}

console.log('[link-graph] OK: every public page has at least one incoming internal link.');
