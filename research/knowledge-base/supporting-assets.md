# Addendum: Minor corpus stragglers uninventoried: docs/SETUP-BACKEND.md, docs/mascots/ (Listik matryoshka, Nuri face, family blend files), public/mascots/, public/textures/

This addendum inventories the last four uncatalogued corners of the corpus at `/Volumes/LaCie/GPA_Language_Learning`. None of them are GPA learning materials — one is a backend setup doc (already covered functionally by `nurturer-side.md` from the `convex/` source itself), and three are branding/visual-asset directories. They matter because `materials-assets.md` names "Listik the matryoshka buddy" in the audio voice cast without ever listing the asset files that character comes from. The closing section here supplies the paragraph that ties the voice cast to the visual assets.

---

## 1. docs/SETUP-BACKEND.md — "Nurilang backend setup — Convex + Clerk" (115 lines)

**What it is.** The owner-facing runbook for turning on the Convex + Clerk backend. Written when the repo was still called "LANGE" (added in commit `2cc5312` "Toy mascot family, GPA Dirty-Dozen session flow, world globe, RU+EN ElevenLabs voices, Convex/Clerk scaffold", 2026-06-11); the only later edit was cosmetic renaming LANGE → Nurilang in commit `a896531` "Prepare Nurilang for closed beta" (2026-07-14).

**Core contract it documents:** the app ships **keyless-safe** — with no env vars it builds and runs as a localStorage-only demo with no auth; pasting four keys activates the backend with zero code changes:

- `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_DEPLOYMENT` (from `npx convex dev`; on Vercel use `npx convex deploy` for prod instead of `CONVEX_DEPLOYMENT`)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` (Clerk → API keys)

The moment both `NEXT_PUBLIC_` keys exist, `src/components/Providers.tsx` mounts ClerkProvider + ConvexProviderWithClerk (otherwise it renders children untouched) and `src/middleware.ts` switches from a `NextResponse.next()` passthrough to `clerkMiddleware()`.

**Section-by-section:**

1. **Status table** — what was wired vs. pending at write time: `convex/schema.ts` (profiles, bookings, sessionEvents tables), `convex/profiles.ts`/`bookings.ts`/`sessions.ts` (`upsertProfile`, `getProfile`, `createBooking`, `listBookings`, `appendEvent`, `eventsByRoom`) all written; `convex/_generated/` "does not exist yet"; session-room live sync and profile-sync UI "pending".
2. **Step 1 — create the Convex project**: `npx convex dev` from the repo root, project name `lange`; auto-writes `CONVEX_DEPLOYMENT` + `NEXT_PUBLIC_CONVEX_URL` into `.env.local`, generates `convex/_generated/`, pushes schema + functions, live-reloads `convex/` while running.
3. **Step 2 — create the Clerk app**: application name `Nurilang`; **Configure → JWT templates → New template → Convex**, keeping the template name exactly `convex` (Convex looks it up by that name); copy the Issuer URL into a new `convex/auth.config.ts` with `{ domain: <issuer>, applicationID: "convex" }`; paste the four keys into `.env.local` and Vercel project env vars.
4. **Step 3 — live two-device sessions via the `CONVEX_SYNC` marker**: the session room (`src/app/(app)/session/page.tsx`) has a `CONVEX_SYNC` marker (still present, 2 occurrences) where local card-state dispatches get replaced/augmented with `useMutation(api.sessions.appendEvent)` calls — event types `"reveal"`, `"review_ask"`, `"answer"`, `"role_switch"`. The nurturer device dictates pacing; the grower device subscribes via `useQuery(api.sessions.eventsByRoom, { roomId })` (a live subscription re-run on every insert) and replays events in `seq` order, tracking last-applied `seq` as `after`. `seq` and `ts` are assigned server-side in `appendEvent`; `roomId` can be the booking id.
5. **Step 4 — profile sync replaces localStorage**: `profiles` mirrors the `Profile` shape in `src/lib/types.ts` field-for-field (`name`, `role`, `targetLang`, `knownLangs`, `immersion`, `hoursListened`, `phase`) plus `clerkId`. Migration path inside `src/lib/store.tsx`: on sign-in hydrate from `getProfile` if a server profile exists; else one-time push of the localStorage profile via `upsertProfile`; thereafter `saveProfile` writes both — localStorage becomes the offline cache, Convex the source of truth.
6. **Build invariants (as written)**: nothing under `src/` may import `convex/_generated` (Vercel's keyless build would fail); root `tsconfig.json` excludes `convex/` (functions typechecked by `npx convex dev` against `convex/tsconfig.json`); `Providers.tsx` and `src/middleware.ts` must keep their keyless fallbacks.

**Current-state annotations (July 2026 — the doc is now partly historical):**

- The setup steps have been **completed**: `convex/_generated/` exists on disk (api.d.ts, api.js, dataModel.d.ts, server.d.ts, server.js), `convex/auth.config.ts` exists, and the Convex deployments are live (dev `focused-camel-780`, prod `necessary-egret-218` — which go stale unless pushed with `npx convex dev --once` / `npx convex deploy`).
- The first build invariant is **superseded**: `src/` now imports `convex/_generated` in at least `src/app/early/page.tsx`, `src/lib/credits.ts`, and `src/components/Providers.tsx`. The keyless-demo contract described by the doc no longer reflects the shipped app.
- `docs/ROADMAP.md` (historical snapshot 2026-06-12) listed "Backend ON" as the #1 unlock, pointing at this doc ("~15 min of owner work").
- Nothing in this doc changes the KB's backend picture — `nurturer-side.md` documents the live Convex backend from the `convex/` source directly, which is authoritative. Treat SETUP-BACKEND.md as the historical bootstrap recipe plus the still-relevant `CONVEX_SYNC` design note for two-device sessions.

---

## 2. docs/mascots/ — 3D design sources (7 files, ~9.7 MB)

The design-source directory for the Nuri mascot family: Blender scenes, high-res renders, and a turntable/idle video. These are the **3D-era originals**. The app itself no longer renders 3D mascots — commit `3eb8614` "Flat Duolingo-style SVG buddies replace 3D renders in-app" (2026-06-12) introduced `src/components/buddies/Buddy.tsx` (560 lines of hand-drawn flat SVG art, all 10 buddies) and deleted `HeroBuddy.tsx`; the comment in `src/components/MascotImage.tsx` says it explicitly: "the 3D renders live on in docs/, but the app is flat-vector everywhere."

| File | Size | Format / dimensions | Added | Notes |
|---|---|---|---|---|
| `mascot-family.blend` | 350,417 B | Blender scene, zstd-compressed; decompressed header `BLENDER17-01v0501` (Blender 5.0-series file format) | `2cc5312` 2026-06-11 | First family scene (pre-toys pass) |
| `mascot-family-toys.blend` | 433,133 B | Same format (Blender 5.0, zstd) | `2cc5312` (mtime 2026-06-12 08:22) | Reworked scene with the per-country toy designs |
| `lineup.png` | 2,486,216 B | PNG 2048×1152 | `2cc5312` | Render: family lineup, first pass |
| `lineup-toys.png` | 2,725,616 B | PNG 2048×1152 | `2cc5312` (mtime matches toys .blend) | Render: family lineup with toy identities |
| `listik-matryoshka.png` | 3,033,865 B | PNG 2560×1440 | `2cc5312` | Hero render of **Listik**, the Russian matryoshka-doll buddy — the visual identity behind the "Listik" voice casting in the audio pipeline |
| `nuri-face.png` | 2,448,122 B | PNG 2048×1152 | `2cc5312` | Face reference render for Nuri (the ROADMAP's in-flight item "Blender hero: waving 3D Nuri in the landing hero; face-placement fixes" relates to this) |
| `family-idle.mp4` | 279,239 B | H.264 MP4, 1280×720, 24 fps, 2.0 s | `d168e84` "Discovery-first buddies…" 2026-06-12 | Short idle-animation loop of the family |

Nothing in `src/` or other docs references any of these files by name (verified by grep); they are design provenance only. A related deleted sibling: `public/mascots/nuri-wave.webm` (a waving-Nuri animation for the landing hero, added in `7f3c2d9`) was removed by `3eb8614` when the app went flat-vector.

---

## 3. public/mascots/ — shipped mascot PNGs (10 files, ~6.5 MB, all 1024×1024)

One PNG per buddy, all 1024×1024: brin.png (656,309 B), brotito.png (681,278 B), broto.png (655,458 B), futaba.png (645,533 B), gemma.png (775,510 B), listik.png (558,142 B), nuri.png (653,801 B), sprossi.png (688,728 B), tiboujon.png (656,979 B), yaya.png (570,286 B). Nine were added in `2cc5312` (2026-06-11); `broto.png` and `yaya.png` were re-rendered in the toys pass; `tiboujon.png` arrived with Haitian Creole in `7f3c2d9` (2026-06-12).

**Canonical registry — `src/lib/mascots.ts` (`MASCOTS`, type `MascotDef`)**. Each entry: `id`, `name`, `lang`, `toy`, `color`, `accent`, `image` (the `/mascots/*.png` path), `nativeHello`. The design concept in the file's docstring: "Each growing language has its own sibling modeled after that country's iconic toy… so the mascot itself carries culture — never translation."

| id | Name | Lang | Toy identity | color / accent | nativeHello |
|---|---|---|---|---|---|
| nuri | Nuri | en | The original sprout-bot | #ff7a00 / #b8f03c | Hello! |
| brotito | Brotito | es | Piñata | #ff4747 / #ffd234 | ¡Hola! |
| brin | Brin | fr | Marinière sailor | #2e3a85 / #e82e2e | Salut ! |
| sprossi | Sprossi | de | Nutcracker | #2f54e0 / #e8b54a | Hallo! |
| gemma | Gemma | it | Wooden marionette | #cf9d5f / #e82e2e | Ciao! |
| broto | Broto | pt | Barcelos rooster | #2b3a5e / #f0a030 | Olá! |
| **listik** | **Listik** | **ru** | **Matryoshka doll** | **#e02f26 / #f5e6cf** | **Привет!** |
| futaba | Futaba | ja | Daruma doll | #ff7fae / #e8b54a | こんにちは！ |
| yaya | Yaya | zh | Panda | #f0ece4 / #e82e2e | 你好！ |
| tiboujon | Ti Boujon | ht | Tanbou (Haitian barrel drum) | #00209f / #d21034 | Bonjou! |

`mascotForLang(lang)` returns the exact-language match, else Nuri.

**Runtime status: fallback-only, currently dead weight.** `src/components/MascotImage.tsx` renders the flat SVG `<Buddy>` whenever the mascot id is in `BUDDY_IDS` and only falls back to the `mascot.image` PNG "for any future buddy whose SVG hasn't been drawn yet". Since `BUDDY_IDS` (in `Buddy.tsx`) contains all ten ids, the PNG fallback path never fires today — the PNGs ship in `public/` unused unless an eleventh language lands before its SVG is drawn. `mascot.image` has exactly one consumer (`MascotImage.tsx` line 47); consumers of the registry itself span the landing page, dashboard, world, wallet, schedule, session, marketplace, and /early pages. `MascotImage` also implements the "alive, not metronomic" float: a deterministic hash of the mascot id picks animation delay (0–2 s, negative) and duration (3.1–3.9 s) so grouped buddies never bob in sync.

---

## 4. public/textures/ — globe textures (2 files, ~1.8 MB)

Used exclusively by `src/components/NuriGlobe.tsx` (the react-globe.gl Earth on the /world page):

- `earth-blue-marble.jpg` — 1,461,877 B, JPEG 4096×2048 equirectangular; passed as `globeImageUrl`. NASA "Blue Marble" imagery, the standard three-globe example texture, vendored locally so the app has no CDN dependency.
- `earth-topology.png` — 378,243 B, PNG 2048×1024; passed as `bumpImageUrl` (elevation bump map).

Provenance: commit `43c7ac4` "Realistic 3D globe, real people on the map…" (2026-06-24) replaced the earlier cobe dot-globe with the textured Earth and added **four** textures (`earth-blue-marble.jpg`, `earth-night.jpg`, `earth-topology.png`, `night-sky.png`); commit `5b2c825` "Consolidate nav to 3 clusters, remove dead code/assets, dedupe hooks" deleted `earth-night.jpg` and `night-sky.png` as dead assets, leaving the two in use. The globe renders with a transparent background, violet atmosphere (`#7c5cff`, altitude 0.22), auto-rotate 0.3, zoom clamped to distance 118–440 (globe radius 100), with clickable capital/people pins layered as HTML elements.

---

## 5. Loop-closing paragraph for materials-assets.md (the missing cross-reference)

materials-assets.md documents the ElevenLabs voice casting — ru = Bella (`hpp4J3VqNfWAUOO0d1Us`) "as Listik the matryoshka buddy", en = `JBFqnCBsd6RMkjVDRZzb` "Nuri" (Russian later re-voiced to Larisa Actrisa in `d0f032f`) — but never says where those characters come from. The answer: **the buddy characters are visual brand assets, defined canonically in `src/lib/mascots.ts` and drawn three ways over the project's life.** (1) 3D originals: Blender 5.0 scenes `docs/mascots/mascot-family.blend` / `mascot-family-toys.blend` with renders `lineup.png`, `lineup-toys.png`, `nuri-face.png`, a 2-second idle loop `family-idle.mp4`, and a 2560×1440 hero render of Listik herself, `docs/mascots/listik-matryoshka.png`. (2) Shipped 1024×1024 PNG renders in `public/mascots/` (one per buddy, `listik.png` included), wired as the `image` field of each `MASCOTS` entry. (3) The current in-app art: flat hand-drawn SVGs in `src/components/buddies/Buddy.tsx` (commit `3eb8614`), which render everywhere via `MascotImage.tsx`, demoting the PNGs to a never-yet-used fallback. So when the audio pipeline casts Bella "as Listik", it is voicing the red-and-cream (#e02f26/#f5e6cf) Russian matryoshka-doll sibling of Nuri whose design lineage runs blend file → PNG render → flat SVG. The neighboring `public/textures/` directory is similarly branding-adjacent infrastructure: the two NASA-derived Earth textures (`earth-blue-marble.jpg` 4096×2048, `earth-topology.png` 2048×1024) that skin the /world globe. None of these four locations contain GPA learning content.
