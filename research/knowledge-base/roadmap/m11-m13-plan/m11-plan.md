# M11 — Cue-card system + word-history tracking: implementation plan

Scope source: `roadmap/phase1-completion-plan.md` lines 59-61 (M11), cross-refs `phase1-technical-gaps.md` §6, `phase1-content-gaps.md` B2/D7. App root `/Volumes/LaCie/GPA_Language_Learning`, branch `main` / PR #1 (`codex/nurilang-beta-readiness`). Live app with real beta users — every change below is additive.

---

## 1. Root-cause fix — the live session room never logs which cards it introduced

**Confirmed exact location:** `src/app/(app)/session/page.tsx:459`

```tsx
completeActivity(`live-${nurturer.id}-${profile.completed.length}`, mins, points);
```

`points` (state at `page.tsx:221`, incremented once per **correct review answer**, `page.tsx:488`) is passed as the third argument. `completeActivity`'s third parameter is typed `words: number | string[]` (`src/lib/store.tsx:256`); when a **number** is passed, `store.tsx:274-276` only bumps the `wordsMet` counter — it never touches `wordIds` at all (`store.tsx:265-273` is the only branch that adds ids, and it's array-only). Net effect: every live Dirty Dozen session — the app's actual flagship experience — inflates `wordsMet` but leaves `wordIds` completely unpopulated. `grep -rl wordIds src` today returns only `types.ts` and `store.tsx`.

**The fix requires zero store/type changes.** `completeActivity` already has the right signature; the bug is 100% at the call site, and the exact data needed is already computed in-component:

- `session/page.tsx:251`: `const introduced = introducedCards(flow);` — this is already `DeckCard[]` (from `src/lib/sessionFlow.ts:249`, `s.deck.slice(0, s.introduced)`), each with a stable `.id` (`sessionFlow.ts:17-24`).
- The identical pattern already works correctly elsewhere: `src/app/(app)/practice/vocabulary/page.tsx:159-166` calls `completeActivity(id, minutes, [...metIds])`.

**Concrete diff** (`session/page.tsx:452-460`):

```tsx
useEffect(() => {
  if (stage !== "end" || loggedRef.current || !profile) return;
  loggedRef.current = true;
  stopSpeaking();
  recStop();
  const mins = Math.max(1, Math.round((totalSeconds - remaining) / 60));
  const introducedIds = flow.deck.slice(0, flow.introduced).map((c) => c.id);
  completeActivity(`live-${nurturer.id}-${profile.completed.length}`, mins, introducedIds);
}, [stage, profile, remaining, flow, nurturer.id, completeActivity, recStop]);
```

(`points` drops out of the dependency array; `flow` is added — the effect is already idempotency-guarded by `loggedRef`, so adding `flow` as a dep cannot cause a double-log, it only ensures the closure reads the settled `flow.introduced` value.)

**Closely-related, same-file, same-root-cause bug worth fixing in the same PR:** the end-screen stat tile at `session/page.tsx:689` — `["🃏", String(points), t("words")]` — also mislabels the review-correctness score as "words." It should read `String(flow.introduced)` to actually mean "cards met this session," consistent with the fix above and with the sentence one line earlier (`session/page.tsx:683`, `{flow.introduced} {t("sesEndCardsMet")}`) which already gets it right. Not required for the wordIds fix to work, but leaving it as-is means the UI keeps telling the grower a wrong number right next to a place that already computes the right one.

**Also worth flagging (do not fix under M11, note only):** the synthetic completed-checklist id `live-${nurturer.id}-${profile.completed.length}` (`session/page.tsx:459`) is not a real curriculum activity id, so live sessions still never tick a Phase-1 checklist box (`app-implementation.md:205` already documents this as a known, separate gap). That's an M13-adjacent concern (meeting/activity identity), not a wordIds concern — leave untouched here.

---

## 2. Data model — is `profile.wordIds: string[]` sufficient once correctly populated?

**Verdict: yes, no shape change is required to ship M11.** Reasoning:

- **Sequential cross-phase numbering** (content-gaps.md D7 — the guide's "begin with sixteen" Picture Dictionary numbering): `wordIds` is populated via `new Set(prev.wordIds ?? [])` then `[...wordIds]` (`store.tsx:265-270, 295`). JS `Set` preserves insertion order, and the array is never re-sorted anywhere. **Array index + 1 already IS the sequential dictionary number** for free — `wordIds.indexOf(id) + 1`, or simpler, `wordIds.map((id, i) => ({ id, number: i + 1 }))`. No new field needed.
- **Which meeting a word belongs to** (needed if a cue-card view wants to show "met at Meeting 7"): already a **static property of the vocab item itself**, not something that needs to be stored per grower. `src/lib/vocab.ts` items carry `meeting?: number` (e.g. `vocab.ts:192,196` colors domain `meeting: 7`), with domain/global fallback via `effMeeting()` (`sessionFlow.ts:82-84`, `DOMAIN_DEFAULT_MEETING`, `sessionFlow.ts:77-80`). A word-history view can join `wordIds` against `VOCAB_DOMAINS` at render time to get the meeting number; no denormalization into the profile is needed.
- **Introduced-vs-mastered state**: genuinely absent, and correctly so for M11's scope — the guide's cue-card mechanic (B2) is about *coverage* (has this word been introduced at all, keep it "in play") not proficiency scoring. Mastery/spaced-repetition state is a Grand Refreshing (M3) concern, not this one. Do not add it here.

**One real, non-blocking gap worth flagging as a follow-up (not required for M11):** there's no timestamp of *when* a specific word id was first met — `ActivityAttempt` (`types.ts:66-72`) has `completedAt` but only a `wordsAdded` **count**, not the actual ids added in that entry, so "which words haven't come up in N sessions" (the guide's "coverage-reminder to avoid favoritism/ruts") can't be reconstructed after the fact, only "is it in `wordIds` at all, yes/no." A future additive field — e.g. `ActivityAttempt.wordIdsAdded?: string[]` alongside the existing count, or a parallel `Profile.wordMeta?: Record<string, { firstMetAt: string; meetingIntroduced: number }>` populated in the same `completeActivity` branch that already loops `for (const wordId of words)` (`store.tsx:267-273`) — would unlock that later without touching `wordIds` itself. Flagged as an open question below; not proposed as in-scope for this ticket.

---

## 3. Cue-card feature scope for THIS fix — MVP surface vs. defer

M11 is explicitly "content + engineering," but its own text frames the engineering fix as the prerequisite ("building the cue-card feature on top of the current data layer would be built on an undercounted dataset until the logging bug is fixed first") — so the UI scope should be sized to *prove the data is real and start feeding M13/M3*, not to build the full physical-cue-card simulation (random-draw sentence generator across domains, printable binder, etc.) in one pass.

### MVP (ship as part of M11)

1. **"Words So Far" panel in the Nurturer Studio**, extending the existing `CardTable` component (`src/app/(app)/nurture/page.tsx:334-488`, `🃏 {t("nurCardTable")}`) rather than building a new screen from scratch. `CardTable` is already, structurally, a single-card cue-card browser (domain picker, shuffle, one-card-at-a-time reveal) — it's just not grower-specific yet. Minimal additive change:
   - Read `profile.wordIds` (already the active-journey-scoped array per `switchLanguageJourney`/`syncActiveJourney`, `store.tsx:90-119`) and cross-reference against `deck` (the domain's `VocabItem[]`, `nurture/page.tsx:344-349`).
   - Add a "met" badge/dim-vs-highlight state per card and a small header count ("147 words met so far"), sourced from `profile.wordIds.length` filtered to the current `contentLang`'s domains.
   - This directly satisfies the KB's own prescribed fix: "(b) surface `profile.wordIds` ... as a simple word-history panel in the Nurturer Studio tray" (`phase1-technical-gaps.md:117-118`).
2. **Session end-screen tiny addition** (`session/page.tsx`, same `end` stage block around line 686-704): once `flow.introduced` ids are actually landing in `wordIds` (fix #1), the existing "words so far" language is already half-true (`sesEndCardsMet`, line 683) — no new component needed here beyond the tile fix already covered in §1.
3. **Sequential numbering, derived, in the same panel**: `wordIds.map((id, i) => i + 1)` displayed next to each met card in the Nurturer Studio panel (per §2) — satisfies D7's "numbered dictionary" beat without any new data or asset pipeline.

### Explicitly deferred (do NOT build under M11)

- The physical/print "two printed copies" binder + cue-card production workflow (D7) — a content/production-pipeline task, not a UI feature.
- The full **random-draw sentence generator** (B2c: draw location + 2 objects → "Take the spider and run to the window"; draw action + kin + body part → "Hit his brother's foot") — this needs a *domain-role taxonomy* (which domains act as "locations" vs "objects" vs "kin" vs "body parts" vs "actions") that doesn't exist in `vocab.ts` yet beyond the domain id itself. Building it now would be new content-modeling work riding on top of the M11 ticket; it more naturally belongs to **M3 (Grand Refreshing)**, which is the guide's actual consumer of this mechanic (`phase1-completion-plan.md:27-29`).
- Any mastery/spaced-repetition/"struggler" state on top of `wordIds` — belongs to S3 (Struggler protocol) / M3, not here.
- A dedicated new `/cue-cards` route — the existing `CardTable` extension is enough for an MVP; a standalone route can follow once the data has been live for a beta cycle and real usage shows what's missing.

---

## 4. Sequencing — before, after, or parallel to M12/M13?

- **§1 (the one-line call-site fix) should land immediately, standalone, ahead of everything else.** It's a single-file, ~3-line change with a pre-existing correct reference implementation elsewhere in the codebase (`practice/vocabulary/page.tsx`), zero schema migration, and zero risk to the state machine (`sessionFlow.ts` is untouched). There's no reason to bundle it with M12 or M13's larger work, and every day it's delayed is another day of beta users' live sessions writing an undercounted `wordIds`.
- **It does NOT block M12** (placement-engine wiring) — completely disjoint files (`placement.ts`, onboarding UI) with no `wordIds` dependency.
- **It does NOT block M13's core meeting-spine engineering** either, and this is worth being explicit about: `buildMeetingDeck`'s dealing decisions (`sessionFlow.ts:97-129`) key off `meetingForHours(hoursLogged)` (a pure time-based proxy, `sessionFlow.ts:87-89`), never off `wordIds`. So M13's dealer/planner/timer restructuring can proceed in parallel with zero data dependency on this fix.
- **It DOES block, and must land before, the two things that actually consume `wordIds` as ground truth**: **M1**'s 150/300/1,200-word checkpoint detection and **M3**'s Grand Refreshing coverage-check ("cue-card stack checked for anything missed"). Both are downstream must-haves in the same completion plan and both are meaningless against an undercounted dataset. Recommended order: **M11 §1 fix → ship this week, independent of M12/M13's larger schedules → M1/M3 can then safely build on `wordIds` → M11's MVP panel (§3) can ship any time after §1**, in parallel with M12/M13 since it's purely additive/read-only UI.
- **Honest technical judgment**: M11 as merged in the punch list is really two very differently-sized pieces wearing one ticket — a trivial, urgent data-integrity fix (§1) and a genuinely deferrable UI feature (§3). Recommend splitting the punch-list execution (not the roadmap doc) into "M11a: fix the logging bug" (ship now, S-effort in practice despite the M/L label) and "M11b: word-history panel" (M-effort, can slot in wherever convenient relative to M12/M13).

---

## Files to change

| File | Change |
|---|---|
| `src/app/(app)/session/page.tsx` | Line 459 area: pass `flow.deck.slice(0, flow.introduced).map(c => c.id)` instead of `points` as the third arg to `completeActivity`; add `flow` to that effect's dependency array (line 460). Line 689: change the "🃏 words" end-screen stat tile from `points` to `flow.introduced` (same root bug, same file). |
| `src/app/(app)/nurture/page.tsx` | Extend `CardTable` (lines ~334-488) to read `profile.wordIds` (filtered to `contentLang`) and render a "met" indicator + sequential number (`index + 1` in `wordIds`) + total-met count per the KB's own prescribed fix. |
| No changes needed | `src/lib/store.tsx` (`completeActivity` already correctly typed/branches on `string[]`), `src/lib/types.ts` (`wordIds: string[]` shape is sufficient), `src/lib/sessionFlow.ts` (`introducedCards`/`DeckCard.id` already expose exactly what's needed), `src/lib/vocab.ts` (item `id`/`meeting` fields already sufficient for derived numbering), `src/lib/cards.ts` (`getCardImage(itemId)` is a ready-made itemId→art lookup the cue-card panel can reuse as-is). |

---

## Open questions for the owner / synthesis pass

1. Should the §1 fix and §3 MVP panel actually ship as one PR (as the roadmap's single M11 entry implies) or be split into two PRs given how differently sized/urgent they are? (Recommendation above: split.)
2. Is the deferred **random-draw sentence generator** (B2c) explicitly being re-homed under M3 (Grand Refreshing) in the roadmap doc, or does it need to stay nominally under M11 with a note that it's blocked on a domain-role taxonomy that doesn't exist yet?
3. Do we want the `ActivityAttempt.wordIdsAdded?: string[]` (or equivalent per-word timestamp) follow-up field tracked as its own future ticket now, so the "coverage-reminder to avoid favoritism/ruts" nurturer feature (part of B2) has a real data source when someone eventually builds it — or leave it unticketed until a concrete feature needs it?
4. Should the Nurturer Studio word-history panel be gated behind `profile.role === "nurturer"` the way the rest of `nurture/page.tsx` already is (`GrowerGate`/`TrainingGate`, lines 752-753), or would growers also benefit from seeing their own "words so far" list on `/dashboard` — a second, smaller surface not scoped above?
