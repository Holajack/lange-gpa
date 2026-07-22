# Nuri App — How the Six GPA Phases Are Actually Implemented (Engineering Ground Truth)

Source of truth: `/Volumes/LaCie/GPA_Language_Learning` (the LaCie repo — main → lange-gpa.vercel.app).
All file paths below are relative to that root. Verified 2026-07-16 by reading the files in full.

---

## 1. The Phase data model

Defined in `src/lib/types.ts` (`Phase`, `PhaseActivity`, `PhaseId`), instantiated in `src/lib/phases.ts` (`PHASES: Phase[]`, 755 lines).

### `Phase` fields

| Field | Type | Meaning |
|---|---|---|
| `id` | `PhaseId` = `1..6` | numeric phase id |
| `slug` | string | URL segment for `/courses/[slug]` |
| `name`, `tagline` | string | display strings (English-only in phases.ts; localized at render time) |
| `hours` | number | length of the phase in hours (Phase 6 = `0`) |
| `ongoing` | boolean? | only Phase 6 sets `true` — "a lifelong way of living, not a timed course" |
| `startHour` | number | cumulative start on the 1,500h road |
| `color`, `emoji` | string | accent hex + emoji |
| `vocabTarget` | string | display string (e.g. "~1,000 words understood by ear") |
| `description`, `principles[]`, `milestones[]` | strings | phase guide content |
| `activities` | `PhaseActivity[]` | the curriculum activities |
| `parts?` | `{id,title,hours,focus,activityIds[]}[]` | ordered sub-stages (e.g. 1A → 1B); activities NOT referenced by any part render under a "Throughout" section |

### `PhaseActivity` fields
`id`, `name`, `description`, `how` (what nurturer/grower does), `minutes` (suggested), `kind` (one of `listening | speaking | vocabulary | literacy | culture | conversation`), and optional `practiceHref` — "route of a playable in-app version, if one exists". `practiceHref` is the single flag that decides whether an activity has an app implementation.

### Encoded values for all six phases

| Phase | slug | name | hours | startHour | vocabTarget | #activities | parts |
|---|---|---|---|---|---|---|---|
| 1 | `connecting` | Connecting | 100 | 0 | ~1,000 words understood by ear | 11 | 1a (Meetings 1–15 · 30–40h), 1b (Meetings 16–40 · ~60h) |
| 2 | `emerging` | Emerging | 150 | 100 | +1,200 → ~2,200 total | 8 | 2a (~50h), 2b (~80h), 2c (~20h) |
| 3 | `knowable` | Becoming Knowable | 250 | 250 | +2,000 → ~4,000 total | 8 | 3a (~125h), 3b (~125h) |
| 4 | `deep-relationships` | Deep Personal Relationships | 500 | 500 | +3,000 → ~7,000 total | 7 | 4-life (~200h), 4-walks (~200h), 4-voice (~100h) |
| 5 | `widening` | Widening Understanding | 500 | 1000 | → ~10,000 words recognized | 7 | 5-collect (~60h), 5-clarify (~320h), 5-belong (~120h) |
| 6 | `ever-growing` | Ever Participating, Ever Growing | 0 (`ongoing: true`) | 1500 | Ever-growing — like an insider's | 8 | 6-live ("your whole week"), 6-target (~300h), 6-give ("forever") |

Total curriculum: **49 activities across 6 phases**. `TOTAL_HOURS = 1500`.

### Helpers (bottom of phases.ts)
- `phaseById(id)` — falls back to Phase 1 for unknown ids.
- `phaseBySlug(slug)` — undefined for unknown slugs (drives the courses 404 card).
- `phaseProgress(phase, hoursLogged)` → 0..100; `(hoursLogged - startHour)/hours * 100`, clamped; always 0 for ongoing/zero-hour phases.
- `phaseForHours(hoursLogged)` → the highest phase whose `startHour <= hoursLogged` (phases are contiguous). Boundaries: 0/100/250/500/1000/1500.

### Localization layer — `src/lib/phaseI18n.ts`
`PHASES` holds English-only display strings. `localizedPhase(phase, t)` deep-copies the phase and swaps every display string for a translation via deterministic keys (`ph_{id}_name`, `ph_{id}_act_{sanitizedActId}_how`, `ph_{id}_part_{partId}_focus`, `ph_{id}_prin{i}`, `ph_{id}_mile{i}`, …). Structural fields (id, slug, hours, startHour, color, emoji, minutes, kind, practiceHref, activityIds) pass through untouched. Curriculum guidance shows in the grower's home language; practice content stays 100% host language.

---

## 2. Per-phase activity inventory AS ENCODED

Legend: ✅ = has `practiceHref` (playable in-app); — = no href (rendered as "🤝 With your nurturer" link to `/schedule` on Phase 1, or locked "Method preview" on Phases 2–6).

### Phase 1 — Connecting (11 activities)
| id | name | kind | min | practiceHref |
|---|---|---|---|---|
| `p1-dozen` | Rough-and-Ready Dozen | vocabulary | 15 | ✅ `/practice/vocabulary` |
| `p1-listen-do` | Listen & Do (TPR) | listening | 10 | ✅ `/practice/listening` |
| `p1-make-true` | Make It True | listening | 10 | — |
| `p1-photos` | Photos of US in Action | listening | 10 | — |
| `p1-lexicarry` | Cartoon Bubbles (Lexicarry) | culture | 10 | — |
| `p1-dictionary` | Talking Picture Dictionary | vocabulary | 10 | ✅ `/practice/repeat` |
| `p1-power` | Power Phrases | speaking | 8 | ✅ `/practice/speaking` |
| `p1-sounds` | Sound Discrimination | listening | 10 | ✅ `/practice/listening` |
| `p1-ladder` | Ladder of Success | speaking | 15 | ✅ `/practice/speaking` |
| `p1-infogap` | Sixteen Pictures (Info-Gap) | vocabulary | 15 | ✅ `/practice/vocabulary` |
| `p1-market` | Marketplace Role-Play | speaking | 20 | — |

Parts: 1a = [dozen, listen-do, make-true, photos, lexicarry, sounds, dictionary]; 1b = [ladder, power, infogap, market].

### Phase 2 — Emerging (8 activities)
| id | name | kind | min | practiceHref |
|---|---|---|---|---|
| `p2-describe` | Describe What You See | speaking | 30 | ✅ `/practice/speaking` |
| `p2-storybuild` | Story-Building with Pictures | listening | 25 | ✅ `/practice/listening` |
| `p2-clarify` | Clarifying the Recording | listening | 20 | — |
| `p2-wsw` | Word–Sentence–Word Recordings | vocabulary | 10 | ✅ `/practice/repeat` |
| `p2-busy` | Busy Pictures | vocabulary | 15 | — |
| `p2-process` | Process Picture Series | listening | 15 | — |
| `p2-smalltalk` | Small Talk + One New Fact | conversation | 10 | — |
| `p2-lifestory` | Draw As You Go: Your Life Story | speaking | 30 | — |

Parts: 2a = [smalltalk, describe]; 2b = [storybuild, clarify, wsw, busy, process]; 2c = [lifestory].

### Phase 3 — Becoming Knowable (8 activities)
| id | name | kind | min | practiceHref |
|---|---|---|---|---|
| `p3-bridge` | Bridge Story | speaking | 30 | — |
| `p3-script` | Scripts of Life | culture | 20 | — |
| `p3-cartoon` | Action Cartoon | listening | 20 | ✅ `/practice/listening` |
| `p3-massage` | Record-and-Massage Loop | speaking | 25 | — |
| `p3-shared` | Shared Experience + Reminiscing | conversation | 30 | — |
| `p3-prop` | Discuss-a-Prop | conversation | 15 | — |
| `p3-flood` | Input Flooding | listening | 15 | ✅ `/practice/listening` |
| `p3-host` | Host Stories | culture | 30 | — |

Parts: 3a = [bridge, script, cartoon, massage]; 3b = [shared, prop, flood, host].

### Phase 4 — Deep Personal Relationships (7 activities)
| id | name | kind | min | practiceHref |
|---|---|---|---|---|
| `p4-lifestory` | The Life Story Activity | conversation | 45 | — |
| `p4-vocab` | Vocabulary Recordings | vocabulary | 15 | ✅ `/practice/repeat` |
| `p4-walkoflife` | Walk-of-Life Conversations | culture | 40 | — |
| `p4-observe` | Observe and Describe | speaking | 30 | — |
| `p4-feedback` | Record Yourself for Feedback | speaking | 25 | ✅ `/practice/speaking` |
| `p4-holes` | Hole-Finding | vocabulary | 20 | ✅ `/practice/vocabulary` |
| `p4-tworecorder` | Two-Recorder Technique | speaking | 30 | — |

Parts: 4-life = [lifestory, vocab]; 4-walks = [walkoflife, observe]; 4-voice = [feedback, holes, tworecorder].

### Phase 5 — Widening Understanding (7 activities)
| id | name | kind | min | practiceHref |
|---|---|---|---|---|
| `p5-record` | Collect Native-to-Native Recordings | listening | 30 | — |
| `p5-tensteps` | The Ten-Step Discourse Session | listening | 60 | — |
| `p5-retell` | Next-Day Retelling | speaking | 15 | — |
| `p5-library` | Listening-Library Review | listening | 20 | — |
| `p5-media` | Clarify a Movie or TV Drama | culture | 45 | — |
| `p5-epic` | Epic Storytelling | speaking | 30 | ✅ `/practice/speaking` |
| `p5-community` | Join a Community of Practice | culture | 120 | — |

Parts: 5-collect = [record, media]; 5-clarify = [tensteps, retell, library]; 5-belong = [epic, community].

### Phase 6 — Ever Participating, Ever Growing (8 activities)
| id | name | kind | min | practiceHref |
|---|---|---|---|---|
| `p6-hours` | Claim Your Host Hours | culture | 20 | — |
| `p6-cop` | Make a Host Community of Practice | conversation | 60 | — |
| `p6-read` | Read Promiscuously | literacy | 30 | — |
| `p6-needs` | Needs Analysis | culture | 20 | — |
| `p6-rare` | Rare-but-Urgent Discourses | speaking | 40 | — |
| `p6-expert` | Expert Interviewing | conversation | 45 | — |
| `p6-remedial` | Remedial Pickup | vocabulary | 45 | — |
| `p6-nurture` | Become a Nurturer | conversation | 60 | ✅ `/onboarding` (role switch, not a practice game) |

Parts: 6-live = [hours, cop, read]; 6-target = [needs, rare, expert, remedial]; 6-give = [nurture].

`p6-read` is the ONLY `literacy`-kind activity in the whole curriculum.

---

## 3. How a phase becomes a course page

### `/courses` — `src/app/(app)/courses/page.tsx`
- Hero shows `hoursLogged / 1500h` and a **segmented journey bar**: Phases 1–5 each get a segment whose width = `hours/1500` (Phase 6 excluded via `startHour < TOTAL_HOURS`), filled per-phase by `phaseProgress`. A white "you-are-here" tick sits at `hoursLogged/1500 %`. Hour markers 0/100/250/500/1000/1500.
- Below, a vertical journey of 6 `JourneyCard`s alternating left/right on a dotted spine. Each card: emoji squircle, "Phase N" chip, hours tag (∞ for Phase 6), vocabTarget tag, 2-line description, per-phase progress bar, and:
  - **★ Current** chip when `profile.phase === phase.id` — the Nuri mascot peeks over that card's corner.
  - ✓ check when `hours >= startHour + hours` (completed).
  - **BETA GATE:** `betaPreview = phase.id > 1` — every phase except 1 renders a 🔒 "Method preview" lock chip, forces progress display to 0, and dims the card. Only Phase 1 is treated as executable in the current build.

### `/courses/[slug]` — `src/app/(app)/courses/[slug]/page.tsx`
- Slug resolved by `phaseBySlug`; unknown slug → friendly mascot 404.
- All display text runs through `localizedPhase(phase, t)`.
- `executablePhase = phase.id === 1` — the hard-coded beta switch. For Phases 2–6: a "Method preview" banner section, and every activity card shows a 🔒 Method-preview tag instead of a Start button.
- Hero: Phase chip, ★ Current (if `profile.phase === id`), ✓ Done chip (if `phase.id < profile.phase`), hours/vocab pills, and a progress bar showing `hoursLogged h / (startHour+hours) h` + `phaseProgress` % (hidden for Phase 6).
- Principles list, then "The sequence": ordered `parts` rendered as numbered stages (01, 02…) on a progression line, each part with title/hours/focus and a grid of its activity cards; unreferenced activities land in a trailing "Throughout" (✦) section. (Currently every activity is referenced by a part, so "Throughout" is empty for all phases.)
- Activity card = kind icon (Images/Ear/MessageCircle/BookOpen/Globe2/HeartHandshake mapped from `kind`), name/description/how, `⏱ minutes` tag, then EXACTLY ONE of:
  - Phase ≠ 1 → 🔒 Method preview tag;
  - Phase 1 + `practiceHref` → **Start →** pill linking to the practice game;
  - Phase 1 + no href → **🤝 With your nurturer** tag linking to `/schedule`.
- Done state: on Phase 1 only, a ✓ appears on an activity card when `profile.completed` includes the activity id.
- Milestones checklist: circles fill green only when the whole phase is passed (`phase.id < profile.phase`).
- Footer prev/next phase navigation.

---

## 4. The live session room — `/session` (`src/app/(app)/session/page.tsx`, 1,344 lines)

Implements the **authentic Phase-1 "Dirty Dozen"** and nothing else — the session room is a Phase-1 machine regardless of the grower's phase.

### Deck construction (`src/lib/sessionFlow.ts`)
- `DECK_SIZE = 12`. Deck language = `targetLang` if in `FULL_CONTENT_LANGS` (en, es, ru, fr, de, pt, it, ja, zh, ht), else falls back to the Spanish demo deck.
- `meetingForHours(hoursLogged)` = `floor(hours/2)+1`, clamped 1..40 (≈2h growing per meeting, 40 meetings ≈ Phase 1's 100h → actually 80h at that rate).
- `buildMeetingDeck(lang, meeting, 12)`: every vocab item has an effective meeting number (item `meeting` → domain `meeting` → `DOMAIN_DEFAULT_MEETING` fallback: animals 1, home 2, family 5, body 5, food 8, nature 14, health 18, work 32, sport 33, traveling 37 → else 1). Deck = up to 60% fresh cards from THIS meeting (min 2), topped up with shuffled review cards from earlier meetings, then leftover fresh/ahead cards. There is also a plain `buildDeck` (round-robin across shuffled domains) still exported but the session room uses the meeting-ordered dealer.

### The state machine (`FlowState`, pure transitions)
States (`FlowPhase`): `ready → intro → review → review-done → … → complete`.
- `createFlow(deck)`: `introduced=0`, `reviewSatisfied=true` ("card 1 is free").
- `reveal`: only legal via `canReveal` (not mid-review; review owed must be satisfied). Increments `introduced`, sets `reviewSatisfied=false` — **every further card must be EARNED through review**.
- `startReview`: round size = `min(introduced, 4)`, EXCEPT every 3rd card (`introduced % 3 === 0`) it's a **full sweep of ALL introduced cards** (shuffled). Non-full rounds pick targets by `pickReviewTarget` — weight `(index+1)²` toward the NEWEST cards ("fresh words need the most encounters").
- `answerReview(state, correct)`: a miss keeps the question on the floor (nurturer re-says the word — "it lives in the iceberg"); a hit pops the queue; empty queue → `review-done` (next card unlocked) or `complete` when all 12 introduced.
- `plannedReviewLength` powers the "review owed" badge; `JOKE_PROMPTS` (8 rotating mischief prompts, 18s rotation) show in the human tray — "laughter makes words stick".

### Timer / duration authority
- `?duration=<minutes>` query param (from /schedule booking); fallback `DEFAULT_DURATION_MIN = 30`. `totalSeconds` counts down 1s per tick (60s per tick in demo fast-forward builds).
- **The countdown — never the deck — decides when a session ends.** If the 12-card deck completes early, a 2.5s timeout loops `startReview` into another full sweep, forever, until time runs out.
- Timer at 0 → `end` stage. Half-time banner nudges the role switch.

### Stages
`pre` (join card with nurturer/mascot intro) → `live` → `end` (stats: minutes, ⭐ points = correct answers, "Phase 1" chip; recorded clip playback/download; links to /schedule and /dashboard).

### AI vs human nurturer modes
- Nurturer resolved from `?nurturer=` param. In beta builds every session gets **NURI, the AI nurturer** (`id: "ai"`); seeded human characters only appear in explicitly flagged demo builds (`NEXT_PUBLIC_ENABLE_SEEDED_NURTURERS`).
- **AI mode**: the language sibling mascot (`mascotForLang`) runs the flow with `speak()` TTS: greet (CUES greeting or mascot hello) → reveal → say the word twice (2nd at 0.7 rate) → 1.5s echo space → review questions ("Where is X?" via `questionFor`), gently re-asking every 10s until the grower taps. Correct tap → praise cue → advance. Miss → "again" cue + word at 0.7 rate. `CUES` (greeting/listen/again/point/praise/begin) exist for **ru, en, ht, ja** only; other languages skip the cue lines. Deck progress dots replace the tray. Pause/Resume + "Hear again" buttons.
- **Human mode** (demo/seeded): a nurturer-only tray ("🤫 Nurturer only") shows the whole 12-card deck with written words, the exact cue script to SAY ALOUD (say-it-twice intro / "ask aloud" question with the answer highlighted / praise lines), reveal + review-round buttons gated by `canReveal`, a review-owed progress ring, and rotating joke prompts. Single device; two-device realtime sync is a marked `CONVEX_SYNC` TODO.
- **Language exchange switch**: mid-session "Switch roles" swaps nurturer/grower, picks any `FULL_CONTENT_LANGS` deck, and restarts at Meeting 1 ("a fresh language starts at the wall of noise").
- The grower stage NEVER shows the written word (status strip explicitly avoids it); the grower only taps pictures during `review`.
- **Recording** ("Talking Picture Dictionary"): mic (± camera) via `useRecorder`, gated by an in-session consent dialog (consent never persisted), clip downloadable at end — the digital analog of `p1-dictionary` home re-listening.
- Session logging: on end, `completeActivity(\`live-${nurturerId}-${completed.length}\`, elapsedMinutes, points)` — a synthetic id, so live sessions add hours/words but do NOT tick curriculum checkboxes.
- Activity label: from `?activity=` name-matched against Phase 1 activities only; under 40h logged, only Phase 1A activity names are accepted (default = first 1A activity).

---

## 5. The practice games — `/practice/*`

Hub (`practice/page.tsx`): four launchers. Speaking and Repeat carry `minHours: 40` — locked (🔒 40h) while `profile.phase === 1 && hoursLogged < 40` (Phase 1A is listening-only). Same rule enforced inside via `Phase1BGuard` (`profile.phase > 1 || hoursLogged >= 40`).

Shared helpers (`practice/shared.tsx`): `useContentLang()` (falls back to Spanish deck + banner when target ∉ FULL_CONTENT_LANGS), Fisher–Yates shuffle/pickN, ProgressDots, ReplayButton, IcebergToast (misses "sink into the iceberg"), FinishScreen.

| Game | Route | Exercises | Mechanics | Curriculum ids logged (`completeActivity`) | Phase activities linking to it |
|---|---|---|---|---|---|
| Rough-and-Ready Dozen | `/practice/vocabulary` | hear word → tap picture (comprehension) | Domain chooser over all 28 vocab domains → 12 rounds; grid grows with success 4→6→9 tiles (at 4 and 8 correct); word is spoken first; written word revealed only AFTER a correct tap AND only when `phase>1 or hours≥40`; wrong = iceberg toast + replay | `p1-dozen` (if ≥10 distinct words met), else `p1-dozen-practice`; `maintenance-vocab-{domain}` when phase>1. 10 min, passes met word ids for dedup | p1-dozen, p1-infogap, p4-holes |
| Listen & Do (TPR) | `/practice/listening` | hear command → tap the action card (body-response proxy) | 10 rounds, 4 action cards from the 8 `TPR_COMMANDS`; after 5 correct switches to 2-command chains tapped in order; wrong replays the whole chain | `p1-listen-do` (phase 1) / `maintenance-listening`. 10 min | p1-listen-do, p1-sounds, p2-storybuild, p3-cartoon, p3-flood |
| Power Phrases | `/practice/speaking` | listen → written phrase revealed after 1st hearing → hold-to-record own voice → play back | The 8 GPA survival questions hard-coded IN THIS PAGE (`POWER_PHRASES`, 10 languages: en es ru fr de pt it ja zh ht): what-is-this, what-is-that, what-is-he-doing, who-is-he, i-dont-know, again-please, slowly-please, what-does-it-mean. MediaRecorder with simulated fallback. Gated by Phase1BGuard | `p1-power` / `maintenance-speaking`. 10 min | p1-power, p1-ladder, p2-describe, p4-feedback, p5-epic |
| Re-live Your Words | `/practice/repeat` | auto-advancing listen → say-aloud (2.5s ring) → listen-again slideshow | 10 cards sampled across ALL domains; word revealed after 1st hearing; pause + 0.6×/1×/1.5× speed; no correctness input (all rounds "correct"). Gated by Phase1BGuard | `p1-dictionary` / `maintenance-repeat`. 5 min | p1-dictionary, p2-wsw, p4-vocab |

Note the many-to-one mapping: 16 curriculum activities across Phases 1–5 point at just 4 games; the game logs a curriculum id only when the grower is in Phase 1, otherwise a `maintenance-*` id. Phase 2–5 activities' hrefs are currently unreachable from the course pages anyway (locked behind `executablePhase = id===1`), but the games themselves are open to any phase from /practice.

---

## 6. Placement & phase progression

### placement.ts (232 lines) — comprehension-only placement engine
- Everyone defaults to Phase 1; higher starts must be EARNED by listening + pointing. No reading/translation/typing/self-report.
- **Gate 1 → earns Phase 2 start**: 10 word rounds (hear word, pick from 4 emoji tiles; distractors from the SAME domain) + 2 single TPR rounds. **Gate 2 → earns Phase 3 start**: 10 question rounds ("Where is X?" against 6 tiles) + 3 two-step TPR chains answered in order.
- `PASS_PCT = 85` (per gate, `neededCorrect` = ceil 85%), `MAX_REPLAYS_PER_ROUND = 1`, `PLACEMENT_CAP = 3` — "deeper phases are relationships and lived stories — they must be lived, not tested into."
- `buildGate` randomizes rounds per sitting (round-robin over shuffled domains). `scoreGate` requires all rounds answered.
- Availability: `placementAvailable(lang)` needs ≥10 words + ≥4 TPR commands in that language (true for all 19 languages given full vocab coverage); `gate2Available` additionally requires a native `QUESTION_TEMPLATES[lang]` frame (exists for 10 languages: en es fr de pt it ru ja zh ht) — no English-frame mixing, ever.
- `placementSeed(phase)` → `{phase (capped at 3), hoursLogged: phase.startHour, wordsMet}` with `WORDS_AT_START = {2: 1000, 3: 2200}`.
- **IMPORTANT: placement.ts is currently dead code.** Nothing outside `src/lib/placement.ts` imports it — no onboarding step, no page builds a gate. Onboarding (`src/app/onboarding/page.tsx`) never sets `phase`; every new profile starts at Phase 1 via `blankProfile()`.

### Phase progression (store.tsx)
- `completeActivity(id, minutes=10, words=0)`: clamps minutes to 0..240; appends to `completed` (unique checklist) and `activityLog` (repeatable attempts with wordsAdded); dedupes word ids into `wordIds`/`wordsMet`; updates the Mon-first `week` minutes array; `minutesLogged += minutes`, `hoursLogged = round(minutes/60, 1dp)`.
- A store-level effect self-heals phase after EVERY profile change: `if (phaseForHours(hoursLogged) > profile.phase) updateProfile({phase: due})`. Phase never regresses; crossing 100h auto-promotes to Phase 2, 250h → 3, 500h → 4, 1000h → 5, 1500h → 6.
- Multi-language journeys: per-language `LanguageJourney` snapshots (phase/hours/words/completed/log) swap in and out via `switchLanguageJourney`.

### Graduated immersion (`getImmersionStage`)
The app UI itself de-anglicizes as phases pass: stage = `phase - 1`, capped at 4 (`P1→0` native UI, `P2→1`, `P3→2`, `P4→3`, `P5+→4` full target-language chrome), applied per-key via `makeBlendedT(native, target, stage)`. Manual immersion toggle forces the full target-language UI at any stage; nurturer role always gets native UI.

---

## 7. Phase activities with NO app implementation (no `practiceHref`)

32 of 49 activities have no playable in-app version (Phase 1's fall back to "🤝 With your nurturer" → /schedule; Phases 2–6 are additionally locked as "Method preview"):

- **Phase 1 (3):** `p1-make-true` (Make It True), `p1-photos` (Photos of US in Action), `p1-lexicarry` (Cartoon Bubbles/Lexicarry), `p1-market` (Marketplace Role-Play) — 4 activities.
- **Phase 2 (5):** `p2-clarify` (Clarifying the Recording), `p2-busy` (Busy Pictures), `p2-process` (Process Picture Series), `p2-smalltalk` (Small Talk + One New Fact), `p2-lifestory` (Draw As You Go: Your Life Story).
- **Phase 3 (6):** `p3-bridge` (Bridge Story), `p3-script` (Scripts of Life), `p3-massage` (Record-and-Massage Loop), `p3-shared` (Shared Experience + Reminiscing), `p3-prop` (Discuss-a-Prop), `p3-host` (Host Stories).
- **Phase 4 (4):** `p4-lifestory` (The Life Story Activity), `p4-walkoflife` (Walk-of-Life Conversations), `p4-observe` (Observe and Describe), `p4-tworecorder` (Two-Recorder Technique).
- **Phase 5 (6):** `p5-record` (Collect Native-to-Native Recordings), `p5-tensteps` (Ten-Step Discourse Session), `p5-retell` (Next-Day Retelling), `p5-library` (Listening-Library Review), `p5-media` (Clarify a Movie/TV Drama), `p5-community` (Join a Community of Practice).
- **Phase 6 (7):** `p6-hours`, `p6-cop`, `p6-read`, `p6-needs`, `p6-rare`, `p6-expert`, `p6-remedial` — everything except `p6-nurture`, whose `practiceHref` is `/onboarding` (a role-switch entry point, not a game).

Corrected count: Phase 1 has 4 unimplemented (listed above), so totals are P1:4, P2:5, P3:6, P4:4, P5:6, P6:7 = **32 without an href; 17 with one** (16 to the four practice games + 1 to /onboarding).

Coverage skew: everything implemented is a Phase-1-shaped picture/audio drill. The recording-centric loops that define Phases 2–5 (clarify-the-recording, massage loop, two-recorder, ten-step discourse) have no digital tooling beyond the session room's raw record-and-download.

---

## 8. Data & asset dependencies

### `src/lib/vocab.ts` (504 lines)
- `VOCAB_DOMAINS: VocabDomain[]` — **28 domains, 237 `VocabItem`s**. Original 10 thematic domains (food 12, animals 12, home 12, body 10, traveling 10, family 8, sport 8, health 8, nature 10, work 8) + 18 "authentic Phase 1A" meeting-ordered sets (colors m7 ×10, numbers m12 ×10, clothing m9 ×10, prepositions m4 ×8, emotions m11 ×8, tableware m2 ×6, tools m11 ×7, room m3 ×6, rooms m8 ×4, family-more m5 ×6, body-more m5 ×8, adjectives m25 ×10, states m19 ×6, insects m12 ×5, animals-more m3 ×6, nature-more m14 ×7, drinks-more m8 ×2, verbs m33 ×20).
- Each `VocabItem`: `id`, `emoji` (the "picture card" — meaning by image, never translation), optional `meeting` (Rough-and-Ready-Dozen introduction order), `words: Partial<Record<LangCode,string>>`.
- **Word coverage is complete: all 237 items have words in all 19 supported languages** (en es ru fr de pt it ja zh ar ko tr uk hi ht vi id pl th). Domain `names` also cover all 19.
- `TPR_COMMANDS` — 8 action commands (stand, sit, point, take, give, open, close, walk), all 19 languages. Feed the listening game and placement TPR rounds.
- Despite full 19-language word data, **deck-backed features are gated to `FULL_CONTENT_LANGS` = 10 languages** (en es ru fr de pt it ja zh ht — "vocab decks + UI strings"); the other 9 fall back to the Spanish demo deck with a soft banner.

### `src/lib/cards.ts` (56 lines)
Lazy, SSR-safe loader for pre-generated flat-sticker card art: fetches `/cards/manifest.json` once, `getCardImage(itemId)` → `/cards/{id}.webp` or null (emoji fallback — "no card is ever blank"). On disk: `public/cards/` holds **237 webp illustrations + manifest covering all 237 vocab items** (generated by `scripts/generate-card-images.mjs`).

### Audio
`src/lib/tts.ts` plays real recorded clips first (`public/audio/manifest.json`, generated by `scripts/generate-audio.mjs`) and falls back to browser `speechSynthesis`. Recorded voice coverage: **en 210 clips, ja 210, ru 484** — other languages are synthesis-only (matches placement.ts's note that ru/en rounds play recorded voices).

### Other per-language content contracts
- `CUES` (sessionFlow) — nurturer cue lines for **ru, en, ht, ja** only.
- `QUESTION_TEMPLATES` (sessionFlow) — native "Where is …?" frames for 10 languages (en es fr de pt it ru ja zh ht); gates placement Gate 2 and phrases every review question.
- `POWER_PHRASES` — hard-coded in `practice/speaking/page.tsx` for the same 10 content languages.
- Card images/manifest and vocab words are the only content that scales to all 19 languages today.
