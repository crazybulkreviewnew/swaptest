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
  type, centre, testType, originalCentre, currentDate, currentTime,
}) {
  const errors = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Type
  if (!["EARLIER", "LATER"].includes(type)) {
    errors.push("Type must be EARLIER or LATER");
  }

  // Test type (DVSA: you can only swap with the same test type)
  if (!["WEEKDAY", "EVENING_WEEKEND"].includes(testType)) {
    errors.push("Please select your test type");
  }

  // Centre
  if (!centre) {
    errors.push("Please select a test centre");
  } else if (!UK_CENTRES.includes(centre)) {
    errors.push("Invalid test centre");
  }

  // Original centre (optional — only if they swapped before)
  if (originalCentre) {
    if (!UK_CENTRES.includes(originalCentre)) {
      errors.push("Invalid original test centre");
    } else if (originalCentre === centre) {
      errors.push("Your original centre must be different from your current centre");
    }
  }

  // Current date
  if (!currentDate) {
    errors.push("Your current test date is required");
  }

  // Current time
  if (!currentTime) {
    errors.push("Your current test time is required");
  }

  // Stop here if basics are missing — date parsing will fail
  if (errors.length > 0) return { valid: false, errors };

  const parsedCurrent = new Date(currentDate);

  // Reject malformed dates before any comparison (Invalid Date comparisons are
  // always false and would otherwise slip through to a DB error).
  if (isNaN(parsedCurrent.getTime())) {
    errors.push("Your current test date is invalid");
    return { valid: false, errors };
  }

  // Current test date must be in the future
  if (parsedCurrent <= today) {
    errors.push("Your current test date must be after today");
  }

  // Time validation (DVSA: roughly 07:00–17:00). Must be a real HH:MM value.
  if (!/^\d{1,2}:\d{2}$/.test(currentTime)) {
    errors.push("Please enter a valid test time");
  } else {
    const [hours] = currentTime.split(":").map(Number);
    if (isNaN(hours) || hours < 7 || hours > 17) {
      errors.push("Test time should be between 07:00 and 17:00");
    }
  }

  // Sunday check
  if (parsedCurrent.getDay() === 0) {
    errors.push("DVSA does not run driving tests on Sundays");
  }

  return { valid: errors.length === 0, errors };
}
