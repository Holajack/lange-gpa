"use client";

import { useEffect, useRef, useState } from "react";
import { Square, Volume2 } from "lucide-react";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import { speak, stopSpeaking } from "@/lib/tts";
import { textOn } from "../StudioShell";
import { hostLines, STORIES, type Story } from "./content";
import { PanelThumb, ScenePanel } from "./Panel";
import { Segmented } from "./kit";

/* Pieces the two story tools (describe, story-building) share. */

export type PictureSource = "builtin" | "own";

export const storyById = (id: string): Story => STORIES.find((s) => s.id === id) ?? STORIES[0];
export const storyNumber = (id: string): number => Math.max(0, STORIES.findIndex((s) => s.id === id)) + 1;

/** "🧦 Picture story 1" — the neutral name used on cards and recording titles. */
export function useStoryName() {
  const { t } = useApp();
  return (story: Story) => `${story.icon} ${t("st2_storyN").replace("{n}", String(storyNumber(story.id)))}`;
}

/** Built-in wordless stories, or pages of a book the grower owns. */
export function SourceSwitch({
  value,
  onChange,
  builtinLabel,
}: {
  value: PictureSource;
  onChange: (v: PictureSource) => void;
  builtinLabel: string;
}) {
  const { t } = useApp();
  return (
    <Segmented
      value={value}
      onChange={onChange}
      label={t("st2_srcLabel")}
      options={[
        { id: "builtin", label: builtinLabel, icon: "🖼️" },
        { id: "own", label: t("st2_srcOwn"), icon: "📷" },
      ]}
    />
  );
}

/** Covers of the built-in stories. The cover is page one — no titles, the pictures tell it. */
export function StoryPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { t } = useApp();
  const name = useStoryName();
  return (
    <div className="grid grid-cols-3 gap-3">
      {STORIES.map((story) => (
        <div key={story.id} className="min-w-0">
          <PanelThumb
            panel={story.panels[0]}
            label={name(story)}
            selected={value === story.id}
            onClick={() => onChange(story.id)}
            className="w-full"
          />
          <p className="mt-1.5 truncate text-xs font-semibold text-ink">{name(story)}</p>
          <p className="text-[11px] text-muted">
            {t("st2_pagesN").replace("{n}", String(story.panels.length))}
          </p>
        </div>
      ))}
    </div>
  );
}

/** A row of page thumbnails — "let her flip through the whole book first". */
export function PageStrip({
  story,
  page,
  onPage,
  done = [],
}: {
  story: Story;
  page: number;
  onPage: (i: number) => void;
  done?: number[];
}) {
  const { t } = useApp();
  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1">
      {story.panels.map((panel, i) => (
        <PanelThumb
          key={panel.id}
          panel={panel}
          label={t("st2_pageN").replace("{n}", String(i + 1))}
          selected={page === i}
          onClick={() => onPage(i)}
          badge={done.includes(i) ? "✓" : i + 1}
          className="w-24 shrink-0"
        />
      ))}
    </div>
  );
}

/**
 * End of the book: the whole story in story form (past tense), page by page.
 * This is Nuri reading authored lines — extra listening, not the nurturer's
 * own telling of a story the two of you built.
 */
export function StoryFormPlayer({
  story,
  lang,
  accent,
  onHeard,
}: {
  story: Story;
  lang: LangCode;
  accent: string;
  onHeard?: () => void;
}) {
  const { t } = useApp();
  const [page, setPage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const token = useRef(0);

  useEffect(
    () => () => {
      token.current += 1;
      stopSpeaking();
    },
    []
  );
  useEffect(() => {
    token.current += 1;
    stopSpeaking();
    setPlaying(false);
    setPage(0);
  }, [story.id]);

  const pages = story.panels.map((p) => hostLines(p.past, lang));
  if (pages.some((p) => !p)) return null;

  const stop = () => {
    token.current += 1;
    stopSpeaking();
    setPlaying(false);
  };

  const play = async () => {
    const mine = ++token.current;
    setPlaying(true);
    for (let i = 0; i < pages.length; i++) {
      if (token.current !== mine) return;
      setPage(i);
      for (const line of pages[i] ?? []) {
        if (token.current !== mine) return;
        await speak(line, lang);
      }
    }
    if (token.current !== mine) return;
    setPlaying(false);
    onHeard?.();
  };

  return (
    <div className="space-y-3">
      <div className="mx-auto max-w-xl">
        <ScenePanel panel={story.panels[page]} label={t("st2_pageN").replace("{n}", String(page + 1))} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={playing ? stop : play}
          className={`pill min-h-11 px-5 py-2.5 text-sm font-bold ${textOn(accent)}`}
          style={{ background: accent }}
        >
          {playing ? <Square size={14} strokeWidth={3} /> : <Volume2 size={16} strokeWidth={2.5} />}
          {playing ? t("st2_stop") : t("st2_hearStory")}
        </button>
        <span className="flex items-center gap-1.5" aria-hidden>
          {story.panels.map((p, i) => (
            <span
              key={p.id}
              className={`h-2 rounded-full transition-all ${i === page ? "w-6" : "w-2"}`}
              style={{ background: i === page ? accent : "rgba(255,255,255,0.16)" }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
