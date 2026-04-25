import test from 'node:test';
import assert from 'node:assert/strict';

import {
  parseArgs,
  summarizePages,
  summarizeRepresentativeRoutes,
} from '../scripts/check-local-page-v2-audit.mjs';

test('parseArgs reads json and custom routes', () => {
  const options = parseArgs(['--json', '--routes=/promo,/pricing']);

  assert.equal(options.json, true);
  assert.deepEqual(options.routes, ['/promo', '/pricing']);
});

test('parseArgs keeps default routes when custom routes are empty', () => {
  const options = parseArgs(['--routes=']);

  assert.equal(options.routes.includes('/promo'), true);
  assert.equal(options.routes.includes('/site-map'), true);
});

test('summarizePages counts approval and parity buckets', () => {
  const summary = summarizePages([
    { editorial_status: 'approved', migration_ready: true, parity_status: 'approved' },
    { editorial_status: 'approved', migration_ready: false, parity_status: 'unchecked' },
    { editorial_status: 'review', migration_ready: false, parity_status: 'needs_work' },
  ]);

  assert.deepEqual(summary, {
    total: 3,
    approved_ready: 1,
    approved_not_ready: 1,
    needs_work: 1,
    unchecked: 1,
  });
});

test('summarizeRepresentativeRoutes trims route rows to status fields', () => {
  const rows = summarizeRepresentativeRoutes([
    {
      route: '/promo',
      draft: { editorial_status: 'approved', migration_ready: false, parity_status: 'unchecked', title: 'Promo' },
      published: null,
    },
  ]);

  assert.deepEqual(rows, [
    {
      route: '/promo',
      draft: {
        editorial_status: 'approved',
        migration_ready: false,
        parity_status: 'unchecked',
      },
      published: null,
    },
  ]);
});
