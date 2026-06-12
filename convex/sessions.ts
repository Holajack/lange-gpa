import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Append an event to a session room's ordered log.
 * Known types: "reveal" | "review_ask" | "answer" | "role_switch"
 * (kept as string so new event types don't need a schema migration).
 * `seq` and `ts` are assigned server-side so two devices can never
 * produce conflicting orderings.
 */
export const appendEvent = mutation({
  args: {
    roomId: v.string(),
    type: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    const last = await ctx.db
      .query("sessionEvents")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .first();
    const seq = (last?.seq ?? 0) + 1;
    return await ctx.db.insert("sessionEvents", {
      roomId: args.roomId,
      type: args.type,
      payload: args.payload,
      seq,
      ts: Date.now(),
    });
  },
});

/**
 * All events for a room in seq order. Subscribe with `useQuery` on the
 * grower device to replay nurturer-dictated reveals live. Pass `after`
 * to fetch only events newer than the last one already applied.
 */
export const eventsByRoom = query({
  args: { roomId: v.string(), after: v.optional(v.number()) },
  handler: async (ctx, { roomId, after }) => {
    const events = await ctx.db
      .query("sessionEvents")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .collect();
    const sorted = events.sort((a, b) => a.seq - b.seq);
    return after === undefined ? sorted : sorted.filter((e) => e.seq > after);
  },
});
