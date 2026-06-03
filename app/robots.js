// app/robots.js — generates /robots.txt for crawlers.
// What it does: allows indexing of public marketing pages, blocks private/auth
// and API routes, and points crawlers to the sitemap.
// What it does NOT do: it does not enforce access control (that's the app/RLS).

const BASE_URL = "https://www.swaptest.co.uk";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard", "/match", "/reset-password"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
