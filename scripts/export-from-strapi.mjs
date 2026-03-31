/**
 * export-from-strapi.mjs
 * Exports all data from Strapi back into cms/seed/generated/ JSON files.
 * Run: node scripts/export-from-strapi.mjs
 */

import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { readFileSync } from 'fs';

function loadEnv() {
  try {
    const env = readFileSync(resolve('.env'), 'utf-8');
    return Object.fromEntries(
      env.split(/\r?\n/).filter(Boolean).filter(l => !l.trim().startsWith('#'))
        .map(line => { const i = line.indexOf('='); return [line.slice(0, i).trim(), line.slice(i + 1).trim()]; })
    );
  } catch { return {}; }
}

const ENV = loadEnv();
const STRAPI_URL = ENV.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = ENV.STRAPI_TOKEN;

const headers = {
  'Content-Type': 'application/json',
  ...(STRAPI_TOKEN ? { 'Authorization': `Bearer ${STRAPI_TOKEN}` } : {})
};

mkdirSync(resolve('cms/seed/generated'), { recursive: true });

async function fetchAll(endpoint, pageSize = 100) {
  const results = [];
  let page = 1;
  while (true) {
    const url = `${STRAPI_URL}/api/${endpoint}?pagination[page]=${page}&pagination[pageSize]=${pageSize}&populate=*`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.error(`ERROR fetching ${endpoint}: ${res.status} ${res.statusText}`);
      break;
    }
    const json = await res.json();
    const items = json.data || [];
    results.push(...items);
    if (items.length < pageSize) break;
    page++;
  }
  return results;
}

async function exportCollection(endpoint, filename) {
  console.log(`\n⏳ Exporting ${endpoint}...`);
  const data = await fetchAll(endpoint);
  writeFileSync(
    resolve(`cms/seed/generated/${filename}`),
    JSON.stringify(data, null, 2),
    'utf-8'
  );
  console.log(`✅ ${filename}: ${data.length} items saved.`);
}

async function exportSingle(endpoint, filename) {
  console.log(`\n⏳ Exporting single type ${endpoint}...`);
  const url = `${STRAPI_URL}/api/${endpoint}?populate=*`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    console.error(`ERROR fetching ${endpoint}: ${res.status} ${res.statusText}`);
    return;
  }
  const json = await res.json();
  const data = json.data?.attributes || json.data || json;
  writeFileSync(
    resolve(`cms/seed/generated/${filename}`),
    JSON.stringify(data, null, 2),
    'utf-8'
  );
  console.log(`✅ ${filename}: single type saved.`);
}

async function main() {
  console.log(`🔗 Strapi: ${STRAPI_URL}`);

  // Collections
  await exportCollection('industries', 'industries.json');
  await exportCollection('channels', 'channels.json');
  await exportCollection('solutions', 'solutions.json');
  await exportCollection('features', 'features.json');
  await exportCollection('integrations', 'integrations.json');
  await exportCollection('business-types', 'businessTypes.json');
  await exportCollection('competitors', 'competitors.json');
  await exportCollection('landing-pages', 'landingPages.json');

  // Single types
  await exportSingle('site-setting', 'siteSetting.json');
  await exportSingle('tenders-page', 'tendersPage.json');
  await exportSingle('business-types-page', 'businessTypesPage.json');

  console.log('\n🎉 Done! All data restored to cms/seed/generated/');
}

main().catch(e => { console.error(e); process.exit(1); });
