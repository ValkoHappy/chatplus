import { hasMeaningfulValue } from './rules.mjs';

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

function getItemContentOrigin(item, fallback = 'generated') {
  return item?.content_origin || fallback;
}

function shouldSkipManagedUpdate(existingAttributes, fallback = 'generated') {
  const existingOrigin = getItemContentOrigin(existingAttributes, fallback);
  return existingOrigin === 'managed';
}

function getCollectionFallbackOrigin(endpoint) {
  if (endpoint === 'landing-pages') {
    return 'managed';
  }

  if (endpoint === 'competitors') {
    return 'generated';
  }

  return 'generated';
}

export {
  getCollectionFallbackOrigin,
  getItemContentOrigin,
  hydrateMissingManagedContent,
  isPlainObject,
  mergeSourceOwnedContent,
  shouldSkipManagedUpdate,
  stripReservedKeysDeep,
};
