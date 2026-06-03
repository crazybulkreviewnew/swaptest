// app/sitemap.js — generates /sitemap.xml for search engines.
// What it does: lists the public, indexable pages with priorities.
// What it does NOT do: it does not include private/auth pages (dashboard, match,
// reset-password) — those are disallowed in robots.js.

const BASE_URL = "https://www.swaptest.co.uk";

export default function sitemap() {
  const lastModified = new Date();
  return [
    { url: BASE_URL, lastModified, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/register`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/login`, lastModified, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE_URL}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/cookies`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
