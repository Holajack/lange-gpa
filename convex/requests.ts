import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { displayName, requireIdentity, resolveTarget } from "./util";

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
    const fromClerkId = await requireIdentity(ctx);
    const toProfile = await resolveTarget(ctx, args.toProfileId, fromClerkId, "request");
    const toClerkId = toProfile.clerkId;
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const req = await ctx.db.get(args.requestId);
    if (!req) throw new Error("Request not found");
    if (req.toClerkId !== identity.subject) throw new Error("Not your request to answer");
    await ctx.db.patch(args.requestId, { status: args.accept ? "accepted" : "declined" });
    return args.accept;
  },
});

/** Requests addressed to me (newest first). */
export const myIncoming = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const rows = await ctx.db
      .query("requests")
      .withIndex("by_to", (q) => q.eq("toClerkId", identity.subject))
      .collect();
    return rows
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const rows = await ctx.db
      .query("requests")
      .withIndex("by_from", (q) => q.eq("fromClerkId", identity.subject))
      .collect();
    return rows.map((r) => ({
      id: r._id,
      toName: r.toName,
      lang: r.lang,
      status: r.status,
      ts: r.ts,
    }));
  },
});
