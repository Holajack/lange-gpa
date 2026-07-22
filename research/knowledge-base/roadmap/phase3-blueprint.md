# Phase 3 — Becoming Knowable ("Stuff-We-Both-Know") — App Implementation Blueprint

Grounded in `research/knowledge-base/phase3.md` (Thomson's guide), `app-implementation.md`, and `nurturer-side.md`. Every proposal below is traced to a specific line in the phase guide — nothing here is invented activity content. Where the app's current `phases.ts` encoding of Phase 3 is *wrong* (the "massaging" inversion, the missing information gap, etc. — see `phase3.md` §"App vs. source-guide deltas"), this blueprint designs against the **guide**, not against the current buggy encoding, and flags the fix explicitly.

**Read this alongside** `/private/tmp/.../scratchpad/roadmap/phase1-completion-plan.md` — several Phase 1 gaps (word-history tracking, pacing indicators, cue-card infra) are direct prerequisites for what Phase 3 needs, and are called out as shared infra rather than re-proposed from scratch.

---

## 1. Core feature mapping

### 1.1 Bridge Story Activity (THE mainstay — ≥ half of session time)

**What it is per the guide (§6.1):** nurturer learns a world/Bible/home-culture story at home, tells it *slowly*, grower stays **silent** and records; then the grower **massages the recording** sentence-by-sentence (repeat / break down / explain-in-host-language / example / word-log entry) until basic gist; homework = re-listen until easy.

**App feature — "Bridge Story Room" (new mode in `/session`, or a sibling route `/session/story`):**
- **Telling pass:** reuses the session room's existing recorder (`useRecorder`, consent dialog) and live-audio infra. Nurturer's device shows a **"Story Card"** pulled from a new **Bridge Story Bank** (title, source, a private "what to know before telling it" cheat-sheet for cultural adaptation — angel-not-fairy style notes). Grower's screen shows only a waiting/listening state — no text, matching the app's existing "the grower stage never shows the written word" pattern from Phase 1.
- **Massaging pass — the actual missing feature.** A **segmented Massage Player**: the recording is auto-chunked into sentence-level segments (silence-detection or nurturer-tapped markers during telling). Grower controls: ▶ replay segment, ⏪ back one, 🐢 slow-replay, and three negotiation buttons that mirror the guide's actual moves — **"Break it down," "What does that mean?," "Give me an example"** — each opens a small host-language-only prompt for the nurturer (live) or a canned explanation (AI mode, see §2). Every new word surfaced this way writes one row to the **Word Log** (§5), tagged to that story + timestamp.
- **Live difficulty readout:** as massaging proceeds the room computes, live, the guide's own rubric — minutes-massaged ÷ story-minutes and new-words ÷ story-minute — and shows a green/amber/red needle against the guide's numbers (≤30 min/story-min and ≤10 words/story-min, 5 ideal). Amber/red surfaces the guide's own fallback text: *"This is running hard — consider a simpler retelling, or fall back to a wordless picture book told without looking at the pictures."*
- **Grower never sees text during listening** — reading is a separate, later, opt-in screen (§1.8).
- **Homework:** every finished recording lands in the grower's Listening Library (§5) with a "re-listen until easy" nudge, exactly the guide's homework loop.

### 1.2 Scripts of Life Activity (the other non-postponable core)

**What it is (§6.2):** a host person's 25–30-step, host-point-of-view account of an everyday routine. One-time 4-step training (hand-washing pantomime → nurturer reads her list → massage → grower's pre-written "attempted script" negotiated *without showing the text*), then normal form: nurturer lists steps, grower probes for completeness ("after X, before Y, what happens?"), record, massage, **grower pantomimes each step on playback**.

**App feature — "Script Builder" + "Pantomime Player":**
- **One-time training screen** (fires once per grower, gates nothing else): a guided checklist UI walks the grower through physically washing their hands while the nurturer (or, in an unattended fallback, a printed on-screen prompt) types each micro-step into a running list, recorded via mic. Step 4 imports the grower's own pre-written script (typed at home beforehand, in their OWN language, never shown to the nurturer) and negotiates it host-language-only, with the nurturer's device blind to the source text — enforced technically (the text field literally isn't rendered on the nurturer's screen during that step).
- **Ongoing form:** a **Script Author** screen for the nurturer — freeform ordered step list (target 25–30 rows), an explicit **"host point-of-view only"** reminder banner, and an **eligibility check**: the topic picker only allows activities *both parties have personally done* — mirroring the guide's explicit "wedding is NOT eligible unless you've attended one — that's a Phase 4 topic" rule (Appendix 3), which the current `phases.ts` gets wrong today.
- **Pantomime Player** (grower-facing): plays the recorded steps one at a time with a "heard it — acting it out — next step" tap, optionally self-recording the grower's pantomime as a light proof-of-progress clip (not required, not massaged, just fun/motivating).
- **Later use as flooding material (§6.15):** any completed Script of Life becomes reusable input for Structured Input/Flooding — a toggle lets the grower replay it transformed into future/intent or subordinated-clause frames, IF the nurturer has recorded those transformed versions.

### 1.3 Action Cartoon Activity — restore the information gap

**What's wrong today:** `phases.ts`/`p3-cartoon` says "watch together, nurturer narrates" and has no information gap. The guide (§6.3) is explicit: **the grower cannot see the screen** during the nurturer's live narration (that's what manufactures the information gap — "she has something to tell you that you don't obviously already know"); the two watch together only on the *second* pass; and there are **two separate recordings** — live narration, then a natural retelling made *after* the nurturer reviews the word log, deliberately re-seeding the new vocabulary into the cleaner Listening-Library keeper.

**App feature — "Cartoon Session":**
- Grower's screen goes dark/blocked (not just "hidden," actually rendered unavailable) while the nurturer's screen streams the source clip (public-domain silent-action content, or the story-library doc's cited Max7.org "No Language" animations) and she narrates live into the recorder.
- Pass 2: both screens show the clip together while the recording plays.
- Massage pass exactly like the Bridge Story massage player.
- Pass 3 (retell): nurturer's screen shows **the day's Word Log** as a checklist before she records the clean retelling, so the app is literally enforcing "make sure every new word gets re-included."
- Both recordings feed the Listening Library; only the second is flagged as the polished "keeper."

### 1.4 Shared Experience + Reminiscing

**What it is (§6.4–6.5):** do something together in the real world (last activity of the day), make notes, and the next morning the nurturer **narrates what they did while the grower back-channels** ("yeah / really! / mhm"), recorded and later massaged.

**App feature:**
- **Shared Experience log** — a lightweight entry ("what we did," free text/photo, timestamp) either party can create; this doubles as the raw material for the async pen-pal Reminiscing flow (§4) when the pair can't do it live the next morning.
- **Reminiscing recorder** — a guided in-session mode: nurturer's screen shows a **back-channel cue reminder** ("host-appropriate mhm/yeah/I-see equivalents — let the grower take brief turns, then hand the floor back") while she narrates; grower's screen shows nothing but a mic-live indicator, training the back-channel habit by doing it, not by reading about it. Recording → Word Log → Listening Library like every other activity.

### 1.5 Discuss-a-Prop / Reverse Role-Play / Small Talk / Strengthening Vocabulary

**What they are (§6.6–6.10):** low-infra, high-value activities: free interaction around a household object (record the whole negotiation); nurturer plays the grower's real-life role while grower plays the counterpart (models exactly what the grower will need to say); mandatory host-language small-talk opener; the grower recaps yesterday's new words back into context (strictly time-capped — "it can eat up too much time").

**App feature:** these don't need bespoke screens — they become **structured "activity blocks"** inside the existing Nurturer Studio Session Planner pattern (already builds phase-aware plans from `phase.activities`), each block carrying: a one-line `how` script for the nurturer, a record button, and (for Strengthening Vocabulary) a **hard 20-minute countdown** enforced in the UI, because the guide explicitly warns this activity eats time if left open-ended. Discuss-a-Prop gets a "pick an object, here are the guide's own anecdote prompts (a lamp, a rope — 'all the things people do with and to it')" starter card. Reverse Role-Play gets a scenario picker (taxi/shopkeeper/police) and a "swap after a few days" reminder to do the Ordinary direction too.

### 1.6 Host Stories (3B prime activity) — the translation-familiarization pipeline

**What it is (§6.16):** the nurturer lists stories universally known among her people; someone translates one; the grower **listens/reads that translation daily for several days** until genuinely familiar (not just "read it once right before the session" — Thomson's own cautionary tale); only then hears it live in the host language, records, massages, and re-listens *more* than Bridge Stories (plots fade faster without the host-cultural anchor).

**App feature — "Story Locker" pre-familiarization queue:**
- Nurturer (or a Story Bank contributor, §3) uploads a host story + its translation (text or audio) tagged with the guide's own **Appendix-4 12-level difficulty ladder**.
- Grower gets a homework queue item with a **daily streak counter** ("Day 3 of familiarization — listen once more before tomorrow's session"), reusing the app's existing week/streak tracking pattern.
- The live "hear it in host language" session **unlocks only after the streak threshold is met** — literalizing the guide's sequencing requirement rather than leaving it to chance.
- Once live-heard, same Massage Player + Word Log + Listening Library loop as Bridge Stories, but the Listening Library entry is flagged **"needs extra re-listens"** per the guide's explicit warning.

### 1.7 3C activities (expository, talking-more, native-to-native sample)

**What they are (§6.18–6.28):** Familiar Topic (expository speech on something the grower already knows deeply), Movie Plot, Book Summary, News Broadcasts, **native-to-native retelling recorded without the grower present**, plus the talking-more set (Story Retelling, Life Stories, Epics, Weekend recaps, Lexicarry variation discussion, community-topics tracking).

**App feature:** same "activity block" pattern as §1.5, each with its own record button and `how` prompt, EXCEPT native-to-native retelling, which needs a distinct **"Nurturer solo recording"** upload mode in the Nurturer Studio — no grower participant field, explicitly labeled in the grower's Listening Library as *"native speed — a stretch listen, not something you're expected to fully follow yet."* Epics get their own reusable serialized-thread primitive (§4, §5 — this is explicitly designed to keep running through Phase 6).

### 1.8 Word Log and Listening Library (the connective tissue)

**What they are (§9, glossary):** the nurturer physically writes every new word encountered, with context, non-memorization ("acquaintance now, strength through frequency later" — Iceberg Principle); every recording joins a cumulative, rising-difficulty archive that must be re-listened to "until easy, and even after that, again from time to time."

**App feature:** see §5 (this is the load-bearing shared infra piece, not a per-activity screen).

### 1.9 Reading (mid-to-late phase)

**What it is (§8):** reading becomes sensible for the first time in Phase 3 — but only on already-massaged, already-familiar stories, done **alone at home**, and never while listening ("don't cheat by looking at the printed page — it short-circuits the listening process").

**App feature — "Read It Now":** a transcript view unlocked per-recording only after it's been marked "easy to follow" in the Listening Library (or crosses a re-listen-count threshold). Technically enforced separation: the live/massage/listening screens never render the transcript at all — Read It Now is a different route, reachable only from a finished Listening Library entry, so "don't cheat" isn't just a guideline, it's an architecture decision.

### 1.10 The 3B→3C hard gate

**What it is (§7):** *"Consider that you do not graduate from Phase 3B to 3C until you [have begun new relationships beyond the paid nurturer]"* — 3–5 real social hours/week become countable toward the 25.

**App feature:** the course page's existing `phase.id < profile.phase` ✓-check pattern gets a qualitative companion for 3B→3C specifically — see §3 and §5 for how the hours get counted, and §6 for why this ships as a soft checklist item at MVP, not a hard block.

---

## 2. Solo / AI-partner fallback design

The honest split, activity by activity:

### Authentically substitutable by AI

**Bridge Story Activity — the flagship solo-fallback.** This is the ONE activity the guide itself frames as belonging to "a third world... neither party's world," explicitly chosen *because* it needs no host-cultural background from either side. That property is exactly what makes it AI-safe: Nuri isn't pretending to have lived experience it doesn't have, because the guide's own Bridge Stories (Cinderella, Bible stories, Appendix 2's four ready texts) don't require any.

Concretely: extend the TTS + cue-script pattern already proven in `sessionFlow.ts` into a new `phase3StoryFlow.ts`. Each Bridge Story ships as a **hand-authored content pack**: `{sentences[], perWordGlossary: {word, hostLanguageDefinition, hostLanguageExample}[]}`. Nuri (mascot) tells the story via TTS sentence-by-sentence; the grower's negotiation buttons ("repeat," "break it down," "what does that mean," "give an example") are served from the pre-authored pack instead of a live nurturer's improvisation. This reuses the Massage Player UI from §1.1 almost unchanged — the only difference is where the explanation text comes from. It is an honest, non-hollow substitute *specifically because* the activity's own design goal is "understandable without host background," which an authored content pack genuinely delivers.

**Action Cartoon — partial yes.** The information gap works fine with AI because Nuri (the "narrator") genuinely has information the grower's blocked screen doesn't: feed Nuri a pre-scripted narration transcript for a specific public-domain clip, play it via TTS while the grower's screen stays dark, then reveal for pass 2. Reasonably authentic for the same "third-world, no-host-background" reason as Bridge Stories.

**Input/Output Flooding + Structured Input — clean fit.** These are inherently drill mechanics (a busy picture + repeated querying) — exactly the shape the app already does well in Phase 1 (`/practice/vocabulary`, `/practice/listening`). `p3-flood` already carries a `practiceHref`; it should be rebuilt to the real busy-picture-plus-querying mechanic (see phase1-completion-plan's flagging of the general busy-picture asset gap) rather than the generic TPR game it currently reuses. Cardinal rule preserved: flooding only fires on forms the grower is *already* reaching for, never arbitrary grammar — so this mode should be triggered from a detected struggle pattern, not offered as a free-standing menu item.

**Movie Plot / News (3C) — mixed, but real.** If the grower has genuinely already seen the movie or the news event happened, AI reading/retelling a script in the target language is a legitimate comprehension exercise for the same "familiar content, unfamiliar words" reason the guide gives — but it carries none of the relationship value the human version has, and should never be marketed as equivalent to a nurturer choosing to share what SHE finds interesting.

### Structurally NOT substitutable — AI's honest role is "bridge," not "replacement"

**Scripts of Life — no.** The guide says it outright: *"only a host person can make up Scripts of Life that describe what host people expect to happen in their world."* An AI-generated "script" would be a plausible-sounding hallucination of host-cultural procedure, which defeats the entire purpose of Stuff-We-Both-Know (mutual, *verified* shared knowledge). What AI CAN do: once a real nurturer has authored a script, Nuri can re-run the **Pantomime Player** for re-listening/re-practice, and run the Input/Output Flooding transformations on that *already-real* content (habitual → future/intent → subordination) — genuine re-practice of real content, not fabrication of new "host" knowledge.

**Shared Experience — no.** Cannot be substituted; it requires a real event in the real world with a real person. Bridge: Nuri can replay a *past, already-real* Shared Experience recording and run comprehension/back-channel practice against it ("what did they do first? tap the picture"), and can run a light "describe an object near you" Discuss-a-Prop rehearsal — but any AI-narrated "let's imagine we went somewhere" content must be explicitly labeled as rehearsal, and never counted toward the Shared Experience quota or the 3B social-hours gate.

**Host Stories — no for the live telling; yes for the pre-familiarization homework.** The story itself must come from a real host person's real cultural repertoire. But the guide's own translation-pre-familiarization step (§6.16) is already solo homework by design — AI can legitimately run that loop today: spaced playback of the translation, a light comprehension check to verify genuine familiarity (not just "read it once"), streak tracking. The live host-language telling stays human-only.

**Reminiscing — no for the live back-and-forth; yes as async scaffolding.** A genuine Reminiscing exchange needs a real person who was actually there. Nuri's honest role: help the grower *prepare* to reminisce (rehearsing back-channel phrases, replaying the Shared Experience log) before a real async or live exchange happens (§4).

**Native-to-native retelling — structurally impossible to substitute**, by definition (two real host people, grower absent). AI's only legitimate role is housing and lightly supporting comprehension of a REAL recording once supplied — e.g., once a transcript exists (from the nurturer or speech-to-text), Nuri can offer host-language-only glosses on request during a massage pass over *that real recording*. This should be flagged as a genuinely useful but unverified idea for later, not shipped without a real transcript pipeline behind it.

**Story Retelling / Life Stories / Epics / Weekend recaps / community topics — no for the "clean retelling" step, yes as a rehearsal ear.** The guide's value here is a real host person judging what "sounds native" and retelling the grower's story cleanly into the Listening Library, and surfacing genuinely current community chatter — neither is something AI can do honestly (an AI "native-sounding" retelling isn't; AI has no access to what this specific community is actually gossiping about this week). Nuri's honest role: a **rehearsal partner** — receive the grower's telling, give light scripted back-channel ("mhm," "really?"), ask 1-2 template follow-up questions, and save the grower's own telling as "my own version, v1" in their personal Listening Library for self-comparison over time — framed explicitly as *practice before bringing it to your nurturer/mentor*, never as the finished product.

**Vocabulary bookkeeping (Word Log, Strengthening Vocabulary, 8-words/hour pacing) and Reading Mode** are pure app mechanics with no authenticity question either way — always available solo, human partner or not.

---

## 3. Finding real participants for this phase

Phase 3's helper is still the **paid nurturer** (same tier as Phases 1–2 — the guide pays nurturers through Phase 5), but the *required skill* shifts: "enjoys telling stories, has a knack for storytelling, but can also simplify and gear stories to your level." That's a different competency than Phase 1's playmate skill, and the current 17-person demo roster (`src/lib/nurturers.ts`) doesn't distinguish it — `phasesGuided` tops out vaguely at "3–4" with no verification behind the string.

**Marketplace changes for Phase 3:**
- Add a **`storytellingSample`** field (a real 30–60s audio clip of the nurturer telling a short story) so growers can gauge pacing/clarity before booking — the single most decision-relevant signal for this phase's specific skill, and cheap to collect (nurturers already have a recorder in the Nurturer Studio).
- Add a real **Phase 3 certification module** (extends the existing `/nurture/training` gate, which today only covers the 6 Phase-1 golden rules): host-language-only explanation techniques, the "don't sit passively while the grower reads to you" rule, plot-fidelity in Bridge Stories, word-log discipline, the "difficulty must keep rising" calibration. Passing unlocks a **"Phase 3 storyteller"** badge on the roster — replacing the unverified `phasesGuided` string with something a grower can actually trust. This is the concrete fix for the gap `nurturer-side.md` §7 already names: "nothing stops a Phase-1-certified nurturer from being booked at any phase."
- Keep the existing **dual paid/exchange-hours model** (`ratePerHourUsd` + `exchangeOpen`) — Phase 3 doesn't change the payment structure, just the matching filter (storytelling skill + Phase-3 cert, not just language).

**The 3B social mandate needs a genuinely different sourcing channel**, because it explicitly requires relationships *beyond* the paid nurturer:
- **"Introduce a friend" flow** — the guide's own tactic: *"the nurturer introduces her own close friends."* Build a lightweight intro action in the Nurturer Studio (reusing the `requests.ts` request pattern) that lets a nurturer vouch-connect her grower to a third, unpaid person, tagged in the grower's contact list as **"introduced by [nurturer name]"** — this preserves the trust chain that makes the guide's own tea-and-sweets case study work, rather than dumping the grower into a cold stranger roster.
- **Surface the existing `/world` roster + `requests.ts` + `calls.ts` stack explicitly as the 3B venue.** These already implement real 1:1 person-to-person matching (Tandem-style), text/voice messaging, and WebRTC calls — but they sit behind the default-off `NEXT_PUBLIC_ENABLE_COMMUNITY_EXCHANGE` flag. Phase 3 is the first phase whose methodology *requires* this exists; turning it on (at least for Phase-3+ profiles) is a real product dependency, not a nice-to-have.
- **Volunteer/unpaid Story Bank contribution** — a sourcing model genuinely distinct from paid 1:1 nurture time: the guide's "pioneers leave recordings behind... as you will do for those who follow after you" (§6.16, §6.29–30). Let any verified host-language speaker (not necessarily a paid nurturer) contribute a Bridge Story or Host Story recording to the shared Story Bank, earning `exchangeHours` credit once `credits.ts`'s `recordEntry` is actually wired up (§5) — a content-creator-economy sourcing channel layered on top of, not replacing, the 1:1 marketplace.
- **Host-family homestay** (guide: "consider from mid-to-late Phase 3") is out of scope for an in-app matching feature — best served as a milestone/journal prompt pointing to outside resources, not a booking flow.

---

## 4. Pen-pal-style relationship growth

Build directly on `convex/messages.ts` (1:1 text + voice notes, already working, threaded by sorted-clerk-id-pair) — no new messaging primitive needed. What's missing is **Phase-3-shaped structure** on top of generic chat.

- **Reminiscing by voice note.** After logging a Shared Experience (§1.4), if the pair can't do the live next-morning Reminiscing session, the nurturer sends a voice note narrating what happened ("We went to a coffee shop... you said you were afraid to cross the street" — the guide's own worked example), using the existing `sendVoice` mutation. The grower back-channels with short voice-note replies over the following day(s). This literally operationalizes the guide's Reminiscing activity in asynchronous form when live time isn't available, and the resulting voice-note chain can be saved into the Listening Library as a "Reminiscing recording" — a direct hit on the owner's ask #3, using infrastructure that already exists.
- **Idea Board — the four lists, shared.** The guide has the nurturer and grower each keep running idea lists (Script-of-Life ideas, Shared-Experience ideas, familiar places/routes, role-play situations) and *exchange additions* (§6.29: "carry a pocket pad... exchange additions with the nurturer"). This needs one small new table (`phase3IdeaLists`, scoped to a grower-nurturer pair, four categories, either party can add/check off an entry any time) — genuinely Phase-3-specific, not generic chat, and it's the connective tissue that makes the next live session's planning collaborative rather than one-sided.
- **"Today I learned" daily micro-ritual.** The guide's Strengthening Vocabulary activity (recapping yesterday's new words in context) becomes a short daily async voice exchange between big sessions — grower sends a 30-second recap, nurturer voice-replies with light confirmation/expansion. Small, low-effort, high-frequency touches are exactly what keeps a pen-pal relationship warm between the 2–5 hour live sessions, and it's the same mechanic the guide already prescribes, just moved out of session time.
- **The Word Log as a shared, growing artifact.** Rather than a private per-grower list, expose it as **"our story so far"** — visible to both grower and nurturer, growing every week, literally the running record of stuff-they-both-know. This makes the app itself the tangible evidence of relationship depth, which reinforces the pen-pal framing better than any generic "streak" counter would.
- **The serial Epic (§6.25) as a reusable relationship primitive.** The guide is explicit that the same Epic story continues, retold ever more richly, through Phases 4–6 — this is the single clearest signal in the methodology that a genuinely long-lived, cross-phase async thread type is wanted. Build it once here as a serialized-installment thread (one voice-note + one scene-setting image per installment, appended over time) and reuse it unmodified in later phases rather than re-inventing it per phase (see §5).
- **Weekend/community-topic pushes, kept occasional by design.** The guide flags Weekend recaps as "soon becomes highly repetitive — reserve for out-of-the-ordinary days," and explicitly says community topics are worth *revisiting* periodically because a re-visited topic is easier than a new one. Both map naturally to an opt-in, nurturer-initiated push (not a forced daily prompt) — a 2-minute voice note "here's what's going on" whenever something's actually worth sharing.
- **A light relationship-strength signal**, deliberately not a hollow gamification score: "weeks nurtured together," "shared stories: N," "words in your shared log: N" on the pair's profile — reinforcing an ongoing relationship, not a transactional booking count.
- **Host-language-only stays the default even async** — voice notes default to the host language (matching Rule Zero from Phase 1 through this phase); text logistics (scheduling) can reasonably break that, but it's a UI nudge, not a system-enforced rule, since scheduling logistics legitimately need a shared language sometimes.

---

## 5. Dependencies & shared infrastructure

What Phase 3 needs that Phase 1 doesn't have yet, ranked by how much of it is genuinely shared across Phases 2–6 rather than Phase-3-specific:

1. **Generic Listening Library** (cloud recording storage + "easy to follow" self-rating + re-listen counter + spaced resurfacing). Phase 2 needs it lightly ("perhaps two or three hours"); Phase 3 needs it heavily ("many more hours," 15h/week re-listening); Phases 4–5 depend on it just as much (mentor retellings, native-to-native recordings, the Ten-Step Discourse Session's clarified-portion re-listens). Today the app only offers device-only session-end downloads. Build once, not per phase.
2. **Generic Word Log** (timestamped, story-linked, non-memorization, shared grower+nurturer artifact). Today's `wordIds`/`wordsMet` are flat, contextless IDs — fine for Phase 1's picture-card recognition, structurally insufficient for Phase 3 onward where context and provenance ("which story, which nurturer, when") is the whole point. Phase 4's Vocabulary Recordings and Phase 5's word-elaboration work need the same schema.
3. **Async structured-thread primitives on top of `messages.ts`**: voice-note chaining/stitching into a single artifact, the Idea Board table, and the serialized "Epic" thread type. Phase 3 introduces all three; the guide itself says Epics continue unmodified through Phase 6, so this should ship as reusable infra, not a Phase-3-only feature.
4. **A generalized nurturer/mentor certification module framework** (quiz + pass threshold + badge), rather than another one-off hardcoded quiz like the existing Phase-1 golden-rules check. Phase 3 needs a storyteller module; Phase 4 needs a genuinely load-bearing **confidentiality/ethics** module (physician-level trust norms for life stories — currently entirely absent per `nurturer-side.md` §7); Phase 5 needs an elaboration-not-bare-definition module. Building the framework once now saves rebuilding the same quiz-plus-badge machinery three more times.
5. **Real community-exchange rollout** (`messages.ts`/`requests.ts`/`calls.ts` currently gated behind default-off `NEXT_PUBLIC_ENABLE_COMMUNITY_EXCHANGE`). Phase 3's 3B social gate has no path to satisfy without this being live; Phases 4–6's mentor relationships and communities-of-practice need it even more.
6. **Wallet/credits made real** (`credits.ts`'s `recordEntry` currently throws by design, pending a verified session/payment event). Needed to pay volunteer Story Bank contributors in exchange hours and to make the existing `exchangeOpen` marketplace flag mean something; every later phase's exchange economy depends on this eventually being wired up.
7. **Social/real-world-hours verification** (auto-counted call/message minutes with tagged non-nurturer contacts + a manual IRL log for things like taxi chats and neighbor teas that can't be auto-detected). Phase 3 introduces the concept via the 3B gate; Phase 6 needs an even richer version of the same idea ("weekly lifestyle budget," 10–20%+ of waking hours in the host world).
8. **A content-authoring pipeline for AI solo-mode "story packs"** (Bridge Story text + per-sentence, per-word glossary explanation/example scripts, culturally adapted per language). This is real content-production investment, not pure engineering — Appendix 2's four ready Bridge Story texts (Cinderella, Noah, Goldilocks, First Man and Woman) are the obvious starting corpus. The same pattern (pre-authored explanation scripts keyed to specific content) is likely reusable for Phase 5's "AI-assisted massaging of a real native-to-native recording once a transcript exists" idea flagged in §2.
9. **A richer pacing/difficulty-calibration widget** (words/story-minute, massaging-minutes/story-minute, 8-words/hour). The Phase 1 completion plan already flags a simpler version of this gap (S4, "new-words-per-hour pacing indicator") as a quick win; Phase 3 needs the per-story ratio version described in §1.1, built on the same underlying `wordsMet`/`hoursLogged` data once §5.2's real Word Log exists.

---

## 6. MVP cut

The smallest slice that is still authentically GPA and still delivers all three of the owner's asks:

1. **One activity, fully real, not eight half-built ones: the Bridge Story Activity** (it's the guide's own mainstay — "at least half of the time, and possibly most of the time"). Ship: live telling + recording in `/session`, plus a real segmented Massage Player with the actual negotiation moves (repeat / break-down / explain / example) and Word Log capture. Everything else in §1 (Scripts of Life, the Action Cartoon info-gap fix, Host Stories, all of 3C) ships later and is labeled "coming soon" in the app rather than left mislabeled as it is today.
2. **Real matching, not a demo roster.** Extend `nurturers.ts` with a `storytellingSample` clip and a manually-admin-reviewed `phase3Ready` flag (skip the full certification-module build for MVP — a human-reviewed badge is enough to prove the pattern). Real booking through the existing `requests.ts` + `calls.ts` stack, turned on at least for Phase-3+ profiles.
3. **One real AI fallback, honestly scoped.** A single hand-authored Bridge Story content pack (Cinderella, since Appendix 2 already ships a ready text) with Nuri TTS-telling it and canned explanations for a pre-identified 15–20 "hard words" — proves the pattern in 1–2 languages without needing the full content pipeline (§5.8) built out across all 10 `FULL_CONTENT_LANGS` on day one.
4. **A minimal pen-pal channel.** Reuse `messages.ts` voice notes as-is (zero new schema there) plus the one small Idea Board table and a scripted "Reminiscing voice-note" prompt sequence the nurturer can trigger after logging a Shared Experience. This is the cheapest high-signal pen-pal feature because it's almost entirely reuse.
5. **A minimal Word Log**, linked to story recordings + timestamps, exposed as a simple growing list — powers both Strengthening Vocabulary and the "stuff we both know, and it's growing" relationship signal, without needing the full generalized cross-phase schema (§5.2) on day one.

**Explicitly deferred past MVP:** hard enforcement of the 3B→3C social gate (ship as a soft checklist item, not a block); the Scripts-of-Life training flow; the Action Cartoon information-gap fix; native-to-native sampling; Reading Mode; the full Appendix-4 difficulty ladder; the certification-module framework; and wiring `credits.ts` for real (volunteer Story Bank contributors get handled manually/off-app in the interim).

This slice stays authentically GPA because it keeps the actual mainstay activity with the actual (not-inverted) massaging mechanic; it scopes AI honestly to the one activity the guide itself calls host-background-free, instead of quietly letting AI stand in for Scripts of Life or a real relationship; and it gives a genuine asynchronous relationship channel without dressing it up as a substitute for live sessions.
