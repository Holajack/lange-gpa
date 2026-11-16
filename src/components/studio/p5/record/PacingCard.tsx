"use client";

import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import { useLibrary } from "@/lib/library";
import { Callout } from "../../StudioShell";
import { WORK_PER_RECORDED } from "../clarifyFlow";
import { pacingOf, useFlows } from "../discourse";
import { Field, INPUT, Meter, Panel, Stat, useDurationWords } from "../ui";
import { MIN_RECORDING_MIN, PHASE_TARGET_HOURS, RECORDING_MIN_PER_MENTOR_HOUR } from "./model";

/**
 * The guide's pacing arithmetic, made visible: about three hours of work
 * clear one hour of recording, so an hour with a mentor uses up about twenty
 * minutes of it. Collecting has to stay just ahead of clarifying.
 */
export function PacingCard({
  lang,
  accent,
  weeklyHours,
  onWeeklyHours,
}: {
  lang: LangCode;
  accent: string;
  weeklyHours: number;
  onWeeklyHours: (hours: number) => void;
}) {
  const { t } = useApp();
  const { items } = useLibrary({ lang });
  const { flows } = useFlows(lang);
  const words = useDurationWords();

  const p = pacingOf(items, flows, lang);
  const mentorAheadSec = p.waitingSec * WORK_PER_RECORDED;
  const weeklyNeedMin = Math.max(0, weeklyHours) * RECORDING_MIN_PER_MENTOR_HOUR;
  const weeksLeft = weeklyNeedMin > 0 ? p.waitingSec / 60 / weeklyNeedMin : null;
  const ratio = p.clearedSec >= 60 && p.workSec > 0 ? p.workSec / p.clearedSec : null;
  const targetSec = PHASE_TARGET_HOURS[0] * 3600;

  const signal: "empty" | "low" | "full" | "ok" =
    p.bankedSec === 0
      ? "empty"
      : p.waitingSec < MIN_RECORDING_MIN * 60
        ? "low"
        : weeksLeft !== null && weeksLeft >= 4
          ? "full"
          : "ok";
  const signalIcon = { empty: "🎙️", low: "⏳", full: "📚", ok: "✓" }[signal];

  return (
    <Panel title={t("st5_paceTitle")} sub={t("st5_paceSub")}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat value={words(p.bankedSec)} label={t("st5_paceBanked")} sub={t("st5_paceCount").replace("{n}", String(p.recordings))} />
        <Stat value={words(p.clearedSec)} label={t("st5_paceClear")} />
        <Stat value={words(p.waitingSec)} label={t("st5_paceWaiting")} />
        <Stat value={`~${words(mentorAheadSec)}`} label={t("st5_paceAhead")} />
      </div>

      <Callout icon={signalIcon} title={t(`st5_paceSignal_${signal}`)} tone={signal === "low" ? "warm" : signal === "ok" ? "safe" : "neutral"}>
        <p>
          {signal === "ok" && weeksLeft !== null
            ? t("st5_paceSignalBody_ok").replace("{n}", weeksLeft < 1 ? "<1" : String(Math.floor(weeksLeft)))
            : t(`st5_paceSignalBody_${signal === "ok" ? "okPlain" : signal}`)}
        </p>
      </Callout>

      <div>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-xs text-muted">
          <span className="font-semibold">{t("st5_paceTarget")}</span>
          <span className="tabular-nums">
            {words(p.clearedSec)} / {PHASE_TARGET_HOURS[0]}–{PHASE_TARGET_HOURS[1]} {t("st5_unitH")}
          </span>
        </div>
        <Meter value={p.clearedSec} max={targetSec} accent={accent} label={t("st5_paceTarget")} />
        {ratio !== null && (
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {t("st5_paceRatio").replace("{n}", ratio.toFixed(1))}
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,14rem)_1fr] sm:items-end">
        <Field label={t("st5_paceWeekly")}>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={60}
            value={Number.isFinite(weeklyHours) ? weeklyHours : 0}
            onChange={(e) => onWeeklyHours(Math.max(0, Math.min(60, Number(e.target.value) || 0)))}
            className={INPUT}
          />
        </Field>
        <p className="text-sm leading-relaxed text-muted">
          {t("st5_paceWeeklyNeed").replace("{n}", words(weeklyNeedMin * 60))}
        </p>
      </div>
    </Panel>
  );
}
