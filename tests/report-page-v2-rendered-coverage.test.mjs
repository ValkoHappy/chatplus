import assert from 'node:assert/strict';
import test from 'node:test';

import { markersForSection, normalizeCoverageMarkers } from '../scripts/report-page-v2-rendered-coverage.mjs';

test('rendered coverage ignores editor-only section labels but keeps visible payload markers', () => {
  const markers = markersForSection({
    __component: 'page-blocks.related-links',
    title: 'Related comparison pages',
    links: [
      { label: 'All comparisons', href: '/compare' },
      { label: 'Respond.io vs Chat Plus', href: '/compare/respond-io' },
    ],
  });

  assert.deepEqual(markers, [
    { kind: 'page-blocks.related-links:link', text: 'All comparisons', href: '/compare' },
    { kind: 'page-blocks.related-links:link', text: 'Respond.io vs Chat Plus', href: '/compare/respond-io' },
  ]);
});

test('rendered coverage follows link dedupe rules used by legacy bridge', () => {
  const markers = normalizeCoverageMarkers(
    [
      { kind: 'page-blocks.related-links:link', text: 'Салоны красоты', href: '/channels/viber/beauty' },
      { kind: 'page-blocks.internal-links:link', text: 'Viber for Салоны красоты', href: '/channels/viber/beauty' },
      { kind: 'page-blocks.related-links:link', text: 'Respond.io vs Chat Plus', href: '/vs/respond-io' },
      { kind: 'page-blocks.internal-links:link', text: 'Все сравнения', href: '/compare' },
    ],
    '/compare/respond-io'
  );

  assert.deepEqual(markers, [
    { kind: 'page-blocks.related-links:link', text: 'Салоны красоты', href: '/channels/viber/beauty' },
    { kind: 'page-blocks.internal-links:link', text: 'Все сравнения', href: '/compare' },
  ]);
});

test('rendered coverage ignores technical FAQ titles but keeps real questions', () => {
  const markers = markersForSection({
    __component: 'page-blocks.faq',
    title: 'Comparison FAQ',
    items: [
      { question: 'Частые вопросы', answer: 'Реальный вопрос должен проверяться.' },
      { question: 'Можно ли сравнить Respond.io?', answer: 'Да.' },
    ],
  });

  assert.deepEqual(markers, [
    { kind: 'page-blocks.faq:question', text: 'Частые вопросы' },
    { kind: 'page-blocks.faq:question', text: 'Можно ли сравнить Respond.io?' },
  ]);
});
