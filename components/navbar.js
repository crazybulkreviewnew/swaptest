"use client";

// ============================================================
// components/navbar.js — Top Navigation Bar
// ============================================================

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Navbar({ user, onLogout }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    onLogout?.();
    router.push("/");
  };

  return (
    <nav className="border-b border-[#2a2a27] bg-[#111110]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
        <Link href={user ? "/dashboard" : "/"} className="text-lg font-bold text-[#e8e6dc] hover:opacity-80 transition">
          Swap<span className="text-[#1D9E75]">Test</span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-[#73726c] hidden sm:block">
                {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-[#73726c] hover:text-[#e8e6dc] transition"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-[#73726c] hover:text-[#e8e6dc] transition">
                Log in
              </Link>
              <Link
                href="/register"
                className="text-sm px-4 py-1.5 rounded-lg bg-[#1D9E75] text-white font-medium hover:bg-[#1ab87f] transition"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
