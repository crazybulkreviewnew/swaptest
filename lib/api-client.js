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
