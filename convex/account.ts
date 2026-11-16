import type { Doc, Id, TableNames } from "./_generated/dataModel";
import { mutation } from "./_generated/server";

/**
 * Account deletion — the server half of the "Delete account" button.
 *
 * Removes every row that belongs to the caller, straight away: there is no
 * grace period, no soft-delete flag and no backup table. The profile row goes
 * last, so an interrupted run leaves an account that can simply press the
 * button again.
 *
 * One call removes at most BATCH documents (comfortably inside a single
 * mutation's limits) and reports whether anything is left; the client calls
 * again until `done`. Only then is the sign-in itself deleted (Clerk).
 *
 * The one thing deliberately left in place: safety reports that OTHER people
 * filed about this account. Those are the reporter's record, they identify the
 * account by an internal id only, and they are covered by the retention
 * period stated in the Privacy Policy.
 */
const BATCH = 400;

export const deleteMyAccount = mutation({
  args: {},
  handler: async (ctx): Promise<{ done: boolean }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const me = identity.subject;
    let left = BATCH;

    const drop = async <T extends { _id: Id<TableNames> }>(
      rows: T[],
      before?: (row: T) => Promise<void>
    ) => {
      for (const row of rows) {
        if (before) await before(row);
        await ctx.db.delete(row._id);
      }
      left -= rows.length;
    };

    /** a stored voice note goes with its message */
    const dropAudio = async (message: Doc<"messages">) => {
      if (message.storageId) await ctx.storage.delete(message.storageId);
    };

    /** a call's network candidates go before the call record */
    const dropCalls = async (calls: Doc<"calls">[]) => {
      for (const call of calls) {
        if (left <= 0) return;
        await drop(
          await ctx.db
            .query("iceCandidates")
            .withIndex("by_call", (q) => q.eq("callId", call._id))
            .take(left)
        );
        if (left <= 0) return;
        await drop([call]);
      }
    };

    const steps: (() => Promise<void>)[] = [
      // conversations, in both directions, with any voice-note audio
      async () =>
        drop(await ctx.db.query("messages").withIndex("by_from", (q) => q.eq("fromClerkId", me)).take(left), dropAudio),
      async () =>
        drop(await ctx.db.query("messages").withIndex("by_to", (q) => q.eq("toClerkId", me)).take(left), dropAudio),
      // calls and their signalling
      async () =>
        dropCalls(await ctx.db.query("calls").withIndex("by_caller", (q) => q.eq("callerClerkId", me)).take(left)),
      async () =>
        dropCalls(await ctx.db.query("calls").withIndex("by_callee", (q) => q.eq("calleeClerkId", me)).take(left)),
      // connections and connection requests
      async () => drop(await ctx.db.query("requests").withIndex("by_from", (q) => q.eq("fromClerkId", me)).take(left)),
      async () => drop(await ctx.db.query("requests").withIndex("by_to", (q) => q.eq("toClerkId", me)).take(left)),
      // blocks, either way round
      async () => drop(await ctx.db.query("blocks").withIndex("by_blocker", (q) => q.eq("blockerClerkId", me)).take(left)),
      async () => drop(await ctx.db.query("blocks").withIndex("by_blocked", (q) => q.eq("blockedClerkId", me)).take(left)),
      // reports this account filed (reports ABOUT it stay — see the header)
      async () =>
        drop(await ctx.db.query("safetyReports").withIndex("by_reporter", (q) => q.eq("reporterClerkId", me)).take(left)),
      // events hosted (with their guest lists) and events joined
      async () => {
        const hosted = await ctx.db.query("parties").withIndex("by_host", (q) => q.eq("hostClerkId", me)).take(left);
        for (const party of hosted) {
          if (left <= 0) return;
          await drop(
            await ctx.db.query("partyGuests").withIndex("by_party", (q) => q.eq("partyId", party._id)).take(left)
          );
          if (left <= 0) return;
          await drop([party]);
        }
      },
      async () => drop(await ctx.db.query("partyGuests").withIndex("by_guest", (q) => q.eq("clerkId", me)).take(left)),
      // hours and credits
      async () => drop(await ctx.db.query("ledger").withIndex("by_clerkId", (q) => q.eq("clerkId", me)).take(left)),
      async () => drop(await ctx.db.query("wallets").withIndex("by_clerkId", (q) => q.eq("clerkId", me)).take(left)),
      // an early-access entry under the same email address
      async () => {
        const email = typeof identity.email === "string" ? identity.email.trim().toLowerCase() : "";
        if (!email) return;
        await drop(await ctx.db.query("waitlist").withIndex("by_email", (q) => q.eq("email", email)).take(left));
      },
      // the profile itself — name, progress, date of birth — last
      async () => drop(await ctx.db.query("profiles").withIndex("by_clerkId", (q) => q.eq("clerkId", me)).take(left)),
    ];

    for (const step of steps) {
      if (left <= 0) return { done: false };
      await step();
    }
    // budget left over means every query above came back short: nothing remains
    return { done: left > 0 };
  },
});
