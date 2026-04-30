"use client";

// ============================================================
// components/ui.js — Shared UI Components
// ============================================================

import { useState, useEffect } from "react";

// ── Error Display (multi-line bullet list) ────────────────

export function ErrorBox({ errors }) {
  if (!errors || errors.length === 0) return null;
  const list = Array.isArray(errors) ? errors : [errors];
  return (
    <div className="bg-red-950/60 border border-red-900/40 text-red-300 px-4 py-3 rounded-lg text-sm mb-5 leading-relaxed">
      {list.map((e, i) => (
        <div key={i} className="flex gap-2 items-start">
          <span className="text-red-500 shrink-0 mt-px">•</span>
          <span>{e}</span>
        </div>
      ))}
    </div>
  );
}

// ── Success Banner ────────────────────────────────────────

export function SuccessBanner({ children }) {
  return (
    <div className="bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 px-4 py-3 rounded-lg text-sm mb-5 flex items-center gap-2">
      <span className="text-lg">✓</span>
      <span>{children}</span>
    </div>
  );
}

// ── Form Field Wrapper ────────────────────────────────────

export function Field({ label, hint, required, children }) {
  return (
    <div>
      <label className="block text-xs text-[#9c9a92] mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {hint && (
          <span className="text-[#53524e] italic ml-1">{hint}</span>
        )}
      </label>
      {children}
    </div>
  );
}

// ── Primary Button ────────────────────────────────────────

export function PrimaryButton({ children, onClick, disabled, loading, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full py-3.5 rounded-lg bg-[#1D9E75] hover:bg-[#1ab87f] text-white font-semibold text-[15px] transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Processing...
        </span>
      ) : children}
    </button>
  );
}

// ── Secondary / Ghost Button ──────────────────────────────

export function SecondaryButton({ children, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-lg border border-[#2a2a27] bg-transparent text-[#9c9a92] hover:border-[#444] hover:text-[#ccc] text-sm transition ${className}`}
    >
      {children}
    </button>
  );
}

// ── Badge / Pill ──────────────────────────────────────────

export function Badge({ children, variant = "default" }) {
  const styles = {
    default: "bg-[#262622] text-[#9c9a92]",
    earlier: "bg-[#085041] text-[#5DCAA5]",
    later: "bg-[#4A1B0C] text-[#F0997B]",
    success: "bg-emerald-950/60 text-emerald-400",
    warning: "bg-amber-950/60 text-amber-400",
    danger: "bg-red-950/60 text-red-400",
    info: "bg-blue-950/60 text-blue-400",
  };
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${styles[variant] || styles.default}`}>
      {children}
    </span>
  );
}

// ── Countdown Timer ───────────────────────────────────────

export function Countdown({ deadline, onExpired }) {
  const [remaining, setRemaining] = useState(Math.max(0, new Date(deadline).getTime() - Date.now()));

  useEffect(() => {
    const iv = setInterval(() => {
      const r = Math.max(0, new Date(deadline).getTime() - Date.now());
      setRemaining(r);
      if (r <= 0) {
        clearInterval(iv);
        onExpired?.();
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [deadline, onExpired]);

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const urgent = remaining < 5 * 60 * 1000;
  const totalMs = 30 * 60 * 1000;

  return (
    <div className="flex items-center gap-3 mt-2">
      <div className="flex-1 h-1.5 rounded-full bg-[#1a1a18] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{
            width: `${Math.min(100, (remaining / totalMs) * 100)}%`,
            background: urgent ? "#E24B4A" : "#1D9E75",
          }}
        />
      </div>
      <span
        className="font-mono text-sm font-semibold min-w-[52px] text-right"
        style={{ color: urgent ? "#E24B4A" : "#b0aea4" }}
      >
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────

export function Card({ children, className = "", highlight = false }) {
  return (
    <div className={`bg-[#1a1a18] rounded-xl border ${highlight ? "border-[#0F6E56]" : "border-[#2a2a27]"} p-5 ${className}`}>
      {children}
    </div>
  );
}

// ── Page Shell (max-width container with back button) ─────

export function PageShell({ children, title, subtitle, back, backLabel = "← Back", badge, maxWidth = "max-w-lg" }) {
  return (
    <div className={`${maxWidth} mx-auto px-5 py-10`}>
      {back && (
        <button onClick={back} className="text-[#73726c] hover:text-[#aaa] text-sm mb-5 transition">
          {backLabel}
        </button>
      )}
      {badge}
      {title && <h2 className="text-[22px] font-semibold text-[#e8e6dc] mb-1">{title}</h2>}
      {subtitle && <p className="text-[#73726c] text-sm mb-7">{subtitle}</p>}
      {children}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────

export function EmptyState({ icon = "○", title, description, action }) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-4 opacity-30">{icon}</div>
      <h3 className="text-lg font-semibold text-[#e8e6dc] mb-2">{title}</h3>
      {description && <p className="text-sm text-[#73726c] mb-6 max-w-sm mx-auto">{description}</p>}
      {action}
    </div>
  );
}

// ── Stat / Metric Card ────────────────────────────────────

export function StatCard({ label, value, sub }) {
  return (
    <div className="bg-[#1a1a18] rounded-lg border border-[#2a2a27] px-4 py-3">
      <div className="text-xs text-[#73726c] mb-1">{label}</div>
      <div className="text-xl font-semibold text-[#e8e6dc]">{value}</div>
      {sub && <div className="text-xs text-[#53524e] mt-0.5">{sub}</div>}
    </div>
  );
}

// ── Date Formatter ────────────────────────────────────────

export function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}
