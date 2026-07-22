# Nuri — "Make Phase 1 Perfect" — Technical/Engineering Gap List

Scope: `/Volumes/LaCie/GPA_Language_Learning` (main → lange-gpa.vercel.app). Built by reading
`research/knowledge-base/app-implementation.md` and `research/knowledge-base/nurturer-side.md`
in full, then re-verifying every claim against the current live source (not trusting the KB,
per instructions) — `src/app/(app)/session/page.tsx`, `src/lib/sessionFlow.ts`,
`src/lib/placement.ts`, `src/app/(app)/nurture/page.tsx`, `src/app/(app)/nurture/training/page.tsx`,
`src/app/(app)/courses/page.tsx`, `src/app/(app)/courses/[slug]/page.tsx`, the four
`src/app/(app)/practice/*` game pages, `src/lib/store.tsx`, `src/lib/vocab.ts`, `convex/schema.ts`.
Every file:line below was read directly in this pass, not copied from the KB.

Legend: **MUST** = breaks or measurably degrades the core Phase‑1 loop today · **SHOULD** =
real fidelity/completeness gap, not launch‑blocking · **NICE** = cleanup/consistency.
Effort: **S** < 1 day · **M** 1–4 days · **L** > 1 week (content/production work).

---

## 1. Onboarding never places anyone above Phase 1 — MUST / L

`src/lib/placement.ts` (232 lines) is a fully built, comprehension-only placement engine —
two gates, 85% pass bar, TPR chains, domain-matched distractors, `placementSeed()` that
returns a ready-to-use `{phase, hoursLogged, wordsMet}`. It has **zero importers anywhere in
`src/`** (`grep -rn "from.*placement" src` returns nothing outside the file itself). Onboarding
(`src/app/onboarding/page.tsx`, 1253 lines, 9 steps) never calls it, and `blankProfile()`
(`src/lib/store.tsx:124-149`) hardcodes `phase: 1` for every new profile unconditionally. An
experienced speaker who already understands 2,000+ words is forced through the identical
12-card Dirty Dozen as a total beginner — the exact scenario the engine exists to prevent.
**Fix**: add a "test out" branch in onboarding step 2 (target-language picker) that calls
`placementAvailable`/`buildGate`/`scoreGate` and seeds the profile from `placementSeed()` on a
pass. All the hard logic already exists; this is wiring, not new engineering — hence L only
because of the UI flow work (two gate screens + result screen) needed to expose it.

## 2. Live-session deck dealer has silent dead zones across ~40% of the "40 meetings" — MUST / M

`meetingForHours()` (`src/lib/sessionFlow.ts:87-89`) is `Math.max(1, Math.min(40,
Math.floor(hours/2)+1))` — a flat, hours-only proxy for "which of the 40 Rough-and-Ready-Dozen
meetings is this." `buildMeetingDeck()` (`sessionFlow.ts:97-129`) draws its "fresh" bucket from
items whose effective `meeting` equals that number (`effMeeting`, lines 82-84, falling back to
`DOMAIN_DEFAULT_MEETING` for the 10 original thematic domains that carry no per-item `meeting`
field — verified directly in `src/lib/vocab.ts`, e.g. the `food`/`animals`/`home`/`body` domains
have `{id, emoji, words}` only, no `meeting` key).

I enumerated every meeting number actually assigned across the 237-item vocab (18 "authentic"
sets with explicit `meeting` + the 10 original domains' `DOMAIN_DEFAULT_MEETING` fallback:
animals:1, home:2, family:5, body:5, food:8, nature:14, health:18, work:32, sport:33,
traveling:37). **Only 17 of the 40 meeting numbers have any fresh vocabulary at all**:
{1,2,3,4,5,7,8,9,11,12,14,18,19,25,32,33,37}. For the other 23 (e.g. 6, 10, 13, 15–17, 20–24,
26–31, 34–36, 38–40), `buildMeetingDeck`'s `fresh` array (line 113) is empty, so
`freshTarget = Math.min(0, …) = 0` (line 118) and the entire 12-card deck for that "meeting" is
100% review of already-met cards. Since the highest assigned meeting is 37 (reached at ~72
logged hours), the last ~28 hours of a grower's Phase 1 (of the phase's 100h total) can
introduce **zero new vocabulary** in the live session room no matter how many sessions are run —
directly contradicting the module's own doc comment ("a nurturer introduces ~12 picture cards
per session," `sessionFlow.ts:6-9`).
**Fix**: either spread the 237 items' `meeting` values across the full 1–40 range so every
meeting has ≥8-10 fresh cards, or make `meetingForHours` a function of *distinct meeting
numbers actually populated* rather than a flat `hours/2`.

## 3. Session Planner ignores activity sequencing/prerequisites entirely — MUST / M

`buildPlan()` (`src/app/(app)/nurture/page.tsx:125-173`) draws its picks with
`seededShuffle(phase.activities, rng).slice(0, wish)` (line 128) — a random subset of the
phase's **flat, unordered** `activities` array, with no awareness of `phase.parts` (the 1a/1b
staging that the course pages render as "the sequence") and no `hoursLogged` input at all (the
`SessionPlanner` component's state is just `phaseId` + `length` + `roll` —
`nurture/page.tsx:177-179`). Phase 1's raw activity order in `src/lib/phases.ts` interleaves 1A
and 1B items (`p1-power` at index 7, before `p1-sounds` at index 8, which is 1A) — so a nurturer
planning a session for a brand-new (0-hour) grower can be handed a plan that opens with
**Power Phrases** or **Marketplace Role-Play** (both 1B speaking activities), the exact activity
class the app itself locks everywhere else behind 40 comprehension hours
(`Phase1BGuard`, `practice/shared.tsx:86-88`; `session/page.tsx:192-197` restricts booking to 1A
activity names under 40h). The one tool built to teach an untrained nurturer "what to do in a
session" can recommend the one thing GPA explicitly forbids at that stage.
**Fix**: filter `buildPlan`'s candidate pool by the grower's current part (1a vs 1b, via
`hoursLogged`) before shuffling, and weight toward "listening before talking" as the 1B fixed
skeleton (research corpus) specifies.

## 4. Nurturer cue lines (`CUES`) cover only 4 of the 10 "full content" languages — SHOULD / M

`CUES` (`sessionFlow.ts:143-176`) has entries for **ru, en, ht, ja only**. `FULL_CONTENT_LANGS`
(`src/lib/languages.ts:29`) lists 10: `en es ru fr de pt it ja zh ht`. Every place `cues` is
read (`session/page.tsx:250`, then lines 366-368, 385-401, 411-421, 495, 514-515, 1064-1067,
1090, 1097, 1113, 1117, 1123) guards with `cues ? … : ""`/`cues?.x ?? fallback` — so for es, fr,
de, pt, it, zh (6 of 10 fully-supported languages) the AI nurturer never speaks "Listen." /
"One more time." / "Point to it." / "Well done." and the human nurturer's cue box silently drops
the "Say it twice" / "Ask aloud" framing text, leaving just the bare word or question. This
measurably thins the authentic Phase‑1 ritual (`sesSayItTwice`, the core "say once, at most
twice, then straight to asking" golden rule) for the majority of the languages the app claims
full support for. `QUESTION_TEMPLATES`, by contrast, correctly covers all 10.
**Fix**: translate the 6-string `CueSet` into es/fr/de/pt/it/zh (small, well-defined content
task — same shape as the existing 4).

## 5. Human-recorded audio exists for 3 of 10 full-content languages — SHOULD / L

`public/audio/manifest.json` top-level keys are exactly `en`, `ja`, `ru` (verified directly).
The other 7 `FULL_CONTENT_LANGS` — es, fr, de, pt, it, zh, ht — are `speechSynthesis`-only via
the fallback in `src/lib/tts.ts`. For a method built on natural host-language voice quality,
70% of "fully supported" languages are running on browser TTS quality for every picture-card
word, session cue, and power phrase. Large effort because it's a recording/production pipeline
run (`scripts/generate-audio.mjs`), not a code change.

## 6. Rough-and-Ready-Dozen word history (`wordIds`) is captured but never shown, and is
incompletely populated — SHOULD / M

`profile.wordIds` / `wordsMet` (`src/lib/types.ts`, `store.tsx:265-296`) is exactly the
per-grower "which words has this person met" data the golden rule "uses cue cards to keep ALL
learned words in play" needs — but `grep -rl wordIds src` returns only `types.ts` and
`store.tsx`: **no component anywhere reads it**. It doesn't appear in the Nurturer Studio, the
session-room tray, or the dashboard. Worse, only `/practice/vocabulary`
(`practice/vocabulary/page.tsx:159-169`, passing `[...metIds]`) actually adds specific word ids
to the set. The live session room — the real Dirty Dozen experience — logs
`completeActivity(\`live-${nurturerId}-${completed.length}\`, elapsedMinutes, points)`
(`session/page.tsx:459`), passing a numeric `points` count as the third argument, **not** the
12 card ids that were actually introduced, so cards met live never enter `wordIds` at all. Even
a future "cue-card view" would be built on an undercounted dataset until this is fixed.
**Fix**: (a) pass `introducedCards(flow).map(c => c.id)` into `completeActivity` at session end
instead of `points`; (b) surface `profile.wordIds` (filtered to the active `targetLang`/domain)
as a simple word-history panel in the Nurturer Studio tray.

## 7. No coach role anywhere in the app — SHOULD / M

`grep -ri coach src` (types, components, Convex) returns **zero hits** in the entire tree. The
method's Phase-1 "silent nurturer-trainer" role (optionally present in every real meeting per
the research corpus, with a documented cautionary tale about an ill-informed coach) has no field
on `Nurturer`/`Profile`, no UI entry point, and no presence in the session room (which only
models `nurturer` vs `grower`, never a third silent party).

## 8. No new-words-per-hour pacing indicator anywhere — SHOULD / S

The app already tracks everything needed (`wordsMet`, `minutesLogged`/`hoursLogged` on every
profile) to compute a live words/hour figure, but no screen — not the Nurturer Studio, not the
session end-screen (`session/page.tsx:686-704` shows minutes/words/phase tiles but never a
rate) — ever surfaces it. "Ten new words an hour" / "8+ new words/hour" appears only as static
curriculum prose (e.g. `src/lib/phases.ts:686`, `src/lib/i18n.ts:1005`), never as a computed,
monitored number a nurturer or grower can act on.

## 9. Nurturer Studio's Phase-1 tooling has real internal gaps — SHOULD / M

Verified directly in `nurture/page.tsx`:
- **Meeting Timer** (`SEGMENTS`, lines 488-494; `TIMER_TOTAL`, line 494) is hard-coded to a
  fixed 30-minute 5′/20′/5′ shape with no length control, while the research's real Phase‑1
  meetings run 2–3 hours built from 4–8 chained games — the timer models a small fraction of an
  actual meeting and can't represent the 1B fixed skeleton (day/time opener → sound-focus games
  → Cartoon Bubbles → prior-meeting talking activity → new-vocab listening → structured input).
- **Session Planner** caps at 60 minutes (`LENGTHS`, line 74) — same mismatch.
- No cue-card / word-history view (see #6).
- No coach guidance surface (see #7).

## 10. Nurturer certification has no phase dimension — SHOULD / S

`nurturerCertStatus` (`src/lib/types.ts:100-109`) is a single global pass/fail; the quiz in
`nurture/training/page.tsx` is exclusively the 6 Phase‑1 golden rules (`QUIZ`, lines 38-45).
Nothing in the data model or the Session Planner's phase selector (`PHASES.map(...)`,
`nurture/page.tsx:205-226`, which lets any certified nurturer pick Phase 1–6 for the planner)
stops a nurturer who has only ever passed the Phase‑1 quiz from being handed a Phase‑4 plan.

## 11. `Phase1BGuard`'s loading-state fallthrough briefly unlocks speaking/repeat — NICE / S

`practice/shared.tsx:88`: `const readyToSpeak = !profile || profile.phase > 1 ||
profile.hoursLogged >= 40;` — while `profile` is still `null` (before localStorage/Convex
hydration resolves on first paint), `readyToSpeak` is `true`, so `/practice/speaking` and
`/practice/repeat` briefly render their full Phase‑1B content to what should be gated as a
fresh Phase‑1A grower. Cosmetic flash only (profile usually resolves within one render), but
worth tightening to `profile && (profile.phase > 1 || profile.hoursLogged >= 40)` with an
explicit loading state.

## 12. `buildDeck()` is dead code — NICE / S

`sessionFlow.ts:40-68` (the non-meeting-ordered round-robin dealer) has **zero importers**
anywhere in `src/` or any test file (`grep -rn buildDeck` outside its own definition returns
nothing). The session room exclusively uses `buildMeetingDeck`. Either delete it or repurpose
it (e.g. for a future placement-adjacent "demo deck" use).

## 13. Stale backend documentation — NICE / S

`docs/SETUP-BACKEND.md:12` claims `convex/schema.ts` defines "profiles, bookings, sessionEvents
tables." Directly reading `convex/schema.ts`, the actual tables are: `profiles`, `blocks`,
`safetyReports`, `waitlist`, `wallets`, `ledger`, `requests`, `messages`, `calls`,
`iceCandidates`, `parties`, `partyGuests` — **no `bookings` table and no `sessionEvents` table**.
Bookings live only inside the profile's `data` blob; there is no live session-state channel yet.
Will mislead whoever picks up the two-device-sync work next.

## 14. "40 meetings" is a pure hours proxy with no completion gate, from any source of hours — SHOULD / S

`meetingForHours` only reads `profile.hoursLogged` (session/page.tsx:167), which is incremented
identically by `completeActivity` regardless of source — a live nurturer session, a solo
`/practice/vocabulary` grind, or `/practice/repeat`'s auto-advancing slideshow all count the
same toward "which meeting am I on" for deck-dealing purposes (store.tsx:256-305, no source
discrimination). There's no persisted "meeting N was actually attended/completed" flag anywhere.
Combined with #2, a grower who only ever plays solo practice games can fast-forward the live
session's deck through the entire 40-meeting arc without a single real nurturer-led meeting —
functionally fine as a fallback, but it means "meeting" is cosmetic labeling, not a true
curriculum gate, which is worth being explicit about if the product ever markets "Meeting 12 of
40" as a real milestone.

## 15. Courses lock vs. Practice hub openness is inconsistent (context, not necessarily a bug) — NICE / S

`courses/[slug]/page.tsx:107` hard-locks every activity outside Phase 1
(`executablePhase = phase.id === 1`) behind a "Method preview" tag with no link. Meanwhile
`/practice/*` games remain fully reachable via direct URL or the always-visible `/practice` hub
for any phase — they only branch on `profile?.phase === 1` to decide which curriculum id to log
(`maintenance-*` vs the real Phase‑1 id), never to block access. This appears to be an
intentional design choice (the games are phase-agnostic "maintenance" drills), but it means the
course page's lock icon overstates how gated the underlying content actually is — worth a
product decision either way, not an engineering blocker.

---

## Summary table

| # | Item | Priority | Effort |
|---|---|---|---|
| 1 | Placement engine never wired into onboarding | MUST | L |
| 2 | Meeting deck dealer has fresh-vocab dead zones (23/40 meetings) | MUST | M |
| 3 | Session Planner ignores 1A/1B sequencing (can front-load 1B speaking) | MUST | M |
| 4 | Nurturer CUES cover only 4/10 full-content languages | SHOULD | M |
| 5 | Human-recorded audio only for en/ja/ru | SHOULD | L |
| 6 | wordIds never surfaced + incompletely populated from live sessions | SHOULD | M |
| 7 | No coach role in data model or UI | SHOULD | M |
| 8 | No new-words-per-hour pacing indicator | SHOULD | S |
| 9 | Nurturer Studio timer/planner don't match real 2-3h Phase-1 meetings | SHOULD | M |
| 10 | Nurturer cert has no phase dimension | SHOULD | S |
| 11 | Phase1BGuard loading-state fallthrough | NICE | S |
| 12 | `buildDeck()` dead code | NICE | S |
| 13 | Stale docs (`SETUP-BACKEND.md` claims tables that don't exist) | NICE | S |
| 14 | "Meeting N" is a cosmetic hours-proxy, no real completion gate | SHOULD | S |
| 15 | Courses-lock vs. practice-hub-openness inconsistency | NICE | S |
