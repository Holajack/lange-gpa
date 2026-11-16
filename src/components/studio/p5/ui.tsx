"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, Trash2, Volume2 } from "lucide-react";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import { speak } from "@/lib/tts";
import { Callout, textOn } from "../StudioShell";
import { hostLines, type HostLine } from "./content";

/* Small pieces shared by the Phase 5 tools. Chrome only: no method logic. */

export const INPUT =
  "w-full min-w-0 rounded-2xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-white/30";

export const BTN_GHOST =
  "pill min-h-10 border border-line bg-white/6 px-4 py-2 text-sm font-semibold text-ink disabled:opacity-40";

export const BTN_QUIET = "pill min-h-10 bg-white/6 px-4 py-2 text-sm font-semibold text-muted hover:text-ink";

/** Class + style for a solid button in the phase color. */
export function accentBtn(accent: string) {
  return {
    className: `pill min-h-10 px-5 py-2.5 text-sm font-bold disabled:opacity-40 ${textOn(accent)}`,
    style: { background: accent },
  };
}

/** A card with a title, an optional line under it, and optional controls on the right. */
export function Panel({
  title,
  sub,
  right,
  children,
  id,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
  children?: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="card space-y-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
          {sub && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{sub}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Stat({ value, label, sub }: { value: ReactNode; label: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-raised-2 p-4">
      <p className="headline text-2xl tabular-nums text-ink">{value}</p>
      <p className="mt-1 text-xs font-semibold text-muted">{label}</p>
      {sub && <p className="mt-1 text-xs leading-relaxed text-muted">{sub}</p>}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-semibold text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs leading-relaxed text-muted">{hint}</span>}
    </label>
  );
}

export interface Choice<T extends string> {
  id: T;
  label: string;
  hint?: string;
}

/** Single choice from a short list, as chips. */
export function ChoiceChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Choice<T>[];
  value: T | null;
  onChange: (id: T) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-muted">{label}</p>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              title={o.hint}
              onClick={() => onChange(o.id)}
              className={`pill min-h-10 border px-4 py-2 text-sm font-semibold ${
                on ? "border-white/50 bg-white/15 text-ink" : "border-line bg-white/5 text-muted hover:text-ink"
              }`}
            >
              {on && <span aria-hidden>✓</span>}
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Tabs inside a tool. */
export function SegTabs<T extends string>({
  tabs,
  value,
  onChange,
  accent,
  label,
}: {
  tabs: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (id: T) => void;
  accent: string;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const on = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(tab.id)}
            className={`pill min-h-10 px-5 py-2.5 text-sm font-bold ${on ? textOn(accent) : "bg-white/6 text-muted hover:text-ink"}`}
            style={on ? { background: accent } : undefined}
          >
            {tab.label}
            {tab.count !== undefined && <span className="tabular-nums opacity-80">{tab.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/**
 * In Phase 5 the person across the table is a mentor: any host person willing
 * to sit with the grower and talk naturally. No training, no vetting.
 */
export function MentorCallout({ children }: { children?: ReactNode }) {
  const { t } = useApp();
  return (
    <Callout icon="🤝" title={t("st5_mentorTitle")} tone="warm">
      <p>{children ?? t("st5_mentorBody")}</p>
      <p className="mt-2 text-xs">{t("st5_mentorWho")}</p>
    </Callout>
  );
}

/**
 * Things to SAY to a real person, in the host language. Tap one to hear a
 * model of it. Renders nothing for a language with no authored lines.
 */
export function HostPhrases({
  title,
  sub,
  lines,
  lang,
}: {
  title: string;
  sub?: string;
  lines: HostLine[];
  lang: LangCode;
}) {
  const { t } = useApp();
  const shown = hostLines(lines, lang);
  if (shown.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-muted">{title}</p>
      {sub && <p className="mt-1 text-xs leading-relaxed text-muted">{sub}</p>}
      <ul className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {shown.map((l) => (
          <li key={l.id} className="min-w-0">
            <button
              type="button"
              onClick={() => void speak(l.text, lang)}
              aria-label={`${t("st5_hearIt")}: ${l.text}`}
              className="flex min-h-10 w-full items-center gap-2 rounded-2xl border border-line bg-white/5 px-3 py-2 text-left text-sm text-ink hover:bg-white/10"
            >
              <Volume2 size={14} strokeWidth={2.5} className="shrink-0 text-muted" aria-hidden />
              <span className="min-w-0 break-words">{l.text}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * A text box that keeps its own draft and saves when you leave it, so typing
 * never waits on storage. `multiline` gives a textarea.
 */
export function DraftInput({
  value,
  onCommit,
  label,
  placeholder,
  maxLength = 200,
  multiline = false,
  className = INPUT,
}: {
  value: string;
  onCommit: (next: string) => void;
  /** accessible name (also the placeholder unless one is given) */
  label: string;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
  className?: string;
}) {
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setDraft(value);
  }, [value, focused]);
  const commit = () => {
    setFocused(false);
    if (draft !== value) onCommit(draft);
  };
  if (multiline) {
    return (
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={commit}
        placeholder={placeholder ?? label}
        aria-label={label}
        maxLength={maxLength}
        rows={2}
        className={`${className} resize-y`}
      />
    );
  }
  return (
    <input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      placeholder={placeholder ?? label}
      aria-label={label}
      maxLength={maxLength}
      className={className}
    />
  );
}

/** A section that stays folded until it is wanted. */
export function Disclosure({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-line bg-raised-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm font-semibold text-ink"
      >
        <span className="min-w-0">{title}</span>
        <ChevronDown
          size={16}
          strokeWidth={2.5}
          className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open && <div className="space-y-3 px-4 pb-4">{children}</div>}
    </div>
  );
}

/** Two-tap remove for tracker rows the grower typed themselves. */
export function RemoveButton({ onConfirm, label }: { onConfirm: () => void; label?: string }) {
  const { t } = useApp();
  const [armed, setArmed] = useState(false);
  if (armed) {
    return (
      <span className="flex items-center gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="pill min-h-10 bg-coral px-3 py-2 text-xs font-bold text-canvas"
        >
          {t("st5_removeYes")}
        </button>
        <button type="button" onClick={() => setArmed(false)} className="pill min-h-10 bg-white/6 px-3 py-2 text-xs font-semibold text-ink">
          {t("back")}
        </button>
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setArmed(true)}
      aria-label={label ?? t("st5_remove")}
      title={label ?? t("st5_remove")}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted hover:text-coral"
    >
      <Trash2 size={15} strokeWidth={2.5} />
    </button>
  );
}

/** A meter with its numbers written out, so nothing rides on color alone. */
export function Meter({
  value,
  max,
  accent,
  label,
}: {
  value: number;
  max: number;
  accent: string;
  label: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(Math.min(value, max))}
      className="h-2.5 w-full overflow-hidden rounded-full bg-white/8"
    >
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: accent }} />
    </div>
  );
}

/** "1 h 20 min" / "45 min", with the unit words localized. */
export function useDurationWords() {
  const { t } = useApp();
  return (sec: number): string => {
    const minutes = Math.max(0, Math.round(sec / 60));
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m} ${t("st5_unitMin")}`;
    return m === 0 ? `${h} ${t("st5_unitH")}` : `${h} ${t("st5_unitH")} ${m} ${t("st5_unitMin")}`;
  };
}
