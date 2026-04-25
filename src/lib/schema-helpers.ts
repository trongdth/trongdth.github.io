/**
 * JSON-LD Schema helpers for SEO and GEO optimization.
 * All functions return plain objects ready for JSON.stringify().
 */

import { SOCIAL_LINKS } from '../consts';

const SITE_URL = 'https://code4food.work';
const SITE_NAME = 'Code4Food';
const AUTHOR_NAME = 'Trong Dinh';
const AUTHOR_IMAGE = `${SITE_URL}/assets/avatar.jpg`;

// ─── Person (Author) ───────────────────────────────────────────────
export function buildPersonSchema() {
  return {
    '@type': 'Person',
    '@id': `${SITE_URL}/#person`,
    name: AUTHOR_NAME,
    url: SITE_URL,
    image: AUTHOR_IMAGE,
    jobTitle: 'CTO & Technology Leader',
    description:
      'Solution Architect & Engineering Leader with 16+ years in software and 7+ years in Web3.',
    knowsAbout: [
      'Software Engineering',
      'System Architecture',
      'Blockchain',
      'Web3',
      'AI/ML',
      'Team Leadership',
    ],
    sameAs: [
      SOCIAL_LINKS.github,
      SOCIAL_LINKS.twitter,
      SOCIAL_LINKS.linkedin,
    ],
  };
}

// ─── Organization (Publisher) ───────────────────────────────────────
export function buildOrganizationSchema() {
  return {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/favicon.svg`,
    },
    sameAs: [
      SOCIAL_LINKS.github,
      SOCIAL_LINKS.twitter,
      SOCIAL_LINKS.linkedin,
    ],
  };
}

// ─── WebSite ────────────────────────────────────────────────────────
export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description: 'CTO | Developer Portfolio & Blog',
    publisher: { '@id': `${SITE_URL}/#organization` },
    author: { '@id': `${SITE_URL}/#person` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/blog?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// ─── BreadcrumbList ─────────────────────────────────────────────────
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ─── BlogPosting ────────────────────────────────────────────────────
export interface BlogPostSchemaInput {
  title: string;
  description: string;
  url: string;
  publishedDate: string; // ISO 8601
  modifiedDate?: string; // ISO 8601
  imageUrl?: string;
  tags?: string[];
}

export function buildBlogPostingSchema(post: BlogPostSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    url: post.url,
    datePublished: post.publishedDate,
    ...(post.modifiedDate && { dateModified: post.modifiedDate }),
    ...(post.imageUrl && {
      image: {
        '@type': 'ImageObject',
        url: post.imageUrl,
      },
    }),
    ...(post.tags && post.tags.length > 0 && { keywords: post.tags.join(', ') }),
    author: { '@id': `${SITE_URL}/#person` },
    publisher: { '@id': `${SITE_URL}/#organization` },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': post.url,
    },
  };
}

// ─── WebApplication (Pomodoro) ──────────────────────────────────────
export function buildWebApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Pomodoro Timer — Code4Food',
    url: `${SITE_URL}/pomodoro`,
    description:
      'A free online Pomodoro timer to boost productivity. Features customizable focus intervals, task tracking, productivity analytics, and browser notifications.',
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Customizable focus and break durations',
      'Task tracking with pomodoro counts',
      'Productivity analytics and history',
      'Browser notifications',
      'Auto-start breaks and focus sessions',
      'Data export to JSON',
    ],
    author: { '@id': `${SITE_URL}/#person` },
  };
}

// ─── FAQPage ────────────────────────────────────────────────────────
export interface FAQItem {
  question: string;
  answer: string;
}

export function buildFAQSchema(items: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

// ─── ProfilePage ────────────────────────────────────────────────────
export function buildProfilePageSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: { '@id': `${SITE_URL}/#person` },
    url: `${SITE_URL}/about`,
    name: `About ${AUTHOR_NAME}`,
    description: `About ${AUTHOR_NAME} — CTO & Technology Leader`,
  };
}

// ─── ContactPage ────────────────────────────────────────────────────
export function buildContactPageSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    url: `${SITE_URL}/contact`,
    name: `Contact ${AUTHOR_NAME}`,
    description: `Get in touch with ${AUTHOR_NAME}`,
    mainEntity: { '@id': `${SITE_URL}/#person` },
  };
}

// ─── CollectionPage (Blog listing) ──────────────────────────────────
export function buildCollectionPageSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    url: `${SITE_URL}/blog`,
    name: 'Blog — Code4Food',
    description:
      'Thoughts, tutorials, and insights on technology, leadership, and building products.',
    author: { '@id': `${SITE_URL}/#person` },
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}
