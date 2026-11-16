"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Volume2 } from "lucide-react";
import { VOCAB_DOMAINS } from "@/lib/vocab";
import { effMeeting } from "@/lib/sessionFlow";
import { speak, stopSpeaking } from "@/lib/tts";
import { useApp } from "@/lib/store";
import { gate1bPassed } from "@/lib/gates";
import type { LangCode } from "@/lib/types";
import { CardFace } from "@/app/(app)/session/CardFace";
import { shuffle } from "@/app/(app)/practice/shared";
import { FinishBar, textOn, useStudioTimer } from "../StudioShell";
import type { P1Card } from "./content";

/* ------------------------------------------------------------------ *
 *  Helpers shared by the Phase 1 studio tools.
 * ------------------------------------------------------------------ */

/* ------------------------------- words ------------------------------- */

const DECKS = new Map<LangCode, P1Card[]>();

/** Every picture card that has a word in `lang`, in deck order. */
export function allCards(lang: LangCode): P1Card[] {
  const cached = DECKS.get(lang);
  if (cached) return cached;
  const out: P1Card[] = [];
  for (const d of VOCAB_DOMAINS) {
    for (const it of d.items) {
      const word = it.words[lang];
      if (word) out.push({ id: it.id, emoji: it.emoji, word, domainId: d.id, meeting: effMeeting(d.id, it, d.meeting) });
    }
  }
  DECKS.set(lang, out);
  return out;
}

/** The card ids this grower has actually met (in sessions or practice). */
export function useMetIds(): Set<string> {
  const { profile } = useApp();
  const ids = profile?.wordIds;
  return useMemo(() => new Set(ids ?? []), [ids]);
}

/**
 * Pick `count` cards from `pool`, words the grower has met first. When too
 * few are met, top up with the earliest meetings' words — the ones a nurturer
 * opens Phase 1 with — never with random late vocabulary.
 */
export function pickKnown(pool: P1Card[], met: Set<string>, count: number): P1Card[] {
  const seen = new Set<string>();
  const distinct = pool.filter((c) => {
    const key = c.word.toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const known = shuffle(distinct.filter((c) => met.has(c.id)));
  if (known.length >= count) return known.slice(0, count);
  const rest = shuffle(distinct.filter((c) => !met.has(c.id))).sort((a, b) => a.meeting - b.meeting);
  return [...known, ...rest].slice(0, count);
}

/** Phase 1A is listening-only: speaking parts open at the 1A → 1B gate. */
export function useCanSpeak(): boolean {
  const { profile } = useApp();
  return !profile || profile.phase > 1 || gate1bPassed(profile);
}

/* ------------------------------- voice ------------------------------- */

const pause = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** Awaitable pause, for pacing a spoken sequence. */
export const wait = pause;

/**
 * Nuri's voice for one tool: says a line (or several, in order), reports
 * whether it is still talking, and goes quiet when the tool unmounts or a
 * newer line starts.
 */
export function useSpeaker(lang: LangCode) {
  const token = useRef(0);
  const [busy, setBusy] = useState(false);

  const say = useCallback(
    async (lines: string | undefined | (string | undefined)[], gapMs = 450): Promise<boolean> => {
      const list = (Array.isArray(lines) ? lines : [lines]).filter((l): l is string => Boolean(l));
      const mine = ++token.current;
      if (list.length === 0) return true;
      setBusy(true);
      for (let i = 0; i < list.length; i++) {
        await speak(list[i], lang);
        if (token.current !== mine) return false;
        if (i < list.length - 1) {
          await pause(gapMs);
          if (token.current !== mine) return false;
        }
      }
      setBusy(false);
      return true;
    },
    [lang]
  );

  const hush = useCallback(() => {
    token.current += 1;
    stopSpeaking();
    setBusy(false);
  }, []);

  useEffect(
    () => () => {
      token.current += 1;
      stopSpeaking();
    },
    []
  );

  return { say, hush, busy };
}

/** One-shot timers that are cleared when the tool unmounts. */
export function useLater() {
  const timers = useRef<number[]>([]);
  useEffect(
    () => () => {
      timers.current.forEach((id) => window.clearTimeout(id));
    },
    []
  );
  return useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
}

/** Round "hear it" button. */
export function HearButton({
  onClick,
  label,
  accent,
  size = 56,
  busy = false,
  disabled = false,
}: {
  onClick: () => void;
  label: string;
  accent: string;
  size?: number;
  busy?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`pill shrink-0 disabled:opacity-40 ${textOn(accent)} ${busy ? "animate-pulse" : ""}`}
      style={{ width: size, height: size, background: accent }}
    >
      <Volume2 size={Math.round(size * 0.42)} strokeWidth={2.5} aria-hidden />
    </button>
  );
}

/* ------------------------------ pictures ----------------------------- */

export type TileState = "idle" | "selected" | "right" | "wrong" | "dim";

const TILE_RING: Record<TileState, string> = {
  idle: "border-line",
  selected: "border-white ring-2 ring-white/60",
  right: "border-lime ring-2 ring-lime",
  wrong: "border-coral ring-2 ring-coral/70",
  dim: "border-line opacity-30",
};

/** A picture card you can tap. Shows the picture only — never the written word. */
export function PictureTile({
  card,
  label,
  onClick,
  state = "idle",
  disabled = false,
  pressed,
  className = "",
  emojiClass = "text-4xl",
}: {
  card: { id: string; emoji: string };
  /** accessible name — a neutral "Picture 3", never the host word */
  label: string;
  onClick?: () => void;
  state?: TileState;
  disabled?: boolean;
  pressed?: boolean;
  className?: string;
  emojiClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || state === "dim"}
      aria-label={label}
      aria-pressed={pressed}
      className={`relative flex aspect-square min-h-11 items-center justify-center overflow-hidden rounded-2xl border-2 bg-raised-2 p-1.5 outline-none transition focus-visible:ring-2 focus-visible:ring-white ${TILE_RING[state]} ${className}`}
    >
      <CardFace itemId={card.id} emoji={card.emoji} className={`${emojiClass} leading-none`} imgClassName="h-full w-full rounded-xl" />
      {state === "right" && (
        <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-lime text-[11px] font-black text-canvas" aria-hidden>
          ✓
        </span>
      )}
    </button>
  );
}

/** A picture that is only looked at (inside another control, or as a prompt). */
export function PictureFace({
  card,
  className = "",
  emojiClass = "text-5xl",
}: {
  card: { id: string; emoji: string };
  className?: string;
  emojiClass?: string;
}) {
  return (
    <span className={`flex items-center justify-center overflow-hidden rounded-2xl bg-raised-2 p-1.5 ${className}`}>
      <CardFace itemId={card.id} emoji={card.emoji} className={`${emojiClass} leading-none`} imgClassName="h-full w-full rounded-xl" />
    </span>
  );
}

/* ------------------------------ layout ------------------------------- */

/** A titled workbench panel. */
export function Panel({
  title,
  sub,
  right,
  children,
  className = "",
}: {
  title?: string;
  sub?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card space-y-4 p-4 sm:p-6 ${className}`}>
      {(title || right) && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="font-display text-lg font-bold text-ink">{title}</h2>}
            {sub && <p className="mt-1 text-sm leading-relaxed text-muted">{sub}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

/** Two-or-three-way switch (with Nuri / with a person, game A / game B). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  accent,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: string }[];
  accent: string;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={`pill min-h-11 border px-4 py-2 text-sm font-semibold ${
              on ? `border-transparent ${textOn(accent)}` : "border-line bg-white/6 text-muted hover:text-ink"
            }`}
            style={on ? { background: accent } : undefined}
          >
            {o.icon && <span aria-hidden>{o.icon}</span>}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Primary action button in the phase colour. */
export function ActionButton({
  children,
  onClick,
  accent,
  disabled,
  quiet = false,
}: {
  children: ReactNode;
  onClick: () => void;
  accent: string;
  disabled?: boolean;
  /** secondary look */
  quiet?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`pill min-h-11 px-5 py-2.5 text-sm font-bold disabled:opacity-40 ${
        quiet ? "border border-line bg-white/6 text-ink" : textOn(accent)
      }`}
      style={quiet ? undefined : { background: accent }}
    >
      {children}
    </button>
  );
}

/* ------------------------------ finishing ---------------------------- */

/**
 * The "log this session" footer, crediting the picture-card words this tool
 * actually put in front of the grower.
 */
export function WordsFinishBar({
  timer,
  accent,
  wordIds,
}: {
  timer: ReturnType<typeof useStudioTimer>;
  accent: string;
  wordIds: string[];
}) {
  return <FinishBar timer={{ ...timer, finish: () => timer.finish(wordIds) }} accent={accent} />;
}

/** A growing set of credited word ids that never re-renders more than it must. */
export function useCredited() {
  const [ids, setIds] = useState<string[]>([]);
  const credit = useCallback((more: (string | undefined)[]) => {
    setIds((prev) => {
      const next = new Set(prev);
      more.forEach((id) => id && next.add(id));
      return next.size === prev.length ? prev : [...next];
    });
  }, []);
  return { ids, credit };
}

/* ------------------------------ persistence -------------------------- */

const OWNER_KEY = "lange.profile.owner.v1";

/** The signed-in account this browser profile belongs to (same source as the word log and library). */
function ownerId(): string {
  try {
    return localStorage.getItem(OWNER_KEY) || "local";
  } catch {
    return "local";
  }
}

type Slots = Record<string, unknown>;

function readSlots(key: string): Slots {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Slots) : {};
  } catch {
    return {}; // unreadable or blocked storage — start fresh
  }
}

/**
 * State that survives a reload, kept in localStorage under
 * `lange.studio.{activityId}.v1`, in a slot of its own per signed-in account
 * AND per target language — two people sharing a device never see each
 * other's ladder, and a second language starts clean. SSR-safe: read in an
 * effect, written from handlers.
 */
export function usePersisted<T>(
  activityId: string,
  lang: LangCode,
  initial: T
): [T, (next: T | ((prev: T) => T)) => void, boolean] {
  const key = `lange.studio.${activityId}.v1`;
  const first = useRef(initial);
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const slots = readSlots(key);
    const slot = `${ownerId()}|${lang}`;
    setValue(slot in slots ? (slots[slot] as T) : first.current);
    setLoaded(true);
  }, [key, lang]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          const slots = readSlots(key);
          slots[`${ownerId()}|${lang}`] = resolved;
          localStorage.setItem(key, JSON.stringify(slots));
        } catch {
          // storage full or blocked — keep it in memory for this visit
        }
        return resolved;
      });
    },
    [key, lang]
  );

  return [value, update, loaded];
}

/* ------------------------------- random ------------------------------ */

/** Deterministic shuffle from a text seed — two devices with the same seed get the same order. */
export function seededShuffle<T>(arr: readonly T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const next = () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function pickOne<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
