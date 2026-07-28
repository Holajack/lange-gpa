import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import {
  communityExchangeEnabled,
  dataOf,
  profileByClerkId,
  requireCommunityExchangeEnabled,
  requireIdentity,
  resolveTarget,
} from "./util";
import { blockedClerkIdsFor, isBlockedEitherWay } from "./safety";
import { requireConnection } from "./connections";

const MAX_SDP_BYTES = 250_000;
const MAX_ICE_BYTES = 16_000;

async function callForParticipant(
  ctx: QueryCtx | MutationCtx,
  callId: Id<"calls">,
  allowBlocked = false
) {
  const me = await requireIdentity(ctx);
  const call = await ctx.db.get(callId);
  if (!call) throw new Error("Call not found");
  if (call.callerClerkId !== me && call.calleeClerkId !== me) {
    throw new Error("Not your call");
  }
  if (
    !allowBlocked &&
    (await isBlockedEitherWay(ctx, call.callerClerkId, call.calleeClerkId))
  ) {
    throw new Error("This call is unavailable");
  }
  const role = call.callerClerkId === me ? "caller" : "callee";
  return { call, role } as const;
}

/**
 * WebRTC 1:1 call signalling (Stage D3). Convex only relays SDP + ICE between
 * two peers — the actual audio/video is peer-to-peer over free Google STUN.
 * Targets are the opaque profile id; Clerk ids are resolved server-side.
 */

/** Caller starts a call with their SDP offer; returns the call id. */
export const startCall = mutation({
  args: { toProfileId: v.id("profiles"), offer: v.string() },
  handler: async (ctx, { toProfileId, offer }) => {
    requireCommunityExchangeEnabled();
    if (!offer || offer.length > MAX_SDP_BYTES) throw new Error("Invalid call offer");
    const caller = await requireIdentity(ctx);
    const callee = await resolveTarget(ctx, toProfileId, caller, "call");
    if (await isBlockedEitherWay(ctx, caller, callee.clerkId)) {
      throw new Error("This call is unavailable");
    }
    // Stage C: only connected people (an accepted session request) may call.
    await requireConnection(ctx, caller, callee.clerkId);
    if (!dataOf(callee).exchange) throw new Error("This person is not open to calls");
    const me = await profileByClerkId(ctx, caller);

    const recent = await ctx.db
      .query("calls")
      .withIndex("by_caller", (q) => q.eq("callerClerkId", caller))
      .collect();
    if (recent.some((call) => call.status === "ringing" && Date.now() - call.ts < 10_000)) {
      throw new Error("Please wait before starting another call");
    }

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
    if (!communityExchangeEnabled()) return null;
    const me = await requireIdentity(ctx);
    const blockedIds = await blockedClerkIdsFor(ctx, me);
    const rows = await ctx.db
      .query("calls")
      .withIndex("by_callee", (q) => q.eq("calleeClerkId", me))
      .collect();
    const ringing = rows
      .filter(
        (c) =>
          !blockedIds.has(c.callerClerkId) &&
          c.status === "ringing" &&
          Date.now() - c.ts < 60_000
      )
      .sort((a, b) => b.ts - a.ts)[0];
    if (!ringing) return null;
    return { callId: ringing._id, callerName: ringing.callerName, callerProfileId: ringing.callerProfileId, offer: ringing.offer };
  },
});

/** Poll a call's state (status + the answer, once the callee has set it). */
export const getCall = query({
  args: { callId: v.id("calls") },
  handler: async (ctx, { callId }) => {
    if (!communityExchangeEnabled()) return null;
    const { call } = await callForParticipant(ctx, callId);
    return { id: call._id, status: call.status, answer: call.answer ?? null, offer: call.offer ?? null };
  },
});

/** Callee accepts with their SDP answer. */
export const answerCall = mutation({
  args: { callId: v.id("calls"), answer: v.string() },
  handler: async (ctx, { callId, answer }) => {
    requireCommunityExchangeEnabled();
    if (!answer || answer.length > MAX_SDP_BYTES) throw new Error("Invalid call answer");
    const { call, role } = await callForParticipant(ctx, callId);
    if (role !== "callee") throw new Error("Only the recipient can answer");
    if (call.status !== "ringing" || Date.now() - call.ts > 60_000) {
      throw new Error("This call is no longer available");
    }
    await ctx.db.patch(callId, { answer, status: "active" });
  },
});

/** Either side declines or hangs up. */
export const endCall = mutation({
  args: { callId: v.id("calls"), declined: v.optional(v.boolean()) },
  handler: async (ctx, { callId, declined }) => {
    // A participant must always be able to terminate an existing call, even
    // when a block was created while that call was active.
    await callForParticipant(ctx, callId, true);
    await ctx.db.patch(callId, { status: declined ? "declined" : "ended" });
  },
});

/** Add one of my ICE candidates to the call. */
export const addIce = mutation({
  args: { callId: v.id("calls"), candidate: v.string() },
  handler: async (ctx, { callId, candidate }) => {
    requireCommunityExchangeEnabled();
    if (!candidate || candidate.length > MAX_ICE_BYTES) throw new Error("Invalid ICE candidate");
    const { role } = await callForParticipant(ctx, callId);
    await ctx.db.insert("iceCandidates", { callId, sender: role, candidate, ts: Date.now() });
  },
});

/** Get the OTHER side's ICE candidates (poll; client de-dupes by id). */
export const getIce = query({
  args: { callId: v.id("calls") },
  handler: async (ctx, { callId }) => {
    if (!communityExchangeEnabled()) return [];
    const { role } = await callForParticipant(ctx, callId);
    const from = role === "caller" ? "callee" : "caller";
    const rows = await ctx.db
      .query("iceCandidates")
      .withIndex("by_call", (q) => q.eq("callId", callId))
      .collect();
    return rows
      .filter((r) => r.sender === from)
      .map((r) => ({ id: r._id, candidate: r.candidate }));
  },
});
