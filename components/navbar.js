"use client";

// components/navbar.js — Top navigation bar for SwapTest.
// Accepts user (authenticated user object or null) and onLogout callback.

import { useRouter } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/components/theme-toggle";

export default function Navbar({ user, onLogout }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    onLogout?.();
    router.push("/");
  };

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--nav-bg)] backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={user ? "/dashboard" : "/"}
            className="text-xl font-bold text-[var(--fg)] hover:opacity-80 transition no-underline"
          >
            Swap<span className="text-[#1D9E75]">Test</span>
          </Link>
          <span className="hidden lg:block text-[13px] text-[var(--faint)] border-l border-[var(--border)] pl-3">
            Free UK test date swapping
          </span>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          {user ? (
            <>
              <span className="text-sm text-[var(--muted-2)] hidden sm:block">{user.name}</span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center min-h-[44px] text-sm text-[var(--muted-2)] hover:text-[var(--fg)] transition [touch-action:manipulation]"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center min-h-[44px] text-sm text-[var(--muted-2)] hover:text-[var(--fg)] transition no-underline [touch-action:manipulation]"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center min-h-[44px] text-sm px-5 py-2 rounded-lg bg-[#1D9E75] text-white font-semibold hover:bg-[#1ab87f] transition no-underline [touch-action:manipulation]"
              >
                Sign up free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
