import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getSearchAnalyticsConfig,
  isAnalyticsEnabled,
} from '../portal/src/lib/search-analytics.ts';

test('getSearchAnalyticsConfig trims verification codes and accepts known counter ids', () => {
  const config = getSearchAnalyticsConfig({
    PUBLIC_GOOGLE_SITE_VERIFICATION: ' google-token ',
    PUBLIC_YANDEX_SITE_VERIFICATION: ' yandex-token ',
    PUBLIC_YANDEX_METRIKA_ID: ' 12345678 ',
    PUBLIC_GOOGLE_TAG_ID: ' G-ABC123XYZ ',
    PUBLIC_YANDEX_METRIKA_WEBVISOR: 'true',
  });

  assert.equal(config.googleSiteVerification, 'google-token');
  assert.equal(config.yandexSiteVerification, 'yandex-token');
  assert.equal(config.yandexMetrikaId, '12345678');
  assert.equal(config.googleTagId, 'G-ABC123XYZ');
  assert.equal(config.yandexMetrikaWebvisor, true);
  assert.equal(isAnalyticsEnabled(config), true);
});

test('getSearchAnalyticsConfig prefers GTM when both Google tag modes are set', () => {
  const config = getSearchAnalyticsConfig({
    PUBLIC_GOOGLE_TAG_ID: 'G-ABC123XYZ',
    PUBLIC_GOOGLE_TAG_MANAGER_ID: 'GTM-ABC1234',
  });

  assert.equal(config.googleTagManagerId, 'GTM-ABC1234');
  assert.equal(config.googleTagId, undefined);
});

test('getSearchAnalyticsConfig drops invalid public analytics ids', () => {
  const config = getSearchAnalyticsConfig({
    PUBLIC_YANDEX_METRIKA_ID: 'abc',
    PUBLIC_GOOGLE_TAG_ID: 'javascript:alert(1)',
    PUBLIC_GOOGLE_TAG_MANAGER_ID: 'GTM-',
  });

  assert.equal(config.yandexMetrikaId, undefined);
  assert.equal(config.googleTagId, undefined);
  assert.equal(config.googleTagManagerId, undefined);
  assert.equal(isAnalyticsEnabled(config), false);
});
