import "./globals.css";
import NativeProvider from "@/components/native-provider";
import CookieConsent from "@/components/cookie-consent";

export const metadata = {
  title: "SwapTest — Swap Your UK Driving Test Date | Free Matching Service",
  description: "Can't wait for your driving test? Swap your UK DVSA test date with someone who wants yours. Match with candidates at the same or nearby test centres. Completely free.",
  keywords: "driving test swap, UK driving test, DVSA test date, swap test date, earlier driving test, change driving test date, driving test cancellation, test centre swap",
  authors: [{ name: "SwapTest" }],
  openGraph: {
    title: "SwapTest — Swap Your UK Driving Test Date",
    description: "Match with someone who wants your test date and swap. Same centre or nearby. Free service.",
    url: "https://www.swaptest.co.uk",
    siteName: "SwapTest",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "SwapTest — Swap Your UK Driving Test Date",
    description: "Match with someone who wants your test date and swap. Free service.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://www.swaptest.co.uk",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

// Structured data for Google: FAQ rich results + site identity
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://www.swaptest.co.uk/#website",
      url: "https://www.swaptest.co.uk",
      name: "SwapTest",
      description: "Free UK driving test date swapping and matching service",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://www.swaptest.co.uk/register",
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://www.swaptest.co.uk/#organization",
      name: "SwapTest",
      url: "https://www.swaptest.co.uk",
      description: "Free UK driving test date swapping and matching service. Connects DVSA test candidates who want to swap dates at the same or nearby test centres.",
    },
    {
      "@type": "FAQPage",
      "@id": "https://www.swaptest.co.uk/#faq",
      mainEntity: [
        {
          "@type": "Question",
          name: "How does swapping a driving test date work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "When you book a practical driving test with DVSA, you get a specific date and test centre. If that date doesn't suit you, you can normally only change it to whatever's available — often months away. SwapTest connects you with another candidate who has a date you want, and who wants your date. You both cancel and rebook each other's slots on the DVSA website.",
          },
        },
        {
          "@type": "Question",
          name: "Is SwapTest really free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, completely free. No platform fees, no subscription, no hidden charges. We may introduce a small optional fee in the future, but the core matching service will remain free.",
          },
        },
        {
          "@type": "Question",
          name: "Can I swap to a different test centre?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. DVSA allows you to move your test to one of 3 nearby centres. SwapTest automatically checks all nearby centres when finding matches. Both people must be able to move to each other's centre for a swap to be valid.",
          },
        },
        {
          "@type": "Question",
          name: "Is my personal information safe?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Your password is encrypted using bcrypt hashing and can never be seen by anyone, including us. Your contact details (email and phone) are only shared with your swap partner after both of you agree to swap. We never sell or share your data with third parties.",
          },
        },
        {
          "@type": "Question",
          name: "What happens if the other person doesn't respond?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "When you select a match, the other person has 30 minutes to agree. If they don't respond, the match expires automatically and your listing goes back into the pool. No harm done.",
          },
        },
        {
          "@type": "Question",
          name: "Can I cancel or edit my listing?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. You can edit or delete your listing at any time from your dashboard, as long as it doesn't have an active match pending.",
          },
        },
        {
          "@type": "Question",
          name: "How do I actually complete the swap on DVSA?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "After both parties agree, you'll receive each other's contact details by email. You do not need to cancel your test — simply contact DVSA to arrange the swap of your dates. We recommend you both get in touch with DVSA so the change can be completed smoothly.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#111110" />
        <link rel="canonical" href="https://www.swaptest.co.uk" />
        {/* No-flash theme init: applies stored choice, else OS preference, before paint.
            Default for a brand-new visitor with no signal is light (no .dark class). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var c=localStorage.getItem('swaptest-theme');var d=c?c==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();",
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <NativeProvider>{children}</NativeProvider>
        <CookieConsent />
      </body>
    </html>
  );
}
