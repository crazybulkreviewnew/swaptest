// ============================================================
// lib/cities.js — city landing pages
// ============================================================
// Each entry powers one SEO landing page at /swap-driving-test/[slug].
// `centres` must be exact names from lib/centres.js, or the live counts and
// the "where you can move to" table will silently come back empty.
//
// Add cities deliberately, not in bulk. A page is only worth having if the
// hand-written copy in app/swap-driving-test/[city]/content.js says something
// specific about that place.
// ============================================================

export const CITIES = {
  manchester: {
    slug: "manchester",
    name: "Manchester",
    // Used in copy: "in and around Greater Manchester"
    region: "Greater Manchester",
    centres: [
      "Atherton (Manchester)",
      "Bolton (Manchester)",
      "Bredbury (Manchester)",
      "Bury (Manchester)",
      "Cheetham Hill (Manchester)",
      "Rochdale (Manchester)",
      "Sale (Manchester)",
      "West Didsbury (Manchester)",
    ],
  },
};

export function getCity(slug) {
  return CITIES[slug] || null;
}

export function allCitySlugs() {
  return Object.keys(CITIES);
}
