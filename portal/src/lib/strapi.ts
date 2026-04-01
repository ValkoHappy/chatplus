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

  if (!json || !json.data || json.data.length === 0) {
    throw new Error(`Strapi returned no data for ${path}`);
  }

  return json.data;
}

async function fetchSingle(path: string) {
  const json = await request(path);

  if (!json || !json.data) {
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
  const pickValue = (primary: any, fallback: any) => (primary !== undefined && primary !== null && primary !== '' ? primary : fallback);
  const pickArray = (primary: any, fallback: any) => (Array.isArray(primary) && primary.length > 0 ? primary : Array.isArray(fallback) ? fallback : []);
  const pickObject = (primary: any, fallback: any) => {
    if (primary && typeof primary === 'object' && !Array.isArray(primary) && Object.keys(primary).length > 0) {
      return primary;
    }

    if (fallback && typeof fallback === 'object' && !Array.isArray(fallback)) {
      return fallback;
    }

    return {};
  };

  const normalized = {
    ...data,
    template_kind: data.template_kind || '',
    content_origin: data.content_origin || '',
    hero_eyebrow: data.hero_eyebrow || '',
    hero_variant: data.hero_variant || '',
    hero_highlights_label: data.hero_highlights_label || '',
    hero_highlights: Array.isArray(data.hero_highlights) ? data.hero_highlights : [],
    hero_trust_facts: Array.isArray(data.hero_trust_facts) ? data.hero_trust_facts : [],
    hero_panel_items: Array.isArray(data.hero_panel_items) ? data.hero_panel_items : [],
    pricing_tiers: Array.isArray(data.pricing_tiers) ? data.pricing_tiers : [],
    proof_cards: Array.isArray(data.proof_cards) ? data.proof_cards : [],
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
    proof_facts: Array.isArray(data.proof_facts) ? data.proof_facts : [],
    section_labels: data.section_labels || {},
    quote_title: data.quote_title || '',
    quote_text: data.quote_text || '',
    quote_author: data.quote_author || '',
    presentation_flags: data.presentation_flags || {},
    internal_links_context: data.internal_links_context || {
      ...inferredLinkSections.internal_links_context,
      pageSlug: data.slug || inferredLinkSections.internal_links_context?.pageSlug,
    },
    software_schema: data.software_schema || null,
    faq_schema: data.faq_schema || null,
  };

  return {
    ...override,
    ...normalized,
    template_kind: pickValue(normalized.template_kind, (override as any).template_kind),
    content_origin: pickValue(normalized.content_origin, (override as any).content_origin),
    hero_eyebrow: pickValue(normalized.hero_eyebrow, (override as any).hero_eyebrow),
    hero_variant: pickValue(normalized.hero_variant, (override as any).hero_variant),
    hero_highlights_label: pickValue(normalized.hero_highlights_label, (override as any).hero_highlights_label),
    hero_highlights: pickArray(normalized.hero_highlights, (override as any).hero_highlights),
    hero_trust_facts: pickArray(normalized.hero_trust_facts, (override as any).hero_trust_facts),
    hero_panel_items: pickArray(normalized.hero_panel_items, (override as any).hero_panel_items),
    pricing_tiers: pickArray(normalized.pricing_tiers, (override as any).pricing_tiers),
    proof_cards: pickArray(normalized.proof_cards, (override as any).proof_cards),
    problems: pickArray(normalized.problems, (override as any).problems),
    solution_steps: pickArray(normalized.solution_steps, (override as any).solution_steps),
    features: pickArray(normalized.features, (override as any).features),
    roi_without_items: pickArray(normalized.roi_without_items, (override as any).roi_without_items),
    roi_with_items: pickArray(normalized.roi_with_items, (override as any).roi_with_items),
    use_cases: pickArray(normalized.use_cases, (override as any).use_cases),
    faqs: pickArray(normalized.faqs, (override as any).faqs),
    proof_facts: pickArray(normalized.proof_facts, (override as any).proof_facts),
    section_labels: pickObject(normalized.section_labels, (override as any).section_labels),
    quote_title: pickValue(normalized.quote_title, (override as any).quote_title),
    quote_text: pickValue(normalized.quote_text, (override as any).quote_text),
    quote_author: pickValue(normalized.quote_author, (override as any).quote_author),
    presentation_flags: pickObject(normalized.presentation_flags, (override as any).presentation_flags),
    internal_links_context: {
      ...(override as any).internal_links_context,
      ...(normalized.internal_links_context || {}),
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
    content_origin: item.content_origin || 'generated',
    our_price: item.our_price || '',
    eyebrow: item.eyebrow || '',
    hero_eyebrow: item.hero_eyebrow || item.eyebrow || '',
    hero_title: item.hero_title || '',
    hero_description: item.hero_description || '',
    compare_summary: item.compare_summary || '',
    compare_points: Array.isArray(item.compare_points) ? item.compare_points : [],
    pricing_title: item.pricing_title || '',
    our_price_label: item.our_price_label || '',
    our_price_caption: item.our_price_caption || '',
    competitor_price_caption: item.competitor_price_caption || '',
    strengths_title: item.strengths_title || '',
    advantages_title: item.advantages_title || '',
    advantages_intro: item.advantages_intro || '',
    weaknesses_title: item.weaknesses_title || '',
    faq_title: item.faq_title || '',
    sticky_cta_title: item.sticky_cta_title || '',
    sticky_cta_text: item.sticky_cta_text || '',
    section_labels: item.section_labels || {},
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
      template_defaults: data.template_defaults || {},
      special_page_defaults: data.special_page_defaults || {},
      global_labels: data.global_labels || {},
      generator_defaults: data.generator_defaults || {},
    };
  }

  if (!siteSettingsPromise) {
    siteSettingsPromise = fetchSingle('/site-setting')
      .then((data) => ({
        ...data,
        header_links: Array.isArray(data.header_links) ? data.header_links : [],
        footer_columns: Array.isArray(data.footer_columns) ? data.footer_columns : [],
        page_templates: data.page_templates || {},
        template_defaults: data.template_defaults || {},
        special_page_defaults: data.special_page_defaults || {},
        global_labels: data.global_labels || {},
        generator_defaults: data.generator_defaults || {},
      }))
      .catch((err) => {
        siteSettingsPromise = undefined;
        throw err;
      });
  }

  return siteSettingsPromise;
}
