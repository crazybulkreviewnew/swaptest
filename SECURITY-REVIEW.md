# SwapTest security review

**Date:** 25 July 2026
**Branch reviewed:** `main` (production, ~110 live users)
**Method:** manual code review of every API route, the auth layer, the matching
engine, the email templates and the rendering surface. Findings marked
*verified* were traced end to end through the code path. Nothing was changed.

**Status:** findings 1, 2 and 3 have been fixed and verified. See "Fixes
applied" at the end. `npm audit` has now been run; result below.

---

## Summary

No critical or high severity issues were found. The parts of this app that
would hurt most if they were wrong — authorisation between users, and the
withholding of personal details until both parties consent — are correctly
implemented and were checked line by line.

Two real issues are worth fixing: an open redirect on the login page, and an
unescaped email address in the swap-confirmation email. Both are phishing
vectors rather than data-exposure ones.

| # | Severity | Issue |
|---|----------|-------|
| 1 | Medium | Open redirect on `/login?redirect=` — **fixed** |
| 2 | Low | HTML injection into swap emails via an email address — **fixed** |
| 3 | Low | No fail-fast if `JWT_SECRET` is unset — **fixed** |
| 4 | Low | Authentication has a hard dependency on Upstash |
| 5 | Informational | Middleware does not check `tokenVersion` |
| 6 | Informational | `requireAuth` returns an empty 500 instead of 401 |
| 7 | Informational | Login timing allows slow account enumeration |

---

## 1. Open redirect on the login page — MEDIUM (verified)

**Where:** `app/login/page.js:13` and `:25`

```js
const redirect = searchParams.get("redirect") || "/dashboard";
// ...
await login({ email, password });
router.push(redirect);
```

The value is taken from the query string and passed to `router.push` with no
check that it is a local path.

**Attack.** Send a victim `https://www.swaptest.co.uk/login?redirect=https://swaptest-login.example`.
The link is genuinely on your domain, and the login page they land on is
genuinely yours, so it survives the checks a cautious person actually makes.
They log in successfully, and are then handed to the attacker's page, which
shows "session expired, please sign in again" and harvests the credentials
they have just proved they will type. Protocol-relative values such as
`//evil.example` work the same way.

**Fix.** Accept only a same-origin relative path:

```js
const raw = searchParams.get("redirect") || "/dashboard";
// A single leading slash, and not "//" which the browser reads as a host.
const redirect = /^\/(?!\/)/.test(raw) ? raw : "/dashboard";
```

`middleware.js:39` only ever sets this parameter to a real pathname, so nothing
legitimate breaks.

---

## 2. HTML injection into swap-confirmation emails — LOW (verified)

**Where:** `lib/email.js:54` (`contactCard`), reached from `sendContactExchange`
at `:167` and `:183`. Enabled by the email pattern in `lib/validation.js:30`.

`contactCard` concatenates `user.email` straight into the message body with no
escaping:

```js
+ '...color:#1D9E75">' + user.email + '</td></tr>'
```

The registration email check is `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`. `[^\s@]`
excludes only whitespace and `@`, so `<`, `>` and `"` all pass. An address such
as `a<a href="https://evil.example">Click here</a>b@x.co` is accepted and
stored. There is no email verification at registration, so the attacker never
needs to receive mail at it.

**Attack.** Register with a crafted address, list a test, complete a swap with
the victim. The victim receives a genuine SwapTest email, from your verified
domain, containing attacker-authored HTML in the "your swap partner" panel.

**Impact is limited** and that is why this is Low: mail clients do not execute
JavaScript, so this is content and link injection, not XSS. It also requires
completing a full swap with the target.

**Fix.** Two changes, either of which closes it; do both.

1. Apply the existing helper. `escapeHtml` already exists at `lib/email.js:248`
   and is correctly used for the contact form. Use it in `contactCard` for
   `user.name`, `user.email` and `user.phone`, and in `greeting()`.
2. Tighten the email pattern in `lib/validation.js` to disallow `<`, `>` and
   `"`.

Note the other values in these templates are already safe: `centre` is
validated against the `UK_CENTRES` whitelist, `phone` against a UK mobile
pattern, and `name` against `/^[a-zA-Z\s\-']+$/`, which rejects angle brackets.
The email address is the only untrusted string reaching HTML unescaped.

---

## 3. No fail-fast if `JWT_SECRET` is unset — LOW

**Where:** `lib/auth.js:14`, `middleware.js:12`

```js
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
```

If the variable is ever missing, this does not throw. It encodes the string
`"undefined"` and the application carries on signing and verifying tokens with
a publicly known key, at which point anyone can forge a session for any user.

It is set in production today — login works — so this is not currently
exploitable. It is listed because the failure is silent and total, and the
conditions for it are ordinary: a new environment, a renamed variable, a
misconfigured preview deployment.

**Fix.** Refuse to start without it:

```js
if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");
```

---

## 4. Authentication has a hard dependency on Upstash — LOW (verified)

**Where:** `lib/ratelimit.js:49`, reached from login, register, forgot-password,
contact and match creation.

```js
const { success, ... } = await limiter.limit(identifier);
```

If Upstash is unreachable or its environment variables are missing, this throws
and the exception propagates out of the route, so the request returns 500. It
was observed directly during this review: with the Upstash variables absent,
`POST /api/auth/register` returns an empty 500 before reaching any application
logic.

The security posture is correct — it fails closed rather than silently
disabling the limiter — but the consequence is that **nobody can log in,
register or reset a password during an Upstash outage**. That is a third party
holding a single point of failure over authentication.

**Fix, if you want one.** Decide the policy deliberately rather than inheriting
it. Wrapping the call and allowing the request through on infrastructure error
trades brute-force protection for availability; keeping the current behaviour
trades the reverse. Either is defensible, but it should be a choice with a
comment on it, and the failure should be logged distinctly so an outage is
recognisable rather than looking like a bug in the route.

---

## 5. Middleware does not check `tokenVersion` — INFORMATIONAL

**Where:** `middleware.js:28`

Middleware verifies the JWT signature only. `getCurrentUser` (`lib/auth.js:84`)
additionally compares the token's `ver` claim against the user's current
`tokenVersion`, which is what makes a password reset invalidate old sessions.

This is **not** an authentication bypass. Every route that reads data goes
through `getCurrentUser`, so a stale token gets nothing. The consequence is
cosmetic: after a password reset, an old session still passes the page-level
check, so the dashboard shell renders and then every request inside it fails,
rather than the user being cleanly redirected to log in.

Middleware runs on the Edge and cannot query the database, so fixing this
properly means either a database-backed session check elsewhere or accepting
the current behaviour. Worth a comment recording the decision.

---

## 6. `requireAuth` returns an empty 500 — INFORMATIONAL (already known)

`lib/auth.js:97` throws a `Response` object, which the App Router does not
convert into a response, so unauthenticated API calls produce an empty HTTP 500
rather than the intended 401. Confirmed present since 22 June via Vercel's error
grouping, 10 occurrences across 2 users. Noisy rather than dangerous, because
middleware redirects real users before they reach it.

---

## 7. Login timing allows slow enumeration — INFORMATIONAL

**Where:** `app/api/auth/login/route.js:26`

```js
if (!user || !(await verifyPassword(password, user.password))) {
```

The short circuit means a non-existent address returns without running bcrypt,
which is measurably faster than a wrong password on a real account. The response
body is correctly identical either way, and the endpoint is rate limited to 10
requests per minute per IP, so this is a slow and noisy oracle. Mitigate by
comparing against a dummy hash when no user is found, if you think it is worth
the cost.

---

## Areas examined and found sound

These were checked deliberately, not skipped.

**Authorisation between users.** Every route taking an id verifies ownership:
`listings/[id]` DELETE and PUT (`:11`, `:23`), `matches/[id]` GET (`:26`), and
consent and decline through the guards in `lib/matching.js`. `createMatch`
requires the initiator to own one of the two listings and rejects a user
matching with themselves. No IDOR found.

**Personal data before consent.** This is the highest-value target in the app
and it is handled correctly. `matches/[id]` returns only `{ id }` for both
parties unless `status === "COMPLETED"` (`:51`, `:52`). The candidate queries in
`lib/matching.js` select listing fields only and never join the user table, so
names, emails and phone numbers cannot leak into a match list.

**Session cookies.** `httpOnly`, `secure` in production, `SameSite=Lax`, scoped
to `/`, 7 day expiry. Lax means the cookie is not sent on cross-site POST, which
covers CSRF on every state-changing endpoint without a token scheme.

**Password reset.** Bound to the user's `tokenVersion` at issue and re-checked on
use (`reset-password/route.js:32`), so a link is single use. 30 minute expiry.
Completing a reset increments `tokenVersion`, invalidating every other session.
This is a correct implementation.

**Password storage.** bcrypt, cost factor 12.

**Account enumeration on password reset.** `forgot-password` returns the same
message whether or not the address exists.

**Rate limiting.** Applied to login, register, forgot-password, contact and
match creation. `getClientIp` deliberately prefers `x-real-ip` and otherwise
takes the last hop of `x-forwarded-for`, so a client cannot rotate the limiter
key by prepending spoofed values. This was clearly thought about.

**SQL injection.** No raw SQL anywhere in the application. All access is through
Prisma's query builder.

**`dangerouslySetInnerHTML`.** Six uses, all in server components: JSON-LD in
`app/layout.js`, `app/[city]/page.js` and `app/driving-test-centres/page.js`,
plus static CSS blocks. Every value originates in `copy.js`, `cities.js` or
`centres.js`, all developer-authored constants. No user input reaches any of
them.

**Contact form.** Length-bounded, validated, and `escapeHtml` is correctly
applied to name, email and message. `replyTo` goes through Resend's JSON API
rather than raw SMTP headers, so newline header injection does not apply, and
the pattern rejects whitespace regardless.

**Secrets.** No `.env` file appears in any commit on any branch; only
`.env.example`, which contains placeholders. The two `NEXT_PUBLIC_` variables
are `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_PAYMENTS_ENABLED`, neither sensitive.

**Cron endpoints.** `cron/timeout` and `cron/match-alerts` both fail closed when
`CRON_SECRET` is unset, rather than defaulting to open.

**Stripe webhook.** The signature is verified before anything is read from the
event, and a failure returns 400 without processing. The registration grant uses
`updateMany` with `registrationPaidAt: null` in the filter, so replaying an
event cannot re-trigger it.

---

## npm audit

Run on 25 July 2026. Two high severity advisories, both in **postcss**, reached
transitively through `next`:

- XSS via unescaped `</style>` in CSS stringify output
- Arbitrary file read via attacker-controlled `sourceMappingURL`
- Path traversal in source map auto-loading

**Not exploitable in this application.** All three require attacker-controlled
CSS to be fed through PostCSS. PostCSS runs here only at build time, on
developer-authored stylesheets, from our own repository. There is no path by
which a user can supply CSS to the build.

The advertised fix is `npm audit fix --force`, which installs **next@16.2.11** —
a two-major-version jump from the current 14.2. That upgrade carries far more
real risk than the advisories do. Recommendation: do not take it reactively.
Upgrade Next when you have reason to and time to test it, or pin a patched
postcss through an `overrides` entry if the audit noise becomes a problem.

---

## Fixes applied

All three actionable findings were fixed and each was verified rather than
assumed.

**1. Open redirect** — `app/login/page.js`. The `redirect` parameter is now
accepted only if it is a single-slash-prefixed local path. Verified against
`https://evil.example`, `//evil.example`, `http://evil.example`,
`javascript:alert(1)` and an empty value, all of which now fall back to
`/dashboard`, while `/dashboard` and `/match?id=abc` still pass through.

**2. Email HTML injection** — `lib/email.js` and `lib/validation.js`. Two layers.
`escapeHtml` is now applied in `contactCard` and `greeting`, and the email
pattern rejects `<`, `>`, `"` and `'`. Verified by rendering a real
swap-confirmation email with an attacker-style address containing an anchor
tag: the tag does not appear in the output and the value is escaped. Confirmed
separately that ordinary addresses including `first.last+tag@sub.domain.co.uk`
are still accepted.

**3. `JWT_SECRET` guard** — `lib/auth.js` and `middleware.js`. The check is on
*use* rather than on import. A module-level throw was tried first and rejected:
Next imports these modules while collecting page data at build time, so it broke
the build in any environment without production secrets. Signing and verifying
now fail loudly with a clear message, and the build no longer requires the
secret. Build verified passing.

A local-only `JWT_SECRET` was added to `.env` so authentication can be exercised
in development. It is clearly labelled, and `.env` is gitignored, so it cannot
reach production or the repository.

---

## Outstanding

**One non-security note.** The DVSA 10 working day rule is enforced when a match
is created (`lib/matching.js`, `createMatch`) but not re-checked when it
completes. A match created just inside the window can therefore be confirmed
just outside it, and DVSA would refuse the change. This is a correctness and
user-experience problem rather than a vulnerability, but it produces exactly the
kind of failure that generates complaints.

**Findings 4 to 7** are judgement calls rather than defects. Each is worth a
decision and a comment recording it, not necessarily a code change.
