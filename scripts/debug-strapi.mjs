import { readFileSync } from 'fs';

function loadEnv() {
  try {
    const env = readFileSync('.env', 'utf-8');
    return Object.fromEntries(
      env.split(/\r?\n/).filter(l => l && !l.startsWith('#'))
        .map(line => { const i = line.indexOf('='); return [line.slice(0, i).trim(), line.slice(i + 1).trim()]; })
    );
  } catch { return {}; }
}

const ENV = loadEnv();
const STRAPI_URL = ENV.STRAPI_URL || 'http://localhost:1337';
const token = ENV.STRAPI_TOKEN;

const res = await fetch(`${STRAPI_URL}/api/industries?pagination[pageSize]=1`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const json = await res.json();
console.log(JSON.stringify(json.data?.[0], null, 2));
