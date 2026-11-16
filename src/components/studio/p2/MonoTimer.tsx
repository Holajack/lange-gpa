"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Pause, Play, RotateCcw } from "lucide-react";
import { useApp } from "@/lib/store";
import { fmtDuration } from "@/lib/library";
import { textOn } from "../StudioShell";

const LENGTHS = [10, 20, 30, 45, 60, 90] as const;

type AudioCtor = typeof AudioContext;

/**
 * The timer with a bell from the guide's meeting table: set it, and until it
 * rings the host language is the only language in the room. The block is
 * meant to grow over the phase (30 → 60 → 90 minutes).
 */
export function MonoTimer({
  accent,
  minutes,
  longest,
  onMinutes,
  onFinished,
}: {
  accent: string;
  minutes: number;
  /** longest block the grower has finished so far, in minutes */
  longest: number;
  onMinutes: (m: number) => void;
  onFinished: (m: number) => void;
}) {
  const { t } = useApp();
  const [left, setLeft] = useState(minutes * 60);
  const [running, setRunning] = useState(false);
  const [rang, setRang] = useState(false);
  const endAt = useRef(0);
  const audio = useRef<AudioContext | null>(null);
  const started = left < minutes * 60;

  // a new length resets an idle timer
  useEffect(() => {
    if (!running) setLeft(minutes * 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the chosen length
  }, [minutes]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const remain = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setLeft(remain);
      if (remain > 0) return;
      setRunning(false);
      setRang(true);
      ring(audio.current);
      onFinished(minutes);
    }, 500);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the interval reads refs
  }, [running]);

  useEffect(
    () => () => {
      void audio.current?.close().catch(() => {});
    },
    []
  );

  const start = () => {
    // unlock audio on this tap so the bell can ring later
    try {
      const Ctor: AudioCtor | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
      if (Ctor && !audio.current) audio.current = new Ctor();
      void audio.current?.resume();
    } catch {
      // no Web Audio — the timer still counts, silently
    }
    const from = left > 0 ? left : minutes * 60;
    setLeft(from);
    endAt.current = Date.now() + from * 1000;
    setRang(false);
    setRunning(true);
  };

  const reset = () => {
    setRunning(false);
    setRang(false);
    setLeft(minutes * 60);
  };

  return (
    <div className="space-y-4">
      <div role="group" aria-label={t("st2_tmLength")} className="flex flex-wrap gap-2">
        {LENGTHS.map((m) => (
          <button
            key={m}
            type="button"
            disabled={running}
            aria-pressed={minutes === m}
            onClick={() => onMinutes(m)}
            className={`pill min-h-11 px-4 py-2 text-sm font-bold tabular-nums disabled:opacity-40 ${
              minutes === m ? "bg-white/15 text-ink" : "border border-line bg-white/5 text-muted"
            }`}
          >
            {m} {t("st2_min")}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <span
          className="font-display text-4xl font-extrabold tabular-nums"
          style={{ color: running ? accent : undefined }}
          role="timer"
          aria-live="off"
        >
          {fmtDuration(left)}
        </span>
        <button
          type="button"
          onClick={running ? () => setRunning(false) : start}
          className={`pill min-h-11 px-5 py-2.5 text-sm font-bold ${textOn(accent)}`}
          style={{ background: accent }}
        >
          {running ? <Pause size={15} strokeWidth={3} /> : <Play size={15} strokeWidth={3} />}
          {running ? t("st2_tmPause") : started && !rang ? t("st2_tmResume") : t("st2_tmStart")}
        </button>
        {(started || rang) && !running && (
          <button
            type="button"
            onClick={reset}
            className="pill min-h-11 border border-line bg-white/6 px-4 py-2.5 text-sm font-semibold text-muted hover:text-ink"
          >
            <RotateCcw size={14} strokeWidth={2.5} /> {t("st2_tmReset")}
          </button>
        )}
      </div>

      <p className="flex items-start gap-2 text-sm leading-relaxed text-muted" role="status">
        <Bell size={15} strokeWidth={2.5} className="mt-0.5 shrink-0" aria-hidden />
        {rang ? t("st2_tmRang") : running ? t("st2_tmRunning") : t("st2_tmIdle")}
      </p>
      {longest > 0 && (
        <p className="text-xs text-muted">{t("st2_tmLongest").replace("{n}", String(longest))}</p>
      )}
    </div>
  );
}

/** Three soft bell strokes. */
function ring(ctx: AudioContext | null) {
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    [0, 0.6, 1.2].forEach((at) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, now + at);
      gain.gain.exponentialRampToValueAtTime(0.35, now + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + at);
      osc.stop(now + at + 0.6);
    });
  } catch {
    // audio blocked — the on-screen message still says the bell rang
  }
}
