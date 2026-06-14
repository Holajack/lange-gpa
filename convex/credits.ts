import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * The credit system's cloud half — two currencies, one ledger.
 *
 * The client is local-first (see src/lib/credits.ts): localStorage is the
 * source of truth and these functions are a best-effort mirror, reached by
 * string name through ConvexHttpClient ("credits:recordEntry"), exactly like
 * waitlist:join. Nothing in the Next build imports convex/_generated, so this
 * folder stays excluded from tsconfig.
 *
 * `wallets` caches the running totals; `ledger` is the append-only history.
 * recordEntry keeps the cache in step with each appended row.
 */

/** A grower's wallet totals, or null before their first entry. */
export const getWallet = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("wallets")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();
  },
});

/** The wallet's history, newest first. `limit` caps the rows returned. */
export const listLedger = query({
  args: { clerkId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { clerkId, limit }) => {
    const rows = await ctx.db
      .query("ledger")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .collect();
    rows.sort((a, b) => b.ts - a.ts);
    return typeof limit === "number" ? rows.slice(0, limit) : rows;
  },
});

/**
 * Append one ledger row and fold its effect into the wallet totals:
 *   earned    → exchangeHours += amount, lifetimeEarned += amount
 *   spent     → exchangeHours -= amount, lifetimeSpent  += amount
 *   purchased → paidHours     += amount
 * Creates the wallet on first use. The client mirrors here after writing
 * localStorage, so this stays idempotent in spirit (one call per movement).
 */
export const recordEntry = mutation({
  args: {
    clerkId: v.string(),
    kind: v.string(),
    currency: v.string(),
    amount: v.number(),
    partner: v.optional(v.string()),
    lang: v.optional(v.string()),
    minutes: v.optional(v.number()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const ts = Date.now();
    const id = await ctx.db.insert("ledger", {
      clerkId: args.clerkId,
      kind: args.kind,
      currency: args.currency,
      amount: args.amount,
      partner: args.partner,
      lang: args.lang,
      minutes: args.minutes,
      note: args.note,
      ts,
    });

    const existing = await ctx.db
      .query("wallets")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    const base = existing ?? {
      exchangeHours: 0,
      paidHours: 0,
      lifetimeEarned: 0,
      lifetimeSpent: 0,
    };

    const next = {
      exchangeHours: base.exchangeHours,
      paidHours: base.paidHours,
      lifetimeEarned: base.lifetimeEarned,
      lifetimeSpent: base.lifetimeSpent,
    };

    if (args.kind === "earned") {
      next.exchangeHours += args.amount;
      next.lifetimeEarned += args.amount;
    } else if (args.kind === "spent") {
      next.exchangeHours -= args.amount;
      next.lifetimeSpent += args.amount;
    } else if (args.kind === "purchased") {
      next.paidHours += args.amount;
    }

    if (existing) {
      await ctx.db.patch(existing._id, { ...next, updatedAt: ts });
    } else {
      await ctx.db.insert("wallets", {
        clerkId: args.clerkId,
        ...next,
        updatedAt: ts,
      });
    }

    return id;
  },
});
