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
    // Written per city. The generic template read identically on all seven
    // pages apart from the place name, wasting the one line in search results
    // that we fully control. Aim for under 160 characters.
    metaDescription:
      "Swap a driving test in Manchester. Eight centres from Bury to Sale, and we show you which ones DVSA will actually let you swap between.",
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
    metaDescription:
      "Swap a driving test in Birmingham. Five centres within a few miles, but they do not all connect. See which ones can genuinely swap with each other.",
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
    metaDescription:
      "Swap a driving test in London. 25 centres, but yours pairs with only one to three of them. Find out which, and who is waiting.",
    h1: "Swap your driving test date in London",
    standfirst:
      "London has 25 test centres, which sounds like plenty of choice. In practice your test can only be swapped with one to three specific centres, and which ones depends entirely on where you booked.",

    intro: [
      "Most people picture London as one big pool. List your test, wait for somebody anywhere in the city, done. It is worth knowing before you start that it does not work like that at all.",
      "DVSA only lets you move your test to one of the three centres nearest to yours, and a swap needs that permission to run in both directions. Once you apply that rule across London, the city stops being a network and becomes a lot of very small, separate pairings. Four London centres have exactly one centre they can swap with. Morden is one of them, and the answer is Tolworth.",
      "So the honest question is not how busy London is. It is how many people are listed at the handful of centres yours actually pairs with. SwapTest works that out for you and only ever shows a swap DVSA will permit, using the tests other learners have listed with us. We never search the DVSA booking system.",
    ],

    localNote: [
      "There is no such thing as a London wide swap. Someone at Morden and someone at Wood Green could both wait a year with perfectly matching dates and never be allowed to change places, because neither centre appears on the other's list.",
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
  northampton: {
    metaDescription:
      "Swap a driving test in Northampton. Northampton, Kettering and Wellingborough all pair with each other, which makes swaps here unusually simple.",
    h1: "Swap your driving test date in Northampton",
    standfirst:
      "Northampton, Kettering and Wellingborough all pair up with each other, which makes this one of the more straightforward places in the country to swap a test.",

    intro: [
      "Not every part of the country is well set up for swapping. Some centres are stranded, and some pair up in only one direction so no swap is possible at all. Northamptonshire got lucky.",
      "Northampton, Kettering and Wellingborough form a clean triangle. Each one can move to the other two, and each of those can move back, which is what a swap actually needs. Three centres, all genuinely open to each other, sitting within about twenty miles.",
      "That matters more than the raw number of people waiting. A busy centre with nobody to pair with is worth less than a quiet one that connects properly, and this corner of the country connects properly.",
    ],

    localNote: [
      "The triangle is the useful part. If your test is at Northampton, Kettering or Wellingborough, the other two are open to you and you are open to them. Wellingborough is the best connected of the three because it also reaches Bedford.",
      "Two nearby centres look like options and are not. Rugby lists Hinckley, Coventry and Nuneaton, but none of those three list Rugby back, so a learner at Rugby cannot swap with anybody at all. It is the clearest dead end we have found anywhere in the country. Peterborough is a milder version: it lists Kettering, but Kettering does not list Peterborough, so that one does not work either.",
      "Bedford sits on the edge. It can pair with Wellingborough, and through nobody else in this group, so a Bedford learner is really looking at Wellingborough or nothing locally.",
      "If you are at Rugby or Peterborough, the honest advice is that a swap is not going to happen from where you are. The one thing that would change it is moving back to a centre you originally booked at, which DVSA always allows.",
    ],

    emptyState:
      "Nothing is listed here today. The triangle works well when people use it, so adding yours is worth doing even if it looks quiet.",

    faqs: [
      {
        q: "Which centres can I swap between around Northampton?",
        a: "Northampton, Kettering and Wellingborough can all swap with each other. Wellingborough can also swap with Bedford. Those are the only combinations that work in this area, because a swap needs both people to be allowed to move and the rest of the nearby centres do not pair up both ways.",
      },
      {
        q: "I am at Rugby. Can I swap with Coventry or Northampton?",
        a: "Unfortunately not. Rugby can move to Hinckley, Coventry and Nuneaton, but none of those three can move to Rugby, so there is no pairing that works in both directions. Northampton lists Rugby but Rugby does not list Northampton back, so that fails too. Rugby is the one centre we have found with no possible swap partner at all.",
      },
      {
        q: "Can I swap between Kettering and Peterborough?",
        a: "No. Peterborough can move to Kettering, but Kettering cannot move to Peterborough, and a swap needs the permission to run both ways. Peterborough pairs with Boston instead.",
      },
      {
        q: "Is a smaller area worse for swapping than a big city?",
        a: "Not necessarily, and Northamptonshire is the example. What matters is whether your centre pairs properly with others, not how many centres are nearby. There are learners in London whose centre has exactly one possible partner. Here you have two, and they are genuinely usable.",
      },
      {
        q: "How far apart are these centres?",
        a: "Northampton, Kettering and Wellingborough sit within about twenty miles of each other, so swapping between them rarely means a difficult journey on test day. Worth checking you are happy to drive to the other centre before you agree, since the roads and routes will be unfamiliar.",
      },
      {
        q: "What if nobody is listed at my centre yet?",
        a: "List anyway. Matching runs whenever somebody new joins, and we email you the moment a swap becomes possible, so you do not have to keep checking. In a well connected area like this one, being listed early usually means being first in line.",
      },
    ],
  },
  southampton: {
    metaDescription:
      "Swap a driving test in Southampton. A chain of centres runs along the Solent from Basingstoke to Chichester. See which ones you can swap with.",
    h1: "Swap your driving test date in Southampton",
    standfirst:
      "Southampton sits in the middle of a chain of centres running along the Solent, which gives it more genuine options than most cities its size.",

    intro: [
      "Southampton Maybush is one of the better connected test centres in the country. It pairs properly with Portsmouth, Lee On The Solent and Winchester, and each of those can move back, which is what a swap actually needs.",
      "Better still, Southampton, Portsmouth and Lee On The Solent all pair with each other as well. Three centres, any combination, all valid. That is unusual and it is worth knowing if your test is at one of them.",
      "The chain then carries on outwards. Chichester joins on through Portsmouth, and Basingstoke joins on through Winchester, so the run of centres stretches from West Sussex to the edge of Berkshire.",
    ],

    localNote: [
      "Think of it as a line rather than a circle. Basingstoke to Winchester to Southampton to Lee On The Solent and Portsmouth, then out to Chichester. Each link works both ways, but only between neighbours. Somebody at Basingstoke cannot swap with somebody at Chichester, even though both sit on the same chain, because a swap is a direct pairing and never a chain of them.",
      "The middle of the line is the best place to be. Southampton and Portsmouth each have three centres they can pair with, which is as good as it gets outside the largest cities.",
      "Two nearby towns look like they belong and do not. Poole and Salisbury both list Southampton as somewhere they can move to, but Southampton does not list either of them in return, so a swap between them cannot happen. It is a frustrating one because the move looks perfectly reasonable on a map, and it is exactly the sort of thing worth knowing before you get your hopes up. Poole pairs with Dorchester instead, and Salisbury pairs with Trowbridge.",
    ],

    emptyState:
      "Nothing is listed along the Solent today. The chain here works well when people use it, so it is worth adding yours.",

    faqs: [
      {
        q: "Which centres can I swap with from Southampton?",
        a: "Portsmouth, Lee On The Solent and Winchester. All three can move to Southampton and Southampton can move to all three, so any of them is a genuine option. Southampton is one of the better connected centres in the country in that respect.",
      },
      {
        q: "Can I swap between Southampton and Poole?",
        a: "No, and this catches people out. Poole lists Southampton as a centre it can move to, but Southampton does not list Poole in return, and a swap needs the permission to run both ways. If your test is at Poole your realistic swap partner is Dorchester.",
      },
      {
        q: "Can I swap between Southampton and Salisbury?",
        a: "No, for the same reason as Poole. Salisbury can move to Southampton but not the other way round. Salisbury pairs with Trowbridge instead, which is a longer drive but is at least a swap that DVSA will actually allow.",
      },
      {
        q: "Can I swap between Portsmouth and Winchester?",
        a: "No. Winchester lists Portsmouth, but Portsmouth does not list Winchester back. Both of them can pair with Southampton though, so Southampton is the bridge between the two rather than a direct swap.",
      },
      {
        q: "Is it worth swapping to a centre I have never driven at?",
        a: "That is a personal call and worth thinking about properly. The roads and the test routes will be unfamiliar, and around here the difference between Portsmouth and Winchester is meaningful in driving terms. Some learners take an earlier date anywhere. Others would rather wait for their own centre. Both are reasonable.",
      },
      {
        q: "What if my test is on the Isle of Wight?",
        a: "Island centres are not part of the Solent chain, so a swap to the mainland is not an option through the nearest centre rules. The one exception, as everywhere, is that DVSA always lets you move back to the centre you originally booked at.",
      },
    ],
  },
  edinburgh: {
    metaDescription:
      "Swap a driving test in Edinburgh. Currie connects Musselburgh, Livingston and Dunfermline, including across the Forth. See who you can swap with.",
    h1: "Swap your driving test date in Edinburgh",
    standfirst:
      "Almost everything in this part of Scotland runs through Currie. If your test is there you have the most options in the region, and if it is not, Currie is usually the centre you are aiming at.",

    intro: [
      "Edinburgh has two test centres, Currie in the south west and Musselburgh out to the east, and the good news is that they pair with each other. That is not something every city gets. Birmingham has five centres and some of them cannot swap at all.",
      "Currie is also the busiest junction in the east of Scotland. It pairs with Musselburgh, with Livingston out towards the M8, and across the Firth of Forth with Dunfermline. Three genuine options from one centre.",
      "That Forth crossing is worth a mention on its own. A swap between Currie and Dunfermline is perfectly allowed, so if you are willing to drive over the bridge on test day, the pool you can reach is noticeably bigger than it first looks.",
    ],

    localNote: [
      "The shape here is a hub with spokes rather than a ring. Musselburgh, Livingston and Dunfermline all pair with Currie, but they do not pair with each other, so Currie is the middle of everything and the others are not connected sideways.",
      "That has a practical consequence. If your test is at Musselburgh, your options are Currie and Haddington, and that is it. Livingston reaches Currie and Grangemouth. Neither of them can reach the other, even though both are a short drive from the city.",
      "Kirkcaldy is the one to be careful about. It lists Currie and Perth as places it can move to, but neither lists Kirkcaldy back, so a swap with either is impossible. Dunfermline is the only centre Kirkcaldy can genuinely pair with.",
      "If you are outside the city, Dunfermline is the strongest place to be after Currie. It reaches Currie, Grangemouth and Kirkcaldy, which is three usable partners and better than most centres manage.",
    ],

    emptyState:
      "Nothing is listed around Edinburgh today. Currie connects to more centres than most, so a listing here tends not to sit unnoticed for long.",

    faqs: [
      {
        q: "Can I swap between the two Edinburgh test centres?",
        a: "Yes. Currie and Musselburgh pair with each other in both directions, so a swap between them is allowed. It is worth knowing that not every city works this way. Some cities have centres a few miles apart that DVSA will not let you move between.",
      },
      {
        q: "Can I swap a test in Edinburgh for one in Fife?",
        a: "Yes, if you are at Currie and they are at Dunfermline. That pairing works both ways, so a swap across the Firth of Forth is allowed. Musselburgh and Livingston cannot reach Fife, and Kirkcaldy cannot reach Edinburgh at all.",
      },
      {
        q: "My test is at Musselburgh. Who can I swap with?",
        a: "Currie and Haddington. Musselburgh lists Livingston as somewhere it can move to, but Livingston does not list Musselburgh back, so that one will not work as a swap. Two options is fewer than Currie gets, but both are genuinely usable.",
      },
      {
        q: "Can I swap between Livingston and Musselburgh?",
        a: "No. They sit on opposite sides of the city and neither appears on the other's list in a way that works both ways. Both can reach Currie though, so Currie is the common ground rather than a direct swap between the two.",
      },
      {
        q: "Why can I not swap my Kirkcaldy test for Edinburgh?",
        a: "Kirkcaldy can move to Currie, but Currie cannot move to Kirkcaldy, and a swap needs the permission to run both ways. Dunfermline is the centre Kirkcaldy can properly pair with, and Dunfermline in turn pairs with Currie, though that does not chain into a swap for you.",
      },
      {
        q: "Do Scottish test centres follow the same rules as England?",
        a: "Yes. The 10 working day notice period, the limit of two changes per booking and the nearest centres rule all apply the same way across Great Britain. Northern Ireland runs a separate system, so those rules do not apply there.",
      },
    ],
  },
  glasgow: {
    metaDescription:
      "Swap a driving test in Glasgow. The city splits in two and only Bishopbriggs reaches both halves. See which centres can genuinely swap.",
    h1: "Swap your driving test date in Glasgow",
    standfirst:
      "Glasgow has three test centres, and they do not all connect to each other. Which half of the city you are in decides who you can swap with.",

    intro: [
      "Anniesland and Shieldhall sit on the west side and pair with each other. Baillieston sits out east and pairs with neither of them. So although all three say Glasgow on the booking, a learner at Anniesland cannot swap with a learner at Baillieston.",
      "One centre holds the city together. Bishopbriggs pairs with all three, which makes it the best connected test centre in Glasgow and the only one that reaches both halves.",
      "That does not mean Bishopbriggs joins the two sides up for everybody else. A swap is a direct pairing between two centres, never a chain through a third, so Anniesland and Baillieston stay out of reach of each other no matter what sits between them.",
    ],

    localNote: [
      "Think of it as two groups and a bridge. West is Anniesland, Shieldhall and Paisley. East is Baillieston, Airdrie and Hamilton. Bishopbriggs is the bridge, and it is the only centre in the city with all three Glasgow centres open to it.",
      "Paisley is the strongest option on the west side after the city centres. It pairs with both Anniesland and Shieldhall and with Dumbarton, which is three usable partners. Hamilton is its equivalent in the east, reaching Baillieston, Airdrie and East Kilbride.",
      "Several nearby towns look connected to Glasgow and are not. East Kilbride lists Baillieston and Shieldhall, and neither lists it back, so Hamilton is the only swap it can make. Dumbarton lists Anniesland and Shieldhall and can only actually pair with Paisley. Greenock lists Paisley and cannot pair with it either.",
      "Lanark is the hardest case in Scotland. It lists Hamilton, Airdrie and Livingston, and not one of the three lists Lanark in return, so there is no swap available from Lanark at all. The only route out is moving back to a centre you originally booked at, which DVSA always permits.",
    ],

    emptyState:
      "Nothing is listed around Glasgow today. Bishopbriggs reaches more of the city than any other centre, so a listing there rarely stays unseen for long.",

    faqs: [
      {
        q: "Can I swap between Glasgow's test centres?",
        a: "Sometimes. Anniesland and Shieldhall pair with each other, and Bishopbriggs pairs with all three Glasgow centres. Anniesland and Baillieston cannot swap with each other, and neither can Shieldhall and Baillieston, because neither appears on the other's list.",
      },
      {
        q: "Which Glasgow centre gives me the most options?",
        a: "Bishopbriggs. It is the only centre that pairs with Anniesland, Shieldhall and Baillieston, so it reaches both sides of the city. If you have a choice of where to book in the first place, that is worth knowing.",
      },
      {
        q: "I am at East Kilbride. Who can I swap with?",
        a: "Hamilton, and only Hamilton. East Kilbride lists Baillieston and Shieldhall as centres it can move to, but neither lists East Kilbride back, so those do not work as swaps. Hamilton is well connected in its own right, so it is not a bad single option to have.",
      },
      {
        q: "Can I swap a test at Lanark?",
        a: "Realistically no. Lanark lists Hamilton, Airdrie and Livingston, and none of those three list Lanark in return, so no pairing works in both directions. It is the only centre in Scotland we have found with no possible swap partner. The one exception is moving back to a centre you originally booked at.",
      },
      {
        q: "Why can Greenock not swap with Paisley?",
        a: "Greenock can move to Paisley, but Paisley cannot move to Greenock, so the permission only runs one way. Greenock's actual partners are Dunoon and Rothesay, both of which involve a ferry, so it is worth thinking carefully before agreeing to one.",
      },
      {
        q: "Do the same DVSA rules apply in Scotland?",
        a: "Yes. The 10 working day notice, the limit of two changes per booking and the nearest centres rule all work the same way across Great Britain. Northern Ireland runs its own separate system.",
      },
    ],
  },
};

export function getCopy(slug) {
  return COPY[slug] || null;
}
