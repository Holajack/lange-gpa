# Nuri UX Research & Specs — Index

Project: Nuri language app (`/Volumes/LaCie/GPA_Language_Learning`). Date: 2026-07-21.
Five research reports were synthesized into four implementable specs. Where reports conflicted, GPA-method fidelity and owner constraints won over generic growth tactics (resolutions are called out inside each spec).

## Research reports (input)

| File | What it covers |
|---|---|
| `onboarding-psychology.md` | Evidence-graded principle library (endowed progress, goal-gradient, defaults, lazy registration, permission priming…), Duolingo/Noom/Headway/Babbel teardowns, prioritized tactic shortlist T1–T12, anti-pattern contract |
| `onboarding-audit.md` | Line-level audit of the current 9-step flow (`src/app/onboarding/page.tsx`), root-cause of the mother's "normal language" failure, friction ranking per step, prefill inventory, honest-endowment inventory |
| `gamification.md` | Duolingo mechanic-by-mechanic analysis (what drives retention, what corrupts learning), motivation science (SDT, overjustification, progress principle, habit formation), the "Growing Season" system M1–M11, hard-ban list |
| `immersion-design.md` | Current step-jump immersion mechanics (`getImmersionStage`/`KEY_TIERS` cliffs), continuous-score design, vocabulary-anchored flips, pacing curve, safety valves, migration analysis |
| `advancement-gates.md` | Code-grounded gate design: content-derived thresholds (proves guide-literal numbers would hard-lock users), three-leg gates, `gatesPassed` stamps, grandfather rules, proxy replacement, risk register |

## Specs (output — hand each to an implementation agent)

| File | Delivers |
|---|---|
| `SPEC-onboarding.md` | Redesigned 6-screen flow (was 9); priority-zero fix for the known-vs-target language confusion (reorder + single-select confirm + plain-words copy); endowed progress bar; Clerk-name prefill; deferred asks; before/after comparison |
| `SPEC-gamification.md` | Build-NOW list (book-next-meeting, session-end harvest, shelf extensions, meeting path, iceberg) vs build-LATER (weekly rhythm, weekly intents, cohort beats, re-living ritual, widget); canonical celebration-moment table; 13-item do-not-build list; data mapping to existing `achievements.ts`/`store.tsx` |
| `SPEC-immersion.md` | Continuous immersion score (derived, no storage), per-key flip thresholds, `KEY_VOCAB_ANCHORS` (UI speaks words the grower has met), `GUIDANCE_KEYS` method guard, tap-to-reveal safety valves, zero-migration plan, ~2–3 dev days |
| `SPEC-advancement-gates.md` | `gates.ts` with content-derived targets (150/213 words today, converging on guide's 300/1000), gate-aware phase self-heal, explicit grandfather table, sticky `gatesPassed` stamps, CheckpointCard, ceremonies, 5 ordered shippable steps |

`README.md` — this index.

## Build order recommendation

**1. SPEC-onboarding (first — ship this week). ~2–3 dev days.**
Priority zero: a real user failed onboarding completely; every new user walks through this door before any other spec matters. No dependencies on the other specs (its endowed-progress bar and placement handling are self-contained; the one touchpoint — placement stamps in `finish()` — is written defensively in both specs).

**2. SPEC-advancement-gates step 1 (stamps) — start in parallel with onboarding. Full spec ~3–4 dev days.**
`gates.ts` + `gatesPassed` stamps must ship early and BAKE one beta cycle before enforcement (its own §7.1 ordering, and the R3 defense). Steps 2–5 (self-heal gating, CheckpointCard, proxy replacement, ceremonies) follow after the bake. This is the spine everything else hangs on and the prerequisite for the Phase 2 build-out.

**3. SPEC-immersion — after gates step 2. ~2–3 dev days.**
Depends on gated phase promotion for its no-cliff property (score 25 must arrive with band 1 already flipped — only true once Phase 2 is earned, not hours-granted). Everything else in it is standalone and migration-free.

**4. SPEC-gamification — last, incremental. ~4–6 dev days across the NOW list.**
Its two LARGE celebration moments are the gate ceremonies (built in gates step 5); session-end harvest wants the gate-delta line (gates step 3); the iceberg/meeting-path surfaces feed and are fed by the CheckpointCard. Order within: N1 book-next + N2 harvest (cheapest, ride the shipped meetingProgress) → N4 meeting path + N5 iceberg → N3 shelf extensions. LATER list (rhythm, intents, cohort, ritual, widget) follows as nurturer-side and recordings features mature.

Dependency graph: onboarding ∥ gates-step-1 → gates-steps-2-5 → immersion → gamification-NOW → gamification-LATER. Total for the whole program: roughly 12–16 dev days.
