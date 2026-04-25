import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isLocalStrapiUrl,
  syncPublishedDocumentWithService,
  unpublishPageDocumentLocal,
  upsertPageDocumentWithService,
  withLocalStrapi,
} from '../scripts/lib/page-v2-document-service.mjs';

test('isLocalStrapiUrl detects localhost-based Strapi endpoints', () => {
  assert.equal(isLocalStrapiUrl('http://127.0.0.1:1337'), true);
  assert.equal(isLocalStrapiUrl('http://localhost:1337'), true);
  assert.equal(isLocalStrapiUrl('https://strapi.example.com'), false);
  assert.equal(isLocalStrapiUrl(''), false);
});

test('unpublishPageDocumentLocal calls document service with documentId and locale object', async () => {
  const calls = [];
  const fakeStrapi = {
    load: async () => {},
    destroy: async () => {},
    documents: (uid) => {
      calls.push({ type: 'uid', uid });
      return {
        unpublish: async (params) => {
          calls.push({ type: 'unpublish', params });
          return { entries: [{ documentId: params.documentId, locale: params.locale }] };
        },
      };
    },
  };

  const result = await unpublishPageDocumentLocal({
    documentId: 'doc-123',
    locale: 'ru',
    createStrapiFactory: () => fakeStrapi,
    appDir: 'cms',
  });

  assert.deepEqual(calls, [
    { type: 'uid', uid: 'api::page-v2.page-v2' },
    { type: 'unpublish', params: { documentId: 'doc-123', locale: 'ru' } },
  ]);
  assert.deepEqual(result, { entries: [{ documentId: 'doc-123', locale: 'ru' }] });
});

test('withLocalStrapi ignores known database pool abort during shutdown after successful work', async () => {
  const fakeStrapi = {
    load: async () => {},
    destroy: async () => {
      throw new Error('aborted');
    },
  };

  const result = await withLocalStrapi({
    createStrapiFactory: () => fakeStrapi,
    appDir: 'cms',
  }, async () => 'ok');

  assert.equal(result, 'ok');
});

test('upsertPageDocumentWithService creates drafts through document service without REST-only publishedAt', async () => {
  const calls = [];
  const service = {
    findMany: async (params) => {
      calls.push({ type: 'findMany', params });
      return [];
    },
    create: async (params) => {
      calls.push({ type: 'create', params });
      return { documentId: 'page-doc-1' };
    },
    publish: async (params) => {
      calls.push({ type: 'publish', params });
      return {};
    },
    unpublish: async (params) => {
      calls.push({ type: 'unpublish', params });
      return {};
    },
  };

  const result = await upsertPageDocumentWithService(service, {
    routePath: '/manual-test-page/',
    blueprint: 'blueprint-doc-1',
    publish: true,
    data: {
      title: 'Manual test',
      route_path: '/manual-test-page/',
      locale: 'ru',
      blueprint_id: 'campaign',
      publishedAt: '2026-04-23T00:00:00.000Z',
      sections: [{ __component: 'page-blocks.hero', title: 'Manual test' }],
    },
  });

  const createCall = calls.find((call) => call.type === 'create');
  assert.equal(createCall.params.status, 'draft');
  assert.equal(createCall.params.data.route_path, '/manual-test-page');
  assert.equal(createCall.params.data.blueprint, 'blueprint-doc-1');
  assert.equal(createCall.params.data.blueprint_id, undefined);
  assert.equal(createCall.params.data.publishedAt, undefined);
  assert.deepEqual(calls.slice(-2), [
    { type: 'unpublish', params: { documentId: 'page-doc-1', locale: 'ru' } },
    { type: 'publish', params: { documentId: 'page-doc-1', locale: 'ru' } },
  ]);
  assert.deepEqual(result, {
    action: 'created',
    routePath: '/manual-test-page',
    documentId: 'page-doc-1',
    published: true,
  });
});

test('upsertPageDocumentWithService updates existing page documents', async () => {
  const calls = [];
  const service = {
    findMany: async (params) => {
      calls.push({ type: 'findMany', params });
      return [{ documentId: 'existing-doc' }];
    },
    update: async (params) => {
      calls.push({ type: 'update', params });
      return { documentId: params.documentId };
    },
  };

  const result = await upsertPageDocumentWithService(service, {
    routePath: '/promo',
    blueprint: 'campaign-blueprint',
    data: {
      title: 'Promo',
      route_path: '/promo',
      locale: 'ru',
      sections: [{ __component: 'page-blocks.hero', title: 'Promo' }],
    },
  });

  const updateCall = calls.find((call) => call.type === 'update');
  assert.equal(updateCall.params.documentId, 'existing-doc');
  assert.equal(updateCall.params.data.blueprint, 'campaign-blueprint');
  assert.deepEqual(result, {
    action: 'updated',
    routePath: '/promo',
    documentId: 'existing-doc',
    published: false,
  });
});

test('syncPublishedDocumentWithService refreshes published snapshot from draft state', async () => {
  const calls = [];
  const service = {
    unpublish: async (params) => {
      calls.push({ type: 'unpublish', params });
      return {};
    },
    publish: async (params) => {
      calls.push({ type: 'publish', params });
      return {};
    },
  };

  await syncPublishedDocumentWithService(service, {
    documentId: 'page-doc-2',
    locale: 'ru',
  });

  assert.deepEqual(calls, [
    { type: 'unpublish', params: { documentId: 'page-doc-2', locale: 'ru' } },
    { type: 'publish', params: { documentId: 'page-doc-2', locale: 'ru' } },
  ]);
});

test('upsertPageDocumentWithService republishes existing published page snapshots when publish is requested', async () => {
  const calls = [];
  const service = {
    findMany: async (params) => {
      calls.push({ type: 'findMany', params });
      return [{ documentId: 'existing-published-doc' }];
    },
    update: async (params) => {
      calls.push({ type: 'update', params });
      return { documentId: params.documentId };
    },
    unpublish: async (params) => {
      calls.push({ type: 'unpublish', params });
      return {};
    },
    publish: async (params) => {
      calls.push({ type: 'publish', params });
      return {};
    },
  };

  const result = await upsertPageDocumentWithService(service, {
    routePath: '/pricing',
    blueprint: 'landing-blueprint',
    publish: true,
    data: {
      title: 'Pricing',
      route_path: '/pricing',
      locale: 'ru',
      sections: [{ __component: 'page-blocks.hero', title: 'Pricing' }],
    },
  });

  assert.deepEqual(result, {
    action: 'updated',
    routePath: '/pricing',
    documentId: 'existing-published-doc',
    published: true,
  });
  assert.deepEqual(calls.slice(-2), [
    { type: 'unpublish', params: { documentId: 'existing-published-doc', locale: 'ru' } },
    { type: 'publish', params: { documentId: 'existing-published-doc', locale: 'ru' } },
  ]);
});
