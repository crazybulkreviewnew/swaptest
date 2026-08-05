/** @type {import('next').NextConfig} */
const nextConfig = {
  // Stripe webhook needs raw body — disable body parsing for that route
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },

  // Vercel sends HSTS. Nothing else was set.
  //
  // No Content-Security-Policy here on purpose. The app inlines styles and
  // JSON-LD via dangerouslySetInnerHTML, so a useful CSP needs its own pass
  // with the pages open in front of you. A wrong one silently breaks the site,
  // which is worse than not having it yet.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // The dashboard and /match carry "Agree to swap" and "Decline"
          // buttons. Framing is already a poor attack here because the session
          // cookie is sameSite=lax and so is not sent to a cross-site frame at
          // all, but there is no reason to allow the framing in the first place.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Do not leak /match?id=<match id> to any third party we link out to,
          // GOV.UK included.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
