// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import tailwindcss from '@tailwindcss/vite';
import { externalLinksHastPlugin } from './src/markdown/external-links.mjs';

const site = 'https://morning-brief-beta-blue.vercel.app';

// https://astro.build/config
export default defineConfig({
  site,
  markdown: {
    processor: satteri({
      hastPlugins: [externalLinksHastPlugin(site)],
    }),
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
