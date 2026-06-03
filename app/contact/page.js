import Link from "next/link";
import ThemeToggle from "@/components/theme-toggle";

export const metadata = {
  title: "Contact Us | SwapTest",
  description: "Get in touch with the SwapTest team about swapping your driving test, your account, or a privacy request. We reply to most emails within two working days.",
  alternates: { canonical: "https://www.swaptest.co.uk/contact" },
};

export default function ContactPage() {
  const sectionStyle = { marginBottom: "32px" };
  const h2Style = { fontSize: "18px", fontWeight: 700, color: "var(--fg)", marginBottom: "10px", letterSpacing: "-0.3px" };
  const pStyle = { fontSize: "14px", color: "var(--muted)", lineHeight: 1.75, marginBottom: "12px" };
  const linkStyle = { color: "#1D9E75", textDecoration: "none", fontWeight: 600 };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid var(--border)", padding: "16px 20px" }}>
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
          Contact us
        </h1>
        <p style={{ fontSize: "15px", color: "var(--muted)", lineHeight: 1.7, marginBottom: "40px" }}>
          Have a question about swapping your driving test, your account, or your data? We are happy to help.
          We reply to most emails within two working days.
        </p>

        {/* Primary contact card */}
        <div style={{ padding: "24px", borderRadius: "12px", background: "var(--bg-raised)", border: "1px solid var(--border)", marginBottom: "32px" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
            General enquiries
          </div>
          <a href="mailto:hello@swaptest.co.uk" style={{ fontSize: "20px", fontWeight: 700, color: "#1D9E75", textDecoration: "none" }}>
            hello@swaptest.co.uk
          </a>
          <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6, margin: "10px 0 0" }}>
            For help with a swap, your listing, matches, or anything else about using SwapTest.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>Privacy and data requests</h2>
          <p style={pStyle}>
            For anything about your personal data, including access, correction, or deletion under UK GDPR,
            email <a href="mailto:privacy@swaptest.co.uk" style={linkStyle}>privacy@swaptest.co.uk</a>. You can
            read how we handle your data in our{" "}
            <Link href="/privacy" style={linkStyle}>Privacy Policy</Link> and{" "}
            <Link href="/cookies" style={linkStyle}>Cookie Policy</Link>.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>What to include</h2>
          <p style={pStyle}>
            To help us answer quickly, please include the email address on your account and, if your question is
            about a specific listing or match, your test centre and date. Never send your password in an email.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>About your actual test</h2>
          <p style={pStyle}>
            SwapTest is an independent matching service and is not affiliated with DVSA or GOV.UK. For questions
            about booking, rescheduling, or the rules of your practical driving test, please contact DVSA directly
            through <a href="https://www.gov.uk/change-driving-test" target="_blank" rel="noopener noreferrer" style={linkStyle}>GOV.UK</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
