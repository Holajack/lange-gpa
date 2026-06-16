import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * LANGE backend schema.
 *
 * Mirrors the localStorage `Profile` shape in src/lib/types.ts so that
 * profile sync can replace localStorage without a data-model change.
 * `sessionEvents` is the realtime channel for nurturer-led sessions:
 * the nurturer's device appends events; the grower's device subscribes
 * via `eventsByRoom` and replays them (card reveals, review asks, etc.).
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

  bookings: defineTable({
    /** Clerk id of the grower who booked the slot. */
    growerClerkId: v.string(),
    /** Nurturer id from the in-app directory (or "nuri" for the AI nurturer). */
    nurturerId: v.string(),
    /** Slot start time as an ISO 8601 string. */
    slotISO: v.string(),
    /** "pending" | "confirmed" | "completed" | "cancelled". */
    status: v.string(),
  }).index("by_grower", ["growerClerkId"]),

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
   * Realtime event log for live two-device GPA sessions.
   * Event types (see the CONVEX_SYNC marker in the session room):
   *   "reveal"      — nurturer reveals a picture card to the grower
   *   "review_ask"  — nurturer asks a review question ("Где …?")
   *   "answer"      — grower's answer (card index / correctness)
   *   "role_switch" — dictation control passes to the other participant
   */
  sessionEvents: defineTable({
    roomId: v.string(),
    /** Monotonic per-room sequence number, assigned server-side. */
    seq: v.number(),
    type: v.string(),
    payload: v.any(),
    /** Server timestamp (ms since epoch). */
    ts: v.number(),
  }).index("by_room", ["roomId"]),

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
});
