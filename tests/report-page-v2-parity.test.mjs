import assert from 'node:assert/strict';
import test from 'node:test';

import {
  analyzePageV2LegacyParity,
  summarizePageV2Parity,
} from '../scripts/report-page-v2-parity.mjs';

test('analyzePageV2LegacyParity keeps comparison directory clean when bridge exposes all migrated sections', () => {
  const result = analyzePageV2LegacyParity({
    route_path: '/compare',
    title: 'Compare',
    seo_title: 'Compare',
    seo_description: 'Compare alternatives.',
    legacy_template_family: 'comparison_directory',
    migration_ready: false,
    parity_status: 'unchecked',
    sections: [
      {
        __component: 'page-blocks.hero',
        block_type: 'hero',
        title: 'Compare',
        subtitle: 'Compare alternatives.',
      },
      {
        __component: 'page-blocks.cards-grid',
        block_type: 'cards-grid',
        title: 'Detailed comparisons',
        items: [{ title: 'Intercom', href: '/compare/intercom', text: 'Compare Intercom.' }],
      },
      {
        __component: 'page-blocks.comparison-table',
        block_type: 'comparison-table',
        title: 'Matrix',
        rows: [{ parameter: 'Ownership', option_one: 'Legacy', option_two: 'Mixed', option_highlight: 'CMS' }],
      },
      {
        __component: 'page-blocks.faq',
        block_type: 'faq',
        title: 'Questions',
        items: [{ question: 'Is it visible?', answer: 'It should be reported if not.' }],
      },
      {
        __component: 'page-blocks.internal-links',
        block_type: 'internal-links',
        title: 'Vs pages',
        links: [{ label: 'Intercom or Chat Plus', href: '/vs/intercom', description: 'Short comparison.' }],
      },
      {
        __component: 'page-blocks.final-cta',
        block_type: 'final-cta',
        title: 'Choose safely',
        primary_label: 'Demo',
        primary_url: '/demo',
      },
    ],
  });

  assert.equal(result.routePath, '/compare');
  assert.equal(result.missingRequiredBlocks.length, 0);
  assert.deepEqual(result.bridgeLosses, []);
});

test('analyzePageV2LegacyParity reports directory cards that cannot reach the legacy renderer', () => {
  const result = analyzePageV2LegacyParity({
    route_path: '/features',
    title: 'Features',
    seo_title: 'Features',
    seo_description: 'Feature catalog.',
    legacy_template_family: 'directory',
    migration_ready: false,
    parity_status: 'unchecked',
    sections: [
      {
        __component: 'page-blocks.hero',
        title: 'Features',
      },
      {
        __component: 'page-blocks.cards-grid',
        title: 'Features',
        items: [{ title: 'AI agents', text: 'Automate the first line.' }],
      },
      {
        __component: 'page-blocks.final-cta',
        title: 'Request demo',
        primary_label: 'Demo',
        primary_url: '/demo',
      },
    ],
  });

  assert.ok(result.bridgeLosses.some((loss) => loss.block === 'page-blocks.cards-grid'));
});

test('analyzePageV2LegacyParity keeps structured pages clean when blocks reach legacy shape', () => {
  const result = analyzePageV2LegacyParity({
    route_path: '/channels/email/amocrm',
    title: 'Email with AmoCRM',
    seo_title: 'Email with AmoCRM',
    seo_description: 'Email and AmoCRM scenario.',
    legacy_template_family: 'entity_intersection',
    migration_ready: false,
    parity_status: 'unchecked',
    sections: [
      {
        __component: 'page-blocks.hero',
        block_type: 'hero',
        title: 'Email with AmoCRM',
        subtitle: 'CRM gets full context.',
      },
      {
        __component: 'page-blocks.cards-grid',
        block_type: 'cards-grid',
        variant: 'problems',
        title: 'Problems',
        items: [{ title: 'Manual copy', text: 'Managers copy data by hand.' }],
      },
      {
        __component: 'page-blocks.steps',
        block_type: 'steps',
        title: 'Flow',
        items: [{ title: 'Connect channel', text: 'Set up routing.' }],
      },
      {
        __component: 'page-blocks.feature-list',
        block_type: 'feature-list',
        title: 'Included',
        items: [{ title: 'CRM sync', text: 'Every lead is synced.' }],
      },
      {
        __component: 'page-blocks.related-links',
        block_type: 'related-links',
        title: 'More',
        links: [{ label: 'Email', href: '/channels/email', description: 'Email channel.' }],
      },
      {
        __component: 'page-blocks.faq',
        block_type: 'faq',
        title: 'FAQ',
        items: [{ question: 'Fast?', answer: 'Yes.' }],
      },
      {
        __component: 'page-blocks.internal-links',
        block_type: 'internal-links',
        title: 'Next',
        links: [{ label: 'Pricing', href: '/pricing', description: 'Plans.' }],
      },
      {
        __component: 'page-blocks.final-cta',
        block_type: 'final-cta',
        title: 'Start',
        primary_label: 'Demo',
        primary_url: '/demo',
      },
    ],
  });

  assert.deepEqual(result.missingRequiredBlocks, []);
  assert.deepEqual(result.bridgeLosses, []);
});

test('analyzePageV2LegacyParity ignores home proof stats intentionally skipped as hero duplicates', () => {
  const result = analyzePageV2LegacyParity({
    route_path: '/',
    title: 'Home',
    seo_title: 'Home',
    seo_description: 'Home page.',
    legacy_template_family: 'home',
    migration_ready: true,
    parity_status: 'approved',
    sections: [
      {
        __component: 'page-blocks.hero',
        block_type: 'hero',
        title: 'Все каналы клиентов',
        subtitle: 'Один интерфейс.',
        trust_facts: [
          'Подключение за 15 минут',
          'WhatsApp, Telegram, Instagram, Viber, SMS и Email в одном интерфейсе',
        ],
      },
      {
        __component: 'page-blocks.proof-stats',
        block_type: 'proof-stats',
        title: 'Page proof',
        items: [
          { value: 'Подключение за 15 минут', label: 'Proof point' },
          { value: 'WhatsApp, Telegram, Instagram, Viber, SMS и Email в одном интерфейсе', label: 'Proof point' },
        ],
      },
      {
        __component: 'page-blocks.cards-grid',
        block_type: 'cards-grid',
        variant: 'problems',
        title: 'Problems',
        items: [{ title: 'Разные каналы', text: 'Команда теряет заявки.' }],
      },
      {
        __component: 'page-blocks.feature-list',
        block_type: 'feature-list',
        title: 'Features',
        items: [{ title: 'CRM sync', text: 'Данные синхронизируются.' }],
      },
      {
        __component: 'page-blocks.steps',
        block_type: 'steps',
        title: 'Steps',
        items: [{ title: 'Connect', text: 'Подключаем каналы.' }],
      },
      {
        __component: 'page-blocks.before-after',
        block_type: 'before-after',
        title: 'Before after',
        before_items: [{ title: 'До', text: 'Разрозненно.' }],
        after_items: [{ title: 'После', text: 'В одном окне.' }],
      },
      {
        __component: 'page-blocks.faq',
        block_type: 'faq',
        title: 'FAQ',
        items: [{ question: 'Можно?', answer: 'Да.' }],
      },
      {
        __component: 'page-blocks.internal-links',
        block_type: 'internal-links',
        title: 'Next',
        links: [{ label: 'Pricing', href: '/pricing', description: 'Plans.' }],
      },
      {
        __component: 'page-blocks.final-cta',
        block_type: 'final-cta',
        title: 'Start',
        primary_label: 'Demo',
        primary_url: '/demo',
      },
    ],
  });

  assert.deepEqual(result.missingRequiredBlocks, []);
  assert.deepEqual(result.bridgeLosses, []);
});

test('summarizePageV2Parity counts losses and not-ready routes separately', () => {
  const summary = summarizePageV2Parity([
    {
      routePath: '/a',
      family: 'resource',
      migrationReady: false,
      parityStatus: 'unchecked',
      missingRequiredBlocks: [],
      bridgeLosses: [{ block: 'page-blocks.faq', reason: 'not mapped' }],
    },
    {
      routePath: '/b',
      family: 'pricing',
      migrationReady: true,
      parityStatus: 'approved',
      missingRequiredBlocks: ['page-blocks.pricing-plans'],
      bridgeLosses: [],
    },
  ]);

  assert.equal(summary.total, 2);
  assert.equal(summary.notReady, 1);
  assert.equal(summary.withBridgeLosses, 1);
  assert.equal(summary.withMissingRequiredBlocks, 1);
  assert.deepEqual(summary.byFamily.resource, { total: 1, withBridgeLosses: 1, withMissingRequiredBlocks: 0 });
});
