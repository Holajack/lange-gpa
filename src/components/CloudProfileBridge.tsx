"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useConvex } from "convex/react";
import { useApp } from "@/lib/store";
import type { Profile } from "@/lib/types";

const PROFILE_KEY = "lange.profile.v1";

/**
 * Two-way bridge between the Clerk account and the app profile.
 *
 * The profile is stored locally (localStorage, the live cache) AND in Convex
 * (the durable account, keyed by Clerk id). This component keeps them in sync:
 *
 *   • LOAD  — on sign-in, fetch the Convex profile and hydrate the app. Your
 *             account follows you to any device/browser. If you onboarded
 *             anonymously first, that local profile is "claimed" into the
 *             account instead (pushed up on the next effect).
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
  const { profile, saveProfile, resetAll, setCloudState } = useApp();

  const loadedFor = useRef<string | null>(null); // clerkId whose account we've loaded
  const lastPushed = useRef<string>(""); // raw JSON last synced up (echo guard)
  const wasSignedIn = useRef<boolean>(false);

  // ---- LOAD the account on sign-in (cloud wins), or prepare to CLAIM local ----
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      // a real sign-out just happened → forget this account on this device
      if (wasSignedIn.current) {
        resetAll();
        lastPushed.current = "";
        loadedFor.current = null;
      }
      wasSignedIn.current = false;
      setCloudState("ready");
      return;
    }

    wasSignedIn.current = true;
    if (loadedFor.current === user.id) return; // already loaded this account

    setCloudState("loading");
    let cancelled = false;
    (async () => {
      try {
        const doc = await convex.query("profiles:getProfile" as never, { clerkId: user.id } as never);
        if (cancelled) return;
        const cloud = doc && (doc as { data?: Profile }).data;
        if (cloud) {
          // the account exists → it is the source of truth; hydrate local
          saveProfile(cloud);
          lastPushed.current = JSON.stringify(cloud);
        } else {
          // no account yet: a local profile (anonymous onboarding) gets claimed
          // by the PUSH effect below; a brand-new user goes to onboarding.
          lastPushed.current = "";
        }
      } catch {
        // offline / transient — keep whatever is local; PUSH will retry
      } finally {
        if (!cancelled) {
          loadedFor.current = user.id;
          setCloudState("ready");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, user, convex, saveProfile, resetAll, setCloudState]);

  // ---- PUSH the full profile up whenever it changes (after the load settles) ----
  useEffect(() => {
    if (!isSignedIn || !user || !profile) return;
    if (loadedFor.current !== user.id) return; // wait until the initial load settled
    const raw = JSON.stringify(profile);
    if (raw === lastPushed.current) return;
    void convex
      .mutation("profiles:upsertProfile" as never, {
        clerkId: user.id,
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
        lastPushed.current = raw;
      })
      .catch(() => {
        /* offline or transient — the next change retries */
      });
  }, [profile, isSignedIn, user, convex]);

  return null;
}

export function CloudProfileBridge() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return null;
  return <Bridge />;
}
