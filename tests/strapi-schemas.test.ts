import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  normalizeLandingPageRecord,
  normalizeSiteSettingsRecord,
  parseCollectionData,
  parseSingleData,
} from '../portal/src/lib/strapi-schemas.ts';

function readJson(path: string) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function assertRussianHelpText(schema: any, attributeNames: string[]) {
  for (const attributeName of attributeNames) {
    const description = schema.attributes?.[attributeName]?.description;
    assert.equal(typeof description, 'string', `${attributeName} should have editor help text`);
    assert.match(description, /[А-Яа-яЁё]/, `${attributeName} help text should be Russian`);
  }
}

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
  const landingPageSchema = readJson('cms/src/api/landing-page/content-types/landing-page/schema.json');
  const tendersPageSchema = readJson('cms/src/api/tenders-page/content-types/tenders-page/schema.json');
  const businessTypesPageSchema = readJson(
    'cms/src/api/business-types-page/content-types/business-types-page/schema.json'
  );
  const siteSettingSchema = readJson('cms/src/api/site-setting/content-types/site-setting/schema.json');

  assert.equal(landingPageSchema.options.draftAndPublish, true);
  assert.equal(tendersPageSchema.options.draftAndPublish, true);
  assert.equal(businessTypesPageSchema.options.draftAndPublish, true);
  assert.equal(siteSettingSchema.options.draftAndPublish, true);
});

test('page_v2 card items preserve route links needed by legacy directory renderers', () => {
  const cardItemSchema = readJson('cms/src/components/page-blocks/card-item.json');

  assert.equal(cardItemSchema.attributes.href.type, 'string');
  assert.equal(cardItemSchema.attributes.cta_label.type, 'string');
  assert.equal(cardItemSchema.attributes.badges.type, 'json');
});

test('generation_job supports AI block planning controls', () => {
  const generationJobSchema = readJson('cms/src/api/generation-job/content-types/generation-job/schema.json');

  assert.deepEqual(generationJobSchema.attributes.block_strategy.enum, ['auto', 'blueprint_default', 'custom']);
  assert.equal(generationJobSchema.attributes.block_strategy.default, 'auto');
  assert.equal(generationJobSchema.attributes.target_blocks.type, 'json');
});

test('page editor schema exposes Russian help text for high-risk fields', () => {
  const pageSchema = readJson('cms/src/api/page-v2/content-types/page-v2/schema.json');

  assert.match(pageSchema.info.description, /[А-Яа-яЁё]/);
  assertRussianHelpText(pageSchema, [
    'route_path',
    'page_kind',
    'blueprint',
    'sections',
    'seo_title',
    'show_in_sitemap',
    'migration_ready',
    'parity_status',
  ]);
});

test('AI generation job schema explains controls in Russian', () => {
  const generationJobSchema = readJson('cms/src/api/generation-job/content-types/generation-job/schema.json');

  assert.match(generationJobSchema.info.description, /[А-Яа-яЁё]/);
  assertRussianHelpText(generationJobSchema, [
    'job_type',
    'target_blueprint',
    'block_strategy',
    'target_blocks',
    'request_prompt',
    'run_report',
  ]);
});

test('page block components include Russian editor examples', () => {
  const components = [
    ['cms/src/components/page-blocks/hero.json', ['variant', 'title', 'primary_url', 'trust_facts']],
    ['cms/src/components/page-blocks/cards-grid.json', ['variant', 'title', 'items']],
    ['cms/src/components/page-blocks/faq.json', ['title', 'intro', 'items']],
    ['cms/src/components/page-blocks/final-cta.json', ['title', 'primary_label', 'primary_url']],
    ['cms/src/components/page-blocks/comparison-table.json', ['option_one_label', 'option_two_label', 'rows']],
    ['cms/src/components/page-blocks/internal-links.json', ['eyebrow', 'title', 'links']],
  ] as const;

  for (const [path, attributes] of components) {
    const componentSchema = readJson(path);
    assert.match(componentSchema.info.description, /[А-Яа-яЁё]/, `${path} should explain the block in Russian`);
    assertRussianHelpText(componentSchema, [...attributes]);
  }
});
