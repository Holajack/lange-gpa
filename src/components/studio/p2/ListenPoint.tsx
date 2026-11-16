"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, RotateCcw, Volume2 } from "lucide-react";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import { shuffle } from "@/app/(app)/practice/shared";
import { hostText } from "../types";
import { textOn } from "../StudioShell";
import type { Panel } from "./content";
import { ScenePanel, SpotLayer, type SpotState } from "./Panel";
import { useSpeaker } from "./kit";

/**
 * Listen and Point — the guide's comprehension check. Nuri says something
 * from the picture; the grower taps where it is. A wrong tap is not a
 * mistake to count: the line is simply said again. No score, only how many
 * have been found.
 */
export function ListenAndPoint({
  panel,
  lang,
  accent,
  ratio = "4 / 3",
  pictureLabel,
  onDone,
}: {
  panel: Panel;
  lang: LangCode;
  accent: string;
  ratio?: string;
  pictureLabel: string;
  onDone?: () => void;
}) {
  const { t } = useApp();
  const spots = useMemo(() => panel.spots.filter((s) => hostText(s.say, lang)), [panel, lang]);
  const [order, setOrder] = useState<string[]>([]);
  const [idx, setIdx] = useState(-1);
  const [found, setFound] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const speaker = useSpeaker(lang);
  const { say, stop } = speaker;
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  // a new picture starts a fresh round
  useEffect(() => {
    clearTimers();
    stop();
    setOrder([]);
    setIdx(-1);
    setFound([]);
    setWrong(null);
    return clearTimers;
  }, [panel.id, stop]);

  if (spots.length === 0) return null;

  const started = idx >= 0;
  const done = started && idx >= order.length;
  const targetId = started && !done ? order[idx] : null;

  const sayFor = (id: string) => {
    const line = hostText(spots.find((s) => s.id === id)?.say, lang);
    if (line) void say([line]);
  };

  const start = () => {
    clearTimers();
    const next = shuffle(spots.map((s) => s.id));
    setOrder(next);
    setFound([]);
    setWrong(null);
    setIdx(0);
    sayFor(next[0]);
  };

  const tap = (id: string) => {
    if (!targetId || found.includes(id)) return;
    if (id === targetId) {
      setFound((f) => [...f, id]);
      setWrong(null);
      const nextIdx = idx + 1;
      setIdx(nextIdx);
      if (nextIdx < order.length) {
        timers.current.push(window.setTimeout(() => sayFor(order[nextIdx]), 500));
      } else {
        stop();
        onDone?.();
      }
      return;
    }
    setWrong(id);
    sayFor(targetId);
    timers.current.push(window.setTimeout(() => setWrong(null), 800));
  };

  const states: Record<string, SpotState | undefined> = {};
  found.forEach((id) => (states[id] = "found"));
  if (wrong) states[wrong] = "wrong";

  return (
    <div className="space-y-3">
      <div
        onClick={() => {
          // a tap that lands on nothing: just hear it again
          if (targetId) sayFor(targetId);
        }}
      >
        <ScenePanel panel={panel} ratio={ratio} label={pictureLabel}>
          <SpotLayer
            spots={spots}
            states={states}
            onTap={tap}
            disabled={!started || done}
            labelFor={(i) => t("st2_area").replace("{n}", String(i + 1))}
          />
        </ScenePanel>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {!started && (
          <button
            type="button"
            onClick={start}
            className={`pill min-h-11 px-5 py-2.5 text-sm font-bold ${textOn(accent)}`}
            style={{ background: accent }}
          >
            <Play size={15} strokeWidth={3} /> {t("st2_lpStart")}
          </button>
        )}
        {targetId && (
          <button
            type="button"
            onClick={() => sayFor(targetId)}
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
            {t("st2_lpFound").replace("{n}", String(found.length)).replace("{total}", String(order.length))}
          </span>
        )}
      </div>

      <p className="text-xs leading-relaxed text-muted" role="status">
        {done ? t("st2_lpDone") : wrong ? t("st2_lpTryAgain") : started ? t("st2_lpHint") : t("st2_lpIntro")}
      </p>
    </div>
  );
}
