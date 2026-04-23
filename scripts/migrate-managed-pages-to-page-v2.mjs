import {
  LEGACY_MANAGED_WAVES,
  buildLegacyManagedPageDraft,
  getLegacyManagedRouteConfig,
  listLegacyManagedRoutesByWave,
} from './page-v2-generation/legacy-managed-migration.mjs';

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

async function upsertPageV2(routePath, payload, options = {}) {
  const now = new Date().toISOString();
  const existing = await fetchPageV2ByRoute(routePath);
  const data = options.publish ? { ...payload, publishedAt: now } : payload;

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

async function unpublishPageV2(routePath) {
  const existing = await fetchPageV2ByRoute(routePath);
  if (!existing) {
    return {
      action: 'noop-unpublish',
      routePath,
      reason: 'page_v2 record not found',
    };
  }

  const key = existing.documentId || existing.id;
  await request(`/api/page-v2s/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ data: { publishedAt: null } }),
  });

  return {
    action: 'unpublished',
    routePath,
    documentId: key,
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
  const legacyPage = await fetchLegacyRecord(config);

  if (!legacyPage) {
    throw new Error(`Legacy record not found for ${routePath}`);
  }

  const draft = buildLegacyManagedPageDraft({
    routePath,
    legacyPage,
  });

  if (!options.apply) {
    return {
      action: 'planned',
      routePath,
      blueprint: config.blueprint,
      sectionTypes: draft.data.sections.map((section) => section.__component),
      publish: options.publish,
    };
  }

  return upsertPageV2(routePath, draft.data, options);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const routes = resolveRoutes(options);

  if (options.report) {
    await reportRoutes(routes);
    return;
  }

  requireEnv();

  const results = [];
  for (const routePath of routes) {
    const result = options.unpublish
      ? await unpublishPageV2(routePath)
      : await migrateRoute(routePath, options);

    results.push(result);
    console.log(JSON.stringify(result));
  }

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
