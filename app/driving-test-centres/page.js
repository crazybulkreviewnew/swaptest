// ============================================================
// /driving-test-centres — the hub page
// ============================================================
// Two jobs.
//
// 1. It is the bridge between the homepage and the city guides. Before this,
//    each city page was an island reachable only from the sitemap. Now the
//    homepage links here and here links to every city, so authority has a path
//    to follow and a crawler has a reason to visit them.
//
// 2. It earns its own place by publishing something nobody else does: which
//    centres can actually swap with which. DVSA publishes where you may move
//    to. It does not publish where the permission runs both ways, which is the
//    only thing that matters for a swap, and it does not tell you that twenty
//    centres have no possible partner at all.
//
// Fully static. The centre data does not change between deploys, so there is
// nothing to revalidate.
// ============================================================

import Link from "next/link";
import Navbar from "@/components/navbar";
import { NEARBY_CENTRES, canSwapCentres } from "@/lib/centres";
import { CITIES, allCitySlugs } from "@/lib/cities";

const BASE_URL = "https://www.swaptest.co.uk";

export const metadata = {
  title: "Driving Test Centres You Can Swap Between | SwapTest",
  description:
    "Every UK driving test centre and the centres it can actually swap with. DVSA publishes where you may move to. This shows where the permission runs both ways, which is what a swap needs.",
  alternates: { canonical: `${BASE_URL}/driving-test-centres` },
  openGraph: {
    title: "Driving Test Centres You Can Swap Between | SwapTest",
    description: "Every UK driving test centre and the centres it can actually swap with.",
    url: `${BASE_URL}/driving-test-centres`,
    type: "website",
  },
};

// Mutual partners only. A centre you may move to is not the same as a centre
// you can swap with, and only the second is useful here.
function swapPartners(centre) {
  return Object.keys(NEARBY_CENTRES).filter((o) => o !== centre && canSwapCentres(centre, o));
}

export default function CentresHubPage() {
  const all = Object.keys(NEARBY_CENTRES).sort();
  const partnerMap = new Map(all.map((c) => [c, swapPartners(c)]));
  const stranded = all.filter((c) => partnerMap.get(c).length === 0);
  const cities = allCitySlugs().map((slug) => CITIES[slug]);

  // A to Z, so a long list is scannable rather than a wall.
  const byLetter = {};
  for (const c of all) {
    const letter = c[0].toUpperCase();
    (byLetter[letter] ||= []).push(c);
  }
  const letters = Object.keys(byLetter).sort();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Driving test centres", item: `${BASE_URL}/driving-test-centres` },
    ],
  };

  const wrap = { maxWidth: "1152px", margin: "0 auto", padding: "0 20px 64px" };
  const prose = { maxWidth: "68ch" };
  const h2 = { fontSize: "22px", fontWeight: 700, color: "var(--fg)", margin: "44px 0 14px", letterSpacing: "-0.3px" };
  const p = { fontSize: "15px", color: "var(--muted)", lineHeight: 1.75, marginBottom: "14px", maxWidth: "68ch" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }} className="city">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <style dangerouslySetInnerHTML={{ __html: `
        .city a:focus-visible { outline: 2px solid #1D9E75; outline-offset: 3px; border-radius: 4px; }
        .city h2, .city h3 { scroll-margin-top: 80px; }
        .city-skip { position: absolute; left: -9999px; }
        .city-skip:focus { left: 20px; top: 12px; z-index: 10; padding: 10px 16px; border-radius: 8px;
          background: var(--bg-raised); border: 1px solid var(--border-strong); color: var(--fg); }
        .hub-city { display: block; padding: 18px 20px; border-radius: 12px; border: 1px solid var(--border);
          background: var(--bg-raised); text-decoration: none; transition: border-color .15s ease, transform .15s ease;
          touch-action: manipulation; }
        .hub-city:hover { border-color: #1D9E75; transform: translateY(-1px); }
        .hub-letter { font-size: 13px; font-weight: 700; color: var(--muted-2); text-transform: uppercase;
          letter-spacing: 1px; margin: 26px 0 10px; }
        .hub-row { padding: 10px 0; border-top: 1px solid var(--border); font-size: 14px; line-height: 1.6; }
        .hub-name { color: var(--fg); font-weight: 600; }
        .hub-none { color: var(--muted-2); font-style: italic; }
        @media (prefers-reduced-motion: reduce) { .hub-city { transition: none; } }
      ` }} />

      <a href="#hub-main" className="city-skip">Skip to content</a>
      <Navbar />

      <main style={wrap} id="hub-main">
        <nav aria-label="Breadcrumb" style={{ fontSize: "13px", color: "var(--muted-2)", margin: "20px 0" }}>
          <Link href="/" style={{ color: "var(--muted-2)", textDecoration: "none" }}>Home</Link>
          <span aria-hidden="true"> / </span>
          <span style={{ color: "var(--fg-2)" }}>Driving test centres</span>
        </nav>

        <h1 style={{ fontSize: "clamp(28px,4.4vw,44px)", fontWeight: 800, color: "var(--fg-strong)", lineHeight: 1.15, letterSpacing: "-0.8px", marginBottom: "14px" }}>
          Driving test centres you can swap between
        </h1>
        <p style={{ fontSize: "17px", color: "var(--muted)", lineHeight: 1.65, marginBottom: "24px", ...prose }}>
          All {all.length} DVSA test centres in England, Scotland and Wales, and for each one the centres it can
          genuinely swap with.
        </p>

        <p style={p}>
          DVSA publishes the centres you are allowed to move your test to. That is not the same list as the centres
          you can swap with, because a swap needs the permission to run in both directions. Plenty of pairs work one
          way only, and those are no use to anybody. Everything below is the mutual version.
        </p>

        <h2 style={h2}>City guides</h2>
        <p style={p}>
          Written guides for the places we get asked about most, each covering how that area actually connects and
          where the catches are.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px", marginBottom: "8px" }}>
          {cities.map((c) => (
            <Link key={c.slug} href={`/${c.slug}`} className="hub-city">
              <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--fg)" }}>
                Swap a driving test in {c.name}
              </div>
              <div style={{ fontSize: "13px", color: "var(--muted-2)", marginTop: "4px" }}>
                {c.centres.length} centres · {c.region}
              </div>
            </Link>
          ))}
        </div>

        {/* The full rules live here rather than being repeated on all seven
            city pages. Those pages link in with #rules. */}
        <h2 style={h2} id="rules">The four DVSA rules that decide a swap</h2>
        <p style={p}>
          A swap is not a special arrangement. Each of you changes your own test the way DVSA already allows, so the
          ordinary rules apply to both of you. Four of them decide whether a swap is possible at all.
        </p>

        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--fg)", margin: "24px 0 6px" }}>1. Ten full working days</h3>
        <p style={p}>
          Counted before the <strong style={{ color: "var(--fg-2)" }}>earlier</strong> of the two tests, because that
          is the one with less time on it. Monday to Saturday count as working days. Sundays and bank holidays do not.
          Miss the window and you lose the test fee, so we stop offering a swap once it shuts rather than letting you
          walk into a refusal.
        </p>

        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--fg)", margin: "24px 0 6px" }}>2. Two changes per booking</h3>
        <p style={p}>
          Since 31 March 2026 a car test can be changed twice. After that you have to cancel and book again from
          scratch, which puts you at the back of the queue. A swap uses one of those two changes, so it is worth
          keeping the other in hand.
        </p>

        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--fg)", margin: "24px 0 6px" }}>3. The test types must match</h3>
        <p style={p}>
          A weekday test can only swap with another weekday test. Evening, weekend and bank holiday tests cost more
          and sit in their own group. This one catches people out, because two tests can look perfectly compatible on
          the calendar and still be refused.
        </p>

        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--fg)", margin: "24px 0 6px" }}>4. Cancellation-checking apps are blocked</h3>
        <p style={p}>
          Since 12 May 2026 DVSA has blocked the apps that refreshed the booking service hunting for cancellations,
          and it asks people to report them. That closed the route most learners were using to bring a test forward.
          Swapping with another learner is one of the few left that DVSA has no objection to, because nothing is
          bought, nothing is resold, and each of you changes your own booking.
        </p>

        <h2 style={h2}>Centres with no swap partner</h2>
        <p style={p}>
          {stranded.length} of the {all.length} centres cannot swap with anywhere. In each case the centres they are
          allowed to move to do not allow the move back, so no pairing works in both directions. If your test is at
          one of these, the only route open to you is moving back to the centre you originally booked at, which DVSA
          always permits.
        </p>
        <p style={{ ...p, color: "var(--fg-2)" }}>
          {stranded.join(", ")}.
        </p>

        <h2 style={h2}>Every centre, A to Z</h2>
        <p style={p}>
          Each centre followed by the centres it can swap with. If a centre you expected is missing from a list, the
          permission runs one way only and DVSA will not action that swap.
        </p>

        {letters.map((letter) => (
          <section key={letter}>
            <h3 className="hub-letter" id={`letter-${letter}`}>{letter}</h3>
            {byLetter[letter].map((centre) => {
              const partners = partnerMap.get(centre);
              return (
                <div key={centre} className="hub-row">
                  <span className="hub-name">{centre}</span>
                  <span style={{ color: "var(--muted-2)" }}> — </span>
                  {partners.length ? (
                    <span style={{ color: "var(--muted)" }}>{partners.join(", ")}</span>
                  ) : (
                    <span className="hub-none">no swap partner</span>
                  )}
                </div>
              );
            })}
          </section>
        ))}

        <div style={{ marginTop: "48px", padding: "24px", borderRadius: "12px", background: "var(--bg-raised)", border: "1px solid var(--border)", textAlign: "center", maxWidth: "640px" }}>
          <h2 style={{ ...h2, margin: "0 0 8px" }}>Swap your test</h2>
          <p style={{ ...p, marginBottom: "18px", maxWidth: "none" }}>
            List the test you already hold and we will look for somebody going the other way at a centre you can
            actually reach.
          </p>
          <Link href="/register" className="hub-city" style={{ display: "inline-block", padding: "14px 28px", borderRadius: "10px", background: "linear-gradient(135deg,#1D9E75,#15805e)", color: "#fff", fontWeight: 700, fontSize: "15px", textDecoration: "none", border: "none" }}>
            Swap your test
          </Link>
        </div>

        <p style={{ fontSize: "13px", color: "var(--muted-2)", marginTop: "28px", lineHeight: 1.7 }}>
          Centre data is taken from the DVSA list of centres you can move your test to and was last checked in
          July 2026. SwapTest is not affiliated with DVSA. Always confirm with DVSA before relying on it.
        </p>
      </main>
    </div>
  );
}
