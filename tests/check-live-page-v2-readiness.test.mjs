import test from 'node:test';
import assert from 'node:assert/strict';

import { classifyCheck, parseArgs, runChecks } from '../scripts/check-live-page-v2-readiness.mjs';

test('parseArgs reads json flag and timeout override', () => {
  const options = parseArgs(['--json', '--timeout-ms=5000']);

  assert.equal(options.json, true);
  assert.equal(options.timeoutMs, 5000);
});

test('parseArgs ignores invalid timeout values', () => {
  const options = parseArgs(['--timeout-ms=oops']);

  assert.equal(options.json, false);
  assert.equal(options.timeoutMs, 15000);
});

test('classifyCheck returns ok for successful checks', () => {
  assert.equal(classifyCheck({ ok: true, required: true }), 'ok');
});

test('classifyCheck returns failed for required failed checks', () => {
  assert.equal(classifyCheck({ ok: false, required: true }), 'failed');
});

test('classifyCheck returns warning for optional failed checks', () => {
  assert.equal(classifyCheck({ ok: false, required: false }), 'warning');
});

test('runChecks fails readiness when STRAPI_TOKEN is missing', async () => {
  const checks = await runChecks(
    { timeoutMs: 50, json: false },
    { STRAPI_URL: 'https://strapi.example.com' },
  );

  assert.equal(checks.some((check) => check.name === 'STRAPI_TOKEN configured' && check.required && !check.ok), true);
});
