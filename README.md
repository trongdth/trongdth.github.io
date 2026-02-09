# Trong Dinh - Personal Portfolio & Blog

A modern, dark-themed developer portfolio and blog built with [Astro](https://astro.build).

![Dark Techy Theme](https://img.shields.io/badge/theme-dark%20techy-0a0a0f?style=flat-square)
![Built with Astro](https://img.shields.io/badge/built%20with-Astro-ff5d01?style=flat-square&logo=astro)
![License MIT](https://img.shields.io/badge/license-MIT-06b6d4?style=flat-square)

## ✨ Features

- 🌙 **Dark Techy Theme** - Cyan/purple accents with glowing effects
- 📝 **Markdown Blog** - Write posts in Markdown/MDX
- 💼 **Projects Showcase** - Display your work with tech tags
- ⚡ **Lightning Fast** - Static site, zero JavaScript by default
- 📱 **Fully Responsive** - Looks great on all devices
- 🔍 **SEO Optimized** - Sitemap, meta tags, and more

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
├── src/
│   ├── components/    # Reusable UI components
│   ├── content/       # Blog posts (Markdown)
│   ├── layouts/       # Page layouts
│   ├── pages/         # Route pages
│   └── styles/        # Global CSS
├── public/            # Static assets
└── astro.config.mjs   # Astro configuration
```

## 📝 Adding Content

### Blog Posts

Create a new `.md` or `.mdx` file in `src/content/blog/`:

```markdown
---
title: "My New Post"
description: "A brief description"
pubDate: "Feb 09 2026"
heroImage: "/blog-placeholder.jpg"
---

Your content here...
```

### Projects

Edit `src/pages/projects.astro` to add your projects to the `projects` array.

## 🚀 Deployment (GitHub Pages)

### Option 1: GitHub Actions (Recommended)

1. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

2. Go to **Settings** → **Pages** → Set source to **GitHub Actions**

3. Push to `main` branch - it will auto-deploy!

### Option 2: Manual Deploy

```bash
npm run build
# Upload the `dist` folder to your hosting
```

## 🎨 Customization

### Site Info

Edit `src/consts.ts`:

```typescript
export const SITE_TITLE = "Your Name";
export const SITE_DESCRIPTION = "Your description";

export const SOCIAL_LINKS = {
  github: "https://github.com/yourusername",
  twitter: "https://twitter.com/yourusername",
  linkedin: "https://linkedin.com/in/yourusername",
};
```

### Custom Domain

1. Update `site` in `astro.config.mjs`:

   ```js
   site: "https://yourdomain.com";
   ```

2. Add a `CNAME` file in `public/` with your domain:

   ```
   yourdomain.com
   ```

3. Configure DNS to point to GitHub Pages

## 💰 Cost

**Total: $0 - $1/month**

- Hosting: **Free** (GitHub Pages)
- Domain: **~$10-12/year** (optional, can use `username.github.io`)

## 📄 License

MIT License - feel free to use this for your own portfolio!

---

Built with ❤️ by [Trong Dinh](https://github.com/trongdth)
