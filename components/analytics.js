"use client";

// components/analytics.js — Google Analytics 4, loaded only after consent.
//
// The script tag is not rendered at all until the visitor chooses "Accept all".
// Nothing is requested from Google and no cookie is set before that, so the
// claim on our cookie page stays literally true.
//
// Two other things this handles:
//
// 1. Page views on navigation. The App Router does client-side routing, so GA
//    sees one page load and would otherwise record a single view per session.
//    Views are sent manually on pathname change instead.
//
// 2. Doing nothing when NEXT_PUBLIC_GA_ID is unset, so local development and
//    preview deployments never pollute the property with test traffic.

import Script from "next/script";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { analyticsAllowed, CONSENT_EVENT } from "@/lib/consent";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function Analytics() {
  const [allowed, setAllowed] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setAllowed(analyticsAllowed());
    const onChange = () => setAllowed(analyticsAllowed());
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  // Manual page_view on route change. Skipped on the first render because the
  // config call below already sends one.
  useEffect(() => {
    if (!allowed || !GA_ID || typeof window.gtag !== "function") return;
    const qs = searchParams?.toString();
    window.gtag("event", "page_view", {
      page_path: pathname + (qs ? "?" + qs : ""),
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams, allowed]);

  if (!allowed || !GA_ID) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          // IP anonymisation is on by default in GA4. send_page_view is left on
          // so the first view is recorded; later ones come from the effect above.
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
