import { Resend } from "resend";

var _resend;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}
function getFROM() { return process.env.EMAIL_FROM || "SwapTest <noreply@swaptest.co.uk>"; }
function getAPP_URL() { return process.env.NEXT_PUBLIC_APP_URL || ""; }

function fmtDate(date) {
  return new Date(date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function emailWrapper(content) {
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f0f0ea;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif">'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0ea;padding:32px 16px">'
    + '<tr><td align="center">'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">'
    + '<tr><td style="background-color:#111110;padding:24px 32px;text-align:center">'
    + '<span style="font-size:22px;font-weight:700;color:#e8e6dc;letter-spacing:-0.5px">Swap</span>'
    + '<span style="font-size:22px;font-weight:700;color:#1D9E75;letter-spacing:-0.5px">Test</span>'
    + '</td></tr>'
    + '<tr><td style="padding:32px">' + content + '</td></tr>'
    + '<tr><td style="background-color:#f8f8f5;padding:20px 32px;border-top:1px solid #e8e6dc;text-align:center">'
    + '<p style="margin:0;font-size:12px;color:#9c9a92">SwapTest — UK Driving Test Date Swap</p>'
    + '<p style="margin:4px 0 0;font-size:11px;color:#b0aea4"><a href="' + getAPP_URL() + '" style="color:#1D9E75;text-decoration:none">www.swaptest.co.uk</a></p>'
    + '</td></tr></table>'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin-top:16px">'
    + '<tr><td style="text-align:center;font-size:11px;color:#b0aea4;padding:0 16px">'
    + 'You received this email because you have an account on SwapTest.</td></tr></table>'
    + '</td></tr></table></body></html>';
}

function heading(t) { return '<h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1a1a18;line-height:1.3">' + t + '</h1>'; }
function subtext(t) { return '<p style="margin:0 0 20px;font-size:14px;color:#73726c;line-height:1.5">' + t + '</p>'; }
function para(t) { return '<p style="margin:0 0 16px;font-size:14px;color:#333;line-height:1.6">' + t + '</p>'; }
function greeting(n) { return '<p style="margin:0 0 16px;font-size:14px;color:#333">Hi ' + n + ',</p>'; }

function detailsCard(rows) {
  var h = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f8f5;border-radius:8px;margin:20px 0;border:1px solid #e8e6dc">';
  for (var i = 0; i < rows.length; i++) {
    var bt = i > 0 ? 'border-top:1px solid #e8e6dc;' : '';
    h += '<tr><td style="padding:12px 16px;' + bt + '"><span style="font-size:12px;color:#9c9a92;display:block;margin-bottom:2px">' + rows[i].label + '</span><span style="font-size:14px;font-weight:600;color:' + (rows[i].color || '#1a1a18') + '">' + rows[i].value + '</span></td></tr>';
  }
  return h + '</table>';
}

function contactCard(user, listing) {
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0faf5;border-radius:8px;margin:20px 0;border:1px solid #c6ead8">'
    + '<tr><td style="padding:16px"><p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#0F6E56;text-transform:uppercase;letter-spacing:1px">Your swap partner</p>'
    + '<p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#1a1a18">' + user.name + '</p>'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px">'
    + '<tr><td style="padding:4px 0;font-size:13px;color:#73726c;width:60px">Email</td><td style="padding:4px 0;font-size:13px;color:#1D9E75">' + user.email + '</td></tr>'
    + '<tr><td style="padding:4px 0;font-size:13px;color:#73726c;width:60px">Phone</td><td style="padding:4px 0;font-size:13px;color:#1a1a18">' + user.phone + '</td></tr>'
    + '<tr><td style="padding:4px 0;font-size:13px;color:#73726c;width:60px">Slot</td><td style="padding:4px 0;font-size:13px;color:#1a1a18">' + fmtDate(listing.currentDate) + ' at ' + listing.currentTime + '</td></tr>'
    + '<tr><td style="padding:4px 0;font-size:13px;color:#73726c;width:60px">Centre</td><td style="padding:4px 0;font-size:13px;color:#1a1a18">' + listing.centre + '</td></tr>'
    + '</table></td></tr></table>';
}

function primaryButton(url, text) {
  return '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td style="background-color:#1D9E75;border-radius:8px;text-align:center"><a href="' + url + '" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none">' + text + '</a></td></tr></table>';
}

function urgentBadge(t) { return '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px"><tr><td style="background-color:#FFF8E1;border:1px solid #F5C775;border-radius:6px;padding:10px 14px;font-size:13px;color:#8B6914">&#9200; ' + t + '</td></tr></table>'; }
function successBadge(t) { return '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px"><tr><td style="background-color:#E8F5E9;border:1px solid #A5D6A7;border-radius:6px;padding:10px 14px;font-size:13px;color:#2E7D32">&#10003; ' + t + '</td></tr></table>'; }
function warningBadge(t) { return '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px"><tr><td style="background-color:#FFEBEE;border:1px solid #EF9A9A;border-radius:6px;padding:10px 14px;font-size:13px;color:#C62828">&#9888; ' + t + '</td></tr></table>'; }
function divider() { return '<hr style="border:none;border-top:1px solid #e8e6dc;margin:24px 0">'; }
function smallText(t) { return '<p style="margin:0;font-size:12px;color:#9c9a92;line-height:1.5">' + t + '</p>'; }

export async function sendSwapRequestEmail(match, responder, initiatorListing, responderListing) {
  var agreeUrl = getAPP_URL() + "/match?id=" + match.id + "&action=agree";
  var content = greeting(responder.name)
    + heading("Someone wants to swap test dates with you!")
    + para("A candidate has found your listing on SwapTest and wants to swap driving test dates. Here are the details:")
    + detailsCard([
      { label: "Your current test", value: fmtDate(responderListing.currentDate) + " at " + responderListing.currentTime },
      { label: "Your test centre", value: responderListing.centre },
      { label: "You would get", value: fmtDate(initiatorListing.currentDate) + " at " + initiatorListing.currentTime, color: "#1D9E75" },
      { label: "Their test centre", value: initiatorListing.centre },
    ])
    + urgentBadge("You have 30 minutes to respond. After that, this request will expire.")
    + para("If you are happy with this swap, click the button below to agree.")
    + primaryButton(agreeUrl, "Agree to Swap")
    + divider()
    + smallText("If you don't want to swap, simply ignore this email. The request will expire automatically.");
  await getResend().emails.send({ from: getFROM(), to: responder.email, subject: "Someone wants to swap test dates with you!", html: emailWrapper(content) });
}

export async function sendPayNowEmail(match, recipient, recipientListing) {
  var url = getAPP_URL() + "/match?id=" + match.id;
  var content = greeting(recipient.name)
    + heading("Great news — your swap partner agreed!")
    + successBadge("The other person has agreed to swap!")
    + para("Both of you have now agreed. You will receive each other's contact details to coordinate the swap on the DVSA website.")
    + primaryButton(url, "View Swap Details")
    + divider()
    + smallText("Log in to your SwapTest dashboard to see your swap partner's contact details.");
  await getResend().emails.send({ from: getFROM(), to: recipient.email, subject: "Your swap partner agreed!", html: emailWrapper(content) });
}

export async function sendContactExchange(match) {
  var earlierUser = match.earlierUser; var laterUser = match.laterUser;
  var earlierListing = match.earlierListing; var laterListing = match.laterListing;

  var content1 = greeting(earlierUser.name)
    + heading("Swap confirmed!")
    + successBadge("Your swap is confirmed!")
    + para("Here are your swap partner's details. Please contact them to coordinate when you'll both cancel and rebook on the DVSA website.")
    + contactCard(laterUser, laterListing)
    + detailsCard([
      { label: "Your current test", value: fmtDate(earlierListing.currentDate) + " at " + earlierListing.currentTime + " — " + earlierListing.centre },
      { label: "You will swap to", value: fmtDate(laterListing.currentDate) + " at " + laterListing.currentTime + " — " + laterListing.centre, color: "#1D9E75" },
    ])
    + divider() + heading("How to complete the swap")
    + para("<strong>1.</strong> Contact your swap partner and agree on an exact time.")
    + para("<strong>2.</strong> Both go to <a href='https://www.gov.uk/change-driving-test' style='color:#1D9E75'>GOV.UK — Change your driving test</a> and cancel your current test.")
    + para("<strong>3.</strong> Immediately rebook at the other person's centre and date.")
    + smallText("We recommend doing this simultaneously so both slots are freed at the same moment.");
  await getResend().emails.send({ from: getFROM(), to: earlierUser.email, subject: "Swap confirmed! Here are your partner's details", html: emailWrapper(content1) });

  var content2 = greeting(laterUser.name)
    + heading("Swap confirmed!")
    + successBadge("Your swap is confirmed!")
    + para("Here are your swap partner's details. Please contact them to coordinate when you'll both cancel and rebook on the DVSA website.")
    + contactCard(earlierUser, earlierListing)
    + detailsCard([
      { label: "Your current test", value: fmtDate(laterListing.currentDate) + " at " + laterListing.currentTime + " — " + laterListing.centre },
      { label: "You will swap to", value: fmtDate(earlierListing.currentDate) + " at " + earlierListing.currentTime + " — " + earlierListing.centre, color: "#1D9E75" },
    ])
    + divider() + heading("How to complete the swap")
    + para("<strong>1.</strong> Contact your swap partner and agree on an exact time.")
    + para("<strong>2.</strong> Both go to <a href='https://www.gov.uk/change-driving-test' style='color:#1D9E75'>GOV.UK — Change your driving test</a> and cancel your current test.")
    + para("<strong>3.</strong> Immediately rebook at the other person's centre and date.")
    + smallText("We recommend doing this simultaneously so both slots are freed at the same moment.");
  await getResend().emails.send({ from: getFROM(), to: laterUser.email, subject: "Swap confirmed! Here are your partner's details", html: emailWrapper(content2) });
}

export async function sendExpiredNotification(match, reason) {
  var earlierUser = match.earlierUser; var laterUser = match.laterUser;
  var c = function(user) {
    return greeting(user.name) + heading("Your swap match has expired") + warningBadge("The 30-minute response window has passed.")
      + para("Unfortunately, the swap match could not be completed because the other person did not respond in time.")
      + para("Your listing is back in the pool and visible to other users.")
      + primaryButton(getAPP_URL() + "/dashboard", "Go to Dashboard")
      + smallText("You can search for new matches or wait for someone to find your listing.");
  };
  try { await getResend().emails.send({ from: getFROM(), to: earlierUser.email, subject: "Your swap match has expired", html: emailWrapper(c(earlierUser)) }); } catch(e) {}
  try { await getResend().emails.send({ from: getFROM(), to: laterUser.email, subject: "Your swap match has expired", html: emailWrapper(c(laterUser)) }); } catch(e) {}
}

export async function sendRefundNotification(match) {
  // No refunds in free mode — kept as no-op for compatibility
}

// ============================================================
// 6. Welcome Email → sent on registration
// ============================================================

export async function sendWelcomeEmail(user) {
  var dashboardUrl = getAPP_URL() + "/dashboard";
  var content = greeting(user.name)
    + heading("Welcome to SwapTest!")
    + successBadge("Your account has been created successfully.")
    + para("SwapTest helps UK driving test candidates swap their test dates with each other. Whether you need an earlier date or want to push yours back, we'll find someone at your centre (or a nearby one) who wants to swap.")
    + detailsCard([
      { label: "How it works", value: "1. Create a listing with your test details" },
      { label: "", value: "2. We find matching candidates at your centre or nearby" },
      { label: "", value: "3. Both agree, exchange contact details, and coordinate the swap on DVSA" },
    ])
    + para("The service is currently <strong>completely free</strong> — no platform fees.")
    + primaryButton(dashboardUrl, "Go to Dashboard")
    + divider()
    + smallText("If you did not create this account, please ignore this email.");

  try {
    await getResend().emails.send({
      from: getFROM(), to: user.email,
      subject: "Welcome to SwapTest!",
      html: emailWrapper(content),
    });
  } catch(e) { console.error("Welcome email failed:", e); }
}

// ============================================================
// Contact form → sent to the SwapTest inbox
// ============================================================

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendContactMessage({ name, email, message }) {
  var to = process.env.CONTACT_TO_EMAIL || "hello@swaptest.co.uk";
  var content = heading("New contact form message")
    + detailsCard([
      { label: "Name", value: escapeHtml(name) },
      { label: "Email", value: escapeHtml(email) },
    ])
    + para(escapeHtml(message).replace(/\n/g, "<br>"))
    + divider()
    + smallText("Sent from the SwapTest contact form. Reply directly to respond to the sender.");
  await getResend().emails.send({
    from: getFROM(),
    to: to,
    replyTo: email,
    subject: "Contact form: " + name,
    html: emailWrapper(content),
  });
}

// ============================================================
// 7. Password Reset Email
// ============================================================

export async function sendPasswordResetEmail(user, resetUrl) {
  var content = greeting(user.name)
    + heading("Reset your password")
    + para("We received a request to reset the password for your SwapTest account. Click the button below to set a new password.")
    + urgentBadge("This link expires in 30 minutes.")
    + primaryButton(resetUrl, "Reset Password")
    + divider()
    + smallText("If you did not request a password reset, you can safely ignore this email. Your password will not be changed.");

  try {
    await getResend().emails.send({
      from: getFROM(), to: user.email,
      subject: "Reset your SwapTest password",
      html: emailWrapper(content),
    });
  } catch(e) { console.error("Password reset email failed:", e); }
}
