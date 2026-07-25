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

  birmingham: {
    slug: "birmingham",
    name: "Birmingham",
    region: "Birmingham and the Black Country",
    // Wednesbury is included on purpose: it is the only centre Kingstanding
    // can reach besides Garretts Green, so leaving it out would make the
    // reachability table on the page look broken.
    centres: [
      "Birmingham (Garretts Green)",
      "Birmingham (Kings Heath)",
      "Birmingham (Kingstanding)",
      "Birmingham (Shirley)",
      "Birmingham (South Yardley)",
      "Wednesbury",
    ],
  },

  london: {
    slug: "london",
    name: "London",
    region: "London",
    // Ordered roughly by area so the table reads geographically. Note that a
    // swap needs a DIRECT mutual pairing: being near each other, or in the same
    // part of London, is not enough. The table on the page is the real answer.
    centres: [
      // South east
      "Belvedere (London)",
      "Bromley (London)",
      "Erith (London)",
      "Mitcham (London)",
      "Sidcup (London)",
      "West Wickham (London)",
      // North east
      "Brentwood (London)",
      "Chingford (London)",
      "Goodmayes (London)",
      "Hornchurch (London)",
      "Loughton (London)",
      "Wanstead (London)",
      // North
      "Barnet (London)",
      "Borehamwood (London)",
      "Hendon (London)",
      "Mill Hill (London)",
      "Wood Green (London)",
      // West
      "Pinner (London)",
      "Slough (London)",
      "Southall (London)",
      "Uxbridge (London)",
      "Yeading (London)",
      // South west
      "Chertsey (London)",
      "Morden (London)",
      "Tolworth (London)",
    ],
  },
};

export function getCity(slug) {
  return CITIES[slug] || null;
}

export function allCitySlugs() {
  return Object.keys(CITIES);
}
