// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

const site = process.env.PUBLIC_SITE_URL || 'https://chatplus.ru';
const base = process.env.PUBLIC_BASE_PATH || undefined;
const isDevCommand = process.argv.includes('dev');

// https://astro.build/config
export default defineConfig({
  site,
  base,
  trailingSlash: isDevCommand ? 'ignore' : 'never',

  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
    icon(),
  ],
});
