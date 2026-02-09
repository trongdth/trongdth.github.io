// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  // Replace with your custom domain when ready
  // For GitHub Pages: https://username.github.io or https://yourdomain.com
  site: "https://trongdth.github.io",

  integrations: [mdx(), sitemap()],

  // Output static files for GitHub Pages
  output: "static",

  // Base path - uncomment if deploying to a subdirectory
  // base: '/repo-name',
});
