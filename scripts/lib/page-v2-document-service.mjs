import path from 'node:path';
import { createRequire } from 'node:module';
import dotenv from 'dotenv';

const require = createRequire(import.meta.url);

export function isLocalStrapiUrl(value = '') {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.hostname === '127.0.0.1' || url.hostname === 'localhost';
  } catch {
    return false;
  }
}

export async function withLocalStrapi({ appDir = 'cms', createStrapiFactory } = {}, callback) {
  const resolvedAppDir = path.resolve(process.cwd(), appDir);
  const distDir = path.join(resolvedAppDir, 'dist');
  dotenv.config({ path: path.join(resolvedAppDir, '.env'), override: false, quiet: true });
  const createStrapi =
    createStrapiFactory ||
    require(path.join(resolvedAppDir, 'node_modules', '@strapi', 'strapi')).createStrapi;

  const strapi = createStrapi({ appDir: resolvedAppDir, distDir });

  try {
    await strapi.load();
    return await callback(strapi);
  } finally {
    const shutdownErrors = [];
    const handleShutdownRejection = (reason) => {
      if (reason instanceof Error && reason.message === 'aborted') {
        return;
      }
      shutdownErrors.push(reason);
    };
    const handleShutdownException = (error) => {
      if (error instanceof Error && error.message === 'aborted') {
        return;
      }
      shutdownErrors.push(error);
    };

    process.prependListener('unhandledRejection', handleShutdownRejection);
    process.prependListener('uncaughtException', handleShutdownException);
    try {
      await new Promise((resolve) => {
        setTimeout(resolve, 250);
      });
      await strapi.destroy();
      await new Promise((resolve) => {
        setImmediate(resolve);
      });
    } catch (error) {
      if (!(error instanceof Error) || error.message !== 'aborted') {
        throw error;
      }
    } finally {
      process.removeListener('unhandledRejection', handleShutdownRejection);
      process.removeListener('uncaughtException', handleShutdownException);
    }

    if (shutdownErrors.length) {
      throw shutdownErrors[0];
    }
  }
}

export async function unpublishPageDocumentLocal({
  documentId,
  locale = 'ru',
  uid = 'api::page-v2.page-v2',
  appDir = 'cms',
  createStrapiFactory,
} = {}) {
  if (!documentId) {
    throw new Error('documentId is required to unpublish a page document.');
  }

  return withLocalStrapi({ appDir, createStrapiFactory }, async (strapi) => {
    return strapi.documents(uid).unpublish({
      documentId,
      locale,
    });
  });
}

export async function syncPublishedDocumentWithService(service, {
  documentId,
  locale = 'ru',
} = {}) {
  if (!service) {
    throw new Error('A Strapi document service instance is required to sync published page_v2 state.');
  }

  if (!documentId) {
    throw new Error('documentId is required to sync published page_v2 state.');
  }

  await service.unpublish({
    documentId,
    locale,
  }).catch(() => null);

  await service.publish({
    documentId,
    locale,
  });
}

function normalizeLocalRoutePath(value = '') {
  const routePath = typeof value === 'string' ? value.trim() : '';
  if (!routePath || routePath === '/') {
    return '/';
  }

  return `/${routePath.replace(/^\/+/, '').replace(/\/+$/, '')}`;
}

function stripMaterializerOnlyFields(data = {}) {
  const payload = { ...data };
  delete payload.blueprint_id;
  delete payload.publishedAt;
  return payload;
}

async function findPageDocumentByRoute(service, routePath, locale = 'ru') {
  const filters = { route_path: { $eq: normalizeLocalRoutePath(routePath) } };
  const draft = (await service.findMany({
    filters,
    locale,
    status: 'draft',
    populate: ['blueprint', 'sections'],
  }))?.[0] || null;

  if (draft) {
    return draft;
  }

  return (await service.findMany({
    filters,
    locale,
    status: 'published',
    populate: ['blueprint', 'sections'],
  }))?.[0] || null;
}

export async function upsertPageDocumentWithService(service, {
  routePath,
  data,
  blueprint,
  locale = 'ru',
  publish = false,
} = {}) {
  if (!service) {
    throw new Error('A Strapi document service instance is required to upsert page_v2 locally.');
  }

  if (!data || typeof data !== 'object') {
    throw new Error('data is required to upsert page_v2 locally.');
  }

  const normalizedRoutePath = normalizeLocalRoutePath(routePath || data.route_path);
  const payload = {
    ...stripMaterializerOnlyFields(data),
    route_path: normalizedRoutePath,
    blueprint,
  };

  const existing = await findPageDocumentByRoute(service, normalizedRoutePath, locale);
  const documentId = existing?.documentId || existing?.id || null;
  const record = documentId
    ? await service.update({
        documentId,
        locale,
        data: payload,
        populate: ['blueprint', 'sections'],
      })
    : await service.create({
        locale,
        status: 'draft',
        data: payload,
        populate: ['blueprint', 'sections'],
      });

  const savedDocumentId = record?.documentId || documentId || record?.id || null;
  if (publish && savedDocumentId) {
    await syncPublishedDocumentWithService(service, {
      documentId: savedDocumentId,
      locale,
    });
  }

  return {
    action: documentId ? 'updated' : 'created',
    routePath: normalizedRoutePath,
    documentId: savedDocumentId,
    published: Boolean(publish && savedDocumentId),
  };
}

export async function upsertPageDocumentLocal({
  routePath,
  data,
  blueprint,
  locale = 'ru',
  publish = false,
  uid = 'api::page-v2.page-v2',
  appDir = 'cms',
  createStrapiFactory,
} = {}) {
  return withLocalStrapi({ appDir, createStrapiFactory }, async (strapi) => {
    return upsertPageDocumentWithService(strapi.documents(uid), {
      routePath,
      data,
      blueprint,
      locale,
      publish,
    });
  });
}
