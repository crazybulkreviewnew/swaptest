// ============================================================
// Hand-written copy for each city landing page.
// ============================================================
// One entry per city. Write it yourself. Do not template it, do not run the
// same sentences through with the place name swapped, because that is exactly
// what search engines filter out as doorway pages.
//
// Say something true about the place. Name the actual centres. If you have
// nothing specific to say about a city, do not build the page.
// ============================================================

export const COPY = {
  manchester: {
    h1: "Swap your driving test date in Manchester",
    // Shown under the h1. Keep it to two sentences.
    standfirst:
      "Trade your test slot with another learner in Greater Manchester. You keep your booking until you both agree, and nothing is cancelled.",

    intro: [
      "Waiting months for a practical test around Manchester has become normal. If your date sits further away than you want, and somebody else has a slot they would rather push back, the two of you can simply trade.",
      "That is the whole idea behind SwapTest. Nobody cancels anything. You list the test you already hold, we look for someone at your centre or one of the three centres DVSA lets you move to, and if you both agree we pass on each other's details so you can ring DVSA and make the change.",
      "It works in both directions, and that matters more than most people realise. Plenty of learners want an earlier date. Far fewer are willing to take a later one, which is why anyone happy to move back tends to get matched quickly.",
    ],

    // Something genuinely local. This is the bit that stops the page reading
    // like every other city page on the internet.
    localNote: [
      "Greater Manchester is unusually well suited to swapping because the centres sit close together. Bury, Bolton and Rochdale form one cluster in the north. Sale, West Didsbury, Cheetham Hill and Bredbury cover the south and the centre. Atherton reaches across to Bolton, Warrington and Chorley.",
      "DVSA only lets you move to one of the three nearest centres, so those clusters decide who you can realistically trade with. Someone in Sale can swap with West Didsbury or Cheetham Hill without much thought. Someone in Atherton cannot reach Bury, even though both say Manchester on the booking.",
      "The table below shows exactly where each Manchester centre can move to, taken from the DVSA list.",
    ],

    // Used in the "waiting to swap" block when there is nothing listed yet.
    emptyState:
      "Nobody has listed a Manchester test yet today. Add yours and you will be first in the queue when someone does.",

    faqs: [
      {
        q: "Is swapping a driving test allowed by DVSA?",
        a: "Yes. You are not selling or transferring a booking. Each of you changes your own test through DVSA in the normal way, using the date the other person is giving up. One of you rings DVSA on 0300 200 1122 with both sets of booking details and it takes about ten minutes.",
      },
      {
        q: "How much notice do I need to give?",
        a: "At least 10 full working days before the earlier of the two tests. Monday to Saturday count as working days. Sundays and bank holidays do not. If you leave it later than that you lose the test fee, so SwapTest will not offer you a swap once that window has closed.",
      },
      {
        q: "How many times can I change my test?",
        a: "Twice. Since 31 March 2026 a car test booking can only be changed two times, after which you have to cancel and book again from scratch. A swap uses one of those changes, so it is worth keeping one in hand.",
      },
      {
        q: "Which Manchester centres can I move my test to?",
        a: "Your own centre, the three nearest to it, or the centre you originally booked at if you have moved before. The table on this page lists the three nearest for every Manchester centre.",
      },
      {
        q: "What if I want a later date rather than an earlier one?",
        a: "List it. You are the person everyone else is waiting for. Most learners on SwapTest want to bring their test forward, so anyone happy to move back is usually matched fastest.",
      },
      {
        q: "Does it cost anything?",
        // Answered at render time from the payments switch, so this cannot go
        // stale the day charging is turned on. See lib/payments.js.
        a: (paid) =>
          paid
            ? "Membership is £1 a week and covers listing your test, viewing your matches and as many swaps as you need. There is no separate fee for a swap. You only ever deal with DVSA directly for the change itself, and DVSA does not charge to move a test as long as you give the required notice."
            : "No. Listing your test, viewing your matches and swapping are all free at the moment. You only ever deal with DVSA directly for the change itself, and DVSA does not charge to move a test as long as you give the required notice.",
      },
    ],
  },
};

export function getCopy(slug) {
  return COPY[slug] || null;
}
