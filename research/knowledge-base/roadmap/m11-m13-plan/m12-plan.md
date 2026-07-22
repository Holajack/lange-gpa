# M12 — Wire the placement engine into onboarding — implementation plan

Scope source: `research/knowledge-base/roadmap/phase1-completion-plan.md` lines 65–67 (M12),
cross-referenced with Technical #1 in `phase1-technical-gaps.md` lines 18–31.

## 0. What already exists (read in full)

- `src/lib/placement.ts` (232 lines) — complete, self-contained engine. Zero importers anywhere
  in `src/` (confirmed: `grep -rln "placement\|buildGate\|scoreGate\|PlacementGate" src` outside
  the file itself returns nothing — no partial UI, no dead branch, nothing to resume).
- Exports actually available to build against:
  - `placementAvailable(lang: LangCode): boolean` — ≥10 picture words + ≥4 TPR commands in that
    language. True for effectively all 19 `LANGUAGES`.
  - `gate2Available(lang: LangCode): boolean` — `placementAvailable` **and** a native
    `QUESTION_TEMPLATES[lang]` frame exists (10 languages: en es fr de pt it ru ja zh ht — exactly
    `FULL_CONTENT_LANGS`, so gate2 availability and onboarding's own "full immersion" target list
    already coincide 1:1).
  - `buildGate(lang: LangCode, gate: GateId): PlacementGate` — `GateId = 1 | 2`. Gate 1 = 10 word
    rounds (4 tiles) + 2 single-step TPR rounds → earns Phase 2. Gate 2 = 10 question-frame rounds
    (6 tiles) + 3 two-step TPR chains → earns Phase 3. Returns `{gate, lang, rounds, passPct, earns}`;
    each `PlacementRound` is `{kind, audio: string[], tiles: PlacementTile[], answer: string[]}` —
    `tiles` are `{id, emoji}` only, no text, ready to render as tap targets.
  - `scoreGate(gate: PlacementGate, perRound: RoundResult[]): GateResult` — caller collects one
    `RoundResult = {index, kind, correct, replayed}` per round as the user answers, then scores at
    the end. `passed` requires **all** rounds attempted (`perRound.length >= total`) and
    `correct >= neededCorrect(total, 85)`.
  - `placementSeed(phase: PhaseId): {phase, hoursLogged, wordsMet}` — `phase` capped at
    `PLACEMENT_CAP = 3`; `hoursLogged = phaseById(capped).startHour` (100 for phase 2, 250 for
    phase 3); `wordsMet = WORDS_AT_START[capped]` (1000 / 2200). **Does not return `wordIds`** —
    see §3.
  - `MAX_REPLAYS_PER_ROUND = 1` — the UI must let the user replay audio once per round (GPA's
    "ankò" allowance) but no more.
- There is **no single "run the whole flow" entry point** — `buildGate`/`scoreGate` are pure
  functions; all state (current round index, replay count, collected `RoundResult[]`) is the
  caller's responsibility. This is fine (see §4 — no engine changes needed) but it means the new
  UI component owns a real amount of state, not just a "click submit" wrapper.

## 1. Exact wiring

### 1a. New onboarding sub-flow, not two new top-level steps

Insert an **optional branch off step 2** (target-language picker,
`src/app/onboarding/page.tsx:851-879`), not new numbered steps in the fixed 9-step `Dots` sequence.
Reasons: (1) placement needs `targetLang` chosen first — it can't run before step 2; (2) steps
3–8 are explicitly "invitations, never gates" (file header comment, lines 16–17) and the whole
step-count/`Dots` UI assumes a fixed `STEP_COUNT = 9` — shoehorning 1–2 more indexed steps into
that model means touching `STEP_COUNT`, `Dots`, `valid`, `next`/`back`/`jump`, and the footer CTA
switch (lines 1198-1229) for every existing step, which is a lot of blast radius for a feature
that most users (brand-new growers) will decline. A branch is additive instead.

Concretely, after `pickTarget(code)` fires on `TargetCard` (`onboarding/page.tsx:868-877`), show a
new dismissible card **below** the target grid (only rendered once `targetLang !== null` and
`gate2Available(targetLang)` or at least `placementAvailable(targetLang)` is true — most onboarding
target languages are in `FULL_CONTENT_LANGS`, which already implies `gate2Available`):

```
"Already speak some [Nuha]? Test out with a 2-minute listening check →"
[ Skip — I'm starting fresh ]   [ Take the placement check ]
```

- "Skip" is the default path and requires zero new state — `next()` proceeds exactly as today,
  `blankProfile()`/`switchLanguageJourney()` still produce `phase: 1`.
- "Take the placement check" opens a **modal/full-screen overlay** (reuse the existing `AnimatePresence`
  pattern already in this file), not a new step index, so `back`/`jump`/`Dots` logic is untouched.
  Inside the overlay: Gate 1 always; if Gate 1 passes (≥85%), immediately offer Gate 2 ("Keep
  going?" / "Stop here at Phase 2"); if Gate 2 also available and taken and passed, seed Phase 3.
  Failing or declining a gate simply closes the overlay and returns to step 2 with `targetLang`
  already set and no phase change (still `phase: 1` downstream) — never a dead end.
- On completion (pass or explicit stop), store the earned phase in **local component state**
  (`const [placedPhase, setPlacedPhase] = useState<PhaseId | null>(null)`) — do not call
  `saveProfile` yet. `finish()` (line 649) already builds the full `Profile` object in one place;
  that's the single spot that should apply `placementSeed(placedPhase)`, matching how every other
  onboarding answer (city, motivation, interests…) is threaded through as local state until `finish()`.

### 1b. `finish()` changes (`onboarding/page.tsx:649-676`)

```ts
const finish = () => {
  ...
  const progressBase = profile ? switchLanguageJourney(profile, finalTarget) : blankProfile();
  const seeded = placedPhase
    ? { ...progressBase, ...placementSeed(placedPhase) }
    : progressBase;
  const out: Profile = {
    ...seeded,
    ...
  };
  saveProfile(out);
  router.replace("/dashboard");
};
```

`placementSeed` returns `{phase, hoursLogged, wordsMet}` — spread it over `progressBase` before
the rest of the existing field assembly so nothing else in `finish()` needs to change. Guard:
only apply when `!addingLanguage` collides correctly — actually placement should be **available
during `addingLanguage` too** (adding a second target language is exactly the "test out" scenario
for a grower who already knows that language) — `switchLanguageJourney` already gives a fresh
`emptyJourney(lang)` (phase 1) for a new language, so seeding it from placement is consistent
with the existing per-language-journey model (`journeys: LanguageJourney[]`, `store.tsx:54-69`).

### 1c. New component

Add `src/components/onboarding/PlacementCheck.tsx` (new file) — owns the per-round state machine:
`gate: PlacementGate`, `roundIndex`, `replayedThisRound`, `results: RoundResult[]`. Renders one
round at a time (audio autoplay + manual replay button gated by `MAX_REPLAYS_PER_ROUND`, tile grid
using `PlacementTile.emoji`, tap-to-answer), calls `scoreGate` when `results.length === gate.rounds.length`,
shows a pass/fail screen, and on Gate 1 pass offers "continue to Gate 2" via `buildGate(lang, 2)`
(only if `gate2Available(lang)`). Calls back to the parent onboarding flow with the final earned
`PhaseId | null` (null = declined/failed, stays Phase 1) via a prop, e.g.
`onComplete(phase: PhaseId | null) => void`. Uses `speak()` from `@/lib/tts` for `audio` playback
(same call already used elsewhere in onboarding, line 1115) — GateId 1/2 rounds carry `audio:
string[]` (1 entry for word/tpr rounds, 2 for tpr-chain and question... actually question rounds
also have length 1, chains have length 2 — component must loop `audio` sequentially with a short
pause between chain steps).

## 2. UX flow answer + the locked-Phase-2/3 tension

**Placement sits after target-language selection (step 2), before the optional invitation steps
(3–6), fully optional/skippable, never blocking `next()`.** It should NOT run before step 2
(no target language chosen yet, nothing to test), and it should not run at step 8 (immersion
moment) because by then the user has already seen "Hello!" in their target language and answered
several unrelated invitation questions — testing comprehension after that is a worse moment than
right when they've just committed to the language.

**The real tension, addressed directly:** placing someone into Phase 2 or 3 today lands them on a
`/courses/[slug]` page that is unconditionally locked — `executablePhase = phase.id === 1`
(`courses/[slug]/page.tsx:107`) is a hardcoded literal, not derived from `profile.phase`, so **every**
grower, placed or not, sees Phase 2/3 as "Method Preview" with no `practiceHref` links and no
completion tracking (`done = executablePhase && …`, always false past Phase 1). This is not a bug
introduced by placement — it already governs every existing grower who crosses 100 hours
organically — but placement is the first path that would put someone there on day one, so it needs
to be visible in the onboarding result screen rather than a silent surprise.

Confirmed downstream behavior for a Phase-2/3-placed profile (traced through the actual code, not
assumed):
- **Dashboard** (`dashboard/page.tsx:624-638`) already has a defined state for `profile.phase > 1`:
  a "Method Preview" teaser card linking to the locked course page, and `nextActivities` becomes an
  empty array (line 189-192, guarded by `profile.phase === 1`). Not broken, just sparse — no crash,
  no dead-end.
- **`/practice/*` game hub** stays fully open regardless of phase (Technical gap #15) — a Phase-2/3
  profile immediately gets `Phase1BGuard`'s `readyToSpeak = profile.phase > 1 || hoursLogged >= 40`
  → **true**, so `/practice/speaking` and `/practice/repeat` unlock their full 1B content
  immediately (`practice/shared.tsx:86-89`). Every practice-game completion is logged under
  `"maintenance-*"` ids instead of `"p1-*"` ids (`profile?.phase === 1 ? "p1-x" : "maintenance-x"`,
  repeated across `practice/repeat/page.tsx:167`, `practice/speaking/page.tsx:331`,
  `practice/listening/page.tsx:95`, `practice/vocabulary/page.tsx:160`) — i.e. they get review/
  maintenance-flavored drills, not a curated Phase 2/3 curriculum (because none exists yet — that's
  M13/M14 scope, not M12's).
- **Nurturer Studio** Session Planner already lets any certified nurturer pick Phase 1–6
  (`nurture/page.tsx:205-226`) — a placed grower can be booked into a real Phase 2/3-labeled
  session with a human nurturer even though the self-serve course content is a locked preview.

**Recommendation for the onboarding result screen:** be explicit rather than silent. After a Gate 1
or Gate 2 pass, show: *"You've placed into Phase 2 — [N] hours and ~1,000 words already credited.
Phase 2's guided course content isn't built yet, so you'll keep using the practice games (now
counted as review/maintenance) until it ships, and can book real Phase 2 sessions with a nurturer
today."* This is one string change in the result screen copy, no engineering beyond it — the
existing dashboard/practice/nurture code already produces exactly that behavior; the plan's job is
to not let the user discover it by surprise.

## 3. Data model changes

**None required to `Profile`/`blankProfile()` structurally** — `phase`, `hoursLogged`, `wordsMet`
already exist and are exactly what `placementSeed()` returns (`types.ts:112,113,116`). Two smaller
gaps worth flagging, both optional:

1. **`placementSeed` doesn't touch `wordIds`.** `profile.wordIds: string[]` (`types.ts:118`,
   defaulted to `[]` in `blankProfile()` line 137) is the per-word "which cards has this grower
   met" set that M11 is about populating correctly. Seeding a placed-Phase-2 grower with
   `wordsMet: 1000` but `wordIds: []` means the two fields disagree from minute one — any future
   cue-card/word-history view (M11) built on `wordIds` would show an empty deck for someone the
   profile claims knows 1,000 words. This isn't a blocker for M12 (the mismatch already exists
   today for anyone who reaches Phase 2 by hours alone, since `wordIds` is only populated by
   `/practice/vocabulary` per Technical #6), but it's worth a one-line decision: either leave
   `wordIds: []` on a placed profile with a code comment explaining why (honest: "we don't know
   which specific words, only that they passed the check"), or don't bother — no code change
   either way, just don't paper over the inconsistency silently.
2. **No field records that a profile's phase came from placement vs. organic hours.** Not needed
   for M12's stated scope (wiring), but worth a one-line optional field like
   `placedAt?: PhaseId` or `placementResult?: { gate: 1 | 2; pct: number; at: string }` on
   `Profile` if product ever wants to show "you tested into Phase 2" as a permanent badge/receipt
   rather than a one-time onboarding toast. Flagging as optional, not required — the plan works
   without it since `placementSeed` already produces everything `finish()` needs.

No `types.ts` changes are required to ship M12; the above are forward-looking notes only.

## 4. What placement.ts itself needs (vs. pure UI wiring)

**Nothing functionally missing** — `placementAvailable`, `gate2Available`, `buildGate`, `scoreGate`,
`placementSeed` are a complete, coherent set for what the UI needs to do. This is pure UI wiring
work, exactly as the roadmap entry says ("all the hard logic already exists; effort is L only
because of the onboarding UI flow"). Two very small, optional ergonomics gaps for whoever builds
the UI component, neither blocking:

1. No single convenience function like `runPlacement(lang): Promise<PhaseId>` that owns the
   round-loop/state machine — by design, since audio playback and tile-tap timing are UI concerns
   `placement.ts` correctly stays framework-agnostic. The new `PlacementCheck.tsx` component is
   where that state machine belongs, not `placement.ts`.
2. `PlacementRound.audio` is a plain `string[]` of raw utterances — the caller must call `speak()`
   per string and sequence delays for chains itself; `placement.ts` has zero dependency on `tts.ts`
   today (confirmed via its imports, lines 1-4: only `types`, `vocab`, `sessionFlow`, `phases`).
   That's a deliberate, correct separation — leave it as is.

## Summary of file changes

| File | Change |
|---|---|
| `src/app/onboarding/page.tsx` | Add optional placement branch after step 2's target-language pick (new local state `placedPhase`, render a `PlacementCheck` overlay conditionally); apply `placementSeed(placedPhase)` inside `finish()` before building `out: Profile`. No changes to `STEP_COUNT`, `Dots`, or the footer CTA switch. |
| `src/components/onboarding/PlacementCheck.tsx` (new) | Owns the round-by-round state machine against `buildGate`/`scoreGate`/`MAX_REPLAYS_PER_ROUND`; plays audio via `speak()`; renders tile grid from `PlacementTile.emoji`; calls back with earned `PhaseId | null`. |
| `src/lib/i18n.ts` (or wherever onboarding strings live) | New copy for: the "test out?" prompt on step 2, gate instructions/pass-fail screens, and the placed-ahead disclosure string described in §2. |
| `src/lib/placement.ts` | No changes required. |
| `src/lib/store.tsx` / `src/lib/types.ts` | No changes required for M12 itself; optional forward-looking `wordIds`/`placementResult` note left for a future ticket (§3). |
