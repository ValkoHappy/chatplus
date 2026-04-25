import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  canPageV2UseRoute,
  isImmutableReservedPageV2Route,
  isMigratableManagedPageV2Route,
  isReservedPageV2Route,
  normalizePageV2RoutePath,
  shouldGeneratePageV2CatchAllRoute,
  toPageV2CatchAllParam,
} from '../config/page-v2-routes.mjs';
import { isPageV2Renderable } from '../portal/src/lib/strapi.ts';
import { normalizePageV2Record } from '../portal/src/lib/strapi-schemas.ts';
import { getPageV2MigrationGateErrors } from '../cms/src/utils/page-v2-migration-gate.ts';

test('normalizePageV2RoutePath canonicalizes slashes and root prefix', () => {
  assert.equal(normalizePageV2RoutePath('brand/new-offer/'), '/brand/new-offer');
  assert.equal(normalizePageV2RoutePath('/brand/new-offer/'), '/brand/new-offer');
  assert.equal(normalizePageV2RoutePath(''), '/');
});

test('route policy splits immutable reserved and migratable managed routes', () => {
  assert.equal(isReservedPageV2Route('/channels'), false);
  assert.equal(isReservedPageV2Route('/channels/whatsapp'), false);
  assert.equal(isReservedPageV2Route('/compare/respond-io'), false);
  assert.equal(isReservedPageV2Route('/pricing'), true);
  assert.equal(isReservedPageV2Route('/promo'), true);
  assert.equal(isReservedPageV2Route('/site-map'), false);
  assert.equal(isReservedPageV2Route('/new-product-page'), false);

  assert.equal(isImmutableReservedPageV2Route('/channels'), false);
  assert.equal(isImmutableReservedPageV2Route('/channels/whatsapp'), false);
  assert.equal(isImmutableReservedPageV2Route('/compare/respond-io'), false);
  assert.equal(isImmutableReservedPageV2Route('/admin'), true);
  assert.equal(isImmutableReservedPageV2Route('/api/page-v2s'), true);
  assert.equal(isImmutableReservedPageV2Route('/pricing'), false);
  assert.equal(isImmutableReservedPageV2Route('/promo'), false);
  assert.equal(isImmutableReservedPageV2Route('/site-map'), false);

  assert.equal(isMigratableManagedPageV2Route('/'), true);
  assert.equal(isMigratableManagedPageV2Route('/pricing'), true);
  assert.equal(isMigratableManagedPageV2Route('/promo'), true);
  assert.equal(isMigratableManagedPageV2Route('/channels'), false);
  assert.equal(isMigratableManagedPageV2Route('/channels/whatsapp'), false);

  assert.equal(canPageV2UseRoute('/pricing'), true);
  assert.equal(canPageV2UseRoute('/promo'), true);
  assert.equal(canPageV2UseRoute('/new-product-page'), true);
  assert.equal(canPageV2UseRoute('/channels'), true);
  assert.equal(canPageV2UseRoute('/compare/respond-io'), true);
  assert.equal(canPageV2UseRoute('/api/page-v2s'), false);

  assert.equal(shouldGeneratePageV2CatchAllRoute('/brand/new'), true);
  assert.equal(shouldGeneratePageV2CatchAllRoute('/channels'), false);
  assert.equal(shouldGeneratePageV2CatchAllRoute('/channels/whatsapp'), false);
  assert.equal(shouldGeneratePageV2CatchAllRoute('/site-map'), false);
});

test('toPageV2CatchAllParam converts route paths to Astro catch-all params', () => {
  assert.equal(toPageV2CatchAllParam('/brand/new-offer'), 'brand/new-offer');
  assert.equal(toPageV2CatchAllParam('/single'), 'single');
  assert.equal(toPageV2CatchAllParam('/'), undefined);
});

test('normalizePageV2Record normalizes route, blocks, breadcrumbs, and internal links', () => {
  const normalized = normalizePageV2Record({
    slug: 'new-offer',
    route_path: 'brand/new-offer/',
    title: 'New Offer',
    page_kind: 'brand',
    template_variant: 'editorial',
    generation_mode: 'ai_assisted',
    source_mode: 'managed',
    seo_title: 'New Offer SEO',
    seo_description: 'New Offer description',
    editorial_status: 'approved',
    migration_ready: true,
    parity_status: 'approved',
    legacy_template_family: 'brand',
    legacy_layout_signature: { required_blocks: ['hero'] },
    parity_notes: { approved_by: 'test' },
    publishedAt: '2026-04-22T12:00:00.000Z',
    show_in_header: true,
    show_in_footer: true,
    show_in_sitemap: true,
    nav_group: 'company',
    nav_label: 'New Offer',
    nav_description: 'Brand announcement',
    nav_order: 3,
    sections: [
      {
        __component: 'page-blocks.hero',
        eyebrow: 'Launch',
        title: 'New Offer',
        subtitle: 'A new managed page',
        variant: 'showcase',
        context_title: 'Why now',
        context_text: 'Built for rapid rollout',
        trust_facts: ['Fast launch'],
        panel_items: [{ title: 'Proof', text: 'Real data', icon: 'lucide:chart-no-axes-column' }],
        primary_label: 'Start now',
        primary_url: '/demo',
      },
      {
        __component: 'page-blocks.related-links',
        title: 'Continue',
        links: [{ title: 'Docs', url: '/docs', description: 'Read more' }],
      },
      {
        __component: 'page-blocks.pricing-plans',
        title: 'Plans',
        variant: 'cards',
        items: [
          {
            title: 'Growth',
            label: 'Popular',
            price: '$49',
            period: '/mo',
            note: 'Good for scaling teams',
            text: 'Includes routing and AI automations',
            cta_label: 'Get started',
            cta_url: '/demo',
            icon: 'lucide:rocket',
            kicker: 'Best fit',
            accent: true,
            features: ['Inbox', 'Routing'],
          },
        ],
      },
      {
        __component: 'page-blocks.comparison-table',
        title: 'Compare',
        intro: 'See the difference',
        option_one_label: 'Option one',
        option_two_label: 'Option two',
        option_highlight_label: 'Chat Plus',
        rows: [
          {
            parameter: 'Speed',
            option_one: 'Manual',
            option_two: 'Slow',
            option_highlight: 'Fast',
          },
        ],
      },
      {
        __component: 'page-blocks.before-after',
        title: 'ROI',
        intro: 'Before and after',
        before_title: 'Without Chat Plus',
        after_title: 'With Chat Plus',
        before_items: ['Missed leads'],
        after_items: ['Unified inbox'],
        quote: 'This reduced manual work dramatically.',
        quote_author: 'Operations lead',
      },
      {
        __component: 'page-blocks.internal-links',
        title: 'Next steps',
        intro: 'Explore more pages',
        eyebrow: 'Continue',
        links: [{ label: 'Pricing', href: '/pricing', description: 'Commercial model' }],
      },
    ],
    breadcrumbs: [
      { label: 'Главная', href: '/' },
      { title: 'Компания', url: '/company' },
    ],
    internal_links: [{ title: 'Pricing', url: '/pricing', description: 'Commercial model' }],
  });

  assert.equal(normalized.route_path, '/brand/new-offer');
  assert.equal(normalized.page_kind, 'brand');
  assert.equal(normalized.template_variant, 'editorial');
  assert.equal(normalized.generation_mode, 'ai_assisted');
  assert.equal(normalized.is_published, true);
  assert.equal(normalized.is_migration_visible, true);
  assert.equal(normalized.migration_ready, true);
  assert.equal(normalized.parity_status, 'approved');
  assert.equal(normalized.legacy_template_family, 'brand');
  assert.deepEqual(normalized.legacy_layout_signature, { required_blocks: ['hero'] });
  assert.deepEqual(normalized.parity_notes, { approved_by: 'test' });
  assert.equal(normalized.sections[0].block_type, 'hero');
  assert.equal(normalized.sections[0].variant, 'showcase');
  assert.equal(normalized.sections[0].panel_items[0].icon, 'lucide:chart-no-axes-column');
  assert.equal(normalized.sections[1].block_type, 'related-links');
  assert.equal(normalized.sections[1].links[0].href, '/docs');
  assert.equal(normalized.sections[2].block_type, 'pricing-plans');
  assert.equal(normalized.sections[2].variant, 'cards');
  assert.equal(normalized.sections[2].items[0].cta_label, 'Get started');
  assert.equal(normalized.sections[3].block_type, 'comparison-table');
  assert.equal(normalized.sections[3].rows[0].option_highlight, 'Fast');
  assert.equal(normalized.sections[4].block_type, 'before-after');
  assert.equal(normalized.sections[4].before_items[0], 'Missed leads');
  assert.equal(normalized.sections[5].block_type, 'internal-links');
  assert.equal(normalized.sections[5].eyebrow, 'Continue');
  assert.equal(normalized.sections[5].links[0].href, '/pricing');
  assert.equal(normalized.breadcrumbs[1].label, 'Компания');
  assert.equal(normalized.internal_links[0].href, '/pricing');
});

test('page_v2 legacy public rendering is gated by publish, editorial approval, migration readiness and parity approval', () => {
  const base = {
    slug: 'promo',
    route_path: '/promo',
    title: 'Promo',
    page_kind: 'campaign',
    publishedAt: '2026-04-22T12:00:00.000Z',
    editorial_status: 'approved',
    parity_status: 'approved',
    migration_ready: true,
    legacy_template_family: 'campaign',
  };

  assert.equal(normalizePageV2Record({ ...base, migration_ready: false }).is_migration_visible, false);
  assert.equal(normalizePageV2Record({ ...base, parity_status: 'needs_work' }).is_migration_visible, false);
  assert.equal(normalizePageV2Record({ ...base, editorial_status: 'review' }).is_migration_visible, false);
  assert.equal(normalizePageV2Record({ ...base, publishedAt: '' }).is_migration_visible, false);
  assert.equal(normalizePageV2Record(base).is_migration_visible, true);

  assert.equal(isPageV2Renderable(normalizePageV2Record({ ...base, migration_ready: false })), false);
  assert.equal(isPageV2Renderable(normalizePageV2Record(base)), true);
});

test('new native page_v2 routes are visible after publish and editorial approval without migration gate', () => {
  const base = {
    slug: 'new-campaign',
    route_path: '/campaigns/new-campaign',
    title: 'New campaign',
    page_kind: 'campaign',
    publishedAt: '2026-04-22T12:00:00.000Z',
    editorial_status: 'approved',
    parity_status: 'unchecked',
    migration_ready: false,
  };

  assert.equal(normalizePageV2Record(base).is_migration_visible, true);
  assert.equal(isPageV2Renderable(normalizePageV2Record(base)), true);
  assert.equal(normalizePageV2Record({ ...base, editorial_status: 'review' }).is_migration_visible, false);
  assert.equal(normalizePageV2Record({ ...base, publishedAt: '' }).is_migration_visible, false);
});

test('page-v2 schema enables draftAndPublish', () => {
  const pageV2Schema = JSON.parse(
    readFileSync('cms/src/api/page-v2/content-types/page-v2/schema.json', 'utf8'),
  );

  assert.equal(pageV2Schema.options.draftAndPublish, true);
  assert.equal(pageV2Schema.attributes.source_mode.enum.includes('generated'), true);
  assert.equal(pageV2Schema.attributes.blueprint.target, 'api::page-blueprint.page-blueprint');
  assert.equal(pageV2Schema.attributes.migration_ready.default, false);
  assert.equal(pageV2Schema.attributes.parity_status.default, 'unchecked');
  assert.equal(pageV2Schema.attributes.parity_status.enum.includes('approved'), true);
  assert.equal(pageV2Schema.attributes.legacy_layout_signature.type, 'json');
  assert.equal(pageV2Schema.attributes.parity_notes.type, 'json');
});

test('page_v2 lifecycle rejects migration_ready without explicit approved parity gate', () => {
  assert.match(
    getPageV2MigrationGateErrors({
      migration_ready: true,
      editorial_status: 'review',
      parity_status: 'approved',
      legacy_template_family: 'campaign',
      legacy_layout_signature: { family: 'campaign' },
    }).join(' '),
    /editorial_status is approved/,
  );

  assert.match(
    getPageV2MigrationGateErrors({
      migration_ready: true,
      editorial_status: 'approved',
      parity_status: 'unchecked',
      legacy_template_family: 'campaign',
      legacy_layout_signature: { family: 'campaign' },
    }).join(' '),
    /parity_status is approved/,
  );

  assert.deepEqual(getPageV2MigrationGateErrors({
    migration_ready: true,
    editorial_status: 'approved',
    parity_status: 'approved',
    legacy_template_family: 'campaign',
    legacy_layout_signature: { family: 'campaign' },
  }), []);
});

test('page blueprint and version schemas are available', () => {
  const blueprintSchema = JSON.parse(
    readFileSync('cms/src/api/page-blueprint/content-types/page-blueprint/schema.json', 'utf8'),
  );
  const versionSchema = JSON.parse(
    readFileSync('cms/src/api/page-version/content-types/page-version/schema.json', 'utf8'),
  );

  assert.equal(blueprintSchema.attributes.blueprint_id.unique, true);
  assert.equal(blueprintSchema.attributes.allowed_blocks.type, 'json');
  assert.equal(versionSchema.attributes.snapshot.type, 'json');
  assert.equal(versionSchema.attributes.checksum.required, true);
});

test('shared block primitives are wired into layout and safe page-v2 adapters', () => {
  const baseLayout = readFileSync('portal/src/layouts/Base.astro', 'utf8');
  const blockCss = readFileSync('portal/src/styles/block-primitives.css', 'utf8');
  const faqSection = readFileSync('portal/src/components/FaqSection.astro', 'utf8');
  const pageV2Faq = readFileSync('portal/src/components/page-v2/FaqBlock.astro', 'utf8');
  const pageV2Related = readFileSync('portal/src/components/page-v2/RelatedLinksBlock.astro', 'utf8');
  const pageV2Internal = readFileSync('portal/src/components/page-v2/InternalLinksBlock.astro', 'utf8');
  const pageV2Cta = readFileSync('portal/src/components/page-v2/FinalCtaBlock.astro', 'utf8');
  const pageV2Table = readFileSync('portal/src/components/page-v2/ComparisonTableBlock.astro', 'utf8');
  const legacyInternalLinks = readFileSync('portal/src/components/InternalLinksSection.astro', 'utf8');

  assert.match(baseLayout, /styles\/block-primitives\.css/);
  assert.match(blockCss, /\.block-faq__container/);
  assert.match(blockCss, /\.block-link-card/);
  assert.match(blockCss, /\.block-final-cta/);
  assert.match(blockCss, /\.block-table\b/);

  assert.match(faqSection, /BlockFaq/);
  assert.doesNotMatch(faqSection, /<details class="faq-item"/);

  assert.match(pageV2Faq, /BlockFaq/);
  assert.match(pageV2Related, /BlockLinkGrid/);
  assert.match(pageV2Internal, /BlockLinkGrid/);
  assert.match(pageV2Cta, /BlockFinalCta/);
  assert.match(pageV2Table, /BlockTable/);
  assert.match(legacyInternalLinks, /BlockLinkGrid/);
});

test('legacy family spacing keeps shared primitives from crowding content', () => {
  const legacyInternalLinks = readFileSync('portal/src/components/InternalLinksSection.astro', 'utf8');
  const faqSection = readFileSync('portal/src/components/FaqSection.astro', 'utf8');
  const homePage = readFileSync('portal/src/components/HomePage.astro', 'utf8');
  const partnershipPage = readFileSync('portal/src/components/PartnershipPage.astro', 'utf8');
  const brandContentPage = readFileSync('portal/src/components/BrandContentPage.astro', 'utf8');
  const faqConsumers = [
    'portal/src/components/CampaignPage.astro',
    'portal/src/components/BrandContentPage.astro',
    'portal/src/components/ResourceHubPage.astro',
    'portal/src/components/ComparisonPage.astro',
    'portal/src/components/StructuredLandingPage.astro',
    'portal/src/components/page-v2/FaqBlock.astro',
  ];

  assert.match(legacyInternalLinks, /clamp\(4\.6rem, 8vw, 6\.5rem\)/);
  assert.match(faqSection, /containerClass = 'container'/);
  assert.doesNotMatch(faqSection, /containerClass = 'container faq-container'/);
  assert.match(homePage, /placeholderProofLabels/);
  assert.match(homePage, /proof point/);
  assert.match(homePage, /home page proof/);
  assert.match(homePage, /!placeholderProofLabels\.has\(item\.label\.trim\(\)\.toLowerCase\(\)\)/);
  assert.match(partnershipPage, /\.partner-card \.partner-icon \{ margin-bottom:\.85rem; \}/);
  assert.match(brandContentPage, /\.editorial-top h3 \{ padding-top:\.28rem; \}/);
  assert.match(brandContentPage, /\.editorial-step \{ margin-bottom:\.75rem; \}/);

  for (const file of faqConsumers) {
    const content = readFileSync(file, 'utf8');
    assert.doesNotMatch(content, /containerClass="container container-narrow"/);
  }
});

test('visual spacing audit script covers rendered legacy routes and source regressions', () => {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  const script = readFileSync('scripts/check-visual-spacing.mjs', 'utf8');

  assert.equal(packageJson.scripts['check:visual-spacing'], 'node scripts/check-visual-spacing.mjs');
  assert.match(script, /DEFAULT_ROUTES/);
  assert.match(script, /\/compare\/respond-io/);
  assert.match(script, /Proof point placeholder/);
  assert.match(script, /Generic page_v2 shell on legacy route/);
  assert.match(script, /FAQ should not force container-narrow/);
  assert.match(script, /Technical FAQ question/);
  assert.match(script, /Technical continue eyebrow/);
  assert.match(script, /Technical mobile nav title/);
  assert.match(script, /Technical comparison eyebrow/);
  assert.match(script, /Technical request demo CTA/);
  assert.match(script, /Technical comparison workflow value/);
  assert.match(script, /Technical comparison formats title/);
  assert.match(script, /Technical comparison operating-layer fallback/);
  assert.match(script, /Technical comparison CTA/);
});

test('page_v2 rendering and materializer do not leak migration-only placeholder copy', () => {
  const materializer = readFileSync('scripts/materialize-page-v2-routes.mjs', 'utf8');
  const blockFaq = readFileSync('portal/src/components/blocks/BlockFaq.astro', 'utf8');
  const blockLinkGrid = readFileSync('portal/src/components/blocks/BlockLinkGrid.astro', 'utf8');
  const pageV2Page = readFileSync('portal/src/components/PageV2Page.astro', 'utf8');
  const compareIndex = readFileSync('portal/src/pages/compare/index.astro', 'utf8');

  assert.doesNotMatch(materializer, /Can this page be edited in Strapi/);
  assert.doesNotMatch(materializer, /Manual review in Strapi/);
  assert.match(materializer, /normalizeTechnicalCopy/);
  assert.match(materializer, /'Compare formats', 'Соседние сравнения'/);
  assert.doesNotMatch(materializer, /Compare the alternative with Chat Plus before publishing/);
  assert.doesNotMatch(materializer, /Comparison FAQ/);
  assert.match(materializer, /Запросить сравнение/);
  assert.match(materializer, /На что смотреть/);
  assert.match(materializer, /Chat Plus делает ставку на омниканал/);

  assert.match(blockFaq, /technicalQuestions/);
  assert.match(blockLinkGrid, /По теме страницы/);
  assert.match(compareIndex, /technicalFaqQuestions/);
  assert.match(compareIndex, /TECHNICAL_COMPARE_TEXT/);
  assert.match(compareIndex, /На что смотреть/);
  assert.doesNotMatch(pageV2Page, /eyebrow: 'Continue'/);
});

test('unified block system documentation has inventory and no generic cutover requirement', () => {
  const plan = readFileSync('docs/unified-block-system-plan.md', 'utf8');
  const inventory = readFileSync('docs/block-primitives-inventory.md', 'utf8');
  const manualBuilder = readFileSync('docs/page-v2-manual-builder.md', 'utf8');

  assert.match(plan, /block-primitives\.css/);
  assert.match(plan, /block-primitives-inventory\.md/);
  assert.match(inventory, /BlockFaq/);
  assert.match(inventory, /Hero/);
  assert.match(inventory, /Не трогать в первой волне/);
  assert.match(manualBuilder, /BlockLinkGrid/);
  assert.match(manualBuilder, /schema, normalization, renderer\/adapter, primitive, tests/);
});
