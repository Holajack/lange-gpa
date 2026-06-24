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

/** Everything behind the account: the app shell routes + onboarding. */
const isProtected = createRouteMatcher([
  "/dashboard(.*)",
  "/courses(.*)",
  "/schedule(.*)",
  "/world(.*)",
  "/forum(.*)",
  "/wallet(.*)",
  "/marketplace(.*)",
  "/nurture(.*)",
  "/session(.*)",
  "/practice(.*)",
  "/profile(.*)",
  "/onboarding(.*)",
]);

function passthrough(_req: NextRequest) {
  return NextResponse.next();
}

export default hasClerkKeys
  ? clerkMiddleware(async (auth, req) => {
      if (isProtected(req)) {
        await auth.protect({
          unauthenticatedUrl: new URL("/sign-in", req.url).toString(),
        });
      }
    })
  : passthrough;

export const config = {
  matcher: [
    // All routes except Next internals and static assets (Clerk's standard matcher).
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes.
    "/(api|trpc)(.*)",
  ],
};
