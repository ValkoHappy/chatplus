import type { Schema, Struct } from '@strapi/strapi';

export interface PageBlocksBeforeAfter extends Struct.ComponentSchema {
  collectionName: 'components_page_blocks_before_afters';
  info: {
    description: '\u0411\u043B\u043E\u043A \u201C\u0434\u043E/\u043F\u043E\u0441\u043B\u0435\u201D \u0438\u043B\u0438 ROI. \u041F\u043E\u0434\u0445\u043E\u0434\u0438\u0442 \u0434\u043B\u044F \u0441\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u044F \u0441\u0442\u0430\u0440\u043E\u0433\u043E \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u0430 \u0438 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u0430 \u043F\u043E\u0441\u043B\u0435 Chat Plus.';
    displayName: 'Before After Block';
  };
  attributes: {
    after_items: Schema.Attribute.JSON;
    after_title: Schema.Attribute.String;
    before_items: Schema.Attribute.JSON;
    before_title: Schema.Attribute.String;
    intro: Schema.Attribute.Text;
    quote: Schema.Attribute.Text;
    quote_author: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface PageBlocksCardItem extends Struct.ComponentSchema {
  collectionName: 'components_page_blocks_card_items';
  info: {
    description: '\u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0430 \u0434\u043B\u044F \u0441\u0435\u0442\u043E\u043A, hero-\u043F\u0430\u043D\u0435\u043B\u0435\u0439 \u0438 \u0441\u0441\u044B\u043B\u043E\u043A.';
    displayName: 'Card Item';
  };
  attributes: {
    badges: Schema.Attribute.JSON;
    cta_label: Schema.Attribute.String;
    eyebrow: Schema.Attribute.String;
    href: Schema.Attribute.String;
    icon: Schema.Attribute.String;
    secondary_text: Schema.Attribute.Text;
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    url: Schema.Attribute.String;
  };
}

export interface PageBlocksCardsGrid extends Struct.ComponentSchema {
  collectionName: 'components_page_blocks_cards_grids';
  info: {
    description: '\u0421\u0435\u0442\u043A\u0430 \u043A\u0430\u0440\u0442\u043E\u0447\u0435\u043A. \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F \u0434\u043B\u044F \u043F\u0440\u0435\u0438\u043C\u0443\u0449\u0435\u0441\u0442\u0432, \u043F\u0440\u043E\u0431\u043B\u0435\u043C, \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0435\u0432, \u0440\u0435\u0441\u0443\u0440\u0441\u043E\u0432 \u0438 \u0440\u0435\u0434\u0430\u043A\u0446\u0438\u043E\u043D\u043D\u044B\u0445 \u043F\u043E\u0434\u0431\u043E\u0440\u043E\u043A.';
    displayName: 'Cards Grid Block';
  };
  attributes: {
    intro: Schema.Attribute.Text;
    items: Schema.Attribute.Component<'page-blocks.card-item', true>;
    title: Schema.Attribute.String;
    variant: Schema.Attribute.Enumeration<
      [
        'default',
        'problems',
        'use_cases',
        'pillars',
        'editorial',
        'integrations',
      ]
    > &
      Schema.Attribute.DefaultTo<'default'>;
  };
}

export interface PageBlocksComparisonRow extends Struct.ComponentSchema {
  collectionName: 'components_page_blocks_comparison_rows';
  info: {
    description: '\u041E\u0434\u043D\u0430 \u0441\u0442\u0440\u043E\u043A\u0430 \u0442\u0430\u0431\u043B\u0438\u0446\u044B \u0441\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u044F.';
    displayName: 'Comparison Row';
  };
  attributes: {
    option_highlight: Schema.Attribute.Text;
    option_one: Schema.Attribute.Text;
    option_two: Schema.Attribute.Text;
    parameter: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface PageBlocksComparisonTable extends Struct.ComponentSchema {
  collectionName: 'components_page_blocks_comparison_tables';
  info: {
    description: '\u0422\u0430\u0431\u043B\u0438\u0446\u0430 \u0441\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u044F \u0442\u0430\u0440\u0438\u0444\u043E\u0432, \u0440\u0435\u0448\u0435\u043D\u0438\u0439, \u043A\u043E\u043D\u043A\u0443\u0440\u0435\u043D\u0442\u043E\u0432 \u0438\u043B\u0438 \u043F\u043E\u0434\u0445\u043E\u0434\u043E\u0432.';
    displayName: 'Comparison Table Block';
  };
  attributes: {
    intro: Schema.Attribute.Text;
    option_highlight_label: Schema.Attribute.String;
    option_one_label: Schema.Attribute.String;
    option_two_label: Schema.Attribute.String;
    rows: Schema.Attribute.Component<'page-blocks.comparison-row', true>;
    title: Schema.Attribute.String;
  };
}

export interface PageBlocksFaq extends Struct.ComponentSchema {
  collectionName: 'components_page_blocks_faqs';
  info: {
    description: '\u0411\u043B\u043E\u043A \u0447\u0430\u0441\u0442\u044B\u0445 \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432.';
    displayName: 'FAQ Block';
  };
  attributes: {
    intro: Schema.Attribute.Text;
    items: Schema.Attribute.Component<'page-blocks.faq-item', true>;
    title: Schema.Attribute.String;
  };
}

export interface PageBlocksFaqItem extends Struct.ComponentSchema {
  collectionName: 'components_page_blocks_faq_items';
  info: {
    description: '\u041E\u0434\u0438\u043D \u0432\u043E\u043F\u0440\u043E\u0441 \u0438 \u043E\u0442\u0432\u0435\u0442.';
    displayName: 'FAQ Item';
  };
  attributes: {
    answer: Schema.Attribute.Text & Schema.Attribute.Required;
    question: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface PageBlocksFeatureList extends Struct.ComponentSchema {
  collectionName: 'components_page_blocks_feature_lists';
  info: {
    description: '\u0421\u043F\u0438\u0441\u043E\u043A \u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E\u0441\u0442\u0435\u0439 \u0438\u043B\u0438 \u043F\u0440\u0435\u0438\u043C\u0443\u0449\u0435\u0441\u0442\u0432.';
    displayName: 'Feature List Block';
  };
  attributes: {
    intro: Schema.Attribute.Text;
    items: Schema.Attribute.Component<'page-blocks.card-item', true>;
    title: Schema.Attribute.String;
  };
}

export interface PageBlocksFinalCta extends Struct.ComponentSchema {
  collectionName: 'components_page_blocks_final_ctas';
  info: {
    description: '\u0424\u0438\u043D\u0430\u043B\u044C\u043D\u044B\u0439 CTA-\u0431\u043B\u043E\u043A \u0432\u043D\u0438\u0437\u0443 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B.';
    displayName: 'Final CTA Block';
  };
  attributes: {
    primary_label: Schema.Attribute.String;
    primary_url: Schema.Attribute.String;
    secondary_label: Schema.Attribute.String;
    secondary_url: Schema.Attribute.String;
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface PageBlocksHero extends Struct.ComponentSchema {
  collectionName: 'components_page_blocks_heroes';
  info: {
    description: '\u041F\u0435\u0440\u0432\u044B\u0439 \u044D\u043A\u0440\u0430\u043D \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B: \u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043E\u043A, \u043F\u043E\u0434\u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043E\u043A, CTA \u0438 \u0432\u0430\u0436\u043D\u044B\u0435 \u0444\u0430\u043A\u0442\u044B.';
    displayName: 'Hero Block';
  };
  attributes: {
    context_text: Schema.Attribute.Text;
    context_title: Schema.Attribute.String;
    eyebrow: Schema.Attribute.String;
    panel_items: Schema.Attribute.Component<'page-blocks.card-item', true>;
    primary_label: Schema.Attribute.String;
    primary_url: Schema.Attribute.String;
    secondary_label: Schema.Attribute.String;
    secondary_url: Schema.Attribute.String;
    subtitle: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    trust_facts: Schema.Attribute.JSON;
    variant: Schema.Attribute.Enumeration<
      ['default', 'showcase', 'panel', 'editorial']
    > &
      Schema.Attribute.DefaultTo<'default'>;
  };
}

export interface PageBlocksInternalLinks extends Struct.ComponentSchema {
  collectionName: 'components_page_blocks_internal_links';
  info: {
    description: '\u0411\u043B\u043E\u043A \u0432\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u0438\u0445 \u0441\u0441\u044B\u043B\u043E\u043A \u201C\u0427\u0442\u043E \u0435\u0449\u0451 \u043F\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C\u201D.';
    displayName: 'Internal Links Block';
  };
  attributes: {
    eyebrow: Schema.Attribute.String;
    intro: Schema.Attribute.Text;
    links: Schema.Attribute.Component<'page-blocks.link-item', true>;
    title: Schema.Attribute.String;
  };
}

export interface PageBlocksLinkItem extends Struct.ComponentSchema {
  collectionName: 'components_page_blocks_link_items';
  info: {
    description: '\u041E\u0434\u043D\u0430 \u0432\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u044F\u044F \u0441\u0441\u044B\u043B\u043A\u0430.';
    displayName: 'Link Item';
  };
  attributes: {
    description: Schema.Attribute.Text;
    href: Schema.Attribute.String & Schema.Attribute.Required;
    label: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface PageBlocksPricingPlanItem extends Struct.ComponentSchema {
  collectionName: 'components_page_blocks_pricing_plan_items';
  info: {
    description: '\u041E\u0434\u043D\u0430 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0430 \u0442\u0430\u0440\u0438\u0444\u0430 \u0438\u043B\u0438 \u043F\u0430\u043A\u0435\u0442\u0430.';
    displayName: 'Pricing Plan Item';
  };
  attributes: {
    accent: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    cta_label: Schema.Attribute.String;
    cta_url: Schema.Attribute.String;
    features: Schema.Attribute.JSON;
    icon: Schema.Attribute.String;
    kicker: Schema.Attribute.String;
    label: Schema.Attribute.String;
    note: Schema.Attribute.Text;
    period: Schema.Attribute.String;
    price: Schema.Attribute.String;
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface PageBlocksPricingPlans extends Struct.ComponentSchema {
  collectionName: 'components_page_blocks_pricing_plans';
  info: {
    description: '\u0411\u043B\u043E\u043A \u0442\u0430\u0440\u0438\u0444\u043E\u0432 \u0438\u043B\u0438 \u043F\u0430\u043A\u0435\u0442\u043E\u0432.';
    displayName: 'Pricing Plans Block';
  };
  attributes: {
    intro: Schema.Attribute.Text;
    items: Schema.Attribute.Component<'page-blocks.pricing-plan-item', true>;
    title: Schema.Attribute.String;
    variant: Schema.Attribute.Enumeration<['cards', 'compact']> &
      Schema.Attribute.DefaultTo<'cards'>;
  };
}

export interface PageBlocksProofStats extends Struct.ComponentSchema {
  collectionName: 'components_page_blocks_proof_stats';
  info: {
    description: '\u0411\u043B\u043E\u043A \u0434\u043E\u043A\u0430\u0437\u0430\u0442\u0435\u043B\u044C\u0441\u0442\u0432, \u0446\u0438\u0444\u0440 \u0438 \u043A\u043E\u0440\u043E\u0442\u043A\u0438\u0445 \u0444\u0430\u043A\u0442\u043E\u0432.';
    displayName: 'Proof Stats Block';
  };
  attributes: {
    intro: Schema.Attribute.Text;
    items: Schema.Attribute.Component<'page-blocks.stat-item', true>;
    title: Schema.Attribute.String;
    variant: Schema.Attribute.Enumeration<['band', 'cards', 'sidebar']> &
      Schema.Attribute.DefaultTo<'cards'>;
  };
}

export interface PageBlocksRelatedLinks extends Struct.ComponentSchema {
  collectionName: 'components_page_blocks_related_links';
  info: {
    description: '\u0411\u043B\u043E\u043A \u0441\u0432\u044F\u0437\u0430\u043D\u043D\u044B\u0445 \u0441\u0442\u0440\u0430\u043D\u0438\u0446.';
    displayName: 'Related Links Block';
  };
  attributes: {
    intro: Schema.Attribute.Text;
    links: Schema.Attribute.Component<'page-blocks.link-item', true>;
    title: Schema.Attribute.String;
  };
}

export interface PageBlocksRichText extends Struct.ComponentSchema {
  collectionName: 'components_page_blocks_rich_texts';
  info: {
    description: '\u0422\u0435\u043A\u0441\u0442\u043E\u0432\u044B\u0439 \u0440\u0435\u0434\u0430\u043A\u0446\u0438\u043E\u043D\u043D\u044B\u0439 \u0431\u043B\u043E\u043A.';
    displayName: 'Rich Text Block';
  };
  attributes: {
    body: Schema.Attribute.RichText & Schema.Attribute.Required;
    title: Schema.Attribute.String;
  };
}

export interface PageBlocksStatItem extends Struct.ComponentSchema {
  collectionName: 'components_page_blocks_stat_items';
  info: {
    description: '\u041E\u0434\u043D\u0430 \u0446\u0438\u0444\u0440\u0430 \u0438\u043B\u0438 \u0444\u0430\u043A\u0442.';
    displayName: 'Stat Item';
  };
  attributes: {
    description: Schema.Attribute.Text;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface PageBlocksStepItem extends Struct.ComponentSchema {
  collectionName: 'components_page_blocks_step_items';
  info: {
    description: '\u041E\u0434\u0438\u043D \u0448\u0430\u0433 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u0430.';
    displayName: 'Step Item';
  };
  attributes: {
    text: Schema.Attribute.Text & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface PageBlocksSteps extends Struct.ComponentSchema {
  collectionName: 'components_page_blocks_steps';
  info: {
    description: '\u0411\u043B\u043E\u043A \u0448\u0430\u0433\u043E\u0432 \u0438\u043B\u0438 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u0430.';
    displayName: 'Steps Block';
  };
  attributes: {
    intro: Schema.Attribute.Text;
    items: Schema.Attribute.Component<'page-blocks.step-item', true>;
    title: Schema.Attribute.String;
    variant: Schema.Attribute.Enumeration<['cards', 'timeline']> &
      Schema.Attribute.DefaultTo<'cards'>;
  };
}

export interface PageBlocksTestimonial extends Struct.ComponentSchema {
  collectionName: 'components_page_blocks_testimonials';
  info: {
    description: '\u0426\u0438\u0442\u0430\u0442\u0430, \u043E\u0442\u0437\u044B\u0432 \u0438\u043B\u0438 \u0440\u0435\u0434\u0430\u043A\u0446\u0438\u043E\u043D\u043D\u044B\u0439 \u0432\u044B\u0432\u043E\u0434.';
    displayName: 'Testimonial Block';
  };
  attributes: {
    author: Schema.Attribute.String;
    quote: Schema.Attribute.Text & Schema.Attribute.Required;
    role: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface TendersCompareRow extends Struct.ComponentSchema {
  collectionName: 'components_tenders_compare_rows';
  info: {
    displayName: 'Compare Row';
  };
  attributes: {
    chatplus: Schema.Attribute.String & Schema.Attribute.Required;
    email_aggregator: Schema.Attribute.String & Schema.Attribute.Required;
    mobile_aggregator: Schema.Attribute.String & Schema.Attribute.Required;
    parameter: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface TendersFaqItem extends Struct.ComponentSchema {
  collectionName: 'components_tenders_faq_items';
  info: {
    displayName: 'FAQ Item';
  };
  attributes: {
    answer: Schema.Attribute.Text & Schema.Attribute.Required;
    question: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface TendersFeatureItem extends Struct.ComponentSchema {
  collectionName: 'components_tenders_feature_items';
  info: {
    displayName: 'Feature Item';
  };
  attributes: {
    text: Schema.Attribute.Text & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface TendersIntegrationBlock extends Struct.ComponentSchema {
  collectionName: 'components_tenders_integration_blocks';
  info: {
    displayName: 'Integration Block';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    text: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

export interface TendersLinkItem extends Struct.ComponentSchema {
  collectionName: 'components_tenders_link_items';
  info: {
    displayName: 'Link Item';
  };
  attributes: {
    description: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface TendersProblemItem extends Struct.ComponentSchema {
  collectionName: 'components_tenders_problem_items';
  info: {
    displayName: 'Problem Item';
  };
  attributes: {
    text: Schema.Attribute.Text & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface TendersStepItem extends Struct.ComponentSchema {
  collectionName: 'components_tenders_step_items';
  info: {
    displayName: 'Step Item';
  };
  attributes: {
    text: Schema.Attribute.Text & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface TendersUseCaseItem extends Struct.ComponentSchema {
  collectionName: 'components_tenders_use_case_items';
  info: {
    displayName: 'Use Case Item';
  };
  attributes: {
    audience: Schema.Attribute.String & Schema.Attribute.Required;
    text: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'page-blocks.before-after': PageBlocksBeforeAfter;
      'page-blocks.card-item': PageBlocksCardItem;
      'page-blocks.cards-grid': PageBlocksCardsGrid;
      'page-blocks.comparison-row': PageBlocksComparisonRow;
      'page-blocks.comparison-table': PageBlocksComparisonTable;
      'page-blocks.faq': PageBlocksFaq;
      'page-blocks.faq-item': PageBlocksFaqItem;
      'page-blocks.feature-list': PageBlocksFeatureList;
      'page-blocks.final-cta': PageBlocksFinalCta;
      'page-blocks.hero': PageBlocksHero;
      'page-blocks.internal-links': PageBlocksInternalLinks;
      'page-blocks.link-item': PageBlocksLinkItem;
      'page-blocks.pricing-plan-item': PageBlocksPricingPlanItem;
      'page-blocks.pricing-plans': PageBlocksPricingPlans;
      'page-blocks.proof-stats': PageBlocksProofStats;
      'page-blocks.related-links': PageBlocksRelatedLinks;
      'page-blocks.rich-text': PageBlocksRichText;
      'page-blocks.stat-item': PageBlocksStatItem;
      'page-blocks.step-item': PageBlocksStepItem;
      'page-blocks.steps': PageBlocksSteps;
      'page-blocks.testimonial': PageBlocksTestimonial;
      'tenders.compare-row': TendersCompareRow;
      'tenders.faq-item': TendersFaqItem;
      'tenders.feature-item': TendersFeatureItem;
      'tenders.integration-block': TendersIntegrationBlock;
      'tenders.link-item': TendersLinkItem;
      'tenders.problem-item': TendersProblemItem;
      'tenders.step-item': TendersStepItem;
      'tenders.use-case-item': TendersUseCaseItem;
    }
  }
}
