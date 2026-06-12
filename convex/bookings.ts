import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** Book a session slot with a nurturer (status starts "pending"). */
export const createBooking = mutation({
  args: {
    growerClerkId: v.string(),
    nurturerId: v.string(),
    slotISO: v.string(),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("bookings", {
      growerClerkId: args.growerClerkId,
      nurturerId: args.nurturerId,
      slotISO: args.slotISO,
      status: args.status ?? "pending",
    });
  },
});

/** All bookings made by a grower, newest first. */
export const listBookings = query({
  args: { growerClerkId: v.string() },
  handler: async (ctx, { growerClerkId }) => {
    return await ctx.db
      .query("bookings")
      .withIndex("by_grower", (q) => q.eq("growerClerkId", growerClerkId))
      .order("desc")
      .collect();
  },
});
