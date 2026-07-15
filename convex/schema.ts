import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Nurilang backend schema.
 *
 * Mirrors the localStorage `Profile` shape in src/lib/types.ts so that
 * profile sync can replace localStorage without a data-model change.
 */
export default defineSchema({
  profiles: defineTable({
    /** Clerk user id (`user_...`) — the bridge between Clerk auth and app data. */
    clerkId: v.string(),
    name: v.string(),
    /** "grower" | "nurturer" (kept as string to match src/lib/types.ts Role). */
    role: v.string(),
    /** LangCode the grower is growing into, e.g. "ru". */
    targetLang: v.string(),
    /** LangCodes the user already speaks. */
    knownLangs: v.array(v.string()),
    /** Show UI in the target language. */
    immersion: v.boolean(),
    hoursListened: v.number(),
    /** Current GPA phase (1–6). */
    phase: v.number(),
    /**
     * Full localStorage Profile JSON — the lossless source of truth for
     * round-trip. The structured fields above stay for querying/indexing;
     * `data` carries everything else (wordsMet, streak, completed, bookings,
     * week, interests, motivation…) so an account restores completely on
     * any device. Optional so existing rows stay valid.
     */
    data: v.optional(v.any()),
  }).index("by_clerkId", ["clerkId"]),

  /**
   * Private, directional community blocks. Both Clerk ids remain server-only;
   * clients address people by their opaque profile document id. A block hides
   * both people from one another in the exchange roster.
   */
  blocks: defineTable({
    blockerClerkId: v.string(),
    blockedClerkId: v.string(),
    createdAt: v.number(),
  })
    .index("by_blocker", ["blockerClerkId"])
    .index("by_blocked", ["blockedClerkId"])
    .index("by_pair", ["blockerClerkId", "blockedClerkId"]),

  /**
   * Private safety reports. Reports are never returned in the public roster;
   * only a fail-closed moderator allowlist may review them.
   */
  safetyReports: defineTable({
    reporterClerkId: v.string(),
    reportedClerkId: v.string(),
    category: v.union(
      v.literal("harassment"),
      v.literal("hate"),
      v.literal("sexual_content"),
      v.literal("spam"),
      v.literal("impersonation"),
      v.literal("dangerous_behavior"),
      v.literal("privacy"),
      v.literal("underage_safety"),
      v.literal("other")
    ),
    details: v.optional(v.string()),
    surface: v.literal("world"),
    status: v.union(v.literal("open"), v.literal("reviewing"), v.literal("closed")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_reporter", ["reporterClerkId"])
    .index("by_reported", ["reportedClerkId"])
    .index("by_pair", ["reporterClerkId", "reportedClerkId"])
    .index("by_status", ["status"]),

  /**
   * Pre-launch interest list (the /early page).
   * One row per email — `waitlist:join` dedupes on the by_email index,
   * refreshing name/langInterest instead of inserting twice.
   */
  waitlist: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    /** LangCode the visitor is hoping to grow into, e.g. "ru". */
    langInterest: v.optional(v.string()),
    /** Where the signup came from, e.g. "early". */
    source: v.optional(v.string()),
    /** Client timestamp (ms since epoch). */
    ts: v.number(),
  }).index("by_email", ["email"]),

  /**
   * One wallet per Clerk user — the running totals for the credit system.
   * Two currencies live here side by side:
   *   `exchangeHours` — free "growing hours" earned by nurturing and spent
   *                     to be grown; lifetimeEarned/lifetimeSpent stay visible
   *                     so a fair grower's balance nets toward zero.
   *   `paidHours`     — purchased hours for the paid marketplace (PPP-scaled).
   * Totals are a cache of the ledger; recordEntry keeps them in step.
   */
  wallets: defineTable({
    clerkId: v.string(),
    exchangeHours: v.number(),
    paidHours: v.number(),
    lifetimeEarned: v.number(),
    lifetimeSpent: v.number(),
    /** Last write (ms since epoch). */
    updatedAt: v.number(),
  }).index("by_clerkId", ["clerkId"]),

  /**
   * Append-only history behind every wallet. One row per credit movement.
   *   kind     — "earned" | "spent" | "purchased"
   *   currency — "exchange" | "paid"
   * `partner`/`lang`/`minutes`/`note` annotate the move (who you grew with,
   * which language, how long, a free-text reason).
   */
  ledger: defineTable({
    clerkId: v.string(),
    kind: v.string(),
    currency: v.string(),
    amount: v.number(),
    partner: v.optional(v.string()),
    lang: v.optional(v.string()),
    minutes: v.optional(v.number()),
    note: v.optional(v.string()),
    /** Client timestamp (ms since epoch). */
    ts: v.number(),
  }).index("by_clerkId", ["clerkId"]),

  /**
   * Session requests between two real people (Tandem-style): one person taps
   * another on /world and asks to practice together; the recipient sees it and
   * accepts or declines. Keyed by Clerk ids resolved server-side from the
   * opaque profile id the client sends — the client never sees Clerk ids.
   */
  requests: defineTable({
    fromClerkId: v.string(),
    fromName: v.string(),
    toClerkId: v.string(),
    toName: v.string(),
    /** LangCode they'd practice together, e.g. "ru". */
    lang: v.string(),
    message: v.optional(v.string()),
    /** "pending" | "accepted" | "declined" */
    status: v.string(),
    ts: v.number(),
  })
    .index("by_to", ["toClerkId"])
    .index("by_from", ["fromClerkId"])
    .index("by_pair", ["fromClerkId", "toClerkId"]),

  /**
   * 1:1 messages between two people (Stage D). `convoKey` is the sorted pair of
   * Clerk ids so both directions land in one thread. `kind` is "text" for now;
   * voice notes (Convex storage) and call invites will reuse this table.
   */
  messages: defineTable({
    convoKey: v.string(),
    fromClerkId: v.string(),
    fromName: v.string(),
    toClerkId: v.string(),
    kind: v.string(),
    text: v.string(),
    /** voice notes (kind "voice"): stored audio + length in seconds */
    storageId: v.optional(v.id("_storage")),
    durationSec: v.optional(v.number()),
    ts: v.number(),
    readByTo: v.boolean(),
  })
    .index("by_convo", ["convoKey"])
    .index("by_from", ["fromClerkId"])
    .index("by_to", ["toClerkId"])
    .index("by_to_unread", ["toClerkId", "readByTo"]),

  /**
   * WebRTC 1:1 video-call signalling (Stage D3). Calls are peer-to-peer
   * (free Google STUN); Convex only relays the SDP offer/answer and ICE
   * candidates. No media ever touches the server.
   */
  calls: defineTable({
    callerClerkId: v.string(),
    callerName: v.string(),
    /** caller's profile id, so the callee can call back */
    callerProfileId: v.optional(v.id("profiles")),
    calleeClerkId: v.string(),
    /** "ringing" | "active" | "declined" | "ended" */
    status: v.string(),
    /** SDP offer/answer, JSON-stringified */
    offer: v.optional(v.string()),
    answer: v.optional(v.string()),
    ts: v.number(),
  })
    .index("by_callee", ["calleeClerkId"])
    .index("by_caller", ["callerClerkId"]),

  iceCandidates: defineTable({
    callId: v.id("calls"),
    /** "caller" | "callee" — who produced this candidate */
    sender: v.string(),
    candidate: v.string(),
    ts: v.number(),
  }).index("by_call", ["callId"]),

  /**
   * Language parties (Stage E) — Tandem/Meetup-style group sessions. Anyone can
   * host a party in a language and others RSVP; past parties become the user's
   * session history. The host's Clerk id is resolved server-side (clients only
   * ever see the opaque party doc id). One `partyGuests` row per attendee; the
   * host is auto-added as the first guest.
   */
  parties: defineTable({
    hostClerkId: v.string(),
    hostName: v.string(),
    title: v.string(),
    /** what you'll actually do together (optional free text) */
    topic: v.optional(v.string()),
    /** LangCode the party runs in, e.g. "ru" */
    lang: v.string(),
    /** "party" | "club" | "practice" — flavour only, no behaviour change */
    kind: v.string(),
    /** start time, ms since epoch */
    startsAt: v.number(),
    durationMin: v.number(),
    /** max attendees incl. host; undefined = open / unlimited */
    capacity: v.optional(v.number()),
    /** "scheduled" | "cancelled" */
    status: v.string(),
    ts: v.number(),
  })
    .index("by_starts", ["startsAt"])
    .index("by_host", ["hostClerkId"]),

  /** One row per person attending a party (the host included). */
  partyGuests: defineTable({
    partyId: v.id("parties"),
    clerkId: v.string(),
    name: v.string(),
    ts: v.number(),
  })
    .index("by_party", ["partyId"])
    .index("by_guest", ["clerkId"])
    .index("by_party_guest", ["partyId", "clerkId"]),
});
