# SPEC — Nuri GPA-Compatible Engagement System ("The Growing Season")

Status: implementable spec. Repo: `/Volumes/LaCie/GPA_Language_Learning`. Extends existing infrastructure — **never duplicates it**: `src/lib/achievements.ts` (Growth Shelf + `lange:award` event bridge), `src/lib/store.tsx` (`meetingProgress`, `hoursLogged`/`minutesLogged`, `wordIds`/`wordsMet`, `week[7]` + `weekStartedAt`, dormant `streak: 0` field, `activityLog[]`, `bookings[]`, `achievements{}`), `src/lib/mascots.ts`, `src/lib/sessionFlow.ts`, `src/lib/vocab.ts`.

## Design laws (binding, derived from GPA doctrine + owner constraints)

1. Rewards are **informational** ("this happened, and it's real"), never **controlling** ("do X to get Y") — overjustification effect; the Growth Shelf's own comment ("never a debt to be serviced") is the house style.
2. The unit of commitment is the **live meeting with a human**, not the calendar day.
3. Every mechanic is denominated in real GPA currencies: meetings completed in order, hours of participation, words *met* (encountered — never mastered/tested), recordings re-lived, relationship firsts, phase milestones. Never: accuracy, speed, recall, rank.
4. Nothing decays, nags, resets to zero, or ranks users against each other ("the group is a team, not competitors").
5. Celebrate what the guide itself celebrates (MP7 "Hurrah for 150 words," end of 1A, MP40 "Congratulations! Celebrate!").

---

## BUILD NOW (this cycle)

### N1 — Book-the-Next-Meeting (implementation intention; highest-leverage single mechanic)
- **Where:** `/session` end screen primary CTA; dashboard "next meeting" card; booking flow.
- **Flow:** session end always leads with "Next: Meeting {n+1} — keep your {Tuesday 7pm} with {nurturer}?" One tap rebooks the same slot. Copy is if-then shaped ("Tuesdays, after dinner, with {name}").
- **Data:** `bookings[]` (exists) + nurturer availability. No schema change.
- **Why safe:** it IS the method — the program is a sequence of nurturer meetings. Evidence: implementation intentions d=0.65; partner accountability ≈85% completion.

### N2 — Session-End Harvest (the celebration loop for "meeting completed")
- **Where:** post-session screen (`src/app/(app)/session/page.tsx` end state); smaller variant post-practice.
- **Flow — 3 beats:** (1) iceberg splash: "+{14} words slid into your iceberg" (delta of `wordIds`); (2) hours ring tick + any Growth Shelf badge landing as toast via the existing `ACHIEVEMENT_EVENT`/`lange:award` bridge; (3) gate-delta line ("Meeting 12 ✓ · 9/11 · 131/150 · 24/30" — numbers from `gateLegs*()` in `src/lib/gates.ts`, see SPEC-advancement-gates) then N1's one-tap rebook. Mascot reacts with warmth, never disappointment.
- **Data:** `activityLog`, `wordIds` delta, `achievements` (all exist).

### N3 — Growth Shelf extensions (`achievements.ts` — extend, keep the framing verbatim)
New achievement ids (informational, dated, permanent; dispatched through the existing `lange:award` bridge):
- `meeting-7` ("Hurrah for 150 words" — guide's own MP7 ceremony), `meeting-16` ("First words spoken"), `meeting-40` ("100 hours").
- `gate-1b`, `gate-phase2` (awarded by the gate ceremonies — SPEC-advancement-gates §Ceremonies owns the trigger).
- Relationship firsts, following the existing self-reported `first-joke` pattern: `first-relive` (first re-listened recording), `first-market` (first marketplace role-play).
- **Data:** `achievements{}` EarnedMap + `meetingProgress` (exist).

### N4 — Meeting Path (the spine made visible — Duolingo's path, but real)
- **Where:** dashboard (current node + next), `/courses` Phase-1 page.
- **Flow:** the 40 Meeting Plans rendered as a single vertical mobile-first trail; `meetingProgress` advances the marker; themed stops ("Meeting 8: foods, give/take, numbers") from a per-meeting theme list imported from `research/knowledge-base/phase1.md` §5 into `phases.ts`/`sessionFlow.ts` metadata. Milestone markers at M7, M15/16, M40. **Pre-Meeting-1 nodes (orientation, host-world name, group intro) render already completed** — honest endowed progress on day one. Unpopulated meetings render as "coming" stops (microcopy per SPEC-advancement-gates: "Meeting 12 of 40 · 8 of 11 openable now").
- **Why safe:** the guide mandates strict meeting order; nodes complete by attendance, never by test.
- **Data:** `meetingProgress`, `POPULATED_MEETINGS` (exist) + NEW per-meeting theme strings (i18n ×19, tier 4).

### N5 — Iceberg (flagship progress surface; the 1A-anxiety antidote)
- **Where:** dashboard hero; referenced by N2 beat 1 and the CheckpointCard words row.
- **Flow:** every logged word grows the iceberg **below the waterline**. Tap → drift through met words as floating cards — reminiscence, explicitly NOT a quiz. When 1B talking begins, optionally surface spoken words above the waterline (needs `spokenWordIds[]` — LATER, see L-list). Copy leans on the guide's refrain: "It's in your iceberg."
- **Hard rules:** counts encounters only; words never marked wrong, never decay, never tested; misses are invisible.
- **Data:** `wordIds`, `wordsMet` (exist). MVP = below-waterline only, zero schema change.

### N6 — CheckpointCard + gate ceremonies
Owned by SPEC-advancement-gates (§3). Listed here because it is the engagement system's "checkpoint hit" and "phase advance" celebration surface: three real legs, weakest-leg primary CTA, full-screen ceremony with mascot `mood="cheer"` and the guide's own celebration lines. Do not build a second progress card.

---

## BUILD LATER (ordered)

### L1 — Weekly Rhythm (the anti-streak)
- User picks a rhythm target (e.g. "2 meetings + 3 re-living evenings/week"); a gentle ring fills across the week from `week[]` (already Monday-anchored). N consecutive weeks = "steady season" indicator. **A missed week never zeroes anything** — copy: "seasons have quiet weeks"; the shelf keeps the best season on record (`season-best` badge).
- **Data:** `week[]`, `weekStartedAt` (exist); **repurpose the dormant `streak: 0` field as `rhythmWeeks`**; add `rhythmTarget` (user-set — autonomy). Migration: `streak` is unused; rename in `types.ts` + `blankProfile()` with a read-fallback.
- Rhythm-saver style reminder near week end, weekly cadence, opt-in only.

### L2 — "This Week's Play" (quests, defanged)
Up to three weekly intents auto-suggested from rhythm + path position ("attend 2 meetings," "re-live 3 evenings," "meet 25 new words"), each editable or dismissible. No currency, no chest — completing them fills the rhythm ring; occasional shelf badge. All intents participation-shaped, never performance-shaped. **Data:** `week[]`, `rhythmTarget`, `meetingProgress`, `wordsMet` deltas.

### L3 — Together-Hours & Cohort Beats (relatedness — Nuri's moat)
Per-nurturer "hours together" counter ("You and {Amina} have played for 25 hours"); cohort milestones fire for the whole group at guide-prescribed moments (MP7, end of 1A) with a prompt to celebrate at the next live meeting; nurturer one-line post-session notes (recast-style, warm, never corrective). **Data:** derivable from `bookings`/`activityLog` per nurturer; add `nurturerNotes[]`; cohort structure via `parties.ts`. No member-vs-member comparison, ever.

### L4 — Evening Re-Living ritual
On meeting days, one gentle evening prompt (time chosen by user — implementation intention) opens the day's recordings; a re-listen marks a leaf on a calendar sprig feeding L1's ring. One prompt/day max, dismissible forever. **Data:** `activityLog` entries of kind `"relive"` (add) + recordings storage (roadmap). Verbatim guide prescription ("re-live recordings every evening").

### L5 — Home-screen widget (rhythm ring + next meeting)
Environmental cue, zero nag. After L1 ships.

### L6 — `spokenWordIds[]` above-waterline iceberg layer
Self/nurturer-reported from 1B Ladder sessions. After 1B tooling matures.

---

## Celebration moments (canonical list — build no others without adding here)

| Moment | Trigger | Surface | Scale |
|---|---|---|---|
| Meeting completed | `meetingProgress` increment | N2 Session-End Harvest | Medium (3-beat recap) |
| Words met | `wordIds` delta > 0 | N2 beat 1 + iceberg count-up | Small |
| Shelf badge earned | `lange:award` event | Toast riding N2, or in-app toast | Small |
| Guide milestone (M7/M16/M40) | meeting completion matching id | N3 badge + one extra harvest line quoting the guide | Medium |
| **Checkpoint hit (gate leg completed)** | a `gateLegs*` leg reaching done | CheckpointCard row fills + one-line note | Small |
| **1A → 1B gate passed** | `gate1bPassed` flips true | Full-screen ceremony: "Time to speak your first words — gently." + `gate-1b` badge | LARGE |
| **1B → Phase 2 gate passed** | `phase1Complete` flips true | Full-screen ceremony: guide's literal "You're ready to start Phase 2! Congratulations! Celebrate!" + `gate-phase2` badge | LARGE |
| Immersion string flip | `lastImmersionScore` crossing a key threshold | one-line toast "🌍 Nuri now says 'Hoy' — a word you've met" (SPEC-immersion) | Tiny |
| Steady season (L1) | rhythmWeeks increment | ring glow + shelf on bests | Small |

## DO-NOT-BUILD (hard bans — owner mandate + GPA doctrine)

1. Any lottery/gambling mechanic: chests, spins, mystery boxes, random multipliers, gacha, raffles, streak wagers.
2. Soft currency + store (gems/coins buying boosts/freezes/repairs) — converts informational rewards into controlling ones.
3. Pay-to-skip / pay-to-advance — money never moves `meetingProgress` or opens a Phase Door.
4. Accuracy leaderboards, correctness rankings, ANY inter-user performance comparison.
5. Daily streaks that reset to zero, and their freeze economies.
6. Per-word mastery meters, strength bars, decaying skills, forced SRS recall drills.
7. Tests, quizzes, graded checkpoints, "type the answer" gates — comprehension is confirmed by participation (and, post-beta, nurturer judgment), never by app tests.
8. Timers/countdown pressure inside activities.
9. Shame-state UI: red/broken/sad-mascot states, "you're falling behind," negative push, publicized inactivity.
10. Hearts/lives/energy caps.
11. Immersion as a cliff (see SPEC-immersion — no wholesale flips, no early destructive-action flips).
12. Rewarding solo grinding over meetings — solo practice feeds iceberg + rhythm but never advances `meetingProgress` (already the shipped rule; keep).
13. XP or abstract points. If a number is displayed, it is hours, meetings, or words — real units only.

## Conflict resolutions applied
- Gamification report's M8 "nurturer-confirmed checklist" for the Phase-2 gate: **deferred post-beta**. During beta the AI nurturer counts meetings (owner ruling 2026-07-20) and the gate legs are fully automatic (SPEC-advancement-gates). Nurturer confirm returns as an enhancement when human nurturers are live.
- Guide-literal word thresholds (300/1000) in the gamification report's gate sketch: **rejected** — content-derived targets from `gates.ts` are authoritative (see SPEC-advancement-gates §0, fact 1).
- Duolingo-style daily streak: rejected in favor of L1 Weekly Rhythm (documented quit-on-break failure mode; weekly cadence fits a live-session product).

## i18n
All new user-facing strings enter `STRINGS` ×19 with `KEY_TIERS` assignments: harvest/celebration short labels tier 2–3 (they participate in graduated immersion), meeting-theme descriptions and ceremony body copy tier 4. Ceremony headline keys: `gateCeremony1b`, `gateCeremonyP2` (shared with SPEC-advancement-gates — define once).
