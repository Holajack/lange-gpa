import { internalMutation } from "./_generated/server";

/**
 * Retention sweep — the two time-based periods promised in the Privacy Policy
 * (clause 12.1), enforced by software instead of by remembering to do it:
 *
 *   - early-access (waitlist) entries: removed 24 months after they joined;
 *   - safety reports: removed 24 months after they were closed.
 *
 * Everything else is tied to the account and goes when the account is deleted
 * (convex/account.ts). Run daily by convex/crons.ts. Each run removes a bounded
 * batch, so a backlog simply drains over the following days.
 */
const DAY_MS = 24 * 60 * 60 * 1000;
const RETENTION_MS = 730 * DAY_MS; // 24 months
const BATCH = 200;

export const sweep = internalMutation({
  args: {},
  handler: async (ctx): Promise<{ waitlist: number; reports: number }> => {
    const cutoff = Date.now() - RETENTION_MS;

    // oldest first, by the built-in creation-time index: reads only what it removes
    const oldEntries = await ctx.db
      .query("waitlist")
      .withIndex("by_creation_time", (q) => q.lt("_creationTime", cutoff))
      .take(BATCH);
    for (const entry of oldEntries) await ctx.db.delete(entry._id);

    // a report's clock starts when it is closed (`updatedAt` is stamped on every status change)
    const oldReports = await ctx.db
      .query("safetyReports")
      .withIndex("by_status", (q) => q.eq("status", "closed"))
      .filter((q) => q.lt(q.field("updatedAt"), cutoff))
      .take(BATCH);
    for (const report of oldReports) await ctx.db.delete(report._id);

    return { waitlist: oldEntries.length, reports: oldReports.length };
  },
});
