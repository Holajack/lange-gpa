"use client";

import { useState } from "react";
import { Check, Play, RotateCcw } from "lucide-react";
import { useApp } from "@/lib/store";
import { fmtDuration } from "@/lib/library";
import { RangePlayer } from "../RangePlayer";
import { accentBtn, BTN_GHOST } from "../ui";
import type { Unit } from "./model";

/**
 * Plays a queue of units one after another. While a unit plays you can say
 * "I know this cold": it finishes, and the NEXT pass leaves it out.
 * The list is frozen when a pass starts, so setting things aside never
 * reshuffles what you are in the middle of.
 */
export function QueuePlayer({
  units,
  lookup,
  emptyText,
  accent,
  onHeard,
  onCold,
  onFlag,
}: {
  /** the queue as it stands now */
  units: Unit[];
  /** every unit by key, to keep a running pass in step with fresh data */
  lookup: Map<string, Unit>;
  /** shown when there is nothing to play and no pass is running */
  emptyText: string;
  accent: string;
  onHeard: (unit: Unit) => void;
  onCold: (unit: Unit, cold: boolean) => void;
  /** something stopped making sense: mark the second, to take back to the mentor */
  onFlag?: (unit: Unit, t: number) => void;
}) {
  const { t } = useApp();
  const [pass, setPass] = useState<string[] | null>(null);
  const [at, setAt] = useState(0);
  const [heard, setHeard] = useState<string[]>([]);
  const [rolling, setRolling] = useState(false);

  const list: Unit[] = pass
    ? pass.map((key) => lookup.get(key)).filter((u): u is Unit => Boolean(u))
    : units;
  const current = list[Math.min(at, Math.max(0, list.length - 1))];
  const finished = pass !== null && heard.length >= list.length && list.length > 0;

  const begin = (index: number) => {
    if (!pass) {
      setPass(units.map((u) => u.key));
      setHeard([]);
    }
    setAt(index);
    setRolling(true);
  };

  const reset = () => {
    setPass(null);
    setAt(0);
    setHeard([]);
    setRolling(false);
  };

  if (list.length === 0 || !current) {
    return <p className="text-sm leading-relaxed text-muted">{emptyText}</p>;
  }

  return (
    <div className="space-y-4">
      {!pass ? (
        <button type="button" onClick={() => begin(0)} {...accentBtn(accent)}>
          <Play size={15} strokeWidth={3} aria-hidden /> {t("st5_qStart")}
        </button>
      ) : (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="min-w-0 truncate text-sm font-semibold text-ink">
              {current.item.title}
              {current.stretchNo ? ` · ${t("st5_stretch")} ${current.stretchNo}` : ""}
            </p>
            <p className="text-xs tabular-nums text-muted">
              {Math.min(at + 1, list.length)}/{list.length}
            </p>
          </div>
          <RangePlayer
            item={current.item}
            start={current.start}
            end={current.end}
            accent={accent}
            autoPlay={rolling}
            marks={current.item.marks}
            onFlag={onFlag ? (second) => onFlag(current, second) : undefined}
            flagLabel={t("st5_qFlag")}
            pauseOnFlag={false}
            onRangeEnd={() => {
              onHeard(current);
              setHeard((prev) => (prev.includes(current.key) ? prev : [...prev, current.key]));
              if (at + 1 < list.length) setAt(at + 1);
              else setRolling(false);
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onCold(current, !current.cold)}
              aria-pressed={current.cold}
              className={`pill min-h-11 px-4 py-2.5 text-sm font-bold ${
                current.cold ? "bg-mint text-canvas" : "border border-line bg-white/6 text-ink"
              }`}
            >
              {current.cold && <Check size={15} strokeWidth={3} aria-hidden />}
              {t("st5_qCold")}
            </button>
            <span className="min-w-0 flex-1 basis-40 text-xs leading-relaxed text-muted">
              {current.cold ? t("st5_qColdOn") : t("st5_qColdHint")}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {finished && (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-mint" role="status">
                <Check size={15} strokeWidth={3} aria-hidden /> {t("st5_qDone")}
              </span>
            )}
            <button type="button" onClick={reset} className={BTN_GHOST}>
              <RotateCcw size={14} strokeWidth={2.5} aria-hidden /> {t("st5_qAgain")}
            </button>
          </div>
        </>
      )}

      <ol className="space-y-2">
        {list.map((u, i) => {
          const on = pass !== null && i === at;
          const done = heard.includes(u.key);
          return (
            <li key={u.key}>
              <button
                type="button"
                onClick={() => begin(i)}
                aria-current={on ? "true" : undefined}
                className={`flex min-h-12 w-full items-center gap-3 rounded-2xl border px-4 py-2.5 text-left ${
                  on ? "border-white/50 bg-white/10" : "border-line bg-raised-2 hover:bg-white/5"
                }`}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/8 text-xs font-bold tabular-nums text-ink"
                  aria-hidden
                >
                  {done ? <Check size={13} strokeWidth={3.5} className="text-mint" /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{u.item.title}</span>
                  <span className="block text-xs tabular-nums text-muted">
                    {u.stretchNo
                      ? `${t("st5_stretch")} ${u.stretchNo} · ${fmtDuration(u.start)}–${fmtDuration(u.end)}`
                      : `${t(`stc_kind_${u.item.kind}`)} · ${fmtDuration(u.seconds)}`}{" "}
                    · {t("stc_plHeard")} {u.heard.length} {t("stc_plTimes")}
                    {done ? ` · ${t("st5_qHeardNow")}` : ""}
                    {u.cold ? ` · ${t("st5_qSetAside")}` : ""}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
