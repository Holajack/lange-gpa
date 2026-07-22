"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useConvex } from "convex/react";
import { blankProfile, useApp } from "@/lib/store";
import { meetingForHours } from "@/lib/sessionFlow";
import type { Profile } from "@/lib/types";

const PROFILE_OWNER_KEY = "lange.profile.owner.v1";
const BACKEND_ON = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_CONVEX_URL
);

/**
 * Two-way bridge between the Clerk account and the app profile.
 *
 * The profile is stored locally (localStorage, the live cache) AND in Convex
 * (the durable account, keyed by Clerk id). This component keeps them in sync:
 *
 *   • LOAD  — on sign-in, fetch the Convex profile and hydrate the app. Your
 *             account follows you to any device/browser; unverified browser
 *             cache is never claimed by another account.
 *   • PUSH  — whenever the profile changes (onboarding finish, progress,
 *             role switch…), upsert the FULL profile to Convex immediately.
 *   • CLEAR — on sign-out, drop the local cache so the next person on this
 *             browser never inherits the account.
 *
 * It also drives `cloudState` so the app shell waits for the account to load
 * before deciding onboarding-vs-app (no flash of a fresh onboarding).
 *
 * Only rendered when Clerk is configured (see the env guard below); keyless
 * demo builds stay fully anonymous and this code path never runs.
 */
function Bridge() {
  const { isLoaded, isSignedIn, user } = useUser();
  const convex = useConvex();
  const { profile, saveProfile, resetAll, setCloudState, updateProfile } = useApp();

  const loadedFor = useRef<string | null>(null); // clerkId whose account we've loaded
  const lastPushed = useRef<string>(""); // raw JSON last synced up (echo guard)
  const [loadRetry, setLoadRetry] = useState(0);
  const [pushRetry, setPushRetry] = useState(0);

  // ---- LOAD the account on sign-in (cloud is authoritative) ----
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      // Always clear on a signed-out cold start too. A previous user's Clerk
      // session may have expired while the app was closed, so relying only on
      // an observed signed-in → signed-out transition can leak their cache to
      // the next person who uses this browser.
      resetAll();
      try {
        localStorage.removeItem(PROFILE_OWNER_KEY);
      } catch {}
      lastPushed.current = "";
      loadedFor.current = null;
      setCloudState("ready");
      return;
    }

    if (loadedFor.current === user.id) return; // already loaded this account

    setCloudState("loading");
    let localBelongsToUser = false;
    try {
      localBelongsToUser = localStorage.getItem(PROFILE_OWNER_KEY) === user.id;
    } catch {}
    if (!localBelongsToUser) resetAll();

    let cancelled = false;
    let retryTimer: number | undefined;
    (async () => {
      try {
        const doc = await convex.query("profiles:getProfile" as never, {} as never);
        if (cancelled) return;
        const row = doc as
          | {
              data?: Profile;
              name: string;
              role: Profile["role"];
              targetLang: Profile["targetLang"];
              knownLangs: Profile["knownLangs"];
              immersion: boolean;
              hoursListened: number;
              phase: Profile["phase"];
            }
          | null;
        // Rows created before the lossless `data` field existed still belong
        // to a real account. Reconstruct their available progress instead of
        // mistaking them for a brand-new user and overwriting them.
        const cloud = row
          ? row.data ?? {
              ...blankProfile(),
              name: row.name,
              role: row.role,
              targetLang: row.targetLang,
              knownLangs: row.knownLangs,
              immersion: row.immersion,
              hoursLogged: row.hoursListened,
              minutesLogged: Math.round(row.hoursListened * 60),
              phase: row.phase,
              // blankProfile() defines meetingProgress (0), which would bypass
              // the store's self-heal and reset this account to Meeting 1 —
              // derive it from the logged hours here instead (same formula)
              meetingProgress: Math.max(0, meetingForHours(row.hoursListened) - 1),
            }
          : null;
        if (cloud) {
          // the account exists → it is the source of truth; hydrate local
          saveProfile(cloud);
          lastPushed.current = JSON.stringify(cloud);
        } else {
          // A new Clerk account starts clean. Production onboarding is behind
          // auth, so there is no anonymous profile to claim implicitly.
          resetAll();
          lastPushed.current = "";
        }
        try {
          localStorage.setItem(PROFILE_OWNER_KEY, user.id);
        } catch {}
        loadedFor.current = user.id;
        setCloudState("ready");
      } catch {
        // A failed read is not the same thing as "no profile". Keep the app in
        // its loading state and retry instead of sending the user through a
        // fresh onboarding that could later overwrite mature cloud progress.
        if (!cancelled) {
          retryTimer = window.setTimeout(() => setLoadRetry((n) => n + 1), 1800);
        }
      }
    })();
    return () => {
      cancelled = true;
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, [isLoaded, isSignedIn, user, convex, saveProfile, resetAll, setCloudState, loadRetry]);

  // ---- PUSH the full profile up whenever it changes (after the load settles) ----
  useEffect(() => {
    if (!isSignedIn || !user || !profile) return;
    if (loadedFor.current !== user.id) return; // wait until the initial load settled
    const raw = JSON.stringify(profile);
    if (raw === lastPushed.current) return;
    let cancelled = false;
    let retryTimer: number | undefined;
    void convex
      .mutation("profiles:upsertProfile" as never, {
        name: String(profile.name ?? ""),
        role: String(profile.role ?? "grower"),
        targetLang: String(profile.targetLang ?? "en"),
        knownLangs: Array.isArray(profile.knownLangs) ? profile.knownLangs.map(String) : [],
        immersion: Boolean(profile.immersion),
        hoursListened: Number(profile.hoursLogged ?? 0),
        phase: Number(profile.phase ?? 1),
        data: profile,
      } as never)
      .then(() => {
        if (!cancelled) lastPushed.current = raw;
      })
      .catch(() => {
        if (!cancelled) retryTimer = window.setTimeout(() => setPushRetry((n) => n + 1), 1800);
      });
    return () => {
      cancelled = true;
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, [profile, isSignedIn, user, convex, pushRetry]);

  // keep the profile photo synced with the Clerk account image
  useEffect(() => {
    if (!isSignedIn || !user || !profile) return;
    const img = user.imageUrl;
    if (img && profile.photoUrl !== img) updateProfile({ photoUrl: img });
  }, [isSignedIn, user, profile, updateProfile]);

  return null;
}

export function CloudProfileBridge() {
  if (!BACKEND_ON) return null;
  return <Bridge />;
}
