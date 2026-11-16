"use client";

import { useCallback, useEffect, useState } from "react";
import type { LangCode } from "@/lib/types";

/**
 * Device-local state for the Phase 6 tools.
 *
 * One localStorage key per activity (`lange.studio.{activityId}.v1`). Inside
 * it, state is slotted per signed-in account and per host language, so two
 * people sharing a device, or one person growing into two languages, never
 * see each other's weeks. A tool can read another tool's state through the
 * same hook (the pipeline reads the needs analysis; the weekly card reads
 * three of them) and stays live through a window event.
 */

const OWNER_KEY = "lange.profile.owner.v1";
const EVENT = "lange:studio-p6";

/** this tab's last write per key: used only when storage is blocked or full */
const mem = new Map<string, string>();
/** keys whose last write never reached localStorage */
const unsaved = new Set<string>();

export const storageKey = (activityId: string) => `lange.studio.${activityId}.v1`;

function slotKey(lang: LangCode): string {
  let owner = "local";
  try {
    owner = localStorage.getItem(OWNER_KEY) || "local";
  } catch {
    // storage blocked: single in-memory slot
  }
  return `${owner}:${lang}`;
}

function readAll(key: string): Record<string, unknown> {
  let raw: string | null = null;
  if (unsaved.has(key)) {
    raw = mem.get(key) ?? null;
  } else {
    try {
      raw = localStorage.getItem(key);
    } catch {
      raw = mem.get(key) ?? null;
    }
  }
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function loadStore<T extends object>(activityId: string, lang: LangCode, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const value = readAll(storageKey(activityId))[slotKey(lang)];
  return value && typeof value === "object" ? { ...fallback, ...(value as Partial<T>) } : fallback;
}

export function saveStore<T extends object>(activityId: string, lang: LangCode, value: T): void {
  if (typeof window === "undefined") return;
  const key = storageKey(activityId);
  const raw = JSON.stringify({ ...readAll(key), [slotKey(lang)]: value });
  mem.set(key, raw);
  try {
    localStorage.setItem(key, raw);
    unsaved.delete(key);
  } catch {
    unsaved.add(key); // private mode / quota: the in-memory copy carries this visit
  }
  window.dispatchEvent(new CustomEvent<string>(EVENT, { detail: activityId }));
}

/**
 * Persistent state for one activity. `initial` must be a stable reference
 * (a module-level constant): it is the SSR value and the shape new fields
 * default from.
 */
export function useStudioStore<T extends object>(activityId: string, lang: LangCode, initial: T) {
  const [state, setState] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = () => {
      setState(loadStore(activityId, lang, initial));
      setReady(true);
    };
    load();
    const onLocal = (e: Event) => {
      if ((e as CustomEvent<string>).detail === activityId) load();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKey(activityId)) return;
      load(); // another tab wrote: re-read its copy
    };
    window.addEventListener(EVENT, onLocal);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT, onLocal);
      window.removeEventListener("storage", onStorage);
    };
  }, [activityId, lang, initial]);

  /** Apply a change on top of the freshest stored value, then persist it. */
  const update = useCallback(
    (fn: (prev: T) => T) => {
      saveStore(activityId, lang, fn(loadStore(activityId, lang, initial)));
    },
    [activityId, lang, initial]
  );

  return { state, update, ready };
}
