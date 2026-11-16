"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Flag, Pause, Play, Plus, RotateCcw, RotateCw, Trash2 } from "lucide-react";
import { useApp } from "@/lib/store";
import {
  deleteRecording,
  fmtDuration,
  logRelisten,
  updateRecording,
  useBlobUrl,
  useLibrary,
  type LibraryItem,
  type Mark,
} from "@/lib/library";
import { useWordLog } from "@/lib/wordLog";

/**
 * ClarifyPlayer — the multi-take recording primitive shared by every phase
 * (Phase 2's "clarifying the recording", Phase 3's "massaging", Phase 4's
 * gap-hunting, Phase 5's discourse clarifying, Phase 6's pipeline).
 *
 * The shape is always the same: play real speech → mark the second you get
 * lost → negotiate it with a person → note what it was / log the word →
 * mark it understood → listen again. The app never explains the audio
 * itself; the marks are questions to bring to a human.
 */

const SPEEDS = [0.6, 0.8, 1] as const;

/**
 * A mark's note. Typing stays local and is saved on blur / Enter — writing
 * to IndexedDB on every keystroke round-trips through an async re-render and
 * can drop characters.
 */
function NoteInput({
  value,
  placeholder,
  onCommit,
}: {
  value: string;
  placeholder: string;
  onCommit: (note: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setDraft(value);
  }, [value]);
  const commit = () => {
    if (draft !== value) onCommit(draft);
  };
  return (
    <input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={() => {
        focused.current = false;
        commit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      placeholder={placeholder}
      maxLength={160}
      className="min-w-0 flex-1 rounded-xl border border-line bg-raised px-3 py-1.5 text-sm text-ink outline-none focus:border-white/30"
    />
  );
}

export interface GapType {
  id: string;
  label: string;
}

export function ClarifyPlayer({
  item,
  accent,
  gapTypes,
  moves,
  allowWords = true,
  allowDelete = true,
  onDeleted,
}: {
  item: LibraryItem;
  /** css color of the phase */
  accent: string;
  /** optional phase-specific gap taxonomy offered on each marked moment */
  gapTypes?: GapType[];
  /** things to SAY to your nurturer about a marked moment (host-language prompts or labels) */
  moves?: string[];
  allowWords?: boolean;
  allowDelete?: boolean;
  onDeleted?: () => void;
}) {
  const { t } = useApp();
  const { all } = useLibrary();
  const live = all.find((it) => it.id === item.id) ?? item;
  const url = useBlobUrl(item.id);
  const words = useWordLog(live.lang);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [rate, setRate] = useState<(typeof SPEEDS)[number]>(1);
  const [wordFor, setWordFor] = useState<string | null>(null);
  const [wordText, setWordText] = useState("");
  const [wordMsg, setWordMsg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const countedRef = useRef(false);

  // MediaRecorder webm blobs report duration=Infinity — trust the stored length.
  const total = Math.max(live.durationSec, 1);

  useEffect(() => {
    const el = audioRef.current;
    if (el) el.playbackRate = rate;
  }, [rate, url]);

  useEffect(() => {
    countedRef.current = false;
    setPlaying(false);
    setCur(0);
  }, [item.id]);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => setPlaying(false));
    else el.pause();
  }, []);

  const seek = useCallback(
    (to: number) => {
      const el = audioRef.current;
      if (!el) return;
      const clamped = Math.max(0, Math.min(to, total));
      try {
        el.currentTime = clamped;
      } catch {
        // unseekable stream — ignore
      }
      setCur(clamped);
    },
    [total]
  );

  const patchMarks = (fn: (marks: Mark[]) => Mark[]) =>
    updateRecording(live.id, (prev) => ({ marks: fn(prev.marks) }));

  const flag = () => {
    const at = Math.max(0, Math.round((audioRef.current?.currentTime ?? cur) - 2));
    const mark: Mark = {
      id: `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      t: at,
      kind: "unclear",
    };
    patchMarks((marks) => [...marks, mark].sort((a, b) => a.t - b.t));
  };

  const addWord = (mark: Mark) => {
    const added = words.add(wordText, { sourceId: live.id, t: mark.t, phase: live.phase, context: mark.note });
    if (!added) {
      setWordMsg(wordText.trim() ? t("stc_wlDup") : null);
      return;
    }
    setWordText("");
    setWordFor(null);
    setWordMsg(null);
  };

  const marks = [...live.marks].sort((a, b) => a.t - b.t);
  // On the grower's own speech a flag means "work on this spot", not "I got lost".
  const ownSpeech =
    live.speaker === "me" || ["feedback", "retell", "description", "journal"].includes(live.kind);

  return (
    <div className="rounded-3xl border border-line bg-raised-2 p-4 sm:p-5">
      {url ? (
        <audio
          ref={audioRef}
          src={url}
          preload="auto"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => setCur(e.currentTarget.currentTime)}
          onEnded={() => {
            setPlaying(false);
            if (!countedRef.current) {
              countedRef.current = true;
              logRelisten(live.id);
            }
          }}
        />
      ) : (
        <p className="text-sm text-muted">{t("stc_plLoading")}</p>
      )}

      {/* title row */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="truncate font-semibold text-ink">{live.title}</h4>
          <p className="text-xs text-muted">
            {t(`stc_kind_${live.kind}`)} · {fmtDuration(live.durationSec)} · {t("stc_plHeard")}{" "}
            {live.relistens.length}×
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-muted">
          <input
            type="checkbox"
            checked={Boolean(live.familiar)}
            onChange={(e) => updateRecording(live.id, { familiar: e.target.checked })}
            className="h-4 w-4 accent-[var(--color-mint)]"
          />
          {t("stc_plFamiliar")}
        </label>
      </div>

      {/* scrubber with marks */}
      <div className="mt-4">
        <div className="relative">
          <input
            type="range"
            min={0}
            max={total}
            step={0.5}
            value={Math.min(cur, total)}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label={live.title}
            className="w-full"
            style={{ accentColor: accent }}
          />
          <div className="pointer-events-none absolute inset-x-2 -bottom-1 h-2">
            {marks.map((m) => (
              <span
                key={m.id}
                className="absolute top-0 h-2 w-2 -translate-x-1/2 rounded-full"
                style={{
                  left: `${(m.t / total) * 100}%`,
                  background: m.resolved ? "var(--color-mint)" : "var(--color-coral)",
                }}
              />
            ))}
          </div>
        </div>
        <div className="mt-2 flex justify-between text-xs tabular-nums text-muted">
          <span>{fmtDuration(cur)}</span>
          <span>{fmtDuration(total)}</span>
        </div>
      </div>

      {/* transport */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => seek(cur - 5)}
          aria-label={t("stc_plBack")}
          className="pill h-11 w-11 justify-center border border-line bg-white/6 p-0 text-ink"
        >
          <RotateCcw size={16} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={toggle}
          disabled={!url}
          aria-label={playing ? t("stc_plPause") : t("stc_plPlay")}
          className="pill h-12 w-12 justify-center p-0 text-canvas disabled:opacity-40"
          style={{ background: accent }}
        >
          {playing ? <Pause size={18} strokeWidth={3} /> : <Play size={18} strokeWidth={3} />}
        </button>
        <button
          type="button"
          onClick={() => seek(cur + 5)}
          aria-label={t("stc_plFwd")}
          className="pill h-11 w-11 justify-center border border-line bg-white/6 p-0 text-ink"
        >
          <RotateCw size={16} strokeWidth={2.5} />
        </button>

        <div className="flex items-center gap-1" role="group" aria-label={t("stc_plSpeed")}>
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRate(s)}
              aria-pressed={rate === s}
              className={`pill px-3 py-2 text-xs font-bold ${
                rate === s ? "bg-white/15 text-ink" : "bg-white/5 text-muted"
              }`}
            >
              {s}×
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={flag}
          disabled={!url}
          className="pill ml-auto bg-coral px-4 py-2.5 text-sm font-bold text-canvas disabled:opacity-40"
        >
          <Flag size={15} strokeWidth={2.5} /> {t(ownSpeech ? "stc_plFlagOwn" : "stc_plFlag")}
        </button>
      </div>

      {/* ways to ask — said aloud to a person, never answered by the app */}
      {moves && moves.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold text-muted">{t("stc_plAsk")}</p>
          <div className="flex flex-wrap gap-2">
            {moves.map((m) => (
              <span key={m} className="rounded-full bg-white/6 px-3 py-1.5 text-xs font-medium text-ink">
                💬 {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* marked moments */}
      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold text-muted">
          {t("stc_plMarks")} {marks.length > 0 && `· ${marks.filter((m) => m.resolved).length}/${marks.length}`}
        </p>
        {marks.length === 0 ? (
          <p className="text-sm text-muted">{t("stc_plNoMarks")}</p>
        ) : (
          <ul className="space-y-2">
            {marks.map((m) => (
              <li key={m.id} className="rounded-2xl border border-line bg-canvas p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      seek(m.t);
                      audioRef.current?.play().catch(() => {});
                    }}
                    title={t("stc_plJump")}
                    className="pill bg-white/8 px-3 py-1.5 text-xs font-bold tabular-nums text-ink"
                  >
                    <Play size={11} strokeWidth={3} /> {fmtDuration(m.t)}
                  </button>
                  <NoteInput
                    value={m.note ?? ""}
                    placeholder={t("stc_plNote")}
                    onCommit={(note) =>
                      patchMarks((ms) => ms.map((x) => (x.id === m.id ? { ...x, note } : x)))
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      patchMarks((ms) => ms.map((x) => (x.id === m.id ? { ...x, resolved: !x.resolved } : x)))
                    }
                    aria-pressed={Boolean(m.resolved)}
                    className={`pill px-3 py-1.5 text-xs font-bold ${
                      m.resolved ? "bg-mint text-canvas" : "bg-white/8 text-muted"
                    }`}
                  >
                    <Check size={12} strokeWidth={3} /> {m.resolved ? t("stc_plClarified") : t("stc_plOpen")}
                  </button>
                  <button
                    type="button"
                    onClick={() => patchMarks((ms) => ms.filter((x) => x.id !== m.id))}
                    aria-label={t("stc_recDiscard")}
                    className="pill h-8 w-8 justify-center bg-white/5 p-0 text-muted hover:text-coral"
                  >
                    <Trash2 size={13} strokeWidth={2.5} />
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {gapTypes && gapTypes.length > 0 && (
                    <select
                      value={m.gap ?? ""}
                      onChange={(e) =>
                        patchMarks((ms) =>
                          ms.map((x) => (x.id === m.id ? { ...x, gap: e.target.value || undefined } : x))
                        )
                      }
                      aria-label={t("stc_plGap")}
                      className="rounded-xl border border-line bg-raised px-3 py-1.5 text-xs text-ink outline-none"
                    >
                      <option value="">{t("stc_plGap")}</option>
                      {gapTypes.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {allowWords &&
                    (wordFor === m.id ? (
                      <form
                        className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          addWord(m);
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
                          maxLength={80}
                          className="min-w-0 flex-1 rounded-xl border border-line bg-raised px-3 py-1.5 text-sm text-ink outline-none focus:border-white/30"
                        />
                        <button
                          type="submit"
                          className="pill px-3 py-1.5 text-xs font-bold text-canvas"
                          style={{ background: accent }}
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
                        className="pill bg-white/6 px-3 py-1.5 text-xs font-semibold text-ink"
                      >
                        <Plus size={12} strokeWidth={3} /> {t("stc_plAddWord")}
                      </button>
                    ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {allowDelete && (
        <div className="mt-4 flex justify-end">
          {confirmDelete ? (
            <span className="flex flex-wrap items-center gap-2 text-xs text-muted">
              {t("stc_plDeleteConfirm")}
              <button
                type="button"
                onClick={async () => {
                  await deleteRecording(live.id);
                  onDeleted?.();
                }}
                className="pill bg-coral px-3 py-1.5 text-xs font-bold text-canvas"
              >
                {t("stc_plDelete")}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="pill bg-white/6 px-3 py-1.5 text-xs font-semibold text-ink"
              >
                {t("back")}
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-coral"
            >
              <Trash2 size={12} strokeWidth={2.5} /> {t("stc_plDelete")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
