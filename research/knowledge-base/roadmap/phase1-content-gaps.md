# Phase 1 "Make It Perfect" — Content/Curriculum Gap List

Nuri (lange-gpa), project root `/Volumes/LaCie/GPA_Language_Learning`. Compiled 2026-07-18.

**Sources used:**
- `research/knowledge-base/phase1.md` (deep-dive KB — primary source; its own "App vs. source-guide deltas" section, §pp.317-344, is the backbone of this list)
- `research/knowledge-base/materials-assets.md` (digitization gap tables, §6)
- `research/knowledge-base/lexicarry-strips-key.md` (the 37-frame packet key + the 57-function Lexicarry-book list)
- Live code verified 2026-07-18: `src/lib/phases.ts` (Phase 1 entry, lines 11–161 — this is the WHOLE entry, nothing truncated), `src/lib/vocab.ts` (28 domains / 245 items, confirmed via grep), `src/lib/cards.ts`, `src/lib/sessionFlow.ts` (the "Dirty Dozen" session engine)

**Method:** every item below is cross-checked against the *current* code, not just the KB's snapshot (KB was written same day but a live-diff pass turned up one correction: `sessionFlow.ts` already implements the RRD "start with two / add one at a time / review round" mechanic at the engine level — this was NOT visible in phases.ts alone. That's a partial mitigant for gap #2 below, noted inline.)

**Scale key:** MUST = Phase 1 is not authentically GPA-1 without it. SHOULD = materially improves fidelity to the Thomson guide. NICE = polish/completeness, low fidelity cost if skipped. Effort: S (~1–3 days), M (~1–2 weeks), L (~3+ weeks / needs new art or infra).

---

## A. Structural spine (sequencing, roles, checkpoints)

### A1. The 40-Meeting-Plan spine is entirely absent — MUST — L
The guide is 40 sequenced, themed Meeting Plans (2–3h each, ~2/day, "designed to be completed in order as each builds on the ones before," resume-where-you-left-off between plans). The app has only two `parts` (1A / 1B) in `phases.ts` with no per-meeting themes, no ordering constraint, and (confirmed live) `sessionFlow.ts`'s `buildDeck()` round-robins vocab across ALL 28 domains regardless of `meeting:` number — so a brand-new learner can be served "occupations" (meeting 33 content) in session 1. The `meeting:` field exists on `VocabItem`/`VocabDomain` in `types.ts` and is populated on 18 of 28 domains, but nothing in `sessionFlow.ts` reads it to gate sequencing. This is the single biggest fidelity gap — nearly every other gap below is a symptom of "no MP spine to hang activities off of."
*Cite: phase1.md §2 "Programme mechanics"; §"App vs. source-guide deltas" #1.*

### A2. Coach role has no app model — SHOULD — M
Three player kinds are canonical: nurturer, GP (2–6), and an optional coach ("also a GP... a great way to train a new nurturer"). Nothing in the codebase (`grep -rln coach src/` → zero hits) represents this third role, its silence-during-listening-games rule, or its host-language-only encouragement privilege.
*Cite: phase1.md §2, §3 "Coach rules."*

### A3. Orientation event + Name Game (host-world name) missing — SHOULD — S/M
Pre-M1: social event, orientation meeting, group photos taken for Photos of Us in Action, and the Name Game gives every GP a personal host-world name the nurturer uses thereafter. None of this exists as onboarding flow.
*Cite: phase1.md §2 "Before Meeting 1"; §6 item 9.*

### A4. Day-and-Time opener (MP31+) missing — SHOULD — S
Prescribed ritual from MP31 on: every day's first meeting opens with "What day is today? What time is it?...Tomorrow? The day after tomorrow?" — defended explicitly as legitimate "display questions." No app activity encodes this.
*Cite: phase1.md §2 "Phase 1B meeting skeleton" item 1; §6 item 30.*

### A5. Plan-Your-Own-Meeting (MP36) missing — NICE — S
A printed planning form GPs fill out mid-course (resources, new-vocab targets, grammar focus). Low fidelity cost to omit but easy to add as a reflective/planning screen.
*Cite: phase1.md §2, last bullet.*

### A6. Vocabulary checkpoints not surfaced anywhere — MUST — S
The guide's staged numbers are load-bearing motivational/structural beats: **150 words by M7** ("Grand Refreshing – Hurrah for 150 words!"), **300+ at M15** (the talking threshold — 1A ends here), **+600 in 1B**, **1,000–1,200 final**. The app's `vocabTarget` string only states the end goal ("~1,000 words understood by ear") with no intermediate milestones, no UI checkpoint, and no code that computes "have I crossed 150/300?" `achievements.ts` exists but (per grep) contains no "150 word"/"300 word"/"Grand Refresh" logic.
*Cite: phase1.md §5 "Vocabulary targets"; §10 "Milestones."*

---

## B. Missing named activities (no app counterpart at all)

### B1. Grand Refreshing (MP7, 14, 15, 36) — MUST — M
The cumulative review ritual: the whole "Bag of Stuff" laid out at once, commands/questions spanning the ENTIRE vocabulary learned so far, combined commands ("Take the spider and run to the window"), cue-card stack checked for anything missed. This is the guide's actual mechanism for hitting the 150-word (A6) and 300-word checkpoints — without it the checkpoints in A6 have no game to attach to.
*Cite: phase1.md §6 item 13; §10 milestones.*

### B2. Cue-card system — MUST — M
A second printed copy of the picture dictionary cut apart, serving three functions: (a) home substitute for objects during re-living, (b) nurturer's coverage-reminder to avoid favoritism/ruts, (c) random-draw sentence generator (draw location + 2 objects → "Take the spider and run to the window"; draw action + kin + body part → "Hit his brother's foot"). This underlies Grand Refreshing, Making Statements (B12), and the nurturer's "keep the games moving fast" doctrine. Entirely absent from the app.
*Cite: phase1.md §6 item 11; §8.*

### B3. Numbers suite beyond 10: ordinals, tens/money, Number Bingo — MUST — M
`vocab.ts`'s `numbers` domain stops at `num-ten` (confirmed by grep: 10 items, "one"..."ten"). The guide's numbers suite runs through ordinals (MP13), tens via money (MP12), then 20–100–200–1000–million with real/prop money (MP31), plus Number Bingo (9–12 numbers/board, beans as counters). This is core Phase-1 content, not an edge case — money/bargaining role-play (already in the app as `p1-market`) depends on it.
*Cite: phase1.md §6 item 19; materials-assets.md §6 table row "1."*

### B4. Question-words game (MP24) — MUST — S
Who, what, where, what-kind-of, how-many, why/because, whose, to-whom — a named, dedicated activity in the guide, and foundational grammar the guide flags as essential to "here-and-now" communication. No vocab domain, no activity entry.
*Cite: phase1.md §5 meeting-map M24; §"Grammar/structures."*

### B5. Physical States and Needs (MP19–21, three-step) — MUST — M
"I'm hungry" → GP replies "Take the egg" (step 1: nurturer's own state); "You are hungry" → "Give me the egg" (step 2: anyone's state); step 3: GPs run it fully with and/or. This is one of the four or five pillar 1B talking activities (alongside Ladder, Info-Gap, Marketplace) and has zero app representation despite the other three pillars being present.
*Cite: phase1.md §6 item 24.*

### B6. Possessives/possessive-pronoun practice — MUST — M
Heavily emphasized in the guide with an explicit warning: skipping possessives "cripples Phase 2." Woven through M5–6, M9–10, M17, M21 (plural possessives). No dedicated activity or vocab-domain grammar drill exists; the app's `family-more`/`body-more` domains carry the vocabulary but not the possessive-form practice built around them (e.g., "the girl's younger brother," "my/your/her book").
*Cite: phase1.md §5 "Grammar/structures"; §6 item 11 (cue-card kin+body combos).*

### B7. Time/calendar/clock/seasons suite (MP30–31) — MUST — M
Days of week, months, yesterday/today/tomorrow, weather, and progressive time-telling (hours→half-hours→quarters→minutes) — feeds directly into the Day-and-Time opener (A4). No vocab domain, no activity.
*Cite: phase1.md §5 meeting-map M30–31.*

### B8. Negation pair + relative clauses + Making Statements (MP38–40) — MUST — M
The phase's final consolidation trio: Negation-Listening/Negation-Talking + "Don't you dare!" (MP38), relative clauses "Show me a man who is walking" / "Show me a woman that a man is helping" (MP39–40), and Making Statements (random cue-card draw → GP produces a true statement, self-rescuing with power tools, MP39–40). These are the explicit capstone of the 40-MP arc — currently the app has no MP36-40-equivalent content at all, so the "ending" of Phase 1 is undefined in-app.
*Cite: phase1.md §6 items 33–34, 32.*

### B9. World-map / countries / nationalities suite (MP13, 27–28) — SHOULD — M
Countries in sets of 12, continents, nationalities, five question forms (who lives in/speaks/is learning/wants to go/is from), later born-in/grew-up-in. No vocab domain, no activity, no map asset.
*Cite: phase1.md §6 item 20; materials-assets.md §6 gap row.*

### B10. Town-places + Landscape/Countryside suites (MP14, 19–20, 27–29) — SHOULD — M/L
~20–40 town-place words (MP19–20) plus ~20 outdoor/geographical words (mountain, hill, lake, river, desert, ocean, sky, snow, road — MP14). These feed the big Town Scene and Landscape Scene assets used for description/info-gap games (see D3). No vocab domain exists for either.
*Cite: phase1.md §5 meeting-map M14, M19–20; materials-assets.md §1.1, §6.*

### B11. If/then, before/after/while sequenced commands + can/can't-because — SHOULD — M
Conditional and sequencing structures taught via LISTEN & DO chains (MP25 if/then; MP35 before/after/while) and modal "can/can't + because" (MP31). No app representation of multi-clause command structures at all — `p1-listen-do` is described only as single/simple commands.
*Cite: phase1.md §5 meeting-map M25, M31, M35.*

### B12. Actions Charades (MP29) — NICE — S
Team-based cue-card acting/naming game with a scoring twist (2 points without prop, 1 with) and in-role correction ("No, I'm not swallowing, I'm eating"). Self-contained, cheap to add.
*Cite: phase1.md §6 item 28.*

### B13. Sound-discrimination suite beyond minimal pairs — SHOULD — M
`p1-sounds` in the app covers only "Hear the Difference?" The guide's full ~10-min/day suite (from MP11/16) also includes **Sorting Sounds into Columns** (sort the whole cue-card deck by initial/medial/vowel sound), **Spot That Sound** (raise a hand at the day's target sound), and conditional ears-first **Word Dictation** (MP24–32, only for phonemic scripts + known alphabet — the ONLY writing in Phase 1). Also missing: the rule that minimal-pair words must already be known before use in this game (never a first encounter).
*Cite: phase1.md §6 item 16; §"App vs. source-guide deltas" #5.*

### B14. Story retelling of Lexicarry/bubble strips (MP34–35) — SHOULD — M
Late-1B evolution of the Cartoon Bubbles activity: nurturer narrates strips as short stories (MP34) → GPs collaboratively retell "at their current ability" and act strips out as role-plays (MP35). The app's `p1-lexicarry` activity is static (point-at-the-bubble only); this progression is entirely unrepresented.
*Cite: phase1.md §6 item 8, item 29; lexicarry-strips-key.md §6 rows MP34–35.*

### B15. Drawing-dictation info-gap ("One Draws, Others Listen and Copy" + "Fix That Drawing!", MP27) — NICE — M
Whiteboard drawing-from-description game with a verbal-correction round. Distinct game type from the existing Sixteen Pictures info-gap; not represented.
*Cite: phase1.md §6 item 23.*

### B16. Form-focused / structured-input games — SHOULD (fidelity) but flagged L for generalization — L
Language-specific games engineered to force attention to grammatical form: pronoun-drop "Here-and-Now Descriptions," "To and From Alone" (case-marking via verb omission), "Alone or in Groups" (singular/plural rows), Kazakh-specific possessed-noun examples. These are inherently per-host-language (the guide says "designed with a linguistic consultant... where possible"), so a generic 19-language app can only approximate a template, not port these 1:1. Flagging as high-effort/architecturally hard rather than a simple content add.
*Cite: phase1.md §6 items 15, 26.*

### B17. Gap-filling, growing-participation journal, lifestyle-participation feed-in — NICE — S
Minor homework/self-tracking rituals (patch noticed vocabulary holes; log sound-discrimination problems; bring real-world communication situations back into new strips/role-plays). Low curriculum weight; mostly a journaling feature.
*Cite: phase1.md §4 "Homework"; §6 item 14.*

### B18. Synonyms (MP37) and General Words & Plurals (MP39) — NICE — S
Two small named late-phase activities (word/letter/number/shape/color/sentence meta-vocabulary; synonym pairs). Low individual weight but part of the MP36-40 capstone block (see B8).
*Cite: phase1.md §6 item 35.*

---

## C. Existing activities that are simplified or distorted (not just missing — actively inaccurate)

### C1. Ladder of Success (`p1-ladder`) lacks its real mechanics — MUST — M
App description: generic "constrained talking games where you name what you already deeply understand." Missing: the physical **4-rung table** with string markers, the **expansion mechanic** (a bare word only advances a rung when EXPANDED — "Dog" → "Brown dog" → "The brown dog is running"), the **pronunciation gate** (a fundamentally wrong sound sends the object back for retry next turn; after 3 failed attempts the nurturer stops asking for that word for now), escalating rounds (1 new+1 expansion → 2+2 → 3+3), and a time limit. The app's line "The nurturer never corrects — they 'recast'" is also a conflation: recasting is the *grammar*-correction mode; pronunciation in THIS specific game is actively judged/gated by the nurturer ("close enough" or not) — a different mechanism than recasting.
*Cite: phase1.md §6 item 22; §"App vs. source-guide deltas" #10.*

### C2. Sixteen Pictures (`p1-infogap`) is the wrong game shape — MUST — M
App description: "One describes a card, the other finds it." Actual game: two players each hold a **4×4 grid of the same 16 pictures in different orders**, separated by a barrier, and must reach a matching state through iterative question-exchange (not a single describe-and-find) — with an MP18 nurturer-led version and an MP19 GP-led version. Fixing the mechanic requires digitizing an actual duplicate 16-scene picture set (see D3), since the current app has no such asset.
*Cite: phase1.md §6 item 23; §"App vs. source-guide deltas" #11.*

### C3. Power Phrases (`p1-power`) mislabeled — SHOULD — S
Three issues: (a) app claims "eight survival questions" — the guide never gives a fixed count (lists ~7 core tools + a later MP38 Phase-2-prep expansion set of 4 more: "write it," "what does it mean," "how do you say," "opposite of"); (b) app files this under 1B (`parts[1]`, kind "speaking") but Power Tools are introduced in **1A** (MP11–12) as a **listening** activity, before the talking threshold — two-way use only starts at MP19; (c) the MP38 Phase-2-prep expansion set is missing entirely.
*Cite: phase1.md §6 item 18; §"App vs. source-guide deltas" #12.*

### C4. Talking Picture Dictionary (`p1-dictionary`) description contains an invented claim — SHOULD — S
"One recording style omits the answer so you can respond physically as self-review" does not appear in the source guide. The guide's actual dual-recording system is: (1) per-game 1-minute samples in random order (these ARE the physical-response review material used at home) and (2) the dictionary recording, which explicitly **names every item** ("One. This is an old man..."). The app currently only implements something like recording type (2) and misdescribes it as doing the job of (1).
*Cite: phase1.md §6 item 12, §9; §"App vs. source-guide deltas" #13.*

### C5. Cartoon Bubbles / Lexicarry (`p1-lexicarry`) omits the mechanic's depth — SHOULD — M
Kind "culture," ~60 expressions ✓, register-awareness ✓ — but omits: the puppet-act-out step that precedes questioning, the translation exception (formulaic expressions ARE allowed approximate translation, unlike everything else in Phase 1), and the strip→story→retelling→role-play progression (see B14) and the make-your-own-strips loop from real lifestyle situations.
*Cite: phase1.md §6 item 8; §"App vs. source-guide deltas" #14.*

### C6. Top-level Phase 1 description contradicts half the phase — NICE — S
"You don't speak yet: you point, act, arrange and laugh" is true only of 1A (meetings 1–15, the first 30–40 of 100 hours). 1B (the other 60–70% of the phase) is explicitly about constrained TALKING. The `parts` array correctly distinguishes this but the phase-level `description` string doesn't.
*Cite: phase1.md §"App vs. source-guide deltas" #15.*

### C7. Hour figures and per-activity minute estimates are invented/imprecise — NICE — S
App: 1B = "~60h." Guide: "50 to 60 hours" in the overview table but "50 to 80 hours" in the 1B introduction itself — app should either use the wider range or flag the discrepancy. Separately, all `minutes` values on activities (8–20 min) appear to be app inventions; the guide only specifies concrete durations for a few things (~10 min/day sound games, ~30 min first body-parts dozen, "less than half an hour" for a 20-word outdoor set).
*Cite: phase1.md §"App vs. source-guide deltas" #16.*

### C8. Fabricated milestone quote — NICE — S
"Host people feel you have 'a special connection to us'" is not in the Phase 1 guide as a quote. Closest real content: other host people don't yet even know about the GP's small world at this stage, and lifestyle relationships may stay minimal all phase — the milestone as written overstates Phase 1's social-integration claim.
*Cite: phase1.md §"App vs. source-guide deltas" #17.*

### C9. vocabTarget string undersells the phase-end target — NICE — S
"~1,000 words understood by ear" is directionally fine but hides that the guide's actual stated goal is 1,000–1,200, AND that ~300 of those words must also be *spoken* by phase end (the whole point of 1B) — the current string implies pure listening is the entire finish line.
*Cite: phase1.md §"App vs. source-guide deltas" #18.*

### C10. Struggler protocol not encoded — SHOULD — S
Canonical rule: when one GP struggles, narrow to just the two items they're stuck on and rebuild from there ("This principle... applies in a wide variety of games"). `sessionFlow.ts`'s deck engine already implements the base RRD add-one-at-a-time + periodic full-review-sweep mechanic (a genuine partial credit not visible in `phases.ts` alone) but has no per-learner struggle-detection/narrowing branch.
*Cite: phase1.md §2 "The canonical rules"; §3 "Struggler protocol."*

---

## D. Missing/incomplete digitized materials (assets, not just activity logic)

### D1. Lexicarry-strip bubble artwork — MUST — L
The Cartoon Bubbles activity (`p1-lexicarry`) is the single biggest asset gap in Phase 1: **zero original bubble-strip art exists**. The source has two systems — (a) the homemade packet's 38 drawn frames (37 keyed, frame 20 unkeyed — see lexicarry-strips-key.md §3) and (b) the commercial Lexicarry book's 57 numbered functions cited meeting-by-meeting through MP32. Neither is digitized; copyrighted scans can't ship (materials-assets.md §5). Without this, "Cartoon Bubbles" in the app is a description with no actual content behind it — a full 40-MP build cannot be authentic without commissioning ~40-60 original 3-frame comic strips (or their functional equivalent).
*Cite: lexicarry-strips-key.md §2–4; materials-assets.md §6 row "1."*

### D2. Emotion faces — 8 of 25 digitized — SHOULD — S
`emotions` domain has 8 items (happy/sad/angry/surprised/scared/sleepy/crying + one more). The graphics packet's MP11 Game 2 set has **25 numbered emotion/state faces** (happy, sad, angry, frightened, surprised, embarrassed, worried, kind, cruel, sly, mean, stern, jolly, grieving, sleepy, exhausted, thirsty, hungry, cold, hot, sick, injured, messy, dirty, bored). Filling the remaining 17 is low-effort relative to impact since art-generation infra (`generate-card-images.mjs`) already exists.
*Cite: materials-assets.md §1.1; §6 gap row.*

### D3. Duplicate 16-scenery picture set for Sixteen Pictures info-gap — MUST — M
Needed to fix C2 above. The guide requires **two identical sets of 16 scenery drawings arranged in different orders**. Nothing like this exists in `public/cards/`.
*Cite: phase1.md §8; materials-assets.md §6 gap row.*

### D4. Town Scene and Landscape/Countryside Scene — SHOULD — L
Two big composite scenes the guide singles out by name (Town Scene "reflects city life in post-Soviet Central Asia," explicitly meant to be redrawn/localized; Countryside/Landscape Scene). Needed for the description/info-gap games in B10 and MP23, MP27. No equivalent asset exists; would need original art generation at composite-scene complexity, beyond the current per-item sticker pipeline.
*Cite: materials-assets.md §1.1, §6 gap row.*

### D5. Numbers/money/ordinals card art — MUST — M
Companion asset to B3 — no card art exists past `num-ten`.
*Cite: materials-assets.md §6 gap row.*

### D6. Map/countries/nationalities art — SHOULD — M
Companion asset to B9.
*Cite: materials-assets.md §6 gap row.*

### D7. Numbered Talking Picture Dictionary numbering + two-copy binder/cue-card production — MUST — M
Even where card art exists, nothing in the app assigns sequential cross-phase numbers to entries the way the guide's dictionary does ("Suppose you had fifteen new words this time... begin with sixteen"), nor produces the described "two printed copies" concept (one for the binder/audio index, one cut apart as cue cards feeding B2). This is as much an information-architecture gap as an asset gap.
*Cite: phase1.md §9; §"App vs. source-guide deltas" #3.*

### D8. Per-game recorded sample + scene-description/video recordings — SHOULD — L
Distinct from the picture dictionary recording (D7): the guide's OTHER recording type is a ~1-minute random-order sample taken at the end of every game (this is what the evening "re-living" protocol is actually built on), plus scene-description recordings paired with a photo, plus video for room tours/story retellings. None of this recording pipeline exists; `p1-dictionary` only covers the dictionary-style recording.
*Cite: phase1.md §9; §"App vs. source-guide deltas" #2.*

### D9. Photos of Us in Action — real photo capture — SHOULD — M
The activity exists in `phases.ts` as a described mechanic (`p1-photos`), but the actual product feature — capturing real photos of the learner's own group performing actions, which the entire game is built on ("In which photo am I walking?") — doesn't appear to exist; the description implies static pre-made content rather than user-captured photos.
*Cite: phase1.md §6 item 7; §3 "nurturer's own family photos (MP7)."*

### D10. Possessives/pronoun/question-word/town/calendar/quantity/shape/paths-of-movement vocab domains — MUST/SHOULD — M (aggregate)
Rolls up B4, B6, B7, B9, B10, B11 from a pure asset-inventory angle: materials-assets.md's own gap list names these as **not digitized from the authentic inventory**: ordinals, tens/money, countries/map/nationalities, shapes/lengths, quantities, town places (20–40 words), calendar/weather/time, question words, courtesy expressions, possessives/pronouns, paths of movement, occupations beyond 4, times of day/meals, directions, senses/tastes, water/temperature states, modals/negation. Listed here as a single consolidated line so the size of the remaining vocab-domain backlog is visible at a glance; effort is aggregate — individual domains are S each, but there are ~16 of them.
*Cite: materials-assets.md §2 "Gap vs Phase 1 needs."*

---

## E. Cross-cutting notes

- **Positive finding not in the KB snapshot:** `sessionFlow.ts`'s `buildDeck()` DOES implement genuine RRD engine mechanics (start-with-two via `INTRO → ECHO`, add-one-at-a-time, periodic full-deck review sweep every 3rd card) — this is real fidelity the phases.ts-only read of the KB doesn't credit. What it does NOT do is respect `meeting:` ordering (A1) or weight questions toward the newest/weakest word specifically (the guide's "ask about the newest word more often" rule) — it round-robins domains and shuffles within them.
- **Copyright constraint shapes D1, D4, D6:** none of Thomson's/Angela Thomson's original drawings or Lexicarry's commercial book art can ship in a commercial app (materials-assets.md §5) — every missing visual asset above requires **original** art commissioned/generated, not digitization of the source PDFs.
- **Language-coverage note (not itself a curriculum gap, but blocks full realization of the above):** only ru has complete Phase-1 audio; en/ja cover just the original 98-item deck; ht is scripted but unrecorded; the other 15 UI languages fall back to browser TTS. Any new vocab domain added per B/D above will need audio production across at minimum ru (complete) before it's usable end-to-end for the flagship locale.

---

## Prioritized top-20 (see also `StructuredOutput.topGaps`)

1. 40-Meeting-Plan spine/sequencing — MUST/L (A1)
2. Numbered dictionary numbering + cue-card two-copy system — MUST/M (D7, B2)
3. Vocabulary checkpoints (150/300/1000-1200) surfaced in-app — MUST/S (A6)
4. Ladder of Success real mechanics (rungs, expansion, pronunciation gate) — MUST/M (C1)
5. Sixteen Pictures real info-gap + duplicate 16-scene art — MUST/M (C2, D3)
6. Lexicarry bubble-strip artwork (57 functions) — MUST/L (D1)
7. Grand Refreshing cumulative review activity — MUST/M (B1)
8. Numbers beyond 10: ordinals/tens/money/Number Bingo + art — MUST/M (B3, D5)
9. Question-words game + vocab domain — MUST/S (B4)
10. Physical States and Needs (3-step) — MUST/M (B5)
11. Possessives/pronoun practice — MUST/M (B6)
12. Time/calendar/clock/seasons + Day-and-Time opener — MUST/M (B7, A4)
13. MP38-40 capstone trio: negation, relative clauses, Making Statements — MUST/M (B8)
14. Coach role — SHOULD/M (A2)
15. Town places + Town/Landscape scene art — SHOULD/L (B10, D4)
16. Sound suite expansion (Sorting Sounds, Spot That Sound, Word Dictation) — SHOULD/M (B13)
17. Map/countries/nationalities suite + art — SHOULD/M (B9, D6)
18. Power Phrases fix (move to 1A, correct scope, add MP38 set) — SHOULD/S (C3)
19. Photos of Us in Action real photo-capture feature — SHOULD/M (D9)
20. Story retelling of bubble strips (MP34-35 progression) — SHOULD/M (B14)
