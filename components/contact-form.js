"use client";

// components/contact-form.js — Contact form for the /contact page.
// Posts to /api/contact, which emails the SwapTest inbox via Resend.
// Reads name/email/message from the user; shows validation errors and a
// success state. Does not store anything client-side.

import { useState } from "react";
import { Field, PrimaryButton, ErrorBox, SuccessBanner } from "@/components/ui";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    setLoading(true);
    setErrors([]);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors || ["Something went wrong. Please try again."]);
      } else {
        setSent(true);
        setName("");
        setEmail("");
        setMessage("");
      }
    } catch {
      setErrors(["Something went wrong. Please try again."]);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <SuccessBanner>
        Thanks! Your message has been sent. We will reply to your email within two working days.
      </SuccessBanner>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ErrorBox errors={errors} />
      <Field label="Your name" required>
        <input
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors([]); }}
          name="name"
          autoComplete="name"
          placeholder="Alex Smith"
        />
      </Field>
      <Field label="Your email" required>
        <input
          value={email}
          onChange={(e) => { setEmail(e.target.value); setErrors([]); }}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          placeholder="you@example.com"
        />
      </Field>
      <Field label="Message" required>
        <textarea
          value={message}
          onChange={(e) => { setMessage(e.target.value); setErrors([]); }}
          name="message"
          rows={5}
          placeholder="How can we help?"
          style={{ resize: "vertical", minHeight: "120px" }}
        />
      </Field>
      <PrimaryButton onClick={submit} loading={loading}>
        Send message
      </PrimaryButton>
    </div>
  );
}
