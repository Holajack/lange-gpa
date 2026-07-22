import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { communityExchangeEnabled, dataOf, requireIdentity } from "./util";
import { blockedClerkIdsFor } from "./safety";

/**
 * Create or update the profile for a Clerk user.
 * Field shape mirrors `Profile` in src/lib/types.ts so the client can
 * push its localStorage profile up unchanged once auth is wired.
 */
export const upsertProfile = mutation({
  args: {
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
    const clerkId = await requireIdentity(ctx);
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("profiles", { ...args, clerkId });
  },
});

/** Fetch a profile by Clerk user id; null when the user has no profile yet. */
export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const clerkId = await requireIdentity(ctx);
    return await ctx.db
      .query("profiles")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();
  },
});

/**
 * Site-owner allowlist for admin-only queries. Checked against the Clerk
 * identity's email claim (present when the JWT template includes it) — if
 * your Clerk JWT template doesn't emit `email`, this check fails closed
 * (nobody gets through) rather than open, so tighten by adding the claim
 * or switching to a `identity.subject` (Clerk user id) allowlist instead.
 */
const OWNER_EMAILS = (process.env.NURILANG_ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

/**
 * Admin-only roster of everyone who has taken (or needs to take) the
 * nurturer training quiz, so the site owner can spot-check readiness after
 * the fact rather than gating live sign-ups on manual review. Throws for
 * anyone not on `OWNER_EMAILS`.
 */
export const listNurturerCertifications = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const email = identity?.email ? String(identity.email).toLowerCase() : undefined;
    if (!email || !OWNER_EMAILS.includes(email)) {
      throw new Error("Not authorized");
    }
    const rows = await ctx.db.query("profiles").collect();
    return rows
      .filter((r) => r.role !== "grower")
      .map((r) => {
        const data = (r.data ?? {}) as Record<string, unknown>;
        const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);
        return {
          id: r._id,
          name: r.name,
          role: r.role,
          nurtureLangs: arr(data.nurtureLangs),
          certStatus: typeof data.nurturerCertStatus === "string" ? data.nurturerCertStatus : "not_started",
          certScore: typeof data.nurturerCertScore === "number" ? data.nurturerCertScore : undefined,
          certAttempts: typeof data.nurturerCertAttempts === "number" ? data.nurturerCertAttempts : 0,
          certPassedAt: typeof data.nurturerCertPassedAt === "string" ? data.nurturerCertPassedAt : undefined,
          certMissed: arr(data.nurturerCertMissed),
        };
      });
  },
});

/**
 * Authenticated, privacy-preserving roster of exchange-enabled people for the
 * /world map. Returns CITY-LEVEL info only — never an exact location, email,
 * or Clerk id (each row carries an opaque `id` plus a server-computed `me` flag).
 * The client geocodes the city to a city-center pin; people without a city
 * simply aren't placed on the globe.
 */
export const listPeople = query({
  args: {},
  handler: async (ctx) => {
    if (!communityExchangeEnabled()) return [];
    const myId = await requireIdentity(ctx);
    const blockedIds = await blockedClerkIdsFor(ctx, myId);
    const rows = await ctx.db.query("profiles").collect();
    return rows
      .filter(
        (r) =>
          !blockedIds.has(r.clerkId) &&
          (r.clerkId === myId || Boolean(dataOf(r).exchange))
      )
      .map((r) => {
        const data = dataOf(r);
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
