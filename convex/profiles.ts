import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { communityExchangeEnabled, dataOf, profileByClerkId, requireIdentity } from "./util";
import { blockedClerkIdsFor } from "./safety";
import { isAdultProfile } from "./age";

/**
 * Claims about age that the profile sync payload may never carry. The real
 * answer lives in the server-owned `birthDate` column that only `age:attestAge`
 * writes; a copy riding along inside the free-form `data` blob would be a
 * client-writable "I am an adult" sitting next to the genuine one, waiting for
 * some future reader to reach for the wrong of the two. Strip them on the way
 * in so that reader has nothing to find.
 */
const AGE_CLAIM_KEYS = [
  "birthDate",
  "ageAttestedAt",
  "isAdult",
  "adult",
  "over18",
  "ageVerified",
] as const;

function withoutAgeClaims(data: unknown): unknown {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;
  const clean = { ...(data as Record<string, unknown>) };
  for (const key of AGE_CLAIM_KEYS) delete clean[key];
  return clean;
}

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
    const existing = await profileByClerkId(ctx, clerkId);

    // Age columns are server-owned (see convex/age.ts). Naming the writable
    // fields one by one instead of handing `args` straight to patch keeps a
    // later widening of the validator from quietly becoming a way for a client
    // to age itself up, and a patch leaves every column it is not given — here,
    // birthDate and ageAttestedAt — exactly as it found it.
    const fields = {
      name: args.name,
      role: args.role,
      targetLang: args.targetLang,
      knownLangs: args.knownLangs,
      immersion: args.immersion,
      hoursListened: args.hoursListened,
      phase: args.phase,
      // omitted rather than set to undefined: a sync that carries no blob must
      // leave the stored one alone, not erase it
      ...(args.data === undefined ? {} : { data: withoutAgeClaims(args.data) }),
    };

    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }
    return await ctx.db.insert("profiles", { ...fields, clerkId });
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
 *
 * The 18+ gate cuts both ways here, and this is the only place it can: a minor
 * who cannot see the roster cannot obtain the opaque profile id that every
 * write path takes as its target, and a minor absent from everyone's roster is
 * never handed to an adult to act on in the first place.
 */
export const listPeople = query({
  args: {},
  handler: async (ctx) => {
    if (!communityExchangeEnabled()) return [];
    const myId = await requireIdentity(ctx);
    const now = Date.now();
    if (!isAdultProfile(await profileByClerkId(ctx, myId), now)) return [];
    const blockedIds = await blockedClerkIdsFor(ctx, myId);
    const rows = await ctx.db.query("profiles").collect();
    return rows
      .filter(
        (r) =>
          !blockedIds.has(r.clerkId) &&
          isAdultProfile(r, now) &&
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
