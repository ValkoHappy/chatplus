const STRAPI_URL = import.meta.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = import.meta.env.STRAPI_TOKEN || '';

async function fetchStrapi(path: string) {
  const res = await fetch(`${STRAPI_URL}/api${path}?populate=*&pagination[pageSize]=100`, {
    headers: STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {},
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data;
}

export async function getChannels() {
  return await fetchStrapi('/channels') || [];
}

export async function getIndustries() {
  return await fetchStrapi('/industries') || [];
}

export async function getIntegrations() {
  return await fetchStrapi('/integrations') || [];
}

export async function getSolutions() {
  return await fetchStrapi('/solutions') || [];
}

export async function getFeatures() {
  return await fetchStrapi('/features') || [];
}
