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
    // Wording note: never "trade", "sell" or "slot for sale". Nobody is buying
    // anything. Two learners agree to change places and DVSA makes the change.
    standfirst:
      "Find another learner in Greater Manchester who wants your date, and take theirs. You keep your booking until you both agree, and nothing is cancelled.",

    intro: [
      "Waiting months for a practical test around Manchester has become normal. If your date sits further away than you want, and somebody else would rather push theirs back, the two of you can simply change places.",
      "That is the whole idea behind SwapTest. Nobody cancels anything and nobody buys anything. You list the test you already hold, we look through the tests other learners have listed with us, at your centre or one of the three centres DVSA lets you move to, and if you both agree we pass on each other’s details so you can each ring DVSA and make the change.",
      "It works in both directions, and that matters more than most people realise. Plenty of learners want an earlier date. Far fewer are willing to take a later one, which is why anyone happy to move back tends to be matched quickly.",
    ],

    // Something genuinely local. This is the bit that stops the page reading
    // like every other city page on the internet.
    localNote: [
      "Greater Manchester is unusually well suited to swapping because the centres sit close together. Bury, Bolton and Rochdale form one cluster in the north. Sale, West Didsbury, Cheetham Hill and Bredbury cover the south and the centre. Atherton reaches across to Bolton, Warrington and Chorley.",
      "DVSA only lets you move to one of the three nearest centres, so those clusters decide who you can realistically swap with. Someone in Sale can pair up with West Didsbury or Cheetham Hill without much thought. Someone in Atherton cannot reach Bury, even though both say Manchester on the booking.",
      "The table below shows exactly where each Manchester centre can move to, taken from the DVSA list.",
    ],

    // Used in the "waiting to swap" block when there is nothing listed yet.
    emptyState:
      "Nobody has listed a Manchester test yet today. Add yours and you will be first in the queue when someone does.",

    faqs: [
      {
        q: "Is swapping a driving test allowed by DVSA?",
        a: "Yes. Nothing is bought, sold or transferred. Each of you changes your own test through DVSA in the normal way, using the date the other person is giving up. You both ring DVSA on 0300 200 1122 and confirm the swap for your own booking, because DVSA will not move your test on somebody else’s say so. Have both sets of booking details to hand.",
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
        // Must stay in step with the pricing described on the homepage and in
        // the terms, or the site contradicts itself.
        a: (paid) =>
          paid
            ? "There is a one off £1 fee to list your test, and viewing your matches is free. If you go ahead with a swap, only the person who wants an earlier date pays an £8 fee. You only ever deal with DVSA directly for the change itself, and DVSA does not charge to move a test as long as you give the required notice."
            : "No. Listing your test, viewing your matches and swapping are all free at the moment. You only ever deal with DVSA directly for the change itself, and DVSA does not charge to move a test as long as you give the required notice.",
      },
    ],
  },
  birmingham: {
    h1: "Swap your driving test date in Birmingham",
    standfirst:
      "Five test centres sit within a few miles of each other here, which is more choice than almost anywhere in the country. Whether you can use it depends on which one you booked.",

    intro: [
      "Birmingham has more driving test centres packed into a small area than any other city outside London. Garretts Green, Kings Heath, Kingstanding, Shirley and South Yardley are all within a short drive of one another, with Wednesbury just up the road.",
      "On paper that is very good news for swapping. In practice it depends entirely on which centre your test is booked at, because DVSA decides which centres you may move between and the list is not what most people expect.",
      "SwapTest works out the answer for you. You tell us the test you already hold, we look through the tests other learners have listed with us, and we only show you a swap where DVSA will actually allow both of you to move. Nothing is cancelled, nothing is bought or sold, and we never search the DVSA booking system.",
    ],

    localNote: [
      "This is the part worth knowing before you get your hopes up. The Birmingham centres are not all connected to each other, and a few of the links only work one way, which means no swap is possible.",
      "Garretts Green, Shirley and South Yardley form the well connected middle. Any of those three can swap with the other two. Kings Heath joins Shirley and South Yardley but not Garretts Green, even though Garretts Green appears on the Kings Heath list, because the move has to be allowed in both directions.",
      "Kingstanding is the awkward one. It sits north of the others and can only pair with Garretts Green and Wednesbury. If you are at Kingstanding and hoping for South Yardley, DVSA will not allow it, however close the two look on a map. Redditch is similar from the other side: Redditch learners can move into Birmingham, but Birmingham learners cannot move out to Redditch.",
      "The table below is the definitive version, taken straight from the DVSA list.",
    ],

    emptyState:
      "No Birmingham tests are listed at the moment. Add yours and you will be the one everybody else is matched against.",

    faqs: [
      {
        q: "Which Birmingham test centres can swap with each other?",
        a: "Garretts Green, Shirley and South Yardley can all swap with each other. Kings Heath can swap with Shirley and South Yardley. Kingstanding can only swap with Garretts Green and Wednesbury. The rule is that each of you has to be allowed to move to the other person's centre, so a link that only works one way is no good to anybody.",
      },
      {
        q: "I am at Kingstanding. Why can I not swap with South Yardley?",
        a: "Because the permission only runs one way. South Yardley is on the list of centres you can move to from Kingstanding, but Kingstanding is not on the list for South Yardley. A swap needs both people to be able to move, so DVSA would refuse it. From Kingstanding your realistic options are Garretts Green and Wednesbury.",
      },
      {
        q: "Can I swap between Birmingham and Coventry or Redditch?",
        a: "Not usually. Coventry pairs with Nuneaton, Hinckley and Warwick rather than Birmingham. Redditch can move into Birmingham but Birmingham cannot move out to Redditch, so a swap between the two will not work. The one exception is if Redditch or Coventry is the centre you originally booked at, because DVSA always lets you move back to that.",
      },
      {
        q: "How long does it take to arrange a swap?",
        a: "The matching part is usually quick if somebody suitable has listed. After that you have 24 hours to agree between you, then the DVSA call takes about ten minutes each. The thing that catches people out is the notice period, not the paperwork.",
      },
      {
        q: "What happens if the other person never replies?",
        a: "The match expires after 24 hours and both tests go straight back into the pool, so you have lost nothing but a day. We send reminders before that happens, because a missed email is the most common reason a good swap falls through.",
      },
      {
        q: "Do I need to tell my driving instructor?",
        a: "You do not have to, but it is worth doing before you agree. Your instructor may be booked with somebody else on the new date, and if you use their car for the test that matters more than the date itself.",
      },
    ],
  },
  london: {
    h1: "Swap your driving test date in London",
    standfirst:
      "London has 25 test centres, which sounds like plenty of choice. In practice your test can only be swapped with one to three specific centres, and which ones depends entirely on where you booked.",

    intro: [
      "Most people picture London as one big pool. List your test, wait for somebody anywhere in the city, done. It is worth knowing before you start that it does not work like that at all.",
      "DVSA only lets you move your test to one of the three centres nearest to yours, and a swap needs that permission to run in both directions. Once you apply that rule across London, the city stops being a network and becomes a lot of very small, separate pairings. Four London centres have exactly one centre they can swap with. Morden is one of them, and the answer is Tolworth.",
      "So the honest question is not how busy London is. It is how many people are listed at the handful of centres yours actually pairs with. SwapTest works that out for you and only ever shows a swap DVSA will permit, using the tests other learners have listed with us. We never search the DVSA booking system.",
    ],

    localNote: [
      "There is no such thing as a London wide swap. Someone at Morden and someone at Wood Green could both wait a year with perfectly matching dates and never be allowed to trade places, because neither centre appears on the other's list.",
      "The narrowest centres are Morden, Erith, Loughton and Slough. Each has a single possible partner: Tolworth, Belvedere, Chingford and Uxbridge respectively. If your test is at one of those four, everything depends on that one other centre, so listing early is worth far more than it is elsewhere.",
      "It is not all bad news. Several London centres pair outwards to places you might not expect, because DVSA's lists ignore the boundary. Tolworth reaches Chertsey and Isleworth. Uxbridge reaches Slough. Brentwood reaches Basildon. Wood Green reaches Tottenham. Those count as ordinary swaps.",
      "The table below is the exact list for every London centre, taken from the DVSA data. Where a centre is marked one way, the permission does not run both ways and no swap is possible.",
    ],

    emptyState:
      "No London tests are listed at the moment. Add yours and you will be first in line at your centre, which counts for a lot when the pairings are this narrow.",

    faqs: [
      {
        q: "Can I swap a test in north London for one in south London?",
        a: "No. DVSA only lets you move to one of the three centres nearest your own, and nothing joins north and south London. It is not a SwapTest restriction and waiting will not change it. Your options are the centres directly paired with yours, which the table on this page lists in full.",
      },
      {
        q: "My test is at Morden. Who can I swap with?",
        a: "Tolworth, and nobody else. Morden is one of four London centres with a single possible partner, so a swap depends entirely on somebody at Tolworth wanting to move the other way. It is worth listing early and worth being flexible about the date, because you will not get many chances.",
      },
      {
        q: "Why can I not swap with a centre that is only a few miles away?",
        a: "Because the DVSA list is not simply the closest three by distance, and the permission has to work both ways. Bromley and Mitcham can swap. Morden and Mitcham cannot, even though they are close. If a centre is not on your row in the table, DVSA will refuse the change however sensible it looks on a map.",
      },
      {
        q: "Why are Slough and Chertsey treated as London?",
        a: "DVSA groups them that way in its own nearest centre lists rather than by where the boundary sits, and it works in your favour. A learner at Uxbridge can swap with Slough and one at Tolworth can swap with Chertsey, even though neither is inside London.",
      },
      {
        q: "Does being in London mean a better chance of swapping?",
        a: "Not by itself. London has more centres than anywhere else in the country, but you can still only reach the one to three paired with yours, so what matters is how busy those are. A learner in a smaller city with three well connected centres can easily have better odds than someone at Morden.",
      },
      {
        q: "Can I move my test to a quieter centre further out?",
        a: "Not any more. From 9 June 2026 you can only move to one of the three nearest centres or the one you originally booked at, which was brought in to stop people booking at centres they never intended to travel to. The table here shows everywhere you can actually reach.",
      },
    ],
  },
};

export function getCopy(slug) {
  return COPY[slug] || null;
}
