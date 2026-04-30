// ============================================================
// lib/validation.js — Input Validation
// ============================================================
// Centralised validation for all user inputs. Used by both
// API routes (server-side) and optionally client components.
// Every function returns { valid: boolean, errors: string[] }.
// ============================================================

import { UK_CENTRES } from "./centres";

export { UK_CENTRES };

// ── Registration ──────────────────────────────────────────

export function validateRegistration({ name, email, phone, password }) {
  const errors = [];

  // Name
  if (!name || !name.trim()) {
    errors.push("Full name is required");
  } else if (name.trim().length < 3) {
    errors.push("Name must be at least 3 characters");
  } else if (!/^[a-zA-Z\s\-']+$/.test(name.trim())) {
    errors.push("Name can only contain letters, spaces, hyphens, and apostrophes");
  }

  // Email
  if (!email || !email.trim()) {
    errors.push("Email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push("Please enter a valid email address");
  }

  // Phone
  if (!phone || !phone.trim()) {
    errors.push("Phone number is required");
  } else {
    const digits = phone.replace(/[\s\-()]+/g, "");
    if (!/^(\+44|0)7\d{9}$/.test(digits)) {
      errors.push("Please enter a valid UK mobile number (e.g. 07xxx xxxxxx)");
    }
  }

  // Password
  if (!password) {
    errors.push("Password is required");
  } else if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }

  return { valid: errors.length === 0, errors };
}

// ── Listing ───────────────────────────────────────────────

export function validateListing({
  type, centre, currentDate, currentTime,
  preferredDateFrom, preferredDateTo,
}) {
  const errors = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Type
  if (!["EARLIER", "LATER"].includes(type)) {
    errors.push("Type must be EARLIER or LATER");
  }

  // Centre
  if (!centre) {
    errors.push("Please select a test centre");
  } else if (!UK_CENTRES.includes(centre)) {
    errors.push("Invalid test centre");
  }

  // Current date
  if (!currentDate) {
    errors.push("Your current test date is required");
  }

  // Current time
  if (!currentTime) {
    errors.push("Your current test time is required");
  }

  // Preferred from
  if (!preferredDateFrom) {
    errors.push("Preferred start date is required");
  }

  // Stop here if basics are missing — date parsing will fail
  if (errors.length > 0) return { valid: false, errors };

  const parsedCurrent = new Date(currentDate);
  const parsedFrom = new Date(preferredDateFrom);
  const parsedTo = preferredDateTo ? new Date(preferredDateTo) : null;

  // Current test date must be in the future
  if (parsedCurrent <= today) {
    errors.push("Your current test date must be after today");
  }

  // Preferred dates must be in the future
  if (parsedFrom <= today) {
    errors.push("Preferred start date must be after today");
  }
  if (parsedTo && parsedTo <= today) {
    errors.push("Preferred end date must be after today");
  }

  // End date must be after start date
  if (parsedTo && parsedTo < parsedFrom) {
    errors.push("Preferred end date must be the same as or after the start date");
  }

  // Type-specific date logic
  if (type === "EARLIER") {
    if (parsedFrom >= parsedCurrent) {
      errors.push("Preferred start date must be before your current test date");
    }
    if (parsedTo && parsedTo >= parsedCurrent) {
      errors.push("Preferred end date must be before your current test date");
    }
  }

  if (type === "LATER") {
    if (parsedFrom <= parsedCurrent) {
      errors.push("Preferred start date must be after your current test date");
    }
  }

  // Time validation (DVSA: roughly 07:00–17:00)
  if (currentTime) {
    const [hours] = currentTime.split(":").map(Number);
    if (hours < 7 || hours > 17) {
      errors.push("Test time should be between 07:00 and 17:00");
    }
  }

  // Sunday check
  if (parsedCurrent.getDay() === 0) {
    errors.push("DVSA does not run driving tests on Sundays");
  }

  return { valid: errors.length === 0, errors };
}
