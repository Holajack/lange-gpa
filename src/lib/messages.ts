"use client";

/**
 * 1:1 messaging client (Stage D, text layer). Reads a thread / inbox / unread
 * count from Convex and polls for near-real-time updates (the app talks to
 * Convex imperatively by string name, so there's no live subscription). Same
 * keyless-safe gating as the other hooks — no-op when Convex is unconfigured.
 */

import { useCallback } from "react";
import { CONVEX_ON } from "@/lib/convexClient";
import { COMMUNITY_EXCHANGE_ON } from "@/lib/featureFlags";
import { usePolledQuery } from "@/lib/convexPoll";
import { useConvex } from "convex/react";

export type ChatMessage = {
  id: string;
  mine: boolean;
  text: string;
  ts: number;
  kind?: string;
  audioUrl?: string | null;
  durationSec?: number | null;
};
export type ChatOther = { id: string; name: string; photo?: string } | null;
export type Convo = {
  otherProfileId: string;
  otherName: string;
  otherPhoto?: string;
  lastText: string;
  lastTs: number;
  lastMine: boolean;
  unread: number;
};

export type ConversationApi = {
  other: ChatOther;
  messages: ChatMessage[];
  send: (text: string) => Promise<void>;
  sendVoice: (blob: Blob, durationSec: number) => Promise<void>;
  refresh: () => void;
};


function useConversationLive(withProfileId: string | null): ConversationApi {
  const convex = useConvex();
  const { data, refresh } = usePolledQuery<{ other: ChatOther; messages: ChatMessage[] }>(
    async () => {
      if (!withProfileId) return { other: null, messages: [] };
      const res = (await convex.query("messages:conversation" as never, { withProfileId } as never)) as {
        other: ChatOther;
        messages: ChatMessage[];
      };
      void convex.mutation("messages:markRead" as never, { withProfileId } as never).catch(() => {});
      return { other: res?.other ?? null, messages: Array.isArray(res?.messages) ? res.messages : [] };
    },
    { other: null, messages: [] },
    { intervalMs: 3000, enabled: !!withProfileId, deps: [withProfileId] }
  );

  const send = useCallback(
    async (text: string) => {
      if (!withProfileId || !text.trim()) return;
      await convex.mutation("messages:sendMessage" as never, { toProfileId: withProfileId, text } as never);
      refresh();
    },
    [convex, withProfileId, refresh]
  );

  const sendVoice = useCallback(
    async (blob: Blob, durationSec: number) => {
      if (!withProfileId) return;
      const uploadUrl = (await convex.mutation("messages:generateUploadUrl" as never, {} as never)) as string;
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type || "audio/webm" },
        body: blob,
      });
      const { storageId } = (await res.json()) as { storageId: string };
      await convex.mutation(
        "messages:sendVoice" as never,
        { toProfileId: withProfileId, storageId, durationSec } as never
      );
      refresh();
    },
    [convex, withProfileId, refresh]
  );

  return { other: data.other, messages: data.messages, send, sendVoice, refresh };
}

function useConversationsLive(): Convo[] {
  const convex = useConvex();
  const { data } = usePolledQuery<Convo[]>(
    async () => {
      const res = (await convex.query("messages:myConversations" as never, {} as never)) as Convo[];
      return Array.isArray(res) ? res : [];
    },
    [],
    { intervalMs: 4000 }
  );
  return data;
}

function useUnreadLive(): number {
  const convex = useConvex();
  const { data } = usePolledQuery<number>(
    async () => {
      const res = (await convex.query("messages:unreadCount" as never, {} as never)) as number;
      return typeof res === "number" ? res : 0;
    },
    0,
    { intervalMs: 5000 }
  );
  return data;
}

const STUB_CONV: ConversationApi = {
  other: null,
  messages: [],
  send: async () => {},
  sendVoice: async () => {},
  refresh: () => {},
};

export const useConversation: (withProfileId: string | null) => ConversationApi = CONVEX_ON && COMMUNITY_EXCHANGE_ON
  ? useConversationLive
  : () => STUB_CONV;
export const useConversations: () => Convo[] =
  CONVEX_ON && COMMUNITY_EXCHANGE_ON ? useConversationsLive : () => [];
export const useUnread: () => number =
  CONVEX_ON && COMMUNITY_EXCHANGE_ON ? useUnreadLive : () => 0;
