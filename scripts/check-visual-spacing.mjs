#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_ROUTES = Object.freeze([
  '/',
  '/pricing',
  '/partnership',
  '/promo',
  '/docs',
  '/media',
  '/team',
  '/conversation',
  '/tv',
  '/compare',
  '/compare/respond-io',
  '/solutions/tenders',
  '/channels',
  '/channels/email/amocrm',
]);

const SOURCE_CHECKS = Object.freeze([
  {
    file: 'portal/src/components/InternalLinksSection.astro',
    label: 'internal links spacing is global',
    pattern: /:global\(\.link-section\)[\s\S]*clamp\(4\.6rem, 8vw, 6\.5rem\)/,
  },
  {
    file: 'portal/src/components/PartnershipPage.astro',
    label: 'partner icon spacing',
    pattern: /\.partner-card \.partner-icon \{ margin-bottom:\.85rem; \}/,
  },
  {
    file: 'portal/src/components/BrandContentPage.astro',
    label: 'brand step badge spacing',
    pattern: /\.editorial-step \{ margin-bottom:\.75rem; \}/,
  },
  {
    file: 'portal/src/components/HomePage.astro',
    label: 'home proof placeholders are filtered',
    pattern: /placeholderProofLabels[\s\S]*proof point[\s\S]*home page proof[\s\S]*filter\(\(item\) => !placeholderProofLabels\.has/,
  },
]);

const BANNED_RENDERED_PATTERNS = Object.freeze([
  { label: 'Proof point placeholder', pattern: /Proof point/i },
  { label: 'Home proof placeholder', pattern: /Home page proof/i },
  { label: 'Migration-only proof intro', pattern: /migration parity check/i },
  { label: 'Generic page_v2 shell on legacy route', pattern: /pagev2-shell/i },
  { label: 'Technical FAQ question', pattern: /Can this page be edited in Strapi/i },
  { label: 'Technical FAQ answer', pattern: /page record owns route, SEO, sections and links/i },
  { label: 'Technical continue eyebrow', pattern: />\s*Continue\s*</i },
  { label: 'Technical mobile nav title', pattern: />\s*Primary\s*</i },
  { label: 'Technical comparison eyebrow', pattern: />\s*Comparison\s*</i },
  { label: 'Technical request demo CTA', pattern: />\s*Request demo\s*</i },
  { label: 'Technical request comparison CTA', pattern: />\s*Request comparison\s*</i },
  { label: 'Technical comparison title', pattern: />\s*Compare alternatives\s*</i },
  { label: 'Technical comparison formats title', pattern: /Compare formats/i },
  { label: 'Technical comparison workflow column', pattern: /EDITORIAL WORKFLOW/i },
  { label: 'Technical comparison workflow value', pattern: /Manual review in Strapi/i },
  { label: 'Technical comparison operating-layer fallback', pattern: /Chat Plus keeps channels, AI and CRM in one operating layer/i },
  { label: 'Technical comparison workflow fallback', pattern: /Chat Plus keeps the workflow in one operating layer/i },
  { label: 'Technical comparison CTA', pattern: /Compare the alternative with Chat Plus before publishing/i },
]);

function normalizeRoute(value = '') {
  const route = String(value || '').trim();
  if (!route || route === '/') return '/';
  return `/${route.replace(/^\/+|\/+$/g, '')}`;
}

export function parseArgs(argv = []) {
  const options = {
    routes: [...DEFAULT_ROUTES],
    distRoot: path.resolve(process.cwd(), 'portal', 'dist'),
    json: false,
  };

  for (const arg of argv) {
    if (arg === '--json') {
      options.json = true;
    } else if (arg.startsWith('--routes=')) {
      const routes = arg
        .slice('--routes='.length)
        .split(',')
        .map((item) => normalizeRoute(item))
        .filter(Boolean);
      if (routes.length) options.routes = routes;
    } else if (arg.startsWith('--dist=')) {
      options.distRoot = path.resolve(process.cwd(), arg.slice('--dist='.length));
    }
  }

  return options;
}

export function routeToDistFile(routePath, distRoot) {
  if (routePath === '/') return path.join(distRoot, 'index.html');
  return path.join(distRoot, routePath.replace(/^\/+/, ''), 'index.html');
}

function checkSources() {
  const results = [];

  for (const check of SOURCE_CHECKS) {
    const fullPath = path.resolve(process.cwd(), check.file);
    const content = existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
    results.push({
      type: 'source',
      file: check.file,
      label: check.label,
      ok: check.pattern.test(content),
    });
  }

  const faqConsumers = [
    'portal/src/components/CampaignPage.astro',
    'portal/src/components/BrandContentPage.astro',
    'portal/src/components/ResourceHubPage.astro',
    'portal/src/components/ComparisonPage.astro',
    'portal/src/components/StructuredLandingPage.astro',
    'portal/src/components/page-v2/FaqBlock.astro',
  ];

  for (const file of faqConsumers) {
    const fullPath = path.resolve(process.cwd(), file);
    const content = existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
    results.push({
      type: 'source',
      file,
      label: 'FAQ should not force container-narrow',
      ok: !/<FaqSection\b[^>]*containerClass="container container-narrow"|containerClass="container container-narrow"/.test(content),
    });
  }

  return results;
}

function checkRenderedRoutes(options) {
  const results = [];

  for (const route of options.routes) {
    const filePath = routeToDistFile(route, options.distRoot);
    if (!existsSync(filePath)) {
      results.push({
        type: 'rendered',
        route,
        filePath,
        ok: false,
        reason: 'missing built html',
      });
      continue;
    }

    const html = readFileSync(filePath, 'utf8');
    const problems = BANNED_RENDERED_PATTERNS
      .filter((check) => check.pattern.test(html))
      .map((check) => check.label);

    results.push({
      type: 'rendered',
      route,
      filePath,
      ok: problems.length === 0,
      problems,
    });
  }

  return results;
}

export function runVisualSpacingCheck(options = {}) {
  const resolvedOptions = {
    ...parseArgs([]),
    ...options,
  };
  const results = [
    ...checkSources(),
    ...checkRenderedRoutes(resolvedOptions),
  ];

  return {
    ok: results.every((item) => item.ok),
    results,
  };
}

function printHuman(result) {
  for (const item of result.results) {
    if (item.ok) continue;
    const where = item.route || item.file || 'unknown';
    const reason = item.reason || item.problems?.join(', ') || item.label;
    console.log(`FAIL ${where}: ${reason}`);
  }
  if (result.ok) {
    console.log('[visual-spacing] OK');
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = runVisualSpacingCheck(options);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printHuman(result);
  }

  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
