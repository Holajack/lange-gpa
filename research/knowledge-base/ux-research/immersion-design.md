# Truly Gradual Progressive Immersion — Design for Nuri

Source of truth read in full: `src/lib/store.tsx`, `src/lib/i18n.ts` (structure + KEY_TIERS),
`src/app/(app)/dashboard/page.tsx`, `src/components/AppNav.tsx`, `src/lib/sessionFlow.ts`,
`src/lib/phases.ts`, `src/lib/vocab.ts` (structure), knowledge base `app-implementation.md`,
`phase1.md`, `phase2.md`. Repo: `/Volumes/LaCie/GPA_Language_Learning`.

---

## 1. Exact current mechanics (and where the jumps are visible)

### The pipeline today

1. **`getImmersionStage(profile)`** (`src/lib/store.tsx:39`) — `stage = phase - 1`, capped at 4.
   `P1→0 · P2→1 · P3→2 · P4→3 · P5+→4`. The ONLY input is `profile.phase`.
2. **`KEY_TIERS`** (`src/lib/i18n.ts:1197`) — every i18n key carries a tier `1|2|3|4`
   (missing → 4):
   - tier 1 (~15 keys): nav clusters + greetings — `learn, sessions, community, practice,
     courses, dashboard, schedule, forum, world, events, marketplace, wallet, walTitle, hello, today`
   - tier 2 (~120 keys): buttons & short labels (`continue, back, start, play, listen, speak…`)
   - tier 3 (~450 keys): section titles, stat labels, category chips (`hoursLogged, wordsMet,
     food, animals, family…`, all `ph_*_name/_tag/_title` keys, marketplace/wallet labels)
   - tier 4 (~700 keys): long copy, explanations, onboarding, phase descriptions
3. **`makeBlendedT(native, target, stage)`** (`i18n.ts:1384`) — per key: if
   `KEY_TIERS[key] <= stage` and a target translation exists → target string, else native → en.
4. **`t` memo in the store** (`store.tsx:431-440`): nurturer role → always native; manual
   `profile.immersion` toggle → full target (`makeT(target)`); else blended by stage.
5. **`immersionShare(target, stage)`** (`i18n.ts:1399`) → fraction of keys flipped; rendered as
   the dashboard "App speaks {pct}% {language}" meter (`dashboard/page.tsx:215-220, 774-782`).
6. `profile.phase` moves only via the store's self-heal: `phaseForHours(hoursLogged)` at fixed
   boundaries — 100h→P2, 250h→P3, 500h→P4, 1000h→P5, 1500h→P6 (`phases.ts`).

### Where the step-jumps hit the user

There are exactly **four cliffs**, each triggered by one activity-completion crossing an hour
boundary, all landing **in a single app render**:

| Cliff | Trigger | What flips at once | User-visible surface |
|---|---|---|---|
| stage 0→1 | 100h (P2) | all ~15 tier-1 keys | **Entire mobile bottom tab bar + desktop nav + "Hello" greeting change language simultaneously** — the most jarring possible first impression of immersion |
| stage 1→2 | 250h (P3) | ~120 tier-2 keys | every button in the app (Continue/Back/Start/Book/Cancel…) flips in one day |
| stage 2→3 | 500h (P4) | ~450 tier-3 keys | all headings, stat labels, category chips at once |
| stage 3→4 | 1000h (P5) | ~700 tier-4 keys | all body copy at once |

The immersion meter jumps too (0% → ~2% → ~10% → ~45% → 100%-ish), advertising the cliff.
Between cliffs, **nothing** changes for 150–500 hours — the opposite of "so gradual they
barely notice."

Also relevant: the meeting spine that just shipped — `profile.meetingProgress` (highest live
meeting completed, advanced only by finishing a live `/session`; hours-proxy self-heal for
legacy profiles at `store.tsx:394-403`), `POPULATED_MEETINGS` (17 of meetings 1–40 currently
carry fresh vocab: `sessionFlow.ts:93`), and `profile.wordIds` — the exact vocab-item ids the
grower has personally met in sessions (deduped in `completeActivity`, `store.tsx:273-284`).
`vocab.ts` has 237 items × all 19 languages, and the tier-3 category keys (`food, animals,
home, family, body, nature, work…`) are **the same domains** the vocab cards come from.

---

## 2. Design: continuous immersion driven by data we already have

### 2.1 The immersion score (0–100, derived, never stored)

Replace the 5-step stage with a continuous score whose **bands align exactly with today's
stage boundaries** (this is what makes migration free — see §5):

```
band 1 (tier-1 keys flip across it):  score  0 → 25   = Phase 1   (meetingProgress-driven)
band 2 (tier-2 keys):                 score 25 → 50   = Phase 2   (hours 100→250)
band 3 (tier-3 keys):                 score 50 → 75   = Phase 3   (hours 250→500)
band 4 (tier-4 keys):                 score 75 → 100  = Phase 4   (hours 500→1000)
score 100 = today's stage 4 (full chrome immersion)  = Phase 5+
```

```ts
// src/lib/immersion.ts (new)
export function immersionScore(p: Profile): number {
  if (p.immersion && p.role !== "nurturer") return 100;   // manual override unchanged
  if (p.role === "nurturer") return 0;
  // Phase 1: the live-meeting spine is the clock (40 meetings ≈ 100h)
  const meetings = p.meetingProgress ?? Math.max(0, meetingForHours(p.hoursLogged) - 1);
  const p1 = Math.min(25, (meetings / 40) * 25 + wordBonus(p));  // see 2.2
  if (p.phase <= 1) return p1;
  // Phases 2–4: linear in hours inside the phase band
  const bands: Record<number, [number, number, number, number]> = {
    2: [25, 50, 100, 250], 3: [50, 75, 250, 500], 4: [75, 100, 500, 1000],
  };
  if (p.phase >= 5) return 100;
  const [lo, hi, h0, h1] = bands[p.phase];
  return Math.min(hi, lo + ((p.hoursLogged - h0) / (h1 - h0)) * (hi - lo));
}
```

`Math.max` against the phase-band floor guarantees monotonicity even if hours data is odd
(phase never regresses in the store, so the score never regresses).

### 2.2 The killer trick: vocabulary-anchored flips (`KEY_VOCAB_ANCHORS`)

**The UI starts speaking words the grower has already met.** `profile.wordIds` tells us
exactly which of the 237 vocab items this person has personally encountered in live sessions.
A new map links i18n keys to vocab anchors; an anchored key becomes eligible to flip the
moment its words are in `wordIds`, regardless of score:

```ts
// i18n.ts — extend, don't replace
export const KEY_VOCAB_ANCHORS: Record<string, string[]> = {
  hello: ["hello"],            // met in meeting 1 / Lexicarry greetings
  today: ["today"],            // states/time set (meeting 19)
  food: ["apple", "bread"],    // domain chip flips once ANY 2 food words met
  animals: ["dog", "cat"],
  home: ["house", "door"],
  family: ["mother", "father"],
  body: ["hand", "head"],
  nature: ["tree", "sun"],
  work: ["work"],
  listen: ["listen"], speak: ["speak"], repeat: ["repeat"],  // TPR verbs (verbs set, m33)
  play: ["play"], words: ["word"], hours: ["hour"], minutes: ["minute"],
  // … curated pass over vocab.ts ids, ~40 entries total
};
// rule: flip when ≥ ceil(anchors.length / 2) of the anchors are in wordIds
```

Net effect: **after their very first live session** a grower who met the greeting card sees
"Bonjou, Jacken! 👋" on the dashboard — one word, a word they just learned, and nothing else
changed. The domain chips on the practice picker flip one by one in the order the meetings
introduce those domains (`DOMAIN_DEFAULT_MEETING` in sessionFlow.ts already encodes this
order: animals m1, home m2, family m5, food m8…). The UI's language growth literally mirrors
the grower's. This is also the endowed-progress mechanic the owner wants: the immersion meter
is never 0% after session one.

(Vocab ids are per-domain-unique, not globally namespaced — anchor matching should check
membership in `wordIds` as-is; ids like `apple`, `dog` are the raw item ids stored today.)

### 2.3 Fine-grained flips inside each tier (`flip threshold per key`)

Inside a band, keys no longer flip wholesale. Each key gets a deterministic threshold:

```ts
// i18n.ts
const band = (tier: 1|2|3|4): [number, number] =>
  ([[0,25],[25,50],[50,75],[75,100]] as const)[tier - 1];

export function flipThreshold(key: string): number {
  const tier = KEY_TIERS[key] ?? 4;
  const [lo, hi] = band(tier);
  const keys = TIER_KEYS[tier];                 // precomputed once at module load
  const rank = FLIP_ORDER[key] ?? hashRank(key, keys.length); // curated first, hash for rest
  return lo + ((rank + 1) / (keys.length + 1)) * (hi - lo);
}

export const makeBlendedT =
  (native: LangCode, target: LangCode, score: number, met: ReadonlySet<string>) =>
  (key: string): string => {
    const entry = STRINGS[key];
    if (!entry) return key;
    const hit = entry[target];
    if (!hit) return entry[native] ?? entry.en ?? key;
    if (GUIDANCE_KEYS.has(key)) return entry[native] ?? entry.en ?? key; // §2.4
    if (anchorsMet(key, met)) return hit;                               // §2.2
    if (score >= flipThreshold(key)) return hit;
    return entry[native] ?? entry.en ?? key;
  };
```

- **`FLIP_ORDER`** — a small curated array (~50 entries) fixing the order of the *visible*
  keys: greetings before nav, `world` (a cognate-ish, concrete word) before `schedule`,
  short buttons (`play`, `next`) before abstract ones (`cancel`), stat labels before
  marketplace labels. Everything uncurated falls back to a stable hash rank — deterministic
  across sessions, so a key never flips back and forth.
- Within tier 4, rank long strings *last* (sort the hash-ranked remainder by `en` string
  length): single-sentence explanations flip in Phase 4's first half; paragraph copy only
  near score 95+.
- `immersionShare(target, score, met)` gets the same logic, so the dashboard meter becomes a
  smooth line that moves a little after **every** session — visible, felt progress
  (gamifies the actual learning: the meter only moves because real hours/meetings/words moved).

### 2.4 Method guard: curriculum guidance never auto-immerses

`phases.ts` header + phase1/phase2 KB are explicit: *curriculum guidance is shown in the
grower's home language — exactly like the printed phase guides — while all PRACTICE content
stays 100% in the host language.* Today tier 4 eventually flips activity descriptions
(`ph_*_desc/_how/_prin*/_mile*`) into the target language at P5, which contradicts the
method (a Phase-5 grower can read them, but the *guides* are reference material, and the
Thomsons keep them home-language).

Add a `GUIDANCE_KEYS` set (all `ph_*_desc`, `ph_*_how`, `ph_*_prin*`, `ph_*_mile*`,
`ph_*_focus`, plus safety/consent keys `saf*`, `sesConsent*`) that **only** flips under the
manual immersion toggle, never by score. Safety and consent copy must always be
comprehensible — this is both a method and a trust/safety requirement.

---

## 3. Pacing curve per phase — "and they haven't even realized it"

Increment size guarantee: score is continuous in `meetingProgress` (Phase 1) and
`hoursLogged` (Phases 2–4). A typical 2-hour live session moves the score by ~0.6 (Phase 1:
1 meeting = 25/40 ≈ 0.6; Phase 2: 2h × 25/150 ≈ 0.33; Phase 3: ≈ 0.2; Phase 4: ≈ 0.1).
With ~15/120/450/700 keys per band, one session flips **at most 1 tier-1 key, ~2 tier-2
keys, ~4 tier-3 keys, or ~1–3 tier-4 keys** — plus any vocab-anchored key whose word was met
that day (which never feels jarring, because they just met the word). No render ever flips a
tier wholesale again.

| Stretch | Score | What the grower experiences |
|---|---|---|
| Onboarding → session 1 | 0 → ~1 | UI fully native. Immersion meter seeded above zero the moment the first word is met (endowed progress). |
| **Phase 1A** (meetings 1–15, ~30–40h) | 1 → ~9 | "Bonjou" appears after meeting 1. Domain chips flip as their vocab is met (animals→home→family→food). One nav tab (`world`) flips around meeting 8. Everything else native. |
| **Phase 1B** (meetings 16–40, →100h) | 9 → 25 | Remaining nav tabs flip one at a time, weeks apart. `today`, `play`, `listen`, `speak` flip via anchors (they're TPR/session words). By 1B's end the whole tab bar is target-language — and it happened one word per week. |
| **Phase 2** (100–250h) | 25 → 50 | Buttons trickle: ~1 new button label every 3–4 logged hours. `continue`/`next`/`start` early (high-frequency, seen constantly, instantly guessable from position), `cancel`/`book` later. |
| **Phase 3** (250–500h) | 50 → 75 | Headings and stat labels: ~1 label per 2–3 hours. Stat labels flip next to numbers (`12 palabras conocidas`) — context carries meaning. |
| **Phase 4** (500–1000h) | 75 → 95 | Short sentences and helper copy flip first, paragraphs last. |
| **Phase 5** (1000h+) | 95 → 100 | The last long explanations. Full chrome immersion — arrived at ~0.1 points per hour. Guidance/safety keys stay home-language (manual toggle still forces everything). |

Optional polish (recommended, cheap): a one-line "🌍 Nuri now says **'Hoy'** — a word you've
met" toast when a key flips during an app-open (compare persisted `lastImmersionScore`).
Celebrates learning itself, no lottery mechanics, and turns the flip from "did the app just
glitch?" into a reward.

### Advancement gates to hang on the meeting spine (owner ask)

- **1A → 1B**: all populated meetings ≤ 15 completed live (`meetingProgress ≥ 14`, the last
  populated meeting ≤ 15 today) **and** ≥ 250 words met by ear (`wordIds.length ≥ 250` —
  method: 1A ends with your first ~300 words understood). Immersion score lands ≈ 9–12.
- **1B → Phase 2**: every populated Phase-1 meeting completed (`nextMeetingFor(...) === null`,
  i.e. `meetingProgress ≥ 37` today) **and** `hoursLogged ≥ 100` **and** ≥ 750 words met
  (target ~1,000 understood by ear). Change the phase self-heal for P1→P2 only: hours alone
  no longer promote; hours + meeting-spine completion do (later phases keep hours-only until
  Phase 2 build-out defines its own spine). Score arrives at exactly 25 with band 1 already
  fully flipped — so the phase-up moment itself changes *nothing* visually. That is the
  no-cliff property, by construction.

---

## 4. Safety valves

1. **Manual toggle stays, unchanged** (`toggleImmersion`, AppNav pill + profile page):
   immersion ON still forces the full target UI (score 100 path). Nurturer role still always
   native. No new tri-state.
2. **Tap-to-reveal translation** for any immersed label:
   - Add `makeBlendedT` sibling `makeBlendedMeta(key) → { text, flipped, native }` (same
     logic, returns provenance).
   - New `<Immersed k>` component: renders `t(key)`; when `flipped`, a tap (mobile-first;
     `title` attr on desktop) shows the native string in a small popover for ~2s. Adopt on
     the highest-stakes surfaces first: AppNav labels, dashboard headings, buttons.
   - Global fallback that needs zero per-callsite adoption: press-and-hold the immersion
     pill in AppNav → "reveal mode" for 5 seconds, during which `t` re-renders with native
     strings (store flag). One-line escape hatch for a lost user, and a teaching moment.
3. **Never-immerse set**: safety/report/consent keys (`saf*`, `sesConsent*`) and curriculum
   guidance (`ph_*` guidance keys) excluded from score-driven flipping (§2.4).
4. **Determinism**: thresholds are pure functions of key + profile — no randomness, no
   flip-flopping between renders, and reveal always available.

---

## 5. Implementation plan (extend, don't replace)

### Changes

| File | Change |
|---|---|
| `src/lib/immersion.ts` (new, ~80 lines) | `immersionScore(profile)`, `metWordSet(profile)`, `lastImmersionScore` persistence for the flip toast. Imports `meetingForHours` from sessionFlow. |
| `src/lib/i18n.ts` | Keep `STRINGS` + `KEY_TIERS` untouched. Add `KEY_VOCAB_ANCHORS` (~40 entries), `GUIDANCE_KEYS`/`NEVER_AUTO` set, `FLIP_ORDER` (~50 curated ranks), `TIER_KEYS` precompute, `flipThreshold(key)`. Change `makeBlendedT` to `(native, target, score, met)`; add `makeBlendedMeta`; update `immersionShare(target, score, met)`. |
| `src/lib/store.tsx` | `t` memo: `const score = immersionScore(profile); return score > 0 ? makeBlendedT(native, target, score, metWordSet(profile)) : makeT(native)`. Keep `getImmersionStage` as a deprecated thin wrapper (`Math.floor(score/25)`) for any stragglers. P1→P2 self-heal gains the meeting-spine condition (§3). |
| `src/app/(app)/dashboard/page.tsx` | Lines 215–217: replace stage with score; meter now moves every session. Optional flip toast. |
| `src/components/AppNav.tsx` + dashboard | Wrap labels in `<Immersed>`; add press-and-hold reveal mode on the immersion pill. |

### Migration for existing users

**None required.** The score is derived — nothing new is stored. Because band edges coincide
exactly with today's stage boundaries (score 25 at P2 start ⇒ tier 1 fully flipped = old
stage 1; score 50 at P3 start = old stage 2; …), an existing user at any phase start sees a
UI **identical** to today's, and a user mid-phase only ever sees *more* target language than
they did yesterday — never a string reverting to native. The one deliberate exception:
`GUIDANCE_KEYS` revert to home language for P5+ growers, which is a method-correctness fix
worth shipping (call it out in release notes). `meetingProgress` legacy self-heal already
exists (`store.tsx:394-403`) and feeds the Phase-1 score correctly.

### Effort estimate

| Task | Effort |
|---|---|
| `immersion.ts` + `i18n.ts` threshold/anchor machinery + store wiring | ~0.5 day |
| Curate `KEY_VOCAB_ANCHORS` + `FLIP_ORDER` against vocab.ts/meeting order | 2–3 h |
| Dashboard meter + flip toast | 2–4 h |
| `<Immersed>` reveal component + AppNav/dashboard adoption + hold-to-reveal | ~0.5 day |
| P1→P2 gate change + tests (score monotonicity, band-edge equivalence, anchor flips) | ~0.5 day |
| **Total** | **~2–3 dev days** |

No i18n rewrite, no new strings to translate, no schema change, no Convex change.
