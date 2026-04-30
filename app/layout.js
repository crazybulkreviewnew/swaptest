import "./globals.css";
import NativeProvider from "@/components/native-provider";

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

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#111110" />
        <link rel="canonical" href="https://www.swaptest.co.uk" />
      </head>
      <body>
        <NativeProvider>{children}</NativeProvider>
      </body>
    </html>
  );
}
