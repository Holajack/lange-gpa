# Nurilang 🌱 — Grow into a language, not just learn it

A web app built on the **Growing Participator Approach** (GPA, by Greg & Angela Thomson):
language is a life to be lived, not a subject to be studied. Learners are **growers**;
the ordinary people who help them — grandmothers, taxi drivers, florists — are **nurturers**.
Meaning comes from pictures, objects and actions. **Never from translation.**

## Run it

```bash
nvm use            # Node 20+ (project pins 22 via .nvmrc)
npm install
npm run dev        # → http://localhost:3000
```

No API keys, no database — this demo is fully self-contained:
- Profile/state persists in `localStorage`
- Audio in the target language uses the browser's built-in speech synthesis
- The mic in Power-Phrases practice uses `MediaRecorder` (graceful fallback if denied)

## The journey in the app

| Route | What it is |
|---|---|
| `/` | Landing page — the GPA story, interactive picture-card teaser |
| `/onboarding` | Meet Nuri 🧡 → role (grower/nurturer) → your languages → your new world |
| `/dashboard` | Home: nurturer video card, phase progress, weekly growth, trainings |
| `/courses` | The Six-Phase Programme (Connecting → Ever Growing, ~1,500 h) |
| `/courses/[slug]` | One phase: principles, authentic GPA activities, milestones |
| `/schedule` | Book 30-minute growing sessions with nurturers |
| `/session` | The session room: 30-min timer, picture-card play, half-time switch |
| `/forum` | The Village — growers & nurturers helping each other belong |
| `/practice/*` | Digitized GPA games: Rough-and-Ready Dozen, Listen & Do (TPR), Power Phrases, Re-living |

## Immersion

After onboarding, the app chrome itself switches into the grower's target language
(es/ru/fr/de/pt/it fully translated) — the app becomes part of the host world.
Toggle anytime with the flag button in the nav.

## Source method

Built from the original GPA phase guides (Phases 1–6, Thomson) and
[growingparticipation.com](https://www.growingparticipation.com/overview).
Distilled research lives in `research/gpa-research.json`.

## Stack

Next.js 15 (App Router) · React 19 · Tailwind CSS 4 · framer-motion · TypeScript strict.
