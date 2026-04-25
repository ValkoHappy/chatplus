import { errors } from '@strapi/utils';
import { createHash } from 'node:crypto';

import { getPageV2MigrationGateErrors } from '../../../../utils/page-v2-migration-gate';
import { canPageV2UseRoute, normalizePageV2RoutePath } from '../../../../utils/page-v2-routes';

const { ApplicationError } = errors;
const SKIP_PAGE_VERSION_SNAPSHOTS = `${process.env.PAGE_V2_SKIP_VERSION_SNAPSHOTS || ''}`.trim().toLowerCase() === 'true';

function requireSeoFields(data: Record<string, unknown>) {
  const seoTitle = typeof data.seo_title === 'string' ? data.seo_title.trim() : '';
  const seoDescription = typeof data.seo_description === 'string' ? data.seo_description.trim() : '';

  if (!seoTitle || !seoDescription) {
    throw new ApplicationError('Published page_v2 records require seo_title and seo_description.');
  }
}

function hasBlueprint(data: Record<string, unknown>) {
  const blueprint = data.blueprint;
  if (typeof blueprint === 'number' || typeof blueprint === 'string') {
    return `${blueprint}`.trim().length > 0;
  }

  if (blueprint && typeof blueprint === 'object') {
    return Object.keys(blueprint as Record<string, unknown>).length > 0;
  }

  return false;
}

function hasValidSections(data: Record<string, unknown>) {
  const sections = Array.isArray(data.sections) ? data.sections : [];
  return sections.some((section) => {
    if (!section || typeof section !== 'object') {
      return false;
    }

    return typeof (section as Record<string, unknown>).__component === 'string';
  });
}

function requirePublishFields(data: Record<string, unknown>) {
  requireSeoFields(data);

  if (!hasBlueprint(data)) {
    throw new ApplicationError('Published page_v2 records require a page_blueprint relation.');
  }

  if (!hasValidSections(data)) {
    throw new ApplicationError('Published page_v2 records require at least one valid section.');
  }
}

function requireMigrationGateFields(data: Record<string, unknown>) {
  const errors = getPageV2MigrationGateErrors(data);
  if (errors.length) {
    throw new ApplicationError(errors.join(' '));
  }
}

function normalizeRecordData(data: Record<string, unknown>) {
  if (typeof data.route_path === 'string') {
    data.route_path = normalizePageV2RoutePath(data.route_path);
  }

  if (typeof data.slug === 'string') {
    data.slug = data.slug.trim();
  }

  if (!data.nav_label && typeof data.title === 'string') {
    data.nav_label = data.title;
  }
}

function validateRecordData(data: Record<string, unknown>) {
  const routePath = typeof data.route_path === 'string' ? normalizePageV2RoutePath(data.route_path) : '';
  const pageKind = typeof data.page_kind === 'string' ? data.page_kind.trim() : '';

  if (!pageKind) {
    throw new ApplicationError('page_kind is required for page_v2.');
  }

  if (!routePath) {
    throw new ApplicationError('route_path is required for page_v2.');
  }

  if (!canPageV2UseRoute(routePath)) {
    throw new ApplicationError(`route_path ${routePath} is reserved by a system-owned route.`);
  }

  requireMigrationGateFields(data);

  if (data.publishedAt) {
    requirePublishFields(data);
  }
}

async function loadExistingPage(where: Record<string, unknown> = {}) {
  const id = where.id || where.documentId;
  if (!id) {
    return {};
  }

  try {
    const records = await (strapi as any).entityService.findMany('api::page-v2.page-v2', {
      filters: typeof id === 'number' ? { id } : { documentId: id },
      populate: ['blueprint', 'sections'],
      limit: 1,
    });

    return Array.isArray(records) ? records[0] || {} : records || {};
  } catch (error) {
    strapi.log.warn(`Unable to load page_v2 before validation: ${error instanceof Error ? error.message : String(error)}`);
    return {};
  }
}

function toSnapshot(record: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(record));
}

function checksumSnapshot(snapshot: Record<string, unknown>) {
  return createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
}

async function nextVersionNumber(pageId: unknown) {
  if (!pageId) {
    return 1;
  }

  const versions = await (strapi as any).entityService.findMany('api::page-version.page-version', {
    filters: { page: pageId },
    sort: { version_number: 'desc' },
    limit: 1,
  });

  const latest = Array.isArray(versions) ? versions[0] : null;
  const latestVersion = Number(latest?.version_number || 0);
  return Number.isFinite(latestVersion) ? latestVersion + 1 : 1;
}

async function createPageVersion(record: Record<string, unknown>, sourceAction: 'create' | 'update' | 'publish') {
  if (SKIP_PAGE_VERSION_SNAPSHOTS) {
    return;
  }

  const pageId = record.id;
  const snapshot = toSnapshot(record);
  const publishedAt = typeof record.publishedAt === 'string' ? record.publishedAt : null;

  await (strapi as any).entityService.create('api::page-version.page-version', {
    data: {
      page: pageId,
      version_number: await nextVersionNumber(pageId),
      route_path: normalizePageV2RoutePath(typeof record.route_path === 'string' ? record.route_path : ''),
      editorial_status: typeof record.editorial_status === 'string' ? record.editorial_status : '',
      published_at_snapshot: publishedAt,
      snapshot,
      checksum: checksumSnapshot(snapshot),
      source_action: sourceAction,
      created_by_label: 'strapi-lifecycle',
    },
  });
}

export default {
  beforeCreate(event: { params: { data?: Record<string, unknown> } }) {
    const data = event.params.data || {};
    normalizeRecordData(data);
    validateRecordData(data);
  },

  async beforeUpdate(event: { params: { data?: Record<string, unknown>; where?: Record<string, unknown> } }) {
    const data = event.params.data || {};
    normalizeRecordData(data);
    const existing = await loadExistingPage(event.params.where || {});
    validateRecordData({ ...existing, ...data });
  },

  async afterCreate(event: { result?: Record<string, unknown> }) {
    if (event.result) {
      await createPageVersion(event.result, event.result.publishedAt ? 'publish' : 'create');
    }
  },

  async afterUpdate(event: { result?: Record<string, unknown> }) {
    if (event.result) {
      await createPageVersion(event.result, event.result.publishedAt ? 'publish' : 'update');
    }
  },
};
