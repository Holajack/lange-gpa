"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { langByCode } from "@/lib/languages";
import { Logo } from "./Logo";
import { Avatar } from "./Avatar";
import { useUnread } from "@/lib/messages";

/**
 * Three primary clusters instead of nine flat tabs (consolidation, 2026-06):
 *   Learn      — the GPA curriculum (today / journey / practice)
 *   Sessions   — booking a nurturer (find / upcoming)
 *   Community  — real people (world / chats / events / forum)
 * Nurture is appended for nurturer/both roles. Wallet + Profile moved to the
 * account page (the profile pill). Each cluster opens its default child and
 * surfaces a secondary sub-tab strip for its siblings.
 */
type SubTab = { key: string; href: string };
type Cluster = { key: string; href: string; kids: SubTab[] };

const CLUSTERS: Cluster[] = [
  {
    key: "learn",
    href: "/dashboard",
    kids: [
      { key: "dashboard", href: "/dashboard" },
      { key: "courses", href: "/courses" },
      { key: "practice", href: "/practice" },
    ],
  },
  {
    key: "sessions",
    href: "/marketplace",
    kids: [
      { key: "marketplace", href: "/marketplace" },
      { key: "schedule", href: "/schedule" },
    ],
  },
  {
    key: "community",
    href: "/world",
    kids: [
      { key: "world", href: "/world" },
      { key: "messages", href: "/messages" },
      { key: "events", href: "/events" },
      { key: "forum", href: "/forum" },
    ],
  },
];

/** Extra cluster for nurturer-role users — the Nurturer Studio (no sub-tabs). */
const NURTURE_CLUSTER: Cluster = { key: "nurture", href: "/nurture", kids: [] };

export function AppNav() {
  const { profile, t, toggleImmersion } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const unread = useUnread();

  if (!profile) return null;

  const clusters =
    profile.role === "nurturer" || profile.role === "both" ? [...CLUSTERS, NURTURE_CLUSTER] : CLUSTERS;

  const inCluster = (c: Cluster) =>
    pathname.startsWith(c.href) || c.kids.some((k) => pathname.startsWith(k.href));
  const activeCluster = clusters.find(inCluster) ?? clusters[0];
  const subTabs = activeCluster.kids.length > 1 ? activeCluster.kids : [];

  const target = langByCode(profile.targetLang);
  const known = profile.knownLangs.map(langByCode);
  const roleLabel =
    profile.role === "nurturer"
      ? t("nurturerWord")
      : profile.role === "both"
        ? `${t("student")} + ${t("nurturerWord")}`
        : t("student");

  const badge = (n: number) =>
    n > 0 ? (
      <span className="ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-lime px-1 text-[10px] font-bold text-canvas">
        {n}
      </span>
    ) : null;

  // Community holds Messages → surface the unread count on its parent.
  const clusterUnread = (c: Cluster) => (c.key === "community" ? unread : 0);

  const primaryClass = (c: Cluster, extra: string) => {
    const active = c.key === activeCluster.key;
    const nurture = c.key === "nurture";
    return `pill ${extra} ${
      active
        ? nurture
          ? "bg-orange text-canvas shadow-glow-orange"
          : "bg-violet text-white shadow-glow-violet"
        : "text-muted hover:text-ink"
    }`;
  };

  const subClass = (k: SubTab) => {
    const active = pathname.startsWith(k.href);
    return `pill shrink-0 px-4 py-2 text-sm font-semibold ${
      active ? "bg-violet/15 text-violet-soft" : "text-muted hover:text-ink"
    }`;
  };

  return (
    <>
      <header className="sticky top-0 z-50 px-4 pt-4 lg:px-8">
        <div className="mx-auto flex max-w-[1400px] items-center gap-2 sm:gap-3">
          {/* desktop cluster strip */}
          <nav className="card hidden items-center gap-1 rounded-full bg-raised/85 p-1.5 backdrop-blur-xl md:flex">
            {clusters.map((c) => (
              <Link key={c.key} href={c.href} className={primaryClass(c, "px-4 py-2.5 text-sm lg:px-6")}>
                {t(c.key)}
                {badge(clusterUnread(c))}
              </Link>
            ))}
          </nav>

          {/* logo: left on mobile, centered on desktop */}
          <div className="flex flex-1 justify-start md:justify-center">
            <Logo href="/dashboard" />
          </div>

          {/* language chips: target first (big), known langs after */}
          <button
            onClick={toggleImmersion}
            title={`${t("immersionOn")}: ${target.nativeName}`}
            className="card flex shrink-0 items-center gap-1.5 rounded-full bg-raised/85 px-2 py-1.5 backdrop-blur-xl sm:gap-2"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet text-lg shadow-glow-violet">
              {target.flag}
            </span>
            {known
              .filter((l) => l.code !== target.code)
              .slice(0, 2)
              .map((l) => (
                <span key={l.code} className="hidden h-8 w-8 items-center justify-center rounded-full bg-raised-2 text-base opacity-80 sm:flex">
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

          {/* profile — opens the account page (NOT onboarding); Wallet lives there now */}
          <button
            onClick={() => router.push("/profile")}
            className="card flex shrink-0 items-center gap-3 rounded-full bg-raised/85 py-1.5 pl-1.5 pr-1.5 backdrop-blur-xl card-hover sm:pl-4"
            title={`${profile.name} — ${roleLabel}`}
          >
            <span className="hidden text-right leading-tight sm:block">
              <span className="block text-sm font-semibold">{profile.name}</span>
              <span className="block text-[11px] text-muted">{roleLabel}</span>
            </span>
            <Avatar name={profile.name || "G"} color="#ffb52e" size={38} />
          </button>
        </div>

        {/* secondary sub-tab strip for the active cluster (sticks with the header) */}
        {subTabs.length > 0 && (
          <div className="mx-auto mt-2 max-w-[1400px]">
            <div className="no-scrollbar card flex items-center gap-1 overflow-x-auto rounded-full bg-raised/70 p-1 backdrop-blur-xl md:inline-flex">
              {subTabs.map((k) => (
                <Link key={k.key} href={k.href} className={subClass(k)}>
                  {t(k.key)}
                  {k.key === "messages" ? badge(unread) : null}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* mobile bottom tab bar — the 3–4 primary clusters (no more horizontal overflow) */}
      <nav className="fixed inset-x-0 bottom-0 z-50 md:hidden">
        <div
          className="no-scrollbar mx-3 flex gap-1 overflow-x-auto rounded-full border border-line bg-raised/90 p-1.5 shadow-pop backdrop-blur-xl"
          style={{ marginBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          {clusters.map((c) => (
            <Link key={c.key} href={c.href} className={primaryClass(c, "flex-1 justify-center px-4 py-2 text-sm")}>
              {t(c.key)}
              {badge(clusterUnread(c))}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
