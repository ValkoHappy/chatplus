import fs from 'node:fs';
import path from 'node:path';

const portalRoot = process.cwd();
const repoRoot = path.resolve(portalRoot, '..');
const distRoot = path.join(portalRoot, 'dist');
const expectedPublicSiteUrl = (process.env.PUBLIC_SITE_URL || 'https://chatplus.ru').replace(/\/+$/, '');

const sourceFiles = [
  path.join(repoRoot, 'cms', 'seed', 'generated', 'landingPages.json'),
  path.join(repoRoot, 'cms', 'seed', 'generated', 'siteSetting.json'),
  path.join(repoRoot, 'scripts', 'seed-runtime-content.mjs'),
];

const representativeRoutes = [
  '/',
  '/pricing',
  '/channels',
  '/channels/whatsapp',
  '/industries',
  '/industries/fitness',
  '/integrations',
  '/integrations/amocrm',
  '/for',
  '/for/b2b',
  '/compare',
  '/compare/respond-io',
  '/site-map',
  '/docs',
  '/help',
  '/academy',
  '/status',
  '/media',
  '/team',
  '/promo',
  '/prozorro',
  '/vs/wati',
];

const badPatterns = [
  { label: 'question placeholders', regex: /\?{4,}/g },
  { label: 'replacement characters', regex: /�/g },
  { label: 'latin mojibake', regex: /Ð.|Ñ.|Ã.|â€”|â€“|â€|â€¦/g },
  { label: 'cp1251 mojibake', regex: /вЂ|Г—/g },
];

const bannedSourcePhrases = [
  'Academy Chat Plus',
  'Help-страница заведена',
  'special-case',
  'structured page',
  'новой архитектуре сайта',
  'Раздел документации на новой CMS-архитектуре',
];

const bannedHtmlPhrases = [
  'Academy Chat Plus',
  'special-case',
  'structured page',
  'Раздел документации на новой CMS-архитектуре',
  'Help-страница заведена',
];

function routeToFile(route) {
  if (route === '/') {
    return path.join(distRoot, 'index.html');
  }

  return path.join(distRoot, route.replace(/^\//, ''), 'index.html');
}

function scanText(text, patterns, phrases) {
  const findings = [];

  for (const { label, regex } of patterns) {
    if (regex.test(text)) {
      findings.push(label);
    }
  }

  for (const phrase of phrases) {
    if (text.includes(phrase)) {
      findings.push(`banned phrase: ${phrase}`);
    }
  }

  return findings;
}

function assertFile(filePath, issues, label) {
  if (!fs.existsSync(filePath)) {
    issues.push(`${label}: missing file ${path.relative(repoRoot, filePath)}`);
    return false;
  }

  return true;
}

const issues = [];

for (const file of sourceFiles) {
  if (!assertFile(file, issues, 'source')) {
    continue;
  }

  const text = fs.readFileSync(file, 'utf8');
  const findings = scanText(text, badPatterns, bannedSourcePhrases);
  if (findings.length > 0) {
    issues.push(`source ${path.relative(repoRoot, file)} -> ${findings.join(', ')}`);
  }
}

for (const route of representativeRoutes) {
  const file = routeToFile(route);
  if (!assertFile(file, issues, `route ${route}`)) {
    continue;
  }

  const html = fs.readFileSync(file, 'utf8');
  const findings = scanText(html, badPatterns, bannedHtmlPhrases);
  if (findings.length > 0) {
    issues.push(`route ${route} -> ${findings.join(', ')}`);
  }

  if (!/<link[^>]+rel=["']canonical["']/i.test(html)) {
    issues.push(`route ${route} -> missing canonical link`);
  } else if (!html.includes(`href="${expectedPublicSiteUrl}`) && !html.includes(`href='${expectedPublicSiteUrl}`)) {
    issues.push(`route ${route} -> canonical is not anchored to ${expectedPublicSiteUrl}`);
  }

  if (!/<meta[^>]+property=["']og:title["']/i.test(html)) {
    issues.push(`route ${route} -> missing og:title`);
  }

  if (!/<meta[^>]+name=["']twitter:card["']/i.test(html)) {
    issues.push(`route ${route} -> missing twitter:card`);
  }

  if (/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html)) {
    issues.push(`route ${route} -> unexpected noindex`);
  }

  if (/class="card-text(?: text-soft)?"\s*><\/p>/i.test(html)) {
    issues.push(`route ${route} -> contains empty card text block`);
  }
}

const sitemapCandidates = [
  path.join(distRoot, 'sitemap-index.xml'),
  path.join(distRoot, 'sitemap-0.xml'),
  path.join(distRoot, 'sitemap.xml'),
];

if (!sitemapCandidates.some((candidate) => fs.existsSync(candidate))) {
  issues.push('missing sitemap output in portal/dist');
}

if (issues.length > 0) {
  console.error('[content-check] failed');
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log(`[content-check] OK: ${representativeRoutes.length} representative routes and ${sourceFiles.length} source files look clean.`);
