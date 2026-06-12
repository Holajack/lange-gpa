"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useConvex } from "convex/react";

const PROFILE_KEY = "lange.profile.v1";

/**
 * One-way cloud backup of the grower's profile (local-first, local wins).
 *
 * While signed in, the localStorage profile is pushed to Convex
 * (profiles.upsertProfile, keyed by Clerk id) whenever it changes —
 * checked on mount, on the `storage` event, and on a slow poll since
 * same-tab writes don't fire `storage`. The localStorage copy remains
 * the source of truth; cloud sync never blocks or mutates local state.
 *
 * Only ever mounted inside ConvexProviderWithClerk (see Providers.tsx),
 * so keyless deploys never load this code path.
 */
export function ProfileSync() {
  const { user, isSignedIn } = useUser();
  const convex = useConvex();
  const lastPushed = useRef<string>("");

  useEffect(() => {
    if (!isSignedIn || !user) return;

    const push = () => {
      try {
        const raw = localStorage.getItem(PROFILE_KEY);
        if (!raw || raw === lastPushed.current) return;
        const p = JSON.parse(raw);
        if (!p?.name || !p?.targetLang) return;
        // mutation args mirror the original Profile core; map renamed fields
        void convex
          .mutation("profiles:upsertProfile" as never, {
            clerkId: user.id,
            name: String(p.name),
            role: String(p.role ?? "grower"),
            targetLang: String(p.targetLang),
            knownLangs: Array.isArray(p.knownLangs) ? p.knownLangs.map(String) : [],
            immersion: Boolean(p.immersion),
            hoursListened: Number(p.hoursLogged ?? p.hoursListened ?? 0),
            phase: Number(p.phase ?? 1),
          } as never)
          .then(() => {
            lastPushed.current = raw;
          })
          .catch(() => {
            /* offline or transient — next change retries */
          });
      } catch {
        /* malformed local state — never break the app over sync */
      }
    };

    push();
    const onStorage = (e: StorageEvent) => {
      if (e.key === PROFILE_KEY) push();
    };
    window.addEventListener("storage", onStorage);
    const poll = setInterval(push, 15000);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(poll);
    };
  }, [isSignedIn, user, convex]);

  return null;
}
