"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useApp } from "@/lib/store";
import type { LangCode } from "@/lib/types";
import { fmtDuration, logRelisten, useBlobUrl, useLibrary, type LibraryItem } from "@/lib/library";
import { useWordLog, type WordEntry } from "@/lib/wordLog";
import { ClarifyPlayer } from "../ClarifyPlayer";
import { RecordPanel } from "../RecordPanel";
import {
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
import { P4_VOCAB_ASKS } from "./content";
import {
  AddLine,
  INPUT,
  Panel,
  PhraseBook,
  SMALL_BTN,
  SUB,
  Stat,
  personTag,
  useP4People,
  useReturning,
  useSteps,
  useStudioState,
} from "./shared";

/**
 * p4-vocab — Vocabulary Recordings.
 * Words come from the Word Log (so from real recordings); the mentor's voice
 * puts each one back into natural sentences; the grower runs through the set
 * alone. Only real mentor audio plays here: Nuri never invents a sentence.
 */

interface VocabState {
  /** whose voice the next recording is (a person from Life Story / Walk of Life) */
  voiceId: string | null;
  /** words ticked off during a "talk through the list" recording */
  covered: string[];
  includeOwned: boolean;
}

const INITIAL: VocabState = { voiceId: null, covered: [], includeOwned: false };
const LIST_LIMIT = 30;
const TALK_TAG = "wordtalk";
const wordTag = (entryId: string) => `w:${entryId}`;

/** Plays the stretch of the original recording a word was first heard in. */
function HearMoment({ sourceId, at }: { sourceId: string; at: number }) {
  const { t } = useApp();
  const [on, setOn] = useState(false);
  const url = useBlobUrl(on ? sourceId : null);
  const ref = useRef<HTMLAudioElement | null>(null);
  const start = Math.max(0, at - 2);

  useEffect(() => {
    const el = ref.current;
    if (!el || !url) return;
    try {
      el.currentTime = start;
    } catch {
      // unseekable — play from the top
    }
    el.play().catch(() => setOn(false));
  }, [url, start]);

  return (
    <>
      <button type="button" onClick={() => setOn((o) => !o)} aria-pressed={on} className={SMALL_BTN}>
        {on ? <Pause size={12} strokeWidth={3} aria-hidden /> : <Play size={12} strokeWidth={3} aria-hidden />}
        {t("stc_wlHearMoment")}
      </button>
      {url && (
        <audio
          ref={ref}
          src={url}
          onTimeUpdate={(e) => {
            if (e.currentTarget.currentTime > start + 12) {
              e.currentTarget.pause();
              setOn(false);
            }
          }}
          onEnded={() => setOn(false)}
        />
      )}
    </>
  );
}

/** Runs through the recording set one after another. */
function ReviewPlayer({
  queue,
  entryOf,
  accent,
  lang,
  onHeard,
  onToggleOwned,
}: {
  queue: LibraryItem[];
  entryOf: (item: LibraryItem) => WordEntry | undefined;
  accent: string;
  lang: LangCode;
  onHeard: (item: LibraryItem) => void;
  onToggleOwned: (entry: WordEntry) => void;
}) {
  const { t } = useApp();
  const [ix, setIx] = useState(0);
  const [run, setRun] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const safeIx = Math.min(ix, Math.max(0, queue.length - 1));
  const cur: LibraryItem | undefined = queue[safeIx];
  const url = useBlobUrl(cur?.id);

  useEffect(() => {
    if (run && url) audioRef.current?.play().catch(() => setRun(false));
  }, [run, url]);

  if (!cur) return <p className="text-sm text-muted">{t("st4_vc_reviewEmpty")}</p>;
  const entry = entryOf(cur);
  const go = (delta: number) => setIx(Math.max(0, Math.min(queue.length - 1, safeIx + delta)));

  return (
    <div className={SUB}>
      {url && (
        <audio
          ref={audioRef}
          src={url}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            onHeard(cur);
            if (run && safeIx < queue.length - 1) setIx(safeIx + 1);
            else setRun(false);
          }}
        />
      )}
      <p className="text-xs font-semibold tabular-nums text-muted">
        {t("st4_vc_reviewCount").replace("{n}", String(safeIx + 1)).replace("{total}", String(queue.length))} ·{" "}
        {fmtDuration(cur.durationSec)}
      </p>
      <p lang={lang} className="headline break-words text-2xl text-ink sm:text-3xl">
        {entry?.text ?? cur.title}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={safeIx === 0}
          aria-label={t("st4_vc_prev")}
          className="pill h-11 w-11 justify-center border border-line bg-white/6 p-0 text-ink disabled:opacity-40"
        >
          <SkipBack size={16} strokeWidth={2.5} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => {
            if (playing) {
              setRun(false);
              audioRef.current?.pause();
            } else {
              setRun(true);
              audioRef.current?.play().catch(() => setRun(false));
            }
          }}
          disabled={!url}
          className={`pill min-h-12 px-5 py-3 text-sm font-bold disabled:opacity-40 ${textOn(accent)}`}
          style={{ background: accent }}
        >
          {playing ? <Pause size={16} strokeWidth={3} aria-hidden /> : <Play size={16} strokeWidth={3} aria-hidden />}
          {playing ? t("stc_plPause") : t("st4_vc_reviewPlay")}
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={safeIx >= queue.length - 1}
          aria-label={t("st4_vc_next")}
          className="pill h-11 w-11 justify-center border border-line bg-white/6 p-0 text-ink disabled:opacity-40"
        >
          <SkipForward size={16} strokeWidth={2.5} aria-hidden />
        </button>
        {entry && (
          <button
            type="button"
            onClick={() => onToggleOwned(entry)}
            aria-pressed={Boolean(entry.strong)}
            className={`pill min-h-10 px-4 py-2 text-sm font-bold ${
              entry.strong ? "bg-mint text-canvas" : "bg-white/8 text-ink"
            }`}
          >
            <Check size={14} strokeWidth={3} aria-hidden /> {t("stc_wlStrong")}
          </button>
        )}
      </div>
    </div>
  );
}

export function VocabTool({ activity, phase, lang }: StudioToolProps) {
  const { t, uiLang } = useApp();
  const timer = useStudioTimer(activity.id);
  const [state, setState] = useStudioState<VocabState>(activity.id, INITIAL);
  const { all, items, ready: libReady } = useLibrary({ activityId: activity.id, lang, kind: "word" });
  const returning = useReturning(libReady, items.length > 0);
  const log = useWordLog(lang);
  const people = useP4People(lang);
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [addMsg, setAddMsg] = useState(false);
  const steps = useSteps("st4_vc_s", ["you", "nurturer", "nurturer", "both", "you", "you"]);

  const voice = people.find((p) => p.id === state.voiceId) ?? null;
  const voiceTags = voice ? [personTag(voice.id)] : [];
  // the Word Log can run to thousands of entries, so index it once per change
  const byTag = useMemo(() => new Map(log.words.map((w) => [wordTag(w.id), w] as const)), [log.words]);
  const recsByWord = useMemo(() => {
    const map = new Map<string, LibraryItem[]>();
    for (const it of items) {
      for (const tag of it.tags ?? []) {
        const entry = byTag.get(tag);
        if (entry) map.set(entry.id, [...(map.get(entry.id) ?? []), it]);
      }
    }
    return map;
  }, [items, byTag]);
  const recsFor = (w: WordEntry) => recsByWord.get(w.id) ?? [];
  const entryOf = (item: LibraryItem) => {
    for (const tag of item.tags ?? []) {
      const entry = byTag.get(tag);
      if (entry) return entry;
    }
    return undefined;
  };

  const shaky = log.words.filter((w) => !w.strong);
  const needle = query.trim().toLocaleLowerCase();
  const matching = needle ? shaky.filter((w) => w.text.toLocaleLowerCase().includes(needle)) : shaky;
  const shown = matching.slice(0, LIST_LIMIT);
  const withAudio = recsByWord.size;

  // oldest first; words already owned drop out unless asked for
  const queue = [...items].reverse().filter((it) => {
    const entry = entryOf(it);
    return entry ? state.includeOwned || !entry.strong : true;
  });

  const voicePicker = people.length > 0 && (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted">{t("st4_vc_voice")}</span>
      <select
        value={state.voiceId ?? ""}
        onChange={(e) => setState((s) => ({ ...s, voiceId: e.target.value || null }))}
        className={`${INPUT} w-full`}
      >
        <option value="">{t("st4_vc_voiceNone")}</option>
        {people.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
      <span className="mt-1 block text-xs leading-relaxed text-muted">{t("st4_vc_voiceHint")}</span>
    </label>
  );

  return (
    <div className="space-y-5">
      <StudioHeader phase={phase} activity={activity} emoji="🎙️" mode="either" />
      <ConfidentialBanner />
      <StepGuide
        key={returning ? "returning" : "first"}
        steps={steps}
        accent={phase.color}
        defaultOpen={!returning}
      />
      <PhraseBook lang={lang} groups={[{ title: t("st4_phr_vocab"), lines: P4_VOCAB_ASKS }]} />

      {/* solo: run through the set */}
      <Panel title={t("st4_vc_reviewTitle")} sub={t("st4_vc_reviewSub")}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat value={log.words.length} label={t("stc_wlCount")} />
          <Stat value={shaky.length} label={t("st4_vc_statShaky")} />
          <Stat value={withAudio} label={t("st4_vc_statAudio")} />
          <Stat value={log.words.length - shaky.length} label={t("stc_wlStrongCount")} />
        </div>
        <ReviewPlayer
          queue={queue}
          entryOf={entryOf}
          accent={phase.color}
          lang={lang}
          onHeard={(item) => {
            void logRelisten(item.id);
            const entry = entryOf(item);
            if (entry) log.review(entry.id);
          }}
          onToggleOwned={(entry) => log.toggleStrong(entry.id)}
        />
        <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={state.includeOwned}
            onChange={(e) => setState((s) => ({ ...s, includeOwned: e.target.checked }))}
            className="h-5 w-5 accent-[var(--color-mint)]"
          />
          {t("st4_vc_includeOwned")}
        </label>
      </Panel>

      <NeedsPersonCallout>{t("st4_vc_needs")}</NeedsPersonCallout>

      {/* with your mentor: one word at a time */}
      <Panel title={t("st4_vc_wordsTitle")} sub={t("st4_vc_wordsSub")}>
        <AddLine
          placeholder={t("stc_wlAddPlaceholder")}
          button={t("stc_wlAdd")}
          onAdd={(text) => setAddMsg(log.add(text, { phase: 4 }) === null)}
          accent={phase.color}
          maxLength={80}
          inputLang={lang}
        />
        {addMsg && (
          <p className="text-xs text-amber" role="status">
            {t("stc_wlDup")}
          </p>
        )}
        {shaky.length > LIST_LIMIT && (
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("st4_vc_find")}
            aria-label={t("st4_vc_find")}
            lang={lang}
            className={`${INPUT} w-full`}
          />
        )}
        {shaky.length === 0 ? (
          <p className="text-sm text-muted">{t(log.words.length === 0 ? "stc_wlEmpty" : "st4_vc_allOwned")}</p>
        ) : (
          <ul className="space-y-2">
            {shown.map((w) => {
              const recs = recsFor(w);
              const open = openId === w.id;
              const source = w.sourceId ? all.find((it) => it.id === w.sourceId) : undefined;
              return (
                <li key={w.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : w.id)}
                    aria-expanded={open}
                    className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-line bg-raised px-4 py-3 text-left hover:bg-raised-2"
                  >
                    <span lang={lang} className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                      {w.text}
                    </span>
                    <span className="shrink-0 text-xs text-muted">
                      {recs.length > 0
                        ? t("st4_vc_hasAudio").replace("{n}", String(recs.length))
                        : t("st4_vc_noAudio")}
                    </span>
                    <ChevronDown
                      size={16}
                      strokeWidth={2.5}
                      className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </button>
                  {open && (
                    <div className={`${SUB} mt-2`}>
                      <div className="flex flex-wrap items-center gap-2">
                        {source && <HearMoment sourceId={source.id} at={w.t ?? 0} />}
                        <button
                          type="button"
                          onClick={() => log.toggleStrong(w.id)}
                          aria-pressed={Boolean(w.strong)}
                          className={SMALL_BTN}
                        >
                          <Check size={12} strokeWidth={3} aria-hidden /> {t("stc_wlStrong")}
                        </button>
                      </div>
                      {voicePicker}
                      <RecordPanel
                        lang={lang}
                        phase={phase.id}
                        activityId={activity.id}
                        kind="word"
                        speaker="native"
                        confidential
                        showConsent
                        tags={[wordTag(w.id), ...voiceTags]}
                        accent={phase.color}
                        defaultTitle={w.text}
                        label={t("st4_vc_record")}
                      />
                      {recs.map((rec) => (
                        <ClarifyPlayer key={rec.id} item={rec} accent={phase.color} allowWords={false} />
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {matching.length > shown.length && (
          <p className="text-xs text-muted">
            {t("st4_vc_showing").replace("{n}", String(shown.length)).replace("{total}", String(matching.length))}
          </p>
        )}
      </Panel>

      {/* with your mentor: talk through the list */}
      <Panel title={t("st4_vc_talkTitle")} sub={t("st4_vc_talkSub")}>
        {shaky.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label={t("st4_vc_talkTick")}>
            {shaky.slice(0, 16).map((w) => {
              const on = state.covered.includes(w.id);
              return (
                <button
                  key={w.id}
                  type="button"
                  lang={lang}
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      covered: on ? s.covered.filter((id) => id !== w.id) : [...s.covered, w.id],
                    }))
                  }
                  aria-pressed={on}
                  className={`pill min-h-10 max-w-full px-3 py-2 text-xs font-bold ${
                    on ? "bg-mint text-canvas" : "bg-white/6 text-ink"
                  }`}
                >
                  {on && <Check size={12} strokeWidth={3} aria-hidden />}
                  <span className="truncate">{w.text}</span>
                </button>
              );
            })}
          </div>
        )}
        {voicePicker}
        <RecordPanel
          lang={lang}
          phase={phase.id}
          activityId={activity.id}
          kind="word"
          speaker="both"
          confidential
          showConsent
          tags={[TALK_TAG, ...voiceTags]}
          accent={phase.color}
          defaultTitle={`${t("st4_vc_talkName")} · ${new Date().toLocaleDateString(uiLang)}`}
          label={t("st4_vc_talkRecord")}
          onSaved={() => {
            state.covered.forEach((id) => log.review(id));
            setState((s) => ({ ...s, covered: [] }));
          }}
        />
      </Panel>

      <RecordingList
        filter={{ activityId: activity.id, lang, kind: "word" }}
        accent={phase.color}
        allowWords={false}
        title={t("st4_vc_setTitle")}
        emptyText={t("st4_vc_setEmpty")}
      />

      <FinishBar timer={timer} accent={phase.color} />
    </div>
  );
}
