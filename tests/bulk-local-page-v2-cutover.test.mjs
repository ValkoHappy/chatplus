import test from 'node:test';
import assert from 'node:assert/strict';

import { parseArgs, readStatusSnapshot, runBulkCutover } from '../scripts/bulk-local-page-v2-cutover.mjs';

test('bulk local cutover parseArgs reads activation and routes', () => {
  const options = parseArgs(['--activate-all-safe', '--routes=/promo,/pricing', '--json']);

  assert.equal(options.activateAllSafe, true);
  assert.equal(options.rollbackAll, false);
  assert.equal(options.json, true);
  assert.equal(options.unsafeAllowAllRoutes, false);
  assert.deepEqual(options.routes, ['/promo', '/pricing']);
});

test('bulk local cutover parseArgs reads rollback mode', () => {
  const options = parseArgs(['--rollback-all']);

  assert.equal(options.activateAllSafe, false);
  assert.equal(options.rollbackAll, true);
});

test('bulk local cutover parseArgs reads unsafe full activation flag', () => {
  const options = parseArgs(['--activate-all-safe', '--unsafe-allow-all-routes']);

  assert.equal(options.activateAllSafe, true);
  assert.equal(options.unsafeAllowAllRoutes, true);
  assert.deepEqual(options.routes, []);
});

test('bulk local cutover parseArgs reads mark-not-ready routes file', () => {
  const options = parseArgs(['--mark-not-ready-routes-file=.tmp-parity.json', '--json']);

  assert.equal(options.activateAllSafe, false);
  assert.equal(options.rollbackAll, false);
  assert.equal(options.json, true);
  assert.equal(options.markNotReadyRoutesFile, '.tmp-parity.json');
});

test('bulk local cutover readStatusSnapshot reports filtered totals from a fresh session', async () => {
  const calls = [];
  const createStrapiFactory = () => ({
    load: async () => {},
    destroy: async () => {},
    documents: () => ({
      findMany: async ({ status, filters }) => {
        calls.push({ status, filters });
        if (status === 'draft') {
          return [{ documentId: 'a' }, { documentId: 'b' }];
        }
        return [{ documentId: 'a' }];
      },
    }),
  });

  const snapshot = await readStatusSnapshot({ routes: ['/promo', '/pricing'], createStrapiFactory });

  assert.deepEqual(snapshot, {
    draft_total: 2,
    published_total: 1,
  });
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].filters, { route_path: { $in: ['/promo', '/pricing'] } });
  assert.deepEqual(calls[1].filters, { route_path: { $in: ['/promo', '/pricing'] } });
});

test('bulk local cutover refuses full activation without explicit unsafe flag', async () => {
  await assert.rejects(
    () => runBulkCutover({ activateAllSafe: true, routes: [] }),
    /Refusing to activate all routes at once/,
  );
});
