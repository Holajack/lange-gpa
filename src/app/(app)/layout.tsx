"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { CallProvider } from "@/components/CallProvider";
import { useApp } from "@/lib/store";

/**
 * Shell for everything behind onboarding: top nav + profile guard.
 * No profile yet → you meet Nuri at onboarding first.
 */
const CLERK_ON = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, ready, cloudState } = useApp();
  const router = useRouter();

  // With Clerk on, sign-out is enforced by middleware (→ /sign-in), and we
  // wait for the cloud account to finish loading before routing — otherwise a
  // signed-in user with an existing account would flash onboarding. Keyless
  // builds settle as soon as localStorage is read.
  const settled = CLERK_ON ? ready && cloudState === "ready" : ready;

  useEffect(() => {
    if (settled && !profile) router.replace("/onboarding");
  }, [settled, profile, router]);

  if (!settled || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet border-t-transparent" />
      </div>
    );
  }

  return (
    <CallProvider>
    <div className="relative min-h-screen overflow-x-clip">
      {/* ambient orbs */}
      <div className="orb left-[-120px] top-[-80px] h-[340px] w-[340px] bg-violet/20" />
      <div className="orb right-[-100px] top-[30%] h-[300px] w-[300px] bg-orange/12" />
      <AppNav />
      <main className="relative mx-auto max-w-[1400px] px-4 pb-20 pt-6 lg:px-8">{children}</main>
    </div>
    </CallProvider>
  );
}
