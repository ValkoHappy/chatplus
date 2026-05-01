import type { Core } from '@strapi/strapi';

const PAGE_V2_UID = 'api::page-v2.page-v2';

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Admin => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  secrets: {
    encryptionKey: env('ENCRYPTION_KEY'),
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
  preview: {
    enabled: Boolean(env('PREVIEW_TOKEN')),
    config: {
      allowedOrigins: [trimTrailingSlash(env('PUBLIC_SITE_URL', 'http://127.0.0.1:4321'))],
      async handler(uid, { documentId }) {
        const previewToken = env('PREVIEW_TOKEN');
        const previewBaseUrl = trimTrailingSlash(env('PUBLIC_SITE_URL', 'http://127.0.0.1:4321'));

        if (uid !== PAGE_V2_UID || !documentId || !previewToken) {
          return null;
        }

        const strapiInstance = (globalThis as unknown as { strapi?: any }).strapi;
        const document = await strapiInstance?.documents(uid).findOne({ documentId });
        const previewDocumentId = document?.documentId || documentId;

        return `${previewBaseUrl}/__preview/page/${encodeURIComponent(previewDocumentId)}?token=${encodeURIComponent(previewToken)}`;
      },
    },
  },
});

export default config;
