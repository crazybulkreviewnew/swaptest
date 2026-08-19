"use client";

// A type-ahead picker for the 320 DVSA test centres.
//
// This was a plain <select>. On a phone that is a 320-item wheel, and people
// were giving up trying to find their own centre in it. Worse, the names are
// not what people call them: somebody booked at "Bury (Manchester)" thinks of
// it as Manchester, and somebody at "Birmingham (Kings Heath)" thinks of it as
// Kings Heath. Scrolling alphabetically only helps if you already know which
// word the list is sorted by.
//
// Typing solves both. "manchester" finds all eight Manchester centres,
// "kings heath" finds the Birmingham one, and neither requires knowing how
// DVSA chose to write it down.
//
// The value is still always one of UK_CENTRES. Free text is never submitted:
// on blur anything that is not an exact centre reverts to the last valid
// choice, because the server rejects unknown centres and an error after
// submitting is a worse way to learn that than simply not being able to type it.

import { useState, useRef, useEffect, useMemo } from "react";
import { UK_CENTRES } from "@/lib/centres";

// Ignore case, punctuation and spacing so "st albans" matches "St. Albans"
// and "kingsheath" matches "Kings Heath".
function normalise(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function rank(centre, query) {
  const c = normalise(centre);
  const q = normalise(query);
  if (!q) return 0;
  if (c === q) return 0;
  if (c.startsWith(q)) return 1;
  // Matches the start of any bracketed or spaced part, e.g. the "Kings Heath"
  // inside "Birmingham (Kings Heath)".
  const parts = String(centre).toLowerCase().split(/[\s(),]+/).filter(Boolean);
  if (parts.some((p) => normalise(p).startsWith(q))) return 2;
  if (c.includes(q)) return 3;
  return -1;
}

const MAX_SHOWN = 8;

export default function CentreSelect({
  value,
  onChange,
  placeholder = "Start typing your test centre…",
  style,
  className,
  id,
  exclude,
}) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef(null);
  const listId = (id || "centre") + "-listbox";

  // Keep the visible text in step when the value is changed from outside,
  // e.g. a city page prefilling the centre from the query string.
  useEffect(() => { setQuery(value || ""); }, [value]);

  const options = useMemo(() => {
    const pool = exclude ? UK_CENTRES.filter((c) => c !== exclude) : UK_CENTRES;
    if (!query || query === value) return pool.slice(0, MAX_SHOWN);
    return pool
      .map((c) => ({ c, r: rank(c, query) }))
      .filter((x) => x.r >= 0)
      .sort((a, b) => a.r - b.r || a.c.localeCompare(b.c))
      .slice(0, MAX_SHOWN)
      .map((x) => x.c);
  }, [query, value, exclude]);

  useEffect(() => {
    function onDocDown(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) close();
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  });

  function close() {
    setOpen(false);
    // Never leave free text behind: the server only accepts a real centre.
    setQuery(value || "");
  }

  function pick(centre) {
    onChange(centre);
    setQuery(centre);
    setOpen(false);
  }

  function onKeyDown(e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) { setOpen(true); setActive(0); return; }
      setActive((i) => {
        const n = options.length;
        if (!n) return 0;
        return e.key === "ArrowDown" ? (i + 1) % n : (i - 1 + n) % n;
      });
    } else if (e.key === "Enter") {
      if (open && options[active]) { e.preventDefault(); pick(options[active]); }
    } else if (e.key === "Escape") {
      close();
    }
  }

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && options[active] ? listId + "-" + active : undefined}
        autoComplete="off"
        value={query}
        placeholder={placeholder}
        className={className}
        style={style}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => { setOpen(true); setActive(0); }}
        // relatedTarget is where focus is going, and it is known synchronously.
        // This used to poll document.activeElement on a timeout, which never
        // fired reliably: clicking away happened to work because the outside
        // mousedown handler reset things first, but TABBING away left the typed
        // text sitting in the box while a different centre stayed selected
        // underneath. Keyboard users were the only ones who hit it.
        //
        // Picking an option does not blur at all, because the option's
        // mousedown calls preventDefault and focus never leaves the input.
        onBlur={(e) => { if (!boxRef.current || !boxRef.current.contains(e.relatedTarget)) close(); }}
        onKeyDown={onKeyDown}
      />

      {open && (
        <ul
          id={listId}
          role="listbox"
          style={{
            position: "absolute", zIndex: 40, top: "calc(100% + 4px)", left: 0, right: 0,
            margin: 0, padding: "4px", listStyle: "none", maxHeight: "260px", overflowY: "auto",
            background: "var(--bg-raised)", border: "1px solid var(--border-strong)",
            borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          }}
        >
          {options.length === 0 && (
            <li style={{ padding: "10px 12px", fontSize: "13px", color: "var(--muted-2)" }}>
              No centre matches that. Try the town name.
            </li>
          )}
          {options.map((c, i) => (
            <li
              key={c}
              id={listId + "-" + i}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => { e.preventDefault(); pick(c); }}
              style={{
                padding: "10px 12px", fontSize: "14px", borderRadius: "7px", cursor: "pointer",
                color: c === value ? "#1D9E75" : "var(--fg)",
                fontWeight: c === value ? 600 : 400,
                background: i === active ? "var(--chip)" : "transparent",
              }}
            >
              {c}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
