"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/navbar";
import { ErrorBox, Field, PrimaryButton, PageShell } from "@/components/ui";
import { login } from "@/lib/api-client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const handleLogin = async () => {
    setLoading(true);
    setErrors([]);
    try {
      await login({ email, password });
      router.push(redirect);
    } catch (err) {
      setErrors(err.errors || ["Login failed"]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <PageShell title="Welcome back" subtitle="Log in to manage your listings and matches.">
        <ErrorBox errors={errors} />
        <div className="flex flex-col gap-4" onKeyDown={handleKeyDown}>
          <Field label="Email" required>
            <input value={email} onChange={(e) => { setEmail(e.target.value); setErrors([]); }}
              type="email" placeholder="alex@example.com" />
          </Field>
          <Field label="Password" required>
            <input value={password} onChange={(e) => { setPassword(e.target.value); setErrors([]); }}
              type="password" placeholder="••••••••" />
          </Field>
          <div className="text-right">
            <Link href="/reset-password" className="text-xs text-[#1D9E75] hover:underline">Forgot your password?</Link>
          </div>
          <PrimaryButton onClick={handleLogin} loading={loading}>
            Log in
          </PrimaryButton>
          <p className="text-center text-xs text-[#53524e] mt-2">
            Don't have an account?{" "}
            <Link href="/register" className="text-[#1D9E75] hover:underline">Sign up</Link>
          </p>
        </div>
      </PageShell>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#73726c]">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
