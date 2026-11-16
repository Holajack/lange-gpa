"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Mic, Square, Trash2, Upload } from "lucide-react";
import type { LangCode, PhaseId } from "@/lib/types";
import { useApp } from "@/lib/store";
import {
  fmtDuration,
  saveRecording,
  type LibraryItem,
  type RecordingKind,
  type Speaker,
} from "@/lib/library";
import { useAudioRecorder, type AudioTake } from "./useAudioRecorder";

/**
 * RecordPanel — the one way anything gets into the Listening Library.
 * Record (or bring in a file) → listen back → name it → save. Every studio
 * tool uses this instead of rolling its own recorder.
 */
export function RecordPanel({
  lang,
  phase,
  activityId,
  kind,
  defaultTitle,
  accent,
  speaker,
  parentId,
  confidential,
  tags,
  allowImport = false,
  showConsent = false,
  label,
  onSaved,
}: {
  lang: LangCode;
  phase: PhaseId;
  activityId: string;
  kind: RecordingKind;
  defaultTitle: string;
  /** css color of the phase */
  accent: string;
  speaker?: Speaker;
  parentId?: string;
  confidential?: boolean;
  tags?: string[];
  /** also allow bringing in an audio file (native-to-native recordings, etc.) */
  allowImport?: boolean;
  /** show the "ask before recording someone" line */
  showConsent?: boolean;
  /** overrides the Record button label */
  label?: string;
  onSaved?: (item: LibraryItem) => void;
}) {
  const { t } = useApp();
  const rec = useAudioRecorder();
  const [take, setTake] = useState<AudioTake | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState(defaultTitle);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setTitle(defaultTitle), [defaultTitle]);

  useEffect(() => {
    if (!take) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(take.blob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [take]);

  const begin = async () => {
    setJustSaved(false);
    await rec.start();
  };

  const finish = async () => {
    const result = await rec.stop();
    if (result) setTake(result);
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    setJustSaved(false);
    // read the real duration from the file's metadata
    const probe = new Audio();
    const url = URL.createObjectURL(file);
    const done = (durationSec: number) => {
      URL.revokeObjectURL(url);
      setTitle(file.name.replace(/\.[a-z0-9]+$/i, "").slice(0, 80) || defaultTitle);
      setTake({ blob: file, durationSec, mime: file.type || "audio/mpeg" });
    };
    probe.onloadedmetadata = () => done(Number.isFinite(probe.duration) ? probe.duration : 0);
    probe.onerror = () => done(0);
    probe.src = url;
  };

  const save = async () => {
    if (!take || saving) return;
    setSaving(true);
    try {
      const item = await saveRecording(
        {
          lang,
          phase,
          activityId,
          kind: fileImported(take) ? "imported" : kind,
          title: title.trim().slice(0, 80) || defaultTitle,
          speaker,
          parentId,
          confidential,
          tags,
          mime: take.mime,
          durationSec: take.durationSec,
        },
        take.blob
      );
      setTake(null);
      setTitle(defaultTitle);
      setJustSaved(true);
      onSaved?.(item);
    } finally {
      setSaving(false);
    }
  };

  const recording = rec.status === "recording";

  return (
    <div className="rounded-3xl border border-line bg-raised-2 p-4 sm:p-5">
      {!take ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={recording ? finish : begin}
            aria-pressed={recording}
            className="pill px-5 py-3 text-sm font-bold text-canvas"
            style={{ background: recording ? "var(--color-coral)" : accent }}
          >
            {recording ? <Square size={15} strokeWidth={3} /> : <Mic size={16} strokeWidth={2.5} />}
            {recording ? t("stc_recStop") : label ?? t("stc_recStart")}
          </button>

          {recording && (
            <span className="flex items-center gap-2 text-sm font-semibold text-ink" aria-live="polite">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-coral" aria-hidden />
              {t("stc_recRecording")} · <span className="tabular-nums">{fmtDuration(rec.elapsed)}</span>
            </span>
          )}

          {!recording && allowImport && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="audio/*,video/mp4,video/webm"
                hidden
                onChange={(e) => {
                  onFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="pill border border-line bg-white/6 px-4 py-3 text-sm font-semibold text-ink"
                title={t("stc_recImportHint")}
              >
                <Upload size={15} strokeWidth={2.5} /> {t("stc_recImport")}
              </button>
            </>
          )}

          {justSaved && !recording && (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-mint" role="status">
              <Check size={15} strokeWidth={3} /> {t("stc_recSaved")}
            </span>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {previewUrl && <audio src={previewUrl} controls className="w-full" />}
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">{t("stc_recTitle")}</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              className="w-full rounded-2xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-white/30"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="pill px-5 py-2.5 text-sm font-bold text-canvas disabled:opacity-50"
              style={{ background: accent }}
            >
              <Check size={15} strokeWidth={3} /> {t("stc_recSave")}
            </button>
            <button
              type="button"
              onClick={() => setTake(null)}
              className="pill border border-line bg-white/6 px-4 py-2.5 text-sm font-semibold text-muted hover:text-ink"
            >
              <Trash2 size={14} strokeWidth={2.5} /> {t("stc_recDiscard")}
            </button>
          </div>
        </div>
      )}

      {rec.status === "denied" && (
        <p className="mt-3 text-sm text-coral" role="alert">
          {t("stc_recDenied")}
        </p>
      )}
      {rec.status === "unsupported" && (
        <p className="mt-3 text-sm text-coral" role="alert">
          {t("stc_recUnsupported")}
        </p>
      )}
      {showConsent && !take && (
        <p className="mt-3 text-xs leading-relaxed text-muted">🤝 {t("stc_recConsent")}</p>
      )}
    </div>
  );
}

function fileImported(take: AudioTake): boolean {
  return typeof File !== "undefined" && take.blob instanceof File;
}
