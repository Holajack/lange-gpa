"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { CallProvider } from "@/components/CallProvider";
import { CONVEX_ON } from "@/lib/convexClient";
import { FULL_CONTENT_LANGS } from "@/lib/languages";
import { useApp } from "@/lib/store";

/** Authenticated application chrome plus the account-profile readiness guard. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, ready, cloudState } = useApp();
  const router = useRouter();
  const settled = CONVEX_ON ? ready && cloudState === "ready" : ready;
  const targetSupported = profile ? FULL_CONTENT_LANGS.includes(profile.targetLang) : false;

  useEffect(() => {
    if (settled && !profile) router.replace("/onboarding");
    else if (settled && profile && !targetSupported) router.replace("/onboarding?addLanguage=1");
  }, [settled, profile, targetSupported, router]);

  if (!settled || !profile || !targetSupported) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading your profile">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet border-t-transparent" />
      </div>
    );
  }

  return (
    <CallProvider>
      <div className="relative min-h-screen overflow-x-clip">
        <div className="orb left-[-120px] top-[-80px] h-[340px] w-[340px] bg-violet/20" />
        <div className="orb right-[-100px] top-[30%] h-[300px] w-[300px] bg-orange/12" />
        <AppNav />
        <main className="relative mx-auto max-w-[1400px] px-4 pb-20 pt-6 lg:px-8">{children}</main>
      </div>
    </CallProvider>
  );
}
