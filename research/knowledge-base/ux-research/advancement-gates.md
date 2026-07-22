# Nuri Advancement Gates — 1A → 1B → Phase 2

Design source: `research/knowledge-base/phase1.md`, `phase2.md`, `roadmap/m11-m13-plan/M11-M13-IMPLEMENTATION-PLAN.md`, and the live code (`src/lib/sessionFlow.ts`, `src/lib/store.tsx`, `src/lib/phases.ts`, `src/lib/placement.ts`, `src/app/(app)/practice/*`, `src/app/(app)/session/page.tsx`, `src/app/(app)/courses/page.tsx`, `src/app/onboarding/page.tsx`). All numbers below were re-derived from `vocab.ts` at write time, not copied from docs.

---

## 0. Ground truth: what the app can actually measure today

| Signal | Where it lives | Honest? |
|---|---|---|
| `meetingProgress` | `Profile`/`LanguageJourney`, written ONLY at the natural end of a live `/session` (timer hits 0, `flow.introduced > 0`, non-exchange non-review deck), `Math.max` forward-only (`session/page.tsx:496`) | **Yes — the strongest signal in the app.** Solo practice can't move it. AI nurturer counts during beta (owner ruling 2026-07-20). |
| `hoursLogged` / `minutesLogged` | incremented by every `completeActivity` (practice AND sessions) | Weak alone — grindable solo, and historically the only phase driver. |
| `wordIds` (unique card ids met) | deduped `Set` in `completeActivity`; live-session logging fixed in M11a | Good going forward; **historically undercounted** for live sessions before M11a. |
| `wordsMet` (counter) | `wordIds` dedupe delta + numeric legacy adds + `placementSeed` | The only word signal that placement-seeded users have (their `wordIds` is `[]`). |
| `phase` | set at placement, then self-healed UP by `phaseForHours(hours)` in `store.tsx:388-392` | **This is the hole: 100 logged hours promotes to Phase 2 unconditionally.** |

**The populated spine (derived from `vocab.ts`, matches `POPULATED_MEETINGS`):**

| Meeting | Fresh words | Cumulative | Part |
|---|---|---|---|
| 1 | 12 | 12 | 1A |
| 2 | 18 | 30 | 1A |
| 3 | 12 | 42 | 1A |
| 4 | 8 | 50 | 1A |
| 5 | 32 | 82 | 1A |
| 7 | 10 | 92 | 1A |
| 8 | 18 | 110 | 1A |
| 9 | 10 | 120 | 1A |
| 11 | 15 | 135 | 1A |
| 12 | 15 | 150 | 1A |
| 14 | 17 | **167** | 1A (last populated ≤ 15) |
| 18 | 8 | 175 | 1B |
| 19 | 6 | 181 | 1B |
| 25 | 10 | 191 | 1B |
| 32 | 8 | 199 | 1B |
| 33 | 28 | 227 | 1B |
| 37 | 10 | **237** | 1B (spine end) |

All 237 items carry words for every full-content language, so the ceilings are language-independent today.

**Two facts that must shape the gates:**

1. **The guide's raw numbers are unreachable in-app.** The guide's 1A threshold is ~300 words; only **167** exist across populated 1A meetings and **237** in the whole game. A literal "300 words" or "1,000 words" gate would hard-lock every user forever. Gates must be **derived from content**, converging on the guide's numbers as meetings are authored.
2. **Live sessions alone can't even meet all populated words.** A 12-card deck introduces ~7 fresh + ~5 review cards per session; 11 live 1A sessions yield roughly 80–130 unique words, below the 167 content ceiling (meeting 5 alone has 32 fresh words — several sessions' worth). So a word leg genuinely requires solo practice **on top of** live meetings. That's a feature: the gate's three legs map to three distinct behaviors — *meet* (live sessions), *practice* (solo), *time* (hours) — none substitutable for another. That's the honest gamification loop the owner asked for.

---

## 1. Gate 1: 1A → 1B ("talking begins")

**Guide definition:** talking begins at MP16 after MP1–15 (30–40 h) and ~300 receptive words; MP7 celebrates "Hurrah for 150 words." 1B's whole premise is moving the first ~300 words from understanding into speech.

**App mapping — three legs, ALL required:**

| Leg | Rule | Today's numbers | Why this signal |
|---|---|---|---|
| Meetings | `meetingProgress >= LAST_1A_MEETING` where `LAST_1A_MEETING = max(POPULATED_MEETINGS.filter(m => m <= 15))` → **14** | 11 of 11 populated 1A meetings | The spine is the curriculum. Derived, so authoring meetings 6/10/13/15 auto-extends the leg for users who haven't passed it yet. |
| Words | `wordsMet >= WORDS_1A_TARGET` where `WORDS_1A_TARGET = min(300, floor(0.9 × words available in populated meetings ≤ 15))` → **min(300, 150) = 150** | 150 of 167 available | 0.9 headroom because decks are random-sampled — demanding 100% of content is hostage to RNG. The formula lands exactly on the guide's own MP7 "150 words" milestone today and grows toward the guide's 300 as 1A content is authored. Use `wordsMet` (not `wordIds.length`) so placement-seeded and legacy numeric-add profiles aren't stranded. |
| Hours | `hoursLogged >= 30` | 30 h (guide: 1A = 30–40 h) | Floor, not driver. 30 (guide minimum) rather than the current 40 proxy: with meetings + words also required, the hours leg no longer has to do the whole job, and 40 h of solo grinding should never be the *shape* of 1A. |

**Passing the gate is sticky (see §4): once earned it never un-earns**, even if content authoring later raises `WORDS_1A_TARGET` or extends `LAST_1A_MEETING`.

What passing means in-product: `/practice/speaking` and `/practice/repeat` unlock (§5), the 1B activities (`p1-ladder`, `p1-power`, `p1-infogap`, `p1-market`) become schedulable in sessions and the Nurturer Studio planner default flips to 1B, and the grower gets the 1A-graduation moment (§3).

*(Note for a fast follow: the guide actually introduces Power Tools in 1A meetings 11–12 as listening; `p1-power` currently sits in `parts["1b"]`. Not a gate blocker, but the gate makes the misplacement more visible.)*

---

## 2. Gate 2: 1B → Phase 2 ("ready — Congratulations! Celebrate!")

**Guide definition:** end of MP40 (MPs 38–40 are the capstone: busy pictures, negation, relative clauses, Making Statements — with MPs 39–40 explicitly review, since the 1,000–1,200-word goal typically lands before MP39), ~100 h, ~1,000-word auditory vocabulary, ~300 words moved into speech. Phase 2's own entry bar (Appendix 1) is softer: 500–1,000 familiar items + here-and-now competence + power tools.

**App mapping — three legs, ALL required, replacing the hours-only `phaseForHours` promotion:**

| Leg | Rule | Today's numbers | Notes |
|---|---|---|---|
| Spine complete | `nextMeetingFor(meetingProgress) === null` (≡ `meetingProgress >= 37` today) | 17 of 17 populated meetings | Derived from `POPULATED_MEETINGS`, so when meetings 38–40 (the capstone) are authored, the spine automatically ends at 40 and the final live session becomes the guide's MP40 graduation meeting. Stage that content push carefully (§6, risk R3). |
| Words | `wordsMet >= WORDS_PHASE1_TARGET = min(1000, floor(0.9 × total populated Phase-1 words))` → **min(1000, 213) = 213** | 213 of 237 available | Same honesty formula as Gate 1; converges on the guide's 1,000 as content grows. |
| Hours | `hoursLogged >= 100` | unchanged phase boundary | Kept — the guide's phase is literally named "The First 100 Hours" — but now necessary, not sufficient. |

**The core code change:** the store's phase self-heal (`store.tsx:388-392`) becomes gate-aware:

```ts
const due = phaseForHours(profile.hoursLogged);
const ceiling = phase1Complete(profile) ? due : (1 as PhaseId);
const next = Math.max(profile.phase, Math.min(due, ceiling)) as PhaseId;
if (next > profile.phase) updateProfile({ phase: next });
```

`Math.max(profile.phase, …)` is the whole grandfather mechanism: **the phase field is only ever raised, never lowered.** Hours can still carry a grower from Phase 2 → 3 → … (those boundaries are out of scope until their own gates exist), but crossing 100 h no longer escapes Phase 1 without a complete spine and the word bar.

### Grandfather rules — nobody regresses

| Cohort | State when this ships | Outcome |
|---|---|---|
| Already `phase >= 2` (promoted by the old hours-only self-heal, or placed) | phase field says 2+ | **Kept.** Self-heal never demotes. Additionally stamp `gatesPassed.phase2 = <ship date> (grandfathered)` so downstream UI treats them as gate-passers, not anomalies. |
| Placement-seeded (onboarding test-out) | `placementSeed()` sets phase 2/3, `hoursLogged = startHour`, `wordsMet` seeded (≥ target), `wordIds: []`, and onboarding parks `meetingProgress = 37` (spine end) | **Pass by construction** — this is exactly why the word leg reads `wordsMet`, not `wordIds.length`. Also seed both gate stamps in `finish()` so the checkpoint card never shows a placed grower an unfinished Phase-1 checklist. |
| Legacy beta grower mid-Phase-1, e.g. 90 h all-practice | `meetingProgress` self-heal already seeded them from hours: `meetingForHours(90) = 37`, minus 1 → 36, so `nextMeetingFor(36) = 37` — **one live session from spine-complete** | Slight, intended friction: they must finish live meeting 37 + reach 213 `wordsMet` before Phase 2. No one who hasn't crossed 100 h loses anything they had. |
| Legacy grower at 40+ h (old Phase1BGuard pass) | speaking tools were open | Stamp `gatesPassed.1b` at migration for any profile with `hoursLogged >= 40` (or `phase >= 2`) — **speaking tools never re-lock** (§4, §5). |
| Brand-new user | zeros | Full gates from day one: 11 live meetings + 150 words + 30 h → 1B; 17 meetings + 213 words + 100 h → Phase 2. |

**Beta-lockout check (the one real risk):** the only cohort the new gate slows is "practice-only grinders approaching 100 h" — and the owner has already explicitly ruled meetings mandatory (M11-M13 plan §4d), with the AI nurturer counting during beta, so a live session is always one tap away. No cohort is locked out of anything they currently have.

---

## 3. UI: the grower always sees what's left

### 3.1 Checkpoint Card (new component, `src/components/CheckpointCard.tsx`)

One card, shown on `/dashboard` (primary) and on `/courses/connecting` (the Phase-1 detail page), always rendering the **next** gate only — Gate 1 until it's passed, then Gate 2, then a "Phase 2 is being built — you're ready" state (because `/courses` still hard-locks `betaPreview = phase.id > 1`).

Mobile-first layout (the #1 rule — this is a stacked card, thumb-reach CTA, no hover dependence):

```
┌─────────────────────────────────────┐
│ 🌱 NEXT: TALKING BEGINS (1B)        │   ← t("gateNext1b"), tierable
│                                     │
│ 🤝 Live meetings      8 / 11   ▓▓░  │   → CTA: Book / Start a session
│ 🃏 Words in iceberg 120 / 150  ▓▓░  │   → CTA: /practice/vocabulary
│ ⏱ Growing hours      22 / 30  ▓▓░  │   → CTA: any activity
│                                     │
│ [ ▶ Start today's meeting ]         │   ← single primary CTA = weakest leg
└─────────────────────────────────────┘
```

Rules that make it honest AND motivating:

- **Numbers are the real derived targets** (11/150/30 today), never the guide's aspirational 300/1000. When content authoring raises a target, users who already passed keep their stamp (§4); users mid-leg see the bar grow with a one-line "new meetings were added to Phase 1" note — growth framed as more game, not moved goalposts.
- **Endowed progress, honestly earned:** the card's header ring shows combined gate progress as `(sum of leg fractions)/3`. A brand-new grower who finished onboarding already has minutes + first words logged, so the ring starts visibly above 0% without fabricating anything — same conversion psychology as the onboarding progress bar, zero fake credit.
- **Each row is a deep link** to the one action that advances that leg; the primary CTA always targets the *weakest* leg (weakest-leg targeting is also what keeps the three behaviors balanced — no grinding one bar).
- **Meetings row microcopy** uses the spine language ("Meeting 12 of 40 · 8 of 11 openable now") so the 40-meeting curriculum stays visible without lying about what's populated.
- **Words row taps into the iceberg metaphor** ("It's in your iceberg") — count-up animation on change, tied to the existing achievements system, not to any randomized reward. Nothing lottery-shaped anywhere: every bar moves only from real GPA activity.
- **Gate completion is a ceremony, not a toast:** full-screen moment with the Mascot (`mood="cheer"`), the guide's own line for Gate 2 — "You're ready to start Phase 2! Congratulations! Celebrate!" — plus a new achievement each (`gate-1b`, `gate-phase2`) in `achievements.ts`. This is the moment the guide literally prescribes celebrating.
- **Session-end tie-in:** the `/session` end screen already shows stats; add a one-line delta ("Meeting 12 ✓ · 3 legs: 9/11 · 131/150 · 24/30") so every live session visibly moves the gate.

### 3.2 i18n / immersion

- All new copy goes through `STRINGS` with keys for all 19 languages: `gateNext1b`, `gateNextP2`, `gateMeetingsLabel`, `gateWordsLabel`, `gateHoursLabel`, `gateCeremony1b`, `gateCeremonyP2`, `gateNewContentNote`, `gateReadyWaitingP2`.
- Classify the short labels (`gateMeetingsLabel` etc.) into `KEY_TIERS` tier 2–3 so the checkpoint card itself participates in graduated immersion — by the time a grower nears Phase 2/3, the card that measures their progress is already partly speaking the host language. (The gate work doesn't change `getImmersionStage`'s phase-step mapping; making stages fractional within a phase is the separate progressive-immersion ticket, but keying phase promotion to real gates is precisely what makes stage flips *earned*, which is the prerequisite for making them feel invisible.)

---

## 4. Stickiness: `gatesPassed` stamps

Because targets are **derived from content**, they will rise as meetings are authored. A purely computed gate would therefore *re-lock* people. Fix: persist first-pass timestamps.

- `types.ts`: add `gatesPassed?: { "1b"?: string; "phase2"?: string }` to **both** `Profile` and `LanguageJourney` (gates are per-language journeys, like `meetingProgress`).
- `store.tsx`: copy `gatesPassed` in `activeJourneySnapshot`, `switchLanguageJourney`, and `emptyJourney` (⚠ forgetting the journey sync would leak a passed gate from Spanish into a fresh Japanese journey — the exact bug class the meetingProgress plumbing just solved).
- A `useEffect` self-heal (same pattern as the two existing ones) stamps a gate the first time its predicate is true, and applies the migration grandfathers: `phase >= 2 → stamp both`; `hoursLogged >= 40 → stamp "1b"`.
- All consumers check `stamp || predicate`, never predicate alone.

---

## 5. Replacing the `minHours: 40` proxy

| Surface | Today | After |
|---|---|---|
| `practice/shared.tsx` `Phase1BGuard` | `phase > 1 \|\| hoursLogged >= 40` | `phase > 1 \|\| gate1bPassed(profile)` — and the lock screen becomes the **three-leg checkpoint card** instead of the bare `Xh / 40h` counter, with Book-a-session as the featured CTA (the current screen only links listening/vocabulary, i.e. only the legs that *aren't* the main blocker). |
| `practice/page.tsx` `GAMES[].minHours: 40` | hours lock chip `🔒 40h` | replace `minHours` with `gate: "1b"`; locked chip shows the weakest remaining leg ("🔒 3 meetings left") — specific, actionable, and different per user. |
| `session/page.tsx:208-212` (activities offered `< 40h` → 1A-only) | hours proxy | same `gate1bPassed` check — the session room and the practice hub can no longer disagree about whether a grower is "in 1B". |
| `nurture/page.tsx` SessionPlanner 1A/1B toggle default | manual (M13 stopgap) | default from the selected grower's gate state when a grower context exists; manual override stays. |

Migration safety: every current beta user with ≥ 40 h gets the `"1b"` stamp (§4), so **no one who can open `/practice/speaking` today loses it**. Users below 40 h were locked anyway; some now unlock *earlier* (30 h + meetings + words is reachable before 40 h for session-heavy users — the right users to unlock early).

---

## 6. Implementation plan

**New file `src/lib/gates.ts`** (pure, no React — mirrors `sessionFlow.ts` style):
- `LAST_1A_MEETING` (derived from `POPULATED_MEETINGS`), `WORDS_1A_TARGET`, `WORDS_PHASE1_TARGET` (derived from `VOCAB_DOMAINS` via the same `effMeeting` rules — export `effMeeting` from `sessionFlow.ts` instead of duplicating it).
- `gateLegs1b(p)` / `gateLegsPhase2(p)` → `{ meetings: {done,total}, words: {done,total}, hours: {done,total}, passed: boolean }` (single source for logic AND the card's numbers).
- `gate1bPassed(p)` / `phase1Complete(p)` = stamp-or-predicate.

**Ordered steps (each independently shippable):**

1. **`gates.ts` + types + store stamps** — `types.ts` (`gatesPassed` on Profile + LanguageJourney), `store.tsx` (journey sync ×3, stamp/migration effect). No behavior change yet; stamps start accruing. *Ship first and let it bake one beta cycle so migration stamps land before anything enforces them.*
2. **Gate the phase self-heal** — `store.tsx:388-392` per §2. The single line that ends hours-only promotion. Verify: 100 h + incomplete spine stays Phase 1; existing Phase-2 profile untouched; placement flow (`onboarding/page.tsx` `finish()`) also seeds stamps.
3. **CheckpointCard** — new component + `dashboard/page.tsx` + `courses/[slug]` (phase 1) + session end-screen delta line. i18n keys ×19 + `KEY_TIERS` entries.
4. **Proxy replacement** — `practice/shared.tsx`, `practice/page.tsx`, `session/page.tsx` activity filter, `nurture/page.tsx` planner default.
5. **Ceremonies + achievements** — `achievements.ts` (`gate-1b`, `gate-phase2`), full-screen celebration, dispatched via the existing `lange:award` bridge.

**Risk register:**
- **R1 — pre-M11a word undercount:** long-tenured live-session users have deflated `wordsMet`. Mitigated by the ≥ 40 h `"1b"` stamp and by Gate 2's word leg being reachable through practice; do not attempt retroactive reconstruction.
- **R2 — placement seeds must precede gate enforcement** in `finish()` ordering (stamps written in the same profile object as `placementSeed`, not in a later effect race). Covered in step 2's verify list.
- **R3 — content authoring extends the spine:** adding meetings 38–40 raises Gate 2's meeting total; anyone at 100 h + old-spine-complete who hasn't yet crossed (no stamp) would gain new requirements overnight. Policy: the self-heal stamps `phase2` for any profile satisfying the gate *at the moment of evaluation*, so ship content pushes with the stamp effect already live (step 1 first — this is why). Users mid-gate see the "new meetings added" note (§3).
- **R4 — journeys:** every new field must ride `activeJourneySnapshot` / `switchLanguageJourney` / `emptyJourney` or stamps leak across languages.
- **R5 — `/courses` Phase-2 lock:** an earned Phase 2 still lands on a `betaPreview`-locked page until the Phase-2 build-out (next milestone). The CheckpointCard's "you're ready — Phase 2 opens soon" state covers the gap; do not remove `betaPreview` as part of this ticket.
- **R6 — demo/fallback languages:** growers whose target lacks a full deck play the Spanish demo deck; their `wordIds` are Spanish card ids. Gates still function (ids are language-independent card ids), but flag in the card's microcopy that content is demo-deck until their language ships.

**Explicitly out of scope (tracked separately):** fractional immersion stages within a phase; Phase 2 gate legs (needs Phase-2 build-out); human-vs-AI meeting credit post-beta (owner's open sub-question in M11-M13 §4d); moving `p1-power` into 1A.
