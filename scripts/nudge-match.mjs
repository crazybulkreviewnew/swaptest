// ============================================================
// scripts/nudge-match.mjs — manually nudge a stalled match
// ============================================================
// Sends the real SwapTest reminder email to whoever hasn't agreed yet on a
// given match. Use it for matches created before the automatic reminders
// existed, or any time one stalls and you want to poke it by hand.
//
//   node scripts/nudge-match.mjs <matchId>          # dry run — shows what it WOULD send
//   node scripts/nudge-match.mjs <matchId> --send   # actually sends
//
// Dry run is the default on purpose: this emails real users.
//
// Needs DATABASE_URL and RESEND_API_KEY in .env (or the environment).
// ============================================================

import { PrismaClient } from "@prisma/client";
import { sendSwapReminderEmail } from "../lib/email.js";

const matchId = process.argv[2];
const reallySend = process.argv.includes("--send");

if (!matchId || matchId.startsWith("--")) {
  console.error("Usage: node scripts/nudge-match.mjs <matchId> [--send]");
  process.exit(1);
}

// Mirrors workingDaysUntil() in lib/matching.js — DVSA counts Mon–Fri only.
function workingDaysUntil(target) {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  const t = new Date(target); t.setHours(0, 0, 0, 0);
  let count = 0;
  d.setDate(d.getDate() + 1);
  while (d < t) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

const fmt = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

const db = new PrismaClient();

try {
  const match = await db.match.findUnique({
    where: { id: matchId },
    include: { earlierUser: true, laterUser: true, earlierListing: true, laterListing: true },
  });

  if (!match) {
    console.error(`No match found with id ${matchId}`);
    process.exit(1);
  }

  console.log(`\nMatch ${match.id}`);
  console.log(`  status        ${match.status}`);
  console.log(`  deadline      ${match.payDeadline ? fmt(match.payDeadline) + " " + new Date(match.payDeadline).toLocaleTimeString("en-GB") : "none"}`);
  console.log(`  earlier test  ${fmt(match.earlierListing.currentDate)} @ ${match.earlierListing.centre}  (agreed: ${!!match.earlierConsentAt})`);
  console.log(`  later test    ${fmt(match.laterListing.currentDate)} @ ${match.laterListing.centre}  (agreed: ${!!match.laterConsentAt})`);

  if (match.status !== "PENDING") {
    console.error(`\nMatch is ${match.status}, not PENDING — nothing to nudge.`);
    process.exit(1);
  }

  const now = new Date();
  if (match.payDeadline && now > new Date(match.payDeadline)) {
    console.error("\nThe response window has already closed. Extend payDeadline first, or let it expire.");
    process.exit(1);
  }

  // The swap hinges on the EARLIEST of the two tests still being far enough out.
  const earliestTest = new Date(match.laterListing.currentDate) < new Date(match.earlierListing.currentDate)
    ? match.laterListing.currentDate
    : match.earlierListing.currentDate;
  const workingDays = workingDaysUntil(earliestTest);
  console.log(`\n  earliest test is ${fmt(earliestTest)} — ${workingDays} working days away (DVSA needs 10)`);

  if (workingDays < 10) {
    console.error("\nDVSA would refuse this swap now. Don't nudge — let it expire so both listings return to the pool.");
    process.exit(1);
  }

  const targets = [];
  if (!match.earlierConsentAt) targets.push(match.earlierUser);
  if (!match.laterConsentAt) targets.push(match.laterUser);

  if (targets.length === 0) {
    console.log("\nBoth parties have already agreed — nobody to nudge.");
    process.exit(0);
  }

  const hoursLeft = match.payDeadline
    ? Math.max(1, Math.round((new Date(match.payDeadline) - now) / 3600000))
    : 24;

  console.log(`\nWould email ${targets.length} person(s), saying ~${hoursLeft}h left:`);
  for (const t of targets) console.log(`  → ${t.email}  (${t.name})`);

  if (!reallySend) {
    console.log("\nDry run. Re-run with --send to actually send.\n");
    process.exit(0);
  }

  for (const t of targets) {
    try {
      await sendSwapReminderEmail(t, match, hoursLeft);
      console.log(`  sent to ${t.email}`);
    } catch (err) {
      console.error(`  FAILED for ${t.email}: ${err?.message}`);
    }
  }
  console.log("");
} finally {
  await db.$disconnect();
}
