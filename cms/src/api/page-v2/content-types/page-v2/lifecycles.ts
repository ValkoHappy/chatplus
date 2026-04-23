import { errors } from '@strapi/utils';

import { canPageV2UseRoute, normalizePageV2RoutePath } from '../../../../utils/page-v2-routes';

const { ApplicationError } = errors;

function requireSeoFields(data: Record<string, unknown>) {
  const seoTitle = typeof data.seo_title === 'string' ? data.seo_title.trim() : '';
  const seoDescription = typeof data.seo_description === 'string' ? data.seo_description.trim() : '';

  if (!seoTitle || !seoDescription) {
    throw new ApplicationError('Published page_v2 records require seo_title and seo_description.');
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

  if (data.publishedAt) {
    requireSeoFields(data);
  }
}

export default {
  beforeCreate(event: { params: { data?: Record<string, unknown> } }) {
    const data = event.params.data || {};
    normalizeRecordData(data);
    validateRecordData(data);
  },

  beforeUpdate(event: { params: { data?: Record<string, unknown> } }) {
    const data = event.params.data || {};
    normalizeRecordData(data);
    validateRecordData(data);
  },
};
