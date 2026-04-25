import test from 'node:test';
import assert from 'node:assert/strict';

import { buildMaterializeArgs, parseArgs } from '../scripts/smoke-local-page-v2-cutover.mjs';

test('cutover smoke parseArgs reads base url and routes', () => {
  const options = parseArgs(['--base-url=http://127.0.0.1:3000/', '--routes=/promo,/pricing', '--json']);

  assert.equal(options.baseUrl, 'http://127.0.0.1:3000');
  assert.deepEqual(options.routes, ['/promo', '/pricing']);
  assert.equal(options.json, true);
});

test('buildMaterializeArgs builds the expected publish command', () => {
  assert.deepEqual(buildMaterializeArgs('/promo', 'publish'), [
    'run',
    'page-v2:materialize',
    '--',
    '--route=/promo',
    '--publish',
  ]);
});

test('buildMaterializeArgs rejects unsupported actions', () => {
  assert.throws(() => buildMaterializeArgs('/promo', 'oops'), /Unsupported action/);
});
