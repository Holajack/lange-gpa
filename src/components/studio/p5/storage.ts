"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LangCode } from "@/lib/types";

/**
 * Small device-local persistence for the Phase 5 trackers (requests, media
 * moments, epics, communities, reading log, ten-step progress).
 *
 * One JSON blob per activity, SLOTTED per signed-in account and per target
 * language: `lange.studio.{activityId}.v1:{owner}:{lang}`. Two people sharing
 * a device never see each other's notes, and a grower growing into two
 * languages keeps two separate workbenches. The owner id is the same one the
 * Word Log and the Listening Library namespace by.
 *
 * SSR-safe: storage is only touched in effects and handlers.
 */

const OWNER_KEY = "lange.profile.owner.v1";
const EVENT = "lange:studio-p5";

function ownerId(): string {
  try {
    return localStorage.getItem(OWNER_KEY) || "local";
  } catch {
    return "local";
  }
}

/** The storage slot for one activity's state. Reads the signed-in owner: call it in effects/handlers only. */
export const studioKey = (activityId: string, lang: LangCode) =>
  `lange.studio.${activityId}.v1:${ownerId()}:${lang}`;

export function readStore<T extends object>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? { ...fallback, ...(parsed as Partial<T>) } : fallback;
  } catch {
    return fallback;
  }
}

function writeStore<T extends object>(key: string, value: T, origin: string) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full / private mode: keep the in-memory copy for this visit
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { key, origin } }));
}

/**
 * One activity's state for this account and language, surviving reloads.
 * `ready` flips once the stored copy is loaded, so tools can avoid flashing
 * an empty tracker. Switching account or language loads the other slot.
 */
export function usePersisted<T extends object>(activityId: string, lang: LangCode, initial: T) {
  const [state, setState] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  const ref = useRef<T>(initial);
  const initialRef = useRef(initial);
  const keyRef = useRef<string | null>(null);
  const origin = useRef(`o-${Math.random().toString(36).slice(2, 10)}`);

  useEffect(() => {
    const key = studioKey(activityId, lang);
    keyRef.current = key;
    const load = () => {
      const next = readStore(key, initialRef.current);
      ref.current = next;
      setState(next);
      setReady(true);
    };
    load();
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<{ key: string; origin: string }>).detail;
      if (detail?.key === key && detail.origin !== origin.current) load();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) load();
    };
    window.addEventListener(EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, [activityId, lang]);

  const set = useCallback(
    (update: T | ((prev: T) => T)) => {
      const next = typeof update === "function" ? (update as (prev: T) => T)(ref.current) : update;
      if (next === ref.current) return;
      ref.current = next;
      setState(next);
      writeStore(keyRef.current ?? studioKey(activityId, lang), next, origin.current);
    },
    [activityId, lang]
  );

  return [state, set, ready] as const;
}

/* ------------------------------- helpers ------------------------------- */

export const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const pad = (n: number) => String(n).padStart(2, "0");

/** Local calendar day (yyyy-mm-dd) of a Date. */
export function dayOf(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const todayIso = () => dayOf(new Date());

/** Local calendar day of an ISO timestamp. */
export const localDay = (iso: string) => dayOf(new Date(iso));

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return dayOf(new Date(y, (m ?? 1) - 1, (d ?? 1) + n));
}

/** Whole days from `from` to `to` (both yyyy-mm-dd, local). */
export function daysBetween(from: string, to: string): number {
  const parse = (day: string) => {
    const [y, m, d] = day.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1).getTime();
  };
  return Math.round((parse(to) - parse(from)) / 86_400_000);
}

/** Monday of the week a local day falls in. */
export function weekStart(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return addDays(day, -((date.getDay() + 6) % 7));
}

/** A yyyy-mm-dd day shown the way this device writes dates. */
export function showDay(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString();
}

/** h:mm:ss (or m:ss under an hour). */
export function fmtClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

/** "1:02:03" / "12:34" / "754" (seconds) → seconds, or null when it isn't a timecode. */
export function parseTimecode(text: string): number | null {
  const clean = text.trim();
  if (!/^\d{1,3}(:\d{1,2}){0,2}$/.test(clean)) return null;
  const parts = clean.split(":").map(Number);
  if (parts.slice(1).some((p) => p > 59)) return null;
  return parts.reduce((total, part) => total * 60 + part, 0);
}
