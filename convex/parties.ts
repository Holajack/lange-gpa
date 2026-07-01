import { mutation, query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { displayName, requireIdentity } from "./util";

/**
 * Language parties (Stage E) — Tandem/Meetup-style group sessions. Anyone hosts
 * a party in a language and others RSVP; past parties become a person's session
 * history. Callers are identified by Clerk id (identity.subject), resolved
 * server-side — clients only ever see the opaque party doc id. One row per
 * attendee in `partyGuests`; the host is auto-added as the first guest.
 */

/** Build the client-safe view of one party (guest count + a small avatar preview). */
async function viewOf(ctx: QueryCtx, party: Doc<"parties">, me: string | undefined) {
  const guests = await ctx.db
    .query("partyGuests")
    .withIndex("by_party", (q) => q.eq("partyId", party._id))
    .collect();
  guests.sort((a, b) => a.ts - b.ts); // host first (auto-joined at creation)

  const preview = await Promise.all(
    guests.slice(0, 6).map(async (g) => {
      const prof = await ctx.db
        .query("profiles")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", g.clerkId))
        .unique();
      const data = (prof?.data ?? {}) as Record<string, unknown>;
      return {
        name: g.name,
        photo: typeof data.photoUrl === "string" && data.photoUrl ? data.photoUrl : undefined,
        isHost: g.clerkId === party.hostClerkId,
        isMe: !!me && g.clerkId === me,
      };
    })
  );

  return {
    id: party._id,
    title: party.title,
    topic: party.topic ?? null,
    lang: party.lang,
    kind: party.kind,
    startsAt: party.startsAt,
    durationMin: party.durationMin,
    capacity: party.capacity ?? null,
    status: party.status,
    hostName: party.hostName,
    iAmHost: !!me && party.hostClerkId === me,
    iAmGoing: !!me && guests.some((g) => g.clerkId === me),
    guestCount: guests.length,
    guests: preview,
  };
}

/** Host a new party. The host auto-joins as the first guest. */
export const createParty = mutation({
  args: {
    title: v.string(),
    topic: v.optional(v.string()),
    lang: v.string(),
    kind: v.string(),
    startsAt: v.number(),
    durationMin: v.number(),
    capacity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const host = await requireIdentity(ctx);

    const title = args.title.trim().slice(0, 80);
    if (!title) throw new Error("A party needs a title");

    const hostName = await displayName(ctx, host);

    const topic = args.topic?.trim().slice(0, 280);
    const capacity =
      args.capacity && args.capacity > 0 ? Math.min(200, Math.round(args.capacity)) : undefined;

    const partyId = await ctx.db.insert("parties", {
      hostClerkId: host,
      hostName,
      title,
      topic: topic || undefined,
      lang: args.lang,
      kind: args.kind,
      startsAt: args.startsAt,
      durationMin: Math.max(10, Math.min(240, Math.round(args.durationMin))),
      capacity,
      status: "scheduled",
      ts: Date.now(),
    });

    await ctx.db.insert("partyGuests", { partyId, clerkId: host, name: hostName, ts: Date.now() });
    return partyId;
  },
});

/** Upcoming (and currently-live) scheduled parties, optionally filtered by language. */
export const listUpcoming = query({
  args: { lang: v.optional(v.string()) },
  handler: async (ctx, { lang }) => {
    const identity = await ctx.auth.getUserIdentity();
    const me = identity?.subject;
    const now = Date.now();
    const GRACE = 30 * 60 * 1000; // keep a party listed until 30 min past its start (it's "live")

    const all = await ctx.db.query("parties").withIndex("by_starts").collect();
    const open = all
      .filter((p) => p.status === "scheduled" && p.startsAt + GRACE > now)
      .filter((p) => !lang || p.lang === lang)
      .sort((a, b) => a.startsAt - b.startsAt)
      .slice(0, 60);

    return await Promise.all(open.map((p) => viewOf(ctx, p, me)));
  },
});

/** Every party I host or have joined, any time — the page groups them into upcoming/past. */
export const myParties = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const me = identity.subject;

    const guestRows = await ctx.db
      .query("partyGuests")
      .withIndex("by_guest", (q) => q.eq("clerkId", me))
      .collect();
    const ids = new Set(guestRows.map((g) => g.partyId));

    // hosts are stored as guests too, but fold in hosted parties defensively
    const hosted = await ctx.db
      .query("parties")
      .withIndex("by_host", (q) => q.eq("hostClerkId", me))
      .collect();
    hosted.forEach((p) => ids.add(p._id));

    const parties = (await Promise.all([...ids].map((id) => ctx.db.get(id)))).filter(
      (p): p is Doc<"parties"> => p !== null
    );
    parties.sort((a, b) => b.startsAt - a.startsAt);
    return await Promise.all(parties.map((p) => viewOf(ctx, p, me)));
  },
});

/** RSVP to a party (idempotent; respects capacity; can't join a cancelled one). */
export const joinParty = mutation({
  args: { partyId: v.id("parties") },
  handler: async (ctx, { partyId }) => {
    const me = await requireIdentity(ctx);

    const party = await ctx.db.get(partyId);
    if (!party) throw new Error("Party not found");
    if (party.status !== "scheduled") throw new Error("This party isn't open");

    const existing = await ctx.db
      .query("partyGuests")
      .withIndex("by_party_guest", (q) => q.eq("partyId", partyId).eq("clerkId", me))
      .unique();
    if (existing) return existing._id;

    if (party.capacity) {
      const guests = await ctx.db
        .query("partyGuests")
        .withIndex("by_party", (q) => q.eq("partyId", partyId))
        .collect();
      if (guests.length >= party.capacity) throw new Error("This party is full");
    }

    return await ctx.db.insert("partyGuests", {
      partyId,
      clerkId: me,
      name: await displayName(ctx, me),
      ts: Date.now(),
    });
  },
});

/** Drop out of a party (the host can't leave — they cancel instead). */
export const leaveParty = mutation({
  args: { partyId: v.id("parties") },
  handler: async (ctx, { partyId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const me = identity.subject;

    const party = await ctx.db.get(partyId);
    if (!party) return;
    if (party.hostClerkId === me) throw new Error("The host can't leave — cancel the party instead");

    const row = await ctx.db
      .query("partyGuests")
      .withIndex("by_party_guest", (q) => q.eq("partyId", partyId).eq("clerkId", me))
      .unique();
    if (row) await ctx.db.delete(row._id);
  },
});

/** Host-only: cancel a party (kept in history, marked cancelled). */
export const cancelParty = mutation({
  args: { partyId: v.id("parties") },
  handler: async (ctx, { partyId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const party = await ctx.db.get(partyId);
    if (!party) return;
    if (party.hostClerkId !== identity.subject) throw new Error("Only the host can cancel");
    await ctx.db.patch(partyId, { status: "cancelled" });
  },
});
