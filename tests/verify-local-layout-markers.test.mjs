import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
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
  const distRoot = existsSync(path.join('portal', 'dist', 'client'))
    ? path.join('portal', 'dist', 'client')
    : path.join('portal', 'dist');

  assert.equal(routeToDistFile('/'), path.join(distRoot, 'index.html'));
  assert.equal(routeToDistFile('/promo'), path.join(distRoot, 'promo', 'index.html'));
  assert.equal(
    routeToDistFile('/channels/email/amocrm'),
    path.join(distRoot, 'channels', 'email', 'amocrm', 'index.html'),
  );
});
