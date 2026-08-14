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
    // `error` carries the machine-readable code (e.g. SUBSCRIPTION_REQUIRED) so
    // callers can act on it rather than matching on message text. `errors` stays
    // exactly as it was for everything that already reads it.
    throw { status: res.status, errors, error: data.error, reason: data.reason };
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

// Earlier-seeker: accept the disclaimer and pay the £8 swap fee. Returns { checkoutUrl }.
export async function paySwap(matchId) {
  return request("/api/matches/pay", {
    method: "POST",
    body: JSON.stringify({ matchId, consent: true }),
  });
}

// Later-seeker (or either party): accept the data-sharing disclaimer for free.
export async function consentToMatch(matchId) {
  return request(`/api/matches/${matchId}/consent`, {
    method: "POST",
    body: JSON.stringify({ consent: true }),
  });
}

// ── Membership (£1/week) ─────────────────────────────────

// Start the subscription. Returns { checkoutUrl } or { alreadyActive: true }.
export async function startSubscriptionCheckout() {
  return request("/api/subscription/checkout", { method: "POST" });
}

// Stripe's hosted billing page: cancel, change card, see invoices.
export async function openBillingPortal() {
  return request("/api/subscription/portal", { method: "POST" });
}

// Describe a swap that does not exist yet, for the confirm page. Read-only:
// nothing is created until the initiator agrees.
export async function previewSwap(mineId, theirsId) {
  return request(`/api/matches/preview?mine=${encodeURIComponent(mineId)}&theirs=${encodeURIComponent(theirsId)}`);
}

export async function getMatch(matchId) {
  return request(`/api/matches/${matchId}`);
}

export async function declineMatch(matchId) {
  return request(`/api/matches/${matchId}/decline`, { method: "POST" });
}

// ── Registration fee ─────────────────────────────────────

// Start Stripe Checkout for the one-time registration fee. Returns { checkoutUrl } or { alreadyPaid }.
export async function startRegistrationCheckout() {
  return request("/api/registration/checkout", { method: "POST" });
}
