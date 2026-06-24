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
    /** Full Profile JSON blob — everything not in the structured fields. */
    data: v.optional(v.any()),
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

/**
 * Public, privacy-preserving roster of real growers/nurturers for the /world
 * map. Returns CITY-LEVEL info only — never an exact location, email, or the
 * Clerk id (each row carries an opaque `id` plus a server-computed `me` flag).
 * The client geocodes the city to a city-center pin; people without a city
 * simply aren't placed on the globe.
 */
export const listPeople = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const myId = identity?.subject;
    const rows = await ctx.db.query("profiles").collect();
    return rows.map((r) => {
      const data = (r.data ?? {}) as Record<string, unknown>;
      const str = (v: unknown): string | undefined => (typeof v === "string" && v ? v : undefined);
      const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);
      return {
        id: r._id, // opaque doc id — NOT the Clerk id
        me: r.clerkId === myId,
        name: r.name,
        role: r.role,
        targetLang: r.targetLang,
        knownLangs: arr(r.knownLangs),
        nurtureLangs: arr(data.nurtureLangs),
        phase: r.phase,
        city: str(data.city),
        country: str(data.country),
        bio: str(data.bio),
        interests: arr(data.interests),
        exchange: Boolean(data.exchange),
        hoursLogged: typeof data.hoursLogged === "number" ? data.hoursLogged : 0,
        idealPartner: str(data.idealPartner),
        goals: str(data.goals),
        certificates: arr(data.certificates),
        photoUrl: str(data.photoUrl),
      };
    });
  },
});
