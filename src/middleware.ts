import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Keyless-safe middleware: when Clerk env vars are absent (the current demo
 * deploy) every request passes straight through; when the owner adds keys
 * (docs/SETUP-BACKEND.md) Clerk's middleware takes over without code changes.
 * Importing @clerk/nextjs/server is safe keyless — only running
 * clerkMiddleware() without keys would throw, so it is only constructed when
 * the publishable key exists.
 */
const hasClerkKeys = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

function passthrough(_req: NextRequest) {
  return NextResponse.next();
}

export default hasClerkKeys ? clerkMiddleware() : passthrough;

export const config = {
  matcher: [
    // All routes except Next internals and static assets (Clerk's standard matcher).
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes.
    "/(api|trpc)(.*)",
  ],
};
