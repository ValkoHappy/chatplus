import type { Schema, Struct } from '@strapi/strapi';

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
