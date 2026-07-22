# Non-Lottery Gamification for Nuri — Research & System Design

Research date: 2026-07-21. Grounded in:
- `/Volumes/LaCie/GPA_Language_Learning/research/knowledge-base/phase1.md` (Iceberg Principle, play-not-study, 1A/1B milestones, quoted guide doctrine)
- `/Volumes/LaCie/GPA_Language_Learning/src/lib/achievements.ts` (existing "Growth Shelf")
- `/Volumes/LaCie/GPA_Language_Learning/src/lib/store.tsx` (meetingProgress, hoursLogged/minutesLogged, wordIds/wordsMet, week[], streak field, getImmersionStage, phase self-heal)
- `/Volumes/LaCie/GPA_Language_Learning/src/lib/i18n.ts` (KEY_TIERS 1–4, STRINGS, tiered immersion)
- 13 web searches + source fetches (URLs inline)

---

## 1. What actually drives Duolingo's retention — mechanic by mechanic

Duolingo's own growth team identified **Current User Retention Rate (CURR)** as the dominant lever — ~5x the DAU impact of the next-best metric. Everything below exists to move CURR. Four-year result: 4.5x DAU, CURR +21%, users with 7+ day streaks tripled to over half of DAU. ([Lenny's Newsletter — How Duolingo reignited user growth](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth))

### Streaks (the #1 mechanic)
- **Mechanism: loss aversion, not positive motivation.** A user with a 180-day streak isn't chasing 181; they're protecting 180. Losing feels ~2x as bad as gaining feels good (Kahneman & Tversky). ([Apptitude teardown](https://apptitude.io/blog/how-duolingos-streak-mechanic-actually-works/), [JustAnotherPM](https://www.justanotherpm.com/blog/the-psychology-behind-duolingos-streak-feature))
- **Evidence:** users reaching a 10-day streak show "substantially reduced" dropout ([Lenny's](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth)); 7-day-streak users cited as 3.6x more likely to stay engaged long term ([Deconstructor of Fun — Streaks](https://duolingo.deconstructoroffun.com/mechanics/streaks)); streak-wager variants boosted D7 retention ~14% ([Trophy case study](https://trophy.so/blog/duolingo-gamification-case-study)). Duolingo has run **600+ experiments on the streak feature alone** ([UX Magazine](https://uxmag.com/articles/the-psychology-of-hot-streak-game-design-how-to-keep-players-coming-back-every-day-without-shame)).
- **Streak freeze:** removes the catastrophic failure state without removing daily pressure; reported ~21% churn reduction for at-risk users ([Orizon](https://www.orizon.co/blog/duolingos-gamification-secrets)).
- **The dark side (why Nuri must not copy it):** when a long streak breaks, users tend to quit **all at once** — the habit was welded to the counter, not the learning. Documented streak anxiety, guilt, "mechanically maintaining a streak while learning nothing." ([Why People Quit Duolingo](https://my-senpai.com/insights/why-people-quit-duolingo.html), [Why I let go of my 480-day streak](https://saunved.medium.com/why-i-let-go-of-my-480-day-duolingo-streak-a2098b3eff35), [Dr. Rachel Taylor — streak addiction](https://drracheltaylor.substack.com/p/why-my-daughter-quit-duolingo-the))

### Leagues / leaderboards
- Biggest single engagement win in Duolingo history: learning time +17%, highly-engaged users (1h+/day, 5+ days/wk) **tripled** ([Lenny's](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth)); ~+25% lesson completion attributed to leagues ([Deconstructor of Fun — Leagues](https://duolingo.deconstructoroffun.com/mechanics/leagues)).
- Mechanism: weekly 30-person XP contest + **demotion threat** = loss aversion again, at the competition level.
- **The dark side:** qualitative research finds users "play just to maintain their position in the Leagues and not to learn," plus anxiety, pressure, frustration ([arXiv — When Gamification Spoils Your Learning](https://arxiv.org/pdf/2203.16175)). XP measures time-on-app, not comprehension — the canonical example of engagement metrics corrupting learning.

### Friend streaks, friend quests, social follows
- Friends Quest: two users co-complete a weekly goal for shared rewards — mutual accountability; neither wants to be the one who breaks it ([Duolingo blog](https://blog.duolingo.com/friends-quests/), [duoplanet](https://duoplanet.com/duolingo-friend-quest/)).
- **Learners who follow friends are 5.6x more likely to finish their course** ([Deconstructor of Fun](https://www.deconstructoroffun.com/blog/2025/4/14/duolingo-how-the-15b-app-uses-gaming-principles-to-supercharge-dau-growth)). This is Duolingo's weakest area (parasocial, thin) — and Nuri's strongest, because Nuri's core loop IS a live human relationship (nurturer + 2–6 GP cohort + pen-pal roadmap).

### Widget + notifications
- iOS streak widget: opted-in, always visible, changes state through the day; credited with commitment gains comparable to push notifications, without spam fatigue ([UX Magazine](https://uxmag.com/articles/the-psychology-of-hot-streak-game-design-how-to-keep-players-coming-back-every-day-without-shame), [duoplanet](https://duoplanet.com/duolingo-widget/)). Mechanism: environmental cue (habit research below), not persuasion.
- Push: "dozens of small wins," volume deliberately constrained to protect the channel ([Lenny's](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth)).

### Gems / chests / XP boosts
- A soft-currency economy (earn gems → buy streak freezes, timer boosts; chests on quest completion). This is the lottery-adjacent layer: variable-reward chests, currency sinks, pay-to-repair. It exists to monetize and to deepen the hook, not to teach. ([Duolingo Wiki — Quests](https://duolingo.fandom.com/wiki/Quests), [Trophy](https://trophy.so/blog/duolingo-gamification-case-study))

### Failed experiments worth remembering
- A Gardenscapes-style moves counter: **zero** retention effect. Uber-style referrals: +3% new users only ([Lenny's](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth)). Lesson: mechanics don't transfer by copy-paste; they work when they fit the product's real loop.

### The published critique, in one line
Gamification doesn't teach — it makes people show up; Duolingo's system optimizes showing up (CURR) even where it costs learning (leagues, streak-servicing). ([The Economy of Meaning](https://theeconomyofmeaning.com/2025/08/25/a-critical-look-at-how-to-make-learning-as-addictive-as-social-media-a-ted-talk-about-duolingo/), [Criticizing Duolingo — ResearchGate](https://www.researchgate.net/publication/350425952_CRITICIZING_DUOLINGO_AS_A_LEARNING_APP_PERSPECTIVES_OF_LEARNING_GAME_DESIGNER_AND_LANGUAGE_TEACHER), [Duolingo Stinks — Medium](https://medium.com/@zag102/duolingo-stinks-gamification-is-a-double-edged-sword-2223d19142c0))
**Nuri's edge: keep the showing-up machinery, point it at a method that actually teaches, and never let a metric become the thing being played.**

---

## 2. Motivation science for a REAL learning app

### Self-Determination Theory (autonomy · competence · relatedness)
Deci & Ryan: intrinsic motivation is sustained when three needs are met. Meta-analysis of gamified learning: gamification reliably improves intrinsic motivation and perceived autonomy/relatedness, with minimal effect on perceived competence — i.e., points don't make people feel skilled; real skill feedback does ([Springer meta-analysis](https://link.springer.com/article/10.1007/s11423-023-10337-7), [SDT & gamification](https://selfdeterminationtheory.org/wp-content/uploads/2020/10/2018_RutledgeWalshEtAl_Gamification.pdf)). Gamification overall has a positive learning-outcome effect (g ≈ 0.49, Sailer & Homner) — it works when it feeds the needs, not when it decorates ([Sailer & Homner meta-analysis](https://www.researchgate.net/publication/335189630_The_Gamification_of_Learning_a_Meta-analysis)).
- **Nuri mapping:** relatedness is Nuri's native superpower (nurturer relationship — the guide: "Your main accomplishment in Meeting 1 was to launch such a personal relationship with a host person"). Competence feedback must come from *real comprehension events* (words met, meetings completed), never scores. Autonomy = user-chosen weekly rhythm, GP-choice vocab sets (MP35), Plan-Your-Own-Meeting (MP36) — the method already contains autonomy beats.

### Overjustification effect (rewards can kill intrinsic joy)
Deci, Koestner & Ryan's 1999 meta-analysis (128 experiments): **expected, tangible, contingent rewards undermine intrinsic motivation**; verbal/informational feedback does not — it can enhance it ([Deci et al. 1999 PDF](https://depts.washington.edu/techdocs/papers/deciExtrinsicRewardsAndIntrinsicMotivation99.pdf), [Deci/Koestner/Ryan 2001](https://journals.sagepub.com/doi/10.3102/00346543071001001), [Wikipedia — Overjustification effect](https://en.wikipedia.org/wiki/Overjustification_effect)).
- **Design law for Nuri:** every reward must be **informational** ("this happened, and it's real") not **controlling** ("do X to get Y"). The existing Growth Shelf comment block already states this exactly: "never a debt to be serviced." Badges that mark real milestones = informational. Gems you spend = controlling. GPA sessions are intrinsically fun by design ("Have fun—laughing is good!") — the one thing gamification must not do is give people an external reason for something they already enjoy.

### Progress principle & small wins
Amabile & Kramer (12,000 diary entries): the single biggest driver of motivation and positive inner work life is **visible progress on meaningful work**, even tiny steps; minor events produce outsized emotional impact ([HBR — The Power of Small Wins](https://hbr.org/2011/05/the-power-of-small-wins)).
- **Nuri mapping:** the GPA word life-cycle and hour counts ARE progress; the app's job is to make invisible progress visible — especially in Phase 1A, when growers are silent and anxious that "I'm not learning anything!" (guide's prescribed reframe: "It's in your iceberg"). A visible iceberg is the progress principle applied verbatim to GPA's own metaphor.

### Endowed progress
Nunes & Drèze: a 10-stamp card with 2 pre-stamped beats an 8-stamp card from zero (34% vs 19% completion) — reframing a task as "already underway" nearly doubles follow-through ([SSRN](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=991962), [JCR](https://academic.oup.com/jcr/article-abstract/32/4/504/1787425)).
- **Nuri mapping:** onboarding progress bar starts >0%; the 40-meeting path shows pre-Meeting-1 steps (orientation, host-world name, group photos — real steps from the guide) as already ticked; a new grower's iceberg starts with a "first drop" from the placement conversation.

### Habit formation
- Automaticity takes a **median 66 days** (range 18–254), asymptotic curve; behaviors tied to **stable existing cues** automate fastest; enjoyment speeds it up (Lally et al.) ([ResearchGate](https://www.researchgate.net/publication/32898894_How_are_habits_formed_Modeling_habit_formation_in_the_real_world)).
- **Implementation intentions** ("When X, I will Y") — Gollwitzer & Sheeran meta-analysis, 94 studies, **d = 0.65** on goal attainment ([Gollwitzer PDF](https://cancercontrol.cancer.gov/sites/default/files/2020-06/goal_intent_attain.pdf), [Wikipedia](https://en.wikipedia.org/wiki/Implementation_intention)).
- **Nuri mapping:** a *scheduled live meeting with a human* is the strongest possible cue-and-commitment device — far stronger than any widget. The highest-leverage habit mechanic in the whole app is: **book the next meeting before leaving the current one**, phrased as an if-then plan ("Tuesdays at 7 with Amina"). Second: the evening re-living ritual (guide: re-live recordings "every evening") given a fixed cue ("after dinner on meeting days").

### Loss aversion, done ethically
Loss aversion is legitimate when what's at stake is **real** (a relationship, a booked meeting, a cohort waiting for you) and illegitimate when the stake is manufactured (a counter that dies at midnight). Accountability research: partner-paired learners complete at ~85%; cohort courses hit 85–96% completion vs 3–15% self-paced ([Ruzuku — Completion Gap](https://www.ruzuku.com/learn/articles/completion-gap), [Skillademia stats](https://www.skillademia.com/statistics/online-course-completion-statistics/), [EdSurge — 5% to 85%](https://www.edsurge.com/news/2019-06-06-moving-from-5-to-85-completion-rates-for-online-courses)). Nuri should let the *nurturer and cohort* be the loss-aversion mechanic ("Amina and your group meet Thursday") and never build an artificial one.

### GPA constraints (from phase1.md — binding)
- **Iceberg Principle:** "never force mastery; words sink and rise… It's in your iceberg." → No recall tests, no per-word mastery %, no "weak words" shaming (GPs *choose* their own weak words to replay — that's autonomy, not testing).
- **Play, not study:** nurturer is "playmate, not teacher"; "Don't try to master new words."
- **"The group is a team, not competitors"** (quoted GP attitude rule) → competitive correctness is anti-method by explicit doctrine.
- **Anxiety is the enemy:** early talking "can cause a surprising rise in anxiety… activities designed to 'break people in gently'"; recasting exists because direct correction "causes stress and embarrassment." Any anxiety-inducing mechanic corrupts the method.
- **Celebration is IN the method:** "Grand Refreshing – Hurrah for 150 words!" (M7); "You're ready to start Phase 2! Congratulations! Celebrate!" (M40). Milestone ceremonies aren't a gamification add-on; the guide prescribes them.
- **Rewardable currencies per GPA:** hours of participation, meetings completed in order, words *met* (encountered, not mastered), recordings made & re-lived, relationship firsts, phase milestones. Never: accuracy, speed, recall, rank.

---

## 3. The Nuri system: "The Growing Season" — GPA-compatible gamification

Design laws derived above: (1) rewards are informational, never controlling; (2) the unit of commitment is the *meeting with a human*, not the calendar day; (3) progress visualizes what GPA says is really happening (iceberg, hours, relationship); (4) nothing decays, nags, resets, or ranks; (5) celebrate what the guide itself celebrates.

Existing data plumbing (all in `store.tsx` / `types.ts` unless noted): `meetingProgress` (sequential live-meeting spine, AI-counted in beta), `hoursLogged`/`minutesLogged`, `wordsMet` + `wordIds[]`, `completed[]`, `activityLog[]`, `achievements{}` (EarnedMap, `achievements.ts` Growth Shelf + `lange:award` event bridge), `week[7]` + `weekStartedAt` (Mon-anchored weekly minutes), `bookings[]`, an **unused `streak: 0` field** (repurpose → `rhythm`, below), `getImmersionStage()` + `KEY_TIERS` (i18n.ts), phase self-heal + `meetingForHours`.

### M1 — The Iceberg (flagship progress surface)
- **Loop:** every session/practice logs newly met words (`wordIds`) → the grower's iceberg visibly grows *below the waterline*; when 1B talking begins, words the grower has spoken surface *above* the waterline. Tap it → drift through your words as floating cards (no quiz — just reminiscence).
- **Why it works:** progress principle (invisible progress made visible at the exact moment GPA predicts anxiety — silent 1A); competence feedback that is informational, not evaluative.
- **Why it doesn't corrupt GPA:** it is literally the guide's own metaphor and refrain rendered as UI. Counts *encounters only*. Words are never marked wrong, never decay, never get tested. The 1A anxiety reframe ("You are learning exactly what you are supposed to be learning") becomes visual truth.
- **Surfaces:** dashboard hero; session-end recap ("+14 words slid into your iceberg"); phase pages.
- **Data:** `wordIds`, `wordsMet` (exists). Add optional `spokenWordIds[]` in 1B (self/nurturer-reported, e.g. from Ladder of Success sessions) for the above-waterline layer.

### M2 — The Meeting Path (the spine — Duolingo's path, but real)
- **Loop:** the 40 Meeting Plans of Phase 1 (then Phase 2's sequence) rendered as a single mobile-first trail. Completing a live meeting (meetingProgress++) advances the marker. Themed stops show what's coming ("Meeting 8: foods, give/take, numbers via candies"). Milestone gates at M7, M15/16, M40 (see M8). Pre-M1 nodes (orientation, host-world name, group photo) render already-completed → **endowed progress** on day one.
- **Why it works:** goal-gradient + endowed progress (Nunes & Drèze); clear next-step reduces decision cost; Duolingo's path is its core UX for a reason.
- **Why it doesn't corrupt GPA:** the guide *mandates* strict meeting order ("each builds on the ones before") — sequence-gating is the method, not a dark pattern. Nodes complete by attendance/participation, never by test.
- **Surfaces:** dashboard (current node + next), /courses, session-end ("Meeting 12 complete — 3 to go until First Talking").
- **Data:** `meetingProgress` (exists), `phases.ts` meeting metadata (needs per-meeting theme list — phase1.md §5 has the full map to import).

### M3 — Weekly Rhythm (the anti-streak)
- **Loop:** grower picks a rhythm (e.g., "2 meetings + 3 re-living evenings per week" — guide pacing is ~2 plans/day for intensives, but self-chosen). A gentle ring fills across the week (`week[]` already tracks daily minutes). Hitting the rhythm N weeks running shows a "steady season" indicator. **Missing a week never zeroes anything** — copy says "seasons have quiet weeks"; the ring just starts fresh, and the shelf keeps the best season on record.
- **Why it works:** all the habit-scaffolding value of a streak (Lally: stable weekly cues; visible consistency) with the failure state removed — which is exactly the state that makes Duolingo users quit outright when it breaks. Weekly granularity fits a live-session product (nobody meets a nurturer 7 days/week).
- **Why it doesn't corrupt GPA:** measures showing up (participation hours), the one thing GPA says compounds; no guilt, no debt, no freeze economy to buy.
- **Surfaces:** dashboard ring; optional home-screen widget later (widget = cue, proven high-leverage, zero nag).
- **Data:** `week[]`, `weekStartedAt` (exist); repurpose the dormant `streak` field as `rhythmWeeks`; add `rhythmTarget` (user-set → autonomy).

### M4 — Book-the-Next-Meeting (implementation intention, highest-leverage single mechanic)
- **Loop:** the session-end screen's primary CTA is always "Next: Meeting {n+1} — keep your Tuesday 7pm with {nurturer}?" One tap rebooks. The commitment is phrased as if-then ("Tuesdays, after dinner, with Amina").
- **Why it works:** implementation intentions d=0.65; accountability-partner completion ~85%; converts loss aversion into a *real* social stake (a person expecting you) instead of a counter.
- **Why it doesn't corrupt GPA:** it IS the method — the program only exists as a sequence of nurturer meetings.
- **Surfaces:** session-end (primary), dashboard "next meeting" card, booking flow.
- **Data:** `bookings[]` (exists), nurturer availability.

### M5 — Session-End Harvest (celebration loop)
- **Loop:** immediately after a meeting is logged: 3-beat recap — (1) iceberg splash animation with today's word count, (2) hours ring tick + any Growth Shelf badge landing (toast via existing `ACHIEVEMENT_EVENT`), (3) next-meeting teaser + one-tap rebook (M4). Mascot (mascots.ts exists) reacts with warmth, never disappointment.
- **Why it works:** Amabile: celebrating small wins right after meaningful effort is the strongest mood/motivation lever; ending on a peak (peak-end rule) colors memory of the whole session.
- **Why it doesn't corrupt GPA:** celebrates participation facts only; the guide ends Phase 1 with the literal instruction "Celebrate!"
- **Surfaces:** post-session; also post-practice (smaller).
- **Data:** `activityLog`, `wordIds` delta, `achievements` (all exist).

### M6 — Growth Shelf (exists — keep, extend)
- Keep `achievements.ts` exactly as philosophically framed ("pressed flowers… never a debt"). Extend with: **meeting milestones** ("Meeting 7 — Hurrah for 150 words," "Meeting 16 — First words spoken," "Meeting 40 — 100 hours"), **relationship firsts** (first re-lived recording, first marketplace bargain, first pen-pal letter when that ships, first time understanding the nurturer's joke — `first-joke` already exists and is self-reported, the perfect pattern), and **season badges** (best rhythm season). All informational, dated, permanent.
- **Data:** `achievements{}`, `meetingProgress`, `lange:award` bridge (all exist).

### M7 — Together-Hours & Cohort Beats (relatedness — Nuri's moat)
- **Loop:** per-nurturer "hours together" counter and shared milestones ("You and Amina have played for 25 hours"); cohort milestones fire for the whole group at guide-prescribed moments (M7 Grand Refreshing, M15 end of 1A) with a prompt to actually celebrate at the next live meeting; nurturer can send a one-line post-session note ("You caught every command in Listen & Do today") — recast-style, warm, never corrective.
- **Why it works:** relatedness is the strongest SDT need Nuri can serve; friend-follows drive 5.6x course completion at Duolingo with far weaker social ties; cohort visibility drives 85–96% completion in cohort courses.
- **Why it doesn't corrupt GPA:** the relationship IS the stated goal of Phase 1; group framed as team, never ranked — no comparison of members, ever.
- **Surfaces:** dashboard relationship card, session-end, nurturer app side.
- **Data:** `bookings`/`activityLog` per nurturer (derivable); add `nurturerNotes[]`; cohort/party structure (`parties.ts` exists).

### M8 — Phase Doors: advancement gates (1A→1B, 1B→Phase 2)
Gates hang on `meetingProgress` (the just-shipped spine) plus participation facts. They gate *content unlock + ceremony*, never issue tests. Requirements per the guide:
- **1A → 1B ("First Talking" door):** meetingProgress ≥ 15 · hoursLogged ≥ ~30 (guide: 30–40h) · wordsMet ≥ ~300 (guide's talking threshold) · has saved ≥1 recording (re-living loop begun) · next meeting booked. Door ceremony: "300 words are in your iceberg. Time to speak your first ones — gently." (guide: 1B "breaks people in gently").
- **1B → Phase 2 ("Congratulations! Celebrate!" door):** meetingProgress ≥ 40 · hoursLogged ≥ ~100 · wordsMet ≥ ~1000 (guide: 1,000–1,200 heard, ~300 spoken) · a *nurturer-confirmed* checklist (not an app test): can bargain in the marketplace role-play, retell a strip story, describe a busy picture, ask/answer name-age-day-time. Confirmation is one tap by the nurturer after a live meeting — human judgment, exactly as the guide assigns it (nurturer judges "close enough").
- Shortfall handling: if hours/words lag meetingProgress, the door shows "a few more play sessions first" — framed as more play, never as failure. AI meeting-counting stays authoritative during beta; nurturer confirm becomes authoritative later.
- **Data:** all fields exist except `nurturerConfirmations{}` (add).

### M9 — Truly gradual immersion (the invisible reward)
Current: `getImmersionStage` returns 0–4 stepped by phase; KEY_TIERS flips whole tiers at once. Make it continuous so the UI drifts into the target language meeting-by-meeting and "they haven't even realized it":
- Compute a fractional immersion score: `s = (phase - 1) + meetingProgress/meetingsInPhase` (0 → 4+, clamped; keep manual toggle override).
- Within each tier, flip **individual keys** progressively: each key gets a deterministic threshold `tier - 1 + h(key)/H` (stable hash order, curated so highest-frequency/most-guessable strings flip first — greetings before settings labels). A key renders in the target language when `s ≥ threshold` — so every meeting or two, one or two more strings quietly flip. No step-jumps, ~dozens of micro-transitions per phase across the 19-language STRINGS table.
- Optional delight (informational, opt-in discovery): tapping a flipped string shows the native gloss in a whisper-tooltip — power-tool "What does ___ mean?" built into the chrome, and a quiet competence signal: *you just read that without help*.
- Never flip destructive/confirmation actions early (safety list per KEY_TIERS tier 4).
- **Why GPA-safe:** it recreates the wall-of-noise → window arc inside the app itself; comprehension is ambient, never tested.
- **Data:** `phase`, `meetingProgress`, KEY_TIERS (exists) + per-key hash order; no new persistence.

### M10 — Evening Re-Living loop (the "homework" habit, gamified as ritual)
- **Loop:** on meeting days, a single gentle evening prompt (time chosen by the user at onboarding — implementation intention: "after dinner") opens the day's recordings; completing a re-listen marks the day's leaf on a small calendar-sprig; sprigs feed the weekly rhythm (M3) and the 66-day habit curve does the rest.
- **Why it works:** stable cue + existing routine anchor (Lally); the recordings are intrinsically pleasant (your own session, your nurturer's voice) so no external reward is needed — prompt is a reminder, not a nag; one per day max, dismissible forever (protect the channel, per Duolingo's own notification doctrine).
- **Why it doesn't corrupt GPA:** re-living recordings every evening is verbatim guide prescription; physical response ("actually get up and run") is prompted in copy, not tracked.
- **Data:** `activityLog` (exists), add `relivedDates[]` or log entries of kind "relive"; recordings storage (already on roadmap via first-recording badge).

### M11 — "This Week's Play" (quests, defanged)
- **Loop:** up to three weekly intents auto-suggested from the grower's rhythm and path position ("attend 2 meetings," "re-live 3 evenings," "meet 25 new words"), each *editable or dismissible* (autonomy). Completing them fills the rhythm ring; no currency, no chest — the reward is the visible week and an occasional shelf badge.
- **Why it works:** goal-setting + fresh-start framing each Monday (week[] is already Monday-anchored); Duolingo quests work, minus the gem economy that makes them controlling.
- **Why GPA-safe:** all intents are participation-shaped; none are performance-shaped.
- **Data:** `week[]`, `rhythmTarget`, `meetingProgress`, `wordsMet` deltas (all exist or added above).

### Mainstream mechanic → GPA-compatible variant (summary table)

| Mainstream (Duolingo) | GPA violation | Nuri variant |
|---|---|---|
| Daily streak w/ reset | manufactured loss-anxiety; quit-on-break | Weekly Rhythm, never resets (M3) |
| Streak freeze economy | monetized anxiety | nothing to freeze — no failure state |
| XP | rewards time-on-app, not growth | hours + words-met (real currencies) |
| Leagues/demotion | competitive correctness; "team, not competitors" | cohort shared milestones (M7) |
| Gems/chests | controlling extrinsic reward; lottery | Growth Shelf informational badges (M6) |
| Skill-tree crowns w/ mastery levels | forced mastery = anti-iceberg | Meeting Path by attendance (M2) |
| Accuracy %, hearts/lives | correctness anxiety; punishes misses | misses invisible — "it's in your iceberg" (M1) |
| Guilt notifications ("Duo is sad") | shame lever | one opt-in evening ritual prompt (M10) |
| Friend streaks | fine in spirit | Together-Hours with a real human (M7) |
| Placement tests / checkpoints | testing culture | nurturer-confirmed door checklist (M8) |

---

## 4. Do-NOT-build list (hard bans)

1. **Any lottery/gambling mechanic** — chests, spins, mystery boxes, random reward multipliers, gacha, raffles, "streak wagers." (Owner ban + variable-ratio reinforcement is the addiction mechanic, not the learning one.)
2. **Soft currency + store** (gems/coins that buy boosts, freezes, repairs) — converts informational rewards into controlling ones (overjustification) and creates pay-to-not-feel-bad.
3. **Pay-to-skip / pay-to-advance** — advancement is meetings + hours + words met; money must never move `meetingProgress` or open a Phase Door.
4. **Accuracy leaderboards, correctness rankings, or ANY inter-user comparison of performance** — guide: "the group is a team, not competitors"; leagues research shows users stop caring about learning.
5. **Daily streaks that reset to zero** (and their freeze economies) — documented anxiety, guilt, quit-on-break.
6. **Per-word mastery meters, strength bars, decaying skills, forced SRS recall drills** — "Don't try to master new words"; words sink and rise; decay UI = manufactured guilt.
7. **Tests, quizzes, graded checkpoints, "type the answer" gates** — testing culture is anti-method; comprehension is confirmed by participation and nurturer judgment only.
8. **Timers/countdown pressure inside activities** — speed pressure creates the anxiety recasting exists to avoid. (The Ladder game's pacing is the *nurturer's* job, live.)
9. **Shame-state UI** — red/broken/crying-mascot states, "you're falling behind," negative push notifications, publicized inactivity to the cohort.
10. **Hearts/lives/energy caps** that punish mistakes or ration play — misses are fine; play is never rationed.
11. **Immersion as a cliff** — never flip large UI regions at once, never flip destructive-action strings early, never make immersion feel like a test of whether you can still operate the app.
12. **Rewarding solo grinding over meetings** — points for endless self-practice would optimize against the live-session spine; solo practice feeds the iceberg and rhythm but never advances `meetingProgress` (already the shipped rule — keep it).

---

## Implementation priority (suggested)
1. **M4 + M5** (book-next + session-end harvest) — cheapest, highest-leverage, rides the just-shipped meetingProgress.
2. **M1 Iceberg** dashboard hero + **M2 Meeting Path** (import per-meeting themes from phase1.md §5).
3. **M8 Phase Doors** (needed for Phase 2 build-out anyway — the gate definitions above are the spec).
4. **M9 continuous immersion** (small change to `getImmersionStage` + per-key thresholds in `i18n.ts`).
5. **M3 Rhythm + M11 weekly intents** (uses existing `week[]`), then **M7 / M10** as the nurturer-side and recordings features mature.
