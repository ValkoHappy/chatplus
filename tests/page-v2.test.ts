import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  canPageV2UseRoute,
  isImmutableReservedPageV2Route,
  isMigratableManagedPageV2Route,
  isReservedPageV2Route,
  normalizePageV2RoutePath,
  toPageV2CatchAllParam,
} from '../config/page-v2-routes.mjs';
import { normalizePageV2Record } from '../portal/src/lib/strapi-schemas.ts';

test('normalizePageV2RoutePath canonicalizes slashes and root prefix', () => {
  assert.equal(normalizePageV2RoutePath('brand/new-offer/'), '/brand/new-offer');
  assert.equal(normalizePageV2RoutePath('/brand/new-offer/'), '/brand/new-offer');
  assert.equal(normalizePageV2RoutePath(''), '/');
});

test('route policy splits immutable reserved and migratable managed routes', () => {
  assert.equal(isReservedPageV2Route('/channels'), true);
  assert.equal(isReservedPageV2Route('/channels/whatsapp'), true);
  assert.equal(isReservedPageV2Route('/compare/respond-io'), true);
  assert.equal(isReservedPageV2Route('/pricing'), true);
  assert.equal(isReservedPageV2Route('/promo'), true);
  assert.equal(isReservedPageV2Route('/site-map'), true);
  assert.equal(isReservedPageV2Route('/new-product-page'), false);

  assert.equal(isImmutableReservedPageV2Route('/channels'), true);
  assert.equal(isImmutableReservedPageV2Route('/channels/whatsapp'), true);
  assert.equal(isImmutableReservedPageV2Route('/compare/respond-io'), true);
  assert.equal(isImmutableReservedPageV2Route('/pricing'), false);
  assert.equal(isImmutableReservedPageV2Route('/promo'), false);
  assert.equal(isImmutableReservedPageV2Route('/site-map'), true);

  assert.equal(isMigratableManagedPageV2Route('/'), true);
  assert.equal(isMigratableManagedPageV2Route('/pricing'), true);
  assert.equal(isMigratableManagedPageV2Route('/promo'), true);
  assert.equal(isMigratableManagedPageV2Route('/channels'), false);
  assert.equal(isMigratableManagedPageV2Route('/channels/whatsapp'), false);

  assert.equal(canPageV2UseRoute('/pricing'), true);
  assert.equal(canPageV2UseRoute('/promo'), true);
  assert.equal(canPageV2UseRoute('/new-product-page'), true);
  assert.equal(canPageV2UseRoute('/channels'), false);
  assert.equal(canPageV2UseRoute('/compare/respond-io'), false);
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

test('page-v2 schema enables draftAndPublish', () => {
  const pageV2Schema = JSON.parse(
    readFileSync('cms/src/api/page-v2/content-types/page-v2/schema.json', 'utf8'),
  );

  assert.equal(pageV2Schema.options.draftAndPublish, true);
});
