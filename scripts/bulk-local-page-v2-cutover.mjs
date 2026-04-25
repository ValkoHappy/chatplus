import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import { validatePageV2LayoutParity } from '../config/page-v2-layout-parity.mjs';
import { syncPublishedDocumentWithService, withLocalStrapi } from './lib/page-v2-document-service.mjs';

export function parseArgs(argv = []) {
  const options = {
    json: false,
    activateAllSafe: false,
    rollbackAll: false,
    unsafeAllowAllRoutes: false,
    routes: [],
    markNotReadyRoutesFile: '',
  };

  for (const arg of argv) {
    if (arg === '--json') {
      options.json = true;
      continue;
    }

    if (arg === '--activate-all-safe') {
      options.activateAllSafe = true;
      continue;
    }

    if (arg === '--rollback-all') {
      options.rollbackAll = true;
      continue;
    }

    if (arg === '--unsafe-allow-all-routes') {
      options.unsafeAllowAllRoutes = true;
      continue;
    }

    if (arg.startsWith('--routes=')) {
      options.routes = arg
        .split('=')[1]
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      continue;
    }

    if (arg.startsWith('--mark-not-ready-routes-file=')) {
      options.markNotReadyRoutesFile = arg.split('=')[1] || '';
    }
  }

  return options;
}

function normalizeParityNotes(notes = {}) {
  return notes && typeof notes === 'object' ? notes : {};
}

function buildApprovedPayload(page, parity) {
  return {
    migration_ready: true,
    parity_status: 'approved',
    legacy_template_family: page.legacy_template_family || 'unknown',
    legacy_layout_signature: parity.signature,
    parity_notes: {
      ...normalizeParityNotes(page.parity_notes),
      errors: [],
      missing_blocks: [],
      approved_at: new Date().toISOString(),
      approved_by: 'page-v2:bulk-local-cutover',
    },
  };
}

function buildRollbackPayload(page) {
  return {
    migration_ready: false,
    parity_status: 'unchecked',
    parity_notes: {
      ...normalizeParityNotes(page.parity_notes),
      marked_not_ready_at: new Date().toISOString(),
      marked_not_ready_by: 'page-v2:bulk-local-cutover',
    },
  };
}

function routeFilter(options = {}) {
  const routes = routeList(options);
  if (!routes.length) {
    return {};
  }

  return {
    route_path: { $in: routes },
  };
}

function normalizeRoutePath(value = '') {
  const routePath = String(value || '').trim();
  if (!routePath || routePath === '/') {
    return '/';
  }

  return `/${routePath.replace(/^\/+|\/+$/g, '')}`;
}

function parseRoutesFromFile(filePath = '') {
  if (!filePath) {
    return [];
  }

  const raw = readFileSync(filePath, 'utf8');
  const jsonStart = raw.indexOf('{');
  const payload = JSON.parse(jsonStart >= 0 ? raw.slice(jsonStart) : raw);
  const rows = Array.isArray(payload.rows) ? payload.rows : [];

  return rows
    .map((row) => normalizeRoutePath(row.routePath))
    .filter(Boolean);
}

function routeList(options = {}) {
  const routes = [
    ...(Array.isArray(options.routes) ? options.routes : []),
    ...parseRoutesFromFile(options.markNotReadyRoutesFile),
  ];

  return [...new Set(routes.map((route) => normalizeRoutePath(route)).filter(Boolean))];
}

async function readStatusSnapshotWithStrapi(strapi, filters = {}) {
  const pageService = strapi.documents('api::page-v2.page-v2');
  const [draftPages, publishedPages] = await Promise.all([
    pageService.findMany({
      status: 'draft',
      filters,
      pagination: { page: 1, pageSize: 5000 },
    }),
    pageService.findMany({
      status: 'published',
      filters,
      pagination: { page: 1, pageSize: 5000 },
    }),
  ]);

  return {
    draft_total: Array.isArray(draftPages) ? draftPages.length : 0,
    published_total: Array.isArray(publishedPages) ? publishedPages.length : 0,
  };
}

export async function readStatusSnapshot(options = {}) {
  const filters = routeFilter(options);
  return withLocalStrapi({ createStrapiFactory: options.createStrapiFactory }, async (strapi) => (
    readStatusSnapshotWithStrapi(strapi, filters)
  ));
}

async function activateAllSafe(pageService, pages) {
  const results = [];

  for (const page of pages) {
    const parity = validatePageV2LayoutParity({
      family: page.legacy_template_family || 'unknown',
      routePath: page.route_path,
      sections: Array.isArray(page.sections) ? page.sections : [],
      templateVariant: page.template_variant,
    });

    if (!parity.ok) {
      results.push({
        route: page.route_path,
        action: 'skipped',
        reason: parity.errors.join('; '),
      });
      continue;
    }

    await pageService.update({
      documentId: page.documentId,
      status: 'draft',
      data: buildApprovedPayload(page, parity),
    });

    await syncPublishedDocumentWithService(pageService, {
      documentId: page.documentId,
      locale: page.locale || 'ru',
    });

    results.push({
      route: page.route_path,
      action: 'published-and-approved',
    });
  }

  return results;
}

async function rollbackAll(pageService, pages) {
  const results = [];

  for (const page of pages) {
    await pageService.update({
      documentId: page.documentId,
      status: 'draft',
      data: buildRollbackPayload(page),
    });

    await pageService.unpublish({
      documentId: page.documentId,
      locale: page.locale || 'ru',
    }).catch(() => null);

    results.push({
      route: page.route_path,
      action: 'rolled-back',
    });
  }

  return results;
}

async function markNotReadyAll(pageService, pages) {
  const results = [];

  for (const page of pages) {
    await pageService.update({
      documentId: page.documentId,
      status: 'draft',
      data: buildRollbackPayload(page),
    });

    await syncPublishedDocumentWithService(pageService, {
      documentId: page.documentId,
      locale: page.locale || 'ru',
    });

    results.push({
      route: page.route_path,
      action: 'marked-not-ready',
    });
  }

  return results;
}

export async function runBulkCutover(options = {}) {
  const scopedRoutes = routeList(options);
  if (options.activateAllSafe && scopedRoutes.length === 0 && options.unsafeAllowAllRoutes !== true) {
    throw new Error('Refusing to activate all routes at once. Pass --routes=/a,/b for scoped approval or add --unsafe-allow-all-routes if you really intend a full cutover.');
  }

  const inSessionResult = await withLocalStrapi({}, async (strapi) => {
    const pageService = strapi.documents('api::page-v2.page-v2');
    const filters = routeFilter(options);
    const draftPages = await pageService.findMany({
      status: 'draft',
      filters,
      pagination: { page: 1, pageSize: 5000 },
      populate: ['sections'],
    });

    const publishedPages = await pageService.findMany({
      status: 'published',
      filters,
      pagination: { page: 1, pageSize: 5000 },
      populate: ['sections'],
    });

    let results = [];
    if (options.activateAllSafe) {
      results = await activateAllSafe(pageService, draftPages || []);
    } else if (options.rollbackAll) {
      const pageMap = new Map();
      for (const page of [...(draftPages || []), ...(publishedPages || [])]) {
        pageMap.set(page.documentId, page);
      }
      results = await rollbackAll(pageService, [...pageMap.values()]);
    } else if (options.markNotReadyRoutesFile) {
      const pageMap = new Map();
      for (const page of [...(draftPages || []), ...(publishedPages || [])]) {
        pageMap.set(page.documentId, page);
      }
      results = await markNotReadyAll(pageService, [...pageMap.values()]);
    }

    return {
      ok: results.every((item) => item.action !== 'skipped'),
      mode: options.activateAllSafe
        ? 'activate-all-safe'
        : options.rollbackAll
          ? 'rollback-all'
          : options.markNotReadyRoutesFile
            ? 'mark-not-ready-routes-file'
            : 'report',
      scoped_routes: scopedRoutes,
      in_session_snapshot: await readStatusSnapshotWithStrapi(strapi, filters),
      results,
    };
  });

  const verifiedSnapshot = await readStatusSnapshot(options);

  return {
    ...inSessionResult,
    draft_total: verifiedSnapshot.draft_total,
    published_total: verifiedSnapshot.published_total,
    verified_snapshot: verifiedSnapshot,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await runBulkCutover(options);

  console.log(JSON.stringify(result, null, 2));

  if (!result.ok) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
