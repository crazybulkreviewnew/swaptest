"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/navbar";
import {
  ErrorBox, SuccessBanner, PrimaryButton, SecondaryButton, Badge, Card,
  EmptyState, StatCard, Countdown, PageShell, formatDate,
} from "@/components/ui";
import { getListings, createListing, deleteListing, editListing, startSubscriptionCheckout, openBillingPortal } from "@/lib/api-client";
import { paymentsEnabled } from "@/lib/payments";
import { SWAP_WINDOW_LABEL } from "@/lib/swap-window";
import { canRequestSwap, TRIAL_DAYS } from "@/lib/subscription";
import { UK_CENTRES } from "@/lib/centres";

export default function DashboardPage() {
  var router = useRouter();
  var [user, setUser] = useState(null);
  var [listings, setListings] = useState([]);
  var [loading, setLoading] = useState(true);
  var [errors, setErrors] = useState([]);
  var [success, setSuccess] = useState(null);

  var [showForm, setShowForm] = useState(false);
  var [formType, setFormType] = useState("EARLIER");
  var [formLoading, setFormLoading] = useState(false);
  var [centre, setCentre] = useState("");
  var [testType, setTestType] = useState("WEEKDAY");
  var [swappedBefore, setSwappedBefore] = useState(false);
  var [originalCentre, setOriginalCentre] = useState("");
  var [currentDate, setCurrentDate] = useState("");
  var [currentTime, setCurrentTime] = useState("");
  var [startingCheckout, setStartingCheckout] = useState(false);
  var [managingBilling, setManagingBilling] = useState(false);

  var [matchResults, setMatchResults] = useState([]);
  var [allMatches, setAllMatches] = useState([]);
  var [matchListing, setMatchListing] = useState(null);

  var [editingId, setEditingId] = useState(null);
  var [editForm, setEditForm] = useState({});
  var [editLoading, setEditLoading] = useState(false);
  var [deleteConfirmId, setDeleteConfirmId] = useState(null);

  var [refreshing, setRefreshing] = useState(false);

  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  var tomorrowStr = tomorrow.toISOString().split("T")[0];

  var loadData = useCallback(async function() {
    try {
      var results = await Promise.all([
        fetch("/api/auth/me").then(function(r) { return r.json(); }),
        getListings(),
      ]);
      if (results[0].user) setUser(results[0].user);
      setListings(results[1].listings || []);

      // Every listing that has matches, not just the first. Someone with two
      // listings used to be shown matches for one of them and never told the
      // other had any, which made the alert email point at an empty dashboard.
      setAllMatches(results[1].newMatches || []);

      if (results[1].newMatches && results[1].newMatches.length > 0 && !matchResults.length) {
        var first = results[1].newMatches[0];
        setMatchResults(first.matches);
        var parentListing = (results[1].listings || []).find(function(l) { return l.id === first.listingId; });
        if (parentListing) setMatchListing(parentListing);
      }

      var storedMatches = sessionStorage.getItem("swaptest_matches");
      var storedListing = sessionStorage.getItem("swaptest_listing");
      if (storedMatches && storedListing) {
        setMatchResults(JSON.parse(storedMatches));
        setMatchListing(JSON.parse(storedListing));
        sessionStorage.removeItem("swaptest_matches");
        sessionStorage.removeItem("swaptest_listing");
      }
    } catch (err) {
      setErrors(["Failed to load data"]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(function() { loadData(); }, [loadData]);
  useEffect(function() {
    var iv = setInterval(loadData, 30000);
    return function() { clearInterval(iv); };
  }, [loadData]);

  var handleRefresh = async function() {
    setRefreshing(true);
    setSuccess(null);
    setErrors([]);
    await loadData();
    setRefreshing(false);
  };

  var handleCreateListing = async function() {
    setFormLoading(true);
    setErrors([]);
    try {
      var data = await createListing({
        type: formType, centre: centre, testType: testType,
        originalCentre: swappedBefore ? (originalCentre || undefined) : undefined,
        currentDate: currentDate, currentTime: currentTime,
      });
      if (data.matches && data.matches.length > 0) {
        setMatchResults(data.matches);
        setMatchListing(data.listing);
      } else {
        setSuccess("Listing created. No matches found yet. Check back later or click Refresh.");
      }
      setShowForm(false);
      setCentre(""); setTestType("WEEKDAY"); setSwappedBefore(false); setOriginalCentre(""); setCurrentDate(""); setCurrentTime("");
      await loadData();
    } catch (err) {
      // Listing an EARLIER test needs a membership. Keep what they typed and
      // send them to Stripe; this page finishes the job when they return.
      if (err.error === "SUBSCRIPTION_REQUIRED" || err.status === 402) {
        sessionStorage.setItem("swaptest_pending_listing", JSON.stringify({
          type: formType, centre: centre, testType: testType,
          originalCentre: swappedBefore ? (originalCentre || undefined) : undefined,
          currentDate: currentDate, currentTime: currentTime,
        }));
        await handleJoin();
        return;
      }
      setErrors(err.errors || ["Failed to create listing"]);
    } finally {
      setFormLoading(false);
    }
  };

  // Join the £1/week membership.
  var handleJoin = async function() {
    setStartingCheckout(true);
    setErrors([]);
    try {
      var r = await startSubscriptionCheckout();
      if (r && r.checkoutUrl) { window.location.href = r.checkoutUrl; return; }
      if (r && r.alreadyActive) { await loadData(); }
    } catch (err) {
      setErrors(err.errors || ["Could not open the membership page. Please try again."]);
    } finally {
      setStartingCheckout(false);
    }
  };

  // Cancel, change card, see invoices — all on Stripe's own page.
  var handleManageMembership = async function() {
    setManagingBilling(true);
    setErrors([]);
    try {
      var r = await openBillingPortal();
      if (r && r.portalUrl) { window.location.href = r.portalUrl; return; }
    } catch (err) {
      setErrors(err.errors || ["Could not open the billing page. Please try again."]);
    } finally {
      setManagingBilling(false);
    }
  };

  // "+ New listing" — always straight to the form. The paywall is applied on
  // submit rather than here, because it depends on which way they are going:
  // listing a test you want moved EARLIER needs a membership, listing one you
  // are happy to move LATER does not, and that is not known until they choose.
  var startNewListing = function() { setShowForm(true); };

  // After returning from the registration checkout, create the listing the user
  // entered during sign-up (stashed in sessionStorage), once the webhook has
  // marked them as paid.
  var finalizePendingListing = useCallback(async function() {
    var raw = sessionStorage.getItem("swaptest_pending_listing");
    if (!raw) { await loadData(); return; }
    var pending;
    try { pending = JSON.parse(raw); } catch (e) { sessionStorage.removeItem("swaptest_pending_listing"); return; }
    // Wait for the Stripe webhook to land before retrying, otherwise the
    // listing is rejected again by the same paywall they have just paid at.
    // Polls membership rather than registrationPaidAt, which the retired
    // registration fee used to set and which now never changes.
    for (var i = 0; i < 12; i++) {
      var me = await fetch("/api/auth/me").then(function(r) { return r.json(); }).catch(function() { return {}; });
      if (me.user && canRequestSwap(me.user)) break;
      await new Promise(function(res) { setTimeout(res, 2000); });
    }
    try {
      var data = await createListing(pending);
      sessionStorage.removeItem("swaptest_pending_listing");
      if (data.matches && data.matches.length > 0) {
        setMatchResults(data.matches);
        setMatchListing(data.listing);
      } else {
        setSuccess("Registration complete and your test is now listed!");
      }
      await loadData();
    } catch (err) {
      sessionStorage.removeItem("swaptest_pending_listing");
      setErrors(err.errors || ["We couldn't list your test automatically. Please create the listing from your dashboard."]);
      await loadData();
    }
  }, [loadData]);

  // Handle return from Stripe registration checkout.
  useEffect(function() {
    var sp = new URLSearchParams(window.location.search);
    var status = sp.get("status");
    if (status === "registered") {
      setSuccess("Registration complete! Setting up your listing…");
      window.history.replaceState({}, "", "/dashboard");
      finalizePendingListing();
    } else if (status === "registration_cancelled") {
      setErrors(["Registration payment was cancelled. You can try again whenever you're ready."]);
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [finalizePendingListing]);

  // Navigation only. This used to create the match here, which locked both
  // listings, started the clock and emailed the other learner before this
  // person had agreed to anything. The match is now created on /swap/confirm,
  // when they actually commit.
  var handleSelectMatch = function(targetListingId) {
    if (!matchListing) return;
    router.push("/swap/confirm?mine=" + encodeURIComponent(matchListing.id) + "&theirs=" + encodeURIComponent(targetListingId));
  };

  var handleDelete = async function(listingId) {
    setErrors([]);
    try {
      await deleteListing(listingId);
      setDeleteConfirmId(null);
      setSuccess("Listing deleted.");
      await loadData();
    } catch (err) {
      setErrors(err.errors || ["Failed to delete listing"]);
    }
  };

  var startEditing = function(listing) {
    setEditingId(listing.id);
    setEditForm({
      type: listing.type, centre: listing.centre,
      testType: listing.testType || "WEEKDAY",
      originalCentre: listing.originalCentre || "",
      currentDate: new Date(listing.currentDate).toISOString().split("T")[0],
      currentTime: listing.currentTime,
    });
    setErrors([]);
  };

  var handleEdit = async function() {
    setEditLoading(true);
    setErrors([]);
    try {
      await editListing(editingId, {
        type: editForm.type, centre: editForm.centre,
        testType: editForm.testType,
        originalCentre: editForm.originalCentre || null,
        currentDate: editForm.currentDate,
        currentTime: editForm.currentTime,
      });
      setEditingId(null);
      setEditForm({});
      setSuccess("Listing updated.");
      await loadData();
    } catch (err) {
      setErrors(err.errors || ["Failed to update listing"]);
    } finally {
      setEditLoading(false);
    }
  };

  var statusBadge = function(listing) {
    var s = listing.status;
    if (s === "AVAILABLE") return <Badge variant="success">Active</Badge>;
    if (s === "LOCKED") return <Badge variant="warning">Match pending</Badge>;
    if (s === "MATCHED") return <Badge variant="info">Swapped</Badge>;
    return <Badge>{s}</Badge>;
  };

  var matchStatusLabel = function(match) {
    var s = match.status;
    var isInit = match.initiatedByUserId === (user && user.id);
    if (s === "COMPLETED") return { text: "Swap complete", variant: "success" };
    if (isInit) return { text: "Waiting for other person to respond", variant: "warning" };
    return { text: "Action needed - tap to view", variant: "warning" };
  };

  if (loading) {
    return (<div className="min-h-screen"><Navbar user={user} onLogout={function() { router.push("/"); }} /><div className="flex items-center justify-center py-20"><div role="status" aria-label="Loading your dashboard" className="w-6 h-6 border-2 border-[#1D9E75]/30 border-t-[#1D9E75] rounded-full animate-spin" /></div></div>);
  }

  var isEarlier = formType === "EARLIER";

  return (
    <div className="min-h-screen">
      <Navbar user={user} onLogout={function() { router.push("/"); }} />
      <div className="max-w-2xl mx-auto px-5 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--fg)]">Dashboard</h1>
            <p className="text-sm text-[var(--muted-2)]">Manage your listings and matches</p>
          </div>
          {!showForm && matchResults.length === 0 && (
            <div className="flex gap-2">
              <button onClick={handleRefresh} disabled={refreshing}
                className="px-4 py-2 rounded-lg border border-[var(--border)] bg-transparent text-[var(--muted)] hover:border-[var(--border-strong)] hover:text-[var(--fg-2)] text-sm transition disabled:opacity-50">
                {refreshing ? "Checking..." : "Refresh matches"}
              </button>
              <SecondaryButton onClick={startNewListing}>+ New listing</SecondaryButton>
            </div>
          )}
        </div>

        {/* Membership. Only ever shown once payments are on, and never to the
            people who were grandfathered in while SwapTest was free. */}
        {paymentsEnabled() && user && !user.lifetimeFreeAccess && (
          <div className="mb-5 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-raised)]">
            {canRequestSwap(user) ? (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm text-[var(--muted)]">
                  {user.subscriptionStatus === "CANCELLED"
                    ? "Your membership is cancelled. You can still ask for swaps until it runs out."
                    : user.subscriptionStatus === "PAST_DUE"
                      ? "We could not take your last £1 payment. Please update your card so you do not lose access."
                      : "Membership active — £1 a week."}
                </p>
                <button onClick={handleManageMembership} disabled={managingBilling}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-sm text-[var(--muted)] hover:text-[var(--fg-2)] transition disabled:opacity-50">
                  {managingBilling ? "…" : "Manage membership"}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm text-[var(--muted)]">
                  <strong className="text-[var(--fg-2)]">Everything is free if you are happy to take a later date.</strong>
                  {" "}A £1 a week membership is needed only to list or ask for a move to an earlier date.
                  {!user.stripeSubscriptionId ? " Your first " + TRIAL_DAYS + " days are free." : ""}
                </p>
                <button onClick={handleJoin} disabled={startingCheckout}
                  className="px-4 py-2 rounded-lg bg-[#1D9E75] hover:bg-[#1ab87f] text-white text-sm font-semibold transition disabled:opacity-50">
                  {startingCheckout ? "…" : (user.stripeSubscriptionId ? "Rejoin — £1 a week" : "Start free trial")}
                </button>
              </div>
            )}
          </div>
        )}

        <ErrorBox errors={errors} />
        {success && <SuccessBanner>{success}</SuccessBanner>}

        {/* Match Results */}
        {matchResults.length > 0 && (
          <div className="mb-8">
            {/* Matches can exist on more than one listing. Without this, only
                the first listing's matches were ever visible and the rest were
                invisible for as long as they lasted. */}
            {allMatches.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {allMatches.map(function(group) {
                  var l = listings.find(function(x) { return x.id === group.listingId; });
                  var active = matchListing && matchListing.id === group.listingId;
                  return (
                    <button
                      key={group.listingId}
                      onClick={function() {
                        setMatchResults(group.matches);
                        setMatchListing(l || null);
                      }}
                      className={"px-3 py-2 rounded-lg text-sm font-medium border transition min-h-[44px] [touch-action:manipulation] " +
                        (active
                          ? "border-[#1D9E75] text-[var(--fg)] bg-[rgba(29,158,117,0.08)]"
                          : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-strong)]")}
                    >
                      {(l ? l.centre : "Listing") + " (" + group.matches.length + ")"}
                    </button>
                  );
                })}
              </div>
            )}

            <h2 className="text-lg font-semibold text-[var(--fg)] mb-1">
              {matchResults.length === 1
                ? "Somebody can swap with you"
                : matchResults.length + " people can swap with you"}
            </h2>
            <p className="text-sm text-[var(--muted-2)] mb-4">
              {"These learners have a test that works with yours at " + (matchListing ? matchListing.centre : "") + " or a nearby centre. "}
              <strong className="text-[var(--fg-2)]">Nothing happens until you ask them.</strong>
              {" Press the button to see the full swap. Nothing is sent until you agree to it on the next page, and they then have " + SWAP_WINDOW_LABEL + " to say yes or no."}
            </p>
            <div className="flex flex-col gap-3">
              {matchResults.map(function(listing) {
                return (
                  <Card key={listing.id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[15px] font-semibold text-[var(--fg)]">
                          {formatDate(listing.currentDate)} at {listing.currentTime}
                        </div>
                        <div className="text-sm text-[var(--muted-2)] mt-0.5">Their centre: {listing.centre}</div>
                        <div className="text-xs text-[var(--faint)] mt-0.5">Your centre: {matchListing ? matchListing.centre : ""}</div>
                      </div>
                      <button onClick={function() { handleSelectMatch(listing.id); }}
                        className="px-4 py-2 rounded-lg bg-[#1D9E75] hover:bg-[#1ab87f] text-white text-sm font-semibold transition">
                        See this swap
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
            <button onClick={function() { setMatchResults([]); setMatchListing(null); }}
              className="text-sm text-[var(--muted-2)] hover:text-[var(--fg-2)] mt-3 transition">Dismiss results</button>
          </div>
        )}

        {/* New Listing Form */}
        {showForm && (
          <Card className="mb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[var(--fg)]">New listing</h2>
              <button onClick={function() { setShowForm(false); }} className="text-sm text-[var(--muted-2)] hover:text-[var(--fg-2)]">Cancel</button>
            </div>
            <div className="flex gap-2 mb-5">
              {["EARLIER", "LATER"].map(function(t) {
                return (
                  <button key={t} onClick={function() { setFormType(t); }}
                    className={"px-4 py-2 rounded-lg text-sm font-medium transition " + (formType === t ? "bg-[#0F6E56] text-white border border-[#0F6E56]" : "bg-[var(--chip)] text-[var(--fg-2)] border border-[var(--border)] hover:border-[var(--border-strong)]")}>
                    {t === "EARLIER" ? "Want earlier" : "Want later"}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs text-[var(--muted)] mb-1">Test centre <span className="text-red-500">*</span></label>
                <select value={centre} onChange={function(e) { setCentre(e.target.value); }}>
                  <option value="">Select a centre...</option>
                  {UK_CENTRES.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[var(--muted)] mb-1">Test type <span className="text-red-500">*</span></label>
                <select value={testType} onChange={function(e) { setTestType(e.target.value); }}>
                  <option value="WEEKDAY">Weekday test (£62)</option>
                  <option value="EVENING_WEEKEND">Evening, weekend or bank holiday (£75)</option>
                </select>
              </div>
              <div>
                <label className="flex gap-2 items-start text-xs text-[var(--fg-2)] cursor-pointer">
                  <input type="checkbox" checked={swappedBefore} onChange={function(e) { setSwappedBefore(e.target.checked); }} style={{ width: "auto" }} className="mt-0.5" />
                  <span>I've swapped before (I can also move back to my original centre)</span>
                </label>
                {swappedBefore && (
                  <select className="mt-2" value={originalCentre} onChange={function(e) { setOriginalCentre(e.target.value); }}>
                    <option value="">Original test centre...</option>
                    {UK_CENTRES.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
                  </select>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[var(--muted)] mb-1">Current test date <span className="text-red-500">*</span></label>
                  <input type="date" value={currentDate} min={tomorrowStr} onChange={function(e) { setCurrentDate(e.target.value); }} />
                </div>
                <div>
                  <label className="block text-xs text-[var(--muted)] mb-1">Time <span className="text-red-500">*</span></label>
                  <input type="time" value={currentTime} min="07:00" max="17:00" onChange={function(e) { setCurrentTime(e.target.value); }} />
                </div>
              </div>
              <p className="text-xs text-[var(--muted-2)] leading-relaxed">
                {isEarlier
                  ? "We'll match you with anyone at your centre (or a nearby one) who has an earlier slot and wants a later date."
                  : "We'll match you with anyone at your centre (or a nearby one) who has a later slot and wants an earlier date."}
              </p>
              <PrimaryButton onClick={handleCreateListing} loading={formLoading}>List my test</PrimaryButton>
            </div>
          </Card>
        )}

        {/* Listings */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--fg)] mb-4">Your listings</h2>
          {listings.length === 0 && !showForm && (
            <EmptyState title="No listings yet" description="List your test to start finding swap matches."
              action={<SecondaryButton onClick={startNewListing}>+ Create listing</SecondaryButton>} />
          )}
          <div className="flex flex-col gap-3">
            {listings.map(function(listing) {
              var activeMatch = (listing.matchesAsEarlier && listing.matchesAsEarlier[0]) || (listing.matchesAsLater && listing.matchesAsLater[0]);
              var canEditDelete = listing.status === "AVAILABLE" && !activeMatch;
              var isEditing = editingId === listing.id;
              var isDeleting = deleteConfirmId === listing.id;

              return (
                <Card key={listing.id}>
                  {isEditing ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[15px] font-semibold text-[var(--fg)]">Edit listing</h3>
                        <button onClick={function() { setEditingId(null); setErrors([]); }} className="text-sm text-[var(--muted-2)] hover:text-[var(--fg-2)]">Cancel</button>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div>
                          <label className="block text-xs text-[var(--muted)] mb-1">Test centre</label>
                          <select value={editForm.centre} onChange={function(e) { setEditForm(Object.assign({}, editForm, { centre: e.target.value })); }}>
                            {UK_CENTRES.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-[var(--muted)] mb-1">Test type</label>
                          <select value={editForm.testType} onChange={function(e) { setEditForm(Object.assign({}, editForm, { testType: e.target.value })); }}>
                            <option value="WEEKDAY">Weekday test (£62)</option>
                            <option value="EVENING_WEEKEND">Evening, weekend or bank holiday (£75)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-[var(--muted)] mb-1">Original centre <span className="text-[var(--faint)]">(if you swapped before)</span></label>
                          <select value={editForm.originalCentre || ""} onChange={function(e) { setEditForm(Object.assign({}, editForm, { originalCentre: e.target.value })); }}>
                            <option value="">None</option>
                            {UK_CENTRES.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-[var(--muted)] mb-1">Test date</label>
                            <input type="date" value={editForm.currentDate} min={tomorrowStr} onChange={function(e) { setEditForm(Object.assign({}, editForm, { currentDate: e.target.value })); }} />
                          </div>
                          <div>
                            <label className="block text-xs text-[var(--muted)] mb-1">Time</label>
                            <input type="time" value={editForm.currentTime} min="07:00" max="17:00" onChange={function(e) { setEditForm(Object.assign({}, editForm, { currentTime: e.target.value })); }} />
                          </div>
                        </div>
                        <PrimaryButton onClick={handleEdit} loading={editLoading}>Save changes</PrimaryButton>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={listing.type === "EARLIER" ? "earlier" : "later"}>
                              {listing.type === "EARLIER" ? "Want earlier" : "Want later"}
                            </Badge>
                            {statusBadge(listing)}
                          </div>
                          <div className="text-[15px] font-semibold text-[var(--fg)] mt-2">{listing.centre}</div>
                          <div className="text-sm text-[var(--muted-2)]">Current: {formatDate(listing.currentDate)} at {listing.currentTime}</div>
                          <div className="text-xs text-[var(--faint)] mt-1">
                            {listing.type === "EARLIER" ? "Looking for an earlier date" : "Looking for a later date"}
                          </div>
                        </div>
                        {canEditDelete && (
                          <div className="flex gap-2">
                            <button onClick={function() { startEditing(listing); }}
                              className="text-xs text-[var(--muted)] hover:text-[var(--fg)] transition px-2 py-1 rounded border border-[var(--border)] hover:border-[var(--border-strong)]">Edit</button>
                            <button onClick={function() { setDeleteConfirmId(listing.id); }}
                              className="text-xs text-[var(--muted)] hover:text-[#E24B4A] transition px-2 py-1 rounded border border-[var(--border)] hover:border-[#E24B4A]">Delete</button>
                          </div>
                        )}
                      </div>

                      {isDeleting && (
                        <div className="border-t border-[var(--border)] pt-3 mt-3">
                          <p className="text-sm text-[var(--muted)] mb-3">Are you sure you want to delete this listing?</p>
                          <div className="flex gap-2">
                            <button onClick={function() { handleDelete(listing.id); }}
                              className="text-sm px-4 py-2 rounded-lg bg-[#E24B4A] text-white font-medium hover:bg-[#c93c3c] transition">Yes, delete</button>
                            <button onClick={function() { setDeleteConfirmId(null); }}
                              className="text-sm px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-strong)] transition">Cancel</button>
                          </div>
                        </div>
                      )}

                      {activeMatch && !isDeleting && (
                        <div className="border-t border-[var(--border)] pt-3 mt-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <Badge variant={matchStatusLabel(activeMatch).variant}>
                                {matchStatusLabel(activeMatch).text}
                              </Badge>
                            </div>
                            <Link href={"/match?id=" + activeMatch.id} className="text-sm text-[#1D9E75] hover:underline">View details</Link>
                          </div>
                          {activeMatch.status === "PENDING" && activeMatch.payDeadline && new Date(activeMatch.payDeadline).getTime() > 10000 && (
                            <Countdown deadline={activeMatch.payDeadline} />
                          )}
                        </div>
                      )}
                    </>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
