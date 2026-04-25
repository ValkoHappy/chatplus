#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { withLocalStrapi } from './lib/page-v2-document-service.mjs';
import { normalizePageV2Record } from '../portal/src/lib/strapi-schemas.ts';

function parseArgs(argv) {
  const args = {
    json: false,
    problemsOnly: false,
    routes: [],
  };

  for (const arg of argv) {
    if (arg === '--json') args.json = true;
    else if (arg === '--problems') args.problemsOnly = true;
    else if (arg.startsWith('--route=')) args.routes.push(normalizeRoute(arg.slice('--route='.length)));
  }

  return args;
}

function normalizeRoute(value = '') {
  const trimmed = String(value || '').trim();
  if (!trimmed || trimmed === '/') return '/';
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}`;
}

function normalizeHref(value = '') {
  const href = String(value || '').trim();
  if (!href || href.startsWith('#') || /^[a-z]+:/i.test(href)) return href;
  return normalizeRoute(href);
}

function comparisonEquivalentHref(value = '') {
  const href = normalizeHref(value);
  const match = href.match(/^\/(compare|vs)\/([^/]+)$/);
  if (!match) return href;
  return `/compare/${match[2]}`;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asString(value) {
  return typeof value === 'string' ? value : '';
}

function blockUid(section) {
  return asString(section?.__component) || (asString(section?.block_type) ? `page-blocks.${section.block_type}` : '');
}

const EDITOR_ONLY_MARKER_LABELS = new Set([
  'compare alternatives',
  'comparison faq',
  'compare formats',
  'related comparison pages',
]);

function isEditorOnlyMarker(value) {
  const text = asString(value).replace(/\s+/g, ' ').trim().toLowerCase();
  return EDITOR_ONLY_MARKER_LABELS.has(text);
}

function hasPayload(section) {
  return Boolean(
    asString(section?.title) ||
    asString(section?.intro) ||
    asString(section?.subtitle) ||
    asString(section?.text) ||
    asString(section?.body) ||
    asArray(section?.items).length ||
    asArray(section?.links).length ||
    asArray(section?.rows).length ||
    asArray(section?.before_items).length ||
    asArray(section?.after_items).length
  );
}

export function markersForSection(section) {
  if (!hasPayload(section)) return [];

  const uid = blockUid(section);
  const markers = [];
  const title = asString(section?.title);

  // Some legacy renderers use section titles as editor-only grouping labels.
  // For those blocks, verify the user-visible item payload instead of forcing
  // an internal label to appear in the HTML.
  if (title && uid !== 'page-blocks.proof-stats' && !isEditorOnlyMarker(title)) {
    markers.push({ kind: uid, text: title });
  }

  if (uid === 'page-blocks.hero') {
    for (const fact of asArray(section?.trust_facts).slice(0, 2)) {
      if (asString(fact)) markers.push({ kind: `${uid}:trust_fact`, text: asString(fact) });
    }
  }

  if (uid === 'page-blocks.cards-grid' || uid === 'page-blocks.feature-list' || uid === 'page-blocks.steps') {
    for (const item of asArray(section?.items).slice(0, 3)) {
      const itemTitle = asString(item?.title) || asString(item?.label);
      if (itemTitle) markers.push({ kind: `${uid}:item`, text: itemTitle });
    }
  }

  if (uid === 'page-blocks.proof-stats') {
    for (const item of asArray(section?.items).slice(0, 3)) {
      const value = asString(item?.value) || asString(item?.label) || asString(item?.description);
      if (value) markers.push({ kind: `${uid}:item`, text: value });
    }
  }

  if (uid === 'page-blocks.comparison-table') {
    for (const row of asArray(section?.rows).slice(0, 2)) {
      const parameter = asString(row?.parameter);
      if (parameter) markers.push({ kind: `${uid}:row`, text: parameter });
    }
  }

  if (uid === 'page-blocks.faq') {
    for (const item of asArray(section?.items).slice(0, 2)) {
      const question = asString(item?.question) || asString(item?.q);
      if (question) markers.push({ kind: `${uid}:question`, text: question });
    }
  }

  if (uid === 'page-blocks.internal-links' || uid === 'page-blocks.related-links') {
    for (const link of asArray(section?.links).slice(0, 2)) {
      const label = asString(link?.label) || asString(link?.title);
      if (label) markers.push({ kind: `${uid}:link`, text: label, href: normalizeHref(link?.href) });
    }
  }

  if (uid === 'page-blocks.before-after') {
    for (const item of [...asArray(section?.before_items).slice(0, 1), ...asArray(section?.after_items).slice(0, 1)]) {
      if (asString(item)) markers.push({ kind: `${uid}:item`, text: asString(item) });
    }
  }

  return markers;
}

export function normalizeCoverageMarkers(markers, routePath = '/') {
  const currentRoute = normalizeRoute(routePath);
  const currentComparisonRoute = comparisonEquivalentHref(currentRoute);
  const seenLinkHrefs = new Set();

  return markers.filter((marker) => {
    if (!String(marker?.kind || '').includes(':link') || !marker.href) return true;

    const href = normalizeHref(marker.href);
    if (!href || href.startsWith('#') || /^[a-z]+:/i.test(href)) return true;

    if (href === currentRoute || comparisonEquivalentHref(href) === currentComparisonRoute) {
      return false;
    }

    if (seenLinkHrefs.has(href)) {
      return false;
    }

    seenLinkHrefs.add(href);
    return true;
  });
}

function htmlPathForRoute(routePath) {
  const distRoot = path.resolve(process.cwd(), 'portal', 'dist');
  if (routePath === '/') return path.join(distRoot, 'index.html');
  return path.join(distRoot, routePath.replace(/^\/+/, ''), 'index.html');
}

function htmlToText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function includesText(haystack, needle) {
  const cleanNeedle = needle.replace(/\s+/g, ' ').trim();
  return cleanNeedle.length === 0 || haystack.includes(cleanNeedle);
}

function analyzeRenderedPage(page) {
  const routePath = normalizeRoute(page.route_path);
  const filePath = htmlPathForRoute(routePath);
  const visible = page.is_migration_visible === true;
  const markers = normalizeCoverageMarkers(
    asArray(page.sections).flatMap((section) => markersForSection(section)),
    routePath
  );

  if (!visible) {
    return {
      routePath,
      family: page.legacy_template_family || page.page_kind || 'unknown',
      visible,
      htmlExists: existsSync(filePath),
      markerCount: markers.length,
      missingMarkers: [],
      skippedReason: 'page_v2 is not migration-visible; public route should still be legacy fallback',
    };
  }

  if (!existsSync(filePath)) {
    return {
      routePath,
      family: page.legacy_template_family || page.page_kind || 'unknown',
      visible,
      htmlExists: false,
      markerCount: markers.length,
      missingMarkers: markers,
    };
  }

  const text = htmlToText(readFileSync(filePath, 'utf8'));
  const missingMarkers = markers.filter((marker) => !includesText(text, marker.text));

  return {
    routePath,
    family: page.legacy_template_family || page.page_kind || 'unknown',
    visible,
    htmlExists: true,
    markerCount: markers.length,
    missingMarkers,
  };
}

function summarize(rows) {
  const visibleRows = rows.filter((row) => row.visible);
  return {
    total: rows.length,
    visible: visibleRows.length,
    notVisible: rows.length - visibleRows.length,
    missingHtml: rows.filter((row) => row.visible && !row.htmlExists).length,
    withMissingMarkers: rows.filter((row) => row.visible && row.missingMarkers.length > 0).length,
    missingMarkers: rows.reduce((sum, row) => sum + (row.visible ? row.missingMarkers.length : 0), 0),
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
        breadcrumbs: { populate: '*' },
        internal_links: { populate: '*' },
        parent_page: { populate: '*' },
      },
    });

    return pages
      .map((page) => normalizePageV2Record(page))
      .filter((page) => args.routes.length === 0 || args.routes.includes(normalizeRoute(page.route_path)))
      .map((page) => analyzeRenderedPage(page));
  });

  const outputRows = args.problemsOnly
    ? rows.filter((row) => row.visible && (!row.htmlExists || row.missingMarkers.length > 0))
    : rows;

  const output = {
    summary: summarize(rows),
    rows: outputRows,
  };

  if (args.json) {
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  console.log(`Rendered page_v2 coverage: ${JSON.stringify(output.summary)}`);
  for (const row of outputRows) {
    const status = row.visible
      ? row.missingMarkers.length > 0 || !row.htmlExists
        ? 'PROBLEM'
        : 'ok'
      : 'legacy-fallback';
    console.log(`${status} ${row.routePath} (${row.family}) markers=${row.markerCount} missing=${row.missingMarkers.length}`);
    for (const marker of row.missingMarkers.slice(0, 8)) {
      console.log(`  - ${marker.kind}: ${marker.text}`);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]?.replaceAll('\\', '/')}` || process.argv[1]?.endsWith('report-page-v2-rendered-coverage.mjs')) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
