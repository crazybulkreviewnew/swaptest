"use client";

// components/cookie-consent.js — GDPR / PECR cookie consent banner.
//
// What it does: on first visit, shows a banner explaining cookie use and lets
// the user accept or reject non-essential cookies. The choice is stored in
// localStorage ("swaptest-cookie-consent") so the banner only appears once.
//
// What it does NOT do: it does not set, load, or block any analytics/marketing
// scripts — SwapTest currently uses ONLY essential cookies (auth session) which
// are exempt from consent under UK PECR. This banner informs the user and
// records their preference so it is ready if non-essential cookies are added later.

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "swaptest-cookie-consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      // localStorage unavailable (e.g. private mode) — show the banner anyway
      setVisible(true);
    }
  }, []);

  const record = (choice) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ choice, ts: new Date().toISOString() })
      );
    } catch {
      // ignore write failures — worst case the banner shows again next visit
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-[100] px-4 pb-4 pointer-events-none"
    >
      <div
        className="pointer-events-auto mx-auto max-w-3xl rounded-2xl border border-[var(--border)] p-5 sm:p-6 shadow-2xl"
        style={{ background: "var(--bg-raised)", boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-6">
          <div className="flex-1">
            <h2 className="text-[15px] font-bold text-[var(--fg-strong)] mb-1.5">
              We value your privacy
            </h2>
            <p className="text-[13px] text-[var(--muted)] leading-relaxed m-0">
              SwapTest uses only{" "}
              <strong className="text-[var(--fg-2)]">essential cookies</strong> to keep you
              signed in and to keep the site secure. We do not use advertising or
              tracking cookies. Read our{" "}
              <Link href="/cookies" className="text-[#1D9E75] no-underline hover:underline">
                Cookie Policy
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-[#1D9E75] no-underline hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          <div className="flex gap-3 mt-4 lg:mt-0 flex-shrink-0">
            <button
              onClick={() => record("essential")}
              className="px-5 py-2.5 rounded-lg text-[13px] font-semibold text-[var(--fg)] bg-[var(--card)] border border-[var(--border-strong)] hover:border-[var(--border-strong)] transition-colors cursor-pointer [touch-action:manipulation]"
            >
              Essential only
            </button>
            <button
              onClick={() => record("all")}
              className="px-5 py-2.5 rounded-lg text-[13px] font-bold text-white border-0 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98] [touch-action:manipulation]"
              style={{
                background: "linear-gradient(135deg, #1D9E75 0%, #15805e 100%)",
                boxShadow: "0 4px 16px rgba(29,158,117,0.3)",
              }}
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
