import { z } from 'zod';

import { toCanonicalTemplateKind } from './template-kinds.ts';

const UnknownRecordSchema = z.record(z.string(), z.unknown());

const CollectionResponseSchema = z.object({
  data: z.array(UnknownRecordSchema).min(1),
});

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

export function parseCollectionData(json: unknown, path: string) {
  const parsed = CollectionResponseSchema.safeParse(json);

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
    seo_title: asString(item.seo_title),
    seo_description: asString(item.seo_description),
    pain: asString(item.pain),
    solution: asString(item.solution),
    category: asString(item.category),
  }));
}

export function normalizeLandingPageRecord(data: StrapiRecord, slugHint?: string) {
  return {
    ...data,
    slug: asString(data.slug) || slugHint || '',
    template_kind: toCanonicalTemplateKind(asString(data.template_kind)),
    content_origin: asString(data.content_origin),
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
    }),
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
    software_schema: data.software_schema ?? null,
    faq_schema: data.faq_schema ?? null,
  };
}

export function normalizeSiteSettingsRecord(data: StrapiRecord) {
  return {
    ...data,
    header_links: asArray(data.header_links),
    footer_columns: asArray(data.footer_columns),
    page_templates: asRecord(data.page_templates),
    template_defaults: asRecord(data.template_defaults),
    special_page_defaults: asRecord(data.special_page_defaults),
    global_labels: asRecord(data.global_labels),
    generator_defaults: asRecord(data.generator_defaults),
  };
}
