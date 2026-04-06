import {
  buildImportedMerge,
  buildManagedUpdate,
  describeSyncResult,
  getCollectionFallbackOrigin,
  getRecordMode,
  shouldSkipManagedUpdate,
  stripReservedKeysDeep,
  valuesEqual,
} from './ownership.mjs';
import { prepareCollectionItem } from './normalizers.mjs';
import { getIdentityValue, getSyncPolicy } from './sync-policies.mjs';

function makeDiff(currentData, nextData) {
  const changedFields = Object.keys(nextData).filter((key) => !valuesEqual(currentData?.[key], nextData?.[key]));
  return {
    changed_fields: changedFields,
  };
}

export function createStrapiClient({ strapiUrl, strapiToken, now, importBatchId, mode = 'apply', forceSync = false }) {
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

  async function findExistingRecord(endpoint, preparedItem) {
    const policy = getSyncPolicy(endpoint);
    const identityValue = getIdentityValue(preparedItem, policy);

    if (policy.identityKey && identityValue) {
      const foundByIdentity = await request(
        `/api/${endpoint}?filters[${policy.identityKey}][$eq]=${encodeURIComponent(identityValue)}`
      );
      if (foundByIdentity.data?.[0]) {
        return foundByIdentity.data[0];
      }
    }

    if (policy.fallbackIdentityKey && preparedItem?.[policy.fallbackIdentityKey]) {
      const foundByFallback = await request(
        `/api/${endpoint}?filters[${policy.fallbackIdentityKey}][$eq]=${encodeURIComponent(preparedItem[policy.fallbackIdentityKey])}`
      );
      if (foundByFallback.data?.[0]) {
        return foundByFallback.data[0];
      }
    }

    return null;
  }

  async function upsertCollection(endpoint, item) {
    const preparedItem = prepareCollectionItem(endpoint, item);
    const existing = await findExistingRecord(endpoint, preparedItem);
    const policy = getSyncPolicy(endpoint);

    if (!existing) {
      const createdData = {
        ...preparedItem,
        import_batch_id: importBatchId,
        last_imported_at: now,
        last_import_payload: stripReservedKeysDeep(preparedItem),
        manual_override_fields: [],
        last_import_diff: {
          status: 'created',
          changed_fields: Object.keys(preparedItem),
          preserved_fields: [],
        },
        publishedAt: now,
      };

      if (mode !== 'apply') {
        return describeSyncResult('planned-create', getIdentityValue(createdData, policy), createdData.last_import_diff);
      }

      await request(`/api/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify({ data: createdData }),
      });
      return describeSyncResult('created', getIdentityValue(createdData, policy), createdData.last_import_diff);
    }

    const existingAttributes = stripReservedKeysDeep(existing.attributes);
    const recordMode = getRecordMode(existingAttributes, getCollectionFallbackOrigin(endpoint), endpoint);

    if (recordMode === 'managed') {
      const managedData = buildManagedUpdate({
        endpoint,
        sourceData: preparedItem,
        existingData: existingAttributes,
      });
      const diff = makeDiff(existingAttributes, managedData);

      if (mode !== 'apply') {
        return describeSyncResult('planned-skip-managed', getIdentityValue(existingAttributes, policy), diff);
      }

      return describeSyncResult('skipped-managed', getIdentityValue(existingAttributes, policy), diff);
    }

    const nextData = buildImportedMerge({
      endpoint,
      sourceData: preparedItem,
      existingData: existingAttributes,
      importBatchId,
      now,
      forceSync,
    });
    const diff = makeDiff(existingAttributes, nextData);

    if (diff.changed_fields.length === 0) {
      return describeSyncResult(mode === 'apply' ? 'skipped-noop' : 'planned-skip', getIdentityValue(nextData, policy), diff);
    }

    if (mode !== 'apply') {
      return describeSyncResult('planned-update', getIdentityValue(nextData, policy), nextData.last_import_diff);
    }

    const key = existing.documentId || existing.id;
    await request(`/api/${endpoint}/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ data: { ...nextData, publishedAt: now } }),
    });
    return describeSyncResult(forceSync ? 'force-synced' : 'updated', getIdentityValue(nextData, policy), nextData.last_import_diff);
  }

  async function upsertSingle(endpoint, data) {
    const preparedData = stripReservedKeysDeep(data);
    const policy = getSyncPolicy(endpoint);
    const existing = await request(`/api/${endpoint}`);
    const existingAttributes = existing?.data?.attributes ? stripReservedKeysDeep(existing.data.attributes) : {};
    const recordMode = getRecordMode(existingAttributes, policy.defaultRecordMode === 'managed' ? 'managed' : 'generated', endpoint);

    if (shouldSkipManagedUpdate(existingAttributes, policy.defaultRecordMode === 'managed' ? 'managed' : 'generated', endpoint) && existing?.data?.attributes) {
      const managedData = buildManagedUpdate({
        endpoint,
        sourceData: preparedData,
        existingData: existingAttributes,
      });
      const diff = makeDiff(existingAttributes, managedData);

      if (mode !== 'apply') {
        return describeSyncResult('planned-skip-managed', endpoint, diff);
      }

      return describeSyncResult('skipped-managed', endpoint, diff);
    }

    const nextData = recordMode === 'imported'
      ? buildImportedMerge({
          endpoint,
          sourceData: preparedData,
          existingData: existingAttributes,
          importBatchId,
          now,
          forceSync,
        })
      : {
          ...preparedData,
          record_mode: preparedData.record_mode || policy.defaultRecordMode,
          content_origin: preparedData.content_origin || (policy.defaultRecordMode === 'managed' ? 'managed' : 'generated'),
        };

    const diff = makeDiff(existingAttributes, nextData);
    if (diff.changed_fields.length === 0) {
      return describeSyncResult(mode === 'apply' ? 'skipped-noop' : 'planned-skip', endpoint, diff);
    }

    if (mode !== 'apply') {
      return describeSyncResult('planned-update', endpoint, nextData.last_import_diff || diff);
    }

    await request(`/api/${endpoint}`, {
      method: 'PUT',
      body: JSON.stringify({ data: { ...nextData, publishedAt: now } }),
    });

    return describeSyncResult('updated', endpoint, nextData.last_import_diff || diff);
  }

  async function reportCollection(endpoint) {
    const data = await request(`/api/${endpoint}?pagination[pageSize]=100&sort=updatedAt:desc`);
    return (data?.data || []).map((entry) => {
      const attributes = stripReservedKeysDeep(entry.attributes || {});
      return {
        endpoint,
        key: attributes.external_id || attributes.slug || attributes.name || entry.documentId || entry.id,
        record_mode: attributes.record_mode || getRecordMode(attributes, getCollectionFallbackOrigin(endpoint), endpoint),
        last_imported_at: attributes.last_imported_at || null,
        manual_override_fields: attributes.manual_override_fields || [],
      };
    });
  }

  async function seedCollection(endpoint, items) {
    console.log(`\n${endpoint}: ${items.length}`);
    const results = [];
    for (const item of items) {
      const result = await upsertCollection(endpoint, item);
      results.push(result);
      console.log(`- ${result.action} ${result.key}`);
    }
    return results;
  }

  return {
    request,
    reportCollection,
    seedCollection,
    upsertCollection,
    upsertSingle,
  };
}
