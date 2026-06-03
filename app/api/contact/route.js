// POST /api/contact — receives a contact-form submission and emails it to the
// SwapTest inbox via Resend. Rate limited by IP. No auth required (public form).
// Returns { data } on success or { errors: [...] } on validation/send failure.

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuthLimiter, checkRateLimit, getClientIp } from "@/lib/ratelimit";
import { sendContactMessage } from "@/lib/email";

export async function POST(request) {
  const headersList = await headers();
  const ip = getClientIp(headersList);
  const rateLimitError = await checkRateLimit(getAuthLimiter, "contact:" + ip);
  if (rateLimitError) return rateLimitError;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ errors: ["Invalid request"] }, { status: 400 });
  }

  const name = (body.name || "").trim();
  const email = (body.email || "").trim();
  const message = (body.message || "").trim();

  const errors = [];
  if (name.length < 2) errors.push("Please enter your name");
  if (name.length > 100) errors.push("Name is too long");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Please enter a valid email address");
  if (message.length < 10) errors.push("Please enter a message of at least 10 characters");
  if (message.length > 2000) errors.push("Message is too long (maximum 2000 characters)");
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  try {
    await sendContactMessage({ name, email, message });
    return NextResponse.json({ data: { sent: true } });
  } catch (err) {
    console.error("Contact form send failed:", err?.message);
    return NextResponse.json(
      { errors: ["Sorry, we could not send your message right now. Please email us directly at hello@swaptest.co.uk."] },
      { status: 500 }
    );
  }
}
