"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useApp } from "@/lib/store";
import { fmtDuration, useLibrary, type RecordingKind } from "@/lib/library";
import { ClarifyPlayer } from "../ClarifyPlayer";
import { RecordPanel } from "../RecordPanel";
import {
  Callout,
  FinishBar,
  NeedsPersonCallout,
  StepGuide,
  StudioHeader,
  useStudioTimer,
  type GuideStep,
} from "../StudioShell";
import type { StudioToolProps } from "../types";
import { loopInfo, useHeard, useLoopMeta, useStudioState } from "./hooks";
import { MassageStatus, MovesBar, Panel, Segmented, StageChip, usePlayerMoves } from "./shared";

/**
 * p3-massage — the Record-and-Massage Loop, for ANY recording a nurturer makes
 * for the grower. Massaging is comprehension work done on the NURTURER'S
 * speech: listen, flag what you lose, negotiate it in the host language, mark
 * it understood, then listen clean. Nobody's speech gets corrected here.
 */

type RecType = "story" | "place" | "howto" | "topic" | "other";
const TYPES: RecType[] = ["story", "place", "howto", "topic", "other"];

interface LoopState {
  type: RecType;
}
const EMPTY: LoopState = { type: "story" };

/** kinds that hold a host person's speech (the grower's own takes are never massaged) */
const SOURCE_KINDS: RecordingKind[] = ["primary", "expansion", "improved", "imported"];

export function MassageLoop({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const timer = useStudioTimer(activity.id);
  const accent = phase.color;
  const [state, setState] = useStudioState<LoopState>(activity.id, lang, EMPTY);
  const { heard, markHeard } = useHeard(lang);
  const playerMoves = usePlayerMoves(lang, heard);
  const [openId, setOpenId] = useState<string | null>(null);

  const { all, ready } = useLibrary();
  const pool = useMemo(
    () =>
      all.filter(
        (it) =>
          it.lang === lang &&
          it.phase <= 3 &&
          !it.confidential &&
          it.speaker !== "me" &&
          SOURCE_KINDS.includes(it.kind)
      ),
    [all, lang]
  );
  const meta = useLoopMeta(pool);
  const rows = pool
    .map((it) => ({ it, info: loopInfo(it, meta[it.id]) }))
    .sort((a, b) => Number(a.info.stage === "done") - Number(b.info.stage === "done"));
  const understood = rows.filter((r) => r.info.stage === "done").length;
  const openMarks = rows.reduce((sum, r) => sum + r.info.open, 0);

  const steps: GuideStep[] = [
    { title: t("st3_mlS1"), body: t("st3_mlS1b"), who: "nurturer" },
    { title: t("st3_mlS2"), body: t("st3_mlS2b"), who: "you" },
    { title: t("st3_mlS3"), body: t("st3_mlS3b"), who: "you" },
    { title: t("st3_mlS4"), body: t("st3_mlS4b"), who: "both" },
    { title: t("st3_mlS5"), body: t("st3_mlS5b"), who: "both" },
    { title: t("st3_mlS6"), body: t("st3_mlS6b"), who: "you" },
    { title: t("st3_mlS7"), body: t("st3_mlS7b"), who: "you" },
    { title: t("st3_mlS8"), body: t("st3_mlS8b"), who: "you" },
  ];

  const tallies: { value: number; label: string }[] = [
    { value: rows.length - understood, label: t("st3_mlInLoop") },
    { value: openMarks, label: t("st3_mlOpenAll") },
    { value: understood, label: t("st3_mlUnderstood") },
  ];

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="🔁" mode="nurturer" />
      <Callout icon="🧭" title={t("st3_mlWhatTitle")}>
        <p>{t("st3_mlWhatBody")}</p>
      </Callout>
      <StepGuide steps={steps} accent={accent} />
      <NeedsPersonCallout>{t("st3_mlNeeds")}</NeedsPersonCallout>

      <Panel step={1} title={t("st3_mlP1")} sub={t("st3_mlP1b")} accent={accent}>
        <Segmented
          label={t("st3_mlTypeLabel")}
          value={state.type}
          onChange={(type) => setState({ type })}
          options={TYPES.map((id) => ({ id, label: t(`st3_mlType_${id}`) }))}
        />
        <RecordPanel
          lang={lang}
          phase={phase.id}
          activityId={activity.id}
          kind="primary"
          speaker="nurturer"
          defaultTitle={t(`st3_mlType_${state.type}`)}
          accent={accent}
          tags={["massage", state.type]}
          allowImport
          showConsent
        />
      </Panel>

      <Panel step={2} title={t("st3_mlP2")} sub={t("st3_mlP2b")} accent={accent}>
        <dl className="grid grid-cols-3 gap-2">
          {tallies.map((s) => (
            <div key={s.label} className="rounded-2xl bg-white/5 px-3 py-2.5">
              <dd className="font-display text-xl font-extrabold tabular-nums text-ink">{s.value}</dd>
              <dt className="text-[11px] leading-snug text-muted">{s.label}</dt>
            </div>
          ))}
        </dl>

        <MovesBar lang={lang} heard={heard} onHeard={markHeard} />

        {ready && rows.length === 0 && <p className="text-sm text-muted">{t("st3_mlEmpty")}</p>}
        <ul className="space-y-2">
          {rows.map(({ it, info }) => {
            const open = openId === it.id;
            return (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : it.id)}
                  aria-expanded={open}
                  className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-line bg-raised-2 px-4 py-3 text-left hover:bg-white/8"
                >
                  <span className="min-w-0 flex-1 basis-40">
                    <span className="block truncate text-sm font-semibold text-ink">{it.title}</span>
                    <span className="block text-xs text-muted">
                      {fmtDuration(it.durationSec)} · {t("stc_plHeard")} {info.listens} {t("stc_plTimes")} ·{" "}
                      {t("st3_mlRowMarks").replace("{open}", String(info.open)).replace("{done}", String(info.clarified))}
                    </span>
                  </span>
                  <StageChip stage={info.stage} />
                  <ChevronDown
                    size={16}
                    strokeWidth={2.5}
                    className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                {open && (
                  <div className="mt-2 space-y-3">
                    {/* re-keyed on each counted listen, so every clean listen in one sitting counts */}
                    <ClarifyPlayer
                      key={`${it.id}:${it.relistens.length}`}
                      item={it}
                      accent={accent}
                      moves={playerMoves}
                      onDeleted={() => setOpenId(null)}
                    />
                    <MassageStatus item={it} lang={lang} accent={accent} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Panel>

      <FinishBar timer={timer} accent={accent} />
    </div>
  );
}
