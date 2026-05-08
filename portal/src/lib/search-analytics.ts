export type PublicSearchAnalyticsEnv = Record<string, string | boolean | undefined>;

export interface SearchAnalyticsConfig {
  googleSiteVerification?: string;
  yandexSiteVerification?: string;
  yandexMetrikaId?: string;
  yandexMetrikaWebvisor: boolean;
  googleTagId?: string;
  googleTagManagerId?: string;
}

function clean(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function cleanByPattern(value: unknown, pattern: RegExp): string | undefined {
  const trimmed = clean(value);
  return trimmed && pattern.test(trimmed) ? trimmed : undefined;
}

function readBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return false;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

export function getSearchAnalyticsConfig(env: PublicSearchAnalyticsEnv): SearchAnalyticsConfig {
  const googleTagManagerId = cleanByPattern(env.PUBLIC_GOOGLE_TAG_MANAGER_ID, /^GTM-[A-Z0-9_-]{4,}$/i);

  return {
    googleSiteVerification: clean(env.PUBLIC_GOOGLE_SITE_VERIFICATION),
    yandexSiteVerification: clean(env.PUBLIC_YANDEX_SITE_VERIFICATION),
    yandexMetrikaId: cleanByPattern(env.PUBLIC_YANDEX_METRIKA_ID, /^\d{4,}$/),
    yandexMetrikaWebvisor: readBoolean(env.PUBLIC_YANDEX_METRIKA_WEBVISOR),
    googleTagManagerId,
    googleTagId: googleTagManagerId
      ? undefined
      : cleanByPattern(env.PUBLIC_GOOGLE_TAG_ID, /^(G|AW|DC)-[A-Z0-9_-]{4,}$/i),
  };
}

export function isAnalyticsEnabled(config: SearchAnalyticsConfig): boolean {
  return Boolean(config.yandexMetrikaId || config.googleTagId || config.googleTagManagerId);
}
