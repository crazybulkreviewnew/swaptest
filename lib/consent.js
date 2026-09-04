// lib/consent.js — the single source of truth for cookie consent.
//
// UK PECR treats analytics cookies as non-essential, so nothing analytics
// related may be set or sent until the visitor has actively agreed. This is
// deliberately a hard gate rather than Google's Consent Mode "denied" state,
// which still sends cookieless pings: the promise on our cookie page is that
// nothing happens until you say yes, and that is easier to keep, explain and
// verify if literally nothing loads.
//
// The stored shape is { choice, ts }. "all" means analytics allowed,
// "essential" means it is not. Anything absent or unreadable means no consent.

export const CONSENT_KEY = "swaptest-cookie-consent";
export const CONSENT_EVENT = "swaptest:consent";

export function readConsent() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw).choice || null;
  } catch {
    // Private mode, blocked storage, or corrupt JSON. Treat as no consent,
    // which is the safe direction.
    return null;
  }
}

export function analyticsAllowed() {
  return readConsent() === "all";
}

export function writeConsent(choice) {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ choice, ts: new Date().toISOString() }));
  } catch {
    // Worst case the banner reappears next visit. Never block on this.
  }
  // Tells the analytics component to start (or stay off) without a reload.
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: { choice } }));
  }
}
