# Phase 1 Completion Plan — Merged Punch List

Nuri (lange-gpa), project root `/Volumes/LaCie/GPA_Language_Learning`. Compiled 2026-07-18 by merging:
- `phase1-content-gaps.md` (curriculum/content fidelity vs. the Thomson GPA guide)
- `phase1-technical-gaps.md` (engineering gaps in the live codebase)

**Method:** every item that appeared in both source reports from a different angle (e.g. "the 40-Meeting-Plan spine doesn't exist" as a curriculum claim vs. "the deck dealer has dead zones in 23/40 meetings" as a code claim) has been merged into one entry so the reader isn't asked to fix the same problem twice under two names. Each entry keeps: **what**, **why** (one line), **effort** (S/M/L), and **type** (content / engineering / both). Original item IDs from both source reports are cited in brackets so you can trace back to full detail.

Within each tier, items are ordered **S → M → L** so quick wins surface first.

---

## Must-have (Phase 1 is not authentically GPA without these)

### S — quick wins

**M1. Surface vocabulary checkpoints (150 / 300 / 1,000–1,200 words)** — S — content, light engineering
The guide's staged numbers ("Grand Refreshing – Hurrah for 150 words!" at M7, 300+ as the M15 talking threshold, 1,000–1,200 at phase end) are load-bearing motivational/structural beats. The app only states the end goal, with no intermediate checkpoint UI and no code that detects crossing 150/300.
*[Content A6]*

**M2. Question-words game + vocab domain** (who/what/where/what-kind-of/how-many/why-because/whose/to-whom) — S — content + engineering
Named, dedicated MP24 activity and grammar the guide flags as essential to "here-and-now" communication. Zero app representation today — cheapest MUST-tier gap to close.
*[Content B4]*

### M — core builds

**M3. Grand Refreshing cumulative review activity** (MP7/14/15/36) — M — content + engineering
The guide's actual mechanism for hitting the 150- and 300-word checkpoints (M1 above has no game to attach to without this): whole "Bag of Stuff" laid out, combined commands spanning all vocabulary learned so far, cue-card stack checked for gaps.
*[Content B1]*

**M4. Physical States and Needs, 3-step** (MP19–21) — M — content + engineering
"I'm hungry" → "Take the egg" → "You are hungry" → "Give me the egg" → full and/or combinations. One of the 4–5 pillar 1B talking activities (alongside Ladder, Info-Gap, Marketplace) and the only one of that set with zero app representation.
*[Content B5]*

**M5. Possessives / possessive-pronoun practice** — M — content + engineering
Woven through M5–6, M9–10, M17, M21. The guide explicitly warns that skipping this "cripples Phase 2." No dedicated activity or grammar drill exists; only the raw vocabulary domains do.
*[Content B6]*

**M6. Time/calendar/clock/seasons suite + Day-and-Time opener** (MP30–31) — M — content + engineering
Days, months, yesterday/today/tomorrow, weather, progressive time-telling, and the prescribed "What day is today? What time is it?" ritual that opens every meeting from MP31 on. No vocab domain, no activity, no opener.
*[Content B7 + A4]*

**M7. MP38–40 capstone trio: negation, relative clauses, Making Statements** (+ Synonyms/General Words) — M — content + engineering
Negation-Listening/Talking + "Don't you dare!", relative clauses ("Show me a man who is walking"), and cue-card-driven Making Statements — the guide's explicit capstone of the 40-MP arc. The app currently has no MP36-40-equivalent content, so Phase 1 has no defined "ending."
*[Content B8 + B18]*

**M8. Numbers suite beyond ten** (ordinals, tens/money, Number Bingo) + card art — M — content + engineering
`vocab.ts`'s numbers domain stops at "ten." The guide runs ordinals (MP13), tens via money (MP12), 20–100–200–1000–million with real/prop money (MP31), and Number Bingo. Core content, not an edge case — the app's own Marketplace role-play activity already depends on money vocabulary that doesn't exist yet.
*[Content B3 + D5]*

**M9. Ladder of Success — fix the real mechanics** — M — content + engineering
`p1-ladder` is live but mechanically wrong, not just thin: missing the 4-rung table with string markers, the expansion-required-to-advance mechanic ("Dog" → "Brown dog" → full sentence), the pronunciation gate (3 failed attempts = word set aside), escalating rounds, and a time limit. The app's "the nurturer never corrects" line also conflates recasting (grammar) with the pronunciation judgment this specific game actually uses.
*[Content C1]*

**M10. Sixteen Pictures — fix the game shape + build duplicate scene art** — M — content + engineering
`p1-infogap` is described as "one describes, one finds" — the real game is two players holding matching 4×4 grids of 16 pictures in *different orders*, separated by a barrier, converging through iterative Q&A. Fixing the mechanic requires the asset that doesn't exist yet: two identical 16-scene sets in different arrangements.
*[Content C2 + D3]*

**M11. Cue-card system + word-history tracking** — M/L — content + engineering
Three merged problems that are really one feature: (a) the guide's physical cue-card system (home substitute for re-living, nurturer's coverage-reminder, random-draw sentence generator that underlies Grand Refreshing/M3 and Making Statements/M7) doesn't exist; (b) nothing assigns sequential cross-phase numbers the way the guide's Picture Dictionary does, nor produces its "two printed copies" concept; (c) on the engineering side, `profile.wordIds` — the exact "which words has this person met" data this needs — is captured by only one practice screen and is **never populated by the live session room at all** (`session/page.tsx` logs a numeric point count instead of the 12 card ids actually introduced), and no screen anywhere surfaces it. Building the cue-card feature on top of the current data layer would be built on an undercounted dataset until the logging bug is fixed first.
*[Content B2 + D7; Technical #6]*

### L — foundational / large builds

**M12. Wire the placement engine into onboarding** — L — engineering
`src/lib/placement.ts` is a fully-built, 232-line comprehension placement engine (two gates, 85% pass bar, TPR chains, domain-matched distractors) with **zero importers anywhere in `src/`**. `blankProfile()` hardcodes `phase: 1` for every new profile unconditionally, so an experienced speaker who already knows 2,000+ words is forced through the same 12-card Dirty Dozen as a total beginner — the exact scenario the engine exists to prevent. All the hard logic already exists; effort is L only because of the onboarding UI flow (two gate screens + result screen) needed to expose it that doesn't exist yet.
*[Technical #1]*

**M13. Build the real 40-Meeting-Plan spine** — L — content + engineering
The single biggest fidelity gap in the app, independently flagged as root-cause by both source reports. Three fused problems:
- **Content:** the guide is 40 sequenced, themed Meeting Plans, "designed to be completed in order as each builds on the ones before." The app has only two undifferentiated `parts` (1A/1B) with no per-meeting themes.
- **Engineering (dealer):** `meetingForHours()` is a flat `hours/2` proxy, and only **17 of the 40 meeting numbers have any fresh vocabulary assigned at all** — the other 23 (including everything past hour ~72) serve a 100%-review deck with zero new words, contradicting the app's own "≈12 new cards per session" doc comment.
- **Engineering (planner/timer):** the Nurturer Studio's Session Planner ignores `hoursLogged` and 1A/1B staging entirely — it can hand a brand-new grower a plan that opens with Power Phrases or Marketplace Role-Play, activities the app itself locks everywhere else behind 40 comprehension hours. The Meeting Timer is hard-coded to a fixed 30-minute shape and the Planner caps at 60 minutes, vs. real 2–3 hour, 4–8-game meetings. And "meeting N" is purely a `hoursLogged` proxy with no persisted "this meeting was actually attended" flag, so solo practice-game grinding can fast-forward the entire 40-meeting arc with no live nurturer-led meeting ever happening.
A partial **M-effort stopgap** exists on the engineering side alone: remap `meetingForHours` to the meeting numbers actually populated (rather than a flat hours proxy) and gate the planner by part/hours — this buys real sequencing without new curriculum authoring, but full fidelity still requires assigning themed content across all 40 MPs.
*Positive finding worth preserving:* `sessionFlow.ts`'s `buildDeck()`/`buildMeetingDeck()` engine already implements genuine Rough-and-Ready-Dozen mechanics (start-with-two, add-one-at-a-time, periodic full-review sweep) — real fidelity that isn't visible from `phases.ts` alone and shouldn't be thrown away while fixing the above.
*[Content A1; Technical #2, #3, #9 (partial), #14]*

**M14. Lexicarry bubble-strip artwork (57 functions)** — L — content (asset) — **BLOCKED, see below**
`p1-lexicarry`/Cartoon Bubbles is a description with no actual content behind it: zero original bubble-strip art exists, and the source material (homemade 37-frame packet + commercial Lexicarry book's 57 functions) is copyrighted and can't ship. See "Blocked" section below for the decision this needs.
*[Content D1]*

---

## Should-have (materially improves fidelity)

### S — quick wins

**S1. Power Phrases — fix mislabeling** — S — content
Three fixes: drop the invented "eight survival questions" claim (guide never gives a fixed count), move it from 1B/speaking to 1A/listening (introduced MP11-12, two-way use starts MP19), and add the missing MP38 Phase-2-prep expansion set (4 more tools).
*[Content C3]*

**S2. Talking Picture Dictionary — remove invented claim** — S — content
"One recording style omits the answer for physical self-review" isn't in the source guide. The real dual-recording system (per-game 1-min random samples vs. the naming dictionary recording) is different from what's described; the app only implements one of the two and mislabels it.
*[Content C4]*

**S3. Struggler protocol** — S — content + engineering
Canonical rule applied across many games: when a GP struggles, narrow to just the two items they're stuck on and rebuild from there. `sessionFlow.ts` already has the base RRD engine to hang this off of; it just has no per-learner struggle-detection branch yet.
*[Content C10]*

**S4. New-words-per-hour pacing indicator** — S — engineering
The app already tracks everything needed (`wordsMet`, `hoursLogged`) to compute a live words/hour figure — "Ten new words an hour" is guide-canonical language — but no screen (Nurturer Studio, session end-screen) ever surfaces it as a computed, monitored number.
*[Technical #8]*

**S5. Nurturer certification — add a phase dimension** — S — engineering
Certification is a single global pass/fail gated only on the 6 Phase-1 golden rules. Nothing stops a nurturer who has only passed the Phase-1 quiz from being handed a Phase-4 Session Planner plan.
*[Technical #10]*

**S6. Emotion faces — fill 8 of 25** — S — content (asset)
The graphics packet has 25 numbered emotion/state faces (MP11 Game 2); the app has 8. Low effort relative to impact since the art-generation pipeline (`generate-card-images.mjs`) already exists — this is a pure backlog-clearing task, not new infra.
*[Content D2]*

**S7. Orientation event + Name Game** — S/M — content + engineering
Pre-M1 social event, orientation meeting, group photos for "Photos of Us in Action," and the Name Game that gives every GP a personal host-world name the nurturer uses thereafter. None of this exists as an onboarding flow.
*[Content A3]*

### M — core builds

**S8. Nurturer CUES — translate to remaining 6/10 full-content languages** — M — content (translation) + engineering (wiring)
`CUES` covers only ru/en/ht/ja; `FULL_CONTENT_LANGS` lists 10. For es/fr/de/pt/it/zh — 6 of the 10 languages the app claims full support for — the AI nurturer never speaks "Listen."/"One more time."/"Well done." and the human nurturer's cue box silently drops framing text, thinning the "say it twice" golden rule for the majority of claimed-supported languages. Small, well-defined translation task, same shape as the existing 4.
*[Technical #4]*

**S9. Coach role** — M — content + engineering (data model + UI)
Third canonical player role (also a GP, silent during listening games, host-language-only encouragement, explicitly "a great way to train a new nurturer") has zero representation anywhere in the codebase — no field, no UI, no session-room presence.
*[Content A2; Technical #7]*

**S10. Sound-discrimination suite expansion** — M — content + engineering
`p1-sounds` covers only "Hear the Difference?" Missing: Sorting Sounds into Columns, Spot That Sound, conditional ears-first Word Dictation (MP24-32, phonemic scripts only — the *only* writing in Phase 1), and the rule that minimal-pair words must already be known before use.
*[Content B13]*

**S11. World-map/countries/nationalities suite + art** — M — content + engineering — **art portion BLOCKED, see below**
Countries in sets of 12, continents, nationalities, five question forms (who lives in/speaks/is learning/wants to go/is from). No vocab domain, activity, or map asset exists.
*[Content B9 + D6]*

**S12. Town places + Town/Landscape scene suite** — M/L — content + engineering — **scene art BLOCKED, see below**
~20-40 town-place words and ~20 outdoor/geographical words feeding the Town Scene and Landscape Scene description/info-gap games. No vocab domain or scene asset exists.
*[Content B10 + D4]*

**S13. If/then, before/after/while sequenced commands + can/can't-because** — M — content + engineering
Conditional/sequencing structures via LISTEN & DO chains (MP25, MP35) and modal "can/can't + because" (MP31). No multi-clause command structure exists in the app at all today.
*[Content B11]*

**S14. Cartoon Bubbles/Lexicarry — restore mechanic depth** — M — content + engineering
Beyond the missing art (M14/blocked): the puppet-act-out step before questioning, the translation exception (the one place in Phase 1 where approximate translation is allowed), and the make-your-own-strips loop from real lifestyle situations are all unimplemented independent of the art gap.
*[Content C5]*

**S15. Story retelling of Lexicarry/bubble strips (MP34-35)** — M — content + engineering
Late-1B evolution: nurturer narrates strips as short stories → GPs collaboratively retell and act them out. Entirely unrepresented; depends partly on M14/blocked art for full realization but the retelling/role-play mechanic is separable.
*[Content B14]*

**S16. Photos of Us in Action — real photo capture** — M — engineering
The activity exists as described mechanics in `phases.ts`, but the actual product feature — capturing real photos of the learner's own group performing actions, which the game "In which photo am I walking?" is built on — doesn't appear to exist; current implementation implies static pre-made content.
*[Content D9]*

### L — large builds

**S17. Audio recording pipeline — language coverage + missing recording types** — L — content (production) + engineering (pipeline)
Two merged gaps: (a) human-recorded dictionary audio exists for only 3 of 10 full-content languages (en/ja/ru); the other 7 run on browser TTS for every card, cue, and phrase. (b) Independent of language coverage, the guide's *other* recording type — a ~1-minute random-order sample taken at the end of every game (what evening "re-living" is actually built on), plus scene-description and video recordings — doesn't exist in any language; only the dictionary-style recording is implemented.
*[Technical #5; Content D8]*

**S18. Form-focused/structured-input grammar games** — L — content + engineering — **flagged as a scope decision, see below**
Language-specific games engineered to force attention to grammatical form (pronoun-drop descriptions, case-marking via verb omission, singular/plural rows) are inherently per-host-language in the source guide ("designed with a linguistic consultant where possible"). A generic 19-language app can only approximate a template, not port these 1:1.
*[Content B16]*

---

## Nice-to-have (polish)

### S

**N1. Delete or repurpose `buildDeck()` dead code** — S — engineering
Zero importers anywhere in `src/`; the session room exclusively uses `buildMeetingDeck()`.
*[Technical #12]*

**N2. Fix stale backend docs** — S — engineering
`docs/SETUP-BACKEND.md` claims tables (`bookings`, `sessionEvents`) that don't exist in `convex/schema.ts`. Will mislead whoever picks up two-device-sync work next.
*[Technical #13]*

**N3. Tighten `Phase1BGuard` loading-state fallthrough** — S — engineering
Brief cosmetic flash where 1B speaking/repeat content is reachable before profile hydration resolves for a fresh Phase-1A grower.
*[Technical #11]*

**N4. Fix top-level Phase 1 description contradiction** — S — content
"You don't speak yet: you point, act, arrange and laugh" is true only of 1A (first 30-40 of 100 hours); 1B (60-70% of the phase) is explicitly about constrained talking.
*[Content C6]*

**N5. Align hour figures / minute estimates to the guide** — S — content
App states 1B = "~60h"; guide gives "50 to 60 hours" in one place and "50 to 80 hours" in another. Per-activity minute estimates appear to be app inventions not sourced from the guide.
*[Content C7]*

**N6. Remove fabricated milestone quote** — S — content
"Host people feel you have 'a special connection to us'" doesn't appear in the source guide and overstates Phase 1's actual social-integration claim.
*[Content C8]*

**N7. Fix `vocabTarget` string** — S — content
"~1,000 words understood by ear" hides that the real target is 1,000-1,200 AND that ~300 must also be *spoken* by phase end — the current string implies pure listening is the entire finish line.
*[Content C9]*

**N8. Plan-Your-Own-Meeting (MP36) form** — S — content + engineering
Printed planning form GPs fill out mid-course. Low fidelity cost to omit; easy to add as a reflective/planning screen.
*[Content A5]*

**N9. Gap-filling / growing-participation journal** — S — content + engineering
Minor homework/self-tracking rituals (vocabulary gaps, sound-discrimination problems, real-world situations feeding new strips). Low curriculum weight; mostly a journaling feature.
*[Content B17]*

**N10. Actions Charades (MP29)** — S — content + engineering
Team-based cue-card acting/naming game with a scoring twist. Self-contained, cheap to add.
*[Content B12]*

**N11. Resolve courses-lock vs. practice-hub inconsistency** — S — engineering (product decision)
Course pages hard-lock everything outside Phase 1 with a "Method preview" tag; `/practice/*` games remain fully reachable for any phase via direct URL. Likely intentional (phase-agnostic "maintenance" drills) but worth a stated decision either way.
*[Technical #15]*

### M

**N12. Drawing-dictation info-gap** ("One Draws, Others Listen and Copy" + "Fix That Drawing!", MP27) — M — content + engineering
Whiteboard drawing-from-description game with a verbal-correction round; a distinct game type from the existing Sixteen Pictures info-gap.
*[Content B15]*

---

## Blocked — needs a decision

These items can't simply be assigned to a sprint; each needs a product/budget decision before engineering or content work can start.

**B-1. Lexicarry bubble-strip artwork (57 functions, ~40-60 three-frame strips)** — feeds M14 (Must-have)
Neither the homemade 37-frame packet nor the commercial Lexicarry book's art can ship in a commercial app — both are copyrighted source material, not owned assets. This is the single biggest asset gap in Phase 1; without it, Cartoon Bubbles has no actual content behind its description.
**Decision needed:** budget/timeline for commissioning original illustration (or a carefully-scoped AI-generation pipeline that produces genuinely original, non-derivative art) covering the full function set, or explicitly scope down Phase 1's launch to a smaller function subset.

**B-2. Town Scene & Landscape/Countryside Scene composite art** — feeds S12 (Should-have)
Same copyright constraint. The guide's Town Scene is explicitly meant to be "redrawn/localized" (post-Soviet Central Asia in the source); it and the Landscape Scene are large composite illustrations beyond the current per-item sticker art pipeline's complexity.
**Decision needed:** localization target for the redraw, and budget for composite-scene-complexity original art (not just per-card stickers).

**B-3. Map/countries/nationalities art** — feeds S11 (Should-have)
Same copyright constraint — needs an original map/flag-style art set, not digitized source material.
**Decision needed:** same as B-1/B-2 — commission vs. scope down.

**B-4. Form-focused/structured-input grammar games** — S18 (Should-have)
Not a copyright issue but an architecture/scope one: the guide's own games in this category were built "with a linguistic consultant, where possible," per host language. A generic 19-language app can only approximate a template, not port these 1:1.
**Decision needed:** invest in per-language grammar-game templates (large, ongoing content-ops cost) vs. ship a best-effort generic version vs. explicitly cut from Phase 1 scope.

*Cross-cutting note: B-1 also blocks full realization of S14 (Cartoon Bubbles mechanic depth) and S15 (story retelling) — those items' mechanics can be built now, but they'll be running with placeholder or absent art until B-1 is resolved. Similarly, any new vocab domain added under the Must/Should items above (B3/B4/B5/B6/B7/B9/B10/B11, per the source content report's own aggregate gap list) will need audio production for at least `ru` — the only fully-recorded flagship locale — before it's usable end-to-end; see S17.*

---

## If you fix only 5 things

The five highest-leverage items across both tiers — chosen for being either root causes that many other gaps hang off of, or large pieces of working code/mechanics sitting unused or actively wrong today:

1. **Build the real 40-Meeting-Plan spine [M13]** — both source reports independently identify this as the root cause behind most other gaps: only 17/40 meetings have any fresh vocabulary, nothing gates 1A→1B sequencing, and the Nurturer Studio's own planning tools can recommend the one thing GPA explicitly forbids at 0 hours.
2. **Wire the placement engine into onboarding [M12]** — a fully-built, correct placement system already exists in the codebase with zero callers; this is UI wiring, not new engineering, and it fixes a genuinely broken first-time experience for any non-beginner today.
3. **Fix Ladder of Success and Sixteen Pictures to their real mechanics [M9 + M10]** — these are flagship, currently-live activities that are actively inaccurate (not just thin) — fixing them corrects something users already interact with, rather than adding something new.
4. **Build the cue-card system and fix word-history tracking [M11]** — the foundational data/asset layer that Grand Refreshing, Ladder of Success, and Making Statements all depend on; the live session room currently doesn't even log which cards were introduced, so every downstream feature built on `wordIds` today would be built on bad data.
5. **Surface vocabulary checkpoints (150/300/1,000-1,200) [M1]** — the cheapest Must-have item (S effort) and the guide's own motivational backbone; currently invisible in the app despite all the underlying data already being tracked.
