"use client";

import type { CSSProperties, ReactNode } from "react";
import { Check } from "lucide-react";
import { CardFace } from "@/app/(app)/session/CardFace";
import type { Panel, PanelEl, PanelSpot } from "./content";

/**
 * The Phase 2 picture renderer. A "panel" is one wordless page: a soft
 * backdrop plus a few large emoji and simple shapes, all placed by percentage
 * so the same data reads at 375px and on a desktop. Sizes use container
 * units (cqw), so a thumbnail and a full page are the same drawing.
 */

const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

function Element({ el }: { el: PanelEl }) {
  if (el.k === "r") {
    const style: CSSProperties = {
      left: `${el.x}%`,
      top: `${el.y}%`,
      width: `${el.w}%`,
      height: `${el.h}%`,
      background: el.c,
      borderRadius: el.r ? (el.r >= 50 ? "50%" : `${el.r}cqw`) : undefined,
      border: el.bd ? `0.9cqw solid ${el.bd}` : undefined,
      opacity: el.o,
      transform: el.rot ? `rotate(${el.rot}deg)` : undefined,
    };
    return <span className="absolute block" style={style} />;
  }
  if (el.k === "c") {
    return (
      <span
        className="absolute flex items-center justify-center overflow-hidden bg-white leading-none"
        style={{
          left: `${el.x}%`,
          top: `${el.y}%`,
          width: `${el.s}cqw`,
          height: `${el.s}cqw`,
          transform: "translate(-50%, -50%)",
          borderRadius: "1.4cqw",
          fontSize: `${el.s * 0.7}cqw`,
          fontFamily: EMOJI_FONT,
          boxShadow: "0 0.4cqw 1cqw rgba(0,0,0,0.18)",
        }}
      >
        <CardFace itemId={el.id} emoji={el.g} className="leading-none" imgClassName="h-full w-full" />
      </span>
    );
  }
  return (
    <span
      className="absolute select-none leading-none"
      style={{
        left: `${el.x}%`,
        top: `${el.y}%`,
        fontSize: `${el.s}cqw`,
        fontFamily: EMOJI_FONT,
        transform: `translate(-50%, -50%) rotate(${el.rot ?? 0}deg) scaleX(${el.flip ? -1 : 1})`,
      }}
    >
      {el.g}
    </span>
  );
}

/** One picture page. `children` is the interactive layer (hot-spots) drawn on top. */
export function ScenePanel({
  panel,
  ratio = "4 / 3",
  label,
  className = "",
  rounded = "rounded-3xl",
  children,
}: {
  panel: Panel;
  ratio?: string;
  /** neutral accessible name ("Page 3") — never a description that gives the words away */
  label: string;
  className?: string;
  rounded?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`relative w-full overflow-hidden border border-line ${rounded} ${className}`}
      style={{
        aspectRatio: ratio,
        containerType: "inline-size",
        background: `linear-gradient(180deg, ${panel.bg[0]}, ${panel.bg[1]})`,
      }}
    >
      <div role="img" aria-label={label} className="pointer-events-none absolute inset-0">
        {panel.floor && (
          <span
            className="absolute inset-x-0 bottom-0 block"
            style={{ height: `${panel.floor[1]}%`, background: panel.floor[0] }}
          />
        )}
        {panel.els.map((el, i) => (
          <Element key={i} el={el} />
        ))}
      </div>
      {children}
    </div>
  );
}

export type SpotState = "found" | "wrong" | "picked";

const SPOT_CLASS: Record<SpotState | "idle" | "numbered", string> = {
  idle: "border-transparent hover:border-black/25 focus-visible:border-black/50",
  numbered: "border-dashed border-black/30 hover:border-black/60",
  found: "border-mint bg-mint/20",
  wrong: "border-coral bg-coral/20",
  picked: "border-black/70 bg-white/35",
};

/** Tappable regions over a ScenePanel. Regions are invisible until found or picked. */
export function SpotLayer({
  spots,
  states = {},
  onTap,
  numbered = false,
  disabled = false,
  labelFor,
}: {
  spots: PanelSpot[];
  states?: Record<string, SpotState | undefined>;
  onTap?: (id: string) => void;
  /** show the guide-style number on each region (for "your turn to describe") */
  numbered?: boolean;
  disabled?: boolean;
  /** accessible name for region i — a neutral "Area 3", never the answer */
  labelFor: (index: number) => string;
}) {
  return (
    <>
      {spots.map((s, i) => {
        const state = states[s.id];
        return (
          <button
            key={s.id}
            type="button"
            disabled={disabled}
            onClick={(ev) => {
              ev.stopPropagation();
              onTap?.(s.id);
            }}
            aria-label={labelFor(i)}
            aria-pressed={state === "found" || state === "picked"}
            className={`absolute rounded-2xl border-2 transition-colors ${
              SPOT_CLASS[state ?? (numbered ? "numbered" : "idle")]
            }`}
            style={{ left: `${s.box[0]}%`, top: `${s.box[1]}%`, width: `${s.box[2]}%`, height: `${s.box[3]}%` }}
          >
            {numbered && (
              <span className="absolute left-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-canvas/85 px-1 text-[10px] font-bold text-ink">
                {i + 1}
              </span>
            )}
            {state === "found" && (
              <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-mint text-canvas">
                <Check size={12} strokeWidth={3.5} aria-hidden />
              </span>
            )}
          </button>
        );
      })}
    </>
  );
}

/** A small, selectable copy of a panel (story covers, page strips, process tiles). */
export function PanelThumb({
  panel,
  label,
  selected = false,
  onClick,
  ratio = "4 / 3",
  badge,
  className = "",
  disabled,
}: {
  panel: Panel;
  label: string;
  selected?: boolean;
  onClick?: () => void;
  ratio?: string;
  badge?: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={label}
      className={`relative block overflow-hidden rounded-2xl border-2 ${
        selected ? "border-white" : "border-transparent"
      } ${className}`}
    >
      <ScenePanel panel={panel} ratio={ratio} label={label} rounded="rounded-xl" className="border-0" />
      {badge && (
        <span className="absolute left-1.5 top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-canvas/85 px-1.5 text-[11px] font-bold text-ink">
          {badge}
        </span>
      )}
    </button>
  );
}
