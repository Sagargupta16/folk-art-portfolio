import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const REPO_NAME = 'folk-art-portfolio';
const GH_USER = 'Sagargupta16';
// Primary public origin for canonical URL + OG tags. Swap when the artist's own domain lands.
// (GitHub Pages mirror at https://${GH_USER}.github.io still serves the build regardless.)
const SITE = 'https://sagargupta.online';

export default defineConfig({
  site: SITE,
  base: `/${REPO_NAME}/`,
  trailingSlash: 'ignore',
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
