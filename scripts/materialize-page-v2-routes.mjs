import { pathToFileURL } from 'node:url';
import { TextDecoder } from 'node:util';

import { PAGE_V2_BLUEPRINTS } from '../config/page-v2-blueprints.mjs';
import { validatePageV2LayoutParity } from '../config/page-v2-layout-parity.mjs';
import { normalizePageV2RoutePath } from '../config/page-v2-routes.mjs';
import {
  isLocalStrapiUrl,
  syncPublishedDocumentWithService,
  unpublishPageDocumentLocal,
  upsertPageDocumentWithService,
  withLocalStrapi,
} from './lib/page-v2-document-service.mjs';
import {
  LEGACY_MANAGED_ROUTE_CONFIGS,
  buildLegacyManagedPageDraft,
  buildManagedPageDraftFromExistingPage,
  getLegacyManagedRouteConfig,
} from './page-v2-generation/legacy-managed-migration.mjs';

const STRAPI_URL = (process.env.STRAPI_URL || '').replace(/\/+$/, '');
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

const WINDOWS_1251_DECODER = new TextDecoder('windows-1251');
const UTF8_DECODER = new TextDecoder('utf-8', { fatal: false });
const WINDOWS_1251_REVERSE_MAP = (() => {
  const map = new Map();
  for (let byte = 0; byte <= 255; byte += 1) {
    map.set(WINDOWS_1251_DECODER.decode(Uint8Array.from([byte])), byte);
  }
  return map;
})();

function mojibakeScore(value = '') {
  const text = String(value || '');
  const matches = text.match(/[РС][А-Яа-яЁё]|вЂ|В[«»]|Р |РЎ|СЃ|СЂ|С‚|СЊ/g);
  return matches ? matches.length : 0;
}

function repairMojibakeText(value = '') {
  const text = String(value || '');
  const source = mojibakeScore(text) ? text : normalizeTechnicalCopy(text);
  if (!mojibakeScore(source)) {
    return normalizeTechnicalCopy(source);
  }

  const bytes = [];
  for (const char of source) {
    if (WINDOWS_1251_REVERSE_MAP.has(char)) {
      bytes.push(WINDOWS_1251_REVERSE_MAP.get(char));
      continue;
    }

    const code = char.charCodeAt(0);
    if (code <= 0xff) {
      bytes.push(code);
      continue;
    }

    return normalizeTechnicalCopy(source);
  }

  const repaired = UTF8_DECODER.decode(Uint8Array.from(bytes));
  if (!repaired || repaired.includes('\uFFFD')) {
    return normalizeTechnicalCopy(source);
  }

  const best = mojibakeScore(repaired) < mojibakeScore(source) ? repaired : source;
  return normalizeTechnicalCopy(best);
}

function normalizeTechnicalCopy(value = '') {
  const text = String(value || '');
  const replacements = new Map([
    ['Comparison', 'Сравнение'],
    ['Vs', 'Сравнение'],
    ['Compare', 'Сравнения'],
    ['Home', 'Главная'],
    ['Notes', 'На что смотреть'],
    ['Summary', 'Итог'],
    ['Price', 'Стоимость'],
    ['FAQ', 'Частые вопросы'],
    ['Explore', 'По теме страницы'],
    ['Related comparison pages', 'Соседние сравнения'],
    ['Compare formats', 'Соседние сравнения'],
    ['Chat Plus keeps channels, AI and CRM in one operating layer.', 'Chat Plus держит каналы, AI и CRM в одном рабочем контуре.'],
    ['Chat Plus keeps the workflow in one operating layer.', 'Chat Plus держит каналы, AI и CRM в одном рабочем контуре.'],
  ]);

  if (replacements.has(text)) {
    return replacements.get(text);
  }

  const comparisonMatch = text.match(/^(.+?) comparison$/i);
  if (comparisonMatch?.[1]) {
    return `${comparisonMatch[1]} vs Chat Plus`;
  }

  return text;
}

function repairMojibakeDeep(value) {
  if (typeof value === 'string') {
    return repairMojibakeText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => repairMojibakeDeep(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, repairMojibakeDeep(entry)]),
    );
  }

  return value;
}

const COLLECTIONS = Object.freeze({
  channels: { endpoint: 'channels', routeRoot: '/channels', label: 'Channels', singular: 'channel' },
  industries: { endpoint: 'industries', routeRoot: '/industries', label: 'Industries', singular: 'industry' },
  integrations: { endpoint: 'integrations', routeRoot: '/integrations', label: 'Integrations', singular: 'integration' },
  solutions: { endpoint: 'solutions', routeRoot: '/solutions', label: 'Solutions', singular: 'solution' },
  features: { endpoint: 'features', routeRoot: '/features', label: 'Features', singular: 'feature' },
  business_types: { endpoint: 'business-types', routeRoot: '/for', label: 'For business', singular: 'business_type' },
  competitors: { endpoint: 'competitors', routeRoot: '/compare', label: 'Compare', singular: 'competitor' },
});

const LOCAL_ENTITY_UIDS = Object.freeze({
  channels: 'api::channel.channel',
  industries: 'api::industry.industry',
  integrations: 'api::integration.integration',
  solutions: 'api::solution.solution',
  features: 'api::feature.feature',
  'business-types': 'api::business-type.business-type',
  competitors: 'api::competitor.competitor',
  'landing-pages': 'api::landing-page.landing-page',
  'tenders-page': 'api::tenders-page.tenders-page',
  'site-setting': 'api::site-setting.site-setting',
  'page-blueprints': 'api::page-blueprint.page-blueprint',
});

const DIRECTORY_ROUTES = Object.freeze([
  { family: 'directory', key: 'channels', routePath: '/channels', title: 'Channels', collection: 'channels', navGroup: 'catalogs', order: 10 },
  { family: 'directory', key: 'industries', routePath: '/industries', title: 'Industries', collection: 'industries', navGroup: 'catalogs', order: 20 },
  { family: 'directory', key: 'integrations', routePath: '/integrations', title: 'Integrations', collection: 'integrations', navGroup: 'catalogs', order: 30 },
  { family: 'directory', key: 'solutions', routePath: '/solutions', title: 'Solutions', collection: 'solutions', navGroup: 'catalogs', order: 40 },
  { family: 'directory', key: 'features', routePath: '/features', title: 'Features', collection: 'features', navGroup: 'catalogs', order: 50 },
  { family: 'directory', key: 'for', routePath: '/for', title: 'For business', collection: 'business_types', navGroup: 'catalogs', order: 60 },
  { family: 'comparison', key: 'compare', routePath: '/compare', title: 'Сравнение альтернатив', collection: 'competitors', navGroup: 'catalogs', order: 70 },
]);

const DIRECTORY_NAV_LABELS = Object.freeze({
  channels: 'РљР°РЅР°Р»С‹',
  industries: 'РћС‚СЂР°СЃР»Рё',
  integrations: 'РРЅС‚РµРіСЂР°С†РёРё',
  solutions: 'Р РµС€РµРЅРёСЏ',
  features: 'Р’РѕР·РјРѕР¶РЅРѕСЃС‚Рё',
  for: 'Р”Р»СЏ Р±РёР·РЅРµСЃР°',
  compare: 'РЎСЂР°РІРЅРµРЅРёСЏ',
});

const INTERSECTION_FAMILIES = Object.freeze([
  {
    family: 'entity_intersection',
    key: 'channel_industry',
    left: 'channels',
    right: 'industries',
    route: (channel, industry) => `/channels/${channel.slug}/${industry.slug}`,
    title: (channel, industry) => `${channel.name} for ${industry.name}`,
  },
  {
    family: 'entity_intersection',
    key: 'channel_integration',
    left: 'channels',
    right: 'integrations',
    route: (channel, integration) => `/channels/${channel.slug}/${integration.slug}`,
    title: (channel, integration) => `${channel.name} вЂ” ${integration.name}`,
  },
  {
    family: 'entity_intersection',
    key: 'industry_solution',
    left: 'industries',
    right: 'solutions',
    route: (industry, solution) => `/industries/${industry.slug}/${solution.slug}`,
    title: (industry, solution) => `${solution.name} for ${industry.name}`,
  },
  {
    family: 'entity_intersection',
    key: 'integration_solution',
    left: 'integrations',
    right: 'solutions',
    route: (integration, solution) => `/integrations/${integration.slug}/${solution.slug}`,
    title: (integration, solution) => `${integration.name} for ${solution.name}`,
  },
  {
    family: 'entity_intersection',
    key: 'business_type_industry',
    left: 'business_types',
    right: 'industries',
    route: (businessType, industry) => `/for/${businessType.slug}/${industry.slug}`,
    title: (businessType, industry) => `${businessType.name} in ${industry.name}`,
  },
]);

export function parseArgs(argv = []) {
  const options = {
    apply: false,
    publish: false,
    unpublish: false,
    approve: false,
    markNotReady: false,
    unsafePublishAll: false,
    report: false,
    dryRun: false,
    all: false,
    route: '',
    family: '',
    refreshManagedFromLegacy: false,
  };

  for (const arg of argv) {
    if (arg === '--apply') options.apply = true;
    else if (arg === '--publish') options.publish = true;
    else if (arg === '--unpublish') options.unpublish = true;
    else if (arg === '--approve') options.approve = true;
    else if (arg === '--mark-not-ready') options.markNotReady = true;
    else if (arg === '--unsafe-publish-all') options.unsafePublishAll = true;
    else if (arg === '--report') options.report = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--all') options.all = true;
    else if (arg === '--refresh-managed-from-legacy') options.refreshManagedFromLegacy = true;
    else if (arg.startsWith('--route=')) options.route = normalizePageV2RoutePath(arg.split('=')[1] || '');
    else if (arg.startsWith('--family=')) options.family = arg.split('=')[1] || '';
  }

  return options;
}

function requireEnv() {
  if (!STRAPI_URL || !STRAPI_TOKEN) {
    throw new Error('STRAPI_URL and STRAPI_TOKEN are required to materialize page_v2 routes.');
  }
}

async function request(path, init = {}) {
  const response = await fetch(`${STRAPI_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STRAPI_TOKEN}`,
      ...(init.headers || {}),
    },
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${init.method || 'GET'} ${path} failed: ${response.status} ${JSON.stringify(json)}`);
  }

  return json;
}

function unwrapRecord(record) {
  if (!record || typeof record !== 'object') {
    return {};
  }

  return {
    id: record.id,
    documentId: record.documentId,
    ...(record.attributes && typeof record.attributes === 'object' ? record.attributes : record),
  };
}

function asString(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function slugify(value = '') {
  return `${value || ''}`
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9Р°-СЏС‘\s-]/gi, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function routeSlug(routePath = '') {
  const normalized = normalizePageV2RoutePath(routePath);
  return normalized === '/' ? 'home' : normalized.replace(/^\//, '').replace(/\//g, '-');
}

function titleForEntity(entity = {}, fallback = 'Untitled') {
  return asString(entity.name) || asString(entity.title) || asString(entity.label) || fallback;
}

function descriptionForEntity(entity = {}, fallback = '') {
  return asString(entity.description) || asString(entity.hero_description) || asString(entity.short_description) || fallback;
}

function pickFirstMeaningfulString(...values) {
  for (const value of values) {
    const normalized = asString(value);
    if (normalized) {
      return normalized;
    }
  }

  return '';
}

function defaultDirectoryDescription(config = {}) {
  switch (config.key) {
    case 'compare':
      return 'РЎСЂР°РІРЅРёС‚Рµ Chat Plus СЃ Р°Р»СЊС‚РµСЂРЅР°С‚РёРІР°РјРё Рё РІС‹Р±РµСЂРёС‚Рµ РїР»Р°С‚С„РѕСЂРјСѓ, РєРѕС‚РѕСЂР°СЏ Р»СѓС‡С€Рµ РїРѕРґС…РѕРґРёС‚ РїРѕРґ РІР°С€Рё РєР°РЅР°Р»С‹, AI Рё Р°РІС‚РѕРјР°С‚РёР·Р°С†РёСЋ.';
    case 'channels':
      return 'Р’СЃРµ РєР°РЅР°Р»С‹ РѕР±С‰РµРЅРёСЏ СЃ РєР»РёРµРЅС‚Р°РјРё РІ РµРґРёРЅРѕРј РєР°С‚Р°Р»РѕРіРµ: РјРµСЃСЃРµРЅРґР¶РµСЂС‹, email, Р·РІРѕРЅРєРё Рё РѕРјРЅРёРєР°РЅР°Р»СЊРЅС‹Рµ СЃС†РµРЅР°СЂРёРё.';
    case 'industries':
      return 'РџРѕРґР±РµСЂРёС‚Рµ РѕС‚СЂР°СЃР»РµРІРѕР№ СЃС†РµРЅР°СЂРёР№ Chat Plus РґР»СЏ РІР°С€РµР№ РЅРёС€Рё Рё РєРѕРјР°РЅРґС‹.';
    case 'integrations':
      return 'РРЅС‚РµРіСЂР°С†РёРё Chat Plus СЃ CRM, ERP, РєР°Р»РµРЅРґР°СЂСЏРјРё, Р°РЅР°Р»РёС‚РёРєРѕР№ Рё no-code РёРЅСЃС‚СЂСѓРјРµРЅС‚Р°РјРё.';
    case 'solutions':
      return 'Р“РѕС‚РѕРІС‹Рµ СЃС†РµРЅР°СЂРёРё Chat Plus РґР»СЏ РїСЂРѕРґР°Р¶, РїРѕРґРґРµСЂР¶РєРё, РјР°СЂРєРµС‚РёРЅРіР° Рё Р°РІС‚РѕРјР°С‚РёР·Р°С†РёРё РїСЂРѕС†РµСЃСЃРѕРІ.';
    case 'features':
      return 'AI-Р°РіРµРЅС‚С‹, С‡Р°С‚-Р±РѕС‚С‹, СЂР°СЃСЃС‹Р»РєРё, Р°РЅР°Р»РёС‚РёРєР° Рё РґСЂСѓРіРёРµ РІРѕР·РјРѕР¶РЅРѕСЃС‚Рё Chat Plus РІ РѕРґРЅРѕРј РєР°С‚Р°Р»РѕРіРµ.';
    case 'for':
      return 'РџРѕРґР±РµСЂРёС‚Рµ СЃС†РµРЅР°СЂРёР№ Chat Plus РїРѕРґ РІР°С€ С‚РёРї Р±РёР·РЅРµСЃР°, РјР°СЃС€С‚Р°Р± РєРѕРјР°РЅРґС‹ Рё РјРѕРґРµР»СЊ СЂРѕСЃС‚Р°.';
    default:
      return `Browse ${config.title?.toLowerCase?.() || 'pages'} managed through Strapi.`;
  }
}

function defaultDirectoryTitle(config = {}) {
  switch (config.key) {
    case 'compare':
      return 'РЎСЂР°РІРЅРёС‚Рµ Chat Plus СЃ Р°Р»СЊС‚РµСЂРЅР°С‚РёРІР°РјРё';
    case 'features':
      return 'Р’РѕР·РјРѕР¶РЅРѕСЃС‚Рё Chat Plus РґР»СЏ РІР°С€РµРіРѕ Р±РёР·РЅРµСЃР°';
    case 'for':
      return 'Р РµС€РµРЅРёСЏ Chat Plus РґР»СЏ СЂР°Р·РЅС‹С… С‚РёРїРѕРІ Р±РёР·РЅРµСЃР°';
    default:
      return config.title || 'Catalog';
  }
}

function defaultDirectorySubtitle(config = {}) {
  switch (config.key) {
    case 'compare':
      return 'РџРѕСЃРјРѕС‚СЂРёС‚Рµ, С‡РµРј Chat Plus РѕС‚Р»РёС‡Р°РµС‚СЃСЏ РѕС‚ РґСЂСѓРіРёС… РїР»Р°С‚С„РѕСЂРј РѕРјРЅРёРєР°РЅР°Р»СЊРЅРѕСЃС‚Рё, AI Рё РєР»РёРµРЅС‚СЃРєРёС… РєРѕРјРјСѓРЅРёРєР°С†РёР№.';
    case 'features':
      return 'AI-Р°РіРµРЅС‚С‹, С‡Р°С‚-Р±РѕС‚С‹, СЂР°СЃСЃС‹Р»РєРё, Р°РІС‚РѕРјР°С‚РёР·Р°С†РёСЏ, Р°РЅР°Р»РёС‚РёРєР° Рё API вЂ” РІСЃС‘ РґР»СЏ СЂРѕСЃС‚Р° РїСЂРѕРґР°Р¶ Рё СЃРєРѕСЂРѕСЃС‚Рё РѕР±СЂР°Р±РѕС‚РєРё РѕР±СЂР°С‰РµРЅРёР№.';
    case 'for':
      return 'РџРѕРґР±РµСЂРёС‚Рµ СЃС†РµРЅР°СЂРёР№ Chat Plus РїРѕРґ РІР°С€ СЂС‹РЅРѕРє, РјР°СЃС€С‚Р°Р± РєРѕРјР°РЅРґС‹ Рё РјРѕРґРµР»СЊ РѕР±СЃР»СѓР¶РёРІР°РЅРёСЏ РєР»РёРµРЅС‚РѕРІ.';
    default:
      return defaultDirectoryDescription(config);
  }
}

function defaultDirectoryFinalTitle(config = {}) {
  switch (config.key) {
    case 'compare':
      return 'РќСѓР¶РЅР° Р¶РёРІР°СЏ РѕС†РµРЅРєР° РїР»Р°С‚С„РѕСЂРј?';
    case 'features':
      return 'РџРѕРїСЂРѕР±СѓР№С‚Рµ РІСЃРµ РІРѕР·РјРѕР¶РЅРѕСЃС‚Рё Chat Plus';
    case 'for':
      return 'РџРѕРґР±РµСЂРёС‚Рµ СЃС†РµРЅР°СЂРёР№ РїРѕРґ РІР°С€ Р±РёР·РЅРµСЃ';
    default:
      return `Explore ${config.title || 'pages'}`;
  }
}

function linkItem(label, href, description = '') {
  return {
    label,
    href: normalizePageV2RoutePath(href),
    description,
  };
}

function appendUniqueLink(links = [], candidate = null, limit = 18) {
  if (!candidate?.href || !candidate?.label) {
    return links;
  }

  if (links.some((item) => item.href === candidate.href)) {
    return links;
  }

  if (links.length >= limit) {
    return links;
  }

  return [...links, candidate];
}

function entityDetailRoute(collectionKey, entity = {}) {
  const config = COLLECTIONS[collectionKey];
  if (!config || !entity?.slug) {
    return '';
  }

  return `${config.routeRoot}/${entity.slug}`;
}

function hero({
  title,
  subtitle = '',
  eyebrow = '',
  primaryLabel = 'Записаться на демо',
  primaryUrl = '/demo',
  secondaryLabel = '',
  secondaryUrl = '',
  variant = 'default',
  trustFacts = [],
  panelItems = [],
  contextTitle = '',
  contextText = '',
}) {
  return {
    __component: 'page-blocks.hero',
    variant,
    eyebrow,
    title,
    subtitle,
    primary_label: primaryLabel,
    primary_url: primaryUrl,
    secondary_label: secondaryLabel,
    secondary_url: secondaryUrl,
    trust_facts: asArray(trustFacts).filter(Boolean),
    panel_items: asArray(panelItems),
    context_title: contextTitle,
    context_text: contextText,
  };
}

function finalCta(
  title = 'Р“РѕС‚РѕРІС‹ Р·Р°РїСѓСЃС‚РёС‚СЊ СЃС†РµРЅР°СЂРёР№?',
  text = 'РџРѕРєР°Р¶РµРј, РєР°Рє Chat Plus СЂР°Р±РѕС‚Р°РµС‚ РЅР° РІР°С€РµРј РїСЂРѕС†РµСЃСЃРµ Рё РєР°РєРёРµ СЃС‚СЂР°РЅРёС†С‹ РјРѕР¶РЅРѕ СЂР°Р·РІРёРІР°С‚СЊ РґР°Р»СЊС€Рµ.',
  primaryLabel = 'Р—Р°РїРёСЃР°С‚СЊСЃСЏ РЅР° РґРµРјРѕ',
  primaryUrl = '/demo',
  secondaryLabel = 'РџРѕСЃРјРѕС‚СЂРµС‚СЊ С†РµРЅС‹',
  secondaryUrl = '/pricing',
) {
  return {
    __component: 'page-blocks.final-cta',
    title,
    text,
    primary_label: primaryLabel,
    primary_url: primaryUrl,
    secondary_label: secondaryLabel,
    secondary_url: secondaryUrl,
  };
}

function faq(title = 'FAQ', items = [], intro = '') {
  let normalizedItems = asArray(items)
    .map((item) => ({
      question: asString(item.question) || asString(item.q),
      answer: asString(item.answer) || asString(item.a),
    }))
    .filter((item) => item.question || item.answer);

  if (!normalizedItems.length) {
    normalizedItems = [
      {
        question: 'Когда стоит использовать Chat Plus?',
        answer: 'Когда нужно собрать коммуникации, CRM и AI-сценарии в одном рабочем контуре.',
      },
      {
        question: 'Можно ли адаптировать страницу под наш сценарий?',
        answer: 'Да. Контент, SEO, блоки и ссылки можно менять в Strapi под конкретный канал, отрасль или интеграцию.',
      },
    ];
  }

  return {
    __component: 'page-blocks.faq',
    title,
    intro,
    items: normalizedItems,
  };
}

function featureList(title, items = [], intro = '') {
  const normalizedItems = items
    .map((item) => ({
      title: asString(item.title) || asString(item.name) || asString(item.label),
      text: asString(item.text) || asString(item.description),
      icon: asString(item.icon) || 'lucide:check-circle',
      eyebrow: asString(item.eyebrow),
      secondary_text: asString(item.secondary_text),
    }))
    .filter((item) => item.title || item.text);

  return {
    __component: 'page-blocks.feature-list',
    title,
    intro,
    items: normalizedItems.length
      ? normalizedItems
      : [{ title: 'CMS-owned content', text: 'This section is editable through page_v2 blocks.', icon: 'lucide:layout-template' }],
  };
}

function cardsGrid(title, intro, items = [], variant = 'editorial') {
  return {
    __component: 'page-blocks.cards-grid',
    variant,
    title,
    intro,
    items: items
      .map((item) => ({
        title: asString(item.title) || titleForEntity(item),
        text: asString(item.text) || descriptionForEntity(item),
        icon: asString(item.icon) || 'lucide:message-circle',
        eyebrow: asString(item.category) || asString(item.eyebrow),
        secondary_text: asString(item.secondary_text),
        href: asString(item.href),
        url: asString(item.url),
        cta_label: asString(item.cta_label) || asString(item.ctaLabel),
      }))
      .filter((item) => item.title),
  };
}

function steps(title, items) {
  return {
    __component: 'page-blocks.steps',
    variant: 'cards',
    title,
    intro: '',
    items: items.map((item) => ({
      title: asString(item.title),
      text: asString(item.text) || asString(item.description),
      icon: asString(item.icon),
    })),
  };
}

function comparisonTable(
  title,
  rows = [],
  {
    intro = '',
    optionOneLabel = 'Legacy flow',
    optionTwoLabel = 'Manual page layer',
    optionHighlightLabel = 'Chat Plus',
  } = {},
) {
  const normalizedRows = asArray(rows)
    .map((item) => ({
      parameter: asString(item.parameter),
      option_one: asString(item.option_one) || asString(item.email_aggregator),
      option_two: asString(item.option_two) || asString(item.mobile_aggregator),
      option_highlight: asString(item.option_highlight) || asString(item.chat_plus) || asString(item.chatplus),
    }))
    .filter((item) => item.parameter || item.option_one || item.option_two || item.option_highlight);

  return {
    __component: 'page-blocks.comparison-table',
    title,
    intro,
    option_one_label: optionOneLabel,
    option_two_label: optionTwoLabel,
    option_highlight_label: optionHighlightLabel,
    rows: normalizedRows.length
      ? normalizedRows
      : [],
  };
}

function comparisonDirectoryTable(title, competitors = []) {
  const rows = competitors
    .slice(0, 6)
    .map((competitor) => {
      const competitorTitle = titleForEntity(competitor, 'Альтернатива');
      return {
        parameter: competitorTitle,
        option_one: descriptionForEntity(competitor, `Страница сравнения Chat Plus и ${competitorTitle}.`),
        option_two: 'Проверьте стоимость, локальную поддержку, омниканальность и AI-сценарии.',
        option_highlight: 'Chat Plus делает ставку на омниканал, AI и предсказуемую экономику для B2B-команд.',
      };
    });

  return {
    __component: 'page-blocks.comparison-table',
    title,
    intro: 'Короткая карта альтернатив помогает быстро понять, какие различия важны перед выбором платформы.',
    option_one_label: 'Альтернатива',
    option_two_label: 'На что смотреть',
    option_highlight_label: 'Chat Plus',
    rows,
  };
}

const COMPARISON_DIRECTORY_COPY = Object.freeze({
  subtitle: 'Р—РґРµСЃСЊ СЃРѕР±СЂР°РЅС‹ РґРІР° С„РѕСЂРјР°С‚Р° СЃСЂР°РІРЅРµРЅРёСЏ: РїРѕРґСЂРѕР±РЅС‹Рµ СЂР°Р·Р±РѕСЂС‹ РїР»Р°С‚С„РѕСЂРј Рё Р±С‹СЃС‚СЂС‹Рµ СЃС‚СЂР°РЅРёС†С‹ РІС‹Р±РѕСЂР° РјРµР¶РґСѓ Chat Plus Рё Р°Р»СЊС‚РµСЂРЅР°С‚РёРІР°РјРё.',
  compareTitle: 'РџРѕРґСЂРѕР±РЅС‹Рµ СЃСЂР°РІРЅРµРЅРёСЏ',
  compareIntro: 'Р Р°Р·РІРµСЂРЅСѓС‚С‹Рµ compare-СЃС‚СЂР°РЅРёС†С‹ СЃ Р°РєС†РµРЅС‚РѕРј РЅР° РѕС‚Р»РёС‡РёСЏ РїРѕ РјРѕРґРµР»Рё, РѕРіСЂР°РЅРёС‡РµРЅРёСЏРј Рё РїСЂР°РєС‚РёС‡РµСЃРєРѕРјСѓ РІРЅРµРґСЂРµРЅРёСЋ.',
  vsTitle: 'Р¤РѕСЂРјР°С‚ вЂњРёР»Рё Chat PlusвЂќ',
  vsIntro: 'Р‘РѕР»РµРµ РєРѕСЂРѕС‚РєРёРµ vs-СЃС‚СЂР°РЅРёС†С‹ РґР»СЏ РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№, РєРѕС‚РѕСЂС‹Рµ СѓР¶Рµ РІС‹Р±РёСЂР°СЋС‚ РјРµР¶РґСѓ РґРІСѓРјСЏ СЂРµС€РµРЅРёСЏРјРё Рё С…РѕС‚СЏС‚ Р±С‹СЃС‚СЂРѕ СЃРѕСЂРёРµРЅС‚РёСЂРѕРІР°С‚СЊСЃСЏ.',
});

const COMPETITOR_COMPARISON_DESCRIPTIONS = Object.freeze({
  intercom: 'Intercom СЃРёР»С‘РЅ РєР°Рє enterprise helpdesk, РЅРѕ Р±С‹СЃС‚СЂРѕ СЃС‚Р°РЅРѕРІРёС‚СЃСЏ РґРѕСЂРѕРіРёРј Рё С‚СЏР¶С‘Р»С‹Рј РґР»СЏ B2B-РєРѕРјР°РЅРґ, РєРѕС‚РѕСЂС‹Рј РЅСѓР¶РµРЅ РѕРјРЅРёРєР°РЅР°Р», CRM-СЃРІСЏР·РєР° Рё AI Р±РµР· РїРѕСЃС‚РѕСЏРЅРЅС‹С… РґРѕРїР»Р°С‚.',
  tidio: 'Tidio вЂ” СЌС‚Рѕ e-commerce С„РѕРєСѓСЃ Р±РµР· РїРѕР»РЅРѕС†РµРЅРЅРѕР№ B2B-Р»РѕРіРёРєРё РѕРјРЅРёРєР°РЅР°Р»СЊРЅС‹С… РєРѕРјРјСѓРЅРёРєР°С†РёР№.',
  'respond-io': 'Respond.io вЂ” СЌС‚Рѕ РіР»РѕР±Р°Р»СЊРЅС‹Р№ РѕРјРЅРёРєР°РЅР°Р»СЊРЅС‹Р№ РёРЅСЃС‚СЂСѓРјРµРЅС‚ Р±РµР· СЃРёР»СЊРЅРѕР№ Р»РѕРєР°Р»СЊРЅРѕР№ СѓРїР°РєРѕРІРєРё РїРѕРґ РЎРќР“.',
  zendesk: 'Zendesk вЂ” СЌС‚Рѕ С‚СЏР¶С‘Р»С‹Р№ helpdesk, РіРґРµ СЃС‚РѕРёРјРѕСЃС‚СЊ СЂР°СЃС‚С‘С‚ РІРјРµСЃС‚Рµ СЃ РєРѕР»РёС‡РµСЃС‚РІРѕРј Р°РіРµРЅС‚РѕРІ.',
  wati: 'Wati вЂ” СЌС‚Рѕ СѓР·РєРёР№ WhatsApp-first РїСЂРѕРґСѓРєС‚ Р±РµР· РїРѕР»РЅРѕС†РµРЅРЅРѕР№ РѕРјРЅРёРєР°РЅР°Р»СЊРЅРѕСЃС‚Рё.',
});

function comparisonDescriptionFor(competitor = {}) {
  return COMPETITOR_COMPARISON_DESCRIPTIONS[competitor.slug]
    || descriptionForEntity(competitor, `${titleForEntity(competitor, 'Alternative')} comparison page.`);
}

function comparisonStrengthsFor(competitor = {}) {
  const competitorTitle = titleForEntity(competitor, 'Р°Р»СЊС‚РµСЂРЅР°С‚РёРІС‹');
  return [
    `Р‘С‹СЃС‚СЂС‹Р№ Р·Р°РїСѓСЃРє Р±РµР· С‚СЏР¶РµР»РѕРіРѕ enterprise-СЃС‚РµРєР° ${competitorTitle}.`,
    'РћРјРЅРёРєР°РЅР°Р», CRM Рё AI РІ РѕРґРЅРѕРј СЂР°Р±РѕС‡РµРј РєРѕРЅС‚СѓСЂРµ.',
    'РџРѕРЅСЏС‚РЅР°СЏ РјРѕРґРµР»СЊ РІР»Р°РґРµРЅРёСЏ Р±РµР· СЂСѓС‡РЅРѕР№ СЃР±РѕСЂРєРё РёР· СЂР°Р·СЂРѕР·РЅРµРЅРЅС‹С… СЃРµСЂРІРёСЃРѕРІ.',
  ];
}

function comparisonHeroPointsFor(competitor = {}) {
  const explicitPoints = [
    ...asArray(competitor.our_strengths),
    ...asArray(competitor.hero_points),
    ...asArray(competitor.compare_points),
  ]
    .map((item) => asString(item.title) || asString(item.label) || asString(item.text) || asString(item))
    .filter(Boolean);

  return explicitPoints.length ? explicitPoints : comparisonStrengthsFor(competitor);
}

function comparisonDirectoryCards(collection = []) {
  const ordered = [...collection].sort((a, b) => {
    const order = ['intercom', 'tidio', 'respond-io', 'zendesk', 'wati'];
    const left = order.indexOf(a.slug);
    const right = order.indexOf(b.slug);
    return (left === -1 ? 999 : left) - (right === -1 ? 999 : right);
  });

  return ordered.map((competitor) => ({
    ...competitor,
    title: `Chat Plus vs ${titleForEntity(competitor, 'Alternative')}`,
    text: comparisonDescriptionFor(competitor),
    href: `/compare/${competitor.slug}`,
    cta_label: 'РЎРјРѕС‚СЂРµС‚СЊ СЃСЂР°РІРЅРµРЅРёРµ',
  }));
}

function vsDirectoryLinks(collection = []) {
  return comparisonDirectoryCards(collection).map((competitor) => ({
    label: `${titleForEntity(competitor, 'Alternative')} РёР»Рё Chat Plus`,
    href: `/vs/${competitor.slug}`,
    description: comparisonDescriptionFor(competitor),
  }));
}

function orderedDirectoryCollection(config, collection = []) {
  if (config.collection !== 'channels') {
    return collection;
  }

  const order = ['viber', 'sms', 'whatsapp', 'voip', 'instagram', 'email', 'telegram'];
  return [...collection].sort((a, b) => {
    const left = order.indexOf(a.slug);
    const right = order.indexOf(b.slug);
    return (left === -1 ? 999 : left) - (right === -1 ? 999 : right);
  });
}

function relatedLinks(title, links = [], intro = '', eyebrow = 'Explore') {
  return {
    __component: 'page-blocks.related-links',
    eyebrow,
    title,
    intro,
    links,
  };
}

function internalLinks(title, links = [], intro = '', eyebrow = 'Explore') {
  return {
    __component: 'page-blocks.internal-links',
    eyebrow,
    title,
    intro,
    links,
  };
}

function beforeAfter({
  title,
  intro = '',
  beforeTitle = '',
  afterTitle = '',
  beforeItems = [],
  afterItems = [],
  quote = '',
  quoteAuthor = '',
}) {
  return {
    __component: 'page-blocks.before-after',
    title,
    intro,
    before_title: beforeTitle,
    after_title: afterTitle,
    before_items: asArray(beforeItems).filter(Boolean),
    after_items: asArray(afterItems).filter(Boolean),
    quote,
    quote_author: quoteAuthor,
  };
}

function getSiteSettingTemplate(siteSetting, group, key) {
  const template = siteSetting?.page_templates?.[group]?.[key];
  return template && typeof template === 'object' ? template : null;
}

async function fetchSiteSetting() {
  const result = await request('/api/site-setting?populate=*');
  return unwrapRecord(result?.data || result);
}

async function fetchLocalEntityMany(strapi, uid, params = {}) {
  const records = await strapi.entityService.findMany(uid, {
    ...params,
    populate: '*',
  });

  if (Array.isArray(records)) {
    return records.map((item) => unwrapRecord(item));
  }

  return unwrapRecord(records || {});
}

function createDefaultFaqItems(title) {
  return [
    {
      question: `Р§С‚Рѕ РµСЃС‚СЊ РЅР° СЃС‚СЂР°РЅРёС†Рµ В«${title}В»?`,
      answer: 'Р РµРґР°РєС‚РѕСЂ РјРѕР¶РµС‚ РјРµРЅСЏС‚СЊ РєРѕРЅС‚РµРЅС‚, SEO, СЃСЃС‹Р»РєРё Рё Р±Р»РѕРєРё СЃС‚СЂР°РЅРёС†С‹ РІ Strapi.',
    },
  ];
}

function createCommonDetailSections({
  entity,
  eyebrow,
  fallbackTitle,
  useCasesTitle,
  useCasesIntro = '',
  useCasesEyebrow = 'Explore',
  useCasesLinks = [],
  integrationsTitle = '',
  integrationItems = [],
  internalLinksTitle = 'Related pages',
  internalLinksIntro = '',
  internalLinkItems = [],
  comparisonRows = [],
  comparisonLabels,
}) {
  const sections = [
    hero({
      title: asString(entity.h1) || asString(entity.hero_title) || fallbackTitle,
      subtitle: asString(entity.subtitle) || asString(entity.hero_description) || descriptionForEntity(entity),
      eyebrow: asString(entity.hero_eyebrow) || eyebrow,
      primaryLabel: asString(entity.cta) || 'Записаться на демо',
      primaryUrl: '/demo',
      secondaryLabel: asString(entity.hero_secondary_cta_label),
      secondaryUrl: asString(entity.hero_secondary_cta_url),
      trustFacts: asArray(entity.hero_trust_facts),
      panelItems: asArray(entity.hero_panel_items),
      contextTitle: asString(entity.hero_context_title),
      contextText: asString(entity.hero_context_text),
    }),
  ];

  const problemFacts = asArray(entity.problems).length
    ? asArray(entity.problems)
    : asArray(entity.problem_points).map((item) => ({
      title: asString(item),
      text: asString(entity.pain) || descriptionForEntity(entity),
    }));
  const problems = problemFacts.map((item) => ({
    title: asString(item.title) || asString(item.label),
    text:
      asString(item.text)
      || asString(item.description)
      || asString(entity.problem_intro)
      || asString(entity.pain)
      || descriptionForEntity(entity),
  })).filter((item) => item.title || item.text);
  if (problems.length || asString(entity.problem_title) || asString(entity.problem_intro)) {
    sections.push(cardsGrid(
      asString(entity.problem_title) || 'Why teams struggle',
      asString(entity.problem_intro) || asString(entity.pain),
      problems,
      'problems',
    ));
  }

  const solutionSteps = asArray(entity.solution_steps || entity.steps).map((item) => ({
    title: asString(item.title) || asString(item.label),
    text: asString(item.text) || asString(item.desc) || asString(item.description),
    icon: asString(item.icon),
  })).filter((item) => item.title || item.text);
  if (solutionSteps.length || asString(entity.solution_title) || asString(entity.solution_intro) || asString(entity.solution)) {
    sections.push(steps(
      asString(entity.solution_title) || 'How it works',
      solutionSteps.length ? solutionSteps : [{ title: fallbackTitle, text: asString(entity.solution) || descriptionForEntity(entity) }],
    ));
    const solutionPointsIntro = asArray(entity.solution_points)
      .map((item) => asString(item))
      .filter(Boolean)
      .join(' ');
    sections[sections.length - 1].intro = asString(entity.solution_intro) || solutionPointsIntro || asString(entity.solution);
  }

  if (asArray(entity.features).length || asString(entity.features_title)) {
    sections.push(featureList(
      asString(entity.features_title) || 'Included capabilities',
      asArray(entity.features),
    ));
  }

  if (integrationItems.length) {
    sections.push(cardsGrid(
      integrationsTitle || 'Connected tools',
      '',
      integrationItems,
      'integrations',
    ));
  }

  if (
    asString(entity.roi_title)
    || asArray(entity.roi_without_items).length
    || asArray(entity.roi_with_items).length
    || asArray(entity.roi_metrics).length
    || asString(entity.roi_quote)
  ) {
    sections.push(beforeAfter({
      title: asString(entity.roi_title) || 'Before and after',
      intro: asString(entity.roi_intro),
      beforeTitle: asString(entity.roi_without_title) || 'Without Chat Plus',
      afterTitle: asString(entity.roi_with_title) || 'With Chat Plus',
      beforeItems: asArray(entity.roi_without_items).length
        ? entity.roi_without_items
        : problems.map((item) => item.title || item.text).filter(Boolean).slice(0, 3),
      afterItems: asArray(entity.roi_with_items).length
        ? entity.roi_with_items
        : asArray(entity.roi_metrics).length
          ? entity.roi_metrics
          : solutionSteps.map((item) => item.title || item.text).filter(Boolean).slice(0, 3),
      quote: asString(entity.roi_quote),
      quoteAuthor: asString(entity.roi_quote_author),
    }));
  }

  if (comparisonRows.length || asString(entity.comparison_title) || asString(entity.pricing_title)) {
    sections.push(comparisonTable(
      asString(entity.comparison_title) || asString(entity.pricing_title) || 'Comparison',
      comparisonRows,
      comparisonLabels,
    ));
  }

  if (useCasesLinks.length || asString(useCasesTitle)) {
    sections.push(relatedLinks(
      useCasesTitle || 'Where this helps',
      useCasesLinks,
      useCasesIntro,
      useCasesEyebrow,
    ));
  }

  sections.push(faq(
    asString(entity.faq_title) || 'FAQ',
    asArray(entity.faq),
  ));

  sections.push(internalLinks(
    internalLinksTitle,
    internalLinkItems,
    internalLinksIntro,
    'РџРѕ С‚РµРјРµ СЃС‚СЂР°РЅРёС†С‹',
  ));

  sections.push(finalCta(
    asString(entity.sticky_cta_title) || asString(entity.final_cta_title) || `See ${fallbackTitle} in action`,
    asString(entity.sticky_cta_text) || asString(entity.final_cta_text) || descriptionForEntity(entity),
    asString(entity.final_cta_label) || asString(entity.cta) || 'Записаться на демо',
    '/demo',
    asString(entity.pricing_link_label) || 'See pricing',
    '/pricing',
  ));

  return sections;
}

function basePageData({
  routePath,
  title,
  pageKind,
  blueprint,
  templateVariant,
  sourceMode,
  navGroup,
  navLabel,
  navOrder = 100,
  sections,
  description = '',
  showInHeader = false,
  showInFooter = false,
  showInSitemap = true,
}) {
  const normalizedRoutePath = normalizePageV2RoutePath(routePath);
  return {
    title,
    slug: slugify(routeSlug(routePath)) || routeSlug(routePath),
    route_path: normalizedRoutePath,
    locale: 'ru',
    page_kind: pageKind,
    template_variant: templateVariant,
    generation_mode: 'manual',
    source_mode: sourceMode,
    editorial_status: 'approved',
    migration_ready: false,
    parity_status: 'unchecked',
    legacy_template_family: '',
    legacy_layout_signature: {},
    parity_notes: {},
    seo_title: title,
    seo_description: description || `${title} in the Chat Plus page layer.`,
    robots: 'index,follow',
    nav_group: navGroup,
    nav_label: navLabel || title,
    nav_description: description,
    nav_order: navOrder,
    show_in_header: showInHeader,
    show_in_footer: showInFooter,
    show_in_sitemap: showInSitemap,
    breadcrumbs: routePath === '/' ? [] : [linkItem('Home', '/'), linkItem(title, routePath)],
    internal_links: [],
    sections,
    blueprint_id: blueprint,
  };
}

function applyLayoutParityGate(draft, family) {
  const data = draft.data || {};
  const layoutFamily = family || draft.family || data.blueprint_id || data.page_kind || 'unknown';
  const parity = validatePageV2LayoutParity({
    family: layoutFamily,
    routePath: data.route_path || draft.routePath,
    sections: data.sections || [],
    templateVariant: data.template_variant,
  });

  return {
    ...draft,
    data: {
      ...data,
      migration_ready: parity.ok ? Boolean(data.migration_ready) : false,
      parity_status: parity.ok && data.parity_status === 'approved' && data.migration_ready === true
        ? 'approved'
        : parity.status,
      legacy_template_family: layoutFamily,
      legacy_layout_signature: parity.signature,
      parity_notes: {
        ...(data.parity_notes && typeof data.parity_notes === 'object' ? data.parity_notes : {}),
        errors: parity.errors,
        missing_blocks: parity.missing_blocks,
      },
    },
  };
}

async function fetchCollection(endpoint, context = {}) {
  if (context.localStrapi) {
    const uid = LOCAL_ENTITY_UIDS[endpoint];
    if (!uid) {
      throw new Error(`No local entity uid mapping found for endpoint ${endpoint}.`);
    }

    const records = await fetchLocalEntityMany(context.localStrapi, uid);
    return Array.isArray(records) ? records : [];
  }

  const items = [];
  let page = 1;
  let pageCount = 1;

  do {
    const result = await request(`/api/${endpoint}?pagination[page]=${page}&pagination[pageSize]=100&populate=*`);
    const data = Array.isArray(result?.data) ? result.data : [];
    items.push(...data.map((record) => unwrapRecord(record)));
    pageCount = Number(result?.meta?.pagination?.pageCount || 1);
    page += 1;
  } while (page <= pageCount);

  return items;
}

async function fetchLegacyManagedRecord(config, context = {}) {
  const { endpoint, slug } = config.legacySource;

  if (context.localStrapi) {
    if (endpoint === 'landing-pages') {
      const records = await fetchLocalEntityMany(context.localStrapi, LOCAL_ENTITY_UIDS['landing-pages'], {
        filters: { slug },
      });
      return Array.isArray(records) ? records[0] || null : records;
    }

    if (endpoint === 'tenders-page') {
      return fetchLocalEntityMany(context.localStrapi, LOCAL_ENTITY_UIDS['tenders-page']);
    }
  }

  if (endpoint === 'landing-pages') {
    const result = await request(`/api/landing-pages?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=*`);
    return unwrapRecord(result?.data?.[0]);
  }

  if (endpoint === 'tenders-page') {
    const result = await request('/api/tenders-page?populate=*');
    return unwrapRecord(result?.data);
  }

  return null;
}

async function fetchBlueprintMap(context = {}) {
  if (context.localStrapi) {
    const records = await fetchLocalEntityMany(context.localStrapi, LOCAL_ENTITY_UIDS['page-blueprints']);
    const map = new Map();
    for (const item of Array.isArray(records) ? records : [records]) {
      if (item?.blueprint_id) {
        map.set(item.blueprint_id, item.documentId || item.id);
      }
    }
    return map;
  }

  const result = await request('/api/page-blueprints?pagination[pageSize]=100');
  const map = new Map();
  for (const record of Array.isArray(result?.data) ? result.data : []) {
    const item = unwrapRecord(record);
    if (item.blueprint_id) {
      map.set(item.blueprint_id, item.documentId || item.id);
    }
  }
  return map;
}

async function fetchPageV2ByRoute(routePath, context = {}) {
  if (context.localPageService) {
    const normalizedRoutePath = normalizePageV2RoutePath(routePath);
    const draft = (await context.localPageService.findMany({
      status: 'draft',
      filters: { route_path: { $eq: normalizedRoutePath } },
      populate: ['blueprint', 'sections'],
    }))?.[0] || null;

    if (draft) {
      return draft;
    }

    return (await context.localPageService.findMany({
      status: 'published',
      filters: { route_path: { $eq: normalizedRoutePath } },
      populate: ['blueprint', 'sections'],
    }))?.[0] || null;
  }

  const result = await request(`/api/page-v2s?filters[route_path][$eq]=${encodeURIComponent(normalizePageV2RoutePath(routePath))}&populate=*`);
  return result?.data?.[0] || null;
}

async function upsertPageV2(routePath, data, blueprintMap, options = {}) {
  const cleanData = repairMojibakeDeep(data);

  if (isLocalStrapiUrl(STRAPI_URL) && options.localService) {
    return upsertPageDocumentWithService(options.localService, {
      routePath,
      data: cleanData,
      blueprint: blueprintMap.get(cleanData.blueprint_id),
      locale: asString(cleanData.locale, 'ru'),
      publish: Boolean(options.publish),
    });
  }

  const existing = await fetchPageV2ByRoute(routePath);
  const blueprintKey = cleanData.blueprint_id;
  const blueprint = blueprintMap.get(blueprintKey);
  const now = new Date().toISOString();
  const payload = {
    ...cleanData,
    blueprint,
  };
  delete payload.blueprint_id;

  if (options.publish) {
    payload.publishedAt = now;
  }

  if (!existing) {
    const created = await request('/api/page-v2s', {
      method: 'POST',
      body: JSON.stringify({ data: payload }),
    });

    return {
      action: 'created',
      routePath,
      documentId: created?.data?.documentId || created?.data?.id || null,
    };
  }

  const key = existing.documentId || existing.id;
  await request(`/api/page-v2s/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ data: payload }),
  });

  return {
    action: 'updated',
    routePath,
    documentId: key,
  };
}

async function updatePageV2Gate(routePath, gateData) {
  if (isLocalStrapiUrl(STRAPI_URL)) {
    return withLocalStrapi({ appDir: 'cms' }, async (strapi) => {
      const localService = strapi.documents('api::page-v2.page-v2');
      const normalizedRoutePath = normalizePageV2RoutePath(routePath);
      const [draft, published] = await Promise.all([
        localService.findMany({
          status: 'draft',
          filters: { route_path: { $eq: normalizedRoutePath } },
          pagination: { page: 1, pageSize: 1 },
        }).then((items) => items?.[0] || null),
        localService.findMany({
          status: 'published',
          filters: { route_path: { $eq: normalizedRoutePath } },
          pagination: { page: 1, pageSize: 1 },
        }).then((items) => items?.[0] || null),
      ]);

      const existing = draft || published;
      if (!existing) {
        return { action: 'noop-gate-update', routePath, reason: 'page_v2 record not found' };
      }

      const locale = asString(existing.locale, 'ru');
      const documentId = existing.documentId || existing.id;
      await localService.update({
        documentId,
        locale,
        status: 'draft',
        data: gateData,
      });

      if (gateData.migration_ready === true || published) {
        await syncPublishedDocumentWithService(localService, {
          documentId,
          locale,
        });
      }

      return { action: gateData.migration_ready ? 'approved' : 'marked-not-ready', routePath, documentId };
    });
  }

  const existing = await fetchPageV2ByRoute(routePath);
  if (!existing) {
    return { action: 'noop-gate-update', routePath, reason: 'page_v2 record not found' };
  }

  const key = existing.documentId || existing.id;
  await request(`/api/page-v2s/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ data: gateData }),
  });

  return { action: gateData.migration_ready ? 'approved' : 'marked-not-ready', routePath, documentId: key };
}

async function approvePageV2Route(routePath) {
  const existing = unwrapRecord(await fetchPageV2ByRoute(routePath));
  if (!existing || !Object.keys(existing).length) {
    return { action: 'noop-approve', routePath, reason: 'page_v2 record not found' };
  }

  const family = existing.legacy_template_family || inferLayoutFamily({ routePath, data: existing });
  const parity = validatePageV2LayoutParity({
    family,
    routePath: existing.route_path,
    sections: asArray(existing.sections),
    templateVariant: existing.template_variant,
  });

  if (!parity.ok) {
    throw new Error(`Cannot approve ${routePath}: ${parity.errors.join('; ')}`);
  }

  return updatePageV2Gate(routePath, {
    migration_ready: true,
    parity_status: 'approved',
    legacy_template_family: family,
    legacy_layout_signature: parity.signature,
    parity_notes: {
      ...(existing.parity_notes && typeof existing.parity_notes === 'object' ? existing.parity_notes : {}),
      errors: [],
      missing_blocks: [],
      approved_at: new Date().toISOString(),
      approved_by: 'page-v2:materialize --approve',
    },
  });
}

async function markPageV2RouteNotReady(routePath) {
  const existing = unwrapRecord(await fetchPageV2ByRoute(routePath));
  const family = existing.legacy_template_family || inferLayoutFamily({ routePath, data: existing });

  return updatePageV2Gate(routePath, {
    migration_ready: false,
    parity_status: 'unchecked',
    legacy_template_family: family,
    parity_notes: {
      ...(existing.parity_notes && typeof existing.parity_notes === 'object' ? existing.parity_notes : {}),
      marked_not_ready_at: new Date().toISOString(),
      marked_not_ready_by: 'page-v2:materialize --mark-not-ready',
    },
  });
}

async function unpublishPageV2(routePath, localService = null) {
  const normalizedRoutePath = normalizePageV2RoutePath(routePath);
  const existing = localService
    ? (await localService.findMany({
        filters: { route_path: { $eq: normalizedRoutePath } },
        status: 'published',
      }))?.[0] || null
    : await fetchPageV2ByRoute(normalizedRoutePath);
  if (!existing) {
    return { action: 'noop-unpublish', routePath, reason: 'page_v2 record not found' };
  }

  const documentId = existing.documentId || existing.id;
  if (!isLocalStrapiUrl(STRAPI_URL)) {
    throw new Error(
      `True unpublish for ${routePath} requires a local Strapi workspace. Current STRAPI_URL is not local: ${STRAPI_URL}`,
    );
  }

  if (localService) {
    await localService.unpublish({ documentId });
  } else {
    const locale = asString(existing.locale, 'ru');
    await unpublishPageDocumentLocal({ documentId, locale });
  }

  return { action: 'unpublished', routePath, documentId };
}

export function buildDirectoryDraft(config, collections) {
  const collection = orderedDirectoryCollection(config, collections[config.collection] || []);
  const siteSetting = collections.siteSetting || {};
  const templateKey = config.collection === 'business_types' ? 'business_types' : config.key;
  const template = getSiteSettingTemplate(siteSetting, 'directories', templateKey);
  const description = asString(template?.meta_description) || defaultDirectoryDescription(config);
  const routePath = config.routePath;
  const isComparisonRoot = config.family === 'comparison';
  const directoryTitle = isComparisonRoot
    ? 'РЎСЂР°РІРЅРµРЅРёСЏ Chat Plus'
    : asString(template?.h1) || defaultDirectoryTitle(config);
  const directorySubtitle = isComparisonRoot
    ? COMPARISON_DIRECTORY_COPY.subtitle
    : asString(template?.subtitle) || defaultDirectorySubtitle(config);
  const cards = collection.map((item) => ({
    ...item,
    href: `${config.routePath}/${item.slug}`,
    cta_label: asString(item.cta) || asString(template?.card_cta_label),
  }));
  const compareCards = isComparisonRoot ? comparisonDirectoryCards(collection) : cards;
  const comparisonLinks = [
    ...vsDirectoryLinks(collection),
  ];

  return {
    family: config.family,
    routePath,
    data: {
      ...basePageData({
        routePath,
        title: directoryTitle,
        pageKind: config.family === 'comparison' ? 'comparison' : 'directory',
        blueprint: config.family === 'comparison' ? 'comparison' : 'directory',
        templateVariant: config.family === 'comparison' ? 'comparison' : 'directory',
        sourceMode: 'generated',
        navGroup: config.navGroup,
        navLabel: DIRECTORY_NAV_LABELS[config.key] || config.title,
        navOrder: config.order,
        showInHeader: config.family === 'directory',
        showInFooter: true,
        showInSitemap: true,
        description,
        sections: isComparisonRoot
          ? [
            hero({
              title: directoryTitle,
              subtitle: directorySubtitle,
              eyebrow: 'Comparison',
              variant: 'editorial',
              primaryLabel: asString(template?.hero_cta_primary_label) || 'Записаться на демо',
              primaryUrl: asString(template?.hero_cta_primary_url) || '/demo',
            }),
            cardsGrid(COMPARISON_DIRECTORY_COPY.compareTitle, COMPARISON_DIRECTORY_COPY.compareIntro, compareCards),
            comparisonDirectoryTable('Сравнение альтернатив', collection),
            faq('Частые вопросы'),
            internalLinks(COMPARISON_DIRECTORY_COPY.vsTitle, comparisonLinks, COMPARISON_DIRECTORY_COPY.vsIntro),
            finalCta(
              asString(template?.sticky_cta_title) || defaultDirectoryFinalTitle(config),
              asString(template?.sticky_cta_text) || directorySubtitle,
              asString(template?.sticky_cta_primary_label) || 'Записаться на демо',
              asString(template?.sticky_cta_primary_url) || '/demo',
            ),
          ]
          : [
            hero({
              title: directoryTitle,
              subtitle: directorySubtitle,
              eyebrow: 'Catalog',
              variant: 'editorial',
              primaryLabel: asString(template?.hero_cta_primary_label) || 'Записаться на демо',
              primaryUrl: asString(template?.hero_cta_primary_url) || '/demo',
            }),
            cardsGrid(directoryTitle, directorySubtitle, cards),
            finalCta(
              asString(template?.sticky_cta_title) || defaultDirectoryFinalTitle(config),
              asString(template?.sticky_cta_text) || directorySubtitle,
              asString(template?.sticky_cta_primary_label) || 'Записаться на демо',
              asString(template?.sticky_cta_primary_url) || '/demo',
            ),
          ],
      }),
      seo_title: asString(template?.meta_title) || directoryTitle,
      seo_description: description,
    },
  };
}

export function buildEntityDetailDraft(collectionKey, entity, options = {}) {
  const config = COLLECTIONS[collectionKey];
  const title = titleForEntity(entity, config.label);
  const description = descriptionForEntity(entity, `${title} page generated from Strapi entity facts.`);
  const routePath = `${config.routeRoot}/${entity.slug}`;
  let links = [linkItem(config.label, config.routeRoot)];
  for (const relatedLink of asArray(options.relatedLinks)) {
    links = appendUniqueLink(links, relatedLink);
  }

  const relatedEntityLinks = [];
  if (collectionKey !== 'competitors') {
    const siblings = asArray(options.collections?.[collectionKey])
      .filter((item) => item?.slug && item.slug !== entity.slug)
      .slice(0, 4)
      .map((item) => linkItem(titleForEntity(item, 'Related page'), `${config.routeRoot}/${item.slug}`, descriptionForEntity(item)));
    for (const sibling of siblings) {
      links = appendUniqueLink(links, sibling);
    }
  }

  const useCaseLinks = [];
  const integrationItems = [];
  let integrationsTitle = asString(entity.integrations_title);
  let detailUseCasesTitle = asString(entity.use_cases_title) || `Where ${title} helps`;
  let detailUseCasesIntro = '';
  let detailUseCasesEyebrow = 'Explore';
  let detailInternalLinksTitle = asString(entity.internal_links_title) || 'Related pages';
  let detailInternalLinksIntro = '';
  let detailInternalLinkItems = links;
  if (collectionKey === 'channels') {
    for (const item of asArray(options.collections?.industries).slice(0, 4)) {
      useCaseLinks.push(linkItem(titleForEntity(item), `/channels/${entity.slug}/${item.slug}`, descriptionForEntity(item)));
    }
    integrationsTitle = integrationsTitle || `Integrations with ${title}`;
    for (const item of asArray(options.collections?.integrations).slice(0, 6)) {
      integrationItems.push({
        title: titleForEntity(item),
        text: descriptionForEntity(item),
        href: `/integrations/${item.slug}`,
      });
    }
  } else if (collectionKey === 'industries') {
    for (const item of asArray(options.collections?.solutions).slice(0, 4)) {
      useCaseLinks.push(linkItem(titleForEntity(item), `/industries/${entity.slug}/${item.slug}`, descriptionForEntity(item)));
    }
    integrationsTitle = integrationsTitle || `Top channels for ${title}`;
    for (const item of asArray(options.collections?.channels).slice(0, 6)) {
      integrationItems.push({
        title: titleForEntity(item),
        text: descriptionForEntity(item),
        href: `/channels/${item.slug}`,
      });
    }
  } else if (collectionKey === 'integrations') {
    for (const item of asArray(options.collections?.solutions).slice(0, 4)) {
      useCaseLinks.push(linkItem(titleForEntity(item), `/integrations/${entity.slug}/${item.slug}`, descriptionForEntity(item)));
    }
    integrationsTitle = integrationsTitle || `Works with ${title}`;
    for (const item of asArray(options.collections?.solutions).slice(0, 6)) {
      integrationItems.push({
        title: titleForEntity(item),
        text: descriptionForEntity(item),
        href: `/solutions/${item.slug}`,
      });
    }
  } else if (collectionKey === 'features') {
    for (const item of asArray(options.collections?.industries).slice(0, 4)) {
      useCaseLinks.push(linkItem(titleForEntity(item), `/industries/${item.slug}`, descriptionForEntity(item)));
    }
    integrationsTitle = integrationsTitle || `Connected services for ${title}`;
    for (const item of asArray(options.collections?.integrations).slice(0, 6)) {
      integrationItems.push({
        title: titleForEntity(item),
        text: descriptionForEntity(item),
        href: `/integrations/${item.slug}`,
      });
    }
  } else if (collectionKey === 'solutions') {
    for (const item of asArray(options.collections?.industries).slice(0, 4)) {
      useCaseLinks.push(linkItem(titleForEntity(item), `/industries/${item.slug}/${entity.slug}`, descriptionForEntity(item)));
    }
    integrationsTitle = integrationsTitle || `Connected tools for ${title}`;
    for (const item of asArray(options.collections?.integrations).slice(0, 6)) {
      integrationItems.push({
        title: titleForEntity(item),
        text: descriptionForEntity(item),
        href: `/integrations/${item.slug}`,
      });
    }
  } else if (collectionKey === 'business_types') {
    for (const item of asArray(options.collections?.industries)) {
      useCaseLinks.push(linkItem(titleForEntity(item), `/for/${entity.slug}/${item.slug}`, descriptionForEntity(item)));
    }
    detailUseCasesTitle = asString(entity.navigation_groups_title)
      || asString(entity.related_industries_title)
      || `РћС‚СЂР°СЃР»РµРІС‹Рµ СЃС†РµРЅР°СЂРёРё РґР»СЏ ${title}`;
    detailUseCasesIntro = asString(entity.navigation_groups_intro)
      || `Р’С‹Р±РµСЂРёС‚Рµ РЅРёС€Сѓ Рё РѕС‚РєСЂРѕР№С‚Рµ РѕС‚СЂР°СЃР»РµРІРѕР№ СЃС†РµРЅР°СЂРёР№ РґР»СЏ С„РѕСЂРјР°С‚Р° ${title}.`;
    detailUseCasesEyebrow = `РќРёС€Рё РґР»СЏ ${title}`;
    detailInternalLinksTitle = asString(entity.related_types_title) || detailInternalLinksTitle;
    detailInternalLinksIntro = '';
    detailInternalLinkItems = [
      ...asArray(options.collections?.business_types)
        .filter((item) => item?.slug && item.slug !== entity.slug)
        .map((item) => linkItem(titleForEntity(item), `/for/${item.slug}`, descriptionForEntity(item))),
      ...asArray(options.collections?.industries)
        .slice(0, 3)
        .map((item) => linkItem(titleForEntity(item), `/industries/${item.slug}`, descriptionForEntity(item))),
      ...asArray(options.collections?.channels)
        .slice(0, 3)
        .map((item) => linkItem(titleForEntity(item), `/channels/${item.slug}`, descriptionForEntity(item))),
      linkItem(asString(entity.pricing_link_label) || 'РџРѕСЃРјРѕС‚СЂРµС‚СЊ С†РµРЅС‹', '/pricing'),
    ];
    integrationsTitle = integrationsTitle || `Common channels for ${title}`;
    for (const item of asArray(options.collections?.channels).slice(0, 6)) {
      integrationItems.push({
        title: titleForEntity(item),
        text: descriptionForEntity(item),
        href: `/channels/${item.slug}`,
      });
    }
  }

  const sections = collectionKey === 'competitors'
    ? createCommonDetailSections({
        entity: {
          ...entity,
          h1: asString(entity.hero_title) || title,
          subtitle: asString(entity.hero_description) || description,
          hero_eyebrow: asString(entity.hero_eyebrow) || asString(entity.eyebrow) || 'Comparison',
          hero_context_title: 'РЎСЂР°РІРЅРµРЅРёРµ',
          hero_context_text: `РЎСЂР°РІРЅРµРЅРёРµ Chat Plus Рё ${title}: СЃРєРѕСЂРѕСЃС‚СЊ Р·Р°РїСѓСЃРєР°, СЌРєРѕРЅРѕРјРёРєР° РІР»Р°РґРµРЅРёСЏ Рё СѓРїСЂР°РІР»СЏРµРјРѕСЃС‚СЊ РѕРјРЅРёРєР°РЅР°Р»СЊРЅРѕРіРѕ РїСЂРѕС†РµСЃСЃР°.`,
          hero_trust_facts: comparisonHeroPointsFor(entity),
          problem_title: asString(entity.weaknesses_title),
          problem_intro: asString(entity.compare_summary),
          problems: asArray(entity.weaknesses).map((item) => ({
            title: item,
            text: asString(entity.compare_summary) || description,
          })),
          solution_title: asString(entity.strengths_title) || asString(entity.advantages_title),
          solution_intro: asString(entity.advantages_intro),
          solution_steps: comparisonStrengthsFor(entity).map((item) => ({
            title: item,
            text: asString(entity.advantages_intro) || 'Chat Plus держит каналы, AI и CRM в одном рабочем контуре.',
          })),
          comparison_title: asString(entity.pricing_title) || `Сравнение с ${title}`,
          faq_title: asString(entity.faq_title) || 'FAQ',
          sticky_cta_title: asString(entity.final_cta_title) || asString(entity.sticky_cta_title),
          sticky_cta_text: asString(entity.final_cta_text) || asString(entity.sticky_cta_text),
          cta: asString(entity.final_cta_label) || 'Запросить сравнение',
        },
        eyebrow: 'Сравнение',
        fallbackTitle: title,
        useCasesTitle: 'Соседние сравнения',
        useCasesLinks: [
          linkItem('Все сравнения', '/compare'),
          linkItem(`${title} vs Chat Plus`, `/vs/${entity.slug}`, description),
        ],
        internalLinksTitle: 'РЎРѕСЃРµРґРЅРёРµ СЃСЂР°РІРЅРµРЅРёСЏ',
        internalLinksIntro: 'РЎРѕСЃРµРґРЅРёРµ СЃСЂР°РІРЅРµРЅРёСЏ, РµСЃР»Рё РІС‹ РµС‰Рµ РѕС†РµРЅРёРІР°РµС‚Рµ Р°Р»СЊС‚РµСЂРЅР°С‚РёРІС‹ Рё РїРѕРґС…РѕРґСЏС‰РёР№ СЃС‚РµРє.',
        internalLinkItems: links,
        comparisonRows: [
          {
            parameter: asString(entity.pricing_title) || 'Price',
            option_one: asString(entity.price),
            option_two: asString(entity.competitor_price_caption),
            option_highlight: asString(entity.our_price) || asString(entity.our_price_caption),
          },
          {
            parameter: 'Итог',
            option_one: asString(entity.compare_summary),
            option_two: asString(entity.advantages_intro),
            option_highlight: 'Chat Plus держит каналы, AI и CRM в одном рабочем контуре.',
          },
        ],
        comparisonLabels: {
          optionOneLabel: title,
          optionTwoLabel: 'На что смотреть',
          optionHighlightLabel: 'Chat Plus',
        },
      })
    : createCommonDetailSections({
        entity,
        eyebrow: config.label,
        fallbackTitle: title,
        useCasesTitle: detailUseCasesTitle,
        useCasesIntro: detailUseCasesIntro,
        useCasesEyebrow: detailUseCasesEyebrow,
        useCasesLinks: useCaseLinks,
        integrationsTitle,
        integrationItems,
        internalLinksTitle: detailInternalLinksTitle,
        internalLinksIntro: detailInternalLinksIntro,
        internalLinkItems: detailInternalLinkItems,
      });

  const data = {
    ...basePageData({
      routePath,
      title,
      pageKind: collectionKey === 'competitors' ? 'comparison' : 'entity_detail',
      blueprint: collectionKey === 'competitors' ? 'comparison' : 'entity_detail',
      templateVariant: collectionKey === 'competitors' ? 'comparison' : 'default',
      sourceMode: 'generated',
      navGroup: 'catalogs',
      navOrder: 200,
      showInHeader: false,
      showInFooter: false,
      showInSitemap: true,
      description,
      sections,
    }),
    seo_title: asString(entity.seo_title) || title,
    seo_description: asString(entity.seo_description) || description,
    breadcrumbs: [
      linkItem('Home', '/'),
      linkItem(config.label, config.routeRoot),
      linkItem(title, routePath),
    ],
  };

  return {
    family: 'entity_detail',
    routePath,
    data,
  };
}

export function buildVsDraft(competitor) {
  const title = `${titleForEntity(competitor)} РёР»Рё Chat Plus`;
  const routePath = `/vs/${competitor.slug}`;
  const description = descriptionForEntity(competitor, `Compare ${titleForEntity(competitor)} and Chat Plus.`);
  const competitorTitle = titleForEntity(competitor);
  const sections = createCommonDetailSections({
    entity: {
      ...competitor,
      h1: title,
      subtitle: asString(competitor.hero_description) || description,
      hero_eyebrow: 'Vs',
      hero_context_title: 'РЎСЂР°РІРЅРµРЅРёРµ',
      hero_context_text: `РЎСЂР°РІРЅРµРЅРёРµ Chat Plus Рё ${competitorTitle} РїРѕ СЃРєРѕСЂРѕСЃС‚Рё Р·Р°РїСѓСЃРєР°, СЌРєРѕРЅРѕРјРёРєРµ РІР»Р°РґРµРЅРёСЏ Рё СѓРїСЂР°РІР»СЏРµРјРѕСЃС‚Рё РѕРјРЅРёРєР°РЅР°Р»СЊРЅРѕРіРѕ РїСЂРѕС†РµСЃСЃР°.`,
      hero_trust_facts: comparisonHeroPointsFor(competitor),
      problem_title: asString(competitor.weaknesses_title),
      problem_intro: asString(competitor.compare_summary),
      problems: asArray(competitor.weaknesses).map((item) => ({
        title: item,
        text: asString(competitor.compare_summary) || description,
      })),
      solution_title: asString(competitor.strengths_title) || asString(competitor.advantages_title),
      solution_intro: asString(competitor.advantages_intro),
      solution_steps: comparisonStrengthsFor(competitor).map((item) => ({
        title: item,
        text: asString(competitor.advantages_intro) || 'Chat Plus держит каналы, AI и CRM в одном рабочем контуре.',
      })),
      comparison_title: asString(competitor.pricing_title) || title,
      faq_title: asString(competitor.faq_title) || 'FAQ',
      sticky_cta_title: asString(competitor.final_cta_title) || asString(competitor.sticky_cta_title),
      sticky_cta_text: asString(competitor.final_cta_text) || asString(competitor.sticky_cta_text),
      cta: asString(competitor.final_cta_label) || 'Запросить сравнение',
    },
    eyebrow: 'Сравнение',
    fallbackTitle: title,
    useCasesTitle: 'Соседние сравнения',
    useCasesLinks: [
      linkItem(`${competitorTitle} vs Chat Plus`, `/compare/${competitor.slug}`, description),
      linkItem('Все сравнения', '/compare'),
    ],
    internalLinksTitle: 'РЎРѕСЃРµРґРЅРёРµ СЃСЂР°РІРЅРµРЅРёСЏ',
    internalLinksIntro: 'РЎРѕСЃРµРґРЅРёРµ СЃСЂР°РІРЅРµРЅРёСЏ, РµСЃР»Рё РІС‹ РµС‰Рµ РѕС†РµРЅРёРІР°РµС‚Рµ Р°Р»СЊС‚РµСЂРЅР°С‚РёРІС‹ Рё РїРѕРґС…РѕРґСЏС‰РёР№ СЃС‚РµРє.',
    internalLinkItems: [
      linkItem('Все сравнения', '/compare'),
      linkItem(`${competitorTitle} vs Chat Plus`, `/compare/${competitor.slug}`, description),
      linkItem('Цены', '/pricing'),
    ],
    comparisonRows: [
      {
        parameter: asString(competitor.pricing_title) || 'Стоимость',
        option_one: asString(competitor.price),
        option_two: asString(competitor.competitor_price_caption),
        option_highlight: asString(competitor.our_price) || asString(competitor.our_price_caption),
      },
    ],
    comparisonLabels: {
      optionOneLabel: competitorTitle,
      optionTwoLabel: 'На что смотреть',
      optionHighlightLabel: 'Chat Plus',
    },
  });

  const data = {
    ...basePageData({
      routePath,
      title,
      pageKind: 'comparison',
      blueprint: 'comparison',
      templateVariant: 'comparison',
      sourceMode: 'generated',
      navGroup: 'catalogs',
      navOrder: 220,
      showInHeader: false,
      showInFooter: false,
      showInSitemap: true,
      description,
      sections,
    }),
    seo_title: asString(competitor.seo_title) || title,
    seo_description: asString(competitor.seo_description) || description,
    breadcrumbs: [
      linkItem('Главная', '/'),
      linkItem('Сравнения', '/compare'),
      linkItem(competitorTitle, routePath),
    ],
  };

  return {
    family: 'comparison',
    routePath,
    data,
  };
}

function buildIntersectionDraft(config, left, right, collections = {}) {
  const title = config.title(left, right);
  const routePath = normalizePageV2RoutePath(config.route(left, right));
  const isChannelIntegration = config.key === 'channel_integration';
  const leftName = titleForEntity(left);
  const rightName = titleForEntity(right);
  const description = pickFirstMeaningfulString(
    asString(right.subtitle),
    descriptionForEntity(right),
    asString(left.subtitle),
    descriptionForEntity(left),
    `${title} page generated from Strapi entity facts.`,
  );

  const leftRoute = config.left === 'business_types'
    ? `/for/${left.slug}`
    : `${COLLECTIONS[config.left].routeRoot}/${left.slug}`;
  const rightRoute = `${COLLECTIONS[config.right].routeRoot}/${right.slug}`;
  const sharedFeatures = [...asArray(left.features), ...asArray(right.features)].slice(0, 6);
  const solutionSteps = [
    ...asArray(left.solution_steps || left.steps),
    ...asArray(right.solution_steps || right.steps),
  ].slice(0, 6);
  const relatedLinksList = [
    linkItem(titleForEntity(left), leftRoute, descriptionForEntity(left)),
    linkItem(titleForEntity(right), rightRoute, descriptionForEntity(right)),
  ];
  const integrationItems = (collections.integrations || []).slice(0, 6).map((item) => ({
    title: titleForEntity(item),
    text: descriptionForEntity(item),
    href: `/integrations/${item.slug}`,
    cta_label: 'РћС‚РєСЂС‹С‚СЊ РёРЅС‚РµРіСЂР°С†РёСЋ',
  }));

  const sections = createCommonDetailSections({
    entity: {
      h1: title,
      subtitle: isChannelIntegration
        ? `${rightName} РїРѕР»СѓС‡Р°РµС‚ РїРѕР»РЅС‹Р№ РєРѕРЅС‚РµРєСЃС‚ РґРёР°Р»РѕРіР°, Р° РЅРµ РѕР±СЂС‹РІРєРё СЃРѕРѕР±С‰РµРЅРёР№ Рё СЂСѓС‡РЅРѕР№ РїРµСЂРµРЅРѕСЃ.`
        : description,
      hero_eyebrow: 'Use case',
      problem_title: isChannelIntegration
        ? `РџРѕС‡РµРјСѓ ${leftName} РІ ${rightName} С‚СЂРµР±СѓРµС‚ РѕС‚РґРµР»СЊРЅРѕРіРѕ СЃС†РµРЅР°СЂРёСЏ`
        : `РџРѕС‡РµРјСѓ ${leftName} РїРѕРјРѕРіР°РµС‚ РІ СЃС†РµРЅР°СЂРёРё В«${rightName}В»`,
      problem_intro: pickFirstMeaningfulString(
        asString(right.problem_intro),
        asString(right.pain),
        isChannelIntegration
          ? `РљРѕРіРґР° ${rightName} Р¶РёРІС‘С‚ РѕС‚РґРµР»СЊРЅРѕ РѕС‚ РјРµСЃСЃРµРЅРґР¶РµСЂРѕРІ, РєРѕРјР°РЅРґР° РІРёРґРёС‚ С‚РѕР»СЊРєРѕ С‡Р°СЃС‚СЊ РєР»РёРµРЅС‚СЃРєРѕРіРѕ РїСѓС‚Рё Рё С‚РµСЂСЏРµС‚ СЃРєРѕСЂРѕСЃС‚СЊ СЂРµР°РєС†РёРё.`
          : descriptionForEntity(right),
      ),
      problems: asArray(right.problems).length
        ? asArray(right.problems)
        : isChannelIntegration
          ? [
              {
                title: 'РЎРѕРѕР±С‰РµРЅРёСЏ Рё РґР°РЅРЅС‹Рµ СЂР°СЃС…РѕРґСЏС‚СЃСЏ РїРѕ СЂР°Р·РЅС‹Рј СЃРёСЃС‚РµРјР°Рј',
                text: `Р‘РµР· РіР»СѓР±РѕРєРѕР№ СЃРІСЏР·РєРё СЃ ${rightName} РјРµРЅРµРґР¶РµСЂС‹ РІСЂСѓС‡РЅСѓСЋ РїРµСЂРµРЅРѕСЃСЏС‚ РєРѕРЅС‚Р°РєС‚С‹, СЃРґРµР»РєРё, Р·Р°РґР°С‡Рё Рё РєРѕРЅС‚РµРєСЃС‚ РїРµСЂРµРїРёСЃРєРё.`,
              },
              {
                title: 'РќРµС‚ РµРґРёРЅРѕРіРѕ РїСЂРѕС†РµСЃСЃР° РѕС‚ РїРµСЂРІРѕРіРѕ СЃРѕРѕР±С‰РµРЅРёСЏ РґРѕ СЂРµР·СѓР»СЊС‚Р°С‚Р°',
                text: 'РљР»РёРµРЅС‚ РїРёС€РµС‚ РІ РјРµСЃСЃРµРЅРґР¶РµСЂ, РєРѕРјР°РЅРґР° РѕС‚РІРµС‡Р°РµС‚ РІ РѕРґРЅРѕРј РѕРєРЅРµ, Р° РґР°РЅРЅС‹Рµ РґРѕР¶РёРІР°СЋС‚ РґРѕ CRM РёР»Рё СЃРµСЂРІРёСЃР° СѓР¶Рµ СЃ Р·Р°РґРµСЂР¶РєРѕР№ Рё РїРѕС‚РµСЂСЏРјРё.',
              },
              {
                title: 'Р СѓРєРѕРІРѕРґРёС‚РµР»СЊ РЅРµ РїРѕР»СѓС‡Р°РµС‚ РїСЂРѕР·СЂР°С‡РЅРѕР№ РІРѕСЂРѕРЅРєРё',
                text: `Р‘РµР· СЃРєРІРѕР·РЅРѕР№ РёРЅС‚РµРіСЂР°С†РёРё СЃ ${rightName} СЃР»РѕР¶РЅРѕ РёР·РјРµСЂСЏС‚СЊ SLA, РєРѕРЅРІРµСЂСЃРёСЋ Рё СЂРµР°Р»СЊРЅС‹Р№ РІРєР»Р°Рґ РєР°РЅР°Р»Р° РІ РІС‹СЂСѓС‡РєСѓ.`,
              },
            ]
          : asArray(left.problems).slice(0, 4),
      solution_title: isChannelIntegration
        ? `РљР°Рє Chat Plus РЅР°СЃС‚СЂР°РёРІР°РµС‚ ${leftName} РґР»СЏ ${rightName}`
        : `РљР°Рє СЂР°Р±РѕС‚Р°РµС‚ СЃС†РµРЅР°СЂРёР№ ${title}`,
      solution_intro: pickFirstMeaningfulString(
        asString(right.solution_intro),
        asString(right.solution),
        asString(left.solution_intro),
        asString(left.solution),
        isChannelIntegration
          ? `Chat Plus СЃРІСЏР·С‹РІР°РµС‚ РјРµСЃСЃРµРЅРґР¶РµСЂС‹, AI Рё ${rightName} РІ РµРґРёРЅС‹Р№ РїСЂРѕС†РµСЃСЃ, РіРґРµ РєР°Р¶РґРѕРµ РѕР±СЂР°С‰РµРЅРёРµ СЃСЂР°Р·Сѓ РїРѕРїР°РґР°РµС‚ РІ РїСЂР°РІРёР»СЊРЅСѓСЋ РІРѕСЂРѕРЅРєСѓ Рё СЃР»РµРґСѓСЋС‰РёР№ С€Р°Рі.`
          : description,
      ),
      solution_steps: solutionSteps.length || !isChannelIntegration
        ? solutionSteps
        : [
            {
              title: 'РџРѕРґРєР»СЋС‡Р°РµРј РѕС„РёС†РёР°Р»СЊРЅС‹Р№ РєР°РЅР°Р» Рё РјР°СЂС€СЂСѓС‚РёР·Р°С†РёСЋ',
              text: `РџРѕРґРєР»СЋС‡Р°РµРј ${leftName}, РїСЂР°РІР° РґРѕСЃС‚СѓРїР° РєРѕРјР°РЅРґС‹ Рё Р»РѕРіРёРєСѓ РѕР±СЂР°Р±РѕС‚РєРё РІС…РѕРґСЏС‰РёС… Р±РµР· СЃРµСЂС‹С… СЃС…РµРј Рё СЂСѓС‡РЅС‹С… РєРѕСЃС‚С‹Р»РµР№.`,
            },
            {
              title: 'Р’РєР»СЋС‡Р°РµРј AI Рё СЃС†РµРЅР°СЂРёРё РїРµСЂРІРѕРіРѕ РѕС‚РІРµС‚Р°',
              text: 'Chat Plus РѕС‚РІРµС‡Р°РµС‚ РІ РїРµСЂРІС‹Рµ СЃРµРєСѓРЅРґС‹, РєРІР°Р»РёС„РёС†РёСЂСѓРµС‚ Р·Р°РїСЂРѕСЃ, СЃРѕР±РёСЂР°РµС‚ РґР°РЅРЅС‹Рµ Рё РїРµСЂРµРІРѕРґРёС‚ РґРёР°Р»РѕРі РїРѕ РЅСѓР¶РЅРѕРјСѓ СЃС†РµРЅР°СЂРёСЋ.',
            },
            {
              title: 'РЎРёРЅС…СЂРѕРЅРёР·РёСЂСѓРµРј CRM Рё РїРѕСЃР»РµРґСѓСЋС‰РёРµ РєР°СЃР°РЅРёСЏ',
              text: 'РљР°СЂС‚РѕС‡РєР° РєР»РёРµРЅС‚Р°, СЃРґРµР»РєР°, Р·Р°РґР°С‡Р° Рё РїРѕРІС‚РѕСЂРЅС‹Рµ РєР°СЃР°РЅРёСЏ СЃРѕР·РґР°СЋС‚СЃСЏ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё, Р° СЂСѓРєРѕРІРѕРґРёС‚РµР»СЊ РІРёРґРёС‚ РІРµСЃСЊ РїСѓС‚СЊ РѕР±СЂР°С‰РµРЅРёСЏ РѕС‚ РїРµСЂРІРѕРіРѕ СЃРѕРѕР±С‰РµРЅРёСЏ РґРѕ СЂРµР·СѓР»СЊС‚Р°С‚Р°.',
            },
          ],
      features_title: isChannelIntegration
        ? 'Р§С‚Рѕ РІС…РѕРґРёС‚ РІ РіРѕС‚РѕРІС‹Р№ СЃС†РµРЅР°СЂРёР№'
        : `Р§С‚Рѕ РїРѕР»СѓС‡Р°РµС‚ РєРѕРјР°РЅРґР° РІ СЃС†РµРЅР°СЂРёРё В«${title}В»`,
      features: isChannelIntegration
        ? [
            {
              title: 'SMTP РёРЅС‚РµРіСЂР°С†РёСЏ',
              text: `Р”Р°РЅРЅС‹Рµ РїРѕ С‚РµРјРµ В«${leftName}В» СЃРёРЅС…СЂРѕРЅРёР·РёСЂСѓСЋС‚СЃСЏ Р±РµР· СЂСѓС‡РЅРѕРіРѕ РїРµСЂРµРЅРѕСЃР° Рё РїРѕС‚РµСЂРё РєРѕРЅС‚РµРєСЃС‚Р°.`,
            },
            {
              title: 'РЎРёРЅС…СЂРѕРЅРёР·Р°С†РёСЏ РєРѕРЅС‚Р°РєС‚РѕРІ',
              text: 'РљРѕРЅС‚Р°РєС‚С‹ Рё РёСЃС‚РѕСЂРёСЏ РїРµСЂРµРїРёСЃРєРё РѕР±РЅРѕРІР»СЏСЋС‚СЃСЏ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё, РїРѕСЌС‚РѕРјСѓ Сѓ РјРµРЅРµРґР¶РµСЂР° РІСЃРµРіРґР° РїРµСЂРµРґ РіР»Р°Р·Р°РјРё Р°РєС‚СѓР°Р»СЊРЅС‹Р№ РєРѕРЅС‚РµРєСЃС‚.',
            },
            {
              title: 'Р¤СѓРЅРєС†РёСЏ СЂР°Р±РѕС‚Р°РµС‚ РєР°Рє С‡Р°СЃС‚СЊ РµРґРёРЅРѕРіРѕ РїСЂРѕС†РµСЃСЃР°',
              text: 'Р¤СѓРЅРєС†РёСЏ СЂР°Р±РѕС‚Р°РµС‚ РєР°Рє С‡Р°СЃС‚СЊ РµРґРёРЅРѕРіРѕ РїСЂРѕС†РµСЃСЃР° Chat Plus, Р° РЅРµ РєР°Рє РѕС‚РґРµР»СЊРЅС‹Р№ СЂР°Р·СЂРѕР·РЅРµРЅРЅС‹Р№ РёРЅСЃС‚СЂСѓРјРµРЅС‚.',
            },
            {
              title: 'Р•РґРёРЅР°СЏ РёСЃС‚РѕСЂРёСЏ РѕР±С‰РµРЅРёСЏ',
              text: 'Р’СЃСЏ РёСЃС‚РѕСЂРёСЏ РѕР±С‰РµРЅРёСЏ СЃРѕР±РёСЂР°РµС‚СЃСЏ РІ РѕРґРЅРѕРј РѕРєРЅРµ Рё РЅРµ СЂР°СЃРїР°РґР°РµС‚СЃСЏ РјРµР¶РґСѓ РјРµРЅРµРґР¶РµСЂР°РјРё Рё РєР°РЅР°Р»Р°РјРё.',
            },
            {
              title: 'РђРІС‚РѕРјР°С‚РёС‡РµСЃРєРѕРµ СЃРѕР·РґР°РЅРёРµ Р»РёРґРѕРІ',
              text: 'РќРѕРІС‹Рµ РѕР±СЂР°С‰РµРЅРёСЏ СЃСЂР°Р·Сѓ СЃРѕР·РґР°СЋС‚ СЃРґРµР»РєСѓ РёР»Рё Р»РёРґ РІ РЅСѓР¶РЅРѕР№ РІРѕСЂРѕРЅРєРµ, Р±РµР· СЂСѓС‡РЅРѕРіРѕ СЃРѕР·РґР°РЅРёСЏ РєР°СЂС‚РѕС‡РµРє.',
            },
          ]
        : sharedFeatures,
      faq_title: asString(right.faq_title) || asString(left.faq_title) || 'FAQ',
      faq: asArray(right.faq).length ? asArray(right.faq) : asArray(left.faq),
      sticky_cta_title: isChannelIntegration ? `Р—Р°РїСѓСЃС‚РёС‚Рµ ${leftName} РґР»СЏ ${rightName}` : `Р—Р°РїСѓСЃС‚РёС‚Рµ СЃС†РµРЅР°СЂРёР№ ${title}`,
      sticky_cta_text: isChannelIntegration
        ? `Р“РѕС‚РѕРІС‹Р№ СЃС†РµРЅР°СЂРёР№ ${leftName} РґР»СЏ ${rightName} Р·Р°РїСѓСЃРєР°РµС‚СЃСЏ Р·Р° 30 РјРёРЅСѓС‚ Р±РµР· СѓС‡Р°СЃС‚РёСЏ СЂР°Р·СЂР°Р±РѕС‚С‡РёРєР°.`
        : description,
      cta: 'Р—Р°РїРёСЃР°С‚СЊСЃСЏ РЅР° РґРµРјРѕ',
    },
    eyebrow: 'Use case',
    fallbackTitle: title,
    useCasesTitle: 'РЎРІСЏР·Р°РЅРЅС‹Рµ СЃС‚СЂР°РЅРёС†С‹',
    useCasesLinks: relatedLinksList,
    integrationsTitle: 'РџРѕР»РµР·РЅС‹Рµ РёРЅС‚РµРіСЂР°С†РёРё РґР»СЏ СЌС‚РѕРіРѕ СЃС†РµРЅР°СЂРёСЏ',
    integrationItems,
    internalLinksTitle: 'РЎР»РµРґСѓСЋС‰РёРµ С€Р°РіРё',
    internalLinksIntro: 'РљРѕСЂРѕС‚РєРёРµ РїРµСЂРµС…РѕРґС‹ РІ СЃРѕСЃРµРґРЅРёРµ СЂР°Р·РґРµР»С‹, РµСЃР»Рё С…РѕС‚РёС‚Рµ СЃРѕР±СЂР°С‚СЊ СЂРµС€РµРЅРёРµ РїРѕРґ СЃРІРѕР№ РїСЂРѕС†РµСЃСЃ.',
    internalLinkItems: relatedLinksList,
  });

  return {
    family: config.family,
    routePath,
    data: basePageData({
      routePath,
      title,
      pageKind: 'entity_intersection',
      blueprint: 'entity_intersection',
      templateVariant: 'showcase',
      sourceMode: 'generated',
      navGroup: 'catalogs',
      navOrder: 300,
      showInHeader: false,
      showInFooter: false,
      showInSitemap: true,
      description,
      sections,
    }),
  };
}

function buildSystemDraft(routePath, title, templateVariant = 'minimal') {
  const description = `${title} system page owned by Strapi with legacy renderer fallback preserved.`;
  return {
    family: 'system',
    routePath,
    data: basePageData({
      routePath,
      title,
      pageKind: 'system',
      blueprint: 'system',
      templateVariant,
      sourceMode: 'managed',
      navGroup: 'resources',
      navOrder: 900,
      showInHeader: false,
      showInFooter: false,
      showInSitemap: true,
      description,
      sections: [
        {
          __component: 'page-blocks.rich-text',
          title,
          body: description,
        },
      ],
    }),
  };
}

export function buildSiteMapDraft() {
  const routePath = '/site-map';
  const description = 'HTML-РєР°СЂС‚Р° СЃР°Р№С‚Р° Chat Plus СЃРѕ СЃС‚Р°СЂС‹Рј site-map РјР°РєРµС‚РѕРј Рё Strapi-owned hero-РєРѕРЅС‚РµРЅС‚РѕРј.';

  return {
    family: 'system',
    routePath,
    data: {
      ...basePageData({
        routePath,
        title: 'РљР°СЂС‚Р° СЃР°Р№С‚Р°',
        pageKind: 'system',
        blueprint: 'system',
        templateVariant: 'sitemap',
        sourceMode: 'managed',
        navGroup: 'special',
        navOrder: 980,
        showInHeader: false,
        showInFooter: true,
        showInSitemap: false,
        description,
        sections: [
          hero({
            title: 'РљР°СЂС‚Р° СЃР°Р№С‚Р°',
            subtitle: 'Р‘С‹СЃС‚СЂС‹Р№ РґРѕСЃС‚СѓРї Рє РїСЂРѕРґСѓРєС‚РѕРІС‹Рј СЂР°Р·РґРµР»Р°Рј, РєР°С‚Р°Р»РѕРіР°Рј, СЂРµСЃСѓСЂСЃР°Рј, СЃС‚СЂР°РЅРёС†Р°Рј РєРѕРјРїР°РЅРёРё Рё СЃРїРµС†РёР°Р»СЊРЅС‹Рј РјР°СЂС€СЂСѓС‚Р°Рј Chat Plus.',
            eyebrow: 'РќР°РІРёРіР°С†РёСЏ',
            variant: 'editorial',
          }),
        ],
      }),
      legacy_template_family: 'site_map',
    },
  };
}

export function buildAiCalendarDraft() {
  const routePath = '/features/ai-calendar';
  const description = 'AI РљР°Р»РµРЅРґР°СЂСЊ СЃРёРЅС…СЂРѕРЅРёР·РёСЂСѓРµС‚ Р·Р°РїРёСЃРё РёР· С‡Р°С‚РѕРІ СЃ РєР°Р»РµРЅРґР°СЂС‘Рј Рё CRM Р±РµР· СЂСѓС‡РЅРѕРіРѕ РїРµСЂРµРЅРѕСЃР°.';

  return {
    family: 'system',
    routePath,
    data: {
      ...basePageData({
        routePath,
        title: 'AI РљР°Р»РµРЅРґР°СЂСЊ',
        pageKind: 'system',
        blueprint: 'system',
        templateVariant: 'showcase',
        sourceMode: 'managed',
        navGroup: 'resources',
        navOrder: 940,
        showInHeader: false,
        showInFooter: true,
        showInSitemap: true,
        description,
        sections: [
          hero({
            title: 'AI РљР°Р»РµРЅРґР°СЂСЊ: СЃРёРЅС…СЂРѕРЅРёР·Р°С†РёСЏ Р·Р°РїРёСЃРµР№ РёР· Р»СЋР±РѕРіРѕ С‡Р°С‚Р°',
            subtitle: 'РџРµСЂРµСЃС‚Р°РЅСЊС‚Рµ РІСЂСѓС‡РЅСѓСЋ РїРµСЂРµРЅРѕСЃРёС‚СЊ Р·Р°РїРёСЃРё РёР· РјРµСЃСЃРµРЅРґР¶РµСЂРѕРІ. РќР°С€ AI Р°РіРµРЅС‚ С‡РёС‚Р°РµС‚ РєРѕРЅС‚РµРєСЃС‚ РїРµСЂРµРїРёСЃРєРё, СЃРІРµСЂСЏРµС‚СЃСЏ СЃ СЂР°СЃРїРёСЃР°РЅРёРµРј Рё Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё СЃРѕР·РґР°РµС‚ СЃРѕР±С‹С‚РёСЏ РІ РІР°С€РµРј РєР°Р»РµРЅРґР°СЂРµ.',
            eyebrow: 'Р¤Р»Р°РіРјР°РЅСЃРєР°СЏ С„СѓРЅРєС†РёСЏ Chat Plus',
            primaryLabel: 'РџРѕРїСЂРѕР±РѕРІР°С‚СЊ Р±РµСЃРїР»Р°С‚РЅРѕ',
            primaryUrl: '/demo',
            variant: 'showcase',
          }),
          {
            __component: 'page-blocks.steps',
            variant: 'cards',
            title: 'РњР°РіРёСЏ Р°РІС‚РѕРјР°С‚РёР·Р°С†РёРё',
            intro: 'РљР°Рє Chat Plus РїСЂРµРІСЂР°С‰Р°РµС‚ РїСЂРѕСЃС‚С‹Рµ СЃРѕРѕР±С‰РµРЅРёСЏ РІ РїРѕРґС‚РІРµСЂР¶РґРµРЅРЅС‹Рµ Р·Р°РїРёСЃРё РІ 6 С€Р°РіРѕРІ.',
            items: [
              { title: 'РљР»РёРµРЅС‚ РїРёС€РµС‚ РІ РјРµСЃСЃРµРЅРґР¶РµСЂ', text: 'РљР»РёРµРЅС‚ РѕС‚РїСЂР°РІР»СЏРµС‚ СЃРѕРѕР±С‰РµРЅРёРµ РІ WhatsApp, Telegram РёР»Рё Instagram СЃ Р¶РµР»Р°РЅРёРµРј Р·Р°РїРёСЃР°С‚СЊСЃСЏ.', icon: 'lucide:message-circle' },
              { title: 'AI РїРѕРЅРёРјР°РµС‚ РєРѕРЅС‚РµРєСЃС‚', text: 'РќРµР№СЂРѕСЃРµС‚СЊ СЂР°СЃРїРѕР·РЅР°РµС‚ СѓСЃР»СѓРіСѓ, Р¶РµР»Р°РµРјРѕРµ РІСЂРµРјСЏ Рё СЃРїРµС†РёР°Р»РёСЃС‚Р° РїСЂСЏРјРѕ РёР· С‚РµРєСЃС‚Р°.', icon: 'lucide:brain' },
              { title: 'РџСЂРѕРІРµСЂРєР° СЃРІРѕР±РѕРґРЅРѕРіРѕ РІСЂРµРјРµРЅРё', text: 'РЎРёСЃС‚РµРјР° РјРіРЅРѕРІРµРЅРЅРѕ СЃРІРµСЂСЏРµС‚СЃСЏ СЃ РІР°С€РёРј СЂР°СЃРїРёСЃР°РЅРёРµРј РІ Google Calendar РёР»Рё CRM.', icon: 'lucide:calendar-search' },
              { title: 'РџРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ Р·Р°РїРёСЃРё', text: 'AI РѕС‚РїСЂР°РІР»СЏРµС‚ РєР»РёРµРЅС‚Сѓ РґРѕСЃС‚СѓРїРЅС‹Рµ СЃР»РѕС‚С‹ Рё С„РёРєСЃРёСЂСѓРµС‚ РѕРєРѕРЅС‡Р°С‚РµР»СЊРЅРѕРµ РІСЂРµРјСЏ.', icon: 'lucide:calendar-check-2' },
              { title: 'РРЅС‚РµРіСЂР°С†РёСЏ РІ РєР°Р»РµРЅРґР°СЂСЊ', text: 'РЎРѕР±С‹С‚РёРµ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё СЃРѕР·РґР°РµС‚СЃСЏ РІ РІР°С€РµРј РєР°Р»РµРЅРґР°СЂРµ СЃРѕ РІСЃРµРјРё РєРѕРЅС‚Р°РєС‚РЅС‹РјРё РґР°РЅРЅС‹РјРё.', icon: 'lucide:database' },
              { title: 'РђРІС‚Рѕ-РЅР°РїРѕРјРёРЅР°РЅРёСЏ', text: 'РЎРёСЃС‚РµРјР° СЃР°РјР° РѕС‚РїСЂР°РІРёС‚ РєР»РёРµРЅС‚Сѓ РЅР°РїРѕРјРёРЅР°РЅРёРµ Р·Р° 24 С‡Р°СЃР° Рё Р·Р° С‡Р°СЃ РґРѕ РІРёР·РёС‚Р°.', icon: 'lucide:bell-ring' },
            ],
          },
          featureList('Р Р°Р±РѕС‚Р°РµС‚ СЃ РІР°С€РёРј СЂР°СЃРїРёСЃР°РЅРёРµРј', [
            { title: 'Google Calendar', text: 'РњРіРЅРѕРІРµРЅРЅР°СЏ РґРІСѓСЃС‚РѕСЂРѕРЅРЅСЏСЏ СЃРёРЅС…СЂРѕРЅРёР·Р°С†РёСЏ', icon: 'simple-icons:googlecalendar' },
            { title: 'Outlook Calendar', text: 'Р”Р»СЏ РєРѕСЂРїРѕСЂР°С‚РёРІРЅС‹С… РєР»РёРµРЅС‚РѕРІ', icon: 'simple-icons:microsoftoutlook' },
            { title: 'РРЅС‚РµРіСЂР°С†РёСЏ СЃ CRM', text: 'AmoCRM, Altegio, Yclients Рё РґСЂСѓРіРёРµ СЃРёСЃС‚РµРјС‹', icon: 'lucide:briefcase' },
          ], 'Р’Р°Рј РЅРµ РЅСѓР¶РЅРѕ РјРµРЅСЏС‚СЊ СЃРІРѕРё РїСЂРёРІС‹С‡РєРё РёР»Рё РїРµСЂРµС…РѕРґРёС‚СЊ РЅР° РЅРѕРІСѓСЋ CRM. РќР°С€ AI РљР°Р»РµРЅРґР°СЂСЊ РЅР°С‚РёРІРЅРѕ РёРЅС‚РµРіСЂРёСЂСѓРµС‚СЃСЏ СЃ СЃР°РјС‹РјРё РїРѕРїСѓР»СЏСЂРЅС‹РјРё СЃРёСЃС‚РµРјР°РјРё СѓРїСЂР°РІР»РµРЅРёСЏ РІСЂРµРјРµРЅРµРј.'),
          cardsGrid(
            'РРґРµР°Р»СЊРЅРѕ РґР»СЏ Р±РёР·РЅРµСЃР° СѓСЃР»СѓРі',
            'AI РљР°Р»РµРЅРґР°СЂСЊ Р»СѓС‡С€Рµ РІСЃРµРіРѕ СЂР°СЃРєСЂС‹РІР°РµС‚СЃСЏ С‚Р°Рј, РіРґРµ Р·Р°РїРёСЃСЊ РёРґС‘С‚ РїСЂСЏРјРѕ РёР· РїРµСЂРµРїРёСЃРєРё СЃ РєР»РёРµРЅС‚РѕРј.',
            [
              { title: 'РЎР°Р»РѕРЅС‹ РєСЂР°СЃРѕС‚С‹', text: 'РђРІС‚РѕРјР°С‚РёР·Р°С†РёСЏ Р·Р°РїРёСЃРё РЅР° СЃС‚СЂРёР¶РєСѓ, РјР°РЅРёРєСЋСЂ Рё РґСЂСѓРіРёРµ РїСЂРѕС†РµРґСѓСЂС‹. РЎРѕРєСЂР°С‰РµРЅРёРµ РЅРµСЏРІРѕРє РЅР° 40% Р±Р»Р°РіРѕРґР°СЂСЏ Р°РІС‚РѕРЅР°РїРѕРјРёРЅР°РЅРёСЏРј.', icon: 'lucide:scissors' },
              { title: 'РњРµРґРёС†РёРЅР°', text: 'Р—Р°РїРёСЃСЊ РїР°С†РёРµРЅС‚РѕРІ Рє РЅСѓР¶РЅС‹Рј РІСЂР°С‡Р°Рј 24/7 Р±РµР· СѓС‡Р°СЃС‚РёСЏ Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂРѕРІ РєР»РёРЅРёРєРё.', icon: 'lucide:stethoscope' },
              { title: 'HR Рё СЂРµРєСЂСѓС‚РёРЅРі', text: 'РџР»Р°РЅРёСЂРѕРІР°РЅРёРµ СЃРѕР±РµСЃРµРґРѕРІР°РЅРёР№ РЅР°РїСЂСЏРјСѓСЋ РёР· РїРµСЂРµРїРёСЃРєРё СЃ РєР°РЅРґРёРґР°С‚Р°РјРё.', icon: 'lucide:users' },
              { title: 'РћР±СѓС‡РµРЅРёРµ', text: 'Р—Р°РїРёСЃСЊ РЅР° РїСЂРѕР±РЅС‹Рµ СѓСЂРѕРєРё, РєСѓСЂСЃС‹ Рё РєРѕРЅСЃСѓР»СЊС‚Р°С†РёРё РїСЂСЏРјРѕ РёР· Instagram-РґРёСЂРµРєС‚Р°.', icon: 'lucide:graduation-cap' },
            ],
            'editorial',
          ),
          {
            __component: 'page-blocks.final-cta',
            title: 'Р“РѕС‚РѕРІС‹ Р°РІС‚РѕРјР°С‚РёР·РёСЂРѕРІР°С‚СЊ Р·Р°РїРёСЃРё?',
            text: 'РџРѕСЃС‚СЂРѕР№С‚Рµ Р±РµСЃС€РѕРІРЅС‹Р№ РїСЂРѕС†РµСЃСЃ РѕС‚ РїРµСЂРІРѕРіРѕ СЃРѕРѕР±С‰РµРЅРёСЏ РґРѕ РїРѕРґС‚РІРµСЂР¶РґРµРЅРЅРѕРіРѕ РІРёР·РёС‚Р°.',
            primary_label: 'Р—Р°РїРёСЃР°С‚СЊСЃСЏ РЅР° РґРµРјРѕ',
            primary_url: '/demo',
            secondary_label: 'РЎРјРѕС‚СЂРµС‚СЊ С†РµРЅС‹',
            secondary_url: '/pricing',
          },
        ],
      }),
      legacy_template_family: 'ai_calendar',
    },
  };
}

function inferLayoutFamily(draft = {}) {
  const routePath = normalizePageV2RoutePath(draft.routePath || draft.data?.route_path || '');

  if (routePath === '/') return 'home';
  if (routePath === '/pricing') return 'Цены';
  if (routePath === '/partnership') return 'partnership';
  if (routePath === '/solutions/tenders') return 'tenders';
  if (routePath === '/demo') return 'demo';
  if (routePath === '/site-map') return 'site_map';
  if (routePath === '/features/ai-calendar') return 'ai_calendar';
  if (routePath === '/compare') return 'comparison_directory';
  if (routePath.startsWith('/vs/') || routePath.startsWith('/compare/')) return 'comparison';

  if (draft.family === 'managed') {
    return draft.data?.blueprint_id || draft.data?.page_kind || 'unknown';
  }

  return draft.family || draft.data?.blueprint_id || draft.data?.page_kind || 'unknown';
}

async function buildDrafts(options = {}, context = {}) {
  const collections = {};
  collections.siteSetting = context.localStrapi
    ? await fetchLocalEntityMany(context.localStrapi, LOCAL_ENTITY_UIDS['site-setting'])
    : await fetchSiteSetting();
  for (const [key, config] of Object.entries(COLLECTIONS)) {
    collections[key] = await fetchCollection(config.endpoint, context);
  }

  const relatedLinksByEntityRoute = new Map();
  const appendRelatedEntityLink = (detailRoute, candidate) => {
    if (!detailRoute || !candidate) {
      return;
    }

    const existing = relatedLinksByEntityRoute.get(detailRoute) || [];
    relatedLinksByEntityRoute.set(detailRoute, appendUniqueLink(existing, candidate));
  };

  const drafts = [];

  for (const config of LEGACY_MANAGED_ROUTE_CONFIGS) {
    const existingPage = unwrapRecord(await fetchPageV2ByRoute(config.routePath, context));
    let draft = null;

    if (existingPage && Object.keys(existingPage).length && !options.refreshManagedFromLegacy) {
      draft = buildManagedPageDraftFromExistingPage({
        routePath: config.routePath,
        existingPage,
        overrides: {
          blueprint_id: config.blueprint,
        },
      });
    } else {
      const legacy = await fetchLegacyManagedRecord(config, context);
      if (!legacy || !Object.keys(legacy).length) {
        continue;
      }

      draft = buildLegacyManagedPageDraft({
        routePath: config.routePath,
        legacyPage: legacy,
        overrides: {
          blueprint_id: config.blueprint,
        },
      });
    }

    drafts.push({
      family: 'managed',
      routePath: config.routePath,
      data: draft.data,
    });
  }

  drafts.push(buildSiteMapDraft());
  drafts.push(buildAiCalendarDraft());

  for (const directory of DIRECTORY_ROUTES) {
    drafts.push(buildDirectoryDraft(directory, collections));
  }

  for (const config of INTERSECTION_FAMILIES) {
    for (const left of collections[config.left]) {
      if (!left?.slug) continue;
      for (const right of collections[config.right]) {
        if (!right?.slug) continue;

        const routePath = normalizePageV2RoutePath(config.route(left, right));
        const title = config.title(left, right);
        const description = `${title} page generated from Strapi entity facts.`;
        const relatedLink = linkItem(title, routePath, description);

        appendRelatedEntityLink(entityDetailRoute(config.left, left), relatedLink);
        appendRelatedEntityLink(entityDetailRoute(config.right, right), relatedLink);
      }
    }
  }

  for (const key of ['channels', 'industries', 'integrations', 'solutions', 'features', 'business_types']) {
    for (const entity of collections[key]) {
      if (entity.slug) {
        drafts.push(buildEntityDetailDraft(key, entity, {
          collections,
          relatedLinks: relatedLinksByEntityRoute.get(entityDetailRoute(key, entity)) || [],
        }));
      }
    }
  }

  for (const competitor of collections.competitors) {
    if (competitor.slug) {
      drafts.push(buildEntityDetailDraft('competitors', competitor, { collections }));
      drafts.push(buildVsDraft(competitor));
    }
  }

  for (const config of INTERSECTION_FAMILIES) {
    for (const left of collections[config.left]) {
      for (const right of collections[config.right]) {
        if (left.slug && right.slug) {
          drafts.push(buildIntersectionDraft(config, left, right, collections));
        }
      }
    }
  }

  return drafts.map((draft) => applyLayoutParityGate(draft, inferLayoutFamily(draft))).filter((draft) => {
    if (options.route && draft.routePath !== options.route) {
      return false;
    }

    if (options.family && draft.family !== options.family) {
      return false;
    }

    return true;
  });
}

function createLocalMaterializerContext(strapi) {
  return {
    localStrapi: strapi,
    localPageService: strapi.documents('api::page-v2.page-v2'),
  };
}

function summarizeDrafts(drafts = []) {
  const byFamily = {};
  for (const draft of drafts) {
    byFamily[draft.family] = (byFamily[draft.family] || 0) + 1;
  }

  return {
    total: drafts.length,
    byFamily,
    routes: drafts.map((draft) => ({
      routePath: draft.routePath,
      family: draft.family,
      pageKind: draft.data.page_kind,
      blueprint: draft.data.blueprint_id,
      migrationReady: draft.data.migration_ready,
      parityStatus: draft.data.parity_status,
      legacyTemplateFamily: draft.data.legacy_template_family,
      parityErrors: draft.data.parity_notes?.errors || [],
      sections: draft.data.sections.map((section) => section.__component),
    })),
  };
}

async function executeMaterializer(options, context = {}) {

  if (options.publish && !options.unpublish) {
    options.apply = true;
  }

  if (!options.report && !options.dryRun && !options.apply && !options.unpublish && !options.approve && !options.markNotReady) {
    options.report = true;
  }

  if (options.publish && options.all && !options.unsafePublishAll) {
    throw new Error('Mass --publish --all is blocked by the page_v2 safety gate. Use route-level --publish and --approve after parity smoke.');
  }

  if ((options.approve || options.markNotReady) && !options.route) {
    throw new Error('--approve and --mark-not-ready require --route=/path.');
  }

  if (options.approve && options.markNotReady) {
    throw new Error('Use either --approve or --mark-not-ready, not both.');
  }

  requireEnv();

  if (options.approve || options.markNotReady) {
    const result = options.approve
      ? await approvePageV2Route(options.route)
      : await markPageV2RouteNotReady(options.route);
    console.log(JSON.stringify({ ok: true, result }, null, 2));
    return;
  }

  const drafts = await buildDrafts(options, context);

  if (options.report || options.dryRun || !options.apply) {
    console.log(JSON.stringify(summarizeDrafts(drafts), null, 2));
  }

  if (!options.apply && !options.unpublish) {
    return;
  }

  const blueprintMap = options.unpublish ? new Map() : await fetchBlueprintMap(context);
  const missingBlueprints = options.unpublish
    ? []
    : [...new Set(drafts.map((draft) => draft.data.blueprint_id))]
      .filter((blueprintId) => PAGE_V2_BLUEPRINTS[blueprintId] && !blueprintMap.has(blueprintId));

  if (missingBlueprints.length) {
    throw new Error(`Missing page_blueprint records: ${missingBlueprints.join(', ')}. Run page-v2:sync-blueprints first.`);
  }

  const usesLocalDocumentService = Boolean(context.localPageService);
  const results = usesLocalDocumentService
    ? await (async () => {
        const batchResults = [];
        for (const draft of drafts) {
          const result = options.unpublish
            ? await unpublishPageV2(draft.routePath, context.localPageService)
            : await upsertPageV2(draft.routePath, draft.data, blueprintMap, {
                ...options,
                localService: context.localPageService,
              });
          batchResults.push(result);
          console.log(JSON.stringify(result));
        }
        return batchResults;
      })()
    : await (async () => {
        const batchResults = [];
        for (const draft of drafts) {
          const result = options.unpublish
            ? await unpublishPageV2(draft.routePath)
            : await upsertPageV2(draft.routePath, draft.data, blueprintMap, options);
          batchResults.push(result);
          console.log(JSON.stringify(result));
        }
        return batchResults;
      })();

  console.log(JSON.stringify({
    ok: true,
    apply: options.apply,
    publish: options.publish,
    unpublish: options.unpublish,
    count: results.length,
    results,
  }, null, 2));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (isLocalStrapiUrl(STRAPI_URL)) {
    await withLocalStrapi({ appDir: 'cms' }, async (strapi) => {
      return executeMaterializer(options, createLocalMaterializerContext(strapi));
    });
    return;
  }

  await executeMaterializer(options);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
