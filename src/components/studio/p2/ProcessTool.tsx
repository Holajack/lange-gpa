"use client";

import { useEffect, useRef, useState } from "react";
import { Play, RotateCcw, Square, Volume2 } from "lucide-react";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import { usePictures, type LibraryItem } from "@/lib/library";
import { shuffle } from "@/app/(app)/practice/shared";
import type { StudioToolProps } from "../types";
import {
  Callout,
  FinishBar,
  NeedsPersonCallout,
  PictureShelf,
  RecordingList,
  RehearsalCallout,
  StepGuide,
  StudioHeader,
  textOn,
  useStudioTimer,
  type GuideStep,
} from "../StudioShell";
import { RecordPanel } from "../RecordPanel";
import { hostLines, PROCESS_SERIES, type Panel, type ProcessSeries } from "./content";
import { PanelThumb } from "./Panel";
import { BlobImg, Section, Segmented, useSpeaker, useStored } from "./kit";
import { SourceSwitch, type PictureSource } from "./StoryParts";

type Stage = "hear" | "find" | "order" | "tell";
const STAGES: Stage[] = ["hear", "find", "order", "tell"];

interface ProcessState {
  src: PictureSource;
  seriesId: string;
  /** how many of the four stages have been finished, per series */
  reached: Record<string, number>;
}

const INITIAL: ProcessState = { src: "builtin", seriesId: PROCESS_SERIES[0].id, reached: {} };

/**
 * p2-process — Process Picture Series. A routine told step by step across a
 * strip: hear the steps, hear one and tap its picture, put the shuffled
 * pictures back in order by ear, then narrate the whole thing yourself.
 */
export function ProcessTool({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const timer = useStudioTimer(activity.id);
  const [state, update] = useStored<ProcessState>(activity.id, lang, INITIAL);
  const [stage, setStage] = useState<Stage>("hear");
  const accent = phase.color;

  const series = PROCESS_SERIES.find((s) => s.id === state.seriesId) ?? PROCESS_SERIES[0];
  const seriesNo = PROCESS_SERIES.indexOf(series) + 1;
  const seriesName = `${series.icon} ${t("st2_seriesN").replace("{n}", String(seriesNo))}`;
  const lines = hostLines(
    series.steps.map((s) => s.lines[0]),
    lang
  );
  const reached = state.reached[series.id] ?? 0;
  const reach = (n: number) =>
    update((s) => ((s.reached[series.id] ?? 0) >= n ? s : { ...s, reached: { ...s.reached, [series.id]: n } }));

  const steps: GuideStep[] = [
    { title: t("st2_prS1"), body: t("st2_prS1b"), who: "both" },
    { title: t("st2_prS2"), body: t("st2_prS2b"), who: "nurturer" },
    { title: t("st2_prS3"), body: t("st2_prS3b"), who: "both" },
    { title: t("st2_prS4"), body: t("st2_prS4b"), who: "you" },
    { title: t("st2_prS5"), body: t("st2_prS5b"), who: "you" },
  ];

  const stageLabel: Record<Stage, string> = {
    hear: t("st2_prStageHear"),
    find: t("st2_prStageFind"),
    order: t("st2_prStageOrder"),
    tell: t("st2_prStageTell"),
  };

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="🫖" mode="either" />
      <StepGuide steps={steps} accent={accent} />

      <Section title={t("st2_prPickTitle")} sub={t("st2_prPickSub")}>
        <SourceSwitch
          value={state.src}
          onChange={(src) => update((s) => ({ ...s, src }))}
          builtinLabel={t("st2_srcSeries")}
        />
        {state.src === "builtin" && (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {PROCESS_SERIES.map((s, i) => {
              const label = `${s.icon} ${t("st2_seriesN").replace("{n}", String(i + 1))}`;
              return (
                <div key={s.id} className="min-w-0">
                  <PanelThumb
                    panel={s.steps[s.steps.length - 1]}
                    ratio="1 / 1"
                    label={label}
                    selected={series.id === s.id}
                    onClick={() => {
                      update((prev) => ({ ...prev, seriesId: s.id }));
                      setStage("hear");
                    }}
                    className="w-full"
                  />
                  <p className="mt-1.5 truncate text-xs font-semibold text-ink">{label}</p>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {state.src === "own" ? (
        <OwnSeries lang={lang} accent={accent} activityId={activity.id} />
      ) : lines ? (
        <>
          <RehearsalCallout>{t("st2_prHonest")}</RehearsalCallout>
          <Segmented
            value={stage}
            onChange={setStage}
            label={t("st2_prStageLabel")}
            options={STAGES.map((id, i) => ({
              id,
              label: `${i + 1}. ${stageLabel[id]}`,
              icon: reached > i ? "✓" : undefined,
            }))}
          />
          {stage === "hear" && (
            <HearStage
              key={series.id}
              series={series}
              lines={lines}
              lang={lang}
              accent={accent}
              onDone={() => reach(1)}
            />
          )}
          {(stage === "find" || stage === "order") && (
            <TileQuiz
              key={`${series.id}-${stage}`}
              variant={stage}
              steps={series.steps}
              lines={lines}
              lang={lang}
              accent={accent}
              onDone={() => reach(stage === "find" ? 2 : 3)}
            />
          )}
          {stage === "tell" && (
            <Section title={t("st2_prTellTitle")} sub={t("st2_prTellSub")}>
              <Strip steps={series.steps} />
              <RecordPanel
                lang={lang}
                phase={2}
                activityId={activity.id}
                kind="description"
                speaker="me"
                accent={accent}
                defaultTitle={`${seriesName} · ${t("st2_myTurn")}`}
                tags={[`series:${series.id}`]}
                label={t("st2_prTellRecord")}
                onSaved={() => reach(4)}
              />
            </Section>
          )}
          <Section title={t("st2_prWithTitle")} sub={t("st2_prWithSub")}>
            <NurturerTakes lang={lang} accent={accent} activityId={activity.id} name={seriesName} />
          </Section>
        </>
      ) : (
        <Section title={seriesName} sub={t("st2_prNoVoiceSub")}>
          <Strip steps={series.steps} />
          <NeedsPersonCallout>{t("st2_noVoice")}</NeedsPersonCallout>
          <NurturerTakes lang={lang} accent={accent} activityId={activity.id} name={seriesName} />
        </Section>
      )}

      <RecordingList filter={{ activityId: activity.id, lang }} accent={accent} />
      <FinishBar timer={timer} accent={accent} />
    </div>
  );
}

function Strip({ steps, active = -1, onTap }: { steps: Panel[]; active?: number; onTap?: (i: number) => void }) {
  const { t } = useApp();
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {steps.map((panel, i) => (
        <PanelThumb
          key={panel.id}
          panel={panel}
          ratio="1 / 1"
          label={t("st2_stepN").replace("{n}", String(i + 1))}
          badge={i + 1}
          selected={active === i}
          onClick={onTap ? () => onTap(i) : undefined}
          disabled={!onTap}
        />
      ))}
    </div>
  );
}

/* ------------------------------ 1 · hear it ------------------------------ */

function HearStage({
  series,
  lines,
  lang,
  accent,
  onDone,
}: {
  series: ProcessSeries;
  lines: string[];
  lang: LangCode;
  accent: string;
  onDone: () => void;
}) {
  const { t } = useApp();
  const speaker = useSpeaker(lang);
  const [active, setActive] = useState(-1);

  const playAll = async () => {
    const finished = await speaker.say(lines, setActive);
    if (finished) {
      setActive(-1);
      onDone();
    }
  };

  return (
    <Section title={t("st2_prHearTitle")} sub={t("st2_prHearSub")}>
      <Strip
        steps={series.steps}
        active={active}
        onTap={(i) => {
          setActive(i);
          void speaker.say([lines[i]]);
        }}
      />
      <button
        type="button"
        onClick={speaker.speaking ? speaker.stop : playAll}
        className={`pill min-h-11 px-5 py-2.5 text-sm font-bold ${textOn(accent)}`}
        style={{ background: accent }}
      >
        {speaker.speaking ? <Square size={14} strokeWidth={3} /> : <Volume2 size={16} strokeWidth={2.5} />}
        {speaker.speaking ? t("st2_stop") : t("st2_prHearPlay")}
      </button>
    </Section>
  );
}

/* --------------------- 2 · find it  /  3 · put in order ------------------- */

function TileQuiz({
  variant,
  steps,
  lines,
  lang,
  accent,
  onDone,
}: {
  variant: "find" | "order";
  steps: Panel[];
  lines: string[];
  lang: LangCode;
  accent: string;
  onDone: () => void;
}) {
  const { t } = useApp();
  const { say, stop } = useSpeaker(lang);
  const inOrder = steps.map((_, i) => i);
  /** tiles as laid out on screen */
  const [tray, setTray] = useState<number[]>(inOrder);
  /** the step asked for at each turn */
  const [targets, setTargets] = useState<number[]>([]);
  const [turn, setTurn] = useState(-1);
  const [found, setFound] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach((id) => window.clearTimeout(id));
    },
    []
  );

  const started = turn >= 0;
  const done = started && turn >= targets.length;
  const target = started && !done ? targets[turn] : null;

  const start = () => {
    let mixed = shuffle(inOrder);
    // a shuffle that lands in order is no puzzle
    if (variant === "order" && mixed.every((v, i) => v === i)) mixed = [...mixed].reverse();
    const nextTargets = variant === "find" ? shuffle(inOrder) : inOrder;
    setTray(variant === "order" ? mixed : inOrder);
    setTargets(nextTargets);
    setFound([]);
    setWrong(null);
    setTurn(0);
    void say([lines[nextTargets[0]]]);
  };

  const tap = (i: number) => {
    if (target === null || found.includes(i)) return;
    if (i !== target) {
      setWrong(i);
      void say([lines[target]]);
      timers.current.push(window.setTimeout(() => setWrong(null), 800));
      return;
    }
    setFound((f) => [...f, i]);
    setWrong(null);
    const next = turn + 1;
    setTurn(next);
    if (next < targets.length) {
      timers.current.push(window.setTimeout(() => void say([lines[targets[next]]]), 500));
    } else {
      stop();
      onDone();
    }
  };

  const tile = (i: number, placed: boolean) => (
    <PanelThumb
      key={steps[i].id}
      panel={steps[i]}
      ratio="1 / 1"
      label={t("st2_tileN").replace("{n}", String(tray.indexOf(i) + 1))}
      badge={placed ? (variant === "order" ? i + 1 : "✓") : undefined}
      selected={placed}
      disabled={!started || done || placed}
      onClick={() => tap(i)}
      className={wrong === i ? "!border-coral" : ""}
    />
  );

  return (
    <Section
      title={variant === "find" ? t("st2_prFindTitle") : t("st2_prOrderTitle")}
      sub={variant === "find" ? t("st2_prFindSub") : t("st2_prOrderSub")}
    >
      {variant === "order" && started && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted">{t("st2_prOrderPlaced")}</p>
          <div className="grid min-h-16 grid-cols-3 gap-2 rounded-2xl border border-dashed border-white/15 p-2 sm:grid-cols-6">
            {found.map((i) => tile(i, true))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {tray.filter((i) => variant === "find" || !found.includes(i)).map((i) => tile(i, found.includes(i)))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {!started && (
          <button
            type="button"
            onClick={start}
            className={`pill min-h-11 px-5 py-2.5 text-sm font-bold ${textOn(accent)}`}
            style={{ background: accent }}
          >
            <Play size={15} strokeWidth={3} /> {variant === "find" ? t("st2_lpStart") : t("st2_prOrderStart")}
          </button>
        )}
        {target !== null && (
          <button
            type="button"
            onClick={() => void say([lines[target]])}
            className={`pill min-h-11 px-5 py-2.5 text-sm font-bold ${textOn(accent)}`}
            style={{ background: accent }}
          >
            <Volume2 size={16} strokeWidth={2.5} /> {t("st2_hearAgain")}
          </button>
        )}
        {done && (
          <button
            type="button"
            onClick={start}
            className="pill min-h-11 border border-line bg-white/6 px-5 py-2.5 text-sm font-semibold text-ink"
          >
            <RotateCcw size={15} strokeWidth={2.5} /> {t("st2_lpAgain")}
          </button>
        )}
        {started && (
          <span className="text-sm font-semibold tabular-nums text-ink" aria-live="polite">
            {t("st2_lpFound").replace("{n}", String(found.length)).replace("{total}", String(targets.length))}
          </span>
        )}
      </div>
      <p className="text-xs leading-relaxed text-muted" role="status">
        {done ? t("st2_prQuizDone") : wrong !== null ? t("st2_lpTryAgain") : ""}
      </p>
    </Section>
  );
}

/* ------------------------------ your own strip ---------------------------- */

function NurturerTakes({
  lang,
  accent,
  activityId,
  name,
}: {
  lang: LangCode;
  accent: string;
  activityId: string;
  name: string;
}) {
  const { t } = useApp();
  const [hers, setHers] = useState<LibraryItem | null>(null);
  return (
    <>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-ink">{t("st2_prHerTitle")}</p>
        <RecordPanel
          lang={lang}
          phase={2}
          activityId={activityId}
          kind="primary"
          speaker="nurturer"
          accent={accent}
          defaultTitle={`${name} · ${t("st2_herTelling")}`}
          label={t("st2_prHerRecord")}
          showConsent
          onSaved={setHers}
        />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-ink">{t("st2_prMineTitle")}</p>
        <RecordPanel
          lang={lang}
          phase={2}
          activityId={activityId}
          kind="retell"
          speaker="me"
          accent={accent}
          parentId={hers?.id}
          defaultTitle={`${name} · ${t("st2_myTurn")}`}
          label={t("st2_prTellRecord")}
        />
      </div>
    </>
  );
}

function OwnSeries({ lang, accent, activityId }: { lang: LangCode; accent: string; activityId: string }) {
  const { t } = useApp();
  const { pictures } = usePictures(activityId);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Section title={t("st2_prOwnTitle")} sub={t("st2_prOwnSub")}>
      <PictureShelf activityId={activityId} selectedId={selected} onSelect={(pic) => setSelected(pic?.id ?? null)} />
      {pictures.length > 0 ? (
        <>
          <ol className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {pictures.map((pic, i) => (
              <li key={pic.id} className="relative">
                <BlobImg
                  id={pic.id}
                  alt={t("st2_stepN").replace("{n}", String(i + 1))}
                  className={`aspect-square w-full rounded-xl border-2 object-cover ${
                    selected === pic.id ? "border-white" : "border-transparent"
                  }`}
                />
                <span className="absolute left-1.5 top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-canvas/85 px-1.5 text-[11px] font-bold text-ink">
                  {i + 1}
                </span>
              </li>
            ))}
          </ol>
          <NeedsPersonCallout>{t("st2_prOwnNeeds")}</NeedsPersonCallout>
          <NurturerTakes lang={lang} accent={accent} activityId={activityId} name={t("st2_prOwnName")} />
        </>
      ) : (
        <Callout icon="🧩" title={t("st2_prOwnHintTitle")}>
          <p>{t("st2_prOwnHint")}</p>
        </Callout>
      )}
    </Section>
  );
}
