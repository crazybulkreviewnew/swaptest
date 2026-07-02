"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/navbar";
import {
  ErrorBox, SuccessBanner, PrimaryButton, SecondaryButton, Badge, Card,
  EmptyState, StatCard, Countdown, PageShell, formatDate,
} from "@/components/ui";
import { getListings, createListing, selectMatch, deleteListing, editListing, startRegistrationCheckout } from "@/lib/api-client";
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
  var [currentDate, setCurrentDate] = useState("");
  var [currentTime, setCurrentTime] = useState("");
  var [startingCheckout, setStartingCheckout] = useState(false);

  var [matchResults, setMatchResults] = useState([]);
  var [matchListing, setMatchListing] = useState(null);
  var [selectingId, setSelectingId] = useState(null);

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
        type: formType, centre: centre, currentDate: currentDate, currentTime: currentTime,
      });
      if (data.matches && data.matches.length > 0) {
        setMatchResults(data.matches);
        setMatchListing(data.listing);
      } else {
        setSuccess("Listing created. No matches found yet. Check back later or click Refresh.");
      }
      setShowForm(false);
      setCentre(""); setCurrentDate(""); setCurrentTime("");
      await loadData();
    } catch (err) {
      if (err.status === 403) {
        // Not yet registered — send to the £1 checkout.
        handleStartRegistration();
      } else {
        setErrors(err.errors || ["Failed to create listing"]);
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Registration gate: start the one-time £1 Stripe checkout.
  var handleStartRegistration = async function() {
    setStartingCheckout(true);
    setErrors([]);
    try {
      var r = await startRegistrationCheckout();
      if (r && r.checkoutUrl) { window.location.href = r.checkoutUrl; return; }
      if (r && r.alreadyPaid) { await loadData(); setShowForm(true); }
    } catch (err) {
      setErrors(err.errors || ["Could not start checkout. Please try again."]);
    } finally {
      setStartingCheckout(false);
    }
  };

  // "+ New listing" entry point — paid users see the form, unpaid go to checkout.
  var startNewListing = function() {
    if (user && !user.registrationPaidAt) { handleStartRegistration(); }
    else { setShowForm(true); }
  };

  // After returning from the registration checkout, create the listing the user
  // entered during sign-up (stashed in sessionStorage), once the webhook has
  // marked them as paid.
  var finalizePendingListing = useCallback(async function() {
    var raw = sessionStorage.getItem("swaptest_pending_listing");
    if (!raw) { await loadData(); return; }
    var pending;
    try { pending = JSON.parse(raw); } catch (e) { sessionStorage.removeItem("swaptest_pending_listing"); return; }
    for (var i = 0; i < 12; i++) {
      var me = await fetch("/api/auth/me").then(function(r) { return r.json(); }).catch(function() { return {}; });
      if (me.user && me.user.registrationPaidAt) break;
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

  var handleSelectMatch = async function(targetListingId) {
    if (!matchListing) return;
    setSelectingId(targetListingId);
    setErrors([]);
    try {
      var data = await selectMatch({ myListingId: matchListing.id, targetListingId: targetListingId });
      setMatchResults([]);
      setMatchListing(null);
      setSuccess("Match created! The other person has been notified.");
      await loadData();
      router.push("/match?id=" + data.match.id);
    } catch (err) {
      setErrors(err.errors || ["Failed to select match"]);
    } finally {
      setSelectingId(null);
    }
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
        type: editForm.type, centre: editForm.centre, currentDate: editForm.currentDate,
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
              <SecondaryButton onClick={startNewListing}>
                {startingCheckout ? "…" : (user && !user.registrationPaidAt ? "List a test — £1" : "+ New listing")}
              </SecondaryButton>
            </div>
          )}
        </div>

        {user && !user.registrationPaidAt && (
          <div className="mb-5 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] text-sm text-[var(--muted)]">
            A one-time £1 registration fee is required to list a test and start finding swaps.
          </div>
        )}

        <ErrorBox errors={errors} />
        {success && <SuccessBanner>{success}</SuccessBanner>}

        {/* Match Results */}
        {matchResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-[var(--fg)] mb-1">
              {matchResults.length} match{matchResults.length !== 1 ? "es" : ""} found
            </h2>
            <p className="text-sm text-[var(--muted-2)] mb-4">
              {"Matches found at " + (matchListing ? matchListing.centre : "") + " and nearby centres. Select one to start the swap."}
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
                      <button onClick={function() { handleSelectMatch(listing.id); }} disabled={selectingId === listing.id}
                        className="px-4 py-2 rounded-lg bg-[#1D9E75] hover:bg-[#1ab87f] text-white text-sm font-semibold transition disabled:opacity-50">
                        {selectingId === listing.id ? "Selecting..." : "Select"}
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
                    className={"px-4 py-2 rounded-lg text-sm font-medium transition " + (formType === t ? "bg-[#085041] text-[var(--brand-text)] border border-[#0F6E56]" : "bg-[var(--chip)] text-[var(--muted-2)] border border-[var(--border)] hover:border-[var(--border-strong)]")}>
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
              action={<SecondaryButton onClick={startNewListing}>{user && !user.registrationPaidAt ? "List a test — £1" : "+ Create listing"}</SecondaryButton>} />
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
