// lib/swap-window.js — how long a swap request stays open.
//
// This is deliberately a plain constant rather than an environment variable.
// It used to be `process.env.SWAP_DEADLINE_HOURS || "24"`, the variable was
// never set in Vercel, and so every match quietly ran on a 24 hour window that
// nobody had chosen. Worse, the number is written into the marketing copy, the
// FAQ, the dashboard and three emails, none of which could read a server-side
// env var, so behaviour and copy could drift apart without anything failing.
//
// Keeping it here means changing the window is a one line edit that shows up in
// a diff and updates every place that mentions it.
//
// Why 3 days rather than 1: of the first nine matches, every single one expired
// with the responder never having replied. Many learners are not checking email
// daily, and a window that can open on a Friday evening and close on a Saturday
// evening is not a real window.

export const SWAP_DEADLINE_HOURS = 72;

// Used in user-facing copy. Kept next to the number so the two cannot diverge.
// Two forms because English needs both: "you have 3 days" but "a 3-day window".
export const SWAP_WINDOW_LABEL = "3 days";
export const SWAP_WINDOW_ADJECTIVE = "3-day";
