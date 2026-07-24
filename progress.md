# SwapTest — Progress

Living document. Update at the end of each work session: what changed, what's next,
and anything a future session would otherwise have to re-derive from the code.

Last updated: 2026-07-24

---

## What this project is

A UK driving-test **swap marketplace**. Learners with a driving test booked can list it and
be matched with someone who wants the opposite move — one wants an **earlier** date, the
other is willing to take a **later** one. Once both agree, contact details are exchanged so
they can perform the swap through DVSA themselves.

The platform brokers the introduction. It does not touch DVSA bookings.

## Stack

| Area | Choice |
|---|---|
| Framework | Next.js 14, app router, **JavaScript (no TypeScript)** |
| DB | PostgreSQL via Prisma 5 |
| Auth | Custom JWT in an httpOnly cookie (`swaptest_token`); `jose` on Edge, `jsonwebtoken` on Node; bcrypt hashes |
| Payments | Stripe Checkout + webhooks |
| Email | Resend |
| Rate limit / cron | Upstash Redis + QStash |
| Styling | Tailwind, dark mode supported |
| Mobile | Capacitor 6 iOS wrapper (`npm run ios:*`) |
| Hosting | Vercel |

## Pricing model

> **Currently LIVE IN FREE MODE.** `NEXT_PUBLIC_PAYMENTS_ENABLED` is `false`, so nothing is
> charged, Stripe is never called, and every gate below is open. This is deliberate while the
> business Stripe account and bank account are being set up. The subscription code is built
> and waiting behind the switch — see "Rollout plan".

**£1 per week, nothing per swap.** One subscription covers listing a test, viewing matches
and as many swaps as the user needs.

**Founding members are free for life.** Everyone who signs up while the site is free —
including the 109 who paid the old one-time £1 — keeps full access permanently and is never
asked for money. Only users onboarded *after* paid launch ever pay. This is stored per user
as `User.lifetimeFreeAccess`, not as a config date, so it cannot be lost to a missing env var.

An active membership is required to **create a listing** and to **start or agree to a swap**.
Everything else — logging in, viewing the dashboard, seeing existing matches — stays open.
When a membership lapses the user's listings are **hidden from matching, not cancelled**, so
they return to the pool intact on resubscribe. Founding members are never in this state.

[lib/subscription.js](lib/subscription.js) is the single source of truth for what counts as
active. Do not re-derive that rule anywhere else.

`NEXT_PUBLIC_PAYMENTS_ENABLED` still switches the whole paywall off — in free mode Stripe is
never called and everything works unpaid.

## Domain model (`prisma/schema.prisma`)

- **User** — `lifetimeFreeAccess` (default **true** while the site is free) marks founding
  members, who bypass billing entirely and forever. Otherwise `subscriptionStatus`
  (`NONE`/`ACTIVE`/`PAST_DUE`/`CANCELLED`) plus `subscriptionCurrentPeriodEnd` decide access;
  `stripeCustomerId`/`stripeSubscriptionId` link to Stripe. `PAST_DUE` and `CANCELLED` still
  grant access until the paid-for period ends, so neither a retrying card nor a mid-week
  cancellation locks someone out of a week they paid for. `registrationPaidAt` is now purely
  **historical** and affects nothing. `tokenVersion` is bumped on password reset to
  invalidate all outstanding JWTs. Optional push token.
- **Listing** — `type` is `EARLIER` | `LATER`, plus `centre`, `testType`
  (`WEEKDAY` £62 / `EVENING_WEEKEND` £75), `currentDate`, `currentTime`.
  `originalCentre` records a centre the learner previously swapped away from — DVSA lets
  them move back to it. Status: `AVAILABLE → LOCKED → MATCHED`, or `EXPIRED`/`CANCELLED`.
- **Match** — links an earlier listing + later listing. Completes as soon as **both** parties
  consent to the data-sharing disclaimer. Single absolute `payDeadline` (24h,
  `SWAP_DEADLINE_HOURS`) — the name is now a misnomer, it's just the response window.
  `earlierPaid`/`earlierPaymentId` are legacy columns kept so historic £8 swaps stay
  refundable; nothing writes them any more.
- **Payment** — `purpose` is `"subscription"` (one row per weekly invoice, keyed on the
  Stripe invoice id for idempotency). `"registration"`/`"swap"` rows are legacy.

## Business rules that are easy to get wrong

These are encoded in [lib/matching.js](lib/matching.js) and [lib/centres.js](lib/centres.js):

1. **The later-seeker always holds the earlier date.** A match requires the LATER listing's
   `currentDate` to be strictly before the EARLIER listing's — that's what makes the trade
   benefit both sides.
2. **DVSA 10-working-day rule.** A swap must be requested at least 10 full working days
   before the *earliest* of the two tests. `workingDaysUntil()` counts Mon–Fri only —
   **it does not yet exclude UK bank holidays** (known gap).
3. **Test types must match.** A weekday test can only swap with a weekday test.
4. **Centre reachability is bidirectional.** Each centre maps to its 3 nearest centres
   (`NEARBY_CENTRES`, sourced from gov.uk, updated March 2026). Both learners must be able
   to reach each other's centre. `originalCentre` widens a learner's reachable set.
5. **No PII before agreement.** Match candidate queries deliberately do not select or expose
   the other party's name, email or phone. Contact details are only sent on completion.
6. **Lapsed members are hidden, not deleted.** `listingOwnerActive()` is spread into both
   match queries — forget it in a new query and lapsed users leak back into the pool.
7. **Payments can be switched off** entirely via `NEXT_PUBLIC_PAYMENTS_ENABLED`
   ([lib/payments.js](lib/payments.js)) — matching still works without Stripe.
8. **The initiator cannot decline their own match.**

## Code conventions observed in this repo

- Plain JavaScript, `var` and `function` expressions in `lib/` (not ES-class or arrow-heavy).
- Files open with a banner comment block (`// ==== filename — purpose ====`).
- Business logic lives in `lib/`; API routes stay thin and delegate.
- Multi-table writes go through `db.$transaction`.
- Side effects that must not fail the transaction (email, Stripe refund) are wrapped in
  `try/catch` and logged, never rethrown.
- IDOR guards are explicit in every route that takes an ID.

## Tests

```bash
npm test
```

101 tests, Node's built-in runner, no dependencies added. `tests/hooks.mjs` teaches plain
Node to resolve the extensionless imports the app uses, so source files need no changes.

Covers `lib/subscription.js` (access control), `lib/centres.js` (reachability + the
hand-maintained centre data), `lib/validation.js`, the DVSA 10-working-day rule, and the
Stripe status/period mapping.

**Run them under more than one timezone** — several date bugs only appear outside UTC:

```bash
TZ=Europe/London npm test
```

Two invariants in there are worth keeping:
- `platformAccess()` (the API gate) and `activeUserWhere()` (the matching filter) are
  asserted to agree across all 32 combinations of flag/status/expiry. If they ever diverge, a
  user is billed for something invisible, or hidden while fully paid up.
- Every centre in `NEARBY_CENTRES` is checked to exist, so a typo can't silently remove
  valid matches.

## Layout

```
app/            pages (page.js, dashboard, match, register, login, legal pages)
app/api/        route handlers — auth, listings, matches, payments, cron, push
components/     ui.js (shared primitives), navbar, theme-toggle, cookie-consent, native-provider
lib/            matching, centres, auth, email, stripe, payments, validation, ratelimit, db, native
prisma/         schema.prisma, seed.js, manual-migrations/*.sql
```

Note: `prisma/manual-migrations/` holds hand-written SQL applied outside Prisma Migrate —
check it when changing the schema.

---

## Current state

Branched from `origin/main` at
`9fbb9ee feat: enforce DVSA 10-working-day swap rule in matching`.

The £1/week subscription model is implemented and `next build` passes. **Not yet run against
a real database or real Stripe account** — see "Before this ships" below.

Earlier work (from git history) was rule-hardening and UI polish: the DVSA 10-day rule,
swap-back to original centre, the 24h response window (was 30 min), payments on/off switch,
and several dark/light-mode contrast fixes.

## Environment setup

This machine was set up from scratch on 2026-07-24:

- [x] Repo cloned to `/Users/bharatpant/Downloads/swaptest`
- [x] `gh` 2.96.0 installed, authenticated as `crazybulkreviewnew`
- [x] Node 26.5.0 installed via Homebrew
- [x] `npm install` completed
- [ ] **`.env` not created** — copy `.env.example` and fill in secrets (owner-supplied)
- [ ] **No database configured** — `DATABASE_URL` needed, then `npm run db:push`
- [ ] Build/dev server not yet run or verified on this machine

## Rollout plan

Three stages. **We are at stage 1.**

### Stage 1 — free (now)
`NEXT_PUBLIC_PAYMENTS_ENABLED=false`. Everything works unpaid; the subscription code is
inert.

Migration `003_weekly_subscription.sql` **was applied to the Neon database on 2026-07-24**
and verified with `003_verify.sql` — all checks passed. It was required even in free mode,
because `getCurrentUser()` selects the new `User` columns on every authenticated request.

### Stage 2 — free trial (not built yet)
The plan is to launch paid mode with a trial period so early users aren't charged
immediately. **This is not implemented.** Stripe supports it directly via
`subscription_data.trial_period_days` on the Checkout session
([lib/stripe.js](lib/stripe.js) `createSubscriptionCheckoutSession`), so it's a small
change — but it also needs: a trial-aware `subscriptionStatus` (Stripe's `trialing` currently
maps to `ACTIVE`, which is fine for access but hides the distinction from the UI), trial
messaging on the dashboard banner, and a decision on trial length and whether it requires a
card up front.

### Stage 3 — paid
Flip `NEXT_PUBLIC_PAYMENTS_ENABLED=true`. Before doing so:

> **Nobody who already exists is affected.** Every user carries
> `lifetimeFreeAccess = true`, so flipping the switch cannot lock out the 109 old £1 payers
> or anyone who joined during the free period. Access lives on the row, not in config —
> there is no env var to forget.

- [ ] Business Stripe account + bank account set up and verified.
- [ ] **Flip the column default** — run the final statement in
      `004_lifetime_free_access.sql` (`ALTER COLUMN "lifetimeFreeAccess" SET DEFAULT false`)
      and change `schema.prisma` to `@default(false)` in the same deploy. Miss this and new
      signups keep getting free access: a revenue leak, not a lockout.
- [ ] Create the £1/week recurring Price in Stripe and set `STRIPE_WEEKLY_PRICE_ID`
      (or leave it unset to use the inline price).
- [ ] Add the five subscription events to the Stripe webhook endpoint (listed in
      `.env.example` next to `STRIPE_WEBHOOK_SECRET`).
- [ ] Enable the Stripe **billing portal** in the dashboard — `/api/subscription/portal`
      is how users cancel, and it 500s until the portal is configured.
- [ ] Consider telling founding members they have free access for life — it's a genuinely
      good message and costs nothing.
- [ ] Test the full loop against Stripe test mode: join → renewal → failed payment →
      cancel → resubscribe. **None of this has been exercised against real Stripe yet.**
- [ ] Have the rewritten fees section of [terms](app/terms/page.js) reviewed — it now
      describes a recurring subscription, which carries different UK consumer obligations
      (cancellation rights, renewal notices) than the old one-off fee.
- [ ] Run `004_verify.sql` right before flipping, to confirm every existing user still
      carries the free-for-life flag.

## Match reminders

A match opens a 24h window (`SWAP_DEADLINE_HOURS`) for both parties to agree. The failure
mode this addresses: the responder gets two emails within minutes of the match being created
and then nothing at all until it silently expires. Miss that first burst and the swap dies.

When a match is created, [lib/scheduler.js](lib/scheduler.js) schedules its whole timeline
through QStash: reminder nudges at **6h and 2h before the deadline**, and the **expiry
itself**. Jobs call back to [/api/jobs/match](app/api/jobs/match/route.js), authenticated by
QStash's request signature — that endpoint fails closed if the signing keys are missing,
because it changes match state.

Reminders only go to whoever hasn't agreed yet, decided at fire time, so nobody is nudged
about something they've already done.

**Why QStash and not a cron:** Vercel's Hobby plan permits one cron run per day. The daily
cron remains as a backstop, but on its own it means a window closing at 06:42 leaves both
listings `LOCKED` and invisible to matching until midnight. QStash delivers each job at its
own time regardless of plan.

Scheduling is skipped when `QSTASH_TOKEN` is unset or `NEXT_PUBLIC_APP_URL` isn't a public
https URL (QStash can't call into localhost). In that state the app still works — expiry just
falls back to the daily cron and no reminders are sent.

## Known gaps / candidate work

- `workingDaysUntil()` ignores UK bank holidays, so the 10-working-day check can be
  optimistic around holiday periods.
- `NEARBY_CENTRES` is a hand-maintained snapshot (March 2026) and will drift from gov.uk.
- Test coverage stops at the pure functions. The webhook, the API routes and the
  transactional parts of `lib/matching.js` need a database (or mocks) and are untested.
- If a member's subscription lapses **mid-match**, they can't agree to that swap and their
  partner waits out the 24h window. Acceptable for now, but worth revisiting.
- **The expiry email tells both parties "the other person did not respond"** — so the person
  who ignored it is told the responsive one went quiet. Should be tailored per party, and the
  one who did respond should be pointed straight at fresh matches.
- **Push notifications are collected but never sent.** `/api/push/register` stores an APNs
  token for every app user and nothing reads it. The largest untapped reach for nudges.
- `SWAP_DEADLINE_HOURS` is 24h. For learner drivers who check email once a day that is tight;
  48h is worth considering (env change only, no deploy).
- `Match.payDeadline` is now just a response deadline; the name is misleading.
- `sendRefundNotification` in [lib/email.js](lib/email.js) is never called.
- `readme.md` is a single line.

## Next up

- Stay in free mode while the business Stripe + bank accounts are set up.
- Then build the trial (stage 2), then flip to paid (stage 3).

## Session log

### 2026-07-24 — test suite, and two bugs it found
Added 101 tests (`npm test`). Two genuine bugs surfaced immediately:

1. **`validateListing` accepted a test booked for today — but only outside UTC.**
   `new Date("2026-07-24")` parses as UTC midnight and was compared against *local*
   midnight, so under British Summer Time "must be after today" let today through. It
   passed under UTC (how Vercel runs) and failed under `Europe/London`, which is exactly
   the kind of bug that survives review. Fixed with a `parseLocalDate()` helper that also
   rejects rolled-over dates like `2026-13-45`.
2. **A malformed `SUBSCRIPTION_PENCE_PER_WEEK` produced `NaN` pricing**, which would reach
   Stripe as an invalid amount. Guarded, along with the same pattern in
   `subscriptionSummary()` and `SWAP_DEADLINE_HOURS` (where `NaN` would have made
   `payDeadline` an Invalid Date and stopped matches expiring back into the pool).

Also fixed a bug in the tests themselves: date helpers used `toISOString()`, which reports
the wrong calendar day in timezones ahead of UTC. Suite now passes in UTC, Europe/London,
America/New_York, America/Los_Angeles, Asia/Tokyo and Pacific/Auckland.

### 2026-07-24 — setup
Fresh laptop. Cloned the repo, installed toolchain (`gh`, Node), ran `npm install`, read
through the schema, matching logic and route layout. Established this file — the previous
laptop's `progress.md` was never committed, so nothing carried over.

### 2026-07-24 — £1/week subscription
Replaced the pricing model: one-time £1 registration + £8 per swap → **£1 per week, no swap
fee**. Owner's decisions: membership gates listings *and* starting/agreeing to swaps;
existing one-time payers get a grace window then must subscribe; lapsed members' listings are
hidden from matching rather than cancelled.

- New `lib/subscription.js` — all access rules in one place.
- `lib/stripe.js` rewritten for `mode: "subscription"` + billing portal; `createSwapCheckoutSession` gone.
- Webhook now handles the full lifecycle (checkout, renewal, failure, update, cancel),
  idempotently and tolerant of out-of-order delivery.
- `/api/registration/checkout` and `/api/matches/pay` deleted; `/api/subscription/{checkout,portal}` added.
- Matches complete on dual consent alone.
- All pricing copy updated across marketing, dashboard, match, register, terms and email.
- Removed dead `STRIPE_PRICE_ID` env var (referenced a "£3 platform fee" that no longer existed)
  and the unused `sendPayNowEmail`.

`next build` passes. Nothing exercised against a real database or Stripe account yet.

### 2026-07-24 — confirmed free mode
Owner is staying on free mode until the business Stripe and bank accounts are set up; paid
mode will then launch with a trial. No new feature work — verified free mode instead, by
exercising `lib/subscription.js` directly across both settings of the payments switch:

- Free mode opens every gate for every user shape (new, lapsed, legacy, null), and
  `activeUserWhere()` returns `null` so the matching filter is a genuine no-op.
- Paid mode correctly allows active / past-due-but-paid / legacy-in-grace, and denies
  never-subscribed, expired and post-cutoff legacy users.

**Bug found and fixed:** a user who cancelled mid-week was denied access immediately, even
though they'd paid through the end of that week — the terms and the dashboard banner both
promise that week. `hasActiveSubscription()` excluded `CANCELLED` outright; it now grants
access to ACTIVE/PAST_DUE/CANCELLED alike and lets `subscriptionCurrentPeriodEnd` be the
sole cut-off. `activeUserWhere()` mirrors the same list — the two must stay in sync or
listings get hidden while their owner still has access.

Also made the match-page "nothing to pay" copy conditional, so it doesn't mention a
membership while the site is free.

### 2026-07-24 — migration applied
Owner ran `003_weekly_subscription.sql` against Neon. Verified with the new
`prisma/manual-migrations/003_verify.sql` (read-only catalog inspection): all four new
columns, the `SubscriptionStatus` enum, all three indexes and the `Payment.purpose` default
are correct, `registrationPaidAt` survived, and no user was auto-subscribed.

**Production has 109 legacy one-time-£1 payers.**

### 2026-07-24 — free for life for founding members
Owner's decision, replacing the earlier "existing users must subscribe" answer: **everyone
onboarded before paid launch gets free access permanently.** Only post-launch signups pay.

The earlier design had two problems this fixes:
- It only protected the 109 old £1 payers. Users signing up during the free period had no
  protection at all and would have been hidden from matching the instant the switch flipped —
  a group growing every day the site stays free.
- It depended on an env var (`LEGACY_ACCESS_UNTIL`) that fails closed. A missing or mistyped
  value silently locked users out.

Now stored per user as `User.lifetimeFreeAccess`, defaulting to **true** while the site is
free, so every new signup becomes a founding member with no extra step. At paid launch the
column default flips to false (one `ALTER`, in `004_lifetime_free_access.sql`). Forgetting
that step leaks revenue instead of locking anyone out — the safe direction to fail.

`LEGACY_ACCESS_UNTIL` is gone entirely. `registrationPaidAt` is now purely historical.
Dashboard thanks founding members rather than asking them for money.

Verified: founding members are allowed under every combination (no subscription, expired
subscription, old £1 payer), post-launch users still follow normal subscription rules, and
the matching filter lets founding members through. `next build` passes.

Migration `004_lifetime_free_access.sql` **applied to Neon and verified on 2026-07-24** — all
checks passed. Column default is `true`, zero users lack the flag, and **110 founding members**
were recorded: the 109 old £1 payers plus one user who registered but never paid. That single
user is precisely who the old `LEGACY_ACCESS_UNTIL` design would have locked out.
