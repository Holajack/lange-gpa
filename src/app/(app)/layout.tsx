"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { useApp } from "@/lib/store";

/**
 * Shell for everything behind onboarding: top nav + profile guard.
 * No profile yet → you meet Nuri at onboarding first.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, ready } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (ready && !profile) router.replace("/onboarding");
  }, [ready, profile, router]);

  if (!ready || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-clip">
      {/* ambient orbs */}
      <div className="orb left-[-120px] top-[-80px] h-[340px] w-[340px] bg-violet/20" />
      <div className="orb right-[-100px] top-[30%] h-[300px] w-[300px] bg-orange/12" />
      <AppNav />
      <main className="relative mx-auto max-w-[1400px] px-4 pb-20 pt-6 lg:px-8">{children}</main>
    </div>
  );
}
