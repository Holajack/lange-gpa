"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Minus, Plus, X } from "lucide-react";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import { Callout, textOn } from "../StudioShell";
import { newId, useStudioState, weekKey } from "./hooks";

/**
 * The two small pieces several Phase 3 tools share: the pair's Idea Board
 * (four running lists) and the "people beyond your nurturer" reminder.
 */

/* ------------------------------ idea board -------------------------- */

export type IdeaList = "stories" | "outings" | "props" | "scripts";

interface Idea {
  id: string;
  text: string;
  done?: boolean;
}

type IdeaState = Record<IdeaList, Idea[]>;

const EMPTY_IDEAS: IdeaState = { stories: [], outings: [], props: [], scripts: [] };

const IDEA_LISTS: { id: IdeaList; labelKey: string; emoji: string }[] = [
  { id: "stories", labelKey: "st3_ibStories", emoji: "📖" },
  { id: "outings", labelKey: "st3_ibOutings", emoji: "🚶" },
  { id: "props", labelKey: "st3_ibProps", emoji: "🏺" },
  { id: "scripts", labelKey: "st3_ibScripts", emoji: "🧾" },
];

/**
 * The pair's four running lists. Kept on this device; either person can add
 * to it whenever an idea comes up, and tick things off once they've happened.
 */
export function IdeaBoard({
  lang,
  focus,
  accent,
  suggestions = [],
  onPick,
  pickLabel,
}: {
  lang: LangCode;
  /** the list this tool is about (opens on it; suggestions and "use" apply to it) */
  focus: IdeaList;
  accent: string;
  /** starter ideas for the focused list, in the interface language */
  suggestions?: string[];
  onPick?: (text: string) => void;
  pickLabel?: string;
}) {
  const { t } = useApp();
  const [ideas, setIdeas] = useStudioState<IdeaState>("p3-ideas", lang, EMPTY_IDEAS);
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<IdeaList>(focus);
  const [draft, setDraft] = useState("");

  const list = ideas[tab] ?? [];
  const has = (text: string) => list.some((i) => i.text.toLocaleLowerCase() === text.trim().toLocaleLowerCase());

  const add = (text: string) => {
    const clean = text.trim().slice(0, 100);
    if (!clean || has(clean)) return;
    setIdeas((prev) => ({ ...prev, [tab]: [...(prev[tab] ?? []), { id: newId("idea"), text: clean }] }));
  };
  const patch = (fn: (items: Idea[]) => Idea[]) =>
    setIdeas((prev) => ({ ...prev, [tab]: fn(prev[tab] ?? []) }));

  const fresh = tab === focus ? suggestions.filter((s) => !has(s)) : [];

  return (
    <div className="rounded-3xl border border-line bg-raised-2 p-4 sm:p-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between gap-3 text-left"
      >
        <span>
          <span className="block text-sm font-semibold text-ink">🗂️ {t("st3_ibTitle")}</span>
          <span className="block text-xs text-muted">{t("st3_ibSub")}</span>
        </span>
        <ChevronDown
          size={16}
          strokeWidth={2.5}
          className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <div role="group" aria-label={t("st3_ibTitle")} className="flex flex-wrap gap-2">
            {IDEA_LISTS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setTab(l.id)}
                aria-pressed={tab === l.id}
                className={`pill min-h-10 px-3 py-2 text-xs font-bold ${
                  tab === l.id ? "bg-white/15 text-ink" : "bg-white/5 text-muted"
                }`}
              >
                <span aria-hidden>{l.emoji}</span> {t(l.labelKey)}
                <span className="tabular-nums opacity-70">{(ideas[l.id] ?? []).length}</span>
              </button>
            ))}
          </div>

          {list.length === 0 && <p className="text-sm text-muted">{t("st3_ibEmpty")}</p>}
          <ul className="space-y-2">
            {list.map((idea) => (
              <li key={idea.id} className="flex items-center gap-2 rounded-2xl border border-line bg-canvas px-3 py-2">
                <label className="flex min-h-10 min-w-0 flex-1 cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={Boolean(idea.done)}
                    onChange={(e) =>
                      patch((items) => items.map((i) => (i.id === idea.id ? { ...i, done: e.target.checked } : i)))
                    }
                    aria-label={`${t("st3_ibDone")}: ${idea.text}`}
                    className="h-4 w-4 shrink-0 accent-[var(--color-mint)]"
                  />
                  <span className={`min-w-0 break-words text-sm ${idea.done ? "text-muted line-through" : "text-ink"}`}>
                    {idea.text}
                  </span>
                </label>
                {onPick && tab === focus && (
                  <button
                    type="button"
                    onClick={() => onPick(idea.text)}
                    className={`pill min-h-10 shrink-0 px-3 py-1.5 text-xs font-bold ${textOn(accent)}`}
                    style={{ background: accent }}
                  >
                    {pickLabel ?? t("st3_ibUse")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => patch((items) => items.filter((i) => i.id !== idea.id))}
                  aria-label={`${t("st3_ibRemove")}: ${idea.text}`}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-muted hover:text-coral"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </li>
            ))}
          </ul>

          {fresh.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-muted">{t("st3_ibSuggest")}</p>
              <div className="flex flex-wrap gap-2">
                {fresh.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => add(s)}
                    className="pill min-h-10 border border-dashed border-white/20 bg-white/4 px-3 py-2 text-xs font-semibold text-ink"
                  >
                    <Plus size={12} strokeWidth={3} aria-hidden /> {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              add(draft);
              setDraft("");
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t("st3_ibAddPlaceholder")}
              aria-label={t("st3_ibAddPlaceholder")}
              maxLength={100}
              className="min-w-0 flex-1 rounded-2xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-white/30"
            />
            <button type="submit" className="pill min-h-11 bg-white/10 px-4 py-2.5 text-sm font-bold text-ink">
              <Plus size={14} strokeWidth={3} aria-hidden /> {t("st3_ibAdd")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

/* --------------------------- social reminder ------------------------ */

interface SocialWeek {
  done: boolean;
  minutes: number;
}
type SocialState = Record<string, SocialWeek>;
const EMPTY_SOCIAL: SocialState = {};

/**
 * The second half of this phase asks for real time with host people beyond
 * the nurturer. A reminder and a private tally, never a gate.
 */
export function SocialReminder({ lang }: { lang: LangCode }) {
  const { t } = useApp();
  const [weeks, setWeeks] = useStudioState<SocialState>("p3-social", lang, EMPTY_SOCIAL);
  const [wk, setWk] = useState("");
  useEffect(() => setWk(weekKey(new Date())), []);

  const week = weeks[wk] ?? { done: false, minutes: 0 };
  const set = (next: SocialWeek) => wk && setWeeks((prev) => ({ ...prev, [wk]: next }));
  const hours = (week.minutes / 60).toFixed(1).replace(/\.0$/, "");

  return (
    <Callout icon="🫖" title={t("st3_soTitle")}>
      <p>{t("st3_soBody")}</p>
      <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-ink">
        <input
          type="checkbox"
          checked={week.done}
          onChange={(e) => set({ ...week, done: e.target.checked })}
          className="h-4 w-4 shrink-0 accent-[var(--color-mint)]"
        />
        {t("st3_soCheck")}
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => set({ ...week, minutes: Math.max(0, week.minutes - 30) })}
          disabled={week.minutes === 0}
          aria-label={t("st3_soLess")}
          className="pill h-11 w-11 justify-center border border-line bg-white/6 p-0 text-ink disabled:opacity-40"
        >
          <Minus size={15} strokeWidth={3} />
        </button>
        <span className="min-w-24 text-center text-sm font-semibold tabular-nums text-ink" aria-live="polite">
          {t("st3_soHours").replace("{n}", hours)}
        </span>
        <button
          type="button"
          onClick={() => set({ ...week, minutes: week.minutes + 30 })}
          aria-label={t("st3_soMore")}
          className="pill h-11 w-11 justify-center border border-line bg-white/6 p-0 text-ink"
        >
          <Plus size={15} strokeWidth={3} />
        </button>
      </div>
      <p className="mt-2 text-xs">{t("st3_soSoft")}</p>
    </Callout>
  );
}
