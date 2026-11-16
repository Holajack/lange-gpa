"use client";

import { useState } from "react";
import { Check, Mic, Play, Plus, Trash2 } from "lucide-react";
import type { LangCode } from "@/lib/types";
import { useApp } from "@/lib/store";
import { fmtDuration, updateRecording, type LibraryItem, type Mark } from "@/lib/library";
import { useWordLog } from "@/lib/wordLog";
import { RecordPanel } from "../RecordPanel";
import { TAG } from "./discourse";
import { DraftInput } from "./ui";

/**
 * The flagged moments inside one stretch: what it turned out to be, what
 * kind of gap it was, the word it gave you, and (the guide's "word
 * recording") a short recording of the talk about that word.
 * Notes are the grower's own; the app never fills them in.
 */

export const P5_GAPS = ["fast", "word", "sense", "life", "joke"] as const;
export type P5Gap = (typeof P5_GAPS)[number];

/** The Phase 5 gap list, labeled, for the shared ClarifyPlayer / RecordingList. */
export function useGapTypes(): { id: string; label: string }[] {
  const { t } = useApp();
  return P5_GAPS.map((id) => ({ id, label: t(`st5_gap_${id}`) }));
}

export function newMark(t: number): Mark {
  return {
    id: `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    t,
    kind: "unclear",
  };
}

export function addMark(itemId: string, t: number) {
  return updateRecording(itemId, (prev) => ({ marks: [...prev.marks, newMark(t)].sort((a, b) => a.t - b.t) }));
}

export const marksIn = (item: LibraryItem, start: number, end: number): Mark[] =>
  item.marks.filter((m) => m.t >= start && (end <= start || m.t < end)).sort((a, b) => a.t - b.t);

export function MarkList({
  item,
  start,
  end,
  accent,
  lang,
  activityId,
  onJump,
  wordRecorder = true,
  emptyText,
}: {
  item: LibraryItem;
  start: number;
  /** ≤ start means "to the end of the recording" */
  end: number;
  accent: string;
  lang: LangCode;
  /** activity the word recordings are filed under */
  activityId: string;
  onJump: (t: number) => void;
  wordRecorder?: boolean;
  emptyText?: string;
}) {
  const { t } = useApp();
  const words = useWordLog(lang);
  const [wordFor, setWordFor] = useState<string | null>(null);
  const [wordText, setWordText] = useState("");
  const [wordMsg, setWordMsg] = useState<string | null>(null);
  const [recFor, setRecFor] = useState<string | null>(null);

  const marks = marksIn(item, start, end);
  const patch = (fn: (marks: Mark[]) => Mark[]) => updateRecording(item.id, (prev) => ({ marks: fn(prev.marks) }));
  const patchOne = (id: string, change: Partial<Mark>) =>
    patch((all) => all.map((m) => (m.id === id ? { ...m, ...change } : m)));

  const logWord = (mark: Mark) => {
    const added = words.add(wordText, { sourceId: item.id, t: mark.t, phase: 5, context: mark.note });
    if (!added) {
      setWordMsg(wordText.trim() ? t("stc_wlDup") : null);
      return;
    }
    setWordText("");
    setWordFor(null);
    setWordMsg(null);
  };

  if (marks.length === 0) {
    return <p className="text-sm text-muted">{emptyText ?? t("stc_plNoMarks")}</p>;
  }

  return (
    <ul className="space-y-2">
      {marks.map((m) => {
        const logged = words.words.filter((w) => w.sourceId === item.id && w.t === m.t);
        return (
          <li key={m.id} className="rounded-2xl border border-line bg-canvas p-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onJump(Math.max(start, m.t - 1))}
                title={t("stc_plJump")}
                className="pill min-h-10 bg-white/8 px-3 py-2 text-xs font-bold tabular-nums text-ink"
              >
                <Play size={11} strokeWidth={3} aria-hidden /> {fmtDuration(m.t)}
              </button>
              <DraftInput
                value={m.note ?? ""}
                label={t("st5_markNote")}
                maxLength={160}
                className="min-w-0 flex-1 basis-40 rounded-xl border border-line bg-raised px-3 py-2 text-sm text-ink outline-none focus:border-white/30"
                onCommit={(note) => patchOne(m.id, { note: note.trim() || undefined })}
              />
              <button
                type="button"
                onClick={() => patchOne(m.id, { resolved: !m.resolved })}
                aria-pressed={Boolean(m.resolved)}
                className={`pill min-h-10 px-3 py-2 text-xs font-bold ${
                  m.resolved ? "bg-mint text-canvas" : "bg-white/8 text-muted"
                }`}
              >
                {m.resolved && <Check size={12} strokeWidth={3} aria-hidden />}
                {m.resolved ? t("stc_plClarified") : t("stc_plOpen")}
              </button>
              <button
                type="button"
                onClick={() => patch((all) => all.filter((x) => x.id !== m.id))}
                aria-label={t("st5_markRemove")}
                title={t("st5_markRemove")}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-muted hover:text-coral"
              >
                <Trash2 size={13} strokeWidth={2.5} />
              </button>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <select
                value={m.gap ?? ""}
                onChange={(e) => patchOne(m.id, { gap: e.target.value || undefined })}
                aria-label={t("stc_plGap")}
                className="min-h-10 max-w-full rounded-xl border border-line bg-raised px-3 py-2 text-xs text-ink outline-none"
              >
                <option value="">{t("stc_plGap")}</option>
                {P5_GAPS.map((g) => (
                  <option key={g} value={g}>
                    {t(`st5_gap_${g}`)}
                  </option>
                ))}
              </select>

              {logged.map((w) => (
                <span key={w.id} className="rounded-full bg-white/8 px-3 py-1.5 text-xs font-semibold text-ink">
                  {w.text}
                </span>
              ))}

              {wordFor === m.id ? (
                <form
                  className="flex min-w-0 flex-1 basis-56 flex-wrap items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    logWord(m);
                  }}
                >
                  <input
                    autoFocus
                    value={wordText}
                    onChange={(e) => {
                      setWordText(e.target.value);
                      setWordMsg(null);
                    }}
                    placeholder={t("stc_wlAddPlaceholder")}
                    aria-label={t("stc_wlAddPlaceholder")}
                    maxLength={80}
                    className="min-w-0 flex-1 rounded-xl border border-line bg-raised px-3 py-2 text-sm text-ink outline-none focus:border-white/30"
                  />
                  <button
                    type="submit"
                    className="pill min-h-10 bg-white/15 px-3 py-2 text-xs font-bold text-ink"
                  >
                    {t("stc_wlAdd")}
                  </button>
                  {wordMsg && <span className="text-xs text-amber">{wordMsg}</span>}
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setWordFor(m.id);
                    setWordText("");
                    setWordMsg(null);
                  }}
                  className="pill min-h-10 bg-white/6 px-3 py-2 text-xs font-semibold text-ink"
                >
                  <Plus size={12} strokeWidth={3} aria-hidden /> {t("stc_plAddWord")}
                </button>
              )}

              {wordRecorder && (
                <button
                  type="button"
                  onClick={() => setRecFor(recFor === m.id ? null : m.id)}
                  aria-expanded={recFor === m.id}
                  className="pill min-h-10 bg-white/6 px-3 py-2 text-xs font-semibold text-ink"
                >
                  <Mic size={12} strokeWidth={2.5} aria-hidden /> {t("st5_wordRecOpen")}
                </button>
              )}
            </div>

            {wordRecorder && recFor === m.id && (
              <div className="mt-3 space-y-2">
                <p className="text-xs leading-relaxed text-muted">{t("st5_wordRecHint")}</p>
                <RecordPanel
                  lang={lang}
                  phase={5}
                  activityId={activityId}
                  kind="word"
                  defaultTitle={logged[0]?.text ?? (m.note || `${t("st5_wordRecTitle")} ${fmtDuration(m.t)}`)}
                  accent={accent}
                  speaker="both"
                  parentId={item.id}
                  tags={[TAG.wordRec, `t:${m.t}`]}
                  showConsent
                  label={t("st5_wordRecStart")}
                  onSaved={() => setRecFor(null)}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
