"use client";

import { useMemo, useState } from "react";
import { Check, Volume2 } from "lucide-react";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import { updateRecording, type LibraryItem } from "@/lib/library";
import { normalizeWord, useWordLog, type WordEntry } from "@/lib/wordLog";
import { speak } from "@/lib/tts";
import { RangePlayer } from "../RangePlayer";
import { accentBtn, BTN_GHOST, Meter, Panel, Stat } from "../ui";

/** The recorded talk about a word, if the grower made one while clarifying. */
function clipFor(word: WordEntry, items: LibraryItem[]): LibraryItem | undefined {
  const clips = items.filter((it) => it.kind === "word" && it.lang === word.lang);
  return (
    clips.find((it) => it.parentId === word.sourceId && word.t !== undefined && it.tags?.includes(`t:${word.t}`)) ??
    clips.find((it) => normalizeWord(it.title) === normalizeWord(word.text))
  );
}

/**
 * The word recording's shrinking copy. Each word in the log is heard again
 * in the grower's own material: the recorded talk about it if there is one,
 * otherwise the moment it was first met. "I own this" takes it out of the
 * next pass. Nothing is erased.
 */
export function WordsTab({ lang, accent, items }: { lang: LangCode; accent: string; items: LibraryItem[] }) {
  const { t } = useApp();
  const { words, review, toggleStrong } = useWordLog(lang);
  const [at, setAt] = useState(0);
  const [showShelf, setShowShelf] = useState(false);

  // oldest first: the order the word recording was made in
  const active = useMemo(() => words.filter((w) => !w.strong).slice().reverse(), [words]);
  const shelf = words.filter((w) => w.strong);
  const current = active[Math.min(at, Math.max(0, active.length - 1))];
  const clip = current ? clipFor(current, items) : undefined;
  const source = current?.sourceId ? items.find((it) => it.id === current.sourceId) : undefined;

  const keep = () => {
    if (!current) return;
    review(current.id);
    setAt((i) => (i + 1 < active.length ? i + 1 : 0));
  };

  const own = () => {
    if (!current) return;
    toggleStrong(current.id);
    if (clip) void updateRecording(clip.id, { familiar: true });
    // the list shortens by one, so the same index is already the next word
    setAt((i) => (i >= active.length - 1 ? 0 : i));
  };

  const bringBack = (word: WordEntry) => {
    toggleStrong(word.id);
    const c = clipFor(word, items);
    if (c) void updateRecording(c.id, { familiar: false });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat value={active.length} label={t("st5_wdActive")} />
        <Stat value={shelf.length} label={t("st5_wdOwned")} />
        <Stat value={words.length} label={t("stc_wlCount")} />
      </div>

      <Panel title={t("st5_wdTitle")} sub={t("st5_wdSub")}>
        {words.length > 0 && (
          <Meter value={shelf.length} max={words.length} accent={accent} label={t("st5_wdOwned")} />
        )}

        {words.length === 0 ? (
          <p className="text-sm text-muted">{t("stc_wlEmpty")}</p>
        ) : !current ? (
          <p className="text-sm text-muted">{t("st5_wdAllOwned")}</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="headline min-w-0 break-words text-2xl text-ink">{current.text}</p>
              <p className="text-xs tabular-nums text-muted">
                {Math.min(at + 1, active.length)}/{active.length}
              </p>
            </div>
            {current.context && <p className="break-words text-sm text-muted">{current.context}</p>}

            {clip ? (
              <div>
                <p className="mb-2 text-xs font-semibold text-muted">{t("st5_wdClip")}</p>
                <RangePlayer item={clip} start={0} end={clip.durationSec} accent={accent} />
              </div>
            ) : source && current.t !== undefined ? (
              <div>
                <p className="mb-2 text-xs font-semibold text-muted">
                  {t("st5_wdMoment")} · {source.title}
                </p>
                <RangePlayer
                  item={source}
                  start={Math.max(0, current.t - 3)}
                  end={current.t + 12}
                  accent={accent}
                />
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => void speak(current.text, lang)} className={BTN_GHOST}>
                  <Volume2 size={15} strokeWidth={2.5} aria-hidden /> {t("stc_wlHearIt")}
                </button>
                <p className="min-w-0 flex-1 basis-48 text-xs leading-relaxed text-muted">{t("st5_wdModelVoice")}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={keep} className={BTN_GHOST}>
                {t("st5_wdKeep")}
              </button>
              <button type="button" onClick={own} {...accentBtn(accent)}>
                <Check size={15} strokeWidth={3} aria-hidden /> {t("stc_wlStrong")}
              </button>
            </div>
            <p className="text-xs leading-relaxed text-muted">
              {t("st5_wdReviews").replace("{n}", String(current.reviews))}
            </p>
          </div>
        )}
      </Panel>

      {shelf.length > 0 && (
        <Panel
          title={`${t("st5_wdShelf")} · ${shelf.length}`}
          sub={t("st5_wdShelfSub")}
          right={
            <button type="button" onClick={() => setShowShelf((v) => !v)} aria-expanded={showShelf} className={BTN_GHOST}>
              {showShelf ? t("st5_hide") : t("st5_show")}
            </button>
          }
        >
          {showShelf && (
            <ul className="flex flex-wrap gap-2">
              {shelf.map((w) => (
                <li key={w.id}>
                  <button
                    type="button"
                    onClick={() => bringBack(w)}
                    title={t("st5_bringBack")}
                    aria-label={`${t("st5_bringBack")}: ${w.text}`}
                    className="pill min-h-10 border border-line bg-white/5 px-3 py-2 text-sm font-semibold text-ink"
                  >
                    {w.text} <span className="text-xs text-muted">↩</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}
    </div>
  );
}
