"use client";

import { useState } from "react";
import { ArrowLeft, Check, Play, Square, Volume2, X } from "lucide-react";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import { textOn } from "../StudioShell";
import { hostText } from "../types";
import { FLOODS, type FloodLine, type FloodPattern } from "./content";
import { shuffled, useNarrator } from "./hooks";

/**
 * Input-flood rehearsal. Nuri says one sentence at a time; most carry the
 * target shape, a few don't. The grower says, by ear, whether it was in
 * there. Nothing is explained: the ear does the work.
 */

export interface FloodRun {
  caught: number;
  hits: number;
  /** taps on sentences that did not carry the shape */
  extra: number;
  times: number;
}

type Stage = "model" | "run" | "summary";

export function FloodRehearsal({
  lang,
  accent,
  runs,
  onRun,
}: {
  lang: LangCode;
  accent: string;
  runs: Record<string, FloodRun>;
  onRun: (patternId: string, result: Omit<FloodRun, "times">) => void;
}) {
  const { t } = useApp();
  const [pattern, setPattern] = useState<FloodPattern | null>(null);

  if (pattern) {
    return (
      <FloodRunner
        key={pattern.id}
        pattern={pattern}
        lang={lang}
        accent={accent}
        onRun={(r) => onRun(pattern.id, r)}
        onBack={() => setPattern(null)}
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-muted">{t("st3_flSoloPick")}</p>
      <ul className="grid gap-3 sm:grid-cols-3">
        {FLOODS.map((p) => {
          const last = runs[p.id];
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setPattern(p)}
                className="flex h-full min-h-20 w-full flex-col items-start gap-1.5 rounded-3xl border border-line bg-raised-2 p-4 text-left hover:bg-white/8"
              >
                <span className="text-sm font-semibold text-ink">{t(p.labelKey)}</span>
                <span className="text-xs text-muted">
                  {last
                    ? t("st3_flSoloLast")
                        .replace("{caught}", String(last.caught))
                        .replace("{hits}", String(last.hits))
                        .replace("{times}", String(last.times))
                    : t("st3_flSoloNew").replace("{n}", String(p.lines.length))}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FloodRunner({
  pattern,
  lang,
  accent,
  onRun,
  onBack,
}: {
  pattern: FloodPattern;
  lang: LangCode;
  accent: string;
  onRun: (result: Omit<FloodRun, "times">) => void;
  onBack: () => void;
}) {
  const { t } = useApp();
  const narrator = useNarrator(lang);
  const [stage, setStage] = useState<Stage>("model");
  const [modelHeard, setModelHeard] = useState(false);
  const [lines, setLines] = useState<FloodLine[]>(pattern.lines);
  const [ix, setIx] = useState(0);
  const [lineHeard, setLineHeard] = useState(false);
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [caught, setCaught] = useState(0);
  const [extra, setExtra] = useState(0);

  const total = lines.length;
  const hits = lines.filter((l) => l.hit).length;
  const line = lines[ix];
  const text = (l: FloodLine) => hostText(l.text, lang) ?? "";

  const playLine = async (i: number, from: FloodLine[] = lines) => {
    setIx(i);
    setAnswer(null);
    setLineHeard(false);
    if (await narrator.say([text(from[i])], { id: "line" })) setLineHeard(true);
  };

  const hearModels = async () => {
    const models = pattern.models.map((m) => hostText(m, lang) ?? "");
    if (await narrator.say(models, { id: "models", gap: 500 })) setModelHeard(true);
  };

  const start = () => {
    const mixed = shuffled(pattern.lines);
    setLines(mixed);
    setCaught(0);
    setExtra(0);
    setStage("run");
    void playLine(0, mixed);
  };

  const judge = (saidYes: boolean) => {
    setAnswer(saidYes);
    if (saidYes && line.hit) setCaught((c) => c + 1);
    if (saidYes && !line.hit) setExtra((e) => e + 1);
  };

  const next = () => {
    if (ix + 1 < total) {
      void playLine(ix + 1);
      return;
    }
    narrator.stop();
    onRun({ caught, hits, extra });
    setStage("summary");
  };

  const hearFlood = () =>
    void narrator.say(
      pattern.lines.filter((l) => l.hit).map(text),
      { id: "flood", gap: 400 }
    );

  const primary = `pill min-h-12 px-5 py-3 text-sm font-bold ${textOn(accent)}`;
  const quiet = "pill min-h-11 border border-line bg-white/6 px-4 py-2.5 text-sm font-semibold text-ink";
  const right = answer !== null && answer === line.hit;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="pill min-h-10 bg-white/6 px-3.5 py-2 text-xs font-semibold text-muted hover:text-ink"
        >
          <ArrowLeft size={13} strokeWidth={2.5} aria-hidden /> {t("st3_flSoloOther")}
        </button>
        <p className="text-sm font-semibold text-ink">{t(pattern.labelKey)}</p>
      </div>

      {stage === "model" && (
        <div className="space-y-4 rounded-3xl border border-line bg-raised-2 p-4 sm:p-5">
          <p className="text-sm leading-relaxed text-muted">{t("st3_flSoloModel")}</p>
          <button type="button" onClick={hearModels} className={quiet}>
            <Volume2 size={15} strokeWidth={2.5} aria-hidden /> {t("st3_flSoloHearModel")}
          </button>
          {modelHeard && (
            <>
              <div>
                <p className="text-xs font-semibold text-muted">{t("st3_flSoloListenFor")}</p>
                <p lang={lang} className="mt-1 font-display text-xl font-bold text-ink">
                  {hostText(pattern.target, lang)}
                </p>
              </div>
              <button type="button" onClick={start} className={primary} style={{ background: accent }}>
                <Play size={15} strokeWidth={3} aria-hidden /> {t("st3_flSoloStart")}
              </button>
            </>
          )}
        </div>
      )}

      {stage === "run" && (
        <div className="space-y-4 rounded-3xl border border-line bg-raised-2 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink" aria-live="polite">
              {t("st3_flSoloLineOf").replace("{i}", String(ix + 1)).replace("{n}", String(total))}
            </p>
            <p className="text-sm tabular-nums text-muted">{t("st3_flSoloCaught").replace("{n}", String(caught))}</p>
          </div>
          <p lang={lang} className="font-display text-base font-bold text-ink">
            {hostText(pattern.target, lang)}
          </p>

          <button type="button" onClick={() => playLine(ix)} disabled={answer !== null} className={`${quiet} disabled:opacity-40`}>
            <Volume2 size={15} strokeWidth={2.5} aria-hidden /> {t("st3_flSoloAgain")}
          </button>

          {answer === null ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => judge(true)}
                disabled={!lineHeard}
                className={`${primary} disabled:opacity-40`}
                style={{ background: accent }}
              >
                ✋ {t("st3_flSoloYes")}
              </button>
              <button
                type="button"
                onClick={() => judge(false)}
                disabled={!lineHeard}
                className="pill min-h-12 border border-line bg-white/6 px-5 py-3 text-sm font-bold text-ink disabled:opacity-40"
              >
                {t("st3_flSoloNo")}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink" role="status">
                {right ? (
                  <Check size={16} strokeWidth={3} className="text-mint" aria-hidden />
                ) : (
                  <X size={16} strokeWidth={3} className="text-coral" aria-hidden />
                )}
                {t(line.hit ? (answer ? "st3_flSoloWasYes" : "st3_flSoloWasMissed") : answer ? "st3_flSoloWasExtra" : "st3_flSoloWasNo")}
              </p>
              <p lang={lang} className="rounded-2xl bg-canvas px-4 py-3 text-base leading-relaxed text-ink">
                {text(line)}
              </p>
              <button type="button" onClick={next} className={primary} style={{ background: accent }}>
                {t(ix + 1 < total ? "st3_flSoloNext" : "st3_flSoloFinish")}
              </button>
            </div>
          )}
        </div>
      )}

      {stage === "summary" && (
        <div className="space-y-4 rounded-3xl border border-line bg-raised-2 p-4 sm:p-5">
          <p className="text-sm font-semibold text-ink" role="status">
            {t("st3_flSoloSummary").replace("{caught}", String(caught)).replace("{hits}", String(hits))}
            {extra > 0 && ` ${t("st3_flSoloExtra").replace("{n}", String(extra))}`}
          </p>
          <p className="text-sm leading-relaxed text-muted">{t("st3_flSoloThen")}</p>
          <div className="flex flex-wrap gap-2">
            {narrator.playing === "flood" ? (
              <button type="button" onClick={narrator.stop} className="pill min-h-12 bg-coral px-5 py-3 text-sm font-bold text-canvas">
                <Square size={14} strokeWidth={3} aria-hidden /> {t("st3_trStop")}
              </button>
            ) : (
              <button type="button" onClick={hearFlood} className={primary} style={{ background: accent }}>
                <Play size={15} strokeWidth={3} aria-hidden /> {t("st3_flSoloStraight")}
              </button>
            )}
            <button type="button" onClick={start} className={quiet}>
              {t("st3_flSoloRerun")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
