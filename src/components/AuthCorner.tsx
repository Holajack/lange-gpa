"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";

/**
 * Account corner for the app nav (Clerk v7: gate on useUser, the old
 * SignedIn/SignedOut control components no longer exist). Only mounted
 * when Clerk is configured — Providers renders plain children keyless,
 * so this component must itself check the key before using Clerk hooks.
 */
function SignedCorner() {
  const { isSignedIn } = useUser();
  if (isSignedIn) {
    return (
      <UserButton
        appearance={{
          variables: { colorPrimary: "#7c5cff", colorBackground: "#171022", colorForeground: "#f4f0ff" },
        }}
      />
    );
  }
  return (
    <Link
      href="/sign-in"
      className="pill bg-violet px-4 py-2 text-sm font-bold text-white shadow-glow-violet"
    >
      Sign in
    </Link>
  );
}

export function AuthCorner() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return null;
  return <SignedCorner />;
}
