"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/navbar";

export default function HomePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.user) setUser(d.user); });
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Navbar user={user} onLogout={() => setUser(null)} />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-5 pt-20 pb-16 lg:pt-28 lg:pb-24">
        {/* Background glow (decorative) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(29,158,117,0.12) 0%, transparent 70%)" }}
        />

        <div className="relative max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">

            {/* Text content */}
            <div className="flex-1 text-center lg:text-left">
              <div
                className="inline-block px-4 py-1.5 rounded-full text-[13px] font-semibold text-[var(--brand-text)] mb-6 tracking-wide"
                style={{ background: "rgba(29,158,117,0.12)", border: "1px solid rgba(29,158,117,0.25)" }}
              >
                Currently FREE for everyone
              </div>

              <h1 className="text-[clamp(36px,5vw,60px)] font-extrabold leading-[1.1] text-[var(--fg-strong)] tracking-tight mb-5">
                Swap your UK driving test date{" "}
                <span className="text-[#1D9E75]">with someone</span>
              </h1>

              <p className="text-[clamp(16px,2vw,19px)] text-[var(--muted)] leading-relaxed mb-8 max-w-[520px] mx-auto lg:mx-0">
                Waiting months for your test? Find someone who wants to push theirs back and swap dates.
                Same centre or nearby — both sides win.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href="/register?type=earlier"
                  className="px-8 py-4 rounded-xl text-base font-bold text-white no-underline text-center transition-transform hover:scale-[1.02] active:scale-[0.98] [touch-action:manipulation]"
                  style={{
                    background: "linear-gradient(135deg, #1D9E75 0%, #15805e 100%)",
                    boxShadow: "0 4px 20px rgba(29,158,117,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
                  }}
                >
                  I need an earlier date
                </Link>
                <Link
                  href="/register?type=later"
                  className="px-8 py-4 rounded-xl text-base font-bold text-[var(--fg)] no-underline text-center bg-[var(--card)] border border-[var(--border-strong)] transition-colors hover:border-[var(--border-strong)] [touch-action:manipulation]"
                >
                  I want a later date
                </Link>
              </div>

              {/* Stats row */}
              <div className="mt-10 flex flex-wrap gap-8 justify-center lg:justify-start">
                {[
                  { value: "320+", label: "test centres" },
                  { value: "100%", label: "free forever" },
                  { value: "30s", label: "to list your test" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="tabular text-2xl font-extrabold text-[var(--fg-strong)]">{stat.value}</div>
                    <div className="text-xs text-[var(--muted-2)] mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock UI card — desktop only. Purely decorative illustration of a
               match, so it's hidden from assistive tech and removed from tab order. */}
            <div className="hidden lg:block flex-shrink-0 w-[360px]" aria-hidden="true">
              <div
                className="rounded-2xl p-6 border border-[var(--border)] select-none"
                style={{
                  background: "var(--bg-raised)",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.4), 0 16px 40px rgba(0,0,0,0.45)",
                }}
              >
                <div className="text-[11px] font-semibold text-[var(--muted-2)] uppercase tracking-widest mb-4">
                  Match found
                </div>
                <div className="space-y-3 mb-5">
                  <div
                    className="rounded-xl p-4"
                    style={{ border: "1px solid rgba(29,158,117,0.3)", background: "rgba(29,158,117,0.05)" }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[13px] font-semibold text-[var(--brand-text)]">Birmingham (Kingstanding)</span>
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(29,158,117,0.15)", color: "var(--brand-text)" }}
                      >
                        Match
                      </span>
                    </div>
                    <div className="tabular text-[22px] font-bold text-[var(--fg-strong)]">14 Aug 2025</div>
                    <div className="text-[12px] text-[var(--muted-2)] mt-1">Wants: 15 Jul – 1 Aug</div>
                  </div>

                  <div className="text-[12px] text-center text-[var(--muted-2)]">↕ your listing</div>

                  <div className="rounded-xl p-4 border border-[var(--border)] bg-[var(--bg)]">
                    <div className="text-[13px] font-semibold text-[var(--fg)] mb-1">Birmingham (Shirley)</div>
                    <div className="tabular text-[22px] font-bold text-[var(--fg-strong)]">22 Jul 2025</div>
                    <div className="text-[12px] text-[var(--muted-2)] mt-1">You want: any earlier</div>
                  </div>
                </div>

                <div
                  className="w-full py-3 rounded-xl text-sm font-bold text-white text-center"
                  style={{ background: "linear-gradient(135deg, #1D9E75 0%, #15805e 100%)" }}
                >
                  Agree to swap →
                </div>
                <p className="tabular text-[11px] text-[var(--faint)] text-center mt-3 mb-0">
                  29 min 04 sec remaining
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="px-5 py-16 lg:py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-[clamp(24px,4vw,36px)] font-bold text-[var(--fg-strong)] text-center mb-3 tracking-tight">
            How does it work?
          </h2>
          <p className="text-center text-[var(--muted-2)] text-[15px] mb-12 max-w-[480px] mx-auto">
            Three simple steps. No complicated forms. No waiting on hold with DVSA.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                num: "1",
                title: "Tell us your test details",
                desc: "Enter your test centre, current date, and what dates you'd prefer. Takes 30 seconds.",
                icon: "📋",
              },
              {
                num: "2",
                title: "We find your match",
                desc: "Our system searches across your centre and 3 nearby centres for someone who wants to swap.",
                icon: "🔍",
              },
              {
                num: "3",
                title: "Agree and coordinate",
                desc: "Both parties agree, get each other's details, and rebook on the DVSA website together.",
                icon: "🤝",
              },
            ].map((s) => (
              <div
                key={s.num}
                className="relative rounded-2xl p-8 border border-[var(--border)] bg-[var(--bg-raised)] transition-colors hover:border-[var(--border-strong)]"
              >
                <div className="text-3xl mb-4" aria-hidden="true">{s.icon}</div>
                <div className="tabular absolute top-7 right-6 text-5xl font-extrabold leading-none tracking-tighter text-[#1D9E75]/[0.08]" aria-hidden="true">
                  {s.num}
                </div>
                <h3 className="text-[17px] font-bold text-[var(--fg)] mb-2">{s.title}</h3>
                <p className="text-[14px] text-[var(--muted)] leading-relaxed m-0">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why SwapTest ── */}
      <section className="px-5 py-16 lg:py-24 bg-[var(--bg-raised)] border-t border-b border-[var(--border-faint)]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-[clamp(24px,4vw,36px)] font-bold text-[var(--fg-strong)] text-center mb-3 tracking-tight">
            Why people use SwapTest
          </h2>
          <p className="text-center text-[var(--muted-2)] text-[15px] mb-12 max-w-[480px] mx-auto">
            Built for UK learner drivers, by people who have been there.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Completely free",
                desc: "No platform fees, no hidden charges. We believe everyone deserves a fair shot at their driving test.",
                color: "#1D9E75",
              },
              {
                title: "320+ test centres",
                desc: "Every DVSA test centre in England, Scotland, and Wales. Plus automatic matching with 3 nearby centres.",
                color: "#85B7EB",
              },
              {
                title: "Smart matching",
                desc: "Our algorithm checks dates AND centres both ways. Every match shown is genuinely fair to both people.",
                color: "#E8A838",
              },
              {
                title: "Secure & private",
                desc: "Your contact details are only shared after both sides agree. Passwords are encrypted with bcrypt.",
                color: "#C084FC",
              },
              {
                title: "30-minute windows",
                desc: "When someone wants to swap with you, you get 30 minutes to respond. Fast, decisive, no ghosting.",
                color: "#F0997B",
              },
              {
                title: "Email notifications",
                desc: "Get notified instantly when someone wants your date. No need to keep checking the site.",
                color: "var(--brand-text)",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-6 rounded-xl bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors"
              >
                <div className="w-2 h-2 rounded-full mb-4" style={{ background: item.color }} aria-hidden="true" />
                <h3 className="text-[15px] font-bold text-[var(--fg)] mb-2">{item.title}</h3>
                <p className="text-[13px] text-[var(--muted-2)] leading-relaxed m-0">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-5 py-16 lg:py-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-[clamp(24px,4vw,36px)] font-bold text-[var(--fg-strong)] text-center mb-12 tracking-tight">
            Frequently asked questions
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16">
            {[
              {
                q: "How does swapping a driving test date work?",
                a: "When you book a practical driving test with DVSA, you get a specific date and test centre. If that date doesn't suit you, you can normally only change it to whatever's available — often months away. SwapTest connects you with another candidate who has a date you want, and who wants your date. You both cancel and rebook each other's slots on the DVSA website.",
              },
              {
                q: "Is SwapTest really free?",
                a: "Yes, completely free. No platform fees, no subscription, no hidden charges. We may introduce a small optional fee in the future, but the core matching service will remain free.",
              },
              {
                q: "Can I swap to a different test centre?",
                a: "Yes. DVSA allows you to move your test to one of 3 nearby centres. SwapTest automatically checks all nearby centres when finding matches. Both people must be able to move to each other's centre for a swap to be valid.",
              },
              {
                q: "Is my personal information safe?",
                a: "Your password is encrypted using bcrypt hashing and can never be seen by anyone, including us. Your contact details (email and phone) are only shared with your swap partner after both of you agree to swap. We never sell or share your data with third parties.",
              },
              {
                q: "What happens if the other person doesn't respond?",
                a: "When you select a match, the other person has 30 minutes to agree. If they don't respond, the match expires automatically and your listing goes back into the pool. No harm done.",
              },
              {
                q: "Can I cancel or edit my listing?",
                a: "Yes. You can edit or delete your listing at any time from your dashboard, as long as it doesn't have an active match pending.",
              },
              {
                q: "How do I actually complete the swap on DVSA?",
                a: "After both parties agree, you'll receive each other's contact details by email. Coordinate a time, then both go to GOV.UK, cancel your current test, and immediately rebook at the other person's centre and date. We recommend doing it simultaneously.",
              },
            ].map((faq, i) => (
              <div key={i} className="py-6 border-b border-[var(--border-faint)]">
                <h3 className="text-[16px] font-bold text-[var(--fg)] mb-2.5 leading-snug">{faq.q}</h3>
                <p className="text-[14px] text-[var(--muted)] leading-relaxed m-0">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        className="px-5 py-20 text-center"
        style={{ background: "linear-gradient(180deg, var(--bg) 0%, var(--cta-end) 100%)" }}
      >
        <h2 className="text-[clamp(24px,4vw,42px)] font-extrabold text-[var(--fg-strong)] mb-4 tracking-tight">
          Ready to swap your test date?
        </h2>
        <p className="text-[var(--muted-2)] text-[16px] mb-8 max-w-[440px] mx-auto">
          It takes 30 seconds to list your test. You could have a new date by the end of the day.
        </p>
        <Link
          href="/register"
          className="inline-block px-10 py-4 rounded-xl text-[17px] font-bold text-white no-underline transition-transform hover:scale-[1.02] active:scale-[0.98] [touch-action:manipulation]"
          style={{
            background: "linear-gradient(135deg, #1D9E75 0%, #15805e 100%)",
            boxShadow: "0 4px 24px rgba(29,158,117,0.35)",
          }}
        >
          Get started — it’s free
        </Link>

        {user && (
          <div className="mt-4">
            <Link href="/dashboard" className="text-[14px] text-[#1D9E75] no-underline">
              Go to your dashboard →
            </Link>
          </div>
        )}
      </section>

      {/* ── Footer ── */}
      <footer className="px-5 py-10 border-t border-[var(--border-faint)]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="text-[16px] font-bold text-[var(--fg)]">
            Swap<span className="text-[#1D9E75]">Test</span>
          </span>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link href="/privacy" className="inline-flex items-center min-h-[24px] py-1 text-[13px] text-[var(--muted-2)] no-underline hover:text-[var(--muted)] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="inline-flex items-center min-h-[24px] py-1 text-[13px] text-[var(--muted-2)] no-underline hover:text-[var(--muted)] transition-colors">
              Terms &amp; Conditions
            </Link>
            <Link href="/cookies" className="inline-flex items-center min-h-[24px] py-1 text-[13px] text-[var(--muted-2)] no-underline hover:text-[var(--muted)] transition-colors">
              Cookies &amp; Data
            </Link>
            <Link href="/login" className="inline-flex items-center min-h-[24px] py-1 text-[13px] text-[var(--muted-2)] no-underline hover:text-[var(--muted)] transition-colors">
              Log in
            </Link>
            <Link href="/register" className="inline-flex items-center min-h-[24px] py-1 text-[13px] text-[var(--muted-2)] no-underline hover:text-[var(--muted)] transition-colors">
              Sign up
            </Link>
          </div>

          <p className="text-[12px] text-[var(--faint)] m-0">
            © 2026 SwapTest. Not affiliated with DVSA or GOV.UK.
          </p>
        </div>
      </footer>
    </div>
  );
}
