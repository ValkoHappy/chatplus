import assert from 'node:assert/strict';
import test from 'node:test';

import { buildRollbackDraftPayload, parseArgs } from '../scripts/rollback-page-v2-version.mjs';

test('rollback parseArgs reads route and apply flag', () => {
  const options = parseArgs(['--route=/promo', '--apply']);

  assert.deepEqual(options, {
    apply: true,
    versionId: '',
    pageRoute: '/promo',
  });
});

test('buildRollbackDraftPayload forces safe draft state for restored page', () => {
  const payload = buildRollbackDraftPayload({
    id: 10,
    documentId: 'page-doc-1',
    route_path: '/promo',
    editorial_status: 'approved',
    migration_ready: true,
    parity_status: 'approved',
    publishedAt: '2026-04-23T00:00:00.000Z',
    createdAt: '2026-04-23T00:00:00.000Z',
    updatedAt: '2026-04-23T00:00:00.000Z',
  });

  assert.deepEqual(payload, {
    route_path: '/promo',
    editorial_status: 'review',
    migration_ready: false,
    parity_status: 'unchecked',
  });
});
