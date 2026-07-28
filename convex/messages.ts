import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  communityExchangeEnabled,
  displayName,
  profileByClerkId,
  requireCommunityExchangeEnabled,
  requireIdentity,
  resolveTarget,
} from "./util";
import { blockedClerkIdsFor, isBlockedEitherWay } from "./safety";
import { areConnected, requireConnection } from "./connections";
import { isAdultProfile, requireAdult } from "./age";

/**
 * 1:1 messaging (Stage D, text layer). The client targets a person by their
 * OPAQUE profile id (from profiles:listPeople); Clerk ids are resolved
 * server-side and never exposed. A `convoKey` (sorted clerk-id pair) groups
 * both directions into one thread.
 *
 * Reads are gated exactly as hard as writes. A thread already sent is still an
 * adults-only surface — message bodies, names, photos, and signed voice-note
 * URLs — and the opaque profile id the inbox hands back is the very token every
 * write path takes as its target, so an ungated read would reopen the discovery
 * hole `profiles:listPeople` was closed to shut. Both sides must be adults;
 * anything less returns the same empty shape as "not signed in".
 */

const convoKeyOf = (a: string, b: string) => [a, b].sort().join("|");

export const sendMessage = mutation({
  args: { toProfileId: v.id("profiles"), text: v.string() },
  handler: async (ctx, { toProfileId, text }) => {
    requireCommunityExchangeEnabled();
    const from = await requireIdentity(ctx);
    await requireAdult(ctx, from);
    const body = text.trim();
    if (!body) return null;
    const recent = await ctx.db
      .query("messages")
      .withIndex("by_from", (q) => q.eq("fromClerkId", from))
      .collect();
    if (recent.filter((message) => Date.now() - message.ts < 60_000).length >= 30) {
      throw new Error("Please wait before sending more messages");
    }
    const toProfile = await resolveTarget(ctx, toProfileId, from, "message");
    const to = toProfile.clerkId;
    if (await isBlockedEitherWay(ctx, from, to)) {
      throw new Error("This conversation is unavailable");
    }
    // Both sides must be adults, and the refusal reads the same as a block so
    // it never confirms anything about the other person.
    if (!isAdultProfile(toProfile, Date.now())) {
      throw new Error("This conversation is unavailable");
    }
    // Stage C: only connected people (an accepted session request) may message.
    await requireConnection(ctx, from, to);
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
    if (!communityExchangeEnabled()) return { other: null, messages: [] };
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { other: null, messages: [] };
    const me = identity.subject;
    const now = Date.now();
    // 18+, both ways, mirroring sendMessage below. Every refusal from here down
    // returns the identical empty shape, so probing a profile id never
    // distinguishes "under age" from "blocked" from "no such thread".
    if (!isAdultProfile(await profileByClerkId(ctx, me), now)) {
      return { other: null, messages: [] };
    }
    const other = await ctx.db.get(withProfileId);
    if (!other || !isAdultProfile(other, now)) return { other: null, messages: [] };
    if (await isBlockedEitherWay(ctx, me, other.clerkId)) {
      return { other: null, messages: [] };
    }
    // The write path requires a connection, so the read path does too —
    // otherwise `other` (name + photo) came back for ANY profile id handed in,
    // including an adult who never opted into the roster at all.
    if (!(await areConnected(ctx, me, other.clerkId))) {
      return { other: null, messages: [] };
    }
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
    requireCommunityExchangeEnabled();
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;
    // A mutation, and one the other side observes: flipping readByTo surfaces a
    // live read receipt in an adult's UI. That is a non-adult writing state an
    // adult can see, so it throws rather than no-ops.
    await requireAdult(ctx, identity.subject);
    const other = await ctx.db.get(withProfileId);
    if (!other) return;
    if (!isAdultProfile(other, Date.now())) return;
    if (await isBlockedEitherWay(ctx, identity.subject, other.clerkId)) return;
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
    if (!communityExchangeEnabled()) return [];
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const me = identity.subject;
    const now = Date.now();
    // Same shape as connections:myConnections — a minor sees no one, and no
    // minor is listed to anyone. Threads predating the age gate go quiet until
    // both sides attest.
    if (!isAdultProfile(await profileByClerkId(ctx, me), now)) return [];
    const blockedIds = await blockedClerkIdsFor(ctx, me);
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
      if (blockedIds.has(otherClerk)) continue;
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
      const prof = await profileByClerkId(ctx, otherClerk);
      if (!prof || !isAdultProfile(prof, now)) continue;
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
    if (!communityExchangeEnabled()) return 0;
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;
    const me = identity.subject;
    const now = Date.now();
    // The nav badge is a notification. Leaving it live for a non-adult keeps
    // pulling them toward an inbox the server now returns empty.
    if (!isAdultProfile(await profileByClerkId(ctx, me), now)) return 0;
    const rows = await ctx.db
      .query("messages")
      .withIndex("by_to_unread", (q) => q.eq("toClerkId", me).eq("readByTo", false))
      .collect();
    const blockedIds = await blockedClerkIdsFor(ctx, me);
    const candidates = rows.filter((row) => !blockedIds.has(row.fromClerkId));

    // Count only senders myConversations would actually show, so the badge can
    // never advertise unread mail from a thread the inbox has dropped. One
    // profile lookup per distinct sender, not per message.
    const adultSender = new Map<string, boolean>();
    for (const clerkId of new Set(candidates.map((row) => row.fromClerkId))) {
      adultSender.set(clerkId, isAdultProfile(await profileByClerkId(ctx, clerkId), now));
    }
    return candidates.filter((row) => adultSender.get(row.fromClerkId) === true).length;
  },
});

/* ---- voice notes (Stage D2) ---- */

/** A short-lived URL the client POSTs the recorded audio blob to. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    requireCommunityExchangeEnabled();
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    // Gated here as well as in sendVoice: this hands out a writable storage
    // URL, so it is a capability in its own right, not just a step toward one.
    await requireAdult(ctx, identity.subject);
    return await ctx.storage.generateUploadUrl();
  },
});

/** Send a voice note (the client uploads first, then passes the storage id). */
export const sendVoice = mutation({
  args: { toProfileId: v.id("profiles"), storageId: v.id("_storage"), durationSec: v.number() },
  handler: async (ctx, { toProfileId, storageId, durationSec }) => {
    requireCommunityExchangeEnabled();
    const from = await requireIdentity(ctx);
    await requireAdult(ctx, from);
    if (!Number.isFinite(durationSec) || durationSec < 1 || durationSec > 300) {
      throw new Error("Voice notes must be between 1 second and 5 minutes");
    }
    const recent = await ctx.db
      .query("messages")
      .withIndex("by_from", (q) => q.eq("fromClerkId", from))
      .collect();
    if (recent.filter((message) => Date.now() - message.ts < 60_000).length >= 30) {
      throw new Error("Please wait before sending more messages");
    }
    const toProfile = await resolveTarget(ctx, toProfileId, from, "message");
    const to = toProfile.clerkId;
    if (await isBlockedEitherWay(ctx, from, to)) {
      throw new Error("This conversation is unavailable");
    }
    // Both sides must be adults, and the refusal reads the same as a block so
    // it never confirms anything about the other person.
    if (!isAdultProfile(toProfile, Date.now())) {
      throw new Error("This conversation is unavailable");
    }
    // Stage C: only connected people (an accepted session request) may message.
    await requireConnection(ctx, from, to);
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
