#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const DEFAULT_ROUTES = Object.freeze([
  '/',
  '/promo',
  '/pricing',
  '/partnership',
  '/docs',
  '/media',
  '/team',
  '/conversation',
  '/tv',
  '/channels',
  '/channels/email/amocrm',
  '/compare',
  '/compare/respond-io',
  '/vs/intercom',
  '/solutions/tenders',
  '/features/ai-calendar',
  '/site-map',
]);

const BLOCKLIST_PATTERNS = [
  /^chat plus$/i,
  /^попробовать$/i,
  /^request demo$/i,
  /^home$/i,
  /^карта сайта$/i,
  /^©\s*\d{4}/i,
  /unsupported command-line flag/i,
  /стабильность и безопасность будут нарушены/i,
];

function parseArgs(argv = []) {
  const options = {
    oldOrigin: 'https://astro.integromat.ru',
    localDist: path.resolve(process.cwd(), 'portal', 'dist'),
    routes: [],
    allDist: false,
    maxRoutes: 0,
    json: false,
    problemsOnly: false,
    failOnProblems: false,
    maxMissing: 24,
  };

  for (const arg of argv) {
    if (arg === '--json') options.json = true;
    else if (arg === '--problems') options.problemsOnly = true;
    else if (arg === '--all-dist') options.allDist = true;
    else if (arg === '--fail-on-problems') options.failOnProblems = true;
    else if (arg.startsWith('--route=')) options.routes.push(normalizeRoute(arg.slice('--route='.length)));
    else if (arg.startsWith('--routes=')) {
      options.routes.push(
        ...arg
          .slice('--routes='.length)
          .split(',')
          .map((item) => normalizeRoute(item))
          .filter(Boolean),
      );
    } else if (arg.startsWith('--old-origin=')) {
      options.oldOrigin = arg.slice('--old-origin='.length).replace(/\/+$/, '');
    } else if (arg.startsWith('--local-dist=')) {
      options.localDist = path.resolve(process.cwd(), arg.slice('--local-dist='.length));
    } else if (arg.startsWith('--max-routes=')) {
      options.maxRoutes = Number.parseInt(arg.slice('--max-routes='.length), 10) || 0;
    } else if (arg.startsWith('--max-missing=')) {
      options.maxMissing = Number.parseInt(arg.slice('--max-missing='.length), 10) || options.maxMissing;
    }
  }

  return options;
}

function normalizeRoute(value = '') {
  const trimmed = String(value || '').trim();
  if (!trimmed || trimmed === '/') return '/';
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}`;
}

function routeFromDistFile(filePath, distRoot) {
  const relative = path.relative(distRoot, filePath).replace(/\\/g, '/');
  if (relative === 'index.html') return '/';
  return normalizeRoute(relative.replace(/\/index\.html$/, ''));
}

function listDistRoutes(distRoot) {
  const routes = [];
  const visit = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
      } else if (entry.isFile() && entry.name === 'index.html') {
        routes.push(routeFromDistFile(fullPath, distRoot));
      }
    }
  };

  if (existsSync(distRoot)) visit(distRoot);
  return routes.sort((a, b) => a.localeCompare(b));
}

function htmlPathForRoute(routePath, distRoot) {
  if (routePath === '/') return path.join(distRoot, 'index.html');
  return path.join(distRoot, routePath.replace(/^\/+/, ''), 'index.html');
}

function legacyUrlForRoute(routePath, oldOrigin) {
  return `${oldOrigin}${routePath === '/' ? '/' : routePath}`;
}

function decodeEntities(value = '') {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stripNonContent(html = '') {
  const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  const source = mainMatch ? mainMatch[1] : html;
  return source
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, ' ');
}

function textFromHtml(value = '') {
  return decodeEntities(
    value
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

function normalizeText(value = '') {
  return decodeEntities(value)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[“”„]/g, '"')
    .replace(/[’]/g, "'")
    .trim();
}

function isUsefulChunk(chunk = '') {
  const text = chunk.replace(/\s+/g, ' ').trim();
  if (text.length < 22) return false;
  if (/^[\d\s.,:;!?%+—–-]+$/.test(text)) return false;
  if (BLOCKLIST_PATTERNS.some((pattern) => pattern.test(text))) return false;
  return true;
}

function uniqueChunks(chunks = []) {
  const seen = new Set();
  const result = [];
  for (const chunk of chunks) {
    const clean = chunk.replace(/\s+/g, ' ').trim();
    const key = normalizeText(clean);
    if (!isUsefulChunk(clean) || seen.has(key)) continue;
    seen.add(key);
    result.push(clean);
  }
  return result;
}

function extractChunks(html = '') {
  const content = stripNonContent(html);
  const chunks = [];
  const elementPattern = /<(h[1-4]|p|li|dt|dd|figcaption|blockquote|strong)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match = null;
  while ((match = elementPattern.exec(content))) {
    chunks.push(textFromHtml(match[2]));
  }

  const fallbackText = textFromHtml(content);
  for (const sentence of fallbackText.split(/(?<=[.!?])\s+|\n+/u)) {
    if (sentence.length >= 42 && sentence.length <= 220) chunks.push(sentence);
  }

  return uniqueChunks(chunks);
}

function containsChunk(localText, chunk) {
  const normalizedChunk = normalizeText(chunk);
  if (!normalizedChunk) return true;
  if (localText.includes(normalizedChunk)) return true;

  const compactLocal = localText.replace(/[.,:;!?«»"()]/g, '');
  const compactChunk = normalizedChunk.replace(/[.,:;!?«»"()]/g, '');
  if (compactChunk.length > 0 && compactLocal.includes(compactChunk)) {
    return true;
  }

  const truncationPrefix = compactChunk
    .split(/\u2026|\.{3}|вЂ¦/u)[0]
    ?.trim();
  if (truncationPrefix && truncationPrefix.length >= 24 && compactLocal.includes(truncationPrefix)) {
    return true;
  }

  return isLongChunkCoveredByTokens(localText, normalizedChunk);
}

function isLongChunkCoveredByTokens(localText, normalizedChunk) {
  if (normalizedChunk.length < 55) return false;

  const tokens = Array.from(new Set(
    normalizedChunk
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .split(/\s+/)
      .filter((token) => token.length >= 4),
  ));
  if (tokens.length < 4) return false;

  const matched = tokens.filter((token) => localText.includes(token)).length;
  return matched / tokens.length >= 0.9;
}

async function fetchLegacyHtml(routePath, options) {
  const url = legacyUrlForRoute(routePath, options.oldOrigin);
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'CHATPLUS-local-parity-check/1.0',
      accept: 'text/html,application/xhtml+xml',
    },
  });

  const html = await response.text();
  return {
    url,
    status: response.status,
    ok: response.ok && /text\/html/i.test(response.headers.get('content-type') || ''),
    html,
  };
}

async function analyzeRoute(routePath, options) {
  const localPath = htmlPathForRoute(routePath, options.localDist);
  const localExists = existsSync(localPath);
  const legacy = await fetchLegacyHtml(routePath, options).catch((error) => ({
    url: legacyUrlForRoute(routePath, options.oldOrigin),
    status: 0,
    ok: false,
    html: '',
    error: error.message,
  }));

  if (!localExists || !legacy.ok) {
    return {
      routePath,
      legacyUrl: legacy.url,
      legacyStatus: legacy.status,
      localExists,
      oldChunkCount: 0,
      missingCount: 0,
      coverage: localExists && legacy.ok ? 1 : 0,
      missingChunks: [],
      error: !localExists ? 'local html is missing' : legacy.error || `legacy returned ${legacy.status}`,
    };
  }

  const oldChunks = extractChunks(legacy.html);
  const localText = normalizeText(textFromHtml(stripNonContent(readFileSync(localPath, 'utf8'))));
  const missingChunks = oldChunks.filter((chunk) => !containsChunk(localText, chunk));
  const coverage = oldChunks.length ? (oldChunks.length - missingChunks.length) / oldChunks.length : 1;

  return {
    routePath,
    legacyUrl: legacy.url,
    legacyStatus: legacy.status,
    localExists,
    oldChunkCount: oldChunks.length,
    missingCount: missingChunks.length,
    coverage: Number(coverage.toFixed(4)),
    missingChunks: missingChunks.slice(0, options.maxMissing),
  };
}

function summarize(rows) {
  const comparable = rows.filter((row) => row.localExists && row.legacyStatus >= 200 && row.legacyStatus < 300);
  return {
    total: rows.length,
    comparable: comparable.length,
    missingLocal: rows.filter((row) => !row.localExists).length,
    missingLegacy: rows.filter((row) => row.legacyStatus < 200 || row.legacyStatus >= 300).length,
    withMissingChunks: comparable.filter((row) => row.missingCount > 0).length,
    missingChunks: comparable.reduce((sum, row) => sum + row.missingCount, 0),
    averageCoverage: comparable.length
      ? Number((comparable.reduce((sum, row) => sum + row.coverage, 0) / comparable.length).toFixed(4))
      : 0,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  let routes = options.routes.length ? options.routes : DEFAULT_ROUTES;
  if (options.allDist) routes = listDistRoutes(options.localDist);
  if (options.maxRoutes > 0) routes = routes.slice(0, options.maxRoutes);

  const rows = [];
  for (const routePath of routes) {
    rows.push(await analyzeRoute(routePath, options));
  }

  const outputRows = options.problemsOnly
    ? rows.filter((row) => !row.localExists || row.legacyStatus < 200 || row.legacyStatus >= 300 || row.missingCount > 0)
    : rows;
  const output = {
    oldOrigin: options.oldOrigin,
    localDist: options.localDist,
    summary: summarize(rows),
    rows: outputRows,
  };

  if (options.json) {
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log(`Legacy HTML parity: ${JSON.stringify(output.summary)}`);
    for (const row of outputRows) {
      const status = row.error || row.missingCount > 0 ? 'PROBLEM' : 'ok';
      console.log(`${status} ${row.routePath} coverage=${row.coverage} missing=${row.missingCount}`);
      for (const chunk of row.missingChunks || []) console.log(`  - ${chunk}`);
      if (row.error) console.log(`  - ${row.error}`);
    }
  }

  if (options.failOnProblems && output.summary.withMissingChunks > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

export {
  extractChunks,
  normalizeRoute,
  parseArgs,
  summarize,
};
