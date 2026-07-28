import { mutation, query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import {
  communityExchangeEnabled,
  displayName,
  photoUrlOf,
  profileByClerkId,
  requireCommunityExchangeEnabled,
  requireIdentity,
} from "./util";
import { blockedClerkIdsFor } from "./safety";
import { isAdultProfile, requireAdult } from "./age";

/**
 * Language parties (Stage E) — Tandem/Meetup-style group sessions. Anyone hosts
 * a party in a language and others RSVP; past parties become a person's session
 * history. Callers are identified by Clerk id (identity.subject), resolved
 * server-side — clients only ever see the opaque party doc id. One row per
 * attendee in `partyGuests`; the host is auto-added as the first guest.
 *
 * A party is a live group session with real strangers, so it is community
 * exchange in every sense the rest of the backend uses the term: adults only,
 * both ways, re-derived from `profiles.birthDate` on every call (see
 * convex/age.ts), and blind to anyone either side has blocked.
 *
 * The doors in — hosting and RSVPing — carry the full gate. The doors out —
 * leaving and cancelling — deliberately carry none, following the same
 * reasoning as `requests:respondRequest`, where declining stays open to
 * everyone. Gating an exit would strand a minor in an adult's party, and would
 * leave a party hosted before the gate shipped permanently listed with no one
 * able to take it down. Neither exit reads any data back.
 */

/** Build the client-safe view of one party (guest count + a small avatar preview). */
async function viewOf(
  ctx: QueryCtx,
  party: Doc<"parties">,
  me: string,
  now: number,
  blocked: Set<string>
) {
  const guests = await ctx.db
    .query("partyGuests")
    .withIndex("by_party", (q) => q.eq("partyId", party._id))
    .collect();
  guests.sort((a, b) => a.ts - b.ts); // host first (auto-joined at creation)

  // The roster is a list of real people, so it is filtered like every other
  // roster here: no minors, no one blocked either way. `guestCount` below stays
  // the TRUE headcount — capacity is measured against it, and a filtered count
  // would quietly misreport a full party as joinable.
  const preview: { name: string; photo?: string; isHost: boolean; isMe: boolean }[] = [];
  for (const g of guests) {
    if (preview.length >= 6) break;
    const mine = g.clerkId === me;
    const prof = await profileByClerkId(ctx, g.clerkId);
    if (!mine && (blocked.has(g.clerkId) || !isAdultProfile(prof, now))) continue;
    preview.push({
      name: g.name,
      photo: photoUrlOf(prof),
      isHost: g.clerkId === party.hostClerkId,
      isMe: mine,
    });
  }

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
    iAmHost: party.hostClerkId === me,
    iAmGoing: guests.some((g) => g.clerkId === me),
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
    requireCommunityExchangeEnabled();
    const host = await requireIdentity(ctx);
    await requireAdult(ctx, host);

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
    if (!communityExchangeEnabled()) return [];
    // An identity is required: this used to answer anonymous callers, which
    // handed the whole public roster to anyone who could reach the endpoint.
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const me = identity.subject;
    const now = Date.now();
    if (!isAdultProfile(await profileByClerkId(ctx, me), now)) return [];
    const blocked = await blockedClerkIdsFor(ctx, me);

    const GRACE = 30 * 60 * 1000; // keep a party listed until 30 min past its start (it's "live")

    const all = await ctx.db.query("parties").withIndex("by_starts").collect();
    const open = all
      .filter((p) => p.status === "scheduled" && p.startsAt + GRACE > now)
      .filter((p) => !lang || p.lang === lang)
      .filter((p) => !blocked.has(p.hostClerkId))
      .sort((a, b) => a.startsAt - b.startsAt)
      .slice(0, 60);

    // Hosts get the same treatment guests do — a party hosted by someone who
    // has not attested to being an adult is offered to nobody, which is how
    // parties created before the gate shipped go quiet.
    const visible: Doc<"parties">[] = [];
    for (const p of open) {
      if (!isAdultProfile(await profileByClerkId(ctx, p.hostClerkId), now)) continue;
      visible.push(p);
    }

    return await Promise.all(visible.map((p) => viewOf(ctx, p, me, now, blocked)));
  },
});

/** Every party I host or have joined, any time — the page groups them into upcoming/past. */
export const myParties = query({
  args: {},
  handler: async (ctx) => {
    if (!communityExchangeEnabled()) return [];
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const me = identity.subject;
    const now = Date.now();
    if (!isAdultProfile(await profileByClerkId(ctx, me), now)) return [];
    const blocked = await blockedClerkIdsFor(ctx, me);

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
    return await Promise.all(parties.map((p) => viewOf(ctx, p, me, now, blocked)));
  },
});

/** RSVP to a party (idempotent; respects capacity; can't join a cancelled one). */
export const joinParty = mutation({
  args: { partyId: v.id("parties") },
  handler: async (ctx, { partyId }) => {
    requireCommunityExchangeEnabled();
    const me = await requireIdentity(ctx);
    await requireAdult(ctx, me);

    const party = await ctx.db.get(partyId);
    if (!party) throw new Error("Party not found");
    if (party.status !== "scheduled") throw new Error("This party isn't open");

    // A blocked or non-adult host refuses in the same words as a closed party,
    // so an RSVP never confirms anything about who is hosting.
    const blocked = await blockedClerkIdsFor(ctx, me);
    if (party.hostClerkId !== me) {
      if (blocked.has(party.hostClerkId)) throw new Error("This party isn't open");
      const host = await profileByClerkId(ctx, party.hostClerkId);
      if (!isAdultProfile(host, Date.now())) throw new Error("This party isn't open");
    }

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

/**
 * Drop out of a party (the host can't leave — they cancel instead).
 *
 * Ungated on purpose: this is a door out. It deletes one row — the caller's own
 * — and reads nothing back, so leaving it open costs nothing, while closing it
 * would pin a non-adult inside an adults-only party with no way to remove
 * themselves. Same call the age gate makes in `requests:respondRequest`.
 */
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

/**
 * Host-only: cancel a party (kept in history, marked cancelled).
 *
 * Ungated on purpose, for the same reason as leaveParty: cancelling only takes
 * a party OUT of circulation. A party hosted before the gate shipped is already
 * hidden from every listing, and its host must still be able to close it rather
 * than leave a dangling row nobody can reach.
 */
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
