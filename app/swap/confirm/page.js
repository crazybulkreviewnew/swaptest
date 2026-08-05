"use client";

// /swap/confirm — review a swap before asking for it.
//
// This page exists because "Ask to swap" on the dashboard used to create the
// match on the spot: it locked both listings, started the response clock and
// emailed the other person, all before the person asking had agreed to
// anything. Then it sent them a second email a minute later when they did
// agree. The other party was being told to act on a request nobody had
// committed to.
//
// Now "Ask to swap" navigates here, nothing is written, and the match is only
// created when the button below is pressed. That single action creates the
// match AND records this person's agreement, so exactly one email goes out and
// it means what it says.

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/navbar";
import { ErrorBox, PrimaryButton, SecondaryButton, Card, formatDate } from "@/components/ui";
import { previewSwap, selectMatch, consentToMatch, paySwap } from "@/lib/api-client";
import { DATA_SHARING_DISCLAIMER, DISCLAIMER_CHECKBOX_LABEL } from "@/lib/disclaimer";
import { SWAP_WINDOW_LABEL } from "@/lib/swap-window";
import { paymentsEnabled } from "@/lib/payments";

function ConfirmSwap() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mineId = searchParams.get("mine");
  const theirsId = searchParams.get("theirs");

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);

  const load = useCallback(async function () {
    if (!mineId || !theirsId) {
      setErrors(["Missing swap details. Go back to your dashboard and try again."]);
      setLoading(false);
      return;
    }
    try {
      const data = await previewSwap(mineId, theirsId);
      setPreview(data);
    } catch (err) {
      setErrors(err.errors || ["Could not load this swap."]);
    } finally {
      setLoading(false);
    }
  }, [mineId, theirsId]);

  useEffect(function () { load(); }, [load]);

  // One action: create the match, then record this person's agreement. The
  // second call is what stops the other party getting a "your partner agreed"
  // email straight after the request email.
  const handleAgree = async function () {
    setSubmitting(true);
    setErrors([]);

    let matchId;
    try {
      const created = await selectMatch({ myListingId: mineId, targetListingId: theirsId });
      matchId = created.match.id;
    } catch (err) {
      // Nothing was created, so this is the one failure we can report plainly.
      setErrors(err.errors || ["Could not send the swap request."]);
      setSubmitting(false);
      return;
    }

    // Past this point the match exists and the other learner has been emailed.
    // If recording our own agreement fails we must NOT say the request failed,
    // because it did not. Send them to the match page, where they can agree.
    try {
      // The earlier-date seeker goes through the pay route (free while payments
      // are off); the later-date seeker consents directly.
      if (preview.mine.type === "EARLIER") {
        const res = await paySwap(matchId);
        if (res.checkoutUrl) { window.location.href = res.checkoutUrl; return; }
      } else {
        await consentToMatch(matchId);
      }
    } catch (err) {
      console.error("Agreement not recorded, sending them to the match page:", err);
    }
    router.push("/match?id=" + matchId);
  };

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">Loading…</p>;
  }

  if (!preview) {
    return (
      <div>
        <ErrorBox errors={errors} />
        <Link href="/dashboard" className="text-sm text-[#1D9E75]">Back to dashboard</Link>
      </div>
    );
  }

  const { mine, theirs, sameCentre } = preview;
  const wantsEarlier = mine.type === "EARLIER";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-[var(--fg-strong)] mb-1">Check this swap before you ask</h1>
        <p className="text-sm text-[var(--muted)]">
          Nothing has been sent yet. The other learner will not hear from us until you press the button at the
          bottom of this page.
        </p>
      </div>

      <ErrorBox errors={errors} />

      <Card>
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs text-[var(--muted-2)] mb-0.5">Your test now</p>
            <p className="text-base font-semibold text-[var(--fg)]">
              {formatDate(mine.currentDate)} at {mine.currentTime}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted-2)] mb-0.5">You would move to</p>
            <p className="text-base font-semibold text-[var(--fg)]">
              {formatDate(theirs.currentDate)} at {theirs.currentTime}
            </p>
            <p className="text-xs text-[var(--muted-2)] mt-1">
              {wantsEarlier ? "This is the earlier date you are after." : "This is later than your current test, which is what you asked for."}
            </p>
          </div>
          <div className="pt-1 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--muted-2)] mb-0.5">Test centre</p>
            <p className="text-sm text-[var(--fg-2)]">
              {sameCentre
                ? mine.centre + " — the same centre for both of you, so only the date changes."
                : "You move to " + theirs.centre + ". They move to " + mine.centre + "."}
            </p>
          </div>
        </div>
      </Card>

      <div className="text-sm text-[var(--muted)] leading-relaxed flex flex-col gap-2">
        <p><strong className="text-[var(--fg-2)]">What happens next.</strong> We email the other learner to ask if
        they want this swap. They get {SWAP_WINDOW_LABEL} to answer.</p>
        <p>While you wait, both tests are held so nobody else can take them. If they say no, or do not answer in
        time, both tests go straight back into the pool and yours is unchanged.</p>
        <p>If they agree, you each get the other&apos;s contact details and then <strong className="text-[var(--fg-2)]">you
        both have to ring DVSA yourselves</strong> on 0300 200 1122 to change your own booking. DVSA will not move a
        test on somebody else&apos;s say so.</p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] p-4">
        <p className="text-xs text-[var(--muted)] leading-relaxed mb-3">{DATA_SHARING_DISCLAIMER}</p>
        <label className="flex items-start gap-2 text-sm text-[var(--fg-2)] cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={function (e) { setAgreed(e.target.checked); }}
            className="mt-0.5"
            style={{ width: "auto" }}
          />
          <span>{DISCLAIMER_CHECKBOX_LABEL}</span>
        </label>
      </div>

      <div className="flex gap-3">
        <PrimaryButton onClick={handleAgree} loading={submitting} disabled={!agreed} className="flex-1">
          {paymentsEnabled() && wantsEarlier ? "Agree and continue to payment" : "Agree and send the request"}
        </PrimaryButton>
        <SecondaryButton onClick={function () { router.push("/dashboard"); }} className="shrink-0">
          Cancel
        </SecondaryButton>
      </div>
      <p className="text-xs text-[var(--muted-2)] -mt-2">
        Your name and contact details stay private unless you both agree.
      </p>
    </div>
  );
}

export default function ConfirmSwapPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Navbar />
      <main className="mx-auto w-full max-w-[560px] px-5 py-8">
        <Suspense fallback={<p className="text-sm text-[var(--muted)]">Loading…</p>}>
          <ConfirmSwap />
        </Suspense>
      </main>
    </div>
  );
}
