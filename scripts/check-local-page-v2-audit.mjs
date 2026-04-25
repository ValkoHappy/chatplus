import { pathToFileURL } from 'node:url';

import { withLocalStrapi } from './lib/page-v2-document-service.mjs';

const DEFAULT_SAMPLE_ROUTES = Object.freeze([
  '/',
  '/promo',
  '/pricing',
  '/compare',
  '/channels/email/amocrm',
  '/site-map',
]);

export function parseArgs(argv = []) {
  const options = {
    json: false,
    routes: [...DEFAULT_SAMPLE_ROUTES],
  };

  for (const arg of argv) {
    if (arg === '--json') {
      options.json = true;
      continue;
    }

    if (arg.startsWith('--routes=')) {
      const value = arg.split('=')[1] || '';
      const routes = value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      if (routes.length > 0) {
        options.routes = routes;
      }
    }
  }

  return options;
}

export function summarizePages(pages = []) {
  const summary = {
    total: pages.length,
    approved_ready: 0,
    approved_not_ready: 0,
    needs_work: 0,
    unchecked: 0,
  };

  for (const page of pages) {
    if (page?.editorial_status === 'approved' && page?.migration_ready === true && page?.parity_status === 'approved') {
      summary.approved_ready += 1;
    } else if (page?.editorial_status === 'approved') {
      summary.approved_not_ready += 1;
    }

    if (page?.parity_status === 'needs_work') {
      summary.needs_work += 1;
    }

    if (page?.parity_status === 'unchecked') {
      summary.unchecked += 1;
    }
  }

  return summary;
}

export function summarizeRepresentativeRoutes(routeRows = []) {
  return routeRows.map((row) => ({
    route: row.route,
    draft: row.draft
      ? {
          editorial_status: row.draft.editorial_status,
          migration_ready: row.draft.migration_ready,
          parity_status: row.draft.parity_status,
        }
      : null,
    published: row.published
      ? {
          editorial_status: row.published.editorial_status,
          migration_ready: row.published.migration_ready,
          parity_status: row.published.parity_status,
        }
      : null,
  }));
}

async function findByRoute(pageService, routePath, status) {
  return (await pageService.findMany({
    status,
    filters: { route_path: { $eq: routePath } },
    pagination: { page: 1, pageSize: 1 },
  }))?.[0] || null;
}

export async function runAudit(options = {}) {
  const routes = Array.isArray(options.routes) && options.routes.length > 0 ? options.routes : [...DEFAULT_SAMPLE_ROUTES];

  return withLocalStrapi({}, async (strapi) => {
    const pageService = strapi.documents('api::page-v2.page-v2');
    const [draftPages, publishedPages] = await Promise.all([
      pageService.findMany({
        status: 'draft',
        pagination: { page: 1, pageSize: 5000 },
      }),
      pageService.findMany({
        status: 'published',
        pagination: { page: 1, pageSize: 5000 },
      }),
    ]);

    const representativeRoutes = [];
    for (const route of routes) {
      const [draft, published] = await Promise.all([
        findByRoute(pageService, route, 'draft'),
        findByRoute(pageService, route, 'published'),
      ]);
      representativeRoutes.push({ route, draft, published });
    }

    return {
      draft: summarizePages(draftPages || []),
      published: summarizePages(publishedPages || []),
      representativeRoutes: summarizeRepresentativeRoutes(representativeRoutes),
    };
  });
}

function printAudit(result) {
  console.log('Local page_v2 migration audit:');
  console.log(JSON.stringify(result, null, 2));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await runAudit(options);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  printAudit(result);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
