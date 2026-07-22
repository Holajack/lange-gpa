# Addendum: docs/BETA_READINESS_AUDIT.md (871 lines) was never read or cited by any KB report

Source: `/Volumes/LaCie/GPA_Language_Learning/docs/BETA_READINESS_AUDIT.md` ("Nurilang Beta Readiness Audit", audit snapshot **2026-07-13**, 871 lines). Read in full 2026-07-16; selected repo claims re-verified against the live working tree the same day (noted inline). This is the product's single operating view: doctrine, implementation map, target data model, user journeys, release gates, and a dated remediation record. It post-dates and in several places **supersedes status claims** in `docs/ROADMAP.md` and `docs/AGENT_BRIEF.md`, and it adds release-status framing that `app-implementation.md` and `nurturer-side.md` lack (see §17 for the reconciliation).

---

## 1. Release verdict (the audit's headline)

- **Decision: not ready for an open, paid, or unsupervised public beta.**
- **Recommended next release:** a small, **adult-only, invitation-only Phase 1A pilot** with **one audited target language**, **real human facilitation**, and **commerce disabled**.
- Self-assessment of the repo: "The strongest part of the repository is the idea." The default local beta build now presents "a narrower, more honest Phase 1A product," while the connected-learning/community/marketplace system "remains partly prototype infrastructure."

### What the audit counts as already valuable
- The research corpus `research/phase1.txt`–`phase6.txt` is "a real pedagogical spine"; `src/lib/phases.ts` renders it in product language.
- Onboarding already supports multiple home languages + one initial target (`src/app/onboarding/page.tsx`).
- Landing page, mascot family, globe, courses, practice screens, and session room "make the method feel tangible."
- `src/lib/i18n.ts` translation coverage is structurally broad; RTL is understood at the language-model level.
- Clerk + Convex + messaging + requests + parties + WebRTC signaling = "a reasonable scaffold for an account-backed product."
- The working tree (as of 2026-07-13) includes: account-derived profile identity, per-language journey state, dated achievements, gradual immersion, production fail-closed behavior, and **default-off gates** for unfinished human/community/commerce paths.
- A clean production build and a local mobile browser journey passed. Still-open release gates: deployment, legacy-profile migration, adversarial security, native-language review, real-user facilitation, production operations.

### The 8 reasons an open beta would be unsafe or misleading today
1. **Only Phase 1A has an executable learning loop.** Phases 2–6 are correctly presented as method previews, but their distinct engines, artifacts, evidence, and human-session plans do not exist.
2. **Progress is awarded by client behavior and elapsed timers**, not server-validated learning evidence or a completed human session.
3. Seeded people / simulated human behavior are removed or demo-gated in the default build, but **there is no verified supply of trained nurturers** for a real pilot.
4. New-target selection and legacy routes no longer silently borrow another language's deck, but **native-reviewed curriculum and recorded audio coverage are much narrower than the selectable language set**.
5. **Trust-and-safety for stranger discovery, messaging, calls, and paid nurturing is incomplete.**
6. **Commerce/time credits are not tied to authoritative payment webhooks and attended-session settlement.**
7. **GPA publication/translation rights are unresolved**: research files carry publication/translation conditions; no sent or granted permission record exists in the repo — `docs/THOMSON-PERMISSION-EMAIL.md` "appears to be a draft, not proof of rights."
8. **Invitation enforcement, adult-only acceptance, support ownership, moderation ops, monitoring, backups, and deployed Clerk/Convex smoke tests are unproven.** Maintained surfaces use the Nurilang name, but legacy LANGE/GPA-Language domains and artifacts need a deliberate redirect/archive policy.

### Safe closed-beta boundary (required scope — explicitly NOT yet enforced end-to-end)
- Adults 18+ only; invitation-only with a named support contact and explicit beta expectations.
- **One audited target language.** Russian is the strongest first candidate (large prerecorded asset set — 484 clips) but still needs native-speaker content review. **English/Japanese must not be added merely because audio folders exist.**
- **Phase 1A only** — the first 30–40 hours, or an even smaller first-session pilot until the full 15-meeting sequence is executable.
- One initial target language per new account; multiple home languages allowed.
- Solo picture/listening activities framed as **preparation and re-living tools, not substitutes for human participation**.
- Real nurturers manually recruited, verified, trained, scheduled, and observed by the beta team.
- No public globe discovery, unmoderated DMs, open calls, paid marketplace, or purchasable credits until gates pass.
- Phases 2–6 visible only as method previews — "must not look playable or complete."
- Every seeded person/event/metric/conversation visibly labeled "example"/"demo" or removed.
- The test this scope enables: *can a new person understand the method, hear meaningful speech, respond nonverbally, build a relationship with a nurturer, re-live a recording, and want to return?*

---

## 2. Local remediation verification — 2026-07-13 (dated evidence record)

These checks **passed against the local default beta configuration**. The audit stresses they establish "a viable engineering baseline," **not** open-beta readiness, and validate nothing about external production configuration:

- Fresh user completed **mobile onboarding** with multiple home languages and exactly one target; optional steps skippable; gradual immersion stayed the default.
- User completed a **ten-round Phase 1A listening activity** and saw progress + a **dated achievement** update.
- **Adding a second target journey, switching journeys, and returning preserved independent progress.**
- **Direct URLs could not bypass the Phase 1A/1B speaking gate**; Phases 2–6 displayed method-preview states without executable "Start" actions.
- Schedule and direct-session surfaces showed **only clearly labeled AI behavior** in the default configuration; seeded humans, messaging, stranger calls, forum/events, nurture studio, marketplace, and wallet paths were hidden or redirected behind **default-off feature gates**.
- **No horizontal overflow** on the exercised mobile path.
- Root TypeScript, Convex TypeScript, diff-whitespace checks, and a clean Next.js production build passed. **Design audit: 12 of 13 automated heuristics passed**, no critical failure (the failing heuristic didn't recognize an existing staggered-reveal implementation).
- **Public landing route first-load JS reduced from ~839 kB to ~173 kB.** Authenticated app routes remain large and "need a dedicated bundle-reduction pass."

Repo corroboration (verified 2026-07-16): the default-off gate family exists as `NEXT_PUBLIC_ENABLE_*` env flags, all requiring the literal string `"true"`: `COMMUNITY_EXCHANGE`, `NURTURER_STUDIO` (both in `src/lib/featureFlags.ts`, which notes "Sensitive features also have matching server-side gates; these constants only decide what the browser mounts"), plus `COMMERCE`, `PARTIES`, `FORUM`, `SEEDED_NURTURERS`, and `DEMO_SPEED` defined at point of use across `src/` and `convex/`.

---

## 3. Sources reviewed and the source-of-truth ordering rule

### Research sources (per-file product meaning, per the audit)
| Source | Product meaning |
|---|---|
| `research/phase1.txt` | First 100 Hours; 1A listening/nonverbal response; 1B constrained two-way interaction |
| `research/phase1-authentic-inventory.md` | Inventory + fidelity check for Phase 1 activities |
| `research/phase2.txt` | 150h story-building: **2A 50h, 2B 75h, 2C 25h** |
| `research/phase2-3-story-library.md` | Story resources; bridge from picture stories into shared stories |
| `research/phase3.txt` | 250h shared-story work: **3A 100h, 3B 75h, 3C 75h** |
| `research/phase4.txt` | 500 flexible hours of deep-life conversations with mentors |
| `research/phase5.txt` | 500h native-to-native discourse, clarification, communities of practice |
| `research/phase6.txt` | Ongoing self-sustaining participation — "a way of living, not a timed course" |
| `research/gpa-research.json` | Detailed activity research used to curate the product model |

### Implementation sources (the audit's own map of the repo by area)
Curriculum model: `src/lib/phases.ts`, `src/lib/types.ts`, `src/app/(app)/courses/`. Content/language coverage: `src/lib/languages.ts`, `src/lib/vocab.ts`, `src/lib/tts.ts`, `public/audio/`. Onboarding/translation: `src/app/onboarding/page.tsx`, `src/lib/i18n.ts`, `src/lib/onboardingOptions.ts`. Local progress/immersion: `src/lib/store.tsx`, `src/lib/achievements.ts`. Account sync: `src/components/Providers.tsx`, `src/components/CloudProfileBridge.tsx`, `convex/profiles.ts`, `src/middleware.ts`. Practice/sessions: `src/app/(app)/practice/`, `src/app/(app)/session/page.tsx`, `src/app/(app)/nurture/page.tsx`. Scheduling/people: `src/app/(app)/schedule/page.tsx`, `src/app/(app)/world/page.tsx`, `src/lib/nurturers.ts`, `convex/requests.ts`. Community/calls: forum + events pages, `convex/messages.ts`, `convex/calls.ts`, `src/components/CallProvider.tsx`. Commerce: wallet + marketplace pages, `src/lib/credits.ts`, `convex/credits.ts`. Backend schema: `convex/schema.ts`. Public acquisition: `src/app/page.tsx`, `src/app/_landing/`, `src/app/layout.tsx`, `src/app/early/page.tsx`. Internal claims: `docs/ROADMAP.md`, `docs/AGENT_BRIEF.md`, `docs/SETUP-BACKEND.md`.

### Source-of-truth rule (KB-wide implication: applies to every phase report)
When sources disagree, resolve in this order:
1. **The original phase research** for method and sequence.
2. **A separately approved Nurilang curriculum specification** documenting any intentional adaptation (does not exist yet).
3. **Executable tests and server behavior** for claims about what works.
4. **Interface copy and roadmap documents** — only after reconciliation with the above.

Explicit document-trust warnings: `docs/ROADMAP.md` uses "built and live" for experiences that include prototype or seeded behavior; `docs/AGENT_BRIEF.md` contains **stale type signatures and language-coverage descriptions**. "Neither should be treated as launch evidence without updating it." (nurturer-side.md cites both as sources; treat their status claims accordingly.)

---

## 4. Product doctrine — the 12 non-negotiable behaviors

The audit instructs: evaluate Nurilang against these rules, **not** generic language-app conventions.

1. **The unit of growth is participation** — a person is becoming able to participate in another languacultural world, not collecting isolated answers.
2. **Comprehension precedes production** — Phase 1A asks the grower to point, act, arrange, respond; never perform speech.
3. **Meaning is carried by shared context** — pictures, objects, actions, stories, experiences, people. Translation is not the practice engine.
4. **Hearing precedes reading** — Phase 1 has no writing; written target-language answers "must not short-circuit the ear."
5. **The nurturer is a person, not a content-delivery avatar** — the relationship and shared past are part of the curriculum.
6. **Recasting replaces correction** — the nurturer naturally says a better version; never error punishment.
7. **Recordings become artifacts** — Talking Picture Dictionaries, session samples, clarified stories, word–sentence–word recordings, retellings, a listening library.
8. **Evidence is phase-specific** — time alone cannot prove comprehension, participation, or readiness.
9. **No streak debt** — missing a day does not erase growth; dated evidence-backed milestones, no XP/leagues/streak anxiety/deceptive urgency.
10. **Immersion is graduated** — the interface must not become inaccessible on day one; target-language exposure grows with comprehension.
11. **Phase 6 is ongoing** — begins around the 1,500-hour boundary; never "completed" by another fixed block of app time.
12. **The product must tell the truth** — AI buddies, example nurturers, browser speech, simulated sessions, and real humans must always be distinguishable.

---

## 5. Current implementation map (audit's architecture read, 2026-07-13)

Top-line: "The current system is a hybrid: the browser owns the active learning state, a Convex profile stores a broad JSON copy plus a few indexed fields, and several social features have their own server tables. **The learning, social, session, evidence, and economic graphs are not yet one authoritative system.**"

Flow (from the audit's mermaid diagram): Visitor → Clerk account → Onboarding UI → `AppProvider` browser state ⇄ localStorage cache ⇄ `CloudProfileBridge` ⇄ Convex `profiles` row (indexed fields + `data` JSON). The Profile holds home languages + active target + role, and hangs off it: optional **language journeys** (progress snapshots), a **bookings array** (bookings live inside the profile, not a table), and a **dated achievement map**. Practice pages and the session room both funnel into **client-side `completeActivity()`** → AppStore. `src/lib/nurturers.ts` (explicit seeded-demo data) feeds the schedule and forum prototypes **only via demo flags**. The Convex profile row feeds the World roster only via the community flag (off by default) → requests → messages/voice notes → WebRTC signaling + ICE. Parties/guests feed Events only via the events flag. Browser wallet state ⇄ Convex wallets/ledger only via the commerce flag. Three dotted "not authoritative" edges are called out: **calls are not authoritative learning evidence; bookings are not reliably settled to attendance; parties are not phase activity evidence.**

### Current-state observations (each is an audit finding in miniature)
- `src/lib/store.tsx` is "the practical source of truth for the active profile": `LanguageJourney`, exact minutes, activity attempts, deduplicated word IDs, dated achievements, weekly-window metadata. Local add/switch-journey testing passed, but state remains **client-authored** and needs legacy-profile migration + cloud-conflict testing.
- `convex/schema.ts` stores the full profile as **`data: v.any()`** alongside structured fields — enables round-tripping but "prevents meaningful server validation and safe partial updates."
- **The social backend is more normalized than the learning backend** (requests, messages, calls, parties, guests, wallets, ledger each have tables; learning does not).
- **A booking, call, party attendance, recording, curriculum activity, and achievement do not share a common server-side evidence record.**
- Seeded forum/event/nurturer/human-session behavior is unavailable by default and demo-flag-gated; the prototype pages and local data are "not a durable or verified community."
- `src/lib/nurturers.ts` characters must never be treated as a verified person's online status, session count, rating, certification, or availability until linked to account-backed review + scheduling records.
- `src/app/(app)/session/page.tsx` defaults to clearly labeled AI picture-card practice; timer-generated "human" simulation is restricted to explicit seeded-demo builds.
- `src/lib/languages.ts` constrains new targets to the content registry; legacy unsupported routes return to language selection "rather than borrowing Spanish." Prerecorded audio folders exist only for **English, Japanese, Russian**; "browser speech synthesis is not equivalent to native-recorded, dialect-reviewed curriculum audio."
- Community exchange, nurture studio, commerce, forum, and events are **default-off release boundaries enforced in the UI, middleware, and relevant server functions**. "Enabling a flag does not satisfy the operational, moderation, reliability, or economic gates."

---

## 6. Target data model (the audit's normative design — none of this exists yet as server truth)

Design principle: separate **identity, language identity, per-language growth, curriculum, human participation, evidence, safety, and money**. "The active target language is a user preference; it is not the place where progress itself lives."

### Entity graph (from the ER diagram)
- ACCOUNT 1–1 PARTICIPANT; PARTICIPANT 1–many PARTICIPANT_LANGUAGE (identified by LANGUAGE); PARTICIPANT 1–many JOURNEY (each JOURNEY targets one LANGUAGE).
- JOURNEY 1–many PHASE_ENROLLMENT (defined by PHASE); PHASE 1–many CURRICULUM_ACTIVITY; CURRICULUM_ACTIVITY 1–many ACTIVITY_ATTEMPT (recorded on the JOURNEY).
- SESSION many–many PARTICIPANT via SESSION_PARTICIPANT; SESSION practices one CURRICULUM_ACTIVITY; SESSION and ACTIVITY_ATTEMPT both produce EVIDENCE; JOURNEY and SESSION both keep/create ARTIFACTs.
- PHASE requires MILESTONEs; MILESTONE evaluated by MILESTONE_EVIDENCE which EVIDENCE satisfies; JOURNEY earns ACHIEVEMENT_AWARDs warranted by MILESTONEs.
- PARTICIPANT–RELATIONSHIP–PARTICIPANT; RELATIONSHIP has CONVERSATIONs which have MESSAGEs.
- SESSION optionally scheduled by BOOKING; BOOKING optionally paid by PAYMENT; SESSION optionally settles a CREDIT_SETTLEMENT which posts WALLET_ENTRYs owned by PARTICIPANTs.
- PARTICIPANT initiates SAFETY_ACTIONs and grants CONSENT_RECORDs; SESSION requires CONSENT_RECORDs.

### Required entity invariants (verbatim responsibilities table)
| Entity | Required invariants |
|---|---|
| `ParticipantLanguage` | One row per language+relationship: **home, nurtures, learning, or heritage**; proficiency and dialect are optional attributes, never inferred from a flag |
| `Journey` | Exactly one target language; owns phase, minutes, words encountered, artifacts, attempts, achievements; **changing the active target never moves progress between languages** |
| `PhaseEnrollment` | Start/end state, readiness evidence, mentor/nurturer relationship, phase-specific plan; Phase 6 stays open-ended |
| `CurriculumActivity` | Canonical ID, phase/subphase, prerequisites, role instructions, supported languages, **content version**, required artifacts, evidence rules |
| `Session` | Real start/end timestamps, activity, target language, participants, consent, attendance, completion state; **a booking is not attendance** |
| `Evidence` | Server-created or server-accepted record (correct nonverbal selections, nurturer-confirmed session, recording, clarified story, retelling); **never just a client-supplied hour total** |
| `Artifact` | Versioned Talking Picture Dictionary, audio sample, word log, listening-library item, story, retelling, or reflection — with owner and consent policy |
| `AchievementAward` | **Dated and immutable**; cites the milestone/evidence that earned it; scoped to a journey unless genuinely account-wide |
| `Relationship` | Explicitly accepted connection with block/report state; map visibility and messaging require consent |
| `Payment` / `CreditSettlement` | Provider webhook + attended session are authoritative; idempotent; **cannot be minted by a client** |
| `SafetyAction` | Report, block, mute, moderation result, appeal, audit history with access controls |

### Cross-system event graph ("how the app governs itself")
Every important action publishes one domain event; downstream systems respond; retries stay idempotent:
- `Activity attempt accepted` → **Evidence recorded**; `Session attended` → **Evidence recorded**.
- Evidence → **Journey progress recalculated** and **Milestone evaluated** → **Achievement awarded**.
- Session → **Credit/payment settlement** and **Relationship history updated**.
- Progress → **Next activity recommended** and **privacy-safe product analytics event**.
- `Block/report action` → **Discovery/message/call access changed**.

"Each visible result comes from an authoritative fact."

---

## 7. End-to-end user journeys (normative UX specs with success definitions)

### 7.1 Visitor → first meaningful comprehension (10 steps)
1. One clear promise: understand and speak through people, shared context, a child-like comprehension-first sequence. 2. "Start growing" opens **sign-up, not sign-in**; role/campaign context survives authentication. 3. Before personal data is requested, the app explains **grower / nurturer / home language** in the visitor's interface language. 4. Home-language selection searches **English names and endonyms**; keyboard + screen-reader complete. 5. Exactly one initial target; only beta-supported targets selectable; upcoming languages labeled and collect interest. 6. Motivations, interests, city-level location, daily availability, exchange openness — optional steps say why the data helps and can be done later. 7. Immersion defaults to gradual with a preview of what changes later. 8. Completion screen states the first action plainly: **"Listen, then point. You do not need to speak."** 9. First activity introduces **two concrete items**, says each no more than needed, asks a randomized comprehension question, adds one item only after reliable understanding. 10. Completion records an actual attempt + unique encountered items; dashboard recommends the next activity and explains the first human session.
**Success definition:** the person can describe what to do, completes one comprehension activity without translation, and knows how to continue.

### 7.2 First nurturer relationship (8 steps)
Only verified, available nurturers for the active language + appropriate phase → profile distinguishes native variety, city/region, availability, verified status, method training, paid rate, exchange preference → grower books a **curriculum-specific session, not a generic call** → both parties see the same activity plan, required objects/cards, recording policy, roles → call performs device/network checks, confirms consent, keeps block/report reachable → nurturer follows phase-appropriate pacing (**Phase 1A never asks the grower to repeat or read**) → both confirm attendance; nurturer records simple evidence; app saves permitted artifacts → **only then** do progress, achievement, credit, payment, recommendations update.
**Success definition:** a stranger can become a safe, accountable nurturer relationship, and the learning record proves what occurred.

### 7.3 Ongoing growth loop (the product's core cycle)
Prepare with pictures/objects → Participate (human special-growth session) → Capture evidence + recording → **Re-live the recording** → Re-encounter words in new context → Reflect (see evidence-backed growth) → Receive the next phase-right recommendation → Prepare again.
The dashboard must answer four questions without exploration: **What am I growing into? What do I do next? Who am I doing it with? What changed because of my last participation?**

### 7.4 Adding another target language later
"Add a language journey" offered only after onboarding → new zeroed journey → switching active language changes curriculum, nurturers, recordings, achievements, recommendations, weekly activity, and immersion context **together** → account-wide settings and home languages stay shared → existing progress is never copied into the new target and never overwritten when switching back.

### 7.5 Nurturer journey (normative)
1. Nurturer chooses every language and variety they can genuinely nurture — **not inferred from all home languages**. 2. Identity, adult eligibility, location, variety, availability, payment/exchange preferences are verified. 3. Training demonstrates GPA principles and includes **observed practice, not a self-issued client quiz alone** (directly indicts the current 6-question quiz in `/nurture/training`). 4. Certification is issued by an authorized reviewer, versioned to a method curriculum, can expire or be suspended. 5. Phase-specific session plans; nurturers **cannot accept phases they are not cleared to guide**. 6. Session evidence, grower safety, attendance, reviews, disputes, credits, payouts all update from server records.

### 7.6 Exchange and community journey (normative)
Discovery only after explicit opt-in → matching by complementary languages, timezone, availability, goals, phase, and safety — "not a permanently 'online' seed flag" → request accepted before messaging/calling → block/report ends discovery+message+call access immediately in both directions → group events identify host, capacity, language, phase suitability, conduct rules, and a real room or physical location → community contribution "must never fabricate social proof."

---

## 8. Six-phase curriculum fidelity audit

### Program boundary
The research prescribes **1,500 recommended hours of special-growth participation across Phases 1–5**, then an ongoing Phase 6. `src/lib/phases.ts` models 100 + 150 + 250 + 500 + 500 with Phase 6 at hour 1,500 — "the correct top-level boundary. It **must not be converted back into a 2,000-hour finite course**." (Implies an earlier 2,000h model existed.)

### Phase-by-phase: research-faithful structure vs. required evidence vs. current status
| Phase | Research-faithful structure | Required product evidence | Current status + risks (2026-07-13) |
|---|---|---|---|
| **1 — Connecting** (0–100h) | 1A: meetings 1–15, 30–40h, listening + nonverbal response, first 300+ words. 1B: meetings 16–40, ~50–60h, more listening + constrained two-way interaction, another 600+ words. Start with two items, add one at a time, randomize, newest/weakest most often. No writing; no forced production; no translation as practice mechanism. | Correct pointing/acting/arranging; unique word encounters; session sample; Talking Picture Dictionary; re-living activity; **nurturer confirmation**; only late-1B speaking evidence. | "The richest implementation." Vocabulary/listening/speaking/repeat games + Dirty-Dozen session exist. Speaking/repeat routes gated until 40h; 1A vocabulary hides written target words; acceleration requires demo flags. **Client-only completion still undermines authoritative evidence; the complete 40-meeting progression is not encoded.** |
| **2 — Emerging** (100–250h) | 2A 50h grower-led wordless-picture discussion; 2B 75h nurturer-led story-building + recording clarification; 2C 25h life stories with simple drawings (postpone if too hard). Small talk grows naturally. | Wordless story pages, recorded whole story, clarification checkpoints, word–sentence–word items, re-listening, retelling, autobiographical picture story. | **`phases.ts` displays 50/80/20, conflicting with research 50/75/25** (re-verified in the live tree 2026-07-16: `"~50h"/"~80h"/"~20h"` at phases.ts lines 253/261/269). Preview-only; no durable story builder, clarification loop, listening library, or life-story artifact. |
| **3 — Becoming Knowable** (250–500h) | 3A 100h bridge stories, scripts of life, action cartoons, shared experiences, massaging; 3B 75h host stories + deliberately wider relationships; 3C 75h more abstract/expository familiar topics. Reading may become possible — not automatic day one. | Original + massaged recordings, bridge/host story library, retellings, shared-experience record, scripts-of-life set, vocabulary log, evidence of increasingly varied relationships. | **`phases.ts` collapses 3A/3B/3C into two 125h parts — "not a faithful representation"** (re-verified: two `"~125h"` parts, lines 372/380). Preview-only; record-and-massage and host-story workflows are descriptive only. |
| **4 — Deep Personal Relationships** (500–1,000h) | 500 **flexible** hours with mentors; three major activities (life stories, walk-of-life conversations, detailed observation) plus earlier-phase supplements. Research explicitly asks participants to set a **personal distribution**; it does not mandate 200/200/100. | Mentor relationships, consented life-story recordings, clarification notes, vocabulary recordings, observation reports, walk-of-life topic map, reciprocal sharing, feedback recordings. | **The fixed 200/200/100 parts are "a product invention"** — must be labeled "example plan" or made configurable (re-verified: `"~200h"/"~200h"/"~100h"`, lines 475/483/491). Preview-only. Deep relationship, mentor, and sensitive-recording safeguards are not modeled. |
| **5 — Widening Understanding** (1,000–1,500h) | 500h centered on native-to-native discourse. Rough guidance: clarify 100–125 recorded hours (~3 hours per recorded hour); up to 100–200h of ordinary host social life may count, but ordinary interaction cannot replace supercharged work. Native-to-native material belongs here because it is finally in the growth zone. | Rights-cleared discourse recordings, provenance, line-by-line clarification state, vocabulary harvest, next-day retelling, re-listening history, mentor notes, community-of-practice participation. | Collect/Clarify/Belong splits (60/320/120 in the tree) are "useful product scaffolding but not research-mandated allocations." No native-media rights/provenance system, discourse clarification player, or listening library. **"Showing fast native media too early would violate the temporal logic of GPA."** |
| **6 — Ever Participating** (1,500h+) | Ongoing lifestyle participation; targeted 100/300-hour pushes and remedial tools remain available. **"Phase un-6" = the plateau where participation no longer produces growth.** | Host-hours audit, needs analysis, community participation, targeted discourse plan, periodic self/mentor review, remedial projects, contribution as a nurturer. | Working tree correctly moves Phase 6 to `ongoing` with zero fixed hours. Most Phase 6 activities remain descriptive. **No finite completion badge; never imply a user is "done."** |

### Research-fidelity implementation rules (7 rules)
1. **Canonical activity IDs in `phases.ts` must be the same IDs** written by practice, session, evidence, recommendation, and achievement systems. (Currently violated: the session room logs synthetic `live-{nurturer}-{n}` ids, and games log `maintenance-*` ids outside Phase 1 — see app-implementation.md §4–5.)
2. **A route is not a curriculum implementation.** Every playable activity needs its own instructions, prerequisites, nurturer behavior, grower behavior, artifacts, evidence, accessibility behavior, and supported-language matrix.
3. Activity availability must depend on phase/subphase readiness — Phase 1A cannot expose Power Phrases, repetition, marketplace role-play, or written-word study as the default next step.
4. **Placement may recommend a starting activity but must not grant hundreds of hours, vocabulary, relationships, artifacts, or achievements that never occurred.** (Note: `placement.ts`'s `placementSeed` grants `hoursLogged = phase.startHour` and `WORDS_AT_START = {2: 1000, 3: 2200}` — currently dead code, but if wired up as-is it would violate this rule.)
5. AI can help prepare content, generate prompts, or support solo re-living. It **cannot be represented as the host community or silently stand in for evidence of a human relationship**.
6. Milestones should describe what a grower and host person can now do together; hour thresholds support pacing but cannot be the only proof.
7. **A content capability registry must determine which language supports which activity, audio variety, cards, captions, nurturer pool, and phase. Never silently fall back to Spanish.**

### Rights and attribution gate (P0-08 expanded)
The research files allow informal copying/distribution but require permission for formal publication or translation. "A commercial or publicly distributed app is not safely assumed to be informal distribution." Before public beta: (1) written permission covering digital publication, adaptation, translation, commercial use, attribution, and future updates; (2) record the grant, restrictions, permitted excerpts, and attribution text in the repo or legal system; (3) review every long curriculum description and translation against the grant; (4) add in-product attribution + methodology disclaimers; (5) never describe Nurilang as officially endorsed unless the permission explicitly says so.

---

## 9. Findings by priority (the full register)

Status vocabulary: **Open** (blocker remains) · **In progress** (code exists; verification/migration incomplete) · **Locally remediated** (unsafe default corrected + locally verified; deployment/expansion gates remain) · **Prototype** (demo, not production behavior).

### P0 — blocks any open beta
| ID | Finding | Evidence / paths | Required closure | Status |
|---|---|---|---|---|
| P0-01 | Account ownership + cross-account isolation need full verification; earlier profile/call/credit APIs accepted client-supplied identity or weak participant checks | `convex/profiles.ts`, `convex/calls.ts`, `convex/credits.ts`, `CloudProfileBridge.tsx` | Identity now auth-derived; participant checks tightened; local account/journey switching passed. Add forged-ID security tests, shared-browser tests, migration tests, deployed verification | **In progress** |
| P0-02 | **Progress is not authoritative learning evidence** — a client can call completion, accelerate timers, repeat attempts, submit totals | `src/lib/store.tsx`, session page, nurture page | Remove demo acceleration outside demo builds; server attempts/evidence; cap+validate values; make session attendance authoritative; idempotency | Open |
| P0-03 | Interface could imply examples are real people/activity | `nurturers.ts`, session/forum/events pages | Seeded people + simulated human activity removed from default build or demo-flagged. Audit production flags; never enable live claims without account-backed records | **Locally remediated** (narrow pilot) |
| P0-04 | Unsupported targets could receive wrong practice content | `languages.ts`, `practice/shared.tsx`, session/nurture fallback code | New + legacy routes avoid silent Spanish borrowing. Complete capability registry, user-facing availability states, native content/audio review before expanding | **Locally remediated** (narrow pilot) |
| P0-05 | Phase 2–6 course descriptions overstated executable coverage | `phases.ts`, courses pages, generic `practiceHref` routes | Phases 2–6 now preview-only without start actions. Build phase-specific engines/artifacts/evidence/human-session plans before enabling | **Locally remediated** (narrow pilot) |
| P0-06 | Stranger discovery, messaging, calls, events lack complete trust-and-safety | world page, `convex/messages.ts`, `convex/calls.ts`, `convex/parties.ts` | Default-off across UI/middleware/server with initial report/block enforcement. Before enabling: 18+ enforcement, conduct rules, moderation queue, accepted-relationship controls, call controls, audit log, incident runbook, privacy controls, TURN/reliability, support owner | **Locally remediated only by keeping features off** |
| P0-07 | Commerce/credits not production-authoritative | `credits.ts` (lib + convex), wallet/marketplace | Default-off; client-authored credit changes blocked. Before enabling: payment webhooks, attended-session settlement, idempotency, nonnegative balances, refunds/disputes/payouts, tax/KYC review | **Locally remediated only by keeping commerce off** |
| P0-08 | **GPA publication/adaptation rights unresolved in-repo** | research notices; `docs/THOMSON-PERMISSION-EMAIL.md` (draft, not proof) | Written grant reviewed by counsel/owner; attribution + translation terms implemented | Open |
| P0-09 | Production can be misconfigured or degrade into a keyless demo | `Providers.tsx`, `middleware.ts`, `SETUP-BACKEND.md` | Local production build now **fails closed** unless explicit demo chosen. Deployed smoke test must verify Clerk, invitation policy, Convex, redirects, sync, all flags | **In progress** |
| P0-10 | No automated end-to-end release suite for the core journey | none found | Local mobile journey passed (onboarding, 1A, progress, journey switching, route guards). Automate + extend through deployed sign-up, persistence, booking, attended human session, evidence, account switching, failure recovery | **In progress** |

### P1 — required for a credible closed beta and retention read
| ID | Finding | Required closure |
|---|---|---|
| P1-01 | Per-language progress works locally, needs normalized server model + migration | Migrate legacy scalar profiles; server-owned journeys; cloud-conflict tests; verify artifacts/recommendations/immersion across devices |
| P1-02 | Onboarding has no durable server draft/resume | Server draft per account; resume exact step across devices; explain why optional context helps (returning local profiles now prefill; destructive reset path removed) |
| P1-03 | Guest/auth localization + externally hosted account branding incomplete | Localize pre-profile screens, sign-in/up validation, invitations, support; verify Nurilang on Clerk-hosted screens + transactional email |
| P1-04 | "Both" role semantics infer nurturing languages too broadly | Ask nurturing languages directly; keep `known` / `nurtures` / `learning` separate |
| P1-05 | Immersion previously defaulted to full target-language UI | Gradual default shipped + locally passed; verify preview/escape route across devices; complete native RTL testing. **In progress** |
| P1-06 | Achievements can overclaim comprehension when hours-based | Tie awards to evidence; honest dated wording; per-journey; remove all visible streak language. **In progress** |
| P1-07 | **The complete Phase 1 meeting sequence is not encoded** | Build meetings 1–40 with subphase gates, materials, randomization rules, nurturer script, artifacts, evidence, content QA |
| P1-08 | Audio coverage + dialect quality uneven | Human QA by language/variety; normalized levels; complete cue/question/answer set; honest fallback description; **no device voice in paid claims without disclosure** |
| P1-09 | Forum/event state not durable or governed (default-off) | Keep disabled until server persistence, ownership, edit/delete, moderation, reporting, capacity, cancellation, timezone, real room/location |
| P1-10 | WebRTC is a signaling prototype, not a reliable call product (default-off) | Keep disabled until accepted-relationship authorization, TURN, device selection, preflight, mute/camera state, reconnect, denial handling, ringing/decline, abuse controls, quality telemetry |
| P1-11 | **Prototype nurturer studio can self-issue certification** (default-off) | Keep disabled until training version, observed assessment, reviewer identity, status audit, suspension, recertification, and phase scope are server-owned |
| P1-12 | Accessibility needs full WCAG verification | Focus-visible + reduced-motion baselines added. Complete keyboard-only critical paths, screen-reader names, dialog focus traps/return, globe access, contrast, touch targets, RTL, captions/transcripts where method-appropriate |
| P1-13 | Product analytics, error monitoring, support ops absent/incomplete | Consent-aware funnel events, error monitoring, session health, release dashboards, support inbox, data dictionary, alert owner |
| P1-14 | SEO foundation + brand identity need production completion | Canonicals/robots/sitemap/manifest/metadata/structured data/Nurilang naming done + pass local prod build. Add social assets, legacy-domain redirects, indexable method pages, deployed canonical/robots checks, Search Console, consent-aware analytics. **In progress** |
| P1-15 | Translation tables structurally broad, need native review + semantic testing | Native review of onboarding, safety, billing, curriculum guidance; placeholder tests; RTL screenshots; dialect labels; **no flag-only identity** |

### P2 — expansion after the first loop retains people (11 items)
Full Phase 2 story builder + clarification player + listening library · full Phase 3 record-and-massage + shared-story library · Phase 4 mentor relationship + consented deep-life archive · Phase 5 native-discourse rights/provenance + clarification tooling · Phase 6 needs-analysis + host-hours planning · small cohorts/group sessions (the original GPA group context) · offline-first/PWA for pictures + listening artifacts · richer character behaviors tied to method moments · verified user-created content with review/licensing/language-quality workflows · nurturer marketplace ops, payouts, disputes, regional pricing · referral/ambassador/creator programs only after retention + safety metrics are healthy.

---

## 10. Beta acceptance criteria (release-gate checklists)

Framing rule: **"No P0 criterion may be waived by labeling the release 'beta.' Beta permits rough edges; it does not permit false people, insecure accounts, unsafe calls, or fake money."**

### 10.1 Identity and data (6 checks)
Signed-out users can read/mutate nothing account-scoped · User A cannot touch User B's data by changing any Clerk ID / Convex doc ID / call ID / profile ID / request payload · signing out clears account-scoped browser state; a second account on the same browser never sees the first's data · a transient cloud read failure shows a recoverable state and **never creates a fresh profile over mature data** · every mutation has server-side authorization, input bounds, idempotency where retries occur · account deletion removes/anonymizes profile, messages, media, safety, and economic data per retention policy.

### 10.2 Onboarding (9 checks)
Multiple home languages selectable · exactly one initial target · home vs target cannot be confused by wording/placement/state · only fully supported targets completable; upcoming targets get a transparent interest flow · `grower`/`nurturer`/`both` collect distinct required data · onboarding resumes after refresh, logout/login, network interruption · **user reaches a clear first action in under one minute after completion** · default immersion gradual; interface stays understandable · English + one non-Latin + one RTL interface pass native and usability review.

### 10.3 First learning loop (8 checks)
1A begins with listening/nonverbal response — no required speaking, reading, spelling, translation · engine starts with two items, adds one at a time · prompt ordering randomized, prioritizes new/weak items · wrong response → calm re-encounter, no loss/punishment · a word/card counts once as a unique encounter while repeat attempts remain available · **exact attempt duration recorded within bounded server rules; no production speed multiplier exists** · canonical activity IDs match course, attempt, evidence, achievement records · dashboard recommends the correct next 1A activity.

### 10.4 Human session loop (9 checks)
Every visible nurturer = a real verified account with truthful availability · booking selects language, phase, activity, date/time/timezone, duration, paid/exchange mode · both parties see preparation instructions + recording/behavior rules · preflight checks mic/camera/output/permissions/connection · **TURN fallback configured and tested on restrictive networks** · block/report/mute/end reachable · **recording off by default; explicit consent from every participant** · attendance/completion server-confirmed; an unattended booking awards no progress or credits · session evidence updates the correct journey **exactly once**.

### 10.5 Safety and community (7 checks)
18+ enforced · community standards, privacy policy, terms, safety guidance, reporting path published · exchange opt-out removes the user from others' discovery immediately · city-level map data never exposes precise location · **blocking is reciprocal across discovery, requests, messages, events, calls** · reports reach a staffed moderation queue with severity, evidence, response target, audit history · seed/demo content labeled, never mistakable for a real participant or testimonial.

### 10.6 Commerce (6 checks)
Marketplace/wallet routes unavailable until the commerce gate passes · **the payment-provider webhook — not the browser — creates purchased balance** · earned exchange credit only from an attended eligible session · spends idempotent, never negative · cancellation/no-show/refund/dispute/platform-fee/payout/tax/currency behavior documented + tested · nurturer rates and certifications server-owned and auditable.

### 10.7 Quality and operations (7 checks)
Production build/typecheck/backend checks pass from clean checkout · core journeys pass automated tests on mobile + desktop Chromium plus WebKit/Firefox smoke · no horizontal overflow at supported widths · keyboard-only + screen-reader smoke tests pass every critical journey · reduced motion removes nonessential movement · error monitoring captures route/release/anonymized failure context · **a rollback, incident, support, and data-recovery owner is named before invitations are sent**.

### Required end-to-end test matrix (10 scenarios)
1. English home → Russian target → 1A first activity → refresh → progress persists.
2. French + Arabic homes → Japanese target → RTL onboarding + gradual target exposure.
3. User A signs out; User B signs in on the same device; no data crosses accounts.
4. Cloud profile read fails, recovers, never overwrites existing progress.
5. Second target added post-onboarding; both journeys keep independent minutes, words, artifacts, achievements.
6. Upcoming language selected; **the app never loads Spanish content** and instead explains availability.
7. Exchange-disabled user is absent from another account's globe/search.
8. Unauthorized user tries to read a call, add ICE, message a profile, or mutate wallet state — all rejected and logged.
9. Real session booked, joined, completed, settled once; retrying the callback changes nothing.
10. Block during a call prevents later request, message, call, and discovery access.

---

## 11. Instrumentation and learning-health model

Purpose constraint: instrumentation answers whether people understand and participate meaningfully — "It must not turn Nurilang into the streak/XP system it rejects."

### Minimum funnel (12 ordered events)
`landing_viewed` → `signup_started` → `home_language_selected` → `target_language_selected` → `onboarding_completed` → `first_comprehension_attempt_started` → `first_comprehension_activity_completed` → `human_session_requested` → `human_session_booked` → `human_session_attended` → `second_session_attended` → `day_7_returned`.

### Event dictionary (with explicit exclusions)
| Event | Required properties | Must NOT include |
|---|---|---|
| `landing_viewed` | anonymous session, campaign, locale, device class | name, email, message text |
| `signup_started` / `signup_completed` | method, campaign, redirect destination | credential data |
| `home_language_selected` | count, language codes, step index | free-text biography |
| `target_language_selected` | language code, supported/waitlist state | inferred ethnicity |
| `onboarding_step_completed` | step ID, optional/skipped, elapsed bucket | exact city unless necessary |
| `onboarding_completed` | role, home-language count, target, daily-minutes bucket | raw motivation text |
| `activity_attempt_started` | journey ID, canonical activity, phase/subphase, content version | audio/video content |
| `activity_attempt_completed` | result/evidence type, bounded minutes, unique item count | raw answers when not required |
| `session_requested` / `booked` | language, phase, activity, paid/exchange, lead-time bucket | participant names |
| `session_joined` / `attended` | session ID, role, call quality bucket, duration bucket | media, message content |
| `artifact_created` | artifact type, journey, consent state | artifact contents |
| `milestone_awarded` | milestone ID, evidence type, journey | celebratory copy as data |
| `report_submitted` | surface, category, severity | report narrative in product analytics |

### Core outcome metrics (10)
- **Onboarding comprehension:** % of test users who can explain the next action without help.
- **Onboarding completion:** `onboarding_completed / signup_completed`.
- **First meaningful activity:** `first_comprehension_activity_completed / onboarding_completed` — within first session and within 24h.
- **Human connection:** `human_session_requested / onboarding_completed` and `attended / booked`.
- **Second-session rate:** second real session within 14 days / first-session attendees.
- **Evidence-backed return:** valid-activity returns on day 1 / 7 / 30.
- **Comprehension growth:** unique items correctly recognized across spaced contexts, with confidence + false-positive controls.
- **Relationship continuity:** % of growers who meet the same nurturer again and opt to continue.
- **Safety rate:** reports, blocks, call-abandons, substantiated incidents **per 100 human sessions**.
- **Content integrity:** unsupported-language fallbacks, missing audio, failed media loads — **target: zero silent fallbacks**.

### Guardrails
Do not optimize daily streak, raw time-in-app, tap counts, or notification opens as primary outcomes · do not count an open tab, accelerated timer, scheduled booking, or connected call as learning · separate **solo preparation minutes / human special-growth minutes / lifestyle participation / artifact review** · coarse consented analytics only; keep message, recording, call, and report content out of general product analytics.

---

## 12. Safety, privacy, and governance

**Launch posture:** adults only. Adding minors changes identity, consent, discovery, messaging, recording, moderation, and mandatory-reporting obligations — "a separate program with legal review."

**Required controls (13):** verified email/account for all, stronger identity checks for paid nurturers · explicit discovery/exchange opt-in, default off · city-level location only, delayed/coarse online status, no exact presence trail · connection request before DMs or calls · block/report/mute/end on every social surface · rate limits on requests, messages, calls, uploads, account creation · moderation queue with categories (harassment, sexual content, hate, scams, impersonation, payment, dangerous behavior, minor safety) · least-privilege staff roles with audited moderation actions · media size/type/duration validation, malware scanning, signed URLs, retention, deletion, consent · **call recordings off by default; per-participant consent stored against a specific session and purpose** · nurturer verification, method training, conduct agreement, complaints, suspension, appeal, recertification · data export/deletion, account closure, retention schedule, breach process, subprocessor list · incident runbooks for imminent danger, abuse, fraud, payment disputes, leaked PII, call failures.

**Character and AI disclosure taxonomy** — every surface must identify whether the current partner is one of five kinds: (1) a character or scripted guide, (2) an AI-generated/synthesized voice, (3) a prerecorded native speaker, (4) a seeded example profile, or (5) a live verified person. Characters must reinforce phase behavior: "Phase 1 Nuri celebrates correct pointing and reminds the grower that speaking is not required; it should not pressure repetition merely to make the app feel interactive."

---

## 13. Monetization design and release gates

Principle: "Money should fund human participation without corrupting the evidence model or manufacturing scarcity."

### Five-layer model to test
| Layer | User value | Limit | Release condition |
|---|---|---|---|
| Free method explorer | Onboarding, method explanation, small audited 1A picture/listening set, progress preview | Limited content set — "not fake progress or daily punishment" | Content QA + honest capability labels |
| Time exchange | Nurture a language you offer; earned time buys being nurtured | Balance earned only from mutually confirmed eligible sessions; fair cancellation/no-show rules | Safety, attendance evidence, server ledger, dispute workflow |
| Paid nurturer sessions | Verified human guidance, availability, phase-specific plan, artifacts | Price per session/hour; transparent platform fee; regional experiments | Payment webhook, payouts/KYC/tax, refunds, quality + safety ops |
| Optional membership | Planning, listening-library organization, offline access, group programs, support | Monthly/annual; "never the source of fabricated 'learning'" | Retention evidence + clear cancellation/value |
| Institutional cohorts | Churches, NGOs, universities, relocation, diaspora groups | Seats/cohort facilitation + reporting | Consent, group safety, admin roles, data-minimization review |

### Economic invariants (8)
1. The browser cannot mint paid or exchange credits. 2. A payment-provider webhook is the authority for purchased funds. 3. An attended eligible session is the authority for earned exchange time. 4. Booking, attendance, cancellation, refund, fee, payout, and credit movements share **one idempotent settlement ID**. 5. Balances cannot go negative without an explicit auditable debt policy. 6. Nurturer rates, certifications, payouts are server-owned. 7. Price/availability tests must not misrepresent who is real or imply a place is held when it is not. 8. **Never sell access to safety features, account data export/deletion, or the ability to report abuse.**

Paid acquisition rule: don't start until first-session and second-session rates prove value delivery — "Otherwise advertising buys confusion rather than growth."

---

## 14. SEO and launch-growth plan

### Brand + technical foundation
The product brand is **Nurilang** (maintained code, public metadata, user-facing docs already use it). Before production indexation: verify Clerk screens, transactional emails, support channel, and deployed structured data also use Nurilang; select **one production domain**; redirect or archive visible **LANGE** and **GPA-Language** legacy identities. Technical checklist: canonical origin/domain; unique titles/descriptions for home + every public method/language page; robots.txt, XML sitemap, web-app manifest, canonical URLs, OG/Twitter cards, share image; `Organization`/`WebSite`/`SoftwareApplication`/`Course`/`FAQPage`/`Event` structured data **only where visible content genuinely satisfies each schema**; server-rendered indexable public pages, non-indexed authenticated dashboards; clean redirects from old LANGE URLs; Core Web Vitals budget + bundle monitoring ("no giant authenticated client bundle on public pages"); Search Console + Bing + consent-aware analytics + error monitoring; **language alternates only after each public page is truly translated and reviewed — never auto-claim a locale from a partial table**; accessible headings, descriptive links, crawlable text, transcripts for public media.

### Content architecture — four clusters
- **Method cluster:** What is the Growing Participator Approach? · Comprehension before speaking · What is a language nurturer? · **The wall of noise and the iceberg principle** · The six phases (clearly separating methodology from what Nurilang currently supports) · How Talking Picture Dictionaries and re-living recordings work.
- **Use-case cluster:** family/heritage communities · relocation, missions, aid work, study, long-term community participation · how to find and work with a native-speaking nurturer · language exchange without correction drills.
- **Language cluster:** create a target-language page **only when there is audited content and real capacity**; each page states supported phase + meeting range, audio variety/dialect + recording provenance, available nurturer varieties + real availability, an example activity, pricing/exchange options, what's next. **"Do not publish thin programmatic pages for all 19 interface languages or every target in `LangCode`."**
- **Trust cluster:** how nurturers are verified/trained · recording + privacy rules · safety for exchange and calls · how progress is measured without streaks or XP · research basis, adaptation, permission, limitations.

### Organic social — 7 repeatable series
1. "The first two cards" (20–40s comprehension-first demos). 2. "Wall of noise moments" (a grower recognizes a phrase through context, with consent). 3. "Nurturer craft" (add-one-at-a-time, recasting, picture-based meaning). 4. "Myth vs method" ("Why Nurilang does not make a day-one grower repeat everything"). 5. "One artifact a week" (TPD, story recording, word log, listening library). 6. "Host-world stories" (culture without reducing it to trivia). 7. "Building in public" (transparent beta learnings; what remains a preview). CTAs must match capacity: join the pilot, apply as a nurturer, nominate a language community, read the method — **not "start every language today."**

### Partnerships
Diaspora/heritage organizations, immigrant/refugee support groups, churches/mission-training/aid organizations, universities/study-abroad, relocation and cross-cultural training providers, libraries/community centers, native-speaker educator networks, comprehensible-input/immersion creators. **Each pilot partner needs a written cohort goal, participant eligibility, target language, nurturer supply, safeguarding owner, data agreement, success metric, and exit-interview plan.**

### Paid advertising sequence (5 gates, in order)
1. Message test (qualified sign-up, not clicks) → 2. Activation test (onboarding + first comprehension activity completion) → 3. Human-session test (nurturer supply + first-session attendance absorb demand) → 4. Retention test (second attended session + day-7 evidence-backed return) → 5. Unit-economics test (include support, moderation, payment, refunds, nurturer acquisition, session failure — not just ad cost). First audiences: partner/community retargeting + high-intent searches for a specific supported language plus "conversation," "native speaker," "comprehensible input," "language exchange."

### Launch stages (6)
| Stage | Audience | Product surface | Evidence to advance |
|---|---|---|---|
| Internal dogfood | Team + trained nurturers | One language, first activities, manual sessions | Zero P0 security/data failures; clear first action |
| Supervised alpha | 10–20 invited adult growers | Phase 1A subset, staff-observed sessions | First activity + session completion; no serious safety incidents |
| Closed beta | 50–100 invited users, supply-capped | Complete Phase 1A + reliable artifacts | Second-session rate, day-7 return, content + call reliability |
| Language expansion | One new language at a time | Capability-gated | Native QA, full content/audio, nurturer supply, safety coverage |
| Paid beta | Verified demand + supply | Paid sessions/credits | Settlement, disputes, refunds, payouts, unit economics pass |
| Public beta | Capacity-tested | Public discovery + scalable onboarding | All P0 gates, support/moderation coverage, retention + reliability thresholds |

---

## 15. Prioritized implementation backlog (dependency-ordered, items 1–40)

Rule: "Do not build acquisition scale or later phases on top of insecure identity, ambiguous content coverage, or client-forgeable evidence."

### Containment already completed in the 2026-07-13 remediation pass
- Default-off gates across UI, middleware, and server functions for community exchange, nurture studio, forum/events, commerce, wallet, marketplace.
- Seeded people + simulated human claims removed from the default beta path (demo-config only).
- Phases 2–6 locked to method previews; Phase 1A direct-route, speaking, written-word, and demo-acceleration guards added.
- Local production fail-closed behavior, account-derived identity hardening, per-language journey isolation, exact progress updates, baseline safety checks, Nurilang metadata/crawl files, local build/browser verification.
- Explicitly framed as "containment and local-verification wins, not completion of the corresponding production systems."

### Wave 0 — make the product truthful and safe to test (items 1–9)
1. Pin + verify the deployed beta configuration (invitation-only, adults only, one audited language, Phase 1A, commerce/community/nurture off, no seeded data). 2. Finish server authorization verification (forged-ID, participant, admin, account-switch, abuse tests across profiles, people, requests, messages, calls/ICE, parties, artifacts, wallets, admin routes). 3. Finish account cache isolation (shared browser, session expiry, cloud errors, deletion). 4. Finish external product identity (Nurilang across Clerk, email, support, domains, redirects; retire legacy identities). 5. Resolve GPA rights (written grant, attribution, translation/adaptation policy). 6. Publish minimum legal/safety pages (terms, privacy, community rules, recording consent, report/support). 7. Audit every production flag + seed source (nurturers, forum, events, calls, ratings, session counts, presence, purchases, testimonials can never appear live without account-backed records). 8. Keep wallet/marketplace unavailable. 9. Automate + deploy release smoke tests (production config, invitation policy, adult acceptance, redirects, profile sync, build, typecheck, backend checks, rollback).

### Wave 1 — prove the first learning loop (items 10–20)
10. **Language capability registry** (activity/audio/cards/cues/nurturers/phase/version per target; remove Spanish fallback). 11. **Encode Phase 1A meetings 1–15** (canonical activity + meeting IDs, materials, pacing, adaptive re-encounter, artifacts, evidence). 12. **Server activity attempts + evidence** (exact bounded minutes, unique words, content version, idempotency, source). 13. Authoritative, regression-tested subphase gates (readiness enforced in server evidence, not just UI/routes). 14. **Talking Picture Dictionary** (session-linked pictures, numbered native recordings, consent, re-living mode). 15. Finish per-language journeys (legacy migration, normalized server storage, switching + cloud-conflict tests). 16. Evidence-backed achievements (derive from authoritative evidence; Phase 6 open-ended). 17. Complete onboarding operations (durable draft/resume, adult/invitation acceptance, role-specific languages, localized auth, native/RTL review). 18. Native-review launch content (all UI, cards, cues, audio, safety, onboarding in pilot languages). 19. Complete accessibility pass to **WCAG 2.2 AA** (semantics, keyboard, dialogs, screen readers, contrast, target size, globe access, RTL). 20. Instrument the activation funnel (consent, event dictionary, dashboards, errors, support intake).

### Wave 2 — prove safe human participation (items 21–27)
21. Verified nurturer operations (application, identity, language variety, **observed assessment**, review, suspension). 22. Real availability scheduling (timezone, conflicts, reschedule, cancellation, reminders). 23. Real session room (shared curriculum state, device preflight, TURN, reconnect, role-aware controls, no simulated human state). 24. Consented artifacts + attendance (both-party confirmation, session evidence, recording rules, retention/deletion). 25. Report/block/moderation (cross-surface enforcement, rate limits, queue, audit, incident runbooks). 26. **Connect the graph** (attended session updates journey, artifacts, relationship, achievement, analytics **exactly once**). 27. Run supervised cohorts (observe first sessions, interview both roles, publish findings internally).

### Wave 3 — durable community and economics (items 28–32)
28. Persist forum/events with governance. 29. Improve matching (complementary language, goals, phase, availability, variety, trust, explicit exchange consent). 30. Authoritative settlement (payment webhooks, exchange credits, fees, payouts, refunds, disputes, KYC/tax). 31. Test pricing without compromising learning (paid human help, optional membership, institutional cohorts). 32. Complete technical SEO + truthful public method/language pages.

### Wave 4 — expand the curriculum, one complete phase at a time (items 33–40)
33. Phase 1B constrained production + real marketplace role-play. 34. Phase 2 wordless story builder, clarification, life-story artifacts. 35. Phase 3 bridge/host stories, record-and-massage, social expansion. 36. Phase 4 mentor relationships, deep-life archive, **configurable** activity allocation. 37. Phase 5 rights-cleared native discourse + clarification library. 38. Phase 6 host-hours, needs analysis, remedial projects, becoming a nurturer. 39. Groups/cohorts, offline artifacts, PWA, "notifications that invite without guilt." 40. Add one language only when its complete capability + supply checklist passes.

---

## 16. Definition of "ready to invite learners" (explicitly NOT yet met)

The audit states the local baseline proves the solo onboarding + Phase 1A comprehension path but not the verified-human, production, safety, rights, and support portions. Nurilang is ready for first real invitations when a new adult can:

1. recognize the Nurilang brand and sign up without losing campaign/role context;
2. choose multiple home languages and exactly one supported target;
3. understand the method and next action in their own interface language;
4. complete a research-faithful Phase 1A comprehension activity without speaking, reading, or translation;
5. return on another device and see the correct journey, evidence, and recommendation;
6. meet a real, verified nurturer through a safe, reliable, phase-specific session;
7. create and re-live a permitted learning artifact;
8. receive progress and an achievement **only because evidence warrants it**;
9. block/report, manage consent, export/delete data, and reach support;
10. see no fake person, fake purchase, fake call, wrong-language fallback, or inaccessible critical control.

Public beta comes only after that loop is "reliable, retained, moderated, and economically supportable." Closing line of the audit: "The competitive advantage will not come from being more addictive than Duolingo. It will come from making genuine comprehension and human belonging easy enough to begin—and structured enough to continue."

---

## 17. Reconciliation with the existing KB reports

### 17.1 Naming
The product/brand is **Nurilang** (audit title, §13.1 brand foundation, P1-14, Wave 0 item 4). "Nuri" is the mascot/AI nurturer (`id: "ai"`), not the product name. KB reports titled "Nuri App" / "Nuri Knowledge Base" should be read with this correction; legacy identities **LANGE** and **GPA-Language** are slated for redirect/archive.

### 17.2 Claims the audit UPDATES or supersedes in `app-implementation.md`
- **Release framing:** app-implementation.md documents mechanics as ground truth without release status. The audit overlays status: client-side `completeActivity()` progress = **P0-02 Open** ("not authoritative learning evidence"); the store's minute clamping (0..240) is necessary but insufficient — server attempts/evidence, attendance authority, and idempotency are still required.
- **Phase part hours are known-wrong vs research and flagged for correction:** Phase 2's encoded ~50/~80/~20 conflicts with research 50/75/25 (P0-05 family; re-verified 2026-07-16 in `phases.ts` lines 253/261/269). Phase 3's two ~125h parts are "not a faithful representation" of 3A 100 / 3B 75 / 3C 75. Phase 4's ~200/~200/~100 is "a product invention" that must be labeled "example plan" or made configurable. Phase 5's 60/320/120 is scaffolding, not research allocation. Any KB statement presenting these part-hours as curriculum truth must carry this caveat.
- **`betaPreview` / `executablePhase = id===1` gating** documented in app-implementation.md is the audit's P0-05 **locally-remediated containment**, verified 2026-07-13 including direct-URL bypass attempts — i.e., it is a deliberate release boundary, not an unfinished feature.
- **Spanish fallback nuance (partially conflicting claims to track):** the audit (P0-04, 2026-07-13) says new-target selection is constrained to the content registry and legacy unsupported routes return to language selection "rather than borrowing Spanish," and its E2E matrix demands "the app never loads Spanish content." app-implementation.md (verified 2026-07-16) still documents `useContentLang()` in `practice/shared.tsx` falling back to the Spanish deck **with a banner** for the 9 non-`FULL_CONTENT_LANGS` languages, and `sessionFlow.ts` deck fallback. Reconciliation: the audit's remediation removed *silent* borrowing and blocked unsupported *targets* at selection; a labeled in-practice fallback apparently persists. The capability registry (Wave 1 item 10) is the designated full fix. Treat "no Spanish fallback" as an aspiration/gate, not current behavior.
- **40-meeting progression:** app-implementation.md's `meetingForHours()` (hours→meeting number 1..40) is a pacing shim; the audit states "the complete 40-meeting progression is not encoded" (P1-07: build meetings 1–40 with subphase gates, materials, randomization rules, nurturer script, artifacts, evidence). The meeting-numbered vocab domains in `vocab.ts` are inputs, not the sequence itself.
- **placement.ts:** app-implementation.md found it dead code. The audit's fidelity rule 4 (placement "must not grant hundreds of hours, vocabulary, relationships, artifacts, or achievements that never occurred") means `placementSeed`'s `hoursLogged = startHour` + `WORDS_AT_START {2:1000, 3:2200}` design would need rework before it is ever wired in.
- **Bookings:** the audit's implementation map confirms bookings live as an **array in the profile** (client-authored), with the explicit non-authority edge "bookings are not reliably settled to attendance."

### 17.3 Claims the audit UPDATES or supersedes in `nurturer-side.md`
- **The entire Nurturer Studio is default-off in the beta build** behind `NEXT_PUBLIC_ENABLE_NURTURER_STUDIO` (verified in `src/lib/featureFlags.ts`), with matching server-side gates. nurturer-side.md §3 describes the role-gate + training-gate flow as if reachable; in the default beta configuration the studio path is hidden/redirected entirely (2026-07-13 verification bullet).
- **The training quiz is formally indicted:** P1-11 — "The prototype nurturer studio can **self-issue certification**"; keep disabled until training version, observed assessment, reviewer identity, status audit, suspension, recertification, and phase scope are **server-owned**. Journey 6.5 requires "observed practice, not a self-issued client quiz alone." The `/admin/nurturers` spot-check roster does not satisfy this.
- **Seeded roster:** nurturer-side.md's 17 demo nurturers are P0-03's subject; their `methodCertified`, `growersNurtured`, `ratePerHourUsd`, online status, and `phasesGuided` must never render as live claims without account-backed review + scheduling records. Locally remediated only via the `NEXT_PUBLIC_ENABLE_SEEDED_NURTURERS` default-off flag.
- **Credits:** nurturer-side.md's observation that `convex/credits.ts` `recordEntry` throws is confirmed as deliberate P0-07 containment; the full closure list is payment webhooks, attended-session settlement, idempotency, nonnegative balances, refunds/disputes/payouts, tax/KYC.
- **Calls:** the WebRTC signaling stack is P1-10 — "a signaling prototype rather than a reliable call product"; stranger calls default-off; the closure list (TURN, preflight, reconnect, ringing/decline, abuse controls, telemetry) extends nurturer-side.md's `CONVEX_SYNC`/single-device notes.
- **Nurturer language semantics:** P1-04 + journey 6.5 require `known` / `nurtures` / `learning` as separate relationships asked directly — the "both role infers nurturing languages too broadly" finding refines nurturer-side.md's `nurtureLangs` description.

### 17.4 Net-new material found in no other KB report
The 12-rule product doctrine (§4); the source-of-truth ordering rule + ROADMAP/AGENT_BRIEF trust warnings (§3); the target data model with entity invariants and the domain-event graph (§6); the six journeys with success definitions and the dashboard's four questions (§7); the full P0/P1/P2 register with dated statuses (§9); the seven acceptance-criteria checklists + 10-scenario test matrix (§10); the analytics funnel/event dictionary/metrics/guardrails (§11); the safety-control list and five-way AI-disclosure taxonomy (§12); the five-layer monetization model + eight economic invariants (§13); the SEO/content/partnership/ads/launch-stage plan (§14); the 40-item dependency-ordered backlog (§15); the 10-point readiness definition (§16); the GPA rights problem (P0-08, Thomson email is an unsent draft); the 2026-07-13 verification record including the 839→173 kB landing bundle reduction and the 12/13 design-audit result (§2).
