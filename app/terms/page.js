import Link from "next/link";
import ThemeToggle from "@/components/theme-toggle";

export const metadata = {
  title: "Terms & Conditions | SwapTest",
  description: "The terms and conditions governing your use of the SwapTest driving test date swapping service.",
  alternates: { canonical: "https://www.swaptest.co.uk/terms" },
};

export default function TermsPage() {
  const sectionStyle = { marginBottom: "40px" };
  const h2Style = { fontSize: "20px", fontWeight: 700, color: "var(--fg)", marginBottom: "16px", letterSpacing: "-0.3px" };
  const pStyle = { fontSize: "14px", color: "var(--muted)", lineHeight: 1.75, marginBottom: "12px" };
  const liStyle = { fontSize: "14px", color: "var(--muted)", lineHeight: 1.75, marginBottom: "6px", paddingLeft: "8px" };
  const strong = { color: "var(--fg-2)" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid var(--border-faint)", padding: "16px 20px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ fontSize: "18px", fontWeight: 700, color: "var(--fg)", textDecoration: "none" }}>
            Swap<span style={{ color: "#1D9E75" }}>Test</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <ThemeToggle />
            <Link href="/" style={{ fontSize: "13px", color: "var(--muted-2)", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "44px", touchAction: "manipulation" }}>← Back to home</Link>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: "680px", margin: "0 auto", padding: "48px 20px 80px" }}>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 36px)", fontWeight: 800, color: "var(--fg-strong)", marginBottom: "8px", letterSpacing: "-1px" }}>
          Terms &amp; Conditions
        </h1>
        <p style={{ fontSize: "14px", color: "var(--muted-2)", marginBottom: "40px" }}>Last updated: June 2026</p>

        <div style={sectionStyle}>
          <h2 style={h2Style}>1. About these terms</h2>
          <p style={pStyle}>
            These terms and conditions ("Terms") govern your use of the SwapTest website at www.swaptest.co.uk
            ("SwapTest", "we", "us", "our") and the services we provide. By creating an account or using the
            service, you agree to be bound by these Terms. If you do not agree, please do not use SwapTest.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>2. What SwapTest is</h2>
          <p style={pStyle}>
            SwapTest is a matching platform that connects UK driving test candidates who wish to exchange
            their practical driving test dates. <strong style={strong}>We are a matching service only.</strong> We do not
            book, cancel, rebook, or modify any tests with the Driver and Vehicle Standards Agency (DVSA) on
            your behalf. All test bookings are managed solely by you through the official GOV.UK website.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>3. Not affiliated with DVSA or GOV.UK</h2>
          <p style={pStyle}>
            SwapTest is an independent platform. We are <strong style={strong}>not affiliated with, endorsed by, or
            connected to</strong> the DVSA, GOV.UK, or any government body. Driving test bookings, cancellations,
            and rebookings remain subject to DVSA's own terms, rules, and fees.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>4. Eligibility</h2>
          <p style={pStyle}>
            You must be at least 17 years old (the minimum age to take a practical driving test in the UK) to
            use SwapTest. By using the service you confirm that the information you provide is accurate and that
            you hold a genuine DVSA test booking for the date you list.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>5. Your responsibilities</h2>
          <p style={pStyle}>When using SwapTest, you agree to:</p>
          <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
            <li style={liStyle}>Provide accurate test centre, date, and contact details</li>
            <li style={liStyle}>Only list test dates that you genuinely hold with the DVSA</li>
            <li style={liStyle}>Keep your account password confidential and secure</li>
            <li style={liStyle}>Coordinate honestly and respectfully with your matched swap partner</li>
            <li style={liStyle}>Arrange the actual swap with DVSA yourself once a match is confirmed</li>
            <li style={liStyle}>Not use the service for any unlawful, fraudulent, or commercial resale purpose</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>6. How swaps work</h2>
          <p style={pStyle}>
            SwapTest identifies potential matches based on test centre and date preferences. When both parties
            agree to a match, we share each party's contact details so you can coordinate. Arranging the actual
            swap by contacting DVSA is your responsibility and must be completed by you.
            <strong style={strong}> We cannot guarantee that DVSA will be able to complete the swap once you
            request it.</strong>
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>7. No guarantee of a swap</h2>
          <p style={pStyle}>
            We do not guarantee that you will find a match, that a match will agree to swap, or that a swap will
            complete successfully. Test slot availability on GOV.UK can change at any time and is entirely outside
            our control. SwapTest provides the introduction only; the outcome depends on you, your swap partner,
            and DVSA's booking system.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>8. Fees</h2>
          <p style={pStyle}>
            There is a one-time <strong style={strong}>£1 registration fee</strong> that you pay before you can list
            a test. Viewing your matches is free. If you choose to go ahead with a swap, an
            <strong style={strong}> £8 swap fee</strong> applies and is paid only by the person who wants an earlier
            date; the person moving to a later date pays nothing. All fees are shown before you pay. Any DVSA test
            fees are separate and payable directly to the DVSA.
          </p>
          <p style={pStyle}>
            Fees are collected securely through our payment provider, Stripe. If a confirmed swap does not go ahead
            because the match expires before it is completed, the £8 swap fee is refunded to the person who paid it.
            The £1 registration fee is non-refundable once paid, as it grants access to list tests and view matches.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>9. Sharing contact details &amp; disclaimer</h2>
          <p style={pStyle}>
            Before your contact details are shared with a swap partner, both of you must expressly agree to share
            your email address and phone number with each other. By agreeing, you accept that:
          </p>
          <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
            <li style={liStyle}>SwapTest only introduces you to the other person; we do not vet, verify, or supervise users.</li>
            <li style={liStyle}>You are responsible for your own dealings with your swap partner and for any information you choose to share.</li>
            <li style={liStyle}><strong style={strong}>SwapTest is not responsible or liable for the conduct of any user, or for any loss, harm, fraud, or wrongdoing arising from contact between you and a swap partner.</strong></li>
            <li style={liStyle}>You should take the usual precautions you would when dealing with someone you have not met.</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>10. Acceptable use</h2>
          <p style={pStyle}>You must not:</p>
          <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
            <li style={liStyle}>Use automated scripts, bots, or scrapers against the service</li>
            <li style={liStyle}>Attempt to gain unauthorised access to other accounts or our systems</li>
            <li style={liStyle}>Post false, misleading, or fraudulent listings</li>
            <li style={liStyle}>Harass, abuse, or harm other users</li>
            <li style={liStyle}>Resell, trade, or commercially exploit driving test slots</li>
          </ul>
          <p style={pStyle}>
            We may suspend or terminate any account that breaches these Terms, without notice.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>11. Limitation of liability</h2>
          <p style={pStyle}>
            SwapTest is provided "as is" and "as available". To the fullest extent permitted by law, we are not
            liable for any loss or damage arising from: a swap that does not complete, a test slot becoming
            unavailable, the conduct of another user, missed or failed tests, or interruptions to the service.
            Nothing in these Terms excludes liability that cannot be excluded under UK law.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>12. Your data</h2>
          <p style={pStyle}>
            Our handling of your personal data is described in our{" "}
            <Link href="/privacy" style={{ color: "#1D9E75", textDecoration: "none" }}>Privacy Policy</Link> and{" "}
            <Link href="/cookies" style={{ color: "#1D9E75", textDecoration: "none" }}>Cookie Policy</Link>,
            which form part of these Terms.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>13. Changes to these terms</h2>
          <p style={pStyle}>
            We may update these Terms from time to time. Changes will be posted on this page with a revised
            "Last updated" date. Continued use of SwapTest after changes are posted constitutes acceptance of
            the updated Terms.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>14. Governing law</h2>
          <p style={pStyle}>
            These Terms are governed by the laws of England and Wales, and any disputes are subject to the
            exclusive jurisdiction of the courts of England and Wales.
          </p>
        </div>

        <div style={{ marginTop: "48px", padding: "24px", borderRadius: "12px", background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--fg)", marginBottom: "8px" }}>Contact us</h2>
          <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
            Questions about these terms? Email us at{" "}
            <a href="mailto:hello@swaptest.co.uk" style={{ color: "#1D9E75", textDecoration: "none" }}>hello@swaptest.co.uk</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
