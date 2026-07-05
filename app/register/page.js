"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/navbar";
import { ErrorBox } from "@/components/ui";
import { register, createListing, startRegistrationCheckout } from "@/lib/api-client";
import { paymentsEnabled } from "@/lib/payments";
import { UK_CENTRES } from "@/lib/centres";

function RegisterForm() {
  var router = useRouter();
  var searchParams = useSearchParams();
  var typeParam = searchParams.get("type") || "earlier";

  var [step, setStep] = useState(1);
  var [loading, setLoading] = useState(false);
  var [errors, setErrors] = useState([]);
  var [user, setUser] = useState(null);
  var [userType] = useState(typeParam === "later" ? "LATER" : "EARLIER");

  var [name, setName] = useState("");
  var [email, setEmail] = useState("");
  var [phone, setPhone] = useState("");
  var [password, setPassword] = useState("");

  var [centre, setCentre] = useState("");
  var [testType, setTestType] = useState("WEEKDAY");
  var [swappedBefore, setSwappedBefore] = useState(false);
  var [originalCentre, setOriginalCentre] = useState("");
  var [currentDate, setCurrentDate] = useState("");
  var [currentTime, setCurrentTime] = useState("");

  var clearErrors = function() { if (errors.length > 0) setErrors([]); };

  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  var tomorrowStr = tomorrow.toISOString().split("T")[0];

  var isEarlier = userType === "EARLIER";

  var handleRegister = async function() {
    setLoading(true); setErrors([]);
    try {
      var data = await register({ name: name, email: email, phone: phone, password: password });
      setUser(data.user);
      setStep(2);
    } catch (err) { setErrors(err.errors || ["Registration failed"]); }
    finally { setLoading(false); }
  };

  var handleCreateListing = async function() {
    setLoading(true); setErrors([]);
    try {
      // A brand-new user hasn't paid the £1 registration fee yet. Stash the
      // listing they entered and send them to Stripe; the dashboard creates the
      // listing once registrationPaidAt is set (on return from checkout).
      sessionStorage.setItem("swaptest_pending_listing", JSON.stringify({
        type: userType, centre: centre, testType: testType,
        originalCentre: swappedBefore ? (originalCentre || undefined) : undefined,
        currentDate: currentDate, currentTime: currentTime,
      }));
      var r = await startRegistrationCheckout();
      if (r && r.checkoutUrl) { window.location.href = r.checkoutUrl; return; }
      if (r && (r.freeMode || r.alreadyPaid)) {
        // Free mode (or already paid) — create the listing straight away.
        var data = await createListing({ type: userType, centre: centre, testType: testType, originalCentre: swappedBefore ? (originalCentre || undefined) : undefined, currentDate: currentDate, currentTime: currentTime });
        if (data.matches && data.matches.length > 0) {
          sessionStorage.setItem("swaptest_matches", JSON.stringify(data.matches));
          sessionStorage.setItem("swaptest_listing", JSON.stringify(data.listing));
        }
        sessionStorage.removeItem("swaptest_pending_listing");
        router.push("/dashboard");
      }
    } catch (err) { setErrors(err.errors || ["Could not continue to payment"]); }
    finally { setLoading(false); }
  };

  var handleKeyDown = function(e) {
    if (e.key === "Enter") {
      if (step === 1) handleRegister();
      else handleCreateListing();
    }
  };

  // ── Styles ──
  var inputStyle = {
    width: "100%", padding: "14px 16px", borderRadius: "10px",
    border: "1px solid var(--border)", background: "var(--bg-raised)", color: "var(--fg)",
    fontSize: "15px", outline: "none", boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };
  var labelStyle = { display: "block", fontSize: "13px", fontWeight: 600, color: "var(--fg-2)", marginBottom: "6px" };
  var hintStyle = { fontWeight: 400, color: "var(--muted-2)", marginLeft: "4px", fontSize: "12px" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar user={user} />

      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "40px 20px 80px" }}>
        {/* Back button */}
        {step === 2 && (
          <button onClick={function() { setStep(1); setErrors([]); }}
            style={{ background: "none", border: "none", color: "var(--muted-2)", cursor: "pointer", fontSize: "14px", padding: 0, marginBottom: "24px", minHeight: "44px", touchAction: "manipulation" }}>
            ← Back to account details
          </button>
        )}

        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          {/* Type badge */}
          <div style={{
            display: "inline-block", padding: "5px 14px", borderRadius: "20px", marginBottom: "16px",
            fontSize: "12px", fontWeight: 600, letterSpacing: "0.5px",
            background: isEarlier ? "rgba(29,158,117,0.12)" : "rgba(232,168,56,0.12)",
            color: isEarlier ? "var(--brand-text)" : "var(--accent-amber)",
            border: isEarlier ? "1px solid rgba(29,158,117,0.25)" : "1px solid rgba(232,168,56,0.25)",
          }}>
            {isEarlier ? "Looking for an earlier date" : "Looking for a later date"}
          </div>

          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--fg-strong)", margin: "0 0 8px", letterSpacing: "-0.5px" }}>
            {step === 1 ? "Create your account" : "Tell us about your test"}
          </h1>
          <p style={{ fontSize: "15px", color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
            {step === 1
              ? "Your contact details are only shared after both parties agree to swap."
              : isEarlier
                ? "We'll search for people who want a later date at your centre or nearby."
                : "We'll search for people who want an earlier date at your centre or nearby."
            }
          </p>
        </div>

        {/* Step progress */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "32px" }}>
          <div style={{ flex: 1, height: "4px", borderRadius: "2px", background: "#1D9E75" }} />
          <div style={{ flex: 1, height: "4px", borderRadius: "2px", background: step >= 2 ? "#1D9E75" : "var(--chip)" }} />
        </div>

        <ErrorBox errors={errors} />

        {/* ── Step 1: Account ── */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }} onKeyDown={handleKeyDown}>
            <div>
              <label htmlFor="reg-name" style={labelStyle}>Full name</label>
              <input id="reg-name" name="name" autoComplete="name"
                value={name} onChange={function(e) { setName(e.target.value); clearErrors(); }}
                placeholder="What should we call you?" style={inputStyle} />
            </div>
            <div>
              <label htmlFor="reg-email" style={labelStyle}>Email address</label>
              <input id="reg-email" name="email" type="email" autoComplete="email" inputMode="email" spellCheck={false}
                value={email} onChange={function(e) { setEmail(e.target.value); clearErrors(); }}
                placeholder="you@example.com" style={inputStyle} />
            </div>
            <div>
              <label htmlFor="reg-phone" style={labelStyle}>Phone number <span style={hintStyle}>UK mobile</span></label>
              <input id="reg-phone" name="tel" type="tel" autoComplete="tel" inputMode="tel"
                value={phone} onChange={function(e) { setPhone(e.target.value); clearErrors(); }}
                placeholder="07xxx xxxxxx" style={inputStyle} />
            </div>
            <div>
              <label htmlFor="reg-password" style={labelStyle}>Password <span style={hintStyle}>at least 8 characters</span></label>
              <input id="reg-password" name="new-password" type="password" autoComplete="new-password"
                value={password} onChange={function(e) { setPassword(e.target.value); clearErrors(); }}
                placeholder="Create a secure password" style={inputStyle} />
            </div>

            <button onClick={handleRegister} disabled={loading} style={{
              width: "100%", padding: "16px", borderRadius: "10px", border: "none",
              background: "linear-gradient(135deg, #1D9E75, #15805e)", color: "#fff",
              fontSize: "16px", fontWeight: 700, cursor: "pointer", marginTop: "8px",
              opacity: loading ? 0.6 : 1, touchAction: "manipulation",
              boxShadow: "0 4px 16px rgba(29,158,117,0.25)",
            }}>
              {loading ? "Creating account..." : "Continue to test details"}
            </button>

            <p style={{ textAlign: "center", fontSize: "13px", color: "var(--faint)", marginTop: "4px" }}>
              Already have an account? <Link href="/login" style={{ color: "#1D9E75", textDecoration: "none" }}>Log in</Link>
            </p>
          </div>
        )}

        {/* ── Step 2: Listing ── */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} onKeyDown={handleKeyDown}>

            {/* Info banner */}
            <div style={{
              padding: "14px 16px", borderRadius: "10px",
              background: isEarlier ? "rgba(29,158,117,0.06)" : "rgba(232,168,56,0.06)",
              border: isEarlier ? "1px solid rgba(29,158,117,0.15)" : "1px solid rgba(232,168,56,0.15)",
              fontSize: "13px", color: isEarlier ? "var(--brand-text)" : "var(--accent-amber)", lineHeight: 1.5,
            }}>
              {isEarlier
                ? "Enter your current test details below. We'll find people with earlier dates who want to swap to your later date."
                : "Enter your current test details below. We'll find people with later dates who want to swap to your earlier date."
              }
            </div>

            {/* Centre */}
            <div>
              <label style={labelStyle}>Which test centre is your test booked at?</label>
              <select value={centre} onChange={function(e) { setCentre(e.target.value); clearErrors(); }}
                style={{ ...inputStyle, appearance: "auto", cursor: "pointer" }}>
                <option value="">Choose your test centre...</option>
                {UK_CENTRES.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
              </select>
              <p style={{ fontSize: "12px", color: "var(--faint)", marginTop: "6px" }}>
                We'll also search 3 nearby centres automatically.
              </p>
            </div>

            {/* Test type */}
            <div>
              <label style={labelStyle}>What type of test is it?</label>
              <select value={testType} onChange={function(e) { setTestType(e.target.value); clearErrors(); }}
                style={{ ...inputStyle, appearance: "auto", cursor: "pointer" }}>
                <option value="WEEKDAY">Weekday test (£62)</option>
                <option value="EVENING_WEEKEND">Evening, weekend or bank holiday test (£75)</option>
              </select>
              <p style={{ fontSize: "12px", color: "var(--faint)", marginTop: "6px" }}>
                DVSA only allows swaps between the same test type.
              </p>
            </div>

            {/* Swapped before? */}
            <div>
              <label style={{ display: "flex", gap: "8px", alignItems: "flex-start", cursor: "pointer", fontSize: "13px", color: "var(--fg-2)" }}>
                <input type="checkbox" checked={swappedBefore} onChange={function(e) { setSwappedBefore(e.target.checked); clearErrors(); }} style={{ width: "auto", marginTop: "2px" }} />
                <span>I've swapped my test before (I can also move back to my original centre)</span>
              </label>
              {swappedBefore && (
                <select value={originalCentre} onChange={function(e) { setOriginalCentre(e.target.value); clearErrors(); }}
                  style={{ ...inputStyle, appearance: "auto", cursor: "pointer", marginTop: "10px" }}>
                  <option value="">Choose your original test centre...</option>
                  {UK_CENTRES.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
                </select>
              )}
            </div>

            {/* Current date & time */}
            <div style={{
              padding: "20px", borderRadius: "12px", background: "var(--bg-raised)",
              border: "1px solid var(--border)",
            }}>
              <label style={{ ...labelStyle, fontSize: "14px", marginBottom: "14px" }}>
                When is your current test?
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ ...labelStyle, fontSize: "12px", color: "var(--muted-2)" }}>Date</label>
                  <input type="date" value={currentDate} min={tomorrowStr}
                    onChange={function(e) { setCurrentDate(e.target.value); clearErrors(); }}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: "12px", color: "var(--muted-2)" }}>Time</label>
                  <input type="time" value={currentTime} min="07:00" max="17:00"
                    onChange={function(e) { setCurrentTime(e.target.value); clearErrors(); }}
                    style={inputStyle} />
                </div>
              </div>
            </div>

            <div style={{
              padding: "14px 16px", borderRadius: "10px", background: "var(--bg-raised)",
              border: "1px solid var(--border)", fontSize: "13px", color: "var(--muted)", lineHeight: 1.5,
            }}>
              {isEarlier
                ? "We'll match you with anyone at your centre (or a nearby one) who has an earlier slot and wants a later date."
                : "We'll match you with anyone at your centre (or a nearby one) who has a later slot and wants an earlier date."}
              {paymentsEnabled() ? " A one-time £1 registration fee lists your test." : ""}
            </div>

            <button onClick={handleCreateListing} disabled={loading} style={{
              width: "100%", padding: "16px", borderRadius: "10px", border: "none",
              background: "linear-gradient(135deg, #1D9E75, #15805e)", color: "#fff",
              fontSize: "16px", fontWeight: 700, cursor: "pointer", marginTop: "4px",
              opacity: loading ? 0.6 : 1, touchAction: "manipulation",
              boxShadow: "0 4px 16px rgba(29,158,117,0.25)",
            }}>
              {loading ? "One moment…" : (paymentsEnabled() ? "Continue — £1 to list your test" : "List my test")}
            </button>

            <p style={{ fontSize: "12px", color: "var(--faint)", textAlign: "center", lineHeight: 1.5 }}>
              You can edit or delete your listing anytime from your dashboard.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-2)" }}>Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
