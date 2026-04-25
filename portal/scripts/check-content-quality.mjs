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

const bannedRenderedCopyPatterns = [
  { label: 'technical FAQ question', regex: /Can this page be edited in Strapi/gi },
  { label: 'technical FAQ answer', regex: /page record owns route, SEO, sections and links/gi },
  { label: 'technical mobile nav title', regex: />\s*Primary\s*</gi },
  { label: 'technical comparison eyebrow', regex: />\s*Comparison\s*</gi },
  { label: 'technical comparison workflow column', regex: /EDITORIAL WORKFLOW/gi },
  { label: 'technical comparison workflow value', regex: /Manual review in Strapi/gi },
  { label: 'technical comparison formats title', regex: /Compare formats/gi },
  { label: 'technical comparison operating-layer fallback', regex: /Chat Plus keeps channels, AI and CRM in one operating layer/gi },
  { label: 'technical comparison workflow fallback', regex: /Chat Plus keeps the workflow in one operating layer/gi },
  { label: 'technical comparison CTA', regex: /Compare the alternative with Chat Plus before publishing/gi },
  { label: 'technical request demo CTA', regex: />\s*Request demo\s*</gi },
  { label: 'technical request comparison CTA', regex: />\s*Request comparison\s*</gi },
  { label: 'proof placeholder', regex: /Proof point/gi },
  { label: 'home proof placeholder', regex: /Home page proof/gi },
  { label: 'migration placeholder', regex: /migration parity check/gi },
  { label: 'managed-page placeholder', regex: /Browse [^<]{0,80} managed through Strapi/gi },
  { label: 'managed-page CTA placeholder', regex: /Create a managed page in Strapi/gi },
];

function listHtmlFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listHtmlFiles(fullPath);
    return entry.isFile() && entry.name.endsWith('.html') ? [fullPath] : [];
  });
}

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

function scanRenderedCopy(html) {
  return bannedRenderedCopyPatterns
    .filter(({ regex }) => regex.test(html))
    .map(({ label }) => label);
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

for (const file of listHtmlFiles(distRoot)) {
  const html = fs.readFileSync(file, 'utf8');
  const findings = scanRenderedCopy(html);
  if (findings.length > 0) {
    issues.push(`built html ${path.relative(distRoot, file)} -> ${findings.join(', ')}`);
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

console.log(`[content-check] OK: ${representativeRoutes.length} representative routes, ${sourceFiles.length} source files and full built HTML look clean.`);
