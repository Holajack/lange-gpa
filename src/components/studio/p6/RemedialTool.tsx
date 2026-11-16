"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useApp } from "@/lib/store";
import { PHASES } from "@/lib/phases";
import { phaseKey } from "@/lib/phaseI18n";
import { FinishBar, RecordingList, StepGuide, StudioHeader, useStudioTimer, type GuideStep } from "../StudioShell";
import type { StudioToolProps } from "../types";
import { hostMoves } from "./content";
import { P6, REMEDIAL_INITIAL, type RemedialState } from "./model";
import { useStudioStore } from "./store";
import { Panel } from "./ui";
import { WeeklySummaryCard } from "./WeeklySummary";
import { Diagnostic } from "./remedial/Diagnostic";
import { HoleFinder } from "./remedial/HoleFinder";
import { PickupCounter } from "./remedial/PickupCounter";

/**
 * Earlier-phase tools worth running again. An entry with an `activity` is
 * titled with that activity's own (already localized) name; the others carry
 * their own title string.
 */
const OLD_TOOLS: { key: string; href: string; icon: string; activity?: string }[] = [
  { key: "p4holes", href: "/studio/p4-holes", icon: "🕳️", activity: "p4-holes" },
  { key: "p5library", href: "/studio/p5-library", icon: "🎧", activity: "p5-library" },
  { key: "library", href: "/library", icon: "📼" },
  { key: "practice", href: "/practice", icon: "🃏" },
  { key: "p2busy", href: "/studio/p2-busy", icon: "🖼️", activity: "p2-busy" },
  { key: "p2story", href: "/studio/p2-storybuild", icon: "📖", activity: "p2-storybuild" },
  { key: "p3script", href: "/studio/p3-script", icon: "🧾", activity: "p3-script" },
  { key: "p4life", href: "/studio/p4-lifestory", icon: "🫖", activity: "p4-lifestory" },
];

/**
 * p6-remedial — Remedial Pickup, and the un-6 diagnostic.
 * An honest look at whether growth is still happening, kept over time, that
 * routes to the remedy that fits: more life in the host world, or focused
 * hours with old tools at full power. Plus the two things a grower can start
 * on right now: finding holes, and a ten-words-an-hour pickup sitting.
 */
export function RemedialTool({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const accent = phase.color;
  const timer = useStudioTimer(activity.id);
  const { state, update } = useStudioStore<RemedialState>(P6.remedial, lang, REMEDIAL_INITIAL);

  /** The localized name of another phase's activity (falls back to its English source). */
  const activityName = (id: string): string => {
    for (const p of PHASES) {
      const a = p.activities.find((x) => x.id === id);
      if (!a) continue;
      const key = phaseKey.activity.name(p.id, a.id);
      const text = t(key);
      return `${text === key ? a.name : text} · ${t("phaseWord")} ${p.id}`;
    }
    return id;
  };

  const steps: GuideStep[] = [
    { title: t("st6_m_step1T"), body: t("st6_m_step1B"), who: "you" },
    { title: t("st6_m_step2T"), body: t("st6_m_step2B"), who: "you" },
    { title: t("st6_m_step3T"), body: t("st6_m_step3B"), who: "you" },
    { title: t("st6_m_step4T"), body: t("st6_m_step4B"), who: "both" },
    { title: t("st6_m_step5T"), body: t("st6_m_step5B"), who: "both" },
    { title: t("st6_m_step6T"), body: t("st6_m_step6B"), who: "you" },
  ];

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="🧩" mode="either" />
      <StepGuide steps={steps} accent={accent} />

      <Diagnostic lang={lang} accent={accent} state={state} update={update} />

      <WeeklySummaryCard lang={lang} />

      <HoleFinder lang={lang} phaseId={phase.id} activityId={activity.id} accent={accent} />

      <PickupCounter lang={lang} phaseId={phase.id} accent={accent} state={state} update={update} />

      {/* ---- earlier-phase tools, re-run at full power ---- */}
      <Panel title={t("st6_m_oldTitle")} sub={t("st6_m_oldSub")}>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {OLD_TOOLS.map((tool) => (
            <li key={tool.key}>
              <Link
                href={tool.href}
                className="flex h-full min-h-14 items-start gap-3 rounded-2xl border border-line bg-raised-2 px-4 py-3 hover:border-white/20"
              >
                <span className="text-xl" aria-hidden>
                  {tool.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">
                    {tool.activity ? activityName(tool.activity) : t(`st6_m_old_${tool.key}T`)}
                  </span>
                  <span className="block text-xs leading-relaxed text-muted">{t(`st6_m_old_${tool.key}B`)}</span>
                </span>
                <ArrowRight size={15} strokeWidth={2.5} className="mt-1 shrink-0 text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-xs leading-relaxed text-muted">{t("st6_m_oldNote")}</p>
      </Panel>

      <RecordingList
        filter={{ activityId: activity.id, lang }}
        accent={accent}
        moves={hostMoves("feedback", lang)}
        title={t("st6_m_allRecordings")}
        emptyText={t("st6_m_noRecordings")}
      />

      <FinishBar timer={timer} accent={accent} />
    </div>
  );
}
