// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  site: 'https://chatplus.ru',
  trailingSlash: 'never',
  vite: {
    server: {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    },
  },
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
    icon(),
  ],
});
