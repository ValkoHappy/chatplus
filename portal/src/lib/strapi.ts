import { inferLandingPageLinkSectionProps } from './link-sections';
import { getLandingPageOverride } from './special-pages';

const STRAPI_URL = import.meta.env.STRAPI_URL || 'http://127.0.0.1:1337';
const STRAPI_TOKEN = import.meta.env.STRAPI_TOKEN || '';

let siteSettingsPromise: Promise<any> | undefined;

async function request(path: string) {
  try {
    const separator = path.includes('?') ? '&' : '?';
    const res = await fetch(`${STRAPI_URL}/api${path}${separator}populate=*`, {
      headers: STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {},
    });

    if (!res.ok) {
      console.error(`Strapi request failed for ${path}: ${res.status}`);
      return null;
    }

    return await res.json();
  } catch (error: any) {
    console.error(`Fetch to Strapi failed for ${path}:`, error.message);
    return null;
  }
}

async function fetchCollection(path: string) {
  const json = await request(`${path}${path.includes('?') ? '&' : '?'}pagination[pageSize]=100`);

  if (!json.data || json.data.length === 0) {
    throw new Error(`Strapi returned no data for ${path}`);
  }

  return json.data;
}

async function fetchSingle(path: string) {
  const json = await request(path);

  if (!json.data) {
    throw new Error(`Strapi returned no data for ${path}`);
  }

  return json.data;
}

function enrich(items: any[]) {
  return items.map((item) => ({
    ...item,
    icon: item.icon || 'lucide:message-circle',
    features: Array.isArray(item.features) ? item.features : [],
    faq: Array.isArray(item.faq) ? item.faq : [],
    steps: Array.isArray(item.steps) ? item.steps : [],
    roi_metrics: Array.isArray(item.roi_metrics) ? item.roi_metrics : [],
    problem_points: Array.isArray(item.problem_points) ? item.problem_points : [],
    solution_points: Array.isArray(item.solution_points) ? item.solution_points : [],
    integrations: Array.isArray(item.integrations) ? item.integrations : [],
    our_strengths: Array.isArray(item.our_strengths) ? item.our_strengths : [],
    weaknesses: Array.isArray(item.weaknesses) ? item.weaknesses : [],
    name: item.name || '',
    slug: item.slug || '',
    description: item.description || '',
    cta: item.cta || '',
    seo_title: item.seo_title || '',
    seo_description: item.seo_description || '',
    pain: item.pain || '',
    solution: item.solution || '',
    category: item.category || '',
  }));
}

function normalizeLandingPage(data: any, slugHint?: string) {
  const slug = data.slug || slugHint || '';
  const inferredLinkSections = inferLandingPageLinkSectionProps(slug);
  const override = getLandingPageOverride(slug) || {};

  const normalized = {
    ...data,
    hero_trust_facts: Array.isArray(data.hero_trust_facts) ? data.hero_trust_facts : [],
    target_keywords: Array.isArray(data.target_keywords) ? data.target_keywords : [],
    breadcrumb: Array.isArray(data.breadcrumb) ? data.breadcrumb : [],
    problems: Array.isArray(data.problems) ? data.problems : [],
    solution_steps: Array.isArray(data.solution_steps) ? data.solution_steps : [],
    features: Array.isArray(data.features) ? data.features : [],
    integration_blocks: Array.isArray(data.integration_blocks) ? data.integration_blocks : [],
    roi_without_items: Array.isArray(data.roi_without_items) ? data.roi_without_items : [],
    roi_with_items: Array.isArray(data.roi_with_items) ? data.roi_with_items : [],
    use_cases: Array.isArray(data.use_cases)
      ? data.use_cases.map((item: any) => ({
          ...item,
          title: item.title || item.audience || '',
          text: item.text || item.description || '',
        }))
      : [],
    comparison_rows: Array.isArray(data.comparison_rows)
      ? data.comparison_rows.map((row: any) => ({
          ...row,
          option_one: row.option_one || row.email_aggregator || '',
          option_two: row.option_two || row.mobile_aggregator || '',
          chat_plus: row.chat_plus || row.chatplus || '',
        }))
      : [],
    faqs: Array.isArray(data.faqs)
      ? data.faqs.map((item: any) => ({
          ...item,
          question: item.question || item.q || '',
          answer: item.answer || item.a || '',
        }))
      : [],
    internal_links: Array.isArray(data.internal_links)
      ? data.internal_links.map((item: any) => ({
          ...item,
          label: item.label || item.title || '',
          href: item.href || item.url || '',
          description: item.description || '',
        }))
      : [],
    navigation_groups: Array.isArray(data.navigation_groups)
      ? data.navigation_groups.map((group: any) => ({
          ...group,
          title: group.title || '',
          items: Array.isArray(group.items)
            ? group.items.map((item: any) => ({
                ...item,
                label: item.label || item.title || '',
                href: item.href || item.url || '',
                description: item.description || '',
              }))
            : [],
        }))
      : [],
    navigation_groups_title: data.navigation_groups_title || '',
    navigation_groups_intro: data.navigation_groups_intro || '',
    internal_links_title: data.internal_links_title || '',
    internal_links_intro: data.internal_links_intro || '',
    internal_links_variant: data.internal_links_variant || inferredLinkSections.internal_links_variant,
    internal_links_context: data.internal_links_context || {
      ...inferredLinkSections.internal_links_context,
      pageSlug: data.slug || inferredLinkSections.internal_links_context?.pageSlug,
    },
    software_schema: data.software_schema || null,
    faq_schema: data.faq_schema || null,
  };

  return {
    ...normalized,
    ...override,
    hero_trust_facts: Array.isArray(override.hero_trust_facts) ? override.hero_trust_facts : normalized.hero_trust_facts,
    problems: Array.isArray(override.problems) ? override.problems : normalized.problems,
    solution_steps: Array.isArray(override.solution_steps) ? override.solution_steps : normalized.solution_steps,
    features: Array.isArray(override.features) ? override.features : normalized.features,
    roi_without_items: Array.isArray(override.roi_without_items) ? override.roi_without_items : normalized.roi_without_items,
    roi_with_items: Array.isArray(override.roi_with_items) ? override.roi_with_items : normalized.roi_with_items,
    use_cases: Array.isArray(override.use_cases) ? override.use_cases : normalized.use_cases,
    faqs: Array.isArray(override.faqs) ? override.faqs : normalized.faqs,
    internal_links_context: {
      ...(normalized.internal_links_context || {}),
      ...(override as any).internal_links_context,
    },
  };
}

export async function getChannels() {
  const data = await fetchCollection('/channels');
  return enrich(data);
}

export async function getIndustries() {
  const data = await fetchCollection('/industries');
  return enrich(data);
}

export async function getIntegrations() {
  const data = await fetchCollection('/integrations');
  return enrich(data);
}

export async function getSolutions() {
  const data = await fetchCollection('/solutions');
  return enrich(data);
}

export async function getFeatures() {
  const data = await fetchCollection('/features');
  return enrich(data);
}

export async function getBusinessTypes() {
  const data = await fetchCollection('/business-types');
  return enrich(data).map((item) => ({
    ...item,
    hero_eyebrow: item.hero_eyebrow || '',
    hero_title: item.hero_title || '',
    hero_secondary_cta_label: item.hero_secondary_cta_label || '',
    hero_secondary_cta_url: item.hero_secondary_cta_url || '',
    problem_title: item.problem_title || '',
    solution_title: item.solution_title || '',
    features_title: item.features_title || '',
    steps_title: item.steps_title || '',
    integrations_title: item.integrations_title || '',
    integrations_intro: item.integrations_intro || '',
    integrations_more_text: item.integrations_more_text || '',
    roi_title: item.roi_title || '',
    roi_intro: item.roi_intro || '',
    roi_quote: item.roi_quote || '',
    roi_quote_author: item.roi_quote_author || '',
    faq_title: item.faq_title || '',
    related_types_title: item.related_types_title || '',
    related_links_intro: item.related_links_intro || '',
    pricing_link_label: item.pricing_link_label || '',
    final_cta_title: item.final_cta_title || '',
    final_cta_text: item.final_cta_text || '',
    final_cta_label: item.final_cta_label || '',
  }));
}

export async function getBusinessTypesPage() {
  return fetchSingle('/business-types-page');
}

export async function getCompetitors() {
  const data = await fetchCollection('/competitors');
  return enrich(data).map((item) => ({
    ...item,
    our_price: item.our_price || '',
    eyebrow: item.eyebrow || '',
    hero_title: item.hero_title || '',
    hero_description: item.hero_description || '',
    pricing_title: item.pricing_title || '',
    our_price_label: item.our_price_label || '',
    our_price_caption: item.our_price_caption || '',
    competitor_price_caption: item.competitor_price_caption || '',
    strengths_title: item.strengths_title || '',
    weaknesses_title: item.weaknesses_title || '',
    final_cta_title: item.final_cta_title || '',
    final_cta_text: item.final_cta_text || '',
    final_cta_label: item.final_cta_label || '',
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
  if (import.meta.env.DEV) {
    const data = await fetchSingle('/site-setting');
    return {
      ...data,
      header_links: Array.isArray(data.header_links) ? data.header_links : [],
      footer_columns: Array.isArray(data.footer_columns) ? data.footer_columns : [],
      page_templates: data.page_templates || {},
    };
  }

  if (!siteSettingsPromise) {
    siteSettingsPromise = fetchSingle('/site-setting').then((data) => ({
      ...data,
      header_links: Array.isArray(data.header_links) ? data.header_links : [],
      footer_columns: Array.isArray(data.footer_columns) ? data.footer_columns : [],
      page_templates: data.page_templates || {},
    }));
  }

  return siteSettingsPromise;
}
