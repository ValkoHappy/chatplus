export function getRuntimeEnvValue(name: string) {
  const runtimeEnv = typeof process !== 'undefined' && process.env ? process.env : {};
  const astroEnv = import.meta.env || {};
  return runtimeEnv[name] || astroEnv[name] || '';
}

export function isPreviewTokenValid(token: string | null | undefined, expectedToken = getRuntimeEnvValue('PREVIEW_TOKEN')) {
  return Boolean(expectedToken) && token === expectedToken;
}

export function normalizePreviewDocumentId(documentId: string | null | undefined) {
  const safeDocumentId = String(documentId || '').trim();
  return safeDocumentId && /^[a-z0-9]+$/i.test(safeDocumentId) ? safeDocumentId : '';
}
