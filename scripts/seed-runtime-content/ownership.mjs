import { getIdentityValue, getSyncPolicy } from './sync-policies.mjs';

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stripReservedKeysDeep(value) {
  if (Array.isArray(value)) {
    return value.map(stripReservedKeysDeep);
  }

  if (isPlainObject(value)) {
    const {
      id,
      documentId,
      createdAt,
      updatedAt,
      publishedAt,
      ...rest
    } = value;

    return Object.fromEntries(
      Object.entries(rest).map(([key, nested]) => [key, stripReservedKeysDeep(nested)])
    );
  }

  return value;
}

function hasMeaningfulValue(value) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (isPlainObject(value)) {
    return Object.keys(value).length > 0;
  }

  return value !== undefined && value !== null && String(value).trim() !== '';
}

function mergeSourceOwnedContent(sourceValue, managedValue) {
  if (Array.isArray(sourceValue)) {
    return sourceValue.length > 0 ? sourceValue : Array.isArray(managedValue) ? managedValue : [];
  }

  if (isPlainObject(sourceValue)) {
    return {
      ...(isPlainObject(managedValue) ? managedValue : {}),
      ...Object.fromEntries(
        Object.entries(sourceValue).map(([key, value]) => [
          key,
          mergeSourceOwnedContent(value, isPlainObject(managedValue) ? managedValue[key] : undefined),
        ]),
      ),
    };
  }

  if (hasMeaningfulValue(sourceValue)) {
    return sourceValue;
  }

  return managedValue;
}

function hydrateMissingManagedContent(sourceValue, existingValue) {
  if (Array.isArray(sourceValue)) {
    return Array.isArray(existingValue) && existingValue.length > 0 ? existingValue : sourceValue;
  }

  if (isPlainObject(sourceValue)) {
    const existingObject = isPlainObject(existingValue) ? existingValue : {};
    return Object.fromEntries(
      Object.entries(sourceValue).map(([key, value]) => [
        key,
        hydrateMissingManagedContent(value, existingObject[key]),
      ]).concat(
        Object.entries(existingObject).filter(([key]) => !(key in sourceValue))
      )
    );
  }

  return hasMeaningfulValue(existingValue) ? existingValue : sourceValue;
}

function valuesEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function inferLegacyRecordMode(item, fallback = 'generated') {
  const contentOrigin = item?.content_origin || fallback;
  return contentOrigin === 'managed' ? 'managed' : 'imported';
}

function getRecordMode(item, fallback = 'generated', endpoint) {
  const explicit = item?.record_mode;
  if (explicit) {
    return explicit;
  }

  if (endpoint) {
    return getSyncPolicy(endpoint).defaultRecordMode;
  }

  return inferLegacyRecordMode(item, fallback);
}

function getCollectionFallbackOrigin(endpoint) {
  return getSyncPolicy(endpoint).defaultRecordMode === 'managed' ? 'managed' : 'generated';
}

function shouldSkipManagedUpdate(existingAttributes, fallback = 'generated', endpoint) {
  return getRecordMode(existingAttributes, fallback, endpoint) === 'managed';
}

function buildImportSnapshot(sourceData, policy) {
  return Object.fromEntries(
    Object.keys(sourceData).map((key) => [key, stripReservedKeysDeep(sourceData[key])]).filter(([, value]) => value !== undefined)
  );
}

function collectManualOverrideFields(existingData, sourceSnapshot, policy) {
  const manualOverrideFields = new Set(Array.isArray(existingData?.manual_override_fields) ? existingData.manual_override_fields : []);
  const previousSnapshot = isPlainObject(existingData?.last_import_payload) ? existingData.last_import_payload : {};
  const candidateFields = policy.editorOwnedFields.length > 0
    ? policy.editorOwnedFields
    : Object.keys(sourceSnapshot).filter((field) => !policy.systemOwnedFields.includes(field) && !field.startsWith('last_import_'));

  for (const field of candidateFields) {
    const previousValue = previousSnapshot[field];
    const currentValue = existingData?.[field];
    if (!valuesEqual(stripReservedKeysDeep(currentValue), stripReservedKeysDeep(previousValue)) && hasMeaningfulValue(currentValue)) {
      manualOverrideFields.add(field);
    }
  }

  return Array.from(manualOverrideFields).sort();
}

function buildImportedMerge({ endpoint, sourceData, existingData, importBatchId, now, forceSync = false }) {
  const policy = getSyncPolicy(endpoint);
  const existing = stripReservedKeysDeep(existingData || {});
  const source = stripReservedKeysDeep(sourceData || {});
  const snapshot = buildImportSnapshot(source, policy);
  const manualOverrideFields = forceSync ? [] : collectManualOverrideFields(existing, snapshot, policy);
  const systemOwnedFields = new Set(policy.systemOwnedFields);
  const nextData = { ...existing };
  const changedFields = [];

  for (const [field, value] of Object.entries(source)) {
    if (field === 'manual_override_fields' || field === 'last_import_payload' || field === 'last_import_diff') {
      continue;
    }

    const isSystemOwned = systemOwnedFields.has(field);
    const isManualOverride = manualOverrideFields.includes(field);
    const currentValue = existing[field];

    if (forceSync || isSystemOwned) {
      if (!valuesEqual(currentValue, value)) {
        nextData[field] = value;
        changedFields.push(field);
      }
      continue;
    }

    if (isManualOverride) {
      nextData[field] = currentValue;
      continue;
    }

    if (!hasMeaningfulValue(currentValue) && hasMeaningfulValue(value)) {
      nextData[field] = value;
      changedFields.push(field);
      continue;
    }

    if (!valuesEqual(currentValue, value)) {
      nextData[field] = value;
      changedFields.push(field);
    }
  }

  nextData.record_mode = policy.defaultRecordMode;
  nextData.content_origin = policy.defaultRecordMode === 'managed' ? 'managed' : 'generated';
  nextData.sync_strategy = forceSync ? 'merge' : (existing.sync_strategy || source.sync_strategy || 'merge');
  nextData.external_id = source.external_id || existing.external_id || getIdentityValue(source, policy);
  nextData.import_batch_id = importBatchId;
  nextData.last_imported_at = now;
  nextData.last_import_payload = snapshot;
  nextData.manual_override_fields = manualOverrideFields;
  nextData.last_import_diff = {
    status: forceSync ? 'forced' : 'merged',
    changed_fields: changedFields,
    preserved_fields: manualOverrideFields,
  };

  return nextData;
}

function buildManagedUpdate({ endpoint, sourceData, existingData }) {
  const policy = getSyncPolicy(endpoint);
  const existing = stripReservedKeysDeep(existingData || {});

  return {
    ...existing,
    record_mode: existing.record_mode || policy.defaultRecordMode,
    content_origin: existing.content_origin || (policy.defaultRecordMode === 'managed' ? 'managed' : 'generated'),
  };
}

function describeSyncResult(action, key, diff) {
  const changed = Array.isArray(diff?.changed_fields) ? diff.changed_fields.length : 0;
  const preserved = Array.isArray(diff?.preserved_fields) ? diff.preserved_fields.length : 0;

  return {
    action,
    key,
    changed_fields: changed,
    preserved_fields: preserved,
    diff,
  };
}

export {
  buildImportedMerge,
  buildManagedUpdate,
  describeSyncResult,
  getCollectionFallbackOrigin,
  getRecordMode,
  hasMeaningfulValue,
  hydrateMissingManagedContent,
  inferLegacyRecordMode,
  isPlainObject,
  mergeSourceOwnedContent,
  shouldSkipManagedUpdate,
  stripReservedKeysDeep,
  valuesEqual,
};
