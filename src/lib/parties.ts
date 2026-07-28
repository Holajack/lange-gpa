"use client";

/**
 * Client API for language parties (Stage E). Reads upcoming parties (optionally
 * filtered by language) plus the parties I host/attend, and exposes
 * create/join/leave/cancel. Same keyless-safe gating as useRequests/useMessages:
 * bound to a no-op stub when Convex isn't configured, and polls for near-real-
 * time updates because the app talks to Convex imperatively by string name.
 */

import { useCallback } from "react";
import { CONVEX_ON } from "@/lib/convexClient";
import { COMMUNITY_EXCHANGE_ON } from "@/lib/featureFlags";
import { usePolledQuery } from "@/lib/convexPoll";
import { useConvex } from "convex/react";

export type PartyGuest = { name: string; photo?: string; isHost: boolean; isMe: boolean };

export type Party = {
  id: string;
  title: string;
  topic: string | null;
  lang: string;
  kind: string;
  startsAt: number;
  durationMin: number;
  capacity: number | null;
  status: string;
  hostName: string;
  iAmHost: boolean;
  iAmGoing: boolean;
  guestCount: number;
  guests: PartyGuest[];
};

export type CreatePartyInput = {
  title: string;
  topic?: string;
  lang: string;
  kind: string;
  startsAt: number;
  durationMin: number;
  capacity?: number;
};

export type PartiesApi = {
  upcoming: Party[];
  mine: Party[];
  create: (input: CreatePartyInput) => Promise<void>;
  join: (partyId: string) => Promise<void>;
  leave: (partyId: string) => Promise<void>;
  cancel: (partyId: string) => Promise<void>;
  refresh: () => void;
};


function usePartiesLive(langFilter: string | null): PartiesApi {
  const convex = useConvex();
  const { data, refresh } = usePolledQuery<{ upcoming: Party[]; mine: Party[] }>(
    async () => {
      const [up, my] = await Promise.all([
        convex.query("parties:listUpcoming" as never, { lang: langFilter ?? undefined } as never),
        convex.query("parties:myParties" as never, {} as never),
      ]);
      return {
        upcoming: Array.isArray(up) ? (up as Party[]) : [],
        mine: Array.isArray(my) ? (my as Party[]) : [],
      };
    },
    { upcoming: [], mine: [] },
    { intervalMs: 5000, deps: [langFilter] }
  );

  const create = useCallback(
    async (input: CreatePartyInput) => {
      await convex.mutation("parties:createParty" as never, input as never);
      refresh();
    },
    [convex, refresh]
  );

  const join = useCallback(
    async (partyId: string) => {
      await convex.mutation("parties:joinParty" as never, { partyId } as never);
      refresh();
    },
    [convex, refresh]
  );

  const leave = useCallback(
    async (partyId: string) => {
      await convex.mutation("parties:leaveParty" as never, { partyId } as never);
      refresh();
    },
    [convex, refresh]
  );

  const cancel = useCallback(
    async (partyId: string) => {
      await convex.mutation("parties:cancelParty" as never, { partyId } as never);
      refresh();
    },
    [convex, refresh]
  );

  return { upcoming: data.upcoming, mine: data.mine, create, join, leave, cancel, refresh };
}

const STUB: PartiesApi = {
  upcoming: [],
  mine: [],
  create: async () => {},
  join: async () => {},
  leave: async () => {},
  cancel: async () => {},
  refresh: () => {},
};

/**
 * Language-parties API (no-op when Convex is unconfigured). Parties are part of
 * community exchange server-side — convex/parties.ts refuses every call when
 * that flag is off — so the client stops polling under the same condition
 * rather than asking for data it will never be given.
 */
export const useParties: (langFilter?: string | null) => PartiesApi =
  CONVEX_ON && COMMUNITY_EXCHANGE_ON
    ? (langFilter = null) => usePartiesLive(langFilter)
    : () => STUB;
