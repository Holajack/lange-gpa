"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { useApp } from "@/lib/store";
import { tonightsQueue } from "@/lib/library";
import {
  Callout,
  FinishBar,
  NeedsPersonCallout,
  RecordingList,
  StepGuide,
  StudioHeader,
  useStudioTimer,
  type GuideStep,
} from "../StudioShell";
import type { StudioToolProps } from "../types";
import {
  BANK_ICON,
  NEEDS_INITIAL,
  P6,
  RARE_INITIAL,
  STAGES,
  STAGE_CHECKS,
  bankLabel,
  blankTrack,
  localIso,
  newId,
  type NeedsState,
  type RareState,
  type StageId,
  type Track,
} from "./model";
import { Postcards } from "./Postcards";
import { TaggedRecordingList } from "./Recordings";
import { useStudioStore } from "./store";
import { AccentButton, Panel, RemoveButton, inputCls } from "./ui";
import { StagePanel, type StageCtx } from "./rare/Stages";
import { TrackMeter } from "./rare/TrackMeter";

const STAGE_WHO: Record<StageId, GuideStep["who"]> = {
  prelude: "both",
  a: "you",
  b: "nurturer",
  script: "nurturer",
  roleplay: "both",
  capstone: "both",
};

/**
 * p6-rare — Rare-but-Urgent Discourses: the discourse-mastery pipeline.
 *
 * One track per target discourse, run through the guide's six stages in
 * order: Prelude → A (you lead, 10–20 h) → B (they lead) → Scripts of Life →
 * Role-play → the real thing + reminiscing. Every stage records; the app is
 * the workbench. A host person does the judging, the improving and the
 * modeling. Nuri's only speaking part is the customer in a labeled warm-up.
 */
export function RareTool({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const accent = phase.color;
  const timer = useStudioTimer(activity.id);
  const { state, update } = useStudioStore<RareState>(P6.rare, lang, RARE_INITIAL);
  const needs = useStudioStore<NeedsState>(P6.needs, lang, NEEDS_INITIAL).state;
  const [stage, setStage] = useState<StageId>("prelude");
  const [custom, setCustom] = useState("");

  const target = needs.situations.find((s) => s.id === needs.targetId) ?? null;
  const track = state.tracks.find((tr) => tr.id === state.activeId) ?? null;
  const targetHasTrack = Boolean(target && state.tracks.some((tr) => tr.id === target.id));

  const patchTrack = (id: string, fn: (track: Track) => Track) =>
    update((s) => ({ ...s, tracks: s.tracks.map((tr) => (tr.id === id ? fn(tr) : tr)) }));

  const openTrack = (id: string, name: string, seed?: string) => {
    update((s) =>
      s.tracks.some((tr) => tr.id === id)
        ? { ...s, activeId: id }
        : { tracks: [...s.tracks, blankTrack(id, name, seed)], activeId: id }
    );
    setStage("prelude");
  };

  // Time measured at this workbench is credited to the open track as solo
  // work (shown apart from the mediated hours), then logged as usual.
  const benchTimer = {
    ...timer,
    finish: (words: number | string[] = 0) => {
      const minutes = Math.max(1, Math.round(timer.seconds / 60));
      if (track) patchTrack(track.id, (tr) => ({ ...tr, bench: [...tr.bench, { date: localIso(), minutes }] }));
      timer.finish(words);
    },
  };

  const ctx: StageCtx | null = track
    ? {
        lang,
        phaseId: phase.id,
        activityId: activity.id,
        accent,
        trackTag: `track:${track.id}`,
        trackName: bankLabel(track, t),
      }
    : null;

  const steps: GuideStep[] = [
    { title: t("st6_d_step0T"), body: t("st6_d_step0B"), who: "you" },
    ...STAGES.map((s) => ({ title: t(`st6_d_stage_${s}`), body: t(`st6_d_step_${s}`), who: STAGE_WHO[s] })),
    { title: t("st6_d_step7T"), body: t("st6_d_step7B"), who: "you" },
  ];

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="🥂" mode="nurturer" />
      <StepGuide steps={steps} accent={accent} />
      <NeedsPersonCallout>{t("st6_d_personBody")}</NeedsPersonCallout>

      {/* ---- which discourse ---- */}
      <Panel title={t("st6_d_pickTitle")} sub={t("st6_d_pickSub")}>
        {target && !targetHasTrack && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/25 bg-raised-2 p-4">
            <span className="text-2xl" aria-hidden>
              {target.seed ? BANK_ICON[target.seed] : "🎯"}
            </span>
            <div className="min-w-0 flex-1 basis-40">
              <p className="text-xs font-semibold text-muted">{t("st6_d_fromNeeds")}</p>
              <p className="truncate text-sm font-semibold text-ink">{bankLabel(target, t)}</p>
            </div>
            <AccentButton accent={accent} onClick={() => openTrack(target.id, target.name, target.seed)}>
              {t("st6_d_startTrack")}
            </AccentButton>
          </div>
        )}
        {!target && (
          <Callout icon="🧭" title={t("st6_d_noTargetTitle")}>
            <p>{t("st6_d_noTargetBody")}</p>
            <Link
              href={`/studio/${P6.needs}`}
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-ink underline underline-offset-4"
            >
              {t("st6_d_toNeeds")} <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          </Callout>
        )}

        {state.tracks.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold text-muted">{t("st6_d_tracksLabel")}</p>
            <div role="group" aria-label={t("st6_d_tracksLabel")} className="flex flex-wrap gap-2">
              {state.tracks.map((tr) => {
                const on = tr.id === state.activeId;
                return (
                  <button
                    key={tr.id}
                    type="button"
                    onClick={() => update((s) => ({ ...s, activeId: tr.id }))}
                    aria-pressed={on}
                    className={`pill min-h-10 max-w-full border px-3.5 py-2 text-xs font-semibold ${
                      on ? "border-white/45 bg-white/15 text-ink" : "border-line bg-white/5 text-muted hover:text-ink"
                    }`}
                  >
                    <span aria-hidden>{on ? "●" : "○"}</span>
                    <span className="truncate">{bankLabel(tr, t)}</span>
                    {tr.id === needs.targetId && <span className="text-muted">· {t("st6_d_currentTarget")}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const clean = custom.trim().slice(0, 80);
            if (!clean) return;
            openTrack(newId("trk"), clean);
            setCustom("");
          }}
        >
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            maxLength={80}
            placeholder={t("st6_d_customPlaceholder")}
            aria-label={t("st6_d_customLabel")}
            className={`${inputCls} flex-1 basis-56`}
          />
          <button
            type="submit"
            disabled={!custom.trim()}
            className="pill min-h-10 border border-line bg-white/6 px-4 py-2.5 text-sm font-semibold text-ink disabled:opacity-40"
          >
            <Plus size={15} strokeWidth={3} /> {t("st6_d_customAdd")}
          </button>
        </form>
      </Panel>

      {track && ctx && (
        <>
          <TrackMeter track={track} accent={accent} onPatch={(fn) => patchTrack(track.id, fn)} />

          {/* ---- listen before you meet, and before the real thing ---- */}
          <Panel title={t("st6_d_queueTitle")} sub={t("st6_d_queueSub")}>
            <TaggedRecordingList
              filter={{ activityId: activity.id, lang, kind: ["improved", "primary", "imported"] }}
              tags={[ctx.trackTag]}
              pick={(items) => tonightsQueue(items, 3)}
              accent={accent}
              title={t("st6_d_queueList")}
              emptyText={t("st6_d_queueEmpty")}
            />
          </Panel>

          {/* ---- the six stages ---- */}
          <section className="card p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold text-ink">
              {t("st6_d_pipelineTitle")} · <span className="text-muted">{ctx.trackName}</span>
            </h2>
            <div
              role="group"
              aria-label={t("st6_d_pipelineTitle")}
              className="no-scrollbar -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1"
            >
              {STAGES.map((s, i) => {
                const on = s === stage;
                const done = Array.from({ length: STAGE_CHECKS[s] }, (_, k) => track.steps[`${s}.${k + 1}`]).filter(
                  Boolean
                ).length;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStage(s)}
                    aria-pressed={on}
                    className={`min-h-12 shrink-0 rounded-2xl border px-3.5 py-2 text-left ${
                      on ? "border-white/45 bg-white/12" : "border-line bg-white/4"
                    }`}
                  >
                    <span className={`block text-xs font-bold ${on ? "text-ink" : "text-muted"}`}>
                      {i + 1}. {t(`st6_d_stage_${s}`)}
                    </span>
                    <span className="block text-[11px] tabular-nums text-muted">
                      {done}/{STAGE_CHECKS[s]}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5">
              <StagePanel
                key={`${track.id}:${stage}`}
                stage={stage}
                ctx={ctx}
                track={track}
                onPatch={(fn) => patchTrack(track.id, fn)}
              />
            </div>
          </section>

          <Postcards
            cards={track.postcards}
            onChange={(next) => patchTrack(track.id, (tr) => ({ ...tr, postcards: next }))}
            accent={accent}
            sub={t("st6_d_postcardsSub")}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <p className="text-xs leading-relaxed text-muted">{t("st6_d_removeNote")}</p>
            <RemoveButton
              label={t("st6_d_removeTrack")}
              onConfirm={() =>
                update((s) => {
                  const tracks = s.tracks.filter((tr) => tr.id !== track.id);
                  return { tracks, activeId: tracks[0]?.id ?? null };
                })
              }
            />
          </div>
        </>
      )}

      <RecordingList
        filter={{ activityId: activity.id, lang }}
        accent={accent}
        title={t("st6_d_allRecordings")}
        emptyText={t("st6_d_noRecordings")}
      />

      <FinishBar timer={benchTimer} accent={accent} />
    </div>
  );
}
