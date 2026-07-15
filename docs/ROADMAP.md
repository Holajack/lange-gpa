# Nurilang — Legacy Launch Roadmap & Deep-Dive Audit

_Historical snapshot from 2026-06-12. Superseded for release decisions by `docs/BETA_READINESS_AUDIT.md`._

## ✅ Built and live

| Area | State |
|---|---|
| Landing + onboarding (9 steps, skippable invitations) | live |
| Six GPA phases as courses, research-true 1A/1B sequencing, 161-activity research base | live |
| Practice games: picture cards, TPR listening, Power Phrases, re-living/repeat | live |
| Ten content languages incl. English (+ Haitian Creole in flight) | live |
| Buddy family: per-language toy mascots, matte look, idle motion, AI nurturer identity | live |
| Session room: authentic Dirty-Dozen pacing (intro→echo→review), nurturer tray, joke prompts, mic/camera recording, role switch | live |
| Real ElevenLabs voices for ru + en (420 files); manifest-first speak() with browser fallback | live |
| World globe: drag/zoom, people at city-level only, profiles, cultural notes | live |
| Schedule + booking (real nurturers + AI buddy), forum, Nurturer Studio | live |
| Convex + Clerk scaffold (keyless-safe), Blender source files + idle/wave animations | repo |

## 🔄 In flight (this pass)

- Haitian Creole as a full language (deep-researched Kreyòl, not French) + its own buddy
- Achievements: dated, GPA-true milestones — explicitly **no streaks/XP/leagues**
- Graduated immersion: the UI itself turns into the target language as phases advance
- Onboarding placement test (comprehension-only, can't be faked, caps at Phase 3)
- /early pre-signup waitlist page
- Recording consent dialog (both parties agree; device-only storage)
- Replicate card-image pipeline (script ready; waiting on REPLICATE_API_TOKEN in .env)
- Blender hero: waving 3D Nuri in the landing hero; face-placement fixes

## 🔜 What's left to generate / build (priority order)

1. **Backend ON (the big unlock — ~15 min of owner work)**
   Run `npx convex dev`, create the Clerk app, paste 4 keys (docs/SETUP-BACKEND.md).
   Unlocks: real accounts, real waitlist storage, profile-image uploads (Convex file storage),
   two-device live sessions (sessionEvents channel is already designed), real forum posts.
2. **Card illustrations** — run `scripts/generate-card-images.mjs` once the Replicate token
   lands; review a 10-card test batch first (`--limit 10`), then the full set.
3. **Audio for the rest of the languages** — es/fr/de/pt/it/ja/zh (+ ht, see below) via
   `scripts/generate-audio.mjs`; needs either an ElevenLabs paid tier ($5 Starter = 30k chars)
   or spreading over free months. ~4–5k chars per language.
4. **Haitian Creole audio** — ElevenLabs support is limited for ht; realistic best path is
   recording native speakers (family/friends) reading the 98 words + questions + cues —
   which is also the most GPA-authentic audio possible. Recording rig: any phone + the
   existing file naming scheme.
5. **Phase 2–6 activity depth** — currently strongest in Phase 1. To generate per phase:
   - P2: Busy Pictures sets (AI-generated crowded scenes), process picture series
   - P3: Record-and-massage loop UI, host-story player with comprehension checkpoints
   - P4: vocabulary recordings tooling, two-recorder technique flow
   - P5: native-media library hooks, retell-recording flows
   - P6: remedial pickup planner
6. **Video comprehension verification** — record TPR responses on camera (with consent) and
   verify the action with a vision model (e.g. Claude via API). Design exists; needs an
   Anthropic/Replicate vision key + a consent-first UX.
7. **Grammar-teacher tier** — locked until Phase 4 by design ("when it's time"): a separate
   nurturer category (`teacher: true`), bookable only once profile.phase >= 4; GPA rationale
   shown when locked. Feature-gating config: reading/writing activities hidden until Phase 3.
8. **Groups** — small cohorts growing together (the original GPA context is group-based);
   group sessions, shared word-gardens, group forum spaces. Needs backend.
9. **Profile images** — upload via Convex storage once keys land; avatar fallback exists.
10. **More buddies** — ko/tr/uk/hi/ar already have UI language support; each needs: vocab
    deck + TPR + power phrases, buddy design/build/render, nurturer personas, audio.
    The Blender family file + generate scripts make each one ~an afternoon.
11. **Mobile polish pass + PWA** — installable app shell, offline audio caching.
12. **Notifications** — wilt-and-revive nudges (warm, never guilt) once backend lands.

## 🎨 Blender capability answer

The current buddies are 100% procedural (no PolyHaven assets used yet, despite the
integration being on). To level up looks:
- **Hyper3D Rodin** (checkbox in the BlenderMCP N-panel, free trial) — AI-sculpted meshes
  for organic details we can't easily make from primitives
- **PolyHaven textures** (already enabled) — fabric/felt normal maps for plush realism,
  HDRI studio lighting
- **Sketchfab** (needs free API key) — downloadable CC props (instruments, furniture)
- Native tools that cost nothing: subdivision sculpting, curves for limbs/ribbons,
  geometry nodes for fringe/fur

## 🧭 Product principles (locked)

- Anti-Duolingo: no streaks, no XP, no leagues. Badges are dated milestones of real
  comprehension. Time-in-app is not the metric; understanding and relationships are.
- Comprehension before production; no translation in practice content; no reading/writing
  before Phase 3; grammar only at Phase 4+ via professional teachers.
- The UI gradually stops speaking your language (graduated immersion by phase).
- People appear at city level only. Recording requires explicit consent, stays on device.
- Buddy family count is never stated — it keeps growing.
- Born for missionaries and friendship-first growers; pen-pal warmth over gamification.
