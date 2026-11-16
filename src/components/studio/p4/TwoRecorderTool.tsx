"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Pause, Play, RotateCcw, SkipBack } from "lucide-react";
import { useApp } from "@/lib/store";
import { fmtDuration, logRelisten, useBlobUrl, useLibrary, type LibraryItem } from "@/lib/library";
import { RecordPanel } from "../RecordPanel";
import {
  Callout,
  ConfidentialBanner,
  FinishBar,
  NeedsPersonCallout,
  RecordingList,
  StepGuide,
  StudioHeader,
  textOn,
  useStudioTimer,
} from "../StudioShell";
import type { StudioToolProps } from "../types";
import { P4_CLARIFY_MOVES, P4_CONSENT_ASK, P4_EXPAND_MOVES, P4_TWOREC_MOVES } from "./content";
import {
  GHOST_BTN,
  Panel,
  PhraseBook,
  RecordingPicker,
  SUB,
  hostLines,
  useGapTypes,
  useReturning,
  useSteps,
  useStudioState,
} from "./shared";

/**
 * p4-tworecorder — the Two-Recorder Technique.
 * Recorder one is a recording the mentor already made (their story). It plays
 * a stretch at a time while recorder two captures the whole conversation
 * around it: the story, the grower's questions, the mentor's answers. The new
 * recording is threaded under the original, so both stay together in the
 * library. It is a way of working for once the step-by-step way is second
 * nature, not a separate kind of content.
 */

interface TwoRecState {
  primaryId: string | null;
  /** seconds played before the player stops itself */
  stretch: number;
  /** where each primary was left off */
  pos: Record<string, number>;
  /** also offer recordings from earlier phases as the first layer */
  earlier: boolean;
}

const INITIAL: TwoRecState = { primaryId: null, stretch: 20, pos: {}, earlier: false };
const STRETCHES = [10, 20, 30, 45];
const LAYER_KINDS: LibraryItem["kind"][] = ["primary", "expansion", "improved", "imported"];

/** Recorder one: plays the chosen recording a stretch at a time, then stops for the conversation. */
function StretchPlayer({
  item,
  accent,
  stretch,
  startAt,
  onLeftOff,
}: {
  item: LibraryItem;
  accent: string;
  stretch: number;
  startAt: number;
  onLeftOff: (sec: number) => void;
}) {
  const { t } = useApp();
  const url = useBlobUrl(item.id);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopAt = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(startAt);
  // MediaRecorder blobs report no duration — trust the stored length
  const total = Math.max(item.durationSec, 1);

  const playFrom = (from: number) => {
    const el = audioRef.current;
    if (!el) return;
    const start = Math.max(0, Math.min(from, total));
    try {
      el.currentTime = start;
    } catch {
      // unseekable — carry on from wherever it is
    }
    setCur(start);
    stopAt.current = Math.min(start + stretch, total);
    el.play().catch(() => setPlaying(false));
  };
  const pause = () => {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    stopAt.current = null;
    onLeftOff(el.currentTime);
  };
  const atEnd = cur >= total - 0.5;

  return (
    <div className={SUB}>
      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: accent }}>
        {t("st4_tr_one")}
      </p>
      <p className="break-words text-sm font-semibold text-ink">{item.title}</p>
      {url ? (
        <audio
          ref={audioRef}
          src={url}
          preload="auto"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => {
            const now = e.currentTarget.currentTime;
            setCur(now);
            if (stopAt.current !== null && now >= stopAt.current) {
              e.currentTarget.pause();
              stopAt.current = null;
              onLeftOff(now);
            }
          }}
          onEnded={() => {
            stopAt.current = null;
            setCur(total);
            onLeftOff(0);
            void logRelisten(item.id);
          }}
        />
      ) : (
        <p className="text-sm text-muted">{t("stc_plLoading")}</p>
      )}

      <div>
        <input
          type="range"
          min={0}
          max={total}
          step={0.5}
          value={Math.min(cur, total)}
          onChange={(e) => {
            const to = Number(e.target.value);
            setCur(to);
            onLeftOff(to);
            try {
              if (audioRef.current) audioRef.current.currentTime = to;
            } catch {
              // unseekable stream
            }
          }}
          aria-label={item.title}
          className="w-full"
          style={{ accentColor: accent }}
        />
        <div className="flex justify-between text-xs tabular-nums text-muted">
          <span>{fmtDuration(cur)}</span>
          <span>{fmtDuration(total)}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {playing ? (
          <button
            type="button"
            onClick={pause}
            className="pill min-h-12 bg-coral px-5 py-3 text-sm font-bold text-canvas"
          >
            <Pause size={16} strokeWidth={3} aria-hidden /> {t("st4_tr_stopHere")}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => playFrom(atEnd ? 0 : cur)}
            disabled={!url}
            className={`pill min-h-12 px-5 py-3 text-sm font-bold disabled:opacity-40 ${textOn(accent)}`}
            style={{ background: accent }}
          >
            <Play size={16} strokeWidth={3} aria-hidden /> {t(atEnd ? "st4_tr_fromTop" : "st4_tr_playNext")}
          </button>
        )}
        <button type="button" onClick={() => playFrom(cur - stretch)} disabled={!url} className={GHOST_BTN}>
          <RotateCcw size={14} strokeWidth={2.5} aria-hidden /> {t("st4_tr_again")}
        </button>
        <button
          type="button"
          onClick={() => {
            pause();
            setCur(0);
            onLeftOff(0);
          }}
          disabled={!url || cur === 0}
          aria-label={t("st4_tr_fromTop")}
          className="pill h-10 w-10 justify-center border border-line bg-white/6 p-0 text-ink disabled:opacity-40"
        >
          <SkipBack size={14} strokeWidth={2.5} aria-hidden />
        </button>
      </div>
    </div>
  );
}

export function TwoRecorderTool({ activity, phase, lang }: StudioToolProps) {
  const { t } = useApp();
  const timer = useStudioTimer(activity.id);
  const [state, setState] = useStudioState<TwoRecState>(activity.id, INITIAL);
  const { all, ready: libReady } = useLibrary();
  const gapTypes = useGapTypes();
  const steps = useSteps("st4_tr_s", ["you", "you", "both", "you", "nurturer", "you"]);
  const moves = hostLines(P4_CLARIFY_MOVES, lang);

  // first layers: recordings in which a host person is talking
  const hostTalk = all.filter((it) => it.lang === lang && it.speaker !== "me" && LAYER_KINDS.includes(it.kind));
  const candidates = hostTalk.filter((it) => state.earlier || it.phase === phase.id);
  const primary = candidates.find((it) => it.id === state.primaryId) ?? null;
  const layers = all.filter((it) => it.activityId === activity.id && it.lang === lang).length;
  const returning = useReturning(libReady, layers > 0);
  // the guide's readiness signal: recordings already worked through the step-by-step way
  const worked = hostTalk.filter(
    (it) => it.phase === phase.id && it.activityId !== activity.id && it.marks.some((m) => m.resolved)
  ).length;

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="🎛️" mode="nurturer" />
      <ConfidentialBanner />
      <NeedsPersonCallout>{t("st4_tr_needs")}</NeedsPersonCallout>
      <StepGuide
        key={returning ? "returning" : "first"}
        steps={steps}
        accent={phase.color}
        defaultOpen={!returning}
      />
      <Callout icon="🧭" title={t("st4_tr_readyTitle")}>
        <p>
          {t(worked >= 3 ? "st4_tr_readyYes" : "st4_tr_readyNotYet").replace("{n}", String(worked))}
        </p>
        {worked < 3 && (
          <Link
            href="/studio/p4-lifestory"
            className="mt-2 inline-block text-sm font-semibold text-ink underline underline-offset-4"
          >
            {t("st4_tr_readyCta")} →
          </Link>
        )}
      </Callout>
      <PhraseBook
        lang={lang}
        groups={[
          { title: t("st4_phr_permission"), lines: P4_CONSENT_ASK },
          { title: t("st4_phr_tworec"), lines: P4_TWOREC_MOVES },
          { title: t("st4_phr_clarify"), lines: P4_CLARIFY_MOVES },
          { title: t("st4_phr_expand"), lines: P4_EXPAND_MOVES },
        ]}
      />

      {/* recorder one: choose the first layer */}
      <Panel title={t("st4_tr_chooseTitle")} sub={t("st4_tr_chooseSub")}>
        <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={state.earlier}
            onChange={(e) => setState((s) => ({ ...s, earlier: e.target.checked }))}
            className="h-5 w-5 accent-[var(--color-mint)]"
          />
          {t("st4_tr_earlier")}
        </label>
        <RecordingPicker
          items={candidates}
          selectedId={primary?.id ?? null}
          onSelect={(id) => setState((s) => ({ ...s, primaryId: id }))}
          emptyText={t("st4_tr_chooseEmpty")}
        />
        {candidates.length === 0 && (
          <Link href="/studio/p4-lifestory" className={GHOST_BTN}>
            {t("st4_tr_readyCta")} →
          </Link>
        )}
      </Panel>

      {primary && (
        <Panel title={t("st4_tr_benchTitle")} sub={t("st4_tr_benchSub")}>
          {/* recorder two first: it has to be running before the story plays */}
          <div className={SUB}>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: phase.color }}>
              {t("st4_tr_two")}
            </p>
            <RecordPanel
              lang={lang}
              phase={phase.id}
              activityId={activity.id}
              kind="expansion"
              speaker="both"
              parentId={primary.id}
              confidential
              showConsent
              tags={primary.tags}
              accent={phase.color}
              defaultTitle={`${primary.title} · ${t("st4_tr_layerName")}`.slice(0, 80)}
              label={t("st4_tr_record")}
            />
            <p className="text-xs leading-relaxed text-muted">{t("st4_tr_echo")}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("st4_tr_stretch")}>
            <span className="text-xs font-semibold text-muted">{t("st4_tr_stretch")}</span>
            {STRETCHES.map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setState((s) => ({ ...s, stretch: sec }))}
                aria-pressed={state.stretch === sec}
                className={`pill min-h-10 px-3 py-2 text-xs font-bold ${
                  state.stretch === sec ? "bg-white/15 text-ink" : "bg-white/5 text-muted"
                }`}
              >
                {t("st4_tr_seconds").replace("{n}", String(sec))}
              </button>
            ))}
          </div>

          <StretchPlayer
            key={primary.id}
            item={primary}
            accent={phase.color}
            stretch={state.stretch}
            startAt={state.pos[primary.id] ?? 0}
            onLeftOff={(sec) => setState((s) => ({ ...s, pos: { ...s.pos, [primary.id]: Math.round(sec) } }))}
          />

          <Callout icon="🌊" title={t("st4_tr_runTitle")}>
            <p>{t("st4_tr_runBody")}</p>
          </Callout>

          <RecordingList
            filter={{ parentId: primary.id }}
            accent={phase.color}
            gapTypes={gapTypes}
            moves={moves.length > 0 ? moves : undefined}
            title={t("st4_tr_threadTitle")}
            emptyText={t("st4_tr_threadEmpty")}
          />
        </Panel>
      )}

      <RecordingList
        filter={{ activityId: activity.id, lang }}
        accent={phase.color}
        gapTypes={gapTypes}
        moves={moves.length > 0 ? moves : undefined}
        title={t("st4_tr_allTitle")}
        emptyText={t("st4_tr_allEmpty")}
      />
      <FinishBar timer={timer} accent={phase.color} />
    </div>
  );
}
