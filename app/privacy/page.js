import Link from "next/link";
import ThemeToggle from "@/components/theme-toggle";

export const metadata = {
  title: "Privacy Policy — SwapTest",
  description: "How SwapTest collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  var sectionStyle = { marginBottom: "40px" };
  var h2Style = { fontSize: "20px", fontWeight: 700, color: "var(--fg)", marginBottom: "16px", letterSpacing: "-0.3px" };
  var h3Style = { fontSize: "16px", fontWeight: 600, color: "var(--fg-2)", marginBottom: "10px", marginTop: "24px" };
  var pStyle = { fontSize: "14px", color: "var(--muted)", lineHeight: 1.75, marginBottom: "12px" };
  var liStyle = { fontSize: "14px", color: "var(--muted)", lineHeight: 1.75, marginBottom: "6px", paddingLeft: "8px" };

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
          Privacy Policy
        </h1>
        <p style={{ fontSize: "14px", color: "var(--muted-2)", marginBottom: "40px" }}>Last updated: March 2026</p>

        <div style={sectionStyle}>
          <h2 style={h2Style}>Who we are</h2>
          <p style={pStyle}>
            SwapTest is a free online platform that helps UK driving test candidates swap their test dates with each other.
            This privacy policy explains how we collect, use, store, and protect your personal information when you use our website at www.swaptest.co.uk.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>What information we collect</h2>
          <h3 style={h3Style}>Information you provide</h3>
          <p style={pStyle}>When you register for an account, we collect:</p>
          <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
            <li style={liStyle}><strong style={{ color: "var(--fg-2)" }}>Full name</strong> — to identify you to your swap partner</li>
            <li style={liStyle}><strong style={{ color: "var(--fg-2)" }}>Email address</strong> — to send you notifications about matches and for account access</li>
            <li style={liStyle}><strong style={{ color: "var(--fg-2)" }}>Phone number</strong> — shared only with your confirmed swap partner for coordination</li>
            <li style={liStyle}><strong style={{ color: "var(--fg-2)" }}>Password</strong> — encrypted and stored securely (see Security section below)</li>
          </ul>

          <p style={pStyle}>When you create a listing, we collect:</p>
          <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
            <li style={liStyle}><strong style={{ color: "var(--fg-2)" }}>Test centre name</strong> — used for matching</li>
            <li style={liStyle}><strong style={{ color: "var(--fg-2)" }}>Current test date and time</strong> — used for matching</li>
            <li style={liStyle}><strong style={{ color: "var(--fg-2)" }}>Preferred date range</strong> — used for matching</li>
          </ul>

          <h3 style={h3Style}>Information collected automatically</h3>
          <p style={pStyle}>
            We collect your IP address for rate limiting purposes (to prevent abuse of the platform).
            We do not use tracking cookies, analytics services, or any third-party advertising trackers.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>How we use your information</h2>
          <p style={pStyle}>We use your information solely for the following purposes:</p>
          <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
            <li style={liStyle}>To create and manage your account</li>
            <li style={liStyle}>To match you with suitable swap candidates based on test centre and date preferences</li>
            <li style={liStyle}>To send you email notifications about swap requests, match confirmations, and account activity</li>
            <li style={liStyle}>To share your contact details (name, email, phone) with your confirmed swap partner — and only after both parties have agreed to swap</li>
            <li style={liStyle}>To prevent abuse through rate limiting</li>
          </ul>
          <p style={pStyle}>
            <strong style={{ color: "var(--fg-2)" }}>We do not:</strong> sell your data to third parties, use your data for advertising, share your information with anyone other than your confirmed swap partner, or use your data for any purpose other than operating the SwapTest service.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>When your information is shared</h2>
          <p style={pStyle}>
            Your personal contact details (name, email address, and phone number) are shared with another user <strong style={{ color: "var(--fg-2)" }}>only after both you and the other person have agreed to swap</strong>.
            Before that point, other users can only see your test centre, date, and time — never your name, email, or phone number.
          </p>
          <p style={pStyle}>
            We do not share your information with any other third parties, except where required by law (e.g., in response to a court order or legal obligation).
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>How we protect your information</h2>
          <h3 style={h3Style}>Password security</h3>
          <p style={pStyle}>
            Your password is encrypted using bcrypt with salted hashing. This means your password is converted into an irreversible encrypted string before being stored.
            Even our team cannot see or retrieve your original password. Each password is individually salted, meaning even if two users have the same password,
            their stored data is completely different.
          </p>

          <h3 style={h3Style}>Data transmission</h3>
          <p style={pStyle}>
            All data transmitted between your browser and our servers is encrypted using HTTPS (TLS/SSL).
            This means your information cannot be intercepted by third parties during transmission.
          </p>

          <h3 style={h3Style}>Database security</h3>
          <p style={pStyle}>
            Our database is hosted on secure, managed infrastructure with encryption at rest.
            All database queries use parameterised statements to prevent SQL injection attacks.
            Access to the database is restricted and protected by authentication credentials.
          </p>

          <h3 style={h3Style}>Rate limiting</h3>
          <p style={pStyle}>
            We use rate limiting to prevent automated attacks, brute-force login attempts, and abuse of the matching system.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>How long we keep your data</h2>
          <p style={pStyle}>
            Your account data is kept for as long as you have an active account. Your listing data is kept for as long as the listing is active or has been part of a completed swap.
          </p>
          <p style={pStyle}>
            If you wish to delete your account and all associated data, please contact us at privacy@swaptest.co.uk and we will process your request within 30 days.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>Your rights</h2>
          <p style={pStyle}>Under UK data protection law (UK GDPR), you have the right to:</p>
          <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
            <li style={liStyle}><strong style={{ color: "var(--fg-2)" }}>Access</strong> — request a copy of the personal data we hold about you</li>
            <li style={liStyle}><strong style={{ color: "var(--fg-2)" }}>Rectification</strong> — ask us to correct inaccurate data</li>
            <li style={liStyle}><strong style={{ color: "var(--fg-2)" }}>Erasure</strong> — ask us to delete your data</li>
            <li style={liStyle}><strong style={{ color: "var(--fg-2)" }}>Restriction</strong> — ask us to limit how we use your data</li>
            <li style={liStyle}><strong style={{ color: "var(--fg-2)" }}>Portability</strong> — request your data in a portable format</li>
            <li style={liStyle}><strong style={{ color: "var(--fg-2)" }}>Objection</strong> — object to our processing of your data</li>
          </ul>
          <p style={pStyle}>To exercise any of these rights, contact us at privacy@swaptest.co.uk.</p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>Third-party services</h2>
          <p style={pStyle}>We use the following third-party services to operate SwapTest:</p>
          <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
            <li style={liStyle}><strong style={{ color: "var(--fg-2)" }}>Resend</strong> — for sending email notifications (processes your email address)</li>
            <li style={liStyle}><strong style={{ color: "var(--fg-2)" }}>Neon</strong> — for database hosting (stores your account and listing data)</li>
            <li style={liStyle}><strong style={{ color: "var(--fg-2)" }}>Vercel</strong> — for website hosting (processes your requests)</li>
            <li style={liStyle}><strong style={{ color: "var(--fg-2)" }}>Upstash</strong> — for rate limiting (processes your IP address temporarily)</li>
          </ul>
          <p style={pStyle}>Each of these services has their own privacy policy and processes data in accordance with GDPR requirements.</p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>Children</h2>
          <p style={pStyle}>
            SwapTest is intended for users who are at least 17 years old (the minimum age to take a driving test in the UK).
            We do not knowingly collect data from children under 17. If you believe a child has created an account, please contact us.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>Changes to this policy</h2>
          <p style={pStyle}>
            We may update this privacy policy from time to time. Any changes will be posted on this page with an updated "Last updated" date.
            We encourage you to review this page periodically.
          </p>
        </div>

        <div style={{
          marginTop: "48px", padding: "24px", borderRadius: "12px",
          background: "var(--bg-raised)", border: "1px solid var(--border)",
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--fg)", marginBottom: "8px" }}>Contact us</h2>
          <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
            If you have any questions about this privacy policy or how we handle your data, please email us at{" "}
            <a href="mailto:privacy@swaptest.co.uk" style={{ color: "#1D9E75", textDecoration: "none" }}>privacy@swaptest.co.uk</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
