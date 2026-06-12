import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create or update the profile for a Clerk user.
 * Field shape mirrors `Profile` in src/lib/types.ts so the client can
 * push its localStorage profile up unchanged once auth is wired.
 */
export const upsertProfile = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    role: v.string(),
    targetLang: v.string(),
    knownLangs: v.array(v.string()),
    immersion: v.boolean(),
    hoursListened: v.number(),
    phase: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("profiles", args);
  },
});

/** Fetch a profile by Clerk user id; null when the user has no profile yet. */
export const getProfile = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();
  },
});
