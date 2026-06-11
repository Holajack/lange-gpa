# LANGE — Builder Brief (read fully before writing any code)

You are building one page of **LANGE**, a web app that digitizes the **Growing Participator Approach (GPA)** — language growth through real people ("nurturers"), picture cards, and zero translation. The vibe: a dark, joyful "neon playroom" — near-black canvas, huge soft-radius cards, electric violet / hot orange / lime pops, playful display type.

## Hard rules
1. **Do NOT modify any shared file** (`src/lib/*`, `src/components/*`, `src/app/layout.tsx`, `src/app/(app)/layout.tsx`, `src/app/globals.css`, configs). Only create the files assigned to you.
2. No new npm dependencies. Available: `next@15` (App Router), `react@19`, `framer-motion`, `lucide-react`, Tailwind v4.
3. No remote images, no `next/image`. Visuals = emoji, inline SVG, `<Mascot>`, `<Avatar>`, CSS gradients.
4. Interactive pages must start with `"use client"`. Import with `@/` alias.
5. **GPA practice content is NEVER translated.** Meaning = image + audio. UI chrome uses `t()` strings.
6. TypeScript strict — no `any`. Code must compile.

## Design system (already in globals.css)
- Canvas `#0e0e12`. Cards: class `card` (bg #1a1a20, 1px white/7% border, radius 28px). Add `card-hover` for lift-on-hover.
- Tailwind color tokens: `canvas, raised, raised-2, line, ink, muted, violet, violet-deep, violet-soft, orange, amber, lime, lemon, mint, coral` → use as `bg-violet`, `text-muted`, `border-line`, `bg-lime/20`, etc.
- Buttons: class `pill` + padding/bg, e.g. `className="pill bg-violet px-6 py-3 text-white"`. Lime/lemon/orange pills use `text-canvas`.
- Headings: class `headline` (display font, 800, tight). Display font also via `font-display`.
- Shadows: `shadow-pop`, `shadow-glow-violet`, `shadow-glow-orange` (defined as theme shadows: use `shadow-[var(--shadow-pop)]` if arbitrary needed — prefer `style={{boxShadow:"var(--shadow-glow-violet)"}}` when Tailwind class doesn't resolve).
- Helper animations: `.floaty` (bob), `.wavehand`, `.marquee`, `.pulsedot` (online dot), `.popin` (correct answer), `.shake` (wrong answer), `.wavebar` (audio bars), `.orb` (blurred glow circle, position with inline style).
- Radii: rounded-[28px] is the standard card radius; chips/buttons fully rounded.
- framer-motion: use for staggered page-load reveals (`motion.div`, `initial/animate/transition` with delays) and micro-interactions. One well-orchestrated entrance per page.

## Shared API (import these — signatures are exact)

### `@/lib/store`
```ts
const { profile, ready, uiLang, t, saveProfile, updateProfile, toggleImmersion,
        completeActivity, addBooking, removeBooking, resetAll } = useApp();
// profile: Profile | null (see types). uiLang: LangCode (target lang when immersion on).
// t(key): localized UI string. completeActivity(id, minutes?, words?) logs progress.
// addBooking({nurturerId, date:"2026-06-12", time:"18:00", minutes:30, activity:"Rough-and-Ready Dozen"})
// blankProfile(): Profile  — also exported (not in hook)
```
The `(app)` layout already guards: pages under `src/app/(app)/` can assume `profile` exists (still null-check for TS).

### `@/lib/types` — `Profile { name, role: "grower"|"nurturer"|"both", knownLangs, targetLang, nurtureLangs, immersion, phase: 1..6, hoursLogged, wordsMet, streak, completed: string[], bookings: SessionBooking[], week: number[] (Mon..Sun minutes), createdAt }`

### `@/lib/languages` — `LANGUAGES: Language[] {code,name,nativeName,flag,tts}`, `langByCode(code)`, `FULL_CONTENT_LANGS` (es,ru,fr,de,pt,it — langs with vocab decks).

### `@/lib/phases` — `PHASES: Phase[]` (6 authentic GPA phases: Connecting 100h, Emerging 150h, Becoming Knowable 250h, Deep Personal Relationships 500h, Widening Understanding 500h, Ever Growing). Each: `{id, slug, name, tagline, hours, startHour, color (hex), emoji, vocabTarget, description, principles[], activities[] {id,name,description,how,minutes,kind,practiceHref?}, milestones[]}`. Also `phaseById(id)`, `phaseBySlug(slug)`, `TOTAL_HOURS=1500`, `phaseProgress(phase, hoursLogged): 0..100`.

### `@/lib/vocab` — `VOCAB_DOMAINS: VocabDomain[]` `{id, emoji, color, names: {en,es,ru,fr,de,pt,it}, items: [{id, emoji, words: {es,ru,fr,de,pt,it}}]}` (10 domains: food, animals, home, body, traveling, family, sport, health, nature, work). `domainById(id)`. `TPR_COMMANDS` `[{id, emoji, words: {es..it}}]` (8 commands: stand/sit/point/take/give/open/close/walk).

### `@/lib/nurturers` — `NURTURERS: Nurturer[]` `{id, name, langs, city, bio, tags, sessions, rating, online, color}`, `nurturerById(id)`, `nurturersForLang(lang)`, `FORUM_SEED: ForumPost[]` `{id, author, authorRole, lang, category, title, body, replies[{author,body,ago}], likes, ago}`.

### `@/lib/tts` — `speak(text, langCode, rate=0.85): Promise<void>` (browser TTS in target language), `stopSpeaking()`.

### `@/lib/i18n` — `t(key, lang)`; in components prefer `useApp().t`. Available keys:
nav: `courses dashboard schedule forum student nurturerWord` · common: `continue back start next done play listen speak repeat correct tryAgain online minutes hours words dayStreak phaseWord hello today book cancel immersionOn` · dashboard: `joinSpeakingClub yourNurturer trainings trainingsSub chooseCategory practiceSpeaking fastRepeat minPractice weeklyActivity hoursLogged wordsMet activitiesDone` · trainings: `vocabulary listening speaking literacy` · categories: `food traveling sport animals health home work family body nature` · courses: `coursesTitle coursesSub milestonesWord activitiesWord currentPhase openPhase` · schedule: `scheduleTitle upcoming bookSession availableNurturers noSessions` · session: `sessionRoom showCards endSession timeLeft` · forum: `forumTitle forumSub newPost reply`.
Missing key → returns the key itself; missing lang → English. Don't invent keys; hardcode English for anything not listed (curriculum/meta text stays English like the printed GPA guides).

### `@/components`
- `<Mascot size={160} mood="wave|happy|think|cheer" float={true} />` — Nuri, the orange sprout-bot.
- `<Logo size="sm|md|lg" href="/" />`
- `<Avatar name color size ring />` — gradient initials circle.
- `<AppNav />` — already rendered by the (app) layout; don't add it yourself.
- `@/components/ui`: `<Card className hover>`, `<Pill onClick className disabled>`, `<ProgressBar value color height>`, `<Tag>`, `<SectionTitle sub>`.

## GPA essentials (be faithful)
- Learner = **grower** (growing participator); helper = **nurturer** (an ordinary person, NOT a teacher). Speech = "wall of noise" that becomes a window.
- **Comprehension before production**: Phase 1 growers point/act, they don't speak. Never force production. Wrong answer ≠ failure → "It's in your iceberg" (re-encounter later).
- **No translation, no writing in Phase 1**; meaning via pictures/objects/actions; nurturer recasts instead of correcting.
- Sessions are recorded; growers "re-live" recordings at home.
- Phases are defined by how HOST PEOPLE experience the grower (special connection → probably somebody → knowable → deeply known → co-member → one of us).

Full research (161 activities) in `/Volumes/LaCie/GPA_Language_Learning/research/gpa-research.json` — dip in for flavor if useful, but `phases.ts` already curates it.

## Quality bar
Production-grade, visually striking, cohesive. Staggered entrance animations. Generous spacing. Every interactive element works (state, feedback, persistence via store). Empty states handled. Responsive: mobile (grid-cols-1) → desktop (lg: multi-column). This is a demo that must FEEL alive.
