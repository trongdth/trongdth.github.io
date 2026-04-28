// Site configuration for Trong Dinh's Portfolio
export const SITE_TITLE = "Trong Dinh";
export const SITE_DESCRIPTION = "CTO | Developer Portfolio & Blog";

// Social links
export const SOCIAL_LINKS = {
  github: "https://github.com/trongdth",
  twitter: "https://twitter.com/trongdth",
  linkedin: "https://linkedin.com/in/trongdth",
};

// Navigation items
export const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Blog", href: "/blog" },
  { label: "Projects", href: "/projects" },
  { label: "Open Source", href: "/open-source" },
  { label: "Resume", href: "/resume" },
  { label: "About", href: "/about" },
];

// Google Analytics 4 Measurement ID
export const GA_MEASUREMENT_ID = "G-L187KVEGM7";

// Google AdSense Publisher ID (e.g. "ca-pub-1234567890123456")
export const GOOGLE_ADSENSE_ID = "ca-pub-8750037703452121";

// Blog Categories
export const BLOG_CATEGORIES = [
  "APPSCYCLONE-DEV-LIFE",
  "AI-FIRST",
  "MENTAL-HEALTH",
  "PRODUCT",
  "OPEN-SOURCE",
] as const;

export type BlogCategory = typeof BLOG_CATEGORIES[number];
