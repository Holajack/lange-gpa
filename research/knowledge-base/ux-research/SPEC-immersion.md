# SPEC — Continuous Progressive Immersion

Status: implementable recipe. Repo: `/Volumes/LaCie/GPA_Language_Learning`. Goal (owner, verbatim intent): the UI shifts into the target language SO gradually across phases that users barely notice; by Phase 4–5 the dashboard is fully immersive "and they haven't even realized it."

## Current state (what's wrong)

`getImmersionStage` (`src/lib/store.tsx:39`) = `phase - 1` capped at 4; `KEY_TIERS` (`src/lib/i18n.ts:1197`) flips WHOLE tiers at each stage. Result: four cliffs, each landing in a single render — 100 h flips the entire nav bar (~15 tier-1 keys) at once; 250 h flips every button (~120 keys); 500 h all headings (~450); 1000 h all body copy (~700). Between cliffs nothing changes for 150–500 hours. The dashboard "% meter" jumps 0→2→10→45→100, advertising each cliff.

## Target design — three mechanisms

### 1. Continuous immersion score (derived, never stored) — new file `src/lib/immersion.ts` (~80 lines)

Bands align EXACTLY with today's stage boundaries (this is what makes migration free):
- band 1 (tier-1 keys flip across it): score 0→25 = Phase 1, driven by `meetingProgress/40` (+ word bonus)
- band 2 (tier-2): 25→50 = Phase 2, linear in hours 100→250
- band 3 (tier-3): 50→75 = Phase 3, hours 250→500
- band 4 (tier-4): 75→100 = Phase 4, hours 500→1000; Phase 5+ = 100

```ts
export function immersionScore(p: Profile): number {
  if (p.immersion && p.role !== "nurturer") return 100;  // manual toggle unchanged
  if (p.role === "nurturer") return 0;                    // nurturers always native
  const meetings = p.meetingProgress ?? Math.max(0, meetingForHours(p.hoursLogged) - 1);
  const p1 = Math.min(25, (meetings / 40) * 25 + wordBonus(p));
  if (p.phase <= 1) return p1;
  if (p.phase >= 5) return 100;
  const bands: Record<number, [number, number, number, number]> =
    { 2: [25, 50, 100, 250], 3: [50, 75, 250, 500], 4: [75, 100, 500, 1000] };
  const [lo, hi, h0, h1] = bands[p.phase];
  return Math.min(hi, Math.max(lo, lo + ((p.hoursLogged - h0) / (h1 - h0)) * (hi - lo)));
}
```
Monotone by construction (phase never regresses in the store; clamp to band floor).

### 2. Per-key flip thresholds inside each band (`src/lib/i18n.ts` — extend, don't replace)

Each key gets a deterministic threshold inside its tier's band; keys flip ONE AT A TIME:

```ts
const band = (tier: 1|2|3|4): [number, number] => ([[0,25],[25,50],[50,75],[75,100]] as const)[tier-1];
export function flipThreshold(key: string): number {
  const tier = KEY_TIERS[key] ?? 4;
  const [lo, hi] = band(tier);
  const keys = TIER_KEYS[tier];                              // precomputed at module load
  const rank = FLIP_ORDER[key] ?? hashRank(key, keys.length); // curated first, stable hash rest
  return lo + ((rank + 1) / (keys.length + 1)) * (hi - lo);
}
```
- `FLIP_ORDER`: ~50 curated ranks for the visible keys — greetings before nav; `world` (concrete/guessable) before `schedule`; short high-frequency buttons (`play`, `next`, `continue`) before abstract ones (`cancel`, `book`); stat labels before marketplace labels.
- Uncurated keys: stable hash rank — deterministic across sessions, a key never flip-flops.
- Within tier 4, sort the hash-ranked remainder by `en` string length: one-liners flip in band 4's first half, paragraphs only near score 95+.
- Pacing math: a 2 h session moves the score ~0.6 (Phase 1) down to ~0.1 (Phase 4) ⇒ at most ~1 tier-1 key, ~2 tier-2 keys, ~4 tier-3 keys, or 1–3 tier-4 keys per session. No render ever flips a tier wholesale again.

### 3. Vocabulary-anchored flips — the killer trick (`KEY_VOCAB_ANCHORS`)

The UI starts speaking words the grower has personally met. `profile.wordIds` holds the exact vocab-item ids met in sessions (237 items in `vocab.ts`; ids are raw per-domain ids like `apple`, `dog` — match membership as-is).

```ts
export const KEY_VOCAB_ANCHORS: Record<string, string[]> = {
  hello: ["hello"], today: ["today"],
  food: ["apple","bread"], animals: ["dog","cat"], home: ["house","door"],
  family: ["mother","father"], body: ["hand","head"], nature: ["tree","sun"], work: ["work"],
  listen: ["listen"], speak: ["speak"], repeat: ["repeat"], play: ["play"],
  words: ["word"], hours: ["hour"], minutes: ["minute"],
  // … curated pass over vocab.ts, ~40 entries total
};
// rule: key eligible to flip when ≥ ceil(anchors.length/2) of its anchors ∈ wordIds — regardless of score
```
Net effect: after the very first live session, "Bonjou, {name}! 👋" appears — one word, a word they just learned, nothing else changed. Domain chips flip in the order meetings introduce them (`DOMAIN_DEFAULT_MEETING` in `sessionFlow.ts` already encodes: animals m1, home m2, family m5, food m8…). The immersion meter is never 0% after session one — honest endowed progress.

### Blended translator (new signature)

```ts
export const makeBlendedT = (native, target, score, met: ReadonlySet<string>) => (key) => {
  const entry = STRINGS[key]; if (!entry) return key;
  const hit = entry[target]; if (!hit) return entry[native] ?? entry.en ?? key;
  if (GUIDANCE_KEYS.has(key)) return entry[native] ?? entry.en ?? key;  // method guard
  if (anchorsMet(key, met)) return hit;
  if (score >= flipThreshold(key)) return hit;
  return entry[native] ?? entry.en ?? key;
};
```
Also: sibling `makeBlendedMeta(key) → { text, flipped, native }` (provenance for tap-to-reveal), and `immersionShare(target, score, met)` updated to the same logic so the dashboard meter (`dashboard/page.tsx:215-220, 774-782`) becomes a smooth line that moves a little after EVERY session.

## Method guard + safety valves (all required)

1. **`GUIDANCE_KEYS` never auto-immerse** (only the manual toggle flips them): all `ph_*_desc`, `ph_*_how`, `ph_*_prin*`, `ph_*_mile*`, `ph_*_focus` (curriculum guidance stays home-language per the Thomsons/`phases.ts` header) plus safety/consent keys `saf*`, `sesConsent*` (trust & safety — must always be comprehensible). NOTE: this deliberately REVERTS guidance strings to home language for existing P5 growers — a method-correctness fix; call out in release notes.
2. **Manual controls unchanged:** `toggleImmersion` still forces full target (score-100 path); nurturer role always native; no new tri-state.
3. **Tap-to-reveal:** new `<Immersed k>` component renders `t(key)`; when flipped, tap (mobile-first; `title` on desktop) shows the native string in a ~2 s popover. Adopt first on AppNav labels, dashboard headings, buttons. Global zero-adoption fallback: press-and-hold the immersion pill in `AppNav` → 5 s "reveal mode" (store flag re-renders `t` with native strings).
4. **Determinism:** thresholds are pure functions of key + profile. No randomness, ever.
5. **Never flip destructive/confirmation actions early** — keep them effectively late via `FLIP_ORDER`/tier-4 placement (existing KEY_TIERS tier-4 safety intent).

## Flip toast (cheap delight, informational only)

Persist `lastImmersionScore` (localStorage via `immersion.ts`); on app open, if a visible key newly crossed its threshold: one-line toast "🌍 Nuri now says **'Hoy'** — a word you've met." Turns the flip from "did the app glitch?" into a reward. No lottery mechanics.

## File-by-file change list

| File | Change |
|---|---|
| `src/lib/immersion.ts` (NEW) | `immersionScore`, `wordBonus`, `metWordSet(profile)`, `lastImmersionScore` persistence. Imports `meetingForHours` from `sessionFlow.ts`. |
| `src/lib/i18n.ts` | Keep `STRINGS` + `KEY_TIERS` untouched. ADD: `KEY_VOCAB_ANCHORS` (~40), `GUIDANCE_KEYS`, `FLIP_ORDER` (~50), `TIER_KEYS` precompute, `flipThreshold`, `makeBlendedMeta`; CHANGE `makeBlendedT(native, target, score, met)` + `immersionShare(target, score, met)`. |
| `src/lib/store.tsx` | `t` memo: `const score = immersionScore(profile); return score > 0 ? makeBlendedT(native, target, score, metWordSet(profile)) : makeT(native)`. Keep `getImmersionStage` as deprecated wrapper `Math.floor(score/25)`. |
| `src/app/(app)/dashboard/page.tsx` | Meter uses score; add flip toast. |
| `src/components/AppNav.tsx` (+dashboard) | Wrap labels in `<Immersed>`; hold-to-reveal on the immersion pill. |

## Interaction with advancement gates (conflict resolution)

The immersion report proposed its own 1A/1B word gates (250/750) and a P1→P2 self-heal change. **Those numbers are superseded**: gate logic and thresholds live solely in `src/lib/gates.ts` (SPEC-advancement-gates — content-derived 150/213 today, converging on guide numbers as meetings are authored). The self-heal change is owned by the gates spec. This spec's only dependency: once gated, phase promotion is earned, so score 25 arrives with band 1 already fully flipped — **the phase-up moment changes nothing visually. That is the no-cliff property, by construction.** Build gates step 1–2 before or alongside this.

## Migration

**None required.** Score is derived; nothing new stored (except the cosmetic `lastImmersionScore`). Band edges coincide with today's stage boundaries, so an existing user at any phase START sees a UI identical to today's; a mid-phase user only ever sees MORE target language than yesterday — no string ever reverts to native (sole exception: `GUIDANCE_KEYS`, deliberate). Legacy `meetingProgress` self-heal (`store.tsx:394-403`) already feeds the Phase-1 score.

## Tests

- Score monotonicity across (meetings, hours, phase) sequences.
- Band-edge equivalence: score at each phase start ⇒ flipped-key set == old stage's tier set (minus GUIDANCE_KEYS).
- Anchor flips: word met ⇒ key flips next render; never unflips.
- Determinism: same profile ⇒ same flipped set across reloads.
- Nurturer/manual-toggle paths unchanged.

## Effort

~2–3 dev days total: machinery + wiring 0.5 d; anchor/order curation 2–3 h; meter + toast 2–4 h; `<Immersed>` + reveal 0.5 d; tests 0.5 d. No i18n rewrite, no new translations, no schema or Convex change.
