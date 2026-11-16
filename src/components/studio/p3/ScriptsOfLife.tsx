"use client";

import { useMemo } from "react";
import { Minus, Plus } from "lucide-react";
import { useApp } from "@/lib/store";
import type { LibraryItem } from "@/lib/library";
import { RecordPanel } from "../RecordPanel";
import {
  Callout,
  FinishBar,
  NeedsPersonCallout,
  RecordingList,
  StepGuide,
  StudioHeader,
  textOn,
  useStudioTimer,
  type GuideStep,
} from "../StudioShell";
import type { StudioToolProps } from "../types";
import { SCRIPT_PROBES } from "./content";
import { useHeard, useStudioState } from "./hooks";
import { IdeaBoard } from "./boards";
import { Disclosure, MassageStatus, MovesBar, Panel, PhraseBank, toPhrases, usePlayerMoves } from "./shared";

/**
 * p3-script — Scripts of Life. A host person lists, step by small step, how an
 * everyday routine goes in THEIR world. The grower probes for the gaps,
 * records the full list, massages it, acts it out on playback, and then tells
 * the same routine from their own world to compare. Nuri authors nothing here.
 */

interface ScriptState {
  topic: string;
  bothDone: boolean;
  /** steps counted so far for the script being built */
  liveSteps: number;
  /** recording id → steps listed when it was recorded */
  steps: Record<string, number>;
  /** recording id → times acted out on playback */
  acted: Record<string, number>;
  /** recording id → what's the same / different back home */
  notes: Record<string, string>;
}

const EMPTY: ScriptState = { topic: "", bothDone: false, liveSteps: 0, steps: {}, acted: {}, notes: {} };
const TOPIC_KEYS = [
  "st3_scTopic1",
  "st3_scTopic2",
  "st3_scTopic3",
  "st3_scTopic4",
  "st3_scTopic5",
  "st3_scTopic6",
  "st3_scTopic7",
  "st3_scTopic8",
  "st3_scTopic9",
  "st3_scTopic10",
];
const SOURCE_KINDS = ["primary", "imported"] as const;
const FULL_SCRIPT = 25;

export function ScriptsOfLife({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const timer = useStudioTimer(activity.id);
  const accent = phase.color;
  const [state, setState] = useStudioState<ScriptState>(activity.id, lang, EMPTY);
  const { heard, markHeard } = useHeard(lang);
  const playerMoves = usePlayerMoves(lang, heard);
  const probes = useMemo(() => toPhrases(SCRIPT_PROBES, lang, t), [lang, t]);
  const topic = state.topic.trim();

  const steps: GuideStep[] = [
    { title: t("st3_scS1"), body: t("st3_scS1b"), who: "both" },
    { title: t("st3_scS2"), body: t("st3_scS2b"), who: "nurturer" },
    { title: t("st3_scS3"), body: t("st3_scS3b"), who: "you" },
    { title: t("st3_scS4"), body: t("st3_scS4b"), who: "nurturer" },
    { title: t("st3_scS5"), body: t("st3_scS5b"), who: "both" },
    { title: t("st3_scS6"), body: t("st3_scS6b"), who: "you" },
    { title: t("st3_scS7"), body: t("st3_scS7b"), who: "you" },
  ];

  const extras = (it: LibraryItem) => {
    const listed = state.steps[it.id];
    const acted = state.acted[it.id] ?? 0;
    return (
      <>
        <MassageStatus item={it} lang={lang} accent={accent} />
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-line bg-raised p-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">🤸 {t("st3_scActTitle")}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {t("st3_scActHint")}
              {listed ? ` ${t("st3_scListed").replace("{n}", String(listed))}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setState((s) => ({ ...s, acted: { ...s.acted, [it.id]: (s.acted[it.id] ?? 0) + 1 } }))}
            className="pill min-h-11 bg-white/10 px-4 py-2.5 text-sm font-bold text-ink"
          >
            <Plus size={14} strokeWidth={3} aria-hidden />
            {t("st3_scActed").replace("{n}", String(acted))}
          </button>
        </div>
        <Disclosure title={`🏡 ${t("st3_scMineTitle")}`}>
          <p className="text-sm leading-relaxed text-muted">{t("st3_scMineHint")}</p>
          <RecordPanel
            lang={lang}
            phase={phase.id}
            activityId={activity.id}
            kind="retell"
            speaker="me"
            parentId={it.id}
            defaultTitle={`${it.title} · ${t("st3_scMineName")}`}
            accent={accent}
            label={t("st3_scMineRecord")}
          />
          <RecordingList
            filter={{ parentId: it.id, kind: "retell" }}
            accent={accent}
            title={t("st3_scMineList")}
            emptyText={t("st3_scMineEmpty")}
            allowWords={false}
          />
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">{t("st3_scCompare")}</span>
            <textarea
              value={state.notes[it.id] ?? ""}
              onChange={(e) =>
                setState((s) => ({ ...s, notes: { ...s.notes, [it.id]: e.target.value.slice(0, 600) } }))
              }
              rows={3}
              placeholder={t("st3_scComparePlaceholder")}
              className="w-full rounded-2xl border border-line bg-canvas px-4 py-2.5 text-sm leading-relaxed text-ink outline-none focus:border-white/30"
            />
          </label>
        </Disclosure>
      </>
    );
  };

  const count = state.liveSteps;
  const full = count >= FULL_SCRIPT;

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="🧾" mode="nurturer" />
      <StepGuide steps={steps} accent={accent} />
      <NeedsPersonCallout>{t("st3_scNeeds")}</NeedsPersonCallout>

      <Panel step={1} title={t("st3_scP1")} sub={t("st3_scP1b")} accent={accent}>
        <IdeaBoard
          lang={lang}
          focus="scripts"
          accent={accent}
          suggestions={TOPIC_KEYS.map((k) => t(k))}
          onPick={(text) => setState((s) => ({ ...s, topic: text }))}
          pickLabel={t("st3_scPickToday")}
        />
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">{t("st3_scTopicLabel")}</span>
          <input
            value={state.topic}
            onChange={(e) => setState((s) => ({ ...s, topic: e.target.value.slice(0, 80) }))}
            placeholder={t("st3_scTopicPlaceholder")}
            className="w-full rounded-2xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-white/30"
          />
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            checked={state.bothDone}
            onChange={(e) => setState((s) => ({ ...s, bothDone: e.target.checked }))}
            className="h-4 w-4 shrink-0 accent-[var(--color-mint)]"
          />
          {t("st3_scBothDone")}
        </label>
        {topic && !state.bothDone && <p className="text-xs leading-relaxed text-muted">{t("st3_scNotYet")}</p>}
      </Panel>

      <Panel step={2} title={t("st3_scP2")} sub={t("st3_scP2b")} accent={accent}>
        <PhraseBank title={t("st3_scProbeTitle")} phrases={probes} lang={lang} heard={heard} onHeard={markHeard} />
        <div className="rounded-3xl border border-line bg-raised-2 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setState((s) => ({ ...s, liveSteps: Math.max(0, s.liveSteps - 1) }))}
              disabled={count === 0}
              aria-label={t("st3_scStepLess")}
              className="pill h-11 w-11 justify-center border border-line bg-white/6 p-0 text-ink disabled:opacity-40"
            >
              <Minus size={15} strokeWidth={3} />
            </button>
            <button
              type="button"
              onClick={() => setState((s) => ({ ...s, liveSteps: s.liveSteps + 1 }))}
              className={`pill min-h-12 px-5 py-3 text-sm font-bold ${textOn(accent)}`}
              style={{ background: accent }}
            >
              <Plus size={15} strokeWidth={3} aria-hidden /> {t("st3_scStepMore")}
            </button>
            <p className="font-display text-2xl font-extrabold tabular-nums text-ink" aria-live="polite">
              {t("st3_scStepCount").replace("{n}", String(count))}
            </p>
          </div>
          <div
            className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/8"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={30}
            aria-valuenow={Math.min(count, 30)}
            aria-label={t("st3_scStepMore")}
          >
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, (count / 30) * 100)}%`, background: accent }} />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">{t(full ? "st3_scTallyFull" : "st3_scTallyLow")}</p>
        </div>
      </Panel>

      <Panel step={3} title={t("st3_scP3")} sub={t("st3_scP3b")} accent={accent}>
        {topic ? (
          <RecordPanel
            lang={lang}
            phase={phase.id}
            activityId={activity.id}
            kind="primary"
            speaker="nurturer"
            defaultTitle={topic}
            accent={accent}
            tags={["script"]}
            allowImport
            showConsent
            label={t("st3_scRecord")}
            onSaved={(item) =>
              setState((s) => ({
                ...s,
                steps: s.liveSteps > 0 ? { ...s.steps, [item.id]: s.liveSteps } : s.steps,
                liveSteps: 0,
              }))
            }
          />
        ) : (
          <Callout icon="👆" title={t("st3_scNeedTopic")} />
        )}
      </Panel>

      <Panel step={4} title={t("st3_scP4")} sub={t("st3_scP4b")} accent={accent}>
        <MovesBar lang={lang} heard={heard} onHeard={markHeard} />
        <RecordingList
          filter={{ activityId: activity.id, lang, kind: [...SOURCE_KINDS] }}
          accent={accent}
          moves={playerMoves}
          title={t("st3_scScripts")}
          emptyText={t("st3_scNoRecordings")}
          renderExtra={extras}
        />
      </Panel>

      <FinishBar timer={timer} accent={accent} />
    </div>
  );
}
