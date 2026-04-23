import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeInternalPath,
  shouldRedirectTrailingSlash,
  stripBasePath,
  withBasePath,
} from '../portal/src/lib/urls.ts';

test('normalizeInternalPath keeps root but strips trailing slashes from internal routes', () => {
  assert.equal(normalizeInternalPath('/'), '/');
  assert.equal(normalizeInternalPath('/solutions/'), '/solutions');
  assert.equal(normalizeInternalPath('promo/'), '/promo');
  assert.equal(normalizeInternalPath('/promo/?utm=1'), '/promo?utm=1');
});

test('withBasePath keeps canonical internal hrefs without trailing slash', () => {
  assert.equal(withBasePath('/promo/'), '/promo');
  assert.equal(withBasePath('solutions/', '/base/'), '/base/solutions');
  assert.equal(withBasePath('/?utm=1'), '/?utm=1');
});

test('stripBasePath normalizes trailing slash after removing base path', () => {
  assert.equal(stripBasePath('/promo/'), '/promo');
  assert.equal(stripBasePath('/base/solutions/', '/base/'), '/solutions');
  assert.equal(stripBasePath('/base/', '/base/'), '/');
});

test('shouldRedirectTrailingSlash redirects only route-like paths with a trailing slash', () => {
  assert.equal(shouldRedirectTrailingSlash('/promo/'), true);
  assert.equal(shouldRedirectTrailingSlash('/solutions/'), true);
  assert.equal(shouldRedirectTrailingSlash('/'), false);
  assert.equal(shouldRedirectTrailingSlash('/favicon.ico'), false);
  assert.equal(shouldRedirectTrailingSlash('/assets/logo.svg'), false);
});
