# SPEC — Advancement Gates: 1A → 1B → Phase 2

Status: implementable recipe. Repo: `/Volumes/LaCie/GPA_Language_Learning`. The just-shipped live-meeting spine (`meetingProgress`: written ONLY at natural end of a live `/session`, `Math.max` forward-only, `session/page.tsx:496`; AI nurturer counts during beta — owner ruling 2026-07-20) is the skeleton these gates hang on. This spec is the prerequisite for the Phase 2 build-out.

## 0. Non-negotiable ground truth

1. **Guide-literal word numbers are unreachable in-app.** The guide says ~300 words for 1A and ~1,000 for Phase 1 — but only **167** words exist across populated 1A meetings and **237** in all of Phase 1 (`vocab.ts`, matching `POPULATED_MEETINGS` = meetings 1,2,3,4,5,7,8,9,11,12,14 [1A] and 18,19,25,32,33,37 [1B]). Literal gates would hard-lock every user forever. **All targets are DERIVED from content** and converge on the guide's numbers as meetings are authored.
2. **Three legs map to three distinct behaviors** — meet (live sessions), practice (solo — live decks alone can't cover all populated words), time (hours). None substitutable; this is the honest engagement loop.
3. **`phaseForHours` hours-only promotion is the hole**: 100 logged hours currently promotes to Phase 2 unconditionally (`store.tsx:388-392`). This spec closes it.

## 1. New file `src/lib/gates.ts` (pure, no React — mirrors `sessionFlow.ts` style)

Derived constants (recompute from content at module load — never hardcode the "today" values):
- `LAST_1A_MEETING = max(POPULATED_MEETINGS.filter(m => m <= 15))` → **14** today.
- `WORDS_1A_TARGET = min(300, floor(0.9 × words available in populated meetings ≤ 15))` → **min(300, 150) = 150** today (0.9 headroom because decks random-sample; lands exactly on the guide's own MP7 "150 words" milestone).
- `WORDS_PHASE1_TARGET = min(1000, floor(0.9 × total populated Phase-1 words))` → **213** today.
- Reuse `effMeeting` by EXPORTING it from `sessionFlow.ts` — do not duplicate.

API (single source for logic AND display numbers):
- `gateLegs1b(p)` / `gateLegsPhase2(p)` → `{ meetings: {done,total}, words: {done,total}, hours: {done,total}, passed: boolean }`
- `gate1bPassed(p)` / `phase1Complete(p)` = **stamp-or-predicate** (§4). Consumers must NEVER check the predicate alone.

## 2. The gates (three legs each, ALL required)

### Gate 1 — 1A → 1B ("talking begins")
| Leg | Rule | Today |
|---|---|---|
| Meetings | `meetingProgress >= LAST_1A_MEETING` | 11/11 populated 1A meetings (→14) |
| Words | `wordsMet >= WORDS_1A_TARGET` — use `wordsMet` counter, NOT `wordIds.length` (placement-seeded profiles have `wordIds: []`) | 150 |
| Hours | `hoursLogged >= 30` (guide minimum; hours are a floor, not the driver — replaces the 40 h proxy) | 30 |

Passing unlocks: `/practice/speaking` + `/practice/repeat`; 1B activities (`p1-ladder`, `p1-power`, `p1-infogap`, `p1-market`) schedulable in sessions; Nurturer Studio planner default flips to 1B; 1A-graduation ceremony.

### Gate 2 — 1B → Phase 2 ("Congratulations! Celebrate!")
| Leg | Rule | Today |
|---|---|---|
| Spine complete | `nextMeetingFor(meetingProgress) === null` (≡ `meetingProgress >= 37` today; auto-extends to 40 when capstone meetings 38–40 are authored) | 17/17 |
| Words | `wordsMet >= WORDS_PHASE1_TARGET` | 213 |
| Hours | `hoursLogged >= 100` (kept — the phase is literally "The First 100 Hours" — now necessary, not sufficient) | 100 |

### The core code change — gate-aware phase self-heal (`store.tsx:388-392`)
```ts
const due = phaseForHours(profile.hoursLogged);
const ceiling = phase1Complete(profile) ? due : (1 as PhaseId);
const next = Math.max(profile.phase, Math.min(due, ceiling)) as PhaseId;
if (next > profile.phase) updateProfile({ phase: next });
```
`Math.max(profile.phase, …)` IS the grandfather mechanism: phase is only ever raised, never lowered. Hours still carry Phase 2→3→… (those boundaries keep hours-only until their own gates exist with the Phase 2 build-out); crossing 100 h no longer escapes Phase 1 without spine + words.

## 3. Grandfather rules (explicit — nobody regresses)

| Cohort | State at ship | Outcome |
|---|---|---|
| Already `phase >= 2` (old hours-only promotion, or placed) | phase field 2+ | **Kept** (self-heal never demotes). Stamp `gatesPassed.phase2 = <ship date>` (and `1b`) so downstream UI treats them as passers, not anomalies. |
| Placement-seeded (onboarding test-out) | `placementSeed()` sets phase 2/3, `wordsMet` seeded ≥ target, `wordIds: []`, onboarding parks `meetingProgress = 37` | **Pass by construction** (word leg reads `wordsMet` for exactly this reason). `finish()` seeds BOTH stamps in the SAME profile object as the placement seed — never a later effect race (risk R2). |
| Legacy grower ≥ 40 h (old `Phase1BGuard` pass — speaking tools open) | tools open | Migration stamps `gatesPassed["1b"]` for any profile with `hoursLogged >= 40` OR `phase >= 2` — **speaking tools never re-lock**. |
| Legacy mid-Phase-1 practice-grinder (e.g. 90 h) | hours self-heal seeded `meetingProgress ≈ 36` | One live session + word leg from Phase 2 — slight, intended friction; loses nothing they had. AI nurturer means a live session is always one tap away. |
| Brand-new user | zeros | Full gates: 11 meetings + 150 words + 30 h → 1B; 17 meetings + 213 words + 100 h → Phase 2. |

## 4. Stickiness — `gatesPassed` stamps (because derived targets RISE as content is authored)

- `types.ts`: `gatesPassed?: { "1b"?: string; "phase2"?: string }` on **both** `Profile` and `LanguageJourney` (gates are per-language, like `meetingProgress`).
- `store.tsx`: copy `gatesPassed` in `activeJourneySnapshot`, `switchLanguageJourney`, AND `emptyJourney` — forgetting any of the three leaks a passed gate from Spanish into a fresh Japanese journey (risk R4; the exact bug class the meetingProgress plumbing just solved).
- A `useEffect` self-heal (same pattern as the existing two) stamps a gate the first time its predicate is true, and applies the migration grandfathers above.
- **Once earned, never un-earned** — even when content authoring later raises `WORDS_1A_TARGET` or extends the spine. Users mid-leg when targets rise see the bar grow with a one-line note ("new meetings were added to Phase 1") — more game, never moved goalposts.

## 5. Replace the `minHours: 40` proxy everywhere

| Surface | Today | After |
|---|---|---|
| `practice/shared.tsx` `Phase1BGuard` | `phase > 1 \|\| hoursLogged >= 40` | `phase > 1 \|\| gate1bPassed(p)`; lock screen becomes the three-leg CheckpointCard (current screen only links the legs that aren't the blocker) with Book-a-session featured |
| `practice/page.tsx` `GAMES[].minHours: 40` | `🔒 40h` chip | `gate: "1b"`; locked chip names the weakest remaining leg ("🔒 3 meetings left") |
| `session/page.tsx:208-212` activity filter (`< 40h` → 1A-only) | hours proxy | same `gate1bPassed` — session room and practice hub can never disagree about 1B status |
| `nurture/page.tsx` SessionPlanner 1A/1B default | manual | default from selected grower's gate state; manual override stays |

Safety: every ≥40 h user is stamped (§4) → no one loses `/practice/speaking`. Session-heavy users below 40 h can now unlock EARLIER (30 h + meetings + words) — the right users to unlock early.

## 6. UI — CheckpointCard (`src/components/CheckpointCard.tsx`, NEW)

One card on `/dashboard` (primary) and `/courses/connecting`; always renders only the NEXT gate (Gate 1 → Gate 2 → "Phase 2 is being built — you're ready" while `/courses` `betaPreview` still locks Phase 2; do not remove `betaPreview` in this ticket, risk R5).

Mobile-first: stacked card, thumb-reach single primary CTA, no hover dependence.
```
┌─────────────────────────────────────┐
│ 🌱 NEXT: TALKING BEGINS (1B)        │
│ 🤝 Live meetings      8 / 11   ▓▓░  │ → deep link: Book / Start a session
│ 🃏 Words in iceberg 120 / 150  ▓▓░  │ → /practice/vocabulary
│ ⏱ Growing hours      22 / 30  ▓▓░  │ → any activity
│ [ ▶ Start today's meeting ]         │ ← primary CTA = WEAKEST leg
└─────────────────────────────────────┘
```
Rules: real derived numbers only (11/150/30 — never the aspirational 300/1000); header ring = `(sum of leg fractions)/3` — a fresh grower with onboarding minutes + first words starts visibly above 0% (honest endowed progress); each row deep-links the one action advancing that leg; weakest-leg CTA keeps the three behaviors balanced; meetings microcopy keeps the 40-meeting curriculum visible without lying ("Meeting 12 of 40 · 8 of 11 openable now"); words row uses the iceberg metaphor with count-up animation; demo-deck languages flagged in microcopy (risk R6).

**Ceremonies, not toasts:** gate completion = full-screen moment, Mascot `mood="cheer"`, Gate 2 uses the guide's literal line "You're ready to start Phase 2! Congratulations! Celebrate!", plus achievements `gate-1b` / `gate-phase2` via the existing `lange:award` bridge (see SPEC-gamification, canonical celebration list).
**Session-end tie-in:** `/session` end screen adds a one-line gate delta ("Meeting 12 ✓ · 9/11 · 131/150 · 24/30").

### i18n
New keys ×19: `gateNext1b`, `gateNextP2`, `gateMeetingsLabel`, `gateWordsLabel`, `gateHoursLabel`, `gateCeremony1b`, `gateCeremonyP2`, `gateNewContentNote`, `gateReadyWaitingP2`. Short labels → `KEY_TIERS` tier 2–3 (the card itself participates in graduated immersion); ceremony body copy tier 4.

## 7. Ordered implementation steps (each independently shippable)

1. **`gates.ts` + types + store stamps** (no behavior change; stamps start accruing). **Ship first and let it bake one beta cycle** so migration stamps land before anything enforces them — this ordering is also the R3 defense (content pushes that extend the spine must land with the stamp effect already live, or 100 h old-spine-complete users gain new requirements overnight).
2. **Gate the phase self-heal** (§2 code). Verify: 100 h + incomplete spine stays Phase 1; existing Phase-2 profile untouched; placement `finish()` seeds stamps atomically with `placementSeed` (R2).
3. **CheckpointCard** + dashboard + courses page + session-end delta + i18n ×19 + KEY_TIERS entries.
4. **Proxy replacement** (§5 four surfaces).
5. **Ceremonies + achievements** (`gate-1b`, `gate-phase2`, full-screen celebration).

## 8. Risks
- **R1** pre-M11a live-session word undercount → mitigated by ≥40 h stamp + practice-reachable word leg; NO retroactive reconstruction.
- **R2** placement seeds must precede gate enforcement in `finish()` (same object write).
- **R3** content authoring raises targets → stamps-first ship order (§7.1) + "new meetings added" note.
- **R4** journey sync ×3 or stamps leak across languages.
- **R5** earned Phase 2 still hits `betaPreview` lock until Phase 2 build-out → "you're ready — Phase 2 opens soon" card state.
- **R6** demo-deck languages → microcopy flag; gates still function (card ids are language-independent).

## Out of scope (tracked separately)
Fractional immersion (SPEC-immersion — but note: gated promotion is what makes score-25 arrive with band 1 already flipped, i.e. the no-cliff phase-up); Phase 2 gate legs (needs Phase 2 build-out); human-vs-AI meeting credit post-beta (owner's open question, M11-M13 §4d); nurturer-confirmed checklist (post-beta enhancement — rejected for beta, AI counts); moving `p1-power` into 1A (guide places Power Tools listening in meetings 11–12; fast follow, not a gate blocker).
