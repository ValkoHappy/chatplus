#!/usr/bin/env node

import { withLocalStrapi } from './lib/page-v2-document-service.mjs';
import { mapPageV2ToLegacyPage } from '../portal/src/lib/page-v2-legacy-bridge.ts';

const REQUIRED_BLOCKS_BY_FAMILY = {
  home: ['page-blocks.hero', 'page-blocks.proof-stats', 'page-blocks.cards-grid', 'page-blocks.feature-list', 'page-blocks.steps', 'page-blocks.before-after', 'page-blocks.faq', 'page-blocks.internal-links', 'page-blocks.final-cta'],
  pricing: ['page-blocks.hero', 'page-blocks.pricing-plans', 'page-blocks.proof-stats', 'page-blocks.comparison-table', 'page-blocks.before-after', 'page-blocks.faq', 'page-blocks.final-cta'],
  partnership: ['page-blocks.hero', 'page-blocks.cards-grid', 'page-blocks.steps', 'page-blocks.comparison-table', 'page-blocks.before-after', 'page-blocks.faq', 'page-blocks.internal-links', 'page-blocks.final-cta'],
  tenders: ['page-blocks.hero', 'page-blocks.cards-grid', 'page-blocks.steps', 'page-blocks.feature-list', 'page-blocks.comparison-table', 'page-blocks.internal-links', 'page-blocks.final-cta'],
  campaign: ['page-blocks.hero', 'page-blocks.cards-grid', 'page-blocks.steps', 'page-blocks.faq', 'page-blocks.internal-links', 'page-blocks.final-cta'],
  brand: ['page-blocks.hero', 'page-blocks.cards-grid', 'page-blocks.steps', 'page-blocks.faq', 'page-blocks.internal-links', 'page-blocks.final-cta'],
  resource: ['page-blocks.hero', 'page-blocks.rich-text', 'page-blocks.cards-grid', 'page-blocks.faq', 'page-blocks.internal-links', 'page-blocks.final-cta'],
  directory: ['page-blocks.hero', 'page-blocks.cards-grid', 'page-blocks.final-cta'],
  comparison_directory: ['page-blocks.hero', 'page-blocks.cards-grid', 'page-blocks.comparison-table', 'page-blocks.faq', 'page-blocks.internal-links', 'page-blocks.final-cta'],
  comparison: ['page-blocks.hero', 'page-blocks.cards-grid', 'page-blocks.steps', 'page-blocks.comparison-table', 'page-blocks.faq', 'page-blocks.internal-links', 'page-blocks.final-cta'],
  entity_detail: ['page-blocks.hero', 'page-blocks.cards-grid', 'page-blocks.steps', 'page-blocks.feature-list', 'page-blocks.related-links', 'page-blocks.faq', 'page-blocks.internal-links', 'page-blocks.final-cta'],
  entity_intersection: ['page-blocks.hero', 'page-blocks.cards-grid', 'page-blocks.steps', 'page-blocks.feature-list', 'page-blocks.related-links', 'page-blocks.faq', 'page-blocks.internal-links', 'page-blocks.final-cta'],
  ai_calendar: ['page-blocks.hero', 'page-blocks.steps', 'page-blocks.feature-list', 'page-blocks.cards-grid', 'page-blocks.final-cta'],
  site_map: ['page-blocks.hero'],
  demo: ['page-blocks.hero', 'page-blocks.cards-grid', 'page-blocks.feature-list', 'page-blocks.steps', 'page-blocks.before-after', 'page-blocks.faq', 'page-blocks.internal-links', 'page-blocks.final-cta'],
};

const RENDERER_FAMILY_BY_PAGE_FAMILY = {
  entity_detail: 'structured',
  entity_intersection: 'structured',
  demo: 'structured',
};

const PLACEHOLDER_TEXT = [
  'managed through Strapi',
  'Create a managed page in Strapi',
  'Browse features pages managed through Strapi',
  'Browse compare alternatives pages managed through Strapi',
];

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asString(value) {
  return typeof value === 'string' ? value : '';
}

function compact(values) {
  return values.filter((value) => value !== undefined && value !== null && value !== '');
}

function componentUid(section) {
  const explicit = asString(section?.__component);
  if (explicit) return explicit;
  const blockType = asString(section?.block_type);
  return blockType ? `page-blocks.${blockType}` : '';
}

function blockType(section) {
  return asString(section?.block_type) || componentUid(section).split('.').pop() || '';
}

function normalizeSectionForBridge(section) {
  if (!section || typeof section !== 'object') return section;
  return {
    ...section,
    block_type: blockType(section),
  };
}

function normalizePageForBridge(page) {
  return {
    ...page,
    sections: asArray(page?.sections).map((section) => normalizeSectionForBridge(section)),
  };
}

function familyOf(page) {
  return asString(page?.legacy_template_family) || asString(page?.page_kind) || 'unknown';
}

function rendererFamilyFor(family) {
  return RENDERER_FAMILY_BY_PAGE_FAMILY[family] || family;
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  if (value && typeof value === 'object') return Object.keys(value).length > 0;
  return Boolean(value);
}

function anyValue(target, paths) {
  return paths.some((path) => {
    const parts = path.split('.');
    let current = target;
    for (const part of parts) {
      if (!current || typeof current !== 'object') return false;
      current = current[part];
    }
    return hasValue(current);
  });
}

function itemsCount(section) {
  return Math.max(
    asArray(section?.items).length,
    asArray(section?.links).length,
    asArray(section?.rows).length,
    asArray(section?.before_items).length,
    asArray(section?.after_items).length,
  );
}

function hasSectionPayload(section) {
  return Boolean(
    asString(section?.title) ||
    asString(section?.intro) ||
    asString(section?.text) ||
    asString(section?.body) ||
    asString(section?.subtitle) ||
    asString(section?.context_text) ||
    itemsCount(section) > 0,
  );
}

function expectedLegacyPaths(section, pageFamily) {
  const uid = componentUid(section);
  const variant = asString(section?.variant);

  if (uid === 'page-blocks.hero') {
    return ['h1', 'title', 'heroTitle', 'heading'];
  }

  if (uid === 'page-blocks.faq') {
    return ['faqs'];
  }

  if (uid === 'page-blocks.final-cta') {
    return ['sticky_cta_title', 'stickyTitle', 'finalTitle', 'sticky_cta_primary_label', 'stickyPrimaryLabel', 'finalPrimaryLabel'];
  }

  if (uid === 'page-blocks.internal-links') {
    return pageFamily === 'comparison_directory' ? ['vsCards', 'internal_links'] : ['internal_links'];
  }

  if (uid === 'page-blocks.related-links') {
    return ['use_cases', 'internal_links', 'vsCards', 'related_links'];
  }

  if (uid === 'page-blocks.proof-stats') {
    return pageFamily === 'pricing' ? ['proof_cards'] : ['proof_facts'];
  }

  if (uid === 'page-blocks.pricing-plans') {
    return ['pricing_tiers'];
  }

  if (uid === 'page-blocks.comparison-table') {
    return ['comparison_rows'];
  }

  if (uid === 'page-blocks.before-after') {
    return ['roi_without_items', 'roi_with_items', 'roi_title'];
  }

  if (uid === 'page-blocks.steps') {
    return pageFamily === 'ai_calendar' ? ['steps'] : ['solution_steps'];
  }

  if (uid === 'page-blocks.feature-list') {
    if (pageFamily === 'ai_calendar') return ['integrations'];
    return ['features', 'integration_blocks'];
  }

  if (uid === 'page-blocks.rich-text') {
    return ['quote_text'];
  }

  if (uid === 'page-blocks.cards-grid') {
    if (pageFamily === 'directory') return ['items'];
    if (pageFamily === 'comparison_directory') return ['compareCards'];
    if (pageFamily === 'comparison') return ['problems', 'compare_points'];
    if (pageFamily === 'ai_calendar') return ['industries'];
    if (variant === 'integrations') return ['integration_blocks'];
    if (variant === 'problems') return ['problems'];
    return ['features', 'problems', 'items'];
  }

  return [];
}

function normalizeText(value) {
  return asString(value).replace(/\s+/g, ' ').trim().toLowerCase();
}

function findSection(page, type) {
  return asArray(page?.sections).find((section) => blockType(section) === type) || null;
}

function proofStatsDuplicateHeroFacts(section, page) {
  if (componentUid(section) !== 'page-blocks.proof-stats') return false;

  const hero = findSection(page, 'hero');
  if (!hero) return false;

  const heroFacts = asArray(hero.trust_facts).map(normalizeText).filter(Boolean);
  const proofValues = asArray(section.items)
    .map((item) => normalizeText(item?.value || item?.description || item?.label))
    .filter(Boolean);

  return Boolean(
    heroFacts.length &&
      proofValues.length &&
      proofValues.every((value) => heroFacts.includes(value))
  );
}

function intentionallySkippedByBridge(section, pageFamily, page) {
  return pageFamily === 'home' && proofStatsDuplicateHeroFacts(section, page);
}

function makeBridgeLoss(section, pageFamily, mapped, page) {
  if (!hasSectionPayload(section)) return null;
  if (intentionallySkippedByBridge(section, pageFamily, page)) return null;

  const paths = expectedLegacyPaths(section, pageFamily);
  if (paths.length === 0) return null;
  if (anyValue(mapped, paths)) return null;

  return {
    block: componentUid(section),
    variant: asString(section?.variant) || undefined,
    title: asString(section?.title) || undefined,
    expectedLegacyFields: paths,
    reason: 'section exists in page_v2 but no expected legacy renderer field was populated',
  };
}

export function analyzePageV2LegacyParity(page) {
  const pageForBridge = normalizePageForBridge(page);
  const family = familyOf(page);
  const rendererFamily = rendererFamilyFor(family);
  const sections = asArray(pageForBridge?.sections);
  const sectionUids = sections.map(componentUid).filter(Boolean);
  const uniqueSectionUids = [...new Set(sectionUids)];
  const required = REQUIRED_BLOCKS_BY_FAMILY[family] || [];
  const missingRequiredBlocks = required.filter((uid) => !uniqueSectionUids.includes(uid));
  const mapped = mapPageV2ToLegacyPage(pageForBridge, rendererFamily);
  const bridgeLosses = compact(sections.map((section) => makeBridgeLoss(section, family, mapped, pageForBridge)));
  const text = JSON.stringify(page);
  const placeholderHits = PLACEHOLDER_TEXT.filter((needle) => text.includes(needle));

  return {
    routePath: asString(page?.route_path),
    family,
    rendererFamily,
    title: asString(page?.title),
    migrationReady: page?.migration_ready === true,
    parityStatus: asString(page?.parity_status) || 'unchecked',
    sectionCount: sections.length,
    sections: sectionUids,
    missingRequiredBlocks,
    bridgeLosses,
    placeholderHits,
    missingSeo: !(asString(page?.seo_title) && asString(page?.seo_description)),
  };
}

export function summarizePageV2Parity(rows) {
  const summary = {
    total: rows.length,
    ready: 0,
    notReady: 0,
    approved: 0,
    unchecked: 0,
    needsWork: 0,
    withMissingSeo: 0,
    withPlaceholders: 0,
    withMissingRequiredBlocks: 0,
    withBridgeLosses: 0,
    byFamily: {},
  };

  for (const row of rows) {
    if (row.migrationReady) summary.ready += 1;
    else summary.notReady += 1;
    if (row.parityStatus === 'approved') summary.approved += 1;
    if (row.parityStatus === 'unchecked') summary.unchecked += 1;
    if (row.parityStatus === 'needs_work') summary.needsWork += 1;
    if (row.missingSeo) summary.withMissingSeo += 1;
    if (row.placeholderHits?.length) summary.withPlaceholders += 1;
    if (row.missingRequiredBlocks?.length) summary.withMissingRequiredBlocks += 1;
    if (row.bridgeLosses?.length) summary.withBridgeLosses += 1;

    summary.byFamily[row.family] ||= { total: 0, withBridgeLosses: 0, withMissingRequiredBlocks: 0 };
    summary.byFamily[row.family].total += 1;
    if (row.bridgeLosses?.length) summary.byFamily[row.family].withBridgeLosses += 1;
    if (row.missingRequiredBlocks?.length) summary.byFamily[row.family].withMissingRequiredBlocks += 1;
  }

  return summary;
}

function parseArgs(argv = process.argv.slice(2)) {
  return {
    json: argv.includes('--json'),
    onlyProblems: argv.includes('--problems'),
    limit: Number(argv.find((arg) => arg.startsWith('--limit='))?.split('=')[1] || 50),
    route: argv.find((arg) => arg.startsWith('--route='))?.split('=')[1] || '',
    family: argv.find((arg) => arg.startsWith('--family='))?.split('=')[1] || '',
  };
}

async function loadPublishedPages() {
  return withLocalStrapi({ appDir: 'cms' }, async (strapi) => strapi.documents('api::page-v2.page-v2').findMany({
    status: 'published',
    fields: ['route_path', 'title', 'seo_title', 'seo_description', 'canonical', 'legacy_template_family', 'migration_ready', 'parity_status', 'page_kind'],
    populate: {
      sections: { populate: '*' },
      breadcrumbs: { populate: '*' },
      internal_links: { populate: '*' },
    },
    pagination: { pageSize: 1200 },
  }));
}

function problemRows(rows) {
  return rows.filter((row) => (
    row.missingSeo ||
    row.placeholderHits.length > 0 ||
    row.missingRequiredBlocks.length > 0 ||
    row.bridgeLosses.length > 0
  ));
}

function printHumanReport(summary, rows, limit) {
  const problems = problemRows(rows);
  console.log('Page V2 legacy parity report');
  console.log(JSON.stringify(summary, null, 2));

  if (problems.length === 0) {
    console.log('No structural parity problems found.');
    return;
  }

  console.log(`\nProblem routes (${Math.min(limit, problems.length)} of ${problems.length}):`);
  for (const row of problems.slice(0, limit)) {
    console.log(`- ${row.routePath} [${row.family} -> ${row.rendererFamily}]`);
    if (row.missingRequiredBlocks.length) console.log(`  missing blocks: ${row.missingRequiredBlocks.join(', ')}`);
    if (row.bridgeLosses.length) {
      for (const loss of row.bridgeLosses) {
        const variant = loss.variant ? `:${loss.variant}` : '';
        console.log(`  bridge loss: ${loss.block}${variant} -> ${loss.expectedLegacyFields.join(' | ')}`);
      }
    }
    if (row.placeholderHits.length) console.log(`  placeholders: ${row.placeholderHits.join(', ')}`);
    if (row.missingSeo) console.log('  missing seo title/description');
  }
}

export async function runPageV2ParityReport(options = parseArgs()) {
  const pages = await loadPublishedPages();
  let rows = pages.map((page) => analyzePageV2LegacyParity(page));
  if (options.route) rows = rows.filter((row) => row.routePath === options.route);
  if (options.family) rows = rows.filter((row) => row.family === options.family);
  if (options.onlyProblems) rows = problemRows(rows);
  const summary = summarizePageV2Parity(rows);
  return { summary, rows };
}

if (import.meta.url === `file://${process.argv[1]?.replaceAll('\\', '/')}` || process.argv[1]?.endsWith('report-page-v2-parity.mjs')) {
  const options = parseArgs();
  const result = await runPageV2ParityReport(options);
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printHumanReport(result.summary, result.rows, options.limit);
  }
}
