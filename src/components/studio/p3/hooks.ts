"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LangCode } from "@/lib/types";
import { speak, stopSpeaking } from "@/lib/tts";
import type { LibraryItem } from "@/lib/library";

/* ------------------------------------------------------------------ *
 *  Persisted tool state: localStorage `lange.studio.{id}.v1`, one slot
 *  per account + target language, so journeys never bleed together.
 * ------------------------------------------------------------------ */

const OWNER_KEY = "lange.profile.owner.v1";
const SYNC_EVENT = "lange:studio:p3";

interface SyncDetail {
  key: string;
  /** the hook instance that wrote, so it can skip reloading its own write */
  from: object;
}

const isPlain = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function slotName(lang: LangCode): string {
  let owner = "local";
  try {
    owner = localStorage.getItem(OWNER_KEY) || "local";
  } catch {
    // private mode: keep the shared slot
  }
  return `${owner}|${lang}`;
}

function readSlot<T>(key: string, lang: LangCode, initial: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return initial;
    const saved = (JSON.parse(raw) as Record<string, T | undefined>)[slotName(lang)];
    if (saved === undefined || saved === null) return initial;
    return isPlain(saved) && isPlain(initial) ? ({ ...initial, ...saved } as T) : saved;
  } catch {
    return initial;
  }
}

function writeSlot<T>(key: string, lang: LangCode, value: T) {
  try {
    const raw = localStorage.getItem(key);
    const all = raw ? (JSON.parse(raw) as Record<string, T>) : {};
    all[slotName(lang)] = value;
    localStorage.setItem(key, JSON.stringify(all));
  } catch {
    // storage full / blocked: the in-memory copy still works for this visit
  }
}

/**
 * State that survives a reload. `initial` must be a stable (module-level)
 * value. Two components using the same id stay in step with each other.
 */
export function useStudioState<T>(id: string, lang: LangCode, initial: T) {
  const key = `lange.studio.${id}.v1`;
  const initialRef = useRef(initial);
  const self = useRef<object>({});
  const [state, setState] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = () => setState(readSlot(key, lang, initialRef.current));
    load();
    setReady(true);
    const onSync = (e: Event) => {
      const detail = (e as CustomEvent<SyncDetail>).detail;
      if (detail.key === key && detail.from !== self.current) load();
    };
    window.addEventListener(SYNC_EVENT, onSync);
    return () => window.removeEventListener(SYNC_EVENT, onSync);
  }, [key, lang]);

  const update = useCallback(
    (patch: T | ((prev: T) => T)) => {
      const prev = readSlot(key, lang, initialRef.current);
      const next = typeof patch === "function" ? (patch as (p: T) => T)(prev) : patch;
      writeSlot(key, lang, next);
      setState(next);
      window.dispatchEvent(
        new CustomEvent<SyncDetail>(SYNC_EVENT, { detail: { key, from: self.current } })
      );
    },
    [key, lang]
  );

  return [state, update, ready] as const;
}

/** Which authored phrases the grower has already heard (text shows only after hearing). */
const NO_IDS: string[] = [];
export function useHeard(lang: LangCode) {
  const [heard, setHeard] = useStudioState<string[]>("p3-phrases", lang, NO_IDS);
  const markHeard = useCallback(
    (id: string) => setHeard((prev) => (prev.includes(id) ? prev : [...prev, id])),
    [setHeard]
  );
  return { heard, markHeard };
}

/* ------------------------------------------------------------------ *
 *  Narrator: Nuri speaking authored lines, one at a time, cancellable.
 * ------------------------------------------------------------------ */

const pause = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

export interface SayOptions {
  /** identifies what is playing, for the UI */
  id?: string;
  onStart?: (index: number) => void;
  onEnd?: (index: number) => void;
  /** silence between lines, ms */
  gap?: number;
}

export function useNarrator(lang: LangCode) {
  const [playing, setPlaying] = useState<string | null>(null);
  const token = useRef(0);

  useEffect(
    () => () => {
      token.current += 1;
      stopSpeaking();
    },
    []
  );

  /** Speaks the lines in order. Resolves true when it ran to the end uninterrupted. */
  const say = useCallback(
    async (lines: string[], opts: SayOptions = {}): Promise<boolean> => {
      const mine = ++token.current;
      stopSpeaking();
      setPlaying(opts.id ?? "line");
      for (let i = 0; i < lines.length; i++) {
        if (token.current !== mine) return false;
        opts.onStart?.(i);
        await speak(lines[i], lang);
        if (token.current !== mine) return false;
        opts.onEnd?.(i);
        if (opts.gap && i < lines.length - 1) await pause(opts.gap);
      }
      if (token.current !== mine) return false;
      setPlaying(null);
      return true;
    },
    [lang]
  );

  const stop = useCallback(() => {
    token.current += 1;
    stopSpeaking();
    setPlaying(null);
  }, []);

  return { playing, say, stop };
}

/* ------------------------------------------------------------------ *
 *  Massage-loop bookkeeping. The library knows a recording's marks and
 *  re-listens; this adds WHEN the marks last changed (so a clean listen
 *  afterwards can be told apart) and how long the grower has worked on it.
 * ------------------------------------------------------------------ */

export interface LoopMeta {
  /** resolved/total marks the last time we looked */
  sig: string;
  /** ISO time the marks last changed */
  at: string;
  /** seconds spent with this recording open on a massage bench */
  sec: number;
}

const LOOP_KEY = "lange.studio.p3-loop.v1";

export function readLoop(): Record<string, LoopMeta> {
  try {
    const raw = localStorage.getItem(LOOP_KEY);
    return raw ? (JSON.parse(raw) as Record<string, LoopMeta>) : {};
  } catch {
    return {};
  }
}

function writeLoop(all: Record<string, LoopMeta>) {
  try {
    localStorage.setItem(LOOP_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

const markSig = (it: LibraryItem) => `${it.marks.filter((m) => m.resolved).length}/${it.marks.length}`;

/** Keeps the "marks last changed" stamp current for these recordings. */
export function useLoopMeta(items: LibraryItem[]): Record<string, LoopMeta> {
  const [meta, setMeta] = useState<Record<string, LoopMeta>>({});
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const key = items.map((it) => `${it.id}:${markSig(it)}`).join("|");

  useEffect(() => {
    const all = readLoop();
    const now = new Date().toISOString();
    let changed = false;
    for (const it of itemsRef.current) {
      const sig = markSig(it);
      const prev = all[it.id];
      if (!prev) {
        all[it.id] = { sig, at: it.marks.length ? now : it.createdAt, sec: 0 };
        changed = true;
      } else if (prev.sig !== sig) {
        all[it.id] = { ...prev, sig, at: now };
        changed = true;
      }
    }
    if (changed) writeLoop(all);
    setMeta(all);
  }, [key]);

  return meta;
}

/** Counts the seconds a recording is open on a massage bench (visible tab only). */
export function useMassageClock(id: string): number {
  const [sec, setSec] = useState(0);
  const ref = useRef(0);

  useEffect(() => {
    ref.current = readLoop()[id]?.sec ?? 0;
    setSec(ref.current);
    const save = () => {
      const all = readLoop();
      const prev = all[id];
      if (!prev) return;
      all[id] = { ...prev, sec: ref.current };
      writeLoop(all);
    };
    const tick = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      ref.current += 1;
      if (ref.current % 5 === 0) {
        setSec(ref.current);
        save();
      }
    }, 1000);
    return () => {
      window.clearInterval(tick);
      save();
    };
  }, [id]);

  return sec;
}

export type LoopStage = "listen" | "negotiate" | "relisten" | "done";

export interface LoopInfo {
  stage: LoopStage;
  open: number;
  clarified: number;
  /** full listens since the marks last changed */
  listensSince: number;
  listens: number;
}

/** Where a recording stands in record → listen → flag → negotiate → clean re-listen → done. */
export function loopInfo(item: LibraryItem, meta?: LoopMeta): LoopInfo {
  const open = item.marks.filter((m) => !m.resolved).length;
  const clarified = item.marks.length - open;
  const at = meta?.at ?? item.createdAt;
  const listensSince = item.relistens.filter((r) => r > at).length;
  let stage: LoopStage;
  if (open > 0) stage = "negotiate";
  else if (listensSince > 0) stage = "done";
  else stage = item.marks.length === 0 ? "listen" : "relisten";
  return { stage, open, clarified, listensSince, listens: item.relistens.length };
}

/** Monday of the week `d` falls in, as YYYY-MM-DD (local time). */
export function weekKey(d: Date): string {
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  return isoDay(day);
}

export function isoDay(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dd}`;
}

export const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/** Fisher-Yates; returns a new array. */
export function shuffled<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
