#!/usr/bin/env node

import { withLocalStrapi } from './lib/page-v2-document-service.mjs';

function parseArgs(argv) {
  return {
    json: argv.includes('--json'),
    problemsOnly: argv.includes('--problems'),
    routes: argv
      .filter((arg) => arg.startsWith('--route='))
      .map((arg) => normalizeRoute(arg.slice('--route='.length))),
  };
}

function normalizeRoute(value = '') {
  const trimmed = String(value || '').trim();
  if (!trimmed || trimmed === '/') return '/';
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}`;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function blockUid(section) {
  return asString(section?.__component);
}

function isBlank(value) {
  return asString(value).length === 0;
}

function pushIssue(issues, section, code, message, extra = {}) {
  issues.push({
    section: blockUid(section),
    sectionTitle: asString(section?.title),
    code,
    message,
    ...extra,
  });
}

function analyzeSection(section) {
  const issues = [];
  const uid = blockUid(section);

  if (uid === 'page-blocks.hero') {
    if (isBlank(section.title)) pushIssue(issues, section, 'hero.empty_title', 'Hero title is empty.');
    if (isBlank(section.subtitle)) pushIssue(issues, section, 'hero.empty_subtitle', 'Hero subtitle is empty.');
  }

  if (uid === 'page-blocks.cards-grid' || uid === 'page-blocks.feature-list' || uid === 'page-blocks.steps') {
    const items = asArray(section.items);
    if (items.length === 0) pushIssue(issues, section, 'list.empty_items', 'Section has no items.');
    items.forEach((item, index) => {
      if (isBlank(item?.title) && isBlank(item?.label)) {
        pushIssue(issues, section, 'list.item_empty_title', 'Item title/label is empty.', { index });
      }
      if (isBlank(item?.text) && isBlank(item?.description) && isBlank(item?.secondary_text)) {
        pushIssue(issues, section, 'list.item_empty_text', 'Item text/description is empty.', { index });
      }
    });
  }

  if (uid === 'page-blocks.comparison-table') {
    const rows = asArray(section.rows);
    if (rows.length === 0) pushIssue(issues, section, 'comparison.empty_rows', 'Comparison table has no rows.');
    rows.forEach((row, index) => {
      for (const field of ['parameter', 'option_one', 'option_two', 'option_highlight']) {
        if (isBlank(row?.[field])) {
          pushIssue(issues, section, `comparison.empty_${field}`, `Comparison row field ${field} is empty.`, { index });
        }
      }
    });
  }

  if (uid === 'page-blocks.faq') {
    const items = asArray(section.items);
    if (items.length === 0) pushIssue(issues, section, 'faq.empty_items', 'FAQ has no items.');
    items.forEach((item, index) => {
      if (isBlank(item?.question) && isBlank(item?.q)) {
        pushIssue(issues, section, 'faq.empty_question', 'FAQ question is empty.', { index });
      }
      if (isBlank(item?.answer) && isBlank(item?.a)) {
        pushIssue(issues, section, 'faq.empty_answer', 'FAQ answer is empty.', { index });
      }
    });
  }

  if (uid === 'page-blocks.internal-links' || uid === 'page-blocks.related-links') {
    const links = asArray(section.links);
    if (links.length === 0) pushIssue(issues, section, 'links.empty_links', 'Links section has no links.');
    links.forEach((link, index) => {
      if (isBlank(link?.label) && isBlank(link?.title)) {
        pushIssue(issues, section, 'links.empty_label', 'Link label/title is empty.', { index });
      }
      if (isBlank(link?.href) && isBlank(link?.url)) {
        pushIssue(issues, section, 'links.empty_href', 'Link href/url is empty.', { index });
      }
    });
  }

  if (uid === 'page-blocks.pricing-plans') {
    const items = asArray(section.items);
    if (items.length === 0) pushIssue(issues, section, 'pricing.empty_items', 'Pricing plans section has no items.');
    items.forEach((item, index) => {
      if (isBlank(item?.title)) pushIssue(issues, section, 'pricing.empty_title', 'Pricing plan title is empty.', { index });
      if (isBlank(item?.price)) pushIssue(issues, section, 'pricing.empty_price', 'Pricing plan price is empty.', { index });
    });
  }

  if (uid === 'page-blocks.before-after') {
    if (asArray(section.before_items).length === 0) pushIssue(issues, section, 'before_after.empty_before', 'Before list is empty.');
    if (asArray(section.after_items).length === 0) pushIssue(issues, section, 'before_after.empty_after', 'After list is empty.');
  }

  return issues;
}

function analyzePage(page) {
  const issues = asArray(page.sections).flatMap((section) => analyzeSection(section));
  return {
    routePath: normalizeRoute(page.route_path),
    title: asString(page.title),
    family: asString(page.legacy_template_family) || asString(page.page_kind) || 'unknown',
    migrationReady: page.migration_ready === true,
    parityStatus: asString(page.parity_status) || 'unchecked',
    sectionCount: asArray(page.sections).length,
    issueCount: issues.length,
    issues,
  };
}

function summarize(rows) {
  return {
    total: rows.length,
    withIssues: rows.filter((row) => row.issueCount > 0).length,
    issues: rows.reduce((sum, row) => sum + row.issueCount, 0),
    readyWithIssues: rows.filter((row) => row.migrationReady && row.issueCount > 0).length,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const rows = await withLocalStrapi({}, async (strapi) => {
    const pages = await strapi.documents('api::page-v2.page-v2').findMany({
      status: 'published',
      pagination: { pageSize: 1000 },
      populate: {
        sections: { populate: '*' },
      },
    });

    return pages
      .filter((page) => args.routes.length === 0 || args.routes.includes(normalizeRoute(page.route_path)))
      .map(analyzePage);
  });

  const outputRows = args.problemsOnly ? rows.filter((row) => row.issueCount > 0) : rows;
  const output = { summary: summarize(rows), rows: outputRows };

  if (args.json) {
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  console.log(`page_v2 data quality: ${JSON.stringify(output.summary)}`);
  for (const row of outputRows) {
    console.log(`${row.issueCount ? 'PROBLEM' : 'ok'} ${row.routePath} (${row.family}) issues=${row.issueCount}`);
    for (const issue of row.issues.slice(0, 10)) {
      console.log(`  - ${issue.code}: ${issue.message}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
