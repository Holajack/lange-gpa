"use client";

import { useState, type ReactNode } from "react";
import { Check, Trash2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { textOn } from "../StudioShell";

/* Small presentational pieces shared by the Phase 6 tools. */

export const inputCls =
  "w-full min-w-0 rounded-2xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink outline-none [color-scheme:dark] placeholder:text-muted/70 focus:border-white/30";

export function Panel({
  title,
  sub,
  right,
  children,
}: {
  title: string;
  sub?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
          {sub && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{sub}</p>}
        </div>
        {right}
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-semibold text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs leading-relaxed text-muted">{hint}</span>}
    </label>
  );
}

export function AccentButton({
  accent,
  children,
  onClick,
  disabled,
  type = "button",
  className = "",
}: {
  accent: string;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`pill min-h-10 px-5 py-2.5 text-sm font-bold disabled:opacity-40 ${textOn(accent)} ${className}`}
      style={{ background: accent }}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  disabled,
  type = "button",
  pressed,
  expanded,
  label,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  pressed?: boolean;
  expanded?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      aria-expanded={expanded}
      aria-label={label}
      className={`pill min-h-10 border border-line bg-white/6 px-4 py-2.5 text-sm font-semibold text-ink disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export interface ChipOption<T extends string> {
  id: T;
  label: string;
  icon?: string;
}

/** Toggle chips. Selection is carried by a check mark and a border, not color alone. */
export function Chips<T extends string>({
  options,
  value,
  onToggle,
  label,
}: {
  options: ChipOption<T>[];
  value: readonly T[];
  onToggle: (id: T) => void;
  /** accessible name of the group */
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onToggle(o.id)}
            aria-pressed={on}
            className={`pill min-h-10 border px-3.5 py-2 text-xs font-semibold ${
              on ? "border-white/45 bg-white/15 text-ink" : "border-line bg-white/5 text-muted hover:text-ink"
            }`}
          >
            {on ? (
              <Check size={12} strokeWidth={3} aria-hidden />
            ) : o.icon ? (
              <span aria-hidden>{o.icon}</span>
            ) : null}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function RangeRow({
  label,
  value,
  min,
  max,
  onChange,
  accent,
  low,
  high,
  prefix = "",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  accent: string;
  low: string;
  high: string;
  /** shown before the number, e.g. "−" for a value that is subtracted */
  prefix?: string;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3 text-xs font-semibold text-muted">
        <span>{label}</span>
        <span className="text-sm font-bold tabular-nums text-ink">
          {prefix}
          {value}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 h-10 w-full"
        style={{ accentColor: accent }}
      />
      <span className="flex justify-between gap-3 text-[11px] leading-tight text-muted">
        <span>{low}</span>
        <span className="text-right">{high}</span>
      </span>
    </label>
  );
}

/** A plain bar with optional labeled reference marks. A mirror, not a goal. */
export function MeterBar({
  value,
  max,
  accent,
  marks = [],
  label,
}: {
  value: number;
  max: number;
  accent: string;
  marks?: { at: number; label: string }[];
  /** full sentence read to screen readers */
  label: string;
}) {
  const frac = (n: number) => Math.min(1, Math.max(0, max > 0 ? n / max : 0));
  return (
    <div role="img" aria-label={label}>
      <div className="h-3 w-full overflow-hidden rounded-full bg-white/8">
        <div className="h-full rounded-full" style={{ width: `${frac(value) * 100}%`, background: accent }} />
      </div>
      {marks.length > 0 && (
        <div className="relative mt-1 h-9" aria-hidden>
          {marks.map((m) => {
            const f = frac(m.at);
            const align =
              f > 0.8 ? "-translate-x-full items-end text-right" : f < 0.12 ? "items-start" : "-translate-x-1/2 items-center";
            return (
              <span
                key={`${m.at}-${m.label}`}
                className={`absolute top-0 flex flex-col text-[11px] leading-tight text-muted ${align}`}
                style={{ left: `${f * 100}%` }}
              >
                <span className="h-2 w-px bg-white/35" />
                <span className="whitespace-nowrap">{m.label}</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Stat({ value, label, sub }: { value: ReactNode; label: string; sub?: ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl border border-line bg-raised-2 p-3 sm:p-4">
      <p className="font-display text-xl font-extrabold tabular-nums text-ink sm:text-2xl">{value}</p>
      <p className="text-xs font-semibold leading-snug text-muted">{label}</p>
      {sub && <p className="mt-1 text-xs leading-snug text-muted">{sub}</p>}
    </div>
  );
}

/** Two-tap remove: the first tap arms it, the second erases. */
export function RemoveButton({ onConfirm, label }: { onConfirm: () => void; label: string }) {
  const { t } = useApp();
  const [armed, setArmed] = useState(false);
  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        aria-label={label}
        title={label}
        className="pill h-10 w-10 shrink-0 justify-center bg-white/5 p-0 text-muted hover:text-coral"
      >
        <Trash2 size={14} strokeWidth={2.5} />
      </button>
    );
  }
  return (
    <span className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={onConfirm}
        className="pill min-h-10 bg-coral px-3 py-2 text-xs font-bold text-canvas"
      >
        {t("st6_removeYes")}
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="pill min-h-10 bg-white/6 px-3 py-2 text-xs font-semibold text-ink"
      >
        {t("st6_keep")}
      </button>
    </span>
  );
}

/** A labeled check line for the stage checklists. */
export function CheckLine({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex min-h-10 cursor-pointer items-start gap-3 rounded-2xl border border-line bg-raised-2 px-4 py-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-mint)]"
      />
      <span className={`text-sm leading-relaxed ${checked ? "text-ink" : "text-muted"}`}>{children}</span>
    </label>
  );
}
