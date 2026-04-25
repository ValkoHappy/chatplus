import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import { parseArgs, routeToDistFile } from '../scripts/verify-local-layout-markers.mjs';

test('layout marker smoke parseArgs reads route list and smoke flags', () => {
  const options = parseArgs(['--routes=/promo,/pricing', '--keep-approved', '--json', '--skip-build']);

  assert.deepEqual(options.routes, ['/promo', '/pricing']);
  assert.equal(options.keepApproved, true);
  assert.equal(options.json, true);
  assert.equal(options.skipBuild, true);
});

test('routeToDistFile maps routes to built Astro html files', () => {
  assert.equal(routeToDistFile('/'), path.join('portal', 'dist', 'index.html'));
  assert.equal(routeToDistFile('/promo'), path.join('portal', 'dist', 'promo', 'index.html'));
  assert.equal(
    routeToDistFile('/channels/email/amocrm'),
    path.join('portal', 'dist', 'channels', 'email', 'amocrm', 'index.html'),
  );
});
