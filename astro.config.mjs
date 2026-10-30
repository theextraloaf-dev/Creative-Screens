import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://creativescreens.co',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ar'],
    routing: { prefixDefaultLocale: false },
  },
});
