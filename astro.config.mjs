// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import { articleMetaHastPlugin } from './src/markdown/article-meta.mjs';
import { externalLinksHastPlugin } from './src/markdown/external-links.mjs';

const site = 'https://morning-brief-beta-blue.vercel.app';

// https://astro.build/config
export default defineConfig({
  site,
  adapter: vercel(),
  // Default static prerender; API routes opt out with `export const prerender = false`.
  markdown: {
    processor: satteri({
      hastPlugins: [externalLinksHastPlugin(site), articleMetaHastPlugin()],
    }),
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
