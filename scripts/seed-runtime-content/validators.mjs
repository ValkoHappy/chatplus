import { isPlainObject } from './ownership.mjs';
import {
  COMPETITOR_REQUIRED_SECTION_LABELS,
  CONTENT_ORIGINS,
  GENERATED_SINGLETON_SLUGS,
  hasMeaningfulValue,
  inferLandingPageContentOrigin,
  inferLandingPageTemplateKind,
  LANDING_PAGE_REQUIRED_FIELDS_BY_TEMPLATE,
  LANDING_PAGE_REQUIRED_SECTION_LABELS,
  LANDING_PAGE_TEMPLATE_KINDS,
  MANAGED_SINGLETON_SLUGS,
  MANAGED_SINGLETON_TEMPLATE_KINDS,
  normalizeLandingPageTemplateKind,
  TENDERS_REQUIRED_SECTION_LABELS,
} from './rules.mjs';

function ensureObject(value, context, field) {
  if (!isPlainObject(value)) {
    throw new Error(`${context}: field "${field}" must be an object`);
  }
}

function ensureArray(value, context, field) {
  if (!Array.isArray(value)) {
    throw new Error(`${context}: field "${field}" must be an array`);
  }
}

function validateSectionLabelKeys(sectionLabels, requiredKeys, context) {
  if (!requiredKeys || requiredKeys.length === 0) {
    return;
  }

  ensureObject(sectionLabels, context, 'section_labels');
  for (const key of requiredKeys) {
    if (!hasMeaningfulValue(sectionLabels[key])) {
      throw new Error(`${context}: missing section_labels.${key}`);
    }
  }
}

function validateObjectArray(items, requiredKeys, context, field) {
  ensureArray(items, context, field);
  for (const [index, item] of items.entries()) {
    if (!isPlainObject(item)) {
      throw new Error(`${context}: ${field}[${index}] must be an object`);
    }

    for (const key of requiredKeys) {
      if (!hasMeaningfulValue(item[key])) {
        throw new Error(`${context}: missing ${field}[${index}].${key}`);
      }
    }
  }
}

function validateStringArray(items, context, field) {
  ensureArray(items, context, field);
  for (const [index, item] of items.entries()) {
    if (!hasMeaningfulValue(item)) {
      throw new Error(`${context}: ${field}[${index}] must be a non-empty string`);
    }
  }
}

function validateEnumValue(name, value, allowedValues, context) {
  if (!value) {
    return;
  }

  if (!allowedValues.has(value)) {
    throw new Error(`${context}: invalid ${name} "${value}"`);
  }
}

function validateUniqueSlugs(endpoint, items) {
  const seen = new Set();
  for (const item of items) {
    const slug = item?.slug;
    if (!slug) {
      throw new Error(`${endpoint}: item without slug`);
    }

    if (seen.has(slug)) {
      throw new Error(`${endpoint}: duplicate slug "${slug}"`);
    }

    seen.add(slug);
  }
}

function validateLandingPage(item) {
  const templateKind = normalizeLandingPageTemplateKind(item.template_kind || inferLandingPageTemplateKind(item.slug));
  const contentOrigin = item.content_origin || inferLandingPageContentOrigin(item.slug);
  const context = `landing-pages/${item.slug || 'unknown'}`;

  validateEnumValue('template_kind', templateKind, LANDING_PAGE_TEMPLATE_KINDS, context);
  validateEnumValue('content_origin', contentOrigin, CONTENT_ORIGINS, context);

  const requiredFields = ['slug', 'meta_title', 'meta_description', 'h1'];
  for (const field of requiredFields) {
    if (!hasMeaningfulValue(item[field])) {
      throw new Error(`${context}: missing required field "${field}"`);
    }
  }

  const templateRequiredFields = LANDING_PAGE_REQUIRED_FIELDS_BY_TEMPLATE[templateKind] || [];
  for (const field of templateRequiredFields) {
    if (!hasMeaningfulValue(item[field])) {
      throw new Error(`${context}: missing template field "${field}" for "${templateKind}"`);
    }
  }

  const expectedTemplateKind = MANAGED_SINGLETON_TEMPLATE_KINDS[item.slug];
  if (expectedTemplateKind && templateKind !== expectedTemplateKind) {
    throw new Error(`${context}: expected template_kind "${expectedTemplateKind}", got "${templateKind}"`);
  }

  if (MANAGED_SINGLETON_SLUGS.has(item.slug) && contentOrigin !== 'managed') {
    throw new Error(`${context}: expected content_origin "managed"`);
  }

  if (GENERATED_SINGLETON_SLUGS.has(item.slug) && contentOrigin !== 'generated') {
    throw new Error(`${context}: expected content_origin "generated"`);
  }

  validateSectionLabelKeys(item.section_labels || {}, LANDING_PAGE_REQUIRED_SECTION_LABELS[templateKind], context);

  if (templateKind === 'home') {
    validateObjectArray(item.proof_facts || [], ['value', 'label'], context, 'proof_facts');
  }

  if (templateKind === 'pricing') {
    validateObjectArray(item.hero_panel_items || [], ['label', 'value', 'text'], context, 'hero_panel_items');
    validateObjectArray(item.pricing_tiers || [], ['label', 'price', 'note', 'cta'], context, 'pricing_tiers');
    validateObjectArray(item.proof_cards || [], ['title', 'text'], context, 'proof_cards');
  }

  if (templateKind === 'partnership') {
    validateStringArray(item.hero_trust_facts || [], context, 'hero_trust_facts');
  }

  if (templateKind === 'resource_hub' || templateKind === 'brand_content' || templateKind === 'campaign') {
    validateStringArray(item.hero_trust_facts || [], context, 'hero_trust_facts');
  }
}

function validateCompetitor(item) {
  const context = `competitors/${item.slug || 'unknown'}`;
  validateEnumValue('content_origin', item.content_origin || 'generated', CONTENT_ORIGINS, context);

  const requiredFields = ['slug', 'name', 'price', 'our_price'];
  for (const field of requiredFields) {
    if (!hasMeaningfulValue(item[field])) {
      throw new Error(`${context}: missing required field "${field}"`);
    }
  }

  if ((item.content_origin || 'generated') !== 'generated') {
    throw new Error(`${context}: competitors must remain content_origin "generated"`);
  }

  if (!hasMeaningfulValue(item.compare_summary)) {
    throw new Error(`${context}: missing required field "compare_summary"`);
  }

  validateStringArray(item.compare_points || [], context, 'compare_points');
  validateSectionLabelKeys(item.section_labels || {}, COMPETITOR_REQUIRED_SECTION_LABELS, context);
}

function validateTendersPage(item) {
  const context = 'tenders-page';
  const contentOrigin = item.content_origin || 'managed';
  validateEnumValue('content_origin', contentOrigin, CONTENT_ORIGINS, context);

  if (contentOrigin !== 'managed') {
    throw new Error(`${context}: expected content_origin "managed"`);
  }

  const requiredFields = ['meta_title', 'meta_description', 'h1', 'subtitle', 'hero_eyebrow', 'sticky_cta_title', 'sticky_cta_text'];
  for (const field of requiredFields) {
    if (!hasMeaningfulValue(item[field])) {
      throw new Error(`${context}: missing required field "${field}"`);
    }
  }

  ensureArray(item.hero_panel_items || [], context, 'hero_panel_items');
  (item.hero_panel_items || []).forEach((panelItem, index) => {
    ensureObject(panelItem, context, `hero_panel_items[${index}]`);

    if (panelItem.accent) {
      if (!hasMeaningfulValue(panelItem.label)) {
        throw new Error(`${context}: missing hero_panel_items[${index}].label`);
      }
      return;
    }

    ['source', 'deadline', 'text'].forEach((field) => {
      if (!hasMeaningfulValue(panelItem[field])) {
        throw new Error(`${context}: missing hero_panel_items[${index}].${field}`);
      }
    });
  });
  validateSectionLabelKeys(item.section_labels || {}, TENDERS_REQUIRED_SECTION_LABELS, context);
}

function validateSiteSetting(item) {
  const requiredFields = ['site_name', 'site_url', 'default_description'];
  for (const field of requiredFields) {
    if (!hasMeaningfulValue(item[field])) {
      throw new Error(`site-setting: missing required field "${field}"`);
    }
  }
}

function validateSeedData({
  channels,
  industries,
  integrations,
  features,
  solutions,
  businessTypes,
  competitors,
  resolvedLandingPages,
  resolvedTendersPage,
  managedSiteSetting,
  siteSetting,
}) {
  validateUniqueSlugs('channels', channels);
  validateUniqueSlugs('industries', industries);
  validateUniqueSlugs('integrations', integrations);
  validateUniqueSlugs('features', features);
  validateUniqueSlugs('solutions', solutions);
  validateUniqueSlugs('business-types', businessTypes);
  validateUniqueSlugs('competitors', competitors);
  validateUniqueSlugs('landing-pages', resolvedLandingPages);

  resolvedLandingPages.forEach(validateLandingPage);
  competitors.forEach(validateCompetitor);
  validateTendersPage(resolvedTendersPage);
  validateSiteSetting(managedSiteSetting || siteSetting);
}

export {
  validateCompetitor,
  validateEnumValue,
  validateLandingPage,
  validateSeedData,
  validateSiteSetting,
  validateTendersPage,
  validateUniqueSlugs,
};
