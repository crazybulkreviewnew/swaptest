"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/navbar";
import { ErrorBox } from "@/components/ui";
import { register, createListing } from "@/lib/api-client";
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
  var [currentDate, setCurrentDate] = useState("");
  var [currentTime, setCurrentTime] = useState("");
  var [prefFrom, setPrefFrom] = useState("");
  var [prefTo, setPrefTo] = useState("");

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
      var data = await createListing({
        type: userType, centre: centre, currentDate: currentDate, currentTime: currentTime,
        preferredDateFrom: prefFrom, preferredDateTo: prefTo || undefined,
      });
      if (data.matches && data.matches.length > 0) {
        sessionStorage.setItem("swaptest_matches", JSON.stringify(data.matches));
        sessionStorage.setItem("swaptest_listing", JSON.stringify(data.listing));
      }
      router.push("/dashboard");
    } catch (err) { setErrors(err.errors || ["Failed to create listing"]); }
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
    border: "1px solid #2a2a27", background: "#161614", color: "#e8e6dc",
    fontSize: "15px", outline: "none", boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };
  var labelStyle = { display: "block", fontSize: "13px", fontWeight: 600, color: "#c8c6bc", marginBottom: "6px" };
  var hintStyle = { fontWeight: 400, color: "#73726c", marginLeft: "4px", fontSize: "12px" };

  return (
    <div style={{ minHeight: "100vh", background: "#111110" }}>
      <Navbar user={user} />

      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "40px 20px 80px" }}>
        {/* Back button */}
        {step === 2 && (
          <button onClick={function() { setStep(1); setErrors([]); }}
            style={{ background: "none", border: "none", color: "#73726c", cursor: "pointer", fontSize: "14px", padding: 0, marginBottom: "24px", minHeight: "44px", touchAction: "manipulation" }}>
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
            color: isEarlier ? "#5DCAA5" : "#E8A838",
            border: isEarlier ? "1px solid rgba(29,158,117,0.25)" : "1px solid rgba(232,168,56,0.25)",
          }}>
            {isEarlier ? "Looking for an earlier date" : "Looking for a later date"}
          </div>

          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#f0eee4", margin: "0 0 8px", letterSpacing: "-0.2px" }}>
            {step === 1 ? "Create your account" : "Tell us about your test"}
          </h1>
          <p style={{ fontSize: "15px", color: "#8a8880", margin: 0, lineHeight: 1.5 }}>
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
          <div style={{ flex: 1, height: "4px", borderRadius: "2px", background: step >= 2 ? "#1D9E75" : "#262622" }} />
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

            <p style={{ textAlign: "center", fontSize: "13px", color: "#53524e", marginTop: "4px" }}>
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
              fontSize: "13px", color: isEarlier ? "#7dd4b3" : "#e8c078", lineHeight: 1.5,
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
              <p style={{ fontSize: "12px", color: "#53524e", marginTop: "6px" }}>
                We'll also search 3 nearby centres automatically.
              </p>
            </div>

            {/* Current date & time */}
            <div style={{
              padding: "20px", borderRadius: "12px", background: "#161614",
              border: "1px solid #222",
            }}>
              <label style={{ ...labelStyle, fontSize: "14px", marginBottom: "14px" }}>
                When is your current test?
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ ...labelStyle, fontSize: "12px", color: "#73726c" }}>Date</label>
                  <input type="date" value={currentDate} min={tomorrowStr}
                    onChange={function(e) { setCurrentDate(e.target.value); clearErrors(); }}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: "12px", color: "#73726c" }}>Time</label>
                  <input type="time" value={currentTime} min="07:00" max="17:00"
                    onChange={function(e) { setCurrentTime(e.target.value); clearErrors(); }}
                    style={inputStyle} />
                </div>
              </div>
            </div>

            {/* Preferred range */}
            <div style={{
              padding: "20px", borderRadius: "12px", background: "#161614",
              border: "1px solid #222",
            }}>
              <label style={{ ...labelStyle, fontSize: "14px", marginBottom: "4px" }}>
                {isEarlier ? "What dates would work for you?" : "When would you prefer to take your test?"}
              </label>
              <p style={{ fontSize: "12px", color: "#73726c", margin: "0 0 14px" }}>
                {isEarlier
                  ? "Pick a range of dates earlier than your current test."
                  : "Pick a range of dates later than your current test."
                }
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ ...labelStyle, fontSize: "12px", color: "#73726c" }}>From</label>
                  <input type="date" value={prefFrom}
                    min={isEarlier ? tomorrowStr : (currentDate || tomorrowStr)}
                    max={isEarlier ? (currentDate || undefined) : undefined}
                    onChange={function(e) { setPrefFrom(e.target.value); clearErrors(); }}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: "12px", color: "#73726c" }}>To <span style={hintStyle}>(optional)</span></label>
                  <input type="date" value={prefTo}
                    min={prefFrom || tomorrowStr}
                    max={isEarlier ? (currentDate || undefined) : undefined}
                    onChange={function(e) { setPrefTo(e.target.value); clearErrors(); }}
                    style={inputStyle} />
                </div>
              </div>
            </div>

            <button onClick={handleCreateListing} disabled={loading} style={{
              width: "100%", padding: "16px", borderRadius: "10px", border: "none",
              background: "linear-gradient(135deg, #1D9E75, #15805e)", color: "#fff",
              fontSize: "16px", fontWeight: 700, cursor: "pointer", marginTop: "4px",
              opacity: loading ? 0.6 : 1, touchAction: "manipulation",
              boxShadow: "0 4px 16px rgba(29,158,117,0.25)",
            }}>
              {loading ? "Searching..." : (isEarlier ? "Find matches" : "List my test")}
            </button>

            <p style={{ fontSize: "12px", color: "#53524e", textAlign: "center", lineHeight: 1.5 }}>
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
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#73726c" }}>Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
