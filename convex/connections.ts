import { query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { communityExchangeEnabled, profileByClerkId } from "./util";
import { blockedClerkIdsFor } from "./safety";
import { isAdultProfile } from "./age";

/**
 * Connections (Stage C) — the accepted-relationship layer that sits between a
 * session request (Stage A) and messaging/calling (Stage D).
 *
 * A "connection" is simply a request with status "accepted" in EITHER
 * direction. Messaging and calling require one, so a stranger cannot DM or
 * ring anyone who has not agreed to connect — the block layer alone was not
 * enough (it only stopped people you had explicitly blocked). This closes the
 * gap and satisfies the "request accepted before messaging or calling" rule.
 */
type AnyCtx = QueryCtx | MutationCtx;

/** Are these two Clerk ids connected (an accepted request either way)? */
export async function areConnected(ctx: AnyCtx, a: string, b: string): Promise<boolean> {
  const [ab, ba] = await Promise.all([
    ctx.db
      .query("requests")
      .withIndex("by_pair", (q) => q.eq("fromClerkId", a).eq("toClerkId", b))
      .collect(),
    ctx.db
      .query("requests")
      .withIndex("by_pair", (q) => q.eq("fromClerkId", b).eq("toClerkId", a))
      .collect(),
  ]);
  return [...ab, ...ba].some((r) => r.status === "accepted");
}

/** Throw unless the caller and the other person are connected. */
export async function requireConnection(ctx: AnyCtx, me: string, other: string): Promise<void> {
  if (!(await areConnected(ctx, me, other))) {
    throw new Error("Connect first — send a session request and have it accepted");
  }
}

/**
 * Everyone I'm connected with (accepted requests, either direction), newest
 * first. Returns the opaque profile id so the client can open a chat/call
 * without ever seeing a Clerk id. Excludes blocked people.
 */
export const myConnections = query({
  args: {},
  handler: async (ctx) => {
    if (!communityExchangeEnabled()) return [];
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const me = identity.subject;
    // 18+, both ways. A minor sees no one, and no minor is shown to anyone —
    // connections predating the age gate go quiet until both sides attest,
    // which is the direction an age gate should fail when it is unsure.
    const now = Date.now();
    if (!isAdultProfile(await profileByClerkId(ctx, me), now)) return [];
    const blocked = await blockedClerkIdsFor(ctx, me);

    const [out, inc] = await Promise.all([
      ctx.db.query("requests").withIndex("by_from", (q) => q.eq("fromClerkId", me)).collect(),
      ctx.db.query("requests").withIndex("by_to", (q) => q.eq("toClerkId", me)).collect(),
    ]);

    // one row per other-person, keyed by their Clerk id, most-recent accept wins
    const byOther = new Map<string, { name: string; ts: number }>();
    for (const r of [...out, ...inc]) {
      if (r.status !== "accepted") continue;
      const otherClerk = r.fromClerkId === me ? r.toClerkId : r.fromClerkId;
      const otherName = r.fromClerkId === me ? r.toName : r.fromName;
      if (blocked.has(otherClerk)) continue;
      const prev = byOther.get(otherClerk);
      if (!prev || r.ts > prev.ts) byOther.set(otherClerk, { name: otherName, ts: r.ts });
    }

    // resolve each to its current opaque profile id
    const result: { profileId: string; name: string; ts: number }[] = [];
    for (const [clerkId, info] of byOther) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
        .unique();
      if (!profile || !isAdultProfile(profile, now)) continue;
      result.push({ profileId: profile._id, name: info.name, ts: info.ts });
    }
    return result.sort((a, b) => b.ts - a.ts);
  },
});
