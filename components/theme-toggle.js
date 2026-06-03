"use client";

// components/theme-toggle.js — Light/dark theme switch.
//
// What it does: toggles the `dark` class on <html> and persists the choice to
// localStorage ("swaptest-theme"). The initial theme (system preference or a
// stored choice) is applied by an inline script in app/layout.js BEFORE paint,
// so this component only needs to read the current state and flip it.
//
// What it does NOT do: it does not decide the first-load default (that's the
// inline script) and does not store anything until the user clicks.

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Sync local state with the class the no-flash script already set.
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("swaptest-theme", next ? "dark" : "light");
    } catch {
      /* ignore storage failures (private mode) */
    }
    setDark(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mounted ? (dark ? "Switch to light theme" : "Switch to dark theme") : "Toggle theme"}
      title="Toggle light / dark"
      className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--fg)] hover:border-[var(--border-strong)] transition-colors [touch-action:manipulation]"
    >
      {/* Sun (shown in dark mode → click for light) / Moon (shown in light mode → click for dark) */}
      {dark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
