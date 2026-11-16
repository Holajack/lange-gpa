"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { PHASES } from "@/lib/phases";
import { Mascot } from "@/components/Mascot";
import { PhaseGate } from "@/components/studio/StudioShell";
import { loadStudioTool } from "@/components/studio/registry";
import type { StudioTool } from "@/components/studio/types";
import type { LangCode } from "@/lib/types";

/**
 * /studio/{activityId} — the workbench for one curriculum activity.
 * Resolves the activity + its phase, enforces "phases are lived in order",
 * and mounts the tool registered for that activity (loaded per phase).
 */
export default function StudioPage() {
  const { activity: activityId } = useParams<{ activity: string }>();
  const { profile, t, uiLang } = useApp();
  // undefined = still loading · null = no workbench registered
  const [tool, setTool] = useState<{ id: string; Tool: StudioTool | null } | undefined>(undefined);

  // the languages this grower's interface can speak: their own, the one shown
  // right now, and (as immersion grows) the one they are growing into
  const native = profile?.knownLangs[0];
  const target = profile?.targetLang;
  const langKey = [native, uiLang, target].filter(Boolean).join(",");

  useEffect(() => {
    if (!activityId) return;
    let alive = true;
    const key = `${activityId}|${langKey}`;
    loadStudioTool(activityId, langKey.split(",") as LangCode[])
      .then((Tool) => alive && setTool({ id: key, Tool: Tool ?? null }))
      .catch(() => alive && setTool({ id: key, Tool: null }));
    return () => {
      alive = false;
    };
  }, [activityId, langKey]);

  if (!profile) return null;

  const phase = PHASES.find((p) => p.activities.some((a) => a.id === activityId));
  const activity = phase?.activities.find((a) => a.id === activityId);
  const loaded = tool && tool.id === `${activityId}|${langKey}` ? tool : undefined;

  if (phase && activity && !loaded) {
    return <div className="mx-auto min-h-[60vh] max-w-4xl" aria-busy="true" />;
  }

  const Tool = loaded?.Tool;
  if (!phase || !activity || !Tool) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center py-10">
        <div className="card flex max-w-md flex-col items-center gap-5 p-10 text-center">
          <Mascot size={130} mood="think" />
          <h1 className="headline text-3xl">{t(phase ? "stc_notBuilt" : "crsNoPhaseTitle")}</h1>
          <Link
            href={phase ? `/courses/${phase.slug}` : "/courses"}
            className="pill bg-violet px-6 py-3 text-sm font-bold text-white"
          >
            ← {t("back")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PhaseGate phaseId={phase.id}>
      <div className="mx-auto max-w-4xl pb-16">
        <Tool activity={activity} phase={phase} lang={profile.targetLang} />
      </div>
    </PhaseGate>
  );
}
