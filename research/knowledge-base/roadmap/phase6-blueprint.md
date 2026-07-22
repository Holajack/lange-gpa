# Phase 6 Blueprint — "Ever Participating, Ever Growing" / Self-Sustaining Growth

Nuri (lange-gpa), project root `/Volumes/LaCie/GPA_Language_Learning`. Compiled 2026-07-18.

Grounded in `research/knowledge-base/phase6.md` (Thomson's Phase 6 / Phase un-6 guide, 1,739 lines source), cross-checked against `app-implementation.md` (session room, sessionFlow state machine, practice games, placement, progression) and `nurturer-side.md` (Nurturer Studio, Convex rails). Existing infra referenced throughout: `convex/messages.ts`, `convex/requests.ts`, `convex/calls.ts`, `src/lib/nurturers.ts`, `src/app/(app)/nurture/`, `sessionFlow.ts` + the AI nurturer Nuri, `convex/credits.ts`.

**Framing note carried through every section**: Phase 6 is structurally different from Phases 1–5. It has no prescribed curriculum ("I've reverted to giving some principles and a couple of examples"), no fixed session length, and its two central mechanisms are (a) a **weekly lifestyle budget** (most of Phase 6 is *not* a session at all — it's how you spend ~100 waking hours), and (b) a **discourse-mastery pipeline** the grower runs per communication situation (toasting, car repair, beauty parlor, or any custom target) with a real eloquent host person. The helper is no longer a trained nurturer or even a single mentor — it's explicitly a **plural, lifestyle-embedded community**: an eloquent discourse partner, a subject-matter professor who doesn't know the grower's language, real service professionals (mechanic, beautician, toastmaster), a reading-club partner, coworkers, neighbors, diaspora members. Any blueprint that tries to force Phase 6 into "book one nurturer, run one session type" contradicts the source guide.

---

## 1. Core feature mapping

### 1.1 Needs Analysis — discourse-target picker
**Guide basis**: §6 item 1 — brainstorm communication situations with nurturer + expats + host people; score each 0–5 frequency, 0–5 importance, minus 0–10 existing skill; sum; high totals = targets. Worked example: taxi=0, toasts=4, car repair=4, beauty parlor=7, football=−1.

**Feature**: `/courses/ever-growing` → **Needs Analysis wizard** (`p6-needs`, currently a locked "Method preview" card with no `practiceHref`).
- Grower sees: a scored table (Communication situation | How often 0–5 | How important 0–5 | How well already 0 to −10 | Total), pre-seeded with a starter list of common situations (toasts, car repair, beauty/barber, doctor visits, landlord disputes, kids'-school events) that the grower can edit/add to, sorted live by total score.
- Helper (mentor/discourse partner) sees: the same table in a shared view if invited into the session (co-scoring, matching the guide's "brainstorm ... with nurturer + expats + host people"); can add situations the grower wouldn't think of.
- Recorded: the finished ranked list becomes the grower's **Discourse Track backlog** — each high-scoring situation becomes a launchable "Discourse Track" (see 1.2).
- Progress: no hours attach to the wizard itself; it's a planning artifact, one-time per situation (re-run periodically as skill scores rise).

### 1.2 The Discourse-Mastery Pipeline (the phase's actual curriculum)
**Guide basis**: §2(b) — Prelude → Stage A (GP-led, 10–20h) → Stage B (nurturer-led) → Scripts of Life → Role-play → Shared experience + Reminiscing. This is the single most load-bearing structure in Phase 6 and corresponds to the app's `p6-rare` ("Rare-but-Urgent Discourses"), currently one flattened 40-minute activity.

**Feature**: a new **Discourse Track** entity/screen (`/courses/ever-growing/track/[id]` or similar), one per Needs-Analysis target, structured as a **gated 6-stage pipeline** (explicit stage names shown to the grower, matching the app's existing "parts as numbered stages" pattern from `/courses/[slug]`):

1. **Prelude — Domain Vocabulary Fill**: reuses the existing Phase-1 Dirty Dozen engine (`sessionFlow.ts` `buildDeck`/`buildMeetingDeck`) against a *new domain deck* built for this discourse (e.g., car parts: fuel injector, water pump, lug wrench, lug nut). Grower sees the same tap-the-picture mechanic already proven in `/practice/vocabulary`; **listen-and-point recordings are captured and saved to the track's Listening Library** — the guide explicitly says "You could also do a variety of listen and point activities (and record them)."
2. **Stage A (GP in the lead)** — repeatable cycle, gated to run **10–20 hours before Stage B unlocks** (guide-explicit hour gate, mirroring the Phase-1-parallel "A/B pattern"):
   - Step 1: grower **records themselves live** performing the discourse act (record button, no script, "don't worry if you hem and haw").
   - Step 2: **Record-Yourself-for-Feedback review with the real discourse partner** — a shared annotation view where the partner listens to the grower's recording and leaves timestamped improvement notes, negotiating meaning where the grower's intent is unclear. This step is not simulable (see §2).
   - Step 3: the partner **records an IMPROVED version of the grower's own text** — pointedly not their own spontaneous version (the guide's central design insight: "her version founded on your version keeps it in your growth zone"). This recording is tagged and saved to the Listening Library with a **pre-next-meeting replay reminder**.
   - The app tracks cumulative Stage-A hours per track (via `completeActivity`-style logging scoped to the track id) and shows a progress bar toward the 10–20h Stage-B unlock.
3. **Stage B (partner in the lead)** — partner performs/records a fresh example from the brainstormed list; grower **massages** it solo (pause/rewind/lookup — see the Massage Player in §5); at the next live/async turn the grower performs a *similar* act "in your own words," never verbatim — enforced in the UI as a "record your own retelling" step, not a playback-and-repeat step.
4. **Scripts of Life** (Phase-3 technique reapplied): partner narrates the whole venue experience in small steps (recorded); grower expands/retells in own words next turn. Reuses whatever Scripts-of-Life tooling gets built for Phase 3 (flagged as shared infra in §5 — Phase 3 currently has no authoring tool for this either, per `nurturer-side.md` gap list).
5. **Role-play**: partner plays the grower, grower plays the host professional (beautician/mechanic/toastee), full act, then switch. In-app: a turn-based recorded role-play mode, essentially the same session-room recording primitive with role labels instead of new mechanics.
6. **Shared Experience + Reminiscing (capstone)** — the grower and partner actually go to the real venue together; back home, they do the **Phase 3 Reminiscing Activity** (async voice exchange works well here — see §4). This step is logged as "capstone completed" and is the only step that structurally requires being physically co-located with a real host person; the app's job is to *schedule and remind*, not to simulate.

**What gets recorded**: every step above produces at least one recording; all feed a per-track **Listening Library** (see §5) with two standing replay triggers the guide specifies verbatim: *before every next meeting*, and *before a real-life performance of the discourse* (event-triggered relisten, e.g. the night before an actual wedding toast).

**Progress tracking**: per-track Stage-A hour counter (10–20h gate), a stage-completion checklist (Prelude/A/B/Scripts/Role-play/Capstone), and a rollup on the Phase 6 course page showing how many tracks are active/complete — replacing the current single flattened `p6-rare` card.

### 1.3 100/300-Hours-to-a-New-You Meter
**Guide basis**: §2(c), §6 item 21 (Leaver's rule) — 100 qualifying hours at low proficiency, 300 at higher, counted only if hours meet **5 named characteristics**: (1) challenging-but-comprehensible speech, (2) heavy interaction/negotiating meaning, (3) new listening vocabulary growing hourly, (4) growing host-world knowledge, (5) much talking with help toward host-like expression.

**Feature**: a meter (dashboard widget, not a game) that only increments when an hour is logged against an activity **tagged as meeting all 5 characteristics** — i.e., Discourse Track hours, Expert Interviewing, content-course hours — explicitly *not* generic small talk or unstructured chat (the guide's own anti-pattern warning: paying a nurturer for "the same sort of unstructured conversation you had with the house helper" doesn't count). Grower sees a progress bar to 100 or 300 depending on a self-reported/placement-derived proficiency tier, with the guide's own caveat surfaced in copy: "if 300 is out of reach, 20–30 hours in one discourse still produces real growth."

### 1.4 Hole-Finding Studio
**Guide basis**: §6 item 13 — silent-film live narration (Chaplin, Mr. Bean, *Kelin*); deliberately finding what you can't say; reveals host-vs-home meaning gaps; "fun and rewarding for those who thought they were more advanced than they actually were."

**Feature**: fully detailed in §2 — this is the phase's best pure-solo/AI-compatible activity, no human partner required at all in the guide itself.

### 1.5 Un-6 Diagnostic & Remedial Router
**Guide basis**: §1/§7 — the two-condition definition, the litmus test ("can you follow two host people talking who aren't including you?"), and the explicit re-entry rule: "go back and pick up where you quit" (Phase 2 picture stories, Phase 3 Scripts of Life/World Stories/Reminiscing, then Phase 4 interviews; Phase 1 as "your first 100 hours to a new you" at very low levels).

**Feature**: an entry gate at the top of `/courses/ever-growing` — a short comprehension check (ideally built on real native-to-native recordings, see §5 dependency on Phase 5's collection) implementing the litmus test, plus the two-condition self-assessment ("Do you understand most of what's said around you?" / "Are you actually hearing a lot of host speech day to day?"). Result routes the grower one of two ways:
- **Phase 6 (both conditions true)**: straight into the lifestyle-budget dashboard + discourse tracks.
- **Phase un-6 (either condition false)**: a **Remedial Pickup** router (`p6-remedial`) that sends the grower back into *already-built* practice games from earlier phases at the point they actually stopped growing — this is cheap to build because it reuses `/practice/vocabulary`, `/practice/listening`, `/practice/speaking`, `/practice/repeat` and whatever Phase 2/3 tooling exists, just re-entered from a Phase 6 context with a "you're doing Phase 2 activities again, and that's the right move" framing plus the guide's explicit **10 new words/hour** remedial target surfaced as a live counter.

### 1.6 Weekly Lifestyle-Hours Dashboard
**Guide basis**: §2(a) — "What percentage of your waking week belongs to the host people?" ~100 waking hours/week (16×7); benchmark ≥10%, ideally ≥20%; Phase 6 optional acceleration ~5h/week special-growth; Phase un-6 needs "many hours," 2–3h/week explicitly "won't work."

**Feature**: a simple weekly self-report widget — grower logs an estimated host-life percentage for the week (a slider or hour-tally, not a surveillance feature), shown against the 10%/20% benchmark lines, plus a separate tracker for "special-growth hours this week" feeding the 100/300 meter (§1.3). This is the actual "session plan" of Phase 6 per the guide and currently has zero app representation (`p6-hours` exists as a locked card with no logging behind it).

### 1.7 Extensive Reading + Recorded Word Discussion
**Guide basis**: §6 item 19 — read independently with a monolingual host dictionary; partner reads the same material independently; discuss together; **record the discussion** to reinforce new words. Diglossic languages (Arabic) require spoken-register discussion of written text.

**Feature**: `p6-read` gets a real flow: grower logs what they're reading (title/link, self-paced, no in-app reader needed for MVP), flags new words as they go (feeds the same word-history store flagged as a Phase-1 gap in `phase1-completion-plan.md` M11 — this is shared infra, see §5), then books a **recorded discussion session** with their partner scoped to that reading, saved to the Listening Library. Explicitly do NOT build a "read aloud to your nurturer" flow — the guide calls that "a pretty clear waste of money."

### 1.8 Content Course / Expert Interviewing (`p6-expert`)
**Guide basis**: §6 items 12 & 20 — two distinct prescriptions merged in the app today: (a) Phase-4-style expert interviewing (toastmaster, mechanic, beautician) as a low-creativity fallback with strong impact; (b) Leaver's premier model — a ~300-hour content course with a host subject-matter professor who does not know the grower's language, or lighter versions (audit a university course, take a host-taught hobby course).

**Feature**: split into two distinct cards on the course page (the current merge is a fidelity bug flagged in `phase6.md` §"App vs. source-guide deltas" item 16):
- **Expert Interviewing** — reuses the Phase-4 Life-Story-interview cycle (record → clarify → word-log → expand → re-listen → retell) against a chosen expert, sourced via §3's matching features.
- **Content Course tracker** — not an in-app activity at all, but a logging + hour-tracking surface: grower registers "I'm auditing X course" / "I'm taking a dance/first-aid class taught in the host language," logs hours against it (feeding §1.3's meter), and gets nudged toward Reminiscing/discussion recordings after sessions.

---

## 2. Solo / AI-partner fallback design

Phase 6's own guide draws the authenticity line more sharply than any earlier phase: nearly every core mechanism (Record-Yourself-for-Feedback review, the improved-version recording, Scripts of Life, role-play with a real partner, the venue capstone, content courses, lifestyle restructuring) is explicitly built around a **real eloquent host person's judgment** — "would a host person actually say that?" is not a question an AI can authentically answer for the grower's target languaculture. At the same time, several named Phase 6 activities are **already solo by design** in the source guide. The fallback design below sorts activities into those two buckets honestly rather than papering over the difference.

### Can Nuri authentically substitute? — YES

**Hole-Finding Studio (silent-film narration)** — genuinely solo in the guide itself, no partner mentioned in the technique. Concrete design: Nuri plays a short CC-licensed silent/near-silent clip (Chaplin-style public-domain footage, or a specially-shot dialogue-free scenario clip); grower narrates live into the mic as they watch; Nuri (via the existing TTS/recording pattern from the session room) marks **stalls** — gaps of silence over ~2.5s — as "holes," turning them into a tap-to-flag list at the end ("here's what you couldn't say"). No correctness judgment is made — Nuri never claims the narration was "right," only helps the grower locate gaps, exactly matching the guide's framing ("deliberately find things you can't say"). The finished recording can optionally be forwarded to a real partner later for the "why is this different from how host people would tell it" layer, but the core exercise stands alone.

**Domain-Vocabulary Prelude (Dirty Dozen for new discourse domains)** — this is literally Phase 1's existing AI-nurturer flow (`sessionFlow.ts`, Nuri-the-mascot TTS + reveal/review state machine) pointed at a new deck (car parts, beauty-parlor items, toast-occasion vocabulary). Zero new AI design needed — same `speak()` → reveal → review-round mechanic, same "iceberg" miss handling, just a Phase-6-scoped domain deck. This is the cleanest reuse of existing infra in the whole blueprint.

**Massaging recordings (solo intensive listening)** — inherently solo per the guide ("pausing, rewinding, looking up unfamiliar words, going on" — Thomson did this alone for 2h/day for months). Nuri's role here isn't conversational at all; it's a **tool**, not a partner: a Massage Player (pause/rewind loop, 0.5×–1× speed, tap-word-to-flag-unknown, save-to-glossary). See §5 — this is shared infra, not a per-phase AI feature.

**Remedial Pickup (re-running earlier-phase activities)** — Nuri already runs Phase 1's practice games solo end-to-end; routing an un-6 grower back into `/practice/vocabulary`, `/practice/listening`, etc. (or whatever Phase 2/3 equivalents exist by the time this ships) is a legitimate, guide-endorsed use of the existing AI-nurturer pattern, not a substitute for anything Phase-6-specific.

**Vocabulary/word-count pacing** — the "5–10 (or, remedially, 10) new words per hour" tracking is pure bookkeeping Nuri/the app can own outright; no authenticity question here.

### Can Nuri authentically substitute? — NO, and here's the honest bridge instead

**Record-Yourself-for-Feedback review (Stage A step 2) & the "improved version of your own text" (Stage A step 3)** — NO. The entire design insight of this step is that a *real host person* judges whether the grower's utterance is something a host person would actually say, and then re-records it *grounded in the grower's own attempt* rather than substituting their own spontaneous version. An AI cannot make that judgment call for a real languaculture without risking confidently-wrong "corrections" — exactly the failure mode GPA is designed to avoid (it's the same reason the guide insists on picking a nurturer "eloquent in the target discourse," not just any host speaker). **What Nuri offers instead**: a generic fluency-mechanics pass only (pacing, filler-word count, self-detected hesitation points) explicitly labeled in the UI as *not* a substitute — "Nuri can flag where you paused or repeated yourself, but only a real host person can tell you if this is something they'd actually say. Save this recording to send to [partner]." The recording gets queued for the real partner's review rather than answered by Nuri.

**Stage B modeling** — NO, structurally requires a real partner performing a fresh, eloquent example. Nuri does not fabricate a "model" toast or fault-description; that would be the "cheap imitation" the brief explicitly warns against. **Bridge**: while waiting for a real Stage-B recording, the grower can re-massage and re-retell material already collected from the Listening Library (their own Stage-A improved recordings), keeping the retelling muscle warm without inventing fake host content.

**Role-play** — NO for the "does this sound host-like" half, but the guide's own role-play instructions are turn-based and scripted-by-situation, so a **constrained rehearsal mode** is a legitimate bridge, not a replacement: Nuri plays a fixed, clearly-artificial "beautician"/"mechanic" character with a small set of scripted host-language prompts (built from the domain vocabulary in the Prelude) so the grower can rehearse the *shape* of the exchange before doing the real role-play with their partner or the real venue visit. UI copy should say plainly: "This is a warm-up, not the real role-play — do the real one with [partner] before your visit."

**Scripts of Life narration** — NO. Only a host person can produce a genuine host-viewpoint script (explicit in `nurturer-side.md`'s Phase 3 section, reapplied here); an AI-generated "script of life" would be a home-culture guess dressed up as an insider account. No AI substitute offered; this stays partner-gated.

**Shared Experience + Reminiscing capstone** — NO, requires physical co-presence at a real venue with a real host professional. Nuri's only role is logistics: scheduling nudge, a pre-visit vocabulary refresher (the domain deck from the Prelude), and firing the async Reminiscing prompt afterward (§4).

**Content courses, expert interviewing subjects, workplace/residence/team lifestyle restructuring** — NO across the board; these are explicitly real-world, real-relationship, real-institution activities. Nuri's only legitimate role is tracking/logging/reminding (§1.6, §1.8), never simulating a professor, a mechanic, or a coworker.

**Mass-media listening (sitcoms, talk shows, news)** — NOT an AI-substitution question at all; the guide wants *authentic host media*, and Nuri's only job is curation/difficulty-tagging tooling (part of the shared Listening Library / massage-player infra), never AI-generated "practice media."

### Summary framing for the UI
Every Nuri-run solo activity in Phase 6 should carry a visible tag distinguishing **"Practice with Nuri"** (hole-finding, domain vocab, remedial pickup, massage tools) from **"Rehearsal — do the real thing next"** (role-play warm-up, fluency-pass-only feedback) so growers never mistake a bridge activity for the real discourse-mastery step it's standing in for.

---

## 3. Finding real participants for this phase

Phase 6's helper role is explicitly **plural and lifestyle-embedded**, not a single bookable person — this is the biggest matching-design departure from Phase 1's marketplace model (`src/lib/nurturers.ts`, currently 17 demo profiles with `ratePerHourUsd`/`methodCertified`/`exchangeOpen`/`phasesGuided`).

### 3.1 What changes from the Phase 1–3 nurturer model
- **Training is no longer the qualifying signal.** The guide is explicit: Phase 6 partners need no method training — the ideal is Leaver's content instructor "who does not know English and has never taught their language." `methodCertified` (the Phase-1 golden-rules quiz badge) is actively the *wrong* signal to filter Phase 6 partners by.
- **Eloquence-in-discourse is the qualifying signal instead.** "All nurturers are not created equal when the activities involve such special discourses... you might look for a nurturer in the [more eloquent] category." This requires a different kind of profile field than anything Phase 1–5 uses.
- **Payment shifts from mostly-paid to a real mix**, and much of it isn't a "session" at all: workplace colleagues, neighbors, family members, and diaspora community members are unpaid lifestyle relationships; expert interview subjects and content-course professors are often paid one-off; a discourse-track partner may be paid, exchange-hours, or an existing relationship the grower already has (spouse, close friend) that simply gets logged, not "booked."

### 3.2 Concrete features

**Discourse-Specialty tags on the nurturer roster** — extend `nurturers.ts`'s schema (already has `phasesGuided`) with a `discourseSpecialties: string[]` field (e.g., `["toasting", "business-negotiation", "medical-visits"]`) and an `eloquenceRating` derived from grower feedback after Stage-A/B sessions rather than a pass/fail quiz. Filtering on `/marketplace` for a Phase 6 grower surfaces partners by specialty match to their active Discourse Tracks, not by generic phase-band the way Phase 1 does today.

**Expert Directory (separate from the nurturer marketplace)** — a lightweight directory for the *real service professionals* Phase 6 explicitly targets (mechanics, beauticians, toastmasters, "or whatever walk of life you are interested in"). These people are not GPA nurturers at all — they don't need to know the method exists. Sourcing options, cheapest first:
- **Grower-submitted**: the grower logs a real person they already patronize/know (their actual mechanic, their actual hairdresser) directly into the app as an Expert Interviewing / Shared-Experience contact — no marketplace lookup needed, since Phase 6 growers are typically already embedded in host life and know these people already.
- **Community-submitted directory**: other growers in the same city/language can recommend real businesses/professionals willing to be interviewed or visited, with a short community-contributed note (not a certification — social proof only, e.g. "she let me record our whole conversation, very patient").
- **Verification is deliberately light**: a short recorded self-introduction in the host language (uploaded by the grower who found them) substitutes for any formal vetting — consistent with the guide's own low bar ("or whatever walk of life you are interested in").

**Content-Course / Professor connection** — mostly outside the app's matching surface (guide explicitly frames this as auditing real university courses or enrolling in real host-taught hobby classes), but the app can (a) surface a checklist of "how to find one" prompts drawn straight from the guide (audit 2–3 university courses as the only non-native student; take a host-taught dancing/first-aid/hobby course; ask your workplace about internal training taught in the host language) and (b) once the grower has one, provide the hour-logging/reminder surface from §1.8. No professor-matching marketplace should be built for MVP — false precision here (a fake "verified professor" badge) would be worse than an honest "go find one, here's how" prompt.

**Reading-Club Partner matching** — reuses the existing exchange-hours marketplace model closely (two people reading the same material, discussing on recording) — this is the one Phase 6 role that maps cleanly onto Phase 1–5's existing `exchangeOpen` / time-for-time model, so no new sourcing mechanism is needed beyond tagging a nurturer/mentor profile as open to reading-club exchange.

**Community-of-Practice discovery (`p6-cop`)** — the guide's "join a host community of practice" (dance class, first-aid course, workplace team, diaspora group) is fundamentally a real-world discovery problem, not a marketplace-matching one. MVP treatment: a simple **"I'm looking for a group to join" board**, posted by growers, visible to other growers/host people in the same city (reusing `convex/messages.ts` + `convex/requests.ts` primitives for the connect-and-message flow, not inventing a new backend). Explicitly not a full events/listings platform for MVP.

**Verification & incentive structure, compared across phases** (for the reader tracking how this evolves):

| | P1–3 nurturer | P4–5 mentor | P6 lifestyle community |
|---|---|---|---|
| Qualifying signal | method training + quiz pass | willingness + trustworthiness (confidentiality) | eloquence / subject-matter expertise |
| Training required | yes (golden rules + quiz) | no | no |
| Typical payment | paid (PPP-scaled) or exchange-hours | paid "reasonable local rate" | mixed: unpaid (lifestyle relationships), one-off paid (experts/professors), exchange-hours (reading club) |
| Sourcing | app marketplace | app marketplace, deeper relationship | mostly grower's own real-world network + light community directory; marketplace only for discourse-partner/reading-club roles |
| Verification | quiz score | none named in guide beyond "willing to share" | none — social proof / self-report only |

---

## 4. Pen-pal-style relationship growth

Phase 6 is the phase where the guide's own language stops being about "sessions" at all — the nurturer/mentor relationship has, by this point, been building since Phase 1 ("seed community... grows into a sapling, then a tree"), and the phase's actual mechanism (weekly lifestyle hours + an open-ended discourse pipeline with no fixed end) is inherently asynchronous and ongoing. This maps unusually well onto the owner's pen-pal vision — arguably better than any earlier phase — and should build directly on `convex/messages.ts` (1:1 threaded messaging, already supports voice notes per `nurturer-side.md`) rather than inventing new messaging infra.

### 4.1 Per-Discourse-Track threads
Each active Discourse Track (§1.2) gets its own scoped thread with the grower's partner — not a generic DM stream, but a thread that carries structure: message history interleaved with the track's recordings (grower's Stage-A attempts, partner's improved versions, Stage-B models, role-play recordings), the running Stage-A hour counter, and a pinned Listening Library view scoped to that track. Technically: extend the messages schema so a thread can be keyed by `{pair, trackId}` instead of just `{pair}` — additive to the existing sorted-clerk-id-pair threading, not a replacement.

### 4.2 Async "postcards" — the core pen-pal mechanic
The guide's actual workflow is already async-friendly: record an attempt whenever, review whenever, listen before the next meeting. The app should make this literal: a **"send a recording"** affordance in the track thread lets the grower record and send a Stage-A attempt (or just "here's a phrase I overheard today, help me understand it") at any time, with no live session required — true pen-pal cadence, not a scheduling dependency. The partner replies async, on their own time, with either a text note or a recorded improved version. This directly implements the guide's own emphasis that most of Phase 6's growth doesn't happen in scheduled meetings.

### 4.3 Reminiscing exchange (post-capstone)
When a grower logs a completed Shared-Experience venue visit (§1.2 stage 6), the app fires an **async Reminiscing prompt** to both grower and partner: each records their own recollection of the visit on their own time, exchanged in the thread — directly implementing "Return home with your nurturer and do the Reminiscing Activity from Phase 3," but async instead of forcing an immediate live debrief, and feeding both recordings into the track's Listening Library.

### 4.4 Life-update layer (the actual pen-pal-ness)
Separate from any discourse track, a **standing general thread** with the grower's core Phase 6 partner(s) — reflecting that by Phase 6 this is a real, indefinite relationship, not a task-scoped one. Nuri can (optionally, dismissable) suggest light async prompts to keep dormant threads alive ("What's a phrase you heard this week that you didn't understand?" or "Ask your partner what's new with them") — framed as nudges toward genuine relationship maintenance, not gamified streaks. This is the one place a gentle "it's been a couple weeks" reminder is appropriate, tied to the weekly lifestyle-hours dashboard (§1.6) rather than to app engagement metrics.

### 4.5 Multi-partner reality
Because Phase 6's helper is plural, a grower will likely have several active threads at once (a toasting partner, their actual mechanic, a reading-club partner, an ongoing mentor from Phase 4/5). The inbox should group threads by **role** (Discourse Partner / Expert / Reading Club / Ongoing Mentor) rather than presenting an undifferentiated DM list, so the "who is this relationship for" context — central to Phase 6's whole design — isn't lost in a generic chat UI.

### 4.6 What NOT to build here
No group-chat/community-of-practice messaging for MVP (§3's community board is a lighter, separate primitive); no AI-generated messages inserted into these threads under any circumstances — Nuri's role stays confined to nudges/reminders rendered as system prompts, never as content standing in for the partner's voice, which would directly violate the "not a hollow imitation" constraint from the brief.

---

## 5. Dependencies & shared infrastructure

Phase 6 is the heaviest consumer of infrastructure that Phases 2–5 also need but that doesn't exist yet. Building it Phase-6-first would be wasteful; the items below should be designed once, generically, and Phase 6 should be treated as a forcing function for getting the generic version right (per the earlier phase reports' own gap lists in `app-implementation.md` §7 and `nurturer-side.md` §7).

1. **Generic Listening Library** — an accumulating, replayable recording collection scoped to a track/topic/thread, with two standing triggers baked in generically (pre-next-meeting reminder, pre-real-event reminder). Needed verbatim by Phase 3 (Bridge Story massaging), Phase 4 (life-story recordings), Phase 5 (native-to-native + clarified recordings — `p5-library` is literally named this and has zero implementation today), and Phase 6 (every discourse-track recording). Build once as a shared primitive, not per-phase.

2. **Massage Player** (pause/rewind loop, variable speed, tap-word-to-flag-unknown, save-to-personal-glossary) — needed by Phase 3's Record-and-Massage Loop (`p3-massage`, currently unimplemented), Phase 5's clarifying-recording loop, and Phase 6's Stage-B massaging and mass-media listening. One component, multiple call sites.

3. **Word-history / cue-card data store** — already flagged as a Phase 1 gap (`phase1-completion-plan.md` M11: `profile.wordIds` is captured by only one practice screen and never populated by the live session room). Phase 6's Needs Analysis, remedial-pickup vocabulary-rate tracking, and the 10-new-words/hour counters all *require* an accurate per-grower word-history store — building Phase 6 features on top of the current undercounted dataset would inherit that bug. This should be fixed once, generically, before Phase 6's vocabulary-rate features are built.

4. **Generic scoped/topic-threaded messaging** — extending `convex/messages.ts` from pure `{pair}` threading to `{pair, topicId}` threading. Needed by Phase 4 (life-story threads per storyteller), Phase 5 (clarifying-session threads), and Phase 6 (per-discourse-track threads, §4.1). Same schema change serves all three.

5. **Lightweight expert/mentor verification & rating pipeline** — distinct from the Phase 1–3 method-certification pipeline (`nurturerCertStatus`/quiz). Needed by Phase 4–5 (mentor trust/confidentiality norms — currently entirely absent per `nurturer-side.md` §7) and Phase 6 (eloquence rating, expert-directory social proof). Should be built as a generic "role-appropriate trust signal" system rather than reusing the quiz-based cert model, since Phase 4+ explicitly requires *no* method training.

6. **Real credit/payment pipeline** — `convex/credits.ts`'s `recordEntry` currently throws by design ("Credits require a verified session or payment event"). Any paid Expert Interviewing session, content-course logging, or exchange-hours reading-club match across Phases 4–6 needs this resolved; it's not Phase-6-specific but Phase 6 has the widest variety of payment shapes (unpaid lifestyle relationships, one-off paid experts, exchange-hours) and will surface the gap hardest.

7. **Native-to-native recording library with difficulty tagging** — Phase 5's `p5-record` ("Collect Native-to-Native Recordings," unimplemented) is the natural source for Phase 6's un-6 litmus-test diagnostic (§1.5) and mass-media difficulty ladder (sitcom vs. talk show). Build the collection/tagging system once in Phase 5's scope; Phase 6 consumes it rather than building its own.

8. **Self-registered "real contacts" (non-marketplace people)** — a way for a grower to log a real person they already know (spouse, coworker, neighbor, their actual mechanic) as a tracked relationship for hour-logging and pen-pal threading, without going through marketplace booking. Useful from Phase 2 onward (any grower with an existing host-language relationship) but load-bearing for Phase 6 specifically (§3.2), where most real participants are pre-existing relationships, not marketplace bookings.

---

## 6. MVP cut

The smallest slice that is still authentically GPA and still touches all three of the owner's asks (matching / solo-fallback / pen-pal):

**One discourse track, end to end, for real.** Ship a single flagship Discourse Track type (recommend "Toasting" — lowest physical-asset requirement, no special venue/prop needs, matches the guide's own worked example) implementing:
- Needs Analysis wizard scoped to just this one track (skip the general-purpose multi-target backlog for v1 — just prove the scoring mechanic and let the grower confirm "yes, toasting is my target").
- Prelude: reuse the existing Dirty Dozen engine against a small toasting-occasion/toastee vocabulary deck (cheap — it's the existing Phase 1 mechanic with a new deck, no new engineering).
- Stage A only for v1 (skip Stage B/Scripts/Role-play/Capstone until the core loop is validated): grower records a toast attempt → sends it async to a real matched partner via the per-track thread (§4.1/4.2) → partner leaves timestamped notes + records an improved version → both land in a bare-bones Listening Library (a flat list of recordings with a play button and a "remind me before my next toast" bookmark is enough for v1; the fancier replay-trigger automation can come later).

**Matching MVP**: extend the existing `nurturers.ts` roster with a single `discourseSpecialties` tag field and let growers filter/request by "toasting" specifically, reusing `convex/requests.ts` as-is for the connect flow. No new verification system — self-reported specialty + a simple thumbs-up rating after each Stage-A cycle is enough to start.

**Solo-fallback MVP**: ship the **Hole-Finding Studio** (§2) as the standalone AI/solo feature — it requires no partner, no marketplace, no messaging, and is the cleanest "authentically GPA, genuinely AI-compatible" activity in the whole phase. Pair it with the **Remedial Pickup router** (§1.5), which costs almost nothing to build since it just re-routes into existing `/practice/*` games with new framing copy.

**Pen-pal MVP**: the per-track async thread itself (§4.1/4.2) IS the pen-pal feature for v1 — a grower and their toasting partner exchanging recordings and notes on their own schedule already delivers the "ongoing, asynchronous, deepening relationship" the owner asked for, without needing the life-update layer, Reminiscing automation, or multi-partner inbox grouping (§4.3–4.5) built yet.

**Explicitly deferred past MVP**: the other named discourse tracks (car repair, beauty parlor) and the generic multi-target Needs Analysis backlog; Stage B onward in the pipeline; the Expert Directory and content-course tracking (§1.8, §3.2); the weekly lifestyle-hours dashboard (§1.6) and 100/300-hour meter (§1.3) — real but not required to prove the core loop; the un-6 diagnostic (§1.5) beyond the remedial router itself; group/community-of-practice discovery (§3.2's board). All of these are genuine Phase 6 content but none are load-bearing for validating that matching + solo-fallback + pen-pal can coexist authentically in this phase.
