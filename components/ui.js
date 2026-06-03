"use client";

// ============================================================
// components/ui.js — Shared UI Components
// ============================================================

import { useState, useEffect, useId, cloneElement, isValidElement } from "react";

// ── Error Display (multi-line bullet list) ────────────────
// role="alert" so assistive tech announces validation errors as they appear
// (Vercel guideline: use a live region for validation feedback).

export function ErrorBox({ errors }) {
  if (!errors || errors.length === 0) return null;
  const list = Array.isArray(errors) ? errors : [errors];
  return (
    <div role="alert" className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/60 dark:border-red-900/40 dark:text-red-300 px-4 py-3 rounded-lg text-sm mb-5 leading-relaxed">
      {list.map((e, i) => (
        <div key={i} className="flex gap-2 items-start">
          <span aria-hidden="true" className="text-red-500 shrink-0 mt-px">•</span>
          <span>{e}</span>
        </div>
      ))}
    </div>
  );
}

// ── Success Banner ────────────────────────────────────────

export function SuccessBanner({ children }) {
  return (
    <div role="status" className="bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800/40 dark:text-emerald-300 px-4 py-3 rounded-lg text-sm mb-5 flex items-center gap-2">
      <span aria-hidden="true" className="text-lg">✓</span>
      <span>{children}</span>
    </div>
  );
}

// ── Form Field Wrapper ────────────────────────────────────
// Associates the <label> with its control via a generated id so clicking the
// label focuses the input and screen readers announce the name (Vercel guideline).

export function Field({ label, hint, required, children }) {
  const id = useId();
  const control =
    isValidElement(children) && children.props.id == null
      ? cloneElement(children, { id })
      : children;
  return (
    <div>
      <label htmlFor={id} className="block text-xs text-[var(--muted)] mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {hint && (
          <span className="text-[var(--faint)] italic ml-1">{hint}</span>
        )}
      </label>
      {control}
    </div>
  );
}

// ── Primary Button ────────────────────────────────────────
// Keeps its label visible while loading (shows a spinner alongside) rather than
// swapping to generic text — per the Vercel loading-state guideline.

export function PrimaryButton({ children, onClick, disabled, loading, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`w-full py-3.5 rounded-lg bg-[#1D9E75] hover:bg-[#1ab87f] text-white font-semibold text-[15px] transition disabled:opacity-50 disabled:cursor-not-allowed [touch-action:manipulation] ${className}`}
    >
      <span className="flex items-center justify-center gap-2">
        {loading && (
          <span aria-hidden="true" className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        {children}
      </span>
    </button>
  );
}

// ── Secondary / Ghost Button ──────────────────────────────

export function SecondaryButton({ children, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-lg border border-[var(--border)] bg-transparent text-[var(--muted)] hover:border-[var(--border-strong)] hover:text-[var(--fg-2)] text-sm transition [touch-action:manipulation] ${className}`}
    >
      {children}
    </button>
  );
}

// ── Badge / Pill ──────────────────────────────────────────

export function Badge({ children, variant = "default" }) {
  const styles = {
    default: "bg-[var(--chip)] text-[var(--muted)]",
    earlier: "bg-emerald-100 text-emerald-800 dark:bg-[#085041] dark:text-[var(--brand-text)]",
    later: "bg-orange-100 text-orange-800 dark:bg-[#4A1B0C] dark:text-[#F0997B]",
    success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400",
    danger: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400",
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
      <div aria-hidden="true" className="flex-1 h-1.5 rounded-full bg-[var(--chip)] overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-1000 ease-linear"
          style={{
            width: `${Math.min(100, (remaining / totalMs) * 100)}%`,
            background: urgent ? "#E24B4A" : "#1D9E75",
          }}
        />
      </div>
      <span
        className="font-mono tabular-nums text-sm font-semibold min-w-[52px] text-right"
        style={{ color: urgent ? "#E24B4A" : "var(--fg-2)" }}
      >
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────

export function Card({ children, className = "", highlight = false }) {
  return (
    <div className={`bg-[var(--card)] rounded-xl border ${highlight ? "border-[#0F6E56]" : "border-[var(--border)]"} p-5 ${className}`}>
      {children}
    </div>
  );
}

// ── Page Shell (max-width container with back button) ─────

export function PageShell({ children, title, subtitle, back, backLabel = "← Back", badge, maxWidth = "max-w-lg" }) {
  return (
    <div className={`${maxWidth} mx-auto px-5 py-10`}>
      {back && (
        <button onClick={back} className="inline-flex items-center min-h-[44px] text-[var(--muted-2)] hover:text-[var(--fg-2)] text-sm mb-5 transition [touch-action:manipulation]">
          {backLabel}
        </button>
      )}
      {badge}
      {title && <h2 className="text-[22px] font-semibold text-[var(--fg)] mb-1">{title}</h2>}
      {subtitle && <p className="text-[var(--muted-2)] text-sm mb-7">{subtitle}</p>}
      {children}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────

export function EmptyState({ icon = "○", title, description, action }) {
  return (
    <div className="text-center py-12">
      <div aria-hidden="true" className="text-4xl mb-4 opacity-30">{icon}</div>
      <h3 className="text-lg font-semibold text-[var(--fg)] mb-2">{title}</h3>
      {description && <p className="text-sm text-[var(--muted-2)] mb-6 max-w-sm mx-auto">{description}</p>}
      {action}
    </div>
  );
}

// ── Stat / Metric Card ────────────────────────────────────

export function StatCard({ label, value, sub }) {
  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] px-4 py-3">
      <div className="text-xs text-[var(--muted-2)] mb-1">{label}</div>
      <div className="tabular-nums text-xl font-semibold text-[var(--fg)]">{value}</div>
      {sub && <div className="text-xs text-[var(--faint)] mt-0.5">{sub}</div>}
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
