import type { Schema, Struct } from '@strapi/strapi';

export interface PageBlocksBeforeAfter extends Struct.ComponentSchema {
  collectionName: 'components_page_blocks_before_afters';
  info: {
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
    displayName: 'Card Item';
  };
  attributes: {
    eyebrow: Schema.Attribute.String;
    icon: Schema.Attribute.String;
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface PageBlocksCardsGrid extends Struct.ComponentSchema {
  collectionName: 'components_page_blocks_cards_grids';
  info: {
    displayName: 'Cards Grid Block';
  };
  attributes: {
    intro: Schema.Attribute.Text;
    items: Schema.Attribute.Component<'page-blocks.card-item', true>;
    title: Schema.Attribute.String;
    variant: Schema.Attribute.Enumeration<
      ['default', 'problems', 'use_cases', 'pillars', 'editorial']
    > &
      Schema.Attribute.DefaultTo<'default'>;
  };
}

export interface PageBlocksComparisonRow extends Struct.ComponentSchema {
  collectionName: 'components_page_blocks_comparison_rows';
  info: {
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
    variant: Schema.Attribute.Enumeration<['default', 'showcase', 'panel']> &
      Schema.Attribute.DefaultTo<'default'>;
  };
}

export interface PageBlocksInternalLinks extends Struct.ComponentSchema {
  collectionName: 'components_page_blocks_internal_links';
  info: {
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
