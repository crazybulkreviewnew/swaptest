// ============================================================
// /[city] — city landing pages, e.g. /manchester
// ============================================================
// A server component on purpose: these pages exist to be crawled, so they need
// their own metadata and real HTML on first response. No "use client" here.
//
// Live listing counts are read at build and refreshed hourly (revalidate), so
// the page stays static for search engines while the numbers stay honest.
//
// NOTE ON THE ROOT SEGMENT
// This route sits at the top level, so it shares a namespace with /login,
// /register, /terms and the rest. Next gives static routes priority over this
// dynamic one, so those keep working. `dynamicParams = false` then limits this
// route to the slugs in lib/cities.js, so /anything-else returns a real 404
// instead of an empty city page. Do not remove it, and do not name a city after
// an existing route.
// ============================================================

import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/navbar";
import { db } from "@/lib/db";
import { NEARBY_CENTRES } from "@/lib/centres";
import { getCity, allCitySlugs } from "@/lib/cities";
import { paymentsEnabled } from "@/lib/payments";
import { getCopy } from "./copy";

const BASE_URL = "https://www.swaptest.co.uk";

export const revalidate = 3600; // refresh the live counts hourly

// Only the slugs in lib/cities.js resolve. Anything else 404s rather than
// rendering a blank city page at an arbitrary URL.
export const dynamicParams = false;

export function generateStaticParams() {
  return allCitySlugs().map((city) => ({ city }));
}

export async function generateMetadata({ params }) {
  const { city: slug } = await params;
  const city = getCity(slug);
  if (!city) return {};
  // Under 60 characters so it is not truncated in search results.
  const title = `Swap Driving Test Date in ${city.name} | SwapTest`;
  const description =
    `Swap your driving test date with another learner in ${city.name}. List the test you already hold, ` +
    `get matched at your centre or a nearby one, then change it with DVSA. Free to list.`;
  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/${city.slug}` },
    openGraph: { title, description, url: `${BASE_URL}/${city.slug}`, type: "website" },
  };
}

// Live picture of the city: how many are waiting, and which way they want to go.
async function getCityStats(centres) {
  try {
    const listings = await db.listing.findMany({
      where: { centre: { in: centres }, status: "AVAILABLE" },
      select: { type: true, centre: true },
    });
    const earlier = listings.filter((l) => l.type === "EARLIER").length;
    const later = listings.filter((l) => l.type === "LATER").length;
    const centresUsed = new Set(listings.map((l) => l.centre)).size;
    return { total: listings.length, earlier, later, centresUsed };
  } catch (err) {
    // A database blip must not take the page down. Counts are a nice extra,
    // the content is the point.
    console.error("City stats unavailable:", err?.message);
    return null;
  }
}

export default async function CityPage({ params }) {
  const { city: slug } = await params;
  const city = getCity(slug);
  const copy = getCopy(slug);
  if (!city || !copy) notFound();

  const stats = await getCityStats(city.centres);

  // Some answers depend on whether charging is switched on, so they are written
  // as functions in copy.js and resolved here. Keeps the page from claiming the
  // service is free the day it stops being free.
  const paid = paymentsEnabled();
  const faqs = copy.faqs.map((f) => ({ q: f.q, a: typeof f.a === "function" ? f.a(paid) : f.a }));

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  // Breadcrumbs help search engines show the page's place in the site, and
  // match the visible trail above the heading.
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: city.name, item: `${BASE_URL}/${city.slug}` },
    ],
  };

  const page = { minHeight: "100vh", background: "var(--bg)" };
  // Matches the homepage container (max-w-6xl) so the site feels like one site
  // on a laptop. Prose is capped separately below: a paragraph running the full
  // 1152px would be ~150 characters per line and unreadable.
  const wrap = { maxWidth: "1152px", margin: "0 auto", padding: "0 20px 64px" };
  const prose = { maxWidth: "68ch" };
  const h2 = { fontSize: "22px", fontWeight: 700, color: "var(--fg)", margin: "40px 0 14px", letterSpacing: "-0.3px" };
  const h3 = { fontSize: "16px", fontWeight: 700, color: "var(--fg)", margin: "0 0 6px" };
  const p = { fontSize: "15px", color: "var(--muted)", lineHeight: 1.75, marginBottom: "14px", maxWidth: "68ch" };
  const cell = { padding: "10px 12px", fontSize: "14px", borderTop: "1px solid var(--border)", verticalAlign: "top" };

  return (
    <div style={page} className="city">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Inline styles can't express :focus-visible or media queries, so the
          interactive states live here. Keeps the page keyboard-operable and
          gives links a hit area big enough for a thumb. */}
      <style dangerouslySetInnerHTML={{ __html: `
        .city a:focus-visible { outline: 2px solid #1D9E75; outline-offset: 3px; border-radius: 4px; }
        .city h2, .city h3 { scroll-margin-top: 80px; }
        .city-skip { position: absolute; left: -9999px; }
        .city-skip:focus { left: 20px; top: 12px; z-index: 10; padding: 10px 16px; border-radius: 8px;
          background: var(--bg-raised); border: 1px solid var(--border-strong); color: var(--fg); }
        .city-cta { touch-action: manipulation; transition: filter .15s ease, border-color .15s ease; }
        .city-cta:hover { filter: brightness(1.07); }
        .city-cta-secondary:hover { border-color: var(--fg-2); }
        /* 44px minimum touch target on mobile, per the interface guidelines. */
        .city-centre-link { display: block; padding: 12px 0; min-height: 44px; touch-action: manipulation; }
        .city-centre-link:hover { color: #1D9E75; }
        .city-stat { font-variant-numeric: tabular-nums; }
        @media (prefers-reduced-motion: reduce) {
          .city-cta { transition: none; }
        }
      ` }} />

      <a href="#city-main" className="city-skip">Skip to content</a>

      <Navbar />

      <main style={wrap} id="city-main">
        <nav aria-label="Breadcrumb" style={{ fontSize: "13px", color: "var(--muted-2)", marginBottom: "20px" }}>
          <Link href="/" style={{ color: "var(--muted-2)", textDecoration: "none" }}>Home</Link>
          <span aria-hidden="true"> / </span>
          <span style={{ color: "var(--fg-2)" }}>{city.name}</span>
        </nav>

        {/* Two columns on a laptop, stacked on mobile. Mirrors the homepage
            hero so the site reads as one site instead of a bolted-on page. */}
        <div style={{ display: "flex", gap: "48px", flexWrap: "wrap", alignItems: "flex-start", marginBottom: "8px" }}>
          <div style={{ flex: "1 1 460px", minWidth: 0 }}>
            <h1 style={{ fontSize: "clamp(28px,4.4vw,44px)", fontWeight: 800, color: "var(--fg-strong)", lineHeight: 1.15, letterSpacing: "-0.8px", marginBottom: "14px" }}>
              {copy.h1}
            </h1>
            <p style={{ fontSize: "17px", color: "var(--muted)", lineHeight: 1.65, marginBottom: "24px", ...prose }}>
              {copy.standfirst}
            </p>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", maxWidth: "520px" }}>
              <Link href="/register?type=later" className="city-cta" style={{ flex: "1 1 220px", textAlign: "center", padding: "14px 20px", borderRadius: "10px", background: "linear-gradient(135deg,#1D9E75,#15805e)", color: "#fff", fontWeight: 700, fontSize: "15px", textDecoration: "none" }}>
                I would take a later date
              </Link>
              <Link href="/register?type=earlier" className="city-cta city-cta-secondary" style={{ flex: "1 1 220px", textAlign: "center", padding: "14px 20px", borderRadius: "10px", border: "1px solid var(--border-strong)", color: "var(--fg)", fontWeight: 700, fontSize: "15px", textDecoration: "none" }}>
                I want an earlier date
              </Link>
            </div>
          </div>

          {/* Live picture, sitting where the homepage puts its example card.
              Shows the imbalance honestly rather than inflating the pool. */}
          {stats && stats.total > 0 && (
            <aside style={{ flex: "0 1 340px", minWidth: "280px", padding: "22px", borderRadius: "14px", background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--muted-2)", marginBottom: "16px" }}>
                Right now in {city.region}
              </div>
              {[
                [stats.total, `tests listed across ${city.centres.length} centres`, "var(--fg)"],
                [stats.earlier, "want an earlier date", "var(--fg)"],
                [stats.later, "happy to go later", "#1D9E75"],
              ].map(([value, label, colour], i) => (
                <div key={i} style={{ display: "flex", alignItems: "baseline", gap: "12px", paddingTop: i ? "12px" : 0, marginTop: i ? "12px" : 0, borderTop: i ? "1px solid var(--border)" : "none" }}>
                  <div className="city-stat" style={{ fontSize: "28px", fontWeight: 800, color: colour, minWidth: "44px" }}>{value}</div>
                  <div style={{ fontSize: "13px", color: "var(--muted-2)", lineHeight: 1.4 }}>{label}</div>
                </div>
              ))}
              <p style={{ fontSize: "12px", color: "var(--muted-2)", margin: "16px 0 0", lineHeight: 1.5 }}>
                Updated hourly. Anyone willing to move to a later date is usually matched fastest.
              </p>
            </aside>
          )}
        </div>

        {copy.intro.map((para, i) => <p key={i} style={p}>{para}</p>)}


        <h2 style={h2}>How swapping works</h2>
        <ol style={{ paddingLeft: "20px", margin: 0 }}>
          {[
            ["List the test you already have", "Your centre, your date and time. Nothing is cancelled and nothing changes yet."],
            ["We look for someone going the other way", "At your centre, or one of the three centres DVSA lets you move to."],
            ["You both agree", "Only then do you see each other’s contact details. Names stay hidden until that point."],
            ["You both ring DVSA", "Each of you calls 0300 200 1122 and confirms the swap for your own booking. DVSA will not change your test on somebody else’s say so. There is no charge."],
          ].map(([title, body], i) => (
            <li key={i} style={{ marginBottom: "14px", color: "var(--muted)" }}>
              <div style={h3}>{title}</div>
              <div style={{ fontSize: "14px", lineHeight: 1.7, ...prose }}>{body}</div>
            </li>
          ))}
        </ol>

        <h2 style={h2}>Test centres in {city.region}</h2>
        {copy.localNote.map((para, i) => <p key={i} style={p}>{para}</p>)}

        <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: "10px", marginBottom: "8px", maxWidth: "760px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "460px" }}>
            <caption style={{ captionSide: "top", textAlign: "left", padding: "12px", fontSize: "13px", color: "var(--muted-2)" }}>
              Where you can move your test to from each {city.name} centre, according to DVSA.
            </caption>
            <thead>
              <tr style={{ background: "var(--bg-raised)" }}>
                <th scope="col" style={{ ...cell, borderTop: "none", fontWeight: 700, color: "var(--fg)", textAlign: "left" }}>Your centre</th>
                <th scope="col" style={{ ...cell, borderTop: "none", fontWeight: 700, color: "var(--fg)", textAlign: "left" }}>You can move to</th>
              </tr>
            </thead>
            <tbody>
              {city.centres.map((centre) => (
                <tr key={centre}>
                  <th scope="row" style={{ ...cell, fontWeight: 600, textAlign: "left" }}>
                    {/* Straight into a prefilled form. Saves picking from a list
                        of 320 centres, and gives the page internal links whose
                        anchor text is the centre name people search for. */}
                    <Link
                      href={`/register?centre=${encodeURIComponent(centre)}`}
                      className="city-centre-link"
                      style={{ color: "var(--fg)", textDecoration: "none" }}
                    >
                      {centre.replace(` (${city.name})`, "")}
                    </Link>
                  </th>
                  <td style={{ ...cell, color: "var(--muted)" }}>
                    {(NEARBY_CENTRES[centre] || []).map((n) => n.replace(` (${city.name})`, "")).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: "12px", color: "var(--muted-2)", marginBottom: "8px" }}>
          Pick your centre above to start listing your test. You can also move back to the centre you first booked at, even if it is not on this list.
        </p>

        <h2 style={h2}>The DVSA rules worth knowing</h2>
        <p style={p}>
          <strong style={{ color: "var(--fg-2)" }}>Give 10 full working days notice.</strong> That is counted before the earlier of the two tests.
          Monday to Saturday count. Sundays and bank holidays do not. Miss it and you lose the test fee, so we stop offering a swap once that window shuts.
        </p>
        <p style={p}>
          <strong style={{ color: "var(--fg-2)" }}>You get two changes.</strong> Since 31 March 2026 a car test can be changed twice. After that you have to cancel and book again, which puts you back at the end of the queue. A swap uses one change.
        </p>
        <p style={p}>
          <strong style={{ color: "var(--fg-2)" }}>Same test type only.</strong> A weekday test can only swap with another weekday test. Evening, weekend and bank holiday tests cost more and sit in their own group.
        </p>
        <p style={p}>
          <strong style={{ color: "var(--fg-2)" }}>Automated cancellation checkers are no longer allowed.</strong> Since 12 May 2026 DVSA has blocked the apps that refresh the booking system looking for cancellations. Swapping with another learner is one of the few routes left that DVSA is happy with.
        </p>

        <h2 style={h2}>Common questions</h2>
        {faqs.map((f, i) => (
          <div key={i} style={{ marginBottom: "18px" }}>
            <h3 style={h3}>{f.q}</h3>
            <p style={{ ...p, marginBottom: 0 }}>{f.a}</p>
          </div>
        ))}

        <div style={{ marginTop: "40px", padding: "24px", borderRadius: "12px", background: "var(--bg-raised)", border: "1px solid var(--border)", textAlign: "center", maxWidth: "640px" }}>
          {/* "List" is our word, not the visitor's. Somebody arriving from
              search wants to swap a test, not list one. */}
          <h2 style={{ ...h2, margin: "0 0 8px" }}>Swap your {city.name} test</h2>
          <p style={{ ...p, marginBottom: "18px", maxWidth: "none" }}>
            {stats && stats.total > 0
              ? `${stats.total} ${stats.total === 1 ? "person is" : "people are"} already waiting to swap in ${city.region}.`
              : copy.emptyState}
          </p>
          <Link href="/register" className="city-cta" style={{ display: "inline-block", padding: "14px 28px", borderRadius: "10px", background: "linear-gradient(135deg,#1D9E75,#15805e)", color: "#fff", fontWeight: 700, fontSize: "15px", textDecoration: "none" }}>
            Swap your test
          </Link>
        </div>

        <p style={{ fontSize: "13px", color: "var(--muted-2)", marginTop: "28px", lineHeight: 1.7 }}>
          SwapTest is not affiliated with DVSA. Rules quoted here come from{" "}
          <a href="https://www.gov.uk/change-driving-test" rel="nofollow noopener" target="_blank" style={{ color: "#1D9E75" }}>gov.uk/change-driving-test</a>{" "}
          and were last checked in July 2026. Always confirm with DVSA before relying on them.
        </p>
      </main>
    </div>
  );
}
