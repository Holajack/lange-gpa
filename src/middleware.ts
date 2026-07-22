import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Keyless-safe middleware with sign-in enforcement.
 *
 * When Clerk env vars are absent (a keyless demo deploy) every request passes
 * straight through and the app runs anonymously. When keys are present, the
 * app requires an account: the routes below (the whole signed-in app + the
 * onboarding flow that creates the account) redirect to /sign-in unless the
 * visitor is authenticated. Public routes — landing, /early, /sign-in,
 * /sign-up, API — stay open.
 *
 * Importing @clerk/nextjs/server is safe keyless; only running
 * clerkMiddleware() without keys would throw, so it is only constructed when
 * the publishable key exists.
 */
const hasClerkKeys = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const hasConvexUrl = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);
const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const commerceEnabled =
  process.env.ENABLE_COMMERCE === "true" &&
  process.env.NEXT_PUBLIC_ENABLE_COMMERCE === "true";
const partiesEnabled =
  process.env.ENABLE_PARTIES === "true" &&
  process.env.NEXT_PUBLIC_ENABLE_PARTIES === "true";
const forumEnabled =
  process.env.ENABLE_FORUM === "true" &&
  process.env.NEXT_PUBLIC_ENABLE_FORUM === "true";
const communityExchangeEnabled =
  process.env.ENABLE_COMMUNITY_EXCHANGE === "true" &&
  process.env.NEXT_PUBLIC_ENABLE_COMMUNITY_EXCHANGE === "true";
const nurturerStudioEnabled =
  process.env.ENABLE_NURTURER_STUDIO === "true" &&
  process.env.NEXT_PUBLIC_ENABLE_NURTURER_STUDIO === "true";

if (process.env.NODE_ENV === "production" && !demoMode && (!hasClerkKeys || !hasConvexUrl)) {
  throw new Error(
    "Nurilang production requires Clerk and Convex configuration. " +
      "Use NEXT_PUBLIC_DEMO_MODE=true only for an intentional public demo."
  );
}

/** Everything behind the account: the app shell routes + onboarding. */
const isProtected = createRouteMatcher([
  "/dashboard(.*)",
  "/courses(.*)",
  "/schedule(.*)",
  "/world(.*)",
  "/events(.*)",
  "/forum(.*)",
  "/wallet(.*)",
  "/marketplace(.*)",
  "/nurture(.*)",
  "/session(.*)",
  "/practice(.*)",
  "/profile(.*)",
  "/messages(.*)",
  "/onboarding(.*)",
  "/admin(.*)",
]);
const isOnboarding = createRouteMatcher(["/onboarding(.*)"]);
const isCommerce = createRouteMatcher(["/marketplace(.*)", "/wallet(.*)"]);
const isParties = createRouteMatcher(["/events(.*)"]);
const isForum = createRouteMatcher(["/forum(.*)"]);
const isCommunityExchange = createRouteMatcher(["/messages(.*)"]);
const isNurturerStudio = createRouteMatcher(["/nurture(.*)"]);

function gatedFeatureRedirect(req: NextRequest) {
  if (isCommerce(req) && !commerceEnabled) return "/schedule";
  if ((isParties(req) && !partiesEnabled) || (isForum(req) && !forumEnabled)) return "/world";
  if (isCommunityExchange(req) && !communityExchangeEnabled) return "/world";
  if (isNurturerStudio(req) && !nurturerStudioEnabled) return "/schedule";
  return null;
}

function demoMiddleware(req: NextRequest) {
  // A keyless demo must not expose prototype flows by guessing a URL.
  const redirectTo = gatedFeatureRedirect(req);
  if (redirectTo) return NextResponse.redirect(new URL(redirectTo, req.url));
  return NextResponse.next();
}

export default hasClerkKeys
  ? clerkMiddleware(async (auth, req) => {
      const redirectTo = gatedFeatureRedirect(req);
      if (redirectTo) return NextResponse.redirect(new URL(redirectTo, req.url));
      if (isProtected(req)) {
        const returnTo = `${req.nextUrl.pathname}${req.nextUrl.search}`;
        const authUrl = new URL(isOnboarding(req) ? "/sign-up" : "/sign-in", req.url);
        authUrl.searchParams.set("redirect_url", returnTo);
        await auth.protect({
          unauthenticatedUrl: authUrl.toString(),
        });
      }
    })
  : demoMiddleware;

export const config = {
  matcher: [
    // All routes except Next internals and static assets (Clerk's standard matcher).
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes.
    "/(api|trpc)(.*)",
    // Clerk's internal handshake endpoints.
    "/__clerk/(.*)",
  ],
};
