import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  communityExchangeEnabled,
  displayName,
  requireCommunityExchangeEnabled,
  requireIdentity,
  resolveTarget,
} from "./util";
import { blockedClerkIdsFor, isBlockedEitherWay } from "./safety";

/**
 * Session requests between two real people (Tandem-style). The client sends the
 * recipient's OPAQUE profile id (from profiles:listPeople) — never a Clerk id —
 * and we resolve it to the Clerk id server-side.
 */

/** Send (or refresh) a pending session request to another person. */
export const sendRequest = mutation({
  args: {
    toProfileId: v.id("profiles"),
    lang: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireCommunityExchangeEnabled();
    const fromClerkId = await requireIdentity(ctx);
    if (!/^[a-z]{2}$/.test(args.lang)) throw new Error("Invalid language");
    if ((args.message?.length ?? 0) > 500) throw new Error("Message is too long");
    const sent = await ctx.db
      .query("requests")
      .withIndex("by_from", (q) => q.eq("fromClerkId", fromClerkId))
      .collect();
    if (sent.filter((request) => Date.now() - request.ts < 60 * 60_000).length >= 20) {
      throw new Error("Please wait before sending more requests");
    }
    const toProfile = await resolveTarget(ctx, args.toProfileId, fromClerkId, "request");
    const toClerkId = toProfile.clerkId;
    if (await isBlockedEitherWay(ctx, fromClerkId, toClerkId)) {
      throw new Error("This request is unavailable");
    }
    const fromName = await displayName(ctx, fromClerkId);

    // refresh an existing pending request instead of inserting a duplicate
    const existing = await ctx.db
      .query("requests")
      .withIndex("by_pair", (q) => q.eq("fromClerkId", fromClerkId).eq("toClerkId", toClerkId))
      .collect();
    const pending = existing.find((r) => r.status === "pending");
    if (pending) {
      await ctx.db.patch(pending._id, { lang: args.lang, message: args.message, ts: Date.now() });
      return pending._id;
    }

    return await ctx.db.insert("requests", {
      fromClerkId,
      fromName,
      toClerkId,
      toName: toProfile.name,
      lang: args.lang,
      message: args.message,
      status: "pending",
      ts: Date.now(),
    });
  },
});

/** Recipient accepts or declines a request addressed to them. */
export const respondRequest = mutation({
  args: { requestId: v.id("requests"), accept: v.boolean() },
  handler: async (ctx, args) => {
    requireCommunityExchangeEnabled();
    const me = await requireIdentity(ctx);
    const req = await ctx.db.get(args.requestId);
    if (!req) throw new Error("Request not found");
    if (req.toClerkId !== me) throw new Error("Not your request to answer");
    if (await isBlockedEitherWay(ctx, req.fromClerkId, req.toClerkId)) {
      if (req.status === "pending") await ctx.db.patch(args.requestId, { status: "declined" });
      return false;
    }
    await ctx.db.patch(args.requestId, { status: args.accept ? "accepted" : "declined" });
    return args.accept;
  },
});

/** Requests addressed to me (newest first). */
export const myIncoming = query({
  args: {},
  handler: async (ctx) => {
    if (!communityExchangeEnabled()) return [];
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const blockedIds = await blockedClerkIdsFor(ctx, identity.subject);
    const rows = await ctx.db
      .query("requests")
      .withIndex("by_to", (q) => q.eq("toClerkId", identity.subject))
      .collect();
    return rows
      .filter((r) => !blockedIds.has(r.fromClerkId))
      .map((r) => ({
        id: r._id,
        fromName: r.fromName,
        lang: r.lang,
        message: r.message,
        status: r.status,
        ts: r.ts,
      }))
      .sort((a, b) => b.ts - a.ts);
  },
});

/** Requests I've sent — used to show a "requested" state in the UI. */
export const myOutgoing = query({
  args: {},
  handler: async (ctx) => {
    if (!communityExchangeEnabled()) return [];
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const blockedIds = await blockedClerkIdsFor(ctx, identity.subject);
    const rows = await ctx.db
      .query("requests")
      .withIndex("by_from", (q) => q.eq("fromClerkId", identity.subject))
      .collect();
    return rows
      .filter((r) => !blockedIds.has(r.toClerkId))
      .map((r) => ({
        id: r._id,
        toName: r.toName,
        lang: r.lang,
        status: r.status,
        ts: r.ts,
      }));
  },
});
