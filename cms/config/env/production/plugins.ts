import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => {
  if (env('UPLOAD_PROVIDER', 'local') !== 'aws-s3') {
    return {};
  }

  return {
    upload: {
      config: {
        provider: 'aws-s3',
        providerOptions: {
          baseUrl: env('CDN_URL', undefined),
          rootPath: env('CDN_ROOT_PATH', undefined),
          s3Options: {
            accessKeyId: env('AWS_ACCESS_KEY_ID'),
            secretAccessKey: env('AWS_ACCESS_SECRET'),
            region: env('AWS_REGION'),
            endpoint: env('AWS_ENDPOINT', undefined),
            forcePathStyle: env.bool('AWS_FORCE_PATH_STYLE', false),
            params: {
              ACL: env('AWS_ACL', 'public-read'),
              signedUrlExpires: env.int('AWS_SIGNED_URL_EXPIRES', 15 * 60),
              Bucket: env('AWS_BUCKET'),
            },
          },
        },
        actionOptions: {
          upload: {},
          uploadStream: {},
          delete: {},
        },
      },
    },
  };
};

export default config;
