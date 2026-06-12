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
});
