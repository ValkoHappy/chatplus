import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildImportedMerge,
  describeSyncResult,
  hydrateMissingManagedContent,
  mergeSourceOwnedContent,
  shouldSkipManagedUpdate,
} from '../scripts/seed-runtime-content/ownership.mjs';
import {
  createStrapiClient,
} from '../scripts/seed-runtime-content/strapi-client.mjs';
import {
  inferLandingPageTemplateKind,
  normalizeLandingPageTemplateKind,
} from '../scripts/seed-runtime-content/rules.mjs';
import { validateLandingPage } from '../scripts/seed-runtime-content/validators.mjs';

test('normalizeLandingPageTemplateKind accepts public aliases and keeps canonical values', () => {
  assert.equal(normalizeLandingPageTemplateKind('resource-hub'), 'resource_hub');
  assert.equal(normalizeLandingPageTemplateKind('brand-content'), 'brand_content');
  assert.equal(normalizeLandingPageTemplateKind('pricing'), 'pricing');
  assert.equal(normalizeLandingPageTemplateKind('unknown-kind'), 'unknown-kind');
});

test('inferLandingPageTemplateKind keeps singleton routing rules canonical', () => {
  assert.equal(inferLandingPageTemplateKind('docs'), 'resource_hub');
  assert.equal(inferLandingPageTemplateKind('media'), 'brand_content');
  assert.equal(inferLandingPageTemplateKind('promo'), 'campaign');
  assert.equal(inferLandingPageTemplateKind('demo'), 'structured');
});

test('validateLandingPage accepts public template alias after normalization', () => {
  assert.doesNotThrow(() =>
    validateLandingPage({
      slug: 'docs',
      meta_title: 'Docs',
      meta_description: 'Docs description',
      h1: 'Docs',
      subtitle: 'Resource hub subtitle',
      template_kind: 'resource-hub',
      content_origin: 'managed',
      section_labels: {
        hero_eyebrow: 'Docs',
        panel_title: 'Start here',
      },
    }),
  );
});

test('validateLandingPage rejects invalid content_origin', () => {
  assert.throws(
    () =>
      validateLandingPage({
        slug: 'pricing',
        meta_title: 'Pricing',
        meta_description: 'Pricing description',
        h1: 'Pricing',
        subtitle: 'Pricing subtitle',
        hero_eyebrow: 'Pricing',
        sticky_cta_title: 'CTA',
        sticky_cta_text: 'Text',
        template_kind: 'pricing',
        content_origin: 'manual',
        section_labels: {
          hero_panel_title: 'Panel',
          hero_panel_summary: 'Summary',
          pricing_title: 'Pricing',
          pricing_intro: 'Intro',
          tier_popular: 'Popular',
          bottom_cta_title: 'Bottom CTA',
          bottom_cta_text: 'Bottom text',
          bottom_cta_primary: 'Primary',
          bottom_cta_secondary: 'Secondary',
          comparison_intro: 'Comparison intro',
          comparison_parameter: 'Parameter',
          comparison_option_one: 'Option 1',
          comparison_option_two: 'Option 2',
          comparison_chat_plus: 'Chat Plus',
          roi_without_title: 'Without',
          roi_with_title: 'With',
        },
      }),
    /invalid content_origin/,
  );
});

test('mergeSourceOwnedContent keeps source-owned values while preserving managed-only nested keys', () => {
  const merged = mergeSourceOwnedContent(
    {
      title: 'Generated title',
      nested: {
        hero: 'Generated hero',
      },
    },
    {
      title: 'Managed title',
      nested: {
        hero: 'Managed hero',
        note: 'Keep me',
      },
      footer: 'Managed footer',
    },
  );

  assert.deepEqual(merged, {
    title: 'Generated title',
    nested: {
      hero: 'Generated hero',
      note: 'Keep me',
    },
    footer: 'Managed footer',
  });
});

test('hydrateMissingManagedContent keeps editor values and fills blanks from source', () => {
  const hydrated = hydrateMissingManagedContent(
    {
      title: 'Source title',
      text: 'Source text',
      nested: {
        label: 'Source label',
      },
    },
    {
      title: 'Managed title',
      nested: {},
    },
  );

  assert.deepEqual(hydrated, {
    title: 'Managed title',
    text: 'Source text',
    nested: {
      label: 'Source label',
    },
  });
});

test('shouldSkipManagedUpdate protects managed records from generator overwrite', () => {
  assert.equal(shouldSkipManagedUpdate({ content_origin: 'managed' }, 'generated'), true);
  assert.equal(shouldSkipManagedUpdate({ content_origin: 'generated' }, 'generated'), false);
});

test('buildImportedMerge preserves manual overrides while updating system-owned fields', () => {
  const nextData = buildImportedMerge({
    endpoint: 'competitors',
    sourceData: {
      slug: 'respond-io',
      name: 'Respond.io',
      external_id: 'competitor:respond-io',
      record_mode: 'imported',
      compare_summary: 'New source summary',
      price: '$99',
    },
    existingData: {
      slug: 'respond-io',
      name: 'Respond.io',
      external_id: 'competitor:respond-io',
      record_mode: 'imported',
      compare_summary: 'Edited in CMS',
      price: '$79',
      last_import_payload: {
        compare_summary: 'Old source summary',
        price: '$79',
      },
      manual_override_fields: [],
    },
    importBatchId: 'batch-1',
    now: '2026-04-06T00:00:00.000Z',
    forceSync: false,
  });

  assert.equal(nextData.price, '$99');
  assert.equal(nextData.compare_summary, 'Edited in CMS');
  assert.deepEqual(nextData.manual_override_fields, ['compare_summary']);
  assert.equal(nextData.import_batch_id, 'batch-1');
});

test('buildImportedMerge force-sync overwrites manual overrides and clears preserved fields', () => {
  const nextData = buildImportedMerge({
    endpoint: 'competitors',
    sourceData: {
      slug: 'respond-io',
      name: 'Respond.io',
      external_id: 'competitor:respond-io',
      record_mode: 'imported',
      compare_summary: 'Forced source summary',
      price: '$129',
    },
    existingData: {
      slug: 'respond-io',
      name: 'Respond.io',
      external_id: 'competitor:respond-io',
      record_mode: 'imported',
      compare_summary: 'Edited in CMS',
      price: '$79',
      last_import_payload: {
        compare_summary: 'Old source summary',
        price: '$79',
      },
      manual_override_fields: ['compare_summary'],
    },
    importBatchId: 'batch-2',
    now: '2026-04-06T00:00:00.000Z',
    forceSync: true,
  });

  assert.equal(nextData.compare_summary, 'Forced source summary');
  assert.equal(nextData.price, '$129');
  assert.deepEqual(nextData.manual_override_fields, []);
  assert.equal(nextData.last_import_diff.status, 'forced');
});

test('upsertSingle creates singleton when Strapi returns 404 for missing record', async () => {
  const calls = [];
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method || 'GET', body: init.body });

    if (String(url).includes('/api/site-setting') && (init.method || 'GET') === 'GET') {
      return {
        ok: false,
        status: 404,
        json: async () => ({ data: null, error: { status: 404, name: 'NotFoundError' } }),
      };
    }

    if (String(url).includes('/api/site-setting') && init.method === 'PUT') {
      return {
        ok: true,
        status: 200,
        json: async () => ({ data: { id: 1 } }),
      };
    }

    throw new Error(`Unexpected fetch ${init.method || 'GET'} ${url}`);
  };

  try {
    const client = createStrapiClient({
      strapiUrl: 'http://example.test',
      strapiToken: 'token',
      now: '2026-04-07T00:00:00.000Z',
      importBatchId: 'batch-1',
    });

    const result = await client.upsertSingle('site-setting', {
      record_mode: 'settings',
      site_name: 'CHATPLUS',
      site_url: 'https://astro.integromat.ru',
      default_description: 'Default description',
    });

    assert.equal(result.action, 'updated');
    assert.equal(calls[0].method, 'GET');
    assert.equal(calls[1].method, 'PUT');
    assert.match(calls[1].body, /"site_name":"CHATPLUS"/);
    assert.doesNotMatch(calls[1].body, /"content_origin":/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('upsertCollection creates managed landing pages without imported-only metadata', async () => {
  const calls = [];
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method || 'GET', body: init.body });

    if (String(url).includes('/api/landing-pages?filters[external_id][$eq]=') && (init.method || 'GET') === 'GET') {
      return {
        ok: true,
        status: 200,
        json: async () => ({ data: [] }),
      };
    }

    if (String(url).includes('/api/landing-pages?filters[slug][$eq]=') && (init.method || 'GET') === 'GET') {
      return {
        ok: true,
        status: 200,
        json: async () => ({ data: [] }),
      };
    }

    if (String(url).endsWith('/api/landing-pages') && init.method === 'POST') {
      return {
        ok: true,
        status: 200,
        json: async () => ({ data: { id: 1 } }),
      };
    }

    throw new Error(`Unexpected fetch ${init.method || 'GET'} ${url}`);
  };

  try {
    const client = createStrapiClient({
      strapiUrl: 'http://example.test',
      strapiToken: 'token',
      now: '2026-04-07T00:00:00.000Z',
      importBatchId: 'batch-1',
    });

    const result = await client.upsertCollection('landing-pages', {
      slug: 'academy',
      external_id: 'landing:academy',
      meta_title: 'Academy',
      meta_description: 'Academy description',
      h1: 'Academy',
      subtitle: 'Academy subtitle',
      template_kind: 'resource_hub',
    });

    assert.equal(result.action, 'created');
    assert.equal(calls.at(-1).method, 'POST');
    assert.match(calls.at(-1).body, /"record_mode":"managed"/);
    assert.match(calls.at(-1).body, /"content_origin":"managed"/);
    assert.doesNotMatch(calls.at(-1).body, /"import_batch_id":/);
    assert.doesNotMatch(calls.at(-1).body, /"last_imported_at":/);
    assert.doesNotMatch(calls.at(-1).body, /"manual_override_fields":/);
    assert.doesNotMatch(calls.at(-1).body, /"last_import_diff":/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
