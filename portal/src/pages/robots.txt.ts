import type { APIRoute } from 'astro';

const normalizeSiteUrl = (value: string | undefined) => {
  const trimmed = value?.trim().replace(/\/+$/, '');
  return trimmed || 'https://astro.integromat.ru';
};

export const GET: APIRoute = () => {
  const siteUrl = normalizeSiteUrl(import.meta.env.PUBLIC_SITE_URL);

  return new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap-index.xml\n`,
    {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    },
  );
};
