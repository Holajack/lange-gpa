"use client";

import { useMemo, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { IcebergToast, shuffle } from "@/app/(app)/practice/shared";
import { RecordPanel } from "../RecordPanel";
import { Callout, RecordingList, RehearsalCallout, StepGuide, StudioHeader, useStudioTimer, type GuideStep } from "../StudioShell";
import type { StudioToolProps } from "../types";
import { BUBBLES, STRIPS, bubbleLine, isAuthored, type Strip, type StripPanel } from "./content";
import {
  ActionButton,
  HearButton,
  Panel,
  Segmented,
  WordsFinishBar,
  pickOne,
  useCredited,
  useLater,
  usePersisted,
  useSpeaker,
  wait,
} from "./shared";

/**
 * Cartoon Bubbles (Phase 1A, listening). Wordless situation strips with empty
 * speech bubbles: Nuri voices what is said in a bubble, and the grower points
 * at the bubble where someone would say it. Paced like every Phase 1 listening
 * game — start with two, add one at a time, ask the newest most often.
 *
 * The strips are original emoji drawings. Nothing is written in a bubble and
 * nothing is translated: the situation carries the meaning.
 */

type BubbleState = "off" | "idle" | "tell" | "right" | "wrong" | "dim" | "pointed";
type Step = "idle" | "tell" | "ask" | "done";

export function Bubbles({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const accent = phase.color;
  const timer = useStudioTimer(activity.id);
  const { say, busy } = useSpeaker(lang);
  const later = useLater();
  const { ids: credited, credit } = useCredited();
  /** bubble ids already met — kept per account and per language */
  const [knownIds, setKnown, loaded] = usePersisted<string[]>(activity.id, lang, []);
  const run = useRef(0);

  /** bubbles Nuri can voice in this language (all of them for ru/en/es; the deck-backed ones elsewhere) */
  const playable = useMemo(() => BUBBLES.filter((b) => bubbleLine(b, lang)), [lang]);
  const canNarrate = playable.length >= 2;
  const lineOf = (id: string) => {
    const b = BUBBLES.find((x) => x.id === id);
    return b ? bubbleLine(b, lang) : undefined;
  };

  const [mode, setMode] = useState<"nuri" | "person">(canNarrate ? "nuri" : "person");
  const [plan, setPlan] = useState<string[]>([]);
  const [onTable, setOnTable] = useState(0);
  const [step, setStep] = useState<Step>("idle");
  const [queue, setQueue] = useState<string[]>([]);
  const [telling, setTelling] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ id: string; kind: "right" | "wrong" } | null>(null);
  const [misses, setMisses] = useState(0);
  const [keep, setKeep] = useState<string | null>(null);
  const [pointed, setPointed] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  const freshCount = playable.filter((b) => !knownIds.includes(b.id)).length;

  const startRound = (p: string[], n: number) => {
    const table = p.slice(0, n);
    const newest = table[n - 1];
    let q: string[];
    if (n % 3 === 0 || n === p.length) q = shuffle(table); // every third card, and at the end: sweep them all
    else {
      q = shuffle([newest, ...shuffle(table.filter((x) => x !== newest)).slice(0, 2)]);
      if (q[q.length - 1] !== newest) q.push(newest); // the newest one is asked most
    }
    setQueue(q);
    setMisses(0);
    setKeep(null);
    setStep("ask");
    void say(lineOf(q[0]) ?? "");
  };

  /** Nuri voices each new bubble once, then goes straight back to asking. */
  const tellThenAsk = async (p: string[], n: number, tellIds: string[]) => {
    const mine = ++run.current;
    setOnTable(n);
    setStep("tell");
    for (const id of tellIds) {
      setTelling(id);
      const finished = await say(lineOf(id) ?? "");
      if (!finished || run.current !== mine) return;
      await wait(700);
      if (run.current !== mine) return;
    }
    setTelling(null);
    startRound(p, n);
  };

  const start = () => {
    const fresh = playable.filter((b) => !knownIds.includes(b.id)).slice(0, knownIds.length === 0 ? 5 : 3).map((b) => b.id);
    const review = shuffle(playable.filter((b) => knownIds.includes(b.id)).map((b) => b.id)).slice(0, fresh.length === 0 ? 6 : 3);
    const p = [...review, ...fresh];
    if (p.length < 2) return;
    setPlan(p);
    setFlash(null);
    void tellThenAsk(p, 2, p.slice(0, 2));
  };

  const tap = (id: string) => {
    if (mode === "person") {
      setPointed(pointed === id ? null : id);
      return;
    }
    if (step === "done") {
      // re-living: tap any bubble to hear it again
      setTelling(id);
      void say(lineOf(id) ?? "").then(() => setTelling((cur) => (cur === id ? null : cur)));
      return;
    }
    if (step !== "ask" || flash?.kind === "right") return;
    const want = queue[0];
    if (id === want) {
      setFlash({ id, kind: "right" });
      credit([BUBBLES.find((b) => b.id === id)?.vocabId]);
      later(() => {
        setFlash(null);
        const rest = queue.slice(1);
        if (rest.length > 0) {
          setQueue(rest);
          setMisses(0);
          setKeep(null);
          void say(lineOf(rest[0]) ?? "");
        } else if (onTable < plan.length) {
          void tellThenAsk(plan, onTable + 1, [plan[onTable]]);
        } else {
          setStep("done");
          setKnown((prev) => [...new Set([...prev, ...plan])]);
        }
      }, 950);
      return;
    }
    // natural correction: no explanation, just hear it again
    const n = misses + 1;
    setMisses(n);
    setFlash({ id, kind: "wrong" });
    setToast(true);
    later(() => setToast(false), 1700);
    if (n >= 2 && !keep) {
      const others = plan.slice(0, onTable).filter((x) => x !== want);
      if (others.length > 1) setKeep(pickOne(others)); // narrow the table to two
    }
    later(() => {
      setFlash(null);
      void say(lineOf(want) ?? "");
    }, 650);
  };

  const switchMode = (m: "nuri" | "person") => {
    run.current += 1;
    setMode(m);
    setStep("idle");
    setPlan([]);
    setOnTable(0);
    setTelling(null);
    setFlash(null);
    setPointed(null);
  };

  const tableIds = mode === "person" ? BUBBLES.map((b) => b.id) : plan.slice(0, onTable);
  const stateOf = (id: string): BubbleState => {
    if (mode === "person") return pointed === id ? "pointed" : "idle";
    if (!tableIds.includes(id)) return "off";
    if (flash?.id === id) return flash.kind;
    if (telling === id) return "tell";
    if (step === "ask" && keep && id !== queue[0] && id !== keep) return "dim";
    return "idle";
  };
  const strips = STRIPS.filter((s) => BUBBLES.some((b) => b.strip === s.id && tableIds.includes(b.id))).sort((a, b) => {
    if (mode === "person") return 0;
    const first = (s: Strip) => tableIds.findIndex((id) => BUBBLES.find((x) => x.id === id)?.strip === s.id);
    return first(a) - first(b);
  });

  const steps: GuideStep[] = [
    { title: t("st1_lexStep1T"), body: t("st1_lexStep1B"), who: "nurturer" },
    { title: t("st1_lexStep2T"), body: t("st1_lexStep2B"), who: "you" },
    { title: t("st1_lexStep3T"), body: t("st1_lexStep3B"), who: "nurturer" },
    { title: t("st1_lexStep4T"), body: t("st1_lexStep4B"), who: "both" },
    { title: t("st1_lexStep5T"), body: t("st1_lexStep5B"), who: "you" },
  ];

  return (
    <div className="space-y-6">
      <StudioHeader phase={phase} activity={activity} emoji="💬" mode="either" />
      <StepGuide steps={steps} accent={accent} />

      {canNarrate ? (
        <Segmented
          label={t("st1_whoWith")}
          value={mode}
          onChange={switchMode}
          accent={accent}
          options={[
            { value: "nuri", label: t("st1_withNuri"), icon: "🌱" },
            { value: "person", label: t("st1_withPerson"), icon: "🤝" },
          ]}
        />
      ) : (
        <Callout icon="🤝" title={t("st1_noVoiceTitle")} tone="warm">
          <p>{t("st1_noVoiceBody")}</p>
        </Callout>
      )}

      {mode === "nuri" && (
        <RehearsalCallout>
          {isAuthored(lang) ? t("st1_lexRegister") : `${t("st1_lexPartial")} ${t("st1_lexRegister")}`}
        </RehearsalCallout>
      )}

      <Panel
        title={mode === "nuri" ? t("st1_lexTable") : t("st1_lexBoard")}
        sub={mode === "nuri" ? undefined : t("st1_lexBoardSub")}
      >
        {mode === "nuri" && step === "idle" && loaded && (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-muted">
              {freshCount > 0
                ? t("st1_lexToday").replace("{new}", String(Math.min(freshCount, knownIds.length === 0 ? 5 : 3))).replace("{known}", String(knownIds.length))
                : t("st1_lexAllMet")}
            </p>
            <div className="flex flex-wrap gap-2">
              <ActionButton onClick={start} accent={accent}>
                {t("start")}
              </ActionButton>
              {knownIds.length > 0 && (
                <ActionButton onClick={() => setKnown([])} accent={accent} quiet>
                  {t("st1_lexStartOver")}
                </ActionButton>
              )}
            </div>
          </div>
        )}

        {mode === "nuri" && step !== "idle" && (
          <div className="sticky top-32 z-30 flex items-center gap-3 rounded-3xl border border-line bg-raised-2 p-3 shadow-[var(--shadow-pop)]">
            {step === "ask" && (
              <HearButton onClick={() => void say(lineOf(queue[0]) ?? "")} label={t("tryAgain")} accent={accent} busy={busy} size={48} />
            )}
            <p className="min-w-0 flex-1 text-sm font-semibold text-ink" aria-live="polite">
              {step === "tell" && t("st1_lexTelling")}
              {step === "ask" && (keep ? t("st1_lexNarrowed") : t("st1_lexAsking"))}
              {step === "done" && t("st1_lexDone")}
            </p>
            <span className="shrink-0 text-xs tabular-nums text-muted">
              {onTable} / {plan.length}
            </span>
          </div>
        )}

        {strips.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            {strips.map((s) => (
              <StripArt
                key={s.id}
                strip={s}
                accent={accent}
                stateOf={stateOf}
                onBubble={tap}
                labelOf={(id) => t(`st1_lexAlt_${id}`)}
              />
            ))}
          </div>
        )}

        {mode === "nuri" && step === "done" && (
          <div className="flex flex-wrap items-center gap-3">
            <ActionButton onClick={start} accent={accent}>
              {t("st1_anotherRound")}
            </ActionButton>
            <p className="text-sm text-muted">{t("st1_lexRelive")}</p>
          </div>
        )}
      </Panel>

      <Panel title={t("st1_lexRecordTitle")} sub={t("st1_lexRecordSub")}>
        <RecordPanel
          lang={lang}
          phase={phase.id}
          activityId={activity.id}
          kind="primary"
          speaker="nurturer"
          defaultTitle={t("st1_lexRecordName")}
          accent={accent}
          showConsent
        />
        <RecordingList filter={{ activityId: activity.id, lang }} accent={accent} allowWords={false} emptyText={t("st1_sampleEmpty")} />
      </Panel>

      <WordsFinishBar timer={timer} accent={accent} wordIds={credited} />
      <IcebergToast show={toast} />
    </div>
  );
}

/* ------------------------------ strip art ------------------------------ */

const BUBBLE_LOOK: Record<BubbleState, string> = {
  off: "border-dashed border-white/15 bg-transparent",
  idle: "border-ink bg-ink",
  tell: "border-ink bg-ink animate-pulse",
  right: "border-lime bg-lime popin",
  wrong: "border-coral bg-coral shake",
  dim: "border-ink bg-ink opacity-25",
  pointed: "border-ink bg-ink",
};

const TAIL =
  "after:absolute after:-bottom-[7px] after:left-3 after:h-3 after:w-3 after:rotate-45 after:rounded-[2px] after:border-b-2 after:border-r-2 after:border-inherit after:bg-inherit after:content-['']";

function StripArt({
  strip,
  accent,
  stateOf,
  onBubble,
  labelOf,
}: {
  strip: Strip;
  accent: string;
  stateOf: (id: string) => BubbleState;
  onBubble: (id: string) => void;
  labelOf: (id: string) => string;
}) {
  const figure = (emoji: string | undefined, bubble: string | undefined, quiet: boolean | undefined) => {
    if (!emoji) return <span className="w-1" aria-hidden />;
    const state = bubble ? stateOf(bubble) : "idle";
    return (
      <div className="flex min-w-0 flex-col items-center gap-2">
        <div className="flex h-11 items-start">
          {bubble ? (
            <button
              type="button"
              onClick={() => onBubble(bubble)}
              disabled={state === "off" || state === "dim"}
              aria-label={labelOf(bubble)}
              aria-pressed={state === "pointed" ? true : undefined}
              className={`relative flex h-10 w-12 items-center justify-center rounded-2xl border-2 text-sm font-black text-canvas outline-none transition focus-visible:ring-2 focus-visible:ring-white ${BUBBLE_LOOK[state]} ${TAIL}`}
              style={state === "tell" || state === "pointed" ? { boxShadow: `0 0 0 4px ${accent}` } : undefined}
            >
              {state === "right" ? "✓" : null}
            </button>
          ) : quiet ? (
            <span className={`relative block h-8 w-10 rounded-2xl border-2 border-white/25 bg-white/10 ${TAIL}`} aria-hidden />
          ) : null}
        </div>
        <span className="whitespace-nowrap text-xl leading-none lg:text-3xl" aria-hidden>
          {emoji}
        </span>
      </div>
    );
  };

  const panel = (p: StripPanel, i: number) => (
    <div
      key={i}
      className="relative flex min-w-0 flex-1 flex-col justify-end overflow-hidden rounded-2xl bg-white/5 px-1.5 pb-2.5 pt-2"
      style={{ minHeight: 112 }}
    >
      {p.scene && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-5xl opacity-10" aria-hidden>
          {p.scene}
        </span>
      )}
      <div className={`relative flex items-end gap-1 ${p.apart ? "justify-between" : "justify-center"}`}>
        {figure(p.l, p.bubbleL, p.quietL)}
        {p.mid && (
          <span className="whitespace-nowrap pb-0.5 text-sm leading-none lg:text-xl" aria-hidden>
            {p.mid}
          </span>
        )}
        {figure(p.r, p.bubbleR, p.quietR)}
      </div>
    </div>
  );

  return (
    <div className="flex gap-1.5 rounded-3xl border border-line bg-raised-2 p-2" role="group">
      {strip.panels.map(panel)}
    </div>
  );
}
