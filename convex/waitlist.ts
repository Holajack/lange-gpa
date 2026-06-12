import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Pre-launch interest list backing the /early page.
 *
 * The client calls `waitlist:join` by string name through ConvexHttpClient
 * (see src/app/early/page.tsx), so nothing in the Next build imports
 * convex/_generated — this folder stays excluded from tsconfig.
 */

/**
 * Join the waitlist. Dedupes by (normalized) email: a repeat signup
 * refreshes name/langInterest instead of inserting a second row, so
 * the list stays one-person-one-seat.
 */
export const join = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    langInterest: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const existing = await ctx.db
      .query("waitlist")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name ?? existing.name,
        langInterest: args.langInterest ?? existing.langInterest,
      });
      return existing._id;
    }
    return await ctx.db.insert("waitlist", {
      email,
      name: args.name,
      langInterest: args.langInterest,
      source: args.source,
      ts: Date.now(),
    });
  },
});

/** How many people are waiting at the door. */
export const count = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("waitlist").collect();
    return rows.length;
  },
});
