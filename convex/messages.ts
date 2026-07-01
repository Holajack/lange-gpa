import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { displayName, requireIdentity, resolveTarget } from "./util";

/**
 * 1:1 messaging (Stage D, text layer). The client targets a person by their
 * OPAQUE profile id (from profiles:listPeople); Clerk ids are resolved
 * server-side and never exposed. A `convoKey` (sorted clerk-id pair) groups
 * both directions into one thread.
 */

const convoKeyOf = (a: string, b: string) => [a, b].sort().join("|");

export const sendMessage = mutation({
  args: { toProfileId: v.id("profiles"), text: v.string() },
  handler: async (ctx, { toProfileId, text }) => {
    const from = await requireIdentity(ctx);
    const body = text.trim();
    if (!body) return null;
    const toProfile = await resolveTarget(ctx, toProfileId, from, "message");
    const to = toProfile.clerkId;
    const fromName = await displayName(ctx, from);

    return await ctx.db.insert("messages", {
      convoKey: convoKeyOf(from, to),
      fromClerkId: from,
      fromName,
      toClerkId: to,
      kind: "text",
      text: body.slice(0, 2000),
      ts: Date.now(),
      readByTo: false,
    });
  },
});

/** The full thread with one person (oldest → newest). */
export const conversation = query({
  args: { withProfileId: v.id("profiles") },
  handler: async (ctx, { withProfileId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { other: null, messages: [] };
    const me = identity.subject;
    const other = await ctx.db.get(withProfileId);
    if (!other) return { other: null, messages: [] };
    const data = (other.data ?? {}) as Record<string, unknown>;
    const key = convoKeyOf(me, other.clerkId);
    const rows = await ctx.db
      .query("messages")
      .withIndex("by_convo", (q) => q.eq("convoKey", key))
      .collect();
    rows.sort((a, b) => a.ts - b.ts);
    return {
      other: {
        id: other._id,
        name: other.name,
        photo: typeof data.photoUrl === "string" ? data.photoUrl : undefined,
      },
      messages: await Promise.all(
        rows.map(async (r) => ({
          id: r._id,
          mine: r.fromClerkId === me,
          kind: r.kind,
          text: r.text,
          audioUrl: r.storageId ? await ctx.storage.getUrl(r.storageId) : null,
          durationSec: r.durationSec ?? null,
          ts: r.ts,
        }))
      ),
    };
  },
});

/** Mark every message in a thread that's addressed to me as read. */
export const markRead = mutation({
  args: { withProfileId: v.id("profiles") },
  handler: async (ctx, { withProfileId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;
    const other = await ctx.db.get(withProfileId);
    if (!other) return;
    const key = convoKeyOf(identity.subject, other.clerkId);
    const rows = await ctx.db
      .query("messages")
      .withIndex("by_convo", (q) => q.eq("convoKey", key))
      .collect();
    for (const m of rows) {
      if (m.toClerkId === identity.subject && !m.readByTo) await ctx.db.patch(m._id, { readByTo: true });
    }
  },
});

/** Inbox: one row per person I've talked to, newest first. */
export const myConversations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const me = identity.subject;
    const incoming = await ctx.db
      .query("messages")
      .withIndex("by_to", (q) => q.eq("toClerkId", me))
      .collect();
    const outgoing = await ctx.db
      .query("messages")
      .withIndex("by_from", (q) => q.eq("fromClerkId", me))
      .collect();

    type Acc = { lastText: string; lastTs: number; lastMine: boolean; unread: number };
    const byOther = new Map<string, Acc>();
    for (const m of [...incoming, ...outgoing]) {
      const otherClerk = m.fromClerkId === me ? m.toClerkId : m.fromClerkId;
      const unreadToMe = m.toClerkId === me && !m.readByTo ? 1 : 0;
      const cur = byOther.get(otherClerk);
      if (!cur) {
        byOther.set(otherClerk, { lastText: m.text, lastTs: m.ts, lastMine: m.fromClerkId === me, unread: unreadToMe });
      } else {
        if (m.ts > cur.lastTs) {
          cur.lastText = m.text;
          cur.lastTs = m.ts;
          cur.lastMine = m.fromClerkId === me;
        }
        cur.unread += unreadToMe;
      }
    }

    const out: {
      otherProfileId: string;
      otherName: string;
      otherPhoto?: string;
      lastText: string;
      lastTs: number;
      lastMine: boolean;
      unread: number;
    }[] = [];
    for (const [otherClerk, acc] of byOther) {
      const prof = await ctx.db
        .query("profiles")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", otherClerk))
        .unique();
      if (!prof) continue;
      const data = (prof.data ?? {}) as Record<string, unknown>;
      out.push({
        otherProfileId: prof._id,
        otherName: prof.name,
        otherPhoto: typeof data.photoUrl === "string" ? data.photoUrl : undefined,
        lastText: acc.lastText,
        lastTs: acc.lastTs,
        lastMine: acc.lastMine,
        unread: acc.unread,
      });
    }
    out.sort((x, y) => y.lastTs - x.lastTs);
    return out;
  },
});

/** Total unread messages addressed to me — for a nav badge. */
export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;
    const rows = await ctx.db
      .query("messages")
      .withIndex("by_to_unread", (q) => q.eq("toClerkId", identity.subject).eq("readByTo", false))
      .collect();
    return rows.length;
  },
});

/* ---- voice notes (Stage D2) ---- */

/** A short-lived URL the client POSTs the recorded audio blob to. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

/** Send a voice note (the client uploads first, then passes the storage id). */
export const sendVoice = mutation({
  args: { toProfileId: v.id("profiles"), storageId: v.id("_storage"), durationSec: v.number() },
  handler: async (ctx, { toProfileId, storageId, durationSec }) => {
    const from = await requireIdentity(ctx);
    const toProfile = await resolveTarget(ctx, toProfileId, from, "message");
    const to = toProfile.clerkId;
    const fromName = await displayName(ctx, from);
    return await ctx.db.insert("messages", {
      convoKey: convoKeyOf(from, to),
      fromClerkId: from,
      fromName,
      toClerkId: to,
      kind: "voice",
      text: "",
      storageId,
      durationSec: Math.max(1, Math.round(durationSec)),
      ts: Date.now(),
      readByTo: false,
    });
  },
});
