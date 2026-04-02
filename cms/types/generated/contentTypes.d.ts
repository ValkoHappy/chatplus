import type { Schema, Struct } from '@strapi/strapi';

export interface AdminApiToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_tokens';
  info: {
    description: '';
    displayName: 'Api Token';
    name: 'Api Token';
    pluralName: 'api-tokens';
    singularName: 'api-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    encryptedKey: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::api-token'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'read-only'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_token_permissions';
  info: {
    description: '';
    displayName: 'API Token Permission';
    name: 'API Token Permission';
    pluralName: 'api-token-permissions';
    singularName: 'api-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::api-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminPermission extends Struct.CollectionTypeSchema {
  collectionName: 'admin_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'Permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    conditions: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::permission'> &
      Schema.Attribute.Private;
    properties: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<'manyToOne', 'admin::role'>;
    subject: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminRole extends Struct.CollectionTypeSchema {
  collectionName: 'admin_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'Role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::role'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<'manyToMany', 'admin::user'>;
  };
}

export interface AdminSession extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_sessions';
  info: {
    description: 'Session Manager storage';
    displayName: 'Session';
    name: 'Session';
    pluralName: 'sessions';
    singularName: 'session';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
    i18n: {
      localized: false;
    };
  };
  attributes: {
    absoluteExpiresAt: Schema.Attribute.DateTime & Schema.Attribute.Private;
    childId: Schema.Attribute.String & Schema.Attribute.Private;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deviceId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    expiresAt: Schema.Attribute.DateTime &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::session'> &
      Schema.Attribute.Private;
    origin: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    sessionId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique;
    status: Schema.Attribute.String & Schema.Attribute.Private;
    type: Schema.Attribute.String & Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    userId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_tokens';
  info: {
    description: '';
    displayName: 'Transfer Token';
    name: 'Transfer Token';
    pluralName: 'transfer-tokens';
    singularName: 'transfer-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferTokenPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    description: '';
    displayName: 'Transfer Token Permission';
    name: 'Transfer Token Permission';
    pluralName: 'transfer-token-permissions';
    singularName: 'transfer-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::transfer-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminUser extends Struct.CollectionTypeSchema {
  collectionName: 'admin_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'User';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    blocked: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    isActive: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    lastname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::user'> &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    preferedLanguage: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    registrationToken: Schema.Attribute.String & Schema.Attribute.Private;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    roles: Schema.Attribute.Relation<'manyToMany', 'admin::role'> &
      Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String;
  };
}

export interface ApiBusinessTypeBusinessType
  extends Struct.CollectionTypeSchema {
  collectionName: 'business_types';
  info: {
    description: '\u041A\u043E\u043D\u0442\u0435\u043D\u0442 \u0441\u0442\u0440\u0430\u043D\u0438\u0446 /for/[slug]';
    displayName: 'Business Type';
    pluralName: 'business-types';
    singularName: 'business-type';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    cta: Schema.Attribute.String;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    emoji: Schema.Attribute.String;
    faq: Schema.Attribute.JSON;
    faq_title: Schema.Attribute.String;
    features: Schema.Attribute.JSON;
    features_title: Schema.Attribute.String;
    final_cta_label: Schema.Attribute.String;
    final_cta_text: Schema.Attribute.Text;
    final_cta_title: Schema.Attribute.String;
    hero_eyebrow: Schema.Attribute.String;
    hero_secondary_cta_label: Schema.Attribute.String;
    hero_secondary_cta_url: Schema.Attribute.String;
    hero_title: Schema.Attribute.String;
    icon: Schema.Attribute.String;
    integrations: Schema.Attribute.JSON;
    integrations_intro: Schema.Attribute.Text;
    integrations_more_text: Schema.Attribute.String;
    integrations_title: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::business-type.business-type'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    pricing_link_label: Schema.Attribute.String;
    problem_points: Schema.Attribute.JSON;
    problem_title: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    related_links_intro: Schema.Attribute.String;
    related_types_title: Schema.Attribute.String;
    roi_intro: Schema.Attribute.String;
    roi_metrics: Schema.Attribute.JSON;
    roi_quote: Schema.Attribute.Text;
    roi_quote_author: Schema.Attribute.String;
    roi_title: Schema.Attribute.String;
    seo_description: Schema.Attribute.Text;
    seo_title: Schema.Attribute.String;
    slug: Schema.Attribute.UID<'name'> & Schema.Attribute.Required;
    solution_points: Schema.Attribute.JSON;
    solution_title: Schema.Attribute.String;
    steps: Schema.Attribute.JSON;
    steps_title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiBusinessTypesPageBusinessTypesPage
  extends Struct.SingleTypeSchema {
  collectionName: 'business_types_page';
  info: {
    description: '\u041A\u043E\u043D\u0442\u0435\u043D\u0442 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B /for';
    displayName: 'Business Types Page';
    pluralName: 'business-types-pages';
    singularName: 'business-types-page';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    hero_cta_label: Schema.Attribute.String;
    hero_description: Schema.Attribute.Text & Schema.Attribute.Required;
    hero_title: Schema.Attribute.String & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::business-types-page.business-types-page'
    > &
      Schema.Attribute.Private;
    meta_description: Schema.Attribute.Text & Schema.Attribute.Required;
    meta_title: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiChannelChannel extends Struct.CollectionTypeSchema {
  collectionName: 'channels';
  info: {
    description: '\u041A\u0430\u043D\u0430\u043B\u044B \u043A\u043E\u043C\u043C\u0443\u043D\u0438\u043A\u0430\u0446\u0438\u0438';
    displayName: 'Channel';
    pluralName: 'channels';
    singularName: 'channel';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    content: Schema.Attribute.RichText;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    cta: Schema.Attribute.String;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    emoji: Schema.Attribute.String;
    faq: Schema.Attribute.JSON;
    faq_title: Schema.Attribute.String;
    features: Schema.Attribute.JSON;
    features_title: Schema.Attribute.String;
    h1: Schema.Attribute.String;
    icon: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::channel.channel'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    problem_intro: Schema.Attribute.Text;
    problem_title: Schema.Attribute.String;
    problems: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    roi_metrics: Schema.Attribute.JSON;
    roi_quote: Schema.Attribute.Text;
    roi_title: Schema.Attribute.String;
    roi_with_items: Schema.Attribute.JSON;
    roi_without_items: Schema.Attribute.JSON;
    seo_description: Schema.Attribute.Text;
    seo_title: Schema.Attribute.String;
    slug: Schema.Attribute.UID<'name'> & Schema.Attribute.Required;
    solution_intro: Schema.Attribute.Text;
    solution_steps: Schema.Attribute.JSON;
    solution_title: Schema.Attribute.String;
    steps: Schema.Attribute.JSON;
    sticky_cta_text: Schema.Attribute.Text;
    sticky_cta_title: Schema.Attribute.String;
    subtitle: Schema.Attribute.Text;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCompetitorCompetitor extends Struct.CollectionTypeSchema {
  collectionName: 'competitors';
  info: {
    description: '\u041A\u043E\u043D\u0442\u0435\u043D\u0442 \u0441\u0442\u0440\u0430\u043D\u0438\u0446 /compare/[slug] \u0438 /vs/[slug]';
    displayName: 'Competitor';
    pluralName: 'competitors';
    singularName: 'competitor';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    advantages_intro: Schema.Attribute.Text;
    advantages_title: Schema.Attribute.String;
    compare_points: Schema.Attribute.JSON;
    compare_summary: Schema.Attribute.Text;
    competitor_price_caption: Schema.Attribute.String;
    content_origin: Schema.Attribute.Enumeration<['generated', 'managed']> &
      Schema.Attribute.DefaultTo<'generated'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    eyebrow: Schema.Attribute.String;
    faq_title: Schema.Attribute.String;
    final_cta_label: Schema.Attribute.String;
    final_cta_text: Schema.Attribute.Text;
    final_cta_title: Schema.Attribute.String;
    hero_description: Schema.Attribute.Text;
    hero_eyebrow: Schema.Attribute.String;
    hero_title: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::competitor.competitor'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    our_price: Schema.Attribute.String & Schema.Attribute.Required;
    our_price_caption: Schema.Attribute.String;
    our_price_label: Schema.Attribute.String;
    our_strengths: Schema.Attribute.JSON;
    price: Schema.Attribute.String & Schema.Attribute.Required;
    pricing_title: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    section_labels: Schema.Attribute.JSON;
    seo_description: Schema.Attribute.Text;
    seo_title: Schema.Attribute.String;
    slug: Schema.Attribute.UID<'name'> & Schema.Attribute.Required;
    sticky_cta_text: Schema.Attribute.Text;
    sticky_cta_title: Schema.Attribute.String;
    strengths_title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    weaknesses: Schema.Attribute.JSON;
    weaknesses_title: Schema.Attribute.String;
  };
}

export interface ApiFeatureFeature extends Struct.CollectionTypeSchema {
  collectionName: 'features';
  info: {
    description: '\u0412\u043E\u0437\u043C\u043E\u0436\u043D\u043E\u0441\u0442\u0438 \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u0430';
    displayName: 'Feature';
    pluralName: 'features';
    singularName: 'feature';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    content: Schema.Attribute.RichText;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    cta: Schema.Attribute.String;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    emoji: Schema.Attribute.String;
    faq: Schema.Attribute.JSON;
    faq_title: Schema.Attribute.String;
    features: Schema.Attribute.JSON;
    features_title: Schema.Attribute.String;
    h1: Schema.Attribute.String;
    icon: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::feature.feature'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    problem_intro: Schema.Attribute.Text;
    problem_title: Schema.Attribute.String;
    problems: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    roi_quote: Schema.Attribute.Text;
    roi_title: Schema.Attribute.String;
    roi_with_items: Schema.Attribute.JSON;
    roi_without_items: Schema.Attribute.JSON;
    seo_description: Schema.Attribute.Text;
    seo_title: Schema.Attribute.String;
    slug: Schema.Attribute.UID<'name'> & Schema.Attribute.Required;
    solution_intro: Schema.Attribute.Text;
    solution_steps: Schema.Attribute.JSON;
    solution_title: Schema.Attribute.String;
    sticky_cta_text: Schema.Attribute.Text;
    sticky_cta_title: Schema.Attribute.String;
    subtitle: Schema.Attribute.Text;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiIndustryIndustry extends Struct.CollectionTypeSchema {
  collectionName: 'industries';
  info: {
    description: '\u041E\u0442\u0440\u0430\u0441\u043B\u0438 \u0431\u0438\u0437\u043D\u0435\u0441\u0430';
    displayName: 'Industry';
    pluralName: 'industries';
    singularName: 'industry';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    content: Schema.Attribute.RichText;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    cta: Schema.Attribute.String;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    emoji: Schema.Attribute.String;
    faq: Schema.Attribute.JSON;
    faq_title: Schema.Attribute.String;
    features: Schema.Attribute.JSON;
    features_title: Schema.Attribute.String;
    h1: Schema.Attribute.String;
    icon: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::industry.industry'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    pain: Schema.Attribute.Text;
    problem_intro: Schema.Attribute.Text;
    problem_title: Schema.Attribute.String;
    problems: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    roi_metrics: Schema.Attribute.JSON;
    roi_quote: Schema.Attribute.Text;
    roi_title: Schema.Attribute.String;
    roi_with_items: Schema.Attribute.JSON;
    roi_without_items: Schema.Attribute.JSON;
    seo_description: Schema.Attribute.Text;
    seo_title: Schema.Attribute.String;
    slug: Schema.Attribute.UID<'name'> & Schema.Attribute.Required;
    solution: Schema.Attribute.Text;
    solution_intro: Schema.Attribute.Text;
    solution_steps: Schema.Attribute.JSON;
    solution_title: Schema.Attribute.String;
    sticky_cta_text: Schema.Attribute.Text;
    sticky_cta_title: Schema.Attribute.String;
    subtitle: Schema.Attribute.Text;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiIntegrationIntegration extends Struct.CollectionTypeSchema {
  collectionName: 'integrations';
  info: {
    description: '\u0418\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u0438 \u0441 CRM \u0438 \u0441\u0435\u0440\u0432\u0438\u0441\u0430\u043C\u0438';
    displayName: 'Integration';
    pluralName: 'integrations';
    singularName: 'integration';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    category: Schema.Attribute.String;
    content: Schema.Attribute.RichText;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    cta: Schema.Attribute.String;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    emoji: Schema.Attribute.String;
    faq: Schema.Attribute.JSON;
    faq_title: Schema.Attribute.String;
    features: Schema.Attribute.JSON;
    features_title: Schema.Attribute.String;
    h1: Schema.Attribute.String;
    icon: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::integration.integration'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    problem_intro: Schema.Attribute.Text;
    problem_title: Schema.Attribute.String;
    problems: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    roi_quote: Schema.Attribute.Text;
    roi_title: Schema.Attribute.String;
    roi_with_items: Schema.Attribute.JSON;
    roi_without_items: Schema.Attribute.JSON;
    seo_description: Schema.Attribute.Text;
    seo_title: Schema.Attribute.String;
    slug: Schema.Attribute.UID<'name'> & Schema.Attribute.Required;
    solution_intro: Schema.Attribute.Text;
    solution_steps: Schema.Attribute.JSON;
    solution_title: Schema.Attribute.String;
    sticky_cta_text: Schema.Attribute.Text;
    sticky_cta_title: Schema.Attribute.String;
    subtitle: Schema.Attribute.Text;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiLandingPageLandingPage extends Struct.CollectionTypeSchema {
  collectionName: 'landing_pages';
  info: {
    description: '\u0423\u043D\u0438\u0444\u0438\u0446\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u0430\u044F \u043F\u0440\u043E\u0434\u0430\u044E\u0449\u0430\u044F \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u043F\u043E \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0435 PDF';
    displayName: 'Landing Page';
    pluralName: 'landing-pages';
    singularName: 'landing-page';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    breadcrumb: Schema.Attribute.JSON;
    canonical: Schema.Attribute.String;
    comparison_rows: Schema.Attribute.Component<'tenders.compare-row', true>;
    comparison_title: Schema.Attribute.String;
    content_origin: Schema.Attribute.Enumeration<['generated', 'managed']> &
      Schema.Attribute.DefaultTo<'managed'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    faq_schema: Schema.Attribute.JSON;
    faq_title: Schema.Attribute.String;
    faqs: Schema.Attribute.Component<'tenders.faq-item', true>;
    features: Schema.Attribute.Component<'tenders.feature-item', true>;
    features_title: Schema.Attribute.String;
    h1: Schema.Attribute.String & Schema.Attribute.Required;
    hero_cta_primary_label: Schema.Attribute.String;
    hero_cta_primary_url: Schema.Attribute.String;
    hero_cta_secondary_label: Schema.Attribute.String;
    hero_cta_secondary_url: Schema.Attribute.String;
    hero_eyebrow: Schema.Attribute.String;
    hero_highlights: Schema.Attribute.JSON;
    hero_highlights_label: Schema.Attribute.String;
    hero_panel_items: Schema.Attribute.JSON;
    hero_trust_facts: Schema.Attribute.JSON;
    hero_variant: Schema.Attribute.String;
    hreflang_en: Schema.Attribute.String;
    hreflang_ru: Schema.Attribute.String;
    hreflang_uk: Schema.Attribute.String;
    integration_blocks: Schema.Attribute.Component<
      'tenders.integration-block',
      true
    >;
    integrations_title: Schema.Attribute.String;
    internal_links: Schema.Attribute.Component<'tenders.link-item', true>;
    internal_links_title: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::landing-page.landing-page'
    > &
      Schema.Attribute.Private;
    meta_description: Schema.Attribute.Text & Schema.Attribute.Required;
    meta_title: Schema.Attribute.String & Schema.Attribute.Required;
    presentation_flags: Schema.Attribute.JSON;
    pricing_tiers: Schema.Attribute.JSON;
    problem_intro: Schema.Attribute.Text;
    problem_summary: Schema.Attribute.Text;
    problem_title: Schema.Attribute.String;
    problems: Schema.Attribute.Component<'tenders.problem-item', true>;
    proof_cards: Schema.Attribute.JSON;
    proof_facts: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    quote_author: Schema.Attribute.String;
    quote_text: Schema.Attribute.Text;
    quote_title: Schema.Attribute.String;
    roi_intro: Schema.Attribute.Text;
    roi_quote: Schema.Attribute.Text;
    roi_title: Schema.Attribute.String;
    roi_with_items: Schema.Attribute.JSON;
    roi_without_items: Schema.Attribute.JSON;
    schema_type: Schema.Attribute.String;
    section_labels: Schema.Attribute.JSON;
    slug: Schema.Attribute.UID<'h1'> &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    software_schema: Schema.Attribute.JSON;
    solution_intro: Schema.Attribute.Text;
    solution_steps: Schema.Attribute.Component<'tenders.step-item', true>;
    solution_title: Schema.Attribute.String;
    sticky_cta_primary_label: Schema.Attribute.String;
    sticky_cta_primary_url: Schema.Attribute.String;
    sticky_cta_secondary_label: Schema.Attribute.String;
    sticky_cta_secondary_url: Schema.Attribute.String;
    sticky_cta_text: Schema.Attribute.Text;
    sticky_cta_title: Schema.Attribute.String;
    subtitle: Schema.Attribute.Text;
    target_keywords: Schema.Attribute.JSON;
    template_kind: Schema.Attribute.Enumeration<
      [
        'home',
        'structured',
        'pricing',
        'partnership',
        'resource_hub',
        'brand_content',
        'campaign',
        'generic',
      ]
    > &
      Schema.Attribute.DefaultTo<'generic'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    use_cases: Schema.Attribute.Component<'tenders.use-case-item', true>;
    use_cases_title: Schema.Attribute.String;
    word_count: Schema.Attribute.Integer;
  };
}

export interface ApiSiteSettingSiteSetting extends Struct.SingleTypeSchema {
  collectionName: 'site_settings';
  info: {
    description: '\u0413\u043B\u043E\u0431\u0430\u043B\u044C\u043D\u044B\u0439 \u043A\u043E\u043D\u0442\u0435\u043D\u0442 \u0441\u0430\u0439\u0442\u0430: \u0448\u0430\u043F\u043A\u0430, \u0444\u0443\u0442\u0435\u0440, sticky CTA \u0438 SEO-\u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435';
    displayName: 'Site Settings';
    pluralName: 'site-settings';
    singularName: 'site-setting';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    default_description: Schema.Attribute.Text & Schema.Attribute.Required;
    footer_columns: Schema.Attribute.JSON;
    footer_copyright: Schema.Attribute.String;
    footer_tagline: Schema.Attribute.Text;
    generator_defaults: Schema.Attribute.JSON;
    global_labels: Schema.Attribute.JSON;
    header_cta_label: Schema.Attribute.String;
    header_cta_url: Schema.Attribute.String;
    header_links: Schema.Attribute.JSON;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::site-setting.site-setting'
    > &
      Schema.Attribute.Private;
    organization_description: Schema.Attribute.Text;
    page_templates: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    site_name: Schema.Attribute.String & Schema.Attribute.Required;
    site_url: Schema.Attribute.String & Schema.Attribute.Required;
    special_page_defaults: Schema.Attribute.JSON;
    sticky_cta_label: Schema.Attribute.String;
    sticky_cta_text: Schema.Attribute.Text;
    sticky_cta_url: Schema.Attribute.String;
    template_defaults: Schema.Attribute.JSON;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiSolutionSolution extends Struct.CollectionTypeSchema {
  collectionName: 'solutions';
  info: {
    description: '\u0411\u0438\u0437\u043D\u0435\u0441-\u0444\u0443\u043D\u043A\u0446\u0438\u0438 \u0438 \u0440\u0435\u0448\u0435\u043D\u0438\u044F';
    displayName: 'Solution';
    pluralName: 'solutions';
    singularName: 'solution';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    content: Schema.Attribute.RichText;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    cta: Schema.Attribute.String;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    emoji: Schema.Attribute.String;
    faq: Schema.Attribute.JSON;
    faq_title: Schema.Attribute.String;
    features: Schema.Attribute.JSON;
    features_title: Schema.Attribute.String;
    h1: Schema.Attribute.String;
    icon: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::solution.solution'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    pain: Schema.Attribute.Text;
    problem_intro: Schema.Attribute.Text;
    problem_title: Schema.Attribute.String;
    problems: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    roi_metrics: Schema.Attribute.JSON;
    roi_quote: Schema.Attribute.Text;
    roi_title: Schema.Attribute.String;
    roi_with_items: Schema.Attribute.JSON;
    roi_without_items: Schema.Attribute.JSON;
    seo_description: Schema.Attribute.Text;
    seo_title: Schema.Attribute.String;
    slug: Schema.Attribute.UID<'name'> & Schema.Attribute.Required;
    solution: Schema.Attribute.Text;
    solution_intro: Schema.Attribute.Text;
    solution_steps: Schema.Attribute.JSON;
    solution_title: Schema.Attribute.String;
    steps: Schema.Attribute.JSON;
    sticky_cta_text: Schema.Attribute.Text;
    sticky_cta_title: Schema.Attribute.String;
    subtitle: Schema.Attribute.Text;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiTendersPageTendersPage extends Struct.SingleTypeSchema {
  collectionName: 'tenders_pages';
  info: {
    description: '\u041A\u043E\u043D\u0442\u0435\u043D\u0442 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B /solutions/tenders';
    displayName: 'Tenders Page';
    pluralName: 'tenders-pages';
    singularName: 'tenders-page';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    breadcrumb: Schema.Attribute.JSON;
    canonical: Schema.Attribute.String;
    comparison_rows: Schema.Attribute.Component<'tenders.compare-row', true>;
    comparison_title: Schema.Attribute.String;
    content_origin: Schema.Attribute.Enumeration<['generated', 'managed']> &
      Schema.Attribute.DefaultTo<'managed'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    faq_schema: Schema.Attribute.JSON;
    faq_title: Schema.Attribute.String;
    faqs: Schema.Attribute.Component<'tenders.faq-item', true>;
    features: Schema.Attribute.Component<'tenders.feature-item', true>;
    features_title: Schema.Attribute.String;
    h1: Schema.Attribute.String & Schema.Attribute.Required;
    hero_cta_primary_label: Schema.Attribute.String;
    hero_cta_primary_url: Schema.Attribute.String;
    hero_cta_secondary_label: Schema.Attribute.String;
    hero_cta_secondary_url: Schema.Attribute.String;
    hero_eyebrow: Schema.Attribute.String;
    hero_panel_items: Schema.Attribute.JSON;
    hero_trust_facts: Schema.Attribute.JSON;
    hreflang_en: Schema.Attribute.String;
    hreflang_ru: Schema.Attribute.String;
    hreflang_uk: Schema.Attribute.String;
    integration_blocks: Schema.Attribute.Component<
      'tenders.integration-block',
      true
    >;
    integrations_title: Schema.Attribute.String;
    internal_links: Schema.Attribute.Component<'tenders.link-item', true>;
    internal_links_title: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::tenders-page.tenders-page'
    > &
      Schema.Attribute.Private;
    meta_description: Schema.Attribute.Text & Schema.Attribute.Required;
    meta_title: Schema.Attribute.String & Schema.Attribute.Required;
    problem_intro: Schema.Attribute.Text;
    problem_summary: Schema.Attribute.Text;
    problem_title: Schema.Attribute.String;
    problems: Schema.Attribute.Component<'tenders.problem-item', true>;
    publishedAt: Schema.Attribute.DateTime;
    roi_intro: Schema.Attribute.Text;
    roi_quote: Schema.Attribute.Text;
    roi_title: Schema.Attribute.String;
    roi_with_items: Schema.Attribute.JSON;
    roi_without_items: Schema.Attribute.JSON;
    schema_type: Schema.Attribute.String;
    section_labels: Schema.Attribute.JSON;
    software_schema: Schema.Attribute.JSON;
    solution_intro: Schema.Attribute.Text;
    solution_steps: Schema.Attribute.Component<'tenders.step-item', true>;
    solution_title: Schema.Attribute.String;
    sticky_cta_primary_label: Schema.Attribute.String;
    sticky_cta_primary_url: Schema.Attribute.String;
    sticky_cta_secondary_label: Schema.Attribute.String;
    sticky_cta_secondary_url: Schema.Attribute.String;
    sticky_cta_text: Schema.Attribute.Text;
    sticky_cta_title: Schema.Attribute.String;
    subtitle: Schema.Attribute.Text;
    target_keywords: Schema.Attribute.JSON;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    use_cases: Schema.Attribute.Component<'tenders.use-case-item', true>;
    use_cases_title: Schema.Attribute.String;
    word_count: Schema.Attribute.Integer;
  };
}

export interface PluginContentReleasesRelease
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_releases';
  info: {
    displayName: 'Release';
    pluralName: 'releases';
    singularName: 'release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    actions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    releasedAt: Schema.Attribute.DateTime;
    scheduledAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['ready', 'blocked', 'failed', 'done', 'empty']
    > &
      Schema.Attribute.Required;
    timezone: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_release_actions';
  info: {
    displayName: 'Release Action';
    pluralName: 'release-actions';
    singularName: 'release-action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentType: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    entryDocumentId: Schema.Attribute.String;
    isEntryValid: Schema.Attribute.Boolean;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    release: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::content-releases.release'
    >;
    type: Schema.Attribute.Enumeration<['publish', 'unpublish']> &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginI18NLocale extends Struct.CollectionTypeSchema {
  collectionName: 'i18n_locale';
  info: {
    collectionName: 'locales';
    description: '';
    displayName: 'Locale';
    pluralName: 'locales';
    singularName: 'locale';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String & Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::i18n.locale'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.SetMinMax<
        {
          max: 50;
          min: 1;
        },
        number
      >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflow
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows';
  info: {
    description: '';
    displayName: 'Workflow';
    name: 'Workflow';
    pluralName: 'workflows';
    singularName: 'workflow';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentTypes: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'[]'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    stageRequiredToPublish: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::review-workflows.workflow-stage'
    >;
    stages: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflowStage
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows_stages';
  info: {
    description: '';
    displayName: 'Stages';
    name: 'Workflow Stage';
    pluralName: 'workflow-stages';
    singularName: 'workflow-stage';
  };
  options: {
    draftAndPublish: false;
    version: '1.1.0';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    color: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#4945FF'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    permissions: Schema.Attribute.Relation<'manyToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    workflow: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::review-workflows.workflow'
    >;
  };
}

export interface PluginUploadFile extends Struct.CollectionTypeSchema {
  collectionName: 'files';
  info: {
    description: '';
    displayName: 'File';
    pluralName: 'files';
    singularName: 'file';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    alternativeText: Schema.Attribute.Text;
    caption: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ext: Schema.Attribute.String;
    focalPoint: Schema.Attribute.JSON;
    folder: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'> &
      Schema.Attribute.Private;
    folderPath: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    formats: Schema.Attribute.JSON;
    hash: Schema.Attribute.String & Schema.Attribute.Required;
    height: Schema.Attribute.Integer;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.file'
    > &
      Schema.Attribute.Private;
    mime: Schema.Attribute.String & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    previewUrl: Schema.Attribute.Text;
    provider: Schema.Attribute.String & Schema.Attribute.Required;
    provider_metadata: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    related: Schema.Attribute.Relation<'morphToMany'>;
    size: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    url: Schema.Attribute.Text & Schema.Attribute.Required;
    width: Schema.Attribute.Integer;
  };
}

export interface PluginUploadFolder extends Struct.CollectionTypeSchema {
  collectionName: 'upload_folders';
  info: {
    displayName: 'Folder';
    pluralName: 'folders';
    singularName: 'folder';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    children: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.folder'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    files: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.file'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.folder'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    parent: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'>;
    path: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    pathId: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.role'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.String & Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    >;
  };
}

export interface PluginUsersPermissionsUser
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'user';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
    timestamps: true;
  };
  attributes: {
    blocked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    confirmationToken: Schema.Attribute.String & Schema.Attribute.Private;
    confirmed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    provider: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ContentTypeSchemas {
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::permission': AdminPermission;
      'admin::role': AdminRole;
      'admin::session': AdminSession;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'admin::user': AdminUser;
      'api::business-type.business-type': ApiBusinessTypeBusinessType;
      'api::business-types-page.business-types-page': ApiBusinessTypesPageBusinessTypesPage;
      'api::channel.channel': ApiChannelChannel;
      'api::competitor.competitor': ApiCompetitorCompetitor;
      'api::feature.feature': ApiFeatureFeature;
      'api::industry.industry': ApiIndustryIndustry;
      'api::integration.integration': ApiIntegrationIntegration;
      'api::landing-page.landing-page': ApiLandingPageLandingPage;
      'api::site-setting.site-setting': ApiSiteSettingSiteSetting;
      'api::solution.solution': ApiSolutionSolution;
      'api::tenders-page.tenders-page': ApiTendersPageTendersPage;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::review-workflows.workflow': PluginReviewWorkflowsWorkflow;
      'plugin::review-workflows.workflow-stage': PluginReviewWorkflowsWorkflowStage;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
    }
  }
}
