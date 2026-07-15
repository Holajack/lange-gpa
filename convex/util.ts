import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

/**
 * Shared server helpers. Every mutation used to repeat the same prelude —
 * get-identity-or-throw, resolve-an-opaque-target-or-throw, stamp-my-name — and
 * several queries re-derived the profile `data` blob the same way. Centralised
 * here so the rules (and the error strings) live in one place.
 */
type AnyCtx = QueryCtx | MutationCtx;

/** Stranger discovery, messaging, and calls are closed until operations opt in. */
export function communityExchangeEnabled(): boolean {
  return process.env.ENABLE_COMMUNITY_EXCHANGE === "true";
}

export function requireCommunityExchangeEnabled(): void {
  if (!communityExchangeEnabled()) throw new Error("Community exchange is not enabled");
}

/** The signed-in Clerk subject, or throw (for mutations that require auth). */
export async function requireIdentity(ctx: AnyCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return identity.subject;
}

/** The profile row for a Clerk id (or null). */
export async function profileByClerkId(ctx: AnyCtx, clerkId: string) {
  return await ctx.db
    .query("profiles")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
    .unique();
}

/** A caller's display name, falling back to "Someone". */
export async function displayName(ctx: AnyCtx, clerkId: string): Promise<string> {
  return (await profileByClerkId(ctx, clerkId))?.name ?? "Someone";
}

/**
 * Resolve an opaque target profile id to its row, rejecting a missing target or
 * self-targeting. `verb` shapes the error ("Cannot message yourself", etc.).
 */
export async function resolveTarget(
  ctx: AnyCtx,
  toProfileId: Id<"profiles">,
  me: string,
  verb: string
) {
  const target = await ctx.db.get(toProfileId);
  if (!target) throw new Error("Person not found");
  if (target.clerkId === me) throw new Error(`Cannot ${verb} yourself`);
  return target;
}

/** The free-form `data` blob on a profile, typed loosely. */
export function dataOf(doc: { data?: unknown } | null | undefined): Record<string, unknown> {
  return (doc?.data ?? {}) as Record<string, unknown>;
}

/** A profile's photo URL from its `data` blob (non-empty string), else undefined. */
export function photoUrlOf(doc: { data?: unknown } | null | undefined): string | undefined {
  const url = dataOf(doc).photoUrl;
  return typeof url === "string" && url ? url : undefined;
}
