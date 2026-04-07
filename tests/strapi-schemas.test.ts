import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  normalizeLandingPageRecord,
  normalizeSiteSettingsRecord,
  parseCollectionData,
  parseSingleData,
} from '../portal/src/lib/strapi-schemas.ts';

test('parseCollectionData validates collection payloads', () => {
  const data = parseCollectionData(
    {
      data: [{ slug: 'whatsapp' }],
    },
    '/channels',
  );

  assert.deepEqual(data, [{ slug: 'whatsapp' }]);
  assert.throws(() => parseCollectionData({ data: {} }, '/channels'), /invalid collection payload/);
});

test('parseSingleData validates single payloads', () => {
  const data = parseSingleData(
    {
      data: { site_name: 'Chat Plus' },
    },
    '/site-setting',
  );

  assert.deepEqual(data, { site_name: 'Chat Plus' });
  assert.throws(() => parseSingleData({ nope: true }, '/site-setting'), /invalid single payload/);
});

test('normalizeLandingPageRecord normalizes alias template kinds and nested arrays', () => {
  const previousPublicSiteUrl = process.env.PUBLIC_SITE_URL;
  process.env.PUBLIC_SITE_URL = 'https://astro.integromat.ru';

  const normalized = normalizeLandingPageRecord(
    {
      slug: 'media',
      template_kind: 'brand-content',
      content_origin: 'managed',
      canonical: 'https://chatplus.ru/media',
      software_schema: {
        '@type': 'SoftwareApplication',
        url: 'https://chatplus.ru/media',
      },
      use_cases: [{ audience: 'PR team', description: 'Editorial workflows' }],
      faqs: [{ q: 'What is this?', a: 'A brand page.' }],
      internal_links: [{ title: 'Docs', url: '/docs', description: 'Knowledge base' }],
      navigation_groups: [
        {
          title: 'Explore',
          items: [{ title: 'Team', url: '/team', description: 'Meet the team' }],
        },
      ],
    },
    'media',
  );

  try {
    assert.equal(normalized.template_kind, 'brand_content');
    assert.equal(normalized.canonical, 'https://astro.integromat.ru/media');
    assert.equal(normalized.software_schema?.url, 'https://astro.integromat.ru/media');
    assert.equal(normalized.use_cases[0].title, 'PR team');
    assert.equal(normalized.faqs[0].question, 'What is this?');
    assert.equal(normalized.internal_links[0].href, '/docs');
    assert.equal(normalized.navigation_groups[0].items[0].label, 'Team');
  } finally {
    if (previousPublicSiteUrl === undefined) {
      delete process.env.PUBLIC_SITE_URL;
    } else {
      process.env.PUBLIC_SITE_URL = previousPublicSiteUrl;
    }
  }
});

test('normalizeSiteSettingsRecord guarantees array and object boundaries', () => {
  const previousPublicSiteUrl = process.env.PUBLIC_SITE_URL;
  process.env.PUBLIC_SITE_URL = 'https://astro.integromat.ru';

  const normalized = normalizeSiteSettingsRecord({
    site_url: 'https://chatplus.ru',
    page_templates: null,
    template_defaults: undefined,
    header_links: 'bad-shape',
    footer_columns: [{ title: 'Footer' }],
  });

  try {
    assert.equal(normalized.site_url, 'https://astro.integromat.ru');
    assert.deepEqual(normalized.page_templates, {});
    assert.deepEqual(normalized.template_defaults, {});
    assert.deepEqual(normalized.header_links, []);
    assert.deepEqual(normalized.footer_columns, [{ title: 'Footer' }]);
  } finally {
    if (previousPublicSiteUrl === undefined) {
      delete process.env.PUBLIC_SITE_URL;
    } else {
      process.env.PUBLIC_SITE_URL = previousPublicSiteUrl;
    }
  }
});

test('editorial schemas enable draftAndPublish for publish lifecycle', () => {
  const landingPageSchema = JSON.parse(
    readFileSync('cms/src/api/landing-page/content-types/landing-page/schema.json', 'utf8')
  );
  const tendersPageSchema = JSON.parse(
    readFileSync('cms/src/api/tenders-page/content-types/tenders-page/schema.json', 'utf8')
  );
  const businessTypesPageSchema = JSON.parse(
    readFileSync('cms/src/api/business-types-page/content-types/business-types-page/schema.json', 'utf8')
  );
  const siteSettingSchema = JSON.parse(
    readFileSync('cms/src/api/site-setting/content-types/site-setting/schema.json', 'utf8')
  );

  assert.equal(landingPageSchema.options.draftAndPublish, true);
  assert.equal(tendersPageSchema.options.draftAndPublish, true);
  assert.equal(businessTypesPageSchema.options.draftAndPublish, true);
  assert.equal(siteSettingSchema.options.draftAndPublish, true);
});
