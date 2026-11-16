"use client";

import { useMemo } from "react";
import { Plus, RotateCcw } from "lucide-react";
import { useApp } from "@/lib/store";
import { usePictures } from "@/lib/library";
import { RecordPanel } from "../RecordPanel";
import {
  Callout,
  FinishBar,
  NeedsPersonCallout,
  PictureShelf,
  PictureView,
  RecordingList,
  RehearsalCallout,
  StepGuide,
  StudioHeader,
  textOn,
  useStudioTimer,
  type GuideStep,
} from "../StudioShell";
import type { StudioToolProps } from "../types";
import { FLOOD_ASKS, hasP3Content } from "./content";
import { FloodRehearsal, type FloodRun } from "./FloodRehearsal";
import { useHeard, useStudioState } from "./hooks";
import { MassageStatus, MovesBar, NoSoloNote, Panel, PhraseBank, Segmented, toPhrases, usePlayerMoves } from "./shared";

/**
 * p3-flood — Input Flooding. One sentence shape the grower keeps reaching for
 * and missing, heard dozens of times in natural examples. With a nurturer:
 * name the target, flood over a busy picture, tally, record, re-listen.
 * Solo: authored floods narrated by Nuri, with a catch-it-by-ear check.
 */

type Mode = "person" | "solo";

interface FloodState {
  mode: Mode;
  /** today's target, typed in the host language */
  target: string;
  /** target → examples caught so far */
  tallies: Record<string, number>;
  picId: string | null;
  runs: Record<string, FloodRun>;
}
const EMPTY: FloodState = { mode: "person", target: "", tallies: {}, picId: null, runs: {} };

export function InputFlood({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const timer = useStudioTimer(activity.id);
  const accent = phase.color;
  const [state, setState] = useStudioState<FloodState>(activity.id, lang, EMPTY);
  const { heard, markHeard } = useHeard(lang);
  const playerMoves = usePlayerMoves(lang, heard);
  const { pictures } = usePictures(activity.id);
  const asks = useMemo(() => toPhrases(FLOOD_ASKS, lang, t), [lang, t]);
  const solo = hasP3Content(lang);
  const mode: Mode = solo ? state.mode : "person";

  const target = state.target.trim();
  const key = target.toLocaleLowerCase();
  const tally = key ? state.tallies[key] ?? 0 : 0;
  const pic = pictures.find((p) => p.id === state.picId) ?? null;
  const setTally = (n: number) => key && setState((s) => ({ ...s, tallies: { ...s.tallies, [key]: Math.max(0, n) } }));

  const steps: GuideStep[] = [
    { title: t("st3_flS1"), body: t("st3_flS1b"), who: "you" },
    { title: t("st3_flS2"), body: t("st3_flS2b"), who: "you" },
    { title: t("st3_flS3"), body: t("st3_flS3b"), who: "nurturer" },
    { title: t("st3_flS4"), body: t("st3_flS4b"), who: "nurturer" },
    { title: t("st3_flS5"), body: t("st3_flS5b"), who: "you" },
    { title: t("st3_flS6"), body: t("st3_flS6b"), who: "you" },
  ];

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="🌊" mode={solo ? "either" : "nurturer"} />
      <StepGuide steps={steps} accent={accent} />
      <Callout icon="☝️" title={t("st3_flRuleTitle")} tone="warm">
        <p>{t("st3_flRuleBody")}</p>
      </Callout>

      {solo ? (
        <Segmented
          label={t("st3_modeLabel")}
          value={mode}
          onChange={(m) => setState((s) => ({ ...s, mode: m }))}
          options={[
            { id: "person", label: `🤝 ${t("st3_modePerson")}` },
            { id: "solo", label: `🌱 ${t("st3_modeSolo")}` },
          ]}
        />
      ) : (
        <NoSoloNote />
      )}

      {mode === "solo" ? (
        <Panel title={t("st3_flSoloTitle")} sub={t("st3_flSoloSub")} accent={accent}>
          <RehearsalCallout>{t("st3_flSoloNote")}</RehearsalCallout>
          <FloodRehearsal
            lang={lang}
            accent={accent}
            runs={state.runs}
            onRun={(id, r) =>
              setState((s) => ({ ...s, runs: { ...s.runs, [id]: { ...r, times: (s.runs[id]?.times ?? 0) + 1 } } }))
            }
          />
        </Panel>
      ) : (
        <>
          <NeedsPersonCallout>{t("st3_flNeeds")}</NeedsPersonCallout>

          <Panel step={1} title={t("st3_flP1")} sub={t("st3_flP1b")} accent={accent}>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted">{t("st3_flTargetLabel")}</span>
              <input
                value={state.target}
                onChange={(e) => setState((s) => ({ ...s, target: e.target.value.slice(0, 80) }))}
                placeholder={t("st3_flTargetPlaceholder")}
                lang={lang}
                className="w-full rounded-2xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-white/30"
              />
            </label>
            <PhraseBank title={t("st3_flAskTitle")} phrases={asks} lang={lang} heard={heard} onHeard={markHeard} />
            <PictureShelf
              activityId={activity.id}
              selectedId={state.picId}
              onSelect={(p) => setState((s) => ({ ...s, picId: p?.id ?? null }))}
            />
            <p className="text-xs leading-relaxed text-muted">{t("st3_flPicHint")}</p>
            {pic && <PictureView pic={pic} className="bg-raised-2" />}
          </Panel>

          <Panel step={2} title={t("st3_flP2")} sub={t("st3_flP2b")} accent={accent}>
            {target ? (
              <>
                <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-line bg-raised-2 p-4 sm:p-5">
                  <button
                    type="button"
                    onClick={() => setTally(tally + 1)}
                    className={`pill min-h-14 px-6 py-3 text-base font-bold ${textOn(accent)}`}
                    style={{ background: accent }}
                  >
                    <Plus size={18} strokeWidth={3} aria-hidden /> {t("st3_flCaughtOne")}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-3xl font-extrabold tabular-nums text-ink" aria-live="polite">
                      {tally}
                    </p>
                    <p className="break-words text-xs text-muted">
                      {t("st3_flTallyFor")} <span lang={lang}>{target}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTally(0)}
                    disabled={tally === 0}
                    aria-label={t("st3_flTallyReset")}
                    className="pill h-11 w-11 justify-center border border-line bg-white/6 p-0 text-ink disabled:opacity-40"
                  >
                    <RotateCcw size={15} strokeWidth={2.5} />
                  </button>
                </div>
                <RecordPanel
                  lang={lang}
                  phase={phase.id}
                  activityId={activity.id}
                  kind="primary"
                  speaker="nurturer"
                  defaultTitle={`${t("st3_flRecName")}: ${target}`.slice(0, 80)}
                  accent={accent}
                  tags={["flood"]}
                  showConsent
                  label={t("st3_flRecord")}
                />
              </>
            ) : (
              <Callout icon="👆" title={t("st3_flNeedTarget")} />
            )}
          </Panel>

          <Panel step={3} title={t("st3_flP3")} sub={t("st3_flP3b")} accent={accent}>
            <MovesBar lang={lang} heard={heard} onHeard={markHeard} />
            <RecordingList
              filter={{ activityId: activity.id, lang }}
              accent={accent}
              moves={playerMoves}
              emptyText={t("st3_flNoRecordings")}
              renderExtra={(it) => <MassageStatus item={it} lang={lang} accent={accent} />}
            />
          </Panel>
        </>
      )}

      <FinishBar timer={timer} accent={accent} />
    </div>
  );
}
