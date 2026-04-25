import {
  LEGACY_MANAGED_WAVES,
  buildLegacyManagedPageDraft,
  buildManagedPageDraftFromExistingPage,
  getLegacyManagedRouteConfig,
  listLegacyManagedRoutesByWave,
} from './page-v2-generation/legacy-managed-migration.mjs';
import { isLocalStrapiUrl, unpublishPageDocumentLocal, withLocalStrapi } from './lib/page-v2-document-service.mjs';

const STRAPI_URL = process.env.STRAPI_URL || '';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

function parseArgs(argv = []) {
  const options = {
    apply: false,
    publish: false,
    unpublish: false,
    report: false,
    route: '',
    wave: '',
  };

  for (const arg of argv) {
    if (arg === '--apply') options.apply = true;
    else if (arg === '--publish') options.publish = true;
    else if (arg === '--unpublish') options.unpublish = true;
    else if (arg === '--report') options.report = true;
    else if (arg.startsWith('--route=')) options.route = arg.split('=')[1] || '';
    else if (arg.startsWith('--wave=')) options.wave = arg.split('=')[1] || '';
  }

  return options;
}

function requireEnv() {
  if (!STRAPI_URL || !STRAPI_TOKEN) {
    throw new Error('STRAPI_URL and STRAPI_TOKEN are required to migrate managed routes to page_v2.');
  }
}

async function request(path, init = {}) {
  const response = await fetch(`${STRAPI_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STRAPI_TOKEN}`,
      ...(init.headers || {}),
    },
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${init.method || 'GET'} ${path} failed: ${response.status} ${JSON.stringify(json)}`);
  }

  return json;
}

async function fetchLegacyRecord(config) {
  const { endpoint, slug } = config.legacySource;

  if (endpoint === 'landing-pages') {
    const result = await request(`/api/landing-pages?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=*`);
    return result?.data?.[0]?.attributes || null;
  }

  if (endpoint === 'tenders-page') {
    const result = await request('/api/tenders-page?populate=*');
    return result?.data?.attributes || null;
  }

  throw new Error(`Unsupported legacy source endpoint: ${endpoint}`);
}

async function fetchPageV2ByRoute(routePath) {
  const result = await request(`/api/page-v2s?filters[route_path][$eq]=${encodeURIComponent(routePath)}&populate=*`);
  return result?.data?.[0] || null;
}

function unwrapRecord(record) {
  if (!record || typeof record !== 'object') {
    return {};
  }

  return {
    id: record.id,
    documentId: record.documentId,
    ...(record.attributes && typeof record.attributes === 'object' ? record.attributes : record),
  };
}

async function fetchBlueprintById(blueprintId) {
  const result = await request(`/api/page-blueprints?filters[blueprint_id][$eq]=${encodeURIComponent(blueprintId)}`);
  const record = result?.data?.[0] || null;
  return record ? record.documentId || record.id : null;
}

async function upsertPageV2(routePath, payload, options = {}) {
  const now = new Date().toISOString();
  const existing = await fetchPageV2ByRoute(routePath);
  const blueprintId = payload.blueprint_id || payload.blueprint;
  const blueprint = blueprintId ? await fetchBlueprintById(blueprintId) : null;
  const data = {
    ...payload,
    ...(blueprint ? { blueprint } : {}),
    ...(options.publish ? { publishedAt: now } : {}),
  };
  delete data.blueprint_id;

  if (!existing) {
    const created = await request('/api/page-v2s', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });

    return {
      action: 'created',
      routePath,
      documentId: created?.data?.documentId || created?.data?.id || null,
    };
  }

  const key = existing.documentId || existing.id;
  await request(`/api/page-v2s/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ data }),
  });

  return {
    action: 'updated',
    routePath,
    documentId: key,
  };
}

async function unpublishPageV2(routePath, localService = null) {
  const existing = localService
    ? (await localService.findMany({
        filters: { route_path: { $eq: routePath } },
        status: 'published',
      }))?.[0] || null
    : await fetchPageV2ByRoute(routePath);
  if (!existing) {
    return {
      action: 'noop-unpublish',
      routePath,
      reason: 'page_v2 record not found',
    };
  }

  if (!isLocalStrapiUrl(STRAPI_URL)) {
    throw new Error(
      `True unpublish for ${routePath} requires a local Strapi workspace. Current STRAPI_URL is not local: ${STRAPI_URL}`,
    );
  }

  const documentId = existing.documentId || existing.id;
  if (localService) {
    await localService.unpublish({ documentId });
  } else {
    const locale = typeof existing.locale === 'string' && existing.locale.trim() ? existing.locale : 'ru';
    await unpublishPageDocumentLocal({ documentId, locale });
  }

  return {
    action: 'unpublished',
    routePath,
    documentId,
  };
}

function resolveRoutes(options) {
  if (options.route) {
    return [options.route];
  }

  if (options.wave) {
    if (!LEGACY_MANAGED_WAVES[options.wave]) {
      throw new Error(`Unknown migration wave: ${options.wave}`);
    }

    return listLegacyManagedRoutesByWave(options.wave);
  }

  return [
    ...LEGACY_MANAGED_WAVES.wave1,
    ...LEGACY_MANAGED_WAVES.wave2,
    ...LEGACY_MANAGED_WAVES.wave3,
  ];
}

async function reportRoutes(routes) {
  const report = routes.map((routePath) => {
    const config = getLegacyManagedRouteConfig(routePath);
    return {
      routePath: config.routePath,
      wave: config.wave,
      blueprint: config.blueprint,
      pageKind: config.pageKind,
      legacySource: config.legacySource,
      navGroup: config.navGroup,
    };
  });

  console.log(JSON.stringify(report, null, 2));
}

async function migrateRoute(routePath, options) {
  const config = getLegacyManagedRouteConfig(routePath);
  const existingPage = unwrapRecord(await fetchPageV2ByRoute(routePath));
  let resolvedDraft = null;

  if (existingPage && Object.keys(existingPage).length) {
    resolvedDraft = buildManagedPageDraftFromExistingPage({
      routePath,
      existingPage,
      overrides: {
        blueprint_id: config.blueprint,
      },
    });
  } else {
    const legacyPage = await fetchLegacyRecord(config);
    if (!legacyPage) {
      throw new Error(`Neither page_v2 nor legacy record found for ${routePath}`);
    }

    resolvedDraft = buildLegacyManagedPageDraft({
      routePath,
      legacyPage,
      overrides: {
        blueprint_id: config.blueprint,
      },
    });
  }

  if (!options.apply) {
    return {
      action: 'planned',
      routePath,
      blueprint: config.blueprint,
      source: existingPage && Object.keys(existingPage).length ? 'page_v2' : 'legacy',
      sectionTypes: resolvedDraft.data.sections.map((section) => section.__component),
      publish: options.publish,
    };
  }

  const result = await upsertPageV2(routePath, resolvedDraft.data, options);
  return {
    ...result,
    source: existingPage && Object.keys(existingPage).length ? 'page_v2' : 'legacy',
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const routes = resolveRoutes(options);

  if (options.report) {
    await reportRoutes(routes);
    return;
  }

  requireEnv();

  const results = options.unpublish && isLocalStrapiUrl(STRAPI_URL)
    ? await withLocalStrapi({ appDir: 'cms' }, async (strapi) => {
        const service = strapi.documents('api::page-v2.page-v2');
        const batchResults = [];
        for (const routePath of routes) {
          const result = await unpublishPageV2(routePath, service);
          batchResults.push(result);
          console.log(JSON.stringify(result));
        }
        return batchResults;
      })
    : await (async () => {
        const batchResults = [];
        for (const routePath of routes) {
          const result = options.unpublish
            ? await unpublishPageV2(routePath)
            : await migrateRoute(routePath, options);
          batchResults.push(result);
          console.log(JSON.stringify(result));
        }
        return batchResults;
      })();

  console.log(JSON.stringify({
    ok: true,
    routes: routes.length,
    apply: options.apply,
    publish: options.publish,
    unpublish: options.unpublish,
    results,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
