# Nuri Onboarding Audit — Current Flow + Root Cause of the "Normal Language" Failure

Repo: `/Volumes/LaCie/GPA_Language_Learning` (all paths below relative to repo root).
Audited: 2026-07-21. Flow file: `src/app/onboarding/page.tsx` (1,338 lines, `STEP_COUNT = 9` at `src/app/onboarding/page.tsx:38`).

---

## 0. How a user reaches onboarding (handoff)

- `/onboarding` is a **protected route** (`src/middleware.ts:60`). An unauthenticated visitor hitting it is redirected to **`/sign-up`** (not `/sign-in`) with `redirect_url` preserved (`src/middleware.ts:89-96`, the `isOnboarding(req) ? "/sign-up" : "/sign-in"` branch at line 91).
- Sign-up is a stock Clerk `<SignUp>` card (`src/app/sign-up/[[...sign-up]]/page.tsx:6-40`) whose header copy already promises the two language questions: *"Create your Nurilang account, then choose every language you call home and one language to grow next."* (`src/app/sign-up/[[...sign-up]]/page.tsx:15-17`).
- After sign-up, Clerk returns the user to `/onboarding`; the wizard waits for `accountReady` (Convex cloud state `"ready"`, `src/app/onboarding/page.tsx:516-517`, spinner at 733-739) before rendering step 0.
- **Key fact for endowed progress:** by the time the user sees step 1 of 9, they have already created an account, typed an email + password, and (usually) a name in Clerk — and the progress dots still show them at 0% (`src/app/onboarding/page.tsx:139-155`, counter `1 / 9` at line 763). None of that Clerk data (e.g. `user.firstName`) is read by onboarding.

---

## 1. Complete step map of today's flow

Progress UI: 9 dots, current dot violet, past dots lime, future dots dim (`Dots`, `src/app/onboarding/page.tsx:135-157`); numeric counter `{step+1} / 9` (line 763). Back/Continue footer at 1254-1302. The CTA relabels to **"Skip for now"** when an optional step is left blank (`inviteStepEmpty`, lines 604-609, CTA branch 1278-1284).

| # | Question (exact EN copy) | Input type | Writes to profile | Required? | Prefill today / could be |
|---|---|---|---|---|---|
| **0** | H1: **"I'm Nuri."** (`i18n.ts:485`) + tagline "Nuri grows you into a language the way children grow into their first — with a real person, picture cards, and **zero translation**." (`i18n.ts:486-488`). Cards: **"I want to grow into a language"** / **"I want to nurture growers"** / **"A bit of both, please"** (`i18n.ts:489-493`) | Role cards, single-select (nurturer card + "both" pill only when `NURTURER_STUDIO_ON`, page 826-860) | `role` (`finish()` page 697) | Yes (`valid` page 613-614) | `?role=` query param preselects (page 522-526). When studio flag is OFF there is only ONE choosable role — the step could auto-select `grower` and merge into the welcome screen. |
| **1** | Nuri bubble: **"Your roots feed everything you'll grow."** (`i18n.ts:494`). H1: **"Which languages do you already live in?"** (`i18n.ts:495`). Sub: **"Pick every language that feels like home — choose as many as you like."** (`i18n.ts:496`) | **Multi-select** flag chips, all 19 `LANGUAGES` (page 874-883; `languages.ts:3-23`) | `knownLangs` (page 698) | Yes, ≥1 (page 615-616) | English preselected (page 527); browser locale overrides to `[detectedLang]` via `navigator.languages` (page 537-547). Could be a **confirm-one** prefill instead of an open multi-select. |
| **2a** (grower/both) | Nuri: **"Pick a world — I'll come with you."** (`i18n.ts:497`). H1: **"Which world will you grow into?"** (`i18n.ts:498`). Sub: **"One to start. Pictures and voices will carry the meaning — never translation."** (`i18n.ts:499`) | Single-select flag cards — only languages **not in `knownLangs`** and in `FULL_CONTENT_LANGS` (10 langs, `languages.ts:29`; filter page 898-902) | `targetLang` (page 699); picking clears any earned placement (page 655-659) | Yes (page 617-618) | `?role=grower` deep links could carry a `?lang=`. For `addLanguage=1` re-entry, flow starts here (page 519). |
| **2a′** (branch, not a step) | Placement offer card: **"Grown in {Language} before?"** (`i18n.ts:559-560`) / **"Show us your roots — ears only, no reading."** (`i18n.ts:558`), CTA **"I'm ready — let's listen"** (`i18n.ts:563`) | Full-screen `PlacementCheck` overlay (page 915-949 card; overlay mount 1306-1317) | `placedPhase` held locally; applied in `finish()` as `placementSeed(phase)` + `meetingProgress` parked at last populated meeting (page 684-691) | No — offered only when `placementAvailable(targetLang)` and journey is fresh (page 593-602) | n/a |
| **2b** (nurturer-only) | H1: **"Which of your languages can you nurture?"** (`i18n.ts:504`), sub `i18n.ts:505` | Multi-select chips drawn **from `knownLangs`** (page 953-977) | `nurtureLangs` (page 674, 700) | Yes ≥1 (page 617-618) | — |
| **3** | Nuri: "Every garden grows somewhere." (`i18n.ts:506`). H1: **"Where are you growing from?"** (`i18n.ts:507`). Sub: "So kindred voices can find you on the world map. Totally optional…" (`i18n.ts:509`) | **Two free-text inputs** (City / Country, page 989-997) | `city`, `country` (page 703-704, saved only if non-empty) | No (page 621-623) | Nothing today. Could infer country from `Intl.DateTimeFormat().resolvedOptions().timeZone`; city left blank-to-confirm. |
| **4** | Nuri: "There's no wrong reason — only yours." (`i18n.ts:516`). H1: **"Why {Español}?"** (`i18n.ts:518-519`). Sub: "Your reason shapes the journey — and helps a nurturer meet you where you are." (`i18n.ts:520`) | Multi-select cards, 6 `MOTIVATIONS` (`onboardingOptions.ts:13-20`; page 1024-1034) | `motivation: string[]` (page 705) | No | Skippable; no prefill possible. |
| **5** | Nuri: "Words grow fastest where love already lives." (`i18n.ts:522`). H1: **"What do you love?"** (`i18n.ts:523`). Sub: "These become picture-card worlds a nurturer can start from…" (`i18n.ts:524`) | Multi-select chips, 10 `INTERESTS` (`onboardingOptions.ts:23-34`; page 1048-1058) | `interests` (page 706) | No | Skippable; no prefill. |
| **6** | Nuri: "Little and often beats much and rarely." (`i18n.ts:525`). H1: **"How often will you water it?"** (`i18n.ts:526`) | Single-select rows, 4 `PACES` (20/40/60/120 min, `onboardingOptions.ts:38-43`; page 1072-1093) + exchange toggle behind `COMMUNITY_EXCHANGE_ON` (page 1100-1118) | `dailyMinutes`, `exchange` (page 707-708) | No (tap again to deselect, page 1087-1089) | Could default-highlight 20 min (most-chosen commitment; still one-tap changeable). |
| **7** | Nuri: "Almost there — what may I call you?" (`i18n.ts:529`). H1: **"What should we call you?"** (`i18n.ts:530`) | Free-text, autofocus, Enter advances (page 1129-1141) + live identity preview line (page 714-731, 1142-1155) | `name` (page 696) | Yes, non-empty (page 619-620) | **Clerk already knows the user's name from sign-up and it is never read.** Should be a prefilled confirm. |
| **8a** (grower) | Nuri: "From here, the pictures do the explaining." (`i18n.ts:535`). H1: **"{Español} · Immersion mode"** (`i18n.ts:540`) + first-word audio card (`HELLO` map, page 41-61, card 1172-1193) + immersion toggle (page 1195-1211) | Toggle | `immersion` (page 701) | No | Fine as-is: this is the payoff moment. |
| **8b** (nurturer) | H1: **"Your nurturer toolkit"** (`i18n.ts:545`) + 3 toolkit cards (page 1231-1247) | None (informational) | — | — | — |
| **finish** | CTA **"Start growing 🌱"** / "Open my toolkit 🤝" (page 1287-1301) | — | Full `Profile` assembled and saved (page 672-712), then `router.replace("/dashboard")` (page 711) | — | Fallback: `targetLang ?? "es"` (page 677) — a grower who somehow has no target is silently enrolled in Spanish. |

Base profile: `blankProfile()` (`src/lib/store.tsx:131-157`) — `knownLangs: ["en"]`, `targetLang: "es"`, phase 1, meetingProgress 0. Editing an existing account pre-fills every wizard field from the profile (page 562-585) and shows a "Your garden is already growing" banner with a Continue-to-dashboard escape (page 768-784) — both good.

---

## 2. Root-cause diagnosis: the mother's "normal language" confusion

**The screen she hit is Step 1.** Exact facts:

1. **It is a multi-select** — `LangChip` chips with `toggleKnown` add/remove semantics (`src/app/onboarding/page.tsx:643-653`, chips rendered 874-883), and the subtitle *explicitly invites selecting many*: "Pick every language that feels like home — **choose as many as you like**." (`i18n.ts:496`).
2. **The copy never contains the words "speak," "know," or "understand."** The H1 is *"Which languages do you already live in?"* (`i18n.ts:495`) and the mascot bubble is pure metaphor: *"Your roots feed everything you'll grow."* (`i18n.ts:494`). ("What's your normal language?" is the mother's paraphrase — the string "normal language" appears nowhere in the codebase; verified by repo-wide grep.) "Live in" is a poetic construction that a non-technical first-time user has no schema for. The only load-bearing disambiguator is the word "already," one word inside a metaphor.
3. **It is the first language question in the flow, asked before the app has ever asked what she came for.** A new user arrives with exactly one intention: *"I want to learn X."* When the first language-related screen shows 19 beautiful flag chips and says "choose as many as you like," she answers the question in her head, not the question on screen. This is the classic intent-capture ordering bug: the first language picker absorbs the user's goal regardless of its label.
4. **Aspirational framing compounds it.** "Feels like home," "roots," "as many as you like" all read as warm/aspirational — closer to "which languages do you love?" than "which do you already speak?" A grid of foreign flags (🇪🇸 Español, 🇫🇷 Français, 🇯🇵 日本語 — rendered in their native names, `LangChip` page 226-228) *looks like a menu of things to get*, not an inventory of things you have.
5. **The failure then cascades silently.** Every language she selected as "known" is **filtered out of the target grid** on the next step (`!knownLangs.includes(l.code)` at page 899), and if she had somehow set a target first, selecting it as known would have **cleared it** (page 650-652). So after multi-selecting Spanish and French because she wants to learn them, she reaches "Which world will you grow into?" and *the languages she wants are missing from the list* — with no explanation, no "you said you already live in Español" note, nothing. Two confusions stack: wrong mental model at step 1, then an inexplicably shrunken menu at step 2. Only if she happened to notice, went Back, and deselected would she recover.
6. **Browser prefill partially masks the bug for English speakers** — `["en"]` preselected (page 527) means an EN user *could* tap nothing and continue — but the moment any user engages with the chips at all, nothing on the screen corrects the wants-to-learn reading.

### The fix that eliminates the ambiguity

**Reorder + retype + rewrite — all three:**

1. **Ask the target language FIRST** (current step 2 becomes step 1): *"Which language do you want to learn?"* — single-select. This screen absorbs the user's arrival intent correctly, because for once the on-screen question and the in-head question are the same. Show all 10 `FULL_CONTENT_LANGS` unfiltered (no known-langs filter needed anymore at this point).
2. **Then ask known languages as a single-select confirm, not an open multi-select:** *"And which language do you speak best?"* ("speak," not "live in") — **pre-selected from `navigator.language`** (the detection at page 537-547 already exists) so the default action is *confirm, not choose*. **Exclude the just-picked target from this list** — that one exclusion makes the wants-to-learn misreading structurally impossible: the language she came for is simply not on the screen.
3. **Demote "I also speak…" to an optional expander** below the single-select (collapsed by default). Multi-select survives for genuinely multilingual users, but nobody is invited to "choose as many as you like" as the primary interaction. Note the first entry of `knownLangs` is load-bearing — it *is* the UI language (`src/lib/store.tsx:416-420, 433`) — so a primary/secondary split also fixes a latent bug where chip-toggle order silently decides the whole app's language.
4. **Copy rule:** metaphor lives in Nuri's speech bubble; the H1 and the input labels use plain, testable words ("learn," "speak"). Keep "Your roots feed everything you'll grow" in the bubble if desired — it's charming *once the question beneath it is unambiguous*.
5. **Consistency guard becomes almost free:** with target picked first, `toggleKnown`'s target-clearing branch (page 650-652) can be replaced by simply omitting the target from the known-language options.

This ordering also matches the sign-up promise the user just read ("…choose every language you call home and one language to grow next", `sign-up/[[...sign-up]]/page.tsx:16`) — though that sentence should be updated to the new order too.

---

## 3. Friction inventory — every step ranked

| Step | Verdict | Rationale |
|---|---|---|
| 0 Role | **Merge into welcome** | When `NURTURER_STUDIO_ON` is false (single role card + `/early` link, page 826-860) there is exactly one selectable role — auto-select `grower` and make step 0 a pure welcome + "Start" tap. When the flag is on, keep the choice but preselect `grower` (the overwhelming majority path); `?role=` prefill already exists (page 522-526). |
| 1 Known languages | **Keep, but reorder to AFTER target + single-select confirm** | See §2. Locale prefill (page 537-547) makes it a confirm-tap for ~everyone. |
| 2 Target language | **Keep, move to FIRST question** | It is the reason the user came. Also the anchor for the placement branch. |
| 2′ Placement offer | **Keep as an inline branch, never a numbered step** | Already correctly modeled as a card + overlay (page 915-949, 1306-1317), skip-by-default. See §6. |
| 3 City/country | **Defer to in-app** | Two free-text fields (the highest-friction input type in the flow, page 989-997) for a payoff ("kindred voices can find you on the world map," `i18n.ts:509`) the user hasn't seen yet. Ask it the first time they open `/world`, where the value is self-evident. Prefill country from timezone when asked. |
| 4 Motivation | **Keep (slim) or merge with 5** | Cheap (6 taps max, skippable) and it personalizes step 4's H1 ("Why Español?") plus nurturer matching (`i18n.ts:520`). If flow length matters more, merge 4+5 into one "Tell us about you" screen or defer both. |
| 5 Interests | **Defer to in-app** | Its stated purpose is deck seeding ("These become picture-card worlds a nurturer can start from," `i18n.ts:524`) — ask it right before the first deck/session where it actually changes what the user sees. That's a stronger moment: the answer visibly does something. |
| 6 Daily pace | **Keep** | The one proven-commitment screen (Duolingo's daily-goal equivalent). Identity labels (Seedling→Jungle, `onboardingOptions.ts:38-43`) are good psychology. Consider default-selecting 20 min so it's confirm-not-choose. Move the exchange toggle (page 1100-1118) out to `/world` — it's a stranger-contact decision with zero context here. |
| 7 Name | **Keep, prefill from Clerk** | The user typed their name at sign-up minutes ago; `useUser().firstName` is available and unused. Turn "What should we call you?" into a prefilled field + the existing live preview (page 714-731). Typing → confirming. |
| 8 Immersion moment | **Keep — this is the finale** | First word by ear + immersion toggle is the product's thesis in one screen. Keep it last. |

**Net effect:** 9 numbered steps → **5 core screens** (Welcome/role → Target → Known-language confirm → Pace → Name-confirm + first word), with place/motivation/interests becoming progressive, in-context asks. Every deferred field is already optional in `finish()` (page 703-708) and already editable later via the profile-edit re-entry (page 562-585), so deferral requires no data-model change.

---

## 4. Prefill / inference opportunities

| Signal | Exists today? | Use |
|---|---|---|
| `navigator.languages` → known language | **Yes** — onboarding preselect (page 537-547) and guest UI language (`store.tsx:207-211`) | Promote from "silent preselect inside a multi-select" to an explicit **confirm pattern**: "You speak **English**, right?" One tap = yes. Note current code *replaces* `["en"]` with `[hit]` only when the hit is non-English (page 545-546) — correct behavior, keep. |
| Clerk `user.firstName` / `user.fullName` | **No — never read** | Prefill step 7's name input. Biggest single typing-elimination available. |
| `Intl.DateTimeFormat().resolvedOptions().timeZone` | No | Country guess for the (deferred) location ask; also sensible default for future session-scheduling times. |
| `?role=` / `?lang=` deep-link params | `?role=` yes (page 522-526); `?lang=` no | Marketing pages ("Learn Spanish") should deep-link `?role=grower&lang=es`, skipping straight to known-language confirm — a 3-screen onboarding for the paid-traffic path. |
| Profile re-entry prefill | **Yes** (page 562-585) | Already correct; keep. |
| Pace default | No | Preselect 20 min/day (deselectable, page 1087-1089 already supports toggle-off). |

---

## 5. Where endowed progress honestly applies

The endowed-progress effect requires the head start to be *true*. Nuri has real, earned progress it currently hides:

1. **Account creation is genuinely complete** before step 0 renders (middleware forces sign-up first, `src/middleware.ts:89-96`; onboarding waits on `cloudState === "ready"`, page 516-517). A progress bar that starts at ~20% with a checked "Account created ✓" segment is honest — the user did do that work. Today the dots start at zero (page 139-155) and the counter says "1 / 9" (page 763).
2. **Locale-detected language** is real inferred progress: "We've set your language to English ✓ (change)" — one item pre-completed on the user's behalf.
3. **`?role=` / `?lang=` deep links** (page 522-526) mean deep-linked users arrive with 1-2 answers already given — the bar should reflect that instead of resetting the visual to step 1.
4. **Placement pass** is the strongest honest endowment in the product: it seeds phase, hours, and ~1,000-2,200 words met (`placement.ts:221-235`, `WORDS_AT_START` at line 214) and parks `meetingProgress` at the last populated meeting (page 684-691). The result screen already frames it as earned ("Your iceberg starts at Phase 2"). Surfacing that seed on the first dashboard visit ("You start with 12 hours already lived") extends the endowment past onboarding.
5. **Anti-pattern to avoid:** do not fake-fill the bar (e.g. starting a 9-step bar at 30% with nothing done). The mechanism only converts when the endowed portion maps to something the user recognizes as done.

Swap the abstract 9 dots for a labeled bar with a pre-checked first segment; with the §3 cuts it becomes ~6 segments of which 1-2 start checked.

---

## 6. The placement step: flow-length impact and placement (pun intended)

- **It adds zero length for the default path.** Placement is a card on the target step (page 915-949), not a numbered step; the primary CTA remains Continue, and the overlay (PlacementCheck, `src/components/PlacementCheck.tsx:38-421`) is only entered by explicit opt-in ("I'm ready — let's listen", `i18n.ts:563`). Skipping, closing (X, PlacementCheck 185-192), or failing all land the user exactly where a skipper lands (Phase 1, meeting 1 — `onDone(null)` contract, PlacementCheck 43-44).
- **Offered only when meaningful:** language has ≥10 placement words + ≥4 TPR actions (`placement.ts:191-198`), and never for a journey with logged progress (page 593-602) — a test-out can never clobber real progress. Gate 2 additionally requires a native question template (`placement.ts:207-209`). Cap is Phase 3 (`PLACEMENT_CAP`, `placement.ts:36`) — "deeper phases must be lived, not tested into" (`i18n.ts:561`).
- **Length inside the overlay:** Gate 1 rounds + optional Gate 2 bridge (PlacementCheck 329-364), one replay per round (`MAX_REPLAYS_PER_ROUND = 1`, `placement.ts:34`), with mid-gate bail-outs that keep anything already earned (PlacementCheck 318-324). Reasonable; no changes needed for flow length.
- **Where it sits after the §2 reorder:** it moves with the target step to position 1-2 — i.e. *earlier*, which is better: experienced learners self-identify within the first 30 seconds, before investing in the rest of the wizard, and the phase seed can then honestly power the endowed-progress bar for the remaining steps ("Phase 2 start earned ✓").
- One wording note: the offer asks "Grown in Español **before**?" (`i18n.ts:559-560`) — the same metaphor-density risk as step 1. A first-time user parses "Grown in" slowly; "Already understand some Español?" is the plain-words equivalent. Same rule as §2: metaphor in the bubble, plain words in the actionable copy.

### Bonus observations (out of scope but adjacent, noted for the owner)

- Step 6's CTA becomes "I'm growing 🌱" when a pace is selected (page 1278-1284) even though two steps remain — a commitment CTA that doesn't finish anything. Reserve identity CTAs for the final button ("Start growing", page 1299).
- `finish()`'s `targetLang ?? "es"` fallback (page 677) can silently enroll a grower in Spanish; with target asked first and required, the fallback becomes unreachable and should be an error instead.
- Graduated immersion is phase-stepped (`getImmersionStage`, `store.tsx:39-42`: P1→0 … P5→4 via `KEY_TIERS`, `i18n.ts:1197`) — the owner's "so gradual they barely notice" goal will need a finer-grained ramp (e.g. tier fraction interpolated within a phase by `hoursLogged`), but that is a dashboard concern, not an onboarding one.
