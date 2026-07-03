"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/navbar";
import { ErrorBox, SuccessBanner, PrimaryButton, SecondaryButton, Badge, Card, Countdown, formatDate } from "@/components/ui";
import { getMatch, paySwap, consentToMatch, declineMatch } from "@/lib/api-client";
import { DATA_SHARING_DISCLAIMER, DISCLAIMER_CHECKBOX_LABEL } from "@/lib/disclaimer";
import { paymentsEnabled } from "@/lib/payments";

function MatchDetail() {
  var router = useRouter();
  var searchParams = useSearchParams();
  var matchId = searchParams.get("id");
  var payStatus = searchParams.get("status"); // "paid" | "cancelled" after Stripe

  var [user, setUser] = useState(null);
  var [match, setMatch] = useState(null);
  var [loading, setLoading] = useState(true);
  var [errors, setErrors] = useState([]);
  var [agreed, setAgreed] = useState(false);
  var [actionLoading, setActionLoading] = useState(false);
  var [declineLoading, setDeclineLoading] = useState(false);

  var loadMatch = useCallback(async function() {
    if (!matchId) return;
    try {
      var results = await Promise.all([
        fetch("/api/auth/me").then(function(r) { return r.json(); }),
        getMatch(matchId),
      ]);
      if (results[0].user) setUser(results[0].user);
      setMatch(results[1].match);
    } catch (err) {
      setErrors(err.errors || ["Failed to load match"]);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(function() { loadMatch(); }, [loadMatch]);
  useEffect(function() {
    if (!matchId) return;
    var iv = setInterval(loadMatch, 10000);
    return function() { clearInterval(iv); };
  }, [matchId, loadMatch]);

  // Earlier-seeker: accept disclaimer + pay £8 → Stripe Checkout.
  var handlePay = async function() {
    setActionLoading(true);
    setErrors([]);
    try {
      var res = await paySwap(matchId);
      if (res.checkoutUrl) { window.location.href = res.checkoutUrl; return; }
      await loadMatch();
    } catch (err) {
      setErrors(err.errors || ["Could not start checkout"]);
    } finally {
      setActionLoading(false);
    }
  };

  // Later-seeker: accept disclaimer (free).
  var handleConsent = async function() {
    setActionLoading(true);
    setErrors([]);
    try {
      await consentToMatch(matchId);
      await loadMatch();
    } catch (err) {
      setErrors(err.errors || ["Could not record your agreement"]);
    } finally {
      setActionLoading(false);
    }
  };

  var handleDecline = async function() {
    setDeclineLoading(true);
    setErrors([]);
    try {
      await declineMatch(matchId);
      router.push("/dashboard");
    } catch (err) {
      setErrors(err.errors || ["Failed to decline"]);
      setDeclineLoading(false);
    }
  };

  if (!matchId) {
    return (<div className="min-h-screen"><Navbar /><div className="max-w-lg mx-auto px-5 py-20 text-center text-[var(--muted-2)]">No match ID provided. <Link href="/dashboard" className="text-[#1D9E75] hover:underline">Go to dashboard</Link></div></div>);
  }
  if (loading) {
    return (<div className="min-h-screen"><Navbar user={user} onLogout={function() { router.push("/"); }} /><div className="flex items-center justify-center py-20"><div role="status" aria-label="Loading match" className="w-6 h-6 border-2 border-[#1D9E75]/30 border-t-[#1D9E75] rounded-full animate-spin" /></div></div>);
  }
  if (!match) {
    return (<div className="min-h-screen"><Navbar user={user} onLogout={function() { router.push("/"); }} /><div className="max-w-lg mx-auto px-5 py-20 text-center"><ErrorBox errors={errors.length ? errors : ["Match not found"]} /><Link href="/dashboard" className="text-sm text-[#1D9E75] hover:underline">Back to dashboard</Link></div></div>);
  }

  var role = match.role;
  var isEarlier = role === "earlier";
  var isInitiator = match.isInitiator;
  var otherUser = isEarlier ? match.laterUser : match.earlierUser;
  var otherListing = isEarlier ? match.laterListing : match.earlierListing;
  var myListing = isEarlier ? match.earlierListing : match.laterListing;
  var deadlineIsReal = match.payDeadline && new Date(match.payDeadline).getTime() > 10000;

  var swapDetails = (
    <Card className="mt-5 mb-4">
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm"><span className="text-[var(--muted-2)]">Your current slot</span><span className="text-[var(--fg)]">{formatDate(myListing.currentDate)} at {myListing.currentTime}</span></div>
        <div className="flex justify-between text-sm"><span className="text-[var(--muted-2)]">You&apos;d get their slot</span><span className="text-[var(--brand-text)]">{formatDate(otherListing.currentDate)} at {otherListing.currentTime}</span></div>
        <div className="flex justify-between text-sm"><span className="text-[var(--muted-2)]">Your centre</span><span className="text-[var(--fg)]">{myListing.centre}</span></div>
        <div className="flex justify-between text-sm"><span className="text-[var(--muted-2)]">Their centre</span><span className="text-[var(--fg)]">{otherListing.centre}</span></div>
      </div>
    </Card>
  );

  var disclaimerBox = (
    <div className="mb-4">
      <div className="text-[12px] text-[var(--muted)] leading-relaxed p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] mb-3">
        {DATA_SHARING_DISCLAIMER}
      </div>
      <label className="flex gap-2 items-start text-[13px] text-[var(--fg-2)] cursor-pointer">
        <input type="checkbox" checked={agreed} onChange={function(e) { setAgreed(e.target.checked); }} className="mt-0.5 w-auto" style={{ width: "auto" }} />
        <span>{DISCLAIMER_CHECKBOX_LABEL}</span>
      </label>
    </div>
  );

  var renderStatus = function() {
    var s = match.status;

    if (s === "COMPLETED") {
      return (<>
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#085041] flex items-center justify-center mx-auto mb-4"><span aria-hidden="true" className="text-3xl text-[var(--brand-text)]">✓</span></div>
          <h2 className="text-2xl font-bold text-[var(--fg)] mb-2">Swap confirmed!</h2>
          <p className="text-sm text-[var(--muted)]">Both of you agreed. Here are your swap partner&apos;s details.</p>
        </div>
        <Card highlight>
          <div className="text-[11px] uppercase tracking-wider text-[var(--muted-2)] mb-3">Your swap partner</div>
          <div className="text-lg font-semibold text-[var(--fg)] mb-3">{otherUser.name}</div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-[var(--muted-2)]">Email</span><span className="text-[#85B7EB]">{otherUser.email}</span></div>
            <div className="flex justify-between text-sm"><span className="text-[var(--muted-2)]">Phone</span><span className="text-[var(--fg)]">{otherUser.phone}</span></div>
            <div className="flex justify-between text-sm"><span className="text-[var(--muted-2)]">Their slot</span><span className="text-[var(--brand-text)]">{formatDate(otherListing.currentDate)} at {otherListing.currentTime}</span></div>
            <div className="flex justify-between text-sm"><span className="text-[var(--muted-2)]">Their centre</span><span className="text-[var(--fg)]">{otherListing.centre}</span></div>
            <div className="flex justify-between text-sm"><span className="text-[var(--muted-2)]">Your centre</span><span className="text-[var(--fg)]">{myListing.centre}</span></div>
          </div>
        </Card>
        <Card className="mt-4">
          <div className="text-sm text-[var(--muted)] leading-relaxed">
            <strong className="text-[var(--fg)]">Next steps:</strong> Contact each other, then contact DVSA to arrange swapping your test dates. You do not need to cancel your test first.
          </div>
        </Card>
      </>);
    }

    if (s === "EXPIRED") {
      return (<div className="text-center">
        <div className="w-16 h-16 rounded-full bg-red-950/60 flex items-center justify-center mx-auto mb-4"><span aria-hidden="true" className="text-3xl text-red-400">✕</span></div>
        <h2 className="text-xl font-semibold text-[var(--fg)] mb-2">Match expired</h2>
        <p className="text-sm text-[var(--muted)] max-w-sm mx-auto leading-relaxed">This swap was not completed in time. Both listings are back in the pool.</p>
      </div>);
    }

    if (s === "DECLINED" || s === "CANCELLED") {
      return (<div className="text-center">
        <h2 className="text-xl font-semibold text-[var(--fg)] mb-2">Match {s === "DECLINED" ? "declined" : "cancelled"}</h2>
        <p className="text-sm text-[var(--muted)]">Your listing is back in the pool.</p>
      </div>);
    }

    // PENDING
    var youDone = isEarlier ? match.earlierPaid : match.youConsented;
    var otherDoneLabel = isEarlier
      ? "Waiting for the other person to agree to the swap."
      : (paymentsEnabled() ? "Waiting for the other person to pay the swap fee." : "Waiting for the other person to agree to the swap.");

    return (<>
      <h2 className="text-xl font-semibold text-[var(--fg)] mb-2">
        {isInitiator ? "Confirm your swap" : "Someone wants to swap with you!"}
      </h2>
      <p className="text-sm text-[var(--muted)] mb-2">
        {paymentsEnabled()
          ? (isEarlier
              ? "To confirm this swap and unlock contact details, accept the disclaimer and pay the £8 swap fee. The other person pays nothing."
              : "To confirm this swap and unlock contact details, accept the disclaimer below. It is free for you — the other person pays the swap fee.")
          : "To confirm this swap and unlock contact details, accept the disclaimer below."}
      </p>
      {deadlineIsReal && <Countdown deadline={match.payDeadline} onExpired={loadMatch} />}
      {swapDetails}

      {youDone ? (
        <Card><div className="text-sm text-[var(--muted)]">{"You're all set. " + otherDoneLabel}</div></Card>
      ) : (
        <>
          {disclaimerBox}
          <div className="flex gap-3">
            {isEarlier ? (
              <PrimaryButton onClick={handlePay} loading={actionLoading} disabled={!agreed} className="flex-1">{paymentsEnabled() ? "Accept & pay £8 to swap" : "Agree to swap"}</PrimaryButton>
            ) : (
              <PrimaryButton onClick={handleConsent} loading={actionLoading} disabled={!agreed} className="flex-1">Agree to swap (free)</PrimaryButton>
            )}
            {!isInitiator && (
              <SecondaryButton onClick={handleDecline} className="shrink-0">{declineLoading ? "..." : "Decline"}</SecondaryButton>
            )}
          </div>
        </>
      )}
    </>);
  };

  return (
    <div className="min-h-screen">
      <Navbar user={user} onLogout={function() { router.push("/"); }} />
      <div className="max-w-lg mx-auto px-5 py-8">
        <Link href="/dashboard" className="text-sm text-[var(--muted-2)] hover:text-[var(--fg-2)] transition mb-5 block">← Dashboard</Link>
        <div className="flex items-center gap-2 mb-5">
          <Badge variant={isEarlier ? "earlier" : "later"}>{isEarlier ? "You want earlier" : "You want later"}</Badge>
          <Badge variant={isInitiator ? "info" : "default"}>{isInitiator ? "You initiated" : "You were selected"}</Badge>
          <Badge variant={match.status === "COMPLETED" ? "success" : (match.status === "EXPIRED" || match.status === "DECLINED" || match.status === "CANCELLED") ? "danger" : "warning"}>
            {match.status === "COMPLETED" ? "Complete" : match.status === "EXPIRED" ? "Expired" : match.status === "DECLINED" ? "Declined" : match.status === "CANCELLED" ? "Cancelled" : "In progress"}
          </Badge>
        </div>
        {payStatus === "paid" && match.status !== "COMPLETED" && (
          <SuccessBanner>Payment received. Finalising your swap…</SuccessBanner>
        )}
        <ErrorBox errors={errors} />
        {renderStatus()}
        <div className="mt-6 text-center">
          <Link href="/dashboard" className="text-sm text-[var(--muted-2)] hover:text-[var(--fg-2)] transition">Back to dashboard</Link>
        </div>
      </div>
    </div>
  );
}

export default function MatchPage() {
  return (<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div role="status" aria-label="Loading" className="w-6 h-6 border-2 border-[#1D9E75]/30 border-t-[#1D9E75] rounded-full animate-spin" /></div>}><MatchDetail /></Suspense>);
}
