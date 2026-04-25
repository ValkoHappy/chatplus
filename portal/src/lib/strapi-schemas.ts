import { z } from 'zod';

import { toCanonicalTemplateKind } from './template-kinds.ts';
import { normalizePageV2RoutePath } from '../../../config/page-v2-routes.mjs';

const UnknownRecordSchema = z.record(z.string(), z.unknown());

const SingleResponseSchema = z.object({
  data: UnknownRecordSchema,
});

type UnknownRecord = Record<string, unknown>;

export type StrapiRecord = UnknownRecord;

function asRecord(value: unknown): UnknownRecord {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as UnknownRecord;
  }

  return {};
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function asBoolean(value: unknown, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }

  return fallback;
}

function isTechnicalFaqItem(question: string, answer: string) {
  const normalizedQuestion = question.trim().toLowerCase();
  const normalizedAnswer = answer.trim().toLowerCase();
  return normalizedQuestion === 'can this page be edited in strapi?'
    || normalizedAnswer === 'yes. the page record owns route, seo, sections and links.';
}

function asInteger(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  return fallback;
}

function getPublicSiteUrl() {
  return (process.env.PUBLIC_SITE_URL || 'https://chatplus.ru').replace(/\/+$/, '');
}

function rebaseAbsoluteSiteUrl(value: unknown) {
  const current = asString(value);
  if (!current) {
    return current;
  }

  try {
    const url = new URL(current);
    const base = new URL(getPublicSiteUrl());
    return new URL(`${url.pathname}${url.search}${url.hash}`, `${base.toString().replace(/\/$/, '')}/`).toString();
  } catch {
    return current;
  }
}

function normalizeLinkItem(value: unknown) {
  const record = asRecord(value);

  return {
    ...record,
    label: asString(record.label) || asString(record.title),
    href: asString(record.href) || asString(record.url),
    description: asString(record.description),
  };
}

function normalizeCardItem(value: unknown) {
  const record = asRecord(value);

  return {
    ...record,
    eyebrow: asString(record.eyebrow),
    title: asString(record.title),
    text: asString(record.text) || asString(record.description),
    description: asString(record.description),
    secondary_text: asString(record.secondary_text) || asString(record.secondaryText),
    icon: asString(record.icon),
  };
}

function normalizeSectionItemArray(value: unknown, normalizer: (entry: unknown) => Record<string, unknown>) {
  return asArray(value).map((entry) => normalizer(entry));
}

function normalizePageV2Section(value: unknown) {
  const record = asRecord(value);
  const componentUid = asString(record.__component);
  const blockType = componentUid.split('.').pop() || '';

  const normalized = {
    ...record,
    __component: componentUid,
    block_type: blockType,
    title: asString(record.title),
    intro: asString(record.intro),
  } as Record<string, unknown>;

  switch (blockType) {
    case 'hero':
      normalized.variant = asString(record.variant) || 'default';
      normalized.eyebrow = asString(record.eyebrow);
      normalized.subtitle = asString(record.subtitle);
      normalized.context_title = asString(record.context_title);
      normalized.context_text = asString(record.context_text);
      normalized.panel_items = normalizeSectionItemArray(record.panel_items, normalizeCardItem);
      normalized.primary_label = asString(record.primary_label);
      normalized.primary_url = asString(record.primary_url);
      normalized.secondary_label = asString(record.secondary_label);
      normalized.secondary_url = asString(record.secondary_url);
      normalized.trust_facts = asArray(record.trust_facts).map((item) => asString(item)).filter(Boolean);
      break;
    case 'rich-text':
      normalized.body = asString(record.body);
      break;
    case 'proof-stats':
      normalized.variant = asString(record.variant) || 'cards';
      normalized.items = normalizeSectionItemArray(record.items, (item) => {
        const current = asRecord(item);
        return {
          ...current,
          value: asString(current.value),
          label: asString(current.label),
          description: asString(current.description),
        };
      });
      break;
    case 'cards-grid':
      normalized.variant = asString(record.variant) || 'default';
      normalized.items = normalizeSectionItemArray(record.items, normalizeCardItem);
      break;
    case 'feature-list':
      normalized.items = normalizeSectionItemArray(record.items, normalizeCardItem);
      break;
    case 'steps':
      normalized.variant = asString(record.variant) || 'cards';
      normalized.items = normalizeSectionItemArray(record.items, (item) => {
        const current = asRecord(item);
        return {
          ...current,
          title: asString(current.title),
          text: asString(current.text) || asString(current.description),
        };
      });
      break;
    case 'faq':
      normalized.items = normalizeSectionItemArray(record.items, (item) => {
        const current = asRecord(item);
        return {
          ...current,
          question: asString(current.question) || asString(current.q),
          answer: asString(current.answer) || asString(current.a),
        };
      }).filter((item) => !isTechnicalFaqItem(asString(item.question), asString(item.answer)));
      break;
    case 'testimonial':
      normalized.quote = asString(record.quote);
      normalized.author = asString(record.author);
      normalized.role = asString(record.role);
      break;
    case 'related-links':
      normalized.links = normalizeSectionItemArray(record.links, normalizeLinkItem);
      break;
    case 'final-cta':
      normalized.text = asString(record.text);
      normalized.primary_label = asString(record.primary_label);
      normalized.primary_url = asString(record.primary_url);
      normalized.secondary_label = asString(record.secondary_label);
      normalized.secondary_url = asString(record.secondary_url);
      break;
    case 'pricing-plans':
      normalized.variant = asString(record.variant) || 'cards';
      normalized.items = normalizeSectionItemArray(record.items, (item) => {
        const current = asRecord(item);
        return {
          ...current,
          title: asString(current.title),
          label: asString(current.label),
          price: asString(current.price),
          period: asString(current.period),
          note: asString(current.note),
          text: asString(current.text),
          cta_label: asString(current.cta_label),
          cta_url: asString(current.cta_url),
          icon: asString(current.icon),
          kicker: asString(current.kicker),
          accent: asBoolean(current.accent),
          features: asArray(current.features).map((feature) => asString(feature)).filter(Boolean),
        };
      });
      break;
    case 'comparison-table':
      normalized.option_one_label = asString(record.option_one_label);
      normalized.option_two_label = asString(record.option_two_label);
      normalized.option_highlight_label = asString(record.option_highlight_label);
      normalized.rows = normalizeSectionItemArray(record.rows, (item) => {
        const current = asRecord(item);
        return {
          ...current,
          parameter: asString(current.parameter),
          option_one: asString(current.option_one),
          option_two: asString(current.option_two),
          option_highlight: asString(current.option_highlight),
        };
      });
      break;
    case 'before-after':
      normalized.before_title = asString(record.before_title);
      normalized.after_title = asString(record.after_title);
      normalized.before_items = asArray(record.before_items).map(normalizeBeforeAfterItem).filter(Boolean);
      normalized.after_items = asArray(record.after_items).map(normalizeBeforeAfterItem).filter(Boolean);
      normalized.quote = asString(record.quote);
      normalized.quote_author = asString(record.quote_author);
      break;
    case 'internal-links':
      normalized.eyebrow = asString(record.eyebrow);
      normalized.links = normalizeSectionItemArray(record.links, normalizeLinkItem);
      break;
  }

  return normalized;
}

function normalizeBeforeAfterItem(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }

  const record = asRecord(value);
  const itemValue = asString(record.value);
  const itemLabel = asString(record.label) || asString(record.title) || asString(record.text);
  if (itemValue && itemLabel) {
    return `${itemValue} — ${itemLabel}`;
  }

  return itemValue || itemLabel;
}

export function parseCollectionData(json: unknown, path: string, options?: { allowEmpty?: boolean }) {
  const recordsSchema = options?.allowEmpty
    ? z.array(UnknownRecordSchema)
    : z.array(UnknownRecordSchema).min(1);
  const collectionSchema = z.object({
    data: recordsSchema,
  });
  const parsed = collectionSchema.safeParse(json);

  if (!parsed.success) {
    throw new Error(`Strapi returned an invalid collection payload for ${path}`);
  }

  return parsed.data.data;
}

export function parseSingleData(json: unknown, path: string) {
  const parsed = SingleResponseSchema.safeParse(json);

  if (!parsed.success) {
    throw new Error(`Strapi returned an invalid single payload for ${path}`);
  }

  return parsed.data.data;
}

export function normalizeCatalogItems(items: StrapiRecord[]) {
  return items.map((item) => ({
    ...item,
    icon: asString(item.icon) || 'lucide:message-circle',
    features: asArray(item.features),
    faq: asArray(item.faq),
    steps: asArray(item.steps),
    roi_metrics: asArray(item.roi_metrics),
    problem_points: asArray(item.problem_points),
    solution_points: asArray(item.solution_points),
    integrations: asArray(item.integrations),
    our_strengths: asArray(item.our_strengths),
    weaknesses: asArray(item.weaknesses),
    name: asString(item.name),
    slug: asString(item.slug),
    description: asString(item.description),
    cta: asString(item.cta),
    record_mode: asString(item.record_mode) || (asString(item.content_origin) === 'managed' ? 'managed' : 'imported'),
    external_id: asString(item.external_id),
    sync_strategy: asString(item.sync_strategy),
    manual_override_fields: asArray(item.manual_override_fields),
    last_imported_at: asString(item.last_imported_at),
    seo_title: asString(item.seo_title),
    seo_description: asString(item.seo_description),
    pain: asString(item.pain),
    solution: asString(item.solution),
    category: asString(item.category),
  }));
}

export function normalizeLandingPageRecord(data: StrapiRecord, slugHint?: string) {
  const softwareSchema = asRecord(data.software_schema);
  return {
    ...data,
    slug: asString(data.slug) || slugHint || '',
    canonical: rebaseAbsoluteSiteUrl(data.canonical),
    template_kind: toCanonicalTemplateKind(asString(data.template_kind)),
    content_origin: asString(data.content_origin),
    record_mode: asString(data.record_mode) || (asString(data.content_origin) === 'managed' ? 'managed' : 'imported'),
    hero_eyebrow: asString(data.hero_eyebrow),
    hero_variant: asString(data.hero_variant),
    hero_highlights_label: asString(data.hero_highlights_label),
    hero_highlights: asArray(data.hero_highlights),
    hero_trust_facts: asArray(data.hero_trust_facts),
    hero_panel_items: asArray(data.hero_panel_items),
    pricing_tiers: asArray(data.pricing_tiers),
    proof_cards: asArray(data.proof_cards),
    target_keywords: asArray(data.target_keywords),
    breadcrumb: asArray(data.breadcrumb),
    problems: asArray(data.problems),
    solution_steps: asArray(data.solution_steps),
    features: asArray(data.features),
    integration_blocks: asArray(data.integration_blocks),
    roi_without_items: asArray(data.roi_without_items),
    roi_with_items: asArray(data.roi_with_items),
    use_cases: asArray(data.use_cases).map((item) => {
      const record = asRecord(item);
      return {
        ...record,
        title: asString(record.title) || asString(record.audience),
        text: asString(record.text) || asString(record.description),
      };
    }),
    comparison_rows: asArray(data.comparison_rows).map((row) => {
      const record = asRecord(row);
      return {
        ...record,
        option_one: asString(record.option_one) || asString(record.email_aggregator),
        option_two: asString(record.option_two) || asString(record.mobile_aggregator),
        chat_plus: asString(record.chat_plus) || asString(record.chatplus),
      };
    }),
    faqs: asArray(data.faqs).map((item) => {
      const record = asRecord(item);
      return {
        ...record,
        question: asString(record.question) || asString(record.q),
        answer: asString(record.answer) || asString(record.a),
      };
    }).filter((item) => !isTechnicalFaqItem(item.question, item.answer)),
    internal_links: asArray(data.internal_links).map((item) => {
      const record = asRecord(item);
      return {
        ...record,
        label: asString(record.label) || asString(record.title),
        href: asString(record.href) || asString(record.url),
        description: asString(record.description),
      };
    }),
    navigation_groups: asArray(data.navigation_groups).map((group) => {
      const record = asRecord(group);
      return {
        ...record,
        title: asString(record.title),
        items: asArray(record.items).map((item) => {
          const groupItem = asRecord(item);
          return {
            ...groupItem,
            label: asString(groupItem.label) || asString(groupItem.title),
            href: asString(groupItem.href) || asString(groupItem.url),
            description: asString(groupItem.description),
          };
        }),
      };
    }),
    navigation_groups_title: asString(data.navigation_groups_title),
    navigation_groups_intro: asString(data.navigation_groups_intro),
    internal_links_title: asString(data.internal_links_title),
    internal_links_intro: asString(data.internal_links_intro),
    internal_links_variant: asString(data.internal_links_variant),
    proof_facts: asArray(data.proof_facts),
    section_labels: asRecord(data.section_labels),
    quote_title: asString(data.quote_title),
    quote_text: asString(data.quote_text),
    quote_author: asString(data.quote_author),
    presentation_flags: asRecord(data.presentation_flags),
    internal_links_context: asRecord(data.internal_links_context),
    software_schema: Object.keys(softwareSchema).length > 0
      ? {
          ...softwareSchema,
          url: rebaseAbsoluteSiteUrl(softwareSchema.url),
        }
      : null,
    faq_schema: data.faq_schema ?? null,
  };
}

export function normalizeSiteSettingsRecord(data: StrapiRecord) {
  const normalizedSiteUrl = rebaseAbsoluteSiteUrl(data.site_url);
  return {
    ...data,
    record_mode: asString(data.record_mode) || 'settings',
    site_url: normalizedSiteUrl ? normalizedSiteUrl.replace(/\/+$/, '') : getPublicSiteUrl(),
    header_links: asArray(data.header_links),
    footer_columns: asArray(data.footer_columns),
    page_templates: asRecord(data.page_templates),
    template_defaults: asRecord(data.template_defaults),
    special_page_defaults: asRecord(data.special_page_defaults),
    global_labels: asRecord(data.global_labels),
    generator_defaults: asRecord(data.generator_defaults),
  };
}

export function normalizePageV2Record(data: StrapiRecord) {
  const parentPage = asRecord(data.parent_page);
  const publishedAt = asString(data.publishedAt) || asString(data.published_at);
  const editorialStatus = asString(data.editorial_status) || 'draft';
  const migrationReady = asBoolean(data.migration_ready);
  const parityStatus = asString(data.parity_status) || 'unchecked';
  const legacyTemplateFamily = asString(data.legacy_template_family);
  const isPublishedApproved = publishedAt.length > 0 && editorialStatus === 'approved';
  const isMigrationVisible = legacyTemplateFamily
    ? (
        isPublishedApproved &&
        migrationReady &&
        parityStatus === 'approved'
      )
    : isPublishedApproved;

  return {
      ...data,
    slug: asString(data.slug),
    route_path: normalizePageV2RoutePath(asString(data.route_path)),
    locale: asString(data.locale) || 'ru',
    title: asString(data.title),
    page_kind: asString(data.page_kind),
    template_variant: asString(data.template_variant) || 'default',
    generation_mode: asString(data.generation_mode) || 'manual',
    source_mode: asString(data.source_mode) || 'managed',
    seo_title: asString(data.seo_title) || asString(data.title),
    seo_description: asString(data.seo_description),
    canonical: rebaseAbsoluteSiteUrl(data.canonical),
    robots: asString(data.robots) || 'index,follow',
    nav_label: asString(data.nav_label) || asString(data.title),
    nav_description: asString(data.nav_description),
      nav_group: asString(data.nav_group) || 'resources',
      nav_order: asInteger(data.nav_order, 100),
      editorial_status: editorialStatus,
      migration_ready: migrationReady,
      parity_status: parityStatus,
      legacy_template_family: legacyTemplateFamily,
      legacy_layout_signature: asRecord(data.legacy_layout_signature),
      parity_notes: asRecord(data.parity_notes),
      publishedAt,
      is_published: publishedAt.length > 0,
      is_migration_visible: isMigrationVisible,
      show_in_header: asBoolean(data.show_in_header),
    show_in_footer: asBoolean(data.show_in_footer),
    show_in_sitemap: asBoolean(data.show_in_sitemap, true),
    sitemap_priority: typeof data.sitemap_priority === 'number' ? data.sitemap_priority : Number(data.sitemap_priority || 0.5),
    sitemap_changefreq: asString(data.sitemap_changefreq) || 'weekly',
    generation_prompt: asString(data.generation_prompt),
    ai_metadata: asRecord(data.ai_metadata),
    human_review_required: asBoolean(data.human_review_required, true),
    sections: asArray(data.sections).map((section) => normalizePageV2Section(section)),
    breadcrumbs: asArray(data.breadcrumbs).map((item) => normalizeLinkItem(item)),
    internal_links: asArray(data.internal_links).map((item) => normalizeLinkItem(item)),
    parent_page: Object.keys(parentPage).length > 0
      ? {
          ...parentPage,
          title: asString(parentPage.title),
          route_path: normalizePageV2RoutePath(asString(parentPage.route_path)),
          nav_label: asString(parentPage.nav_label) || asString(parentPage.title),
        }
      : null,
  };
}
