# Nuri / GPA Knowledge Base

Deep study of the Growing Participator Approach (Greg & Angela Thomson) Phases 1–6
as documented in this repo's `research/` corpus, mapped against the app's actual
implementation. Built 2026-07-16 by a 14-agent study (9 deep-dives + completeness
critic + 4 gap-fills; ~20 claims spot-verified against sources).

**Purpose:** the permanent reference for converting the full six-phase methodology
into app features. Each phase report covers the same 10 dimensions: phase identity
& goals · the actual session instructions · what the nurturer does · what the
participant does · what they're learning · how they're learning it · sub-stages and
the grower's state · what they look at (materials) · how much recording they do ·
milestones & terminology — plus an "App vs. source-guide deltas" section.

## Phase reports

| File | Phase | Hours | One-line identity |
|---|---|---|---|
| [phase1.md](phase1.md) | 1 Connecting | 0–100 | Here-and-now play; 40 Meeting Plans; 1A silent/listening (300+ words), 1B constrained talking (→1,000–1,200 words) |
| [phase2.md](phase2.md) | 2 Emerging | 100–250 | Story-building with wordless picture books; 2A GP-led 50h / 2B nurturer-led 75h / 2C life stories 25h |
| [phase3.md](phase3.md) | 3 Becoming Knowable | 250–500 | Shared stories ("stuff we both know"); bridge stories + massaging recordings; 3A 100h / 3B 75h / 3C 75h |
| [phase4.md](phase4.md) | 4 Deep Personal Relationships | 500–1,000 | Life stories, walks of life, detailed observation; nurturer→mentor; the "great cross-over" |
| [phase5.md](phase5.md) | 5 Widening Understanding | 1,000–1,500 | Native-to-native discourses recorded without the GP; ~330h of clarifying; reading starts here |
| [phase6.md](phase6.md) | 6 Self-Sustaining Growth | ongoing | Lifestyle phase; discourse-mastery pipelines, 100/300-hour blocks, Phase un-6 warning |

## Cross-cutting reports

- [app-implementation.md](app-implementation.md) — how `src/lib/phases.ts` (49 activities), the session room, practice games, placement, and progression actually work today; only Phase 1 is executable.
- [nurturer-side.md](nurturer-side.md) — the nurturer's evolving role per phase (research) vs. the Nurturer Studio, training/certification, live-session tray, and Convex rails (app).
- [materials-assets.md](materials-assets.md) — every learning material: 237 card illustrations, audio per language, the Phase 1 graphics PDF (101 pp), Lexicarry strips, storybook bibliography, 29 wordless-book scan folders, copyright status, digitization gap tables.
- [lexicarry-strips-key.md](lexicarry-strips-key.md) — card-by-card enumeration of the 37 keyed homemade strips (1A–19) AND all 57 commercial Lexicarry functions with their Meeting Plan references.
- [beta-readiness-digest.md](beta-readiness-digest.md) — digest of `docs/BETA_READINESS_AUDIT.md` (2026-07-13): product doctrine, feature flags, release boundary, source-of-truth ordering.
- [supporting-assets.md](supporting-assets.md) — remaining corpus corners: SETUP-BACKEND.md, mascot design sources (Listik, Nuri), textures.

## Primary sources (in this repo)

- `research/phase1.txt` … `phase6.txt` — OCR text of all six Thomson phase guides (~9,000 lines; copyrighted, internal reference only)
- `research/gpa-research.json` — structured extraction per phase (note: phase 3 lives under `phase3doc` + `phase3pdf`)
- `2. Phase1 BW Graphics Feb 2023.pdf`, `Lexicarry-like strips-Key.pdf/.docx`, `Phase+2+Storybooks.pdf`, `Wordless Books out of print 274mb 32 items/`
- `src/lib/phases.ts` — the app's encoded curriculum (the conversion target)
