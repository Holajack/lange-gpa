"use client";

/**
 * Client API for the 18+ age gate on community exchange.
 *
 * The browser only ever ASKS the server what it already knows: adulthood is
 * derived server-side from the stored date of birth on every call, so nothing
 * here is a security boundary — it decides what we render, never what is
 * allowed. Same keyless-safe gating as useConnections: bound to a no-op stub
 * when Convex or community exchange is off, so it never calls useConvex()
 * without a provider.
 */

import { useCallback } from "react";
import { CONVEX_ON } from "@/lib/convexClient";
import { COMMUNITY_EXCHANGE_ON } from "@/lib/featureFlags";
import { usePolledQuery } from "@/lib/convexPoll";
import { useConvex } from "convex/react";

/** The self-attested adult age for community features. */
export const ADULT_AGE = 18;

/**
 * Whether the age gate can actually be answered in this build. With no Convex
 * there is no server to attest to (and no community data to reach), so the
 * client stops pretending to gate — the flags below already hide the features.
 */
export const AGE_GATE_ON = CONVEX_ON && COMMUNITY_EXCHANGE_ON;

export type AgeStatus = {
  /** the person has given us a date of birth */
  attested: boolean;
  /** derived server-side from that date of birth, re-derived on every read */
  adult: boolean;
  /** true until the first answer lands, so the UI can hold its shape */
  loading: boolean;
  /** record an ISO "YYYY-MM-DD" date of birth; rejects if the server refuses */
  attest: (birthDate: string) => Promise<void>;
};

type StatusRow = { attested: boolean; adult: boolean };

/**
 * Full years old on `nowMs`, or null when the date is unparseable. Mirrors the
 * server's ageOn so the card can name the outcome without a second round trip;
 * the server's answer is the one that counts.
 */
export function ageOn(birthDate: string, nowMs: number): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  // reject calendar-impossible days (Feb 30, Apr 31, …)
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  const now = new Date(nowMs);
  if (Number.isNaN(now.getTime())) return null;
  let age = now.getFullYear() - year;
  const monthDiff = now.getMonth() + 1 - month;
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < day)) age -= 1;
  if (age < 0 || age > 130) return null;
  return age;
}

function useAgeStatusLive(): AgeStatus {
  const convex = useConvex();
  const { data, refresh } = usePolledQuery<StatusRow | null>(
    async () => {
      const row = await convex.query("age:myAgeStatus" as never, {} as never);
      const r = (row ?? {}) as Partial<StatusRow>;
      return { attested: r.attested === true, adult: r.adult === true };
    },
    null,
    // a slow poll: two booleans, and it lets every mounted copy of the gate
    // agree after an attestation (and flip on the 18th birthday) without a
    // reload — the answer is re-derived server-side each time.
    { intervalMs: 15000 }
  );

  const attest = useCallback(
    async (birthDate: string) => {
      try {
        await convex.mutation("age:attestAge" as never, { birthDate } as never);
      } finally {
        // refresh either way: a rejected date still changes what we should show
        refresh();
      }
    },
    [convex, refresh]
  );

  return {
    attested: data?.attested ?? false,
    adult: data?.adult ?? false,
    loading: data === null,
    attest,
  };
}

const STUB: AgeStatus = {
  attested: false,
  adult: false,
  loading: false,
  attest: async () => {},
};

/**
 * My 18+ status for community features (no-op when Convex or community
 * exchange is off — those builds have nothing to gate).
 */
export const useAgeStatus: () => AgeStatus = AGE_GATE_ON ? useAgeStatusLive : () => STUB;
