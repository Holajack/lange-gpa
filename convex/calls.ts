import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { profileByClerkId, requireIdentity, resolveTarget } from "./util";

/**
 * WebRTC 1:1 call signalling (Stage D3). Convex only relays SDP + ICE between
 * two peers — the actual audio/video is peer-to-peer over free Google STUN.
 * Targets are the opaque profile id; Clerk ids are resolved server-side.
 */

/** Caller starts a call with their SDP offer; returns the call id. */
export const startCall = mutation({
  args: { toProfileId: v.id("profiles"), offer: v.string() },
  handler: async (ctx, { toProfileId, offer }) => {
    const caller = await requireIdentity(ctx);
    const callee = await resolveTarget(ctx, toProfileId, caller, "call");
    const me = await profileByClerkId(ctx, caller);

    return await ctx.db.insert("calls", {
      callerClerkId: caller,
      callerName: me?.name ?? "Someone",
      callerProfileId: me?._id,
      calleeClerkId: callee.clerkId,
      status: "ringing",
      offer,
      ts: Date.now(),
    });
  },
});

/** Is someone ringing me right now? (callee polls this) */
export const incomingCall = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const rows = await ctx.db
      .query("calls")
      .withIndex("by_callee", (q) => q.eq("calleeClerkId", identity.subject))
      .collect();
    const ringing = rows
      .filter((c) => c.status === "ringing" && Date.now() - c.ts < 60_000)
      .sort((a, b) => b.ts - a.ts)[0];
    if (!ringing) return null;
    return { callId: ringing._id, callerName: ringing.callerName, callerProfileId: ringing.callerProfileId, offer: ringing.offer };
  },
});

/** Poll a call's state (status + the answer, once the callee has set it). */
export const getCall = query({
  args: { callId: v.id("calls") },
  handler: async (ctx, { callId }) => {
    const call = await ctx.db.get(callId);
    if (!call) return null;
    return { id: call._id, status: call.status, answer: call.answer ?? null, offer: call.offer ?? null };
  },
});

/** Callee accepts with their SDP answer. */
export const answerCall = mutation({
  args: { callId: v.id("calls"), answer: v.string() },
  handler: async (ctx, { callId, answer }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const call = await ctx.db.get(callId);
    if (!call) throw new Error("Call not found");
    if (call.calleeClerkId !== identity.subject) throw new Error("Not your call");
    await ctx.db.patch(callId, { answer, status: "active" });
  },
});

/** Either side declines or hangs up. */
export const endCall = mutation({
  args: { callId: v.id("calls"), declined: v.optional(v.boolean()) },
  handler: async (ctx, { callId, declined }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;
    const call = await ctx.db.get(callId);
    if (!call) return;
    if (call.callerClerkId !== identity.subject && call.calleeClerkId !== identity.subject) return;
    await ctx.db.patch(callId, { status: declined ? "declined" : "ended" });
  },
});

/** Add one of my ICE candidates to the call. */
export const addIce = mutation({
  args: { callId: v.id("calls"), sender: v.string(), candidate: v.string() },
  handler: async (ctx, { callId, sender, candidate }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;
    await ctx.db.insert("iceCandidates", { callId, sender, candidate, ts: Date.now() });
  },
});

/** Get the OTHER side's ICE candidates (poll; client de-dupes by id). */
export const getIce = query({
  args: { callId: v.id("calls"), from: v.string() },
  handler: async (ctx, { callId, from }) => {
    const rows = await ctx.db
      .query("iceCandidates")
      .withIndex("by_call", (q) => q.eq("callId", callId))
      .collect();
    return rows
      .filter((r) => r.sender === from)
      .map((r) => ({ id: r._id, candidate: r.candidate }));
  },
});
