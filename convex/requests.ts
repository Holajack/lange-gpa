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
import { isAdultClerkId, isAdultProfile, requireAdult } from "./age";

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
    await requireAdult(ctx, fromClerkId);
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
    // The recipient must be an adult too — a profile id kept from before the
    // gate would otherwise still reach them. Same wording as a block, so the
    // sender learns nothing about why.
    if (!isAdultProfile(toProfile, Date.now())) {
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
    // Accepting is the moment a connection exists, and a connection is what
    // unlocks messaging and calling — so that is what the age gate guards.
    // Declining stays open to everyone: nobody should need to be eighteen to
    // turn down contact they didn't ask for.
    if (args.accept) {
      await requireAdult(ctx, me);
      // Decline on the sender's behalf rather than erroring, exactly as a block
      // does, so an accept never reveals the other person's age.
      if (!(await isAdultClerkId(ctx, req.fromClerkId))) {
        if (req.status === "pending") await ctx.db.patch(args.requestId, { status: "declined" });
        return false;
      }
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
    // Same fail-closed shape as connections:myConnections — a non-adult sees no
    // one, and no adult's name reaches them through a pre-gate request either.
    if (!(await isAdultClerkId(ctx, identity.subject))) return [];
    const blockedIds = await blockedClerkIdsFor(ctx, identity.subject);
    const rows = await ctx.db
      .query("requests")
      .withIndex("by_to", (q) => q.eq("toClerkId", identity.subject))
      .collect();
    const visible = [];
    for (const r of rows) {
      if (blockedIds.has(r.fromClerkId)) continue;
      if (!(await isAdultClerkId(ctx, r.fromClerkId))) continue;
      visible.push({
        id: r._id,
        fromName: r.fromName,
        lang: r.lang,
        message: r.message,
        status: r.status,
        ts: r.ts,
      });
    }
    return visible.sort((a, b) => b.ts - a.ts);
  },
});

/** Requests I've sent — used to show a "requested" state in the UI. */
export const myOutgoing = query({
  args: {},
  handler: async (ctx) => {
    if (!communityExchangeEnabled()) return [];
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    if (!(await isAdultClerkId(ctx, identity.subject))) return [];
    const blockedIds = await blockedClerkIdsFor(ctx, identity.subject);
    const rows = await ctx.db
      .query("requests")
      .withIndex("by_from", (q) => q.eq("fromClerkId", identity.subject))
      .collect();
    const visible = [];
    for (const r of rows) {
      if (blockedIds.has(r.toClerkId)) continue;
      if (!(await isAdultClerkId(ctx, r.toClerkId))) continue;
      visible.push({
        id: r._id,
        toName: r.toName,
        lang: r.lang,
        status: r.status,
        ts: r.ts,
      });
    }
    return visible;
  },
});
