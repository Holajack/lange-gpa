"use client";

/**
 * Client API for session requests (Tandem-style "ask to practice").
 *
 * Reads my incoming + outgoing requests from Convex and exposes send/respond.
 * Same keyless-safe gating as useRealPeople: bound to a no-op stub when Convex
 * isn't configured, so it never calls useConvex() without a provider.
 */

import { useCallback, useMemo } from "react";
import { CONVEX_ON } from "@/lib/convexClient";
import { COMMUNITY_EXCHANGE_ON } from "@/lib/featureFlags";
import { usePolledQuery } from "@/lib/convexPoll";
import { useConvex } from "convex/react";

export type IncomingRequest = {
  id: string;
  fromName: string;
  lang: string;
  message?: string;
  status: string;
  ts: number;
};

export type OutgoingRequest = {
  id: string;
  toName: string;
  lang: string;
  status: string;
  ts: number;
};

export type RequestsApi = {
  incoming: IncomingRequest[];
  outgoing: OutgoingRequest[];
  send: (toProfileId: string, lang: string, message?: string) => Promise<void>;
  respond: (requestId: string, accept: boolean) => Promise<void>;
  refresh: () => void;
};


function useRequestsLive(): RequestsApi {
  const convex = useConvex();
  const { data, refresh } = usePolledQuery<{ incoming: IncomingRequest[]; outgoing: OutgoingRequest[] }>(
    async () => {
      const [inc, out] = await Promise.all([
        convex.query("requests:myIncoming" as never, {} as never),
        convex.query("requests:myOutgoing" as never, {} as never),
      ]);
      return {
        incoming: Array.isArray(inc) ? (inc as IncomingRequest[]) : [],
        outgoing: Array.isArray(out) ? (out as OutgoingRequest[]) : [],
      };
    },
    { incoming: [], outgoing: [] }
  );

  const send = useCallback(
    async (toProfileId: string, lang: string, message?: string) => {
      await convex.mutation("requests:sendRequest" as never, { toProfileId, lang, message } as never);
      refresh();
    },
    [convex, refresh]
  );

  const respond = useCallback(
    async (requestId: string, accept: boolean) => {
      await convex.mutation("requests:respondRequest" as never, { requestId, accept } as never);
      refresh();
    },
    [convex, refresh]
  );

  return { incoming: data.incoming, outgoing: data.outgoing, send, respond, refresh };
}

const STUB: RequestsApi = {
  incoming: [],
  outgoing: [],
  send: async () => {},
  respond: async () => {},
  refresh: () => {},
};

/** Session-request API (no-op when Convex is unconfigured). */
export const useRequests: () => RequestsApi =
  CONVEX_ON && COMMUNITY_EXCHANGE_ON ? useRequestsLive : () => STUB;

/* ------------------------------- connections ------------------------------ */

type Connection = { profileId: string; name: string; ts: number };
const EMPTY_CONNECTIONS = new Set<string>();

function useConnectionsLive(): Set<string> {
  const convex = useConvex();
  const { data } = usePolledQuery<Connection[]>(async () => {
    const rows = await convex.query("connections:myConnections" as never, {} as never);
    return Array.isArray(rows) ? (rows as Connection[]) : [];
  }, []);
  return useMemo(() => new Set(data.map((c) => c.profileId)), [data]);
}

/**
 * The set of opaque profile ids I'm connected with (an accepted session
 * request either way). Gates messaging/calling in the UI; empty when Convex
 * or community exchange is off.
 */
export const useConnections: () => Set<string> =
  CONVEX_ON && COMMUNITY_EXCHANGE_ON ? useConnectionsLive : () => EMPTY_CONNECTIONS;
