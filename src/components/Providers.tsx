"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

/**
 * Auth + backend providers, keyless-safe.
 *
 * When NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and NEXT_PUBLIC_CONVEX_URL are both
 * set (see docs/SETUP-BACKEND.md), children get ClerkProvider +
 * ConvexProviderWithClerk so `useQuery`/`useMutation`/`useAuth` work anywhere
 * in the tree. When either is absent (the current keyless demo deploy), this
 * renders children unchanged and the app behaves exactly as before.
 *
 * NEXT_PUBLIC_* vars are inlined at build time, so the branch is stable for
 * the lifetime of a deployment. Nothing here imports convex/_generated.
 */
const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

if (process.env.NODE_ENV === "production" && !demoMode && (!clerkKey || !convexUrl)) {
  throw new Error(
    "Nurilang production requires NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and NEXT_PUBLIC_CONVEX_URL. " +
      "Set NEXT_PUBLIC_DEMO_MODE=true only for an intentional non-account demo."
  );
}

const convexClient =
  clerkKey && convexUrl ? new ConvexReactClient(convexUrl) : null;

export function Providers({ children }: { children: React.ReactNode }) {
  if (!clerkKey) return <>{children}</>;

  const accountTree = convexClient ? (
    <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  ) : (
    children
  );

  return (
    <ClerkProvider
      publishableKey={clerkKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/onboarding"
    >
      {accountTree}
    </ClerkProvider>
  );
}
