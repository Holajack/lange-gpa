import { mutation } from "./_generated/server";

/**
 * The credit system's cloud half — two currencies, one ledger.
 *
 * Credit movements must originate in a trusted session-completion or payment
 * workflow. A browser-supplied amount is not money and must never become an
 * account balance. The old local-first mirror is deliberately rejected until
 * those verified workflows exist.
 */

/**
 * Append one ledger row and fold its effect into the wallet totals:
 *   earned    → exchangeHours += amount, lifetimeEarned += amount
 *   spent     → exchangeHours -= amount, lifetimeSpent  += amount
 *   purchased → paidHours     += amount
 * Creates the wallet on first use. The client mirrors here after writing
 * localStorage, so this stays idempotent in spirit (one call per movement).
 */
export const recordEntry = mutation({
  args: {},
  handler: async () => {
    throw new Error(
      "Direct credit entries are disabled. Credits require a verified session or payment event."
    );
  },
});
