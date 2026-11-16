"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Square, Volume2 } from "lucide-react";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import { speak, stopSpeaking } from "@/lib/tts";
import { useBlobUrl } from "@/lib/library";
import { textOn } from "../StudioShell";

/* Small building blocks shared by the Phase 2 tools. */

const OWNER_KEY = "lange.profile.owner.v1";

/** One account + one target language = one slot. Same owner rule as the Word Log. */
function slotId(lang: LangCode): string {
  let owner = "local";
  try {
    owner = localStorage.getItem(OWNER_KEY) || "local";
  } catch {
    // storage blocked — everything lands in the local slot for this visit
  }
  return `${owner}:${lang}`;
}

function readSlots(key: string): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    const slots = parsed && typeof parsed === "object" ? (parsed as { slots?: unknown }).slots : null;
    return slots && typeof slots === "object" ? (slots as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/**
 * Tool state that survives a reload, under `lange.studio.{activityId}.v1`.
 * The key holds one slot per signed-in account and target language, so two
 * people sharing a device (or one person growing into two languages) never
 * see each other's facts, timelines or progress.
 */
export function useStored<T extends object>(
  activityId: string,
  lang: LangCode,
  initial: T
): [T, (fn: (prev: T) => T) => void, boolean] {
  const key = `lange.studio.${activityId}.v1`;
  const [value, setValue] = useState<T>(initial);
  /** the slot `value` currently belongs to — null until the first read */
  const [loaded, setLoaded] = useState<string | null>(null);
  const initialRef = useRef(initial);

  useEffect(() => {
    const slot = slotId(lang);
    const saved = readSlots(key)[slot];
    setValue(
      saved && typeof saved === "object" ? { ...initialRef.current, ...(saved as Partial<T>) } : initialRef.current
    );
    setLoaded(slot);
  }, [key, lang]);

  useEffect(() => {
    // never write one slot's state into another: only save what was loaded for this slot
    if (loaded === null || loaded !== slotId(lang)) return;
    try {
      localStorage.setItem(key, JSON.stringify({ slots: { ...readSlots(key), [loaded]: value } }));
    } catch {
      // storage full / private mode — keep the in-memory copy
    }
  }, [key, lang, loaded, value]);

  const update = useCallback((fn: (prev: T) => T) => setValue(fn), []);
  return [value, update, loaded !== null];
}

/** Local calendar day, yyyy-mm-dd. */
export function dayKey(date: Date = new Date()): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

export const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/** Speaks authored lines one after another; a new call (or unmount) cancels the last. */
export function useSpeaker(lang: LangCode) {
  const [speaking, setSpeaking] = useState(false);
  const [index, setIndex] = useState(-1);
  const token = useRef(0);

  const stop = useCallback(() => {
    token.current += 1;
    stopSpeaking();
    setSpeaking(false);
    setIndex(-1);
  }, []);

  /** Resolves true when every line was spoken, false when it was cut off. */
  const say = useCallback(
    async (lines: string[], onLine?: (i: number) => void): Promise<boolean> => {
      const mine = ++token.current;
      stopSpeaking();
      setSpeaking(true);
      for (let i = 0; i < lines.length; i++) {
        if (token.current !== mine) return false;
        setIndex(i);
        onLine?.(i);
        await speak(lines[i], lang);
      }
      if (token.current !== mine) return false;
      setSpeaking(false);
      setIndex(-1);
      return true;
    },
    [lang]
  );

  useEffect(
    () => () => {
      token.current += 1;
      stopSpeaking();
    },
    []
  );

  return { say, stop, speaking, index };
}

/** A titled card: the unit every workbench is laid out in. */
export function Section({
  title,
  sub,
  badge,
  children,
}: {
  title: string;
  sub?: ReactNode;
  badge?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="card space-y-4 p-5 sm:p-6">
      <div>
        <h2 className="flex flex-wrap items-center gap-2 font-display text-lg font-bold text-ink">
          {badge}
          {title}
        </h2>
        {sub && <p className="mt-1 text-sm leading-relaxed text-muted">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

/** Numbered step chip used in Section titles. */
export function StepBadge({ n, accent, done = false }: { n: number; accent: string; done?: boolean }) {
  return (
    <span
      className="flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-xs font-extrabold"
      style={{
        background: `color-mix(in srgb, ${accent} ${done ? 100 : 18}%, transparent)`,
        color: done ? "var(--color-canvas)" : accent,
      }}
      aria-hidden
    >
      {done ? "✓" : n}
    </span>
  );
}

export function Segmented<V extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: V;
  onChange: (v: V) => void;
  options: { id: V; label: string; icon?: string }[];
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={`pill min-h-11 px-4 py-2.5 text-sm font-semibold ${
            value === o.id ? "bg-white/15 text-ink" : "border border-line bg-white/5 text-muted hover:text-ink"
          }`}
        >
          {o.icon && <span aria-hidden>{o.icon}</span>}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Plays a page's authored lines in order. The written words stay hidden until heard. */
export function LinePlayer({
  lines,
  lang,
  accent,
  label,
  onHeard,
}: {
  lines: string[];
  lang: LangCode;
  accent: string;
  label: string;
  onHeard?: () => void;
}) {
  const { t } = useApp();
  const speaker = useSpeaker(lang);
  const [heard, setHeard] = useState(false);
  const [words, setWords] = useState(false);
  const key = lines.join("|");
  const { stop } = speaker;

  useEffect(() => {
    setHeard(false);
    setWords(false);
    stop();
  }, [key, stop]);

  const play = async () => {
    const finished = await speaker.say(lines);
    if (finished) {
      setHeard(true);
      onHeard?.();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={speaker.speaking ? speaker.stop : play}
          className={`pill min-h-11 px-5 py-2.5 text-sm font-bold ${textOn(accent)}`}
          style={{ background: accent }}
        >
          {speaker.speaking ? <Square size={14} strokeWidth={3} /> : <Volume2 size={16} strokeWidth={2.5} />}
          {speaker.speaking ? t("st2_stop") : heard ? t("st2_hearAgain") : label}
        </button>
        <span className="flex items-center gap-1.5" aria-hidden>
          {lines.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${i === speaker.index ? "w-6" : "w-2"}`}
              style={{ background: i === speaker.index ? accent : "rgba(255,255,255,0.16)" }}
            />
          ))}
        </span>
        {heard && (
          <button
            type="button"
            aria-pressed={words}
            onClick={() => setWords((w) => !w)}
            className="pill min-h-11 border border-line bg-white/6 px-4 py-2 text-xs font-semibold text-muted hover:text-ink"
          >
            {words ? t("st2_hideWords") : t("st2_seeWords")}
          </button>
        )}
      </div>
      {heard && words && (
        <ol lang={lang} className="space-y-1.5 rounded-2xl bg-canvas p-4 text-sm leading-relaxed text-ink">
          {lines.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>
      )}
    </div>
  );
}

/**
 * Tap to hear one host-language line. In "reveal" mode the written line only
 * appears once it has been heard; "text" mode is for phrases the grower has
 * carried since Phase 1.
 */
export function SayChip({
  text,
  lang,
  mode = "text",
  hiddenLabel,
  onHeard,
}: {
  text: string;
  lang: LangCode;
  mode?: "text" | "reveal";
  /** shown in reveal mode before the first listen */
  hiddenLabel?: string;
  onHeard?: () => void;
}) {
  const [heard, setHeard] = useState(false);
  const show = mode === "text" || heard;
  return (
    <button
      type="button"
      onClick={() => {
        void speak(text, lang).then(() => {
          setHeard(true);
          onHeard?.();
        });
      }}
      className="pill min-h-11 border border-line bg-white/6 px-4 py-2 text-left text-sm font-medium text-ink hover:bg-white/10"
    >
      <Volume2 size={15} strokeWidth={2.5} className="shrink-0 text-muted" aria-hidden />
      <span lang={show ? lang : undefined}>{show ? text : hiddenLabel}</span>
    </button>
  );
}

/** Previous / next with a "3 of 7" readout. */
export function Pager({
  index,
  count,
  onChange,
  label,
  prevLabel,
  nextLabel,
}: {
  index: number;
  count: number;
  onChange: (next: number) => void;
  label: string;
  prevLabel: string;
  nextLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={() => onChange(index - 1)}
        disabled={index <= 0}
        aria-label={prevLabel}
        className="pill h-11 w-11 justify-center border border-line bg-white/6 p-0 text-ink disabled:opacity-30"
      >
        <ChevronLeft size={18} strokeWidth={2.5} />
      </button>
      <span className="text-sm font-semibold tabular-nums text-ink" aria-live="polite">
        {label}
      </span>
      <button
        type="button"
        onClick={() => onChange(index + 1)}
        disabled={index >= count - 1}
        aria-label={nextLabel}
        className="pill h-11 w-11 justify-center border border-line bg-white/6 p-0 text-ink disabled:opacity-30"
      >
        <ChevronRight size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
}

/** One of the grower's own pictures, by library id. */
export function BlobImg({ id, alt, className = "" }: { id: string; alt: string; className?: string }) {
  const url = useBlobUrl(id);
  if (!url) return <span className={`block bg-raised-2 ${className}`} />;
  // eslint-disable-next-line @next/next/no-img-element -- device-local blob, nothing to optimize
  return <img src={url} alt={alt} className={className} />;
}
