import { pathToFileURL } from 'node:url';

const STRAPI_URL = (process.env.STRAPI_URL || '').replace(/\/+$/, '');
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

export function parseArgs(argv = []) {
  const options = {
    apply: false,
    versionId: '',
    pageRoute: '',
  };

  for (const arg of argv) {
    if (arg === '--apply') options.apply = true;
    else if (arg.startsWith('--version-id=')) options.versionId = arg.split('=')[1] || '';
    else if (arg.startsWith('--route=')) options.pageRoute = arg.split('=')[1] || '';
  }

  return options;
}

export function buildRollbackDraftPayload(snapshot = {}) {
  const payload = { ...(snapshot && typeof snapshot === 'object' ? snapshot : {}) };
  delete payload.id;
  delete payload.documentId;
  delete payload.createdAt;
  delete payload.updatedAt;
  delete payload.publishedAt;

  return {
    ...payload,
    editorial_status: 'review',
    migration_ready: false,
    parity_status: 'unchecked',
  };
}

function requireEnv() {
  if (!STRAPI_URL || !STRAPI_TOKEN) {
    throw new Error('STRAPI_URL and STRAPI_TOKEN are required for page rollback.');
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

function unwrapRecord(record) {
  if (!record || typeof record !== 'object') {
    return null;
  }

  return {
    id: record.id,
    documentId: record.documentId,
    ...(record.attributes && typeof record.attributes === 'object' ? record.attributes : record),
  };
}

async function fetchVersionById(versionId) {
  return unwrapRecord((await request(`/api/page-versions/${encodeURIComponent(versionId)}?populate=*`)).data);
}

async function fetchVersionByRoute(routePath) {
  const result = await request(`/api/page-versions?filters[route_path][$eq]=${encodeURIComponent(routePath)}&sort[0]=version_number:desc&pagination[pageSize]=1&populate=*`);
  return unwrapRecord(result?.data?.[0]);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  requireEnv();

  if (!options.versionId && !options.pageRoute) {
    throw new Error('Use --version-id=... or --route=...');
  }

  const version = options.versionId
    ? await fetchVersionById(options.versionId)
    : await fetchVersionByRoute(options.pageRoute);

  if (!version) {
    throw new Error('Requested page_version snapshot was not found.');
  }

  const snapshot = version.snapshot;
  const pageId = snapshot?.documentId || snapshot?.id;
  if (!snapshot || !pageId) {
    throw new Error('Snapshot does not contain a valid page_v2 identity.');
  }

  const payload = buildRollbackDraftPayload(snapshot);

  if (!options.apply) {
    console.log(JSON.stringify({
      ok: true,
      mode: 'report',
      version: version.version_number,
      route_path: version.route_path,
      target_page: pageId,
      editorial_status: version.editorial_status,
    }, null, 2));
    return;
  }

  const restored = await request(`/api/page-v2s/${encodeURIComponent(pageId)}?status=draft`, {
    method: 'PUT',
    body: JSON.stringify({
      data: {
        ...payload,
      },
    }),
  });

  console.log(JSON.stringify({
    ok: true,
    mode: 'apply',
    version: version.version_number,
    route_path: version.route_path,
    restored_page: unwrapRecord(restored?.data),
  }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
