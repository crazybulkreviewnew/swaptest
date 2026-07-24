// ============================================================
// lib/api-client.js — Frontend API Helper
// ============================================================
// All frontend-to-backend API calls go through here.
// Handles JSON parsing, error extraction, and auth errors.
// ============================================================

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errors = data.errors || [data.error || `Request failed (${res.status})`];
    throw { status: res.status, errors };
  }

  return data;
}

// ── Auth ──────────────────────────────────────────────────

export async function register({ name, email, phone, password }) {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, phone, password }),
  });
}

export async function login({ email, password }) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  return request("/api/auth/logout", { method: "POST" });
}

// ── Listings ─────────────────────────────────────────────

export async function createListing(data) {
  return request("/api/listings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getListings() {
  return request("/api/listings");
}

export async function deleteListing(listingId) {
  return request("/api/listings/" + listingId, { method: "DELETE" });
}

export async function editListing(listingId, data) {
  return request("/api/listings/" + listingId, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ── Matches ──────────────────────────────────────────────

export async function selectMatch({ myListingId, targetListingId, earlierListingId, laterListingId }) {
  return request("/api/matches/select", {
    method: "POST",
    body: JSON.stringify({ myListingId: myListingId, targetListingId: targetListingId, earlierListingId: earlierListingId, laterListingId: laterListingId }),
  });
}

// Either party: accept the data-sharing disclaimer. Swaps are covered by the
// weekly subscription — nothing is charged here.
export async function consentToMatch(matchId) {
  return request(`/api/matches/${matchId}/consent`, {
    method: "POST",
    body: JSON.stringify({ consent: true }),
  });
}

export async function getMatch(matchId) {
  return request(`/api/matches/${matchId}`);
}

export async function declineMatch(matchId) {
  return request(`/api/matches/${matchId}/decline`, { method: "POST" });
}

// ── Subscription (£1/week) ───────────────────────────────

// Start Stripe Checkout for the weekly membership.
// Returns { checkoutUrl }, { alreadyActive } or { freeMode }.
export async function startSubscriptionCheckout() {
  return request("/api/subscription/checkout", { method: "POST" });
}

// Open the Stripe billing portal to change card details or cancel.
// Returns { portalUrl }.
export async function openBillingPortal() {
  return request("/api/subscription/portal", { method: "POST" });
}
