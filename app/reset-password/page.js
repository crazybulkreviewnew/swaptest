"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/navbar";
import { ErrorBox, SuccessBanner, Field, PrimaryButton, PageShell } from "@/components/ui";

function ResetPasswordForm() {
  var searchParams = useSearchParams();
  var token = searchParams.get("token");

  var [email, setEmail] = useState("");
  var [password, setPassword] = useState("");
  var [confirmPassword, setConfirmPassword] = useState("");
  var [loading, setLoading] = useState(false);
  var [errors, setErrors] = useState([]);
  var [success, setSuccess] = useState(null);
  var [step, setStep] = useState(token ? "reset" : "request");

  var handleForgotPassword = async function() {
    setLoading(true);
    setErrors([]);
    setSuccess(null);
    try {
      var res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email }),
      });
      var data = await res.json();
      if (!res.ok) {
        setErrors(data.errors || ["Something went wrong"]);
      } else {
        setSuccess(data.message);
      }
    } catch (err) {
      setErrors(["Something went wrong. Please try again."]);
    } finally {
      setLoading(false);
    }
  };

  var handleResetPassword = async function() {
    if (password !== confirmPassword) {
      setErrors(["Passwords do not match"]);
      return;
    }
    if (password.length < 8) {
      setErrors(["Password must be at least 8 characters"]);
      return;
    }
    setLoading(true);
    setErrors([]);
    setSuccess(null);
    try {
      var res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token, password: password }),
      });
      var data = await res.json();
      if (!res.ok) {
        setErrors(data.errors || ["Something went wrong"]);
      } else {
        setSuccess(data.message);
      }
    } catch (err) {
      setErrors(["Something went wrong. Please try again."]);
    } finally {
      setLoading(false);
    }
  };

  var handleKeyDown = function(e) {
    if (e.key === "Enter") {
      if (step === "request") handleForgotPassword();
      else handleResetPassword();
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <PageShell
        title={step === "request" ? "Forgot your password?" : "Set a new password"}
        subtitle={step === "request"
          ? "Enter your email and we'll send you a link to reset your password."
          : "Enter your new password below."}
      >
        <ErrorBox errors={errors} />
        {success && <SuccessBanner>{success}</SuccessBanner>}

        {step === "request" && !success && (
          <div className="flex flex-col gap-4" onKeyDown={handleKeyDown}>
            <Field label="Email address" required>
              <input value={email} onChange={function(e) { setEmail(e.target.value); setErrors([]); }}
                type="email" name="email" autoComplete="email" inputMode="email" spellCheck={false}
                placeholder="your@email.com" />
            </Field>
            <PrimaryButton onClick={handleForgotPassword} loading={loading}>
              Send reset link
            </PrimaryButton>
          </div>
        )}

        {step === "reset" && !success && (
          <div className="flex flex-col gap-4" onKeyDown={handleKeyDown}>
            <Field label="New password" required hint="min 8 characters">
              <input value={password} onChange={function(e) { setPassword(e.target.value); setErrors([]); }}
                type="password" name="new-password" autoComplete="new-password" placeholder="••••••••" />
            </Field>
            <Field label="Confirm new password" required>
              <input value={confirmPassword} onChange={function(e) { setConfirmPassword(e.target.value); setErrors([]); }}
                type="password" name="confirm-password" autoComplete="new-password" placeholder="••••••••" />
            </Field>
            <PrimaryButton onClick={handleResetPassword} loading={loading}>
              Reset password
            </PrimaryButton>
          </div>
        )}

        {success && (
          <div className="mt-4 text-center">
            <Link href="/login" className="text-sm text-[#1D9E75] hover:underline">
              Go to login
            </Link>
          </div>
        )}

        {step === "request" && !success && (
          <p className="text-center text-xs text-[#53524e] mt-4">
            Remember your password?{" "}
            <Link href="/login" className="text-[#1D9E75] hover:underline">Log in</Link>
          </p>
        )}
      </PageShell>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#73726c]">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
