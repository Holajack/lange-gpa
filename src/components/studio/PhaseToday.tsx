"use client";

import Link from "next/link";
import { ArrowRight, Headphones } from "lucide-react";
import { useApp } from "@/lib/store";
import { phaseById } from "@/lib/phases";
import { localizedPhase } from "@/lib/phaseI18n";
import { activityHref } from "@/lib/studioRoutes";
import { tonightsQueue, useLibrary } from "@/lib/library";
import { textOn } from "./StudioShell";

/**
 * PhaseToday — the dashboard's "what do I do today" card for growers past
 * Phase 1. Phase 1's day is the meeting spine (CheckpointCard); from Phase 2
 * on it is the phase's own activities plus tonight's re-listening.
 */
export function PhaseToday() {
  const { profile, t } = useApp();
  const { items } = useLibrary({ lang: profile?.targetLang });

  if (!profile || profile.phase < 2 || profile.role === "nurturer") return null;

  const phase = localizedPhase(phaseById(profile.phase), t);
  const byId = new Map(phase.activities.map((a) => [a.id, a]));
  const queue = tonightsQueue(items, 1);

  // the sub-stage the grower is in: hours into the phase mapped across its parts
  const parts = phase.parts ?? [];
  const into = Math.max(0, profile.hoursLogged - phase.startHour);
  const share = phase.hours > 0 ? Math.min(0.999, into / phase.hours) : 0;
  const part = parts.length > 0 ? parts[Math.floor(share * parts.length)] : undefined;
  const activities = (part ? part.activityIds.map((id) => byId.get(id)) : phase.activities)
    .filter((a): a is NonNullable<typeof a> => Boolean(a))
    .filter((a) => Boolean(activityHref(a)))
    .slice(0, 4);

  return (
    <section className="card relative overflow-hidden p-6 sm:p-7">
      <div className="orb -right-16 -top-20 h-56 w-56" style={{ background: phase.color + "26" }} />
      <div className="relative">
        <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: phase.color }}>
          {phase.emoji} {t("phaseWord")} {phase.id} · {phase.name}
        </p>
        {part && (
          <>
            <h2 className="headline mt-2 text-2xl sm:text-3xl">{part.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{part.focus}</p>
          </>
        )}

        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {activities.map((a) => (
            <li key={a.id}>
              <Link
                href={activityHref(a) as string}
                className="flex h-full items-center gap-3 rounded-2xl border border-line bg-raised-2 px-4 py-3 hover:bg-white/8"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{a.name}</span>
                  <span className="block text-xs text-muted">
                    ⏱ {a.minutes} {t("minutes")}
                  </span>
                </span>
                <ArrowRight size={15} strokeWidth={2.5} className="shrink-0 text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/courses/${phase.slug}`}
            className={`pill px-5 py-3 text-sm font-bold ${textOn(phase.color)}`}
            style={{ background: phase.color }}
          >
            {t("openPhase")} <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
          <Link href="/library" className="pill bg-white/7 px-5 py-3 text-sm font-semibold text-ink">
            <Headphones size={15} strokeWidth={2.5} />
            {queue.length > 0 ? `${t("stc_libTonight")}: ${queue[0].title}` : t("stc_libTitle")}
          </Link>
        </div>
      </div>
    </section>
  );
}
