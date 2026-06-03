import Link from "next/link";
import ThemeToggle from "@/components/theme-toggle";

export const metadata = {
  title: "Cookie Policy & Data Usage — SwapTest",
  description: "How SwapTest uses cookies and processes your data. We use only essential cookies — no advertising or tracking.",
  alternates: { canonical: "https://www.swaptest.co.uk/cookies" },
};

export default function CookiesPage() {
  const sectionStyle = { marginBottom: "40px" };
  const h2Style = { fontSize: "20px", fontWeight: 700, color: "var(--fg)", marginBottom: "16px", letterSpacing: "-0.3px" };
  const pStyle = { fontSize: "14px", color: "var(--muted)", lineHeight: 1.75, marginBottom: "12px" };
  const liStyle = { fontSize: "14px", color: "var(--muted)", lineHeight: 1.75, marginBottom: "6px", paddingLeft: "8px" };
  const strong = { color: "var(--fg-2)" };

  const cellHead = { textAlign: "left", padding: "12px 14px", fontSize: "12px", fontWeight: 700, color: "var(--fg-2)", borderBottom: "1px solid var(--border)", textTransform: "uppercase", letterSpacing: "0.5px" };
  const cell = { padding: "12px 14px", fontSize: "13px", color: "var(--muted)", borderBottom: "1px solid var(--border-faint)", lineHeight: 1.6, verticalAlign: "top" };

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
          Cookie Policy &amp; Data Usage
        </h1>
        <p style={{ fontSize: "14px", color: "var(--muted-2)", marginBottom: "40px" }}>Last updated: June 2026</p>

        <div style={sectionStyle}>
          <h2 style={h2Style}>The short version</h2>
          <p style={pStyle}>
            SwapTest uses <strong style={strong}>only essential cookies</strong> — the small files needed to keep you
            signed in and to keep the site secure. We do <strong style={strong}>not</strong> use advertising cookies,
            tracking pixels, third-party analytics, or any technology that profiles you or follows you around
            the web.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>What is a cookie?</h2>
          <p style={pStyle}>
            A cookie is a small text file that a website stores on your device. Cookies let a site remember
            things between page loads — for example, that you are logged in. Under UK law (the Privacy and
            Electronic Communications Regulations, "PECR", and the UK GDPR), cookies that are strictly necessary
            to provide a service you have requested do not require consent, while non-essential cookies do.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>Cookies we use</h2>
          <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid var(--border)", marginBottom: "16px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "480px" }}>
              <thead>
                <tr style={{ background: "var(--bg-raised)" }}>
                  <th style={cellHead}>Cookie</th>
                  <th style={cellHead}>Purpose</th>
                  <th style={cellHead}>Type</th>
                  <th style={cellHead}>Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={cell}><strong style={strong}>Session token</strong></td>
                  <td style={cell}>Keeps you signed in to your account as you move between pages.</td>
                  <td style={cell}>Essential</td>
                  <td style={cell}>Until you log out or it expires</td>
                </tr>
                <tr>
                  <td style={cell}><strong style={strong}>swaptest-cookie-consent</strong></td>
                  <td style={cell}>Remembers your cookie preference so we don't ask again. Stored in your browser's local storage, not sent to our servers.</td>
                  <td style={cell}>Essential</td>
                  <td style={cell}>Until you clear your browser data</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={pStyle}>
            Because both of these are strictly necessary for the service to function, they are exempt from the
            consent requirement under PECR. The banner you see is informational and lets you record a preference
            in case we introduce optional cookies in the future.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>What we do NOT use</h2>
          <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
            <li style={liStyle}>No Google Analytics or other third-party analytics</li>
            <li style={liStyle}>No advertising or retargeting cookies</li>
            <li style={liStyle}>No social media tracking pixels</li>
            <li style={liStyle}>No cross-site or behavioural profiling</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>How we use your data</h2>
          <p style={pStyle}>
            Beyond cookies, SwapTest processes a limited amount of personal data to run the matching service.
            In summary:
          </p>
          <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
            <li style={liStyle}><strong style={strong}>Account data</strong> (name, email, phone, encrypted password) — to create your account and notify you of matches</li>
            <li style={liStyle}><strong style={strong}>Listing data</strong> (test centre, date, preferences) — to find swap matches for you</li>
            <li style={liStyle}><strong style={strong}>IP address</strong> — held briefly for rate limiting to prevent abuse</li>
          </ul>
          <p style={pStyle}>
            Your contact details are only shared with another user after you both agree to swap. We never sell
            your data. The full detail — including the third-party processors we rely on (Resend, Neon, Vercel,
            Upstash) and your rights under UK GDPR — is set out in our{" "}
            <Link href="/privacy" style={{ color: "#1D9E75", textDecoration: "none" }}>Privacy Policy</Link>.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>Managing cookies</h2>
          <p style={pStyle}>
            You can clear or block cookies at any time through your browser settings. Note that blocking the
            essential session cookie will prevent you from staying logged in, so parts of SwapTest will not work.
            To reset your consent choice, clear this site's data in your browser and the banner will appear again
            on your next visit.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>Your rights</h2>
          <p style={pStyle}>
            Under UK GDPR you have the right to access, correct, delete, restrict, port, and object to the
            processing of your personal data. To exercise any of these rights, contact us using the details
            below. You also have the right to lodge a complaint with the Information Commissioner's Office
            (ICO) at{" "}
            <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" style={{ color: "#1D9E75", textDecoration: "none" }}>ico.org.uk</a>.
          </p>
        </div>

        <div style={{ marginTop: "48px", padding: "24px", borderRadius: "12px", background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--fg)", marginBottom: "8px" }}>Contact us</h2>
          <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
            Questions about cookies or your data? Email us at{" "}
            <a href="mailto:privacy@swaptest.co.uk" style={{ color: "#1D9E75", textDecoration: "none" }}>privacy@swaptest.co.uk</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
