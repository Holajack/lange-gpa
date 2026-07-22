# M13 — Build the real 40-Meeting-Plan spine — Implementation Plan

Scope source of truth: `/Volumes/LaCie/GPA_Language_Learning/research/knowledge-base/roadmap/phase1-completion-plan.md` lines 69–76 (M13 entry). Cross-refs read in full: `phase1-technical-gaps.md` (#2, #3, #9, #14), `phase1-content-gaps.md` (A1), `app-implementation.md`, `nurturer-side.md`, `phase1.md`. Live code re-verified directly (not trusted from the KB) on 2026-07-20: `src/lib/sessionFlow.ts`, `src/lib/vocab.ts` (grepped/scripted, not eyeballed), `src/app/(app)/nurture/page.tsx`, `src/app/(app)/session/page.tsx`, `src/lib/phases.ts`, `src/lib/store.tsx`, `src/app/(app)/practice/shared.tsx`.

Repo: `/Volumes/LaCie/GPA_Language_Learning`, branch `main`, PR #1 (`codex/nurilang-beta-readiness`). This is a **live production app with real beta users** — every change below is additive (new functions/params/UI, or a data-preserving remap of an existing function's output range), never a rewrite of working code. `sessionFlow.ts`'s `buildMeetingDeck()`/`buildDeck()` RRD engine is explicitly preserved untouched, per the roadmap's own "positive finding" note.

---

## 0. Verified ground truth (re-derived from live code, not copied from the KB)

**Claim under test:** "only 17 of the 40 meeting numbers have any fresh vocabulary assigned at all."

I wrote a script against `src/lib/vocab.ts` (237 items, 28 domains) rather than eyeballing it. Results:

- 18 "authentic" domains carry a domain-level `meeting:` field (`src/lib/vocab.ts`, confirmed via script): `colors→7, numbers→12, clothing→9, prepositions→4, emotions→11, tableware→2, tools→11, room→3, rooms→8, family-more→5, body-more→5, adjectives→25, states→19, insects→12, animals-more→3, nature-more→14, drinks-more→8, verbs→33`. Item-level `meeting` overrides (present on some items) never introduce a value outside this same set — confirmed by cross-tabulating every `meeting: N` occurrence in the file.
- The original 10 thematic domains (food, animals, home, body, traveling, family, sport, health, nature, work) carry no per-item `meeting` field; `sessionFlow.ts:77-80`'s `DOMAIN_DEFAULT_MEETING` supplies their fallback: `animals:1, home:2, family:5, body:5, food:8, nature:14, health:18, work:32, sport:33, traveling:37`.
- **Union of every meeting number that will ever appear as `effMeeting(...)` for any of the 237 items: `{1, 2, 3, 4, 5, 7, 8, 9, 11, 12, 14, 18, 19, 25, 32, 33, 37}` — exactly 17 distinct values out of 1–40.** This confirms both source reports' claim precisely; no correction needed.
- `meetingForHours(hoursLogged)` (`src/lib/sessionFlow.ts:87-89`) returns every integer 1–40 as `hoursLogged` climbs from 0 to ≥78h. For the 23 unpopulated numbers, `buildMeetingDeck()`'s `fresh` array (`sessionFlow.ts:113`, `all.filter((x) => x.m === meeting)`) is empty, so `freshTarget` (`sessionFlow.ts:118`) is 0 and the entire 12-card deck for that "meeting" is 100% review — confirmed by reading `buildMeetingDeck` end to end, not inferred.
- The Nurturer Studio's `SessionPlanner` (`src/app/(app)/nurture/page.tsx:175-317`) genuinely has **zero grower-specific gating**: `buildPlan()` (`nurture/page.tsx:125-173`) draws `seededShuffle(phase.activities, rng).slice(0, wish)` from `phase.activities` — the flat, unordered 11-item Phase-1 array (`src/lib/phases.ts:31-127`, mixing 1A activities like `p1-dozen`/`p1-sounds` with 1B activities like `p1-ladder`/`p1-market`/`p1-power` at arbitrary array positions) — with no reference anywhere in the component to `phase.parts`, `hoursLogged`, or `profile` at all. Confirmed: `SessionPlanner`'s only state is `phaseId`, `length`, `roll` (`nurture/page.tsx:177-179`).
- By contrast, `session/page.tsx:192-197` already implements the exact filtering logic the Planner is missing: `const phase1aIds = new Set(phase1.parts?.find((part) => part.id === "1a")?.activityIds ?? []); const phase1Activities = (profile?.hoursLogged ?? 0) < 40 ? phase1.activities.filter((c) => phase1aIds.has(c.id)) : phase1.activities;`. This is the pattern the stopgap reuses rather than invents.

---

## 1. Stopgap slice (M-effort, ship first)

Two independent, additive code changes. Neither requires new content authoring.

### 1a. Remap `meetingForHours` to only populated meeting numbers

**File:** `src/lib/sessionFlow.ts:87-89`

Current:
```ts
export function meetingForHours(hoursLogged: number): number {
  return Math.max(1, Math.min(40, Math.floor((hoursLogged || 0) / 2) + 1));
}
```

**Fix — additive, preserves the existing hours→raw-meeting cadence, just snaps the output down to the nearest meeting number that actually has fresh vocab:**

```ts
/**
 * The 17 meeting numbers (of 40) that currently have fresh vocabulary
 * assigned in vocab.ts — either via an item/domain `meeting:` field, or
 * via DOMAIN_DEFAULT_MEETING above for the 10 original thematic domains.
 * Keep this list in sync with vocab.ts; a dev-only assertion can verify it
 * (see §2 "coverage check" below) so silent drift is caught, not shipped.
 */
const POPULATED_MEETINGS = [1, 2, 3, 4, 5, 7, 8, 9, 11, 12, 14, 18, 19, 25, 32, 33, 37];

export function meetingForHours(hoursLogged: number): number {
  const raw = Math.max(1, Math.min(40, Math.floor((hoursLogged || 0) / 2) + 1));
  // Snap DOWN to the closest meeting number with real fresh content, so a
  // grower is never served a 100%-review "meeting" — they simply spend
  // longer on the last populated meeting until the next one is due.
  let snapped = POPULATED_MEETINGS[0];
  for (const m of POPULATED_MEETINGS) {
    if (m <= raw) snapped = m;
    else break;
  }
  return snapped;
}
```

No caller changes needed: `buildMeetingDeck(lang, meeting, count)` (`sessionFlow.ts:97-129`) already handles whatever `meeting` value it's given; it will now only ever receive one of the 17 populated numbers, so `fresh.length` is never 0 for a value this function returns. `session/page.tsx:167` (`meetingForHours(profile?.hoursLogged ?? 0)`) and the two `buildMeetingDeck` call sites at `session/page.tsx:216` and `:269` need no changes. The explicit `buildMeetingDeck(code, 1, DECK_SIZE)` restart-at-meeting-1 call at `session/page.tsx:543` (language-exchange role switch) is unaffected — meeting 1 is populated.

**Effect on pacing:** last new-vocabulary jump now lands at raw meeting 37 (≈hour 72), same as before — this fix does not change *when* new content stops, it only prevents the 23 dead "meeting" numbers from being labeled as distinct meetings that serve zero new cards. A grower now correctly spends a longer, well-defined stretch of hours on each of the 17 real meetings instead of cycling through cosmetic all-review "meetings" in between.

**Optional dev-only coverage check** (nice-to-have alongside the fix, not required to ship it): a small test or console assertion in `sessionFlow.ts` or a test file that computes the actual populated-meeting set from `VOCAB_DOMAINS` at import time and warns if it diverges from `POPULATED_MEETINGS`, so a future vocab addition with a new `meeting:` value doesn't silently go unserved. This is optional polish; skip if effort needs to stay minimal.

### 1b. Gate the Session Planner by Phase-1 part (1A/1B)

**File:** `src/app/(app)/nurture/page.tsx`

Problem confirmed at `nurture/page.tsx:125-173` (`buildPlan`) and `:175-182` (`SessionPlanner` state): the planner can hand a 0-hour beginner `p1-market` (Marketplace Role-Play, 1B) or `p1-power` (Power Phrases — itself mislabeled 1B per content gap C3, but that's a separate item) in the exact same draw as `p1-dozen` (1A). Fix reuses the identical filtering pattern already proven at `session/page.tsx:192-197`.

**Step 1 — import the same helper shape used in the session room** (no new abstraction; `phase1.parts` is already the data source):

```ts
// near the top of buildPlan, only for phase.id === 1
const phase1aIds =
  phase.id === 1
    ? new Set(phase.parts?.find((part) => part.id === "1a")?.activityIds ?? [])
    : null;
```

**Step 2 — extend `buildPlan`'s signature** (`nurture/page.tsx:125`) with a `part1a: boolean` flag, defaulting to the safer choice:

```ts
function buildPlan(phase: Phase, length: MeetingLength, roll: number, part1a: boolean): PlanBlock[] {
  const rng = mulberry32(phase.id * 99991 + length * 271 + roll * 7919 + 13);
  const pool =
    phase.id === 1 && part1a
      ? phase.activities.filter((a) => phase1aIds!.has(a.id))
      : phase.activities;
  const wish = length === 30 ? 2 : length === 45 ? 3 : 4;
  const picks = seededShuffle(pool, rng).slice(0, Math.min(wish, pool.length));
  // ...rest unchanged
```

**Step 3 — `SessionPlanner` component** (`nurture/page.tsx:175-182`): add local state and a UI toggle, defaulting to 1A (mirrors `session/page.tsx`'s own default-to-1A-under-40h behavior):

```ts
const [part1a, setPart1a] = useState(true); // safe default: listening-only
```
Pass `part1a` into `buildPlan(phase, length, roll, part1a)` (line 182), and add a small pill toggle next to the existing `LENGTHS` row (`nurture/page.tsx:229-243`) — visible only when `phase.id === 1` — labeled e.g. "1A · Listening only" / "1B · +Talking", using the same `pill` styling already used for the length buttons. Reset `roll` to 0 on toggle, same as the existing phase-switch handler at line 211-214.

**Scope note:** this does not wire the planner to a specific *grower's* `hoursLogged`, because the Planner is a general-purpose tool a nurturer uses for planning ahead of any of their growers (not necessarily the signed-in profile) — there is no "which grower is this plan for" selector anywhere in the current UI to hang an hours-based default on. The 1A/1B toggle is the stopgap; auto-defaulting the toggle from a specific grower's `hoursLogged` is a natural follow-on once/if the Planner grows a grower picker, but is out of scope for this stopgap. Flagging as an open question below.

**Not in the stopgap:** the Meeting Timer's fixed 30-min shape (`nurture/page.tsx:488-494`, `SEGMENTS`/`TIMER_TOTAL`) and the Planner's `LENGTHS = [30, 45, 60]` cap (`nurture/page.tsx:74`) are a separate gap (Technical #9) from the sequencing bug the roadmap's stopgap text names ("remap `meetingForHours`... and gate the planner by part/hours"). See §3 below — that is real new work, not part of this M-effort slice.

---

## 2. Full fidelity slice (L-effort, follow-on)

The stopgap buys correct *sequencing* (no more dead-zone meetings, no more front-loaded 1B activities for beginners) with zero new content. It does **not** make the app's "40 meetings" actually resemble the guide's 40 distinct, thematically differentiated Meeting Plans — that requires real content authoring plus one data-model change.

### 2a. Content authoring required (per `phase1.md`'s meeting-by-meeting map, §"Meeting-by-meeting content map")

To go from 17 populated meeting numbers to all 40 with genuine per-meeting themes, each of the 23 currently-empty numbers needs its own fresh vocabulary/activity content matched to the guide's actual meeting map (already fully cataloged in `phase1.md` — reproduced compactly, see that file for the full per-meeting text):

- **1A gaps (M6, M10, M13, M15):** M6 touch/wash/pat verbs + object pronouns + possessive-pronoun-with-body-part combos; M10 listen/read/think/chew/play/work/write/sleep/wake/swallow/draw/erase + to/from + singular/plural; M13 ordinal numbers + countries/continents/map/nationalities + Number Bingo; M15 want/have/see + Grand Refreshing with bags (this is also M1/M3's Grand Refreshing checkpoint — see content-gaps B1).
- **1B gaps (M16-17, M20-24, M26-31, M34-36, M38-40):** first-talking body-parts naming + Ladder of Success content (M16); possessives spoken + names/ages (M17); town places + states-of-others (M20); box/jar action verbs + plural possessives (M21); appliance verbs + recasting content (M22); cutting-out info-gap + scene descriptions (M23); question-words suite (M24 — also flagged standalone as content-gaps B4/MUST/S, cheapest MUST-tier item independent of M13); book adjectives + if/then commands (M25); form-focused games + shapes/lengths (M26); drawing-dictation info-gap + quantities (M27); rooms/furnishings + born-in/grew-up-in (M28); water suite + Actions Charades (M29); time/calendar/clock/seasons suite + why-explanations (M30); Day-and-Time opener + can/can't-because + big numbers/money (M31); paths-of-movement + bargaining + before/after (M32); indirect discourse + work-action verbs + transportation (M33); Lexicarry-as-story narration + senses suite (M34); story retelling + before/after/while sequencing (M35); Plan-Your-Own-Meeting form (M36); communicative-grammar activities + movement verbs + synonyms (M37); MP38-40 capstone trio — negation, relative clauses, Making Statements (M38-40, also content-gaps B8/MUST/M).

Several of these vocab/activity gaps are *already independently tracked* as their own MUST/SHOULD items in the roadmap (M1 checkpoints, M3 Grand Refreshing, M4 Physical States/Needs, M5 possessives, M6 time/calendar suite, M7 MP38-40 capstone, M8 numbers-beyond-10, B4 question-words, B9 world-map, B10 town/landscape, B11 if/then sequencing) — **M13's full-fidelity slice is not separate labor from those items; it is the same 23-meeting content backlog, organized by meeting number instead of by activity type.** Landing those items (already scoped in the completion plan) *is* what fills in the remaining 23 meetings. This should be tracked as one coordinated content-authoring backlog, not duplicated effort.

### 2b. Data-model change needed to support real per-meeting theming

Current shape (`src/lib/types.ts` `VocabItem`/`VocabDomain`, used by `src/lib/vocab.ts`): each vocab item optionally carries a single flat `meeting?: number`, and each domain optionally carries a domain-level default. This is adequate for "which meeting introduces this word" but has no representation of:

- **Per-meeting activity composition** — the guide's Meeting Plans are not just "a word list," they're an ordered sequence of *named games* (`phase1.md §2`: "A chain of 4-8 games per plan"). Nothing in `phases.ts`'s `Phase`/`PhaseActivity` shape (`id, name, description, how, minutes, kind, practiceHref`, no meeting-range field) or `vocab.ts` ties a specific activity instance to a specific meeting number the way the guide's three-column MP tables do.
- **Per-meeting grammar/structure focus** — e.g. M24's question-words suite, M31's can/can't-because, M39-40's relative clauses are grammar-shaped content, not vocab-domain content; today's `VocabDomain` shape has no slot for "this meeting's structured-input focus" independent of a word list.

**Recommended additive change** (does not touch existing fields, so nothing that currently reads `VocabDomain`/`VocabItem`/`meeting` breaks): introduce a new, optional `MeetingPlan` type and a `MEETING_PLANS: MeetingPlan[]` table (new file, e.g. `src/lib/meetingPlans.ts`) that is the actual digitized 40-row index of `phase1.md`'s meeting-by-meeting map:

```ts
export interface MeetingPlan {
  meeting: number;              // 1..40
  part: "1a" | "1b";
  theme: string;                // short display label, e.g. "Body parts & possessives"
  vocabDomainIds: string[];     // domains/items this meeting draws its "fresh" set from
  activityIds: string[];        // PhaseActivity ids exercised this meeting (existing phases.ts ids)
  grammarFocus?: string;        // e.g. "question words", "if/then conditionals"
  notes?: string;                // e.g. "Day-and-Time opener begins" (MP31), "Grand Refreshing" (MP7/14/15/36)
}
```

`sessionFlow.ts`'s `buildMeetingDeck` and `meetingForHours` continue to work exactly as today (they only read the existing `meeting:` field on `VocabItem`/`VocabDomain`) — `MEETING_PLANS` is additive metadata that the Nurturer Studio, course pages, and (once the 23-meeting content backlog above is filled in) the deck dealer can *optionally* consult for richer per-meeting UI (e.g. a "Meeting 24 of 40 — Question Words" header, or a Nurturer Studio meeting-by-meeting browser) without requiring a rewrite of the existing vocab/deck plumbing. This is the minimal-risk path: ship the stopgap now on the existing data shape, backfill `MEETING_PLANS` incrementally as each of the 23 gaps gets real content, and only then teach `buildMeetingDeck`/the Planner to prefer `MEETING_PLANS`-declared activity sets over the current flat-array/domain-meeting inference once the table is actually complete enough to trust.

---

## 3. Timer/Planner realism (Q3): UI change, data change, or both?

**Both — and it's a distinct, non-trivial L-effort item, not folded into the M13 stopgap.**

Two things are hardcoded and mismatched to the guide's real 2-3 hour, 4-8-game 1B meeting skeleton (`phase1.md §2` "Phase 1B meeting skeleton", 7 fixed segments: Day-and-Time opener → sound-focus games → Cartoon Bubbles → prior-meeting talking activity → new-vocab listening → form-focused games → Yesterday's Actions):

- **Meeting Timer** (`nurture/page.tsx:488-494`): `SEGMENTS` is a hardcoded 3-entry array (5' review / 20' play / 5' record) and `TIMER_TOTAL` sums to a fixed 1800s (30 min). The render logic bakes in the assumption of exactly 3 segments sized against a literal `/30` denominator (`nurture/page.tsx:610`: `width: ${(seg.minutes / 30) * 100}%`, and again at `:623`).
- **Session Planner** (`nurture/page.tsx:74`): `LENGTHS = [30, 45, 60] as const` caps the selectable meeting length at 60 minutes; `buildPlan`'s `wish` (how many activities to draw, `nurture/page.tsx:127`) tops out at 4 for the 60-minute option, versus the guide's 4-8 games over 120-180 minutes.

**What fixing this actually requires:**

1. **Data change** — `LENGTHS` needs real values (e.g. 120/150/180) and `buildPlan`'s `wish` logic (currently a 3-way ternary) needs to scale to 4-8 picks for those lengths. More importantly, the Timer and the Planner are currently two *independently* hardcoded models of "what a meeting looks like" — the Timer's 3-segment shape has no relationship to the Planner's activity-block output at all. The structurally correct fix is to make the Timer consume the *same* `PlanBlock[]` shape `buildPlan()` already produces (`nurture/page.tsx:89-101`), rather than maintaining a second, disconnected segment model — i.e., the Timer becomes "play through the plan the Planner just generated" instead of "count down a fixed 5/20/5 shape." That is a data-shape unification, not just a numbers tweak.
2. **UI change** — once segment count and total length are dynamic instead of fixed at 3/30, the segmented bar (`nurture/page.tsx:601-627`), the cue-speaking boundary logic (`nurture/page.tsx:528-540`, currently only knows about exactly two boundaries `b1`/`b2`), and the big-clock/segment-label rendering all need to iterate over a variable-length list instead of three named constants.

Given both a data-shape unification (Timer ↔ Planner) and non-trivial UI rework (variable segment count, variable boundary cues, 1B's actual 7-part fixed skeleton vs. the Planner's generic activity-shuffle), this is correctly scoped as its own L-effort item — it should not be bundled into the M13 stopgap (which is deliberately two small, independent, low-risk diffs), and arguably deserves its own roadmap line rather than being silently absorbed into "M13 full fidelity," since it's really about *session-shape realism* rather than *content* per se. Recommend tracking it as a sibling to Technical gap #9, cross-referenced from M13 rather than merged into it.

---

## 4. The no-persisted-meeting-attended-flag gap (Q4): in scope for M13, or separate?

**Judgment: out of scope for the M13 stopgap; belongs with the full-fidelity slice as a flagged, decision-needed item — not silently built.**

Reasoning:

- The roadmap's own M13 stopgap description (`phase1-completion-plan.md:74`) names exactly two fixes — "remap `meetingForHours`... and gate the planner by part/hours" — and does not mention an attendance flag. The stopgap as scoped is deliberately two small, mechanical, non-controversial code diffs; adding persisted attendance tracking would roughly double its footprint and introduce product-policy questions the roadmap hasn't resolved.
- Technical gap #14 (`phase1-technical-gaps.md:183-194`, "'40 meetings' is a pure hours proxy with no completion gate... worth being explicit about if the product ever markets 'Meeting 12 of 40' as a real milestone") is listed as its own standalone SHOULD/S item in the technical-gaps report — not merged into item #2 (the dead-zone bug) or #3 (planner sequencing), even though the completion-plan's merged M13 entry cites it in the same bracket. That citation reflects "these three problems are related" (all under the meeting-spine umbrella), not "these three problems ship together."
- Building it requires more than a code fix: it requires (a) a **new persisted field** (e.g. `profile.attendedMeetings: number[]` or `meetingsCompleted: number`, written only when a live session genuinely completes — likely at the same `completeActivity` call site session/page.tsx:459 touches for M11, see §5), and (b) a **product decision** the roadmap has not made: does `/practice/*` solo grinding count toward "meeting" progression at all, or only live nurturer-led sessions? The technical-gaps report itself calls the current behavior "functionally fine as a fallback" — i.e., it explicitly declines to call this a bug, only a labeling-honesty question. Shipping a fix here means picking a policy, which is a product call, not an engineering one.
- Effort-wise this is genuinely more than S once the policy question is answered (new schema field, gating logic change to `meetingForHours` or a parallel `attendedMeetingForProfile()`, and UI decisions about what to show a grower who has hours but no attended meetings). It fits better as an explicit, flagged full-fidelity/L-effort item — ideally logged the same way the roadmap already handles "Blocked — needs a decision" items (B-1 through B-4) — than as a stopgap addendum.

**Recommendation:** note it in M13's full-fidelity slice as "Decision needed: should `/practice/*` solo hours advance the live-session 'meeting' number, or only live nurturer-led sessions? If the latter, add a persisted attendance counter written at `session/page.tsx`'s end-of-session log point." Do not build silently either way.

---

## 5. Dependency on M11 (Q5): can the stopgap run independently?

**Yes — the M13 stopgap has no dependency on M11 and can ship in either order, or in parallel.**

M11 ("Cue-card system + word-history tracking") first sub-piece, per `phase1-technical-gaps.md` item #6, is: fix `session/page.tsx:459` — `completeActivity(\`live-${nurturer.id}-${profile.completed.length}\`, mins, points)` — to pass `introducedCards(flow).map((c) => c.id)` instead of the numeric `points`, so `profile.wordIds` (`src/lib/store.tsx:265-296`) gets correctly populated from live sessions.

Where the two touch the same files:

- **`session/page.tsx`** — M11 touches line 459 only (inside the "log progress exactly once on END" effect, `session/page.tsx:452-460`). M13's stopgap touches line 167 (`meetingForHours(profile?.hoursLogged ?? 0)`) and the two `buildMeetingDeck(...)` call sites at lines 216 and 269 — a completely disjoint region of the same file, inside different effects (deck construction vs. end-of-session logging). No shared variables, no call-order dependency: `meetingForHours`'s return value never flows into the `completeActivity` call, and `introducedCards(flow)`'s membership never flows into deck construction. These are two independent hunks that happen to live in the same file; they merge cleanly regardless of order.
- **`sessionFlow.ts`** — M13's stopgap edits `meetingForHours` (lines 87-89). M11's fix doesn't touch `sessionFlow.ts` at all — `introducedCards` (already exported, `sessionFlow.ts:249`) is read, not modified.
- **`nurture/page.tsx`** — M13's stopgap edits `SessionPlanner`/`buildPlan` (lines 125-182, 229-243). M11's second sub-piece ("surface `profile.wordIds`... as a word-history panel in the Nurturer Studio tray," tech gap #6b) would add a *new* section to this same file — but as a new, additive component/section, not a modification of `SessionPlanner`. Worth a light coordination note (avoid two PRs touching the same file diverging awkwardly) but not a hard dependency — no shared state or function signature between a new word-history panel and the Planner's part-gating toggle.

**Net:** ship M13's stopgap now; land M11's `wordIds` fix whenever convenient. The only real ordering preference is a *soft* one for M13's **full-fidelity** slice (§2), not the stopgap: once content authoring reaches the cue-card-driven MP7/14/15/36 Grand Refreshing and MP38-40 Making Statements activities (both explicitly draw random cue cards from "words already met" per `phase1.md §6` items 13 and 32), that content will want accurate `wordIds` to work correctly — so M11 landing first benefits the *L-effort* slice's later cue-card work, but does not block the M-effort stopgap in any way.

---

## Summary table

| Slice | Effort | Files touched | Blocked by M11? |
|---|---|---|---|
| 1a. Remap `meetingForHours` | S (part of the M stopgap) | `src/lib/sessionFlow.ts:87-89` | No |
| 1b. Gate Planner by 1A/1B | M (part of the M stopgap) | `src/app/(app)/nurture/page.tsx:125-182, 229-243` | No (soft file-proximity note only, re: M11's word-history panel add) |
| 2. Full-fidelity content (23 meetings) | L | `src/lib/vocab.ts`, `src/lib/phases.ts`, new `src/lib/meetingPlans.ts`, `public/cards/*` | No; benefits from M11 for cue-card-driven activities specifically |
| 2b. `MeetingPlan` data model | M (part of L slice) | new `src/lib/meetingPlans.ts` | No |
| 3. Timer/Planner realism (2-3h meetings) | L (own item, cross-ref M13, not merged in) | `src/app/(app)/nurture/page.tsx:74, 488-494, 601-627` | No |
| 4. Persisted meeting-attendance flag | Decision needed, then L | `src/lib/store.tsx`, `src/app/(app)/session/page.tsx` (near line 459), `src/lib/sessionFlow.ts` | Loosely related to M11's completeActivity call site — coordinate, don't couple |
