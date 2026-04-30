// ============================================================
// capacitor.config.ts — Capacitor Configuration
// ============================================================
// This configures how the iOS app loads and behaves.
//
// APPROACH: The iOS app is a native shell that loads your live
// Vercel-hosted website. Your backend stays on Vercel; the app
// adds native capabilities (push notifications, haptics, etc.)
// and an App Store presence.
//
// WHY this approach:
// - Every action requires the backend (matching, payments)
// - No offline functionality needed
// - UI updates deploy instantly without App Store review
// - 95% code reuse, minimal iOS-specific work
// ============================================================

import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "uk.co.swaptest.app",
  appName: "SwapTest",
  // The webDir must exist for Capacitor CLI — we create a minimal
  // placeholder. The actual content comes from server.url below.
  webDir: "out",

  server: {
    // PRODUCTION: Point to your live Vercel URL
    url: "https://swaptest.co.uk",
    // DEV: Uncomment below and comment out the line above
    // url: "http://192.168.1.XXX:3000",  // your Mac's local IP

    // Allow the native app to load your remote site
    cleartext: false,            // HTTPS only in production
    allowNavigation: [
      "swaptest.co.uk",         // your domain
      "*.stripe.com",            // Stripe Checkout redirect
      "checkout.stripe.com",     // Stripe payment page
    ],
  },

  ios: {
    // Content inset behavior for the safe area (notch, home indicator)
    contentInset: "automatic",
    // Background color shown behind the web view during load
    backgroundColor: "#111110",
    // Preferred status bar style
    preferredContentMode: "mobile",
    // Scroll behavior
    scrollEnabled: true,
  },

  plugins: {
    SplashScreen: {
      // Show splash screen while the web app loads
      launchAutoHide: false,      // We'll hide it manually after page load
      backgroundColor: "#111110",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
      launchShowDuration: 0,
    },
    StatusBar: {
      // Dark content = light text on dark background
      style: "DARK",
      backgroundColor: "#111110",
    },
    Keyboard: {
      // Resize the web view when keyboard appears
      resize: "body",
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      // iOS push notification presentation options
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
