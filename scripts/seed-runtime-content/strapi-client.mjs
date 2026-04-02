import {
  getCollectionFallbackOrigin,
  hydrateMissingManagedContent,
  shouldSkipManagedUpdate,
  stripReservedKeysDeep,
} from './ownership.mjs';
import { prepareCollectionItem } from './normalizers.mjs';

export function createStrapiClient({ strapiUrl, strapiToken, now }) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${strapiToken}`,
  };

  async function request(path, init = {}) {
    const res = await fetch(`${strapiUrl}${path}`, {
      ...init,
      headers: { ...headers, ...(init.headers || {}) },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`${init.method || 'GET'} ${path} failed: ${res.status} ${JSON.stringify(json)}`);
    }
    return json;
  }

  async function upsertCollection(endpoint, item) {
    const preparedItem = prepareCollectionItem(endpoint, item);
    const found = await request(`/api/${endpoint}?filters[slug][$eq]=${encodeURIComponent(preparedItem.slug)}`);
    const existing = found.data?.[0];
    const data = { ...preparedItem, publishedAt: now };
    if (existing) {
      if (shouldSkipManagedUpdate(existing.attributes, getCollectionFallbackOrigin(endpoint))) {
        const hydratedData = hydrateMissingManagedContent(data, stripReservedKeysDeep(existing.attributes));
        const currentData = stripReservedKeysDeep(existing.attributes);
        if (JSON.stringify(hydratedData) === JSON.stringify(currentData)) {
          return 'skipped-managed';
        }

        const key = existing.documentId || existing.id;
        await request(`/api/${endpoint}/${key}`, {
          method: 'PUT',
          body: JSON.stringify({ data: { ...hydratedData, publishedAt: now } }),
        });
        return 'hydrated-managed';
      }

      const key = existing.documentId || existing.id;
      await request(`/api/${endpoint}/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ data }),
      });
      return 'updated';
    }
    await request(`/api/${endpoint}`, {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
    return 'created';
  }

  async function upsertSingle(endpoint, data) {
    const preparedData = stripReservedKeysDeep(data);
    const fallbackOrigin = endpoint === 'tenders-page' ? 'managed' : 'generated';

    if ('content_origin' in preparedData) {
      const existing = await request(`/api/${endpoint}`);
      if (existing?.data?.attributes && shouldSkipManagedUpdate(existing.data.attributes, fallbackOrigin)) {
        const hydratedData = hydrateMissingManagedContent(preparedData, stripReservedKeysDeep(existing.data.attributes));
        const currentData = stripReservedKeysDeep(existing.data.attributes);
        if (JSON.stringify(hydratedData) === JSON.stringify(currentData)) {
          return 'skipped-managed';
        }

        await request(`/api/${endpoint}`, {
          method: 'PUT',
          body: JSON.stringify({ data: { ...hydratedData, publishedAt: now } }),
        });

        return 'hydrated-managed';
      }
    }

    await request(`/api/${endpoint}`, {
      method: 'PUT',
      body: JSON.stringify({ data: { ...preparedData, publishedAt: now } }),
    });

    return 'updated';
  }

  async function seedCollection(endpoint, items) {
    console.log(`\n${endpoint}: ${items.length}`);
    for (const item of items) {
      const action = await upsertCollection(endpoint, item);
      console.log(`- ${action} ${item.slug}`);
    }
  }

  return {
    request,
    seedCollection,
    upsertCollection,
    upsertSingle,
  };
}
