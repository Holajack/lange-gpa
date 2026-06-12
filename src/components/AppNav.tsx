"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { langByCode } from "@/lib/languages";
import { Logo } from "./Logo";
import { Avatar } from "./Avatar";

const TABS = [
  { key: "courses", href: "/courses" },
  { key: "dashboard", href: "/dashboard" },
  { key: "schedule", href: "/schedule" },
  { key: "world", href: "/world" },
  { key: "forum", href: "/forum" },
];

/** Extra tab for nurturer-role users — the Nurturer Studio. */
const NURTURE_TAB = { key: "nurture", href: "/nurture" };

export function AppNav() {
  const { profile, t, uiLang, toggleImmersion } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  if (!profile) return null;

  const target = langByCode(profile.targetLang);
  const known = profile.knownLangs.map(langByCode);
  const tabs = profile.role === "nurturer" || profile.role === "both" ? [...TABS, NURTURE_TAB] : TABS;
  const roleLabel =
    profile.role === "nurturer" ? t("nurturerWord") : profile.role === "both" ? `${t("student")} + ${t("nurturerWord")}` : t("student");

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 lg:px-8">
      <div className="mx-auto flex max-w-[1400px] items-center gap-3">
        {/* tabs */}
        <nav className="card flex items-center gap-1 rounded-full bg-raised/85 p-1.5 backdrop-blur-xl">
          {tabs.map((tab) => {
            const active = pathname.startsWith(tab.href);
            const nurture = tab.key === "nurture";
            return (
              <Link
                key={tab.key}
                href={tab.href}
                className={`pill px-4 py-2.5 text-sm lg:px-6 ${
                  active
                    ? nurture
                      ? "bg-orange text-canvas shadow-glow-orange"
                      : "bg-violet text-white shadow-glow-violet"
                    : "text-muted hover:text-ink"
                }`}
              >
                {t(tab.key)}
              </Link>
            );
          })}
        </nav>

        <div className="hidden flex-1 justify-center md:flex">
          <Logo href="/dashboard" />
        </div>
        <div className="flex-1 md:hidden" />

        {/* language chips: target first (big), known langs after */}
        <button
          onClick={toggleImmersion}
          title={`${t("immersionOn")}: ${target.name}`}
          className="card flex items-center gap-2 rounded-full bg-raised/85 px-2 py-1.5 backdrop-blur-xl"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet text-lg shadow-glow-violet">
            {target.flag}
          </span>
          {known
            .filter((l) => l.code !== target.code)
            .slice(0, 2)
            .map((l) => (
              <span key={l.code} className="flex h-8 w-8 items-center justify-center rounded-full bg-raised-2 text-base opacity-80">
                {l.flag}
              </span>
            ))}
          <span
            className={`mr-1 hidden rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider lg:inline ${
              profile.immersion ? "bg-lime text-canvas" : "bg-raised-2 text-muted"
            }`}
          >
            {t("immersionOn")}
          </span>
        </button>

        {/* profile */}
        <button
          onClick={() => router.push("/onboarding")}
          className="card flex items-center gap-3 rounded-full bg-raised/85 py-1.5 pl-4 pr-1.5 backdrop-blur-xl card-hover"
          title={`${profile.name} — ${roleLabel}`}
        >
          <span className="hidden text-right leading-tight sm:block">
            <span className="block text-sm font-semibold">{profile.name}</span>
            <span className="block text-[11px] text-muted">{roleLabel}</span>
          </span>
          <Avatar name={profile.name || "G"} color="#ffb52e" size={38} />
        </button>
      </div>
    </header>
  );
}
