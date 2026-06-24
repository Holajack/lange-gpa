"use client";

/**
 * 1:1 messaging client (Stage D, text layer). Reads a thread / inbox / unread
 * count from Convex and polls for near-real-time updates (the app talks to
 * Convex imperatively by string name, so there's no live subscription). Same
 * keyless-safe gating as the other hooks — no-op when Convex is unconfigured.
 */

import { useCallback, useEffect, useState } from "react";
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

const CONVEX_ON = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_CONVEX_URL
);

function useConversationLive(withProfileId: string | null): ConversationApi {
  const convex = useConvex();
  const [other, setOther] = useState<ChatOther>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const refresh = useCallback(async () => {
    if (!withProfileId) {
      setOther(null);
      setMessages([]);
      return;
    }
    try {
      const res = (await convex.query("messages:conversation" as never, { withProfileId } as never)) as {
        other: ChatOther;
        messages: ChatMessage[];
      };
      setOther(res?.other ?? null);
      setMessages(Array.isArray(res?.messages) ? res.messages : []);
      void convex.mutation("messages:markRead" as never, { withProfileId } as never).catch(() => {});
    } catch {
      /* offline / transient */
    }
  }, [convex, withProfileId]);

  useEffect(() => {
    if (!withProfileId) return;
    void refresh();
    const id = window.setInterval(() => void refresh(), 3000);
    return () => window.clearInterval(id);
  }, [withProfileId, refresh]);

  const send = useCallback(
    async (text: string) => {
      if (!withProfileId || !text.trim()) return;
      await convex.mutation("messages:sendMessage" as never, { toProfileId: withProfileId, text } as never);
      void refresh();
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
      void refresh();
    },
    [convex, withProfileId, refresh]
  );

  return { other, messages, send, sendVoice, refresh: () => void refresh() };
}

function useConversationsLive(): Convo[] {
  const convex = useConvex();
  const [convos, setConvos] = useState<Convo[]>([]);
  useEffect(() => {
    let on = true;
    const run = async () => {
      try {
        const res = (await convex.query("messages:myConversations" as never, {} as never)) as Convo[];
        if (on) setConvos(Array.isArray(res) ? res : []);
      } catch {
        /* ignore */
      }
    };
    void run();
    const id = window.setInterval(run, 4000);
    return () => {
      on = false;
      window.clearInterval(id);
    };
  }, [convex]);
  return convos;
}

function useUnreadLive(): number {
  const convex = useConvex();
  const [n, setN] = useState(0);
  useEffect(() => {
    let on = true;
    const run = async () => {
      try {
        const res = (await convex.query("messages:unreadCount" as never, {} as never)) as number;
        if (on) setN(typeof res === "number" ? res : 0);
      } catch {
        /* ignore */
      }
    };
    void run();
    const id = window.setInterval(run, 5000);
    return () => {
      on = false;
      window.clearInterval(id);
    };
  }, [convex]);
  return n;
}

const STUB_CONV: ConversationApi = {
  other: null,
  messages: [],
  send: async () => {},
  sendVoice: async () => {},
  refresh: () => {},
};

export const useConversation: (withProfileId: string | null) => ConversationApi = CONVEX_ON
  ? useConversationLive
  : () => STUB_CONV;
export const useConversations: () => Convo[] = CONVEX_ON ? useConversationsLive : () => [];
export const useUnread: () => number = CONVEX_ON ? useUnreadLive : () => 0;
