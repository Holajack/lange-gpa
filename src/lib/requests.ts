"use client";

/**
 * Client API for session requests (Tandem-style "ask to practice").
 *
 * Reads my incoming + outgoing requests from Convex and exposes send/respond.
 * Same keyless-safe gating as useRealPeople: bound to a no-op stub when Convex
 * isn't configured, so it never calls useConvex() without a provider.
 */

import { useCallback, useEffect, useState } from "react";
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

const CONVEX_ON = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_CONVEX_URL
);

function useRequestsLive(): RequestsApi {
  const convex = useConvex();
  const [incoming, setIncoming] = useState<IncomingRequest[]>([]);
  const [outgoing, setOutgoing] = useState<OutgoingRequest[]>([]);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [inc, out] = await Promise.all([
          convex.query("requests:myIncoming" as never, {} as never),
          convex.query("requests:myOutgoing" as never, {} as never),
        ]);
        if (cancelled) return;
        setIncoming(Array.isArray(inc) ? (inc as IncomingRequest[]) : []);
        setOutgoing(Array.isArray(out) ? (out as OutgoingRequest[]) : []);
      } catch {
        /* offline / transient — keep what we have */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [convex, tick]);

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

  return { incoming, outgoing, send, respond, refresh };
}

const STUB: RequestsApi = {
  incoming: [],
  outgoing: [],
  send: async () => {},
  respond: async () => {},
  refresh: () => {},
};

/** Session-request API (no-op when Convex is unconfigured). */
export const useRequests: () => RequestsApi = CONVEX_ON ? useRequestsLive : () => STUB;
