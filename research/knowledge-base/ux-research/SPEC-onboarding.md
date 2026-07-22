# SPEC — Nuri Onboarding Redesign

Status: implementable spec. Repo: `/Volumes/LaCie/GPA_Language_Learning`. Primary file: `src/app/onboarding/page.tsx` (currently 1,338 lines, `STEP_COUNT = 9` at line 38). Supporting: `src/lib/i18n.ts`, `src/lib/onboardingOptions.ts`, `src/app/sign-up/[[...sign-up]]/page.tsx`, `src/lib/store.tsx`.

Binding constraints: mobile-first is rule #1; all copy ships in all 19 `STRINGS` languages; honest psychology only (no fake progress, no confirmshaming); the "mother test" is the permanent regression test — *would a non-technical 60-year-old first-timer misread this screen?*

---

## 0. Priority Zero — the known-vs-target language fix

Real failure: the owner's mother multi-selected several languages on the "Which languages do you already live in?" screen because she thought it asked what she WANTS TO LEARN, then hit the actual target step with her wanted languages filtered out of the grid (filter at `page.tsx:899`, target-clearing at 650-652).

Root causes (from the audit — all three must be fixed together):
1. **Order**: the known-language question comes first, so it absorbs the user's arrival intent ("I want to learn X").
2. **Control type**: multi-select + "choose as many as you like" invites listing aspirations.
3. **Copy**: "live in / feels like home / roots" is metaphor with no plain-word anchor ("speak", "learn", "know" appear nowhere).

### The fix (all three, non-negotiable)

1. **Target language is asked FIRST.** H1: "Which language do you want to learn?" Single-select flag cards, all 10 `FULL_CONTENT_LANGS` (`languages.ts:29`), NO known-languages filter (nothing is known yet). This screen and the in-head question are now the same question.
2. **Known language becomes a one-tap CONFIRM, not a question.** After target: "Nuri will speak to you in **English** — correct?" `[Yes]` `[Change]`. Prefilled from `navigator.languages` (detection code already exists at `page.tsx:537-547` — keep its rule of replacing `["en"]` only on a non-English hit). **The just-picked target language is excluded from the Change list** — this makes the wants-to-learn misreading structurally impossible: the language she came for is not on the screen.
3. **"I also speak…" demoted to a collapsed optional expander** under the confirm. Multi-select survives there for genuinely multilingual users, never as the primary interaction. The FIRST entry of `knownLangs` is load-bearing (it is the UI language — `store.tsx:416-420, 433`): the confirmed language is always written as `knownLangs[0]`; expander additions append after it. This also fixes the latent bug where chip-toggle order silently decided the app language.
4. **Copy rule, applied flow-wide**: metaphor lives ONLY in Nuri's speech bubble; every H1 and input label uses plain, testable words ("learn", "speak"). "Your roots feed everything you'll grow" may stay in the bubble — above an unambiguous H1.
5. Delete the target-clearing branch in `toggleKnown` (`page.tsx:650-652`) — with target picked first, simply omit it from known-language options.
6. Update the sign-up header promise (`sign-up/[[...sign-up]]/page.tsx:15-17`) to the new order: "…choose the language you want to grow, and tell us which one you already speak."
7. Placement-offer wording: "Grown in Español before?" → plain words: "Already understand some Español?" (keys `i18n.ts:559-560`; metaphor may remain in the bubble).

---

## 1. New step order (exact)

Progress UI: replace the 9 dots (`Dots`, `page.tsx:135-157`) and the `1 / 9` counter (line 763) with a **labeled segmented bar** (see §3). Placement remains an inline branch/overlay, never a numbered step.

| # | Screen | Input | Writes | Required | Prefill |
|---|---|---|---|---|---|
| 1 | **Welcome** — "I'm Nuri" + one-line thesis + "Takes about 2 minutes." When `NURTURER_STUDIO_ON` is false: auto-select `role = "grower"`, no cards, single Start CTA. When true: role cards with `grower` preselected (`?role=` param behavior at 522-526 kept). | 1 tap | `role` | yes (auto) | `?role=` |
| 2 | **Target language** — bubble: "Pick a world — I'll come with you." H1: **"Which language do you want to learn?"** Single-select flag cards, all `FULL_CONTENT_LANGS`, unfiltered. Placement offer card appears inline after selection when `placementAvailable(targetLang)` and journey is fresh (existing gating, `page.tsx:593-602`, unchanged). | 1 tap (+ optional placement overlay) | `targetLang` (+ placement seed) | yes | `?lang=` deep link (NEW — marketing pages link `?role=grower&lang=es`, skipping to screen 3) |
| 3 | **Why {Language}?** — bubble: "There's no wrong reason — only yours." Existing 6 `MOTIVATIONS` cards, multi-select, skippable. CTA reads "Skip for now" when empty (existing `inviteStepEmpty` pattern). | 0–6 taps | `motivation[]` | no | — |
| 4 | **UI language confirm** — bubble: "Your roots feed everything you'll grow." H1: **"Nuri will speak to you in {English} — correct?"** Big `[Yes]` primary, `[Change]` secondary → single-select list *excluding target*. Collapsed expander below: "I also speak other languages" → multi-select chips (also excluding target). | 1 tap (typical) | `knownLangs` (confirmed lang at index 0) | yes | `navigator.languages` (existing detection) |
| 5 | **Pace** — existing 4 `PACES` rows, **20 min preselected** (toggle-off already supported, `page.tsx:1087-1089`). Remove exchange toggle to `/world` (it is a stranger-contact decision with zero context here, `page.tsx:1100-1118`). Do NOT use the identity CTA "I'm growing 🌱" here (currently fires two steps early, `page.tsx:1278-1284`) — reserve it for the final button. | 0–1 tap | `dailyMinutes` | no (default stands) | default 20 |
| 6 | **Name confirm + first word (finale)** — name field **prefilled from Clerk `useUser().firstName`** (currently never read — biggest typing elimination available), live identity preview kept (`page.tsx:714-731`). Below it, the existing first-word audio card (`HELLO` map, `page.tsx:41-61`) + immersion toggle. Optional 2–3 s labor-illusion interstitial before this screen: "Choosing your first words… shaping your sessions…" — must show TRUE derivation steps, max 3 s, skippable on re-entry. Final CTA: **"Start growing 🌱"** → `finish()` → `/dashboard`. | confirm + 1 tap | `name`, `immersion` | name non-empty | Clerk firstName |

### Deferred out of onboarding (progressive, in-context asks — no data-model change needed; all fields already optional in `finish()`, `page.tsx:703-708`, and editable via profile re-entry, 562-585)

| Field | New ask location | Prefill |
|---|---|---|
| `city`/`country` (two free-text inputs — highest-friction input in the old flow) | First visit to `/world`, where "kindred voices on the map" is self-evident | Country from `Intl.DateTimeFormat().resolvedOptions().timeZone` |
| `interests` (deck seeding) | Immediately before the first deck/practice session — the answer visibly changes what appears | — |
| `exchange` toggle | `/world` | off |
| Notification permission | NOT in onboarding. Primed on dashboard after first session is booked: "You planned {N} min a day — want a nudge on meeting days?" `[Yes, remind me]` `[Not now]`. OS dialog fires only on Yes. Never a cold ask. | — |

### Before / after count

| | Before | After |
|---|---|---|
| Numbered steps | 9 | **6** (2 of which are confirm-only taps) |
| Free-text fields | 3 (city, country, name) | **1** (name, prefilled — confirm not type) |
| Multi-selects | 3 (known langs, motivation, interests) | 1 required→0; motivation optional; known-langs expander opt-in |
| Minimum taps to finish (grower, defaults accepted) | ~12+ incl. typing | **~7 taps, zero typing** |
| First question asked | "Which languages do you already live in?" (multi-select) | "Which language do you want to learn?" (single-select) |

---

## 2. `finish()` changes (`page.tsx:672-712`)

- `targetLang ?? "es"` fallback (line 677) becomes unreachable (target is step 2, required) — replace with a thrown/reported error, never silent Spanish enrollment.
- `knownLangs` written with confirmed language at index 0 (UI-language invariant).
- Placement path unchanged (`placementSeed` + `meetingProgress` parking, `page.tsx:684-691`), but write it BEFORE any gate stamps if the advancement-gates spec has shipped (see SPEC-advancement-gates §Grandfather, risk R2 — stamps must ride the same profile object as the seed).
- Deferred fields simply absent — already supported.

## 3. Endowed progress bar (honest only)

Replace the dots with a segmented, labeled bar of ~7 segments. Segments and their truth-sources:

1. **"Account created ✓"** — pre-checked at mount. TRUE: middleware forces Clerk sign-up before `/onboarding` renders (`middleware.ts:89-96`), and the wizard already waits on `cloudState === "ready"` (`page.tsx:516-517`). The bar therefore starts at ~15% with visible justification, never 0%.
2. **"Language detected ✓"** — pre-checked when locale detection produced a hit ("We set your language to English — you can change it").
3–7. One segment per remaining screen; back half of the flow contains only fast confirm-taps, so perceived velocity rises near the end (goal-gradient). Show remaining count in the back half ("2 steps left"), not "step 7 of 9".
- Deep-linked arrivals (`?role=`, `?lang=`) mount with those segments checked.
- Placement pass adds a checked segment "Phase {2} start earned ✓" and its seed is surfaced on first dashboard visit ("You start with {12} hours already lived").
- HARD RULE: no segment is ever pre-checked without a real completed referent. A bar at 20% "just because" poisons every progress display in the app.

## 4. Mobile-first layout notes

- One decision per screen; single-column; primary CTA fixed in the bottom thumb zone (existing footer at `page.tsx:1254-1302` — keep pattern).
- Flag grids: 2-column cards on ≤390 px, 44 px minimum touch targets, selected state = border + check, never color alone.
- The confirm screen's `[Yes]` is full-width primary; `[Change]` is a text button beneath — the happy path is one thumb tap.
- Progress bar pinned top, ~6 px tall, labels only on the current segment (no label soup on small screens).
- No hover-dependent affordances anywhere.

## 5. i18n keys (all ×19 in `STRINGS`)

New: `obTargetFirstH1` ("Which language do you want to learn?"), `obUiConfirmH1` ("Nuri will speak to you in {lang} — correct?"), `obUiConfirmYes`, `obUiConfirmChange`, `obAlsoSpeak` (expander label), `obSpeakBestH1` ("Which language do you speak best?" — the Change list H1), `obTimePromise` ("Takes about 2 minutes"), `obBuildingPlan1/2/3` (labor-illusion lines), `obStepsLeft` ("{n} steps left"), `obAccountDone`, `obLangDetected`, `obPlacementPlain` ("Already understand some {lang}?").
Changed: retire `i18n.ts:495-496` ("already live in" / "choose as many as you like") from the primary path (keep keys for the expander if reused); sign-up promise copy; placement offer copy (`i18n.ts:558-560`).
All new keys enter `KEY_TIERS` as tier 4 (onboarding copy never auto-immerses — a brand-new user has zero target language).

## 6. Migration / rollout

- No schema change. Existing profiles re-entering via profile-edit (`page.tsx:562-585`) get the new order with fields prefilled — already-correct behavior, keep the "Your garden is already growing" banner.
- `?lang=` param: additive.
- Instrument from day one: onboarding completion %, time-to-finish, % accepting the UI-language confirm without Change (target >90%), % reaching the first-word card, % booking first session, D1/D7/D30.
- QA gate: run the mother test on every screen — plain-words H1, single-fact = single-select, no metaphor outside the bubble.
