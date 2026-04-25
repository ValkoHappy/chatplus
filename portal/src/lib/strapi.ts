import { inferLandingPageLinkSectionProps } from './link-sections.ts';
import {
  normalizeCatalogItems,
  normalizeLandingPageRecord,
  normalizePageV2Record,
  normalizeSiteSettingsRecord,
  parseCollectionData,
  parseSingleData,
  type StrapiRecord,
} from './strapi-schemas.ts';
import {
  isImmutableReservedPageV2Route,
  normalizePageV2RoutePath,
  shouldGeneratePageV2CatchAllRoute,
} from '../../../config/page-v2-routes.mjs';
import { mapPageV2ToLegacyPage, type LegacyPageFamily } from './page-v2-legacy-bridge.ts';

const ASTRO_ENV = import.meta.env || {};
const STRAPI_URL = ASTRO_ENV.STRAPI_URL || 'http://127.0.0.1:1337';
const STRAPI_TOKEN = ASTRO_ENV.STRAPI_TOKEN || '';

let siteSettingsPromise: Promise<ReturnType<typeof normalizeSiteSettingsRecord>> | undefined;
let pageV2Promise: Promise<ReturnType<typeof normalizePageV2Record>[]> | undefined;

const PAGE_V2_POPULATE_QUERY = [
  'populate[sections][populate]=*',
  'populate[breadcrumbs][populate]=*',
  'populate[internal_links][populate]=*',
  'populate[parent_page][populate]=*',
].join('&');

export function isPageV2Renderable(page: ReturnType<typeof normalizePageV2Record>) {
  return page.is_migration_visible === true;
}

async function request(path: string): Promise<unknown> {
  try {
    const hasPopulate = /(?:\?|&)populate(?:=|\[)/.test(path);
    const separator = path.includes('?') ? '&' : '?';
    const populateSuffix = hasPopulate ? '' : `${separator}populate=*`;
    const res = await fetch(`${STRAPI_URL}/api${path}${populateSuffix}`, {
      headers: STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {},
    });

    if (!res.ok) {
      console.error(`Strapi request failed for ${path}: ${res.status}`);
      return null;
    }

    return await res.json();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Fetch to Strapi failed for ${path}:`, message);
    return null;
  }
}

async function fetchCollection(path: string, pageSize = 100, options?: { allowEmpty?: boolean }) {
  const safePageSize = Math.min(pageSize, 100);
  const records: StrapiRecord[] = [];
  let page = 1;
  let pageCount = 1;

  do {
    const json = await request(`${path}${path.includes('?') ? '&' : '?'}pagination[page]=${page}&pagination[pageSize]=${safePageSize}`);

    if (!json) {
      if (options?.allowEmpty && page === 1) {
        return [];
      }

      throw new Error(`Strapi returned no data for ${path}`);
    }

    records.push(...parseCollectionData(json, path, options));

    const meta = json && typeof json === 'object' && 'meta' in json ? (json as { meta?: { pagination?: { pageCount?: number } } }).meta : undefined;
    pageCount = Number(meta?.pagination?.pageCount || 1);
    page += 1;
  } while (page <= pageCount);

  return records;
}

async function fetchSingle(path: string) {
  const json = await request(path);

  if (!json) {
    throw new Error(`Strapi returned no data for ${path}`);
  }

  return parseSingleData(json, path);
}

function normalizeLandingPage(data: StrapiRecord, slugHint?: string) {
  const normalized = normalizeLandingPageRecord(data, slugHint);
  const slug = normalized.slug || slugHint || '';
  const inferredLinkSections = inferLandingPageLinkSectionProps(slug);

  return {
    ...normalized,
    internal_links_context: {
      ...(normalized.internal_links_context || {}),
      pageSlug: normalized.slug || inferredLinkSections.internal_links_context?.pageSlug,
    },
    internal_links_variant: normalized.internal_links_variant || inferredLinkSections.internal_links_variant,
  };
}

export async function getChannels() {
  return normalizeCatalogItems(await fetchCollection('/channels'));
}

export async function getIndustries() {
  return normalizeCatalogItems(await fetchCollection('/industries'));
}

export async function getIntegrations() {
  return normalizeCatalogItems(await fetchCollection('/integrations'));
}

export async function getSolutions() {
  return normalizeCatalogItems(await fetchCollection('/solutions'));
}

export async function getFeatures() {
  return normalizeCatalogItems(await fetchCollection('/features'));
}

export async function getBusinessTypes() {
  const data = normalizeCatalogItems(await fetchCollection('/business-types'));
  return data.map((item) => ({
    ...item,
    hero_eyebrow: typeof item.hero_eyebrow === 'string' ? item.hero_eyebrow : '',
    hero_title: typeof item.hero_title === 'string' ? item.hero_title : '',
    hero_secondary_cta_label: typeof item.hero_secondary_cta_label === 'string' ? item.hero_secondary_cta_label : '',
    hero_secondary_cta_url: typeof item.hero_secondary_cta_url === 'string' ? item.hero_secondary_cta_url : '',
    problem_title: typeof item.problem_title === 'string' ? item.problem_title : '',
    solution_title: typeof item.solution_title === 'string' ? item.solution_title : '',
    features_title: typeof item.features_title === 'string' ? item.features_title : '',
    steps_title: typeof item.steps_title === 'string' ? item.steps_title : '',
    integrations_title: typeof item.integrations_title === 'string' ? item.integrations_title : '',
    integrations_intro: typeof item.integrations_intro === 'string' ? item.integrations_intro : '',
    integrations_more_text: typeof item.integrations_more_text === 'string' ? item.integrations_more_text : '',
    roi_title: typeof item.roi_title === 'string' ? item.roi_title : '',
    roi_intro: typeof item.roi_intro === 'string' ? item.roi_intro : '',
    roi_quote: typeof item.roi_quote === 'string' ? item.roi_quote : '',
    roi_quote_author: typeof item.roi_quote_author === 'string' ? item.roi_quote_author : '',
    faq_title: typeof item.faq_title === 'string' ? item.faq_title : '',
    related_types_title: typeof item.related_types_title === 'string' ? item.related_types_title : '',
    related_links_intro: typeof item.related_links_intro === 'string' ? item.related_links_intro : '',
    pricing_link_label: typeof item.pricing_link_label === 'string' ? item.pricing_link_label : '',
    final_cta_title: typeof item.final_cta_title === 'string' ? item.final_cta_title : '',
    final_cta_text: typeof item.final_cta_text === 'string' ? item.final_cta_text : '',
    final_cta_label: typeof item.final_cta_label === 'string' ? item.final_cta_label : '',
  }));
}

export async function getBusinessTypesPage() {
  return fetchSingle('/business-types-page');
}

export async function getCompetitors() {
  const data = normalizeCatalogItems(await fetchCollection('/competitors'));
  return data.map((item) => ({
    ...item,
    record_mode: typeof item.record_mode === 'string' && item.record_mode ? item.record_mode : 'imported',
    content_origin: typeof item.content_origin === 'string' && item.content_origin ? item.content_origin : 'generated',
    our_price: typeof item.our_price === 'string' ? item.our_price : '',
    eyebrow: typeof item.eyebrow === 'string' ? item.eyebrow : '',
    hero_eyebrow: typeof item.hero_eyebrow === 'string' && item.hero_eyebrow ? item.hero_eyebrow : typeof item.eyebrow === 'string' ? item.eyebrow : '',
    hero_title: typeof item.hero_title === 'string' ? item.hero_title : '',
    hero_description: typeof item.hero_description === 'string' ? item.hero_description : '',
    compare_summary: typeof item.compare_summary === 'string' ? item.compare_summary : '',
    compare_points: Array.isArray(item.compare_points) ? item.compare_points : [],
    pricing_title: typeof item.pricing_title === 'string' ? item.pricing_title : '',
    our_price_label: typeof item.our_price_label === 'string' ? item.our_price_label : '',
    our_price_caption: typeof item.our_price_caption === 'string' ? item.our_price_caption : '',
    competitor_price_caption: typeof item.competitor_price_caption === 'string' ? item.competitor_price_caption : '',
    strengths_title: typeof item.strengths_title === 'string' ? item.strengths_title : '',
    advantages_title: typeof item.advantages_title === 'string' ? item.advantages_title : '',
    advantages_intro: typeof item.advantages_intro === 'string' ? item.advantages_intro : '',
    weaknesses_title: typeof item.weaknesses_title === 'string' ? item.weaknesses_title : '',
    faq_title: typeof item.faq_title === 'string' ? item.faq_title : '',
    sticky_cta_title: typeof item.sticky_cta_title === 'string' ? item.sticky_cta_title : '',
    sticky_cta_text: typeof item.sticky_cta_text === 'string' ? item.sticky_cta_text : '',
    section_labels: item.section_labels && typeof item.section_labels === 'object' && !Array.isArray(item.section_labels) ? item.section_labels : {},
    final_cta_title: typeof item.final_cta_title === 'string' ? item.final_cta_title : '',
    final_cta_text: typeof item.final_cta_text === 'string' ? item.final_cta_text : '',
    final_cta_label: typeof item.final_cta_label === 'string' ? item.final_cta_label : '',
  }));
}

export async function getTendersPage() {
  return normalizeLandingPage(
    {
      ...(await fetchSingle('/tenders-page')),
      internal_links_variant: 'next_steps',
      internal_links_context: {
        entityType: 'generic',
        pageSlug: 'tenders',
      },
    },
    'tenders',
  );
}

export async function getLandingPage(slug: string) {
  const data = await fetchCollection(`/landing-pages?filters[slug][$eq]=${encodeURIComponent(slug)}`);
  return normalizeLandingPage(data[0], slug);
}

export async function getSiteSettings() {
  if (ASTRO_ENV.DEV) {
    return normalizeSiteSettingsRecord(await fetchSingle('/site-setting'));
  }

  if (!siteSettingsPromise) {
    siteSettingsPromise = fetchSingle('/site-setting')
      .then((data) => normalizeSiteSettingsRecord(data))
      .catch((err) => {
        siteSettingsPromise = undefined;
        throw err;
      });
  }

  return siteSettingsPromise;
}

export async function getPageV2Pages() {
  if (ASTRO_ENV.DEV) {
    return (await fetchCollection(`/page-v2s?${PAGE_V2_POPULATE_QUERY}`, 100, { allowEmpty: true }))
      .map((item) => normalizePageV2Record(item))
      .filter((item) => isPageV2Renderable(item));
  }

  if (!pageV2Promise) {
    pageV2Promise = fetchCollection(`/page-v2s?${PAGE_V2_POPULATE_QUERY}`, 100, { allowEmpty: true })
      .then((data) => data.map((item) => normalizePageV2Record(item)).filter((item) => isPageV2Renderable(item)))
      .catch((err) => {
        pageV2Promise = undefined;
        throw err;
      });
  }

  return pageV2Promise;
}

export async function getPageV2ByRoute(routePath: string) {
  const normalizedRoutePath = normalizePageV2RoutePath(routePath);
  const pages = await getPageV2Pages();
  return pages.find((page) => page.route_path === normalizedRoutePath) || null;
}

export async function getManagedRoutePage<T>(routePath: string, legacyLoader: () => Promise<T>) {
  const pageV2 = await getPageV2ByRoute(routePath);
  if (pageV2) {
    return {
      kind: 'page_v2' as const,
      page: pageV2,
    };
  }

  return {
    kind: 'legacy' as const,
    page: await legacyLoader(),
  };
}

export async function getPageV2ByRouteForLegacyRenderer<T>(routePath: string, family: LegacyPageFamily) {
  const pageV2 = await getPageV2ByRoute(routePath);
  if (!pageV2) {
    return null;
  }

  return mapPageV2ToLegacyPage(pageV2, family) as T;
}

export async function getManagedRoutePageForLegacyRenderer<T>(
  routePath: string,
  legacyLoader: () => Promise<T>,
  family: LegacyPageFamily,
) {
  const pageV2 = await getPageV2ByRoute(routePath);
  if (pageV2) {
    return mapPageV2ToLegacyPage(pageV2, family) as T;
  }

  return legacyLoader();
}

export async function getPublishedPageV2Routes() {
  const pages = await getPageV2Pages();

  for (const page of pages) {
    if (isImmutableReservedPageV2Route(page.route_path)) {
      throw new Error(`page_v2 route collision detected for reserved path ${page.route_path}`);
    }
  }

  return pages.filter((page) => shouldGeneratePageV2CatchAllRoute(page.route_path));
}
