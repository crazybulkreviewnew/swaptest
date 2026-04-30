"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/navbar";

export default function HomePage() {
  var user = null;
  var setUser;
  [user, setUser] = useState(null);

  useEffect(function() {
    fetch("/api/auth/me").then(function(r) { return r.json(); }).then(function(d) { if (d.user) setUser(d.user); });
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#111110" }}>
      <Navbar user={user} onLogout={function() { setUser(null); }} />

      {/* ── Hero ── */}
      <section style={{ padding: "80px 20px 60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        {/* Subtle gradient glow */}
        <div style={{
          position: "absolute", top: "-120px", left: "50%", transform: "translateX(-50%)",
          width: "600px", height: "400px", borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(29,158,117,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ maxWidth: "640px", margin: "0 auto", position: "relative" }}>
          <div style={{
            display: "inline-block", padding: "6px 16px", borderRadius: "20px",
            background: "rgba(29,158,117,0.12)", border: "1px solid rgba(29,158,117,0.25)",
            fontSize: "13px", fontWeight: 600, color: "#5DCAA5", marginBottom: "24px",
            letterSpacing: "0.5px",
          }}>
            Currently FREE for everyone
          </div>

          <h1 style={{
            fontSize: "clamp(36px, 6vw, 56px)", fontWeight: 800, lineHeight: 1.1,
            color: "#f0eee4", margin: "0 0 20px", letterSpacing: "-1.5px",
          }}>
            Swap your UK driving test date with someone
          </h1>

          <p style={{
            fontSize: "clamp(16px, 2.5vw, 19px)", color: "#9c9a92", lineHeight: 1.65,
            margin: "0 auto 36px", maxWidth: "520px",
          }}>
            Waiting months for your test? Find someone who wants to push theirs back and swap dates. Same centre or nearby — both sides win.
          </p>

          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register?type=earlier" style={{
              padding: "16px 32px", borderRadius: "12px", fontSize: "16px", fontWeight: 700,
              color: "#fff", textDecoration: "none", display: "inline-block",
              background: "linear-gradient(135deg, #1D9E75 0%, #15805e 100%)",
              boxShadow: "0 4px 20px rgba(29,158,117,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}>
              I need an earlier date
            </Link>
            <Link href="/register?type=later" style={{
              padding: "16px 32px", borderRadius: "12px", fontSize: "16px", fontWeight: 700,
              color: "#e8e6dc", textDecoration: "none", display: "inline-block",
              background: "#1a1a18", border: "1px solid #333",
              transition: "border-color 0.15s",
            }}>
              I want a later date
            </Link>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ padding: "60px 20px 80px", maxWidth: "900px", margin: "0 auto" }}>
        <h2 style={{
          fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 700, color: "#f0eee4",
          textAlign: "center", marginBottom: "12px", letterSpacing: "-0.5px",
        }}>
          How does it work?
        </h2>
        <p style={{ textAlign: "center", color: "#73726c", fontSize: "15px", marginBottom: "48px", maxWidth: "480px", marginLeft: "auto", marginRight: "auto" }}>
          Three simple steps. No complicated forms. No waiting on hold with DVSA.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
          {[
            {
              num: "1", title: "Tell us your test details",
              desc: "Enter your test centre, current date, and what dates you'd prefer. Takes 30 seconds.",
              icon: "📋",
            },
            {
              num: "2", title: "We find your match",
              desc: "Our system searches across your centre and 3 nearby centres for someone who wants to swap.",
              icon: "🔍",
            },
            {
              num: "3", title: "Agree and coordinate",
              desc: "Both parties agree, get each other's details, and rebook on the DVSA website together.",
              icon: "🤝",
            },
          ].map(function(s) {
            return (
              <div key={s.num} style={{
                background: "#161614", borderRadius: "16px", padding: "32px 28px",
                border: "1px solid #222", position: "relative",
                transition: "border-color 0.2s, transform 0.2s",
              }}>
                <div style={{ fontSize: "32px", marginBottom: "16px" }}>{s.icon}</div>
                <div style={{
                  position: "absolute", top: "28px", right: "24px",
                  fontSize: "48px", fontWeight: 800, color: "rgba(29,158,117,0.08)",
                  lineHeight: 1, letterSpacing: "-2px",
                }}>{s.num}</div>
                <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#e8e6dc", marginBottom: "8px" }}>{s.title}</h3>
                <p style={{ fontSize: "14px", color: "#8a8880", lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Why SwapTest ── */}
      <section style={{ padding: "60px 20px 80px", background: "#161614", borderTop: "1px solid #1e1e1c", borderBottom: "1px solid #1e1e1c" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{
            fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 700, color: "#f0eee4",
            textAlign: "center", marginBottom: "48px", letterSpacing: "-0.5px",
          }}>
            Why people use SwapTest
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px" }}>
            {[
              { title: "Completely free", desc: "No platform fees, no hidden charges. We believe everyone deserves a fair shot at their driving test.", color: "#1D9E75" },
              { title: "320+ test centres", desc: "Every DVSA test centre in England, Scotland, and Wales. Plus automatic matching with 3 nearby centres.", color: "#85B7EB" },
              { title: "Smart matching", desc: "Our algorithm checks dates AND centres both ways. Every match shown is genuinely fair to both people.", color: "#E8A838" },
              { title: "Secure & private", desc: "Your contact details are only shared after both sides agree. Passwords are encrypted with bcrypt.", color: "#C084FC" },
              { title: "30-minute windows", desc: "When someone wants to swap with you, you get 30 minutes to respond. Fast, decisive, no ghosting.", color: "#F0997B" },
              { title: "Email notifications", desc: "Get notified instantly when someone wants your date. No need to keep checking the site.", color: "#5DCAA5" },
            ].map(function(item) {
              return (
                <div key={item.title} style={{ padding: "24px", borderRadius: "12px", background: "#111110", border: "1px solid #222" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.color, marginBottom: "14px" }} />
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#e8e6dc", marginBottom: "6px" }}>{item.title}</h3>
                  <p style={{ fontSize: "13px", color: "#73726c", lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ (SEO content) ── */}
      <section style={{ padding: "80px 20px", maxWidth: "680px", margin: "0 auto" }}>
        <h2 style={{
          fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 700, color: "#f0eee4",
          textAlign: "center", marginBottom: "48px", letterSpacing: "-0.5px",
        }}>
          Frequently asked questions
        </h2>

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
        ].map(function(faq, i) {
          return (
            <div key={i} style={{
              padding: "24px 0",
              borderBottom: "1px solid #1e1e1c",
            }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#e8e6dc", marginBottom: "10px", lineHeight: 1.4 }}>{faq.q}</h3>
              <p style={{ fontSize: "14px", color: "#8a8880", lineHeight: 1.7, margin: 0 }}>{faq.a}</p>
            </div>
          );
        })}
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding: "80px 20px", textAlign: "center",
        background: "linear-gradient(180deg, #111110 0%, #0d1a15 100%)",
      }}>
        <h2 style={{
          fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "#f0eee4",
          marginBottom: "16px", letterSpacing: "-1px",
        }}>
          Ready to swap your test date?
        </h2>
        <p style={{ color: "#73726c", fontSize: "16px", marginBottom: "32px", maxWidth: "440px", marginLeft: "auto", marginRight: "auto" }}>
          It takes 30 seconds to list your test. You could have a new date by the end of the day.
        </p>
        <Link href="/register" style={{
          padding: "18px 40px", borderRadius: "12px", fontSize: "17px", fontWeight: 700,
          color: "#fff", textDecoration: "none", display: "inline-block",
          background: "linear-gradient(135deg, #1D9E75 0%, #15805e 100%)",
          boxShadow: "0 4px 24px rgba(29,158,117,0.35)",
        }}>
          Get started — it's free
        </Link>

        {user && (
          <div style={{ marginTop: "16px" }}>
            <Link href="/dashboard" style={{ fontSize: "14px", color: "#1D9E75", textDecoration: "none" }}>
              Go to your dashboard →
            </Link>
          </div>
        )}
      </section>

      {/* ── Footer ── */}
      <footer style={{
        padding: "32px 20px", borderTop: "1px solid #1e1e1c",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: "680px", margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "24px", alignItems: "center" }}>
          <span style={{ fontSize: "16px", fontWeight: 700, color: "#e8e6dc" }}>
            Swap<span style={{ color: "#1D9E75" }}>Test</span>
          </span>
          <Link href="/privacy" style={{ fontSize: "13px", color: "#73726c", textDecoration: "none" }}>Privacy Policy</Link>
          <Link href="/login" style={{ fontSize: "13px", color: "#73726c", textDecoration: "none" }}>Log in</Link>
          <Link href="/register" style={{ fontSize: "13px", color: "#73726c", textDecoration: "none" }}>Sign up</Link>
        </div>
        <p style={{ fontSize: "12px", color: "#53524e", marginTop: "16px" }}>
          © 2026 SwapTest. Not affiliated with DVSA or GOV.UK.
        </p>
      </footer>
    </div>
  );
}
