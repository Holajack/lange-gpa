/**
 * Single source of truth for "is Convex + Clerk configured?" — the keyless-safe
 * gate shared by every Convex-backed hook/provider (requests, messages, parties,
 * useRealPeople, CallProvider). When false (a keyless demo build) those hooks
 * bind to no-op stubs instead of calling useConvex() without a provider.
 */
export const CONVEX_ON = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_CONVEX_URL
);
