const SYNC_POLICY_DEFINITIONS = {
  'landing-pages': {
    family: 'landing-page',
    identityKey: 'external_id',
    fallbackIdentityKey: 'slug',
    defaultRecordMode: 'managed',
    supportsForceSync: false,
    allowManualCreate: true,
    preserveLegacyContentOrigin: true,
    systemOwnedFields: ['slug', 'template_kind', 'record_mode', 'content_origin', 'external_id', 'sync_strategy'],
    editorOwnedFields: [],
  },
  channels: {
    family: 'channel',
    identityKey: 'external_id',
    fallbackIdentityKey: 'slug',
    defaultRecordMode: 'imported',
    supportsForceSync: true,
    allowManualCreate: false,
    preserveLegacyContentOrigin: true,
    systemOwnedFields: ['slug', 'name', 'record_mode', 'content_origin', 'external_id', 'sync_strategy'],
    editorOwnedFields: [],
  },
  industries: {
    family: 'industry',
    identityKey: 'external_id',
    fallbackIdentityKey: 'slug',
    defaultRecordMode: 'imported',
    supportsForceSync: true,
    allowManualCreate: false,
    preserveLegacyContentOrigin: true,
    systemOwnedFields: ['slug', 'name', 'record_mode', 'content_origin', 'external_id', 'sync_strategy'],
    editorOwnedFields: [],
  },
  integrations: {
    family: 'integration',
    identityKey: 'external_id',
    fallbackIdentityKey: 'slug',
    defaultRecordMode: 'imported',
    supportsForceSync: true,
    allowManualCreate: false,
    preserveLegacyContentOrigin: true,
    systemOwnedFields: ['slug', 'name', 'record_mode', 'content_origin', 'external_id', 'sync_strategy'],
    editorOwnedFields: [],
  },
  features: {
    family: 'feature',
    identityKey: 'external_id',
    fallbackIdentityKey: 'slug',
    defaultRecordMode: 'imported',
    supportsForceSync: true,
    allowManualCreate: false,
    preserveLegacyContentOrigin: true,
    systemOwnedFields: ['slug', 'name', 'record_mode', 'content_origin', 'external_id', 'sync_strategy'],
    editorOwnedFields: [],
  },
  solutions: {
    family: 'solution',
    identityKey: 'external_id',
    fallbackIdentityKey: 'slug',
    defaultRecordMode: 'imported',
    supportsForceSync: true,
    allowManualCreate: false,
    preserveLegacyContentOrigin: true,
    systemOwnedFields: ['slug', 'name', 'record_mode', 'content_origin', 'external_id', 'sync_strategy'],
    editorOwnedFields: [],
  },
  'business-types': {
    family: 'business-type',
    identityKey: 'external_id',
    fallbackIdentityKey: 'slug',
    defaultRecordMode: 'imported',
    supportsForceSync: true,
    allowManualCreate: false,
    preserveLegacyContentOrigin: true,
    systemOwnedFields: ['slug', 'name', 'record_mode', 'content_origin', 'external_id', 'sync_strategy'],
    editorOwnedFields: [],
  },
  competitors: {
    family: 'competitor',
    identityKey: 'external_id',
    fallbackIdentityKey: 'slug',
    defaultRecordMode: 'imported',
    supportsForceSync: true,
    allowManualCreate: false,
    preserveLegacyContentOrigin: true,
    systemOwnedFields: ['slug', 'name', 'record_mode', 'content_origin', 'external_id', 'sync_strategy'],
    editorOwnedFields: [],
  },
  'site-setting': {
    family: 'site-setting',
    identityKey: 'external_id',
    fallbackIdentityKey: null,
    defaultRecordMode: 'settings',
    supportsForceSync: false,
    allowManualCreate: false,
    preserveLegacyContentOrigin: false,
    systemOwnedFields: ['record_mode', 'content_origin', 'external_id', 'sync_strategy'],
    editorOwnedFields: [],
  },
  'business-types-page': {
    family: 'business-types-page',
    identityKey: 'external_id',
    fallbackIdentityKey: null,
    defaultRecordMode: 'managed',
    supportsForceSync: false,
    allowManualCreate: true,
    preserveLegacyContentOrigin: false,
    systemOwnedFields: ['record_mode', 'content_origin', 'external_id', 'sync_strategy'],
    editorOwnedFields: [],
  },
  'tenders-page': {
    family: 'tenders-page',
    identityKey: 'external_id',
    fallbackIdentityKey: null,
    defaultRecordMode: 'managed',
    supportsForceSync: false,
    allowManualCreate: true,
    preserveLegacyContentOrigin: true,
    systemOwnedFields: ['record_mode', 'content_origin', 'external_id', 'sync_strategy'],
    editorOwnedFields: [],
  },
};

function getSyncPolicy(endpoint) {
  const policy = SYNC_POLICY_DEFINITIONS[endpoint];

  if (!policy) {
    throw new Error(`No sync policy configured for endpoint "${endpoint}"`);
  }

  return policy;
}

function getIdentityValue(item, policy) {
  const preferred = policy.identityKey && item?.[policy.identityKey];
  if (preferred) {
    return preferred;
  }

  if (policy.fallbackIdentityKey && item?.[policy.fallbackIdentityKey]) {
    return item[policy.fallbackIdentityKey];
  }

  return undefined;
}

export {
  getIdentityValue,
  getSyncPolicy,
  SYNC_POLICY_DEFINITIONS,
};
