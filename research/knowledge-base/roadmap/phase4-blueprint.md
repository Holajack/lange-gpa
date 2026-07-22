# Phase 4 — Deep Personal Relationships — App Implementation Blueprint

Nuri (lange-gpa), project root `/Volumes/LaCie/GPA_Language_Learning`. Grounded in `research/knowledge-base/phase4.md` (Thomson's guide), `research/knowledge-base/app-implementation.md`, and `research/knowledge-base/nurturer-side.md`. Compiled 2026-07-18.

**What Phase 4 actually is, in one line:** the "sink-or-swim" 500-hour middle phase where the helper role changes from trained **nurturer** to untrained **mentor**, and the grower does three ethnography-style activities — Life Story (300h/5 people), Walk-of-Life Conversations (100h/5 roles), Detailed Observation (100h) — almost entirely through **recording**: an initial recording, a clarification recording, word recordings, and recursively-exploding expansion recordings, re-listened and archived into a personal Listening Library. Confidentiality is explicit and physician-grade. This is also literally where the app's fixed 237-word picture-card vocabulary model stops being the right data model — Phase 4 vocabulary is personal, freeform, and sourced from real conversations.

---

## 1. Core feature mapping

### 1.1 The Life Story Activity (the phase's most-fruitful activity — could carry the whole 500h alone)

**New surface: a Mentor Session Room**, separate from `/session` (which is hard-wired to the Phase-1 Dirty Dozen state machine in `src/lib/sessionFlow.ts` and should stay that way — Phase 4 has no fixed lesson clock, so it needs its own flow, not a repurposed one).

What the **grower** sees:
- A single big prompt card: "Please tell me the story of your life" (localized per the guide's exact opener), a Record button, and — deliberately — almost nothing else. The guide's Rule 1 ("no rules govern the storyteller") means the UI must not offer topic chips, chapter prompts, or agendas; the app-vs-guide delta report flags exactly this failure mode already present in `phases.ts`'s copy ("childhood, school, work, love, loss" — the guide's own canonical anti-example is "Did you have any girlfriends?").
- After the initial recording stops, the grower moves into **Clarify**: a waveform playback view where they can pause anywhere and drop a timestamped flag, tagging it with one of the guide's own six gap types (unknown word / unknown concept / idiom / polysemy / missing cultural background / pronunciation). Each flag opens a small "log this word" field that writes into the grower's personal **Word Log** (a new freeform data type — see §5 — distinct from `vocab.ts`'s fixed 237-item deck).
- **Expansion planner**: while listening back, the grower can mark any span as an "expansion candidate" (mirrors the guide's Rule 3 — expansions may only come from things mentioned or alluded to). Each candidate becomes a row in a digitized **Stories to Record / Parts to Expand / Topics to Explore** tracker with the guide's own checklist columns: recorded ✓ / clarified ✓ / # new words / checked for new topic ideas ✓ / listened again ✓ / listened later ✓.
- Expansion recordings nest under the parent story as child recordings — this is the primary/secondary/tertiary recording chain the guide describes, and it becomes the spine of the grower's Listening Library entry for that mentor.
- A **Retell** step at the end of a cycle: the grower records a short "let me see if I understood your story" summary, tagged as its own recording kind.

What the **mentor** sees (an extension of the existing Nurturer Studio at `src/app/(app)/nurture/`):
- No script, no cue box (unlike the Phase-1 tray) — the mentor doesn't need lines, per the guide's "no training needed." Instead: a persistent **confidentiality banner** ("Only [grower] will hear this unless you say so. You can erase anything, any time.") and an always-visible **instant erase** control on every recording — this is a hard requirement, not a nice-to-have, given the guide's physician/lawyer/priest-level trust framing.
- A relationship header showing hours logged toward this mentor's Life Story thread and, if this is a paid relationship, the running hour count against `ratePerHourUsd`.

**Recorded / tracked:** initial story, full clarification conversation, word recordings, every expansion (recursively), the retell — see §9 of the KB for the full inventory. All of it files automatically into a per-mentor Listening Library.

### 1.2 Walk-of-Life Conversations

Same recorder shell as §1.1, different entry point: instead of the open life-story question, the grower picks (or types) a **role/profession prompt template** ("What do you do in a typical day/shift as a ___?") — the guide's typical grand-tour question. This activity is explicitly about **present-time role knowledge**, not biography, so the UI should visually separate it from Life Story rather than reuse the exact same screen unlabeled (the current `phases.ts` copy already blurs this — see KB delta #6).

Adds a **Grand Tour Form** tracker (the Stories-to-Record columns plus a "checked for lists of life" column) and a lightweight **Lists-of-Life** widget: grower and mentor build a domain list live — the app shows the grower the cue "anything else?" to ask aloud after each item, and lets them tag a cover term at the end ("What are these examples of?").

### 1.3 Detailed Observation (Observe and Describe)

Structurally different from the other two — it's solo fieldwork *plus* a mentor session, not a mentor-led conversation from the start:
- **Solo fieldwork mode**: a "New observation" flow with a **jottings scratchpad** (freeform shorthand text + simple diagram/position-coding helper, mirroring the guide's "3RA / D / C" seat-coding example) and a discreet one-tap voice-memo button styled to look like an ordinary phone call screen — this is a direct implementation of the guide's own Tawnya Gililland trick ("it will appear that s/he is simply having a phone conversation"). Immediately after capture, a nudge fires: "Write this up now — head notes decay fast."
- **Mentor session**: the grower plays back their notes/voice memo and describes the scene exhaustively (recorded); the mentor gives their own recorded re-description and interpretation, deliberately working in word-log items.
- **Triangulation tracker**: a simple checklist to log 2–3 additional hosts' confirmation or dissent on the same interpretation — this is the feature that most needs the pen-pal layer (§4) rather than a live session, since triangulation partners are typically NOT the primary mentor.

### 1.4 Vocabulary Recordings

`p4-vocab` already has `practiceHref: /practice/repeat`, but that route plays the fixed `vocab.ts` deck. Phase 4 needs a **"My Word Log" mode** of the same screen: word–sentence–word sandwiches built from the grower's own session-derived Word Log, in the mentor's actual recorded voice pulled from the real session audio, not synthetic TTS reading a canned sentence. This is the single biggest content-model departure Phase 4 forces — see §5.

### 1.5 Record Yourself for Feedback

`p4-feedback` already has `practiceHref: /practice/speaking`; extend it with a **mentor-annotation layer**: after the grower records, the mentor (live or async via the pen-pal thread) marks each sentence and supplies the guide's three-column chart (What I said / How a host person would say it / optional note on the nature of the problem).

### 1.6 Hole-Finding

`p4-holes` already has `practiceHref: /practice/vocabulary`; the guide's actual Phase 4 hole-finding content (Tom & Jerry / silent-film narration, busy-picture description, describing a Detailed Observation) is different from the fixed-deck vocabulary drill currently behind that route — needs its own content mode reusing the busy-picture asset pipeline already scoped for Phase 1/2 (`p2-busy`).

### 1.7 Writing Activities (new — Phase 4 is where writing formally begins)

A **journal-to-mentor** feature: the grower writes entries addressed to a host mentor and gets feedback. This maps directly onto the pen-pal thread (§4) — it's not a standalone writing app, it's a message type.

### 1.8 Ways to Talk a Lot (the output-volume menu)

A checklist/suggestion surface listing the guide's eight techniques (retell mentors' content, retell anonymized stories widely, tell your own life story, epic story in installments, join host groups, active social life, etc.) with a simple **retelling counter** per story ("told 3 times — the guide says you'll see the biggest jump by the 4th–5th telling").

### 1.9 The confidentiality/consent layer (cross-cutting, not optional)

Every recording surface in §1.1–1.7 must carry: the sole-listener promise, an explicit share/permission step before any clip leaves the 1:1 pair, and an instant, durable erase action. The current `/session` `ConsentDialog` is session-only and never persisted (per `app-implementation.md` / `nurturer-side.md`) — Phase 4 cannot ship on that pattern; see §5.

---

## 2. Solo / AI-partner fallback design

Phase 4's core activities are, by the KB's own diagnosis, structurally about **a real person's real biography and real role-knowledge** — this is the phase where "AI can substitute" is least true anywhere in the six-phase curriculum. Being blunt about that, activity by activity:

**Life Story Activity — NO, cannot be substituted.** Nuri has no biography. Having the AI "tell its own life story" or interview the grower with a synthetic mentor persona would fabricate exactly the content the activity exists to make real, and would train the grower on falsehoods (worse than nothing — recordings archived into a Listening Library are meant to be re-listened for years). The bridge, not the substitute:
- **Re-clarify queue**: Nuri surfaces the grower's own backlog of previously-flagged, still-unclarified gaps from REAL mentor recordings and re-plays those exact clips, using the same pause/replay pattern as `/practice/repeat`. This is authentic comprehension drilling on real host-language audio, not imitation.
- **Rehearsal, not replacement**: Nuri-as-listener lets the grower practice *telling their own life story* (a prescribed Phase 4 activity, and part of "Ways to Talk a Lot") before delivering it to a real mentor or a group — explicitly framed in the UI as "rehearse before you tell it live," never as "you told your story to Nuri today."
- **Word Log drilling**: word-sentence-word re-practice pulled from real sessions (§1.4) — this is legitimately AI-substitutable because the content already came from a human.

**Walk-of-Life Conversations — NO for the interview itself**, for the same reason: it needs a real person's real occupational knowledge. Bridge: Nuri can coach the grower's **question-forming technique** — practicing how to ask typical/specific/guided/task-related grand-tour questions, mini-tour questions, experience/structural/contrast questions, on a generic or scripted scenario — so the grower shows up to the real mentor session asking better questions. This is skill rehearsal, not content substitution.

**Detailed Observation — PARTIALLY yes.** The solo fieldwork half (observing, jotting, dictating) is *already* solo by design in the guide — Nuri's honest job here is a **protocol coach**, prompting the checklist ("who talked first? what are the actors' positions? what's the layout?") during or right after the observation. But the **interpretation step is a hard NO**: the guide explicitly frames an outsider's guess at what a scene means as exactly the failure mode it's trying to avoid (a "they story" dressed as insider knowledge). The app must never have Nuri offer an interpretation — pending observations should sit in a visible "waiting for your mentor" state, not get an AI-generated guess.

**Vocabulary Recordings — YES, fully.** Once a word has been captured from a real mentor conversation, drilling it via TTS or replaying the original clip is authentic re-practice of real content — this is exactly the existing sessionFlow/TTS pattern (`src/lib/sessionFlow.ts`, `src/lib/tts.ts`), just pointed at the grower's personal Word Log instead of the fixed deck.

**Record Yourself for Feedback — mostly NO, with a queueing bridge.** Judging "would a host person say this?" needs a native's ear across 19 languages; a generic NLP plausibility checker isn't something to fake confidence in. Nuri's honest role: let the grower record and self-flag suspect sentences, then queue them for the mentor's real feedback (live or async) rather than pretending to adjudicate.

**Hole-Finding — YES.** The guide already treats this as a solo/near-solo activity (narrating a cartoon, describing a busy picture) — Nuri-as-listener prompting "keep going," "anything else?" and letting the grower self-flag unknown-word moments is faithful to the activity's actual design, not an imitation of something that needs a human.

**Writing/Journal — PARTIAL bridge only.** Nuri can offer a light grammar/vocab pass on a draft before the grower sends it, but must never generate or stand in for the mentor's reply — the entire point of the activity is a real, ongoing correspondence; an AI-authored "mentor reply" would be a direct violation of the phase's purpose.

**Ways to Talk a Lot — Nuri as one low-stakes retelling target, explicitly framed as telling #1 of N.** The guide itself notes the biggest jump comes from the first telling to later ones — having Nuri be a safe first "dry run" audience before the grower retells to a second and third real person is a legitimate, narrowly-scoped use, framed in-app as rehearsal ("tell it to Nuri first"), never as satisfying the "tell it to several different host people" requirement on its own.

---

## 3. Finding real participants for this phase

Phase 4's helper is the **mentor**: untrained (no method certification needed — "the communication is natural"), but the sourcing problem is different in kind from Phase 1–3's marketplace, not just a smaller version of it.

**(a) Relationship-continuity upgrade path (cheapest, most authentic, and the guide's own preferred onboarding).** The KB states plainly: "the first life-story mentor is very often a former nurturer who has already been doing 'language learning' activities with you, and therefore is accustomed to recordings." Concretely: on reaching Phase 4, the app should offer "Continue with [existing nurturer] as your mentor" for any nurturer relationship already established in Phases 1–3, relabeling them Mentor in the UI (the KB flags this exact terminology gap — the app currently says "nurturer" throughout the Phase 4 curriculum text) and unlocking the Phase 4 mentor tools from §1 for that relationship. No new marketplace search required for the most common real-world path.

**(b) Occupation-based Walk-of-Life search — a genuinely different marketplace facet.** Life-story mentors are found by relationship; Walk-of-Life mentors are found by **role**, not by teaching skill. `src/lib/nurturers.ts`'s existing roster already has real occupations attached to its 17 demo people (retired baker, taxi driver, fishmonger, tea-shop owner, etc.) — the missing piece is a first-class `walkOfLifeRoles: string[]` facet on the roster/schema so a grower can search "nurse" or "shopkeeper" the way the guide describes recruiting ("professions impinging on your life"), rather than searching by language + `methodCertified` (which is close to meaningless for Phase 4 — mentors need no training).

**(c) Lightweight triangulation/community-ask tier — a genuinely new, lower-commitment relationship type.** The 2–3 people who confirm a Detailed-Observation interpretation don't need to be paid, hourly-booked mentors — they need to answer one quick question. This wants a "community ask" broadcast: send a short voice-note question to a small opt-in circle of consenting host-language contacts, distinct from the marketplace-booked mentor relationship, and much closer to a favor than a session.

**Payment structure differs from Phase 1–3 by design.** The guide is explicit that Walk-of-Life sessions require real payment ("you should insist on paying the person a reasonable amount per hour based on local standards") because they're "extended conversations on more than one occasion." Life Story mentoring, by contrast, is most often a continuation of an already-paid nurturer relationship. The existing two-currency wallet (`convex/schema.ts` — `exchangeHours` earned by nurturing vs. `paidHours` PPP-scaled marketplace hours) maps reasonably here: Walk-of-Life should default onto the `paidHours` rail; Life Story sessions can go either way depending on whether the underlying relationship was already paid or exchange-based — this should be a per-relationship setting, not hardcoded.

**Verification changes meaning, not just degree.** Since mentors need no training, "verification" for Phase 4 is not the Phase-1 six-question golden-rules quiz (`src/app/(app)/nurture/training/page.tsx`) — a different, lighter one-screen acknowledgment is needed: (1) basic identity/real-person trust given the depth of personal disclosure being recorded, (2) self-attested (optionally community-endorsed) occupation tags for Walk-of-Life search relevance, (3) a **confidentiality-commitment acknowledgment** — "you understand the recordings are private, and you'll erase on request" — accepted once before a mentor's first Phase 4 session. This should be visually and structurally distinct from the Nurturer Studio's `nurturerCertStatus` quiz gate so it's clear no method training is implied.

The existing `phasesGuided` field on the nurturer roster already gestures at this (mostly "1–2," some "3–4") — extending mentors who've guided Phase 4 relationships to show `phasesGuided` including "4" is a natural signal to surface in search, alongside the new occupation facet.

---

## 4. Pen-pal-style relationship growth

Build directly on `convex/messages.ts` (1:1 threaded text + voice notes, opaque profile ids, blocked-pair checks, rate limiting) — Phase 4 does not need a new messaging system, it needs **Phase-4-shaped content riding the existing thread.**

**What makes this Phase-4-specific rather than generic chat:**

1. **Journal exchange (§1.7 made concrete).** The grower's journal entries addressed to their mentor, and the mentor's feedback, are just a structured message subtype in the existing thread — `attachmentType: "journalEntry"`. This is not a nice-to-have layered on top of Phase 4 methodology; the guide names journal-writing-with-feedback as one of its named activities, so this *is* a core feature, delivered via existing messaging infra.

2. **Continuing expansions past the session boundary.** The guide's expansion cycle "explodes" (a 10-minute story → 90 minutes of expansions → potentially 9 hours further) — nothing in the guide says this has to happen inside one timed sitting. A mentor can async-send one more voice note continuing a topic the live session ran out of time for. Practically: a `topicNudge` message subtype carrying a `sourceExpansionId` that links back into the Stories-to-Record tracker (§1.1), so any nudge is provably grounded in something the mentor *already* mentioned — never a speculative new topic, which would violate Rule 3.

3. **Triangulation asks (§1.3 made concrete).** The grower sends a short voice-note question to a second or third contact about an observed scene — this is the community-ask tier from §3(c) riding the same thread/attachment infrastructure.

4. **Life-event check-ins, strictly grounded.** "Key events" (weddings, births, deaths, holidays, cyclic events) are an explicit Phase 4 topic-discovery source. A light, opt-in nudge ("ask how the wedding went") can fire between sessions — but **only** from something the grower already logged as mentioned in a session, never from a speculative calendar guess. This keeps the feature inside Rule 3 rather than turning into intrusive small talk.

5. **Retelling audience.** The pen-pal thread is itself one of the "Ways to Talk a Lot" venues (§1.8) — a short retelling voice note sent to a second contact counts toward the multi-telling improvement the guide describes.

**Data model additions:** extend `messages` (or a companion table) with an optional `attachmentType: "voice" | "recordingClip" | "journalEntry"` and `attachmentRef` pointing into the Listening Library (§5); a `topicNudge` subtype carrying `sourceExpansionId`. **Consent must travel with the attachment**: a recording clip shared into a thread inherits the "only you unless permission" promise from §1.9 — sharing it onward (e.g., a retelling clip to a third contact) needs its own explicit re-consent step, since the original promise was scoped to one listener.

**Flag placement.** 1:1 mentor messaging is currently bucketed under `NEXT_PUBLIC_ENABLE_COMMUNITY_EXCHANGE` (default off) alongside general marketplace/community features. Phase 4's mentor thread is core methodology, not an optional social layer — worth a distinct flag (or promoting core 1:1 mentor messaging out of the community-exchange bucket) so it can ship independently of broader community-exchange rollout decisions.

---

## 5. Dependencies & shared infrastructure

What Phase 4 needs that Phase 1 doesn't have yet, with a note on which of these are one-phase investments vs. shared plumbing:

1. **A generic Listening Library / recording-and-relisten system** (recordings table: `id`, `ownerGrowerId`, `mentorId`, `kind` [primary/secondary/tertiary/vocab/retell/journal-audio], `parentRecordingId` for threading, audio blob ref, `durationSec`, `dateRecorded`, `relistenLog[]`, `consentState`, `erasureFlag`). **This is the single biggest shared-infra item** — Phase 2's clarify/word-sentence-word, Phase 3's Bridge Story/massage loop, Phase 5's native-to-native collection and ten-step discourse sessions, all need essentially this same primitive. Build once, phase-agnostic; do not build a Phase-4-only version.
2. **A freeform personal Word Log**, distinct from `vocab.ts`'s fixed 237-item picture-card deck: `word`, `gloss`, `sourceRecordingId`, `timestampSec`, `dateAdded`, `timesReviewed`. This is where the fixed-deck model actually breaks — needed in some form from Phase 2 onward (word-sentence-word already exists there) but Phase 4 is where it becomes unavoidable, since life-story vocabulary is personal and unbounded, not drawn from a shared 237-item pool.
3. **A generic async 1:1 thread with typed attachments** (voice notes, recording-clip shares, structured topic nudges) — extends `convex/messages.ts`. Needed again for Phase 5 (mentor feedback on grower recordings, async clarifying follow-ups) and Phase 6 (discourse-coach feedback on the grower's own text). Build the attachment-type system generically now rather than re-deriving it per phase.
4. **Mentor-role tooling in Nurturer Studio for Phase 4+** — a life-story/grand-tour prompt-template screen, the digitized tracking-form UI, and the confidentiality banner/erase control. Currently every purpose-built tool in `src/app/(app)/nurture/` is Phase-1-shaped (golden rules, Dirty Dozen tray, card table, meeting timer); Phase 4+ needs its own bench, not a re-skin of the Phase-1 one.
5. **A "search helpers by attribute, not just language + rate" facet** — occupation/walk-of-life tags now, but the same underlying need recurs in Phase 5 (mentor as insider-view clarifier) and Phase 6 (subject-matter-professor matching by eloquence/expertise, which the KB flags as unbuilt even for Phase 6's own roadmap). Generalize the roster schema now rather than bolting on a Phase-4-only `walkOfLifeRoles` field in isolation.
6. **A lightweight "community ask" / triangulation-broadcast feature** (quick question to a small opt-in circle, not a booked session) — reusable for Phase 5's "other host people make native-to-native recordings, always without the grower present" requirement, and Phase 6's community-of-practice.
7. **Real wallet/ledger payment rails.** `convex/credits.ts`'s `recordEntry` currently throws by design ("Direct credit entries are disabled. Credits require a verified session or payment event."). Phase 4 explicitly mandates real per-hour payment for Walk-of-Life sessions specifically — this blocks Phase 4 exactly as it already blocks the general marketplace, so it can't be deferred as Phase-4-only scope.
8. **Durable, enforceable consent/erasure state**, not session-only. The current `/session` `ConsentDialog` is explicitly never persisted (per both `app-implementation.md` and `nurturer-side.md`). Phase 4's confidentiality protocol — physician/lawyer/priest-level trust, "immediate and permanent" erasure on request — needs a real per-recording consent+erasure record in the data layer, which the ephemeral pattern used today structurally cannot provide.

---

## 6. MVP cut

The smallest slice that is still authentically GPA and still hits all three of the owner's asks (matching, solo-fallback, pen-pal):

- **One core activity, fully real: the Life Story Activity only.** The guide itself says 500 hours of pure Life Story "would not be a great calamity" — it's the guide's own single-activity fallback. Ship §1.1 (record → clarify with the six-type gap taxonomy → word-log capture → expansion tracker → retell) end to end before touching Walk-of-Life or Detailed Observation.
- **Matching: the relationship-continuity upgrade only** (§3a) — "continue with your existing nurturer, relabeled mentor." Skip the occupation-based Walk-of-Life marketplace facet (§3b) and the community-ask tier (§3c) for v1; this is the lowest-lift, most-authentic sourcing path and matches the guide's own stated common case.
- **Solo/AI fallback: the re-clarify queue + Word Log drilling only** (§2). Both reuse the existing TTS/practice pattern in `sessionFlow.ts`/`tts.ts` and carry zero fabrication risk since they only ever replay real, already-captured mentor audio. Skip question-rehearsal coaching and the Nuri-as-first-retelling-audience feature for v1.
- **Pen-pal: journal-with-feedback only** (§4.1) — one attachment type (text/voice journal entries) riding the existing `messages.ts` thread. Skip recording-clip sharing, topic-nudge automation, and life-event check-ins for v1.
- **Confidentiality is NOT optional in the MVP.** The promise banner and instant-erase control (§1.9) must ship with the very first recording surface — this is a floor requirement given what's being captured, not a phase-2-of-the-build polish item.
- **Explicitly deferred:** Walk-of-Life Conversations, Detailed Observation, the Two-Recorder Technique, full tracking-form digitization, triangulation broadcast, the 8-new-words/hour pacing monitor, and the Ways-to-Talk-a-Lot menu.

---

## Cross-reference: KB gaps this blueprint directly answers

The app-vs-guide delta list in `phase4.md` (§"App vs. source-guide deltas") independently confirms several of the above are real, currently-open gaps, not hypothetical ones: the "nurturer" vs. "mentor" terminology error (#2), the fabricated chapter-agenda framing that violates Rule 3 (#3), the complete absence of the confidentiality/consent protocol (#14, flagged there as "arguably the most important omission" given the app already records audio), the missing tracking forms (#10), and the missing Listening Library re-listen scheduling (#20).
