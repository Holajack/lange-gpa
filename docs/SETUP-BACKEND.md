# Nurilang backend setup — Convex + Clerk

The app ships **keyless-safe**: with no env vars it builds and runs exactly as
the current demo (localStorage state, no auth). The scaffolding below activates
the moment you create the two accounts and paste four keys. No code changes
needed.

## What is already wired vs. what waits on keys

| Piece | Status |
| --- | --- |
| `convex/schema.ts` — profiles, bookings, sessionEvents tables | Written, deploys on first `npx convex dev` |
| `convex/profiles.ts` / `bookings.ts` / `sessions.ts` — `upsertProfile`, `getProfile`, `createBooking`, `listBookings`, `appendEvent`, `eventsByRoom` | Written, deploy with the schema |
| `src/components/Providers.tsx` — ClerkProvider + ConvexProviderWithClerk around the whole app | Wired; activates automatically when both `NEXT_PUBLIC_` keys exist, otherwise renders children untouched |
| `src/middleware.ts` — `clerkMiddleware()` | Wired; passthrough (`NextResponse.next()`) until the publishable key exists |
| `convex/_generated/` (typed client API) | **Does not exist yet** — created by step 1. Nothing under `src/` imports it, and the root `tsconfig.json` excludes `convex/`, so the Next build never needs it |
| Session room live sync, profile sync UI | **Pending** — the functions exist server-side; client call sites land after codegen (see sections 3–4) |

## 1. Create the Convex project

```bash
cd /Volumes/LaCie/GPA_Language_Learning
npx convex dev
```

- Log in (GitHub) when prompted, choose **create a new project** (name: `lange`).
- This writes `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` into `.env.local`
  automatically, generates `convex/_generated/`, and pushes the schema +
  functions. Leave it running while developing — it live-reloads `convex/`.

## 2. Create the Clerk app and link it to Convex

1. At [clerk.com](https://clerk.com) create an application (name: `Nurilang`,
   enable Email + Google or whatever sign-in you want).
2. In the Clerk dashboard go to **Configure → JWT templates → New template →
   Convex**. Keep the template name exactly **`convex`** (Convex looks it up by
   that name). Copy the **Issuer** URL it shows.
3. Tell Convex about Clerk — create `convex/auth.config.ts`:

   ```ts
   export default {
     providers: [
       {
         domain: "https://YOUR-ISSUER.clerk.accounts.dev", // Issuer from step 2
         applicationID: "convex",
       },
     ],
   };
   ```

   (`npx convex dev` picks it up and redeploys.)
4. Paste the four keys into `.env.local` (copy `.env.example`) **and** into
   Vercel → Project → Settings → Environment Variables, then redeploy:

   - `NEXT_PUBLIC_CONVEX_URL` (from step 1)
   - `CONVEX_DEPLOYMENT` (from step 1 — local only; on Vercel use
     `npx convex deploy` for the prod deployment instead)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (Clerk → API keys)
   - `CLERK_SECRET_KEY` (Clerk → API keys)

   The moment both `NEXT_PUBLIC_` keys are present, `Providers.tsx` mounts
   Clerk + Convex and `src/middleware.ts` switches from passthrough to
   `clerkMiddleware()` on the next build. With them absent everything stays a
   keyless demo — that is the contract.

## 3. Live two-device sessions — the CONVEX_SYNC marker

The session room (`src/app/(app)/session/page.tsx`) is being built around a
`CONVEX_SYNC` marker: the place where local card-state changes are dispatched
today, and where the Convex realtime channel plugs in. Once `_generated`
exists, the wiring is:

```tsx
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

const append = useMutation(api.sessions.appendEvent);
const events = useQuery(api.sessions.eventsByRoom, { roomId });
```

- **Nurturer device** (dictates pacing): at the `CONVEX_SYNC` marker, replace /
  augment the local dispatch with
  `append({ roomId, type: "reveal", payload: { cardId } })` — same for
  `"review_ask"`, `"answer"`, `"role_switch"`.
- **Grower device**: `eventsByRoom` is a live subscription — Convex re-runs it
  on every insert, so applying `events` in `seq` order replays the nurturer's
  reveals in real time. Track the last applied `seq` and pass it as `after` to
  skip already-applied events.
- `seq` and `ts` are assigned server-side in `appendEvent`, so ordering is
  consistent across devices; `roomId` can stay the booking id.

## 4. Profile sync replaces localStorage (later)

`profiles` mirrors the `Profile` shape in `src/lib/types.ts` field-for-field
(`name`, `role`, `targetLang`, `knownLangs`, `immersion`, `hoursListened`,
`phase`) plus `clerkId`. The migration path inside `src/lib/store.tsx`:

1. On sign-in, `useQuery(api.profiles.getProfile, { clerkId })` — if a server
   profile exists, hydrate the store from it instead of localStorage.
2. If not, push the existing localStorage profile up once via
   `useMutation(api.profiles.upsertProfile)` (one-time adoption of demo data).
3. Thereafter `saveProfile` calls `upsertProfile` as well as localStorage —
   localStorage becomes the offline cache, Convex the source of truth, and the
   same profile follows the user across devices (which is what makes the
   two-device session in section 3 meaningful).

Until keys exist, none of this runs and localStorage remains the only store.

## Build invariants (do not break)

- Nothing under `src/` may import `convex/_generated` — it only exists after
  step 1, and Vercel's keyless build would fail.
- Root `tsconfig.json` excludes `convex/`; the functions are typechecked by
  `npx convex dev` against `convex/tsconfig.json` instead.
- `Providers.tsx` and `src/middleware.ts` must keep their keyless fallbacks.
