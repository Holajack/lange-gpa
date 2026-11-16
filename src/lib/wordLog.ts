"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LangCode, PhaseId } from "./types";
import { useApp } from "./store";

/**
 * THE WORD LOG — the grower's own running record of words met in real speech.
 *
 * Phase 1 words are picture cards (vocab.ts). From Phase 2 on the fixed deck
 * runs out: words now come from stories, life histories and overheard talk,
 * so the log is freeform, written in the HOST language, and each entry points
 * back at the recording + second it was heard in. No translations are stored:
 * meaning lives in the recording you can re-play.
 *
 * Device-local (localStorage, namespaced per account). From Phase 2 on, each
 * new word also counts once toward profile.wordsMet via a stable `wl:` id.
 */

export interface WordEntry {
  id: string;
  lang: LangCode;
  /** the word or short phrase, in the host language */
  text: string;
  /** the sentence / situation it was heard in (host language) */
  context?: string;
  /** library recording it came from */
  sourceId?: string;
  /** second within that recording */
  t?: number;
  phase: PhaseId;
  addedAt: string;
  /** how many times it has been revisited */
  reviews: number;
  /** the grower now owns this word */
  strong?: boolean;
}

const KEY_BASE = "lange.wordlog.v1";
const OWNER_KEY = "lange.profile.owner.v1";
const EVENT = "lange:wordlog";

function storageKey(): string {
  try {
    return `${KEY_BASE}:${localStorage.getItem(OWNER_KEY) || "local"}`;
  } catch {
    return `${KEY_BASE}:local`;
  }
}

function read(): WordEntry[] {
  try {
    const raw = localStorage.getItem(storageKey());
    return raw ? (JSON.parse(raw) as WordEntry[]) : [];
  } catch {
    return [];
  }
}

function write(entries: WordEntry[]) {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(entries));
  } catch {
    // storage full / private mode — keep the in-memory copy for this visit
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

export const normalizeWord = (text: string) => text.trim().toLocaleLowerCase().replace(/\s+/g, " ");

export const wordLogId = (lang: LangCode, text: string) => `wl:${lang}:${normalizeWord(text)}`;

export function eraseWordLog() {
  try {
    localStorage.removeItem(storageKey());
  } catch {}
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENT));
}

export function useWordLog(lang?: LangCode) {
  const { profile, updateProfile } = useApp();
  const [entries, setEntries] = useState<WordEntry[]>([]);

  useEffect(() => {
    const load = () => setEntries(read());
    load();
    window.addEventListener(EVENT, load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener(EVENT, load);
      window.removeEventListener("storage", load);
    };
  }, []);

  const activeLang = lang ?? profile?.targetLang;
  const words = useMemo(
    () =>
      entries
        .filter((e) => !activeLang || e.lang === activeLang)
        .sort((a, b) => b.addedAt.localeCompare(a.addedAt)),
    [entries, activeLang]
  );

  /** Add a word. Returns the entry, or null when it was blank or already logged. */
  const add = useCallback(
    (
      text: string,
      extra: Partial<Pick<WordEntry, "context" | "sourceId" | "t" | "phase">> = {}
    ): WordEntry | null => {
      const clean = text.trim().slice(0, 80);
      const entryLang = activeLang;
      if (!clean || !entryLang) return null;
      const id = wordLogId(entryLang, clean);
      const all = read();
      if (all.some((e) => e.id === id)) return null;
      const entry: WordEntry = {
        id,
        lang: entryLang,
        text: clean,
        context: extra.context?.trim().slice(0, 160) || undefined,
        sourceId: extra.sourceId,
        t: extra.t,
        phase: extra.phase ?? profile?.phase ?? 2,
        addedAt: new Date().toISOString(),
        reviews: 0,
      };
      write([...all, entry]);
      // Count it once toward words met — from Phase 2 on only. Phase 1's word
      // count is picture cards met in meetings and feeds the advancement gates;
      // a typed log entry must never be able to move those.
      if (profile && profile.phase >= 2 && !(profile.wordIds ?? []).includes(id)) {
        updateProfile({
          wordIds: [...(profile.wordIds ?? []), id],
          wordsMet: profile.wordsMet + 1,
        });
      }
      return entry;
    },
    [activeLang, profile, updateProfile]
  );

  const remove = useCallback((id: string) => {
    write(read().filter((e) => e.id !== id));
  }, []);

  const review = useCallback((id: string) => {
    write(read().map((e) => (e.id === id ? { ...e, reviews: e.reviews + 1 } : e)));
  }, []);

  const toggleStrong = useCallback((id: string) => {
    write(read().map((e) => (e.id === id ? { ...e, strong: !e.strong } : e)));
  }, []);

  return { words, add, remove, review, toggleStrong };
}
