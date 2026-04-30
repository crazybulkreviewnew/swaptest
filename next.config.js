/** @type {import('next').NextConfig} */
const nextConfig = {
  // Stripe webhook needs raw body — disable body parsing for that route
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
};

module.exports = nextConfig;
