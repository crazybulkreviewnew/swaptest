"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/navbar";
import { ErrorBox, SuccessBanner, PrimaryButton, SecondaryButton, Badge, Card, Countdown, formatDate } from "@/components/ui";
import { getMatch, agreeToMatch, declineMatch } from "@/lib/api-client";

function MatchDetail() {
  var router = useRouter();
  var searchParams = useSearchParams();
  var matchId = searchParams.get("id");

  var [user, setUser] = useState(null);
  var [match, setMatch] = useState(null);
  var [loading, setLoading] = useState(true);
  var [errors, setErrors] = useState([]);
  var [agreeLoading, setAgreeLoading] = useState(false);
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

  var handleAgree = async function() {
    setAgreeLoading(true);
    setErrors([]);
    try {
      await agreeToMatch(matchId);
      await loadMatch();
    } catch (err) {
      setErrors(err.errors || ["Failed to agree"]);
    } finally {
      setAgreeLoading(false);
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
  var isInitiator = match.isInitiator;
  var otherUser = role === "earlier" ? match.laterUser : match.earlierUser;
  var otherListing = role === "earlier" ? match.laterListing : match.earlierListing;
  var myListing = role === "earlier" ? match.earlierListing : match.laterListing;

  var activeDeadline = null;
  if (match.status === "PENDING_LATER_PAY" && match.laterPayDeadline) activeDeadline = match.laterPayDeadline;
  if (match.status === "PENDING_EARLIER_PAY" && match.earlierPayDeadline) activeDeadline = match.earlierPayDeadline;
  var deadlineIsReal = activeDeadline && new Date(activeDeadline).getTime() > 10000;

  var renderStatus = function() {
    var s = match.status;

    if (s === "COMPLETED") {
      return (<>
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#085041] flex items-center justify-center mx-auto mb-4"><span aria-hidden="true" className="text-3xl text-[var(--brand-text)]">✓</span></div>
          <h2 className="text-2xl font-bold text-[var(--fg)] mb-2">Swap confirmed!</h2>
          <p className="text-sm text-[var(--muted)]">Both parties agreed. Here are your swap partner's details.</p>
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
            <strong className="text-[var(--fg)]">Next steps:</strong> Contact each other and agree on a time to both cancel and rebook on the DVSA website. We recommend doing it simultaneously so both slots are freed at the same moment.
          </div>
        </Card>
      </>);
    }

    // Initiator waiting for responder
    if (isInitiator && (s === "PENDING_LATER_PAY" || s === "PENDING_EARLIER_PAY")) {
      return (<>
        <h2 className="text-xl font-semibold text-[var(--fg)] mb-2">We've notified the other person</h2>
        <p className="text-sm text-[var(--muted)] mb-2">An email has been sent to your swap partner. They have 30 minutes to agree.</p>
        {deadlineIsReal && <Countdown deadline={activeDeadline} onExpired={loadMatch} />}
        <Card className="mt-5">
          <div className="text-sm text-[var(--muted-2)] mb-2">Swap details</div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm"><span className="text-[var(--muted-2)]">Their slot (you'd get)</span><span className="text-[var(--brand-text)]">{formatDate(otherListing.currentDate)} at {otherListing.currentTime}</span></div>
            <div className="flex justify-between text-sm"><span className="text-[var(--muted-2)]">Your current slot</span><span className="text-[var(--fg)]">{formatDate(myListing.currentDate)} at {myListing.currentTime}</span></div>
            <div className="flex justify-between text-sm"><span className="text-[var(--muted-2)]">Your centre</span><span className="text-[var(--fg)]">{myListing.centre}</span></div>
            <div className="flex justify-between text-sm"><span className="text-[var(--muted-2)]">Their centre</span><span className="text-[var(--fg)]">{otherListing.centre}</span></div>
          </div>
        </Card>
      </>);
    }

    // Responder needs to agree
    if (!isInitiator && (s === "PENDING_LATER_PAY" || s === "PENDING_EARLIER_PAY")) {
      return (<>
        <h2 className="text-xl font-semibold text-[var(--fg)] mb-2">Someone wants to swap with you!</h2>
        <p className="text-sm text-[var(--muted)] mb-2">A candidate wants to swap test dates with you. Review the details and agree if you're happy.</p>
        {deadlineIsReal && <Countdown deadline={activeDeadline} onExpired={loadMatch} />}
        <Card className="mt-5 mb-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm"><span className="text-[var(--muted-2)]">Your current slot</span><span className="text-[var(--fg)]">{formatDate(myListing.currentDate)} at {myListing.currentTime}</span></div>
            <div className="flex justify-between text-sm"><span className="text-[var(--muted-2)]">You'd get their slot</span><span className="text-[var(--brand-text)]">{formatDate(otherListing.currentDate)} at {otherListing.currentTime}</span></div>
            <div className="flex justify-between text-sm"><span className="text-[var(--muted-2)]">Your centre</span><span className="text-[var(--fg)]">{myListing.centre}</span></div>
            <div className="flex justify-between text-sm"><span className="text-[var(--muted-2)]">Their centre</span><span className="text-[var(--fg)]">{otherListing.centre}</span></div>
          </div>
        </Card>
        <div className="flex gap-3">
          <PrimaryButton onClick={handleAgree} loading={agreeLoading} className="flex-1">Agree to Swap</PrimaryButton>
          <SecondaryButton onClick={handleDecline} className="shrink-0">{declineLoading ? "..." : "Decline"}</SecondaryButton>
        </div>
      </>);
    }

    if (s === "EXPIRED_TIMER1" || s === "EXPIRED_TIMER2") {
      return (<div className="text-center">
        <div className="w-16 h-16 rounded-full bg-red-950/60 flex items-center justify-center mx-auto mb-4"><span aria-hidden="true" className="text-3xl text-red-400">✕</span></div>
        <h2 className="text-xl font-semibold text-[var(--fg)] mb-2">Match expired</h2>
        <p className="text-sm text-[var(--muted)] max-w-sm mx-auto leading-relaxed">The other person didn't respond within 30 minutes. Both listings are back in the pool.</p>
      </div>);
    }

    if (s === "DECLINED") {
      return (<div className="text-center">
        <h2 className="text-xl font-semibold text-[var(--fg)] mb-2">Match declined</h2>
        <p className="text-sm text-[var(--muted)]">This match was declined. Your listing is back in the pool.</p>
      </div>);
    }

    return <p className="text-[var(--muted-2)]">Status: {s}</p>;
  };

  return (
    <div className="min-h-screen">
      <Navbar user={user} onLogout={function() { router.push("/"); }} />
      <div className="max-w-lg mx-auto px-5 py-8">
        <Link href="/dashboard" className="text-sm text-[var(--muted-2)] hover:text-[var(--fg-2)] transition mb-5 block">← Dashboard</Link>
        <div className="flex items-center gap-2 mb-5">
          <Badge variant={role === "earlier" ? "earlier" : "later"}>{role === "earlier" ? "You want earlier" : "You want later"}</Badge>
          <Badge variant={isInitiator ? "info" : "default"}>{isInitiator ? "You initiated" : "You were selected"}</Badge>
          <Badge variant={match.status === "COMPLETED" ? "success" : match.status.startsWith("EXPIRED") ? "danger" : match.status === "DECLINED" ? "danger" : "warning"}>
            {match.status === "COMPLETED" ? "Complete" : match.status.startsWith("EXPIRED") ? "Expired" : match.status === "DECLINED" ? "Declined" : "In progress"}
          </Badge>
        </div>
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
