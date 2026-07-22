# Phase 2 ("Emerging") — App Implementation Blueprint

Nuri (lange-gpa), project root `/Volumes/LaCie/GPA_Language_Learning`. Grounded in `research/knowledge-base/phase2.md` (the Thomson guide deep-dive), `app-implementation.md`, and `nurturer-side.md`. Written 2026-07-18.

Phase 2 = **Emerging**, hours 100–250, 150 h total, three sub-phases: **2A (50h, GP leads, zero nurturer prep)** → **2B (75h, nurturer leads, "clarifying the recording" is born here and becomes the cornerstone technique of Phases 2B–6)** → **2C (25h, life stories with simple pictures)**. The single primary activity is **Story-Building with Pictures** using wordless picture storybooks. The nurturer's role in this phase is still called "nurturer" (renames to "mentor" only at Phase 4) but her *function* shifts hard across the three sub-phases: 2A responsive recaster with zero prep → 2B lead describer with light prep → 2C life-sharer and bridge to other host people.

---

## 1. Core feature mapping

### 1.1 The Monolingual Half Hour + Recast (2A, Step 1) → `/session/storybuild` (new mode of the existing session room)

**What the grower sees:** the existing session room shell (`src/app/(app)/session/page.tsx`), but instead of the 12-card Dirty-Dozen deck, the "deck" is a wordless picture-book's pages, sourced from a new `src/lib/storybooks.ts` catalogue (mirrors `phase2-3-story-library.md`'s tiered bibliography: Introductory → Beginner → Beginner-to-Intermediate → Intermediate → Advanced, gated by the 7–8-new-words/hour tier-advance rule). A visible **timer with bell** — the guide's literal "set the timer, for thirty minutes you must function entirely in your new language" — replaces the countdown-only timer; it starts at 30 min and the app remembers a per-grower "current monolingual block length" that lengthens over the phase (30→60→90 min, toward "monolingual day/week" milestones), matching delta #4 in `app-implementation.md`'s gap list. The grower describes what they see aloud (recorded); the written word is never shown, matching the existing Phase-1 grower-stage convention.

**What the nurturer sees:** an amber "nurturer only" tray (same convention as the Dirty-Dozen human tray) with the current page enlarged, a **failure-note button** ("she couldn't get this across — tap to log for debrief, don't switch to English") instead of a chat box, and a **recast prompt** surfaced automatically from lightweight pattern-matching on what's flagged, echoing the guide's model exchange (GP: "This is boy" → N: "That is a boy"). This is new UI, not existing.

**What gets recorded:** Step 3's page-by-page description (nurturer describing only what was actually negotiated, using every new word) — a single continuous take per page, auto-chunked, uploaded via the same `useRecorder` hook the session room already uses.

**Progress tracked:** minutes in monolingual block (feeds the "monolingual day/week" milestone), pages completed per book, new-words-this-page count feeding the phase's explicit **7–8 words/hour pace target** (already flagged as missing app-wide in delta #2).

### 1.2 Step 0 Refresh (spaced review) → auto-injected at session start

Before new pages, the room monolingually re-surfaces the last meeting's pages (image + "what did you say about this?" prompt) exactly like the guide's Step 0. This is a thin wrapper reusing the same page-deck component with `mode: "refresh"` — no new game, just a state-machine addition to `sessionFlow.ts`'s pattern (cf. the existing Dirty-Dozen review-round logic, which already implements "earn the next card through review" — Step 0 is the story-building analogue of that same spaced-repetition instinct).

### 1.3 Debriefing (Step 2) → a 5-minute post-block panel, shared-language, failure-notes only

**What the grower sees:** the list of failure-notes logged during the block (both the GP's own written notes and the nurturer's), each rendered as a card: "You were trying to say X — how would you say it?" — answered by the nurturer in a short shared-language explanation, then immediately **re-recorded monolingually** (the guide's rule: debrief clarifies, then goes right back into the host language, new items get numbered too). A visible **"debrief-need" trend line** (minutes of debrief per meeting, trending toward zero) operationalizes the phase's own "monolingual days → monolingual weeks" milestone and the guide's design intent that debriefing "should altogether vanish by the end of Phase 2."

**Guardrail baked into the UI copy itself** (not just docs): the panel is explicitly labeled "Not for translating everything — only the things you flagged," matching the guide's emphatic anti-translation stance.

### 1.4 Numbered Word Tracking / Auditory Picture Dictionary continuation → cue-card system (shared with Phase 1's M11 gap)

Every new word/expression surfaced in Steps 1, 2, or 4 gets the **next sequential lifetime number** (continuing Phase 1's count — "word 947 → 948"), written onto a stored copy of the page image at the tapped location, and appended to the grower's word-history (`profile.wordIds`). This is the same fix Phase 1's completion plan already flags as foundational (M11) — Phase 2 is the second consumer of it, not a new build. The picture-page annotations are new (a tap-to-pin UI on the page image), the underlying numbering/history store is shared infrastructure.

### 1.5 Listen-and-Point (and Act Out) (2A Step 4–5) → new comprehension-check mode

**What the grower sees:** the same numbered-word pins from 1.4, now used as a quiz: nurturer (or, per §2, Nuri) says a word/phrase/sentence, grower taps the pinned region on the picture, or — for verbs — the UI prompts "act it out, then tap 'done'" (self-reported, not machine-graded, matching the guide's charades framing). This is structurally the existing Dirty-Dozen tap-the-picture mechanic (`/practice/vocabulary`'s reveal→review pattern) retargeted from a discrete emoji grid to a single annotated picture-book page — genuinely reusable code, not a new game engine.

**What gets recorded:** a brief summary clip of the whole listen-and-point round (Step 5), auto-appended to the Listening Library (§5) with a "point along while you listen" homework tag.

### 1.6 End-of-Book Activity — Three Past-Tense Versions (2A/2B Step 6) → "Hearing the Story" recording flow

A dedicated three-slot recording flow that fires when a book's last page is reached: **(a) careful page-by-page past-tense narration** (nurturer walks back through every page, prompted per-page by the same annotated pages from 1.4, recording continuously), **(b) flowing whole-story while still watching pages** (single take, no prompts), **(c) whole-story from memory, book closed** (single take). All three are labeled and filed into the Listening Library as a set — this is the guide's engineered "flying brick" grammar-salience moment (here-and-now → past tense) and the app currently has zero representation of it (delta #8). The grower's UI at this moment shows a small "first past-tense story!" milestone badge, tied to the phase's own stated milestone language.

### 1.7 Story Retelling by the GP (Step 7/8) → self-paced retell recorder

After Step 6, the grower gets a simple "your turn — tell it your way" recorder (no timer pressure, no correctness scoring — matches the guide's insistence that nurturers must NOT act like teachers here). The nurturer's tray shows a reminder banner: "Assist conversationally. Do not correct toward her version." Recorded and filed to Listening Library, tagged by book + attempt number so growers can hear their own retelling improve/lengthen/shift toward past tense across the phase — a concrete, motivating artifact the guide doesn't explicitly demand but that the app's existing "re-listen to your own recordings" pattern (Talking Picture Dictionary) already establishes as good UX.

### 1.8 Clarifying the Recording (2B Step 2, the cornerstone) → the Clarify Player

**What the grower sees:** a waveform/timeline player of the nurturer's freshly-recorded page description (Step 1 of 2B), with a **"I didn't get this" marker** the grower can drop at any point during playback (pause-and-flag, not stop-and-translate). Each marker opens a small monolingual negotiation panel: nurturer speaks a definition/example scenario (the guide's "in vain" sweeping example is the canonical shape) *in the host language*, grower can record a "let me check I understood" confirming example, and the segment gets re-recorded once understood. This screen doesn't exist anywhere in the app today (per `app-implementation.md` §7's gap list, none of the phase 2–5 recording-centric loops have digital tooling beyond raw record/download) and it explicitly should be built as **shared infrastructure** (§5) — Phase 3B, Phase 4's Two-Recorder Technique, and Phase 5's clarifying-meeting loop are all the same interaction pattern at different intensities.

**What gets recorded:** the original page description, every clarification exchange, and the final "clean" version — three related clips, threaded together so later re-listening can jump straight to the clean take while the negotiation history stays archived for the grower's own record of their growth.

### 1.9 Word–Sentence–Word Vocabulary Recording (2B Step 4) → guided recording template

A structured recording UI with three prompts in sequence: "say the bare word" → "say a sentence that makes the meaning obvious, not vague" (with an in-app example pair modeled on the guide's own contrast: "Churn. The woman is churning the butter. Churn." vs. the bad counter-example "Churn. I don't have a churn. Churn.") → "say the bare word again." This directly operationalizes the guide's explicit note that **the grower must coach the nurturer** on this format — the app can carry that coaching by showing the good/bad example pair to both parties before recording starts, rather than leaving it as an unstated social skill.

### 1.10 Small Talk + One New Fact (daily ritual across all of 2A–2C) → see §4 (this is the seed of the pen-pal layer, not just a session-opener)

### 1.11 Phase 2C — Draw As You Go / Life Story → the Life-Story Canvas

**What the grower sees:** a simple drawing surface (stick figures / "triangle people," per the guide — deliberately NOT a rich illustration tool) that persists as they tell their life story aloud (recorded continuously); each drawn element is a lightweight pinned annotation, same underlying primitive as 1.4's picture-pin system. **What the nurturer sees:** after the telling, she retells the story in past tense using the drawing as her prompt (recorded, video-optional) — the flip side of Step 6's narration flow, reusing that same recording-slot component. **What gets recorded:** the GP's own telling + the nurturer's past-tense retelling, both filed to Listening Library. The guide also prescribes **Option Two (prepare in advance)** and **Option Three (all-in-one setting picture, reused across many events)** — both are just alternate entry points into the same canvas primitive (pre-draw before recording vs. one persistent canvas reused across sessions), not separate features.

**Escape hatch, encoded as a real UI choice, not just a doc note:** the guide explicitly allows postponing 2C to Phase 3 and extending 2B by 25h if it's too hard — this should be a literal button ("Not ready for life stories yet → add 25h to Story-Building instead") on the 2C entry screen, not something buried in settings.

### 1.12 Nurturer's own life story + conversation-observation (2C) → see §3 and §4 (these are relationship/sourcing features, not solo activities)

### 1.13 Supplementary activities (Lexicarry, Busy Pictures, Process Series, role-plays, phonetic drills)

These stay as change-of-pace variants slotted into the Nurturer Studio's Session Planner (`/nurture`) as alternate activity cards, not separate flows — consistent with how the guide itself frames them ("for an occasional change of pace") and with the existing Session Planner's activity-picker pattern.

---

## 2. Solo / AI-partner fallback design

The guide's own quality bar for any substitute activity (Appendix 3) is explicit: it must "provide massive comprehensible input; provide extensive opportunities to interact richly on a wide range of topics; foster steady growth in relationships with the nurturer (and other host people); help the growing participator become a redemptive presence in the lives of host people." Two of those four are structurally about a *real relationship* — no AI passes that bar. The design below is honest about which slice of each activity an AI can carry and which it cannot.

### 2A — Monolingual Describe-What-You-See: **AI CAN authentically substitute for the tongue-loosening mechanic, with a hard label that it is rehearsal, not a real 2A meeting.**

Why this one is legitimate: 2A's nurturer function is explicitly mechanical and content-free — "guess the point... and help you formulate it well," recast, ask power-tool questions. It requires no personal history, no cultural interpretation, no relationship. It's the same recast-and-question loop the AI nurturer Nuri already runs for the Dirty Dozen.

**Concrete design (extends `sessionFlow.ts` + the existing TTS pattern):** Nuri-the-mascot shows a picture-book page, prompts "What do you see?" (host-language, TTS), listens via speech-to-text, and when it detects a broken/incomplete utterance, recasts it aloud in well-formed host-language ("That is a boy") — the exact GP→N model exchange from the guide, scripted as a small template library keyed by detected content words rather than true generative dialogue (keeps it honest and low-risk; over-claiming free-form conversational AI here would be a credibility problem, since the guide's nurturer recasting is a skilled, contextual judgment call a template can only approximate). Power-tool phrases ("What is this?", "What kind of X is this?") are pre-scripted buttons, same UX as the existing Power Phrases game. A visible banner throughout: **"Solo rehearsal — for the real thing, book a nurturer."** New words the grower produces still get logged into the numbered word history, but they're tagged `source: "solo"` so the words/hour pace metric (§1.1) doesn't quietly count solo talking-to-yourself minutes as equivalent to real negotiated meaning with a human, which the guide would not sanction as equivalent growth.

### 2A — Listen-and-Point / word recordings: **AI CAN substitute directly**, reusing 1.5's mechanic with Nuri as the voice instead of a nurturer's tray. This is nearly identical in kind to the existing Dirty-Dozen review round and is low-risk because it's pure comprehension-checking against already-established (human-negotiated) vocabulary — it isn't originating new content, just drilling it.

### 2A End-of-Book three-version narration (Step 6): **AI can offer a *pre-authored* version as a bridge, but it is explicitly NOT the phase's real payoff.** A human nurturer's spontaneous past-tense narration of pages **she and the grower built together** is what makes the "flying brick" moment land — it's tied to content the two of them actually negotiated. An AI narrating the same wordless picture book generically (not from the grower's own negotiated Step 1–5 content) is comprehensible input about *the book*, not about *their shared story* — genuinely useful listening practice, but a different, thinner thing. Ship it labeled as such: "Nuri's version of this story (for extra listening practice) — not a replacement for your nurturer's version, which is built from what YOU actually talked about."

### 2A/2B Story Retelling (Step 7/8): **AI CAN be a listening audience for rehearsal**, not for real assessment. Nuri prompts "tell me what happens" and simply listens/records without correcting (matching the "don't act like a teacher" rule) — useful as a low-stakes rehearsal before retelling to the actual nurturer next meeting, explicitly framed that way in-app.

### 2B Nurturer's extemporaneous page description (Step 1) with her own **misreadings-as-cultural-perspective**: **NO — an AI structurally cannot substitute for this, and the blueprint should not pretend otherwise.** The entire pedagogical point (per the guide's own worked examples — a police-officer nurturer reading a wordless book as a *law code*, a Kazakh nurturer reading shoes as school-uniform shoes and inferring an age) is that a *real host person's real cultural lens* shows up unscripted in her description. An LLM has no host-world lived experience to misread the picture *from*; anything it generated would be a synthetic approximation of "a culture," which is precisely the kind of hollow imitation the owner's brief warns against. **What the AI CAN still offer:** re-listening to the *nurturer's own past recordings* of page descriptions (this is just playback, not substitution), and a "practice clarifying" mode where Nuri poses comprehension questions against an *already-recorded human description* the grower hasn't fully processed yet, rehearsing the Clarify Player skill (1.8) before or between real sessions.

### 2B Clarifying the Recording (Step 2, the cornerstone technique): **NO for originating the negotiation, YES for rehearsing the skill against past human recordings.** The negotiation content (a real host person's example scenarios, register notes, cultural framing) must come from a real person. But the *skill* of "notice you didn't understand, flag it, ask a clarifying question" is trainable solo: Nuri can quiz the grower against their OWN Listening Library backlog ("here's a segment you flagged three weeks ago and never resolved — want to try explaining it to me now, in your own words, to see if it's landed?") — genuinely useful spaced-practice that keeps the *skill* warm without inventing fake cultural content.

### 2B Word–Sentence–Word Vocabulary Recording: **AI CAN substitute for the drilling half** (this maps directly onto the existing `/practice/repeat` "Re-live Your Words" game, which already implements listen→say-aloud→listen-again on real vocab). It **cannot originate new context sentences** — those need to be meaning-revealing in a way only someone who actually knows the word's real-life texture can write well (the guide's own bad-example warning — "I don't have a churn" — shows even human nurturers get this wrong without coaching; an AI is worse-positioned, not better). AI mode should only ever replay/drill word-sentence-word sets a real nurturer already recorded.

### 2C Life-Story telling and the nurturer's reciprocal life-story sharing: **Structurally NOT substitutable, full stop.** This is the plainest case in the whole phase — Phase 2's own "what done looks like" section says the relationship "deepened considerably because you will have learned much about one another's lives," and that requires two real lives. An AI "life story" would be fabricated content presented as if it were a real person's biography — exactly the kind of hollow imitation the brief warns against, and arguably worse here than elsewhere since it risks the grower forming a parasocial "relationship" with a fiction instead of pursuing the real host person the phase exists to produce. **What the AI CAN still offer:** a **rehearsal mode for the grower's OWN life story** before telling it for real (Nuri listens, times it, gently prompts "what happened next?" the way a conversational audience would, without ever supplying its own life story back) and a **drawing-practice mode** for getting comfortable with the stick-figure/triangle-people convention before the real session. Both are legitimate "get ready for the human" bridges; neither claims to be the relationship itself.

### 2C conversation-observation ("watch a native + another host person build a story"): **NO — cannot be substituted at all**, even as a thin bridge; there is no solo version of watching two real people interact. The honest fallback here is not an AI activity but a **content substitute**: surface a small library of real (consented, recorded) nurturer-to-nurturer or nurturer-to-friend story-building clips from the Listening Library ecosystem (§5) that other growers' sessions have generated, so a grower without an available second host person nearby can still *watch/listen to* an authentic example while waiting for their own chance to observe live. This should be labeled as observation content, not treated as interactive practice.

### Summary table

| Activity | AI substitute? | What ships |
|---|---|---|
| 2A Describe + recast | Partial (mechanical only) | Nuri rehearsal mode, labeled "solo rehearsal" |
| 2A Listen-and-point | Yes | Direct reuse of Dirty-Dozen tap mechanic |
| 2A/2B End-of-book 3-version narration | Partial | Nuri's generic narration as extra listening input only |
| 2A/2B GP retelling | Yes (as audience) | Rehearsal recorder, no correction |
| 2B Nurturer's page description (cultural misreadings) | **No** | Re-listen to past human recordings only |
| 2B Clarifying the recording | Partial (skill only) | Spaced-practice quiz against past human recordings |
| 2B Word-sentence-word | Partial (drill only) | Reuse `/practice/repeat` on human-recorded sets |
| 2C Life story (both directions) | **No** | Solo rehearsal recorder + drawing practice only |
| 2C Conversation observation | **No** | Passive library of real consented clips, not interactive |

---

## 3. Finding real participants for this phase

Phase 2's helper is still a **nurturer** (paid, trained) — the role doesn't rename to "mentor" until Phase 4 — but her *job* changes shape three times within the phase, and the guide is explicit that the ideal is **continuity with the same nurturer from Phase 1**, not a fresh match: "Relationship with the main nurturer deepened considerably because you will have learned much about one another's lives," and the 2A activities are explicitly framed as reusable for "orienting a **new** nurturer to her role" — i.e. new-nurturer onboarding is the exception path, not the default.

### 3.1 Default: "Continue with your nurturer" (not a new marketplace search)

On a grower's Phase-2 entry (`phaseForHours` crossing 100h, per the existing auto-promotion logic in `store.tsx`), the Nurturer Studio / `/marketplace` surface should default to **re-requesting the same nurturer(s)** the grower worked with in Phase 1, via the existing `requests.ts` `sendRequest` flow, rather than presenting a fresh roster browse. This is a UI-ordering decision, not new backend — `requests.ts` already resolves by opaque profile id.

### 3.2 Nurturer certification gains a Phase 2 module (closes gap S5 from `nurturer-side.md`)

Today `nurturerCertStatus` is one global pass/fail gated on six Phase-1 golden rules; nothing stops a Phase-1-only-certified nurturer from being booked into a Phase 2 session she doesn't know how to run. Add a **Phase 2 module**, itself split by sub-phase since the nurturer's job differs so much between them:
- **2A module** (short, since 2A "requires no preparation" per the guide): guess-and-recast drill, failure-note discipline, don't-switch-to-English.
- **2B module**: extemporaneous description (no scripting), misreadings-are-culture-not-error framing, monolingual clarification technique, word-sentence-word context-sentence coaching.
- **2C module**: life-story reciprocity norms, drawing-while-telling pacing, "don't steer her back on track" (a Phase 4 mentor norm that the guide already gestures at in 2C's life-sharing).

`phasesGuided` on the nurturer roster (`src/lib/nurturers.ts`) — currently cosmetic, unused in matching per the nurturer-side gap list — becomes a real filter: only nurturers who've passed the relevant module surface for Phase 2 requests, and the marketplace card shows which sub-phase modules she holds (a 2A-only nurturer is honestly still useful for a grower just entering Phase 2, but shouldn't be presented as ready for 2C life-story sharing).

### 3.3 Group sourcing (2–4 GPs), not just 1:1

The guide's stated ideal group size is **2 to 4 growing participators per nurturer** ("more fun and natural... care needs to be taken to insure that all participants have ample opportunity to participate"), a real methodological preference, not a scheduling convenience. The Convex schema already has `parties` + `partyGuests` tables (per `nurturer-side.md` §6) that aren't yet wired to the live session room's single-grower assumption. Phase 2 is the natural place to build **"join a story-building group"**: a grower can either book solo (the app explicitly warns solo GPs "need more picture books because all the creativity demand falls on one person" — surface that as an honest heads-up on the solo-booking path) or join/form a 2–4 person group tied to one nurturer and one book, using the existing party tables.

### 3.4 Sourcing new nurturers when continuity fails

When a grower's Phase 1 nurturer isn't available/willing to continue (relocated, doesn't want ongoing work, etc.), fall back to the existing `/marketplace` roster browse, filtered by the Phase 2 module badges from 3.2, with a visible "new nurturer — expect a short 2A orientation meeting" note (matching the guide's own framing of 2A as new-nurturer onboarding material).

### 3.5 Incentive structure — unchanged mechanism, phase-aware pricing signal

Nurturers stay **paid** through Phase 2 (the "paid through Phases 1–5" rule from `nurturer-side.md` doesn't change until the mentor-relationship phases), using the existing PPP-scaled `ratePerHourUsd` + `exchangeOpen` time-for-time fields already on the roster. What's new for Phase 2 specifically: the credit ledger (`credits.ts`) needs its currently-disabled `recordEntry` wired to a real verified-session event (a known, already-flagged gap, not new to this phase) before exchange-hours can actually be earned for the extra recording-heavy work 2B/2C ask of nurturers — flagged again here because Phase 2's meeting shape (30–110 min cycles, heavy recording load) makes fair compensation tracking more load-bearing than Phase 1's flatter game-based meetings.

### 3.6 2C's built-in "bridge to other host people" as a sourcing feature, not just an activity

The guide explicitly has the nurturer "introduce the grower to her own friends" and stages a conversation-observation activity with "another host person" (§2C). This is naturally a **guest-invite feature** on top of 3.3's group infrastructure: the nurturer can add a one-time guest (via `partyGuests`) to a 2C session for the observation/co-building activities specifically — the app's first structured mechanism for a nurturer to widen the grower's host-world network, which is exactly what 2C is supposed to start doing ("communities of practice... deepen over time").

---

## 4. Pen-pal-style relationship growth

Phase 2 hands the pen-pal design almost gift-wrapped: the guide has an **explicit, named daily ritual** ("learn at least one new fact about your nurturer each day, using only the host language... You can also share something parallel about yourself") and an entire sub-phase (2C) built around **reciprocal life-story exchange with drawings**. Both map directly onto existing infra (`convex/messages.ts`) with modest additions — this is not a green-field messaging build.

### 4.1 Daily "One New Fact" thread — a structured message type, not generic chat

`convex/messages.ts` already threads 1:1 by sorted-clerk-id pair with a `kind` field (currently `"text"`, schema already reserves `"voice"`). Add a third `kind: "fact"` message: a small structured card (not a freeform bubble) with two slots — "Something new about [nurturer]" and "Something parallel about me" — sent host-language-only (the UI can gently nudge this by defaulting the input's language hint, though it can't enforce it). This directly implements the guide's daily ritual as an **async** feature instead of something that only happens inside a live meeting, which is exactly the "ongoing, asynchronous, deepening" shape the owner asked for. A running "facts exchanged" counter becomes a visible relationship-depth marker on the grower's profile of that nurturer — separate from and complementary to the hours/vocab progress bar.

### 4.2 Voice-note postcards, finishing what the schema already started

`schema.ts`'s `messages` table already reserves `storageId` + `durationSec` for `kind: "voice"`, but `sendMessage` in `messages.ts` currently only handles text. Phase 2 is the natural forcing function to finish this: add `sendVoiceMessage` (same rate-limit/block-check plumbing as `sendMessage`, uploading through Convex file storage). Concretely useful here because so much of 2A/2B homework is already audio (re-listening to page descriptions) — a grower can send a **short voice postcard** describing a picture-book page or a life event between live sessions ("homework, but shared, not just archived"), and the nurturer can voice-reply with a recast, exactly like a real Step 1 exchange but asynchronous. This is authentic to the phase (it's literally the Describe-What-You-See + recast pattern, just decoupled from the timer) rather than generic chat filler.

### 4.3 The shared Life-Story Canvas as an ongoing async object (extends §1.11)

Rather than a canvas that only exists inside a single 2C session, make it a **persistent, shared, append-only object per grower-nurturer pair** — both can add a new drawn chapter (with an attached voice note) whenever, over weeks. This is the single most on-methodology pen-pal feature available in Phase 2: the guide's own "All-in-One Picture" option ("one rich setting map... reused for telling many events set there") is *already* describing a persistent shared artifact revisited over time, not a one-shot activity — the app just needs to let it live outside the live-session boundary and be visited asynchronously. Each new chapter posted by either party is a small "the story grew" notification to the other, giving the relationship a visible cadence between live meetings.

### 4.4 Gifted Listening Library entries as relationship artifacts

When a nurturer finishes an end-of-book three-version narration (§1.6) or a life-story retelling (§1.11), it's currently just filed to the archive. Surface it explicitly as something **she gave the grower** — a small "New from [nurturer]: the full story of [book]" card in the pen-pal thread, distinct from a plain library update. This costs almost nothing extra (it's the same recording, just surfaced differently) and reinforces that these recordings are relationship output, not homework output — matching the guide's own framing that the recordings are partly *for* the relationship ("the transformation... from seeing the host world in home-world ways to seeing it more and more in host-world ways").

### 4.5 What this deliberately does NOT become

No generic free-chat wall, no unstructured DM-everything default. The guide is explicit that debriefing (shared-language chat) should trend toward *zero* across Phase 2, and that small talk "arises out of activities" rather than replacing them (a warning stated more sharply for Phase 3, but the seed is here in 2A's "avoid the temptation to converse extensively with your nurturer in English"). The pen-pal layer above is deliberately built from **named, phase-authentic rituals** (fact-a-day, voice postcards tied to real activities, shared life-story canvas, gifted recordings) rather than an open messaging feed, so it can't quietly become an English-language social app riding on top of a language-learning one.

---

## 5. Dependencies & shared infrastructure

Phase 2 needs several things Phase 1 doesn't have yet. Most of them are not phase-2-specific — they're the load-bearing plumbing Phases 3–6 will all need too, so they should be built once, generically, here.

1. **Generic Listening Library** (recording archive + re-listen player, with labels/tags and a "point along while you listen" replay mode). Today the session room only offers a single end-of-session clip download — no archive, no cross-session re-listening. Phase 2's homework model (re-listen "several times" same-day, then "occasionally over the next few years") makes this unavoidable now, and Phases 3 (massaging), 4 (life-story re-listening), 5 (clarifying-meeting re-listening) all depend on the same object. **Build once, generically.**

2. **Generic async thread / attachment system**, extending `convex/messages.ts` beyond `kind: "text"` to actually support `"voice"` (schema-ready, mutation not yet built) and a new `"drawing"`/attachment kind for the Life-Story Canvas. This is the backbone of §4 and will be reused by every later phase's pen-pal layer (Phase 4's confidentiality-sensitive life stories will need the same thread primitive, with stricter access controls layered on).

3. **Nurturer phase-certification as a multi-module system**, not a single global pass/fail. Phase 2 needs 2A/2B/2C modules (§3.2); Phases 3–6 will each need their own. Build the module framework once (module id, prerequisite chain, per-module quiz bank, `phasesGuided`-style matching filter) rather than hand-rolling a new gate per phase.

4. **Cue-card / numbered-word cross-phase tracking**, already flagged as Phase 1's foundational gap (M11 in the completion plan) — Phase 2 is the second consumer (continuing the "word 947 → 948" sequential count) and every phase after it keeps counting the same iceberg. This must be fixed once, upstream of Phase 2, not per-phase.

5. **Group session support** (wiring the existing `parties`/`partyGuests` tables into the live session room, which currently assumes exactly one grower + one nurturer). Phase 2 wants 2–4 GPs; Phase 1's own nurturer-side research describes 2–6 GPs per nurturer as the *original* GPA context. Building group support now benefits Phase 1 retroactively too.

6. **A generic "structured multi-take recording" component** — record → flag/annotate → re-record clarified segment → thread the takes together. This exact shape appears as: 1.8's Clarify Player (2B), Phase 3's Record-and-Massage Loop, Phase 4's Two-Recorder Technique, Phase 5's ten-step clarifying-meeting loop. Building it as one reusable primitive with light per-phase configuration (segment length, prompt style) avoids four near-duplicate builds later.

7. **A generic timed-monolingual-block-with-debrief-window UI** (bell timer + failure-note capture + shared-language debrief panel + fade-to-zero tracking). Phase 2A originates this pattern; Phase 3's sessions (10–15 min small talk, then multi-hour monolingual blocks) reuse the identical shape.

8. **Real credit/payment event wiring** for `convex/credits.ts` (`recordEntry` currently throws by design, pending a verified session/payment event). Phase 2's heavier recording workload for nurturers (page-by-page recordings, three-version narrations, word-sentence-word sets) makes fair nurturer compensation more load-bearing than Phase 1's simpler game-based meetings — but this is infrastructure every paid phase (1–5) needs, not Phase-2-specific.

---

## 6. MVP cut

The smallest slice that is still authentically GPA and still touches all three of the owner's asks (matching, solo-fallback, pen-pal) — deliberately deferring group sessions, the full Clarify Player, and the Life-Story Canvas to later passes:

1. **Matching (thin):** "Continue with your Phase 1 nurturer" as the default Phase-2 entry path (§3.1) — pure UI re-ordering on top of the existing `requests.ts`, no new backend. Skip the full 2A/2B/2C certification-module system (§3.2) for v1; ship a single combined "Phase 2 ready" cert flag reusing the existing quiz-gate pattern, and defer the granular per-sub-phase modules.

2. **Solo fallback (thin but real):** ship exactly one AI activity — **Nuri-guided Monolingual Describe-What-You-See with recast** (§2, 2A row) — because it's the one activity in the whole phase that's methodologically legitimate for an AI to run solo, and it reuses `sessionFlow.ts` + the existing TTS/STT pattern almost as-is. Pair it with the cheapest possible bridge for everything else: a bare-bones **re-listen player** for whatever recordings a grower already has from real sessions (no annotation, no flagging yet — just playback with speed control, reusing `/practice/repeat`'s existing player chrome). That single player quietly covers most of Phase 2's homework requirement (which is, overwhelmingly, "listen again") without building the full Listening Library system yet.

3. **Pen-pal (thin):** ship **4.1 (daily One New Fact card)** and **4.2 (voice-note postcards)** only — both are near-direct extensions of `convex/messages.ts`'s existing shape (one new `kind`, one new mutation each). Defer the shared Life-Story Canvas (4.3) and gifted-recording surfacing (4.4) to the follow-on pass, since they depend on the not-yet-built Listening Library and attachment system (§5.2).

This MVP deliberately ships **zero new nurturer-facing recording tooling** beyond what already exists (raw record/download) — the Clarify Player, three-version narration flow, and word–sentence–word template are all real fidelity gaps but not required to prove out the matching/solo/pen-pal thesis for Phase 2. They're the natural next slice once the shared infrastructure in §5 (items 1, 2, and 6 especially) exists.
