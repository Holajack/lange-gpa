"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Flag, Pause, Play, RotateCcw, SkipBack } from "lucide-react";
import { useApp } from "@/lib/store";
import { fmtDuration, useBlobUrl, type LibraryItem, type Mark } from "@/lib/library";
import { textOn } from "../StudioShell";

/**
 * RangePlayer — plays ONE stretch of a library recording and stops at its end.
 *
 * Phase 5 works a long recording a stretch at a time, so the player has to
 * stay inside a span: back up a phrase, replay, slow down, flag the second
 * you lose the thread. The shared ClarifyPlayer always plays a whole
 * recording, so this lives here. It never explains the audio; a flag is a
 * question for a person.
 */

const SPEEDS = [0.7, 0.85, 1] as const;

export interface SeekRequest {
  /** seconds from the start of the recording */
  t: number;
  /** bump to ask again for the same second */
  n: number;
}

export function RangePlayer({
  item,
  start,
  end,
  accent,
  marks,
  onFlag,
  flagLabel,
  pauseOnFlag = true,
  onRangeEnd,
  autoPlay = false,
  seekRequest,
  onTime,
}: {
  item: LibraryItem;
  /** seconds; the stretch begins here */
  start: number;
  /** seconds; 0 (or anything ≤ start) means "to the end of the recording" */
  end: number;
  accent: string;
  /** flagged moments to show on the scrubber */
  marks?: Mark[];
  /** called with the second to flag (a little before the playhead) */
  onFlag?: (t: number) => void;
  flagLabel?: string;
  /** stop playback when a moment is flagged, so it can be talked over */
  pauseOnFlag?: boolean;
  /** playback reached the end of the stretch */
  onRangeEnd?: () => void;
  /** start playing as soon as the stretch is loaded (only after the grower has pressed play once) */
  autoPlay?: boolean;
  seekRequest?: SeekRequest | null;
  onTime?: (t: number) => void;
}) {
  const { t } = useApp();
  const url = useBlobUrl(item.id);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const endedRef = useRef(false);
  const autoRef = useRef(autoPlay);
  const endCb = useRef(onRangeEnd);
  // keep the latest props reachable from the audio callbacks (runs before the effects below)
  useEffect(() => {
    autoRef.current = autoPlay;
    endCb.current = onRangeEnd;
  });

  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(start);
  const [rate, setRate] = useState<(typeof SPEEDS)[number]>(1);
  const [metaDur, setMetaDur] = useState(0);

  // recorder blobs can report an endless duration: trust the stored length first
  const fileEnd = item.durationSec > 0 ? item.durationSec : metaDur;
  const stop = end > start ? end : fileEnd;
  const span = Math.max(1, stop - start);

  const seek = useCallback(
    (to: number) => {
      const el = audioRef.current;
      const clamped = Math.max(start, stop > start ? Math.min(to, stop) : to);
      if (el) {
        try {
          el.currentTime = clamped;
        } catch {
          // unseekable stream: leave the head where it is
        }
      }
      if (stop <= start || clamped < stop - 0.1) endedRef.current = false;
      setCur(clamped);
    },
    [start, stop]
  );

  // put the head at the start of the stretch whenever the stretch or the file changes
  useEffect(() => {
    const el = audioRef.current;
    endedRef.current = false;
    setCur(start);
    if (!el || !url) return;
    const place = () => {
      try {
        el.currentTime = start;
      } catch {
        // ignore
      }
      if (autoRef.current) el.play().catch(() => setPlaying(false));
    };
    if (el.readyState >= 1) {
      place();
      return;
    }
    el.addEventListener("loadedmetadata", place, { once: true });
    return () => el.removeEventListener("loadedmetadata", place);
  }, [url, start, end, item.id]);

  useEffect(() => {
    const el = audioRef.current;
    if (el) el.playbackRate = rate;
  }, [rate, url]);

  const seekN = seekRequest?.n;
  useEffect(() => {
    if (seekRequest == null) return;
    seek(seekRequest.t);
    audioRef.current?.play().catch(() => setPlaying(false));
    // only a new request moves the head
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seekN]);

  const reachEnd = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    endCb.current?.();
  };

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (!el.paused) {
      el.pause();
      return;
    }
    if (stop > start && el.currentTime >= stop - 0.1) seek(start);
    endedRef.current = false;
    el.play().catch(() => setPlaying(false));
  };

  const flag = () => {
    const el = audioRef.current;
    const head = el?.currentTime ?? cur;
    if (pauseOnFlag) el?.pause();
    onFlag?.(Math.max(start, Math.round(head - 2)));
  };

  const shownMarks = (marks ?? []).filter((m) => m.t >= start && (stop <= start || m.t <= stop));

  return (
    <div className="rounded-3xl border border-line bg-raised-2 p-4 sm:p-5">
      {/* one element for the life of the player, so a queue can roll from one recording into the next */}
      <audio
        ref={audioRef}
        src={url ?? undefined}
        preload="auto"
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d)) setMetaDur(d);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => {
          const head = e.currentTarget.currentTime;
          setCur(head);
          onTime?.(head);
          if (stop > start && head >= stop - 0.05 && !endedRef.current) {
            e.currentTarget.pause();
            reachEnd();
          }
        }}
        onEnded={() => {
          setPlaying(false);
          reachEnd();
        }}
      />
      {!url && <p className="mb-2 text-sm text-muted">{t("stc_plLoading")}</p>}

      <div className="relative">
        <input
          type="range"
          min={start}
          max={start + span}
          step={0.5}
          value={Math.min(Math.max(cur, start), start + span)}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label={item.title}
          className="w-full"
          style={{ accentColor: accent }}
        />
        <div className="pointer-events-none absolute inset-x-2 -bottom-1 h-2" aria-hidden>
          {shownMarks.map((m) => (
            <span
              key={m.id}
              className="absolute top-0 h-2 w-2 -translate-x-1/2 rounded-full"
              style={{
                left: `${Math.min(100, ((m.t - start) / span) * 100)}%`,
                background: m.resolved ? "var(--color-mint)" : "var(--color-coral)",
              }}
            />
          ))}
        </div>
      </div>
      <div className="mt-2 flex justify-between text-xs tabular-nums text-muted">
        <span>{fmtDuration(cur)}</span>
        <span>
          {fmtDuration(start)} – {stop > start ? fmtDuration(stop) : "…"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => seek(start)}
          aria-label={t("st5_plRestart")}
          title={t("st5_plRestart")}
          className="pill h-11 w-11 justify-center border border-line bg-white/6 p-0 text-ink"
        >
          <SkipBack size={16} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={() => seek(cur - 5)}
          aria-label={t("stc_plBack")}
          title={t("stc_plBack")}
          className="pill h-11 w-11 justify-center border border-line bg-white/6 p-0 text-ink"
        >
          <RotateCcw size={16} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={toggle}
          disabled={!url}
          aria-label={playing ? t("stc_plPause") : t("stc_plPlay")}
          className={`pill h-12 w-12 justify-center p-0 disabled:opacity-40 ${textOn(accent)}`}
          style={{ background: accent }}
        >
          {playing ? <Pause size={18} strokeWidth={3} /> : <Play size={18} strokeWidth={3} />}
        </button>

        <div className="flex items-center gap-1" role="group" aria-label={t("stc_plSpeed")}>
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRate(s)}
              aria-pressed={rate === s}
              className={`pill min-h-10 min-w-10 px-3 py-2 text-xs font-bold ${
                rate === s ? "bg-white/15 text-ink" : "bg-white/5 text-muted"
              }`}
            >
              {s}×
            </button>
          ))}
        </div>

        {onFlag && (
          <button
            type="button"
            onClick={flag}
            disabled={!url}
            title={t("stc_plFlagHint")}
            className="pill min-h-11 w-full bg-coral px-4 py-2.5 text-sm font-bold text-canvas disabled:opacity-40 sm:ml-auto sm:w-auto"
          >
            <Flag size={15} strokeWidth={2.5} /> {flagLabel ?? t("stc_plFlag")}
          </button>
        )}
      </div>
    </div>
  );
}
