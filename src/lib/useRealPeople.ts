"use client";

/**
 * Live roster of real signed-up growers/nurturers for the /world map.
 *
 * Reads the privacy-preserving `profiles:listPeople` Convex query (city-level
 * only, no exact location, no Clerk id) and geocodes each person's city to a
 * city-centre pin. Returns everyone with the current user flagged `me`.
 *
 * Convex React context only exists when Clerk + Convex are configured (see
 * src/components/Providers.tsx). The hook is bound to a no-op in keyless demo
 * builds so it never calls useConvex() without a provider — same gating idea
 * as CloudProfileBridge. The env constant is fixed for a deployment, so this
 * is safe at runtime.
 */

import { useEffect, useState } from "react";
import { useConvex } from "convex/react";
import { geocodeCity } from "./geocode";
import type { LangCode } from "./types";

export type RealPerson = {
  id: string;
  me: boolean;
  name: string;
  role: string;
  targetLang: LangCode;
  knownLangs: LangCode[];
  nurtureLangs: LangCode[];
  phase: number;
  city?: string;
  country?: string;
  bio?: string;
  interests: string[];
  exchange: boolean;
  /** city-centre coordinates once geocoded (absent until/unless resolved) */
  lat?: number;
  lng?: number;
};

const CONVEX_ON = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_CONVEX_URL
);

function useRealPeopleLive(): RealPerson[] {
  const convex = useConvex();
  const [people, setPeople] = useState<RealPerson[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = (await convex.query(
          "profiles:listPeople" as never,
          {} as never
        )) as RealPerson[];
        if (!Array.isArray(rows)) return;
        const withCoords = await Promise.all(
          rows.map(async (r) => {
            if (!r.city) return r;
            const coord = await geocodeCity(r.city, r.country);
            return coord ? { ...r, lat: coord.lat, lng: coord.lng } : r;
          })
        );
        if (!cancelled) setPeople(withCoords);
      } catch {
        /* offline / transient — keep whatever we have */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [convex]);

  return people;
}

const EMPTY: RealPerson[] = [];

/** Real signed-up people for the world map (no-op when Convex is unconfigured). */
export const useRealPeople: () => RealPerson[] = CONVEX_ON ? useRealPeopleLive : () => EMPTY;
